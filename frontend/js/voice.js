// 음성 인식 담당. 브라우저 Web Speech API 사용 (Chrome 권장)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export const voiceSupported = Boolean(SpeechRecognition);

export function listenOnce() {
  return new Promise((resolve, reject) => {
    if (!SpeechRecognition) return reject(new Error("이 브라우저는 음성 인식을 지원하지 않습니다"));
    const rec = new SpeechRecognition();
    rec.lang = "ko-KR";
    rec.interimResults = false;
    rec.onresult = (e) => resolve(e.results[0][0].transcript);
    rec.onerror = (e) => reject(new Error(e.error));
    rec.start();
  });
}

// 말하기가 끝나면 resolve 되는 Promise를 돌려준다
export function speak(text) {
  if (!text) return Promise.resolve();
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ko-KR";
  return new Promise((resolve) => {
    u.onend = u.onerror = () => resolve();
    speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  speechSynthesis.cancel();
}
