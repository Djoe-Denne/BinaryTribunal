# BattleArbitration_SelectNextAction @ 0x485460

- Instr (live): 124
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=2479
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=4927
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=6609 (retry high/65536 after length+empty)
- A==B: non
- Push IDB: oui
- SetType: char *BattleArbitration_SelectNextAction(void)
- Notes parent: BYTE stores avant jnz busy; cell *24 @ 0x1D288E8 ; slot *0xD0 ; occupancy WHEN=cl groupes 0-2, skip Petrify/Sleep/Stop seulement groupes 1+2 ; jl/jge signes ; add esp 8/4/8/4/4 ; 484050 ESI usercall ; leftover EAX.

## C réconcilié

```c
/* BattleArbitration_SelectNextAction @ 0x485460
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 124 instr, size 0x182. IDA type char *() — leftover EAX, no mov eax before retn.
 * Occupancy global WHEN_DOING_SOMETHING_VALUE_IS_1 written per group (0,1,2);
 * Petrify/Sleep/Stop skip only when that byte != 0 (groups 1+2).
 */

extern unsigned int   dword_1D27B00;                 /* 0x1D27B00 BATTLE_ACTION_EXECUTION_ACTIVE */
extern unsigned char  byte_1D28E04;                  /* BYTE */
extern unsigned char  AI_PREPARE_SUMMON_FLAG;        /* 0x1D28E06 BYTE */
extern unsigned char  WHEN_DOING_SOMETHING_VALUE_IS_1; /* 0x1D28DF2 occupancy group BYTE */
extern unsigned char  ATTACKER_SLOT_ID_0;            /* 0x1D28DF8 BYTE */
extern unsigned char  byte_1D28E02;                  /* BYTE node */
extern unsigned char  AI_CURRENT_EXECUTING_SLOT;     /* 0x1D27B0F BYTE */
extern unsigned char  byte_1D28E0C;                  /* BYTE */
extern unsigned char  byte_1D28E1C;                  /* BYTE */
extern unsigned char  unk_1D28E25;                   /* 0x1D28E25 BYTE */
extern unsigned char  stru_1D28864[];                /* 0x1D28864 links; +0 prev, +1 next, stride 4 */
extern unsigned char  BATTLE_EXEC_QUEUE_BYTES[];     /* 0x1D288E8 cells / group-scan end */
extern unsigned char  BATTLE_SLOT_DATA[];            /* 0x1D27B10 stride 0xD0; status_1 +0x80, status_2 +0x08 */

extern int  __cdecl EnemyAI_PrepareTurnAction(int queue_slot, int sub_index); /* add esp 8 */
extern int  __cdecl BattleExecQueue_ConsumeCurrentSlot(int queue_slot);       /* add esp 4 */
extern char __cdecl sub_483FC0(int p_slot_id);                                 /* + sub_484050 cleaned add esp 8 */
extern char         sub_484050(int a1_esi, int p_slot_id); /* usercall AL; a1 @<esi> not in add esp */
extern int          EnemyAI_CountAlivePartyMembers(void);  /* 0 args; EAX leftover slot or 0xFF */
extern int          EnemyAI_CountAliveMonsters(void);      /* 0 args; EAX leftover slot or 0xFF */
extern char __cdecl sub_4840E0(int param_slot_id);         /* add esp 4; AL then overwritten */
extern int  __cdecl BattleState_SetPhaseFlag(int phase);   /* add esp 4; push 8 */

char *BattleArbitration_SelectNextAction(void)
{
    unsigned int group;           /* ECX */
    unsigned int node;            /* EBX */
    unsigned int var_4;           /* DWORD group*11 */
    unsigned char *grp;           /* EBP link-group base */
    unsigned char *cell;          /* ESI cell @ 0x1D288E8 + idx*24 */
    unsigned int edi11;           /* EDI = group*11 */
    unsigned int attacker;        /* EAX zero-ext BYTE [esi] */
    int sub;                      /* ESI reused loc_485553 */

    /* mov eax, dword_1D27B00 ; xor ecx,ecx ; cmp eax,ecx */
    group = 0;
    attacker = dword_1D27B00;

    /* BYTE stores run even if the later jnz fires */
    byte_1D28E04 = 0;
    AI_PREPARE_SUMMON_FLAG = 0;

    if (attacker != 0)            /* jnz loc_4855DC */
        return (char *)attacker;  /* leftover EAX = dword_1D27B00 */

    var_4 = 0;                    /* mov [esp+14h+var_4], ecx */
    grp = stru_1D28864;           /* 0x1D28864 */

    for (;;) {
        /* loc_48548B */
        WHEN_DOING_SOMETHING_VALUE_IS_1 = (unsigned char)group; /* cl */
        ATTACKER_SLOT_ID_0 = 0;

        node = 0;
        attacker = (unsigned int)(unsigned char *)grp;
        /* loc_48549C: head = prev_index BYTE == 0xFF */
        while (*(unsigned char *)attacker != 0xFF) {
            node++;
            attacker += 4;
            if ((int)node < 0x0B)     /* cmp ebx,0Bh ; jl loc_48549C */
                continue;
            goto loc_485513;          /* no head */
        }

        /* loc_4854AC: edi = (ecx & 0xFF)*11 */
        edi11 = (group & 0xFF) * 11;

        for (;;) {
            unsigned int idx;
            unsigned int off;

            /* loc_4854B9 */
            idx = edi11 + node;
            byte_1D28E02 = (unsigned char)node;
            /* lea eax,[eax+eax*2] ; lea esi,1D288E8h[eax*8] */
            cell = BATTLE_EXEC_QUEUE_BYTES + idx * 24;

            attacker = cell[0];       /* xor eax,eax ; mov al,[esi] */
            if (attacker == 0xFF)
                goto loc_4854FC;

            /* groups 1+2 only: test dl,dl ; jz loc_485533 */
            if (WHEN_DOING_SOMETHING_VALUE_IS_1 != 0) {
                /* slot*0xD0: lea edx,[eax+eax*2] ; lea eax,[eax+edx*4] ; shl eax,4 */
                off = attacker * 0xD0;
                /* test BYTE [eax+0x1D27B90],4 Petrify */
                if (BATTLE_SLOT_DATA[off + 0x80] & 4)
                    goto loc_4854FC;
                /* test BYTE [eax+0x1D27B18],9 Sleep|Stop ; jz loc_485533 */
                if (BATTLE_SLOT_DATA[off + 0x08] & 9)
                    goto loc_4854FC;
            }
            break;                    /* loc_485533 */

        loc_4854FC:
            /* eax = var_4+ebx ; xor ebx,ebx ; mov bl, next_index[eax*4] @ 0x1D28865 */
            node = stru_1D28864[(var_4 + node) * 4 + 1];
            if (node != 0xFF)         /* jnz loc_4854B9 */
                continue;
            goto loc_485513;
        }

        /* loc_485533 */
        if (cell[1] == 0xFF) {
            EnemyAI_PrepareTurnAction((int)node, 0);          /* push 0 ; push ebx ; add esp,8 */
            return (char *)BattleExecQueue_ConsumeCurrentSlot((int)node); /* add esp,4 ; leftover */
        }

        /* loc_485553: xor esi,esi ; loc_485555: push esi ; push ebx */
        sub = 0;
        for (;;) {
            if (EnemyAI_PrepareTurnAction((int)node, sub) != 0)
                goto loc_4855D3;      /* jnz skip 4855A0 */

            sub_483FC0((unsigned char)AI_CURRENT_EXECUTING_SLOT);
            sub_484050(sub, (unsigned char)AI_CURRENT_EXECUTING_SLOT); /* ESI = sub */

            if (EnemyAI_CountAlivePartyMembers() == 0xFF)
                break;                /* jz loc_4855A0 */
            if (EnemyAI_CountAliveMonsters() == 0xFF)
                break;                /* jz loc_4855A0 */

            sub++;
            if (sub < 2)              /* cmp esi,2 ; jl loc_485555 */
                continue;
            break;                    /* fall through loc_4855A0 */
        }

        /* loc_4855A0: xor eax,eax ; BYTE byte_1D28E0C=0 ; mov al, slot ; push eax */
        byte_1D28E0C = 0;
        sub_4840E0((unsigned char)AI_CURRENT_EXECUTING_SLOT);
        /* mov al, byte_1D28E1C AFTER the call ; add esp,4 ; test al,al */
        if (byte_1D28E1C == 0 && unk_1D28E25 == 0)
            BattleState_SetPhaseFlag(8);

    loc_4855D3:
        return (char *)BattleExecQueue_ConsumeCurrentSlot((int)node);

    loc_485513:
        var_4 += 0x0B;
        grp += 0x2C;                  /* 11*4 */
        group++;
        if ((int)grp >= (int)BATTLE_EXEC_QUEUE_BYTES) /* jge loc_4855DC */
            return (char *)grp;       /* leftover EAX stale; IDA char *() */
        /* jmp loc_48548B */
    }
}

```
