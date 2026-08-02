# Source and transformation

## Official sources

- Provider: 厚生労働省
- Statistics page: <https://www.mhlw.go.jp/toukei/list/114-1d.html>
- Definitions: <https://www.mhlw.go.jp/toukei/list/114-1_yougo.html>
- 第11表「週休二日制の有無」: <https://www.mhlw.go.jp/toukei/list/xls/114-1d-11.xlsx>
- 第13表「賞与の有無」: <https://www.mhlw.go.jp/toukei/list/xls/114-1d-13.xlsx>
- 第16表「通勤手当の有無」: <https://www.mhlw.go.jp/toukei/list/xls/114-1d-16.xlsx>
- Edition: 2025年度（令和7年度）
- Source verification: 2026-08-02
- Terms: 公共データ利用規約（第1.0版）
- Terms page: <https://www.mhlw.go.jp/chosakuken/index.html>

出典：厚生労働省「一般職業紹介状況（職業安定業務統計）」を加工して作成。

## Verified source files

| 表     |  Bytes | SHA-256                                                            |
| ------ | -----: | ------------------------------------------------------------------ |
| 第11表 | 33,761 | `29f327bdec9cdec90be27ef9a4dfee428df00aa2653c8ddd44f5b7c8cc16b730` |
| 第13表 | 36,517 | `6733b6040ec11e0264715d70713f2ffaff9de48c8d07d3168c988c1bd3ad8027` |
| 第16表 | 42,121 | `df1ce802a1121d2932ca6946ea8af92861c7e74d3c8315b9bfdd0182c2f390bb` |

## Verified dimensions

- 産業計と18産業、計19行
- 2020〜2025年度の6時点
- 雇用区分は全条件で「パートタイムを除く常用」
- 週休二日制は合計、完全実施、その他実施、無実施
- 賞与はあり・なし、通勤手当は上限あり・上限なし・一定額支給・支給なし
- 全行・全年で週休二日制の内訳合計が表の合計と一致
- すべての系列は欠損なし、非負整数

2025年度の産業計は、完全週休二日制58.5%、週休二日制の何らかの実施98.3%、賞与あり82.7%、通勤手当あり92.1%です。割合は製品内で公式件数から計算し、元の件数もJSONに保持します。

## Transformation / 加工

1. 3つのExcelから、パートタイムを除く常用の2020〜2025年度を抽出する。
2. 19産業を公式表の順序に沿った公開IDへ対応させる。
3. 2019年度分以降の第11表に合わせ、完全実施以外の週休二日制実施事業所を「その他実施」にまとめる。
4. 条件ごとの区分件数と合計を静的JSONへ保存する。
5. ブラウザで各条件の割合と直前年度からのポイント差を計算する。

件数を推測・補完しません。公式Excelのハッシュが変わった場合は更新内容を人が確認します。

## Interpretation boundary

週休二日制の表は事業所件数、賞与と通勤手当の表は新規求人数を集計しています。割合を同じ分母とみなして加算、平均、総合点化しません。賞与額・回数、通勤手当額、実際の休日、採用後の支給、個別企業の条件は分かりません。2024年度から令和5年7月改定の日本標準産業分類に基づく区分です。
