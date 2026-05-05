import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { PusulaYukleniyor } from "./pusula-yukleniyor";

afterEach(() => {
  cleanup();
});

describe("PusulaYukleniyor", () => {
  it("varsayılan mesajı gösterir", () => {
    render(<PusulaYukleniyor />);
    const elemanlar = screen.getAllByText("Yükleniyor");
    expect(elemanlar.length).toBeGreaterThan(0);
  });

  it("özel mesaj ve altMesaj göstermesi", () => {
    render(<PusulaYukleniyor mesaj="Proje hazırlanıyor" altMesaj="Lütfen bekleyin" />);
    expect(screen.getByText("Proje hazırlanıyor")).toBeInTheDocument();
    expect(screen.getByText("Lütfen bekleyin")).toBeInTheDocument();
  });

  it("kapsam='tam-ekran' fixed inset-0 sınıflarını uygular", () => {
    const { container } = render(<PusulaYukleniyor kapsam="tam-ekran" />);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain("fixed");
    expect(root.className).toContain("inset-0");
  });

  it("kapsam='alan' fixed sınıfını eklemez", () => {
    const { container } = render(<PusulaYukleniyor kapsam="alan" />);
    const root = container.firstChild as HTMLElement;
    expect(root.className).not.toContain("fixed");
    expect(root.className).toContain("min-h-[200px]");
  });

  it("dış role='status' aria-label içerir", () => {
    render(<PusulaYukleniyor mesaj="Proje" />);
    const dis = screen.getAllByRole("status").find((el) =>
      el.getAttribute("aria-label") === "Proje",
    );
    expect(dis).toBeDefined();
  });
});
