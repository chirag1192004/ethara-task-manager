const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const API_BASE = isLocalhost ? "http://127.0.0.1:8000" : "/api";

function getHeaders() {
  const headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    let errorMessage = "Something went wrong";
    if (typeof data.detail === "string") {
      errorMessage = data.detail;
    } else if (Array.isArray(data.detail)) {
      errorMessage = data.detail.map((e) => e.msg).join(", ");
    }
    throw new Error(errorMessage);
  }
  return data;
}

export async function loginUser(email, password) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  });
  return handleResponse(response);
}

export async function signupUser(name, email, password, role) {
  const response = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role }),
  });
  return handleResponse(response);
}

export async function fetchProjects() {
  const response = await fetch(`${API_BASE}/projects`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
}

export async function createProject(title, description) {
  const response = await fetch(`${API_BASE}/projects`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ title, description }),
  });
  return handleResponse(response);
}

export async function createTask(projectId, title, dueDate, assigneeIds) {
  const response = await fetch(`${API_BASE}/projects/${projectId}/tasks`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ title, due_date: dueDate, assignee_ids: assigneeIds }),
  });
  return handleResponse(response);
}

export async function updateTaskStatus(taskId, newStatus) {
  const response = await fetch(`${API_BASE}/tasks/${taskId}/status`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ status: newStatus }),
  });
  return handleResponse(response);
}

export async function reviewTask(taskId, performance) {
  const response = await fetch(`${API_BASE}/tasks/${taskId}/review`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ performance }),
  });
  return handleResponse(response);
}

export async function fetchUsers() {
  const response = await fetch(`${API_BASE}/users`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
}

export async function fetchPendingUsers() {
  const response = await fetch(`${API_BASE}/admin/pending`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
}

export async function verifyAdmin(userId) {
  const response = await fetch(`${API_BASE}/admin/verify/${userId}`, {
    method: "PATCH",
    headers: getHeaders(),
  });
  return handleResponse(response);
}

export async function fetchMyProfile() {
  const response = await fetch(`${API_BASE}/users/me`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
}


export async function fetchMyTasks() {
  const response = await fetch(`${API_BASE}/tasks/me`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
}
