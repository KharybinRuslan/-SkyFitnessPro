import { describe, it, expect } from "vitest";
import { toEmbedVideoUrl, toYouTubeWatchUrl } from "./videoUrl";

const SAMPLE_ID = "abcdefghijk";

describe("toEmbedVideoUrl", () => {
  it("возвращает embed-URL для watch?v=", () => {
    expect(toEmbedVideoUrl(`https://www.youtube.com/watch?v=${SAMPLE_ID}`)).toBe(
      `https://www.youtube.com/embed/${SAMPLE_ID}`
    );
  });

  it("возвращает embed-URL для youtu.be", () => {
    expect(toEmbedVideoUrl(`https://youtu.be/${SAMPLE_ID}`)).toBe(
      `https://www.youtube.com/embed/${SAMPLE_ID}`
    );
  });

  it("не ломает уже готовый embed", () => {
    expect(toEmbedVideoUrl(`https://www.youtube.com/embed/${SAMPLE_ID}`)).toBe(
      `https://www.youtube.com/embed/${SAMPLE_ID}`
    );
  });
});

describe("toYouTubeWatchUrl", () => {
  it("преобразует embed в watch", () => {
    expect(toYouTubeWatchUrl(`https://www.youtube.com/embed/${SAMPLE_ID}`)).toBe(
      `https://www.youtube.com/watch?v=${SAMPLE_ID}`
    );
  });
});
