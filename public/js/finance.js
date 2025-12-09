// js/finance.js
import { state, saveState, uid, computeFinanceSummary } from "./state.js";

const incomeInput = document.getElementById("incomeInput");
const expenseRowsContainer = document.getElementById("expenseRowsContainer");
const addExpenseRowBtn = document.getElementById("addExpenseRowBtn");
const saveFinanceBtn = document.getElementById("saveFinanceBtn");
const avgExpenseChip = document.getElementById("avgExpenseChip");
const monthlySavingsChip = document.getElementById("monthlySavingsChip");

/**
 * Render expense rows table
 */
function renderExpenseRows() {
  expenseRowsContainer.innerHTML = "";

  if (!state.finance.expenseHistory.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent =
      "No months added yet. Start by adding last few months’ total expenses.";
    expenseRowsContainer.appendChild(empty);
    return;
  }

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th style="width:45%;">Month/label</th>
      <th style="width:35%;" class="text-right">Total expense (₹)</th>
      <th style="width:20%;"></th>
    </tr>`;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  state.finance.expenseHistory.forEach((row) => {
    const tr = document.createElement("tr");

    const labelTd = document.createElement("td");
    const labelInput = document.createElement("input");
    labelInput.type = "text";
    labelInput.value = row.label || "";
    labelInput.placeholder = "e.g. Jan 2025";
    labelInput.style.width = "100%";
    labelInput.style.fontSize = "0.8rem";
    labelInput.onchange = (e) => {
      row.label = e.target.value.trim();
      saveState();
    };
    labelTd.appendChild(labelInput);

    const amountTd = document.createElement("td");
    amountTd.className = "text-right";
    const amountInput = document.createElement("input");
    amountInput.type = "number";
    amountInput.min = "0";
    amountInput.step = "100";
    amountInput.value = row.amount ?? "";
    amountInput.placeholder = "25,000";
    amountInput.style.width = "100%";
    amountInput.style.fontSize = "0.8rem";
    amountInput.onchange = (e) => {
      const val = parseFloat(e.target.value);
      row.amount = Number.isFinite(val) ? val : 0;
      saveState();
      updateFinanceSummaryUI();
      // items will be re-rendered by main via onFinanceChanged callback
    };
    amountTd.appendChild(amountInput);

    const actionsTd = document.createElement("td");
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "small secondary";
    removeBtn.textContent = "Remove";
    removeBtn.onclick = () => {
      state.finance.expenseHistory = state.finance.expenseHistory.filter(
        (r) => r.id !== row.id
      );
      saveState();
      renderExpenseRows();
      updateFinanceSummaryUI();
    };
    actionsTd.appendChild(removeBtn);

    tr.appendChild(labelTd);
    tr.appendChild(amountTd);
    tr.appendChild(actionsTd);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  expenseRowsContainer.appendChild(table);
}

/**
 * Update chips at the top of finance card
 */
function updateFinanceSummaryUI() {
  const { avgExpense, monthlySavings } = computeFinanceSummary();
  const income = Number(state.finance.income) || 0;
  const hasExpenses = state.finance.expenseHistory.some(
    (r) => Number(r.amount) > 0
  );

  avgExpenseChip.textContent = hasExpenses
    ? `Avg monthly expense: ₹${avgExpense.toFixed(0)}`
    : "Avg monthly expense: —";

  if (!income) {
    monthlySavingsChip.textContent = "Estimated monthly savings: — (set income)";
  } else if (!hasExpenses) {
    monthlySavingsChip.textContent = "Estimated monthly savings: — (add expenses)";
  } else {
    monthlySavingsChip.textContent = `Estimated monthly savings: ₹${monthlySavings.toFixed(
      0
    )}`;
  }
}

/**
 * Called from main.js
 * @param {{ onFinanceChanged: function }} options
 */
export function initFinanceSection(options = {}) {
  const { onFinanceChanged } = options;

  // hydrate inputs from state
  if (state.finance.income) {
    incomeInput.value = state.finance.income;
  }

  renderExpenseRows();
  updateFinanceSummaryUI();

  addExpenseRowBtn.addEventListener("click", () => {
    state.finance.expenseHistory.push({
      id: uid(),
      label: "",
      amount: 0
    });
    saveState();
    renderExpenseRows();
  });

  saveFinanceBtn.addEventListener("click", () => {
    const incomeVal = parseFloat(incomeInput.value);
    state.finance.income = Number.isFinite(incomeVal) ? incomeVal : 0;
    saveState();
    updateFinanceSummaryUI();
    onFinanceChanged && onFinanceChanged();
  });

  // also trigger onFinanceChanged whenever expenses change
  const originalUpdate = updateFinanceSummaryUI;
  // wrap it so any future calls also notify items
  function wrappedUpdate() {
    originalUpdate();
    onFinanceChanged && onFinanceChanged();
  }
  // replace local reference
  updateFinanceSummaryUI = wrappedUpdate;
}
