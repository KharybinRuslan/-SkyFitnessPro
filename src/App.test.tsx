import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

function isCoursesListRequest(url: string): boolean {
  try {
    const { pathname } = new URL(url);
    return /\/api\/fitness\/courses$/.test(pathname);
  } catch {
    return false;
  }
}

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        if (isCoursesListRequest(url)) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          } as Response);
        }
        return Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({}),
        } as Response);
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("рендерит главную: герой и пустой каталог курсов", async () => {
    render(<App />);
    expect(await screen.findByText(/Начните заниматься спортом/)).toBeInTheDocument();
    expect(await screen.findByText(/Курсы пока не добавлены/)).toBeInTheDocument();
  });
});
