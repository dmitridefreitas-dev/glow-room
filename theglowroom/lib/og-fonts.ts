/**
 * Loads raw TTF font bytes for `next/og` (Satori needs font data, not next/font
 * objects — and it can't parse woff2). We hit the Google Fonts *v1* CSS endpoint
 * with a legacy User-Agent, which returns a TrueType URL. Best-effort and
 * module-cached; if a fetch fails we just render with Satori's default font.
 */
type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 600 | 700 | 800;
  style: "normal";
};

const cache = new Map<string, ArrayBuffer | null>();

async function googleTtf(
  family: string,
  weight: number
): Promise<ArrayBuffer | null> {
  const key = `${family}:${weight}`;
  if (cache.has(key)) return cache.get(key) ?? null;

  try {
    const url = `https://fonts.googleapis.com/css?family=${encodeURIComponent(
      family
    )}:${weight}`;
    const css = await fetch(url, {
      headers: {
        // Legacy UA → Google serves TrueType instead of woff2.
        "User-Agent":
          "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1)",
      },
    }).then((r) => r.text());

    const match = css.match(/src:\s*url\(([^)]+)\)\s*format\('truetype'\)/);
    const ttfUrl = match?.[1];
    if (!ttfUrl) {
      cache.set(key, null);
      return null;
    }
    const data = await fetch(ttfUrl).then((r) => r.arrayBuffer());
    cache.set(key, data);
    return data;
  } catch {
    cache.set(key, null);
    return null;
  }
}

export async function loadShareFonts(): Promise<OgFont[]> {
  const [inter, bricolage] = await Promise.all([
    googleTtf("Inter", 600),
    googleTtf("Bricolage Grotesque", 800),
  ]);

  const fonts: OgFont[] = [];
  if (inter)
    fonts.push({ name: "Inter", data: inter, weight: 600, style: "normal" });
  if (bricolage)
    fonts.push({
      name: "Bricolage",
      data: bricolage,
      weight: 800,
      style: "normal",
    });
  return fonts;
}
