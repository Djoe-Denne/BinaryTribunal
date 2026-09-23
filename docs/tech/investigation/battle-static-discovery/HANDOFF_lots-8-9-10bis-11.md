# HANDOFF — Lots 8, 9, 10-bis, 11 (raisonnement adapté par taille)

> Prompt de reprise. Coller dans un **nouveau chat**. Références détaillées par lot (EA, docs,
> contrats de finition) : **HANDOFF_lots-post-magfx.md** — ne pas dupliquer ici.
> Pré-requis : lire §5 (pipeline) et §0.1 (méthode consolidée : finish_cell.py, watchdog,
> providers) de HANDOFF_gfx-pipeline-decomp.md.

## 0. Échelle de raisonnement — OBLIGATOIRE, adaptée à la taille

Jamais de `#high` par défaut. Le raisonnement max se gagne : >400 instr, chunks multiples,
nom de catalogue mensonger, verdict A UNCERTAIN/CONFLICT, désaccord A/V.

| Taille | Mode | Voix / raisonnement | Livrable |
|---|---|---|---|
| ≤ 20 instr | KEEP parent-direct | **aucun sous-agent** — one-liner IDB écrit par l'orchestrateur (probe_xrefs.py si doute) | commentaire + ligne census |
| 21–80 instr | 1+P | 1 voix décompileur **low** + check parent bloquant | decomp/ léger |
| 81–200 instr | 1+V | A **low**, V **medium** | decomp/ standard |
| 201–400 instr | 1+V | A **medium**, V **high** | decomp/ standard |
| >400 ou chunks | 2+1 | A+B **high**, R **high** | decomp/ + reconcile_notes |

Compte par taille AVANT de lancer (taille pack = asm.asm en octets ; instr ≈ octets/3,5).
Providers : opencode-go par défaut ; zai ≤2 voix simultanées si réactivé ; ≤8 voix en vol,
lancements étalés 30–60 s ; watchdog 15 min (§0.1 du HANDOFF principal).

## 1. Lot 8 — Textures/VRAM (G27.5)

Fonctions (tailles en octets → palier) :
- `TextureRelated 0x41AC34` (617) ~176 instr → **1+V medium**
- `Texture_FindTexture 0x419410` (582) ~166 → **1+V medium**
- `Texture_FormatCallback 0x419656` (456) ~130 → **1+V low/medium**
- `Texture_WriteCacheFile 0x41A875` (444) ~127 → **1+V low/medium**
- `Texture_TextureData 0x41A6C6` (431) ~123 → **1+V low/medium**
- `Texture_MatchFormatFallback 0x4199BB` (424) ~121 → **1+V low/medium**
- petites sœurs du cluster <400 o → **1+P low**
- `Gfx_InitTexturePageDrawLists 0x464220` (1057) ~300 → **1+V A medium / V high**

Contrat : identité ressource (clé cache, format, tpage/clut), cycle upload → cache →
invalidation → release. Ne pas refaire : 0x465930, 0x465CE0, TexStaging_*, VRAM 0x465455/0x4657D3.

## 2. Lot 9 — HUD widget passes (G24.5/24.7)

- `BattleUI_WidgetDrawPass 0x4B9DB0` (598) ~170 → **1+V medium**
- `BattleUI_WidgetUpdatePass 0x4B9C80` (221) ~63 → **1+P low**
- `BattleUI_LookupSlotVia_1D2B1D2 0x49F0A0` (176) ~50 → **1+P low**
- `BattleUI_ApplyDrawEnvClipOrSubmit 0x49D500` (130) ~37 → **1+P low**
- `BattleUI_UnionRect_1D766E8 0x4B9B00` (125) ~36 → **1+P low**

Contrat : primitives HUD → draw env packets, sémantique update/draw par slot. Racines déjà
nommées (PlaceWidget_3D8, EmitDrawEnvPackets, WriteGp0Codes_E1E5) à exploiter comme callees.

## 3. Lot 10-bis — traîne BdLink (108 restantes, AUCUNE > 80 instr)

**C'est un lot de classification, pas de décompilation.**
1. **Census script** (mécanique, zéro raisonnement) : pour les 108 `au_re_BdLinkTask*`/`BdLink*`
   non taguées — extraire variante de register appelée, adresse de liste `0x25xxxxx`, handler
   enregistré, callers ; clusteriser par signature (taille + cible + constantes).
2. **81 thunks ≤20 instr** → KEEP parent-direct, **commit par cluster** (tableau census dans le
   message — exception validée opérateur à la règle 1-commit/fonction).
3. **27 wrappers 21–80 instr** → **1+P low**, 1 représentant CERTAIN par cluster + jumeaux
   validés par diff ASM ; 1 commit par fonction.
4. Handlers réels : nommage + one-liner contrat seulement (les décomps appartiennent aux
   familles GF/effets — séparées, G25.3/G28).

Clôture : zéro xref non comptée vers Register/Pump ; table `liste/task-ID → handler →
busy/completion/drain` complète ; census battle-static-call-graph + ledger à jour.

## 4. Lot 11 — Layouts CAM (G26.6/26.7)

Le travail est **data recovery**, pas du code : layouts globaux `.x`/`mag*` (trou borné Vague D),
CAM C0M max 22 vs engine 32, H6 = base de collection. Setters nommés (0x45D7F0, 0x45DE50,
0x45DD60, 0x64DE40, 0x64DE00, 0x6F0CC0, 0x509810…) → **1+P low** au fil de l'eau. Le layout
lui-même : sondes IDA read-only + doc `battle-camera-architecture.md` — raisonnement parent
**medium**, pas de voix. Contrat : view/proj par frame + conventions de coordonnées, consommable
par le host renderer.

## 5. Transverse

- Ordre conseillé : **8 et 9 en parallèle** (purs decomp), 10-bis en remplissage mécanique,
  11 en tâche de fond data.
- Push IDB append-only + save_database par fonction ; pas de --no-verify ; ne jamais committer
  `tools/_tmp_*`.
- Fin de session : save_database final, §0/§3 du HANDOFF principal, commit ledger/catalogue,
  rapport `EA | verdict | nom | confiance | commit | palier utilisé`.
