# 求人条件くらべ

厚生労働省の職業安定業務統計から、完全週休二日制、賞与、通勤手当の割合を19産業・2020〜2025年度で探し、最大4産業で比較する日本語Webサービスです。

- Production: <https://kyujin-joken.yhay81.com>
- Source: 厚生労働省「一般職業紹介状況（職業安定業務統計）」第11・13・16表
- Runtime: Cloudflare Workers + Hono JSX + Vite+ + D1
- Account: 不要

## Commands

```powershell
npm install
npm run data:check
npm run check
npm test
npm run build
npm run dev
```

公開前は`npm run release:check`を実行します。D1 migrationを適用してから`npm run deploy`で配信します。

## Data boundary

3条件に共通する「パートタイムを除く常用」の2020〜2025年度だけを収録します。週休二日制は表中の事業所件数、賞与・通勤手当は新規求人数が分母です。3条件を合算した点数や企業ごとの条件は示しません。

コードはMIT Licenseです。データの利用条件は[SOURCE.md](SOURCE.md)を参照してください。
