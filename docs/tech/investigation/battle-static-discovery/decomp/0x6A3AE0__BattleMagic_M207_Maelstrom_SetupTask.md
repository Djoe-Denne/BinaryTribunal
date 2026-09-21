# BattleMagic_M207_Maelstrom_SetupTask @ 0x6A3AE0

- Instr (live): 41 (150 o, 0x6A3AE0-0x6A3B69)
- Palier: 1+P (2 voix c_a + semantic_a, verification parent P)
- Verdict: CERTAIN - setup du sort MAELSTROM (magie 207, corps du thunk 0x6A3AB0) : enfile le TIM de dword_25102C4 (cache FL), copie 0x7740 octets du blob d'entree magic (rep movsd 0x1DD0 dwords unk_11AC624->unk_25102CC @0x6A3AF2-FC), stocke l'arene (dword_25102C8 @0x6A3B01) et l'arg slot (dword_2517A0C @0x6A3B10), resolve l'entree table 0x1D972C0 + 156*id dans dword_25102C0 (@0x6A3B2D-34), initialise le pod contexte unk_2517A48 (BS_Memset + BdLinkTask_Register(sub_6A3B70) @0x6A3B3E-43 + FillDwords +0x0C,0,2), bind la ressource camera unk_11AC278 (@0x6A3B5A) ; retour EAX = &unk_2517A48 (0x6A3B67)
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: sub_6A3AE0\nTYPE ; proposition: BattleMagic_M207_Maelstrom_SetupTask
- Notes parent: checks 5.6 OK (role P) : 41 instr integrales lues au sol, TIM cache 25102C4 (0x6A3AE0), rep movsd 1DD0 (0x6A3AF2-FC), stores 25102C8/2517A0C (0x6A3B01/10), lea ds:1D972C0h[edx*4] + 25102C0 (0x6A3B2D-34), Register sub_6A3B70 (0x6A3B3E-43), camera 11AC278 (0x6A3B5A), add esp,2Ch (0x6A3B64), retour offset 2517A48 (0x6A3B67) ; CERTAIN pose par la voix, gabarit 0x6A0D50 (MAG_212) ferme CERTAIN

## C reconcilie

```c
/* ============================================================================
 * c_a.c — reconstruction voix A pour sub_6A3AE0 (cellule 0x6A3AE0, stub mode 1+P)
 *
 * GROUND TRUTH = live ASM (asm.asm, 41 instr @ 0x6A3AE0, taille 0x8F/143).
 * hexrays.c = vérificateur SEULEMENT ; divergences notées inline.
 * Type IDA : void *__cdecl sub_6A3AE0(unsigned __int8 *a1)
 *
 * Contexte famille mag FX battle : corps appelé par le thunk MAG_207
 * (0x6A3AB0, entrée table 0xC81AAC, magie 207 MAELSTROM).
 * Schéma §0.1 : stub → IO_GetFile_MAGIC → setup EnqueueType1 +
 * BdLinkTask_Register(stepper). Ici : partie setup (pas de stepper inline,
 * le stepper est sub_6A3B70 passé en callback).
 *
 * Cleanup cdecl : un seul `add esp, 2Ch` en épilogue (0x6A3B64) couvre les
 * 11 dword poussés au fil de la fonction :
 *   0x10 (BS_Memset, 4 args) + 8 (BdLinkTask_Register, 2 args)
 *   + 0xC (FillDwords, 3 args) + 4 (BattleCamera_BindResource, 1 arg)
 *   + 4 (BattleTimQueue_EnqueueType1, 1 arg) = 0x2C. Rien entre les calls.
 * ==========================================================================*/

#include <stdint.h>

/* ---- Externes (noms issus de l'ASM live / annotations IDB ; non inventés) - */
/* ex-GetTextureEOF : enqueue TIM head + advance 2 chunks ; NOT an EOF. 1 arg. */
extern void BattleTimQueue_EnqueueType1(uint8_t *tim_head); /* dword_25102C4 = 'unsigned __int8 *' */

/* ex-misnomer Magic_TextureOFF_ToEAX1 : retourne &g_MagicFileArena (EAX only). */
extern void *Magic_GetFileArena(void);

/* BS_Memset(dst, pattern_src, count, flag) — 4 args poussés droite→gauche :
 *   push 1                 (0x6A3B0A, dernier arg)
 *   push 14h               (0x6A3B17)
 *   push offset word_2517A10 (0x6A3B1B)
 *   push offset unk_2517A48  (0x6A3B20)
 * word_2517A10 est un tampon _WORD[10] (20 octets = 0x14) : probable copie
 * de motif de 20 octets, pas un fill byte. Signature exacte non prouvée.
 */
extern void BS_Memset(void *dst, const void *pattern_src, uint32_t count, int flag);

/* Enregistre le stepper sub_6A3B70 sur la liste unk_2517A48 ; retour EAX =
 * handle/objet dont +0x0C est une zone de 2 dwords remise à zéro. */
extern uintptr_t BdLinkTask_Register(void *list_head, void (*stepper)(void));

/* E3a : FillDwords(dst, val, count) via rep stosd. */
extern void FillDwords(void *dst, uint32_t val, uint32_t count);

/* Resource-binding wrapper only ; résout sections VM + animation-collection
 * via 0x509970. Ne démarre ni ne joue aucun clip caméra. */
extern void BattleCamera_BindResource(const void *resource);

/* ---- Globales touchées (ground truth ASM) -------------------------------- */
extern uint8_t *dword_25102C4;      /* 0x25102C4 : arg EnqueueType1 (lu, pas écrit ici) */
extern void    *dword_25102C8;      /* 0x25102C8 : arena Magic_GetFileArena() */
extern uint8_t  unk_25102CC[];      /* 0x25102CC : destination rep movsd, 0x7740 octets */
extern uintptr_t dword_25102C0;     /* 0x25102C0 : 0x1D972C0 + 156*id */
extern uintptr_t dword_2517A0C;     /* 0x2517A0C : copie de a1 */
extern uint16_t  word_2517A10[10];  /* 0x2517A10 : motif 20 octets pour BS_Memset */
extern uint8_t   unk_2517A48[];     /* 0x2517A48 : liste/tâche retournée */
extern const uint8_t unk_11AC624[]; /* 0x11AC624 : source rep movsd */
extern const uint8_t unk_11AC278[]; /* 0x11AC278 : ressource BattleCamera */
extern void sub_6A3B70(void);       /* stepper BdLinkTask (callback) */

/* ---- Corps (ordre des instructions = ordre de l'ASM live) ---------------- */
void *__cdecl sub_6A3AE0(unsigned __int8 *a1)
{
    uintptr_t reg;

    /* 0x6A3AE0: mov eax, dword_25102C4 ; push eax ; call BattleTimQueue_EnqueueType1 */
    BattleTimQueue_EnqueueType1(dword_25102C4);

    /* 0x6A3AED: call Magic_GetFileArena → EAX = &g_MagicFileArena */
    dword_25102C8 = Magic_GetFileArena();

    /* 0x6A3AF2..0x6A3B0C: mov ecx,1DD0h ; rep movsd (esi=unk_11AC624, edi=unk_25102CC)
     * 0x1DD0 dwords = 0x7740 octets (coïncide avec Hex-Rays qmemcpy 0x7740u). */
    {
        uint32_t i;
        for (i = 0; i < 0x1DD0; ++i)
            ((uint32_t *)unk_25102CC)[i] = ((const uint32_t *)unk_11AC624)[i];
    }

    /* 0x6A3B06: mov eax, [esp+0Ch+arg_0] — a1 rechargé APRÈS le rep movsd.
     * 0x6A3B10: dword_2517A0C = a1 ; 0x6A3B15: mov cl, [eax] */
    dword_2517A0C = (uintptr_t)a1;

    /* 0x6A3B22..0x6A3B34 : id = *a1 ; 0x1D972C0 + 156*id
     * (lea edx,[eax+eax*4] ; shl edx,3 ; sub edx,eax → eax*39 ; *4 → *156) */
    dword_25102C0 = 0x1D972C0 + 156u * (uint32_t)a1[0];

    /* 0x6A3B39: call BS_Memset(&unk_2517A48, &word_2517A10, 0x14, 1)
     * push 1 effectué tôt (0x6A3B0A) mais c'est le DERNIER arg (droite→gauche).
     * Hex-Rays écrit 'word_2517A10' sans '&' : push offset = adresse, on garde &. */
    BS_Memset(&unk_2517A48, &word_2517A10, 0x14u, 1);

    /* 0x6A3B48: call BdLinkTask_Register(&unk_2517A48, sub_6A3B70) */
    reg = BdLinkTask_Register(&unk_2517A48, sub_6A3B70);

    /* 0x6A3B4D..0x6A3B55: push 2 ; add eax,0Ch ; push 0 ; push eax ; FillDwords
     * = FillDwords(reg + 0x0C, 0, 2) — zone de 2 dwords à +0x0C du handle. */
    FillDwords((void *)(reg + 0x0C), 0, 2u);

    /* 0x6A3B5A: push offset unk_11AC278 ; call BattleCamera_BindResource */
    BattleCamera_BindResource(&unk_11AC278);

    /* 0x6A3B64: add esp, 2Ch (cleanup cdecl unique, cf. en-tête)
     * 0x6A3B67: mov eax, offset unk_2517A48 → retour EAX 32 bits complet. */
    return &unk_2517A48;
}

/* ============================================================================
 * Divergences vs Hex-Rays (hexrays.c) — l'ASM gagne :
 * 1. BS_Memset 2e arg : Hex-Rays écrit `word_2517A10` (valeur) ; l'ASM fait
 *    `push offset word_2517A10` (0x6A3B1B) → c'est une ADRESSE (&word_2517A10).
 * 2. Ordre : Hex-Rays place `dword_2517A0C = a1` et le calcul de
 *    dword_25102C0 après BS_Memset dans un ordre apparent différent ; l'ASM
 *    fixe l'ordre exact : rep movsd → dword_2517A0C → dword_25102C0 →
 *    BS_Memset (push 1 étant déjà empilé avant la lecture de *a1).
 * 3. dword_25102C0 : Hex-Rays `156 * *a1 + 31027904` (décimal) = identique à
 *    0x1D972C0 + 156*id ; forme hex gardée (cohérente avec les autres packs).
 * Conforme : rep movsd 0x7740 octets, retour &unk_2517A48 (EAX 32 bits),
 * add esp 2Ch unique, arg a1 = unsigned __int8 *.
 * ==========================================================================*/

/* UNCERTAIN 0x6A3AE0 BS_Memset : sémantique exacte des 4 args (copie du motif
 * word_2517A10 sur 0x14 unités ? unités = octets ou mots ?) — signature non
 * prouvée par le seul ASM ; ordre de poussée fiable : (dst, src, 0x14, 1). */
/* UNCERTAIN 0x6A3AE0 BdLinkTask_Register : nature du retour (handle dans une
 * table ? pointeur objet ?) et contenu des 2 dwords à +0x0C remis à 0 par
 * FillDwords — rôle non prouvé ici. */
```

## Analyse semantique

# Sémantique sub_6A3AE0 @ 0x6A3AE0 (analyse A, mode 1+P)

- Rôle (1 phrase) : Setup du sort MAG_207 (MAELSTROM) : installe le contexte de tâche/lecture de fichier magique (copie du blob 0x11AC624, sélection de la table 0x1D972C0 stride 0x9C, enregistrement BdLinkTask + callback, bind ressource caméra) et retourne l'adresse du contexte 0x2517A48.
- Confiance : **CERTAIN**
- Nom catalogue : aucun (sub_ sans nom). Proposition (markdown seul, pas de rename) : `BattleMagic_M207_Maelstrom_SetupTask`

## In / Out / Effets

**In** : 1 arg stack `arg_0` (leti via `[esp+0Ch+arg_0]` @ 0x6A3B06) = pointeur sur entrée/id du magique (lu comme byte : `mov cl,[eax]` @ 0x6A3B15) ; il est aussi stocké dans `dword_2517A0C` (@ 0x6A3B10).

**Out** : EAX = `offset unk_2517A48` (@ 0x6A3B67) — retour 32 bits pleine largeur, pointeur sur le contexte/liste_head fraîchement zéralé (pod, cohérent avec le prototype IDA `void *__cdecl(unsigned __int8 *)`).

**Effets globaux** :
- `BattleTimQueue_EnqueueType1(dword_25102C4)` @ 0x6A3AE8 — enfile l'entête TIM et avance 2 chunks (source du pointeur TIM courant `dword_25102C4`).
- `dword_25102C8 = Magic_GetFileArena()` @ 0x6A3B01 — arena fichier magique mémorisée.
- `rep movsd` ecx=0x1DD0 @ 0x6A3B0C : copie 0x1DD0 dwords (29 840 octets) de `unk_11AC624` → `unk_25102CC` (blob statique d'entrée magique vers le buffer de travail).
- Indexation table `0x1D972C0` : `edx = idx*39 ; eax = 0x1D972C0 + edx*4` (lea @ 0x6A3B25, shl @ 0x6A3B28, sub @ 0x6A3B2B) = stride **0x9C** par entrée `cl=[arg]` (@ 0x6A3B15/17) ; résultat stocké dans `dword_25102C0` (@ 0x6A3B34).
- `BS_Memset(unk_2517A48, 0x14, 1)` @ 0x6A3B39 — init du pod contexte (largeur 0x14 = 20).
- `BdLinkTask_Register(&unk_2517A48, sub_6A3B70)` @ 0x6A3B48 — enregistre le callback `sub_6A3B70` (fonction adjacente, corps principal du sort) sur la liste head.
- `FillDwords(ret_BdLinkTask_Register + 0xC, 0, 2)` @ 0x6A3B54 — zéro 2 dwords à `+0xC` du nœud retourné.
- `BattleCamera_BindResource(&unk_11AC278)` @ 0x6A3B5F — bind ressource caméra battle (wrapper pur, ne démarre aucun clip).
- Pile nettoyée `add esp,2Ch` (6 pushes = 0x18 + ret addr + arg → cadre standard).

## Preuves (ASM cité)

1. Caller unique dir. `call sub_6A3AE0` @ 0x6A3AB5 depuis `MAG_207_MAELSTROM` (0x6A3AB0, 14 octets, thunk) — callers.txt.
2. Stride 0x9C adressé : `lea edx,[eax+eax*4]` (×5) @ 0x6A3B25, `shl edx,3` (×40) @ 0x6A3B28, `sub edx,eax` (×39) @ 0x6A3B2B, `lea eax, ds:1D972C0[edx*4]` @ 0x6A3B2D → ×0x9C, identique au gabarit CERTAIN MAG_212 @ 0x6A0D50.
3. Séquence callees strictement identique au gabarit CERTAIN 0x6A0D50 : `EnqueueType1` (0x6A3AE8) → `Magic_GetFileArena` (0x6A3AED) → preload table 0x9C → `BS_Memset` (0x6A3B39) → `BdLinkTask_Register` (0x6A3B48) → `retn &ctx` (0x6A3B67 : `mov eax, offset unk_2517A48`).
4. Constante magique 207 : thunk data xref 0xC81AAC + offset table 0x1D972C0 (déjà ancré sur le gabarit MAG_212, adresse de base table partagée).
5. Largeur retour : EAX chargé avec `offset unk_2517A48` @ 0x6A3B67 immédiatement avant `retn` @ 0x6A3B6E → retour 32 bits pleine largeur, pas de demi-mot.
6. Toutes les callees de l'ASM (EnqueueType1, Magic_GetFileArena, BS_Memset, BdLinkTask_Register, FillDwords, BattleCamera_BindResource) figurent dans `callees.txt` — aucune invention.
7. Callback propre : `push offset sub_6A3B70` @ 0x6A3B3E — la fonction callback suit immédiatement le setup (0x6A3B70), pattern canonique enqueue/register de tâche battle.
8. FillDwords RTVA : `push 2` / `push 0` / `push eax` (eax = ret+0xC, via `add eax,0Ch` @ 0x6A3B4F) @ 0x6A3B4D–55 — zéroage de 2 dwords à ctx+0xC, pas un appel libraire inventé.

## Checks

- ✅ 6 callees cités tous présents dans callees.txt.
- ✅ Strides en nombres : 0x9C (=39×4) développé instruction par instruction ; 0x1DD0 dwords ; +0xC ; 0x14/octets memset.
- ✅ Retour pleine largeur EAX (= &0x2517A48) vérifié sur opcodes 0x6A3B67/0x6A3B6E.
- ✅ Aucune lecture de hexrays.c / c_*.c / decomp*.md / semantic_*.md / champ CMT.
- ⚠️ wiki.md vide (échec qmd) — la convergence wiki repose sur le gabarit 0x6A0D50 déjà fermé CERTAIN (même architecture), compensé par 8 preuves ASM adressées.

## Questions ouvertes

- Sémantique exacte du `rep movsd` (0x1DD0 dwords de 0x11AC624 → 0x25102CC) : blob statique par-magique ou pool partagé ? À trancher dans une analyse du blob/du callback sub_6A3B70.
- Ordre exact des args de BS_Memset (1 / 0x14 / &pod) à confirmer sur le proto de BS_Memset hors pack.
