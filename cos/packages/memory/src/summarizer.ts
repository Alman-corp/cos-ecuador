import OpenAI from "openai"

export class Summarizer {
  private llm: OpenAI

  constructor(llm?: OpenAI) {
    this.llm = llm ?? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }

  async summarize(text: string, maxLength: number = 500): Promise<string> {
    const completion = await this.llm.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `Resume la siguiente conversación de consultoría manteniendo:
- Decisiones clave tomadas
- Datos financieros mencionados (números exactos)
- Compromisos y próximos pasos
- Contexto del cliente y problema

Máximo ${maxLength} caracteres. Sé conciso pero no omitas datos importantes.`,
        },
        { role: "user", content: text },
      ],
    })
    return completion.choices[0]?.message?.content ?? ""
  }
}