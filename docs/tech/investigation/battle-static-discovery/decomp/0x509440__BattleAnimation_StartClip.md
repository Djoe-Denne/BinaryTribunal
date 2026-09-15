# BattleAnimation_StartClip @ 0x509440

- Instr (live): 49
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=143 (effort_used=high)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=55 (effort_used=high)
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=157 (effort_used=high)
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleAnimation_StartClip(void *model_context, BattleAnimationClipState8 *state, __int16 clip_id)
- Notes parent: Table = DWORD [bank+8]; offset = DWORD [table+movsx(clip_id)*4+4]; frame_count = BYTE [table+offset]. flags&=0xF3 (bits 2+3), bit0 → 2*cl-1. WORD 66 state+2=1 / +4=0. Squelette DWORD [bank]; BYTE count; WORD +8/+Ah/+Ch=0; loop +0x16, 3 WORD [ecx+2]/[ecx]/[ecx-2], add 30h. Occupancy 1+2 / 0xD0 absents. jle 7E signé. ReadAnimation add esp,8 EAX passthrough.

## C réconcilié

```c
/* BattleAnimation_StartClip @ 0x509440
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes. 49 instr, size 0x83.
 * cdecl; 3 args; no ebp; saves ebx,esi,edi; retn C3.
 * EAX = Battle_ReadAnimation EAX (passthrough).
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 absent.
 * Bone pose stride 0x30 present (83 C1 30).
 */

typedef struct BattleAnimationClipState8
{
    unsigned char clip_id;             /* +0 BYTE */
    unsigned char flags;               /* +1 BYTE */
    __int16 relative_cursor;           /* +2 WORD */
    unsigned __int16 bit_cursor;       /* +4 WORD */
    unsigned char current_frame;       /* +6 BYTE */
    unsigned char frame_count;         /* +7 BYTE */
} BattleAnimationClipState8;

int __cdecl Battle_ReadAnimation(int, unsigned char *); /* 0x508f90; add esp,8 */

int __cdecl BattleAnimation_StartClip(
    void *model_context,
    BattleAnimationClipState8 *state,
    __int16 clip_id)
{
    unsigned char *bank;
    unsigned char *table;
    unsigned int offset;
    unsigned char flags;
    unsigned char frame_count;
    unsigned char *skeleton;
    int bone_count;
    unsigned char *bone;

    state->clip_id = (unsigned char)clip_id; /* 8818 BYTE [eax], bl */
    bank = *(unsigned char **)((char *)model_context + 4); /* 8B7704 */
    state->current_frame = 0; /* 885006 BYTE [eax+6] */
    table = *(unsigned char **)(bank + 8); /* 8B4E08 DWORD [esi+8] */
    state->relative_cursor = 1; /* 66C740020100 WORD [eax+2] */
    state->bit_cursor = 0; /* 66895004 WORD [eax+4] */

    offset = *(unsigned int *)(table + (int)clip_id * 4 + 4); /* 0FBFDB; 8B5C9904 */
    frame_count = *(unsigned char *)(table + offset); /* 8A0C0B [ebx+ecx] */

    flags = (unsigned char)(state->flags & 0xF3u); /* 8A5801 80E3F3 bits 2+3 */
    state->frame_count = frame_count; /* 884807 */
    state->flags = flags; /* 885801 before 7407 */
    if (flags & 1u) /* F6C301; 7407 jz loc_509489 */
    {
        frame_count = (unsigned char)((frame_count << 1) - 1); /* D0E1 FEC9 */
        state->frame_count = frame_count; /* 884807 */
    }

    skeleton = *(unsigned char **)bank; /* 8B0E DWORD [esi] */
    bone_count = (int)skeleton[0]; /* 33DB 8A19 BYTE zero-ext */
    *(unsigned __int16 *)(skeleton + 8) = 0; /* 66895108 */
    *(unsigned __int16 *)(skeleton + 0x0A) = 0; /* 6689510A */
    *(unsigned __int16 *)(skeleton + 0x0C) = 0; /* 6689510C */
    if (bone_count > 0) /* 3BF2 7E14 SIGNED jle loc_5094B5 */
    {
        bone = skeleton + 0x16; /* 83C116 */
        do
        {
            *(unsigned __int16 *)(bone + 2) = 0; /* 66895102 */
            *(unsigned __int16 *)(bone + 0) = 0; /* 668911 */
            *(unsigned __int16 *)(bone - 2) = 0; /* 668951FE */
            bone += 0x30; /* 83C130 bone pose stride */
        } while (--bone_count != 0); /* 4E 75EF */
    }

    return Battle_ReadAnimation((int)model_context, (unsigned char *)state); /* 50 57 E8; 83C408 */
}
```
