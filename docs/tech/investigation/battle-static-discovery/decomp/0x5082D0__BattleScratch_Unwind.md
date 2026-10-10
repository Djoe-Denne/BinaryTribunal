# BattleScratch_Unwind @ 0x5082D0 — C descriptif relu (drain)

- Confiance : LIKELY NUMERIC ; rôle métier/type/prototype/ABI non certifiés.
- Parent gate native : `fbce427d906752dfa143502bdf56bbeba117ebf240c26b38597fa88b77e0018d`, 7 EA / 24 octets ; [sémantique](../semantic/0x5082D0__BattleScratch_Unwind.md).
- C exact SHA-256 `0beac65635b463618125bb5792f9bd0f459bc05a70b20dc0793034a0d6337ece` ; ce C conditionnel est descriptif, pas certification compilateur/runtime.
- Payload C : exactement 835 octets après ouverture de fence ; le LF séparateur Markdown éventuel avant fermeture est hors payload, pas normalisation du fichier C accepté.
- Aucun rename/SetType/patch ; les anciennes mentions Push/SetType ci-dessous sont **historiques**, pas opérations du drain.

## C réconcilié / indépendant relu — payload exact

```c
#include <stdint.h>
#include <limits.h>
_Static_assert(CHAR_BIT == 8 && UINT_MAX == 0xffffffffu
               && UINT32_MAX == 0xffffffffu, "exact unsigned DWORD arithmetic");
/* Numeric effects/return projection, NOT a recovered native prototype.
 * Binding assumption: mem_01d999c4 is the ordinary readable/writable DWORD
 * at 0x01D999C4. Valid ABI/private activation, stable ordinary RAM and
 * defined object access are required; flags/codegen/runtime are not proved.
 * Parent mechanical correction of the independently reviewed historical C:
 * +3 uses unsigned32 before addition; old global minus rounded wraps32.
 */
extern uint32_t mem_01d999c4;
uint32_t numeric_5082d0(uint32_t argument_bits)
{
    uint32_t rounded = (argument_bits + UINT32_C(3)) & UINT32_C(0xfffffffc);
    mem_01d999c4 -= rounded;
    return rounded;
}
```

## Source documentaire antérieure, préservée

Préimage SHA-256 `b7db9dba40351efce4f5a32c9a7f0d1d5fc601c7565002146eb830eb3d74671d` ; copie gelée `tools/_tmp_semantic_triple/0x5082d0/native-2026-10-10/parent_named_source_prepublication.md`. La clôture numérique ci-dessus supersède les anciens votes/code/claims sans les effacer.

````text
# BattleScratch_Unwind @ 0x5082D0

- Instr (live): 7
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=22
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=80
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=98
- A==B: oui
- Push IDB: oui
- SetType: int __cdecl BattleScratch_Unwind(int nbytes)
- Notes parent: unwind DWORD `dword_1D999C4` ; `(nbytes+3)&0xFFFFFFFC` AND AL `24 FC` (pas AND EAX plein). EAX leftover = taille alignée, pas le curseur. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. Inverse `bs_modulo` 0x5082B0. Pas alloc Cerberus.

## C réconcilié

```c
/* BattleScratch_Unwind @ 0x5082D0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 7 instr, size 0x18, end 0x5082E8. cdecl, 1 arg. No saved regs. retn C3.
 * No call / add esp. Occupancy slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 unused.
 * Widths: DWORD cursor 8B/2B/89. Align AND is 24 FC (AND AL,0FCh), not 83 E0 FC.
 * EAX leftover = aligned nbytes (no mov eax before ret). Inverse of bs_modulo 0x5082B0.
 * No setcc / jcc / jpt / GetRandomInt. No domain::.
 */

extern unsigned int dword_1D999C4; /* 0x1D999C4 DWORD battle-scratch bump cursor */

int __cdecl BattleScratch_Unwind(int nbytes)
{
    unsigned int aligned;

    aligned = (unsigned int)(nbytes + 3) & 0xFFFFFFFCu; /* 83 C0 03; 24 FC AND AL */
    dword_1D999C4 -= aligned;                             /* 8B 0D; 2B C8; 89 0D */
    return (int)aligned;                                  /* EAX leftover, not cursor */
}
```
````
