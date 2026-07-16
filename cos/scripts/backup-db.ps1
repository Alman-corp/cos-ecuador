param(
  [string]$PgHost = "localhost",
  [string]$PgPort = "5432",
  [string]$PgUser = "postgres",
  [string]$PgDatabase = "cos",
  [string]$BackupDir = "C:\backups\cos",
  [int]$RetentionDays = 30
)

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = Join-Path $BackupDir "cos_${timestamp}.dump"
$logFile = Join-Path $BackupDir "backup.log"

if (-not (Test-Path $BackupDir)) {
  New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

function Write-Log {
  param([string]$Message)
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - $Message"
  Write-Host $line
  Add-Content -Path $logFile -Value $line
}

Write-Log "Iniciando backup de $PgDatabase en $PgHost:$PgPort"

try {
  $env:PGPASSWORD = if ($env:PGPASSWORD) { $env:PGPASSWORD } else { "" }

  if ($env:PGPASSWORD) {
    $result = pg_dump -h $PgHost -p $PgPort -U $PgUser -Fc -f $backupFile $PgDatabase 2>&1
  } else {
    $result = pg_dump -h $PgHost -p $PgPort -U $PgUser -Fc -f $backupFile $PgDatabase 2>&1
  }

  if ($LASTEXITCODE -eq 0) {
    $size = (Get-Item $backupFile).Length
    Write-Log "Backup completado exitosamente: $backupFile ($([math]::Round($size/1MB, 2)) MB)"
  } else {
    Write-Log "ERROR: pg_dump falló con código $LASTEXITCODE"
    exit 1
  }
} catch {
  Write-Log "ERROR: $_"
  exit 1
}

$cutoff = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem $BackupDir -Filter "cos_*.dump" | Where-Object { $_.LastWriteTime -lt $cutoff } | ForEach-Object {
  Remove-Item $_.FullName -Force
  Write-Log "Backup antiguo eliminado: $($_.Name)"
}

Write-Log "Backup completado. Retention: $RetentionDays días"
