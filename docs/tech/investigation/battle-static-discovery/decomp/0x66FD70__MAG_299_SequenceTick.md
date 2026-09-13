# MAG_299_SequenceTick @ 0x66FD70

- Instr (live): 245
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=8321
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=7221
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=8118
- A==B: non
- Push IDB: oui
- SetType: int __cdecl MAG_299_SequenceTick(int)
- Notes parent: jnb unsigned (tick-10)>=0x18u. jl signed tick<10 dummy pumps=ctx. BYTE index *0x9C presentation (pas occupancy 1+2 / 0xD0). Y caster+24h-0x26C. Vec2 XZ +0/+4. 67E550 **[pres+64] BYTE, retry EAX!=0. Return 2 sans inc / 0+inc WORD +0Ch. add esp 44h/1Ch/0Ch/28h/4/8/0Ch/48h. Fall-through retn 0x6700BC.

## C réconcilié

```c
/* MAG_299_SequenceTick @ 0x66FD70
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 245 instr, size 0x34C, end exclusive 0x6700BC. cdecl, 1 arg (BdLink node). retn C3.
 * Continue path: xor eax,eax / add esp,48h falls through retn @ 0x6700BC (C3, not in IDA items).
 * Done path loc_6700A2: EAX=2, own retn @ 0x6700AE. No domain::.
 * add esp: 44h (17 dwords init), 1Ch (7 spawn), 0Ch (67E550 x2), 28h (10 tail),
 *   4 (Pump0), 8 (Pump1+Pump2), 0Ch (SE), 48h epilogue.
 * jnb UNSIGNED (tick-10)>=0x18u skip spawn. jl SIGNED tick<10 dummy pumps.
 * shr (not sar) for spawnIdx. idiv signed %3. No ja/jg/setcc/jpt.
 * Presentation stride BYTE*0x9C -> g_BattlePresentationActors. Occupancy 1+2 / 0xD0 / 0x1D0 / GF+0x44: absent.
 * Widths: WORD 66 tick+0Ch / latch+0Eh / node+20h+22h+2Ah+32h / vec adds; BYTE al index + **[pres+64];
 *   DWORD [ctx+10h] toggle, node+24h/28h/2Ch/30h copies.
 */

int __cdecl BS_Memset(int list_head, unsigned short *node_array, unsigned int stride, int count);
unsigned int *__cdecl sub_5022C0(int, unsigned int *, unsigned int *);
void __cdecl BattlePresentation_StartActorAnimation(int actor, int animId);
int __cdecl Actor_MidpointBonesF0F1(int, short *);
signed int __cdecl Vec2S16_MulSinCos_Q12(int, int, unsigned short *);
int __cdecl BdLinkTask_Register(int list_head, int callback);
int __cdecl _rand(void);
int __cdecl sub_67E550(int, int, short *);
int __cdecl sub_50CBA0(int *, short *);
int __cdecl sub_7016B0(int, unsigned int *, int);
unsigned int __cdecl Mat3S16_MakeRotZ_Q12(short, int);
unsigned int *__cdecl Mat3S16_MulQ12_Copy5(int, short *, unsigned int *);
int __cdecl BdLinkTask_Pump(int *list_head);
int __cdecl BdPlaySE(unsigned int *, int, unsigned int);
int __cdecl sub_6700C0(int);

extern unsigned int dword_2507878; /* arena */
extern unsigned int dword_2507874; /* TIM window */
extern unsigned int dword_2507840;
extern unsigned int dword_2507830;
extern unsigned int dword_2507820;
extern unsigned int dword_2507818; /* caster presentation actor */
extern unsigned int dword_2507814; /* payload */
extern unsigned int dword_1047120[1757];
extern unsigned char unk_10490A8;
extern unsigned int off_104E2FC[9];
extern unsigned char g_BattlePresentationActors[]; /* 0x1D972C0 stride 0x9C */

int __cdecl MAG_299_SequenceTick(int ctx)
{
    unsigned short mid[4];  /* X Y Z pad; DWORD copies use [0]/[2] */
    unsigned short dst[3];  /* var_40 / var_3E / var_3C */
    unsigned short vec[3];  /* Vec2 X at [0], Z at [2] (+4) */
    int delta[3];
    unsigned short mat[16];
    int tick;
    int spawn_idx;
    int kept0;
    int kept1;
    int kept2;
    int inner;
    int idx;
    int node;
    int pres;
    int scale;

    if (*(int *)(ctx + 0x10) != 0) {
        dword_2507874 = dword_2507878 + 0x4780;
        *(int *)(ctx + 0x10) = 0;
    } else {
        dword_2507874 = dword_2507878 + 0x14780;
        *(int *)(ctx + 0x10) = 1;
    }

    tick = *(short *)(ctx + 0x0C);

    if (tick == 1) {
        BS_Memset((int)&dword_2507840, (unsigned short *)(dword_2507878 + 0x1518), 0x80C, 6);
        BS_Memset((int)&dword_2507830, (unsigned short *)(dword_2507878 + 0xD80), 0x144, 6);
        BS_Memset((int)&dword_2507820, (unsigned short *)dword_2507878, 0x24, 0x60);
        sub_5022C0(dword_2507818, (unsigned int *)(dword_2507878 + 0x4560), dword_1047120);
        BattlePresentation_StartActorAnimation(dword_2507818, 2);
    }

    spawn_idx = tick - 10;
    if ((unsigned int)spawn_idx < 0x18u && (spawn_idx & 3) == 0) {
        spawn_idx = (int)((unsigned int)spawn_idx >> 2);

        inner = *(int *)(dword_2507814 + 4);
        idx = *(unsigned char *)*(int *)(inner + 8);
        pres = (int)&g_BattlePresentationActors[idx * 0x9C];

        Actor_MidpointBonesF0F1(dword_2507818, (short *)mid);
        Vec2S16_MulSinCos_Q12(-(int)*(short *)(dword_2507818 + 0x0E), 0x12C, vec);
        mid[0] = (unsigned short)(mid[0] + vec[0]);
        mid[2] = (unsigned short)(mid[2] + vec[2]);
        mid[1] = (unsigned short)(*(unsigned short *)(dword_2507818 + 0x24) - 0x26C);

        node = BdLinkTask_Register((int)&dword_2507840, (int)sub_6700C0);
        *(int *)(node + 0x2C) = *(int *)&mid[0];
        *(int *)(node + 0x30) = *(int *)&mid[2];
        *(int *)(node + 0x24) = *(int *)&mid[0];
        *(int *)(node + 0x28) = *(int *)&mid[2];
        *(unsigned short *)(node + 0x32) = 0xCC;
        *(unsigned short *)(node + 0x2A) = 0xCC;

        do {
            scale = *(unsigned char *)*(int *)*(int *)(pres + 0x64);
        } while (sub_67E550(pres, (_rand() * scale) >> 15, (short *)dst) != 0);

        if (spawn_idx % 3 == 1) {
            dst[0] = (unsigned short)(dst[0] + ((_rand() & 0x7FF) - 0x400));
            dst[2] = (unsigned short)(dst[2] + ((_rand() & 0x7FF) - 0x400));
            dst[1] = *(unsigned short *)(pres + 0x24);
            *(unsigned short *)(node + 0x22) = 2;
        } else if (spawn_idx == 5) {
            *(unsigned short *)(node + 0x22) = 1;
        } else {
            *(unsigned short *)(node + 0x22) = 0;
        }

        delta[0] = (int)(short)mid[0] - (int)(short)dst[0];
        delta[1] = (int)(short)dst[1] - (int)(short)mid[1];
        delta[2] = (int)(short)dst[2] - (int)(short)mid[2];
        *(unsigned short *)(node + 0x20) = (unsigned short)sub_50CBA0(delta, (short *)mat);
        sub_7016B0((int)&unk_10490A8, (unsigned int *)(node + 0x34), 0x7D8);
        Mat3S16_MakeRotZ_Q12((short)((spawn_idx << 8) - 0x280), node + 0x0C);
        Mat3S16_MulQ12_Copy5((int)mat, (short *)(node + 0x0C), (unsigned int *)(node + 0x0C));
    }

    if (tick < 10) {
        kept0 = ctx;
        kept1 = ctx;
        kept2 = ctx;
    } else {
        kept0 = BdLinkTask_Pump((int *)&dword_2507840);
        if (kept0 == 0 && *(unsigned short *)(ctx + 0x0E) == 0)
            *(unsigned short *)(ctx + 0x0E) = 1;
        kept1 = BdLinkTask_Pump((int *)&dword_2507830);
        kept2 = BdLinkTask_Pump((int *)&dword_2507820);
        if (tick == 10)
            BdPlaySE(off_104E2FC, 0, 0x80);
    }

    if (*(unsigned short *)(ctx + 0x0E) != 0 && kept0 == 0 && kept1 == 0 && kept2 == 0)
        return 2;

    ++*(unsigned short *)(ctx + 0x0C);
    return 0;
}
```
