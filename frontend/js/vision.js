// 가리키기 모션 담당. 영상은 브라우저 안에서만 처리하고 결과 이벤트만 서버로 보낸다.
import { FilesetResolver, GestureRecognizer } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";

const STABLE_FRAMES = 8;      // 같은 결과가 이만큼 연속돼야 인정 (오인식 방지)
const COOLDOWN_MS = 2000;     // 같은 이벤트 재전송 대기 시간
const MIN_CONFIDENCE = 0.7;

// 손가락이 펴졌는지: 손끝이 중간 마디보다 손목에서 멀면 펴진 것으로 본다
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const extended = (lm, tip, pip) => dist(lm[tip], lm[0]) > dist(lm[pip], lm[0]);

// 검지만 펴져 있으면 가리키기. 방향은 검지 뿌리(5)에서 끝(8)까지의 벡터
export function detectPointing(lm) {
  const isPointing = extended(lm, 8, 6) && !extended(lm, 12, 10) && !extended(lm, 16, 14) && !extended(lm, 20, 18);
  if (!isPointing) return null;
  const dx = -(lm[8].x - lm[5].x); // 화면이 거울 모드라 좌우를 뒤집는다
  const dy = lm[8].y - lm[5].y;
  const direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
  return { direction, x: 1 - lm[8].x, y: lm[8].y };
}

export async function startVision(video, { onResult, onEvent }) {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  await new Promise((r) => (video.onloadeddata = r));

  const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
  const recognizer = await GestureRecognizer.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
    runningMode: "VIDEO",
    numHands: 1,
  });

  let lastLabel = null, streak = 0;
  const lastSent = {};

  function emit(key, eventType, payload) {
    const now = performance.now();
    if (now - (lastSent[key] ?? 0) < COOLDOWN_MS) return;
    lastSent[key] = now;
    onEvent(eventType, payload);
  }

  function loop() {
    if (video.readyState >= 2) {
      const result = recognizer.recognizeForVideo(video, performance.now());
      const lm = result.landmarks?.[0];
      const top = result.gestures?.[0]?.[0];
      const pointing = lm ? detectPointing(lm) : null;

      let label = null;
      if (pointing) label = `pointing:${pointing.direction}`;
      else if (top && top.categoryName !== "None" && top.score >= MIN_CONFIDENCE) label = top.categoryName;

      streak = label === lastLabel ? streak + 1 : 1;
      lastLabel = label;
      onResult({ label, pointing });

      if (label && streak === STABLE_FRAMES) {
        if (pointing) emit(label, "pointing_detected", pointing);
        else emit(label, "gesture_detected", { gesture: label, confidence: Number(top.score.toFixed(2)) });
      }
    }
    requestAnimationFrame(loop);
  }
  loop();
}
