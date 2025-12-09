// js/main.js
import { loadState } from "./state.js";
import { initFinanceSection } from "./finance.js";
import { initItemsSection, renderItems } from "./items.js";
import { initModal } from "./modal.js";
import { initAIPlan } from "./aiPlan.js";

document.addEventListener("DOMContentLoaded", () => {
  loadState();
  initModal();
  initItemsSection();
  initFinanceSection({
    onFinanceChanged: renderItems
  });
  initAIPlan(); // <-- new
});
