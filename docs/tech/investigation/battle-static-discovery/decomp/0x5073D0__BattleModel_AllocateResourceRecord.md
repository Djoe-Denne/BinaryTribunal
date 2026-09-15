# BattleModel_AllocateResourceRecord @ 0x5073D0

- Instr (live): 14
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=13
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int BattleModel_AllocateResourceRecord(void)
- Notes parent: scan BYTE record+1==0 seulement (pas occupancy +2) ; stride 0x34 ; borne exclusive byte_1D999A5 via jl signé ; 11 slots ; EAX = &g_BattleResourceRecords[i][0] ou 0 ; aucun store.

## C réconcilié

```c
/* BattleModel_AllocateResourceRecord @ 0x5073D0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes. 14 instr.
 * cdecl int(); EAX = record pointer or 0. No callees.
 */

extern unsigned char g_BattleResourceRecords[11][52]; /* 0x1D99768, IDA unsigned __int8[11][52] */
extern unsigned char unk_1D99769;                     /* 0x1D99769 = record[0]+1 occupancy BYTE */
extern unsigned char byte_1D999A5[];                  /* 0x1D999A5 exclusive occupancy-cursor bound */

int BattleModel_AllocateResourceRecord(void)
{
    int ecx;              /* xor ecx,ecx ; slot index */
    unsigned char *eax;   /* occupancy cursor */

    ecx = 0;
    eax = &unk_1D99769;   /* mov eax, offset unk_1D99769 */

loc_5073D7:
    if (*eax == 0)        /* cmp byte ptr [eax], 0 ; jz loc_5073EA */
        goto loc_5073EA;

    eax += 0x34;          /* add eax, 34h */
    ecx++;                /* inc ecx */
    if ((int)eax < (int)byte_1D999A5) /* cmp eax, offset byte_1D999A5 ; jl loc_5073D7 */
        goto loc_5073D7;

    return 0;             /* xor eax,eax ; retn */

loc_5073EA:
    /* lea eax,[ecx+ecx*2] -> 3*ecx
     * lea ecx,[ecx+eax*4] -> 13*ecx  (overwrites ecx)
     * lea eax, ds:1D99768h[ecx*4] -> 0x1D99768 + 4*(13*index) = base + 0x34*index */
    return (int)&g_BattleResourceRecords[ecx][0];
}
```
