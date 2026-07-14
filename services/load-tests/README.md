# Pruebas de Carga con k6

Suite de pruebas de carga para el sistema de consultoría tributaria, implementada con [k6](https://k6.io/).

## Requisitos

- [k6](https://k6.io/docs/getting-started/installation/) v0.42+
- Conexión al entorno de pruebas (local, staging, producción)

## Instalación

```bash
# Windows (PowerShell)
winget install k6

# macOS
brew install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## Estructura

```
scripts/
├── smoke-test.js           # Prueba de humo (verificación básica)
├── iva-calculation-test.js  # Prueba de carga de cálculo de IVA
├── renta-calculation-test.js# Prueba de carga de cálculo de Renta
├── mixed-workload-test.js   # Carga mixta simulando usuarios reales
├── stress-test.js           # Prueba de estrés (punto de quiebre)
├── soak-test.js             # Prueba de resistencia (30 min)
└── spike-test.js            # Prueba de picos de tráfico
└── README.md                # Este archivo
```

## Cómo ejecutar

### Prueba de humo (Smoke Test)
```bash
k6 run scripts/smoke-test.js
```

### Prueba de carga de IVA
```bash
k6 run scripts/iva-calculation-test.js
```

### Prueba de carga de Renta
```bash
k6 run scripts/renta-calculation-test.js
```

### Prueba de carga mixta
```bash
k6 run scripts/mixed-workload-test.js
```

### Prueba de estrés
```bash
k6 run scripts/stress-test.js
```

### Prueba de resistencia (Soak)
```bash
k6 run scripts/soak-test.js
```

### Prueba de picos (Spike)
```bash
k6 run scripts/spike-test.js
```

### Especificar entorno y otras variables

```bash
k6 run scripts/smoke-test.js -e BASE_URL=http://localhost:8000 -e ENV=local
k6 run scripts/iva-calculation-test.js -e BASE_URL=https://staging.api.example.com -e ENV=staging
```

### Ejecutar con reporte HTML (usando k6-html-reporter o extensión)

```bash
k6 run scripts/smoke-test.js --out json=results.json
# Luego convertir con herramienta externa
```

### Ejecutar todas las pruebas secuencialmente

```bash
for script in scripts/*.js; do
  echo "Ejecutando $script..."
  k6 run "$script"
done
```

## Descripción de cada prueba

### smoke-test.js
- **Propósito:** Verificar que los endpoints principales responden correctamente con carga mínima.
- **Perfil:** 1 VU durante 30 segundos.
- **Endpoints:** GET /health, GET /api/v1/tax/iva/rates, GET /api/v1/tax/retenciones/rates, etc.
- **Thresholds:** Tiempo de respuesta p95 < 500ms, tasa de error < 1%.
- **Uso:** Ideal para validar que el despliegue fue exitoso antes de pruebas más pesadas.

### iva-calculation-test.js
- **Propósito:** Evaluar el rendimiento del endpoint de cálculo de IVA bajo carga creciente.
- **Perfil:** 10 → 50 VUs en 2 min, 100 VUs por 3 min, descenso gradual.
- **Endpoints:** POST /api/v1/tax/iva/calculate con datos realistas.
- **Thresholds:** p95 < 2000ms, p99 < 5000ms, error rate < 1%.
- **Payload:** Base imponible, porcentaje de IVA, retenciones, tipo de comprobante, descuentos.

### renta-calculation-test.js
- **Propósito:** Evaluar el rendimiento del cálculo de Renta y proyección anual.
- **Perfil:** 5 → 30 VUs en 3 min, estable 2 min, descenso.
- **Endpoints:** POST /api/v1/tax/renta/calculate, POST /api/v1/tax/renta/proyeccion.
- **Thresholds:** p95 < 3000ms, error rate < 2%.
- **Payload:** Proyección anual con 12 meses de ingresos/gastos, deducciones personales.

### mixed-workload-test.js
- **Propósito:** Simular el comportamiento real de usuarios en el sistema.
- **Perfil:** 20 VUs constantes durante 5 minutos.
- **Distribución:** IVA (40%), Renta (20%), Retenciones (15%), Health Check (10%), ATS (10%), SRI (5%).
- **Thresholds:** p95 < 3000ms, error rate < 2%.
- **Think time:** 1-3 segundos entre peticiones simulando tiempo de usuario.

### stress-test.js
- **Propósito:** Encontrar el punto de quiebre del sistema incrementando la carga progresivamente.
- **Perfil:** 0 → 200 VUs en 5 min, 200 VUs por 10 min, descenso.
- **Endpoint principal:** POST /api/v1/tax/iva/calculate.
- **Thresholds:** p99 < 10000ms, error rate < 5%.
- **Detección:** Identifica el punto donde el tiempo de respuesta se dispara (>2x) como señal de degradación.

### soak-test.js
- **Propósito:** Detectar problemas de resistencia como fugas de memoria o degradación gradual.
- **Perfil:** 30 VUs durante 30 minutos.
- **Endpoints:** Rotación entre todos los endpoints de cálculo tributario.
- **Thresholds:** p95 < 4000ms durante toda la prueba, sin tendencia creciente.
- **Monitoreo:** Permite detectar degradación progresiva comparando tiempos al inicio vs final.

### spike-test.js
- **Propósito:** Verificar que el sistema maneja picos repentinos de tráfico sin colapsar.
- **Perfil:** 0 VUs (warmup 1m) → 100 VUs (30s) → 100 VUs (2m) → 300 VUs (30s) → 300 VUs (1m) → 0 (30s).
- **Thresholds:** Tiempo máximo < 15000ms, recuperación en menos de 30s.
- **Métrica clave:** Capacidad de recuperación a línea base después del pico.

## Interpretación de resultados

### Indicadores clave (SLIs)

| Métrica | Descripción | Bueno | Regular | Malo |
|---------|-------------|-------|---------|------|
| Tiempo de respuesta (p95) | 95% de peticiones debajo de este tiempo | < 2000ms | 2000-4000ms | > 4000ms |
| Tiempo de respuesta (p99) | 99% de peticiones debajo de este tiempo | < 3000ms | 3000-5000ms | > 5000ms |
| Tasa de error | Porcentaje de peticiones fallidas | < 1% | 1-5% | > 5% |
| Throughput | Peticiones por segundo | Depende del perfil | — | — |

### Objetivos de nivel de servicio (SLOs)

| Servicio | SLO |
|----------|-----|
| Smoke tests | 100% de éxito, p95 < 500ms |
| Cálculo de IVA | p95 < 2000ms, errores < 1% |
| Cálculo de Renta | p95 < 3000ms, errores < 2% |
| Carga mixta | p95 < 3000ms, errores < 2% |
| Estrés | p99 < 10000ms, errores < 5% |
| Resistencia (soak) | p95 < 4000ms, sin degradación |
| Picos (spike) | Máx < 15000ms, recuperación < 30s |

### Pasos para interpretar

1. **Revisar thresholds:** k6 marca automáticamente si se cumplen los thresholds. Buscar líneas `✗` en la salida.
2. **Analizar tiempos de respuesta:** Comparar p95 y p99 contra los SLOs. Si se exceden, identificar el endpoint problemático.
3. **Tasa de error:** Si > 1-2%, investigar errores 5xx o timeouts en los logs del servidor.
4. **Throughput:** Si el throughput se estanca mientras los VUs siguen aumentando, hay un cuello de botella.
5. **Tendencias en soak test:** Comparar los tiempos del primer minuto vs el último minuto. Si hay aumento progresivo, revisar fugas de memoria.
6. **Punto de quiebre en stress test:** Identificar en qué fase (cuántos VUs) el sistema empezó a degradarse para establecer el límite práctico de capacidad.

## Integración CI/CD

### GitHub Actions

```yaml
name: Load Tests
on:
  schedule:
    - cron: '0 6 * * 1'  # Todos los lunes 6 AM
  workflow_dispatch:       # Ejecución manual

jobs:
  k6-smoke-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: grafana/k6-action@v0.3.1
        with:
          filename: services/load-tests/k6/scripts/smoke-test.js
          flags: -e BASE_URL=${{ secrets.STAGING_URL }} -e ENV=staging
```

### Azure DevOps

```yaml
trigger: none
schedules:
  - cron: "0 6 * * 1"
    displayName: Weekly load tests
    branches:
      include: [main]

pool:
  vmImage: 'ubuntu-latest'

steps:
  - script: |
      sudo apt-get update
      sudo apt-get install k6
    displayName: 'Install k6'

  - script: |
      k6 run services/load-tests/k6/scripts/smoke-test.js -e BASE_URL=$(STAGING_URL)
    displayName: 'Smoke Test'
    env:
      STAGING_URL: $(STAGING_URL)
```

### GitLab CI

```yaml
stages:
  - load-test

k6-smoke:
  stage: load-test
  image: grafana/k6:latest
  script:
    - k6 run services/load-tests/k6/scripts/smoke-test.js -e BASE_URL=$STAGING_URL
  rules:
    - if: '$CI_PIPELINE_SOURCE == "schedule"'
```

## Mejores prácticas

1. **Ejecutar smoke test primero:** Antes de cualquier prueba de carga, validar que el sistema responde.
2. **Aislar el entorno:** No ejecutar pruebas de carga contra producción sin coordinación.
3. **Monitorear el servidor:** Complementar con métricas de CPU, memoria, disco y red durante las pruebas.
4. **Pruebas consistentes:** Usar los mismos perfiles de carga para comparar entre versiones.
5. **Reportes:** Exportar resultados con `--out json=results.json` para análisis histórico.
6. **Calentamiento (warmup):** Algunos endpoints pueden necesitar una fase de warmup antes de medir.

## Troubleshooting

| Problema | Causa probable | Solución |
|----------|---------------|----------|
| Todos los thresholds fallan | Servidor no disponible | Verificar BASE_URL y conectividad |
| Errores 5xx | Sobrecarga del servidor | Reducir VUs, escalar infraestructura |
| Timeouts | Endpoint lento o base de datos saturada | Revisar consultas SQL, agregar índices |
| Tasa de error > 5% en stress | Punto de quiebre alcanzado | Documentar límite, planificar escalado |
| Degradación progresiva en soak | Fuga de memoria | Revisar pools de conexiones, cachés |
