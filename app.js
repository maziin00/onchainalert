const tokenLimitInput = document.getElementById("token-limit");
const windowHoursInput = document.getElementById("window-hours");
const minSupplyInput = document.getElementById("min-supply");
const refreshMinutesInput = document.getElementById("refresh-minutes");
const fetchButton = document.getElementById("fetch-alerts");
const toggleAutoButton = document.getElementById("toggle-auto");
const clearButton = document.getElementById("clear-alerts");
const errorMessage = document.getElementById("error-message");
const alertList = document.getElementById("alert-list");
const emptyState = document.getElementById("empty-state");
const alertCount = document.getElementById("alert-count");
const summaryToken = document.getElementById("summary-token");
const summaryWindow = document.getElementById("summary-window");
const summaryMin = document.getElementById("summary-min");
const summaryRefresh = document.getElementById("summary-refresh");
const statusPill = document.getElementById("status-pill");
const lastUpdated = document.getElementById("last-updated");

const formatAmount = (value) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(value);
let refreshTimer = null;
let hasFetchedOnce = false;
let currentAbortController = null;
let isStopped = false;

function updateAutoButton() {
  toggleAutoButton.textContent = "Stop";
}

function updateSummary() {
  summaryToken.textContent = tokenLimitInput.value;
  summaryWindow.textContent = `${windowHoursInput.value} jam`;
  summaryMin.textContent = `${minSupplyInput.value}%`;
  summaryRefresh.textContent = `${refreshMinutesInput.value} menit`;
}

function renderAlerts(alerts) {
  alertList.innerHTML = "";
  if (!alerts.length) {
    emptyState.hidden = false;
    alertList.hidden = true;
    alertCount.textContent = "0 sinyal";
    return;
  }
  emptyState.hidden = true;
  alertList.hidden = false;
  alertCount.textContent = `${alerts.length} sinyal`;

  alerts.forEach((alert) => {
    const card = document.createElement("div");
    card.className = "alert-card";

    const header = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = alert.tokenSymbol;
    const address = document.createElement("p");
    address.className = "meta";
    address.textContent = alert.address;
    const label = document.createElement("p");
    label.className = "meta";
    const labelType = alert.labelType ? alert.labelType.toUpperCase() : "UNKNOWN";
    label.textContent = alert.labelName
      ? `Label: ${alert.labelName} • ${labelType}${alert.labelNote ? ` (${alert.labelNote})` : ""}`
      : `Label: - • ${labelType}`;
    header.append(title, address);
    header.appendChild(label);

    const chip = document.createElement("div");
    const inflowUsd = Number(alert.inflowUsd);
    const outflowUsd = Number(alert.outflowUsd);
    const netFlowUsd = Number(alert.netFlowUsd);
    const isCex = (alert.labelType || "").toLowerCase() === "cex";
    const severityBase = isCex
      ? Math.abs(Number.isFinite(netFlowUsd) ? netFlowUsd : 0)
      : Math.max(
          Math.abs(Number.isFinite(inflowUsd) ? inflowUsd : 0),
          Math.abs(Number.isFinite(outflowUsd) ? outflowUsd : 0)
        );
    const absUsd = Number.isFinite(severityBase) ? severityBase : 0;
    if (absUsd >= 1_000_000) {
      chip.className = "chip warning";
      chip.textContent = "WARNING";
    } else if (absUsd >= 100_000) {
      chip.className = "chip important";
      chip.textContent = "IMPORTANT";
    } else {
      chip.className = "chip info";
      chip.textContent = "INFO";
    }

    const details = document.createElement("div");
    details.className = "details";
    const line1 = document.createElement("p");
    line1.innerHTML = `Inflow: <strong>$${formatAmount(
      Number.isFinite(inflowUsd) ? inflowUsd : 0
    )}</strong>`;
    const line2 = document.createElement("p");
    line2.innerHTML = `Outflow: <strong>$${formatAmount(
      Number.isFinite(outflowUsd) ? outflowUsd : 0
    )}</strong>`;
    details.append(line1, line2);

    if (isCex) {
      const line3 = document.createElement("p");
      line3.innerHTML = `Net flow: <strong>$${formatAmount(
        Number.isFinite(netFlowUsd) ? netFlowUsd : 0
      )}</strong>`;
      details.append(line3);
    }

    card.append(header, chip, details);
    alertList.appendChild(card);
  });
}

async function fetchAlerts() {
  let didAbort = false;
  if (currentAbortController) {
    currentAbortController.abort();
  }
  currentAbortController = new AbortController();
  errorMessage.hidden = true;
  statusPill.textContent = "Mengambil data...";
  statusPill.dataset.state = "loading";
  fetchButton.disabled = true;
  fetchButton.textContent = "Mengambil data...";
  try {
    const params = new URLSearchParams({
      limit: tokenLimitInput.value,
      windowHours: windowHoursInput.value,
      minSupplyPercent: minSupplyInput.value,
    });
    const response = await fetch(`/api/whale-alerts?${params.toString()}`, {
      signal: currentAbortController.signal,
    });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Gagal mengambil data.");
    }
    const payload = await response.json();
    if (payload.error) {
      throw new Error(payload.error);
    }
    const alerts = payload.alerts || [];
    renderAlerts(alerts);
    statusPill.textContent = "Terhubung";
    statusPill.dataset.state = "ready";
    if (alerts.length) {
      lastUpdated.textContent = `Last update: ${new Date().toLocaleString()}`;
    }
  } catch (error) {
    if (error.name === "AbortError") {
      statusPill.textContent = "Dihentikan";
      statusPill.dataset.state = "error";
      didAbort = true;
      return;
    }
    errorMessage.textContent = error.message;
    errorMessage.hidden = false;
    statusPill.textContent = "Error";
    statusPill.dataset.state = "error";
  } finally {
    fetchButton.disabled = false;
    fetchButton.textContent = "Ambil alert";
    currentAbortController = null;
    if (!didAbort && !isStopped && hasFetchedOnce) {
      scheduleAutoRefresh();
    }
  }
}

function scheduleAutoRefresh() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }
  if (isStopped || !hasFetchedOnce) {
    refreshTimer = null;
    return;
  }
  const minutes = Number(refreshMinutesInput.value) || 1;
  refreshTimer = setTimeout(fetchAlerts, minutes * 60 * 1000);
}

fetchButton.addEventListener("click", () => {
  updateSummary();
  hasFetchedOnce = true;
  isStopped = false;
  fetchAlerts();
});

clearButton.addEventListener("click", () => {
  renderAlerts([]);
});

toggleAutoButton.addEventListener("click", () => {
  isStopped = true;
  scheduleAutoRefresh();
  if (currentAbortController) {
    currentAbortController.abort();
  }
});

tokenLimitInput.addEventListener("input", updateSummary);
windowHoursInput.addEventListener("input", updateSummary);
minSupplyInput.addEventListener("input", updateSummary);
refreshMinutesInput.addEventListener("input", () => {
  updateSummary();
  scheduleAutoRefresh();
});

updateSummary();
renderAlerts([]);
updateAutoButton();
