# CAMPAIGN Lot 24 — candidat instrumentation stage0 v15 `0x5642` (2026-10-03)

Autorisation : « On va aller sur le nouveau candidat instrumentation » —
**offline, build-only uniquement**. Aucun déploiement, aucun jeu, aucun
debugger, aucune mutation IDB, aucun hook dans le processus du jeu. Live :
**NOT AUTHORIZED** (la porte `LIVE_NECESSITY_lot23.md` reste NON FERMÉE).
Contrat : `PROMPT_lot24-stage0-instrumentation-0x5642.md`.

## 1. Build-id

**`0x5642` prouvé libre** (grep exhaustif docs/tools/obsidian/.agents ce jour ;
builds connus 0x5638→0x5641 côté `ff8dump.py`/writer). Aucun `SUPPORTED` ne le
contient. Version : **v15-lot24**. Fork append-only des sources v14
(`lot22/` intouchées, hashes vérifiés).

## 2. Livrables et preuves

| Livrable | Contenu | Preuve |
| --- | --- | --- |
| `lot24/gfx_driver_passthrough.{c,h}` | v15 : ST09 **40 o** (+ctx_token/device_token), kinds **8/9** stage0, kind2/6 **aux=retour natif brut**, footer **68 o** (+triple stage0, st_emitted, st_lost), installer/restaurateur/stub **exportés** (17 exports), DllMain **non câblé** | build x86 exit 0, zéro warning ; pin `candidate_pin.json` |
| `tools/af3dn_state/lot24_contract.py` + tests | lecteur v15 strict + sémantique requested(8)/applied-witness(9) + sticky `st_loss_frame` + **régression v14** + rejets croisés | **31/31, exit 0** |
| `tools/af3dn_state/harness_lot24.c` | harnais natif v15 : install fidèle, **stub testé fonctionnellement**, restore byte-exact, fail-closed, cap/ring v15 | **648 assertions, 0 fail, exit 0** (via gate) |
| `tools/af3dn_state/gate_writer_lot24.py` + tests purs | gate dédiée : mode **PIN** (premier build) puis STRICT, 17 exports exacts, préimages/immédiats dérivés, `fopen "ab"`, audits lecteur des 5 bins | **22/22 purs** ; PIN `PINNED` ; STRICT **`BUILD_ONLY_BYTES_VERIFIED_NOT_DEPLOYED`** |
| `lot24/validation_receipt.json` | reçu global : toutes suites, exits réels | — |

Sweep complet avec fixtures env : **235 tests, OK, exit 0** (182 hérités +
31 lecteur + 22 gate).

## 3. Décisions structurantes (tranchées pendant la campagne)

1. **Ancrage B confirmé** : 2 call-sites `0x41EF5D`/`0x41EF72`, préimage
   `FF 90 98 00 00 00` → `E8 rel32` + `90`. Gap accepté : chemin `device==0`
   non couvert (aucun call, aucun HRESULT par construction).
2. **Pertes ST09** : tout refus **en fenêtre armée** (frame >4096, cap 1024,
   ring plein) = perte explicite (`broken` + `drops` + `lost` + bit3) ;
   **hors fenêtre = refus silencieux v14** (correction de la consigne
   initiale — sinon INCOMPLETE collant à l'idle).
3. **Épilogue du stub = `ret 12` UNIQUE** : le stub **remplace le callee
   stdcall** (entrée via E8 : `[S]=site+5`, args `[S+4..C]`) — la forme
   « call direct harnais » est identique. Un `ret 16` avalait un slot de
   trop (canaries décalées → ret sauvage → re-entrée au milieu du stub avec
   `eax=0x1234`) — cause racine de l'AV s0b, diagnostiquée par
   instrumentation (ExceptionAddress/CONTEXT) puis par recomptage
   (agent breakthrough Astra).
4. **Sentinelle harnais = `E9 jmp` (5 o à site+6)**, pas un `ret` : aucun
   accès pile, la forme jeu reste exacte ; cible révélée par un **appel
   warm-up** (`g_warm`) qui pose `g_back_addr` sans jmp. Artifice
   **HARNIS ONLY**, documenté.
5. **Type 0 pour kind8/9** = « site inconnu » (stub hors site patché) :
   accepté par le lecteur (logué tel quel, jamais supposé).
6. `GFXPT_BootPreimage` (dead code v6) : intouché.
7. Le hash du DLL dépend du **répertoire de build** (chemin PDB embarqué) :
   le build canonique est fait **dans `lot24/`** ; les builds `/MAP` de
   diagnostic sont faits en Temp et vérifiés section par section (`.text`/
   `.data` identiques ⇒ RVAs du map applicables).

## 4. Trajectoire de débogage (conservée, rien de masqué)

Itérations gate 1-14 : (i) `C2488` naked sur la **déclaration** .h → naked sur
la définition seule ; (ii) attentes harnais corrigées côté harnais
**jamais du writer** : reset `g_frameStLost` aux changements de frame manuels
(miroir du pulse), ré-armement `CAP_END_SEQ` pour les phases seq 3000+,
flags ndd = `HAS_EPOCH` seul (`g_stage0Broken` ≠ `g_stStreamBroken` — wiring
writer inchangé) ; (iii) AV s0b : instrumentation ExceptionAddress → fault
**dans le stub au call COM** avec `eax=0x1234` → re-entrée sauvage →
recomptage Astra → `ret 12` unique ; (iv) probe BSS far : `0x140572C4` =
RVA **`0x40572C4`** (erreur de soustraction de base corrigée) ; (v) deux
tests purs de gate défaillants (image PE double-section mal packée, payload
pin incomplet) corrigés dans les tests.

## 5. Verdicts séparés

| Verdict | État |
| --- | --- |
| Contrat offline v15 | structure/round-trip **vérifiés** ; couplage état→draw **BLOCKED** |
| Instrumentation | stub **fonctionnellement prouvé** (harnais synthétique) ; sécurité install/runtime **NON FERMÉE** |
| Reproductibilité | pin + strict re-vérifié ; checkout committé **non prouvé** |
| Fidélité UI | **PARTIAL/BLOCKED** |
| Live | **NOT AUTHORIZED** |

Manquent encore pour promotion : association native état→draw par contexte,
HRESULT COM réel, état effectif à T_draw, témoins du même frame — la carte
future reste celle de `LIVE_NECESSITY_lot23.md`. `0x5643` n'est pas réservé.
