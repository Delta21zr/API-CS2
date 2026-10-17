<#
.SYNOPSIS
    Configura y administra la automatizacion en segundo plano de extraccion de precios CS2 (sync_prices.php).
.DESCRIPTION
    Permite:
      - Instalar una Tarea Programada de Windows ("CS2_Tracker_PriceSync") que se ejecuta cada X minutos de forma oculta.
      - Iniciar un proceso demonio en segundo plano sin ventana.
      - Ejecutar un lote de prueba inmediato.
      - Ver el estado y las ultimas lineas de la bitacora (sync_prices.log).
      - Desinstalar la tarea programada.
#>
param(
    [ValidateSet('install', 'uninstall', 'run-once', 'start-daemon', 'stop-daemon', 'status')]
    [string]$Action = 'install',
    [int]$IntervalMinutes = 5,
    [int]$BatchLimit = 10,
    [switch]$SkipImmediateRun
)

$TaskName = "CS2_Tracker_PriceSync"
$PhpExe = "C:\xampp\php\php.exe"

# Detectar ruta de sync_prices.php (priorizando C:\xampp\htdocs si existe)
$ScriptPath = Join-Path $PSScriptRoot "sync_prices.php"
if (Test-Path "C:\xampp\htdocs\sync_prices.php") {
    $ScriptPath = "C:\xampp\htdocs\sync_prices.php"
}
$LogPath = Join-Path (Split-Path $ScriptPath -Parent) "sync_prices.log"

if (-not (Test-Path $PhpExe)) {
    Write-Error "No se encontro PHP en $PhpExe. Verifica la instalacion de XAMPP."
    exit 1
}

switch ($Action) {
    'install' {
        Write-Host "[INFO] Configurando Tarea Programada '$TaskName' (cada $IntervalMinutes minutos, lote de $BatchLimit items)..." -ForegroundColor Cyan

        # Usar powershell oculto para que nunca aparezca ventana emergente de CMD
        $CmdArgs = "-NoProfile -WindowStyle Hidden -Command `"& '$PhpExe' '$ScriptPath' --once --limit=$BatchLimit`""

        $TaskAction = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $CmdArgs
        $TaskTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) -RepetitionDuration (New-TimeSpan -Days 3650)
        $TaskSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -Hidden

        Register-ScheduledTask -TaskName $TaskName -Action $TaskAction -Trigger $TaskTrigger -Settings $TaskSettings -Force | Out-Null
        Write-Host "[OK] Tarea Programada '$TaskName' instalada exitosamente." -ForegroundColor Green

        if (-not $SkipImmediateRun) {
            Write-Host "[INFO] Ejecutando lote inicial de extraccion..." -ForegroundColor Yellow
            & $PhpExe $ScriptPath --once --limit=$BatchLimit
        }
    }

    'uninstall' {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
        Write-Host "[OK] Tarea Programada '$TaskName' eliminada." -ForegroundColor Yellow
    }

    'run-once' {
        Write-Host "[INFO] Ejecutando lote unico de extraccion de precios ($BatchLimit items)..." -ForegroundColor Cyan
        & $PhpExe $ScriptPath --once --limit=$BatchLimit
    }

    'start-daemon' {
        Write-Host "[INFO] Iniciando extractor continuo en segundo plano (Demonio PHP oculto)..." -ForegroundColor Cyan
        Start-Process -FilePath $PhpExe -ArgumentList "`"$ScriptPath`" --daemon --limit=$BatchLimit --interval=60" -WindowStyle Hidden
        Write-Host "[OK] Demonio iniciado en segundo plano. Revisa el progreso en: $LogPath" -ForegroundColor Green
    }

    'stop-daemon' {
        Get-CimInstance Win32_Process -Filter "Name = 'php.exe'" | Where-Object { $_.CommandLine -like "*sync_prices.php*" } | ForEach-Object {
            Stop-Process -Id $_.ProcessId -Force
            Write-Host "[STOP] Proceso PHP (PID $($_.ProcessId)) detenido." -ForegroundColor Yellow
        }
    }

    'status' {
        $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
        if ($task) {
            $info = Get-ScheduledTaskInfo -TaskName $TaskName
            Write-Host "[STATUS] Tarea Programada: $($task.TaskName) - Estado: $($task.State)" -ForegroundColor Green
            Write-Host "         Ultima ejecucion: $($info.LastRunTime) | Proxima ejecucion: $($info.NextRunTime)"
        } else {
            Write-Host "[STATUS] Tarea Programada '$TaskName': No instalada." -ForegroundColor Yellow
        }

        $daemons = Get-CimInstance Win32_Process -Filter "Name = 'php.exe'" | Where-Object { $_.CommandLine -like "*sync_prices.php*" }
        if ($daemons) {
            Write-Host "[STATUS] Demonio PHP en ejecucion (PID: $($daemons.ProcessId -join ', '))" -ForegroundColor Green
        } else {
            Write-Host "[STATUS] Demonio PHP continuo: No activo actualmente (usando Tarea Programada)."
        }

        if (Test-Path $LogPath) {
            Write-Host "`n--- Ultimas 10 lineas de $LogPath ---" -ForegroundColor Cyan
            Get-Content $LogPath -Tail 10
        }
    }
}
