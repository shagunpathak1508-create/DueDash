
const STORAGE_KEY = "ticktask-tasks-v1";

const sampleTasks = [
  {
    id: 1,
    title: "Experiment 1 - Java Fundamentals",
    subject: "Full Stack Java Programming",
    type: "Experiment",
    deadline: "2026-10-25",
    written: true,
    uploaded: true
  },
  {
    id: 2,
    title: "Experiment 2 - Classes and Objects",
    subject: "Full Stack Java Programming",
    type: "Experiment",
    deadline: "2026-10-27",
    written: true,
    uploaded: false
  },
  {
    id: 3,
    title: "Assignment 1 - Graph Theory",
    subject: "Discrete Structures",
    type: "Assignment",
    deadline: "2026-10-29",
    written: false,
    uploaded: false
  },
  {
    id: 4,
    title: "Experiment 3 - SQL Queries",
    subject: "Database Systems",
    type: "Experiment",
    deadline: "2026-11-02",
    written: false,
    uploaded: false
  }
];

let tasks = loadTasks();
let currentFilter = "all";

const taskList = document.getElementById("taskList");
const modal = document.getElementById("modal");
const taskForm = document.getElementById("taskForm");
const subjectFilter = document.getElementById("subjectFilter");

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === null ? sampleTasks : JSON.parse(saved);
  } catch {
    return sampleTasks;
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
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
        <input type="checkbox" aria-label="Written: ${escapeHTML(task.title)}"
          data-id="${task.id}" data-field="written"
          ${task.written ? "checked" : ""}>
      </td>
      <td>
        <input type="checkbox" aria-label="Uploaded: ${escapeHTML(task.title)}"
          data-id="${task.id}" data-field="uploaded"
          ${task.uploaded ? "checked" : ""}>
      </td>
      <td>${formatDate(task.deadline)}</td>
      <td><span class="status ${getStatusClass(task)}">${getStatus(task)}</span></td>
      <td>
        <button class="delete-btn" data-delete="${task.id}"
          aria-label="Delete ${escapeHTML(task.title)}" title="Delete task">×</button>
      </td>
    </tr>
  `).join("");
}

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

taskForm.addEventListener("submit", event => {
  event.preventDefault();

  const title = document.getElementById("taskTitle").value.trim();
  const subject = document.getElementById("taskSubject").value.trim();
  const type = document.getElementById("taskType").value;
  const deadline = document.getElementById("taskDeadline").value;

  if (!title || !subject || !deadline) return;

  tasks.push({
    id: Date.now(),
    title,
    subject,
    type,
    deadline,
    written: false,
    uploaded: false
  });

  saveTasks();
  closeModal();
  renderTasks();
});

taskList.addEventListener("change", event => {
  const checkbox = event.target;

  if (!checkbox.matches('input[type="checkbox"][data-field]')) return;

  const id = Number(checkbox.dataset.id);
  const field = checkbox.dataset.field;
  const task = tasks.find(item => item.id === id);

  if (!task || !["written", "uploaded"].includes(field)) return;

  task[field] = checkbox.checked;
  saveTasks();
  renderTasks();
});

taskList.addEventListener("click", event => {
  const button = event.target.closest("[data-delete]");
  if (!button) return;

  const id = Number(button.dataset.delete);
  tasks = tasks.filter(task => task.id !== id);

  saveTasks();
  renderTasks();
});

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

document.getElementById("today").textContent =
  new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  });

renderTasks();
