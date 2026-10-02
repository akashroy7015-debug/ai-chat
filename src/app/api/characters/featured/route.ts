import { NextResponse, type NextRequest } from "next/server";
import { listFeatured, type CatalogFilter } from "@/lib/characters/featured";
import { clipVersion } from "@/lib/portraits";

/** Public SFW catalog (like Candy's landing gallery). Chatting still requires age verification. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const filter: CatalogFilter = {
    category: (q.get("category") as CatalogFilter["category"]) || undefined,
    ethnicity: q.get("ethnicity") || undefined,
    hair: q.get("hair") || undefined,
    ageRange: (q.get("ageRange") as CatalogFilter["ageRange"]) || undefined,
  };
  return NextResponse.json({ characters: listFeatured(filter).map((c) => ({ ...c, clipV: clipVersion(c.id) })) });
}
