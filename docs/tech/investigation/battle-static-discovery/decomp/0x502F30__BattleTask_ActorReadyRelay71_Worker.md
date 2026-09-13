# BattleTask_ActorReadyRelay71_Worker @ 0x502F30

- Instr (live): 32
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=81
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=153
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=86
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleTask_ActorReadyRelay71_Worker(int)
- Notes parent: parent=[child+0x10]; slot=movsx WORD [parent+8]; stride slot*39*4=156 (0x9C) pas 0xD0. BYTE 8A test cl,2 (pas occupancy 1+2). jz loc_502F6C si bit clair ou sub_508540(actor,0x1A,0x40) EAX=0 add esp 0Ch; sinon EAX=0. Callback [parent+4] cdecl 1 arg slot, add esp 4. BYTE [parent+1]=0xFF. EAX=2. Pas de 66/setcc/ja/jpt.

## C réconcilié

```c
/* BattleTask_ActorReadyRelay71_Worker @ 0x502F30
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 32 instr, size 0x58, end 0x502F88. IDA type int __cdecl(int).
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 unused. GetRandomInt absent.
 * Stride: ecx=slot*39 then [ecx*4] = 156*slot (0x9C). BYTE 8A at 0x1D972C0, test cl,2.
 * jz loc_502F6C if bit clear OR sub_508540 EAX==0. Else return 0.
 * Callback DWORD [parent+4] cdecl 1 arg (movsx WORD slot), add esp 4. BYTE [parent+1]=0xFF. EAX=2.
 * No Hex-Rays. No domain::.
 */

extern unsigned char g_BattlePresentationActors[]; /* 0x1D972C0 */
extern int __cdecl sub_508540(int actor_base, int mask_1a, unsigned __int16 mask_40);

int __cdecl BattleTask_ActorReadyRelay71_Worker(int child_node)
{
    int parent;
    int slot;
    unsigned char *actor_base;
    int callback;

    parent = *(int *)((char *)child_node + 0x10); /* ESI = DWORD [child+0x10] */
    slot = *(short *)((char *)parent + 8);       /* movsx EAX, WORD [parent+8] */

    /* lea ecx,[eax+eax*4]; shl 3; sub ecx,eax; lea eax,[ecx*4+0x1D972C0] */
    actor_base = &g_BattlePresentationActors[(slot * 39) * 4];

    if ((actor_base[0] & 2) != 0) {
        /* push 40h; push 1Ah; push eax; call sub_508540; add esp,0Ch */
        if (sub_508540((int)actor_base, 0x1A, 0x40) != 0)
            return 0; /* xor eax,eax */
    }

    callback = *(int *)((char *)parent + 4);
    if (callback != 0)
        ((void (__cdecl *)(int))callback)(slot); /* add esp,4; EAX discarded */

    *((unsigned char *)parent + 1) = 0xFF; /* C6 46 01 FF on PARENT */
    return 2;
}
```
