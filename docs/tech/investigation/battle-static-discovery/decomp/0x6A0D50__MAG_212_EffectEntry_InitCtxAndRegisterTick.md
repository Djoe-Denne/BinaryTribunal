# MAG_212_EffectEntry_InitCtxAndRegisterTick @ 0x6A0D50

- Instr (live): 31 (112 o, 0x6A0D50-0x6A0DBF)
- Palier: 1+P (2 voix c_a + semantic_a, verification parent P)
- Verdict: CERTAIN - entree d'effet de la magie 212 (corps du thunk 0x6A0D20, slot MagicList_Logic[211] @0xC81AC0) : enfile le TIM de dword_25101F8 (BattleTimQueue_EnqueueType1), latche l'arene magie (dword_2510278) + l'argument (dword_25101FC), resolve l'entree table 0x1D972C0 + 156*id dans dword_2510200, init 16 octets du contexte unk_2510238, enregistre le stepper sub_6A0DC0 via BdLinkTask_Register, FillDwords(task+0xC,0,1) ; retour EAX = &unk_2510238
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: sub_6A0D50\nTYPE ; proposition: MAG_212_EffectEntry_InitCtxAndRegisterTick
- Notes parent: checks 5.6 OK (role P) : 31 instr, dword_25101F8 lu (0x6A0D50), stores 2510278/25101FC (0x6A0D60/6B), lea ds:1D972C0h[edx*4] (0x6A0D8A) + 2510200 (0x6A0D91), push sub_6A0DC0 + unk_2510238 (0x6A0D9B-A0), add esp,28h (0x6A0DB7), retour offset unk_2510238 (0x6A0DBA) ; convergence c_a/sem_a (CERTAIN pose par la voix) ; coherence avec MAG_212_Timeline_Tick 0x6A1660 fermee (ticker enregistre par sub_6A0DC0 sur dword_2510228)

## C reconcilie

```c
/* ============================================================================
 * c_a.c — reconstruction C de sub_6A0D50 (cellule 0x6A0D50, stub mag FX battle)
 * ----------------------------------------------------------------------------
 * Ground truth = live ASM (asm.asm @ 0x6A0D50, 31 instr), pas Hex-Rays.
 * hexrays.c utilisé comme vérificateur seulement ; aucune divergence de fond
 * relevée ici (mêmes globals, mêmes args, même ordre d'appels).
 *
 * EA      : 0x6A0D50  (taille 0x70 = 112 octets)
 * Type IDA: void *__cdecl sub_6A0D50(unsigned __int8 *a1)
 * Retour  : eax 32 bits complet = &unk_2510238 (list_head de la task liée).
 * Sauvegardes de registres : AUCUNE (pas de push ebp/esi/edi/ebx).
 * Pile    : un seul `add esp, 0x28` final (0x6A0DB7) purge les 10 pushes
 *           cdecl cumulés (5 avant BS_Memset, 2 avant BdLinkTask_Register,
 *           3 avant FillDwords) => tous les callees sont caller-clean.
 *
 * Contexte (pack) : corps appelé par le thunk 0x6A0D20 (entrée table 0xC81AC0,
 * magie 212). Schéma §0.1 : stub -> IO_GetFile_MAGIC -> setup EnqueueType1 +
 * BdLinkTask_Register(stepper). Ici : setup de la task liée + registration du
 * stepper sub_6A0DC0. Caller unique : MAG_212_UNK8 @ 0x6A0D25 (call 0x6A0D50).
 * ========================================================================== */

/* ---- externes nommés (rôle prouvé par ASM/labels live) ------------------- */

/* 0x6A0D56 : arg poussé = dword_25101F8 (ptr TIM data, rempli en amont par le
 * stub 0x6A0D20). 1 arg cdecl, purge par le add esp,0x28 final. */
extern void BattleTimQueue_EnqueueType1(unsigned __int8 *tim_ptr);

/* 0x6A0D5B : retourne &g_MagicFileArena dans eax (ex-misnomer
 * Magic_TextureOFF_ToEAX1). 0 arg. */
extern void *Magic_GetFileArena(void);

/* 0x6A0D96 : args droite->gauche = (unk_2510238, word_2510248, 0x10, 1).
 * Fill word-style (valeur lue à word_2510248) — voir UNCERTAIN plus bas. */
extern void BS_Memset(void *dst, unsigned __int16 fill_word, int count, int flag);

/* 0x6A0DA5 : enregistre le stepper sub_6A0DC0 sur la list_head ;
 * retour eax = handle/pointeur de task, dont +0xC est zero-é initialement. */
extern void *BdLinkTask_Register(void *list_head, void (*stepper)(void));

/* 0x6A0DB2 : FillDwords(dst, val, count) via rep stosd (E3a). */
extern void FillDwords(void *dst, int value, unsigned int count);

extern void sub_6A0DC0(void); /* stepper BdLinkTask (corps voisin, autre cellule) */

/* ---- globales touchées (globals.txt) ------------------------------------- */

extern unsigned __int8 *dword_25101F8; /* 0x25101F8 : ptr data TIM (input du EnqueueType1) */
extern void           *dword_25101FC;  /* 0x25101FC : mémorise a1 (ptr argument brut) */
extern int            *dword_2510200;  /* 0x2510200 : ptr entrée table mag, stride 0x9C */
extern void           *dword_2510278;  /* 0x2510278 : = &g_MagicFileArena */
extern unsigned __int8 unk_2510238[16];/* 0x2510238 : list_head task (16 octets) */
extern unsigned __int16 word_2510248[8]; /* 0x2510248 : mot de fill (suite du bloc 16B) */

/* Table statique mag : base 0x01D972C0, entrées de 156 (0x9C) octets,
 * indexées par le premier octet pointé par a1 (chargement `mov cl,[eax]`
 * après `xor ecx,ecx` => index 8-bit zero-extend, 0..255). */
#define MAGIC_TABLE_BASE 0x01D972C0u
#define MAGIC_TABLE_STRIDE 156 /* 0x9C = 39 * 4 (lea/shl/sub pattern dans l'ASM) */

/* ============================================================================
 * C réconcilié
 * ========================================================================== */
void *__cdecl sub_6A0D50(unsigned __int8 *a1)
{
    unsigned int index;
    void *task;

    /* 0x6A0D50-56 : enqueue du bloc TIM pointé par la globale (déjà remplie
     * par le stub 0x6A0D20 via IO_GetFile_MAGIC). */
    BattleTimQueue_EnqueueType1(dword_25101F8);

    /* 0x6A0D5B-60 : cache l'arène fichier magie. */
    dword_2510278 = Magic_GetFileArena();

    /* 0x6A0D65-6B : mémorise le pointeur d'entrée (byte*). */
    dword_25101FC = a1;

    /* 0x6A0D70 : cl = *a1 (byte, zero-extend via ecx pré-zeroé).
     * 0x6A0D82-91 : eax = MAGIC_TABLE_BASE + 156 * index
     *   edx = (5*x) << 3 - x = 39*x ; puis [edx*4 + 0x1D972C0] => *4 => 156*x. */
    index = (unsigned int)a1[0];
    dword_2510200 = (int *)(MAGIC_TABLE_BASE + index * MAGIC_TABLE_STRIDE);

    /* 0x6A0D72-96 : BS_Memset(&unk_2510238, word_2510248, 0x10, 1)
     * Ordre de push : 1, 0x10, &word_2510248, &unk_2510238 => args droite->gauche.
     * word_2510248 est le mot immédiatement après les 16 octets de list_head. */
    BS_Memset(unk_2510238, word_2510248[0], 0x10, 1); /* UNCERTAIN 0x6A0D96 unité de count (0x10 mots? 0x10 dwords?) et sémantique du flag=1 ; l'ASM ne montre que 4 args poussés */

    /* 0x6A0D9B-A5 : enregistre le stepper sub_6A0DC0 sur la list_head. */
    task = BdLinkTask_Register(unk_2510238, sub_6A0DC0);

    /* 0x6A0DAA-B2 : FillDwords(task + 0xC, 0, 1) — zero-initialise le dword
     * à offset +0xC de la task retournée (compteur/état du stepper probable).
     * Push ordre : 1, (après add eax,0Ch) 0, eax => args (eax, 0, 1). */
    FillDwords((char *)task + 0xC, 0, 1);

    /* 0x6A0DB7 : purge cdecl cumulée (10 pushes = 0x28 octets).
     * 0x6A0DBA-BF : retour = &unk_2510238 (eax 32 bits complet). */
    return unk_2510238;
}
```

## Analyse semantique

# Sémantique sub_6A0D50 @ 0x6A0D50 (analyse A, mode 1+P)

- Rôle (1 phrase) : Entrée d'effet de la magie 212 (slot `MagicList_Logic[211]` @ `0xC81AC0`, corps du thunk `0x6A0D20`/`MAG_212_UNK8`) qui met en file le TIM du fichier chargé, latche l'arène de fichiers magie et l'enregistrement par-id, initialise le bloc contexte 0x2510238 depuis un template 16 octets, enregistre le tick `sub_6A0DC0` sur la liste BdLinkTask et retourne le contexte.

- Confiance : **CERTAIN**
- Nom catalogue : `sub_6A0D50` = non significatif (pas de nom catalogue mensonger ici). Proposition (markdown seul, PAS de rename) : **`MAG_212_EffectEntry_InitCtxAndRegisterTick`** — justifié par ≥2 preuves ASM adressées : (1) unique caller `MAG_212_UNK8` @ `0x6a0d25` qui retournait vers l'entrée table `0xC81AC0` = `MagicList_Logic 0xC81774 + 211*4` (effet 1-based 212) ; (2) le corps implémente exactement le contrat d'entrée wiki : bind fichier/TIM (`0x6a0d56`), init contexte (`0x6a0d96`), `BdLinkTask_Register` du tick (`0x6a0da5`), `return ctx` (`0x6a0dba`–`0x6a0dbf`).

## In / Out / Effets

- Prototype meta.json : `void *__cdecl(unsigned __int8 *)` — 1 arg pile, cdecl.
  - arg_0 (u8*) : pointeur sur données de cast ; l'octet `[arg_0]` = id de l'effet, lu à `0x6a0d70` (`mov cl, [eax]`). L'adresse arg_0 elle-même est latchée dans `dword_25101FC` (`0x6a0d6b`).
- Out :
  - EAX = `0x2510238` (`unk_2510238`) à `0x6a0dba` — retour pleine largeur 32 bits (pointeur contexte), conforme au contrat wiki « entry callback … return the context ».
  - `dword_25101F8` : consommé (lu `0x6a0d50`) comme pointeur fichier (type `unsigned __int8 *`), passé à `BattleTimQueue_EnqueueType1` (enqueue tête TIM + avance de 2 chunks).
  - `dword_2510278` ← `&g_MagicFileArena` (`0x6a0d5b`–`0x6a0d60`, via `Magic_GetFileArena`).
  - `dword_2510200` ← `0x1D972C0 + id*156` (stride 0x9C = 156 : `lea edx,[eax+eax*4]` = 5·id ; `shl edx,3` = 40·id ; `sub edx,eax` = 39·id ; `lea eax, ds:1D972C0h[edx*4]` = 156·id, `0x6a0d82`–`0x6a0d91`).
  - `unk_2510238` : 16 octets initialisés par `BS_Memset(unk_2510238, word_2510248, 0x10, 1)` (`0x6a0d72`–`0x6a0d96` ; pushes droite→gauche = args (`dst=0x2510238`, `template=0x2510248`, `count=0x10`, `val=1`) — même forme que l'exemplaire wiki GF `BS_Memset(ctx, &template, 16, 1)`).
  - `BdLinkTask_Register(unk_2510238, sub_6A0DC0)` (`0x6a0d9b`–`0x6a0da5`) : enregistre le tick par-frame `sub_6A0DC0` (callback à node+8, pump `0x508420` selon battle-address-catalog) sur la liste tête `0x2510238`.
  - `FillDwords(eax+0xC, 0, 1)` (`0x6a0daa`–`0x6a0db2`) : zéro 1 dword à node+0xC du nœud retourné par Register.
- Effets de pile : `add esp, 0x28` final (`0x6a0db7`) = 4+16+8+12 = 40 octets = total exact des pushes des 4 appels (1+4+2+3 args) → tous les callees sont cdecl, cohérent.
- Pas d'écriture IDB, pas de rename effectué.

## Preuves (ASM cité, adresses exactes)

1. **Caller unique** (`callers.txt`) : `0x6a0d25` dans `MAG_212_UNK8` (taille 0xE) — thunk d'entrée table `0xC81AC0` ; arithmétique : `MagicList_Logic` base `0xC81774` (battle-address-catalog) + 0x34C = `0xC81AC0` ⇒ slot 211 ⇒ effet 1-based **212**. Aligné avec le contexte orchestrateur (magie 212).
2. **Contrat d'entrée wiki** (`gf-asset-loading-and-authoring`) : « The entry callback (called once at state 3) must: 1. Bind the loaded files … 2. Initialise the context … 3. Register the per-frame tick with `BdLinkTask` (`0x508360`) and return the context. » — les trois étapes sont présentes et adressées : `0x6a0d56` (bind TIM), `0x6a0d60`/`0x6a0d96` (état/arène), `0x6a0da5`+`0x6a0dba` (register + return ctx).
3. **`0x6a0d56` `call BattleTimQueue_EnqueueType1`** avec `dword_25101F8` (déclaré `unsigned __int8 *` dans globals.txt) poussé en `0x6a0d55` : enfile la tête TIM du fichier magie chargé (annotation callee : « enqueue TIM head + advance 2 chunks; NOT an EOF ») — pas un test EOF.
4. **`0x6a0d5b` `call Magic_GetFileArena`** → `0x6a0d60 mov dword_2510278, eax` : latche `&g_MagicFileArena` (`0x20DFAB8`, arène 1 MiB partagée, battle-address-catalog) dans l'état du bloc 0x25101F8–0x2510278.
5. **Stride 0x9C adressé** : `0x6a0d82 lea edx,[eax+eax*4]` / `0x6a0d85 shl edx,3` / `0x6a0d88 sub edx,eax` / `0x6a0d8a lea eax, ds:1D972C0h[edx*4]` ⇒ `0x1D972C0 + id*156` stocké dans `dword_2510200` (`0x6a0d91`) : enregistrement par-id de l'effet (156 octets), stocké en global pour le tick.
6. **`0x6a0d96 call BS_Memset`** avec 4 args poussés `1`/`10h`/`offset word_2510248`/`offset unk_2510238` (`0x6a0d72`–`0x6a0d7d`) ⇒ `BS_Memset(0x2510238, 0x2510248, 0x10, 1)` : init 16 octets du contexte depuis template — forme identique à l'exemplaire wiki GF/Meteor `BS_Memset(ctx, &template, 16, 1)`.
7. **`0x6a0da5 call BdLinkTask_Register`** (`0x508360`, catalog : « registers per-frame GF/effect tick; callback at node+8 ») puis **`0x6a0dac add eax, 0xC`** / **`0x6a0db2 call FillDwords`** (args `(eax+0xC, 0, 1)`) : le nœud retourné a son dword +0xC mis à zéro.
8. **`0x6a0dba mov eax, offset unk_2510238` / `0x6a0dbf retn`** : retour 32 bits pleine largeur (EAX) du pointeur contexte — largeur retour conforme au proto `void *`.

## Checks demandés

- Callees cités présents dans `callees.txt` : `BattleTimQueue_EnqueueType1` (6a0d56), `Magic_GetFileArena` (6a0d5b), `BS_Memset` (6a0d96), `BdLinkTask_Register` (6a0da5), `FillDwords` (6a0db2) — **5/5 présents**. Aucune library call inventée.
- Strides en nombres : **156 (0x9C)** par enregistrement d'effet à `0x1D972C0` ; **16 (0x10)** octets d'init contexte ; décalage nœud **0xC** ; nettoyage pile **0x28 = 40** octets vérifié.
- Largeur retour : **EAX 32 bits** (pointeur `0x2510238`), pas AL-only.
- Divergences Hex-Rays : non évaluées (hexrays.c interdit en mode aveugle).

## Questions ouvertes

1. Contenu de `sub_6A0DC0` (le tick enregistré) : hors pack ; le contexte orchestrateur indique que `MAG_212_Timeline_Tick 0x6A1660` (fermée CERTAIN) est enregistrée par ce setup sur `dword_2510228` — non vérifiable depuis ce pack (le call direct visible ici est `sub_6A0DC0` via `BdLinkTask_Register`) ; la relation node `0x2510228` ↔ tête `0x2510238` reste à trancher dans l'analyse du tick.
2. Sémantique exacte du 4e arg de `BS_Memset` (`val=1` vs count) : la forme wiki identique suggère `(dst, template, 16, 1)` mais le prototype interne de `BS_Memset` n'est pas dans le pack.
3. Rôle des 156 octets à `0x1D972C0[id]` (dword_2510200) : table d'enregistrements par-effet (timeline/données d'anim ?) — à confirmer côté tick.

## IDBCOMMENT

Entree d'effet de la magie 212 (slot MagicList_Logic[211] en 0xC81AC0, corps du thunk 0x6A0D20/MAG_212_UNK8) : enfile le TIM du fichier charge dword_25101F8, latche g_MagicFileArena dans dword_2510278 et l'enregistrement 0x1D972C0[id*156] dans dword_2510200 ou id=[arg0]. Init 16 octets du contexte 0x2510238 depuis le template 0x2510248, enregistre le tick sub_6A0DC0 via BdLinkTask_Register (zero node+0xC) et retourne EAX=0x2510238. [semantic-triple 2026-09-20]
