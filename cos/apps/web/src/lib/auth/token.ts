import { prisma } from "@/lib/db/prisma"
import crypto from "crypto"
import { env } from "@/lib/env"

export interface SessionPayload {
  userId: string
  companyId: string
  email: string
  role: string
}

function getTokenSecret(): Buffer {
  if (!env.TOKEN_SECRET) {
    throw new Error("TOKEN_SECRET is required. Set it in .env.local")
  }
  return Buffer.from(env.TOKEN_SECRET.slice(0, 32))
}

function encode(payload: SessionPayload): string {
  const data = JSON.stringify(payload)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv("aes-256-gcm", getTokenSecret(), iv)
  const encrypted = Buffer.concat([cipher.update(data, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString("base64url")
}

function decode(token: string): SessionPayload | null {
  try {
    const buf = Buffer.from(token, "base64url")
    const iv = buf.subarray(0, 16)
    const tag = buf.subarray(16, 32)
    const encrypted = buf.subarray(32)
    const decipher = crypto.createDecipheriv("aes-256-gcm", getTokenSecret(), iv)
    decipher.setAuthTag(tag)
    const decrypted = decipher.update(encrypted) + decipher.final("utf8")
    return JSON.parse(decrypted)
  } catch { return null }
}

export async function createSession(userId: string, companyId: string, email: string, role: string): Promise<string> {
  const payload: SessionPayload = { userId, companyId, email, role }
  const token = encode(payload)

  await prisma.user.update({
    where: { id: userId },
    data: { authId: token, lastLoginAt: new Date() },
  })

  return token
}

export function verifySession(token: string): SessionPayload | null {
  return decode(token)
}

export async function getSessionFromRequest(req: Request): Promise<SessionPayload | null> {
  const cookie = req.headers.get("cookie") || ""
  const token = cookie.split(";").find((c) => c.trim().startsWith("cos_session="))?.split("=")[1]
  if (!token) return null

  const payload = verifySession(token)
  if (!payload) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { isActive: true },
  })
  if (!user?.isActive) return null

  return payload
}
