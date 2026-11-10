
const API_URL = "tasks";

let tasks = [];
let currentFilter = "all";

const taskList = document.getElementById("taskList");
const modal = document.getElementById("modal");
const taskForm = document.getElementById("taskForm");
const subjectFilter = document.getElementById("subjectFilter");

// API HELPER
async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Request failed: ${response.status}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// LOAD TASKS FROM MYSQL
async function loadTasks() {
  try {
    tasks = await apiRequest(API_URL);
    renderTasks();
  } catch (error) {
    console.error("Unable to load tasks:", error);
    alert("Unable to load tasks. Please check whether Tomcat is running.");
  }
}

// HELPER FUNCTIONS
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
  if (!dateString) return "No deadline";

  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function isComplete(task) {
  return task.written && task.uploaded;
}

function isOverdue(task) {
  return !isComplete(task) &&
    Boolean(task.deadline) &&
    task.deadline < todayString();
}

function getStatus(task) {
  if (isComplete(task)) return "Completed";
  if (isOverdue(task)) return "Overdue";
  if (task.written && !task.uploaded) return "Upload pending";
  if (!task.written && task.uploaded) return "Write-up pending";
  if (task.deadline === todayString()) return "Due today";

  return "Pending";
}

function getStatusClass(task) {
  if (isComplete(task)) return "done";
  if (isOverdue(task)) return "overdue";
  if (task.written && !task.uploaded) return "upcoming";

  return "pending";
}

// SUBJECT FILTER
function updateSubjectFilter() {
  const previous = subjectFilter.value || "all";

  const subjects = [...new Set(tasks.map(task => task.subject))]
    .sort((a, b) => a.localeCompare(b));

  subjectFilter.innerHTML =
    '<option value="all">All subjects</option>' +
    subjects.map(subject =>
      `<option value="${escapeHTML(subject)}">${escapeHTML(subject)}</option>`
    ).join("");

  subjectFilter.value = subjects.includes(previous) ? previous : "all";
}

// STATISTICS
function renderStats() {
  const total = tasks.length;
  const written = tasks.filter(task => task.written).length;
  const uploaded = tasks.filter(task => task.uploaded).length;
  const completed = tasks.filter(isComplete).length;
  const pending = total - completed;
  const percent = total ? Math.round(completed / total * 100) : 0;

  document.getElementById("totalCount").textContent = total;
  document.getElementById("writtenCount").textContent = written;
  document.getElementById("uploadedCount").textContent = uploaded;
  document.getElementById("pendingCount").textContent = pending;
  document.getElementById("progressPercent").textContent = `${percent}%`;
  document.getElementById("progressFill").style.width = `${percent}%`;
}

// DISPLAY TASKS
function renderTasks() {
  updateSubjectFilter();
  renderStats();

  const selectedSubject = subjectFilter.value;

  const filtered = tasks.filter(task => {
    const matchesSubject =
      selectedSubject === "all" || task.subject === selectedSubject;

    const matchesStatus =
      currentFilter === "all" ||
      (currentFilter === "pending" && !isComplete(task)) ||
      (currentFilter === "completed" && isComplete(task));

    return matchesSubject && matchesStatus;
  });

  document.getElementById("taskSubtitle").textContent =
    currentFilter === "pending"
      ? "Here is the work you still need to finish."
      : currentFilter === "completed"
      ? "Everything you've finished."
      : "All your assignments in one place.";

  document.getElementById("emptyState").hidden = filtered.length !== 0;

  taskList.innerHTML = filtered.map(task => `
    <tr>
      <td>
        <div class="task-name">${escapeHTML(task.title)}</div>
        <div class="task-subject">${escapeHTML(task.subject)} · ${escapeHTML(task.type)}</div>
      </td>

      <td>
        <input type="checkbox"
          aria-label="Written: ${escapeHTML(task.title)}"
          data-id="${task.id}"
          data-field="written"
          ${task.written ? "checked" : ""}>
      </td>

      <td>
        <input type="checkbox"
          aria-label="Uploaded: ${escapeHTML(task.title)}"
          data-id="${task.id}"
          data-field="uploaded"
          ${task.uploaded ? "checked" : ""}>
      </td>

      <td>${formatDate(task.deadline)}</td>

      <td>
        <span class="status ${getStatusClass(task)}">
          ${getStatus(task)}
        </span>
      </td>

      <td>
        <button class="delete-btn"
          data-delete="${task.id}"
          aria-label="Delete ${escapeHTML(task.title)}"
          title="Delete task">×</button>
      </td>
    </tr>
  `).join("");
}

// MODAL
function openModal() {
  modal.hidden = false;
  document.getElementById("taskTitle").focus();
}

function closeModal() {
  modal.hidden = true;
  taskForm.reset();
}

document.getElementById("showForm").addEventListener("click", openModal);
document.getElementById("closeForm").addEventListener("click", closeModal);
document.getElementById("cancelForm").addEventListener("click", closeModal);

modal.addEventListener("click", event => {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeModal();
});

// ADD TASK: SAVE TO MYSQL
taskForm.addEventListener("submit", async event => {
  event.preventDefault();

  const title = document.getElementById("taskTitle").value.trim();
  const subject = document.getElementById("taskSubject").value.trim();
  const type = document.getElementById("taskType").value;
  const deadline = document.getElementById("taskDeadline").value;

  if (!title || !subject || !deadline) return;

  try {
    await apiRequest(API_URL, {
      method: "POST",
      body: JSON.stringify({
        title,
        subject,
        type,
        deadline
      })
    });

    closeModal();
    await loadTasks();

  } catch (error) {
    console.error("Unable to add task:", error);
    alert("Unable to add task. Please try again.");
  }
});

// UPDATE CHECKBOX: SAVE TO MYSQL
taskList.addEventListener("change", async event => {
  const checkbox = event.target;

  if (!checkbox.matches('input[type="checkbox"][data-field]')) return;

  const id = Number(checkbox.dataset.id);
  const field = checkbox.dataset.field;
  const task = tasks.find(item => item.id === id);

  if (!task || !["written", "uploaded"].includes(field)) return;

  const oldValue = task[field];
  const newValue = checkbox.checked;

  task[field] = newValue;
  renderTasks();

  try {
    await apiRequest(API_URL, {
      method: "PUT",
      body: JSON.stringify({
        id,
        field,
        value: newValue
      })
    });

  } catch (error) {
    task[field] = oldValue;
    renderTasks();

    console.error("Unable to update task:", error);
    alert("Unable to update task. Please try again.");
  }
});

// DELETE TASK: REMOVE FROM MYSQL
taskList.addEventListener("click", async event => {
  const button = event.target.closest("[data-delete]");

  if (!button) return;

  const id = Number(button.dataset.delete);

  if (!confirm("Are you sure you want to delete this task?")) return;

  try {
    await apiRequest(`${API_URL}?id=${id}`, {
      method: "DELETE"
    });

    await loadTasks();

  } catch (error) {
    console.error("Unable to delete task:", error);
    alert("Unable to delete task. Please try again.");
  }
});

// NAVIGATION FILTERS
document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;

    document.querySelectorAll(".nav-item").forEach(item => {
      item.classList.toggle("active", item === button);
    });

    renderTasks();
  });
});

subjectFilter.addEventListener("change", renderTasks);

// TODAY'S DATE
document.getElementById("today").textContent =
  new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  });

// INITIAL LOAD
loadTasks();
