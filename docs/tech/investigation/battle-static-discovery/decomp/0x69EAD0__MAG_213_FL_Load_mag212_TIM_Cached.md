# MAG_213_FL_Load_mag212_TIM_Cached @ 0x69EAD0

- Instr (live): 5 (19 o, 0x69EAD0-0x69EAE2)
- Palier: 1+P (2 voix c_a + semantic_a, verification parent P)
- Verdict: CERTAIN - stub loader FL de l'effet 213 : push litteral mag212.tim (offset id-1), IO_GetFile_MAGIC charge dans l'arene magie, cache pointeur dans dword_2510174 (0x69EADD) et le retourne en EAX ; entree table MagicList_TextureLoad (xref data 0xC81DB8), caller BattleGF_LoadCallbackByMagicID (0x50AF93)
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: MAG_213_STORM_BREATH_FL\nTYPE ; proposition: MAG_213_FL_Load_mag212_TIM_Cached
- Notes parent: checks 5.6 OK (role P) : asm 5 instr integral lu au sol (0x69EAD0-EAE2), cleanup add esp,4 (0x69EADA), stockage plein dword, retour EAX, convergence c_a/sem_a + qmd ff8-wiki lecture seule (regle slot 0-based = id-1)

## C reconcilie

```c
// Cellule 0x69EAD0 — MAG_213_STORM_BREATH_FL (stub MAG_213_FL, mode 1+P)
// Ground truth = live ASM (asm.asm @ 0x69EAD0, 5 instr, 19 octets) — Hex-Rays utilisé en vérification seulement.
//
// ASM live :
//   69ead0  push    offset aMag212Tim      ; "mag212.tim"
//   69ead5  call    IO_GetFile_MAGIC
//   69eada  add     esp, 4                 ; cdecl : 1 arg poussé, nettoyage callee-side chez l'appelant
//   69eadd  mov     dword_2510174, eax     ; stockage du handle/pointeur retourné
//   69eae2  retn
//
// Callers : BattleGF_LoadCallbackByMagicID (0x50AF93, code) + data xref à 0xC81DB8 (table).
// Global touchée : dword_2510174 (0x2510174, type IDA 'unsigned __int8 *').

// Type de retour : Hex-Rays propose 'unsigned __int8 *'. L'ASM ne prouve que EAX est
// recopié tel quel après l'appel — la largeur réelle dépend du prototype de IO_GetFile_MAGIC.
// UNCERTAIN 0x69eadd largeur exacte de la valeur de retour (EAX 32 bits supposé ; type pointeur non prouvé depuis l'ASM seul)
unsigned int *MAG_213_STORM_BREATH_FL(void)
{
    unsigned int *result;

    // cdecl : argument unique "mag212.tim" poussé droite→gauche, pile nettoyée par add esp, 4
    result = (unsigned int *)IO_GetFile_MAGIC("mag212.tim"); // ancre : nom de fichier MAG 212/213 (IDA aMag212Tim)
    dword_2510174 = (unsigned int)result;                    // ancre : global 0x2510174 = handle fichier .tim magique
    return result;
}
```

## Analyse semantique

# Sémantique MAG_213_STORM_BREATH_FL @ 0x69EAD0 (analyse A, mode 1+P aveugle)

- Rôle (1 phrase) : stub FL (file loader) de l'effet de magie 213 — charge `mag212.tim` depuis le dossier Magic via `IO_GetFile_MAGIC`, met le pointeur d'arène retourné en cache dans `dword_2510174` et le retourne tel quel dans EAX.
- Confiance : **CERTAIN** (rôle mécanique ; 5 instructions / 19 octets intégralement visibles, callers + callee + wiki alignés, opcodes cités). Réserve purement nominale documentée ci-dessous (label « Storm Breath » non corroboré).
- Nom catalogue : **trop large / partiellement non prouvé**. La partie `MAG_213` est cohérente (règle wiki : fichier = slot 0-based = effect_id − 1 ; Alexander id 204 → `mag203_b.*`, donc effet 213 → `mag212.tim` ✓). Le label sémantique `STORM_BREATH` n'est corroboré ni par le pack ni par le wiki (les tables kernel authentifiées ne couvrent que magic_id < 57 ; le nommage des effets ≥ 200 n'y figure pas). Proposition (markdown seul, PAS de rename) : `MAG_213_FL_Load_mag212_TIM_Cached` — conserve l'indication d'effet/slot prouvée, remplace le label non prouvé par le mécanisme adressé.
- In / Out / Effets :
  - **In** : aucun argument entrant (prototype `int(void)` d'après meta `TYPE 'int()'`). Le littéral `"mag212.tim"` est une constante du stub.
  - **Out** : EAX 32 bits = pointeur d'arène retourné par `IO_GetFile_MAGIC` (le `mov` vers le global ne clobber pas EAX) ; global `dword_2510174` (0x2510174, typé `'unsigned __int8 *'` dans globals.txt) = même pointeur.
  - **Effets de bord** : chargement de `\FF8\Data\Magic\mag212.tim` dans l'arène magie partagée 1 Mo (côté callee, via archive VFS puis fallback `fopen`) ; pas d'autre écriture dans le stub. L'appelant résolveur (`Magic_GetIDLoad`) fait `Magic_ClearMemoryForTex()` avant, donc l'arène est réinitialisée par effet.
- Preuves (ASM cité, adresses exactes) :
  1. `0x69EAD0 push offset aMag212Tim` — le littéral `"mag212.tim"` est poussé comme unique argument cdecl (droite→gauche : 1 seul arg).
  2. `0x69EAD5 call IO_GetFile_MAGIC` — callee unique ; wiki (`gf-asset-loading-and-authoring.md`) : `IO_GetFile_MAGIC(name)` (0x571B80) construit le chemin Magic, charge dans l'arène et **retourne le pointeur d'arène** ; census « 265 single-`IO_GetFile_MAGIC` » — cette cellule en est un exemplaire canonique.
  3. `0x69EADA add esp, 4` — cleanup cdecl d'un seul argument, réalisé dans le stub : confirme 1 argument et la convention d'appel.
  4. `0x69EADD mov dword_2510174, eax` — cache du pointeur fichier dans un global dédié ; motif identique aux loaders documentés (Alexander `dword_2796DA4/DA0`, Cerberus `dword_2796DDC/DD8`).
  5. `0x69EAE2 retn` — retour avec EAX intact = même pointeur que le global ; largeur 32 bits cohérente avec `TYPE 'int()'`.
  6. callers.txt : xref code `0x50AF93` depuis `BattleGF_LoadCallbackByMagicID` (= `Magic_GetIDLoad` 0x50AF20 ; pseudocode wiki : `if (MagicList_TextureLoad[idx]) MagicList_TextureLoad[idx]();`) **et** xref data `0xC81DB8` = base documentée de la table `MagicList_TextureLoad[effect_id-1]` → la cellule est bien une entrée `_FL` de cette table, invoquée indirectement par le résolveur.
  7. Wiki naming rule : `mag<slot>.tim` avec slot **0-based** = effect_id − 1 (Alexander id 204 → `mag203_b.*`) → « effet 213 » ↔ `mag212.tim` : le couple nom/fichier est cohérent, pas une divergence.
- Checks :
  - Callees cités présents dans callees.txt : ✓ `IO_GetFile_MAGIC` listé à la ligne `69ead5 call IO_GetFile_MAGIC` (section CALL/ADD-ESP LINES ; la section CALLS est vide car le callee n'a pas de proto résolu — la ligne d'appel fait foi).
  - Strides en nombres : aucun accès mémoire indexé dans la cellule (pas de stride applicable) ; stockage plein dword dans `0x2510174`. (Contexte externe : `MagicList_TextureLoad`, stride 4 = 1 dword/entrée, non accédé par cette cellule.)
  - Polarité : aucun test de flag ni branchement conditionnel ; `retn` inconditionnel — rien à inverser (piège du bit `0x40` non applicable ici).
  - Largeur retour : EAX 32 bits, `int()` ; pas de retour AL-only type `Battle_GetRandomInt` ici (EAX complet propagé).
- Questions ouvertes :
  - Le label anglais « Storm Breath » pour l'effet 213 : non corroboré par kernel.bin (magic_id < 57 seulement) ni par le wiki ; si un jour la table d'effets 200+ est authentifiée, réévaluer le libellé (sans changer le mécanisme, qui est certain).
  - Le prototype exact de `IO_GetFile_MAGIC` (convention/retour en cas d'échec fichier absent) n'est pas dans le pack ; le stub ne teste pas l'échec et propage EAX brut — comportement identique aux 264 autres loaders single-file du census.
  - `wiki.md` du pack était vide (échec qmd à la constitution) ; compensation par lecture qmd de la collection `ff8-wiki` (pages `gf-asset-loading-and-authoring.md`, `battle-address-catalog.md`, `kernel-bin-authenticated-tables.md`, `draw-magic-and-render-bridge.md`).

IDBCOMMENT: Stub loader FL de l'effet de magie 213 : pousse le litteral mag212.tim et appelle IO_GetFile_MAGIC qui charge le fichier dans l'arene magie partagee et retourne son pointeur. Le pointeur est mis en cache dans dword_2510174 (0x2510174) puis retourne tel quel dans EAX. Entree de la table MagicList_TextureLoad (0xC81DB8), invoquee indirectement par Magic_GetIDLoad (0x50AF20). [semantic-triple 2026-09-20]
