import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const params = await req.json()

  const {
    initialCash = 500000,
    monthlyRevenue = 200000,
    monthlyCogs = 120000,
    monthlyOpex = 80000,
    revenueGrowth = 0.05,
    cogsPctOfRevenue = 0.6,
    opexGrowth = 0.03,
    months = 12,
    shockMonth = 3,
    revenueShock = -0.3,
    cogsIncrease = 0.1,
    interestRateHike = 0.02,
  } = params

  let cash = initialCash || initialRevenue * 2
  const monthlyData: Array<{ month: number; revenue: number; cogs: number; opex: number; netCashFlow: number; cashBalance: number }> = []
  let rev = initialRevenue
  let opexBase = monthlyOpex
  let interestRate = 0.05
  let cashoutMonth: number | null = null

  for (let m = 1; m <= months; m++) {
    let monthRevenue = rev * (1 + revenueGrowth)
    let monthCogs = monthRevenue * cogsPctOfRevenue
    let monthOpex = opexBase * (1 + opexGrowth)

    if (m === shockScenario) {
      monthRevenue *= (1 + revenueShock)
      monthCogs *= (1 + cogsIncrease)
      interestRate += interestRateHike
    }

    const interest = cash * (interestRate / 12)
    const netCashFlow = monthRevenue - monthCogs - monthOpex - interest
    cash += netCashFlow

    if (cash <= 0 && cashoutMonth === null) {
      cashoutMonth = m
    }

    monthlyData.push({
      month: m,
      revenue: +monthRevenue.toFixed(0),
      cogs: +monthCogs.toFixed(0),
      opex: +monthOpex.toFixed(0),
      netCashFlow: +netCashFlow.toFixed(0),
      cashBalance: +cash.toFixed(0),
    })

    rev = monthRevenue
    opexBase = monthOpex
  }

  return NextResponse.json({
    monthlyData,
    cashoutMonth,
    finalCashBalance: +cash.toFixed(0),
    totalMonths: months,
    scenario: {
      shockMonth: shockScenario,
      revenueShock: `${(revenueShock * 100).toFixed(0)}%`,
      cogsIncrease: `${(cogsIncrease * 100).toFixed(0)}%`,
      interestRateHike: `${(interestRateHike * 100).toFixed(0)}%`,
    },
  })
}