#!/bin/bash
# Diagnóstico COS Ecuador — Estado real del proyecto
# Ejecutar: bash diagnostico.sh

echo "==========================================="
echo "   DIAGNÓSTICO COS ECUADOR — $(date '+%Y-%m-%d %H:%M')"
echo "============================================"
echo ""

# 1. SERVICIOS DOCKER ACTIVOS
echo "[1/5] Servicios Docker corriendo:"
if command -v docker &> /dev/null && docker info &> /dev/null; then
    containers=$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null)
    if [ -n "$containers" ]; then
        docker ps --format "table {{.Names}}\t{{.Status}}" | head -20
        total_docker=$(docker ps -q | wc -l)
        echo "   Total: $total_docker contenedores activos"
    else
        echo "   No hay contenedores Docker corriendo"
    fi
else
    echo "   Docker no está instalado o no está corriendo"
fi
echo ""

# 2. PUERTOS EN ESCUCHA (servicios FastAPI y Next.js)
echo "[2/5] Puertos en escucha (servicios locales):"
ports_to_check=(3000 8000 8001 8002 8003 8004 8005 8006 8007 8008 8009 8010 8011 5432 6379)
found_any=false
for port in "${ports_to_check[@]}"; do
    if lsof -i :$port &> /dev/null 2>&1 || ss -tln 2>/dev/null | grep -q ":$port "; then
        process=$(lsof -i :$port -sTCP:LISTEN 2>/dev/null | awk 'NR==2 {print $1}' || echo "unknown")
        echo "   Puerto $port activo ($process)"
        found_any=true
    fi
done
if [ "$found_any" = false ]; then
    echo "   No se detectaron servicios en puertos conocidos"
fi
echo ""

# 3. FRONTEND — Conectado a URLs reales o mocks?
echo "[3/5] Frontend Next.js — Datos reales o mocks?"
next_dir=""
for d in "apps/web" "command-center" "apps/command-center" "frontend"; do
    if [ -d "$d" ]; then
        next_dir="$d"
        break
    fi
done

if [ -n "$next_dir" ]; then
    echo "   Directorio Next.js detectado: $next_dir"

    # URLs reales
    real_patterns=$(grep -rE "(NEXT_PUBLIC_API_URL|API_URL|BASE_URL)" "$next_dir" 2>/dev/null | grep -vE "(node_modules|\.next)" | wc -l)

    # Mocks
    mocks_count=$(grep -rE "(mockData|MOCK_|fixtures/|hardcoded|dummyData)" "$next_dir/src" "$next_dir/app" "$next_dir/pages" 2>/dev/null | wc -l)

    echo "   Referencias a API URL en codigo: $real_patterns"
    echo "   Referencias a mocks/fixtures: $mocks_count"

    if [ -f "$next_dir/.env.local" ]; then
        echo "   .env.local encontrado"
        grep -E "(API_URL|NEXT_PUBLIC)" "$next_dir/.env.local" 2>/dev/null | sed 's/^/      /' | head -5
    elif [ -f "$next_dir/.env" ]; then
        echo "   Solo .env encontrado (no .env.local)"
    else
        echo "   No hay archivo .env"
    fi

    if [ "$mocks_count" -gt 10 ] && [ "$real_patterns" -lt 3 ]; then
        echo "   VEREDICTO: Frontend usa MAYORITARIAMENTE mocks"
    elif [ "$real_patterns" -gt 3 ]; then
        echo "   VEREDICTO: Frontend conectado a APIs reales"
    else
        echo "   VEREDICTO: Conexion parcial — revisar"
    fi
else
    echo "   No se encontro directorio Next.js"
fi
echo ""

# 4. TESTS — Ultima ejecucion
echo "[4/5] Estado de tests:"
total_test_files=$(find . -name "test_*.py" -o -name "*_test.py" -o -name "*.test.ts" -o -name "*.spec.ts" 2>/dev/null | grep -v node_modules | wc -l)
echo "   Archivos de test encontrados: $total_test_files"

if [ -f ".pytest_cache/v/cache/lastfailed" ]; then
    echo "   Hay tests fallidos en cache (ejecutar: pytest --lf)"
fi
echo ""

# 5. DEPLOY — URLs publicas configuradas?
echo "[5/5] Estado de deploy:"
public_urls=0
for env_file in $(find . -name ".env*" -not -path "*/node_modules/*" -not -path "*/.next/*" 2>/dev/null); do
    urls=$(grep -iE "(vercel|railway|render|fly\.io|heroku|\.app|\.com|\.ec)" "$env_file" 2>/dev/null | grep -iE "http" | wc -l)
    if [ "$urls" -gt 0 ]; then
        echo "   $env_file:"
        grep -iE "(vercel|railway|render|fly\.io|heroku|\.app|\.com|\.ec)" "$env_file" 2>/dev/null | grep -iE "http" | sed 's/^/      /' | head -3
        public_urls=$((public_urls + urls))
    fi
done

if [ "$public_urls" -eq 0 ]; then
    echo "   No hay URLs publicas configuradas (no esta desplegado)"
else
    echo "   URLs publicas detectadas: $public_urls"
fi
echo ""

# =========================================
# VEREDICTO FINAL
# =========================================
echo "============================================"
echo "VEREDICTO FINAL"
echo "============================================"

# Calcular puntaje
score=0
[ "$(docker ps -q 2>/dev/null | wc -l)" -gt 5 ] && score=$((score+1))
[ "$(ss -tln 2>/dev/null | grep -q ":3000 " || lsof -i :3000 -sTCP:LISTEN 2>/dev/null | grep -q LISTEN)" ] && score=$((score+1))
[ "$real_patterns" -gt 3 ] 2>/dev/null && score=$((score+1))
[ "$public_urls" -gt 0 ] && score=$((score+1))
[ "$total_test_files" -gt 100 ] && score=$((score+1))

case $score in
    0|1) echo "ESTADO: Solo backend construido (sin frontend conectado, sin deploy)"
         echo "PROXIMA ACCION: Conectar frontend + deploy publico"
         echo "TIEMPO ESTIMADO: 4-6 horas" ;;
    2)   echo "ESTADO: Parcialmente funcional"
         echo "PROXIMA ACCION: Completar conexion frontend"
         echo "TIEMPO ESTIMADO: 2-3 horas" ;;
    3)   echo "ESTADO: Funcional localmente"
         echo "PROXIMA ACCION: Deploy a produccion + primera demo"
         echo "TIEMPO ESTIMADO: 2 horas" ;;
    4)   echo "ESTADO: Listo para demos"
         echo "PROXIMA ACCION: Discovery Sprint con 5 consultoras"
         echo "TIEMPO ESTIMADO: 1 semana" ;;
    5)   echo "ESTADO: Produccion activa"
         echo "PROXIMA ACCION: Cerrar primer cliente pagando" ;;
esac

echo ""
echo "Score: $score/5 — Ejecuta este script de nuevo despues de cada fix"
echo "============================================"
