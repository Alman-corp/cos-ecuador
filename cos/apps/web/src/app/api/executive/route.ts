import { NextRequest, NextResponse } from "next/server"
import { executiveAI } from "@/core/executive"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get("companyId") || "default"
  const companyName = searchParams.get("companyName") || "Empresa"
  const question = searchParams.get("question")

  if (question) {
    const answer = await executiveAI.answerQuestion(question, companyId)
    return NextResponse.json({ answer })
  }

  const brief = await executiveAI.generateBrief(companyId, companyName)
  return NextResponse.json(brief)
}
