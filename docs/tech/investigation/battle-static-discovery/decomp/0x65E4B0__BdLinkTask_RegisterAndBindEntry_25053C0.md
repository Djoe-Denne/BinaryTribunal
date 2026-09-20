# `0x65E4B0` __ `BdLinkTask_RegisterAndBindEntry_25053C0` — decomp réconcilié (lot 10 BdLink, post-mag FX)

| champ | valeur |
|---|---|
| EA | `0x65E4B0` |
| Nom IDA | `BdLinkTask_Register_65F2B0_25053C0` (conservé, pas de rename) |
| Taille | 84 o / 22 instr |
| Mode | 1+P (≤80 instr, CERTAIN, vérif parent §5.6) |
| Verdict | CERTAIN |
| Push IDB | append-only `set_func_cmt`, tag `[semantic-triple 2026-09-20]`, save_database rc=True |
| Livrables sources | tools/_tmp_semantic_triple/0x65e4b0/ (asm.asm, semantic_*.md, c_reconciled.c, reconcile_notes.md) |

## Analyse (A)

```markdown
# Sémantique BdLinkTask_Register_65F2B0_25053C0 @ 0x65E4B0 (analyse A, mode AVEUGLE)

## 1. Rôle
Wrapper mono-callee jumeau de 0x65F250 : enregistre le callback fixe `sub_65F2B0` sur la liste `dword_25053C0` via `BdLinkTask_Register` (0x508360), puis peuple le nœud retourné avec un pointeur d'entrée calculé `*(*(dword_25053AC+0x64)) + arg0*0x30 + 0x10` et trois champs 16 bits issus des arguments.

## 2. Confiance
**CERTAIN** (mécanique entièrement couverte par opcodes cités ; callers + callees alignés ; wiki.md absent — échec qmd, donc aucune divergence possible mais pas de triangulation wiki).

## 3. Nom catalogue
IDA : `BdLinkTask_Register_65F2B0_25053C0` — **trop large / trompeur** : ce n'est pas `BdLinkTask_Register` lui-même mais un wrapper qui l'appelle puis *patche* le nœud (bind d'entrée + payload 16 bits). Le suffixe `_25053C0` désigne la bonne liste mais masque la phase de binding post-enregistrement.
Proposition (markdown seul) : `BdLinkTask_RegisterAndBindEntry_25053C0`

## 4. In / Out / Effets
- **In** (cdecl, 4 args) : `arg_0` = index 32 bits dans une table d'entrées stride 0x30 ; `arg_4`, `arg_8`, `arg_C` = trois `short` copiés respectivement vers `node+0x10`, `node+0x18`, `node+0x14`.
- **Out** : `eax` = pointeur du nœud alloué/enregistré par `BdLinkTask_Register` (int 32 bits, non altéré après `65e4ba` — le `xor ecx,ecx` final ne touche pas eax).
- **Effets** :
  - push droit→gauche : `push offset sub_65F2B0` (arg2 = callback) puis `push offset dword_25053C0` (arg1 = list_head) → `call BdLinkTask_Register` @0x65e4ba ; callee __cdecl, cleanup `add esp,8` @0x65e4c5. Callback stocké à `node+8` (contexte imposé).
  - `node+0x0C` (dword) = `(*(*(dword_25053AC + 0x64))) + arg0*48 + 0x10` — le double déréférencement `mov ecx,[25053AC]` → `mov edx,[ecx+64h]` → `mov edx,[edx]` @0x65e4bf–0x65e4cf, puis ×3 (`lea ecx,[ecx+ecx*2]` @0x65e4d1) et `shl ecx,4` @0x65e4d4 = stride **48 = 0x30**, base +0x10 (`lea ecx,[edx+ecx+10h]` @0x65e4d7), store `mov [eax+0Ch],ecx` @0x65e4e0.
  - Champs 16 bits : `arg_4` → `node+0x10` (@0x65e4e8), `0` → `node+0x12` (@0x65e4fb), `arg_C` → `node+0x14` (@0x65e4f7), `0` → `node+0x16` (@0x65e4ff), `arg_8` → `node+0x18` (@0x65e4f1).

## 5. Verdict justifié
Toutes les 22 instructions sont citées et expliquées ; un unique callee (`BdLinkTask_Register`, cohérent avec le contexte imposé 0x508360 / Pump 0x508420 bit 2) ; un unique caller `sub_65DDA0` avec 5 xrefs (0x65E0FC, 0x65E10F, 0x65E122, 0x65E135, 0x65E14B) ; largeur de retour prouvée (eax préservé jusqu'au `retn` @0x65e503). Le rôle de wrapper d'enregistrement+binding est établi au niveau instruction ; seule la *signification métier* de l'entrée stride 0x30 (records de 48 octets, sous-champ à +0x10) reste une lecture structurale, pas une donnée wiki. Wiki indisponible ⇒ pas de CONFLICT possible, mais CERTAIN tient sur la mécanique (le contrat imposé confirme la signature et l'emplacement du callback).

## 6. Preuves
1. `65e4b0/65e4b5` : push offset `sub_65F2B0` (callback, arg2) puis push offset `dword_25053C0` (list_head, arg1) — ordre cdecl droite→gauche, callback fixe identique dans les deux jumeaux.
2. `65e4ba` + `65e4c5` : `call BdLinkTask_Register` + `add esp,8` — callee __cdecl, retour eax = node réutilisé comme base de tous les stores ultérieurs.
3. `65e4cb` : `mov ecx,[esp+arg_0]` — arg0 est l'index (multiplié par 0x30 ensuite), pas un pointeur.
4. `65e4d1/65e4d4` : `lea ecx,[ecx+ecx*2]; shl ecx,4` = ×48 (0x30) — stride développé, pas de `*232` façon leçon Hex-Rays.
5. `65e4cf/65e4d7` : `mov edx,[edx]` puis `lea ecx,[edx+ecx+10h]` — double déréférencement de `dword_25053AC+0x64`, base d'entrées + décalage fixe 0x10.
6. `65e4fb/65e4ff` : zéro explicite (`xor ecx,ecx`) en `node+0x12` et `node+0x16` — champs initialisés, pas résidus.
7. Callers.txt : 5 xrefs toutes dans `sub_65DDA0` (0x65E0FC…0x65E14B), aucun autre caller.
8. Retour : eax = node jamais réassigné après 0x65e4ba (stores 16 bits via dx/cx uniquement) — retour int 32 bits.

## 7. Diff avec le jumeau 0x65F250

| Élément | 0x65E4B0 (ceci) | 0x65F250 (jumeau) |
|---|---|---|
| list_head passée à Register | `dword_25053C0` | `dword_2505438` |
| table singleton lue | `dword_25053AC` | `dword_2505424` |
| callback enregistré | `sub_65F2B0` (**identique**) | `sub_65F2B0` |
| caller unique | `sub_65DDA0` (5 xrefs) | `sub_65E790` (5 xrefs) |
| corps d'instructions | 22 instr, isomorphes 1:1 | 22 instr |

La différence byte-level est **uniquement les deux globales** (paire list_head `25053C0`/table `25053AC`) et le caller ; le callback et la logique de binding sont identiques. C'est un doubleton d'instances : deux listes de tâches distinctes, même type de nœud, même callback.

## 8. Questions ouvertes
- Que représente exactement l'entrée stride 0x30 à `+0x10` (record de 48 octets) ? Le pointeur stocké en `node+0xC` sert-il au callback `sub_65F2B0` (le Pump passe-t-il le node en argument) ?
- Relation entre `dword_25053AC` et `dword_2505424` : deux singletons de même type (offset +0x64 partagé) ? Probable, à vérifier par xrefs d'écriture.
- Signification des champs 16 bits `+0x10/+0x14/+0x18` et des deux zéros `+0x12/+0x16` (paire shorts = dword 0 ? flag d'état ?).
- Les 5 xrefs par caller (5 appels par site) : instanciation de 5 nœuds distincts par sous-système, ou retry/branches ? À lever en lisant sub_65DDA0 / sub_65E790.

## 9. IDBCOMMENT
Wrapper: registers fixed cb sub_65F2B0 on list 25053C0 via BdLinkTask_Register(508360), node kept in eax; then node+0C = *(*(25053AC+64)) + arg0*0x30 + 0x10; node+10=arg4, +14=argC, +18=arg8, +12=+16=0; returns node. Twin of 65F250 (list 2505438, table 2505424, caller sub_65E790).

## 10. Reconstruction C

```c
/* 0x65E4B0 - 84 bytes, 22 instr - int __cdecl(int, short, short, short) */
int __cdecl BdLinkTask_RegisterAndBindEntry_25053C0(int idx, short a2, short a3, short a4)
{
    unsigned int *node;
    unsigned int *entry_base;

    /* push offset sub_65F2B0 ; push offset dword_25053C0 ; call ; add esp,8 */
    node = (unsigned int *)BdLinkTask_Register(&dword_25053C0, sub_65F2B0);

    /* double deref: ecx=25053AC -> edx=[ecx+0x64] -> edx=[edx] ; entry = edx + idx*0x30 + 0x10 */
    entry_base = *(unsigned int **)*(unsigned int **)((char *)dword_25053AC + 0x64);
    node[3] = (unsigned int)((char *)entry_base + idx * 48 + 0x10);   /* node+0x0C */

    *(short *)((char *)node + 0x10) = a2;   /* 65e4e8: mov [eax+10h], dx (arg_4) */
    *(short *)((char *)node + 0x18) = a3;   /* 65e4f1: mov [eax+18h], cx (arg_8) */
    *(short *)((char *)node + 0x14) = a4;   /* 65e4f7: mov [eax+14h], dx (arg_C) */
    *(short *)((char *)node + 0x12) = 0;    /* 65e4fb */
    *(short *)((char *)node + 0x16) = 0;    /* 65e4ff */

    return (int)node;                        /* eax preserve jusqu'au retn 65e503 */
}
```
```

### Checks §5.6 (parent, ASM live 2026-09-20)

- Dump intégral 22 instr vérifié ; isomorphie avec 0x65F250 confirmée (seules les 2 globales diffèrent : list dword_25053C0/table dword_25053AC vs dword_2505438/dword_2505424).
- Stride ×48 prouvé : `lea ecx,[ecx+ecx*2]; shl ecx,4` @0x65E4D1–0x65E4D4 (×3×16), puis `+0x10` → *(*(table+0x64)) + arg0*0x30 + 0x10.
- Mapping words vérifié : +10=arg1, +14=arg3, +18=arg2, +12=+16=0 ; retour EAX = node (préservé), SANS garde NULL.
- Callee 0x508360 ✓ ; caller unique sub_65DDA0 (5 xrefs) ✓.
