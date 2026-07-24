import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
import React from "react";

// next/font/google returns a function whose result exposes a `variable`
// className token; components typically only reference `.variable` or
// `.className`. Mock every font export as a factory returning that shape.
vi.mock("next/font/google", () => {
  const fontFactory = () => ({
    variable: "--font-mock",
    className: "font-mock",
  });
  return {
    Geist: fontFactory,
    Geist_Mono: fontFactory,
    Fraunces: fontFactory,
  };
});

// next/image renders an optimized <img> with a loader; in jsdom we just want
// a plain <img> so tests can assert on src/alt without hitting the real
// Next.js image optimizer.
vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { priority, onError, ...rest } = props as any;
    void priority;
    return React.createElement("img", { ...rest, onError });
  },
}));
