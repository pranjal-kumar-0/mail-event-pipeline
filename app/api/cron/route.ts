import { processNewEmails } from "@/lib/gmailProcessor"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // Vercel Cron Authentication
  const authHeader = request.headers.get("authorization")
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    await processNewEmails()
    return NextResponse.json({ success: true, message: "Emails processed successfully." })
  } catch (error: any) {
    console.error("Cron Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}