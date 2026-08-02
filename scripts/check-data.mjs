import { readFile, stat } from "node:fs/promises";

const root = new URL("../public/data/", import.meta.url);
const index = JSON.parse(await readFile(new URL("index.json", root), "utf8"));
const records = JSON.parse(await readFile(new URL("conditions.json", root), "utf8"));
const expectedHashes = {
  weekend: "29f327bdec9cdec90be27ef9a4dfee428df00aa2653c8ddd44f5b7c8cc16b730",
  bonus: "6733b6040ec11e0264715d70713f2ffaff9de48c8d07d3168c988c1bd3ad8027",
  commute: "df1ce802a1121d2932ca6946ea8af92861c7e74d3c8315b9bfdd0182c2f390bb",
};

if (index.asOf !== "2026-08-02" || index.industryCount !== 19 || index.recordCount !== 19)
  throw new Error("Unexpected index dimensions");
if (JSON.stringify(index.years) !== JSON.stringify([2020, 2021, 2022, 2023, 2024, 2025]))
  throw new Error("Unexpected years");
if (index.employment !== "パートタイムを除く常用")
  throw new Error("Unexpected employment boundary");
if (records.length !== 19 || new Set(records.map((record) => record.id)).size !== 19)
  throw new Error("Industry coverage mismatch");
for (const source of index.sources)
  if (source.sha256 !== expectedHashes[source.metric])
    throw new Error(`Unexpected ${source.metric} source hash`);

const keys = [
  ["weekend", "total"],
  ["weekend", "complete"],
  ["weekend", "other"],
  ["weekend", "none"],
  ["bonus", "yes"],
  ["bonus", "no"],
  ["commute", "upperLimit"],
  ["commute", "noLimit"],
  ["commute", "fixed"],
  ["commute", "none"],
];
for (const record of records) {
  for (const [group, key] of keys) {
    const values = record[group][key];
    if (
      !Array.isArray(values) ||
      values.length !== 6 ||
      values.some((value) => !Number.isInteger(value) || value < 0)
    )
      throw new Error(`${record.id}: invalid ${group}.${key}`);
  }
  for (let year = 0; year < 6; year += 1) {
    if (
      record.weekend.total[year] !==
      record.weekend.complete[year] + record.weekend.other[year] + record.weekend.none[year]
    )
      throw new Error(`${record.id}: weekend total mismatch`);
    if (record.bonus.yes[year] + record.bonus.no[year] <= 0)
      throw new Error(`${record.id}: empty bonus denominator`);
    if (
      record.commute.upperLimit[year] +
        record.commute.noLimit[year] +
        record.commute.fixed[year] +
        record.commute.none[year] <=
      0
    )
      throw new Error(`${record.id}: empty commute denominator`);
  }
}
const national = records.find((record) => record.id === "ALL");
if (
  national.weekend.total[5] !== 467333 ||
  national.weekend.complete[5] !== 273456 ||
  national.weekend.none[5] !== 7915
)
  throw new Error("National weekend values changed");
if (national.bonus.yes[5] !== 4557274 || national.bonus.no[5] !== 952076)
  throw new Error("National bonus values changed");
if (
  national.commute.upperLimit[5] !== 3647311 ||
  national.commute.noLimit[5] !== 1286082 ||
  national.commute.fixed[5] !== 138168 ||
  national.commute.none[5] !== 437789
)
  throw new Error("National commute values changed");
if ((await stat(new URL("conditions.json", root))).size > 20000)
  throw new Error("Condition data exceeds delivery budget");

console.log(
  JSON.stringify({ asOf: index.asOf, industries: records.length, years: index.years.length }),
);
