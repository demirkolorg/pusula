import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { PusulaLogo } from "./pusula-logo";

afterEach(() => {
  cleanup();
});

describe("PusulaLogo", () => {
  it("default render: ikon ve sr-only 'Pusula' metni var", () => {
    render(<PusulaLogo />);
    expect(screen.getByText("Pusula")).toBeInTheDocument();
  });

  it("tip='tam' ile baslik ve altBaslik gosterilir", () => {
    render(
      <PusulaLogo tip="tam" baslik="Kurum Adı" altBaslik="Uygulama" />,
    );
    expect(screen.getByText("Kurum Adı")).toBeInTheDocument();
    expect(screen.getByText("Uygulama")).toBeInTheDocument();
  });

  it("tip='ikon' iken baslik prop'u render edilmez", () => {
    render(<PusulaLogo tip="ikon" baslik="Gizli" />);
    expect(screen.queryByText("Gizli")).not.toBeInTheDocument();
  });

  it("boyut prop'u ikon sinifini etkiler", () => {
    const { container } = render(<PusulaLogo boyut="xl" />);
    const svg = container.querySelector("svg");
    expect(svg?.className.baseVal ?? svg?.getAttribute("class") ?? "").toContain(
      "size-16",
    );
  });

  it("custom className kok elemana eklenir", () => {
    const { container } = render(<PusulaLogo className="custom-x" />);
    expect(container.firstChild).toHaveClass("custom-x");
  });
});
