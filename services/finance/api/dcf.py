from fastapi import APIRouter, HTTPException
from engines.dcf_engine import DCFEngine, DCFInput, DCFOutput
from engines.monte_carlo_engine import MonteCarloEngine, MonteCarloInput, MonteCarloOutput

router = APIRouter(prefix="/api/v1/finance", tags=["DCF Valuation"])
dcf_engine = DCFEngine()
mc_engine = MonteCarloEngine()


@router.post(
    "/dcf",
    response_model=DCFOutput,
    summary="Full DCF Valuation",
    description="Calcula el DCF (Flujo de Caja Descontado) con CAPM, WACC, FCF proyectados y valor terminal.",
)
async def full_dcf(input_data: DCFInput):
    try:
        return dcf_engine.calculate(input_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en DCF: {str(e)}")


@router.post(
    "/dcf/monte-carlo",
    response_model=MonteCarloOutput,
    summary="Monte Carlo Simulation",
    description="Simulación Monte Carlo del DCF variando crecimiento, margen EBITDA, WACC y crecimiento terminal.",
)
async def monte_carlo_simulation(input_data: MonteCarloInput):
    try:
        return mc_engine.simulate(input_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en Monte Carlo: {str(e)}")


@router.post(
    "/dcf/sensitivity",
    response_model=dict,
    summary="Sensitivity Analysis",
    description="Tabla de sensibilidad 5x5 del valor de equity variando WACC y crecimiento terminal.",
)
async def sensitivity_analysis(input_data: DCFInput):
    try:
        result = dcf_engine.calculate(input_data)
        wacc = result.wacc
        growth = input_data.terminal_growth_rate / 100
        wacc_steps = [round(wacc - 0.02, 4), round(wacc - 0.01, 4), round(wacc, 4), round(wacc + 0.01, 4), round(wacc + 0.02, 4)]
        growth_steps = [round(growth - 0.01, 4), round(growth - 0.005, 4), round(growth, 4), round(growth + 0.005, 4), round(growth + 0.01, 4)]
        return {
            "wacc_values": wacc_steps,
            "growth_values": growth_steps,
            "equity_values": result.sensitivity_table,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en sensibilidad: {str(e)}")
