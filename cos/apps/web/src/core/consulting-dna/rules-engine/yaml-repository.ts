import * as fs from "fs"
import * as path from "path"
import * as yaml from "js-yaml"
import type { DeclarativeRule } from "./types"

export class YamlRulesRepository {
  private rulesDir: string

  constructor(rulesDir?: string) {
    this.rulesDir =
      rulesDir ?? path.join(process.cwd(), "src", "core", "consulting-dna", "rules")
  }

  async loadAll(): Promise<DeclarativeRule[]> {
    const rules: DeclarativeRule[] = []
    await this.walkDir(this.rulesDir, rules)
    return rules
  }

  private async walkDir(dir: string, acc: DeclarativeRule[]): Promise<void> {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          await this.walkDir(full, acc)
        } else if (entry.name.endsWith(".yml") || entry.name.endsWith(".yaml")) {
          const rule = this.loadFile(full)
          if (rule) acc.push(rule)
        }
      }
    } catch {
      // Directory may not exist yet
    }
  }

  private loadFile(filePath: string): DeclarativeRule | null {
    try {
      const raw = fs.readFileSync(filePath, "utf-8")
      const parsed = yaml.load(raw) as Record<string, unknown>
      if (!parsed || typeof parsed !== "object") return null
      if (parsed.rules && Array.isArray(parsed.rules)) {
        return null
      }
      return parsed as unknown as DeclarativeRule
    } catch (e) {
      console.warn(`Error loading rule ${filePath}:`, e)
      return null
    }
  }

  loadRulesFromFile(filePath: string): DeclarativeRule[] {
    try {
      const raw = fs.readFileSync(filePath, "utf-8")
      const parsed = yaml.load(raw) as Record<string, unknown>
      if (!parsed || typeof parsed !== "object") return []
      if (parsed.rules && Array.isArray(parsed.rules)) {
        return parsed.rules as DeclarativeRule[]
      }
      return [parsed as unknown as DeclarativeRule]
    } catch {
      return []
    }
  }

  private walkDirMulti(dir: string, acc: DeclarativeRule[]): void {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          this.walkDirMulti(full, acc)
        } else if (entry.name.endsWith(".yml") || entry.name.endsWith(".yaml")) {
          const rules = this.loadRulesFromFile(full)
          acc.push(...rules)
        }
      }
    } catch {
      // Directory may not exist yet
    }
  }

  async loadAllMulti(): Promise<DeclarativeRule[]> {
    const rules: DeclarativeRule[] = []
    this.walkDirMulti(this.rulesDir, rules)
    return rules
  }
}
