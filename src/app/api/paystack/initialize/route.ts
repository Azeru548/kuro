import { NextResponse } from "next/server";
import { initializeTransaction, toKobo } from "@/lib/paystack";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email(),
  amount: z.number().positive(),
  jobId: z.string().min(1),
  callbackUrl: z.string().url().optional(),
});

export async function POST(req: Request) {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        {
          error:
            "Paystack is not configured. Add PAYSTACK_SECRET_KEY to environment variables.",
          demo: true,
        },
        { status: 503 }
      );
    }

    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, amount, jobId, callbackUrl } = parsed.data;
    const reference = `kuro_${jobId}_${Date.now()}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const data = await initializeTransaction({
      email,
      amountKobo: toKobo(amount),
      reference,
      callbackUrl:
        callbackUrl || `${appUrl}/client/jobs/${jobId}?payment=return`,
      metadata: { jobId, platform: "kuro" },
    });

    return NextResponse.json({ data, reference });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Paystack error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
