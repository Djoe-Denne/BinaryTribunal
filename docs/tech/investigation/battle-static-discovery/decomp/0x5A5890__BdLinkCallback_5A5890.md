# BdLinkCallback_5A5890 @ 0x5A5890

- Instr (live): 277
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=7103
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=9108
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=7515
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BdLinkCallback_5A5890(int node)
- Notes parent: WORD [node+0xC] phase (pas BYTE +0x0D). Register 2 args. Retour 0/2 (TEST AL,2). Stride acteur 0x9C. IMUL r32,m32 puis store WORD. jl/jg signes. Occupancy/0xD0/0x1D0/0x44 absents. MAG_305 TIM149.

## C réconcilié

```c
/* BdLinkCallback_5A5890 @ 0x5A5890
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 277 instr, size 0x3BC, end 0x5A5C4C. cdecl, 1 arg (BdLink node). retn C3.
 * Saved EBX/EBP/EDI/ESI. sub esp,8. WORD phase at [node+0xC] (66 FF 45 0C), not BYTE +0x0D.
 * BdLinkTask_Register is 2 args, add esp,8. No EAX NULL test after Register.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / GetRandomInt: absent.
 * Actor stride lea+shl+sub+lea = idx*0x9C. Pump unlink = this return EAX=2 (TEST AL,2).
 * IMUL 0F AF r32,m32 on locals then 66-store DX/CX. jl/jg/jle signed. No setcc/jpt/ja.
 * No domain::.
 */

extern int dword_224777C;
extern int dword_2245650;
extern unsigned char g_BattlePresentationActors[]; /* 0x1D972C0, stride 0x9C */
extern int dword_2247788; /* WORD x @+0, WORD y @+2 */
extern int dword_224778C; /* WORD z @+0 */
extern unsigned int battle_to_update_flags_dword_1D96A9C;
extern int dword_2247778;
extern int dword_2245FD8;
extern int dword_CEB5E8;
extern unsigned int off_CEDF28;
extern int dword_2246958;

int __cdecl BattleGeom_ResolveBoneIndexAndPose(int p_actor, int p_bone_index, int p_scale, unsigned short *p_out);
unsigned int __cdecl Fixed_Sin4096_Q12(int);
unsigned int __cdecl Fixed_Cos4096_Q12(int);
int *__cdecl sub_5022C0(int, int *, int *);
void __cdecl BattlePresentation_StartActorAnimation(int actor, int animId);
int __cdecl BdLinkTask_Register(int list_head, int callback);
int __cdecl _rand(void);
int __cdecl Actor_MidpointBonesF0F1(int, short *);
int *__cdecl FillWordPairStride2C_1D989B8(short, int);
char __cdecl BattleAction_ApplyResultAndSpawnPresentation(unsigned char *result_event);
int __cdecl BdPlaySE(unsigned int *, int, unsigned int);
int sub_5A5C50(int);
int sub_5A5DA0(int);
int sub_5A6070(int);
int sub_5A6580(int);

int __cdecl BdLinkCallback_5A5890(int node)
{
    short mid[4];
    unsigned char *actor;
    unsigned char *ch;
    unsigned char *other;
    short phase;
    int i;
    int t;
    int s;
    int c;

    actor = g_BattlePresentationActors + dword_224777C * 0x9C;
    BattleGeom_ResolveBoneIndexAndPose((int)actor, 0xF0, 0xC00, (unsigned short *)&dword_2247788);

    t = *(short *)(actor + 0xE);
    s = (int)Fixed_Sin4096_Q12(t);
    *(short *)&dword_2247788 += (short)((-100 * s) >> 12);
    t = *(short *)(actor + 0xE);
    c = (int)Fixed_Cos4096_Q12(t);
    *(short *)&dword_224778C += (short)((-100 * c) >> 12);

    if (battle_to_update_flags_dword_1D96A9C & 0x201)
        return 0;

    phase = *(short *)(node + 0xC);

    if (phase == 1) {
        sub_5022C0((int)actor, &dword_2245FD8, &dword_CEB5E8);
        BattlePresentation_StartActorAnimation((int)actor, 1);
    }

    if (phase >= 9 && phase <= 0x20 && (phase & 1)) {
        ch = (unsigned char *)BdLinkTask_Register((int)&dword_2246958, (int)sub_5A5C50);
        *(int *)(ch + 0x10) = dword_2247788;
        *(short *)(ch + 0x0C) = 0;
        *(int *)(ch + 0x14) = dword_224778C;
        *(short *)(ch + 0x18) = *(short *)(actor + 0xE);
        t = _rand();
        t &= 0x800007FF;
        if (t < 0) {
            t--;
            t |= 0xFFFFF800;
            t++;
        }
        *(short *)(ch + 0x1A) = (short)t;
        t = _rand();
        *(short *)(ch + 0x1C) = (short)(t % 0x280 + 0x600);
    }

    if (phase == 9) {
        ch = (unsigned char *)BdLinkTask_Register((int)&dword_2246958, (int)sub_5A5DA0);
        *(short *)(ch + 0x0C) = 0;
    }

    if (phase == 8) {
        other = g_BattlePresentationActors + dword_2245650 * 0x9C;
        Actor_MidpointBonesF0F1((int)other, mid);
        mid[0] = (short)(((int)mid[0] - (int)*(short *)&dword_2247788) / 6);
        mid[2] = (short)(((int)mid[2] - (int)*(short *)&dword_224778C) / 6);
        for (i = 1; i <= 5; i++) {
            ch = (unsigned char *)BdLinkTask_Register((int)&dword_2246958, (int)sub_5A6070);
            *(short *)(ch + 0x0C) = 0;
            *(short *)(ch + 0x0E) = (short)(i + i);
            t = i * *(int *)mid;
            t += dword_2247788;
            *(short *)(ch + 0x12) = 0;
            *(short *)(ch + 0x10) = (short)t;
            t = i * *(int *)&mid[2];
            t += dword_224778C;
            *(short *)(ch + 0x18) = (short)i;
            *(short *)(ch + 0x14) = (short)t;
        }
    }

    if (phase == 0x12) {
        other = g_BattlePresentationActors + dword_2245650 * 0x9C;
        Actor_MidpointBonesF0F1((int)other, mid);
        t = (int)*(short *)(other + 0x36) - (int)*(short *)(other + 0x3C);
        t /= 8;
        mid[1] = (short)t;
        for (i = 1; i <= 7; i++) {
            ch = (unsigned char *)BdLinkTask_Register((int)&dword_2246958, (int)sub_5A6580);
            *(short *)(ch + 0x0C) = 0;
            *(short *)(ch + 0x0E) = (short)(i + i);
            *(short *)(ch + 0x10) = mid[0];
            *(short *)(ch + 0x12) = *(short *)(other + 0x3C);
            t = i * *(int *)((char *)mid + 2);
            t -= _rand() % 100;
            *(short *)(ch + 0x12) += (short)t;
            *(short *)(ch + 0x18) = (short)i;
            *(short *)(ch + 0x14) = mid[2];
        }
    }

    if (phase <= 8)
        FillWordPairStride2C_1D989B8((short)(phase * 192), 0);
    else if (phase >= 0x1C)
        FillWordPairStride2C_1D989B8((short)((0x24 - phase) * 192), 0);

    if (phase == 0x1E) {
        t = *(int *)(*(int *)(dword_2247778 + 4) + 8);
        BattleAction_ApplyResultAndSpawnPresentation((unsigned char *)t);
    }

    if (phase == 8)
        BdPlaySE(&off_CEDF28, 0, 0x80);

    *(short *)(node + 0xC) = (short)(phase + 1);
    if (*(short *)(node + 0xC) > 0x24) {
        FillWordPairStride2C_1D989B8(0, 0);
        return 2;
    }
    return 0;
}
```
