// 백엔드 API 호출 모음. 경로와 형식은 docs/event-schema.md 와 http://localhost:8000/docs 참고
async function request(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} 실패: ${res.status}`);
  return res.json();
}

export const api = {
  sendEvent: (event_type, source, payload = {}) => request("POST", "/events", { event_type, source, payload }),
  listEvents: (limit = 20) => request("GET", `/events?limit=${limit}`),
  listTodos: () => request("GET", "/todos"),
  addTodo: (title) => request("POST", "/todos", { title }),
  setTodoDone: (id, done) => request("PATCH", `/todos/${id}`, { done }),
  command: (text) => request("POST", "/assistant/command", { text }),
  hourly: () => request("GET", "/stats/hourly"),
  recommendations: () => request("GET", "/recommendations"),
};
