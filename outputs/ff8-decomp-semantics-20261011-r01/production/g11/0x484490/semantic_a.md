# SEMANTIC A — g11 / 0x484490 — mission ff8-decomp-semantics-2026-10-11-run01

- **Volet** : sémantique A (schéma 2+1), EA cible : `0x484490` uniquement.
- **Tâche** : `task_mv44sdfe_00ag_z5op06` — sortie : `outputs/ff8-decomp-semantics-20261011-r01/production/g11/0x484490/semantic_a.md`.
- **Session** : fork du lecteur factuel indépendant `ses_ed427b872ffe0xhmUYh45OGOZs` (gel exploration g11) ; héritage projeté, aucune relecture de volets frères (0x4844D0 production, review, C) — travail aveugle respecté.
- **Modèle effectif de session** : `zai-coding-plan/glm-5.3-flash`. ⚠ Divergence : la tâche mentionne `openai/gpt-6.1-sol medium` comme modèle prévu ; l'admission (Pool25) reste de la responsabilité du lead — aucune auto-promotion.
- **Statut** : analyse factuelle et niveaux de confiance uniquement. **Aucune promotion, aucun §5.6, aucun verdict final** (réservés au superviseur, CONTRACT.md:40).

---

## 0. Entrées et provenance

| Source | Rôle | Référence |
|---|---|---|
| `.tmp/ff8-decomp-semantics-20261011-r01/native/0x484490.json` | **vérité terrain** (packet natif cible, 15 instructions, 939 chars asm, 1 bloc) | native-groups.json:913–920 (sha256 déclaré `848341204b1ee6f30f404dea7e0648550cc81acec711182ffdd304f0b81ebf0d`) |
| `.tmp/ff8-decomp-semantics-20261011-r01/native/0x4844D0.json` | vérité terrain (packet natif sibling g11 — usage structurel des mêmes champs) | native-groups.json:922–929 |
| `docs/missions/ff8-decomp-semantics-2026-10-11-run01/native-groups.json` | groupement g11 + graphe d'appels + xrefs | :94–99 (g11), :3891–3906 (graphe) |
| `docs/missions/ff8-decomp-semantics-2026-10-11-run01/CONTRACT.md` | périmètre et règles | :7 (98 EA), :20 (forks explorateur gelé), :40 (UNCERTAIN/CONFLICT) |
| Décodeur indépendant in-session | re-vérification octet par octet du flux hex (54 octets = 0x484490→0x4844C6, 15 instructions ; cible d'appel sibling 0x48F020 = 0x4844D6+0xAB4A recalculée) | ce fichier §1 |

Limite de provenance : le sha256 des packets n'a pas pu être recalculé dans cette session (sandbox sans accès filesystem) ; il est reporté tel que déclaré dans native-groups.json. GrepAI/QMD indisponibles dans le catalogue de cette session de production → aucune corroboration externe supplémentaire au-delà du gel.

---

## 1. Faits mécaniques — CERTAIN

### 1.1 Flux d'instructions complet (décodage vérifié, source P-484490-hex `0x484490.json:15`, P-484490-asm `:18`)

```asm
0x484490  mov   eax, [esp+4]          ; arg0 = index de slot (dword pile)
0x484494  lea   ecx, [eax+eax*2]      ; ecx = 3*slot
0x484497  lea   eax, [eax+ecx*4]      ; eax = slot + 12*slot = 13*slot
0x48449A  mov   ecx, [0x01CFE738]     ; ecx = dword global (label IDB: SG_BATTLE_SPEED_SETTING)
0x4844A0  shl   eax, 4                ; eax = 208*slot   (13*slot<<4)
0x4844A3  and   ecx, 0FFh             ; speed = byte(speed_setting)   [0..255]
0x4844A9  add   eax, 0x01D27B10       ; eax = base(slot_data) + 208*slot  (label IDB: BATTLE_SLOT_DATA)
0x4844AE  inc   ecx                   ; speed+1  [1..256]
0x4844AF  lea   ecx, [ecx+ecx*4]      ; *5
0x4844B2  lea   ecx, [ecx+ecx*4]      ; *25
0x4844B5  lea   edx, [ecx+ecx*4]      ; *125
0x4844B8  shl   edx, 5                ; edx = 4000*(speed+1)   [4000 .. 1 024 000]
0x4844BB  mov   [eax+10h], edx        ; slot+0x10 (dword) = 4000*(speed+1)
0x4844BE  mov   dword ptr [eax+14h], 0 ; slot+0x14 (dword) = 0
0x4844C5  retn                        ; EAX = base + 208*slot (pointeur de slot résiduel)
```

Cohérence interne vérifiée : 54 octets, dernière instruction `retn` à 0x4844C5, fin exclusive 0x4844C6 = champ `end` du packet (`0x484490.json:14`), `instruction_count:15` (`0x484490.json:41`). Un seul bloc CFG, zéro successeur (`0x484490.json:19–25`) → **fonction feuille, sans branche, sans validation d'entrée**.

### 1.2 ABI et convention d'appel

- 1 argument pile `[esp+4]` (dword), lu avant tout `push` → callee ne modifie pas l'offset arg.
- Terminaison `retn` seul (0xC3), zéro octet de cleanup → cohérent **__cdecl** (caller nettoie la pile). Pas de `this` via ECX (ECX écrasé à 0x48449A) → pas thiscall.
- Retour : **EAX 32 bits complet** = `base_slot_data + 208*slot` au moment du `retn` (le `add` de 0x4844A9 n'est jamais écrasé). Aucune sémantique AL/AX spécifique. Le caractère « valeur de retour intentionnelle » est une interprétation (§3), pas un fait mécanique.
- Registres clobber : EAX, ECX, EDX (tous volatils en cdecl). Aucun registre non-volatil touché (pas de push/pop hormis rien ; ESI non utilisé ici).

### 1.3 Effets mémoire

Deux écritures dwords, toutes deux à travers le pointeur `eax` :
- `[slot_base + 0x10] ← 4000*(byte([0x01CFE738])+1)` ;
- `[slot_base + 0x14] ← 0`.
Une lecture : dword `0x01CFE738` (un seul octet significatif après masque). Pas d'autre accès mémoire, pas d'appel.

### 1.4 Signedness, strides, retour

- **Stride** : multiplicateur littéral `13*slot << 4` = **208 octets (0xD0)** par slot — confirmé par le sibling `0x4844D0` qui répète exactement `lea ecx,[eax+eax*2]; lea ecx,[eax+ecx*4]; shl ecx,4` (`0x4844D0.json:18`). Stride de groupe homogène = 208.
- **Signedness** : aucune instruction arithmétique signée (`sar`, `imul`, `cbw` absentes) ; `shl`/`lea`/`and`/`inc`/`add` sont neutres au signe. Masque `0xFF` → lecture d'un **octet non signé** ; `inc` → 1..256 ; ×4000 → 4 000..1 024 000, toujours positif sur 32 bits (pas d'overflow réaliste). Un `slot` négatif (complément à 2) produirait un offset wrappé modulo 2³² **sans aucun contrôle** — la fonction n'a aucune garde (fait mécanique ; la garde éventuelle est chez les callers, inconnus ici).
- **Retour** : EAX = pointeur de slot (valeur complète 32 bits). Voir §2 conflit sur l'annotation.

### 1.5 Xrefs et graphe

- `xrefs_to` (toutes `type:17, iscode:true` — interprétation LIKELY : near call, énumération IDA standard) :
  - depuis `0x48B713`, fonction `0x48B5F0` (`0x484490.json:26–33`) ;
  - depuis `0x48BF2F`, fonction `0x48BBD0` (`0x484490.json:34–39`).
- Graphe : `out: []` (feuille), `callers: [0x48B5F0, 0x48BBD0]` (native-groups.json:3891–3897).
- Le sibling `0x4844D0` a **exactement les deux mêmes callers** (`0x4844D0.json:56–69`, native-groups.json:3898–3906) → paire d'initialisation invoquée aux mêmes sites.
- `0x4844D0` appelle `0x48F020` (hors des 98 EA de la mission ; annotation packet : primitive RNG locale de combat lisant RANDOM_NUMBER_LIST via curseur de lane — **annotation, pas conclusion**) (`0x4844D0.json:18`, `:70–72`). Recalcul indépendant : cible = 0x4844D6 + 0xAB4A = 0x48F020 ✓. `0x48F050` (label `domain::Battle_SeedRNG`, g13) existe dans le gel (native-groups.json:994–1001) mais aucun lien de graphe direct 0x484490→RNG.
- **Les deux callers (0x48B5F0, 0x48BBD0) sont hors du périmètre 98 EA** : aucun packet natif disponible pour eux → leur contexte d'appel est inconnu (limite dure de cette analyse).

---

## 2. Conflits et divergences entre sources

| # | Divergence | Résolution proposée |
|---|---|---|
| C1 | Annotation inline du packet à 0x4844BB : « slots stride 0x1B0 » vs **arithmétique littérale 208 (0xD0)**, confirmée dans les deux fonctions du groupe | **CONFLICT tranché en faveur des instructions** (vérité terrain). 13·slot<<4 = 208 sans ambiguïté. L'annotation 0x1B0=432 est incompatible avec tout encodage du flux ; hypothèse de réconciliation non vérifiable ici : 0x1B0 pourrait décrire un enregistrement d'unité plus large utilisé ailleurs. Reste UNCERTAIN. |
| C2 | Annotation de retour « returns &BATTLE_SLOT_DATA[slot] … not a status » (avec tag `[wave 2026-09-12 GLM+Grok PASS]`) vs absence de preuve d'usage par les callers (hors périmètre) | Fait mécanique CERTAIN : EAX contient le pointeur au `retn`. Interprétation « retour intentionnel » : LIKELY seulement. Le tag de wave antérieure est une trace, **pas une preuve** dans ce gel. |
| C3 | Annotations parasites dans le packet sibling (`0x4844D0.json:18`) : mention « weapon+70*lines 0x1CFE6F8 » collée à l'instruction `and eax,7Fh`, sans rapport local évident ; adresse 0x1CFE6F8 ≠ 0x1CFE738 | Traitées comme **bruit d'annotation**, jamais comme conclusion. Aucun fait n'en dépend. |
| C4 | Modèle de tâche (`openai/gpt-6.1-sol medium`) vs modèle de session effectif (`zai-coding-plan/glm-5.3-flash`) | Signalé au lead ; admission Pool25 = décision lead uniquement. Aucune action locale. |

---

## 3. Rôle déduit — interprétation métier (LIKELY)

**Rôle proposé** : initialisation de la jauge ATB d'un slot de combat : capacité maximale dérivée du réglage de vitesse de combat, jauge courante remise à zéro.

Chaîne interprétative (chaque maillon sourcé) :
1. Le masque `0xFF` + `inc` + ×4000 sur un global dédié (label `SG_BATTLE_SPEED_SETTING`, 0x01CFE738) construit une **capacité** 4000·(réglage+1) — mécanique certaine, dénomination « capacité/maximum » interprétée.
2. L'écriture à `+0x10` et la remise à zéro à `+0x14` du même enregistrement de 208 octets suggèrent deux champs appariés max/courant — interprétation.
3. Le sibling `0x4844D0` **lit** `+0x10` comme diviseur/échelle (`(max/100)` via constante magique 0x51EB851F, `sar 5`, `imul`) puis **borne supérieure de clamp** (`cmp` max/cur, `jge`, store max ; puis clamp à 0) et n'écrit que `+0x14` (`0x4844D0.json:18`) → renforce fortement : `+0x10` = plafond (max), `+0x14` = jauge courante ≤ max.
4. Les deux mêmes callers invoquent les deux fonctions → deux modes d'initialisation alternatifs du même couple de champs (reset pur vs pré-charge aléatoire) — hypothèse d'usage plausible, callers non observables.

Ce qui reste **INCERTAIN** : la signification exacte du global 0x01CFE738 (le label « speed setting » est un label IDB) ; l'identité métier du champ +0x14 (ATB vs toute autre jauge) ; le comportement attendu pour un `slot` hors bornes ; l'usage réel d'EAX par les callers.

---

## 4. Nom proposé et preuves

**Nom proposé** : `battle_slot_atb_init_max_from_speed__reset_current`
(variante courte : `BattleSlotATB_InitMaxResetCur`)

Le label IDB existant `domain::Battle_InitATB_MaxAndReset` (`0x484490.json:3`, champ `name_label_only`) est **cohérent** avec la mécanique mais **n'est pas une preuve** (étiquette, stylisation C++ non démontrée).

Preuves indépendantes (≥2) :

- **P1 (instructions, effet d'écriture)** : `mov [eax+10h], edx` avec `edx = 4000*(byte+1)` puis `mov dword [eax+14h], 0` — « fixe un maximum dérivé du réglage et remet le courant à zéro » (`0x484490.json:15,18` ; décodage §1.1).
- **P2 (structure croisée, sibling)** : `0x4844D0` utilise `+0x10` comme échelle (`max/100`, constante 0x51EB851F) **et** comme plafond de clamp (`cmp edx,eax; jge` → store max ; clamp ≥0 avant `retn`), et n'écrit que `+0x14` (`0x4844D0.json:18`, CFG `:19–55`) — prouve indépendamment la sémantique max/courant des champs +0x10/+0x14.
- **P3 (xrefs appariées)** : mêmes deux callers `0x48B5F0`/`0x48BBD0` pour les deux fonctions (`0x484490.json:26–39` ; `0x4844D0.json:56–69` ; graphe native-groups.json:3891–3906) — paire d'initialisation cohérente appelée aux mêmes sites.
- **P4 (arithmétique de capacité)** : construction `((v&0xFF)+1)` ×4000 par `lea`×3 + `shl 5` — constante de jauge à grande échelle, non incrément par tick (aucune boucle, fonction feuille).

---

## 5. Hypothèses non tranchées (à réconcilier par le superviseur)

- H1 : 0x1B0 (annotation) = stride d'un struct d'unité plus large ailleurs ; 208 = stride du tableau de slots ici. Non vérifiable dans le gel actuel.
- H2 : `0x48F020` = primitive RNG locale de combat (annotation packet) ; lepattern d'usage `&0x7F; inc` dans le sibling donne une valeur 1..128.
- H3 : les callers 0x48B5F0/0x48BBD0 sont deux chemins d'installation de combat (ex. nouvelle partie de combat vs re-init) — aucune preuve disponible.

## 6. Questions ouvertes

1. Les callers consomment-ils EAX (pointeur) ou l'ignorent-ils ? (nécessite packets 0x48B5F0/0x48BBD0.)
2. Quel intervalle réel de `slot` les callers garantissent-ils ?
3. Le global 0x01CFE738 est-il écrit par le menu de configuration (réglage vitesse) ? Hors gel actuel.
4. Faut-il archiver 0x48F020 / 0x48B5F0 / 0x48BBD0 dans une extension de gel pour clore g11 sans UNCERTAIN ?

## 7. Inventaire des sources lues (cette session de production)

1. `docs/missions/ff8-decomp-semantics-2026-10-11-run01/CONTRACT.md` (hérité gel, relu en contexte) — règles :7, :20, :40.
2. `docs/missions/ff8-decomp-semantics-2026-10-11-run01/native-groups.json` — g11 :94–99 ; métadonnées :913–929 ; graphe :3885–3924 (0x484490 :3891–3897, 0x4844D0 :3898–3906) ; 0x48F050 :994–1001.
3. `.tmp/ff8-decomp-semantics-20261011-r01/native/0x484490.json` — intégral (42 lignes).
4. `.tmp/ff8-decomp-semantics-20261011-r01/native/0x4844D0.json` — intégral (74 lignes, ligne assembly tronquée à l'affichage ; flux hex intégral décodé indépendamment en §1/§2).
5. Listing noms de fichiers `outputs/…/production/g11/` (présence du volet frère 0x4844D0 — **non lu**) ; board tâches (statut discovery g11 = completed).
6. Aucune lecture : production sibling, review, compaction d'autres groupes, IDB, git, registre.

## 8. Limites de session

- Sandbox sans filesystem/crypto → sha256 des packets non recalculables (déclarés dans native-groups.json, reportés tels quels).
- Catalogue outils réduit (ni GrepAI, ni QMD, ni Serena) → pas de corroboration code/réécriture sœur ni wiki au-delà du gel hérité.
- Callers et callee RNG hors des 98 EA → aucune packet native pour eux.
- Modèle de session ≠ modèle annoncé dans la tâche (voir §2 C4) — admission à l'arbitrage du lead.
