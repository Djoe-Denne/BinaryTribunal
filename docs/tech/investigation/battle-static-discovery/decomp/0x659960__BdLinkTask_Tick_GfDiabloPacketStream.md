# `0x659960` __ `BdLinkTask_Tick_GfDiabloPacketStream` — decomp réconcilié (lot 10 BdLink, post-mag FX)

| champ | valeur |
|---|---|
| EA | `0x659960` |
| Nom IDA | `sub_659960` (conservé, pas de rename) |
| Taille | 162 o / 43 instr |
| Mode | 1+P (≤80 instr, CERTAIN mécanique, vérif parent §5.6) |
| Verdict | CERTAIN mécanique / LIKELY domaine (Diablo contextuel) |
| Push IDB | append-only `set_func_cmt`, tag `[semantic-triple 2026-09-20]`, save_database rc=True |
| Livrables sources | tools/_tmp_semantic_triple/0x659960/ (asm.asm, semantic_*.md, c_reconciled.c, reconcile_notes.md) |

## Analyse (A)

```markdown
# Sémantique sub_659960 @ 0x659960 (analyse A, mode B aveugle)

## 1. Rôle (1 phrase)
Tick BdLink périodique (callback enregistré par `BdLinkTask_Register_659960` @0x659900) qui exécute une étape de stream/encodage de paquets battle via `sub_701970` sur un contexte descripteur construit depuis `arg_0`, met à jour `g_BattlePacketCursor`, et demande son détachement (retour 2 = bit 2 de AL) lorsque l'étape signale la fin.

## 2. Confiance
**CERTAIN** sur la mécanique BdLink tick → travail → retour EAX ∈ {0, 2} (callers imposés comme prouvés + opcodes cités `0x6599E3 mov eax,2` / `0x6599FB xor eax,eax` ; écriture pleine 32 bits des deux chemins, donc AL == EAX ici, pas d'ambiguïté de largeur).
**LIKELY** uniquement sur l'interprétation domaine (« stream de paquets GF Diablo ») : le wiki n'a pas pu être consulté (qmd failed) et `sub_701970` est opaque — ces deux piliers manquent pour étendre CERTAIN au naming domaine.

## 3. Nom catalogue
`sub_659960` trop vague. Proposition (markdown seul, pas de renommage) :
**`BdLinkTask_Tick_GfDiabloPacketStream`** — ou plus prudent : `BdLinkTask_Tick_PacketStreamStep_659960`.
Le nom `gfDiablo_textureBasePtr` (lu @0x659963) motive la branche « Diablo », mais un seul indice nom + pas de wiki → suffixe domaine à confirmer par le verdict V.

## 4. In / Out / Effets
**In :**
- 1 arg stack (`[esp+38h]`, cdecl) → `esi` : contexte de tâche ; champs lus `[esi+0Ch]` (dword), `[esi+10h]` (dword), `[esi+12h]` (word), et `[esi+0Eh]` (word, incrémenté).
- Globales lues : `gfDiablo_textureBasePtr`, `dword_2505180` (gate, lue 2×), `g_BattlePacketCursor`.

**Out :**
- Retour EAX : `2` (détachement BdLink, bit 2 de AL) si `sub_701970` retourne 0 ; `0` (rester enregistré) sinon.
- `g_BattlePacketCursor` réécrit depuis le champ +0x18 du descripteur (in/out à travers le callee) — writeback inconditionnel @0x6599DB.
- Effet de bord conditionnel : si retour callee ≠ 0 **et** `dword_2505180 == 0` → `word [esi+0Eh] += 0x18` (@0x6599F6, avance de 24).

**Effets :** construction d'un descripteur de 0x30 octets sur la stack passé au callee :
- +0x00 ← `[esi+0Ch]`, +0x04 ← `[esi+10h]`, +0x14 = 0,
- +0x18 = `g_BattlePacketCursor` (in/out),
- +0x1C = ptr "0", +0x20 = ptr "1" (libellés d'énumérés — un champ booléen/2 valeurs est encodé),
- +0x24 (word) ← `[esi+12h]`, +0x28 = 0, +0x2C = `gfDiablo_textureBasePtr + 0xD94`.
Args du callee (poussés droite→gauche, 4 args, `add esp,10h`) : `arg1 = esi+0x18`, `arg2 = sub_656B70`, `arg3 = &descripteur`, `arg4 = dword_2505180`.

## 5. Verdict justifié
Convergence à 3 piliers sur la mécanique : (a) caller unique = registraire BdLink imposé prouvé (xref data depuis 0x659900) + contrat Pump `node+8` avec bit 2 de AL = détachement ; (b) le corps implémente exactement ce contrat : deux sorties exclusives `mov eax,2` (0x6599E3) / `xor eax,eax` (0x6599FB) ; (c) callees cohérents : un seul callee `sub_701970`, 4 args cdecl (`add esp,10h` @0x6599D6), avec `g_BattlePacketCursor` passé dans le descripteur et réécrit après l'appel (in/out prouvé par `mov edx,[esp+44h+var_18]` @0x6599D2 puis store @0x6599DB). Le pattern "0"/"1" en pointeurs + un curseur de paquets + une base texture GF +0xD94 suggère un encodeur/descripteur de champ de paquet battle, mais sans wiki ni visibilité sur `sub_701970`, l'étiquette domaine reste LIKELY. Aucune divergence détectable (Hex-Rays non consulté — mode B).

## 6. Preuves (adresses exactes)
1. **Caller/contrat** : unique xref data depuis `0x659900` (`BdLinkTask_Register_659960`) — callback BdLink ; Pump 0x508420 invoque `node+8` @0x508434, bit 2 de AL = détachement (contexte imposé).
2. **Convention retour** : `0x6599E3 mov eax,2` (chemin callee==0) et `0x6599FB xor eax,eax` (chemin callee≠0) — EAX écrit en 32 bits, valeurs {0,2}, compatible lecture AL-only du contrat.
3. **Callee cdecl 4 args** : pushes 0x6599A3–0x6599AD (`edx`=gate, `eax`=&desc, `offset sub_656B70`, `ecx=esi+18h` — le dernier poussé est arg1) + `0x6599D6 add esp,10h`.
4. **In/out curseur** : `0x65999F mov [esp+34h+var_18], ecx` (cursor → desc+0x18), `0x6599D2 mov edx,[esp+44h+var_18]`, `0x6599DB mov g_BattlePacketCursor, edx` (writeback inconditionnel, avant le branchement de retour).
5. **Garde gate** : `0x6599ED mov eax, dword_2505180` / `0x6599F4 jnz short loc_6599FB` / `0x6599F6 add word ptr [esi+0Eh], 18h` — l'avance de 24 sur le word du contexte n'a lieu que si gate == 0 (unsigned test `test/jnz`, pas de confusion signé).
6. **Base texture** : `0x659963 mov edx, gfDiablo_textureBasePtr` + `0x65996E add edx, 0D94h` stocké dans desc+0x2C (`0x659974`).
7. **Libellés "0"/"1"** : `0x6599B6 mov [esp+44h+var_14], offset a0` / `0x6599BE mov [esp+44h+var_10], offset a1` — descripteur de champ énuméré à 2 valeurs.

## 7. Questions ouvertes
- `wiki.md` inexploitable (qmd failed) : aucune convergence wiki possible cette passe → piliers wiki manquant pour CERTAIN domaine.
- `sub_701970` : encodeur ou décodeur de paquet ? Les libellés "0"/"1" et le curseur suggèrent un writer de champ énuméré, mais le sens de traversée (curseur avance ou recule) est inconnu.
- `arg_0` (esi) : nœud BdLink lui-même ou contexte tâche pointé par le nœud ? `[esi+0Eh] += 0x18` sur un nœud contenant le callback à +8 est plausible mais non prouvé.
- Sémantique de `dword_2505180` : flag pause du stream ? Passé au callee ET testé localement — double rôle à confirmer.
- `sub_656B70` : fonction de rendu/consumption par champ ? Non analysée (hors pack).
- Sens de `[esi+0Eh] += 0x18` : offset vers le paquet suivant, compteur de frames, ou avancement de sous-titre/choix ?

## 8. IDBCOMMENT
`BdLink task tick: run sub_701970(arg ctx+18h, sub_656B70, &desc, dword_2505180); desc{+00 ctx+0C, +04 ctx+10, +18 g_BattlePacketCursor in/out, +1C "0", +20 "1", +24w ctx+12, +2C gfDiablo_textureBasePtr+D94}; writeback g_BattlePacketCursor; ret 2 (detach) if step returns 0, else ret 0 and ctx+0Eh += 18h while dword_2505180 == 0`

## 9. C reconstruction (fidèle ASM)

```c
/* BdLink task tick @0x659960 — cdecl, 1 stack arg, retour EAX in {0, 2}. */
struct StreamDesc                 /* 0x30 octets sur la stack */
{
    uint32_t  f00;                /* +0x00 <- [ctx+0x0C]           */
    uint32_t  f04;                /* +0x04 <- [ctx+0x10]           */
    uint32_t  _08[2];             /* +0x08..+0x13 non initialises  */
    uint32_t  f14;                /* +0x14 = 0                     */
    uint32_t  cursor;             /* +0x18 = g_BattlePacketCursor (in/out) */
    const char *lbl0;             /* +0x1C = "0"                   */
    const char *lbl1;             /* +0x20 = "1"                   */
    uint16_t  f24;                /* +0x24 (word) <- [ctx+0x12]    */
    uint32_t  _28;                /* +0x28 = 0                     */
    uint32_t  texBaseOff;         /* +0x2C = gfDiablo_textureBasePtr + 0xD94 */
};

int __cdecl sub_659960(void *ctx)
{
    StreamDesc desc;
    int        step;

    desc.texBaseOff = (uint32_t)gfDiablo_textureBasePtr + 0xD94;   /* 659963..659974 */
    desc.f00        = *(uint32_t *)((char *)ctx + 0x0C);           /* 65997E */
    desc.f04        = *(uint32_t *)((char *)ctx + 0x10);           /* 659981 */
    desc.f24        = *(uint16_t *)((char *)ctx + 0x12);           /* 659988 */
    desc.cursor     = g_BattlePacketCursor;                        /* 659990..65999F */
    desc.f14        = 0;                                           /* 6599AE */
    desc.lbl0       = "0";                                         /* 6599B6 */
    desc.lbl1       = "1";                                         /* 6599BE */
    desc._28        = 0;                                           /* 6599C6 */

    step = sub_701970((char *)ctx + 0x18,   /* arg1: ctx+0x18       6599A5/AD */
                      sub_656B70,           /* arg2: callback       6599A8     */
                      &desc,                /* arg3: descripteur    6599A4     */
                      dword_2505180);       /* arg4: gate           6599A3     */

    g_BattlePacketCursor = desc.cursor;     /* writeback inconditionnel 6599D2/DB */

    if (step == 0)
        return 2;                           /* detach BdLink (bit 2 de AL) 6599E3 */

    if (dword_2505180 == 0)                 /* garde gate                  6599ED/F4 */
        *(uint16_t *)((char *)ctx + 0x0E) += 0x18;   /* avance de 24    6599F6 */

    return 0;                               /* rester enregistre            6599FB */
}
```
```

### Checks §5.6 (parent, ASM live 2026-09-20)

- Dump intégral 43 instr vérifié : 4 args cdecl vers sub_701970 (`push edx`=dword_2505180, `push eax`=&desc, `push offset sub_656B70`, `push ecx`=ctx+0x18 ; `add esp,10h` @0x6599D6).
- Retour confirmé : EAX=2 @0x6599E3 si sub_701970 rend 0 ; sinon EAX=0 @0x6599FB et `add word [esi+0Eh],18h` @0x6599F6 uniquement si dword_2505180==0. Writeback g_BattlePacketCursor inconditionnel @0x6599DB.
- CORRECTION layout desc (l'analyse A plaçait le zéro à +1C) : recalcul var→desc (base postsub ; décalage 5 pushes) → desc+14=0 (var_1C), +18=curseur (var_18), +1C="0" (var_14), +20="1" (var_10), +24w=ctx+12 (var_C), +28=0 (var_8), +2C=texbase+0xD94 (var_4).
- Attribution Diablo : global gfDiablo_textureBasePtr (0x2505208) écrit @0x65422B, ~120 lecteurs dans le cluster 0x654–0x659 → preuve contextuelle LIKELY (pas de preuve gameplay directe).
- Callee direct sub_701970 ✓ (sub_656B70 passé en data arg, pas appelé) ; caller data 0x659900 ✓.
