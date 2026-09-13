# BdLinkCallback_606DB0 @ 0x606DB0

- Instr (live): 191
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=4
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BdLinkCallback_606DB0(int node)
- Notes parent: stride actor 0x9C (pas slot 0xD0). Occupancy 1+2 absent. WORD 66 [node+0Ch] tick, pas BYTE +0x0D. Pump EAX=0 keep / 2 unlink (setnle AX>60). Register 2 args. n1+1Ah/1Ch avant 2e Register. CRT _rand idiome %0x1000. add esp 10h/8/0Ch. Pas de Hex-Rays. Pas de struct packée.

## C réconcilié

```c
/* BdLinkCallback_606DB0 @ 0x606DB0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 191 instr, size 0x2D7, end 0x607087. cdecl, 1 arg = node (Pump [node+8](node)).
 * IDA type int __cdecl(int). SetType without namespace.
 * Saved EBX then EDI. ESI only on tick==1 (pop before loc_606FF4). FRSIZE 0. retn C3.
 * WORD 66 [node+0Ch] tick (not BYTE +0x0D). Pump return EAX=0 keep / EAX=2 unlink.
 * Stride lea/shl/sub: idx*0x9C on g_BattlePresentationActors @ 0x1D972C0.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / GetRandomInt: absent.
 * BYTE OR bit0 (80 0E 01) absent. setnle cl only. jge/jns SIGNED; no ja/jpt.
 * add esp 10h (Midpoint+Camera pair; two Registers), 8, 0Ch. sub_607090 0 args.
 * Register 2 args: push offset list, push callback. Child WORD [eax+0Ch]=0.
 */

extern unsigned int battle_to_update_flags_dword_1D96A9C; /* 0x1D96A9C DWORD */
extern int dword_23F2950;                                 /* actor index */
extern unsigned short word_23F2958;                      /* Midpoint out +0 */
extern unsigned short word_23F295A;                      /* Midpoint +2 */
extern unsigned short word_23F295E;                      /* Midpoint +6 */
extern int dword_23F2938;                                 /* camera out_xyz DWORD */
extern int dword_23F293C;
extern int dword_23F2940;                                 /* pointer */
extern int dword_23F1AE8;                                 /* BdLink list head */
extern int dword_23F07F0;
extern int dword_23F07F4;
extern int dword_23F07F8;
extern int dword_23F07FC;
extern unsigned short word_23F2920;
extern unsigned short word_23F2922;
extern unsigned short word_23F2924;
extern unsigned int off_DBA8F8;
extern unsigned char g_BattlePresentationActors[];        /* 0x1D972C0, stride 0x9C */

extern int __cdecl Actor_MidpointBonesF0F1(int, short *); /* then Camera; add esp,10h */
extern int __cdecl Camera_WorldXZMidpoint_Masked(unsigned short mask, short *out_xyz);
extern int *sub_607090(void);                             /* 0 stack args */
extern int __cdecl BdLinkTask_Register(int list_head, int callback); /* add esp,8 or 10h pair */
extern int __cdecl _rand(void);
extern char __cdecl BattleAction_ApplyEventRecords(unsigned char *result_event, int count); /* add esp,8 */
extern int __cdecl BdPlaySE(unsigned int *, int, unsigned int); /* add esp,0Ch */
extern int __cdecl sub_607130(unsigned short *);
extern int __cdecl sub_607210(unsigned short *);
extern int sub_6076E0(void);
extern int sub_607920(void);

int __cdecl BdLinkCallback_606DB0(int node)
{
    unsigned short tick;
    unsigned short a;
    unsigned short b;
    unsigned short mask;
    int actor;
    int n1;
    int n2;
    int n;
    int r;
    int rem;
    int v;
    int q;
    int cl;

    if (battle_to_update_flags_dword_1D96A9C & 0x201)
        return 0; /* EAX=0 keep; before push ebx */

    tick = *(unsigned short *)(node + 0x0C); /* 66 cmp [ebx+0Ch], di */

    if (tick == 0) {
        actor = (int)(g_BattlePresentationActors
                       + (unsigned int)dword_23F2950 * 0x9Cu);
        Actor_MidpointBonesF0F1(actor, (short *)&word_23F2958);
        a = word_23F295A;
        b = word_23F295E;
        a ^= b; /* 66 33 C1 */
        b ^= a;
        a ^= b;
        word_23F295E = b; /* old 295A */
        word_23F295A = a; /* old 295E */
        mask = *(unsigned short *)(dword_23F2940 + 2); /* 66 8B 48 02 */
        Camera_WorldXZMidpoint_Masked(mask, (short *)&dword_23F2938);
        sub_607090();
    }

    if (tick == 1) {
        n1 = BdLinkTask_Register((int)&dword_23F1AE8, (int)sub_607130);
        *(unsigned short *)(n1 + 0x0C) = 0; /* 66 89 7E 0C, EDI=0 */

        r = _rand();
        r &= 0x80000FFF;
        if (r < 0) { /* jns loc_606E5F */
            r--;
            r |= (int)0xFFFFF000;
            r++;
        }
        *(unsigned short *)(n1 + 0x18) = (unsigned short)r;

        rem = _rand() % 0x46; /* cdq/idiv 46h; EDI=0 stores still on n1 */
        *(unsigned short *)(n1 + 0x1C) = 0; /* 66 89 7E 1C before 2nd call */
        *(unsigned short *)(n1 + 0x1A) = (unsigned short)(-70 - rem); /* EAX=FFFFFFBAh - EDX */
        n2 = BdLinkTask_Register((int)&dword_23F1AE8, (int)sub_607210);

        *(unsigned short *)(n2 + 0x0C) = 0;
        *(unsigned short *)(n2 + 0x16) = 0x400;
        *(unsigned short *)(n2 + 0x12) = 0x400;

        r = _rand();
        r &= 0x80000FFF;
        if (r < 0) { /* jns loc_606EB7 */
            r--;
            r |= (int)0xFFFFF000;
            r++;
        }
        *(unsigned short *)(n2 + 0x18) = (unsigned short)r;

        rem = _rand() % 0x46;
        *(unsigned short *)(n2 + 0x1A) = (unsigned short)(rem + rem + 0x8C); /* lea [edx+edx+8Ch] */

        rem = _rand() % 0x64; /* idiv 64h */
        rem -= 0x32;
        *(unsigned short *)(n2 + 0x1C) = (unsigned short)rem;

        rem = _rand() % 0x28; /* idiv 28h */
        v = rem + 0x14;
        *(unsigned short *)(n2 + 0x1E) = (unsigned short)v;
        if ((short)*(unsigned short *)(n2 + 0x1C) < 0) { /* cmp [esi+1Ch], di; jge SIGNED */
            v = -v;
            *(unsigned short *)(n2 + 0x1E) = (unsigned short)v;
        }

        *(unsigned short *)(n2 + 0x20) = 0;

        rem = _rand() % 0x96; /* idiv 96h; EDX kept across DWORD copies */
        dword_23F07F8 = dword_23F2938;
        dword_23F07FC = dword_23F293C;
        dword_23F07F0 = dword_23F2938;
        dword_23F07F4 = dword_23F293C;
        *(unsigned short *)(n2 + 0x22) = (unsigned short)(rem + 0xBE);

        *(short *)&dword_23F07F0 += (short)(-4000 - (_rand() % 0xA28)); /* 66 01 05 */
        *(short *)&dword_23F07F4 += (short)((_rand() % 0x514) - 0x28A);
        *(short *)&dword_23F07F8 += (short)((_rand() % 0xA28) + 0xFA0);
        *(short *)&dword_23F07FC += (short)((_rand() % 0x514) - 0x28A);

        rem = _rand() % 0xA28;
        word_23F2922 = 0; /* 66 89 3D interleaved before idiv */
        word_23F2920 = (unsigned short)(rem + dword_23F2938 - 0x514); /* lea CX */

        rem = _rand() % 0x514;
        word_23F2924 = (unsigned short)(rem + dword_23F293C + 0x258);
    }

    if (tick == 3) {
        n = BdLinkTask_Register((int)&dword_23F1AE8, (int)sub_6076E0);
        *(unsigned short *)(n + 0x0C) = 0; /* add esp,8 then 66 89 78 0C */
    }

    if (tick == 4) {
        n = BdLinkTask_Register((int)&dword_23F1AE8, (int)sub_607920);
        *(unsigned short *)(n + 0x0C) = 0;
    }

    if (tick == 0x32) {
        q = *(int *)(dword_23F2940 + 4);
        BattleAction_ApplyEventRecords(
            *(unsigned char **)(q + 8),
            (unsigned char)*(unsigned char *)(q + 0x10)); /* xor ecx,ecx; mov cl,[eax+10h] */
    }

    if (tick == 1)
        BdPlaySE(&off_DBA8F8, 0, 0x80); /* edi=0; add esp,0Ch */

    ++*(unsigned short *)(node + 0x0C); /* 66 FF 43 0C */
    tick = *(unsigned short *)(node + 0x0C);
    cl = ((short)tick > 0x3C) ? 1 : 0; /* cmp ax,3Ch; setnle cl SIGNED */
    cl--;
    cl &= (int)0xFFFFFFFE;
    cl += 2;
    return cl; /* >60 → EAX=2 unlink; else EAX=0 keep */
}
```
