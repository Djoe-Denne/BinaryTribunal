param([int]$DelaySeconds = 600)
$ErrorActionPreference = 'Stop'
$directory = $PSScriptRoot
$statePath = Join-Path $directory 'timer-state.json'
$sentinel = 'AGENT_LOOP_WAKE_RE_GRAPH_SCHEDULER_20261014'
if (Test-Path -LiteralPath $statePath) {
    $previous = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
    $existing = Get-Process -Id $previous.pid -ErrorAction SilentlyContinue
    if ($existing -and $existing.StartTime.ToUniversalTime().ToString('o') -eq $previous.processStartedUtc) {
        throw 'A matching monitoring timer already runs; do not create a duplicate.'
    }
}
$process = Get-Process -Id $PID
$started = [DateTime]::UtcNow
$prompt = 'Controle read-only de re-graph-scheduler toutes les dix minutes. Lire API publique Ensemble /api/state et API native session.active, dernieres actions/erreurs du lead, contextes/dependances des taches. Comparer activite native et compteurs ; distinguer gates parent, vrai READY, idle normal et phantom/stall. Donner aussi un pourcentage approximatif global pondere par les jalons vraiment acceptes, jamais le nombre de taches/workers. Reference avant reprise du 2026-10-15 : 65-70 % environ ; maintenance infra deployee, L4/L5/L6 acceptes offline, tache l2-ids-astra completed mais acceptation L2 a verifier, L7-L10 non clotures. Le GO et le recap maintenance ont ete transmis au lead existant ses_eca40a8e2ffeanEKTBLiGjDNw8 ; voir .tmp/mission-resume-20261015/ et docs/missions/re-graph-scheduler/RESUME_AFTER_COORDINATION_20261015.md. Ne pas augmenter le pourcentage sur simple livraison ou tests offline sans acceptation parent. Signaler les changements ou incidents utiles. Ne creer/relancer/arreter aucun worker, ne modifier aucun modele/config/IDB/git. Rearmer un seul timer de 600 secondes apres chaque controle, sans polling ; arreter sur demande utilisateur ou cloture effective. La surveillance depend de cette session/service OpenCode actifs.'
@{
    sentinel = $sentinel
    pid = $PID
    processStartedUtc = $process.StartTime.ToUniversalTime().ToString('o')
    armedAtUtc = $started.ToString('o')
    dueAtUtc = $started.AddSeconds($DelaySeconds).ToString('o')
    state = 'armed'
    prompt = $prompt
} | ConvertTo-Json | Set-Content -LiteralPath $statePath -Encoding UTF8
Write-Output "Monitoring timer armed: $sentinel PID=$PID due=$($started.AddSeconds($DelaySeconds).ToString('o'))"
Start-Sleep -Seconds $DelaySeconds
@{
    sentinel = $sentinel
    firedAtUtc = [DateTime]::UtcNow.ToString('o')
    state = 'fired'
    prompt = $prompt
} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $directory 'last-wake.json') -Encoding UTF8
Write-Output ($sentinel + ' ' + (@{ prompt = $prompt } | ConvertTo-Json -Compress))
