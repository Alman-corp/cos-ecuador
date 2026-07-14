"use client"

import { useState, useEffect, useCallback } from "react"
import { appendAudit, getAuditLog, verifyChain, type AuditEntry } from "@/lib/audit-log"
import { createApiKey, listApiKeys, revokeApiKey, type Scope } from "@/lib/api-keys"
import type { ApiKey } from "@/lib/api-keys"
type ApiKeyView = Omit<ApiKey, "hash">
import { getSsoConfigs, saveSsoConfig, deleteSsoConfig, type SsoConfig, type SsoProvider } from "@/lib/sso"
import { generateAllRlsSql, type RlsPolicy } from "@/lib/rls"
import { addSecret, getSecret, listSecrets, rotateSecret, getSecretsDueForRotation, type SecretEntry } from "@/lib/secrets"

type Tab = "audit" | "api-keys" | "sso" | "rls" | "secrets" | "encryption" | "gdpr"

export default function SecurityPage() {
  const [tab, setTab] = useState<Tab>("audit")
  const [auditChain, setAuditChain] = useState<AuditEntry[]>([])
  const [chainValid, setChainValid] = useState<{ valid: boolean; entries: number }>({ valid: true, entries: 0 })
  const [apiKeys, setApiKeys] = useState<ApiKeyView[]>([])
  const [ssoConfigs, setSsoConfigs] = useState<SsoConfig[]>([])
  const [rlsSql, setRlsSql] = useState("")
  const [secrets, setSecrets] = useState<Omit<SecretEntry, "value">[]>([])
  const [pendingRotation, setPendingRotation] = useState<Omit<SecretEntry, "value">[]>([])

  const refreshAudit = useCallback(async () => {
    setAuditChain(getAuditLog())
    const v = await verifyChain()
    setChainValid(v)
  }, [])

  const refreshApiKeys = useCallback(() => {
    setApiKeys(listApiKeys())
  }, [])

  const refreshSso = useCallback(() => {
    setSsoConfigs(getSsoConfigs())
  }, [])

  const refreshSecrets = useCallback(() => {
    setSecrets(listSecrets())
    setPendingRotation(getSecretsDueForRotation())
  }, [])

  useEffect(() => { refreshAudit(); refreshApiKeys(); refreshSso(); setRlsSql(generateAllRlsSql()); refreshSecrets() }, [])

  const tabs: { id: Tab; label: string }[] = [
    { id: "audit", label: "Audit Log" },
    { id: "api-keys", label: "API Keys" },
    { id: "sso", label: "SSO/SAML/OIDC" },
    { id: "rls", label: "Row-Level Security" },
    { id: "secrets", label: "Secret Rotation" },
    { id: "encryption", label: "Encryption" },
    { id: "gdpr", label: "GDPR/LGPD" },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-50">Seguridad y Cumplimiento</h1>
        <p className="mt-1 text-sm text-surface-400">
          SOC 2 Type II · GDPR · LGPD · Hash-chain audit · Field-level encryption
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-accent-600/10 text-accent-400 ring-1 ring-accent-500/20"
                : "bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-surface-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "audit" && <AuditLogTab chain={auditChain} valid={chainValid} onRefresh={refreshAudit} />}
      {tab === "api-keys" && <ApiKeysTab keys={apiKeys} onRefresh={refreshApiKeys} />}
      {tab === "sso" && <SsoTab configs={ssoConfigs} onRefresh={refreshSso} />}
      {tab === "rls" && <RlsTab sql={rlsSql} />}
      {tab === "secrets" && <SecretsTab secrets={secrets} pendingRotation={pendingRotation} onRefresh={refreshSecrets} />}
      {tab === "encryption" && <EncryptionTab />}
      {tab === "gdpr" && <GdprTab />}
    </div>
  )
}

function AuditLogTab({ chain, valid, onRefresh }: { chain: AuditEntry[]; valid: { valid: boolean; entries: number }; onRefresh: () => void }) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className={`rounded-full px-3 py-1 text-xs font-medium ${
          valid.valid ? "bg-emerald-600/10 text-emerald-400 ring-1 ring-emerald-500/20" : "bg-red-600/10 text-red-400 ring-1 ring-red-500/20"
        }`}>
          {valid.valid ? `Cadena intacta · ${valid.entries} entradas` : "⚠ Cadena comprometida"}
        </div>
        <button onClick={onRefresh} className="rounded-lg bg-surface-800 px-3 py-1 text-xs text-surface-400 hover:bg-surface-700">
          Refrescar
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-surface-700/50">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-900 text-surface-400">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase">Timestamp</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase">Action</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase">Resource</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase">Hash</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-700/50">
            {chain.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-surface-500">No hay entradas de auditoría</td></tr>
            )}
            {chain.slice().reverse().map((entry) => (
              <tr key={entry.id} className="font-mono text-xs text-surface-300">
                <td className="px-4 py-2">{new Date(entry.timestamp).toLocaleString()}</td>
                <td className="px-4 py-2">
                  <span className={`rounded px-1.5 py-0.5 text-xs ${
                    entry.action.includes("login") ? "bg-blue-600/10 text-blue-400" :
                    entry.action.includes("create") || entry.action.includes("granted") ? "bg-emerald-600/10 text-emerald-400" :
                    entry.action.includes("revoke") || entry.action.includes("delete") ? "bg-red-600/10 text-red-400" :
                    "bg-surface-700 text-surface-300"
                  }`}>{entry.action}</span>
                </td>
                <td className="px-4 py-2">{entry.userId}</td>
                <td className="px-4 py-2">{entry.resource}</td>
                <td className="max-w-[120px] truncate px-4 py-2 text-surface-500" title={entry.hash}>
                  {entry.hash.slice(0, 16)}...
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ApiKeysTab({ keys, onRefresh }: { keys: ApiKeyView[]; onRefresh: () => void }) {
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState("")
  const [scopes, setScopes] = useState<Scope[]>([])
  const [expires, setExpires] = useState("")
  const [newKey, setNewKey] = useState("")

  const handleCreate = async () => {
    const days = expires ? parseInt(expires) : undefined
    const { key, rawKey } = await createApiKey(name, scopes, days)
    setNewKey(rawKey)
    setShowCreate(false)
    setName("")
    setScopes([])
    setExpires("")
    onRefresh()
  }

  const handleRevoke = async (id: string) => {
    if (!confirm("¿Revocar esta API key?")) return
    await revokeApiKey(id)
    await appendAudit("api_key_revoked", "system", "api_keys", `Key ${id} revoked from UI`)
    onRefresh()
  }

  const allScopes: Scope[] = ["read:financial", "write:financial", "read:documents", "write:documents", "read:users", "read:reports", "write:reports"]

  return (
    <div>
      {newKey && (
        <div className="mb-4 rounded-xl border border-emerald-600/30 bg-emerald-600/5 p-4">
          <p className="text-xs font-medium text-emerald-400">Nueva API Key creada</p>
          <p className="mt-1 break-all font-mono text-sm text-surface-200">{newKey}</p>
          <p className="mt-1 text-xs text-surface-500">Copia esta clave ahora — no se mostrará de nuevo.</p>
          <button onClick={() => setNewKey("")} className="mt-2 rounded-lg bg-surface-800 px-3 py-1 text-xs text-surface-400 hover:bg-surface-700">
            Descartar
          </button>
        </div>
      )}

      <button
        onClick={() => setShowCreate(!showCreate)}
        className="mb-4 rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500"
      >
        + Nueva API Key
      </button>

      {showCreate && (
        <div className="mb-4 rounded-xl border border-surface-700/50 bg-surface-900 p-4">
          <div className="mb-3">
            <label className="block text-xs font-medium text-surface-400">Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-200" />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-surface-400">Scopes</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {allScopes.map((s) => (
                <label key={s} className="flex items-center gap-1 text-xs text-surface-300">
                  <input type="checkbox" checked={scopes.includes(s)} onChange={() => setScopes(scopes.includes(s) ? scopes.filter((x) => x !== s) : [...scopes, s])} />
                  {s}
                </label>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-surface-400">Expira (días, opcional)</label>
            <input value={expires} onChange={(e) => setExpires(e.target.value)} type="number" min="1" className="mt-1 w-32 rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-200" />
          </div>
          <button onClick={handleCreate} disabled={!name || scopes.length === 0} className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500 disabled:opacity-50">
            Crear
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-surface-700/50">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-900 text-surface-400">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase">Prefijo</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase">Scopes</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase">Expira</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-700/50">
            {keys.map((k) => (
              <tr key={k.id} className="text-xs text-surface-300">
                <td className="px-4 py-2 font-medium text-surface-200">{k.name}</td>
                <td className="px-4 py-2 font-mono text-surface-500">{k.prefix}...</td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap gap-1">
                    {k.scopes.map((s) => <span key={s} className="rounded bg-surface-700 px-1.5 py-0.5 text-xs">{s}</span>)}
                  </div>
                </td>
                <td className="px-4 py-2">{k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : "Nunca"}</td>
                <td className="px-4 py-2">
                  <span className={`rounded px-1.5 py-0.5 text-xs ${k.enabled ? "bg-emerald-600/10 text-emerald-400" : "bg-red-600/10 text-red-400"}`}>
                    {k.enabled ? "Activa" : "Revocada"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {k.enabled && (
                    <button onClick={() => handleRevoke(k.id)} className="text-xs text-red-400 hover:text-red-300">
                      Revocar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SsoTab({ configs, onRefresh }: { configs: SsoConfig[]; onRefresh: () => void }) {
  const [provider, setProvider] = useState<SsoProvider>("oidc")
  const [label, setLabel] = useState("")
  const [issuerUrl, setIssuerUrl] = useState("")
  const [clientId, setClientId] = useState("")
  const [clientSecret, setClientSecret] = useState("")

  const handleSave = () => {
    saveSsoConfig({ provider, label, issuerUrl, clientId, clientSecret, enabled: true, defaultRole: "analyst" })
    setLabel(""); setIssuerUrl(""); setClientId(""); setClientSecret("")
    onRefresh()
  }

  const handleDelete = (id: string) => {
    deleteSsoConfig(id)
    onRefresh()
  }

  return (
    <div>
      <div className="mb-4 rounded-xl border border-surface-700/50 bg-surface-900 p-4">
        <h3 className="mb-3 text-sm font-medium text-surface-200">Configurar Proveedor SSO</h3>
        <select value={provider} onChange={(e) => setProvider(e.target.value as SsoProvider)} className="mb-3 w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-200">
          <option value="oidc">OIDC Genérico</option>
          <option value="saml">SAML 2.0</option>
          <option value="google">Google Workspace</option>
          <option value="microsoft">Microsoft Entra ID</option>
          <option value="github">GitHub</option>
        </select>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (ej. SSO Corporativo)" className="mb-3 w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-200" />
        <input value={issuerUrl} onChange={(e) => setIssuerUrl(e.target.value)} placeholder="Issuer URL" className="mb-3 w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-200" />
        <input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="Client ID" className="mb-3 w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-200" />
        <input value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} type="password" placeholder="Client Secret" className="mb-3 w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-200" />
        <button onClick={handleSave} disabled={!label || !issuerUrl || !clientId} className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500 disabled:opacity-50">
          Guardar Configuración
        </button>
      </div>

      {configs.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-surface-700/50">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-900 text-surface-400">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Proveedor</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Label</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Issuer</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700/50">
              {configs.map((c) => (
                <tr key={c.id} className="text-xs text-surface-300">
                  <td className="px-4 py-2 font-medium text-surface-200">{c.provider.toUpperCase()}</td>
                  <td className="px-4 py-2">{c.label}</td>
                  <td className="max-w-[200px] truncate px-4 py-2 text-surface-500">{c.issuerUrl}</td>
                  <td className="px-4 py-2"><span className="rounded bg-emerald-600/10 px-1.5 py-0.5 text-xs text-emerald-400">Configurado</span></td>
                  <td className="px-4 py-2">
                    <button onClick={() => handleDelete(c.id)} className="text-xs text-red-400 hover:text-red-300">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function RlsTab({ sql }: { sql: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(sql)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-medium text-emerald-400">
          {sql.split("CREATE POLICY").length - 1} políticas definidas
        </div>
        <button onClick={handleCopy} className="rounded-lg bg-surface-800 px-3 py-1 text-xs text-surface-400 hover:bg-surface-700">
          {copied ? "¡Copiado!" : "Copiar SQL"}
        </button>
      </div>
      <pre className="overflow-x-auto rounded-xl border border-surface-700/50 bg-surface-950 p-4 font-mono text-xs text-surface-300">{sql}</pre>
    </div>
  )
}

function SecretsTab({ secrets, pendingRotation, onRefresh }: { secrets: Omit<SecretEntry, "value">[]; pendingRotation: Omit<SecretEntry, "value">[]; onRefresh: () => void }) {
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState("")
  const [value, setValue] = useState("")

  const handleAdd = () => {
    addSecret(name, value)
    setName(""); setValue(""); setShowAdd(false)
    onRefresh()
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-full bg-surface-700 px-3 py-1 text-xs text-surface-300">{secrets.length} secretos</div>
        {pendingRotation.length > 0 && (
          <div className="rounded-full bg-amber-600/10 px-3 py-1 text-xs font-medium text-amber-400">
            ⚠ {pendingRotation.length} secreto(s) requieren rotación
          </div>
        )}
        <button onClick={() => setShowAdd(!showAdd)} className="rounded-lg bg-accent-600 px-3 py-1 text-xs font-medium text-white hover:bg-accent-500">+ Agregar</button>
      </div>

      {showAdd && (
        <div className="mb-4 rounded-xl border border-surface-700/50 bg-surface-900 p-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre (ej. DB_PASSWORD)" className="mb-3 w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-200" />
          <input value={value} onChange={(e) => setValue(e.target.value)} type="password" placeholder="Valor" className="mb-3 w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-200" />
          <button onClick={handleAdd} disabled={!name || !value} className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500 disabled:opacity-50">
            Guardar
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-surface-700/50">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-900 text-surface-400">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase">Versión</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase">Rotado</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase">Próxima Rotación</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-700/50">
            {secrets.map((s) => (
              <tr key={s.id} className="text-xs text-surface-300">
                <td className="px-4 py-2 font-medium text-surface-200">{s.name}</td>
                <td className="px-4 py-2">v{s.version}</td>
                <td className="px-4 py-2">{s.rotatedAt ? new Date(s.rotatedAt).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-2">{s.nextRotationAt ? new Date(s.nextRotationAt).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-2">
                  <span className={`rounded px-1.5 py-0.5 text-xs ${s.enabled ? "bg-emerald-600/10 text-emerald-400" : "bg-surface-700 text-surface-500"}`}>
                    {s.enabled ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EncryptionTab() {
  const [plaintext, setPlaintext] = useState("")
  const [encrypted, setEncrypted] = useState("")
  const [decrypted, setDecrypted] = useState("")
  const [masterKey, setMasterKey] = useState("")
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt")

  useEffect(() => {
    import("@/lib/encryption").then(async (mod) => {
      if (!masterKey) setMasterKey(mod.generateMasterKey())
    })
  }, [])

  const handleEncrypt = async () => {
    const mod = await import("@/lib/encryption")
    const result = await mod.encryptField(plaintext, masterKey)
    setEncrypted(result)
  }

  const handleDecrypt = async () => {
    const mod = await import("@/lib/encryption")
    try {
      const result = await mod.decryptField(encrypted, masterKey)
      setDecrypted(result)
    } catch {
      setDecrypted("Error: clave incorrecta o datos corruptos")
    }
  }

  return (
    <div>
      <div className="mb-4 rounded-xl border border-surface-700/50 bg-surface-900 p-4">
        <h3 className="mb-3 text-sm font-medium text-surface-200">Envelope Encryption (AES-256-GCM + PBKDF2)</h3>
        <div className="mb-3">
          <label className="block text-xs font-medium text-surface-400">Master Key</label>
          <div className="mt-1 flex gap-2">
            <input value={masterKey} onChange={(e) => setMasterKey(e.target.value)} className="flex-1 rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 font-mono text-xs text-surface-200" />
            <button onClick={() => import("@/lib/encryption").then(m => setMasterKey(m.generateMasterKey()))} className="rounded-lg bg-surface-800 px-3 py-2 text-xs text-surface-400 hover:bg-surface-700">
              Generar
            </button>
          </div>
        </div>

        <div className="mb-3">
          <label className="block text-xs font-medium text-surface-400">Texto plano</label>
          <input value={plaintext} onChange={(e) => setPlaintext(e.target.value)} placeholder="PII: RUC, cédula, email..." className="mt-1 w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-200" />
        </div>
        <button onClick={handleEncrypt} disabled={!plaintext} className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500 disabled:opacity-50">
          Encriptar
        </button>

        {encrypted && (
          <div className="mt-4">
            <label className="block text-xs font-medium text-surface-400">Texto encriptado (Base64)</label>
            <textarea readOnly value={encrypted} className="mt-1 w-full rounded-lg border border-surface-700 bg-surface-950 px-3 py-2 font-mono text-xs text-surface-300" rows={2} />
            <button onClick={() => { setMode("decrypt") }} className="mt-2 rounded-lg bg-surface-800 px-4 py-2 text-sm text-surface-400 hover:bg-surface-700">
              Desencriptar
            </button>
          </div>
        )}

        {mode === "decrypt" && encrypted && (
          <div className="mt-4">
            <button onClick={handleDecrypt} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500">
              Desencriptar
            </button>
            {decrypted && (
              <div className="mt-2">
                <label className="block text-xs font-medium text-surface-400">Resultado</label>
                <div className="mt-1 rounded-lg bg-emerald-600/5 px-3 py-2 font-mono text-sm text-emerald-400">{decrypted}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function GdprTab() {
  const [status, setStatus] = useState<string | null>(null)

  const handleExport = async () => {
    const res = await fetch("/api/gdpr/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: "demo-user" }) })
    const data = await res.json()
    setStatus(`Exportación completada: ${data.data?.documents?.length || 0} documentos, ${data.data?.activity?.length || 0} actividades`)
  }

  const handleForget = async () => {
    if (!confirm("¿Solicitar eliminación de todos los datos? Esta acción no se puede revertir.")) return
    const res = await fetch("/api/gdpr/forget", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: "demo-user" }) })
    const data = await res.json()
    setStatus(data.message)
  }

  const handleConsent = async (type: string, granted: boolean) => {
    const res = await fetch("/api/gdpr/consent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: "demo-user", consentType: type, granted }) })
    const data = await res.json()
    setStatus(data.success ? `${granted ? "Consentimiento otorgado" : "Consentimiento revocado"} para ${type}` : "Error")
  }

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <button onClick={handleExport} className="rounded-xl border border-surface-700/50 bg-surface-900 p-4 text-left hover:border-accent-600/30">
          <h3 className="text-sm font-medium text-surface-200">📥 Exportar mis datos</h3>
          <p className="mt-1 text-xs text-surface-400">Descarga todos tus datos personales en formato JSON</p>
        </button>
        <button onClick={handleForget} className="rounded-xl border border-surface-700/50 bg-surface-900 p-4 text-left hover:border-red-600/30">
          <h3 className="text-sm font-medium text-red-400">🗑 Derecho al olvido</h3>
          <p className="mt-1 text-xs text-surface-400">Solicita la eliminación permanente de tus datos</p>
        </button>
        <div className="rounded-xl border border-surface-700/50 bg-surface-900 p-4">
          <h3 className="text-sm font-medium text-surface-200">✅ Gestión de consentimiento</h3>
          <div className="mt-2 space-y-2">
            {["marketing", "analytics", "data_sharing"].map((type) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-xs capitalize text-surface-400">{type}</span>
                <div className="flex gap-1">
                  <button onClick={() => handleConsent(type, true)} className="rounded bg-emerald-600/10 px-2 py-0.5 text-xs text-emerald-400">Grant</button>
                  <button onClick={() => handleConsent(type, false)} className="rounded bg-red-600/10 px-2 py-0.5 text-xs text-red-400">Revoke</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {status && (
        <div className="rounded-xl border border-surface-700/50 bg-surface-900 p-4">
          <p className="text-sm text-surface-300">{status}</p>
        </div>
      )}
    </div>
  )
}
