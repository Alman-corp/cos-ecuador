import { SelfRAG } from "../src/query/self-rag"

describe("SelfRAG", () => {
  let selfRag: SelfRAG

  beforeEach(() => {
    selfRag = new SelfRAG({ openAiKey: "test" })
  })

  it("should skip retrieval for greetings", async () => {
    const decision = await selfRag.decide("hola")
    expect(decision.action).toBe("skip")
  })

  it("should skip for short queries", async () => {
    const decision = await selfRag.decide("hi")
    expect(decision.action).toBe("skip")
  })

  it("should retrieve for financial queries", async () => {
    const decision = await selfRag.decide("What was Tesla EBITDA in Q4 2025?")
    expect(decision.action).toBe("retrieve")
    expect(decision.domain).toBe("financial")
  })

  it("should decompose comparative queries", async () => {
    const decision = await selfRag.decide("Compare Tesla vs Ford EBITDA margin")
    expect(decision.action).toBe("decompose")
  })

  it("should detect strategic domain", async () => {
    const decision = await selfRag.decide("What is Tesla strategy for FSD growth?")
    expect(decision.domain).toBe("strategic")
  })

  it("should evaluate sufficiency with empty contexts", async () => {
    const result = await selfRag.evaluateSufficiency("test", [])
    expect(result.sufficient).toBe(false)
  })
})
