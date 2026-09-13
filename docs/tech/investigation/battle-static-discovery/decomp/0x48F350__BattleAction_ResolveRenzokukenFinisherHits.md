# BattleAction_ResolveRenzokukenFinisherHits @ 0x48F350

- Instr (live): 52
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=3550
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=2369
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1515
- A==B: non
- Push IDB: oui
- SetType: int BattleAction_ResolveRenzokukenFinisherHits(void)
- Notes parent: scan 0xFA stride 0x14 JL signed vs 0x1D28345 (miss=rec 0). Kernel row 24, hitCount BYTE +0x0C. COMMAND_TYPE_ID=0xF9 BYTE. dword_1D280CC[rec*5] DWORD ptr ; ATTACKER_SLOT_ID_1[rec*20] BYTE. Slot*0xD0, scripted_invuln_flag BYTE +0xC9 ALWAYS puis JLE. Loop [esi]×2, add esp 8, esi+=0x18. Occupancy/F_CHAR/GetRandomInt absents. Pas de 66/setcc/ja/jg. EAX leftover. Pas de Hex-Rays. Pas de struct packée.

## C réconcilié

```c
/* BattleAction_ResolveRenzokukenFinisherHits @ 0x48F350
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 52 instr, size 0x9B. End 0x48F3EB. IDA type int(). No domain::.
 * No args. cdecl. GetRandomInt unused. Occupancy 1+2 unused. F_CHAR 0x1D0 unused.
 * Slot stride 0xD0. Kernel row 24 (NOT 12). Command-record stride 0x14, no packed struct.
 * Widths: BYTE stores (C6/88). DWORD ESI load / ADD ESP,8 / ADD ESI,18h. No 66.
 * jcc: JZ 74, JL 7C signed, JLE 7E signed, JNZ 75. No JA/JG. No setcc. No jump table.
 * lea 1D280C4h[edx*4] DEAD (xor eax,eax follows). scripted_invuln_flag ALWAYS written.
 * EAX leftover: slot*0xD0 if jle skip, else last Battle_UpdateDamage.
 */

extern unsigned char byte_1D28E2E[2];           /* 0x1D28E2E selected finisher idx at [0] */
extern unsigned char K_RENZOKUKEN_FINISHER[];   /* 0x1CF758C FF8KernelRenzokukenFinisher size 24; hitCount +0x0C */
extern unsigned char unk_1D280C5[];             /* 0x1D280C5 cmd byte of 20-byte records */
extern char ATTACKER_SLOT_ID_1[];               /* 0x1D280C4 BYTE at rec*20 */
extern int dword_1D280CC[];                     /* 0x1D280CC DWORD ptr at rec*20; IDA int[] */
extern unsigned char COMMAND_TYPE_ID;           /* 0x1D27AD9 */
extern unsigned char EQUAL_GAME_OVER_RELATED;   /* 0x1D27ADB */
extern unsigned char ATTACKER_SLOT_ID;          /* 0x1D27AD8 */
extern unsigned char BATTLE_SLOT_DATA[];        /* 0x1D27B10 stride 0xD0; scripted_invuln_flag BYTE +0xC9 */

char __cdecl BattleAction_ResolveAndApplyDamage(int p_target_slot_id);
int __cdecl Battle_UpdateDamage(char p_target_slot_id);

int BattleAction_ResolveRenzokukenFinisherHits(void)
{
    unsigned char finisher_idx;
    unsigned int hit_count;
    unsigned char *scan;
    unsigned int rec;
    unsigned char *list;
    unsigned char attacker_slot;
    unsigned int target_slot;
    unsigned int n;
    int leftover;

    finisher_idx = byte_1D28E2E[0]; /* 8A 1D ; BL */

    /* xor eax,eax; mov al,bl; lea eax,[eax+eax*2]; mov cl, [eax*8+0x1CF7598] */
    hit_count = (unsigned int)K_RENZOKUKEN_FINISHER[(unsigned int)finisher_idx * 24u + 0x0Cu];

    /* EDX=0; EAX=offset unk_1D280C5. loc_48F36F: cmp byte [eax],0FAh / jz loc_48F3E7 */
    rec = 0;
    scan = unk_1D280C5;
    for (;;) {
        if (*scan == 0xFAu)
            break; /* loc_48F3E7: mov eax,edx ; jmp loc_48F381 */
        scan += 0x14; /* add eax, 14h */
        rec++;        /* inc edx */
        if ((int)scan >= (int)0x1D28345) { /* cmp eax,1D28345h ; jl SIGNED 7C */
            rec = 0; /* xor eax,eax : no 0xFA, use record 0 */
            break;
        }
    }

    /* loc_48F381: lea edx,[eax+eax*4] => edx=rec*5, scaled *4 => rec*20 */
    COMMAND_TYPE_ID = 0xF9u;                 /* C6 BYTE, internal cmd (scan was 0xFA) */
    EQUAL_GAME_OVER_RELATED = finisher_idx;  /* 88 BYTE */

    list = (unsigned char *)dword_1D280CC[rec * 5]; /* 8B 34 95 : DWORD at +8 of record */
    /* lea eax, ds:1D280C4h[edx*4] DEAD */
    attacker_slot = (unsigned char)ATTACKER_SLOT_ID_1[rec * 20]; /* 8A 14 95 BYTE +0 */

    target_slot = (unsigned int)list[0]; /* xor eax,eax ; mov al,[esi] */
    ATTACKER_SLOT_ID = attacker_slot;    /* 88 15 BYTE */

    /* lea edx,[eax+eax*2]; lea eax,[eax+edx*4]; shl eax,4 => slot*0xD0 */
    leftover = (int)(target_slot * 0xD0u);

    /* test ecx,ecx ; mov BYTE [eax+0x1D27BD9],cl ; jle loc_48F3E4 SIGNED 7E */
    BATTLE_SLOT_DATA[target_slot * 0xD0u + 0xC9u] = (unsigned char)hit_count;

    if ((int)hit_count <= 0)
        return leftover;

    n = hit_count; /* mov edi,ecx */
    do {
        /* loc_48F3C6: re-read [esi] independently for each callee */
        BattleAction_ResolveAndApplyDamage((int)(unsigned char)list[0]); /* xor ecx,ecx; mov cl,[esi]; push ecx */
        leftover = Battle_UpdateDamage((char)list[0]);                   /* xor edx,edx; mov dl,[esi]; push edx */
        /* add esp, 8 covers both cdecl args */
        list += 0x18; /* add esi, 18h : G09 event stride */
    } while (--n != 0); /* dec edi ; jnz */

    return leftover;
}
```
