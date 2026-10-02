import fs from "node:fs";
import { NextResponse, type NextRequest } from "next/server";
import { readClip } from "@/lib/portraits";

/** Serves a model's looping clip, with byte-range support (needed for video playback on iPhone). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const clip = readClip((await params).id);
  if (!clip) return new NextResponse(null, { status: 404 });
  const range = req.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  const headers: Record<string, string> = { "content-type": clip.type, "accept-ranges": "bytes", "cache-control": "public, max-age=3600" };
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), clip.size - 1) : clip.size - 1;
    if (start >= clip.size || start > end) return new NextResponse(null, { status: 416, headers: { "content-range": `bytes */${clip.size}` } });
    const buf = Buffer.alloc(end - start + 1);
    const fd = fs.openSync(clip.path, "r");
    fs.readSync(fd, buf, 0, buf.length, start);
    fs.closeSync(fd);
    return new NextResponse(new Uint8Array(buf), { status: 206, headers: { ...headers, "content-range": `bytes ${start}-${end}/${clip.size}`, "content-length": String(buf.length) } });
  }
  return new NextResponse(new Uint8Array(fs.readFileSync(clip.path)), { headers: { ...headers, "content-length": String(clip.size) } });
}
