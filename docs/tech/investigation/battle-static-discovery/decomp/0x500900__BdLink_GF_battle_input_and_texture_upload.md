# BdLink_GF_battle_input_and_texture_upload @ 0x500900

- Instr (live): 206
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=887
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1141
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=4409
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BdLink_GF_battle_input_and_texture_upload(void)
- Notes parent: 2 chunks (head 0xA1 + tail 0x5005A0-0x50081F). Pump pousse la *valeur* des list heads. flags BYTE bits 4/8/0x80 ; byte_1D8E03A dans le if interne (jbe unsigned). Strides 0x5C/0x14/0x4488. ParseCamera x2. WORD 66 C7 05. DrawOTag thunk pas upload. EAX=g_BattleOTBase. Occupancy/GetRandomInt absents.

## C réconcilié

```c
/* BdLink_GF_battle_input_and_texture_upload @ 0x500900
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 206 instr, two chunks: head 0x500900-0x5009A1 then jmp loc_5005A0;
 * tail 0x5005A0-0x50081F retn. IDA type int(). No domain::.
 * Pingpong = g_BattleFramePingPongIndex & 0xFF; xor 1 for the other slot.
 * Strides: *0x5C (23*4) at 0x1D969C8, *0x14 (5*4) at 0x1D96980,
 * *0x4488 at 0x1D924DC / 0x1D8E058; packet windows 0x24000 / 0x1C000.
 * Occupancy / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / GetRandomInt unused.
 * jbe UNSIGNED vs 0x10. WORD 66 C7 05 on word_1D8E03C/03E. BYTE AL stores.
 */

void nullsub_6(void);
int __cdecl BdLinkTask_Pump(int *list_head);
int *sub_502020(void);
int sub_4BB090(void);
int BdLinkTask_PumpStageList(void);
__int16 updateBattleCamera(void);
int sub_506E30(void);
int BattleCamera_BuildViewAndConsumeDeltas(void);
int __cdecl sub_4A9160(int a1, int a2, int a3);
int __cdecl sub_4A9220(int a1, int a2, int a3, void *a4);
void __cdecl nullsub_4_used(int a1);
char sub_501B60(void);
unsigned int sub_501230(void);
int BattleTimQueue_FlushToVram(void);
unsigned int *__cdecl sub_45C9F0(unsigned int *p, int a2);
void __cdecl nullsub_5_used(void *p);
int *__cdecl sub_45B660(__int16 *a1);
int __cdecl Gpu_DrawOTagCurrent(unsigned int ot_head);
int __cdecl Call_Bs_parseCamera2(int a1);
int __cdecl Call_Bs_ParseCamera(int a1, int a2);
int __cdecl sub_45D550(int a1, int a2, int a3, int a4, int a5, int a6,
                       int a7, int a8, int a9, int a10, int a11, int a12,
                       int a13);

extern int *list_head; /* 0x1D96AA4 */
extern int *battle_tasks_init_dword_1D96A8C;
extern int *battle_tasks_init_dword_1D96A94;
extern int *battle_tasks_init_dword_1D96AA0;
extern int *battle_tasks_init_dword_1D96AA8;
extern int *g_GfSequenceContextCandidateA; /* 0x1D96AAC */
extern unsigned char byte_1D96A90;
extern unsigned char byte_1D96A88;
extern unsigned int battle_to_update_flags_dword_1D96A9C;
extern unsigned int g_BattleFramePingPongIndex; /* 0x1D96A80 */
extern unsigned int g_BattleOTBase; /* 0x1D8E04C */
extern unsigned int dword_B8A3E4;
extern unsigned char byte_1D8E03A;
extern __int16 word_1D8E038;
extern __int16 word_1D8E03C;
extern __int16 word_1D8E03E;
extern unsigned char unk_1D8E040[];
extern unsigned int pause_game_battle; /* 0x1CFF834 */
extern unsigned int g_BattlePacketCursor; /* 0x1D8E054 */
extern unsigned int g_BattlePacketEnd; /* 0x1D969A8 */
extern unsigned int off_B6D094;
extern unsigned int off_B6D070;

int __cdecl BdLink_GF_battle_input_and_texture_upload(void)
{
    unsigned int pp;
    unsigned char al;
    unsigned int cursor;

    /* ---- head 0x500900: pump lists, camera tick, then jmp tail ---- */
    nullsub_6();

    BdLinkTask_Pump(list_head);
    BdLinkTask_Pump(battle_tasks_init_dword_1D96A8C);
    byte_1D96A90 = (unsigned char)BdLinkTask_Pump(battle_tasks_init_dword_1D96AA0);
    /* add esp,0Ch after mov eax,g_GfSequenceContextCandidateA; EAX kept */

    if (g_GfSequenceContextCandidateA != 0) {
        if (BdLinkTask_Pump(g_GfSequenceContextCandidateA) == 0)
            g_GfSequenceContextCandidateA = 0;
    }

    byte_1D96A88 = (unsigned char)BdLinkTask_Pump(battle_tasks_init_dword_1D96AA8);

    sub_502020();
    sub_4BB090();
    nullsub_6();
    BdLinkTask_Pump(battle_tasks_init_dword_1D96A94);
    /* add esp,8 = Pump(AA8) + Pump(A94) */
    nullsub_6();
    BdLinkTask_PumpStageList();
    nullsub_6();
    updateBattleCamera();
    sub_506E30();
    BattleCamera_BuildViewAndConsumeDeltas();
    sub_502020();

    /* ---- tail 0x5005A0: flags 4 / 8 / 0x80, ping-pong OT/camera/packets ---- */

    if (*(unsigned char *)&battle_to_update_flags_dword_1D96A9C & 4) {
        pp = g_BattleFramePingPongIndex & 0xFFu;
        sub_4A9160(
            (int)(g_BattleOTBase + 8),
            (int)(0x1D969C8 + (pp ^ 1) * 0x5C),
            (int)dword_B8A3E4);
        /* mov al, flags; add esp,0Ch; test al,4 */
        if (*(unsigned char *)&battle_to_update_flags_dword_1D96A9C & 4) {
            sub_4A9220(
                (int)dword_B8A3E4,
                (int)(0x1D96980 + (pp ^ 1) * 0x14),
                (int)(0x1D969C8 + (pp ^ 1) * 0x5C),
                (void *)(0x1D969C8 + pp * 0x5C));
            al = byte_1D8E03A;
            if (al != 0) {
                if (al > 0x10) { /* cmp al,10h ; jbe UNSIGNED */
                    byte_1D8E03A = (unsigned char)(al + 0xF0);
                } else {
                    nullsub_4_used((int)(al & 1));
                    byte_1D8E03A = 0;
                }
            }
        }
    }

    sub_501B60();
    sub_501230();

    if (*(unsigned char *)&battle_to_update_flags_dword_1D96A9C & 8) {
        BattleTimQueue_FlushToVram();
        sub_45C9F0((unsigned int *)unk_1D8E040, 1);
        nullsub_5_used(unk_1D8E040);
        /* add esp,0Ch = 1 + two pointers */
    }

    if (*(unsigned char *)&battle_to_update_flags_dword_1D96A9C & 4) {
        pp = g_BattleFramePingPongIndex & 0xFFu;
        sub_45B660((__int16 *)(0x1D969C8 + (pp ^ 1) * 0x5C));
        Gpu_DrawOTagCurrent(0x1D924DC + pp * 0x4488);
        Call_Bs_parseCamera2((int)word_1D8E038);
        Call_Bs_ParseCamera((int)word_1D8E03C + 0xA0,
                            (int)word_1D8E03E + 0x6C);
        Call_Bs_parseCamera2((int)word_1D8E038);
        Call_Bs_ParseCamera((int)word_1D8E03C + 0xA0,
                            (int)word_1D8E03E + 0x6C);
        /* add esp,20h = 1+1+1+2+1+2 */
        word_1D8E03E = 0; /* 66 C7 05 */
        word_1D8E03C = 0;
    }

    if (pause_game_battle == 0) {
        pp = g_BattleFramePingPongIndex & 0xFFu;
        sub_45D550(
            (int)(0x1D8E058 + pp * 0x4488),
            0x1122, 0, 1, 5, 9, 0x11,
            0x1011, 0x1019, 0x101A, 0x101E, 0x111E,
            (int)0xFFFFFFFF);
        /* add esp,34h — 13 dwords; IDA proto (int,int,int) is incomplete */
    }

    pp = g_BattleFramePingPongIndex & 0xFFu;
    if (*(unsigned char *)&battle_to_update_flags_dword_1D96A9C & 0x80) {
        cursor = off_B6D094 + pp * 0x24000;
        g_BattlePacketCursor = cursor;
        cursor += 0x24000;
    } else {
        cursor = off_B6D070 + pp * 0x1C000;
        g_BattlePacketCursor = cursor;
        cursor += 0x1C000;
    }
    g_BattlePacketEnd = cursor;

    g_BattleOTBase = 0x1D8E058 + pp * 0x4488;
    return (int)g_BattleOTBase;
}
```
