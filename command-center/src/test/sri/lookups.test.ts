import { describe, it, expect } from "vitest"
import {
  PROVINCIAS,
  RETENCIONES_SRI,
  ICE_PRODUCTOS,
  CALENDARIO_SRI,
  getProvinciaByCodigo,
  getProvinciaPorRuc,
  getRetencionByCodigo,
  getRetencionByTipo,
  getICEPorProducto,
  getICEPorCategoria,
} from "@/lib/sri/lookups"

describe("PROVINCIAS", () => {
  it("has 24 provinces", () => {
    expect(PROVINCIAS).toHaveLength(24)
  })

  it("includes Pichincha with code 17", () => {
    const pichincha = PROVINCIAS.find((p) => p.codigo === "17")
    expect(pichincha?.nombre).toBe("Pichincha")
  })

  it("includes Guayas with code 09", () => {
    const guayas = PROVINCIAS.find((p) => p.codigo === "09")
    expect(guayas?.nombre).toBe("Guayas")
  })
})

describe("getProvinciaByCodigo", () => {
  it("returns province for valid code", () => {
    expect(getProvinciaByCodigo("01")?.nombre).toBe("Azuay")
  })

  it("returns undefined for invalid code", () => {
    expect(getProvinciaByCodigo("99")).toBeUndefined()
  })
})

describe("getProvinciaPorRuc", () => {
  it("extracts province from RUC first 2 digits", () => {
    expect(getProvinciaPorRuc("1799999999001")?.nombre).toBe("Pichincha")
  })
})

describe("RETENCIONES_SRI", () => {
  it("has retenciones defined", () => {
    expect(RETENCIONES_SRI.length).toBeGreaterThan(0)
  })

  it("includes honorarios profesionales at 8%", () => {
    const honorarios = RETENCIONES_SRI.find((r) => r.codigo === "303")
    expect(honorarios?.porcentaje).toBe(8)
    expect(honorarios?.tipo).toBe("servicios")
  })

  it("includes bienes at 1%", () => {
    const bienes = RETENCIONES_SRI.find((r) => r.codigo === "322")
    expect(bienes?.porcentaje).toBe(1)
    expect(bienes?.tipo).toBe("bienes")
  })
})

describe("getRetencionByCodigo", () => {
  it("returns retencion for valid codigo", () => {
    expect(getRetencionByCodigo("303")?.concepto).toBe("Honorarios profesionales")
  })
})

describe("getRetencionByTipo", () => {
  it("filters by tipo bienes", () => {
    const bienes = getRetencionByTipo("bienes")
    expect(bienes.every((r) => r.tipo === "bienes")).toBe(true)
  })

  it("filters by tipo arriendo", () => {
    const arriendos = getRetencionByTipo("arriendo")
    expect(arriendos.every((r) => r.tipo === "arriendo")).toBe(true)
  })
})

describe("ICE_PRODUCTOS", () => {
  it("has ICE products defined", () => {
    expect(ICE_PRODUCTOS.length).toBeGreaterThan(0)
  })

  it("includes vehiculos category", () => {
    const vehiculos = ICE_PRODUCTOS.filter((p) => p.categoria === "vehiculos")
    expect(vehiculos.length).toBeGreaterThanOrEqual(3)
  })
})

describe("getICEPorProducto", () => {
  it("returns product for valid codigo", () => {
    expect(getICEPorProducto("01")?.producto).toContain("Vehículos")
  })
})

describe("getICEPorCategoria", () => {
  it("filters by categoria", () => {
    const alcohol = getICEPorCategoria("alcohol")
    expect(alcohol.every((p) => p.categoria === "alcohol")).toBe(true)
  })
})

describe("CALENDARIO_SRI", () => {
  it("has entries for all digits 0-9", () => {
    expect(Object.keys(CALENDARIO_SRI)).toHaveLength(10)
  })

  it("digito 1 maps to day 10", () => {
    expect(CALENDARIO_SRI["1"].fechaPagoIva).toBe(10)
  })

  it("digito 8 maps to day 24", () => {
    expect(CALENDARIO_SRI["8"].fechaPagoIva).toBe(24)
  })
})
