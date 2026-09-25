---
name: ff8-dump-writer-verify
description: Gate de conformité post-build/déploiement pour les writers de dump AF3DN.P (v7+/v8). Vérifie exports, mode binaire fopen, contrat binaire des records via harnais sentinelles, build-id, et hash du DLL déployé. Use after building or deploying an AF3DN.P dump-writer DLL, before any live campaign, or when the user says "verify writer", "gate de déploiement", or mentions writer/decoder drift.
---

# FF8 dump writer verify (gate post-build/déploiement)

Deux incidents réels (lot 13, 2026-09-25) que cette gate aurait attrapés avant le run live :
1. **`fopen(binPath, "a")` mode TEXTE** → chaque `0x0A` des données devient `0D 0A` sur disque (+2 o/record, en-têtes corrompus au CRLF). Fix v7.1 : `"ab"`.
2. **Drift de build** — l'image bootée ≠ le cru déployé (records hors gardes vc 19482 impossibles au code courant). Fix : hash du déployé APRÈS copie + build-id u32 dans chaque record.

## Workflow (dans l'ordre, tout bloquant)

1. **Build x86** : `vcvarsall.bat x86` + ligne README §2 (`cl /nologo /W3 /Ox /MT /LD ...`). `LNK1168` = DLL encore chargé → le jeu tourne, STOP.
2. **Exports** : `dumpbin /EXPORTS` → set identique au build précédent (v7 : 14/14 = 5 exports code `new_dll_graphics_driver` + `Passthrough_*` ×4 + 9 forwards `dotemu*`).
3. **fopen binaire** : grep `fopen(` dans la source — tout fopen écrivant des données binaires doit porter `b`. Un mode texte (`"a"`, `"w"`, `"r+"`) sur flux binaire = **ÉCHEC bloquant** (leçon lot 13).
4. **Harnais sentinelles** : `scripts/verify_writer.ps1` (ou manuel : copie du modèle `decode/_audit/harness_probe.c`) — LoadLibrary d'une COPIE du DLL (jamais l'AF3DN.P déployé), écriture directe des globales (`g_frameSeq`/`g_capEndSeq` — RVAs à dériver du disasm : elles vivent APRÈS le ring 64 Mo, ex. lot 13 : `0x4054EB0/0x4054EB4`), node synthétique slot 51 (`remaining=9, perV=4, perI=6`), sentinelle `0x33` 4 o avant verts, idx `0x11`, verts `0x22`. Vérifications :
   - `g_dumpWrite` delta == `32 + psize` EXACTEMENT (advance = header+node+payload, un seul curseur) ;
   - `psize == 24 + 8 + icount*2 + pad + vcount*32` avec `pad = (4 - (icount*2 % 4)) % 4` ;
   - records kind0 = 56 o ; sentinelles **non copiées** hors zones déclarées (aucun spill) ;
   - `remaining=1` → +0.
5. **Build-id** : un u32 constant (hash court du PE) présent dans chaque record (champ prévu au contrat v8). Absent = ÉCHEC (drift indétectable).
6. **Gardes** : disasm du DumpNode (dumpbin /DISASM, RVA via le call depuis Proxy_List51) — vérifier `cmp edi,0x1000` / `cmp ebx,0x4000` / `cmp edx,0x40000` présents (lot 13 : l'image bootée 13:47 les avait contournées).
7. **Déploiement + hash APRÈS copie** : copie du DLL → `AF3DN.P` (répertoire jeu, jeu ÉTEINT) → `Get-FileHash` → doit == hash du build ; logguer dans le run log avec le build-id.
8. **Verdict** : `WRITER VERIFIED <hash> <build-id>` sinon `WRITER VERIFY FAILED` + la ligne/instruction exacte du premier écart.

## Règles intangibles

- Ground truth = les bytes du DLL déployé (dumpbin /DISASM), jamais le `.c` seul.
- Le harnais charge une **copie**, jamais l'AF3DN.P en place.
- Le natif slot 51/60 (`0x43E356`) consomme en curseurs locaux SANS writeback — la copie `verts/idx` post-forward reste fidèle ; toute divergence taille/contenu vient du writer, pas du natif.
- Aucun offset inventé : chaque adresse adossée au listing (références `ds:[14054Exx]` = globals APRÈS le ring ; `ds:[10054E9x]` = ring/cursor AVANT).

## Scripts

- `scripts/verify_writer.ps1` : automatise 2–7 (exports, grep fopen, harnais avec RVAs auto-dérivées du disasm, hash déployé). Exécuter, pas lire :
  `powershell -File scripts/verify_writer.ps1 -PassthroughDir <dir> -DeployedPath <AF3DN.P>`
- Modèle de harnais C : `decode/_audit/harness_probe.c` (repo, lot 13) — pattern LoadLibrary + globales + sentinelles + scan ring.

## Références

- Leçon CRLF : `driver-drop-test-af3dn-v7-2026-09-25.md` §Anomalie ; `decode/_audit/DumpNode_decomp_reconcile.md`.
- Vault : `[[battle-backend-roadmap]]` proposition 4 (durcissement) et `[[af3dn-captures-evidence-catalog-lot13]]`.
