# Rattrapage statique — extraire tout ce qui manque, avant G23

Tu es un nouvel agent. Cette mission remplace toute envie d’ouvrir
G23. L’opérateur a décidé le 30 août 2026 : **on n’avance pas au
groupe suivant tant que les informations d’init oubliées ne sont
pas sorties du jeu** (EXE, kernel, sauvegardes).

Ce n’est pas une session live. Ce n’est pas « fermer G22 en
promouvant ». C’est : **lire, prouver, écrire la connaissance**.
Ensuite seulement, si le temps le permet, brancher ces preuves
dans le code G22 déjà posé. Jamais G23.

## En français simple — ce que tu dois comprendre

Il y a une trentaine de groupes. G22 = « comment un combat
**démarre** ». G23 = « comment un combat **se termine** ».

G22 sait déjà lancer un vrai combat, attaquer, refuser un second
init, et s’éteindre. Il manque les **tables et règles** qu’on n’a
jamais extraites : jonctions, flags d’histoire, liste Draw,
dead-timer, stats party, type de départ (ordinary / surprise /
dos), qui a le droit d’être enfilé au premier tour.

Ces données **font partie de G22**. Elles ne vont pas dans un
groupe futur. Si on ne les sort jamais, l’init restera incomplète
jusqu’à la fin du projet. On les étudie **maintenant**, en
statique, parce qu’elles sont dans les fichiers et l’EXE, pas
dans un combat à relancer.

## Interdit

- Commencer G23 (`Battle_EndCleanupAndTransition`, rewards, commit
  save de fin de combat).
- Lancer ou attacher `FF8_EN.exe`. Pas d’injecteur. Pas de suite
  live. Pas de breakpoint runtime.
- Inventer un offset, un stride, un bit, une moyenne « qui passe
  le test ».
- Appeler les helpers d’init natifs depuis le C++
  (`ParseBattleParty`, `ParseBattleCharacter`,
  `Battle_CalculateJunctionStats`, `setAllMonsterInfoFromDatSection`,
  `Battle_InitATB_*`, `Battle_InitPreemptiveBackAttackStatus`,
  `Battle_SeedRNG`, `Odin_BattleInit_ZantetsukenCheck`,
  `Gilgamesh_BattleInit_TriggerCheck`, `Battle_InitDeadTimer`,
  `Battle_EnqueueInitialPartyActions`, `import_legacy` comme source).
- Rouvrir G21 (readers). Tu **consommes** `run_describe_encounter`
  et les codecs déjà là.
- Ouvrir un profil « tout le domaine ». Ne touche pas G23, ne
  crée pas de campagne live.
- Committer sans demande explicite.
- Copier une table wiki communautaire à la place d’une preuve IDB.

## Déjà extrait — ne pas redécouvrir

Lis d’abord. Beaucoup de **formules** existent. Ce qui manque, ce
sont les **octets disque / save** et la **politique** (qui, quand).

| Déjà là | Où |
| --- | --- |
| Formules junction / HP / stats / ATB init / rolls Odin-Gilga / dead-timer | `obsidian-docs/projects/re-ff8/references/battle-formulas.md` |
| Ordre natif d’init (subsub / subsubsub 0→4) | `docs/tech/systems/battle_init.md` |
| Working copy `F_CHAR_DATA` : 0x570, stride 0x1d0, HP `+0x172`, stock magie `+0x082`, arme `+0x1ba` | `save_layout.hpp` |
| Save **déjà** décodé : items, battle-speed, flag Odin-Angel-Gilga | `save_party_codec.cpp` seulement ça |
| Kernel authentifié | SHA-256 `e378fb8f198ede3dae858f0ded6670f9ba423aa79abfff7237e701dfc7f9e7f6` |
| EXE Steam 2013 | SHA-256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570` |
| `K_MISC` hôte | RVA `0x018f8b14`, 0x3C octets (timers G10 déjà) |
| Section `.dat` 6 = 380 o monster_info | SQ-G21-003 **fermée** |
| Ancre live G22 v15 (PID 38256, DLL `d901a8c2…`) | ready + refuse + Detached + queue reset. **Ne pas relancer.** |
| SQ-G22-004 (reset des 3 files G07 + detour enqueue) | live-proven. La **politique** d’enfilement reste ouverte. |

`save_party_codec` ne sait **pas** encore lire un perso, une
junction, ni un flag d’histoire. C’est le trou principal.

## Résultat attendu

Pour **chaque** ligne de la file ci-dessous :

1. Preuve IDB (xrefs, offsets, stride, bits) **ou** skip nommé
   avec la raison (« helper 101–255 non fermé, on n’écrit pas »).
2. Page wiki à jour + annotation IDB (nom, type, commentaire).
3. Si le layout est fermé : fixture (dump save / extraits kernel)
   et, si tu as le temps, codec + test offline dans
   `FinalFantasy_VIII_Reimaginated`.
4. Rapport de fin : ce qui est prouvé, ce qui reste skip, **G23
   toujours non commencé**.

Une ligne n’est pas « fermée » parce qu’une formule wiki existe.
Elle est fermée quand un **octet** (save, `kernel.bin`, ou global
nommé) est lié à cette formule par l’IDB.

## File de travail — dans cet ordre

### 1. Politique d’enfilement initial — priorité

Fonction : `Battle_EnqueueInitialPartyActions` `0x47D8A0`.
Voisine : `Battle_BuildTargetVisibilityMasks` `0x485FF0`.
Appelées au **case 3** du Director `0x47CCB0` (avant le write
step=4).

À extraire :

- quel flag slot autorise un enqueue ;
- quelle action (Attack ? rien ?) ;
- masques eligible / enqueued ;
- lien avec AI Init (G22 **arme** le slot, G15 exécute la VM) ;
- gates visibilité / fuite posés ici vs plus tard.

Le detour v15 a été **appelé** (replacement 1, native 0) avec
`eligible_mask=0` et `enqueued_mask=0`. L’Attack a marché par le
menu. On veut la **règle native**, pas une invention.

Livrable : pseudocode exact + table de flags. Ensuite seulement
un test offline.

### 2. Record perso save + jonctions

Fonctions : `ParseBattleCharacter` `0x495530`,
`Battle_CalculateJunctionStats` `0x495960`,
`Battle_BuildMagicJunctionList` `0x4954B0`,
`GetCharacterHP` `0x496310`, `GetCharacterStat` `0x496440`.

Les **formules** sont dans `battle-formulas.md`. Il manque le
record **disque** `SG_ARRAY_CHARA_DATA` : stride, XP, JFlag,
stock magie 32 paires, commandes, GF, bonus points, MaxHP save.

Hyne lit les saves. L’IDB dit où le jeu les lit. Les deux doivent
**matcher**. Pas de stride inventé.

C’est SQ-G21-001 côté layout. G22 s’en sert pour U22.2.

### 3. Flags d’histoire

Même SQ-G21-001. Quels bits save / globaux `Battle_InitDeadTimer`,
Odin, Gilgamesh, Angelo, rare-item, surprise/back **lisent** à
l’init. Hyne montre souvent les noms. L’IDB prouve le bit.

Pas de bit « on suppose que c’est SeeD rank ».

### 4. Type de départ ordinary / surprise / dos

Fonction : `Battle_InitPreemptiveBackAttackStatus` `0x48AFD0`.
Globals : `BACK_PREEMTIVE_INFO`, flags scène.

Extraire : roll, immunité, malus Rare Item −20, overrides
Initiative. Preemptive/back **forcés** existent déjà offline.
Ici on veut le **roll ordinary** et ses tables.

### 5. Dead-timer `K_MISC`

Fonction : `Battle_InitDeadTimer` `0x482F70`.
Pose `BATTLE_DEAD_TIMER` depuis un champ `K_MISC`.

G10 a déjà 0x3C octets et les durées Sleep..Float. Trouve
**quel offset** est `dead_timer`. Doomtrain ouvre `kernel.bin`.
`D:\Modding\ff8\kernel.bin` doit être le même hash que le
fixture (`e378fb8f…`). Si le hash diffère, **arrête** et
rapporte : on ne mélange pas deux kernels.

### 6. Liste Draw / magie connue

Fonction : `Battle_InitDrawSpellAvailability` `0x48C7A0`.
Donnée : `SG_KNOWN_MAGIC` (à trouver dans l’IDB, pas encore
dans l’address-map G22).

Lier scène + `.dat` + save « magies vues ». Sans ça : skip
nommé, on n’écrit pas de draw list inventée.

### 7. Niveaux ennemi 101–255 et DAT par ennemi

Helpers `level_code` dans `battle_init.md` / `battle-formulas.md`.
Revalider **chaque** helper avant de le nommer. Non prouvé =
skip (SQ-G22-001). Un Buel niveau 20 suffit déjà comme fixture
courbe. Ne pas élargir à toute la bestiole sans preuve.

## Outils — `D:\Modding\ff8`

Vérifie une fois, puis travaille. N’installe rien.

| Outil | Chemin | Sert à |
| --- | --- | --- |
| IDA + IDB | `D:\Modding\ff8\retro-exe\FF8_EN.exe.i64` | Autorité n°1. MCP `user-ida-pro-mcp`. |
| Table Cheat Engine | `D:\Modding\ff8\retro-exe\FF8_EN.CT` | Noms de globaux, **pas** une preuve. |
| Kernel éditeur | `D:\Modding\ff8\Doomtrain_v1.0.1\Doomtrain.exe` | Lire `K_MISC`, `K_MAGIC`, `K_CHARACTER` à l’écran. |
| `kernel.bin` local | `D:\Modding\ff8\kernel.bin` | Hasher avant usage. Doit = fixture. |
| Saves | `D:\Modding\ff8\hyne-1.11.1-win32\Hyne.exe` | Ouvrir une `.ff8`, voir jonctions / flags. Demande une save à l’opérateur si tu n’en as pas. |
| Parser Python | `D:\Modding\ff8\FF8GameData\` | Extraire des tables kernel/dat en scripts jetables. |
| Field / scripts | `D:\Modding\ff8\deling-1.0.0-win64` | Noms de flags d’histoire **seulement**. Le bit save se prouve dans l’IDB. |
| Docs / dumps EXE | `D:\Modding\ff8\retro-exe\` | PDFs et scripts déjà là ; à recouper, pas à croire. |

Autres dossiers (`pupu`, `Shumi`, `field`, `Fiel-map-editor`,
`new_magic_test`) : inventaire, utile seulement si un nom de
fichier pointe dessus. Ne pas partir en exploration touristique.

Si tu as besoin d’un fichier que l’opérateur seul peut fournir
(save de jeu, export Hyne), **demande une fois**, clairement,
puis continue sur une autre ligne de la file.

## Dépôts

```text
Docs / ce prompt     C:\Users\djden\source\repos\retro-eng\re-ff8
Implémentation       C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated
IDB                  D:\Modding\ff8\retro-exe\FF8_EN.exe.i64
Outils modding       D:\Modding\ff8
```

L’injecteur existe. **Tu ne l’utilises pas.**

## Autorité, dans cet ordre

1. Octets et xrefs de **cet** IDB / **cet** EXE.
2. `kernel.bin` au hash `e378fb8f…`.
3. Une save ouverte dans Hyne **plus** le même layout lu par l’EXE.
4. Code actuel de `FinalFantasy_VIII_Reimaginated` (ce qui est
   déjà décodé vs `UnprovenLayout`).
5. Wiki `ff8-wiki` et `battle-formulas.md`.
6. `docs/tech/systems/battle_init.md`, prompts G21/G22.
7. Hyne / Doomtrain / Deling / table `.CT` : **indices**, jamais
   gagnants contre l’IDB.

Une vieille page ne bat pas un xref d’aujourd’hui.

## Préambule outillage — une fois

Lis `ai-prompt/todo/_gate-layer-preamble.md` et
`.agents/skills/implementing-iso-layer-boundary/SKILL.md` **avant**
tout edit C++. Cette mission peut rester 100 % lecture + wiki +
IDB. Le C++ n’est autorisé qu’**après** une preuve.

```powershell
rtk --version
qmd status
qmd search "SQ-G21-001" -c ff8-wiki -n 5 --files
qmd search "Battle_CalculateJunctionStats" -c ff8-wiki -n 5 --files
qmd get ff8-wiki/projects/re-ff8/references/battle-formulas.md --no-line-numbers
```

QMD = CLI `qmd`, pas un MCP QMD. Si le reranker GPU casse :
`--no-gpu --no-rerank`.

IDA : une fois, métadonnées IDB + décompile d’une fonction
connue (`Battle_EnqueueInitialPartyActions` ou
`Battle_CalculateJunctionStats`). Si IDA est down : **stop**.
Sans IDB cette mission n’a plus d’autorité.

Context Mode est borné à `re-ff8`. Pour l’implémentation, outils
locaux / Serena. `initial_instructions` Serena avant le premier
edit produit.

## Comment travailler

1. Prends **une** ligne de la file. Décompile, xrefs, structs.
2. Annoter l’IDB tout de suite (nom, type, commentaire). Un
   résultat seulement dans le chat n’est pas livré.
3. Recouper kernel (Doomtrain / `FF8GameData`) ou save (Hyne)
   quand la ligne le demande.
4. Écrire la page wiki (ou mettre à jour
   `p1-g22-battle-init-validation`, `battle-formulas`,
   `g11-g20-static-readiness-ledger`). Tags du taxonomy, résumé
   ≤ 200 caractères. Ingest ensuite avec
   `.agents/skills/ff8-evidence-wiki-ingest` **seulement** s’il y
   a de nouvelles preuves fichiers. Ici, c’est surtout du
   distill IDB → wiki : `wiki-update` / pages existantes.
5. Marque la ligne : prouvé / skip / besoin d’une save opérateur.
6. Passe à la suivante. Ne reste pas bloqué.

Si tu branches le C++ : codecs dans `runtime-x86`, règles dans
`core/`, zéro `#include "ff8iso/abi/"` dans `core`. Tests
offline seulement. `validate_contracts.py` après edit.
`[promotion.G22].satisfied` **reste false**. Pas de live pour
« confirmer ».

## Pages et fichiers à ouvrir en premier

```text
ai-prompt/todo/g22-battle-init-new-chat.md
ai-prompt/todo/g21-battle-data-readers-new-chat.md
docs/tech/systems/battle_init.md
obsidian-docs/projects/re-ff8/references/battle-formulas.md
obsidian-docs/projects/final-fantasy-viii-reimaginated/references/p1-g22-battle-init-validation.md
obsidian-docs/projects/re-ff8/references/g11-g20-static-readiness-ledger.md
C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated\runtime-x86\src\save_party_codec.cpp
C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated\core\src\battle_init.cpp
```

## Rapport de fin (obligatoire)

```text
G23 commencé : non
Live lancé : non
Lignes prouvées : (liste + EA + offset)
Lignes skip nommées : (liste + pourquoi)
Save / kernel utilisés : (chemin + SHA-256)
Pages wiki créées / mises à jour :
Codecs / tests ajoutés : (ou aucun)
Bloqué sur : (fichier manquant, IDA down, hash kernel ≠)
```

Si tout n’est pas fini, ce n’est pas un échec. L’échec, c’est
d’ouvrir G23 ou d’inventer un layout.
