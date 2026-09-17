# OT_InsertPrimitive @ 0x45C870

- Instr (live): 37
- Mode: 1+P (A=semantic-analyste glm-5.3-flash, P=parent §5.6 sur ASM live)
- Verdict: CERTAIN — allocation tête de liste OT dans pool borné
- Push IDB: append-only `[semantic-triple 2026-09-17]` + save_database
- Notes parent: jnb unsigned (CF=0) sur offset curseur-base vs 0x60000 ; stride nœud add eax,18h (0x18, jamais *24) ; shr edx,18h → BYTE node+0x16 = ancienne_tête>>24 ; WORD node+0x14=0 ; masque 0xFFFFFF via xor/and/xor (esi^((esi^ecx)&0xFFFFFF)) ; node+0x00 = pointeur packet (arg_4), pkt[0] = mot lien patché 24 bits ; *p_ot (arg_0) = adresse nœud ; retour EAX = curseur mis à jour (pas le nœud) ; pool plein → retour anticipé sans écriture, curseur inchangé. Leaf (callees=[]). 100+ callers code (ParsePolygons, ParsePolygons_GfMagic, sub_472F20, Field/WM draws) cohérents avec insertion OT. 6 slots confirmés par octets bruts: 89 50 24 08 etc. — node+0x04/+0x08/+0x0C/+0x10 depuis arg_8/arg_C/arg_10/arg_14, node+0x00 depuis arg_4.

## C réconcilié

```c
/* OT_InsertPrimitive @ 0x45C870
 * Ground truth: live ASM 37 instr, retn C3, leaf, cdecl, 6 args dword (ESP, pas add esp dans callee).
 * Pool: g_OtNodePool base, g_OtNodePoolCursor prochain nœud libre.
 * Capacité 0x60000 octets = 0x4000 nœuds de 0x18. EAX = curseur mis à jour.
 */
extern unsigned char g_OtNodePool[];
extern unsigned char *g_OtNodePoolCursor;

unsigned char *__cdecl OT_InsertPrimitive(
    unsigned int *p_ot,   /* arg_0 : tête OT — reçoit l'adresse du nœud */
    unsigned int *pkt,    /* arg_4 : packet primitive — pkt[0] = mot tag/lien */
    unsigned int f04,     /* arg_8  -> node+0x04 */
    unsigned int f08,     /* arg_C  -> node+0x08 */
    unsigned int f0C,     /* arg_10 -> node+0x0C */
    unsigned int f10)     /* arg_14 -> node+0x10 */
{
    unsigned char *node = g_OtNodePoolCursor;

    if ((unsigned int)(node - g_OtNodePool) >= 0x60000u)
        return node;                    /* pool plein : aucune écriture */

    *(unsigned int *)(node + 0x04) = f04;
    *(unsigned int *)(node + 0x08) = f08;
    *(unsigned int *)(node + 0x0C) = f0C;
    *(unsigned int *)(node + 0x10) = f10;

    unsigned int old_head = *p_ot;
    *p_ot = (unsigned int)node;
    *(unsigned short *)(node + 0x14) = 0;
    node[0x16] = (unsigned char)(old_head >> 24);

    *(unsigned int *)(node + 0x00) = (unsigned int)pkt;
    unsigned int tag = pkt[0];
    pkt[0] = tag ^ ((tag ^ old_head) & 0x00FFFFFFu); /* lien 24 bits, tag haut préservé */

    node += 0x18;
    g_OtNodePoolCursor = node;
    return node;                        /* EAX = nouveau curseur */
}
```

## Preuves ASM (live)

1. `45c877 sub ecx, offset g_OtNodePool` / `45c87d cmp ecx, 60000h` / `45c883 jnb locret_45C8DB` — capacité pool 0x60000, sortie anticipée unsigned.
2. `45c88f mov [eax+4], edx` / `45c89b mov [eax+8], ecx` / `45c8a2 mov [eax+0Ch], edx` / `45c8a5 mov [eax+10h], ecx` — 4 champs copiés.
3. `45c8a8 mov ecx, [edi]` / `45c8b2 mov [edi], eax` — lecture ancienne tête, écriture adresse nœud dans *p_ot.
4. `45c8aa mov word ptr [eax+14h], 0` / `45c8b4 shr edx, 18h` / `45c8b7 mov [eax+16h], dl` — WORD 0 à +0x14, octet haut ancienne tête à +0x16.
5. `45c8be mov [eax], edx` (edx=arg_4) / `45c8c1 mov esi, [edx]` — node+0x00 = pointeur packet, esi = pkt[0].
6. `45c8c5 xor ebx, ecx` / `45c8c7 and ebx, 0FFFFFFh` / `45c8cd xor ebx, esi` / `45c8d2 mov [edx], ebx` — patch lien 24 bits dans pkt[0].
7. `45c8cf add eax, 18h` / `45c8d5 mov g_OtNodePoolCursor, eax` — stride 0x18, sérialisation curseur, EAX retour.

