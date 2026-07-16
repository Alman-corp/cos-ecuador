"""
Script de validación: verifica que todos los archivos del eval están bien.
"""
import os
import sys
import ast
import json
import yaml
from pathlib import Path

EVAL_DIR = Path(r"C:\Users\hp\OneDrive\Desktop\TESIS\tesis carlos\CONSULTORIA\cos\tests\eval\deepseek_eval")

print("=" * 60)
print("🔍 VALIDACIÓN DE EVAL HARNESS — DEEPSEEK V4 FLASH")
print("=" * 60)

# 1. Validar sintaxis Python
print("\n[1/5] Validando sintaxis Python...")
for pyfile in ["harness.py", "smoke_test.py"]:
    fp = EVAL_DIR / pyfile
    try:
        ast.parse(open(fp, encoding="utf-8").read())
        print(f"  ✅ {pyfile}: sintaxis OK")
    except SyntaxError as e:
        print(f"  ❌ {pyfile}: error de sintaxis línea {e.lineno}: {e.msg}")
        sys.exit(1)

# 2. Validar config.yaml
print("\n[2/5] Validando config.yaml...")
try:
    cfg = yaml.safe_load(open(EVAL_DIR / "config.yaml", encoding="utf-8"))
    models = [m["name"] for m in cfg["models"]]
    print(f"  ✅ config.yaml: {len(models)} modelos configurados: {models}")
except Exception as e:
    print(f"  ❌ config.yaml: {e}")
    sys.exit(1)

# 3. Contar y validar preguntas JSONL
print("\n[3/5] Validando preguntas JSONL...")
questions_dir = EVAL_DIR / "questions"
total = 0
cats = {}
diffs = {}
errors = []

for f in sorted(questions_dir.glob("*.jsonl")):
    file_count = 0
    with open(f, encoding="utf-8") as fp:
        for line_num, line in enumerate(fp, 1):
            line = line.strip()
            if not line:
                continue
            try:
                q = json.loads(line)
                # Validar campos requeridos
                required = ["id", "category", "difficulty", "question", "ground_truth", "expected_reasoning_effort"]
                missing = [r for r in required if r not in q]
                if missing:
                    errors.append(f"{f.name}:{line_num} faltan campos {missing}")
                    continue
                file_count += 1
                total += 1
                cats[q["category"]] = cats.get(q["category"], 0) + 1
                diffs[q["difficulty"]] = diffs.get(q["difficulty"], 0) + 1
            except json.JSONDecodeError as e:
                errors.append(f"{f.name}:{line_num} JSON inválido: {e}")
    print(f"  📄 {f.name}: {file_count} preguntas")

if errors:
    print(f"\n  ❌ {len(errors)} errores:")
    for e in errors[:10]:
        print(f"     {e}")
    sys.exit(1)

print(f"\n  ✅ Total: {total} preguntas")
print(f"  ✅ Por categoría: {cats}")
print(f"  ✅ Por dificultad: {diffs}")

# 4. Verificar distribución esperada
print("\n[4/5] Verificando distribución esperada...")
expected_cats = {
    "es_general": 30,
    "clasificacion_docs": 20,
    "extraccion_datos": 20,
    "resumen_balance": 20,
    "tributario_ec": 30,
    "clausulas_legales": 20,
    "diagnostico_financiero": 20,
    "multi_hop_rag": 20,
    "edge_cases": 20,
}
expected_total = sum(expected_cats.values())

if total != expected_total:
    print(f"  ❌ Total {total} != esperado {expected_total}")
    sys.exit(1)

for cat, expected in expected_cats.items():
    actual = cats.get(cat, 0)
    status = "✅" if actual == expected else "❌"
    print(f"  {status} {cat}: {actual}/{expected}")

# 5. Verificar archivos auxiliares
print("\n[5/5] Verificando archivos auxiliares...")
aux_files = ["README.md", "requirements.txt", ".env.example"]
for f in aux_files:
    fp = EVAL_DIR / f
    if fp.exists() and fp.stat().st_size > 0:
        size = fp.stat().st_size
        print(f"  ✅ {f}: {size} bytes")
    else:
        print(f"  ❌ {f}: falta o vacío")

# Resumen final
print("\n" + "=" * 60)
print("🎉 VALIDACIÓN COMPLETA — Todo listo para usar")
print("=" * 60)
print(f"""
📊 Resumen:
   • {total} preguntas distribuidas en {len(cats)} categorías
   • {len(diffs)} niveles de dificultad (simple, medium, complex, reasoning)
   • 2 modelos de scoring: substring + LLM-as-judge
   • 3 modelos LLM configurados: DeepSeek, GPT-4o-mini, Claude Haiku 4

🚀 Próximos pasos:
   1. Copia .env.example a .env y agrega tus API keys reales
   2. Ejecuta: python smoke_test.py
   3. Si el smoke test pasa, ejecuta: python harness.py
   4. Revisa los reportes en ./reports/

💰 Costo estimado de la evaluación completa: ~$1.20 USD (V4 Flash)
""")
