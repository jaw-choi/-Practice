// 포인팅 데모: 손 관절만 보고 화면을 가리키고, 집기로 선택하고, 호출어로 음성 명령을 받는다.
import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";
import { api } from "./api.js";
import { HAND_CONNECTIONS, POSE_LABEL, classifyPose, toScreen, userHand } from "./hands.js";
import { speak, stopSpeaking } from "./voice.js";
import { createWakeWordListener } from "./wake-word.js";

const WAKE_WORDS = ["자비스"];   // 호출어. 인식이 잘 되는 2~4글자 단어를 추천
const SMOOTHING = 0.35;           // 커서 흔들림 보정 (0~1, 작을수록 부드럽고 느림)
const PINCH_FRAMES = 3;           // 집기가 이만큼 연속돼야 선택
const RELEASE_FRAMES = 3;         // 손을 뗐다고 보는 연속 프레임

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const COLORS = { left: "#f59e0b", right: "#38bdf8" };
const NAMES = { left: "왼손", right: "오른손" };

const $ = (id) => document.getElementById(id);
const stage = $("stage");
const canvas = $("hand-canvas");
const ctx = canvas.getContext("2d");

const hands = {
  left: { cursor: null, pose: "none", pinchCount: 0, releaseCount: 0, pinched: false, hover: null },
  right: { cursor: null, pose: "none", pinchCount: 0, releaseCount: 0, pinched: false, hover: null },
};

function log(text) {
  const li = document.createElement("li");
  li.textContent = `${new Date().toLocaleTimeString()} ${text}`;
  $("log").prepend(li);
}

// ---------- 왼쪽 패널: 손 관절 그리기 ----------
function drawHands(results) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  results.forEach(({ side, lm, pose }) => {
    const p = (i) => [(1 - lm[i].x) * canvas.width, lm[i].y * canvas.height]; // 거울 모드
    ctx.strokeStyle = COLORS[side];
    ctx.lineWidth = 2;
    for (const [a, b] of HAND_CONNECTIONS) {
      ctx.beginPath(); ctx.moveTo(...p(a)); ctx.lineTo(...p(b)); ctx.stroke();
    }
    lm.forEach((_, i) => {
      const big = i === 4 || i === 8;
      ctx.fillStyle = big ? "#fff" : COLORS[side];
      ctx.beginPath(); ctx.arc(...p(i), big ? 5 : 3, 0, Math.PI * 2); ctx.fill();
    });
    if (pose === "pinch") {
      ctx.strokeStyle = "#22c55e"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(...p(4)); ctx.lineTo(...p(8)); ctx.stroke();
    }
  });
}

function updateCard(side) {
  const h = hands[side];
  $(`pose-${side}`).textContent = POSE_LABEL[h.pose];
  $(`card-${side}`).classList.toggle("active", h.pose === "point" || h.pose === "pinch");
}

// ---------- 오른쪽 화면: 커서, 선택 ----------
function tileAt(cursor) {
  const r = stage.getBoundingClientRect();
  const el = document.elementFromPoint(r.left + cursor.x * r.width, r.top + cursor.y * r.height);
  return el?.closest(".tile") ?? null;
}

function moveCursor(side) {
  const h = hands[side];
  const el = $(`cursor-${side}`);
  const visible = h.cursor && (h.pose === "point" || h.pose === "pinch");
  el.style.display = visible ? "block" : "none";
  el.classList.toggle("pinch", h.pose === "pinch");

  const tile = visible ? tileAt(h.cursor) : null;
  if (h.hover !== tile) {
    h.hover?.classList.remove(`hover-${side}`);
    tile?.classList.add(`hover-${side}`);
    h.hover = tile;
  }
  if (visible) {
    el.style.left = `${h.cursor.x * 100}%`;
    el.style.top = `${h.cursor.y * 100}%`;
  }
}

async function select(side) {
  const h = hands[side];
  const tile = h.hover;
  if (!tile) return;
  const name = tile.querySelector("span").textContent;
  tile.classList.add("selected");
  setTimeout(() => tile.classList.remove("selected"), 600);
  log(`${NAMES[side]}으로 "${name}" 선택`);

  api.sendEvent("pointing_detected", "vision", {
    action: "select", hand: side, target: name,
    x: Number(h.cursor.x.toFixed(3)), y: Number(h.cursor.y.toFixed(3)),
  }).catch(() => {});
  if (tile.dataset.command) await runCommand(tile.dataset.command);
}

function updateHand(side, lm) {
  const h = hands[side];
  const pose = lm ? classifyPose(lm) : "none";
  h.pose = pose;

  // 가리키는 동안만 커서를 움직인다. 집는 순간 커서가 흔들리지 않도록 고정
  if (pose === "point") {
    const target = toScreen(lm[8]);
    h.cursor = h.cursor
      ? { x: h.cursor.x + (target.x - h.cursor.x) * SMOOTHING, y: h.cursor.y + (target.y - h.cursor.y) * SMOOTHING }
      : target;
  }
  if (pose === "none") h.cursor = null;

  // 집기 → 선택 (손을 떼야 다시 선택 가능)
  if (pose === "pinch") {
    h.pinchCount++; h.releaseCount = 0;
    if (!h.pinched && h.pinchCount >= PINCH_FRAMES) { h.pinched = true; select(side); }
  } else {
    h.releaseCount++; h.pinchCount = 0;
    if (h.releaseCount >= RELEASE_FRAMES) h.pinched = false;
  }

  if (pose === "open") stopSpeaking();
  updateCard(side);
  moveCursor(side);
}

// ---------- 음성 ----------
let listener = null;

async function runCommand(text) {
  $("transcript").textContent = `🗣 ${text}`;
  try {
    const res = await api.command(text);
    if (res.action === "stop") { stopSpeaking(); return; }
    $("reply").textContent = res.reply;
    listener?.setMuted(true);           // 비서 목소리를 명령으로 듣지 않게
    await speak(res.reply);
  } catch (e) {
    $("reply").textContent = `오류: ${e.message}`;
  } finally {
    listener?.setMuted(false);
  }
}

const VOICE_LABEL = { off: "음성 꺼짐", standby: "대기 중 (호출어를 기다림)", active: "듣는 중... 명령을 말하세요" };

function startVoice() {
  $("wake-name").textContent = WAKE_WORDS[0];
  try {
    listener = createWakeWordListener({
      wakeWords: WAKE_WORDS,
      onState: (s) => {
        $("voice-state").textContent = VOICE_LABEL[s];
        $("voice-state").className = `voice-state ${s}`;
        if (s === "active") log("호출어 감지, 활성화");
      },
      onTranscript: (text) => { $("transcript").textContent = text; },
      onCommand: runCommand,
    });
    listener.start();
  } catch (e) {
    $("voice-state").textContent = e.message;
  }
}

// ---------- 카메라 ----------
async function startCamera() {
  const video = $("video");
  video.srcObject = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
  await new Promise((r) => (video.onloadeddata = r));

  const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
  const landmarker = await HandLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
    runningMode: "VIDEO",
    numHands: 2,
  });

  let lastTime = -1;
  function loop() {
    if (video.readyState >= 2 && video.currentTime !== lastTime) {
      lastTime = video.currentTime;
      const result = landmarker.detectForVideo(video, performance.now());
      const seen = { left: null, right: null };
      const drawn = [];
      result.landmarks.forEach((lm, i) => {
        const side = userHand(result.handedness[i][0].categoryName);
        if (seen[side]) return;          // 같은 손이 두 번 잡히면 첫 번째만 사용
        seen[side] = lm;
        drawn.push({ side, lm, pose: classifyPose(lm) });
      });
      updateHand("left", seen.left);
      updateHand("right", seen.right);
      drawHands(drawn);
    }
    requestAnimationFrame(loop);
  }
  loop();
}

$("start-btn").onclick = async () => {
  $("start-btn").disabled = true;
  $("status").textContent = "카메라와 손 인식 모델을 불러오는 중...";
  startVoice();
  try {
    await startCamera();
    $("status").textContent = "동작 중";
    $("start-btn").style.display = "none";
  } catch (e) {
    $("status").textContent = `카메라 오류: ${e.message}`;
    $("start-btn").disabled = false;
  }
};
