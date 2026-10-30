# Auth225 candidate. Launched only by the owned relay, never by its author.
# Private stdin: init/probe/challenge. Stdout: NONSECRET READY/ACK/CLOSED only.
# No network, files, credentials, clipboard, dynamic URL, or imported commands.
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$VerbosePreference = 'SilentlyContinue'
$DebugPreference = 'SilentlyContinue'
$InformationPreference = 'SilentlyContinue'
$WarningPreference = 'SilentlyContinue'
$script:form = $null
$script:timer = $null
$script:codeBox = $null
$script:reader = $null
$script:nextRead = $null
$script:shown = $false
$script:closing = $false
$script:initialized = $false
$script:sequence = 0
$script:expires = [long]0
$script:remaining = [long]0
$script:clock = [System.Diagnostics.Stopwatch]::StartNew()

function Test-Keys($Value, [string[]]$Names) {
    if ($null -eq $Value -or $Value -isnot [pscustomobject]) { return $false }
    $actual = @($Value.PSObject.Properties.Name)
    if ($actual.Count -ne $Names.Count) { return $false }
    foreach ($name in $Names) { if ($actual -cnotcontains $name) { return $false } }
    return $true
}
function Test-Integer($Value) {
    return ($Value -is [int] -or $Value -is [long])
}
function Test-Live {
    return ($script:shown -and -not $script:closing -and $null -ne $script:form `
        -and -not $script:form.IsDisposed -and $script:form.Visible -and $script:form.IsHandleCreated)
}
function Send-Control([string]$EventName, [int]$Sequence) {
    # Explicit allowlist object: never serialize an input frame or exception.
    $handle = $script:form.Handle.ToInt64().ToString([System.Globalization.CultureInfo]::InvariantCulture)
    $control = [ordered]@{ v = 1; event = $EventName; seq = $Sequence; pid = $PID; hwnd = $handle }
    $json = ConvertTo-Json -InputObject $control -Compress
    [Console]::Out.WriteLine($json)
    [Console]::Out.Flush()
}
function Close-PrivateWindow {
    if ($script:closing) { return }
    $script:closing = $true
    if ($null -ne $script:codeBox) { $script:codeBox.Text = '' }
    $script:expires = 0
    if ($null -ne $script:timer) { $script:timer.Stop() }
    try { if ($script:shown) { Send-Control 'CLOSED' $script:sequence } } catch { }
    try { if ($null -ne $script:form -and -not $script:form.IsDisposed) { $script:form.Close() } } catch { }
}

try {
    if ($args.Count -ne 0 -or [System.Threading.Thread]::CurrentThread.ApartmentState -ne 'STA') { exit 1 }
    [Console]::InputEncoding = New-Object System.Text.UTF8Encoding($false, $true)
    [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false, $true)
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    [System.Windows.Forms.Application]::EnableVisualStyles()
    [System.Windows.Forms.Application]::SetUnhandledExceptionMode([System.Windows.Forms.UnhandledExceptionMode]::CatchException)
    [System.Windows.Forms.Application]::add_ThreadException({ try { Close-PrivateWindow } catch { } })
    $script:form = New-Object System.Windows.Forms.Form
    $script:form.Text = 'Connexion OpenAI - interface privee'
    $script:form.ClientSize = New-Object System.Drawing.Size(520, 240)
    $script:form.StartPosition = 'CenterScreen'
    $script:form.FormBorderStyle = 'FixedDialog'
    $script:form.MaximizeBox = $false
    $script:form.MinimizeBox = $false
    $script:form.ShowInTaskbar = $true
    $label = New-Object System.Windows.Forms.Label
    $label.Text = 'En attente du code temporaire. Ne partagez pas ce code.'
    $label.Location = New-Object System.Drawing.Point(20, 20)
    $label.Size = New-Object System.Drawing.Size(480, 40)
    $script:codeBox = New-Object System.Windows.Forms.TextBox
    $script:codeBox.Location = New-Object System.Drawing.Point(20, 70)
    $script:codeBox.Size = New-Object System.Drawing.Size(480, 45)
    $script:codeBox.Font = New-Object System.Drawing.Font('Consolas', 22)
    $script:codeBox.TextAlign = 'Center'
    $script:codeBox.ReadOnly = $true
    $script:codeBox.ShortcutsEnabled = $false
    $script:button = New-Object System.Windows.Forms.Button
    $script:button.Text = 'Ouvrir la page officielle OpenAI'
    $script:button.Location = New-Object System.Drawing.Point(20, 135)
    $script:button.Size = New-Object System.Drawing.Size(480, 38)
    $script:button.Enabled = $false
    $note = New-Object System.Windows.Forms.Label
    $note.Text = 'Ouverture uniquement sur votre clic. Fermer refuse la suite.'
    $note.Location = New-Object System.Drawing.Point(20, 190)
    $note.Size = New-Object System.Drawing.Size(480, 35)
    [void]$script:form.Controls.Add($label)
    [void]$script:form.Controls.Add($script:codeBox)
    [void]$script:form.Controls.Add($script:button)
    [void]$script:form.Controls.Add($note)
    $script:form.add_Shown({ $script:shown = $true })
    $script:form.add_FormClosing({ try { Close-PrivateWindow } catch { } })
    $script:button.add_Click({
        try {
            if (-not (Test-Live) -or $script:sequence -ne 3 -or -not $script:button.Enabled `
                -or [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() -ge $script:expires `
                -or $script:clock.ElapsedMilliseconds -ge $script:remaining) { Close-PrivateWindow; return }
            $script:button.Enabled = $false
            $launch = New-Object System.Diagnostics.ProcessStartInfo
            $launch.FileName = 'https://auth.openai.com/codex/device'
            $launch.UseShellExecute = $true
            [void][System.Diagnostics.Process]::Start($launch)
        } catch { Close-PrivateWindow }
    })
    # Console.In is a synchronized TextReader whose ReadLineAsync can block
    # synchronously. Use a dedicated StreamReader so the Forms pump stays live.
    $script:reader = [System.IO.StreamReader]::new([Console]::OpenStandardInput(),
        [System.Text.UTF8Encoding]::new($false, $true), $false, 4096, $true)
    $script:nextRead = $script:reader.ReadLineAsync()
    $script:timer = New-Object System.Windows.Forms.Timer
    $script:timer.Interval = 25
    $script:timer.add_Tick({
        try {
            if (-not $script:shown) { return }
            if (-not (Test-Live) -or $script:clock.ElapsedMilliseconds -ge 240000 `
                -or (-not $script:initialized -and $script:clock.ElapsedMilliseconds -ge 5000) `
                -or ($script:initialized -and $script:clock.ElapsedMilliseconds -ge $script:remaining) `
                -or ($script:expires -gt 0 -and [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() -ge $script:expires)) {
                Close-PrivateWindow; return
            }
            if (-not $script:nextRead.IsCompleted) { return }
            $line = $script:nextRead.GetAwaiter().GetResult()
            $script:nextRead = $null
            if ($null -eq $line -or $line.Length -gt 2048) { Close-PrivateWindow; return }
            $frame = ConvertFrom-Json -InputObject $line -ErrorAction Stop
            $line = $null
            if (-not (Test-Integer $frame.v) -or $frame.v -ne 1 -or -not (Test-Integer $frame.seq)) { Close-PrivateWindow; return }
            if (-not $script:initialized) {
                if (-not (Test-Keys $frame @('v', 'op', 'seq', 'remainingMs')) -or $frame.op -cne 'init' `
                    -or $frame.seq -ne 0 -or -not (Test-Integer $frame.remainingMs) `
                    -or $frame.remainingMs -le 0 -or $frame.remainingMs -gt 225000) { Close-PrivateWindow; return }
                # Remaining time measured at relay send; local clock is already
                # running, making this conservative rather than a fresh budget.
                $script:remaining = [long]$frame.remainingMs
                $script:initialized = $true
                Send-Control 'READY' 0
            } elseif ($script:sequence -lt 2) {
                if (-not (Test-Keys $frame @('v', 'op', 'seq')) -or $frame.op -cne 'probe' `
                    -or $frame.seq -ne ($script:sequence + 1)) { Close-PrivateWindow; return }
                $script:sequence++
                Send-Control 'ACK' $script:sequence
            } elseif ($script:sequence -eq 2) {
                if (-not (Test-Keys $frame @('v', 'op', 'seq', 'code', 'expires')) -or $frame.op -cne 'challenge' `
                    -or $frame.seq -ne 3 -or $frame.code -isnot [string] `
                    -or $frame.code -cnotmatch '\A[A-Z0-9]{3,8}(?:-[A-Z0-9]{3,8}){0,2}\z' `
                    -or -not (Test-Integer $frame.expires) `
                    -or $frame.expires -le [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()) { Close-PrivateWindow; return }
                $script:expires = [long]$frame.expires
                $script:codeBox.Text = $frame.code
                $script:button.Enabled = $true
                $script:codeBox.Refresh()
                $script:form.Refresh()
                if (-not (Test-Live) -or $script:codeBox.Text -cne $frame.code) { Close-PrivateWindow; return }
                $script:sequence = 3
                Send-Control 'ACK' 3
            } else { Close-PrivateWindow; return }
            $frame = $null
            $script:nextRead = $script:reader.ReadLineAsync()
        } catch {
            # Includes decoding, JSON, pipe and UI failures. Never print $_.
            $line = $null; $frame = $null
            Close-PrivateWindow
        }
    })
    $script:timer.Start()
    [void]$script:form.ShowDialog()
} catch {
    # No raw PowerShell/.NET error, imported string, or challenge is emitted.
} finally {
    try { Close-PrivateWindow } catch { }
    try { if ($null -ne $script:timer) { $script:timer.Dispose() } } catch { }
    try { if ($null -ne $script:form) { $script:form.Dispose() } } catch { }
    $script:nextRead = $null
    $script:reader = $null
    $Error.Clear()
}
exit 0
