import OpenAI from "openai"

export async function faithfulness(answer: string, context: string[], llm?: OpenAI): Promise<number> {
  if (!context.length || !answer.trim()) return 0
  const client = llm ?? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  try {
    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        { role: "system", content: "Eres un evaluador imparcial. Analiza si cada afirmación en la respuesta está respaldada por el contexto proporcionado.\nResponde ÚNICAMENTE con un número entre 0 y 1." },
        { role: "user", content: `Contexto:\n${context.join("\n---\n")}\n\nRespuesta:\n${answer}\n\nProporción de afirmaciones respaldadas por el contexto (0-1):` },
      ],
    })
    const score = parseFloat(resp.choices[0]?.message?.content ?? "0")
    return isNaN(score) ? 0 : Math.max(0, Math.min(1, score))
  } catch { return 0.5 }
}
