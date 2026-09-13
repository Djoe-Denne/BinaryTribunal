# GF_095Siren_SequenceTick @ 0x739F40

- Instr (live): 91
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=778
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1084
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1042
- A==B: non
- Push IDB: oui
- SetType: int __cdecl GF_095Siren_SequenceTick(int)
- Notes parent: rep movsd ecx=8 → unk_2793E58. Table 11 fns, index movsx [ctx+0x29]. [ctx+0x5C] bit0 = paire BFA4/A024 vs BFA0/A020 (pas occupancy). 9 Pump add AX dans WORD [ctx+0x5E]. inc WORD 5C et 24. EAX=2 si ([ctx+0x26]&1) et [ctx+0x28]==0 sinon 0. Occupancy/0xD0/0x1D0/0x44/K_GF 0x84 absents.

## C réconcilié

```c
/* GF_095Siren_SequenceTick @ 0x739F40
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 91 instr, size 0x190, end 0x73A0D0. IDA type int __cdecl(int). cdecl, 1 arg, retn C3.
 * Labels loc_739FE0 / loc_739FF6 / loc_73A0C8.
 * Callees: sub_8DC740 @ 0x8DC740 char __cdecl(int); indirect phase table;
 * BdLinkTask_Pump @ 0x508420 int __cdecl(int *list_head) x9; DecByte_Obj18_Plus28 @ 0x8DC530 int __cdecl(int) add esp,4.
 * 11 pushes then add esp,2Ch (0x2C). EAX=2 only if ([ctx+0x26]&1) and [ctx+0x28]==0; else xor eax,eax.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * No domain::.
 */

typedef int (__cdecl *SirenPhaseFn)(int);

char __cdecl sub_8DC740(int);
int __cdecl BdLinkTask_Pump(int *list_head);
int __cdecl DecByte_Obj18_Plus28(int);

int __cdecl sub_73A0D0(int);
int __cdecl sub_73A0E0(int);
char __cdecl sub_73A0F0(int);
char __cdecl sub_73A170(int);
int __cdecl sub_747500(int);
int __cdecl sub_747540(int);
int __cdecl sub_747550(int);
char __cdecl sub_747560(int);
int __cdecl sub_747590(int);
int __cdecl sub_7475A0(int);
void nullsub_1170(void); /* 0x7475C0; still called with one pushed arg */

extern unsigned int dword_1D97778[8]; /* 0x1D97778, rep movsd source */
extern unsigned int unk_2793E58[8];   /* 0x2793E58, dest */
extern int dword_258FB68;
extern int dword_257F9B0;
extern int dword_257F8A4;
extern int dword_257F9AC;
extern int dword_258BFA4;
extern int dword_258BFA0;
extern int dword_258A024;
extern int dword_258A020;
extern unsigned short word_258FB40;
extern unsigned short word_258EC50;
extern int dword_258BE30[4];
extern int dword_257F988[9];
extern int dword_258FB48[6];
extern int dword_258EC40[4];
extern int dword_258BA90[4];
extern int dword_258A010[4];
extern int dword_257FA90[4];
extern int dword_2585EF0[4];
extern int dword_258BE20[4];

int __cdecl GF_095Siren_SequenceTick(int ctx)
{
    SirenPhaseFn table[11];
    unsigned char *c;
    unsigned char al26;
    int i;

    c = (unsigned char *)ctx;

    /* f3 a5: ecx=8; esi=dword_1D97778; edi=eax=unk_2793E58; then esi=arg_0 */
    for (i = 0; i < 8; i++)
        unk_2793E58[i] = dword_1D97778[i];

    dword_258FB68 = (int)unk_2793E58;
    dword_257F9B0 = (int)unk_2793E58;

    table[0] = sub_73A0D0;
    table[1] = sub_73A0E0;
    table[2] = (SirenPhaseFn)sub_73A0F0;
    table[3] = (SirenPhaseFn)sub_73A170;
    table[4] = sub_747500;
    table[5] = sub_747540;
    table[6] = sub_747550;
    table[7] = (SirenPhaseFn)sub_747560;
    table[8] = sub_747590;
    table[9] = sub_7475A0;
    table[10] = (SirenPhaseFn)nullsub_1170;

    /* BYTE [ctx+0x5C] TEST AL,1; jz loc_739FE0. Table stores do not clobber ZF. */
    if (c[0x5C] & 1)
    {
        dword_257F8A4 = dword_258BFA4;
        dword_257F9AC = dword_258A024;
    }
    else
    {
        dword_257F8A4 = dword_258BFA0;
        dword_257F9AC = dword_258A020;
    }

    sub_8DC740(ctx);

    /* 0F BE 4E 29 movsx; FF 54 8C 10 call [esp+ecx*4+10h] signed, no bounds */
    table[(signed char)c[0x29]](ctx);

    *(unsigned short *)(c + 0x5E) = 0;
    word_258FB40 = 0;
    word_258EC50 = 0;

    /* 66 01 46 5E: add WORD [ctx+0x5E], AX after each Pump */
    *(unsigned short *)(c + 0x5E) += (unsigned short)BdLinkTask_Pump(dword_258BE30);
    *(unsigned short *)(c + 0x5E) += (unsigned short)BdLinkTask_Pump(dword_257F988);
    *(unsigned short *)(c + 0x5E) += (unsigned short)BdLinkTask_Pump(dword_258FB48);
    *(unsigned short *)(c + 0x5E) += (unsigned short)BdLinkTask_Pump(dword_258EC40);
    *(unsigned short *)(c + 0x5E) += (unsigned short)BdLinkTask_Pump(dword_258BA90);
    *(unsigned short *)(c + 0x5E) += (unsigned short)BdLinkTask_Pump(dword_258A010);
    *(unsigned short *)(c + 0x5E) += (unsigned short)BdLinkTask_Pump(dword_257FA90);
    *(unsigned short *)(c + 0x5E) += (unsigned short)BdLinkTask_Pump(dword_2585EF0);
    *(unsigned short *)(c + 0x5E) += (unsigned short)BdLinkTask_Pump(dword_258BE20);

    al26 = c[0x26]; /* 8A 46 26 before add esp,2Ch */
    ++*(unsigned short *)(c + 0x5C); /* 66 FF 46 5C */
    ++*(unsigned short *)(c + 0x24); /* 66 FF 46 24 sequence counter */

    if ((al26 & 1) == 0)
        return 0; /* loc_73A0C8 */
    if (c[0x28] != 0)
        return 0;

    DecByte_Obj18_Plus28(ctx);
    return 2;
}
```
