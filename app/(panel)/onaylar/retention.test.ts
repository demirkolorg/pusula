import { describe, expect, it } from "vitest";
import { retentionEsigi, retentionGunOku } from "./retention";

// ADR-0020 — Retention saf helper testleri (DB gerektirmez).

describe("retentionGunOku (env clamp)", () => {
  it("env tanımlı değilse default 90", () => {
    expect(retentionGunOku({})).toBe(90);
  });

  it("geçerli sayı float ise floor + clamp", () => {
    expect(retentionGunOku({ RETENTION_GUN: "180" })).toBe(180);
    expect(retentionGunOku({ RETENTION_GUN: "30.7" })).toBe(30);
  });

  it("min 7 gün clamp — 1 gün gibi düşük değer 7'ye yükseltilir", () => {
    expect(retentionGunOku({ RETENTION_GUN: "1" })).toBe(7);
    expect(retentionGunOku({ RETENTION_GUN: "0" })).toBe(90); // 0 default'a düşer (geçersiz)
  });

  it("max 365 gün clamp — 1000 gün 365'e indirilir", () => {
    expect(retentionGunOku({ RETENTION_GUN: "1000" })).toBe(365);
  });

  it("geçersiz string default'a düşer", () => {
    expect(retentionGunOku({ RETENTION_GUN: "abc" })).toBe(90);
    expect(retentionGunOku({ RETENTION_GUN: "" })).toBe(90);
    expect(retentionGunOku({ RETENTION_GUN: "-5" })).toBe(90);
  });
});

describe("retentionEsigi (zaman hesabı)", () => {
  const sabitSimdi = new Date("2026-05-06T12:00:00Z");

  it("90 gün eşiği = simdi - 90 gün", () => {
    const esik = retentionEsigi(sabitSimdi, 90);
    const beklenen = new Date("2026-02-05T12:00:00Z");
    expect(esik.getTime()).toBe(beklenen.getTime());
  });

  it("0 gün eşiği = simdi (boundary)", () => {
    const esik = retentionEsigi(sabitSimdi, 0);
    expect(esik.getTime()).toBe(sabitSimdi.getTime());
  });

  it("365 gün = simdi - 1 yıl (yaklaşık)", () => {
    const esik = retentionEsigi(sabitSimdi, 365);
    const farkMs = sabitSimdi.getTime() - esik.getTime();
    const beklenenMs = 365 * 24 * 60 * 60 * 1000;
    expect(farkMs).toBe(beklenenMs);
  });
});
