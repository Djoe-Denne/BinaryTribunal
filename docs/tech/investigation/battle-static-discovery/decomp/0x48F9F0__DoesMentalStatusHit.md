# DoesMentalStatusHit @ 0x48F9F0

- Instr (live): 136
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=7621 (1er essai auto/0: fence_found=false finish_reason=length rt=8000 C vide; retry --effort high --max-tokens 65536)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=5140
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=4249
- A==B: non
- Push IDB: oui
- SetType: int __cdecl DoesMentalStatusHit(int p_attacker_slot_id, unsigned int p_target_slot_id, int p_index, int p_mask, int p_status_list_to_check, int p_attacker_str, int p_target_vit, int p_hit_attack_enabler)
- Notes parent: stride 0xD0 lea/shl, pas F_CHAR 0x1D0, pas occupancy 1+2; GetRandomInt AL + and 0xFF; WORD 66 status_1 / DWORD status_2 / BYTE mental_res; jnb unsigned >=200; jle signed P<=0; jge signed enabler>=250 et slot>=3; jb unsigned chance<rand; 255*P/100 puis 255*x/255 sans saturate 8-bit; p_attacker_slot_id mort; status_2 OR+Init, status_1 OR WORD sans timer.

## C réconcilié

```c
/* DoesMentalStatusHit @ 0x48F9F0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 136 instr, size 0x1AE. End 0x48FB9E. IDA type int __cdecl(int, unsigned int, int, int, int, int, int, int).
 * No domain::. p_attacker_slot_id unread. EAX = 0 (xor) or 1 (mov).
 * Slot stride 0xD0 lea/shl. No F_CHAR 0x1D0. No occupancy 1+2 (not in ASM).
 * GetRandomInt AL only then and 0xFF. No setcc. WORD status_1 (66), DWORD status_2.
 * jnb unsigned mental_res>=200; jle signed P<=0; jge signed enabler>=250 and slot>=3;
 * jb unsigned chance<rand. status_2 OR + InitForBit; status_1 OR WORD no timer.
 */

extern unsigned char BATTLE_SLOT_DATA[]; /* 0x1D27B10 stride 0xD0 */
extern unsigned char unk_1D28E29;       /* 0x1D28E29 BYTE */

extern unsigned char __cdecl Battle_GetRandomInt(void); /* AL only; 0 args, no add esp */
extern int __cdecl StatusTimer_DisableForBit(int slot_id, unsigned int status2_bit_mask); /* add esp,8 */
extern int __cdecl StatusTimer_InitForBitFromKernelMisc(int slot_id, unsigned int status2_bit_mask); /* add esp,8 */

int __cdecl DoesMentalStatusHit(int p_attacker_slot_id, unsigned int p_target_slot_id,
                                 int p_index, int p_mask, int p_status_list_to_check,
                                 int p_attacker_str, int p_target_vit, int p_hit_attack_enabler)
{
    unsigned int off;   /* esi = slot*0xD0 */
    unsigned int mask; /* ebx */
    unsigned int st2;
    unsigned short st1;
    int enabler;        /* edi, signed cmps */
    int p;
    int chance;
    unsigned int rnd;

    (void)p_attacker_slot_id; /* never loaded */

    /* lea eax,[ecx+ecx*2]; lea esi,[ecx+eax*4]; shl esi,4 */
    off = p_target_slot_id * 0xD0u;
    mask = (unsigned int)p_mask;

    /* existing bit: list==0 WORD status_1 +0x80 @ 0x1D27B90; else DWORD status_2 +0x08 @ 0x1D27B18 */
    if (p_status_list_to_check == 0) {
        /* xor edx,edx; 66 8B 96 90 7B D2 01; test ebx,edx; jz loc_48FA2E */
        if (mask & (unsigned int)*(unsigned short *)(BATTLE_SLOT_DATA + off + 0x80))
            return 0; /* loc_48FA19 */
    } else {
        /* 85 9E 18 7B D2 01; jnz loc_48FA19 */
        if (*(unsigned int *)(BATTLE_SLOT_DATA + off + 0x08) & mask)
            return 0;
    }

    enabler = p_hit_attack_enabler;
    if (enabler != 255) { /* cmp edi,0FFh / jz loc_48FAE1; ecx still = slot */
        unsigned int res;

        /* 8A 8C 0E A0 7B D2 01; cmp cl,0C8h; jnb fail; and ecx,0FFh */
        res = (unsigned int)BATTLE_SLOT_DATA[off + 0x90 + p_index];
        if (res >= 200u)
            return 0;

        /* signed /4: cdq; and edx,3; add; sar,2  for str then vit */
        p = enabler + (p_attacker_str / 4) - (p_target_vit / 4) - (int)res;
        /* lea edx,[eax+12Ch]; cmp edx,12Ch; jle fail */
        if (p <= 0)
            return 0;

        if (enabler < 250) { /* cmp edi,0FAh / jge loc_48FADD signed */
            /* 255*P via shl 8/sub; imul 51EB851Fh; sar 5 + sign -> 255*P/100 */
            chance = (255 * p) / 100;
            /* 255*x via shl 8/sub; imul 80808081h; add edx,ecx; sar 7 + sign -> 255*x/255; no 8-bit store */
            chance = (255 * chance) / 255;

            /* call 0x48F020; 25 FF 00 00 00 */
            rnd = (unsigned int)Battle_GetRandomInt() & 0xFFu;
            if (chance == 0) /* test edi,edi / jz */
                return 0;
            if ((unsigned int)chance < rnd) /* cmp edi,eax / jb unsigned */
                return 0;
        }
        /* loc_48FADD: mov ecx, p_target_slot_id */
    }

    /* loc_48FAE1 */
    if (p_status_list_to_check == 0) {
        /* BYTE unk_1D28E29==0 AND BYTE status_1 bit 0x40 AND bl&1 -> fail */
        if (unk_1D28E29 == 0
            && (BATTLE_SLOT_DATA[off + 0x80] & 0x40u)
            && (mask & 1u))
            return 0;

        st2 = *(unsigned int *)(BATTLE_SLOT_DATA + off + 0x08);
        /* Angel Wing 0x02000000 AND bl&0x30 Silence|Berserk */
        if ((st2 & 0x02000000u) && (mask & 0x30u))
            return 0;

        /* test ah,4 (st2&0x400) AND bl&0x40 Zombie: and ah,0FBh; DWORD store; DisableForBit(slot, 0x400) */
        if ((st2 & 0x400u) && (mask & 0x40u)) {
            st2 &= ~0x400u;
            *(unsigned int *)(BATTLE_SLOT_DATA + off + 0x08) = st2;
            StatusTimer_DisableForBit((int)p_target_slot_id, 0x400u);
        }

        /* 66 09 9E 90 7B D2 01  OR WORD with BX */
        *(unsigned short *)(BATTLE_SLOT_DATA + off + 0x80) |= (unsigned short)mask;
        return 1;
    }

    /* loc_48FB4B */
    st1 = *(unsigned short *)(BATTLE_SLOT_DATA + off + 0x80); /* 66 8B 86 */
    /* test bh,8 (mask&0x800); cmp ecx,3 / jge signed party-only */
    if ((mask & 0x800u) && (int)p_target_slot_id >= 3)
        return 0;
    /* test al,40h AND test bh,4 */
    if ((st1 & 0x40u) && (mask & 0x400u))
        return 0;

    st2 = *(unsigned int *)(BATTLE_SLOT_DATA + off + 0x08);
    /* Angel Wing AND test bh,40h (mask&0x4000 Confuse) */
    if ((st2 & 0x02000000u) && (mask & 0x4000u))
        return 0;

    st2 |= mask;
    *(unsigned int *)(BATTLE_SLOT_DATA + off + 0x08) = st2;
    StatusTimer_InitForBitFromKernelMisc((int)p_target_slot_id, mask); /* push ebx; push ecx; add esp,8 */
    return 1;
}
```
