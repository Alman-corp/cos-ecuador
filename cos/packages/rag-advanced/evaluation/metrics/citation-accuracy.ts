import OpenAI from "openai"

export async function citationAccuracy(answer: string, citations: string[], llm?: OpenAI): Promise<number> {
  const citationRefs = answer.match(/\[cite:\d+\]/g)
  if (!citationRefs || citationRefs.length === 0) return 0
  if (citations.length === 0) return 0
  const client = llm ?? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  try {
    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        { role: "system", content: "Evalúa si las citas en la respuesta respaldan correctamente sus afirmaciones. Responde ÚNICAMENTE con un número entre 0 y 1." },
        { role: "user", content: `Respuesta (con citas):\n${answer}\n\nContextos citables:\n${citations.map((c, i) => `[${i + 1}] ${c}`).join("\n")}\n\nProporción de citas que respaldan correctamente sus afirmaciones (0-1):` },
      ],
    })
    const score = parseFloat(resp.choices[0]?.message?.content ?? "0")
    return isNaN(score) ? 0 : Math.max(0, Math.min(1, score))
  } catch { return 0.5 }
}
