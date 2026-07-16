import OpenAI from "openai"

export async function answerRelevance(question: string, answer: string, llm?: OpenAI): Promise<number> {
  if (!answer.trim()) return 0
  const client = llm ?? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  try {
    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Generate 3 hypothetical questions that this answer would be a good response to. Respond in JSON: {\"questions\": [\"q1\", \"q2\", \"q3\"]}" },
        { role: "user", content: `Answer:\n${answer}` },
      ],
    })
    const parsed = JSON.parse(resp.choices[0]?.message?.content ?? "{}")
    const generatedQuestions: string[] = parsed.questions ?? []
    if (generatedQuestions.length === 0) return 0.5

    const qNorm = question.toLowerCase()
    let matchCount = 0
    for (const gq of generatedQuestions) {
      const gqNorm = gq.toLowerCase()
      const overlap = qNorm.split(" ").filter((w) => w.length > 3 && gqNorm.includes(w)).length
      const ratio = overlap / Math.max(1, new Set(qNorm.split(" ").filter((w) => w.length > 3)).size)
      if (ratio > 0.3) matchCount++
    }
    return matchCount / generatedQuestions.length
  } catch { return 0.5 }
}
