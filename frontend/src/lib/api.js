const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getPersonas: () => fetch(`${BASE_URL}/api/personas`).then(handle),

  loadDemo: () =>
    fetch(`${BASE_URL}/api/demo`, { method: "POST" }).then(handle),

  uploadScan: (file) => {
    const form = new FormData();
    form.append("file", file);
    return fetch(`${BASE_URL}/api/upload`, { method: "POST", body: form }).then(
      handle,
    );
  },

  getGraph: (sessionId) =>
    fetch(`${BASE_URL}/api/graph/${sessionId}`).then(handle),

  simulate: (sessionId, startNode, persona = "red") =>
    fetch(`${BASE_URL}/api/simulate/${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start_node: startNode, persona }),
    }).then(handle),

  scenario: (sessionId, action, params) =>
    fetch(`${BASE_URL}/api/scenario/${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, params }),
    }).then(handle),

  ask: (sessionId, question, persona = "red") =>
    fetch(`${BASE_URL}/api/ask/${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, persona }),
    }).then(handle),
};
