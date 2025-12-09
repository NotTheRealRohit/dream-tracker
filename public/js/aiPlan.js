// js/aiPlan.js
import { state, computeFinanceSummary } from "./state.js";
import { openGenericModal } from "./modal.js";

const aiPlanBtn = document.getElementById("aiPlanBtn");

function formatCurrency(n) {
  if (!Number.isFinite(n)) return "—";
  return `₹${n.toFixed(0)}`;
}

export function initAIPlan() {
  if (!aiPlanBtn) return;

  aiPlanBtn.addEventListener("click", async () => {
    if (!state.items.length) {
      alert("Add at least one dream item before asking AI.");
      return;
    }

    const { avgExpense, monthlySavings } = computeFinanceSummary();

    const payload = {
      finance: {
        income: Number(state.finance.income) || 0,
        avgExpense,
        monthlySavings
      },
      items: state.items
    };

    openGenericModal(
      "AI Smart Plan",
      `<p class="muted">Thinking... asking the LLM for a plan.</p>`
    );

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Server error");
      }

      const data = await res.json();
      renderPlan(data);
    } catch (err) {
      openGenericModal(
        "AI Smart Plan",
        `<p>Sorry, something went wrong while contacting the AI.</p>
         <p class="muted">${err.message}</p>`
      );
    }
  });
}

function renderPlan(plan) {
  const summary = plan.summary || "Here’s a suggested plan.";
  const assumptions = plan.assumptions || [];
  const months = plan.months || [];

  let html = `<p>${summary}</p>`;

  if (assumptions.length) {
    html += "<h4>Assumptions</h4><ul>";
    for (const a of assumptions) {
      html += `<li>${a}</li>`;
    }
    html += "</ul>";
  }

  if (months.length) {
    html += "<h4>Month-by-month plan</h4>";
    for (const m of months) {
      const b = m.budget || {};
      html += `
        <div style="margin-bottom:0.75rem;">
          <strong>${m.label || `Month ${m.monthOffset}`}</strong><br/>
          <span class="muted">
            Savings: ${formatCurrency(b.monthlySavings || 0)} · 
            Used: ${formatCurrency(b.usedForPurchases || 0)} · 
            Leftover: ${formatCurrency(b.leftover || 0)}
          </span>
      `;

      if (m.purchases && m.purchases.length) {
        html += "<ul>";
        for (const p of m.purchases) {
          html += `<li><strong>${p.itemName}</strong> — ${formatCurrency(
            p.price
          )}<br/><span class="muted">${p.notes || ""}</span></li>`;
        }
        html += "</ul>";
      }

      if (m.tips && m.tips.length) {
        html += "<div class='muted'>Tips:<ul>";
        for (const t of m.tips) {
          html += `<li>${t}</li>`;
        }
        html += "</ul></div>";
      }

      html += "</div>";
    }
  }

  openGenericModal("AI Smart Plan", html);
}
