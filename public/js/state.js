// js/state.js
export const STORAGE_KEY = "dreamPurchasesApp_v2";

export const state = {
  finance: {
    income: 0,
    expenseHistory: [] // { id, label, amount }
  },
  items: [] // { id, name, price, link, priority }
};

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      if (parsed.finance) state.finance = parsed.finance;
      if (parsed.items) state.items = parsed.items;
    }
  } catch (e) {
    console.warn("Failed to load state:", e);
  }
}

export function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function uid() {
  return (
    Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
  );
}

/**
 * Pure finance math (no DOM).
 * Returns { avgExpense, monthlySavings }
 */
export function computeFinanceSummary() {
  const income = Number(state.finance.income) || 0;
  const expenses = state.finance.expenseHistory
    .map((r) => Number(r.amount) || 0)
    .filter((v) => v > 0);

  let avgExpense = 0;
  if (expenses.length > 0) {
    const total = expenses.reduce((sum, v) => sum + v, 0);
    avgExpense = total / expenses.length;
  }

  const monthlySavings = income - avgExpense;
  return { avgExpense, monthlySavings };
}
