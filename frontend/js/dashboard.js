// 프론트 대시보드 담당. 서버 데이터를 화면에 그린다.
import { api } from "./api.js";

const $ = (id) => document.getElementById(id);

export async function renderTodos() {
  const todos = await api.listTodos();
  $("todo-list").innerHTML = "";
  for (const t of todos) {
    const li = document.createElement("li");
    li.textContent = t.title;
    if (t.done) li.className = "done";
    else li.onclick = async () => { await api.setTodoDone(t.id, true); renderTodos(); };
    $("todo-list").appendChild(li);
  }
}

export async function renderEvents() {
  const events = await api.listEvents(20);
  $("event-log").innerHTML = events
    .map((e) => `<li>${new Date(e.occurred_at + (e.occurred_at.endsWith("Z") ? "" : "Z")).toLocaleTimeString()} · ${e.event_type} · ${JSON.stringify(e.payload)}</li>`)
    .join("");
}

export async function renderHourly() {
  const data = await api.hourly();
  const max = Math.max(1, ...data.map((d) => d.count));
  $("hourly-chart").innerHTML = data
    .map((d) => `<div class="bar" title="${d.hour}시: ${d.count}건" style="height:${(d.count / max) * 100}%"></div>`)
    .join("");
}

export async function renderRecommendations() {
  const recs = await api.recommendations();
  $("recommendations").innerHTML = recs.map((r) => `<div class="rec">💡 ${r.message}</div>`).join("");
}

export function renderAll() {
  return Promise.all([renderTodos(), renderEvents(), renderHourly(), renderRecommendations()]);
}
