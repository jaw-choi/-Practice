// 호출어 감지. 계속 듣고 있다가 호출어가 들리면 활성화되어 다음 명령을 받는다. 음성 인식 담당.
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// "자비스" → /자\s*비\s*스/ : 인식 결과에 띄어쓰기가 섞여도 찾는다
export function wakeRegex(words) {
  const parts = words.map((w) => [...w.replace(/\s/g, "")].join("\\s*"));
  return new RegExp(parts.join("|"));
}

// 호출어 뒤에 이어 말한 내용. 예: "자비스, 할 일 알려줘" → "할 일 알려줘"
export function splitWake(text, regex) {
  const m = text.match(regex);
  if (!m) return null;
  return text.slice(m.index + m[0].length).replace(/^[\s,.!?~]+/, "").trim();
}

export function createWakeWordListener({ wakeWords, activeMs = 8000, onState, onTranscript, onCommand }) {
  if (!SpeechRecognition) throw new Error("이 브라우저는 음성 인식을 지원하지 않습니다 (Chrome 권장)");

  const regex = wakeRegex(wakeWords);
  const rec = new SpeechRecognition();
  rec.lang = "ko-KR";
  rec.continuous = true;
  rec.interimResults = true;

  let state = "off";   // off | standby | active
  let running = false;
  let muted = false;   // 비서가 말하는 동안 자기 목소리를 듣지 않게
  let timer = null;

  const setState = (s) => { state = s; onState(s); };

  function activate() {
    setState("active");
    clearTimeout(timer);
    timer = setTimeout(() => setState("standby"), activeMs);
  }

  async function runCommand(text) {
    clearTimeout(timer);
    setState("standby");
    await onCommand(text);
  }

  rec.onresult = (e) => {
    if (muted) return;
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const text = e.results[i][0].transcript.trim();
      const final = e.results[i].isFinal;
      onTranscript(text, final);
      if (!final) {
        if (state === "standby" && regex.test(text)) activate(); // 말 끝나기 전에 바로 반응
        continue;
      }
      const rest = splitWake(text, regex);
      if (rest !== null) {                       // 호출어가 들어 있음
        if (rest.length > 1) runCommand(rest);   // "자비스 할 일 알려줘" 한 번에
        else activate();
      } else if (state === "active" && text) {
        runCommand(text);
      }
    }
  };

  rec.onerror = (e) => {
    if (e.error === "not-allowed" || e.error === "service-not-allowed") {
      running = false;
      setState("off");
    }
  };

  // Chrome은 연속 인식을 일정 시간 뒤 스스로 끊으므로 다시 시작한다
  rec.onend = () => { if (running) setTimeout(() => { try { rec.start(); } catch {} }, 200); };

  return {
    start() { running = true; rec.start(); setState("standby"); },
    stop() { running = false; rec.stop(); setState("off"); },
    setMuted(v) { muted = v; },
    get state() { return state; },
  };
}
