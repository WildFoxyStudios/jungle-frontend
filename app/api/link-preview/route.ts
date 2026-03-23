import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const res = await fetch(url, {
      headers: {
        "User-Agent": "WhatsApp/2.21.12.21 A", // Some sites block bots without a known SA
        "Accept": "text/html",
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch url" }, { status: res.status });
    }

    const html = await res.text();
    
    const getMetaTag = (property: string) => {
      // Handles property="og:..." and name="twitter:..."
      const regex = new RegExp(`<meta(?:\\s+[^>]*)*(?:property|name)=["']\\s*${property}\\s*["'][^>]*content=["']([^"']+)["'][^>]*>`, 'i');
      const match = html.match(regex);
      if (match) return match[1];

      // Reverse order: content="..." property="..."
      const regexReverse = new RegExp(`<meta(?:\\s+[^>]*)*content=["']([^"']+)["'][^>]*(?:property|name)=["']\\s*${property}\\s*["'][^>]*>`, 'i');
      const matchReverse = html.match(regexReverse);
      return matchReverse ? matchReverse[1] : null;
    };

    const title = getMetaTag("og:title") || getMetaTag("twitter:title") || html.match(/<title>([^<]*)<\/title>/i)?.[1];
    const description = getMetaTag("og:description") || getMetaTag("twitter:description") || getMetaTag("description");
    let image = getMetaTag("og:image") || getMetaTag("twitter:image");

    if (image && image.startsWith("/")) {
      const baseUrl = new URL(url).origin;
      image = `${baseUrl}${image}`;
    }

    return NextResponse.json({
      title: title?.trim(),
      description: description?.trim(),
      image,
      url,
      domain: new URL(url).hostname,
    });
  } catch (error) {
    return NextResponse.json({ error: "Error scraping url" }, { status: 500 });
  }
}
