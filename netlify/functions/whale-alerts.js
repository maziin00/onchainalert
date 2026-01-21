const CMC_BASE = "https://pro-api.coinmarketcap.com/v1";
const ARKHAM_BASE = "https://api.arkm.com";
const MAX_TOKEN_LIMIT = 15;

function normalizeAddress(address) {
  return (address || "").toLowerCase();
}

function isValidEthAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address || "");
}

function isEthereumPlatform(platform) {
  const name = (platform?.name || "").toLowerCase();
  const symbol = (platform?.symbol || "").toLowerCase();
  const slug = (platform?.slug || "").toLowerCase();
  return name === "ethereum" || symbol === "eth" || slug === "ethereum";
}

function normalizeEntityType(type) {
  const normalized = (type || "").toLowerCase();
  if (normalized === "cex" || normalized === "exchange") {
    return "cex";
  }
  if (normalized === "dex") {
    return "dex";
  }
  if (normalized === "individual" || normalized === "wallet") {
    return "wallet";
  }
  if (normalized === "fund") {
    return "fund";
  }
  if (normalized === "market_maker" || normalized === "market-maker" || normalized === "mm") {
    return "mm";
  }
  if (normalized === "smart_money" || normalized === "smart-money") {
    return "smart";
  }
  if (normalized === "defi") {
    return "defi";
  }
  if (normalized === "bridge") {
    return "bridge";
  }
  if (normalized === "protocol") {
    return "protocol";
  }
  return normalized || "unknown";
}

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed (${response.status}): ${text}`);
  }
  return response.json();
}

async function fetchArkhamJson(path, apiKey) {
  if (process.env.DEBUG_ARKHAM === "1") {
    console.log(`[arkham] GET ${path}`);
  }
  const response = await fetch(`${ARKHAM_BASE}${path}`, {
    headers: {
      "API-Key": apiKey,
    },
  });
  if (!response.ok) {
    const text = await response.text();
    if (process.env.DEBUG_ARKHAM === "1") {
      console.log(`[arkham] ${response.status} ${text}`);
    }
    throw new Error(`Arkham request failed (${response.status}): ${text}`);
  }
  return response.json();
}

async function getTopTokens(limit, cmcApiKey) {
  const url = `${CMC_BASE}/cryptocurrency/listings/latest?limit=${limit}&convert=USD`;
  const data = await fetchJson(url, {
    headers: {
      "X-CMC_PRO_API_KEY": cmcApiKey,
    },
  });
  return data.data ?? [];
}

async function getArkhamLabelMap(apiKey) {
  const data = await fetchArkhamJson("/user/labels", apiKey);
  const labels = Array.isArray(data) ? data : data?.labels ?? [];
  const labelMap = new Map();
  for (const label of labels) {
    if (!label?.address || label.chainType !== "evm") {
      continue;
    }
    const address = normalizeAddress(label.address);
    labelMap.set(address, {
      name: label.name || "Unknown",
      note: label.note || "",
    });
  }
  return labelMap;
}

async function getTokenTransfers(contractAddress, arkhamApiKey, windowHours) {
  const timeLast = `${Math.max(1, Math.round(windowHours))}h`;
  const params = new URLSearchParams({
    chains: "ethereum",
    tokens: contractAddress,
    flow: "all",
    timeLast,
    sortKey: "time",
    sortDir: "desc",
    limit: "200",
    offset: "0",
  });
  const payload = await fetchArkhamJson(`/transfers?${params.toString()}`, arkhamApiKey);
  return payload.transfers ?? [];
}

function filterByWindow(transfers, windowHours) {
  const now = Date.now();
  const start = now - windowHours * 60 * 60 * 1000;
  return transfers.filter((transfer) => {
    const timestampMs = Date.parse(transfer.blockTimestamp || "") || 0;
    return timestampMs >= start && timestampMs <= now;
  });
}

function getTransferAmount(transfer) {
  if (Number.isFinite(transfer.unitValue)) {
    return transfer.unitValue;
  }
  const raw =
    transfer.value ??
    transfer.amount ??
    transfer.tokenAmount ??
    transfer.quantity ??
    transfer.rawValue ??
    0;
  const decimals = parseNumber(transfer.tokenDecimals);
  const value = parseNumber(raw);
  return decimals > 0 ? value / Math.pow(10, decimals) : value;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeNetFlows(transfers) {
  const flows = new Map();
  for (const transfer of transfers) {
    const from = normalizeAddress(transfer.fromAddress?.address);
    const to = normalizeAddress(transfer.toAddress?.address);
    const value = getTransferAmount(transfer);
    const usdValue = parseNumber(transfer.historicalUSD);
    if (!from || !to) {
      continue;
    }
    const fromEntity = transfer.fromAddress?.arkhamEntity;
    const fromLabel = transfer.fromAddress?.arkhamLabel;
    const toEntity = transfer.toAddress?.arkhamEntity;
    const toLabel = transfer.toAddress?.arkhamLabel;
    const fromLabelName = fromEntity?.name || fromLabel?.name || "";
    const toLabelName = toEntity?.name || toLabel?.name || "";
    const fromType = normalizeEntityType(fromEntity?.type);
    const toType = normalizeEntityType(toEntity?.type);
    if (!flows.has(from)) {
      flows.set(from, {
        address: from,
        inflow: 0,
        outflow: 0,
        inflowUsd: 0,
        outflowUsd: 0,
        labelName: fromLabelName,
        labelType: fromType,
      });
    }
    if (!flows.has(to)) {
      flows.set(to, {
        address: to,
        inflow: 0,
        outflow: 0,
        inflowUsd: 0,
        outflowUsd: 0,
        labelName: toLabelName,
        labelType: toType,
      });
    }
    const fromEntry = flows.get(from);
    const toEntry = flows.get(to);
    flows.set(from, {
      ...fromEntry,
      outflow: fromEntry.outflow + value,
      outflowUsd: fromEntry.outflowUsd + usdValue,
      labelName: fromEntry.labelName || fromLabelName,
      labelType: fromEntry.labelType === "unknown" ? fromType : fromEntry.labelType,
    });
    flows.set(to, {
      ...toEntry,
      inflow: toEntry.inflow + value,
      inflowUsd: toEntry.inflowUsd + usdValue,
      labelName: toEntry.labelName || toLabelName,
      labelType: toEntry.labelType === "unknown" ? toType : toEntry.labelType,
    });
  }
  return Array.from(flows.values()).map((flow) => ({
    ...flow,
    net: flow.inflow - flow.outflow,
    netUsd: flow.inflowUsd - flow.outflowUsd,
  }));
}

function buildAlerts({ tokenSymbol, totalSupply, netFlows, minSupplyPercent, labelLookup }) {
  const alerts = [];
  for (const flow of netFlows) {
    const supplyPercent = totalSupply === 0 ? 0 : (flow.net / totalSupply) * 100;
    if (Math.abs(supplyPercent) < minSupplyPercent) {
      continue;
    }
    const label = labelLookup?.get(normalizeAddress(flow.address));
    const labelName = label?.name || flow.labelName || "";
    const labelType = flow.labelType || "unknown";
    alerts.push({
      tokenSymbol,
      address: flow.address,
      netFlow: flow.net,
      netFlowUsd: flow.netUsd,
      inflowUsd: flow.inflowUsd,
      outflowUsd: flow.outflowUsd,
      supplyPercent,
      direction: flow.net > 0 ? "accumulate" : "distribution",
      labelName,
      labelType,
      labelNote: label?.note || "",
    });
  }
  return alerts.sort((a, b) => Math.abs(b.supplyPercent) - Math.abs(a.supplyPercent));
}

export default async (request) => {
  try {
    const debugEnabled = process.env.DEBUG_ARKHAM === "1";
    const url = new URL(request.url);
    const requestedLimit = parseNumber(url.searchParams.get("limit") ?? "50");
    const limit = Math.max(1, Math.min(requestedLimit, MAX_TOKEN_LIMIT));
    const windowHours = parseNumber(url.searchParams.get("windowHours") ?? "24");
    const minSupplyPercent = parseNumber(url.searchParams.get("minSupplyPercent") ?? "0.1");

    const cmcApiKey = process.env.CMC_API_KEY;
    const arkhamApiKey = process.env.ARKHAM_API_KEY;

    if (!cmcApiKey || !arkhamApiKey) {
      return new Response(
        JSON.stringify({ error: "Missing CMC_API_KEY or ARKHAM_API_KEY env vars." }),
        { status: 500 }
      );
    }

    const labelLookup = await getArkhamLabelMap(arkhamApiKey);

    const warning =
      requestedLimit > MAX_TOKEN_LIMIT
        ? `Limit token dipangkas ke ${MAX_TOKEN_LIMIT} agar tidak timeout di Netlify.`
        : "";

    const tokens = await getTopTokens(limit, cmcApiKey);
    const alerts = [];
    let loggedSample = false;

    for (const token of tokens) {
      const platform = token.platform ?? {};
      const tokenAddress = platform.token_address;
      if (!tokenAddress || !isEthereumPlatform(platform) || !isValidEthAddress(tokenAddress)) {
        continue;
      }
      const transfers = await getTokenTransfers(tokenAddress, arkhamApiKey, windowHours);
      if (debugEnabled && !loggedSample && transfers.length > 0) {
        const sample = transfers[0];
        console.log("[arkham] transfer sample", {
          keys: Object.keys(sample),
          value: sample.value,
          amount: sample.amount,
          tokenAmount: sample.tokenAmount,
          quantity: sample.quantity,
          rawValue: sample.rawValue,
          unitValue: sample.unitValue,
          historicalUSD: sample.historicalUSD,
          tokenDecimals: sample.tokenDecimals,
          tokenSymbol: sample.tokenSymbol,
          from: sample.fromAddress?.address,
          to: sample.toAddress?.address,
        });
        loggedSample = true;
      }
      const windowed = filterByWindow(transfers, windowHours);
      const netFlows = computeNetFlows(windowed);
      const supply = parseNumber(token.circulating_supply || token.total_supply || 0);
      const tokenAlerts = buildAlerts({
        tokenSymbol: token.symbol,
        totalSupply: supply,
        netFlows,
        minSupplyPercent,
        labelLookup,
      });
      alerts.push(...tokenAlerts.slice(0, 3));
      await sleep(1100);
    }

    return new Response(
      JSON.stringify({
        alerts,
        warning,
        requestedLimit,
        appliedLimit: limit,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
