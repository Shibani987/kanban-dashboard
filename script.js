const board = document.getElementById("board");
const addTaskBtn = document.getElementById("addTaskBtn");
const searchInput = document.getElementById("searchInput");
const taskDialog = document.getElementById("taskDialog");
const taskForm = document.getElementById("taskForm");
const closeDialogBtn = document.getElementById("closeDialogBtn");
const cancelBtn = document.getElementById("cancelBtn");
const deleteTaskBtn = document.getElementById("deleteTaskBtn");
const dialogTitle = document.getElementById("dialogTitle");

const fields = {
  id: document.getElementById("taskId"),
  title: document.getElementById("taskTitle"),
  description: document.getElementById("taskDescription"),
  status: document.getElementById("taskStatus"),
  priority: document.getElementById("taskPriority"),
  owner: document.getElementById("taskOwner"),
  dueDate: document.getElementById("taskDueDate")
};

const columns = [
  { id: "todo", title: "To Do", color: "#647086" },
  { id: "progress", title: "In Progress", color: "#2563eb" },
  { id: "review", title: "Review", color: "#b76b00" },
  { id: "done", title: "Done", color: "#16845f" }
];

const starterTasks = [
  {
    id: "task-1",
    title: "Create board layout",
    description: "Set up responsive columns, cards, and project summary metrics.",
    status: "done",
    priority: "High",
    owner: "Maya",
    dueDate: "2026-07-08"
  },
  {
    id: "task-2",
    title: "Add task editing",
    description: "Support creating, updating, deleting, and saving cards locally.",
    status: "progress",
    priority: "Medium",
    owner: "Rohan",
    dueDate: "2026-07-12"
  },
  {
    id: "task-3",
    title: "Review mobile spacing",
    description: "Make sure the board is comfortable on tablet and phone screens.",
    status: "review",
    priority: "Low",
    owner: "Anika",
    dueDate: "2026-07-15"
  },
  {
    id: "task-4",
    title: "Write launch checklist",
    description: "List the final steps before sharing the board with the team.",
    status: "todo",
    priority: "Medium",
    owner: "Dev",
    dueDate: ""
  }
];

let tasks = loadTasks();
let draggedTaskId = null;

function loadTasks() {
  const savedTasks = localStorage.getItem("kanbanTasks");
  return savedTasks ? JSON.parse(savedTasks) : starterTasks;
}

function saveTasks() {
  localStorage.setItem("kanbanTasks", JSON.stringify(tasks));
}

function renderBoard() {
  const term = searchInput.value.trim().toLowerCase();

  board.innerHTML = columns.map((column) => {
    const columnTasks = tasks.filter((task) => {
      const matchesColumn = task.status === column.id;
      const searchable = `${task.title} ${task.description} ${task.owner} ${task.priority}`.toLowerCase();
      return matchesColumn && searchable.includes(term);
    });

    const cards = columnTasks.length
      ? columnTasks.map(createTaskCard).join("")
      : `<div class="empty-state">Drop tasks here</div>`;

    return `
      <article class="column" data-status="${column.id}">
        <div class="column-header">
          <div class="column-title">
            <span class="status-dot" style="background:${column.color}"></span>
            <h2>${column.title}</h2>
          </div>
          <span class="count-pill">${columnTasks.length}</span>
        </div>
        <div class="task-list" data-status="${column.id}">
          ${cards}
        </div>
      </article>
    `;
  }).join("");

  attachCardEvents();
  attachDropEvents();
  updateMetrics();
}

function createTaskCard(task) {
  const dueText = task.dueDate ? formatDate(task.dueDate) : "No due date";
  const ownerText = task.owner ? task.owner : "Unassigned";
  const description = task.description ? `<p>${escapeHtml(task.description)}</p>` : "";

  return `
    <article class="task-card" draggable="true" data-id="${task.id}">
      <div>
        <h3>${escapeHtml(task.title)}</h3>
        ${description}
      </div>
      <div class="task-meta">
        <span class="badge priority-${task.priority.toLowerCase()}">${task.priority}</span>
        <span class="badge">${escapeHtml(ownerText)}</span>
      </div>
      <div class="card-footer">
        <span class="badge">${dueText}</span>
        <div class="card-actions">
          <button type="button" data-action="edit" aria-label="Edit task">E</button>
          <button type="button" data-action="delete" aria-label="Delete task">D</button>
        </div>
      </div>
    </article>
  `;
}

function attachCardEvents() {
  document.querySelectorAll(".task-card").forEach((card) => {
    card.addEventListener("dragstart", () => {
      draggedTaskId = card.dataset.id;
      card.classList.add("dragging");
    });

    card.addEventListener("dragend", () => {
      draggedTaskId = null;
      card.classList.remove("dragging");
    });

    card.addEventListener("click", (event) => {
      const action = event.target.dataset.action;
      if (action === "edit") {
        openTaskDialog(card.dataset.id);
      }

      if (action === "delete") {
        removeTask(card.dataset.id);
      }
    });
  });
}

function attachDropEvents() {
  document.querySelectorAll(".column").forEach((column) => {
    column.addEventListener("dragover", (event) => {
      event.preventDefault();
      column.classList.add("drag-over");
    });

    column.addEventListener("dragleave", () => {
      column.classList.remove("drag-over");
    });

    column.addEventListener("drop", () => {
      const status = column.dataset.status;
      const task = tasks.find((item) => item.id === draggedTaskId);

      if (task) {
        task.status = status;
        saveTasks();
        renderBoard();
      }
    });
  });
}

function updateMetrics() {
  const total = tasks.length;
  const progress = tasks.filter((task) => task.status === "progress").length;
  const done = tasks.filter((task) => task.status === "done").length;
  const high = tasks.filter((task) => task.priority === "High").length;

  document.getElementById("totalTasks").textContent = total;
  document.getElementById("progressTasks").textContent = total ? `${Math.round((progress / total) * 100)}%` : "0%";
  document.getElementById("doneTasks").textContent = done;
  document.getElementById("urgentTasks").textContent = high;
}

function openTaskDialog(taskId = "") {
  const task = tasks.find((item) => item.id === taskId);
  dialogTitle.textContent = task ? "Edit task" : "Add task";
  deleteTaskBtn.hidden = !task;

  fields.id.value = task ? task.id : "";
  fields.title.value = task ? task.title : "";
  fields.description.value = task ? task.description : "";
  fields.status.value = task ? task.status : "todo";
  fields.priority.value = task ? task.priority : "Medium";
  fields.owner.value = task ? task.owner : "";
  fields.dueDate.value = task ? task.dueDate : "";

  taskDialog.showModal();
  fields.title.focus();
}

function closeTaskDialog() {
  taskDialog.close();
  taskForm.reset();
}

function upsertTask(event) {
  event.preventDefault();

  const id = fields.id.value || `task-${Date.now()}`;
  const nextTask = {
    id,
    title: fields.title.value.trim(),
    description: fields.description.value.trim(),
    status: fields.status.value,
    priority: fields.priority.value,
    owner: fields.owner.value.trim(),
    dueDate: fields.dueDate.value
  };

  const existingIndex = tasks.findIndex((task) => task.id === id);

  if (existingIndex >= 0) {
    tasks[existingIndex] = nextTask;
  } else {
    tasks.unshift(nextTask);
  }

  saveTasks();
  closeTaskDialog();
  renderBoard();
}

function removeTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  saveTasks();
  closeTaskDialog();
  renderBoard();
}

function formatDate(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

addTaskBtn.addEventListener("click", () => openTaskDialog());
closeDialogBtn.addEventListener("click", closeTaskDialog);
cancelBtn.addEventListener("click", closeTaskDialog);
taskForm.addEventListener("submit", upsertTask);
searchInput.addEventListener("input", renderBoard);

deleteTaskBtn.addEventListener("click", () => {
  if (fields.id.value) {
    removeTask(fields.id.value);
  }
});

renderBoard();
