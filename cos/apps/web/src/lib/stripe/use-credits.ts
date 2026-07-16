import { prisma } from '@/lib/db/prisma'

export async function consumeDDCredit(
  companyId: string
): Promise<{ success: boolean; remaining: number; error?: string }> {
  try {
    const credit = await prisma.dueDiligenceCredit.findUnique({
      where: { companyId },
    })

    if (!credit) {
      return { success: false, remaining: 0, error: 'No credit plan found' }
    }

    if (credit.creditsUsed >= credit.creditsLimit) {
      return { success: false, remaining: 0, error: 'No credits remaining' }
    }

    await prisma.dueDiligenceCredit.update({
      where: { companyId },
      data: { creditsUsed: { increment: 1 } },
    })

    return { success: true, remaining: credit.creditsLimit - credit.creditsUsed - 1 }
  } catch {
    return { success: false, remaining: 0, error: 'Error checking credits' }
  }
}

export async function getDDCredits(companyId: string) {
  try {
    const credit = await prisma.dueDiligenceCredit.findUnique({
      where: { companyId },
    })
    if (!credit) return null
    return {
      limit: credit.creditsLimit,
      used: credit.creditsUsed,
      remaining: credit.creditsLimit - credit.creditsUsed,
      resetsAt: credit.creditsResetAt,
    }
  } catch {
    return null
  }
}
