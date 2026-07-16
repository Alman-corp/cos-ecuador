from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime

from engines.dcf.engine import DCFEngine, DCFInput, DCFOutput
from engines.dcf.monte_carlo import MonteCarloSimulator, MonteCarloInput, MonteCarloOutput

router = APIRouter(prefix="/api/v1/financial", tags=["Financial Engine"])

dcf_engine = DCFEngine()
mc_simulator = MonteCarloSimulator()
tasks = {}


@router.post("/dcf", response_model=DCFOutput)
async def calculate_dcf(input: DCFInput):
    try:
        result = dcf_engine.calculate(input)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Error de validación: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en cálculo DCF: {str(e)}")


@router.post("/monte-carlo/async")
async def start_monte_carlo(input: MonteCarloInput, background_tasks: BackgroundTasks):
    task_id = str(uuid.uuid4())
    tasks[task_id] = {
        "status": "processing",
        "started_at": datetime.utcnow(),
        "iterations": input.iterations,
        "result": None,
        "error": None,
    }

    async def run_simulation():
        try:
            result = await mc_simulator.simulate(input)
            tasks[task_id]["result"] = result
            tasks[task_id]["status"] = "completed"
            tasks[task_id]["completed_at"] = datetime.utcnow()
        except Exception as e:
            tasks[task_id]["status"] = "failed"
            tasks[task_id]["error"] = str(e)

    background_tasks.add_task(run_simulation)

    return {
        "task_id": task_id,
        "status": "processing",
        "estimated_time_seconds": input.iterations / 1000,
        "poll_url": f"/api/v1/financial/monte-carlo/{task_id}",
    }


@router.get("/monte-carlo/{task_id}")
async def get_monte_carlo_result(task_id: str):
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task no encontrado")
    task = tasks[task_id]
    if task["status"] == "processing":
        return {"task_id": task_id, "status": "processing", "elapsed_seconds": (datetime.utcnow() - task["started_at"]).total_seconds()}
    if task["status"] == "failed":
        raise HTTPException(status_code=500, detail=task["error"])
    return {"task_id": task_id, "status": "completed", "result": task["result"]}


@router.post("/stress-test")
async def stress_test(params: dict):
    return {"status": "ok", "projection": [], "metrics": {}}


@router.get("/health")
async def financial_health():
    return {"status": "healthy", "engine": "financial", "capabilities": ["dcf", "monte_carlo", "stress_test"], "version": "3.0.0"}
