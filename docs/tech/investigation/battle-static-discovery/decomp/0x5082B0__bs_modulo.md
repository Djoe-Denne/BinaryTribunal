# bs_modulo @ 0x5082B0 — C descriptif relu (drain)

- Confiance : LIKELY NUMERIC ; rôle métier/type/prototype/ABI non certifiés.
- Parent gate native : `7fa4a7eed992d3e243f78dfb9cdf34360ba309c0643a1aa7f9a7a806080b689b`, 8 EA / 27 octets ; [sémantique](../semantic/0x5082B0__bs_modulo.md).
- C exact SHA-256 `d0613b68a8ef16701b66dd7dab0cdbb6c85231c442c45270df46427edd4c0d7c` ; ce C conditionnel est descriptif, pas certification compilateur/runtime.
- Payload C : exactement 872 octets après ouverture de fence ; le LF séparateur Markdown éventuel avant fermeture est hors payload, pas normalisation du fichier C accepté.
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
 * global snapshot first; conversion/unsigned carrier BEFORE +3; full bits.
 */
extern uint32_t mem_01d999c4;
uint32_t numeric_5082b0(uint32_t argument_bits)
{
    uint32_t old = mem_01d999c4;
    uint32_t rounded = (argument_bits + UINT32_C(3)) & UINT32_C(0xfffffffc);
    mem_01d999c4 = old + rounded;
    return old;
}
```

## Source documentaire antérieure, préservée

Préimage SHA-256 `438769f0f987240b6eadc8728bfc92f877892323a7da1e452732926d931fc86f` ; copie gelée `tools/_tmp_semantic_triple/0x5082b0/native-2026-10-10/parent_named_source_prepublication.md`. La clôture numérique ci-dessus supersède les anciens votes/code/claims sans les effacer.

````text
# bs_modulo @ 0x5082B0

- Instr (live): 8
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl bs_modulo(int nbytes)
- Notes parent: bump DWORD `dword_1D999C4` ; `(nbytes+3)&0xFFFFFFFC` AND EDX plein (pas AND AL). EAX = ancien curseur. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. Inverse `BattleScratch_Unwind` 0x5082D0.

## C réconcilié

```c
/* bs_modulo @ 0x5082B0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 8 instr, size 0x1B, end 0x5082CB. cdecl, 1 arg. No saved regs. retn C3.
 * No call / add esp. Occupancy slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 unused.
 * Widths: all DWORD (8B/83/03/89). No 66. Align AND is 83 E2 FC (full EDX), not AND AL.
 * EAX = old dword_1D999C4 (8B C1 before 03 CA). Inverse: BattleScratch_Unwind 0x5082D0.
 * No setcc / jcc / jpt / GetRandomInt. No domain::.
 */

extern unsigned int dword_1D999C4; /* 0x1D999C4 DWORD battle-scratch bump cursor */

int __cdecl bs_modulo(int nbytes)
{
    unsigned int aligned;
    unsigned int old;

    aligned = (unsigned int)(nbytes + 3) & 0xFFFFFFFCu; /* 83 C2 03; 83 E2 FC */
    old = dword_1D999C4;                                 /* 8B 0D; 8B C1 EAX=old */
    dword_1D999C4 = old + aligned;                         /* 03 CA; 89 0D */
    return (int)old;
}
```
````
