"""
Smoke Test — DeepSeek V4 Flash
================================

Test rápido (10 preguntas) para validar la conexión y obtener una primera
impresión de la calidad del modelo antes de ejecutar la evaluación completa.

Uso:
    python smoke_test.py
    python smoke_test.py --api-key sk-xxx  # override de API key
"""

import os
import sys
import asyncio
import time
import json
from pathlib import Path
from openai import AsyncOpenAI
from rich.console import Console
from rich.table import Table
from rich import print as rprint

console = Console()

# Preguntas de muestra (3 por categoría, las más representativas)
SAMPLE_QUESTIONS = [
    {
        "id": "Q091",
        "category": "tributario_ec",
        "difficulty": "medium",
        "question": "¿Cuánto IVA debe cobrar una consultora en Quito por un servicio de USD 1,000?",
        "ground_truth": "USD 150 (15% de USD 1,000). El total facturado es USD 1,150.",
        "expected_reasoning_effort": "non-think",
    },
    {
        "id": "Q094",
        "category": "tributario_ec",
        "difficulty": "medium",
        "question": "Una sociedad ecuatoriana tuvo USD 200,000 de utilidad antes de impuestos en 2025. ¿Cuánto paga de Impuesto a la Renta?",
        "ground_truth": "USD 200,000 × 25% (tarifa general PJ desde 2024) = USD 50,000.",
        "expected_reasoning_effort": "non-think",
    },
    {
        "id": "Q052",
        "category": "extraccion_datos",
        "difficulty": "medium",
        "question": "Del RUC 0998765432001, identifica: provincia, tipo de entidad, y número de establecimiento.",
        "ground_truth": "Provincia: 09 (Guayas). Tipo: 9 (sociedad). Secuencial: 8765432. Establecimiento: 001.",
        "expected_reasoning_effort": "non-think",
    },
    {
        "id": "Q145",
        "category": "diagnostico_financiero",
        "difficulty": "complex",
        "question": "Calcula el Z-Score de Altman para una empresa con: Capital de trabajo 200K, Activos totales 1,000K, Utilidades retenidas 150K, EBIT 120K, Valor mercado patrimonio 800K, Ventas 1,500K, Pasivo total 600K. ¿Está en riesgo?",
        "ground_truth": "Z = 3.144. Zona segura (> 2.99).",
        "expected_reasoning_effort": "think-max",
    },
    {
        "id": "Q125",
        "category": "clausulas_legales",
        "difficulty": "complex",
        "question": "Detecta problemas: 'Cualquiera de las partes puede terminar el contrato en cualquier momento sin previo aviso'",
        "ground_truth": "Problemas graves: falta de preaviso, no distingue incumplimiento, no regula trabajo en curso, no obliga a justificar.",
        "expected_reasoning_effort": "think-high",
    },
    {
        "id": "Q161",
        "category": "multi_hop_rag",
        "difficulty": "complex",
        "question": "Cliente tiene RUC 1791234567001. En el sistema tenemos: (1) Factura del cliente al consumidor final por USD 1,150. (2) Retención en la fuente del 8% sobre USD 1,000 de honorarios. (3) Nota de crédito que anula la factura original. ¿Cuál es la situación fiscal del cliente?",
        "ground_truth": "La factura original se anuló (NC), por lo que NO se reporta como venta. La retención tampoco aplica porque la factura base no existe.",
        "expected_reasoning_effort": "think-high",
    },
    {
        "id": "Q181",
        "category": "edge_cases",
        "difficulty": "complex",
        "question": "Cliente quiere subir 100,000 registros con RUC, cédula, email, teléfono. ¿Qué obligaciones LOPDP debe cumplir?",
        "ground_truth": "Registro RNBDP, consentimiento explícito, principios, derechos ARCO+P, seguridad, transferencia internacional con consentimiento, etc.",
        "expected_reasoning_effort": "think-high",
    },
    {
        "id": "Q003",
        "category": "es_general",
        "difficulty": "simple",
        "question": "Resume en una sola oración: 'La empresa Almacenes El Costo S.A. cerró el ejercicio fiscal 2025 con ventas de USD 12,4 millones, lo que representó un incremento del 8,3% respecto al año anterior, impulsado principalmente por la apertura de tres nuevas sucursales en Guayaquil y la consolidación del canal de ventas online'.",
        "ground_truth": "Almacenes El Costo S.A. creció 8,3% en ventas en 2025 (USD 12,4M) por nuevas sucursales en Guayaquil y canal online.",
        "expected_reasoning_effort": "non-think",
    },
    {
        "id": "Q031",
        "category": "clasificacion_docs",
        "difficulty": "simple",
        "question": "Clasifica el siguiente documento: 'Factura No. 001-001-000123456, RUC 1791234567001, fecha 15/03/2026, subtotal USD 1,000, IVA 15% USD 150, total USD 1,150'.",
        "ground_truth": "Factura electrónica.",
        "expected_reasoning_effort": "non-think",
    },
    {
        "id": "Q074",
        "category": "resumen_balance",
        "difficulty": "medium",
        "question": "Calcula: razón circulante, prueba ácida, razón de deuda, ROE. Datos: Activo corriente 800,000; Pasivo corriente 400,000; Inventarios 200,000; Activo total 2,000,000; Pasivo total 1,200,000; Patrimonio 800,000; Utilidad neta 200,000.",
        "ground_truth": "RC=2.0, PA=1.5, RD=0.6, ROE=0.25",
        "expected_reasoning_effort": "non-think",
    },
]


async def run_smoke_test():
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        console.print("[red]❌ DEEPSEEK_API_KEY no está configurada[/red]")
        console.print("Configúrala en .env o como variable de entorno")
        sys.exit(1)

    client = AsyncOpenAI(
        api_key=api_key,
        base_url="https://api.deepseek.com",
        timeout=60.0,
        max_retries=3,
    )

    console.print("\n[bold cyan]🔥 Smoke Test — DeepSeek V4 Flash[/bold cyan]")
    console.print(f"   Preguntas: {len(SAMPLE_QUESTIONS)}")
    console.print(f"   Endpoint: https://api.deepseek.com\n")

    results = []
    total_cost = 0.0
    total_input = 0
    total_output = 0

    for q in SAMPLE_QUESTIONS:
        console.print(f"[yellow]⏳ {q['id']}[/yellow] ({q['category']}, {q['difficulty']}, {q['expected_reasoning_effort']})")
        start = time.time()
        try:
            params = {
                "model": "deepseek-chat",
                "messages": [
                    {
                        "role": "system",
                        "content": "Eres un asistente experto. Responde en español ecuatoriano profesional, de forma precisa y completa. Si no sabes con certeza, indícalo."
                    },
                    {"role": "user", "content": q["question"]}
                ],
                "max_tokens": 2048,
                "temperature": 0.3,
            }
            if q["expected_reasoning_effort"] in ("think-high", "think-max"):
                params["extra_body"] = {"reasoning_effort": q["expected_reasoning_effort"]}

            response = await client.chat.completions.create(**params)
            latency_ms = int((time.time() - start) * 1000)
            content = response.choices[0].message.content
            input_t = response.usage.prompt_tokens
            output_t = response.usage.completion_tokens
            cost = input_t * 0.14 / 1_000_000 + output_t * 0.28 / 1_000_000
            total_cost += cost
            total_input += input_t
            total_output += output_t

            # Scoring simple: ¿ground_truth aparece en la respuesta?
            passed = q["ground_truth"].lower() in content.lower()
            results.append({
                "id": q["id"],
                "category": q["category"],
                "difficulty": q["difficulty"],
                "reasoning_effort": q["expected_reasoning_effort"],
                "passed": passed,
                "latency_ms": latency_ms,
                "input_tokens": input_t,
                "output_tokens": output_t,
                "cost_usd": cost,
                "response_preview": content[:200] + "..." if len(content) > 200 else content,
            })
            status = "[green]✅ PASS[/green]" if passed else "[red]❌ FAIL[/red]"
            console.print(f"   {status} | {latency_ms}ms | {input_t}+{output_t} tok | ${cost:.6f}")
        except Exception as e:
            console.print(f"   [red]❌ Error: {e}[/red]")
            results.append({"id": q["id"], "error": str(e)})

    # Resumen
    console.rule("\n[bold cyan]📊 Resumen Smoke Test[/bold cyan]")
    passed = sum(1 for r in results if r.get("passed"))
    total = len(results)
    table = Table(show_header=True, header_style="bold")
    table.add_column("Métrica", style="cyan")
    table.add_column("Valor", justify="right")
    table.add_row("Pass rate", f"{passed}/{total} ({100*passed/total:.0f}%)")
    table.add_row("Costo total", f"${total_cost:.6f}")
    table.add_row("Tokens input", str(total_input))
    table.add_row("Tokens output", str(total_output))
    console.print(table)

    # Veredicto
    if passed == total:
        console.print("\n[bold green]🎯 PERFECTO: Smoke test pasa todas las preguntas. Listo para evaluación completa.[/bold green]")
    elif passed >= total * 0.7:
        console.print("\n[bold yellow]⚠️  ACEPTABLE: Pasó 70%+ del smoke test. Revisar fallos antes de evaluación completa.[/bold yellow]")
    else:
        console.print("\n[bold red]🛑 REVISAR: Smoke test tiene <70% pass rate. Validar prompts o modelo antes de continuar.[/bold red]")

    # Mostrar fallos para revisión
    failures = [r for r in results if not r.get("passed")]
    if failures:
        console.print("\n[bold]Fallos para revisar:[/bold]")
        for f in failures:
            console.print(f"\n[red]{f['id']}[/red] ({f['category']}, {f['difficulty']})")
            console.print(f"   [dim]Respuesta (preview): {f.get('response_preview', 'N/A')}[/dim]")

    # Guardar resultados
    out_file = Path(__file__).parent / "results" / f"smoke_test_{time.strftime('%Y%m%d_%H%M%S')}.json"
    out_file.parent.mkdir(exist_ok=True)
    with open(out_file, "w", encoding="utf-8") as fp:
        json.dump(results, fp, indent=2, ensure_ascii=False)
    console.print(f"\n[dim]Resultados guardados en: {out_file}[/dim]")


if __name__ == "__main__":
    asyncio.run(run_smoke_test())
