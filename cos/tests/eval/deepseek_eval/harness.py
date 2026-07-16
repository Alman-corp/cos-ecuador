"""
Evaluation Harness — DeepSeek V4 Flash para COS Ecuador
========================================================

Ejecuta las 200 preguntas del set de evaluación contra uno o más modelos LLM,
compara la respuesta con ground_truth, calcula métricas, y genera un reporte.

Uso:
    python harness.py --config config.yaml
    python harness.py --model deepseek-v4-flash --limit 10  # smoke test
    python harness.py --category tributario_ec  # solo una categoría
    python harness.py --reasoning-effort think-max --limit 30

Requisitos:
    pip install openai anthropic pyyaml python-dottenv rich tiktoken
"""

import os
import sys
import json
import time
import asyncio
import argparse
import logging
from pathlib import Path
from typing import Optional
from datetime import datetime

import yaml
from dotenv import load_dotenv
from openai import AsyncOpenAI
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeRemainingColumn
from rich.table import Table
from rich import print as rprint

# Cargar .env desde la raíz del proyecto
load_dotenv()

console = Console()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("eval_harness")


# === Model Clients ===

class ModelClient:
    """Cliente base abstracto para LLMs."""
    def __init__(self, name: str, config: dict):
        self.name = name
        self.config = config
        self.api_key = os.environ.get(config["api_key_env"])
        if not self.api_key:
            raise ValueError(
                f"❌ Falta la variable de entorno {config['api_key_env']} para el modelo {name}.\n"
                f"   Configúrala en .env o como variable de entorno."
            )

    async def chat(
        self,
        messages: list[dict],
        reasoning_effort: str = "non-think",
        max_tokens: int = 4096,
        temperature: float = 0.3,
    ) -> dict:
        raise NotImplementedError


class DeepSeekClient(ModelClient):
    """Cliente para DeepSeek V4 Flash (compatible OpenAI SDK)."""
    def __init__(self, name: str, config: dict):
        super().__init__(name, config)
        self.client = AsyncOpenAI(
            api_key=self.api_key,
            base_url=self.config["base_url"],
            timeout=60.0,
            max_retries=3,
        )

    async def chat(
        self,
        messages: list[dict],
        reasoning_effort: str = "non-think",
        max_tokens: int = 4096,
        temperature: float = 0.3,
    ) -> dict:
        start = time.time()
        params = {
            "model": self.config["default_model"],
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        if reasoning_effort in ("think-high", "think-max"):
            params["extra_body"] = {"reasoning_effort": reasoning_effort}

        try:
            response = await self.client.chat.completions.create(**params)
            latency_ms = int((time.time() - start) * 1000)
            return {
                "content": response.choices[0].message.content,
                "input_tokens": response.usage.prompt_tokens,
                "output_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
                "cached_tokens": getattr(response.usage, "cached_tokens", 0) or 0,
                "latency_ms": latency_ms,
                "model": response.model,
                "error": None,
            }
        except Exception as e:
            latency_ms = int((time.time() - start) * 1000)
            logger.error(f"Error en {self.name}: {e}")
            return {
                "content": None,
                "input_tokens": 0,
                "output_tokens": 0,
                "total_tokens": 0,
                "cached_tokens": 0,
                "latency_ms": latency_ms,
                "model": self.config["default_model"],
                "error": str(e),
            }


class OpenAIClient(ModelClient):
    def __init__(self, name: str, config: dict):
        super().__init__(name, config)
        self.client = AsyncOpenAI(
            api_key=self.api_key,
            base_url=self.config["base_url"],
            timeout=60.0,
        )

    async def chat(
        self,
        messages: list[dict],
        reasoning_effort: str = "non-think",
        max_tokens: int = 4096,
        temperature: float = 0.3,
    ) -> dict:
        start = time.time()
        try:
            response = await self.client.chat.completions.create(
                model=self.config["default_model"],
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            latency_ms = int((time.time() - start) * 1000)
            return {
                "content": response.choices[0].message.content,
                "input_tokens": response.usage.prompt_tokens,
                "output_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
                "cached_tokens": 0,
                "latency_ms": latency_ms,
                "model": response.model,
                "error": None,
            }
        except Exception as e:
            return {
                "content": None, "input_tokens": 0, "output_tokens": 0,
                "total_tokens": 0, "cached_tokens": 0, "latency_ms": int((time.time() - start) * 1000),
                "model": self.config["default_model"], "error": str(e),
            }


class AnthropicClient(ModelClient):
    """Cliente para Claude (usa SDK OpenAI-compatible con base_url Anthropic)."""
    def __init__(self, name: str, config: dict):
        super().__init__(name, config)
        self.client = AsyncOpenAI(
            api_key=self.api_key,
            base_url=self.config["base_url"],
            timeout=60.0,
            default_headers={"anthropic-version": "2023-06-01"},
        )

    async def chat(
        self,
        messages: list[dict],
        reasoning_effort: str = "non-think",
        max_tokens: int = 4096,
        temperature: float = 0.3,
    ) -> dict:
        start = time.time()
        try:
            response = await self.client.chat.completions.create(
                model=self.config["default_model"],
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            latency_ms = int((time.time() - start) * 1000)
            return {
                "content": response.choices[0].message.content,
                "input_tokens": response.usage.prompt_tokens,
                "output_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
                "cached_tokens": 0,
                "latency_ms": latency_ms,
                "model": response.model,
                "error": None,
            }
        except Exception as e:
            return {
                "content": None, "input_tokens": 0, "output_tokens": 0,
                "total_tokens": 0, "cached_tokens": 0, "latency_ms": int((time.time() - start) * 1000),
                "model": self.config["default_model"], "error": str(e),
            }


def build_client(name: str, config: dict) -> ModelClient:
    """Factory de clientes según el proveedor."""
    provider = config.get("provider", "").lower()
    if provider == "deepseek":
        return DeepSeekClient(name, config)
    elif provider == "openai":
        return OpenAIClient(name, config)
    elif provider == "anthropic":
        return AnthropicClient(name, config)
    else:
        raise ValueError(f"Proveedor no soportado: {provider}")


# === Question Loading ===

def load_questions(questions_dir: str) -> list[dict]:
    """Carga todas las preguntas de los archivos JSONL."""
    questions = []
    qdir = Path(questions_dir)
    if not qdir.exists():
        raise FileNotFoundError(f"No existe {questions_dir}")
    for f in sorted(qdir.glob("*.jsonl")):
        with open(f, "r", encoding="utf-8") as fp:
            for line in fp:
                line = line.strip()
                if not line:
                    continue
                try:
                    q = json.loads(line)
                    q["_source_file"] = f.name
                    questions.append(q)
                except json.JSONDecodeError as e:
                    logger.warning(f"Error parseando línea en {f.name}: {e}")
    logger.info(f"📚 Cargadas {len(questions)} preguntas de {len(list(qdir.glob('*.jsonl')))} archivos")
    return questions


# === Scoring ===

def score_substring(question: dict, response: dict) -> dict:
    """Score simple: ¿el ground_truth aparece como substring en la respuesta?"""
    if not response.get("content"):
        return {"score": 0.0, "method": "substring", "passed": False}
    content_lower = response["content"].lower()
    gt_lower = question["ground_truth"].lower()
    passed = gt_lower in content_lower
    return {
        "score": 1.0 if passed else 0.0,
        "method": "substring",
        "passed": passed,
    }


def score_exact_match(question: dict, response: dict) -> dict:
    if not response.get("content"):
        return {"score": 0.0, "method": "exact_match", "passed": False}
    passed = response["content"].strip() == question["ground_truth"].strip()
    return {
        "score": 1.0 if passed else 0.0,
        "method": "exact_match",
        "passed": passed,
    }


def score_regex(question: dict, response: dict) -> dict:
    if not response.get("content"):
        return {"score": 0.0, "method": "regex", "passed": False}
    import re
    pattern = question.get("regex_pattern", question["ground_truth"])
    try:
        passed = bool(re.search(pattern, response["content"]))
    except re.error:
        passed = False
    return {
        "score": 1.0 if passed else 0.0,
        "method": "regex",
        "passed": passed,
    }


async def score_llm_judge(question: dict, response: dict, judge_client: ModelClient) -> dict:
    """Usa otro LLM para evaluar la calidad de la respuesta (1-5)."""
    if not response.get("content"):
        return {"score": 0.0, "method": "llm_judge", "passed": False, "raw_score": 0}
    judge_prompt = f"""Eres un evaluador experto. Califica la respuesta del modelo a la siguiente pregunta.

PREGUNTA:
{question['question']}

RESPUESTA DEL MODELO:
{response['content']}

GROUND_TRUTH ESPERADO:
{question['ground_truth']}

CRITERIO DE EVALUACIÓN:
{question.get('evaluation_criteria', 'Respuesta correcta y completa')}

INSTRUCCIONES:
- Asigna un puntaje de 1 a 5 donde:
  1 = Completamente incorrecta o no responde
  2 = Parcialmente correcta pero con errores importantes
  3 = Mayormente correcta pero incompleta
  4 = Correcta y completa
  5 = Excelente, supera el ground_truth
- Responde SOLO con el número (1-5) en una línea, sin explicación adicional.
"""
    result = await judge_client.chat(
        messages=[{"role": "user", "content": judge_prompt}],
        max_tokens=10,
        temperature=0.0,
    )
    try:
        raw = int(result["content"].strip()[0])
    except (ValueError, IndexError, TypeError):
        raw = 0
    # Normalizar a 0-1 (3/5 es el mínimo para pasar)
    normalized = max(0.0, min(1.0, raw / 5.0))
    return {
        "score": normalized,
        "method": "llm_judge",
        "passed": raw >= 4,  # 4 o 5 cuenta como aprobado
        "raw_score": raw,
    }


def get_scorer(method: str):
    if method == "substring":
        return score_substring
    if method == "exact_match":
        return score_exact_match
    if method == "regex":
        return score_regex
    return score_substring  # default


# === Cost calculation ===

PRICING = {
    "deepseek-v4-flash": {
        "input": 0.14 / 1_000_000,
        "output": 0.28 / 1_000_000,
        "cache_hit": 0.0028 / 1_000_000,
    },
    "gpt-4o-mini": {
        "input": 0.15 / 1_000_000,
        "output": 0.60 / 1_000_000,
    },
    "claude-haiku-4": {
        "input": 0.25 / 1_000_000,
        "output": 1.25 / 1_000_000,
    },
    "gpt-4o": {
        "input": 2.50 / 1_000_000,
        "output": 10.00 / 1_000_000,
    },
}


def calculate_cost(model_name: str, response: dict) -> dict:
    pricing = PRICING.get(model_name, PRICING["gpt-4o-mini"])
    input_cost = response.get("input_tokens", 0) * pricing["input"]
    output_cost = response.get("output_tokens", 0) * pricing["output"]
    cache_cost = response.get("cached_tokens", 0) * pricing.get("cache_hit", 0)
    total = input_cost + output_cost + cache_cost
    return {
        "input_cost": input_cost,
        "output_cost": output_cost,
        "cache_cost": cache_cost,
        "total_usd": total,
    }


# === Main evaluation loop ===

async def evaluate_single(
    question: dict,
    client: ModelClient,
    scorer_method: str,
    judge_client: Optional[ModelClient] = None,
) -> dict:
    """Evalúa una pregunta contra un modelo."""
    messages = [
        {
            "role": "system",
            "content": "Eres un asistente experto. Responde de forma precisa y completa, en español ecuatoriano profesional. Si no sabes la respuesta con certeza, indícalo claramente."
        },
        {
            "role": "user",
            "content": question["question"]
        }
    ]
    reasoning = question.get("expected_reasoning_effort", "non-think")
    response = await client.chat(messages, reasoning_effort=reasoning)

    if scorer_method == "llm_judge" and judge_client:
        score = await score_llm_judge(question, response, judge_client)
    else:
        scorer = get_scorer(scorer_method)
        score = scorer(question, response)

    cost = calculate_cost(client.name, response)

    return {
        "question_id": question["id"],
        "category": question["category"],
        "difficulty": question["difficulty"],
        "model": client.name,
        "response": response,
        "score": score,
        "cost": cost,
        "reasoning_effort": reasoning,
    }


async def evaluate_all(
    questions: list[dict],
    client: ModelClient,
    config: dict,
    judge_client: Optional[ModelClient] = None,
    limit: Optional[int] = None,
) -> list[dict]:
    """Evalúa todas las preguntas."""
    if limit:
        questions = questions[:limit]
    semaphore = asyncio.Semaphore(config["evaluation"].get("max_concurrent", 3))
    scoring_config = config["scoring"]

    async def sem_task(q):
        async with semaphore:
            method = scoring_config["overrides"].get(q["category"], scoring_config["default_method"])
            return await evaluate_single(q, client, method, judge_client)

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TextColumn("{task.completed}/{task.total}"),
        TimeRemainingColumn(),
        console=console,
    ) as progress:
        task = progress.add_task(
            f"Evaluando {len(questions)} preguntas con {client.name}...",
            total=len(questions),
        )
        tasks = [asyncio.create_task(sem_task(q)) for q in questions]
        results = []
        for coro in asyncio.as_completed(tasks):
            result = await coro
            results.append(result)
            progress.update(task, advance=1)

    return results


# === Reporting ===

def generate_report(results: list[dict], model_name: str) -> dict:
    """Genera un reporte agregado."""
    if not results:
        return {"error": "no results"}

    total = len(results)
    by_difficulty = {}
    by_category = {}
    total_cost = 0.0
    total_latency = 0
    total_input_tokens = 0
    total_output_tokens = 0
    passed = 0
    errors = 0

    for r in results:
        diff = r["difficulty"]
        cat = r["category"]
        by_difficulty.setdefault(diff, {"total": 0, "passed": 0, "scores": []})
        by_difficulty[diff]["total"] += 1
        by_difficulty[diff]["scores"].append(r["score"]["score"])
        if r["score"]["passed"]:
            by_difficulty[diff]["passed"] += 1
            passed += 1

        by_category.setdefault(cat, {"total": 0, "passed": 0, "scores": []})
        by_category[cat]["total"] += 1
        by_category[cat]["scores"].append(r["score"]["score"])
        if r["score"]["passed"]:
            by_category[cat]["passed"] += 1

        if r["response"].get("error"):
            errors += 1

        total_cost += r["cost"]["total_usd"]
        total_latency += r["response"].get("latency_ms", 0)
        total_input_tokens += r["response"].get("input_tokens", 0)
        total_output_tokens += r["response"].get("output_tokens", 0)

    report = {
        "model": model_name,
        "timestamp": datetime.now().isoformat(),
        "total_questions": total,
        "total_passed": passed,
        "overall_pass_rate": passed / total if total else 0,
        "errors": errors,
        "cost_total_usd": total_cost,
        "cost_per_1k_tokens_usd": (
            total_cost / ((total_input_tokens + total_output_tokens) / 1000)
            if (total_input_tokens + total_output_tokens) > 0
            else 0
        ),
        "latency_avg_ms": total_latency / total if total else 0,
        "total_input_tokens": total_input_tokens,
        "total_output_tokens": total_output_tokens,
        "by_difficulty": {
            diff: {
                "total": v["total"],
                "passed": v["passed"],
                "pass_rate": v["passed"] / v["total"] if v["total"] else 0,
                "avg_score": sum(v["scores"]) / len(v["scores"]) if v["scores"] else 0,
            }
            for diff, v in by_difficulty.items()
        },
        "by_category": {
            cat: {
                "total": v["total"],
                "passed": v["passed"],
                "pass_rate": v["passed"] / v["total"] if v["total"] else 0,
                "avg_score": sum(v["scores"]) / len(v["scores"]) if v["scores"] else 0,
            }
            for cat, v in by_category.items()
        },
    }
    return report


def print_report(report: dict, thresholds: dict):
    """Imprime el reporte con formato Rich."""
    console.rule(f"\n[bold cyan]📊 Reporte de Evaluación — {report['model']}[/bold cyan]\n")

    # Resumen
    summary = Table(title="Resumen General", show_header=True, header_style="bold")
    summary.add_column("Métrica", style="cyan")
    summary.add_column("Valor", justify="right")
    summary.add_column("Target", justify="right")
    summary.add_column("Status", justify="center")
    summary.add_row(
        "Total preguntas",
        str(report["total_questions"]),
        "200",
        "—",
    )
    summary.add_row(
        "Pass rate global",
        f"{report['overall_pass_rate']:.1%}",
        "≥ 75%",
        "✅" if report['overall_pass_rate'] >= 0.75 else "❌",
    )
    summary.add_row(
        "Costo total",
        f"${report['cost_total_usd']:.4f}",
        "—",
        "—",
    )
    summary.add_row(
        "Costo por 1K tokens",
        f"${report['cost_per_1k_tokens_usd']:.4f}",
        "≤ $0.30",
        "✅" if report['cost_per_1k_tokens_usd'] <= 0.30 else "❌",
    )
    summary.add_row(
        "Latencia promedio",
        f"{report['latency_avg_ms']:.0f}ms",
        "—",
        "—",
    )
    summary.add_row(
        "Errores",
        str(report["errors"]),
        "0",
        "✅" if report["errors"] == 0 else "⚠️",
    )
    console.print(summary)

    # Por dificultad
    console.print()
    diff_table = Table(title="Por Dificultad", show_header=True, header_style="bold")
    diff_table.add_column("Dificultad", style="cyan")
    diff_table.add_column("Total", justify="right")
    diff_table.add_column("Pass", justify="right")
    diff_table.add_column("Pass Rate", justify="right")
    diff_table.add_column("Avg Score", justify="right")
    diff_table.add_column("Target", justify="right")
    diff_table.add_column("Status", justify="center")
    for diff, v in report["by_difficulty"].items():
        target = thresholds["by_difficulty"].get(diff, 0)
        status = "✅" if v["pass_rate"] >= target else "❌"
        diff_table.add_row(
            diff,
            str(v["total"]),
            str(v["passed"]),
            f"{v['pass_rate']:.1%}",
            f"{v['avg_score']:.2f}",
            f"≥ {target:.0%}",
            status,
        )
    console.print(diff_table)

    # Por categoría
    console.print()
    cat_table = Table(title="Por Categoría", show_header=True, header_style="bold")
    cat_table.add_column("Categoría", style="cyan")
    cat_table.add_column("Total", justify="right")
    cat_table.add_column("Pass", justify="right")
    cat_table.add_column("Pass Rate", justify="right")
    cat_table.add_column("Avg Score", justify="right")
    cat_table.add_column("Target", justify="right")
    cat_table.add_column("Status", justify="center")
    for cat, v in sorted(report["by_category"].items()):
        target = thresholds["by_category"].get(cat, 0)
        status = "✅" if v["pass_rate"] >= target else "❌"
        cat_table.add_row(
            cat,
            str(v["total"]),
            str(v["passed"]),
            f"{v['pass_rate']:.1%}",
            f"{v['avg_score']:.2f}",
            f"≥ {target:.0%}",
            status,
        )
    console.print(cat_table)


# === Main ===

async def main():
    parser = argparse.ArgumentParser(description="Evaluation harness for DeepSeek V4 Flash")
    parser.add_argument("--config", default="config.yaml", help="Path to config.yaml")
    parser.add_argument("--model", default="deepseek-v4-flash", help="Model name to evaluate")
    parser.add_argument("--limit", type=int, help="Limit number of questions (smoke test)")
    parser.add_argument("--category", help="Filter by category")
    parser.add_argument("--difficulty", help="Filter by difficulty (simple, medium, complex, reasoning)")
    parser.add_argument("--reasoning-effort", help="Override reasoning effort")
    parser.add_argument("--output", help="Path to save JSON results")
    args = parser.parse_args()

    config_path = Path(__file__).parent / args.config
    with open(config_path) as f:
        config = yaml.safe_load(f)

    questions = load_questions(config["evaluation"]["questions_dir"])
    if args.category:
        questions = [q for q in questions if q["category"] == args.category]
    if args.difficulty:
        questions = [q for q in questions if q["difficulty"] == args.difficulty]
    if args.reasoning_effort:
        for q in questions:
            q["expected_reasoning_effort"] = args.reasoning_effort

    model_config = next(
        (m for m in config["models"] if m["name"] == args.model),
        None,
    )
    if not model_config:
        console.print(f"[red]❌ Modelo '{args.model}' no encontrado en config.yaml[/red]")
        sys.exit(1)

    try:
        client = build_client(args.model, model_config)
    except ValueError as e:
        console.print(f"[red]{e}[/red]")
        sys.exit(1)

    console.print(f"\n[cyan]🚀 Iniciando evaluación[/cyan]")
    console.print(f"   Modelo: [bold]{args.model}[/bold]")
    console.print(f"   Preguntas: [bold]{len(questions)}[/bold]")
    if args.limit:
        console.print(f"   [yellow]⚠️  Modo smoke test: solo primeras {args.limit} preguntas[/yellow]")
    console.print()

    # Setup judge client (solo si usamos llm_judge)
    judge_client = None
    if config["scoring"]["default_method"] == "llm_judge":
        judge_model_name = config["scoring"]["llm_judge_model"]
        judge_config = next(
            (m for m in config["models"] if m["name"] == judge_model_name),
            None,
        )
        if judge_config:
            try:
                judge_client = build_client(judge_model_name, judge_config)
                console.print(f"   Judge: [bold]{judge_model_name}[/bold]\n")
            except ValueError as e:
                console.print(f"[yellow]⚠️  No se pudo cargar el judge {judge_model_name}: {e}[/yellow]")
                console.print(f"[yellow]   Usando scoring 'substring' como fallback[/yellow]\n")

    results = await evaluate_all(questions, client, config, judge_client, limit=args.limit)
    report = generate_report(results, args.model)
    print_report(report, config["thresholds"])

    # Save results
    results_dir = Path(__file__).parent / config["evaluation"]["results_dir"]
    results_dir.mkdir(exist_ok=True)
    reports_dir = Path(__file__).parent / config["evaluation"]["reports_dir"]
    reports_dir.mkdir(exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = results_dir / f"results_{args.model}_{timestamp}.json"
    report_file = reports_dir / f"report_{args.model}_{timestamp}.json"

    with open(results_file, "w", encoding="utf-8") as f:
        json.dump(
            [
                {
                    "question_id": r["question_id"],
                    "category": r["category"],
                    "difficulty": r["difficulty"],
                    "model": r["model"],
                    "reasoning_effort": r["reasoning_effort"],
                    "response_content": r["response"]["content"],
                    "input_tokens": r["response"]["input_tokens"],
                    "output_tokens": r["response"]["output_tokens"],
                    "latency_ms": r["response"]["latency_ms"],
                    "cost_usd": r["cost"]["total_usd"],
                    "score": r["score"],
                    "error": r["response"]["error"],
                }
                for r in results
            ],
            f,
            indent=2,
            ensure_ascii=False,
        )

    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    console.print(f"\n[green]✅ Resultados guardados en:[/green]")
    console.print(f"   {results_file}")
    console.print(f"   {report_file}")

    # GO/NO-GO
    pass_difficulty = all(
        report["by_difficulty"][d]["pass_rate"] >= threshold
        for d, threshold in config["thresholds"]["by_difficulty"].items()
        if d in report["by_difficulty"]
    )
    pass_category = all(
        report["by_category"][c]["pass_rate"] >= threshold
        for c, threshold in config["thresholds"]["by_category"].items()
        if c in report["by_category"]
    )
    go_no_go = pass_difficulty and pass_category and report["errors"] == 0

    console.rule()
    if go_no_go:
        console.print("[bold green]🎯 DECISIÓN: GO — Proceder con migración a DeepSeek V4 Flash[/bold green]")
    else:
        console.print("[bold red]🛑 DECISIÓN: NO-GO — Revisar resultados antes de continuar[/bold red]")
        if report["errors"] > 0:
            console.print(f"   • {report['errors']} errores en la ejecución")
        if not pass_difficulty:
            failing = [
                d for d, v in report["by_difficulty"].items()
                if v["pass_rate"] < config["thresholds"]["by_difficulty"].get(d, 0)
            ]
            console.print(f"   • Dificultades que no pasan: {failing}")
        if not pass_category:
            failing = [
                c for c, v in report["by_category"].items()
                if v["pass_rate"] < config["thresholds"]["by_category"].get(c, 0)
            ]
            console.print(f"   • Categorías que no pasan: {failing}")
    console.rule()


if __name__ == "__main__":
    asyncio.run(main())
