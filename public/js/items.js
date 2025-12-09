// js/items.js
import { state, saveState, uid, computeFinanceSummary } from "./state.js";
import { openSavingsPlanModal } from "./modal.js";

const itemNameInput = document.getElementById("itemNameInput");
const itemPriceInput = document.getElementById("itemPriceInput");
const itemLinkInput = document.getElementById("itemLinkInput");
const itemPriorityInput = document.getElementById("itemPriorityInput");
const addItemBtn = document.getElementById("addItemBtn");
const itemsContainer = document.getElementById("itemsContainer");

function formatPriority(priority) {
  switch (priority) {
    case "high":
      return { label: "High", className: "priority-high" };
    case "medium":
      return { label: "Medium", className: "priority-medium" };
    case "low":
    default:
      return { label: "Low", className: "priority-low" };
  }
}

function addMonths(date, months) {
  const d = new Date(date.getTime());
  const targetMonth = d.getMonth() + months;
  d.setMonth(targetMonth);
  return d;
}

/**
 * Public: called from main + finance when money numbers change.
 */
export function renderItems() {
  itemsContainer.innerHTML = "";

  if (!state.items.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No dream items yet. Add something you’re saving for.";
    itemsContainer.appendChild(empty);
    return;
  }

  const { monthlySavings } = computeFinanceSummary();

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...state.items].sort((a, b) => {
    const pa = priorityOrder[a.priority] ?? 3;
    const pb = priorityOrder[b.priority] ?? 3;
    if (pa !== pb) return pa - pb;
    return (a.price || 0) - (b.price || 0);
  });

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Item</th>
      <th class="text-right">Price (₹)</th>
      <th>When you can afford</th>
      <th></th>
    </tr>`;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  const now = new Date();

  sorted.forEach((item) => {
    const tr = document.createElement("tr");

    const itemTd = document.createElement("td");
    const nameDiv = document.createElement("div");
    nameDiv.textContent = item.name || "(Untitled item)";
    nameDiv.style.fontSize = "0.9rem";
    nameDiv.style.fontWeight = "500";

    const metaDiv = document.createElement("div");
    metaDiv.style.marginTop = "0.15rem";

    const pInfo = formatPriority(item.priority);
    const badge = document.createElement("span");
    badge.className = "badge-priority " + pInfo.className;
    badge.textContent = pInfo.label + " priority";
    metaDiv.appendChild(badge);

    if (item.link) {
      const link = document.createElement("a");
      link.href = item.link;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className = "link";
      link.textContent = "View item";
      link.style.display = "block";
      link.style.marginTop = "0.15rem";
      metaDiv.appendChild(link);
    }

    // NEW: savings plan link
    const savingsBtn = document.createElement("button");
    savingsBtn.type = "button";
    savingsBtn.className = "link-like small";
    savingsBtn.textContent = "Savings plan";
    savingsBtn.style.marginTop = "0.15rem";
    savingsBtn.onclick = () => openSavingsPlanModal(item);
    metaDiv.appendChild(savingsBtn);

    itemTd.appendChild(nameDiv);
    itemTd.appendChild(metaDiv);

    const priceTd = document.createElement("td");
    priceTd.className = "text-right";
    const price = Number(item.price) || 0;
    priceTd.textContent = price ? "₹" + price.toFixed(0) : "—";

    const whenTd = document.createElement("td");
    whenTd.style.fontSize = "0.8rem";

    if (!price || !Number.isFinite(monthlySavings)) {
      whenTd.textContent = "—";
    } else if (monthlySavings <= 0) {
      whenTd.innerHTML =
        "<span class='muted'>No savings left with current numbers</span>";
    } else {
      const monthsNeeded = Math.ceil(price / monthlySavings);
      const targetDate = addMonths(now, monthsNeeded);
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
      ];
      const niceDate =
        monthNames[targetDate.getMonth()] + " " + targetDate.getFullYear();
      whenTd.innerHTML = `<strong>~${monthsNeeded} month${
        monthsNeeded > 1 ? "s" : ""
      }</strong><br><span class="muted">Around ${niceDate}</span>`;
    }

    const actionsTd = document.createElement("td");
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "small secondary";
    removeBtn.textContent = "✕";
    removeBtn.title = "Remove item";
    removeBtn.onclick = () => {
      state.items = state.items.filter((it) => it.id !== item.id);
      saveState();
      renderItems();
    };
    actionsTd.appendChild(removeBtn);

    tr.appendChild(itemTd);
    tr.appendChild(priceTd);
    tr.appendChild(whenTd);
    tr.appendChild(actionsTd);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  itemsContainer.appendChild(table);
}

/**
 * Initialize add-item form
 */
export function initItemsSection() {
  addItemBtn.addEventListener("click", () => {
    const name = itemNameInput.value.trim();
    const priceVal = parseFloat(itemPriceInput.value);
    const price = Number.isFinite(priceVal) ? priceVal : 0;
    const link = itemLinkInput.value.trim();
    const priority = itemPriorityInput.value || "medium";

    if (!name || !price) {
      alert("Please enter at least an item name and a valid price.");
      return;
    }

    state.items.push({
      id: uid(),
      name,
      price,
      link,
      priority
    });
    saveState();

    itemNameInput.value = "";
    itemPriceInput.value = "";
    itemLinkInput.value = "";
    itemPriorityInput.value = "medium";

    renderItems();
  });

  // initial render from loaded state
  renderItems();
}
