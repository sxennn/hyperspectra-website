(function () {
  "use strict";

  const STORAGE_KEY = "keychain-payout-tracker-v1";
  const defaultState = () => ({
    names: ["Person 1", "Person 2", "Person 3"],
    price: 10,
    cases: 50,
    print: 0,
    paid: [50, 0, 0],
    pct: [40, 40, 20],
    weeks: [{ sold: [0, 0, 0], eff: [0, 0, 0] }]
  });

  const elements = {
    setupInputs: document.getElementById("setupInputs"),
    setupStatus: document.getElementById("setupStatus"),
    percentageNote: document.getElementById("percentageNote"),
    summaryCards: document.getElementById("summaryCards"),
    leaderboard: document.getElementById("leaderboard"),
    weeksList: document.getElementById("weeksList"),
    addWeekButton: document.getElementById("addWeekButton"),
    exportButton: document.getElementById("exportButton"),
    importButton: document.getElementById("importButton"),
    importFile: document.getElementById("importFile"),
    toast: document.getElementById("toast")
  };

  function isFiniteNonNegative(value) {
    return typeof value === "number" && Number.isFinite(value) && value >= 0;
  }

  function isThreeNumbers(values) {
    return Array.isArray(values) && values.length === 3 && values.every(isFiniteNonNegative);
  }

  function validateState(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    return Array.isArray(value.names) &&
      value.names.length === 3 &&
      value.names.every((name) => typeof name === "string") &&
      isFiniteNonNegative(value.price) &&
      isFiniteNonNegative(value.cases) &&
      isFiniteNonNegative(value.print) &&
      isThreeNumbers(value.paid) &&
      isThreeNumbers(value.pct) &&
      Array.isArray(value.weeks) &&
      value.weeks.length > 0 &&
      value.weeks.every((week) => week && typeof week === "object" &&
        isThreeNumbers(week.sold) && isThreeNumbers(week.eff));
  }

  function cleanState(value) {
    return {
      names: value.names.slice(),
      price: value.price,
      cases: value.cases,
      print: value.print,
      paid: value.paid.slice(),
      pct: value.pct.slice(),
      weeks: value.weeks.map((week) => ({ sold: week.sold.slice(), eff: week.eff.slice() }))
    };
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (validateState(parsed)) return cleanState(parsed);
      }
    } catch (error) {
      // Storage can be unavailable in private browsing or locked-down environments.
    }
    return defaultState();
  }

  let state = loadState();
  let confirmingRemoval = -1;
  let toastTimer;

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[character]));
  }

  function formatMoney(amount) {
    return `${Number(amount).toFixed(2)} dhs`;
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      // Keep the tracker usable even when the browser refuses local storage writes.
    }
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => elements.toast.classList.remove("visible"), 2600);
  }

  function renderSetup() {
    const peopleFields = state.names.map((name, index) => `
      <div class="person-setup">
        <label class="field-label" for="person-name-${index}">Person ${index + 1} name</label>
        <input id="person-name-${index}" type="text" maxlength="40" value="${escapeHTML(name)}" data-person-name="${index}">
        <label class="field-label" for="person-paid-${index}">Money put in (dhs)</label>
        <input id="person-paid-${index}" type="number" min="0" step="0.01" value="${state.paid[index]}" data-paid-person="${index}">
      </div>`).join("");
    elements.setupInputs.innerHTML = `
      <div class="setup-group">
        <h3>Products & costs</h3>
        <label class="field-label" for="price">Price per keychain (dhs)</label>
        <input id="price" type="number" min="0" step="0.01" value="${state.price}" data-setting="price">
        <label class="field-label" for="cases">Acrylic casings cost (dhs)</label>
        <input id="cases" type="number" min="0" step="0.01" value="${state.cases}" data-setting="cases">
        <label class="field-label" for="print">Printing cost (dhs)</label>
        <input id="print" type="number" min="0" step="0.01" value="${state.print}" data-setting="print">
      </div>
      <div class="setup-group people-setup"><h3>People & contributions</h3>${peopleFields}</div>
      <div class="setup-group">
        <h3>Profit percentages</h3>
        <p class="field-hint">These weights split the shared profit pool.</p>
        <label class="field-label" for="pct-sales">Sales share (%)</label>
        <input id="pct-sales" type="number" min="0" step="1" value="${state.pct[0]}" data-pct="0">
        <label class="field-label" for="pct-effort">Effort share (%)</label>
        <input id="pct-effort" type="number" min="0" step="1" value="${state.pct[1]}" data-pct="1">
        <label class="field-label" for="pct-money">Money in share (%)</label>
        <input id="pct-money" type="number" min="0" step="1" value="${state.pct[2]}" data-pct="2">
      </div>`;
  }

  function renderWeeks() {
    elements.weeksList.innerHTML = state.weeks.map((week, weekIndex) => `
      <article class="card week-card" data-week-card="${weekIndex}">
        <div class="week-heading">
          <div><p class="eyebrow">WEEK ${weekIndex + 1}</p><h3>Sales & effort</h3></div>
          <button class="button button-remove" type="button" data-remove-week="${weekIndex}" ${state.weeks.length === 1 ? "disabled title=\"Keep at least one week\"" : ""}>Remove</button>
        </div>
        <div class="week-input-grid">
          ${state.names.map((name, personIndex) => `
            <div class="week-person">
              <h4 data-person-heading="${personIndex}">${escapeHTML(name)}</h4>
              <label class="field-label" for="sold-${weekIndex}-${personIndex}" data-person-label="sold-${personIndex}">Pieces sold by ${escapeHTML(name)}</label>
              <input id="sold-${weekIndex}-${personIndex}" type="number" min="0" step="1" value="${week.sold[personIndex]}" data-week="${weekIndex}" data-week-field="sold" data-person="${personIndex}">
              <label class="field-label" for="eff-${weekIndex}-${personIndex}" data-person-label="eff-${personIndex}">Effort by ${escapeHTML(name)} (hours)</label>
              <input id="eff-${weekIndex}-${personIndex}" type="number" min="0" step="0.25" value="${week.eff[personIndex]}" data-week="${weekIndex}" data-week-field="eff" data-person="${personIndex}">
            </div>`).join("")}
        </div>
        <div class="week-note" id="week-note-${weekIndex}" aria-live="polite"></div>
        <div class="table-scroll" role="region" aria-label="Week ${weekIndex + 1} payout breakdown" tabindex="0">
          <table>
            <thead><tr><th scope="col">Person</th><th scope="col">Paid back</th><th scope="col">Sales</th><th scope="col">Effort</th><th scope="col">Money in</th><th scope="col">Total</th></tr></thead>
            <tbody id="week-results-${weekIndex}"></tbody>
          </table>
        </div>
      </article>`).join("");
  }

  function updateSummary(results) {
    elements.summaryCards.innerHTML = state.names.map((name, index) => `
      <article class="card summary-card">
        <div class="summary-person"><span class="avatar">${index + 1}</span><h3>${escapeHTML(name)}</h3></div>
        <p class="summary-value">${formatMoney(results.people[index].totalEarned)}</p>
        <div class="summary-details"><span>${results.people[index].piecesSold} pieces sold</span><span>${formatMoney(results.people[index].owed)} left to pay back</span></div>
      </article>`).join("");

    const ranking = state.names.map((name, index) => ({
      name, pieces: results.people[index].piecesSold, index
    })).sort((first, second) => second.pieces - first.pieces || first.index - second.index);
    const maximum = Math.max(1, ...ranking.map((person) => person.pieces));
    const labels = ["1st", "2nd", "3rd"];
    elements.leaderboard.innerHTML = ranking.map((person, rank) => `
      <li class="leader-row">
        <span class="rank-badge">${labels[rank]}</span>
        <span class="leader-name">${escapeHTML(person.name)}</span>
        <span class="bar-track" aria-hidden="true"><span class="bar-fill" style="width:${person.pieces / maximum * 100}%"></span></span>
        <strong class="leader-total">${person.pieces}</strong>
      </li>`).join("");
  }

  function updateSetupStatus() {
    const spent = state.cases + state.print;
    const invested = state.paid.reduce((sum, amount) => sum + amount, 0);
    const accounted = Math.abs(spent - invested) < 0.005;
    elements.setupStatus.className = `setup-status ${accounted ? "is-good" : "is-warning"}`;
    elements.setupStatus.textContent = accounted
      ? `Total spent: ${formatMoney(spent)}, all accounted for`
      : `Heads up: casings + printing total ${formatMoney(spent)}, but the team put in ${formatMoney(invested)}.`;

    const percentageTotal = state.pct.reduce((sum, amount) => sum + amount, 0);
    elements.percentageNote.textContent = Math.abs(percentageTotal - 100) < 0.000001
      ? "Profit percentages add up to 100%."
      : `Profit percentages total ${percentageTotal}%. Shares are scaled proportionally${percentageTotal === 0 ? "; all profit-share categories are currently 0%." : " to 100%"}.`;
  }

  function updateWeekResults(results) {
    results.weeks.forEach((week, weekIndex) => {
      const note = week.topSellerIndex === -1
        ? "No sales this week."
        : `${escapeHTML(state.names[week.topSellerIndex])} sold the most this week.`;
      document.getElementById(`week-note-${weekIndex}`).innerHTML = `
        <span>${note}</span>
        <span>Revenue: <strong>${formatMoney(week.revenue)}</strong></span>
        <span>Paid back: <strong>${formatMoney(week.payback)}</strong></span>
        <span>Shared: <strong>${formatMoney(week.pool)}</strong></span>`;
      document.getElementById(`week-results-${weekIndex}`).innerHTML = state.names.map((name, personIndex) => {
        const person = week.people[personIndex];
        return `<tr><th scope="row">${escapeHTML(name)}</th><td>${formatMoney(person.paidBack)}</td><td>${formatMoney(person.salesShare)}</td><td>${formatMoney(person.effortShare)}</td><td>${formatMoney(person.moneyShare)}</td><td class="total-cell">${formatMoney(person.total)}</td></tr>`;
      }).join("");
    });
  }

  function refreshResults() {
    const results = window.computePayouts(state);
    updateSummary(results);
    updateSetupStatus();
    updateWeekResults(results);
  }

  function renderAll() {
    renderSetup();
    renderWeeks();
    refreshResults();
  }

  function readNumber(input) {
    const value = input.value.trim();
    const number = value === "" ? 0 : Number(value);
    return Number.isFinite(number) && number >= 0 ? number : 0;
  }

  function onInput(event) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    if (input.dataset.personName !== undefined) {
      state.names[Number(input.dataset.personName)] = input.value;
    } else if (input.dataset.paidPerson !== undefined) {
      state.paid[Number(input.dataset.paidPerson)] = readNumber(input);
    } else if (input.dataset.setting) {
      state[input.dataset.setting] = readNumber(input);
    } else if (input.dataset.pct !== undefined) {
      state.pct[Number(input.dataset.pct)] = readNumber(input);
    } else if (input.dataset.week !== undefined) {
      const weekIndex = Number(input.dataset.week);
      const personIndex = Number(input.dataset.person);
      state.weeks[weekIndex][input.dataset.weekField][personIndex] = readNumber(input);
    } else {
      return;
    }

    saveState();
    refreshResults();
    if (input.dataset.personName !== undefined) {
      elements.weeksList.querySelectorAll(`[data-person-heading="${input.dataset.personName}"]`).forEach((heading) => {
        heading.textContent = input.value;
      });
      elements.weeksList.querySelectorAll(`[data-person-label$="-${input.dataset.personName}"]`).forEach((label) => {
        label.textContent = label.dataset.personLabel.startsWith("sold-")
          ? `Pieces sold by ${input.value}`
          : `Effort by ${input.value} (hours)`;
      });
    }
  }

  function handleRemove(index) {
    if (state.weeks.length === 1) return;
    if (confirmingRemoval !== index) {
      confirmingRemoval = index;
      const button = elements.weeksList.querySelector(`[data-remove-week="${index}"]`);
      button.textContent = "Tap again to remove";
      button.setAttribute("aria-label", `Tap again to remove week ${index + 1}`);
      window.setTimeout(() => {
        if (confirmingRemoval === index) {
          confirmingRemoval = -1;
          renderWeeks();
          refreshResults();
        }
      }, 4000);
      return;
    }
    state.weeks.splice(index, 1);
    confirmingRemoval = -1;
    saveState();
    renderWeeks();
    refreshResults();
  }

  function exportData() {
    const file = new Blob([`${JSON.stringify(state, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "keychain-payout-data.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("Your tracker data was exported.");
  }

  async function importData(file) {
    try {
      const parsed = JSON.parse(await file.text());
      if (!validateState(parsed)) {
        showToast("That file does not look like valid tracker data.");
        return;
      }
      state = cleanState(parsed);
      confirmingRemoval = -1;
      saveState();
      renderAll();
      showToast("Tracker data imported.");
    } catch (error) {
      showToast("Could not read that file. Choose a valid tracker JSON file.");
    }
  }

  document.addEventListener("input", onInput);
  elements.addWeekButton.addEventListener("click", () => {
    state.weeks.push({ sold: [0, 0, 0], eff: [0, 0, 0] });
    confirmingRemoval = -1;
    saveState();
    renderWeeks();
    refreshResults();
    elements.weeksList.lastElementChild.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  elements.weeksList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-week]");
    if (button) handleRemove(Number(button.dataset.removeWeek));
  });
  elements.exportButton.addEventListener("click", exportData);
  elements.importButton.addEventListener("click", () => elements.importFile.click());
  elements.importFile.addEventListener("change", () => {
    if (elements.importFile.files && elements.importFile.files[0]) {
      importData(elements.importFile.files[0]);
    }
    elements.importFile.value = "";
  });

  renderAll();
}());
