// 손 관절(랜드마크 21개)로 손 모양을 판정하는 순수 함수 모음. 가리키기 모션 담당.
// 랜드마크 번호: 0 손목, 4 엄지 끝, 5 검지 뿌리, 6 검지 중간, 8 검지 끝, 9 중지 뿌리 ...

export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
];

// 조정 가능한 값 (손 크기 = 손목에서 중지 뿌리까지 거리 기준)
export const PINCH_RATIO = 0.35;       // 엄지 끝과 검지 끝이 이보다 가까우면 집기
export const PINCH_MIN_INDEX = 0.45;   // 주먹을 집기로 오인하지 않도록 검지 끝이 뿌리에서 떨어져 있어야 함

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function fingerStates(lm) {
  const ext = (tip, pip) => dist(lm[tip], lm[0]) > dist(lm[pip], lm[0]);
  return { index: ext(8, 6), middle: ext(12, 10), ring: ext(16, 14), pinky: ext(20, 18) };
}

export function classifyPose(lm) {
  const size = dist(lm[0], lm[9]);
  const pinch = dist(lm[4], lm[8]) < size * PINCH_RATIO && dist(lm[8], lm[5]) > size * PINCH_MIN_INDEX;
  if (pinch) return "pinch";
  const f = fingerStates(lm);
  if (f.index && !f.middle && !f.ring && !f.pinky) return "point";
  if (f.index && f.middle && f.ring && f.pinky) return "open";
  if (!f.index && !f.middle && !f.ring && !f.pinky) return "fist";
  return "other";
}

export const POSE_LABEL = {
  point: "가리키기",
  pinch: "집기 → 선택",
  open: "손바닥 → 정지",
  fist: "주먹",
  other: "기타",
  none: "인식 안 됨",
};

// 카메라 가운데 영역만 화면 전체로 늘려서 손을 크게 움직이지 않아도 되게 한다.
// 화면은 거울처럼 보이도록 좌우를 뒤집는다. 결과는 0~1.
export const ACTIVE_REGION = { x0: 0.15, x1: 0.85, y0: 0.1, y1: 0.75 };

export function toScreen(point, r = ACTIVE_REGION) {
  const clamp = (v) => Math.min(1, Math.max(0, v));
  return {
    x: clamp((1 - point.x - r.x0) / (r.x1 - r.x0)),
    y: clamp((point.y - r.y0) / (r.y1 - r.y0)),
  };
}

// MediaPipe는 입력이 거울 이미지라고 가정하고 왼손 오른손을 붙인다.
// 웹캠 원본은 거울이 아니므로 반대로 바꿔야 사용자 기준이 된다.
export function userHand(label) {
  return label === "Left" ? "right" : "left";
}
