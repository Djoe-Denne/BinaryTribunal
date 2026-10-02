# STATE_MATRIX_lot22 — états blend/depth/binding hérité (2026-10-02)

> Base : dump v13 strict `0x5640`
> (`sha256=24acea32dc6dc3a25c78460be9d919d3e6ecd9fc64d2aaf630d1cf3bd2264c46`,
> 2 512 records, 16 frames, 16 TX07, 192 TR08, zéro warning — re-parse
> reproduit par `analyze_lot22_state.py v13`).
> Règle générale : un zéro numérique ne code jamais `MissingEvidence` ; les
> quatre niveaux sont `Measured`, `DerivedFromMeasured`, `MissingEvidence`,
> `NotApplicable`.

## 1. Matrice des observables

| État | Mesuré aujourd'hui | Inconnu aujourd'hui | Provenance | Coverage | Point de capture proposé | live_needed |
| --- | --- | --- | --- | --- | --- | --- |
| diffuse alpha | valeur par sommet (FVF ARGB) : v13 = 1632×alpha255 + 256×alpha128 sur slot 49 ; frame 7105 : 6914×alpha255, 764×alpha127, 16×alpha128 | état blend effectif par draw | Measured | complet par sommet | ND08 (déjà présent) | non |
| slot 33 blend | surface proxy prouvée ; backend `sub_44162E` : `mode<5` → commit du matdesc `*(cookie+0x900+4*mode)` | la valeur liée à chaque draw ; le contenu des 5 descripteurs | MissingEvidence | 0 draw dans v13 | sideband ST09 kind=3 au wrapper slot 33 | oui (si fidélité blend requise) |
| render-state raw 0..25 | surface slot 29 prouvée : wrapper `0x41E650` (jl/jge signé [0,25], 48 rel-callers) → `[driver+0x74]` → `0x440FF0` | mapping sémantique complet et snapshot par draw | MissingEvidence (snapshot) / DerivedFromMeasured (surface) | 0 draw dans v13 | sideband ST09 kind=1 au wrapper slot 29 | oui |
| depth | RHW par sommet (7105 : 780 eq1 / 6914 lt1) | enable/write/compare, Z écrit, convention/plage, clear, cible depth | MissingEvidence | `0x440FF0` écrit le device immédiatement (pas de table shadow Alt) ; aucun alias depth nommé prouvé (aucune source d'enum D3D dans les artefacts) | aucun passif prouvé | oui |
| texture régulière | `ND08.texobj` ↔ `TR08` (slots 51/60) ; footers tpage/mode/clut ; slot 51 : texobjs `0x6D65790/0x6D65BC0/0x6D663E0/0x6D66A80` (atlas UI/font) | identité device si différente | Measured | fermé (lots 14-21) | ND08+TR08 (déjà présent) | non |
| slot 49 | `texobj=0` sur les 48 records (3/frame, 118 sommets/frame : 96 ombres / 6 curseur / 16 barres) | stage0 hérité à T_draw | MissingEvidence(stage0_binding) | le bind passe dans les setups (`sub_43DF00/54/A6`, `sub_43E059/E0E2` → `sub_441581` → `sub_407EB4` → `sub_41EF3C` `[deviceVT+0x98]`), invisible du proxy | hook passif `sub_41EF3C`/`[deviceVT+0x98]` (Phase D, NON implémenté) | oui |
| render target | surface slot 39 prouvée (`0x41E947`, 19 rel-callers, backend `RenderDDrawAlt_SelectRenderTarget` +0x9C) | token lié au draw | MissingEvidence | 0 draw dans v13 | sideband ST09 kind=4 au wrapper slot 39 | oui |
| alpha pipeline | diffuse/palette partiels ; source-over alpha127 = CandidatePolicy | texture-stage state, alpha-test, color-write mask, facteurs/op ; `Gfx_SetPrimBlendMode 0x407162` (prim+0x44, modes 0..3/6, facteurs +0x5C = 0x80/0xFF/0xFF/0x40/0xFF) hors dump | MissingEvidence | non capturé | aucun passif prouvé (champs d'objets, pas des appels de slot) | oui |
| ordre | ordre hôte intra-listes (`ND08` par `Gfx_WalkDrawList 0x4178D7`) | OT PSX global | DerivedFromMeasured | politique `fond→acteurs→UI` = replay candidat | — | non (hors objectif) |
| TEXWIN | `{0,0,0,0}` sur 16/16 (raw), W=H=256 dérivés (`sub_45BC60`) | — | Measured | fermé (lot 20/21) | TX07 (déjà présent) | non |

## 2. Couverture des transitions (Phase B) — verdicts

Chaque surface porte au moins deux preuves (wrapper/call-site + comportement backend).

| Surface | Verdict | Preuve 1 (wrapper/call-site) | Preuve 2 (backend) |
| --- | --- | --- | --- |
| slot 29 RS raw 0..25 | **COVERED** | `Gfx_SetRenderState 0x41E650` : jl/jge signé [0,25], `call [ecx+0x74]`, 48 rel-callers (dont `Gfx_SubmitTexturePageLists 0x465930`, `Gpu_* 0x45C/0x460/0x461`, `Gfx_SubmitDisplayLists 0x4980C0`) | `RenderDDrawAlt_SetRenderState 0x440FF0` (404 instr) : switch 26 types → `call [reg+0x58]` device SetRenderState immédiat ; store ctor `+0x74 @0x4258C4` ; **aucune table shadow côté Alt** |
| slot 30 commit | **COVERED** (commit = re-apply descripteur, PAS un flush RS) | wrapper `0x41E77D` : `call [eax+0x78]`, 6 rel-callers (`0x43F424`, `sub_441668`, `sub_4425C4`…) | backend = `sub_41F99A` direct (ctor `+0x78`) = `sub_41EF7A(1, matdesc, cookie)` |
| slot 31 | **COVERED** (chimique : backend-internal seulement) | `sub_41E6FF` : 2 rel-callers backend-internal (`0x43CB55`, `0x43D900`) | backend `sub_441560` : `if *(cookie+0xAC4) → sub_41F99A(matdesc, cookie)` |
| slot 32 | **COVERED** | `sub_41E727` : 9 rel-callers (`0x435DF8` GL, `0x43CB55/0x43D900…` Alt) | backend `sub_441581` : gate `*(cookie+0xAC4)`, device-lost check `[texobj+8]VT+0x60 == -2005532222`, puis `sub_41F99A` |
| slot 33 blend | **COVERED** (valeur raw) | `GfxDriver_SetBlendMode 0x41E752` : `call [eax+0x84]`, 6 rel-callers (`Gpu_EndPrimitivePass 0x460CE0 @0x460CFF`, `Gfx_SubmitTexturePageLists 0x465930`, `sub_45CDD0`) | backend `sub_44162E` : `if mode<5 → sub_41F99A(*(cookie+0x900+4*mode), cookie)` — le raw 0..4 est un INDEX dans une table de 5 matdescs |
| slot 39 target | **COVERED** (token) | `GfxDriver_SelectRenderTarget 0x41E947` : `call [eax+0x9C]`, 19 rel-callers | backend `RenderDDrawAlt_SelectRenderTarget` (ctor `+0x9C`) ; écrit `engine+0xA68` (note ABI .h) |
| setups 43-47/52-56 (commit de session) | **BYPASSÉS du slot 30/32** — captures dérivées possibles | impls `sub_43DF00/43DF2A/43DF54/43DFA6/43E059/43E0E2/43E197` appellent `sub_441560/sub_441581` EN DIRECT (0x43DF07→0x43DF1E, 0x43DF72, 0x43DFC4, 0x43E104…) | le commit s'exécute DANS le forward natif du setup proxied → observable par un event kind=6 (matdesc = `*(ctx+0x38)`, gate = `*(cookie+0xAC4)`) au wrapper setup |
| bypass device directs | **DOCUMENTÉS, downstream des slots proxied** | `sub_41EF7A` : SetRenderState device état 41 (alpha) via `[VT+0x58] @0x41F0D2` | `sub_41EF3C` : SetTexture(stage0, `*(texobj+0x0C)`) via `call [deviceVT+0x98] @0x41EF5D` ; reachables UNIQUEMENT depuis les commits/setups ci-dessus (gate `*(cookie+0xAC4)`) |
| wrappers slot-31 anonymes `0x41E697/0x41E6CB` | **NotApplicable** (code mort) | 0 rel-caller, 0 réf immédiate (.text + .data/.rdata, double scan) | lisent `*(engine+0xA84)+0x14C/+0x150` (entrées 83/84 = matdesc) → `sub_441560` |
| prim blend desc `+0x44/+0x5C` | **MissingEvidence** | `Gfx_SetPrimBlendMode 0x407162` écrit prim+0x44 (mode 0..3/6) + `+0x5C` (0x80/0xFF/0xFF/0x40/0xFF) + bit 0x400 sur +8/+0C | consommation dans le chemin battle D3D non prouvée ; aucun slot proxy ne transite |

Constat de couverture : sous DDrawAlt, TOUTES les transitions RS/blend/commit/target
observables passent par les slots proxied 29/30/31/32/33/39 (+ setups 43-47/52-56
pour les commits de session). Aucun bypass device détecté HORS de ces chemins
dans le périmètre audité (closures + ctor + backends slots 29-33).

## 3. Contrat candidat v14 (build `0x5641`) — append-only

Choix : **sideband d'événements `ST09` (32 o, 8×u32 LE) + footer ND08 +2×u32**.
Justification : les transitions RS sont potentiellement plus rares que les draws
(4096 records/frame cap) ; un footer complet par draw (~112 o) coûterait 25-40 %
du payload médian (~200 o) pour dupliquer un état déjà déduit du flux. Le footer
ne porte que le lien : `state_epoch` + `state_flags`. Une seule source de vérité :
l'ordre du flux (les ST09 précèdent les draws qu'ils affectent dans l'ordre du ring,
le replay reader reconstruit l'état par epoch).

| Champs | Valeur |
| --- | --- |
| `ST09` hdr | magic `'ST09' (0x39305453)`, build `0x5641`, seq, epoch (monotone, 1-based, jamais réutilisé), kind, type, value, aux |
| kinds | 1=RS set (type raw 0..25, value raw) · 2=commit (slots 30/31/32, value=token matdesc) · 3=blend (value raw 0..4) · 4=target (token opaque) · 5=invalidation (slot 0 init / slot 1 uninit) · 6=commit de session setup (slots 43-47/52-56 ; value=`*(ctx+0x38)`, aux=gate `*(cookie+0xAC4)`) · 7=marqueur scene (40/41, NON invalidant) |
| footer ND08 v14 | +2×u32 après le footer v12 : `state_epoch` (= g_stateEpoch au moment du snapshot AVANT le forward natif du draw), `state_flags` (bit0 has_epoch, bit1 stage0_valid [toujours 0 en v14], bit2 incomplete) |
| tailles | ST09 = 32 o · ND08 v14 max = **0x28170** ⊂ cap `0x100C80` · ST cap 1024/frame · ND/TX/TR inchangés, old fields byte-identiques |
| cycle de vie | initiales `unknown` (epoch 0) · invalidation sur slot 0/1 (kind=5) · kind=2/6 = committed, kind=1 = requested (jamais fusionnés, preuve Alt : `0x440FF0` = applied-at-call) · ring drop ST09 → `g_stStreamBroken=1` → bit2 sur tous les footers suivants · association `(seq, draw_ordinal) → epoch` unique (ordinal 0-based sur les kind2 de la frame) |
| gardes | parser strict par build-id (0x5641 candidat ≠ 0x5640 rejeté par le lecteur candidat ; l'oracle Lot 17 reste limité aux builds ≤ 0x5640) · token = identifiant opaque de capture (jamais EA statique) · aucune lecture Get* dans le detour · aucune I/O disque dans le detour · aucune formule blend/depth inventée · polarité de retour natif : le retour du backend est ignoré par les wrappers engine (preuve `0x41E650` : EAX discardé) |

Stage0 (Phase D) : **gate stricte tenue** — `stage0_valid=false` dans v14 ;
`MissingEvidence(SetTexture stage0)` ; point d'instrumentation proposé (non
implémenté) : capture passive autour de `sub_41EF3C` / `call [deviceVT+0x98]
@0x41EF5D` (préimage + ABI + restauration + budget sécurité à écrire AVANT tout
hook — jamais de patch vtable).

## 4. A/B frame 7105 — statut

`BLOCKED_BY_MISSING_STATE` (c'est le diagnostic attendu) : aucun état
blend/depth/stage0/target n'existe par draw dans v13. La replay A/B réelle est
refusée (`depth_policy_available()`/`blend_policy_available()` = False, test 7).
La logique de replay candidat est prouvée sur fixtures synthétiques (tests
Lot 22) uniquement. Aucune texture candidate appliquée au slot 49.

## 5. Nécessité live (extrait — matrice complète dans la campagne)

| Question | Bucket |
| --- | --- |
| stage0 exact du slot 49 sur un vrai draw | LIVE-REQUIRED |
| transitions blend/depth réelles frame 7105 | LIVE-REQUIRED (couverture capture prouvée offline, mais les VALEURS réelles exigent une capture) |
| contenu des 5 descripteurs blend `cookie+0x900` | LIVE-REQUIRED (lecture passive au slot 33, sans hook) |
| OT PSX global | SET-ASIDE-CERTAIN-UNKNOWN (hors objectif) |
| sécurité/restore d'un hook éventuel stage0 | LIVE-REQUIRED, jamais waivable |
