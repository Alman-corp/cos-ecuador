// @llm-engineer — DO NOT MODIFY
import OpenAI from "openai"

let client: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      dangerouslyAllowBrowser: false,
    })
  }
  return client
}

export function hasValidKey(): boolean {
  const key = process.env.OPENAI_API_KEY
  return !!key && !key.startsWith("your-") && key.length > 20
}
