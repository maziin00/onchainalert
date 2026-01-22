const tokenLimitInput = document.getElementById("token-limit");
const windowHoursInput = document.getElementById("window-hours");
const minSupplyInput = document.getElementById("min-supply");
const refreshMinutesInput = document.getElementById("refresh-minutes");
const signalTimeframeInput = document.getElementById("signal-timeframe");
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
const signalStatus = document.getElementById("signal-status");
const signalTimeframe = document.getElementById("signal-timeframe-value");
const signalCexInflow = document.getElementById("signal-cex-inflow");
const signalCexOutflow = document.getElementById("signal-cex-outflow");
const signalCexNet = document.getElementById("signal-cex-net");
const signalAccumulators = document.getElementById("signal-accumulators");
const signalDistributors = document.getElementById("signal-distributors");
const signalWallets = document.getElementById("signal-wallets");
const signalSmart = document.getElementById("signal-smart");
const signalMm = document.getElementById("signal-mm");
const signalMovers = document.getElementById("signal-movers");
const tradeAction = document.getElementById("trade-action");
const tradeList = document.getElementById("trade-list");
const tradeToggle = document.getElementById("trade-toggle");
const tradeBody = document.getElementById("trade-body");
const sentimentToggle = document.getElementById("sentiment-toggle");
const sentimentBody = document.getElementById("sentiment-body");

const formatAmount = (value) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(value);
const formatPrice = (value) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(value);
let refreshTimer = null;
let hasFetchedOnce = false;
let currentAbortController = null;
let isStopped = false;

function setupCollapsible(toggle, body, defaultOpen = true) {
  if (!toggle || !body) {
    return;
  }
  const setOpen = (open) => {
    toggle.classList.toggle("open", open);
    body.hidden = !open;
  };
  let isOpen = defaultOpen;
  setOpen(isOpen);
  toggle.addEventListener("click", () => {
    isOpen = !isOpen;
    setOpen(isOpen);
  });
}

function formatWindowLabel(hoursValue) {
  const hours = Number(hoursValue);
  if (hours === 6) {
    return "6 jam";
  }
  if (hours === 12) {
    return "12 jam";
  }
  if (hours === 24) {
    return "1 hari";
  }
  if (hours === 168) {
    return "1 minggu";
  }
  if (Number.isFinite(hours)) {
    return `${hours} jam`;
  }
  return "-";
}

function updateAutoButton() {
  toggleAutoButton.textContent = "Stop";
}

function updateSummary() {
  summaryToken.textContent = tokenLimitInput.value;
  summaryWindow.textContent = formatWindowLabel(windowHoursInput.value);
  summaryMin.textContent = `${minSupplyInput.value}%`;
  summaryRefresh.textContent = `${refreshMinutesInput.value} menit`;
}

function renderAlerts(alerts) {
  alertList.innerHTML = "";
  if (!alerts.length) {
    emptyState.hidden = false;
    alertList.hidden = true;
    alertCount.textContent = "0 Signal";
    return;
  }
  emptyState.hidden = true;
  alertList.hidden = false;
  alertCount.textContent = `${alerts.length} Signal`;

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

function renderSignalSummary(summary) {
  if (!summary) {
    signalStatus.textContent = "-";
    signalStatus.className = "signal-badge neutral";
    signalTimeframe.textContent = "-";
    signalCexInflow.textContent = "$0";
    signalCexOutflow.textContent = "$0";
    signalCexNet.textContent = "$0";
    signalAccumulators.textContent = "0";
    signalDistributors.textContent = "0";
    signalWallets.textContent = "0";
    signalSmart.textContent = "0";
    signalMm.textContent = "0";
    signalMovers.innerHTML = "";
    tradeAction.textContent = "-";
    tradeAction.className = "signal-badge neutral";
    tradeList.innerHTML = "";
    return;
  }

  const signal = summary.signal || "neutral";
  signalStatus.textContent = signal.toUpperCase();
  signalStatus.className = `signal-badge ${signal}`;
  signalTimeframe.textContent = formatWindowLabel(
    summary.signalTimeframeHours || summary.timeframeHours
  );
  signalCexInflow.textContent = `$${formatAmount(summary.cexInflowUsd || 0)}`;
  signalCexOutflow.textContent = `$${formatAmount(summary.cexOutflowUsd || 0)}`;
  signalCexNet.textContent = `$${formatAmount(summary.cexNetUsd || 0)}`;
  signalAccumulators.textContent = formatAmount(summary.accumulatorCount || 0);
  signalDistributors.textContent = formatAmount(summary.distributorCount || 0);
  signalWallets.textContent = formatAmount(summary.uniqueWallets || 0);
  signalSmart.textContent = formatAmount(summary.smartWallets || 0);
  signalMm.textContent = formatAmount(summary.marketMakerWallets || 0);

  signalMovers.innerHTML = "";
  const movers = summary.topMovers || [];
  if (!movers.length) {
    signalMovers.innerHTML = '<div class="signal-item">-</div>';
    return;
  }
  movers.forEach((mover) => {
    const row = document.createElement("div");
    row.className = "signal-item";
    const label = mover.labelName
      ? `${mover.labelName} • ${String(mover.labelType || "unknown").toUpperCase()}`
      : `Label: - • ${String(mover.labelType || "unknown").toUpperCase()}`;
    row.innerHTML = `<div>${mover.tokenSymbol} <span>${label}</span></div>
      <div>$${formatAmount(mover.netUsd || 0)}</div>`;
    signalMovers.appendChild(row);
  });

  const trades = summary.tradeSignals || [];
  tradeList.innerHTML = "";
  if (!trades.length) {
    tradeAction.textContent = "-";
    tradeAction.className = "signal-badge neutral";
    tradeList.innerHTML = '<div class="trade-card">-</div>';
    return;
  }

  tradeAction.textContent = trades[0].action.toUpperCase();
  tradeAction.className = `signal-badge ${trades[0].action === "buy" ? "bullish" : "bearish"}`;
  trades.forEach((trade) => {
    const card = document.createElement("div");
    card.className = "trade-card";
    card.innerHTML = `
      <div class="trade-line">
        <span class="trade-label">Ticker</span>
        <strong>${trade.tokenSymbol || "-"}</strong>
      </div>
      <div class="trade-line">
        <span class="trade-label">Harga</span>
        <strong>$${formatPrice(trade.priceUsd || 0)}</strong>
      </div>
      <div class="trade-inline">
        <span><span class="trade-label">Buy</span> $${formatPrice(
          trade.supportUsd || 0
        )}</span>
        <span><span class="trade-label">Sell</span> $${formatPrice(
          trade.resistanceUsd || 0
        )}</span>
        <span><span class="trade-label">Cutloss</span> $${formatPrice(
          trade.stopLossUsd || 0
        )}</span>
      </div>
    `;
    tradeList.appendChild(card);
  });
}

async function fetchAlerts() {
  let didAbort = false;
  if (currentAbortController) {
    currentAbortController.abort();
  }
  currentAbortController = new AbortController();
  errorMessage.hidden = true;
  errorMessage.dataset.state = "";
  statusPill.textContent = "Mengambil data...";
  statusPill.dataset.state = "loading";
  fetchButton.disabled = true;
  fetchButton.textContent = "Mengambil data...";
  try {
    const params = new URLSearchParams({
      limit: tokenLimitInput.value,
      windowHours: windowHoursInput.value,
      minSupplyPercent: minSupplyInput.value,
      signalTimeframeHours: signalTimeframeInput.value,
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
    renderSignalSummary(payload.summary);
    statusPill.textContent = "Terhubung";
    statusPill.dataset.state = "ready";
    if (payload.warning) {
      errorMessage.textContent = payload.warning;
      errorMessage.dataset.state = "warning";
      errorMessage.hidden = false;
    }
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
    errorMessage.dataset.state = "error";
    errorMessage.hidden = false;
    statusPill.textContent = "Error";
    statusPill.dataset.state = "error";
    renderSignalSummary(null);
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
  statusPill.textContent = "Berhenti";
  statusPill.dataset.state = "error";
});

tokenLimitInput.addEventListener("input", updateSummary);
windowHoursInput.addEventListener("input", updateSummary);
minSupplyInput.addEventListener("input", updateSummary);
refreshMinutesInput.addEventListener("input", () => {
  updateSummary();
  scheduleAutoRefresh();
});
signalTimeframeInput.addEventListener("input", updateSummary);

updateSummary();
renderAlerts([]);
updateAutoButton();
renderSignalSummary(null);
setupCollapsible(tradeToggle, tradeBody, false);
setupCollapsible(sentimentToggle, sentimentBody, true);
