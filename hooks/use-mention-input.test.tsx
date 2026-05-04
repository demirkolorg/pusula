import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import * as React from "react";
import { useMentionInput } from "./use-mention-input";

// useMentionInput state machine — caret bazlı @ algılama.
// Bu hook plain state, react-hook-form bağımsız. jsdom textarea event'lerini
// simüle eder.

function setup(baslangicMetin = "") {
  return renderHook(() => {
    const [metin, setMetin] = React.useState(baslangicMetin);
    const m = useMentionInput(metin, setMetin);
    return { metin, setMetin, ...m };
  });
}

// Textarea ChangeEvent simülasyonu — value + selectionStart belirler
function changeEvent(value: string, caret = value.length) {
  return {
    target: { value, selectionStart: caret },
  } as unknown as React.ChangeEvent<HTMLTextAreaElement>;
}

describe("useMentionInput", () => {
  it("başlangıçta kapalı durum", () => {
    const { result } = setup();
    expect(result.current.durum.acik).toBe(false);
  });

  it("@ yazınca açılır, query boş", () => {
    const { result } = setup();
    act(() => {
      result.current.onMetinDegisti(changeEvent("Hey @"));
    });
    expect(result.current.durum.acik).toBe(true);
    expect(result.current.durum.query).toBe("");
    expect(result.current.durum.baslangicIdx).toBe(4);
  });

  it("@ sonrası harfler query'yi büyütür", () => {
    const { result } = setup();
    act(() => {
      result.current.onMetinDegisti(changeEvent("@ah"));
    });
    expect(result.current.durum).toMatchObject({
      acik: true,
      query: "ah",
      baslangicIdx: 0,
    });
  });

  it("whitespace ile kapanır", () => {
    const { result } = setup();
    act(() => {
      result.current.onMetinDegisti(changeEvent("@ahmet "));
    });
    expect(result.current.durum.acik).toBe(false);
  });

  it("@'nin önünde harf varsa açılmaz (örn email)", () => {
    const { result } = setup();
    act(() => {
      result.current.onMetinDegisti(changeEvent("ahmet@example"));
    });
    expect(result.current.durum.acik).toBe(false);
  });

  it("metnin başındaki @ açılır", () => {
    const { result } = setup();
    act(() => {
      result.current.onMetinDegisti(changeEvent("@a"));
    });
    expect(result.current.durum.acik).toBe(true);
  });

  it("Escape klavyesi durumu kapatır", () => {
    const { result } = setup();
    act(() => {
      result.current.onMetinDegisti(changeEvent("@a"));
    });
    expect(result.current.durum.acik).toBe(true);
    act(() => {
      result.current.onKlavye({
        key: "Escape",
        preventDefault: () => {},
      } as React.KeyboardEvent<HTMLTextAreaElement>);
    });
    expect(result.current.durum.acik).toBe(false);
  });

  it("secimYap UUID insert eder ve durumu kapatır", () => {
    const { result } = setup();
    act(() => {
      result.current.onMetinDegisti(changeEvent("Selam @ah"));
    });
    expect(result.current.durum.acik).toBe(true);
    act(() => {
      result.current.secimYap("00000000-0000-0000-0000-000000000001");
    });
    expect(result.current.metin).toBe(
      "Selam @00000000-0000-0000-0000-000000000001 ",
    );
    expect(result.current.durum.acik).toBe(false);
  });

  it("ortada @ — caret pozisyonuna duyarlı", () => {
    const { result } = setup();
    // "Selam @ahmet sonra" — caret @ahmet'te
    act(() => {
      result.current.onMetinDegisti(changeEvent("Selam @ah", 9));
    });
    expect(result.current.durum).toMatchObject({
      acik: true,
      query: "ah",
      baslangicIdx: 6,
      caretIdx: 9,
    });
  });
});
