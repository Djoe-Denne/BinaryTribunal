# G13 — run live direct Cast puis Stock

Ce document est le runbook opérationnel autoritatif pour le protocole G13 v3.
Il remplace les séquences B0/B1 des anciens prompts.

## But

Produire deux preuves séparées sur un `FF8_EN.exe` neuf :

1. un Draw → Cast intercepté et remplacé ;
2. un nouvel armement, puis un Draw → Stock intercepté et remplacé.

Aucune action native sacrificielle n'est requise. Le scénario d'observation
ne doit être utilisé que si une incertitude concrète est nommée avant l'action.

## Artefacts préparés

Racine :
`C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated`

- DLL x86 RelWithDebInfo :
  `build\relwithdebinfo-x86\bin\RelWithDebInfo\ff8_battle_iso.dll`
  - taille : 393728 octets
  - SHA-256 : `6ac01d56e62489500e4f1c31fa0ade90e5a94cee639ec65a70391b7ae6c0841b`
- bootstrap :
  `bootstrap-g13-live.bin`
  - taille : 128 octets
  - flags : `0x0000007f`
  - SHA-256 : `2036a2629c275b2de36f69f31209d23334ede38f4d1dbc3a7758e6a7082b0ea1`
- suite :
  `suite-G13-live.bin`
  - taille : 64 octets
  - protocole/scénario : `3/2`
  - SHA-256 : `3a2289bf0bd2407e368541be662911ee5094d9ef7f5c88a6289c983439627067`
- injecteur :
  `C:\Users\djden\source\repos\FFScriptLoader\build\bin\RelWithDebInfo\app_injector.exe`

Toute divergence de hash avant le run impose de recalculer les identités et
de mettre à jour ce runbook. Ne jamais remplacer la DLL pendant le processus.

## État préparatoire

- `validate_contracts.py` : PASS ;
- build x86 RelWithDebInfo : PASS ;
- CTest : 35/35 PASS ;
- aucun `FF8_EN.exe` actif au moment de la préparation ;
- `[promotion.G13].satisfied` reste `false`.

Diagnostics conservés, non promouvables :

- PID 49568 : écran noir, `aux_5`/`aux_6` inversés.
- PID 48160 : fail-stop, `amount=0` traité comme sort absent.
- PID 27140 : Cast domaine-complet mais publisher zérait le témoin ; Stock
  a faulté parce que l'export comparait la dernière itération `8→9` au
  préimage `0`.
- PID 22956 : Stock collector-PASS puis Cast collector-PASS sur DLL
  `f47c0481…b8924ada`. Le blink HUD est la présentation G14 différée.

Les deux preuves live par défaut existent. `[promotion.G13].satisfied`
reste `false` jusqu'à revue G14 / `restore_flags`.

## Variables PowerShell

Exécuter depuis la racine Reimaginated :

```powershell
$repo = "C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated"
$injector = "C:\Users\djden\source\repos\FFScriptLoader\build\bin\RelWithDebInfo\app_injector.exe"
$injectorDir = Split-Path $injector
$dll = "$repo\build\relwithdebinfo-x86\bin\RelWithDebInfo\ff8_battle_iso.dll"
$bootstrap = "$repo\bootstrap-g13-live.bin"
$suite = "$repo\suite-G13-live.bin"

function Invoke-G13Injector {
    param(
        [Parameter(Mandatory=$true)][string]$Export,
        [string]$Payload
    )
    $invokeArgs = @("FF8_EN.exe", $dll, "--bootstrap-export", $Export)
    if ($Payload) {
        $invokeArgs += @("--bootstrap-payload", $Payload)
    }
    $invokeArgs += @("--timeout-ms", "60000")

    # app_injector charge app_hook.dll depuis son répertoire courant.
    Push-Location $injectorDir
    try {
        & $injector @invokeArgs
        $code = $LASTEXITCODE
    } finally {
        Pop-Location
    }
    if ($code -ne 0) {
        throw "Injection $Export échouée avec le code $code"
    }
}
```

## Préflight opérateur

1. Démarrer un **nouveau** `FF8_EN.exe`.
2. Charger une sauvegarde jetable.
3. Rester au **field/open world ou menu** et prévenir le modèle.

Les seams ne peuvent pas être installés depuis le combat. Le modèle vérifie
le PID neuf et capture l'état field avant bootstrap :

```powershell
python .\tools\capture_live_canaries.py --expect field --timeout 30 `
  --output .\evidence\battle-iso\p0-g13-direct-field-canary-2026-08-25.json
```

Stop si le canari field échoue, si plusieurs PID existent ou si les hashes
ont changé.

## Bootstrap au field, puis entrée en combat

```powershell
Invoke-G13Injector -Export FF8Iso_Bootstrap -Payload $bootstrap
```

Après bootstrap seulement, demander à l'opérateur d'entrer en combat avec :

- un caster capable de Draw ;
- de la place dans son stock de magie ;
- un monstre portant un sort offensif drawable, non-GF ;
- aucune action en file.

Quand le combat est idle, capturer D0 et vérifier toutes les seams :

```powershell
python .\tools\capture_live_canaries.py --expect battle-g07 --timeout 300 `
  --output .\evidence\battle-iso\p0-g13-direct-d0-canary-2026-08-25.json
```

## Premier armement

```powershell
Invoke-G13Injector -Export FF8Iso_RunInProcessSuite -Payload $suite
```

Avant toute action joueur, vérifier automatiquement l'armement direct :

```powershell
python .\tools\capture_runtime_evidence.py `
  --dll $dll --group G13 --profile P0 --g13-mode direct-arm `
  --before-canary .\evidence\battle-iso\p0-g13-direct-d0-canary-2026-08-25.json `
  --output .\evidence\battle-iso\p0-g13-draw-direct-arm-live-2026-08-25.json
```

PASS requis : protocole `3`, scénario `2`, `arm_authorized=1`,
`queue_or_store_replacement_count=0`, zéro appel domaine et runtime non
`Faulted`. Cette capture ne demande aucune action native.

## Action 1 — Cast remplacé

Seulement après le PASS d'armement, demander à l'opérateur :

> Draw → sélectionner le sort déclaré → Cast, puis attendre le résultat
> visible et remettre le combat idle.

Capturer :

```powershell
python .\tools\capture_runtime_evidence.py `
  --dll $dll --group G13 --profile P0 --g13-mode replacement `
  --before-canary .\evidence\battle-iso\p0-g13-direct-d0-canary-2026-08-25.json `
  --output .\evidence\battle-iso\p0-g13-draw-cast-replacement-live-2026-08-25.json
```

PASS requis : un remplacement, `aux_5=9`, plan/résolution/commit présents,
zéro fallback, événement HP borné, stock Magic du caster inchangé et
présentation toujours différée à G14.

## Action 2 — Stock remplacé

Réarmer sans observation :

```powershell
Invoke-G13Injector -Export FF8Iso_RunInProcessSuite -Payload $suite
```

Demander à l'opérateur :

> Draw → sélectionner un sort drawable → Stock, puis attendre le résultat
> visible et remettre le combat idle.

Capturer :

```powershell
python .\tools\capture_runtime_evidence.py `
  --dll $dll --group G13 --profile P0 --g13-mode replacement `
  --before-canary .\evidence\battle-iso\p0-g13-direct-d0-canary-2026-08-25.json `
  --output .\evidence\battle-iso\p0-g13-draw-stock-replacement-live-2026-08-25.json
```

PASS requis : un remplacement, `aux_5=10`, plan/résolution/commit présents,
zéro fallback, mutation limitée à la paire Magic sélectionnée, quantité
bornée et aucune autorité HP/event Cast inventée.

## Cleanup

Après les deux captures, revenir si possible au field/menu puis :

```powershell
Invoke-G13Injector -Export FF8Iso_Shutdown

python .\tools\capture_live_canaries.py --expect restored --timeout 60 `
  --output .\evidence\battle-iso\p0-g13-direct-restored-canary-2026-08-25.json
```

Si `FF8Iso_Shutdown` retourne `BUSY`, attendre un état idle stable et faire
une seule nouvelle tentative. Ne jamais tuer le processus pour fabriquer un
cleanup PASS.

## Stops

Stopper le run et conserver un diagnostic si :

- bootstrap, armement ou capture retourne un code non nul ;
- runtime `Faulted`, violation d'allowlist ou appel domaine interdit ;
- l'appel ne matche pas le seam et reste natif ;
- la DLL ou l'exécutable change pendant le processus ;
- écran noir, acteur gelé ou file/latch non récupéré ;
- Cast touche le stock Magic ou Stock touche une autorité HP/event ;
- une tentative propose d'ajouter B0 sans incertitude explicitement nommée.

Un échec ne déclenche pas automatiquement une matrice live plus large. Le
modèle analyse d'abord l'écart et ne demande qu'une observation discriminante.
