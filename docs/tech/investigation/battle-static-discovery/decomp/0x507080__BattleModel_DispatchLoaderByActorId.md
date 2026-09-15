# BattleModel_DispatchLoaderByActorId @ 0x507080

- Instr (live): 47
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=11
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1035
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=11
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleModel_DispatchLoaderByActorId(int actor_id, unsigned char p_task_byte_0F, int p_task_dword_10)
- Notes parent: jge signé 16 et 0x1000. sub ebx,1000h live; BL après soustraction. 4103 loc_507117 skip Register. loc_5070EB partagé ebx==1 jz et ebx==9 fallthrough. Stores BYTE +0xC/D/E/F DWORD +0x10. Copy 0x14. Occupancy 1+2 / slot 0xD0 / actor 0x9C / F_CHAR 0x1D0 absents. Pas de 66/setcc/jpt. Pas de Hex-Rays. Pas de struct packée.

## C réconcilié

```c
/* BattleModel_DispatchLoaderByActorId @ 0x507080
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 47 instr, size 0x99, end 0x507119. IDA TYPE None. cdecl, 3 args, retn C3.
 * push ebx only. add esp,10h after BS_Memset; add esp,8 after BdLinkTask_Register.
 * jge SIGNED (7D) after cmp 10h and cmp 1000h. No ja/jg, no setcc, no 66, no jpt_.
 * Occupancy 1+2 / slot 0xD0 / actor 0x9C / F_CHAR 0x1D0: absent.
 * Widths: BYTE arg_4 load + stores [node+0xC/0xD/0xE/0xF]; DWORD [node+0x10].
 * Live copy size 0x14 (not IDA _DWORD[4]=16). sub ebx,1000h LIVE on weapon path; BL stored after.
 * EAX: BS_Memset on loc_507117 (actor 0x1007); else BdLinkTask_Register node.
 * No packed struct. No domain::.
 */

int __cdecl BS_Memset(int dst, unsigned short *src, unsigned int size, int count);
int __cdecl BdLinkTask_Register(int list_head, int callback);
int __cdecl Battle_isLoadSquallEtc(unsigned char *);
int __cdecl BattleModel_LoadEdeaBodyWithIntegratedWeapon(unsigned char *);
int __cdecl BattleModel_LoadMonster(int);
int __cdecl BattleModel_LoadMonsterDerivedFrom142(int);
int __cdecl BattleModel_LoadPartyWeapon(unsigned char *);
int __cdecl BattleModel_LoadWeaponInlineZellKiros(unsigned char *);

extern unsigned char dword_1D98B40[]; /* list head; live init 0x14 bytes */
extern unsigned char unk_1D999A8[];   /* 0x14-byte template */

int __cdecl BattleModel_DispatchLoaderByActorId(int actor_id, unsigned char p_task_byte_0F, int p_task_dword_10)
{
    int callback;
    int eax_ret;
    unsigned char *node;

    eax_ret = BS_Memset((int)dword_1D98B40, (unsigned short *)unk_1D999A8, 0x14u, 1);

    if (actor_id >= 16)
        goto loc_5070B3;
    if (actor_id == 7)
        goto loc_5070AC;
    callback = (int)Battle_isLoadSquallEtc;
    goto loc_5070F0;

loc_5070AC:
    callback = (int)BattleModel_LoadEdeaBodyWithIntegratedWeapon;
    goto loc_5070F0;

loc_5070B3:
    if (actor_id >= 0x1000)
        goto loc_5070D1;
    if (actor_id != 0x8F)
        goto loc_5070CA;
    callback = (int)BattleModel_LoadMonsterDerivedFrom142;
    goto loc_5070F0;

loc_5070CA:
    callback = (int)BattleModel_LoadMonster;
    goto loc_5070F0;

loc_5070D1:
    actor_id -= 0x1000;
    if (actor_id == 7)
        goto loc_507117;
    if (actor_id == 1)
        goto loc_5070EB;
    callback = (int)BattleModel_LoadPartyWeapon;
    if (actor_id != 9)
        goto loc_5070F0;

loc_5070EB:
    callback = (int)BattleModel_LoadWeaponInlineZellKiros;

loc_5070F0:
    node = (unsigned char *)BdLinkTask_Register((int)dword_1D98B40, callback);
    node[0x0F] = p_task_byte_0F;
    node[0x0C] = (unsigned char)actor_id;
    node[0x0E] = 0;
    node[0x0D] = 0;
    *(int *)(node + 0x10) = p_task_dword_10;
    eax_ret = (int)node;

loc_507117:
    return eax_ret;
}
```
