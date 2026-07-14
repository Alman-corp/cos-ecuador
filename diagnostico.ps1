# Diagnóstico COS Ecuador — Estado real del proyecto
# Ejecutar en PowerShell: .\diagnostico.ps1

Write-Host "============================================"
Write-Host "   DIAGNÓSTICO COS ECUADOR — $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
Write-Host "============================================"
Write-Host ""

# 1. SERVICIOS CORRIENDO (procesos Node.js y Python)
Write-Host "[1/5] Procesos activos:"
$procs = @()
$nodeProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -eq "" -or -not $_.MainWindowTitle }
$pythonProcs = Get-Process -Name "python*" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -eq "" -or -not $_.MainWindowTitle }
if ($nodeProcs) { $procs += "node ($($nodeProcs.Count))" }
if ($pythonProcs) { $procs += "python ($($pythonProcs.Count))" }
if ($procs.Count -eq 0) { Write-Host "   No hay procesos servidor activos" }
else { Write-Host "   Procesos detectados: $($procs -join ', ')" }
Write-Host ""

# 2. PUERTOS EN ESCUCHA
Write-Host "[2/5] Puertos en escucha:"
$ports = @(3000, 8000, 8001, 8002, 8003, 8004, 8005, 8006, 8007, 8008, 8009, 8010, 8011, 5432)
$found = $false
foreach ($port in $ports) {
    $conn = netstat -ano 2>$null | Select-String ":$port\s+.*LISTENING"
    if ($conn) {
        $procId = ($conn -split '\s+')[-1]
        $procName = (Get-Process -Id $procId -ErrorAction SilentlyContinue).ProcessName
        Write-Host "   Puerto $port activo ($procName)"
        $found = $true
    }
}
if (-not $found) { Write-Host "   Ningun puerto detectado" }
Write-Host ""

# 3. FRONTEND — Conexión real o mocks
Write-Host "[3/5] Frontend Next.js:"
$nextDir = "command-center"
if (Test-Path $nextDir) {
    Write-Host "   Directorio: $nextDir"
    
    $realCount = 0
    $mockCount = 0
    
    if (Test-Path "$nextDir\.env.local") {
        $envContent = Get-Content "$nextDir\.env.local" -ErrorAction SilentlyContinue
        $apiUrls = $envContent | Select-String "(API_URL|NEXT_PUBLIC)" 
        Write-Host "   .env.local encontrado"
        if ($apiUrls) { $apiUrls | ForEach-Object { Write-Host "      $_" } }
    } else { Write-Host "   No hay .env.local" }
    
    # Revisar mocks en components
    $mockFiles = Get-ChildItem -Path "$nextDir\src" -Recurse -Filter "*mock*" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName
    if ($mockFiles) { $mockCount = ($mockFiles | Measure-Object).Count }
    
    # Revisar referencias a API en paginas
    $apiRefs = Get-ChildItem -Path "$nextDir\src\app" -Recurse -Filter "*.tsx" -ErrorAction SilentlyContinue | ForEach-Object { 
        Get-Content $_.FullName -ErrorAction SilentlyContinue | Select-String "fetch\(|axios|api\.get|api\.post" 
    } | Measure-Object | Select-Object -ExpandProperty Count

    Write-Host "   Llamadas a API en paginas: ~$apiRefs"
    Write-Host "   Archivos mock encontrados: $mockCount"
    
    # Verificar status page
    $statusPage = Test-Path "$nextDir\src\app\status\page.tsx"
    if ($statusPage) { Write-Host "   Status page: SI" }
    else { Write-Host "   Status page: NO" }
    
    # Verificar PWA
    $manifest = Test-Path "$nextDir\public\manifest.json"
    $sw = Test-Path "$nextDir\public\sw.js"
    if ($manifest -and $sw) { Write-Host "   PWA: SI (manifest + service worker)" }
    else { Write-Host "   PWA: NO" }
    
    $lastBuild = Get-ChildItem "$nextDir\.next" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($lastBuild) { Write-Host "   Ultimo build: $($lastBuild.LastWriteTime)" }
    else { Write-Host "   No hay build (ejecutar: npm run build)" }
    
} else { Write-Host "   Directorio command-center no encontrado" }
Write-Host ""

# 4. TESTS
Write-Host "[4/5] Tests:"
$testPyFiles = (Get-ChildItem -Path "services" -Recurse -Filter "test_*.py" -ErrorAction SilentlyContinue | Measure-Object).Count
$testTsFiles = (Get-ChildItem -Path "command-center" -Recurse -Filter "*.test.ts" -ErrorAction SilentlyContinue | Measure-Object).Count
$testTsxFiles = (Get-ChildItem -Path "command-center" -Recurse -Filter "*.test.tsx" -ErrorAction SilentlyContinue | Measure-Object).Count
$totalTestFiles = $testPyFiles + $testTsFiles + $testTsxFiles
Write-Host "   test_*.py (backend): $testPyFiles"
Write-Host "   *.test.ts/tsx (frontend): $($testTsFiles + $testTsxFiles)"
Write-Host "   Total archivos test: $totalTestFiles"
Write-Host ""

# 5. SERVICIOS COMPLETOS
Write-Host "[5/5] Servicios implementados:"
$svcCount = 0
$svcDir = Get-ChildItem "services" -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    $name = $_.Name
    $hasMain = $null -ne (Get-ChildItem $_.FullName -Recurse -Filter "main.py" -Depth 2 | Select-Object -First 1)
    $hasTests = Test-Path "$($_.FullName)\tests"
    $testCount = if ($hasTests) { (Get-ChildItem "$($_.FullName)\tests" -Filter "test_*.py" | Measure-Object).Count } else { 0 }
    $status = if ($hasMain) { "API" } else { "libreria/scripts" }
    $svcCount++
    [PSCustomObject]@{Nombre=$name; Tipo=$status; Tests=$testCount}
}
$svcDir | Format-Table -AutoSize
Write-Host "   $svcCount servicios en services/"
Write-Host ""

# VEREDICTO
Write-Host "============================================"
Write-Host "VEREDICTO FINAL"
Write-Host "============================================"

$score = 0
if ($found) { $score++ }
if ($apiRefs -and $apiRefs -gt 0) { $score++ } 
if ($statusPage) { $score++ }
if ($totalTestFiles -gt 50) { $score++ }
if ($svcCount -ge 10) { $score++ }

switch ($score) {
    { $_ -le 1 } { Write-Host "ESTADO: Solo backend construido, nada corriendo"
                   Write-Host "ACCION: Iniciar servicios + conectar frontend"
                   Write-Host "TIEMPO: 3-4 horas" }
    2 { Write-Host "ESTADO: Parcialmente funcional"
        Write-Host "ACCION: Completar conexion frontend-backend"
        Write-Host "TIEMPO: 2 horas" }
    3 { Write-Host "ESTADO: Funcional localmente"
        Write-Host "ACCION: Preparar demo"
        Write-Host "TIEMPO: 1 hora" }
    4 { Write-Host "ESTADO: Listo para demos"
        Write-Host "ACCION: Discovery Sprint con consultoras"
        Write-Host "TIEMPO: 1 semana" }
    5 { Write-Host "ESTADO: Produccion activa"
        Write-Host "ACCION: Cerrar primer cliente" }
}

Write-Host ""
Write-Host "Score: $score/5"
Write-Host "============================================"
