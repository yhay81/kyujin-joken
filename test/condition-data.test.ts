import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const index = JSON.parse(readFileSync(resolve(root, "public/data/index.json"), "utf8"));
const records = JSON.parse(readFileSync(resolve(root, "public/data/conditions.json"), "utf8"));
const find = (id: string) => records.find((record: { id: string }) => record.id === id);

describe("official job-condition tables", () => {
  it("retains verified source metadata and the common boundary", () => {
    expect(index).toMatchObject({
      asOf: "2026-08-02",
      edition: "2025年度（令和7年度）",
      years: [2020, 2021, 2022, 2023, 2024, 2025],
      industryCount: 19,
      recordCount: 19,
      employment: "パートタイムを除く常用",
    });
    expect(
      Object.fromEntries(
        index.sources.map((source: { metric: string; sha256: string }) => [
          source.metric,
          source.sha256,
        ]),
      ),
    ).toEqual({
      weekend: "29f327bdec9cdec90be27ef9a4dfee428df00aa2653c8ddd44f5b7c8cc16b730",
      bonus: "6733b6040ec11e0264715d70713f2ffaff9de48c8d07d3168c988c1bd3ad8027",
      commute: "df1ce802a1121d2932ca6946ea8af92861c7e74d3c8315b9bfdd0182c2f390bb",
    });
  });

  it("contains 19 unique industries and six values per category", () => {
    expect(records).toHaveLength(19);
    expect(new Set(records.map((record: { id: string }) => record.id)).size).toBe(19);
    for (const record of records) {
      for (const values of [
        record.weekend.total,
        record.weekend.complete,
        record.weekend.other,
        record.weekend.none,
        record.bonus.yes,
        record.bonus.no,
        record.commute.upperLimit,
        record.commute.noLimit,
        record.commute.fixed,
        record.commute.none,
      ])
        expect(values).toHaveLength(6);
    }
  });

  it("retains the nationwide 2025 counts", () => {
    expect(find("ALL")).toMatchObject({
      weekend: {
        total: [
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          487753,
          467333,
        ],
        complete: [
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          275831,
          273456,
        ],
        none: [
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          9302,
          7915,
        ],
      },
      bonus: {
        yes: [
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          4703629,
          4557274,
        ],
        no: [
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          1021829,
          952076,
        ],
      },
      commute: {
        upperLimit: [
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          3799692,
          3647311,
        ],
        noLimit: [
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          1321467,
          1286082,
        ],
        fixed: [
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          142464,
          138168,
        ],
        none: [
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          461835,
          437789,
        ],
      },
    });
  });

  it("keeps every weekend row additive and every denominator positive", () => {
    for (const record of records)
      for (let year = 0; year < 6; year += 1) {
        expect(
          record.weekend.complete[year] + record.weekend.other[year] + record.weekend.none[year],
        ).toBe(record.weekend.total[year]);
        expect(record.bonus.yes[year] + record.bonus.no[year]).toBeGreaterThan(0);
        expect(
          record.commute.upperLimit[year] +
            record.commute.noLimit[year] +
            record.commute.fixed[year] +
            record.commute.none[year],
        ).toBeGreaterThan(0);
      }
  });

  it("stays within the static delivery budget", () => {
    expect(statSync(resolve(root, "public/data/conditions.json")).size).toBeLessThan(20000);
  });
});
