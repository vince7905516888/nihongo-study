import { NextResponse } from "next/server";

const GAS_URL = "https://script.google.com/macros/s/AKfycbxCi-mIw3hBgUfBkEhSP_SqubTUGu4O9ZZqeUzYorSORLW8qozA1BUvyeFdH0ZehtuK/exec";

export async function GET() {
  try {
    const res = await fetch(`${GAS_URL}?action=getVocabulary`, {
      redirect: "follow",
      headers: { "Accept": "application/json" },
    });
    const text = await res.text();
    return NextResponse.json({ status: res.status, body: text.slice(0, 200) });
  } catch (err) {
    return NextResponse.json({ error: String(err) });
  }
}
