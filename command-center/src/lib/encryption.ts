const ALGORITHM = "AES-GCM"
const KEY_LENGTH = 256
const IV_LENGTH = 12

async function deriveKey(masterKey: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder().encode(masterKey)
  const keyMaterial = await crypto.subtle.importKey("raw", enc, "PBKDF2", false, ["deriveKey"])
  const saltBuf = salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltBuf, iterations: 600_000, hash: "SHA-256" },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  )
}

export async function encryptField(plaintext: string, masterKey: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const ivBuf = iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer
  const key = await deriveKey(masterKey, salt)
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt({ name: ALGORITHM, iv: ivBuf }, key, encoded)
  const ct = new Uint8Array(ciphertext)
  const combined = new Uint8Array(salt.length + iv.length + ct.length)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(ct, salt.length + iv.length)
  return btoa(Array.from(combined, (b) => String.fromCharCode(b)).join(""))
}

export async function decryptField(encrypted: string, masterKey: string): Promise<string> {
  const combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0))
  const salt = combined.slice(0, 16)
  const iv = combined.slice(16, 16 + IV_LENGTH)
  const ciphertext = combined.slice(16 + IV_LENGTH)
  const key = await deriveKey(masterKey, salt)
  const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, ciphertext)
  return new TextDecoder().decode(decrypted)
}

export function generateMasterKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")
}
