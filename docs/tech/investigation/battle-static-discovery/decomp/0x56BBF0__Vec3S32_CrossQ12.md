# Vec3S32_CrossQ12 @ 0x56BBF0 — C descriptif relu (drain)

- Confiance : LIKELY NUMERIC ; rôle métier/type/prototype/ABI non certifiés.
- Parent gate native : `e01b35718a3a2fd6ea5d2864fff4cb1bba8f524c167a8908323f5525a5dce300`, 37 EA / 90 octets ; [sémantique](../semantic/0x56BBF0__Vec3S32_CrossQ12.md).
- C exact SHA-256 `13cfc1cdd1f4c923b0ea09f405d79011396c780365ce6e513629ed4157bacb88` ; ce C conditionnel est descriptif, pas certification compilateur/runtime.
- Aucun rename/SetType/patch ; les anciennes mentions Push/SetType ci-dessous sont **historiques**, pas opérations du drain.

## C réconcilié / indépendant relu — payload exact

```c
#include <stdint.h>
#include <limits.h>

/* Width prerequisites only; normal x86 cdecl ABI remains the target. */
_Static_assert(CHAR_BIT == 8, "8-bit bytes required");
_Static_assert(sizeof(int) == 4 && INT_MIN == (-2147483647 - 1)
               && INT_MAX == 2147483647, "32-bit int required");
_Static_assert(sizeof(int32_t) == 4 && INT32_MIN == INT_MIN
               && INT32_MAX == INT_MAX, "exact int32_t required");
_Static_assert(sizeof(uint32_t) == 4 && UINT32_MAX == 4294967295u
               && UINT_MAX == UINT32_MAX, "32-bit unsigned arithmetic required");
_Static_assert(sizeof(int64_t) == 8
               && INT64_MIN == (-INT64_C(9223372036854775807) - 1)
               && INT64_MAX == INT64_C(9223372036854775807),
               "exact int64_t required");

/* SAR 12 of an already wrapped DWORD, without negative signed shift. */
static int sub_56BBF0_sar12(uint32_t w)
{
    int64_t t = (int64_t)w - (w >= 0x80000000u ? 4294967296LL : 0LL);
    int64_t q = t >= 0 ? t / 4096 : -((-t + 4095) / 4096);

    /* t is in [-2147483648,2147483647]; q in [-524288,524287]. */
    return (int)q;
}

                              
                                                                          
                                                                 
                                                                     
                                                         
                                                              
                                                            
                                 
   

int __cdecl sub_56BBF0(int *p0, int *p1, int *p2)
{
    int v0;
    int v1;
    int v2;
    int v3;
    int v4;
    int v5;
    int v6;
    int v7;
    int v8;

    v0 = p1[1];              
    v1 = p0[1];              
    v2 = p1[2];              
    v3 = p0[2];              
    v4 = p1[0];            
    v5 = p0[0];            

    v6 = sub_56BBF0_sar12((uint32_t)v1 * (uint32_t)v2 - (uint32_t)v3 * (uint32_t)v0);                             
    p2[0] = v6;
    v7 = sub_56BBF0_sar12((uint32_t)v3 * (uint32_t)v4 - (uint32_t)v5 * (uint32_t)v2);                             
    v8 = sub_56BBF0_sar12((uint32_t)v5 * (uint32_t)v0 - (uint32_t)v1 * (uint32_t)v4);                             
    p2[1] = v7;                            
    p2[2] = v8;                            
    return v8;
}
```

## Source documentaire antérieure, préservée

Préimage SHA-256 `e72f56d02033a788149d72dff77edf311839a409048785dafd330cb7cc9b8ccf` ; copie gelée `tools/_tmp_semantic_triple/0x56bbf0/native-2026-10-10/parent_named_source_prepublication.md`. La clôture numérique ci-dessus supersède les anciens votes/code/claims sans les effacer.

````text
# Vec3S32_CrossQ12 @ 0x56BBF0

- Instr (live): 37
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=58
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=25
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=58
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Vec3S32_CrossQ12(int *, int *, int *)
- Notes parent: IMUL r32 signé, SAR 12 (Q12). out.x=(ay*bz-az*by)>>12, out.y=(az*bx-ax*bz)>>12, out.z=(ax*by-ay*bx)>>12. EAX=out.z. Spill by sur slot arg_0. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. Pas d'appel, pas de Jcc. DWORD only.

## C réconcilié

```c
/* Vec3S32_CrossQ12 @ 0x56BBF0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 37 instr, size 0x5A, end 0x56BC4A. cdecl 3 int* args. retn C3.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: ABSENT.
 * No CALL / add esp. No 66 prefix. No setcc / jpt / Jcc.
 * IMUL r32 signed (low 32). SAR 12 = signed Q12. No domain::.
 * Spill: by overwritten onto the original arg_0 stack slot.
 * EAX at retn = out.z after SAR.
 */

int __cdecl Vec3S32_CrossQ12(int *a, int *b, int *out)
{
    int by;
    int ay;
    int bz;
    int az;
    int bx;
    int ax;
    int ox;
    int oy;
    int oz;

    by = b[1]; /* [ecx+4] */
    ay = a[1]; /* [eax+4] */
    bz = b[2]; /* [ecx+8] */
    az = a[2]; /* [eax+8] */
    bx = b[0]; /* [ecx] */
    ax = a[0]; /* [eax] */

    ox = (ay * bz - az * by) >> 12; /* IMUL; SUB; SAR EBP,0Ch */
    out[0] = ox;
    oy = (az * bx - ax * bz) >> 12; /* IMUL; SUB; SAR EBP,0Ch */
    oz = (ax * by - ay * bx) >> 12; /* IMUL; SUB; SAR EAX,0Ch */
    out[1] = oy; /* [ebx+4] after pop edi */
    out[2] = oz; /* [ebx+8] after pop esi */
    return oz;
}
```
````
