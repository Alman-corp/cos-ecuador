import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      ingresos0 = 0,
      ingresos12 = 0,
      ingresos15 = 0,
      ivaCompras = 0,
      retencionesRecibidas = 0,
    } = body

    const ivaCobrado12 = ingresos12 * 0.12
    const ivaCobrado15 = ingresos15 * 0.15
    const ivaVentas = ivaCobrado12 + ivaCobrado15
    const ivaNeto = ivaVentas - ivaCompras
    const saldoAPagar = Math.max(0, ivaNeto - retencionesRecibidas)
    const saldoAFavor = saldoAPagar === 0 ? Math.abs(ivaNeto - retencionesRecibidas) : 0

    const totalIngresos = ingresos0 + ingresos12 + ingresos15
    const baseGravable = ingresos12 + ingresos15
    const porcentajeCarga = baseGravable > 0 ? (ivaVentas / baseGravable) * 100 : 0

    return NextResponse.json({
      ivaCobrado12,
      ivaCobrado15,
      ivaVentas,
      ivaCompras,
      retencionesRecibidas,
      ivaNeto,
      saldoAPagar,
      saldoAFavor,
      detalles: {
        totalIngresos,
        baseGravable,
        porcentajeCarga: Math.round(porcentajeCarga * 100) / 100,
        ingresos0,
        ingresos12,
        ingresos15,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error interno"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
