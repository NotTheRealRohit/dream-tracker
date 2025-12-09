// js/modal.js
import { computeFinanceSummary } from "./state.js";

const backdrop = document.getElementById("savingsModalBackdrop");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const modalCloseBtn = document.getElementById("modalCloseBtn");

function formatCurrency(n) {
  if (!Number.isFinite(n)) return "—";
  return `₹${n.toFixed(0)}`;
}

export function initModal() {
  modalCloseBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

export function closeModal() {
  backdrop.classList.add("hidden");
}

export function openGenericModal(title, htmlBody) {
  modalTitle.textContent = title;
  modalBody.innerHTML = htmlBody;
  backdrop.classList.remove("hidden");
}

// existing per-item modal (unchanged, maybe trimmed here)
export function openSavingsPlanModal(item) {
  const { avgExpense, monthlySavings } = computeFinanceSummary();
  const price = Number(item.price) || 0;

  // ... your existing logic to build HTML ...

  backdrop.classList.remove("hidden");
}
