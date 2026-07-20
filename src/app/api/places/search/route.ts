import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";

// Proxies Naver Local Search so the client never sees the secret and we avoid
// CORS. Returns { configured, items }. If keys are unset, configured=false so
// the UI falls back to manual entry.
export interface PlaceResult {
  name: string;
  address: string;
  category: string;
  mapUrl: string;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, "").trim();
}

export async function GET(request: Request) {
  // Only signed-in users may search.
  if (!(await getSessionUserId())) {
    return NextResponse.json({ configured: false, items: [] }, { status: 401 });
  }

  const id = process.env.NAVER_CLIENT_ID;
  const secret = process.env.NAVER_CLIENT_SECRET;
  if (!id || !secret) {
    return NextResponse.json({ configured: false, items: [] });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ configured: true, items: [] });

  try {
    const url =
      "https://openapi.naver.com/v1/search/local.json?display=5&sort=random&query=" +
      encodeURIComponent(q);
    const res = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": id,
        "X-Naver-Client-Secret": secret,
      },
      // Naver results change rarely for a query; cache briefly.
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { configured: true, items: [], error: "search_failed" },
        { status: 502 },
      );
    }
    const data = (await res.json()) as {
      items?: Array<{
        title: string;
        roadAddress?: string;
        address?: string;
        category?: string;
      }>;
    };
    const items: PlaceResult[] = (data.items ?? []).map((it) => {
      const name = stripTags(it.title);
      const address = it.roadAddress || it.address || "";
      return {
        name,
        address,
        category: it.category ?? "",
        mapUrl: `https://map.naver.com/p/search/${encodeURIComponent(
          `${name} ${address}`.trim(),
        )}`,
      };
    });
    return NextResponse.json({ configured: true, items });
  } catch {
    return NextResponse.json(
      { configured: true, items: [], error: "network" },
      { status: 502 },
    );
  }
}
