const STORAGE_KEY = "kyujin-joken:compare:v1";
const MAX_COMPARE = 4;
const metricInfo = {
  weekend: {
    label: "完全週休二日",
    short: "完全実施",
    boundary: "完全週休二日制を実施する事業所件数 ÷ 表の事業所合計。求人件数の割合ではありません。",
    denominator: "事業所件数",
  },
  bonus: {
    label: "賞与あり",
    short: "賞与あり",
    boundary:
      "賞与ありの新規求人数 ÷ 賞与あり・なしの新規求人数合計。支給額や採用後の支給保証は示しません。",
    denominator: "新規求人数",
  },
  commute: {
    label: "通勤手当あり",
    short: "支給あり",
    boundary:
      "上限あり・上限なし・一定額支給の新規求人数 ÷ 支給なしを含む合計。支給額は示しません。",
    denominator: "新規求人数",
  },
};

const search = /** @type {HTMLInputElement} */ (document.querySelector("#search"));
const yearSelect = /** @type {HTMLSelectElement} */ (document.querySelector("#year"));
const sortSelect = /** @type {HTMLSelectElement} */ (document.querySelector("#sort"));
const results = /** @type {HTMLElement} */ (document.querySelector("#results"));
const resultCount = /** @type {HTMLElement} */ (document.querySelector("#result-count"));
const dataStatus = /** @type {HTMLElement} */ (document.querySelector("#data-status"));
const boundaryNote = /** @type {HTMLElement} */ (document.querySelector("#boundary-note p"));
const compareDrawer = /** @type {HTMLElement} */ (document.querySelector("#compare-drawer"));
const compareList = /** @type {HTMLElement} */ (document.querySelector("#compare-list"));
const compareCount = /** @type {HTMLElement} */ (document.querySelector("#compare-count"));
const clearCompare = /** @type {HTMLButtonElement} */ (document.querySelector("#clear-compare"));
const copyCompare = /** @type {HTMLButtonElement} */ (document.querySelector("#copy-compare"));
const metricTabs = [...document.querySelectorAll(".metric-tab")];

/** @type {{years:number[], edition:string, industryCount:number}} */
let index = { years: [], edition: "", industryCount: 0 };
/** @type {Array<any>} */
let records = [];
let metric = "weekend";
let yearIndex = 0;
let selected = loadSelected();
let searchTimer = 0;

function loadSelected() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(value)
      ? value.filter((item) => typeof item === "string").slice(0, MAX_COMPARE)
      : [];
  } catch {
    return [];
  }
}

function saveSelected() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
}

function getSession() {
  const key = "kyujin-joken:session:v1";
  let session = sessionStorage.getItem(key);
  if (!session) {
    session = crypto.randomUUID();
    sessionStorage.setItem(key, session);
  }
  return session;
}

function isQa() {
  const privacyNavigator = /** @type {Navigator & {globalPrivacyControl?: boolean}} */ (navigator);
  return (
    new URLSearchParams(location.search).get("qa") === "1" ||
    navigator.webdriver === true ||
    privacyNavigator.globalPrivacyControl === true ||
    navigator.doNotTrack === "1"
  );
}

async function track(name) {
  const privacyNavigator = /** @type {Navigator & {globalPrivacyControl?: boolean}} */ (navigator);
  if (navigator.doNotTrack === "1" || privacyNavigator.globalPrivacyControl === true) return;
  try {
    await fetch("/api/telemetry", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-kyujin-joken-session": getSession(),
        "x-kyujin-joken-qa": isQa() ? "1" : "0",
      },
      body: JSON.stringify({ name }),
      keepalive: true,
    });
  } catch {
    // Product use never depends on telemetry.
  }
}

function normalize(value) {
  return value.normalize("NFKC").toLocaleLowerCase("ja").replace(/\s+/gu, "");
}

function percent(numerator, denominator) {
  return denominator ? (100 * numerator) / denominator : 0;
}

function metricValue(record, selectedMetric = metric, selectedYear = yearIndex) {
  if (selectedMetric === "weekend")
    return percent(record.weekend.complete[selectedYear], record.weekend.total[selectedYear]);
  if (selectedMetric === "bonus")
    return percent(
      record.bonus.yes[selectedYear],
      record.bonus.yes[selectedYear] + record.bonus.no[selectedYear],
    );
  const provided =
    record.commute.upperLimit[selectedYear] +
    record.commute.noLimit[selectedYear] +
    record.commute.fixed[selectedYear];
  return percent(provided, provided + record.commute.none[selectedYear]);
}

function changeValue(record) {
  if (yearIndex === 0) return null;
  return metricValue(record, metric, yearIndex) - metricValue(record, metric, yearIndex - 1);
}

function parts(record) {
  if (metric === "weekend") {
    const total = record.weekend.total[yearIndex];
    return [
      {
        label: "完全実施",
        value: percent(record.weekend.complete[yearIndex], total),
        className: "primary",
      },
      {
        label: "その他実施",
        value: percent(record.weekend.other[yearIndex], total),
        className: "secondary",
      },
      { label: "無実施", value: percent(record.weekend.none[yearIndex], total), className: "none" },
    ];
  }
  if (metric === "bonus") {
    const total = record.bonus.yes[yearIndex] + record.bonus.no[yearIndex];
    return [
      { label: "あり", value: percent(record.bonus.yes[yearIndex], total), className: "primary" },
      { label: "なし", value: percent(record.bonus.no[yearIndex], total), className: "none" },
    ];
  }
  const values = [
    record.commute.upperLimit[yearIndex],
    record.commute.noLimit[yearIndex],
    record.commute.fixed[yearIndex],
    record.commute.none[yearIndex],
  ];
  const total = values.reduce((sum, value) => sum + value, 0);
  return [
    { label: "上限あり", value: percent(values[0], total), className: "primary" },
    { label: "上限なし", value: percent(values[1], total), className: "secondary" },
    { label: "一定額", value: percent(values[2], total), className: "tertiary" },
    { label: "なし", value: percent(values[3], total), className: "none" },
  ];
}

function formatPercent(value) {
  return `${value.toFixed(1)}%`;
}

function formatChange(value) {
  if (value === null) return "前年差なし";
  if (Math.abs(value) < 0.05) return "前年差 ±0.0 pt";
  return `前年差 ${value > 0 ? "+" : ""}${value.toFixed(1)} pt`;
}

function trendSvg(record) {
  const values = index.years.map((_, position) => metricValue(record, metric, position));
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const span = Math.max(1, maximum - minimum);
  const points = values
    .map((value, position) => `${8 + position * 23},${34 - ((value - minimum) / span) * 25}`)
    .join(" ");
  return `<svg aria-label="${index.years[0]}年度から${index.years.at(-1)}年度までの推移" class="sparkline" role="img" viewBox="0 0 131 42"><path d="M8 34H123"/><polyline points="${points}"/><circle cx="${8 + yearIndex * 23}" cy="${34 - ((values[yearIndex] - minimum) / span) * 25}" r="3.5"/></svg>`;
}

function distribution(record) {
  const segments = parts(record);
  return `<div class="distribution" aria-label="内訳">${segments.map((part) => `<span class="segment ${part.className}" style="width:${part.value}%" title="${part.label} ${formatPercent(part.value)}"></span>`).join("")}</div><div class="legend">${segments.map((part) => `<span><i class="${part.className}"></i>${part.label} ${formatPercent(part.value)}</span>`).join("")}</div>`;
}

function filteredRecords() {
  const query = normalize(search.value);
  const filtered = records.filter(
    (record) =>
      !query || normalize(record.name).includes(query) || normalize(record.id).includes(query),
  );
  if (sortSelect.value === "value-desc") filtered.sort((a, b) => metricValue(b) - metricValue(a));
  if (sortSelect.value === "change-desc")
    filtered.sort((a, b) => (changeValue(b) ?? -Infinity) - (changeValue(a) ?? -Infinity));
  if (sortSelect.value === "name") filtered.sort((a, b) => a.name.localeCompare(b.name, "ja"));
  return filtered;
}

function renderResults() {
  const filtered = filteredRecords();
  resultCount.textContent = String(filtered.length);
  if (filtered.length === 0) {
    results.innerHTML =
      '<div class="no-results"><span>0</span><h3>一致する産業がありません</h3><p>産業名を短くするか、別の言葉で探してください。</p></div>';
    return;
  }
  results.innerHTML = filtered
    .map((record) => {
      const active = selected.includes(record.id);
      const value = metricValue(record);
      return `<article class="industry-card ${active ? "selected" : ""}" data-id="${record.id}">
        <div class="card-tab">${record.id}</div>
        <div class="card-heading"><div><p>${metricInfo[metric].denominator}</p><h3>${record.name}</h3></div><button aria-pressed="${active}" class="compare-toggle" data-id="${record.id}" type="button">${active ? "比較中" : "比較する"}</button></div>
        <div class="card-main"><div class="percent-block"><strong>${formatPercent(value)}</strong><span>${formatChange(changeValue(record))}</span></div>${trendSvg(record)}</div>
        ${distribution(record)}
        <p class="card-foot">${index.years[yearIndex]}年度 · ${metricInfo[metric].short}</p>
      </article>`;
    })
    .join("");
  for (const button of results.querySelectorAll(".compare-toggle"))
    button.addEventListener("click", () => toggleCompare(button.getAttribute("data-id") ?? ""));
}

function toggleCompare(id) {
  if (!id) return;
  if (selected.includes(id)) selected = selected.filter((item) => item !== id);
  else if (selected.length < MAX_COMPARE) selected = [...selected, id];
  else {
    compareDrawer.classList.add("limit-reached");
    setTimeout(() => compareDrawer.classList.remove("limit-reached"), 500);
    return;
  }
  saveSelected();
  renderResults();
  renderCompare();
  track("compared");
}

function renderCompare() {
  const chosen = selected.map((id) => records.find((record) => record.id === id)).filter(Boolean);
  compareCount.textContent = String(chosen.length);
  compareDrawer.classList.toggle("has-items", chosen.length > 0);
  copyCompare.disabled = chosen.length === 0;
  compareList.innerHTML = chosen.length
    ? chosen
        .map(
          (record) =>
            `<div class="compare-row"><span>${record.id}</span><div><b>${record.name}</b><small>${index.years[yearIndex]}年度 ${metricInfo[metric].label}</small></div><strong>${formatPercent(metricValue(record))}</strong><button aria-label="${record.name}を比較から外す" data-remove="${record.id}" type="button">×</button></div>`,
        )
        .join("")
    : '<p class="compare-empty">産業カードの「比較する」から、最大4件を並べられます。</p>';
  for (const button of compareList.querySelectorAll("[data-remove]"))
    button.addEventListener("click", () => toggleCompare(button.getAttribute("data-remove") ?? ""));
}

function setMetric(nextMetric) {
  if (!(nextMetric in metricInfo)) return;
  metric = nextMetric;
  for (const tab of metricTabs) {
    const active = tab.getAttribute("data-metric") === metric;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-pressed", String(active));
  }
  boundaryNote.textContent = metricInfo[metric].boundary;
  renderResults();
  renderCompare();
}

function copyComparison() {
  const chosen = selected.map((id) => records.find((record) => record.id === id)).filter(Boolean);
  const lines = [
    `求人条件くらべ｜${index.years[yearIndex]}年度 ${metricInfo[metric].label}`,
    ...chosen.map(
      (record) =>
        `${record.name}: ${formatPercent(metricValue(record))}（${formatChange(changeValue(record))}）`,
    ),
    `出典：厚生労働省「一般職業紹介状況（職業安定業務統計）」`,
    location.origin,
  ];
  navigator.clipboard.writeText(lines.join("\n")).then(() => {
    copyCompare.textContent = "コピーしました";
    setTimeout(() => {
      copyCompare.textContent = "比較をコピー";
    }, 1400);
    track("copied");
  });
}

async function start() {
  const [indexResponse, dataResponse] = await Promise.all([
    fetch("/data/index.json"),
    fetch("/data/conditions.json"),
  ]);
  if (!indexResponse.ok || !dataResponse.ok) throw new Error("data unavailable");
  index = await indexResponse.json();
  records = await dataResponse.json();
  yearIndex = index.years.length - 1;
  yearSelect.innerHTML = index.years
    .map(
      (year, position) =>
        `<option value="${position}" ${position === yearIndex ? "selected" : ""}>${year}年度</option>`,
    )
    .join("");
  selected = selected.filter((id) => records.some((record) => record.id === id));
  saveSelected();
  dataStatus.textContent = `${index.edition} · パートタイムを除く常用 · ${index.industryCount}産業`;
  setMetric(metric);
  track("visited");
}

for (const tab of metricTabs)
  tab.addEventListener("click", () => {
    setMetric(tab.getAttribute("data-metric") ?? "");
    track("metric_changed");
  });
yearSelect.addEventListener("change", () => {
  yearIndex = Number(yearSelect.value);
  renderResults();
  renderCompare();
  track("year_changed");
});
sortSelect.addEventListener("change", () => {
  renderResults();
  track("sort_changed");
});
search.addEventListener("input", () => {
  renderResults();
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    if (!search.value.trim()) return;
    track(filteredRecords().length ? "searched" : "no_result");
  }, 450);
});
clearCompare.addEventListener("click", () => {
  selected = [];
  saveSelected();
  renderResults();
  renderCompare();
});
copyCompare.addEventListener("click", copyComparison);

start().catch(() => {
  dataStatus.textContent = "データを読み込めませんでした。時間をおいて再読み込みしてください。";
  results.innerHTML = '<div class="no-results"><span>!</span><h3>読み込みに失敗しました</h3></div>';
});
