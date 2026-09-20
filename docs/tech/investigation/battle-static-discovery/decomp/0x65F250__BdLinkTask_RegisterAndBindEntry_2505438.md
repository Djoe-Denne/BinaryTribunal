# `0x65F250` __ `BdLinkTask_RegisterAndBindEntry_2505438` — decomp réconcilié (lot 10 BdLink, post-mag FX)

| champ | valeur |
|---|---|
| EA | `0x65F250` |
| Nom IDA | `BdLinkTask_Register_65F2B0_2505438` (conservé, pas de rename) |
| Taille | 84 o / 22 instr |
| Mode | 1+P (≤80 instr, CERTAIN, vérif parent §5.6) |
| Verdict | CERTAIN |
| Push IDB | append-only `set_func_cmt`, tag `[semantic-triple 2026-09-20]`, save_database rc=True |
| Livrables sources | tools/_tmp_semantic_triple/0x65f250/ (asm.asm, semantic_*.md, c_reconciled.c, reconcile_notes.md) |

## Analyse (A)

```markdown
# Sémantique BdLinkTask_Register_65F2B0_2505438 @ 0x65F250 (analyse A, mode AVEUGLE)

## 1. Rôle
Wrapper mono-callee qui enregistre le callback fixe `sub_65F2B0` sur la liste `dword_2505438` via `BdLinkTask_Register` (0x508360), puis peuple le nœud retourné avec un pointeur d'entrée calculé `*(*(dword_2505424+0x64)) + arg0*0x30 + 0x10` et trois champs 16 bits issus des arguments.

## 2. Confiance
**CERTAIN** (mécanique entièrement couverte par opcodes cités ; callers + callees alignés ; wiki.md absent — échec qmd, donc aucune divergence possible mais pas de triangulation wiki).

## 3. Nom catalogue
IDA : `BdLinkTask_Register_65F2B0_2505438` — **trop large / trompeur** : ce n'est pas `BdLinkTask_Register` lui-même mais un wrapper qui l'appelle puis *patche* le nœud (bind d'entrée + payload 16 bits).
Proposition (markdown seul) : `BdLinkTask_RegisterAndBindEntry_2505438`

## 4. In / Out / Effets
- **In** (cdecl, 4 args) : `arg_0` = index 32 bits dans une table d'entrées stride 0x30 ; `arg_4`, `arg_8`, `arg_C` = trois `short` copiés respectivement vers `node+0x10`, `node+0x18`, `node+0x14`.
- **Out** : `eax` = pointeur du nœud alloué/enregistré par `BdLinkTask_Register` (int 32 bits, non altéré après `65f25a` — le `xor ecx,ecx` final ne touche pas eax).
- **Effets** :
  - push droit→gauche : `push offset sub_65F2B0` (arg2 = callback) puis `push offset dword_2505438` (arg1 = list_head) → `call BdLinkTask_Register` @0x65f25a ; callee __cdecl, cleanup `add esp,8` @0x65f265. Callback stocké à `node+8` (contexte imposé).
  - `node+0x0C` (dword) = `(*(*(dword_2505424 + 0x64))) + arg0*48 + 0x10` — le double déréférencement `mov ecx,[2505424]` → `mov edx,[ecx+64h]` → `mov edx,[edx]` @0x65f25f–0x65f26f, puis ×3 (`lea ecx,[ecx+ecx*2]` @0x65f271) et `shl ecx,4` @0x65f274 = stride **48 = 0x30**, base +0x10 (`lea ecx,[edx+ecx+10h]` @0x65f277), store `mov [eax+0Ch],ecx` @0x65f280.
  - Champs 16 bits : `arg_4` → `node+0x10` (@0x65f288), `0` → `node+0x12` (@0x65f29b), `arg_C` → `node+0x14` (@0x65f297), `0` → `node+0x16` (@0x65f29f), `arg_8` → `node+0x18` (@0x65f291).

## 5. Verdict justifié
Toutes les 22 instructions sont citées et expliquées ; un unique callee (`BdLinkTask_Register`, cohérent avec le contexte imposé 0x508360 / Pump 0x508420 bit 2) ; un unique caller `sub_65E790` avec 5 xrefs (0x65ED73, 0x65ED85, 0x65ED98, 0x65EDAB, 0x65EDC1) ; largeur de retour prouvée (eax préservé jusqu'au `retn` @0x65f2a3). Le rôle de wrapper d'enregistrement+binding est établi au niveau instruction ; seule la *signification métier* de l'entrée stride 0x30 (records de 48 octets, sous-champ à +0x10) reste une lecture structurale, pas une donnée wiki. Wiki indisponible ⇒ pas de CONFLICT possible, mais je retiens CERTAIN sur la mécanique (le contrat imposé confirme la signature et l'emplacement du callback).

## 6. Preuves
1. `65f250/65f255` : push offset `sub_65F2B0` (callback, arg2) puis push offset `dword_2505438` (list_head, arg1) — ordre cdecl droite→gauche, callback fixe identique dans les deux jumeaux.
2. `65f25a` + `65f265` : `call BdLinkTask_Register` + `add esp,8` — callee __cdecl, retour eax = node réutilisé comme base de tous les stores ultérieurs.
3. `65f268` : `mov ecx,[esp+arg_0]` — arg0 est l'index (multiplié par 0x30 ensuite), pas un pointeur.
4. `65f271/65f274` : `lea ecx,[ecx+ecx*2]; shl ecx,4` = ×48 (0x30) — stride développé, pas de `*232` façon leçon Hex-Rays.
5. `65f26f/65f277` : `mov edx,[edx]` puis `lea ecx,[edx+ecx+10h]` — double déréférencement de `dword_2505424+0x64`, base d'entrées + décalage fixe 0x10.
6. `65f29b/65f29f` : zéro explicite (`xor ecx,ecx`) en `node+0x12` et `node+0x16` — champs initialisés, pas résidus.
7. Callers.txt : 5 xrefs toutes dans `sub_65E790` (0x65ED73…0x65EDC1), aucun autre caller.
8. Retour : eax = node jamais réassigné après 0x65f25a (stores 16 bits via dx/cx uniquement) — retour int 32 bits.

## 7. Diff avec le jumeau 0x65E4B0

| Élément | 0x65F250 (ceci) | 0x65E4B0 (jumeau) |
|---|---|---|
| list_head passée à Register | `dword_2505438` | `dword_25053C0` |
| table singleton lue | `dword_2505424` (offset +0x64 → +0x14 après) | `dword_25053AC` |
| callback enregistré | `sub_65F2B0` | `sub_65F2B0` (**identique**) |
| caller unique | `sub_65E790` (5 xrefs) | `sub_65DDA0` (5 xrefs) |
| corps d'instructions | 22 instr | 22 instr, isomorphes 1:1 |

La différence byte-level est **uniquement les deux globales** (paire list_head + table) et donc le sous-système servi ; le callback et la logique de binding sont identiques. C'est un doubleton d'instances : deux listes de tâches distinctes, même type de nœud, même callback.

## 8. Questions ouvertes
- Que représente exactement l'entrée stride 0x30 à `+0x10` (record de 48 octets) ? Le pointeur stocké en `node+0xC` sert-il au callback `sub_65F2B0` (le Pump passe-t-il le node en argument) ?
- Relation entre `dword_2505424` et `dword_25053AC` : deux singletons de même type (offset +0x64 partagé) ? Probable, à vérifier par xrefs d'écriture.
- Signification des champs 16 bits `+0x10/+0x14/+0x18` et des deux zéros `+0x12/+0x16` (paire shorts = dword 0 ? flag d'état ?).

## 9. IDBCOMMENT
Wrapper: registers fixed cb sub_65F2B0 on list 2505438 via BdLinkTask_Register(508360), node kept in eax; then node+0C = *(*(2505424+64)) + arg0*0x30 + 0x10; node+10=arg4, +14=argC, +18=arg8, +12=+16=0; returns node. Twin of 65E4B0 (list 25053C0, table 25053AC, caller sub_65DDA0).

## 10. Reconstruction C

```c
/* 0x65F250 - 84 bytes, 22 instr - int __cdecl(int, short, short, short) */
int __cdecl BdLinkTask_RegisterAndBindEntry_2505438(int idx, short a2, short a3, short a4)
{
    unsigned int *node;
    unsigned int *entry_base;

    /* push offset sub_65F2B0 ; push offset dword_2505438 ; call ; add esp,8 */
    node = (unsigned int *)BdLinkTask_Register(&dword_2505438, sub_65F2B0);

    /* double deref: ecx=2505424 -> edx=[ecx+0x64] -> edx=[edx] ; entry = edx + idx*0x30 + 0x10 */
    entry_base = *(unsigned int **)*(unsigned int **)((char *)dword_2505424 + 0x64);
    node[3] = (unsigned int)((char *)entry_base + idx * 48 + 0x10);   /* node+0x0C */

    *(short *)((char *)node + 0x10) = a2;   /* 65f288: mov [eax+10h], dx (arg_4) */
    *(short *)((char *)node + 0x18) = a3;   /* 65f291: mov [eax+18h], cx (arg_8) */
    *(short *)((char *)node + 0x14) = a4;   /* 65f297: mov [eax+14h], dx (arg_C) */
    *(short *)((char *)node + 0x12) = 0;    /* 65f29b */
    *(short *)((char *)node + 0x16) = 0;    /* 65f29f */

    return (int)node;                        /* eax preserve jusqu'au retn 65f2a3 */
}
```
```

### Checks §5.6 (parent, ASM live 2026-09-20)

- Dump intégral 22 instr vérifié ; isomorphie avec 0x65E4B0 confirmée (seules les 2 globales diffèrent : list dword_2505438/table dword_2505424 vs dword_25053C0/dword_25053AC).
- Stride ×48 prouvé : `lea ecx,[ecx+ecx*2]; shl ecx,4` @0x65F271–0x65F274 (×3×16), puis `+0x10` → *(*(table+0x64)) + arg0*0x30 + 0x10.
- Mapping words vérifié : +10=arg1, +14=arg3, +18=arg2, +12=+16=0 ; retour EAX = node (préservé), SANS garde NULL (contrairement à 0x6804B0).
- Callee 0x508360 ✓ ; caller unique sub_65E790 (5 xrefs) ✓.
