# Battle_QueueReflectedActionIfNeeded @ 0x493110

- Instr (live): 43
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=8
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=8
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=8
- A==B: non
- Push IDB: oui
- SetType: bool __cdecl Battle_QueueReflectedActionIfNeeded(int attacker_slot_id, int target_slot_id)
- Notes parent: slot*0xD0 ; occupancy 1+2 / F_CHAR 0x1D0 absents ; GetRandomInt absent ; cmd 0xF7 jz ; ATTACK_FLAG BYTE 0x10 ; status_2 BYTE +0x08 Reflect 0x80 ; bounce DCC/DCD/DCE[idx*3] ; flag_data DWORD +0x7C `or dh,40h` / `and dh,0BFh` ; HIT_TYPE_2|=4 ; byte_1D27ADD|=0x31 ; EAX 1 queued / 0 clear ; jz only ; pas de 66/setcc/ja/jg ; attacker unused

## C réconcilié

```c
/* Battle_QueueReflectedActionIfNeeded @ 0x493110
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 43 instr, size 0xA4. End 0x4931B4. IDA type bool __cdecl(int, int).
 * No domain::. Slot stride 0xD0. Occupancy 1+2 unused. F_CHAR 0x1D0 unused.
 * GetRandomInt unused (no call). No setcc. No ja/jg (jz only). No 66 / no WORD.
 * Bounce: DCC/DCD/DCE[idx*3] not DCD[idx*3+1]. flag_data DWORD +0x7C bit 0x4000.
 * attacker_slot_id unused. Target stride uses full EDX; bounce stores DL only.
 */

extern unsigned char COMMAND_TYPE_ID;                         /* 0x1D27AD9 BYTE */
extern unsigned char ATTACK_FLAG;                             /* 0x1D28E0E BYTE */
extern unsigned char BACK_PREEMTIVE_INFO_3;                   /* 0x1D28E0B BYTE (IDA spelling) */
extern unsigned char CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID; /* 0x1D27AF4 WORD, BYTE read */
extern unsigned char HIT_TYPE_2;                              /* 0x1D27ADE BYTE */
extern unsigned char byte_1D27ADD;                            /* 0x1D27ADD BYTE */
extern unsigned char byte_1D28DCC[];                          /* 0x1D28DCC */
extern unsigned char byte_1D28DCD[];                          /* 0x1D28DCD */
extern unsigned char byte_1D28DCE[];                          /* 0x1D28DCE */
extern unsigned char BATTLE_SLOT_DATA[];                      /* 0x1D27B10 stride 0xD0 */

bool __cdecl Battle_QueueReflectedActionIfNeeded(int attacker_slot_id, int target_slot_id)
{
    unsigned char cmd;
    unsigned char idx;
    int slot_off;

    (void)attacker_slot_id; /* [esp+4] never read; EDX = [esp+8] target */

    cmd = COMMAND_TYPE_ID;

    /* cmp bl,0F7h ; jz loc_49319A
     * test ATTACK_FLAG,10h ; jz loc_49319A
     * lea/shl target*0xD0 ; test BYTE status_2+0x08,80h Reflect ; jz loc_49319A */
    if (cmd != 0xF7 && (ATTACK_FLAG & 0x10) != 0) {
        slot_off = target_slot_id * 0xD0; /* lea eax,[edx+edx*2]; lea ecx,[edx+eax*4]; shl ecx,4 */
        if ((BATTLE_SLOT_DATA[slot_off + 0x08] & 0x80) != 0) {
            /* xor eax,eax ; mov al, BACK_PREEMTIVE_INFO_3 ; stores [eax+eax*2] */
            idx = BACK_PREEMTIVE_INFO_3;
            byte_1D28DCC[idx * 3] = cmd;
            byte_1D28DCD[idx * 3] = CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID;
            byte_1D28DCE[idx * 3] = (unsigned char)target_slot_id; /* DL */
            /* re-read AL, inc al, store BYTE (8-bit wrap) */
            BACK_PREEMTIVE_INFO_3 = (unsigned char)(BACK_PREEMTIVE_INFO_3 + 1);

            /* dword ptr flag_data+0x7C ; or dh,40h  (no 66) */
            *(unsigned int *)&BATTLE_SLOT_DATA[slot_off + 0x7C] |= 0x4000u;

            /* mov cl,HIT_TYPE_2 ; mov al,byte_1D27ADD ; or cl,4 ; or al,31h ; stores */
            HIT_TYPE_2 |= 4;
            byte_1D27ADD |= 0x31;

            return 1; /* mov eax,1 */
        }
    }

loc_49319A:
    /* recompute target*0xD0 from EDX (still original target on all jz paths) */
    slot_off = target_slot_id * 0xD0;
    /* lea eax,flag_data[ecx] ; mov edx,[eax] ; and dh,0BFh ; mov [eax],edx */
    *(unsigned int *)&BATTLE_SLOT_DATA[slot_off + 0x7C] &= ~0x4000u;
    return 0; /* xor eax,eax */
}
```
