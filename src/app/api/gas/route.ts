import { NextRequest, NextResponse } from "next/server";

const GAS_URL = process.env.GAS_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.toString();
    const res = await fetch(`${GAS_URL}?${query}`, {
      redirect: "follow",
      headers: { "Accept": "application/json" },
    });
    const text = await res.text();
    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (err) {
    console.error("GAS GET error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(GAS_URL, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (err) {
    console.error("GAS POST error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
