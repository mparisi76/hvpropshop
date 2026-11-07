import { NextResponse } from "next/server";
import { getPublishedPropsByIds } from "@/lib/props";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = (searchParams.get("ids") || "").split(",");

  try {
    return NextResponse.json(await getPublishedPropsByIds(ids));
  } catch (error) {
    console.error("Pull list fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
