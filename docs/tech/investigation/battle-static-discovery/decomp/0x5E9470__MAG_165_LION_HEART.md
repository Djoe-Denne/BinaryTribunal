# MAG_165_LION_HEART @ 0x5E9470

- Instr (live): 120
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1474
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=3082
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1411
- A==B: non
- Push IDB: oui
- SetType: void *__cdecl MAG_165_LION_HEART(unsigned __int8 *)
- Notes parent: Init MAG Lion Heart. Deux BdLink (0x10x1 + 0x24x100). WORD node+0Ch=0. Loops DWORD stride 0x18/0x20 jl signe. TIM dword_23C6874. Actor slot BYTE *0x9C (pas 0xD0). Bone 0xF1 scale 0. Cam WORD[payload+2]. Vec cam-bone Y=0 Q12. jge var_C puis neg ESI. WORD SI a actor+0x0E. EAX=&unk_23C34B0. Occupancy 1+2 absente. add esp 30h/3Ch/20h.

## C réconcilié

```c
/* MAG_165_LION_HEART @ 0x5E9470
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 120 instr, size 0x1D6, end 0x5E9646. cdecl, 1 arg, retn C3.
 * add esp,30h (12 dword pushes: 2x BS_Memset 4 + 2x BdLink 2).
 * add esp,3Ch (15 dword pushes: TIM1 + Geom4 + Cam2 + Norm2 + 571480x3 + 5714F0x3).
 * add esp,20h epilogue. EAX return = offset unk_23C34B0 (list1 head).
 * Actor stride lea/shl/sub/shl = slot*0x9C. Occupancy 1+2 / 0xD0 / 0x1D0 / GF+0x44 / K_GF 0x84: absent.
 * Widths: BYTE payload[0] and [[payload+4]+8]; WORD 66 node+0Ch, [payload+2], actor+0x0E;
 * movsx bone/cam WORDs; signed jl on clear loops; signed jge on var_C; neg esi.
 * No setcc, no ja, no jpt, no domain::.
 */

void *Magic_GetFileArena(void);
void *GetPtr_209FAB8(void);
int __cdecl BS_Memset(int list_head, unsigned short *node_array, unsigned int stride, int count);
int __cdecl BdLinkTask_Register(int list_head, int callback);
unsigned __int8 *__cdecl BattleTimQueue_EnqueueType1(unsigned __int8 *tim);
int __cdecl BattleGeom_ResolveBoneIndexAndPose(int p_actor, int p_bone_index, int p_scale, unsigned short *p_out);
int __cdecl Camera_WorldXZMidpoint_Masked(unsigned __int16 mask, __int16 *out_xyz);
unsigned int __cdecl Vec3_NormalizeQ12_LenSq(int *src, unsigned int *dst);
unsigned int __cdecl sub_571480(int *a, int *b, int *out);
int __cdecl sub_5714F0(int angle, unsigned short *out_mat, int *vec);
int sub_5F01F0(void);
int __cdecl sub_5E9650(unsigned short *);

extern unsigned __int8 *dword_23C6944;
extern void *dword_23C694C;
extern unsigned __int8 *dword_23C5680;
extern int dword_23C6940;
extern int dword_23C6920;
extern unsigned short word_23C34A0[8];
extern unsigned char unk_23C34B0;
extern unsigned __int8 *dword_23C6860;
extern int dword_23C32EC;
extern int dword_23C6870;
extern unsigned short word_23C5920[];
extern int dword_23C5910;
extern int dword_23C34C0[];
extern int dword_23C4780[];
extern unsigned __int8 *dword_23C6874;
extern __int16 word_23C6928;
extern __int16 word_23C692C;
extern __int16 word_23C6910;
extern __int16 word_23C6914;
extern int g_BattlePresentationActors[];
extern int dword_D886E8[4];
extern unsigned short word_23C58E0[10];
extern int dword_23C58B0;
extern int dword_23C58B4;
extern int dword_23C58F4;
extern int dword_23C58F8;
extern int dword_23C58FC;

void *__cdecl MAG_165_LION_HEART(unsigned __int8 *payload)
{
    int vec[3];
    int tmp[3];
    int slot;
    int off;
    int angle;
    int node;
    int *p;
    unsigned __int8 *inner;

    dword_23C6944 = (unsigned __int8 *)Magic_GetFileArena();
    dword_23C694C = GetPtr_209FAB8();
    dword_23C5680 = dword_23C6944;

    inner = *(unsigned __int8 **)(*(unsigned __int8 **)(payload + 4) + 8);
    dword_23C6940 = 1;
    dword_23C6920 = 0;
    dword_23C32EC = inner[0];
    dword_23C6860 = payload;
    dword_23C6870 = payload[0];

    BS_Memset((int)&unk_23C34B0, word_23C34A0, 0x10u, 1);
    node = BdLinkTask_Register((int)&unk_23C34B0, (int)sub_5F01F0);
    *(__int16 *)(node + 0x0C) = 0;

    BS_Memset((int)&dword_23C5910, word_23C5920, 0x24u, 0x64);
    node = BdLinkTask_Register((int)&dword_23C5910, (int)sub_5E9650);
    *(__int16 *)(node + 0x0C) = 0;

    for (p = dword_23C34C0; (int)p < (int)dword_23C4780; p += 6)
        *p = 0;

    for (p = dword_23C4780; (int)p < (int)&dword_23C5680; p += 8)
        *p = 0;

    BattleTimQueue_EnqueueType1(dword_23C6874);

    slot = dword_23C6870;
    off = (((slot * 5) << 3) - slot) << 2;
    dword_23C58B0 = *(int *)((char *)g_BattlePresentationActors + off + 0x0C);
    dword_23C58B4 = *(int *)((char *)g_BattlePresentationActors + off + 0x10);
    BattleGeom_ResolveBoneIndexAndPose(
        (int)((char *)g_BattlePresentationActors + off),
        0xF1,
        0,
        (unsigned short *)&word_23C6928);

    Camera_WorldXZMidpoint_Masked(
        *(unsigned __int16 *)(dword_23C6860 + 2),
        &word_23C6910);

    vec[0] = (int)word_23C6910 - (int)word_23C6928;
    vec[1] = 0;
    vec[2] = (int)word_23C6914 - (int)word_23C692C;
    Vec3_NormalizeQ12_LenSq(vec, (unsigned int *)vec);

    angle = (int)sub_571480(dword_D886E8, vec, tmp);
    sub_5714F0(angle, word_23C58E0, tmp);

    dword_23C58F4 = (int)word_23C6928;
    dword_23C58F8 = 0;
    dword_23C58FC = (int)word_23C692C;

    if (tmp[1] < 0)
        angle = -angle;

    slot = dword_23C6870;
    off = ((slot * 5) << 3) - slot;
    *(__int16 *)((char *)g_BattlePresentationActors + off * 4 + 0x0E) = (__int16)angle;

    return (void *)&unk_23C34B0;
}
```
