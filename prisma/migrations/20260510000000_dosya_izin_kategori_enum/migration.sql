-- ADR-0028 — IzinKategorisi enum'una DOSYA eklenir.
-- Postgres "ALTER TYPE ADD VALUE" yeni değeri aynı transaction'da kullandırmaz;
-- bu nedenle dosya yönetimi izinlerini ekleyen migration'dan AYRI tutulur.
ALTER TYPE "IzinKategorisi" ADD VALUE 'DOSYA';
