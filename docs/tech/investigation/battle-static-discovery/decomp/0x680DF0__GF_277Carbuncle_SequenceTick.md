# GF_277Carbuncle_SequenceTick @ 0x680DF0

- Instr (live): 255
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=8991
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=7170
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=12712
- A==B: non
- Push IDB: oui
- SetType: int __cdecl GF_277Carbuncle_SequenceTick(int)
- Notes parent: Tick FamilyA Carbuncle. Ping-pong DWORD [ctx+10h] (A/B tex+3ECC/13ECC vs 13ECC/23ECC). Init si WORD [ctx+0Ch]==2 et RuntimeGuard==0 et BYTE [ctx+0Fh]==0 : 7x BS_Memset, Register SequenceTaskDriver, FillDwords 175h, acteurs *0x9C @ 1D972C0. 6x Pump (EAX du premier). Completion: ClearReflectFlags + loop Y stride 0x9C jl signe, ret 2. INC WORD [ctx+0Ch] sinon. Occupancy 1+2 / 0xD0 / 0x1D0 / GFSG 0x44 / K_GF 0x84 absents. jle/jl signes. add eax,3E84h = tex.

## C réconcilié

```c
/* GF_277Carbuncle_SequenceTick @ 0x680DF0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 255 instr, size 0x3E3, end 0x6811D3. cdecl, 1 arg, retn C3. Local push ecx = var_4.
 * add esp: 40h (4x BS_Memset), 40h (3x BS_Memset + sub_6D6070 + Render), 3Ch (15 dwords),
 * 0Ch (sub_6D6070 + BattleFile), 18h (6x Pump), 8 (FillWordPair).
 * EAX return: 2 at 0x6811C0 (completion) else xor eax,eax at loc_6811CC.
 * Actor presentation stride 0x9C (lea/shl/sub *4 and add eax,9Ch), not slot 0xD0.
 * Occupancy 1+2 / 0xD0 / 0x1D0 / GF+0x44 / K_GF 0x84: absent.
 * Widths: BYTE [ctx+0Fh], events, CompletionArmed, test [Y-20h],2;
 * WORD 66 [ctx+0Ch] cmp/inc, [node+0Eh]/+3Ch/+3Eh/+40h, word_25081E0..F4, tex+0/+2, camera Y;
 * DWORD [ctx+10h] ping-pong, FadeAlpha, RuntimeGuard, FillDwords count 175h, node+74h/+78h/+7Ch.
 * jle/jl signed (7E/7C). No ja/jg, no setcc, no jpt, no domain::.
 * add eax,3E84h is tex offset, not occupancy.
 */

int __cdecl BS_Memset(int list_head, _WORD *node_array, unsigned int stride, int count);
__int16 *__cdecl sub_6D6070(int, __int16 *);
int __cdecl GF_277Carbuncle_RenderBackdropProjection(__int16 *, __int16 *);
int __cdecl BdLinkTask_Register(int list_head, int callback);
int __cdecl FillDwords(void *dst, int val, unsigned int count);
int __cdecl sub_4A29A0(int, int, int);
_DWORD *__cdecl InitObj_Word2_Neg1_RGB808080_Reloc4(int, _DWORD *, _DWORD *);
int __cdecl au_re_Battle_ReadAnimation_6(int, __int16 clip_id);
unsigned int __cdecl sub_701270(__int16, _DWORD *);
int __cdecl BattleFile_InitState_1DCD6EC(_BYTE *arg_0);
int __cdecl BdLinkTask_Pump(int *list_head);
int GF_277Carbuncle_SpawnOverlayController(void);
int *__cdecl FillWordPairStride2C_1D989B8(__int16, int);
int GF_277Carbuncle_ClearReflectFlags(void);
int __cdecl GF_277Carbuncle_SequenceTaskDriver(int);

extern unsigned __int8 *GF_277Carbuncle_TexturePayloadPtr;
extern void *GF_277Carbuncle_RenderPacketA;
extern void *GF_277Carbuncle_RenderPacketB;
extern int GF_277Carbuncle_FadeAlpha;
extern int GF_277Carbuncle_RuntimeGuard;
extern int GF_277Carbuncle_CameraBaseY;
extern int GF_277Carbuncle_CameraLiftYDelta;
extern unsigned __int8 GF_277Carbuncle_CompletionArmed;
extern unsigned __int8 *GF_277Carbuncle_ActionCtxPtr;
extern _DWORD dword_2508128;
extern _DWORD off_2508138[4];
extern _DWORD off_2508148[4];
extern _DWORD dword_2508158[4];
extern _DWORD dword_2508168[4];
extern _DWORD dword_2508178[4];
extern _DWORD off_2508188[4];
extern __int16 word_25081E0;
extern __int16 word_25081E2;
extern __int16 word_25081E4;
extern __int16 word_25081E6;
extern __int16 word_25081E8;
extern __int16 word_25081EA;
extern __int16 word_25081F0;
extern __int16 word_25081F2;
extern __int16 word_25081F4;
extern int g_BattlePresentationActors[];
extern __int16 word_1D974B4;
extern int battle_camera_world_y_edx;
extern unsigned __int8 unk_10C0D08;
extern unsigned __int8 unk_10C74DC;
extern unsigned __int8 unk_10B6F94;
extern unsigned __int8 unk_10BD488;

int __cdecl GF_277Carbuncle_SequenceTick(int arg_0)
{
    unsigned __int8 *ctx;
    unsigned __int8 *tex;
    int node;
    int pump0;
    unsigned __int8 *inner;
    unsigned __int8 *events;
    int cursor;
    int i;
    int count;
    unsigned int id;
    int yptr;
    __int16 span;
    __int16 v;

    ctx = (unsigned __int8 *)arg_0;
    tex = GF_277Carbuncle_TexturePayloadPtr;
    if (*(_DWORD *)(ctx + 0x10) == 0) {
        GF_277Carbuncle_RenderPacketA = tex + 0x13ECC;
        GF_277Carbuncle_RenderPacketB = tex + 0x23ECC;
        *(_DWORD *)(ctx + 0x10) = 1;
    } else {
        GF_277Carbuncle_RenderPacketA = tex + 0x3ECC;
        GF_277Carbuncle_RenderPacketB = tex + 0x13ECC;
        *(_DWORD *)(ctx + 0x10) = 0;
    }
    GF_277Carbuncle_FadeAlpha = 0;

    if (*(__int16 *)(ctx + 0x0C) == 2
        && GF_277Carbuncle_RuntimeGuard == 0
        && ctx[0x0F] == 0)
    {
        ctx[0x0F] = 1;
        tex = GF_277Carbuncle_TexturePayloadPtr;

        BS_Memset((int)&dword_2508128, (_WORD *)(tex + 4), 0x1C, 0x100);
        BS_Memset((int)off_2508138, (_WORD *)(tex + 0x1C04), 0x1C, 0x18);
        BS_Memset((int)off_2508148, (_WORD *)(tex + 0x1EA4), 0x1C, 9);
        BS_Memset((int)dword_2508158, (_WORD *)(tex + 0x1FA0), 0x10C, 3);
        BS_Memset((int)dword_2508168, (_WORD *)(tex + 0x22C4), 0x1C, 8);
        BS_Memset((int)dword_2508178, (_WORD *)(tex + 0x23A4), 0x14, 0x40);
        BS_Memset((int)off_2508188, (_WORD *)(tex + 0x28A4), 0x5E0, 1);

        word_25081F2 = 0;
        word_25081F0 = 0;
        word_25081F4 = (__int16)(GF_277Carbuncle_CameraBaseY - 200);
        word_25081E4 = 0x7FFF;
        word_25081E2 = 0x7FFF;
        word_25081E0 = 0x7FFF;
        word_25081EA = (__int16)0x8001;
        word_25081E8 = (__int16)0x8001;
        word_25081E6 = (__int16)0x8001;
        sub_6D6070((int)&unk_10C0D08, &word_25081E0);
        GF_277Carbuncle_RenderBackdropProjection(&word_25081F0, &word_25081E0);

        node = BdLinkTask_Register((int)off_2508188, (int)GF_277Carbuncle_SequenceTaskDriver);
        FillDwords((void *)(node + 0x0C), 0, 0x175);
        *(_DWORD *)(node + 0x10) = sub_4A29A0((int)&unk_10C74DC, 1, 0x80);
        InitObj_Word2_Neg1_RGB808080_Reloc4(
            node + 0x20,
            (_DWORD *)(node + 0xBC),
            (_DWORD *)&unk_10B6F94);
        au_re_Battle_ReadAnimation_6(node + 0x20, 0);
        sub_701270(0x800, (_DWORD *)(node + 0x60));

        *(_DWORD *)(node + 0x74) = 0;
        *(__int16 *)(node + 0x3C) = 0;
        *(_DWORD *)(node + 0x78) = -20;
        *(__int16 *)(node + 0x3E) = -20;
        *(_DWORD *)(node + 0x7C) = GF_277Carbuncle_CameraBaseY;
        *(__int16 *)(node + 0x40) = (__int16)GF_277Carbuncle_CameraBaseY;

        inner = *(unsigned __int8 **)(GF_277Carbuncle_ActionCtxPtr + 4);
        count = (unsigned __int8)inner[0x10];
        *(__int16 *)(node + 0x0E) = (__int16)count;
        if ((__int16)count > 0) {
            events = *(unsigned __int8 **)(inner + 8);
            cursor = node + 0x14;
            for (i = 0; i < *(__int16 *)(node + 0x0E); ++i) {
                id = events[i * 0x18];
                *(_DWORD *)cursor = (int)((char *)g_BattlePresentationActors + id * 0x9C);
                cursor += 4;
            }
        }

        word_25081E4 = 0x7FFF;
        word_25081E2 = 0x7FFF;
        word_25081E0 = 0x7FFF;
        word_25081EA = (__int16)0x8001;
        word_25081E8 = (__int16)0x8001;
        word_25081E6 = (__int16)0x8001;
        sub_6D6070((int)&unk_10BD488, &word_25081E0);

        tex = GF_277Carbuncle_TexturePayloadPtr;
        *(__int16 *)tex = word_25081E4;
        span = (__int16)(word_25081EA - word_25081E4);
        *(__int16 *)(tex + 2) = span;
        v = *(__int16 *)(tex + 2);
        *(__int16 *)(tex + 2) = (__int16)(v + (v >> 4));
        BattleFile_InitState_1DCD6EC((_BYTE *)(tex + 0x3E84));
        ctx = (unsigned __int8 *)arg_0;
    }

    if (ctx[0x0F] == 0) {
        pump0 = arg_0;
    } else {
        pump0 = BdLinkTask_Pump((int *)off_2508188);
        BdLinkTask_Pump((int *)dword_2508178);
        BdLinkTask_Pump((int *)dword_2508168);
        BdLinkTask_Pump((int *)dword_2508158);
        BdLinkTask_Pump((int *)off_2508138);
        BdLinkTask_Pump((int *)off_2508148);
        GF_277Carbuncle_SpawnOverlayController();
    }

    FillWordPairStride2C_1D989B8((__int16)GF_277Carbuncle_FadeAlpha, 0);

    if (GF_277Carbuncle_RuntimeGuard != 0)
        return 0;

    if (ctx[0x0F] == 0 || pump0 != 0 || GF_277Carbuncle_CompletionArmed == 0) {
        ++*(__int16 *)(ctx + 0x0C);
        return 0;
    }

    GF_277Carbuncle_ClearReflectFlags();
    yptr = (int)&word_1D974B4;
    do {
        if (*(_BYTE *)(yptr - 0x20) & 2)
            *(__int16 *)yptr -= (__int16)GF_277Carbuncle_CameraLiftYDelta;
        yptr += 0x9C;
    } while (yptr < (int)&battle_camera_world_y_edx);
    return 2;
}
```
