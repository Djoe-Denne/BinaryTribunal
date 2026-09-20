# `0x6804B0` __ `FieldCameraInterpTask_Spawn_6804B0` — decomp réconcilié (lot 10 BdLink, post-mag FX)

| champ | valeur |
|---|---|
| EA | `0x6804B0` |
| Nom IDA | `BdLinkTask_Register_680520` (conservé, pas de rename) |
| Taille | 108 o / 34 instr |
| Mode | 1+P (≤80 instr, CERTAIN mécanique, vérif parent §5.6) |
| Verdict | CERTAIN mécanique / LIKELY domaine caméra |
| Push IDB | append-only `set_func_cmt`, tag `[semantic-triple 2026-09-20]`, save_database rc=True |
| Livrables sources | tools/_tmp_semantic_triple/0x6804b0/ (asm.asm, semantic_*.md, c_reconciled.c, reconcile_notes.md) |

## Analyse (A)

```markdown
# Sémantique BdLinkTask_Register_680520 @ 0x6804B0 (analyse A)

## 1. Rôle
Wrapper "spawn" qui enregistre le tick caméra fixe `sub_680520` sur la liste BdLink globale `dword_25080C0` via `BdLinkTask_Register` (0x508360), puis initialise champ par champ le contexte du nœud renvoyé (octets de contrôle, paramètres 8 octets copiés, 2 pointeurs, template 8×{word 0x80, word 0}).

## 2. Confiance
**CERTAIN** pour le rôle mécanique (mapping args→nœud, callback fixe, liste fixe, valeur de retour — tout est prouvé par opcodes et vérifié côté callback dans l'IDB). Le libellé de domaine « caméra terrain/cinématique » est **LIKELY** (callés du callback : `Field_readCa`, `Camera_ReadVariables_Space`, GTE SQR/LZCS ; non confirmé par wiki pack — `wiki.md` en échec qmd).

## 3. Nom catalogue
`BdLinkTask_Register_680520` : **trop générique** (convention « callback-only » respectée, pas mensonger). Proposition (markdown seul, ne pas renommer) : `FieldCameraSplineTask_Spawn_6804B0`.

## 4. In / Out / Effets (mapping args→Register)
Proto IDA `int __cdecl(int, int, _DWORD*, char, char, char)`. Appel interne : `push offset sub_680520` (0x6804B0, callback = arg idx 1) ; `push offset dword_25080C0` (0x6804B5, list head = arg idx 0) ; `call BdLinkTask_Register` ; `add esp,8` (0x6804C1) — les 6 args du wrapper ne sont **pas** transmis à Register, ils servent uniquement à initialiser le nœud :

| Arg (cdecl, [esp+4+…]) | → nœud | Preuve | Lecture par le callback sub_680520 |
|---|---|---|---|
| a0 (int, pointeur) | node+0x1C | 6804FA/6804FE | déréférencé : `mov eax,[ebp+1Ch]; mov esi,[eax]` (68052A) |
| a1 (int, pointeur) | node+0x18 | 6804F3/6804F7 | déréférencé : `[ebp+18h]` → sub_704130 / `word [edx+6]` (68053D, 68067A) |
| a2 (_DWORD*, 8 octets) | node+0x10 et node+0x14 | 6804E8–6804F0 (`[eax-10h]`, `[eax-0Ch]` après `add eax,20h`) | `word [ebp+16h]` lu (680551) |
| a3 (char) | node+0x0D (mode) | 6804D7/6804DB | `test al,[ebp+0Dh]` deux chemins (68052F/680537) |
| a4 (char) | node+0x0E (shift) | 6804C8/6804CD | `sar eax,cl`, cl=[ebp+0Eh] (68062D/680630) |
| a5 (char) | node+0x0F (shift) | 6804D0/6804D4 | `sar edi,cl`, cl=[ebp+0Fh] (68089B/68089E) |
| — (constant) | node+0x0C = 0 (octet, dl) | 6804E2 | compteur de phase : `inc [ebp+0Ch]`, `cmp al,0Ah; jb` (680875–68087E) |
| — (constant) | node+0x20..0x3F = 8×{word 0x0080, word 0x0000} | boucle 680501–680514 (ecx=8, `mov word ptr [eax],80h`, `mov [eax+2],dx`) | `[ebp+20h]` lu mot (680714) |

Caller (sub_67F340, 6 sites : 0x67F48E, 0x67F4AF, 0x67F4D0, 0x67F586, 0x67F5A5, 0x67F5C4) passe des immédiats par défaut — push 7, push 0xC, push 0 — et des pointeurs statiques (`unk_10B6D28/30/38`, table `unk_10B6D40[esi]`, `[edx+64h]`), nettoyage `add esp,48h` = 3×6 args (0x67F4D6). Out : EAX = 1 **toujours** (`mov eax,1` 0x680516), même si Register renvoie NULL (garde 6804C4 `cmp eax,edx; jz` saute l'init mais le retour reste 1) ; largeur EAX pleine.

## 5. Verdict justifié
CERTAIN. Le wrapper existe en plus de `BdLinkTask_Register`/`au_re_BdLinkTask` parce qu'il fige trois choix : (1) callback unique `sub_680520` — le driver d'interpolation caméra (GTE SQR/LZCS, table `word_10B5B20`, jitter `LcgRand15_Mul125Add14`, écritures caméra) ; (2) liste unique `dword_25080C0` (réinitialisée par `BS_Memset 0x40` dans sub_67F090 @0x67F116) ; (3) une mise en forme du contexte que ni Register ni au_re ne font : octets de contrôle {phase=0, mode, shift, shift}, bloc de 8 octets copié depuis *a2, deux pointeurs, et un template 8×{0x80,0} (0x0080 = 128, plausible valeur fixe initiale type 1/32 en Q7 ou pas de zoom). Les shifts 12 et 7 passés par le caller correspondent aux SAR 0Ch/07 vus dans le callback (680630, 68089E) — cohérence fixed-point. La garde NULL (6804C4) est absente de Register lui-même : c'est une valeur ajoutée du wrapper.

## 6. Preuves
1. 0x6804B0/0x6804B5/0x6804BA : callback `sub_680520` + liste `dword_25080C0` poussés droite→gauche, `call BdLinkTask_Register`, `add esp,8` (0x6804C1) — convention wiki `BdLinkTask_Register(list_head, callback)` confirmée (battle-address-catalog.md : « 0x508360 — BdLinkTask_Register … callback at node+8, pump 0x508420 »).
2. 0x6804C4 `cmp eax,edx; jz 0x680516` : garde node NULL ; 0x680516 `mov eax,1` : retour EAX=1 inconditionnel.
3. 0x6804C8–0x6804DB : a4→node+0x0E, a5→node+0x0F, a3→node+0x0D (octets) ; 0x6804E2 `mov [eax+0Ch],dl` (dl=0).
4. 0x6804E5–0x6804FE : `add eax,20h` puis copies relatives : *a2 (2 dwords)→node+0x10/0x14, a1→node+0x18, a0→node+0x1C.
5. 0x680501–0x680514 : boucle ecx=8, `mov word ptr [eax],80h` / `mov [eax+2],dx` (dx=0), pas de 4 → node+0x20..0x3F.
6. Callback sub_680520 consomme exactement ces champs : [ebp+0Ch] phase (680875–6808D7), [ebp+0Dh] mode (68052F), [ebp+0Eh]/[ebp+0Fh] shifts (68062D, 68089B), [ebp+16h] (680551), [ebp+18h]/[ebp+1Ch] pointeurs déréférencés (68052A, 68067A), [ebp+20h] (680714).
7. Caller unique sub_67F340 (6 sites, immédiats 7/0xC/0, `add esp,48h` @0x67F4D6 = 18 dwords = 3×6 args).
8. `dword_25080C0` : seule autre réf = `BS_Memset(0x40)` @0x67F116 (sub_67F090) — liste dédiée réinitialisée à l'init de scène.

## 7. Questions ouvertes
- Signification exacte du template 8×{word 0x0080, word 0} à node+0x20 (valeurs initiales des 7-8 keyframes interpolées par le callback ? zoom initial 128 ?).
- Typage précis de a0/a1 (pointeurs vers structures caméra/acteur du caller, `[edx+64h]`) — sub_67F340 non inversée.
- a2 (8 octets copiés) : deux dwords ou struct {word,count,u32} ? Seul `word [ebp+16h]` est lu dans la portion analysée du callback.
- Le retour EAX=1 semble décoratif (aucun caller testé) — confirmer sur les 6 sites.

## 8. IDBCOMMENT
Wrapper: registers fixed tick sub_680520 on BdLink list 25080C0 (BdLinkTask_Register 508360, callback at node+8), then inits node ctx: byte +0C=0 (phase counter), +0D=arg3 mode, +0E=arg4 shift (SAR 12), +0F=arg5 shift (SAR 7); dwords +10/+14 copied from *arg2 (8 bytes); +18=arg1 ptr; +1C=arg0 ptr; +20..3F = 8 x {word 0080h, word 0}. Skips init if Register returns NULL but still returns EAX=1. Caller sub_67F340 passes defaults 7/0Ch/0 + static param ptrs.

## 9. Reconstruction C
```c
/* 0x6804B0 — 108 octets, 34 instr, cdecl ; node = retour de BdLinkTask_Register */
int FieldCameraSplineTask_Spawn_6804B0(void *paramA,        /* -> node+1C, deref callback */
                                       void *paramB,        /* -> node+18, deref callback */
                                       void *params8B,      /* _DWORD* : 8 octets copies */
                                       uint8_t mode,        /* a3 -> node+0D */
                                       uint8_t shift12,     /* a4 -> node+0E (SAR 0Ch) */
                                       uint8_t shift7)      /* a5 -> node+0F (SAR 07h) */
{
    void *node = BdLinkTask_Register(&dword_25080C0, sub_680520); /* 6804B0-6804BA */
    if (node == NULL)                                   /* 6804C4 cmp eax,edx ; jz */
        return 1;                                       /* 680516 mov eax,1 */

    *(uint8_t  *)((char*)node + 0x0C) = 0;              /* 6804E2 mov [eax+0Ch],dl (dl=0) */
    *(uint8_t  *)((char*)node + 0x0D) = mode;           /* 6804D7/6804DB */
    *(uint8_t  *)((char*)node + 0x0E) = shift12;        /* 6804C8/6804CD */
    *(uint8_t  *)((char*)node + 0x0F) = shift7;         /* 6804D0/6804D4 */

    *(uint32_t *)((char*)node + 0x10) = ((uint32_t*)params8B)[0]; /* 6804E8-6804EA */
    *(uint32_t *)((char*)node + 0x14) = ((uint32_t*)params8B)[1]; /* 6804ED-6804F0 */
    *(uint32_t *)((char*)node + 0x18) = (uint32_t)paramB;         /* 6804F3/6804F7 */
    *(uint32_t *)((char*)node + 0x1C) = (uint32_t)paramA;         /* 6804FA/6804FE */

    for (int i = 0; i < 8; ++i) {                       /* 680501 mov ecx,8 ; 680513 dec */
        *(uint16_t *)((char*)node + 0x20 + 4*i) = 0x0080; /* 680507 mov word ptr [eax],80h */
        *(uint16_t *)((char*)node + 0x22 + 4*i) = 0x0000; /* 68050C mov [eax+2],dx (dx=0) */
    }
    return 1;                                           /* 680516 ; EAX pleine largeur */
}
```
```

### Checks §5.6 (parent, ASM live 2026-09-20)

- Dump intégral 34 instr vérifié : pushs droite→gauche (callback sub_680520, list dword_25080C0) → `add esp,8` ; garde node NULL (`cmp eax,edx; jz` @0x6804C4) ; retour EAX=1 inconditionnel @0x680516.
- Mapping args→node vérifié opcode par opcode (+0C..+0F octets, +10/+14=*a2, +18=a1, +1C=a0, template 8×{word 80h,0} @0x680501–0x680514).
- Identité caméra du tick confirmée (2 preuves) : callees `Field_readCa 0x45DE00` + `Camera_ReadVariables_Space 0x45DEF0` (+ Gte_SQR/Gte_LZCS/LcgRand15_Mul125Add14).
- CORRECTION nom : « Spline » non prouvé (pas de preuve de courbe) → nom retenu **FieldCameraInterpTask_Spawn_6804B0** (interpolation par mode/shifts SAR 12/7 prouvée).
- Callee/caller cités existent : sub_680520 (961 o) ; caller unique sub_67F340 (6 sites, défauts 7/0Ch/0).
