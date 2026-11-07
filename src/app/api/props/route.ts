import { NextResponse } from "next/server";
import { getPropsPage } from "@/lib/props";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const items = await getPropsPage({
      offset: parseInt(searchParams.get("offset") || "0") || 0,
      category: searchParams.get("category"),
      search: searchParams.get("search"),
      vendor: searchParams.get("vendor"),
      loc: searchParams.get("loc"),
      sort: searchParams.get("sort"),
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("API Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
