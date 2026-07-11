import { NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/paystack";

export async function GET(req: Request) {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { error: "Paystack is not configured.", demo: true },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference");
    if (!reference) {
      return NextResponse.json(
        { error: "Missing reference" },
        { status: 400 }
      );
    }

    const data = await verifyTransaction(reference);
    return NextResponse.json({
      paid: data.status === "success",
      data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verify error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
