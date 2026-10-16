// 전체 연결. 각 모듈의 결과를 서버와 화면으로 이어준다.
import { api } from "./api.js";
import { renderAll } from "./dashboard.js";
import { startVision } from "./vision.js";
import { listenOnce, speak, stopSpeaking, voiceSupported } from "./voice.js";

const $ = (id) => document.getElementById(id);
const setStatus = (text) => ($("status").textContent = text);

function addChat(text, who) {
  const p = document.createElement("p");
  p.className = who;
  p.textContent = text;
  $("chat").prepend(p);
}

async function handleCommand(text) {
  addChat(text, "me");
  const res = await api.command(text);
  if (res.action === "stop") stopSpeaking();
  if (res.reply) { addChat(res.reply, "bot"); speak(res.reply); }
  renderAll();
}

// 카메라
$("camera-btn").onclick = async () => {
  $("camera-btn").disabled = true;
  setStatus("카메라와 모델 불러오는 중...");
  try {
    await startVision($("video"), {
      onResult: ({ label, pointing }) => {
        $("gesture-label").textContent = label ?? "인식 결과 없음";
        const dot = $("pointer");
        dot.style.display = pointing ? "block" : "none";
        if (pointing) { dot.style.left = `${pointing.x * 100}%`; dot.style.top = `${pointing.y * 100}%`; }
      },
      onEvent: async (eventType, payload) => {
        if (payload.gesture === "Open_Palm") stopSpeaking();           // 손바닥: 정지
        if (payload.gesture === "Victory") speak("안녕하세요. 오늘 할 일을 알려드릴까요?");
        await api.sendEvent(eventType, "vision", payload);
        renderAll();
      },
    });
    setStatus("카메라 동작 중");
  } catch (e) {
    setStatus(`카메라 오류: ${e.message}`);
    $("camera-btn").disabled = false;
  }
};

// 음성
$("mic-btn").disabled = !voiceSupported;
$("mic-btn").onclick = async () => {
  setStatus("듣는 중...");
  try { await handleCommand(await listenOnce()); setStatus("대기 중"); }
  catch (e) { setStatus(`음성 오류: ${e.message}`); }
};
$("text-form").onsubmit = (e) => {
  e.preventDefault();
  const text = $("text-input").value.trim();
  if (text) handleCommand(text);
  $("text-input").value = "";
};

// 작업 시작 (추천 학습용 기록)
$("task-start-btn").onclick = async () => {
  await api.sendEvent("task_started", "ui", {});
  renderAll();
};

renderAll();
setInterval(renderAll, 5000);
