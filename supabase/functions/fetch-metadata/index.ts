import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  try {
    const { url, fallback = false } = await req.json();
    const debug = new URL(req.url).searchParams.get("debug") === "true";

    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      return json({ error: "Invalid URL" }, 400);
    }

    // ✅ Optional referer check (very basic validation to avoid abuse)
    //ALLOWED_REFERER_DOMAIN=loopfeed.com
    const allowedReferer = Deno.env.get("ALLOWED_REFERER_DOMAIN");

    const referer = req.headers.get("referer") || "";

    if (allowedReferer && !referer.includes(allowedReferer)) {
      return json({ error: "Blocked by referer check" }, 403);
    }

    const cleanedUrl = cleanURL(url);

    const res = await fetch(cleanedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.2 Safari/605.1.15",
        "Accept": "text/html,application/xhtml+xml"
      }
    });

    if (!res.ok) throw new Error("Failed to fetch the page");

    const contentType = res.headers.get("content-type");
    if (!contentType?.includes("text/html")) {
      return json({ error: "URL is not an HTML page" }, 400);
    }

    const html = await res.text();

    const getMeta = (property: string) =>
      matchMeta(html, `property="${property}"`) ||
      matchMeta(html, `name="${property}"`);

    const title = getMeta("og:title") || getTitleFallback(html);
    const description = getMeta("og:description") ||
                        getMeta("twitter:description") ||
                        getMeta("description");
    const image = getMeta("og:image") || getMeta("twitter:image");
    const site = getMeta("og:site_name") || new URL(cleanedUrl).hostname;
    const ogType = getMeta("og:type");

    const metadata = {
      url: cleanedUrl,
      title: stripBadContent(title),
      description: stripBadContent(description),
      image,
      site,
      ogType
    };

    // Hybrid fallback
    if (fallback && (!title || !description)) {
      const fallbackData = await getFallbackMetadata(cleanedUrl);
      Object.assign(metadata, fallbackData);
    }

    return json(debug ? { debug: true, metadata } : metadata);
  } catch (err) {
    console.error("Metadata Error:", err);
    return json({ error: "Failed to fetch metadata" }, 500);
  }
});

// ---------------------- Utilities ----------------------

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
  };
}

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() }
  });
}

function matchMeta(html: string, query: string): string | null {
  const regex = new RegExp(`<meta[^>]+${query}[^>]+content=["']([^"']+)["']`, "i");
  return regex.exec(html)?.[1] || null;
}

function getTitleFallback(html: string): string {
  const match = html.match(/<title>(.*?)<\/title>/i);
  return match?.[1] || "";
}

function stripBadContent(input: string): string {
  return input
    .replace(/<[^>]+>/g, "")
    .replace(/[\u{1F600}-\u{1F6FF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanURL(raw: string): string {
  try {
    const url = new URL(raw);
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return raw;
  }
}

async function getFallbackMetadata(url: string): Promise<any> {
  try {
    const fallbackRes = await fetch(`https://api.linkpreview.net/?key=${Deno.env.get("LINKPREVIEW_API_KEY")}&q=${encodeURIComponent(url)}`);
    if (!fallbackRes.ok) throw new Error("Fallback failed");
    const data = await fallbackRes.json();

    return {
      title: data.title,
      description: data.description,
      image: data.image,
      site: new URL(url).hostname
    };
  } catch (e) {
    console.warn("External fallback failed:", e.message);
    return {};
  }
}
