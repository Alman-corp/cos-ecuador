from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/finance", tags=["Market Data"])

ECUADOR_RISK_FREE = 4.50
ECUADOR_ERP = 6.50
ECUADOR_EMBI = 3.80
ECUADOR_COUNTRY_RISK = 4.00


@router.get(
    "/market/risk-free-rate",
    summary="Ecuador Risk-Free Rate",
    description="Tasa libre de riesgo para Ecuador: US Treasury 10Y (~4.25%) + CDS Spread Ecuador (~0.25%).",
)
async def get_risk_free_rate():
    return {
        "rate": ECUADOR_RISK_FREE,
        "description": "US Treasury 10Y (4.25%) + Ecuador CDS Spread (0.25%)",
        "source": "Bloomberg / BCE Referencial",
        "updated": "2026-07",
    }


@router.get(
    "/market/equity-risk-premium",
    summary="Equity Risk Premium for Ecuador",
    description="Prima de riesgo de mercado para Ecuador (ERP emergente ajustado).",
)
async def get_equity_risk_premium():
    return {
        "erp": ECUADOR_ERP,
        "description": "Damodaran ERP Emerging Markets (6.5%) ajustado Ecuador",
        "source": "Damodaran / BCE",
        "updated": "2026-07",
    }


@router.get(
    "/market/country-risk",
    summary="Ecuador Country Risk",
    description="Riesgo país Ecuador: EMBI + Country Risk Premium.",
)
async def get_country_risk():
    return {
        "embi": ECUADOR_EMBI,
        "country_risk_premium": ECUADOR_COUNTRY_RISK,
        "description": "EMBI Ecuador ~380bps, Country Risk Premium ~4.0%",
        "source": "JP Morgan EMBI / BCE",
        "updated": "2026-07",
    }
