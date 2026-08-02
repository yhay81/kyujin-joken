import { Hono } from "hono";
import type { Child } from "hono/jsx";

type Bindings = { ASSETS: Fetcher; DB: D1Database };
type EventName =
  | "visited"
  | "searched"
  | "no_result"
  | "year_changed"
  | "metric_changed"
  | "sort_changed"
  | "compared"
  | "copied";

const origin = "https://kyujin-joken.yhay81.com";
const eventNames = new Set<EventName>([
  "visited",
  "searched",
  "no_result",
  "year_changed",
  "metric_changed",
  "sort_changed",
  "compared",
  "copied",
]);
const sessionPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", async (c, next) => {
  await next();
  c.header(
    "Content-Security-Policy",
    "default-src 'self'; base-uri 'none'; connect-src 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self'",
  );
  c.header("Cross-Origin-Opener-Policy", "same-origin");
  c.header("Cross-Origin-Resource-Policy", "same-origin");
  c.header("Permissions-Policy", "camera=(), geolocation=(), microphone=()");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
});

function Layout({
  children,
  description,
  path = "/",
  title,
}: {
  children: Child;
  description: string;
  path?: string;
  title: string;
}) {
  const canonical = `${origin}${path}`;
  return (
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <meta content={description} name="description" />
        <meta content="#253447" name="theme-color" />
        <link href={canonical} rel="canonical" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        <link href="/manifest.webmanifest" rel="manifest" />
        <link href="/styles.css" rel="stylesheet" />
        <meta content="website" property="og:type" />
        <meta content={title} property="og:title" />
        <meta content={description} property="og:description" />
        <meta content={canonical} property="og:url" />
        <meta content={`${origin}/og.svg`} property="og:image" />
        <meta content="求人票の3条件を示すチェック票" property="og:image:alt" />
        <meta content="summary_large_image" name="twitter:card" />
        <title>{title}</title>
      </head>
      <body>
        <header class="site-header">
          <a class="brand" href="/" aria-label="求人条件くらべ トップ">
            <img alt="" height="36" src="/favicon.svg" width="36" />
            <span>求人条件くらべ</span>
          </a>
          <nav aria-label="主要メニュー">
            <a href="/">比べる</a>
            <a href="/guide">見方</a>
            <a href="/source">出典</a>
            <a href="/privacy">保存</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer>
          <p>出典：厚生労働省「一般職業紹介状況（職業安定業務統計）」を加工して作成。</p>
          <div>
            <a href="/source">データと加工</a>
            <a href="/privacy">保存と計測</a>
            <a href="https://github.com/yhay81/kyujin-joken">ソースコード</a>
          </div>
        </footer>
      </body>
    </html>
  );
}

function HomePage() {
  return (
    <Layout
      description="厚生労働省の2025年度までの統計から、週休二日制、賞与、通勤手当の割合を19産業・2020〜2025年度で比較できます。"
      title="産業別に求人条件の割合を比較 | 求人条件くらべ"
    >
      <section class="intro-shell">
        <div class="intro-copy">
          <p class="eyebrow">2025年度まで・19産業</p>
          <h1>
            求人票の条件を、
            <br />
            産業ごとに。
          </h1>
          <p>
            週休二日制、賞与、通勤手当。厚生労働省の集計から、条件のある割合と6年の動きを並べます。
          </p>
          <a class="start-link" href="#finder">
            条件を選んで見る <span aria-hidden="true">↓</span>
          </a>
        </div>
        <div class="condition-board" aria-label="求人条件を表す3枚の確認票">
          <div class="board-clip" aria-hidden="true"></div>
          <article class="condition-slip slip-weekend">
            <span class="slip-icon">休</span>
            <div>
              <b>週休二日制</b>
              <small>完全実施とその他</small>
            </div>
            <i>✓</i>
          </article>
          <article class="condition-slip slip-bonus">
            <span class="slip-icon">賞</span>
            <div>
              <b>賞与</b>
              <small>あり・なし</small>
            </div>
            <i>✓</i>
          </article>
          <article class="condition-slip slip-commute">
            <span class="slip-icon">通</span>
            <div>
              <b>通勤手当</b>
              <small>支給方法となし</small>
            </div>
            <i>✓</i>
          </article>
          <p class="board-note">
            同じ「割合」でも分母が違います。
            <br />
            条件ごとに分けて読みます。
          </p>
        </div>
      </section>

      <section class="finder-shell" id="finder">
        <div class="metric-tabs" aria-label="比べる条件">
          <button class="metric-tab active" data-metric="weekend" type="button">
            <span>休</span>
            <b>完全週休二日</b>
            <small>事業所件数の割合</small>
          </button>
          <button class="metric-tab" data-metric="bonus" type="button">
            <span>賞</span>
            <b>賞与あり</b>
            <small>新規求人数の割合</small>
          </button>
          <button class="metric-tab" data-metric="commute" type="button">
            <span>通</span>
            <b>通勤手当あり</b>
            <small>新規求人数の割合</small>
          </button>
        </div>
        <div class="controls">
          <label class="search-field">
            <span>産業名</span>
            <input
              autocomplete="off"
              id="search"
              placeholder="例：情報通信、医療、製造"
              type="search"
            />
          </label>
          <label>
            <span>年度</span>
            <select id="year"></select>
          </label>
          <label>
            <span>並び順</span>
            <select id="sort">
              <option value="source">公式表の順</option>
              <option value="value-desc">割合が高い順</option>
              <option value="change-desc">前年差が大きい順</option>
              <option value="name">名前順</option>
            </select>
          </label>
        </div>
        <div class="finder-status">
          <p id="data-status">公式データを読み込んでいます</p>
          <p>
            <span id="result-count">0</span> 産業
          </p>
        </div>
        <div class="boundary-card" id="boundary-note">
          <span>分母</span>
          <p>完全週休二日制を実施する事業所件数 ÷ 表の事業所合計。求人件数の割合ではありません。</p>
        </div>
        <div class="results" id="results" aria-live="polite"></div>
      </section>

      <aside class="compare-drawer" id="compare-drawer" aria-label="比較リスト">
        <div class="compare-head">
          <div>
            <p>比較リスト</p>
            <h2>
              <span id="compare-count">0</span> / 4 産業
            </h2>
          </div>
          <button id="clear-compare" type="button">
            すべて外す
          </button>
        </div>
        <div class="compare-list" id="compare-list"></div>
        <button class="copy-button" disabled id="copy-compare" type="button">
          比較をコピー
        </button>
      </aside>
      <script src="/app.js" type="module"></script>
    </Layout>
  );
}

function GuidePage() {
  return (
    <Layout
      description="求人条件くらべの分母、割合、年度差の読み方を説明します。"
      path="/guide"
      title="数字の見方 | 求人条件くらべ"
    >
      <div class="page-intro">
        <p class="eyebrow">GUIDE</p>
        <h1>同じ割合に、しない。</h1>
        <p>3条件は集計単位が異なります。横並びの総合点にはせず、それぞれの分母で読みます。</p>
      </div>
      <section class="prose-grid">
        <article>
          <span class="prose-mark">休</span>
          <h2>完全週休二日</h2>
          <p>
            「パートタイムを除く常用」の週休二日制表で、完全実施事業所件数を表の事業所合計で割ります。その他の実施と無実施も内訳で確認できます。
          </p>
        </article>
        <article>
          <span class="prose-mark">賞</span>
          <h2>賞与あり</h2>
          <p>
            賞与ありの新規求人数を、賞与あり・なしの合計で割ります。実際の支給額、支給回数、採用後の支給保証は示しません。
          </p>
        </article>
        <article>
          <span class="prose-mark">通</span>
          <h2>通勤手当あり</h2>
          <p>
            上限あり・上限なし・一定額支給の新規求人数を、支給なしを含む合計で割ります。支給額や実費との差は分かりません。
          </p>
        </article>
      </section>
      <section class="prose-section">
        <h2>年度差の読み方</h2>
        <p>
          カードの差は選択年度と直前年度の割合の差で、単位はポイントです。求人の質、会社ごとの条件、採用されやすさを順位づけする値ではありません。2024年度から日本標準産業分類の改定に基づく区分です。
        </p>
      </section>
    </Layout>
  );
}

function SourcePage() {
  return (
    <Layout
      description="求人条件くらべが利用する厚生労働省の3つの公式Excelと加工方法です。"
      path="/source"
      title="出典と加工 | 求人条件くらべ"
    >
      <div class="page-intro">
        <p class="eyebrow">SOURCE</p>
        <h1>3つの公式表、19産業。</h1>
        <p>
          2020〜2025年度の「パートタイムを除く常用」にそろえ、条件ごとの件数から割合を計算します。
        </p>
      </div>
      <section class="source-cards">
        <a href="https://www.mhlw.go.jp/toukei/list/xls/114-1d-11.xlsx">
          <span>第11表</span>
          <b>週休二日制の有無</b>
          <small>公式Excelを開く ↗</small>
        </a>
        <a href="https://www.mhlw.go.jp/toukei/list/xls/114-1d-13.xlsx">
          <span>第13表</span>
          <b>賞与の有無</b>
          <small>公式Excelを開く ↗</small>
        </a>
        <a href="https://www.mhlw.go.jp/toukei/list/xls/114-1d-16.xlsx">
          <span>第16表</span>
          <b>通勤手当の有無</b>
          <small>公式Excelを開く ↗</small>
        </a>
      </section>
      <section class="prose-section">
        <h2>行った加工</h2>
        <ul>
          <li>3表からパートタイムを除く常用の2020〜2025年度だけを抽出しました。</li>
          <li>19産業へ安定IDを付け、各区分の合計一致を検査しました。</li>
          <li>割合と前年差は件数からブラウザで計算し、小数第1位で表示します。</li>
          <li>
            2019年度以降の週休二日制は、完全実施以外を公式表どおり「その他の実施」にまとめます。
          </li>
          <li>出典：厚生労働省「一般職業紹介状況（職業安定業務統計）」を加工して作成。</li>
        </ul>
      </section>
      <p class="source-links">
        <a href="https://www.mhlw.go.jp/toukei/list/114-1d.html">統計一覧</a>
        <a href="https://www.mhlw.go.jp/toukei/list/114-1_yougo.html">用語の解説</a>
        <a href="https://www.mhlw.go.jp/chosakuken/index.html">利用条件</a>
      </p>
    </Layout>
  );
}

function PrivacyPage() {
  return (
    <Layout
      description="求人条件くらべの端末保存と匿名計測について説明します。"
      path="/privacy"
      title="保存と計測 | 求人条件くらべ"
    >
      <div class="page-intro">
        <p class="eyebrow">PRIVACY</p>
        <h1>選んだ産業は、端末だけに。</h1>
        <p>アカウント、Cookie、外部解析は使いません。</p>
      </div>
      <section class="prose-grid two">
        <article>
          <span class="prose-mark">端</span>
          <h2>端末に保存</h2>
          <p>
            比較へ加えた最大4産業の公開IDだけをlocalStorageへ保存します。ブラウザのサイトデータ削除で消せます。
          </p>
        </article>
        <article>
          <span class="prose-mark">匿</span>
          <h2>匿名の操作計測</h2>
          <p>
            ランダムIDのハッシュ、許可済み操作名、QA区分、時刻だけを35日保存します。検索語、産業、年度、割合、IPアドレス、User-Agentはイベント行へ保存しません。
          </p>
        </article>
      </section>
      <section class="prose-section">
        <h2>追跡しない設定</h2>
        <p>
          Do Not TrackまたはGlobal Privacy
          Controlが有効な場合、操作イベントを送信しません。広告、外部画像、フィンガープリントを使いません。
        </p>
      </section>
    </Layout>
  );
}

function NotFoundPage() {
  return (
    <Layout
      description="ページが見つかりません。"
      path="/404"
      title="ページが見つかりません | 求人条件くらべ"
    >
      <div class="not-found">
        <span>404</span>
        <h1>この票は見つかりません。</h1>
        <a href="/">条件を比べる</a>
      </div>
    </Layout>
  );
}

app.get("/", (c) => c.html(<HomePage />));
app.get("/guide", (c) => c.html(<GuidePage />));
app.get("/source", (c) => c.html(<SourcePage />));
app.get("/privacy", (c) => c.html(<PrivacyPage />));
app.get("/health", async (c) => {
  const row = await c.env.DB.prepare("SELECT 1 AS ok").first<{ ok: number }>();
  return c.json({
    asOf: "2026-08-02",
    industries: 19,
    ok: row?.ok === 1,
    service: "kyujin-joken",
    years: 6,
  });
});
app.get("/sitemap.xml", (c) => {
  const urls = ["/", "/guide", "/source", "/privacy"]
    .map((path) => `<url><loc>${origin}${path}</loc></url>`)
    .join("");
  return c.body(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    200,
    { "Content-Type": "application/xml; charset=utf-8" },
  );
});
app.post("/api/telemetry", async (c) => {
  if (c.req.header("origin") !== origin) return c.json({ error: "forbidden" }, 403);
  const length = Number(c.req.header("content-length") ?? 0);
  if (length > 512) return c.json({ error: "too_large" }, 413);
  let body: { name?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }
  if (typeof body.name !== "string" || !eventNames.has(body.name as EventName))
    return c.json({ error: "invalid_event" }, 400);
  const session = (c.req.header("x-kyujin-joken-session") ?? "").toLowerCase();
  if (!sessionPattern.test(session)) return c.json({ error: "invalid_session" }, 400);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(session));
  const hash = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  await c.env.DB.prepare(
    "INSERT INTO product_events (session_hash,event_name,is_qa,created_at) VALUES (?,?,?,?)",
  )
    .bind(
      hash,
      body.name,
      c.req.header("x-kyujin-joken-qa") === "1" ? 1 : 0,
      Math.floor(Date.now() / 1000),
    )
    .run();
  return c.body(null, 202);
});
app.notFound((c) => c.html(<NotFoundPage />, 404));

export { app };
export default {
  fetch: app.fetch,
  async scheduled(_controller: ScheduledController, env: Bindings) {
    await env.DB.prepare(
      "DELETE FROM product_events WHERE created_at < unixepoch() - 35 * 86400",
    ).run();
  },
};
