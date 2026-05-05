import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { PusulaSpinner } from "./pusula-spinner";

afterEach(() => {
  cleanup();
});

describe("PusulaSpinner", () => {
  it("role='status' ve varsayılan etiket vardır", () => {
    render(<PusulaSpinner />);
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Yükleniyor",
    );
    expect(screen.getByText("Yükleniyor")).toBeInTheDocument();
  });

  it("özel etiket aria-label ve sr-only metnine yansır", () => {
    render(<PusulaSpinner etiket="Kayıt yükleniyor" />);
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Kayıt yükleniyor",
    );
    expect(screen.getByText("Kayıt yükleniyor")).toBeInTheDocument();
  });

  it("animate-spin sınıfı uygulanır", () => {
    const { container } = render(<PusulaSpinner />);
    const svg = container.querySelector("svg");
    const cls = svg?.className.baseVal ?? svg?.getAttribute("class") ?? "";
    expect(cls).toContain("animate-spin");
  });

  it("boyut prop'u ikon sinifini etkiler", () => {
    const { container } = render(<PusulaSpinner boyut="xl" />);
    const svg = container.querySelector("svg");
    const cls = svg?.className.baseVal ?? svg?.getAttribute("class") ?? "";
    expect(cls).toContain("size-9");
  });

  it("dekoratif=true iken role/sr-only metni vermez", () => {
    const { container } = render(<PusulaSpinner dekoratif etiket="Hidden" />);
    expect(container.querySelector('[role="status"]')).toBeNull();
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
    const span = container.firstChild as HTMLElement;
    expect(span.getAttribute("aria-hidden")).toBe("true");
  });
});
