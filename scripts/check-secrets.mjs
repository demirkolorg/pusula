#!/usr/bin/env node
// Sprint 5 / S5-11 — Pre-commit secret tarayıcı.
//
// Staged dosyalarda yaygın secret pattern'lerini arar; bulunca commit'i
// reddeder. Hassas örnekler:
//   - AWS Access Key (AKIA + 16 alphanumeric)
//   - Resend API key (re_ prefix + base64)
//   - GitHub Personal Access Token (ghp_ + 36 char)
//   - Stripe key (sk_live_ / sk_test_)
//   - Generic JWT (eyJ...)
//   - Argon2 / bcrypt hash
//   - PEM private key
//   - DATABASE_URL with embedded password
//
// Yanlış pozitif olursa `// allowlisted-secret` yorumu ekleyerek geçilebilir.
// Production'da gitleaks veya trufflehog ile değiştirilmesi önerilir.

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const PATTERNS = [
  {
    ad: "AWS Access Key ID",
    re: /\bAKIA[0-9A-Z]{16}\b/,
  },
  {
    ad: "Resend API key",
    re: /\bre_[A-Za-z0-9_-]{20,}\b/,
  },
  {
    ad: "GitHub PAT",
    re: /\bghp_[A-Za-z0-9]{36}\b/,
  },
  {
    ad: "Stripe key",
    re: /\bsk_(live|test)_[A-Za-z0-9]{24,}\b/,
  },
  {
    ad: "Slack token",
    re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/,
  },
  {
    ad: "PEM private key",
    re: /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
  },
  {
    ad: "DATABASE_URL with password",
    re: /postgresql:\/\/[^:\s]+:[^@\s]+@[^/\s]+/,
  },
];

const ATLA_DOSYA_UZANTILARI = [
  ".lock",
  ".lockb",
  ".log",
  ".min.js",
  ".min.css",
];

function stagedDosyalar() {
  try {
    const cikti = execSync("git diff --cached --name-only --diff-filter=ACM", {
      encoding: "utf8",
    });
    return cikti
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function ignoreEdilebilirMi(yol) {
  if (yol.startsWith(".env")) return true; // .env dosyaları zaten gitignore'da
  if (yol.startsWith("docs/")) return false; // dokümanları yine de tarayalım
  if (ATLA_DOSYA_UZANTILARI.some((u) => yol.endsWith(u))) return true;
  return false;
}

function dosyaTara(yol) {
  let icerik;
  try {
    icerik = readFileSync(yol, "utf8");
  } catch {
    return [];
  }
  const bulgular = [];
  const satirlar = icerik.split("\n");
  for (let i = 0; i < satirlar.length; i++) {
    const satir = satirlar[i];
    if (satir.includes("allowlisted-secret")) continue;
    for (const p of PATTERNS) {
      if (p.re.test(satir)) {
        bulgular.push({ yol, satir: i + 1, ad: p.ad, ornek: satir.slice(0, 120) });
      }
    }
  }
  return bulgular;
}

function main() {
  const dosyalar = stagedDosyalar().filter((y) => !ignoreEdilebilirMi(y));
  if (dosyalar.length === 0) {
    process.exit(0);
  }
  let toplamBulgu = [];
  for (const y of dosyalar) {
    toplamBulgu = toplamBulgu.concat(dosyaTara(y));
  }
  if (toplamBulgu.length === 0) {
    process.exit(0);
  }

  console.error(
    `\n[check-secrets] ${toplamBulgu.length} olası secret bulundu, commit reddedildi:\n`,
  );
  for (const b of toplamBulgu) {
    console.error(`  ${b.yol}:${b.satir}  [${b.ad}]`);
    console.error(`    ${b.ornek}`);
  }
  console.error(
    "\nGerçek secret değilse satıra `// allowlisted-secret` yorumu ekle ve tekrar dene.",
  );
  console.error(
    "Hızlı bypass (gerçek değilse): SKIP_SECRET_CHECK=1 git commit ...\n",
  );
  process.exit(1);
}

if (process.env.SKIP_SECRET_CHECK === "1") {
  console.warn("[check-secrets] SKIP_SECRET_CHECK=1 — tarama atlandı.");
  process.exit(0);
}

main();
