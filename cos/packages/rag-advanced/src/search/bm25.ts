export class BM25Okapi {
  private k1 = 1.5
  private b = 0.75
  private docs: string[] = []
  private avgDocLen = 0
  private docCount = 0
  private df = new Map<string, number>()
  private termCache = new Map<number, Map<string, number>>()

  private readonly STOPWORDS_EN = new Set(["a","an","the","and","or","but","in","on","at","to","for","of","by","with","from","as","is","it","was","are","were","be","been","being","have","has","had","do","does","did","will","would","can","could","may","might","shall","should","about","into","through","during","before","after","above","below","between","out","off","over","under","again","further","then","once","here","there","when","where","why","how","all","each","every","both","few","more","most","other","some","such","no","nor","not","only","own","same","so","than","too","very","just","because","also","if","then","else","this","that","these","those"])

  private readonly STOPWORDS_ES = new Set(["el","la","los","las","un","una","unos","unas","y","o","pero","en","de","para","por","con","sin","su","del","al","como","más","que","es","se","no","lo","le","a","e","i","u","ha","has","han","había","ser","está","estar","fue","era","han","tiene","tienen","este","esta","esto","estos","estas","ese","esa","eso","esos","esas","aquel","aquella","aquello","aquellos","aquellas","su","sus","tu","tus","mi","mis","nuestro","nuestra","les","me","te","se","nos","os","ya","bien","mal","cada","todo","toda","todos","todas","mismo","misma","otros","otra","otro","unas","unos","muy","tan","tanto","cuando","donde","quien","cual","cuyo","durante","mediante","excepto","incluso","mientras","según","vía","tras"])

  private isStopword(w: string, lang: string): boolean {
    return this.STOPWORDS_EN.has(w) || (lang === "es" && this.STOPWORDS_ES.has(w))
  }

  private tokenizer(text: string): string[] {
    const lang = /[áéíóúñ¿¡]/i.test(text) ? "es" : "en"
    return text.toLowerCase().split(/[^\wáéíóúñÁÉÍÓÚÑ]+/).filter((w) => w.length > 1 && !this.isStopword(w, lang))
  }

  index(docs: string[]): void {
    this.docs = docs
    this.docCount = docs.length
    this.df.clear()
    this.termCache.clear()
    let totalLen = 0
    for (let i = 0; i < docs.length; i++) {
      const tokens = this.tokenizer(docs[i])
      totalLen += tokens.length
      const unique = new Set(tokens)
      for (const t of unique) this.df.set(t, (this.df.get(t) ?? 0) + 1)
      const tf = new Map<string, number>()
      for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1)
      this.termCache.set(i, tf)
    }
    this.avgDocLen = totalLen / this.docCount
  }

  score(query: string, docIndex: number): number {
    const qTokens = this.tokenizer(query)
    const tf = this.termCache.get(docIndex)
    if (!tf) return 0
    const docLen = [...tf.values()].reduce((a, b) => a + b, 0)
    let score = 0
    for (const qt of qTokens) {
      const idf = Math.log(1 + (this.docCount - (this.df.get(qt) ?? 0) + 0.5) / ((this.df.get(qt) ?? 0) + 0.5))
      const termFreq = tf.get(qt) ?? 0
      const numerator = termFreq * (this.k1 + 1)
      const denominator = termFreq + this.k1 * (1 - this.b + this.b * (docLen / this.avgDocLen))
      score += idf * (numerator / denominator)
    }
    return score
  }

  search(query: string, topK = 10): Array<{ index: number; score: number }> {
    const results: Array<{ index: number; score: number }> = []
    for (let i = 0; i < this.docs.length; i++) {
      const s = this.score(query, i)
      if (s > 0) results.push({ index: i, score: s })
    }
    return results.sort((a, b) => b.score - a.score).slice(0, topK)
  }
}
