# Gte_AVSZ3 @ 0x45E5C0 — C descriptif relu (drain)

- Confiance : LIKELY NUMERIC ; rôle métier/type/prototype/ABI non certifiés.
- Parent gate native : `b2f29fe85378b6409ab3f812e8c4189a407f4c7bb68420eb57e615a436458d74`, 15 EA / 72 octets ; [sémantique](../semantic/0x45E5C0__Gte_AVSZ3.md).
- C exact SHA-256 `b4afbd6cc0e4b3454d294f284b1636fb5be827644048e4e1013e8cfc27327aa0` ; ce C conditionnel est descriptif, pas certification compilateur/runtime.
- Payload C : exactement 695 octets après ouverture de fence ; le LF séparateur Markdown éventuel avant fermeture est hors payload, pas normalisation du fichier C accepté.
- Aucun rename/SetType/patch ; les anciennes mentions Push/SetType ci-dessous sont **historiques**, pas opérations du drain.

## C réconcilié / indépendant relu — payload exact

```c
extern unsigned int g_0x1CA8A5C;
extern unsigned int g_0x1CA8A58;
extern unsigned int g_0x1CA8A54;
extern short g_0x1CA92F0;
extern unsigned int g_0x1CA92F8;
extern unsigned int g_0x1CA8A2C;
extern unsigned int g_0x1CA8A70;

unsigned int __cdecl fn_0x45E5C0(void)
{
    unsigned int v0;
    unsigned int v1;
    unsigned int v2;
    int v3;
    unsigned int v4;

    v0 = g_0x1CA8A5C & 0xFFFFu;
    v1 = g_0x1CA8A58 & 0xFFFFu;
    v2 = g_0x1CA8A54 & 0xFFFFu;

    v0 += v1;
    g_0x1CA92F8 = 0;
    v3 = (int)g_0x1CA92F0;
    v0 += v2;

    v4 = v0 * (unsigned int)v3;
    v0 = (unsigned int)v4 >> 12;

    g_0x1CA8A2C = v0;
    g_0x1CA8A70 = v0;
    return v0;
}
```

## Source documentaire antérieure, préservée

Préimage SHA-256 `4c4c3b2a32641218d79cc276420b18d04982545b3e309742f7b8087112b586a6` ; copie gelée `tools/_tmp_semantic_triple/0x45e5c0/native-2026-10-10/parent_named_source_prepublication.md`. La clôture numérique ci-dessus supersède les anciens votes/code/claims sans les effacer.

````text
# Gte_AVSZ3 @ 0x45E5C0

- Instr (live): 15
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: unsigned int __cdecl Gte_AVSZ3(void)
- Notes parent: Σ3 low-16 de 1CA8A5C/58/54 (AND 0xFFFF, pas 1CA8A50) × movsx word_1CA92F0 puis SHR 12 (pas SAR). FLAG 1CA92F8=0. Stores DWORD 1CA8A2C et 1CA8A70. Tag 07/code 24, TEST AL,2, occupancy 1+2, +44h/+2Ch absents. Leaf cdecl retn C3, EAX=résultat.

## C réconcilié

```c
/* Gte_AVSZ3 @ 0x45E5C0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 15 instr, size 0x48, end exclusive 0x45E608. cdecl, 0 args, retn C3, no EBP frame.
 * Leaf: no calls, no add esp. EAX leftover = result (return).
 * Sum low-16 of dword_1CA8A5C/58/54 (AND 0xFFFF, not movsx), * (s16)word_1CA92F0,
 * then SHR 12 (C1 E8 0C, NOT SAR C1 F8). Two-operand IMUL 0F AF (EAX only).
 * dword_1CA8A50 and word_1CA92F4 are AVSZ4 only; absent here.
 * FLAG dword_1CA92F8 = 0. Dual DWORD store dword_1CA8A2C and dword_1CA8A70.
 * Occupancy 0xF8 / 1+2 / 0xD0 / 0x1D0 / +44h GF Exists: ABSENT. TEST AL,2 unlink: ABSENT.
 * OT tag 07 / GPU code 24 / obj+44h / obj+2Ch: ABSENT (callers Ot_EmitPrim_Code24_AVSZ3_*).
 * No jcc, no setcc, no jump table. No packed struct.
 */

extern unsigned int dword_1CA8A5C;
extern unsigned int dword_1CA8A58;
extern unsigned int dword_1CA8A54;
extern short word_1CA92F0;
extern unsigned int dword_1CA92F8;
extern unsigned int dword_1CA8A2C;
extern unsigned int dword_1CA8A70;

unsigned int __cdecl Gte_AVSZ3(void)
{
    unsigned int acc;
    unsigned int z_58;
    unsigned int z_54;
    int scale;
    int prod;

    acc = dword_1CA8A5C & 0xFFFFu;
    z_58 = dword_1CA8A58 & 0xFFFFu;
    z_54 = dword_1CA8A54 & 0xFFFFu;

    acc += z_58;
    dword_1CA92F8 = 0;
    scale = (int)word_1CA92F0;
    acc += z_54;

    prod = (int)acc * scale;
    acc = (unsigned int)prod >> 12;

    dword_1CA8A2C = acc;
    dword_1CA8A70 = acc;
    return acc;
}
```
````
