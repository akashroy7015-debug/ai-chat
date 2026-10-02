import fs from "node:fs";
import { NextResponse, type NextRequest } from "next/server";
import { canView, readGalleryItem } from "@/lib/gallery";
import { sessionUser } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/http";

/** Serves a gallery file to Premium members only, with byte ranges for video. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ item: string }> }) {
  if (!canView(sessionUser(req.cookies.get(SESSION_COOKIE)?.value))) return new NextResponse(null, { status: 403 });
  const f = readGalleryItem((await params).item);
  if (!f) return new NextResponse(null, { status: 404 });
  const headers: Record<string, string> = { "content-type": f.type, "accept-ranges": "bytes", "cache-control": "private, max-age=3600" };
  const range = req.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), f.size - 1) : f.size - 1;
    if (start >= f.size || start > end) return new NextResponse(null, { status: 416, headers: { "content-range": `bytes */${f.size}` } });
    const buf = Buffer.alloc(end - start + 1);
    const fd = fs.openSync(f.path, "r");
    fs.readSync(fd, buf, 0, buf.length, start);
    fs.closeSync(fd);
    return new NextResponse(new Uint8Array(buf), { status: 206, headers: { ...headers, "content-range": `bytes ${start}-${end}/${f.size}`, "content-length": String(buf.length) } });
  }
  return new NextResponse(new Uint8Array(fs.readFileSync(f.path)), { headers: { ...headers, "content-length": String(f.size) } });
}
