const expenseCategories = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Other"];
const incomeCategories = ["Salary", "Freelance", "Investments", "Other"];

const categoryColors = {
  Food: 1,
  Transport: 2,
  Shopping: 3,
  Bills: 4,
  Entertainment: 5,
  Health: 6,
  Other: 7,
  Salary: 6,
  Freelance: 8,
  Investments: 9
};

//fetching elements
const modal = document.getElementById("transaction-modal");
const modalBackdrop = document.getElementById("modal-backdrop");
const openModalButtons = document.querySelectorAll(".open-modal");
const closeModalBtn = document.getElementById("close-modal-btn");
const cancelBtn = document.getElementById("cancel-btn");

const form = document.getElementById("transaction-form");
const formTitle = document.getElementById("form-title");
const submitBtn = document.getElementById("submit-btn");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const descriptionInput = document.getElementById("description");

const balanceText = document.getElementById("balance");
const incomeText = document.getElementById("total-income");
const expenseText = document.getElementById("total-expense");

const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");
const monthLabel = document.getElementById("month-label");
const monthExpenseText = document.getElementById("month-expense");
const monthIncomeText = document.getElementById("month-income");
const chart = document.getElementById("chart");
const donut = document.getElementById("donut");
const legend = document.getElementById("chart-legend");
const chartEmpty = document.getElementById("chart-empty");
const centerLabel = document.getElementById("donut-center-label");
const centerValue = document.getElementById("donut-center-value");

const searchInput = document.getElementById("search-input");
const typeFilter = document.getElementById("filter-type");
const filterCategory = document.getElementById("filter-category");
const list = document.getElementById("transaction-list");
const countLabel = document.getElementById("count-label");
const emptyState = document.getElementById("empty-state");
const emptyTitle = document.getElementById("empty-title");
const emptyText = document.getElementById("empty-text");

const toast = document.getElementById("toast");
const toastText = document.getElementById("toast-text");
const toastUndo = document.getElementById("toast-undo");


let transactions = [];
let editingId = null;
let selectedMonth = "";
let selectedType = "all";
let monthSpentText = "";
let toastTimer = null;
let undoAction = null;


function saveData() {
  localStorage.setItem("expense-tracker-transactions", JSON.stringify(transactions));
}

function loadData() {
  const saved = localStorage.getItem("expense-tracker-transactions");
  if (saved) {
    transactions = JSON.parse(saved);
  }
}


function formatMoney(amount) {
  const text = Math.abs(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  if (amount < 0) {
    return "-₹" + text;
  }
  return "₹" + text;
}

function makeDateString(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return date.getFullYear() + "-" + month + "-" + day;
}

function getToday() {
  return makeDateString(new Date());
}

function getYesterday() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return makeDateString(date);
}

function formatDay(dateString) {
  if (dateString === getToday()) {
    return "Today";
  }
  if (dateString === getYesterday()) {
    return "Yesterday";
  }
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function getColor(category) {
  const number = categoryColors[category] || 9;
  return "var(--cat-" + number + ")";
}

function addTotal(items, type) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type === type) {
      total = total + items[i].amount;
    }
  }
  return total;
}

function getType() {
  return document.querySelector('input[name="type"]:checked').value;
}

function fillCategories(type, selected) {
  let names = expenseCategories;
  if (type === "income") {
    names = incomeCategories;
  }

  categoryInput.innerHTML = '<option value="">Select category</option>';
  for (let i = 0; i < names.length; i++) {
    const option = document.createElement("option");
    option.value = names[i];
    option.textContent = names[i];
    categoryInput.appendChild(option);
  }
  categoryInput.value = selected;
}

function fillFilterCategories() {
  const names = expenseCategories.slice();
  for (let i = 0; i < incomeCategories.length; i++) {
    if (names.indexOf(incomeCategories[i]) === -1) {
      names.push(incomeCategories[i]);
    }
  }
  for (let i = 0; i < names.length; i++) {
    const option = document.createElement("option");
    option.value = names[i];
    option.textContent = names[i];
    filterCategory.appendChild(option);
  }
}

function openModal() {
  modal.classList.add("open");
  amountInput.focus();
}

function closeModal() {
  modal.classList.remove("open");
  resetForm();
}

function resetForm() {
  form.reset();
  fillCategories("expense", "");
  dateInput.value = getToday();
  editingId = null;
  formTitle.textContent = "Add transaction";
  submitBtn.textContent = "Add transaction";
  clearErrors();
}


function showError(field, message) {
  document.getElementById(field + "-error").textContent = message;
  document.getElementById(field).classList.add("input-error");
}

function clearErrors() {
  const fields = ["amount", "category", "date", "description"];
  for (let i = 0; i < fields.length; i++) {
    document.getElementById(fields[i] + "-error").textContent = "";
    document.getElementById(fields[i]).classList.remove("input-error");
  }
}

function validateForm() {
  clearErrors();
  let valid = true;

  if (amountInput.value === "") {
    showError("amount", "Please enter an amount.");
    valid = false;
  } else if (Number(amountInput.value) <= 0) {
    showError("amount", "Amount must be more than 0.");
    valid = false;
  }

  if (categoryInput.value === "") {
    showError("category", "Please choose a category.");
    valid = false;
  }

  if (dateInput.value === "") {
    showError("date", "Please pick a date.");
    valid = false;
  }

  const description = descriptionInput.value.trim();
  if (description === "") {
    showError("description", "Please add a description.");
    valid = false;
  } else if (description.length > 50) {
    showError("description", "Keep it under 50 characters.");
    valid = false;
  }

  return valid;
}


function handleSubmit(event) {
  event.preventDefault();

  if (validateForm() === false) {
    return;
  }

  const transaction = {
    id: Date.now(),
    type: getType(),
    amount: Number(amountInput.value),
    category: categoryInput.value,
    date: dateInput.value,
    description: descriptionInput.value.trim()
  };

  if (editingId === null) {
    transactions.push(transaction);
  } else {
    for (let i = 0; i < transactions.length; i++) {
      if (transactions[i].id === editingId) {
        transaction.id = editingId;
        transactions[i] = transaction;
      }
    }
  }

  selectedMonth = transaction.date.slice(0, 7);

  saveData();
  showEverything();
  closeModal();
}

function editTransaction(id) {
  for (let i = 0; i < transactions.length; i++) {
    if (transactions[i].id === id) {
      const t = transactions[i];
      editingId = id;
      document.getElementById("type-" + t.type).checked = true;
      fillCategories(t.type, t.category);
      amountInput.value = t.amount;
      dateInput.value = t.date;
      descriptionInput.value = t.description;
      formTitle.textContent = "Edit transaction";
      submitBtn.textContent = "Update transaction";
      clearErrors();
      openModal();
    }
  }
}

function deleteTransaction(id) {
  let removed = null;

  transactions = transactions.filter(function (t) {
    if (t.id === id) {
      removed = t;
      return false;
    }
    return true;
  });

  saveData();
  showEverything();

  showToast("Transaction deleted", function () {
    transactions.push(removed);
    saveData();
    showEverything();
  });
}

function showToast(message, onUndo) {
  toastText.textContent = message;
  undoAction = onUndo;
  toast.hidden = false;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.hidden = true;
  }, 5000);
}


function getFilteredTransactions() {
  const search = searchInput.value.trim().toLowerCase();
  const result = [];

  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    const typeOk = selectedType === "all" || t.type === selectedType;
    const categoryOk = filterCategory.value === "all" || t.category === filterCategory.value;
    const searchOk = search === "" ||
      t.description.toLowerCase().indexOf(search) !== -1 ||
      t.category.toLowerCase().indexOf(search) !== -1;

    if (typeOk && categoryOk && searchOk) {
      result.push(t);
    }
  }

  result.sort(function (a, b) {
    if (a.date === b.date) {
      return b.id - a.id;
    }
    return a.date < b.date ? 1 : -1;
  });

  return result;
}

function createRow(t) {
  let sign = "-";
  if (t.type === "income") {
    sign = "+";
  }

  const li = document.createElement("li");
  li.className = "transaction";
  li.innerHTML =
    '<div class="transaction-icon">' + t.category.charAt(0) + '</div>' +
    '<div class="transaction-info">' +
      '<p class="transaction-description"></p>' +
      '<p class="transaction-meta">' +
        '<span class="category-dot" style="background-color:' + getColor(t.category) + '"></span>' +
        '<span>' + t.category + '</span>' +
      '</p>' +
    '</div>' +
    '<p class="transaction-amount ' + t.type + '">' + sign + formatMoney(t.amount) + '</p>' +
    '<div class="transaction-actions">' +
      '<button type="button" class="small-button" data-action="edit" data-id="' + t.id + '">Edit</button>' +
      '<button type="button" class="small-button delete" data-action="delete" data-id="' + t.id + '">Delete</button>' +
    '</div>';

  li.querySelector(".transaction-description").textContent = t.description;
  return li;
}

function showTransactions() {
  const items = getFilteredTransactions();
  list.innerHTML = "";

  if (items.length === 1) {
    countLabel.textContent = "1 transaction";
  } else {
    countLabel.textContent = items.length + " transactions";
  }

  if (items.length === 0) {
    if (transactions.length === 0) {
      emptyTitle.textContent = "No transactions yet";
      emptyText.textContent = "Add your first income or expense to get started.";
    } else {
      emptyTitle.textContent = "No matching transactions";
      emptyText.textContent = "Try a different search or filter.";
    }
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;

  let currentDate = "";
  let card = null;
  let dayTotal = 0;
  let totalText = null;

  for (let i = 0; i < items.length; i++) {
    const t = items[i];

    if (t.date !== currentDate) {
      currentDate = t.date;
      dayTotal = 0;

      const group = document.createElement("section");
      group.className = "day-group";
      group.innerHTML = '<div class="day-header"><span class="day-name"></span><span class="day-total"></span></div>';
      group.querySelector(".day-name").textContent = formatDay(t.date);
      totalText = group.querySelector(".day-total");

      card = document.createElement("ul");
      card.className = "day-card";
      group.appendChild(card);
      list.appendChild(group);
    }

    if (t.type === "income") {
      dayTotal = dayTotal + t.amount;
    } else {
      dayTotal = dayTotal - t.amount;
    }
    totalText.textContent = formatMoney(dayTotal);

    card.appendChild(createRow(t));
  }
}


function showSummary() {
  const income = addTotal(transactions, "income");
  const expense = addTotal(transactions, "expense");

  incomeText.textContent = formatMoney(income);
  expenseText.textContent = formatMoney(expense);
  balanceText.textContent = formatMoney(income - expense);
}


function highlight(name, amount, percent) {
  const slices = donut.querySelectorAll(".donut-slice");
  const rows = legend.querySelectorAll(".legend-item");

  if (name === null) {
    donut.classList.remove("has-active");
    for (let i = 0; i < slices.length; i++) {
      slices[i].classList.remove("active");
    }
    for (let i = 0; i < rows.length; i++) {
      rows[i].classList.remove("active");
    }
    centerLabel.textContent = "Spent";
    centerValue.textContent = monthSpentText;
    return;
  }

  donut.classList.add("has-active");
  for (let i = 0; i < slices.length; i++) {
    slices[i].classList.toggle("active", slices[i].dataset.name === name);
  }
  for (let i = 0; i < rows.length; i++) {
    rows[i].classList.toggle("active", rows[i].dataset.name === name);
  }
  centerLabel.textContent = name + " (" + percent + "%)";
  centerValue.textContent = formatMoney(amount);
}

function showChart(monthItems) {
  const oldSlices = donut.querySelectorAll(".donut-slice");
  for (let i = 0; i < oldSlices.length; i++) {
    oldSlices[i].remove();
  }
  legend.innerHTML = "";

  const totals = {};
  let allExpenses = 0;

  for (let i = 0; i < monthItems.length; i++) {
    const t = monthItems[i];
    if (t.type === "expense") {
      if (totals[t.category] === undefined) {
        totals[t.category] = 0;
      }
      totals[t.category] = totals[t.category] + t.amount;
      allExpenses = allExpenses + t.amount;
    }
  }

  const names = Object.keys(totals);

  if (names.length === 0) {
    chart.hidden = true;
    chartEmpty.hidden = false;
    return;
  }

  chart.hidden = false;
  chartEmpty.hidden = true;
  monthSpentText = formatMoney(allExpenses);

  names.sort(function (a, b) {
    return totals[b] - totals[a];
  });

  let start = 0;

  names.forEach(function (name) {
    const amount = totals[name];
    const percent = (amount / allExpenses) * 100;
    const roundedPercent = Math.round(percent);

    let length = percent;
    if (names.length > 1) {
      length = percent - 0.6;
    }

    const slice = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    slice.setAttribute("class", "donut-slice");
    slice.setAttribute("cx", "21");
    slice.setAttribute("cy", "21");
    slice.setAttribute("r", "15.9155");
    slice.setAttribute("stroke", getColor(name));
    slice.setAttribute("stroke-dasharray", length + " " + (100 - length));
    slice.setAttribute("stroke-dashoffset", 25 - start);
    slice.dataset.name = name;
    donut.appendChild(slice);

    const row = document.createElement("li");
    row.className = "legend-item";
    row.dataset.name = name;
    row.innerHTML =
      '<span class="legend-color" style="background-color:' + getColor(name) + '"></span>' +
      '<span class="legend-name">' + name + '</span>' +
      '<span class="legend-percent">' + roundedPercent + '%</span>' +
      '<span class="legend-value">' + formatMoney(amount) + '</span>';
    legend.appendChild(row);

    slice.addEventListener("mouseenter", function () {
      highlight(name, amount, roundedPercent);
    });
    slice.addEventListener("mouseleave", function () {
      highlight(null);
    });
    row.addEventListener("mouseenter", function () {
      highlight(name, amount, roundedPercent);
    });
    row.addEventListener("mouseleave", function () {
      highlight(null);
    });

    start = start + percent;
  });

  highlight(null);
}

function showMonth() {
  const monthItems = transactions.filter(function (t) {
    return t.date.startsWith(selectedMonth);
  });

  monthExpenseText.textContent = formatMoney(addTotal(monthItems, "expense"));
  monthIncomeText.textContent = formatMoney(addTotal(monthItems, "income"));

  const date = new Date(selectedMonth + "-01T00:00:00");
  monthLabel.textContent = date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric"
  });

  showChart(monthItems);
}

function changeMonth(amount) {
  const year = Number(selectedMonth.slice(0, 4));
  const month = Number(selectedMonth.slice(5, 7));
  const date = new Date(year, month - 1 + amount, 1);

  selectedMonth = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
  showMonth();
}

function showEverything() {
  showSummary();
  showMonth();
  showTransactions();
}


for (let i = 0; i < openModalButtons.length; i++) {
  openModalButtons[i].addEventListener("click", function () {
    resetForm();
    openModal();
  });
}

closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", closeModal);

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeModal();
  }
});

form.addEventListener("submit", handleSubmit);

form.addEventListener("input", function (event) {
  const error = document.getElementById(event.target.id + "-error");
  if (error) {
    error.textContent = "";
    event.target.classList.remove("input-error");
  }
});

form.addEventListener("change", function (event) {
  if (event.target.name === "type") {
    fillCategories(getType(), "");
  }
});

prevMonthBtn.addEventListener("click", function () {
  changeMonth(-1);
});

nextMonthBtn.addEventListener("click", function () {
  changeMonth(1);
});

searchInput.addEventListener("input", showTransactions);
filterCategory.addEventListener("change", showTransactions);

typeFilter.addEventListener("click", function (event) {
  const button = event.target.closest("button");
  if (button === null) {
    return;
  }
  selectedType = button.dataset.value;
  const buttons = typeFilter.querySelectorAll("button");
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].classList.toggle("active", buttons[i] === button);
  }
  showTransactions();
});

list.addEventListener("click", function (event) {
  const button = event.target.closest("button");
  if (button === null) {
    return;
  }
  const id = Number(button.dataset.id);

  if (button.dataset.action === "edit") {
    editTransaction(id);
  } else if (button.dataset.action === "delete") {
    deleteTransaction(id);
  }
});

toastUndo.addEventListener("click", function () {
  if (undoAction) {
    undoAction();
  }
  toast.hidden = true;
});


fillFilterCategories();
selectedMonth = getToday().slice(0, 7);
loadData();
resetForm();
showEverything();