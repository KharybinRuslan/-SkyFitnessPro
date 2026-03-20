/**
 * Приводит URL видео YouTube к формату embed для безопасного отображения в iframe.
 * Избегает m.youtube.com (X-Frame-Options: sameorigin) и снижает предупреждения в консоли.
 */
export function toEmbedVideoUrl(url: string): string {
  if (!url || typeof url !== "string") return url;
  const trimmed = url.trim();
  // Уже embed
  if (/^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/i.test(trimmed)) {
    return trimmed.replace(/^https?:\/\/m\./i, "https://www.");
  }
  // watch?v=ID или youtu.be/ID
  const watchMatch = trimmed.match(/(?:youtube\.com\/watch\?.*v=|youtu\.be\/)([\w-]+)/i);
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }
  // m.youtube.com/...
  const mMatch = trimmed.match(/m\.youtube\.com\/.*(?:v=|\/)([\w-]+)/i);
  if (mMatch) {
    return `https://www.youtube.com/embed/${mMatch[1]}`;
  }
  return trimmed;
}

/** URL для открытия видео на YouTube в новой вкладке (если встроенное воспроизведение недоступно). */
export function toYouTubeWatchUrl(url: string): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  const embedMatch = trimmed.match(/youtube\.com\/embed\/([\w-]+)/i);
  if (embedMatch) return `https://www.youtube.com/watch?v=${embedMatch[1]}`;
  const watchMatch = trimmed.match(/(?:youtube\.com\/watch\?.*v=|youtu\.be\/)([\w-]+)/i);
  if (watchMatch) return `https://www.youtube.com/watch?v=${watchMatch[1]}`;
  const mMatch = trimmed.match(/(?:v=|\/)([\w-]{11})/i);
  if (mMatch) return `https://www.youtube.com/watch?v=${mMatch[1]}`;
  return trimmed;
}
