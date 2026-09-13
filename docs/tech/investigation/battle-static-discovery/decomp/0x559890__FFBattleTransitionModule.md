# FFBattleTransitionModule @ 0x559890

- Instr (live): 41
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=30
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=41
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=26
- A==B: non
- Push IDB: oui
- SetType: int __cdecl FFBattleTransitionModule(int arg_0)
- Notes parent: TEST bossBattle / JNZ RunBoss sinon RunNormal ; add esp,8 partagé. Run* EAX==0 → INC+A3 transitionTimer et return nouvelle valeur. Done: 7 DWORD locaux, stores DWORD seulement [ebp-14..-4] (init/exit/FFBattleModule/0/dword_204E2E4) ; +0/+4 jamais écrits. EAX leftover = SwitchModule. Occupancy / 0xD0 / 0x1D0 / 0x44 absents.

## C réconcilié

```c
/* FFBattleTransitionModule @ 0x559890
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 41 instr, size 0x7b, end 0x55990b. cdecl, 1 arg, saved ESI. sub esp,1Ch. Two C3.
 * Callees cdecl: BattleTransition_RunNormal/RunBoss(timer, arg_0) share add esp,8
 *   (push esi before jnz + timer push in each arm). FFSwitchModule_set_game_loop
 *   (&desc, arg_0) add esp,8. EAX leftover = callee result on the done path.
 * bossBattle DWORD 0x204DB20 TEST/JNZ: 0 → RunNormal, NZ → RunBoss.
 * Run* EAX==0 JZ loc_5598FB: INC+A3 transitionTimer 0x204E2E8, return new value.
 * Done: DWORD stores into 0x1C local at ebp-1Ch; +0/+4 never written.
 *   [ebp-14]=FFBattleInitSystem 0x47CE10, [ebp-10]=FFBattleExitSystem 0x47CEF0,
 *   [ebp-0C]=FFBattleModule 0x47CF60, [ebp-8]=0, [ebp-4]=dword_204E2E4.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No domain:: / main::. Callers: data xrefs FFModuleHandler_main_loop.
 */

extern int bossBattle;
extern int transitionTimer;
extern int dword_204E2E4;

int __cdecl BattleTransition_RunNormal(int timer, int arg_0);
int __cdecl BattleTransition_RunBoss(int timer, int arg_0);
int __cdecl FFSwitchModule_set_game_loop(const void *desc, int arg_0);
int FFBattleInitSystem(void);
void __cdecl FFBattleExitSystem(void *);
int __cdecl FFBattleModule(int game_object);

int __cdecl FFBattleTransitionModule(int arg_0)
{
    int desc[7]; /* ebp-1Ch, 0x1C bytes. desc[0]/desc[1] never stored here. */
    int done;

    if (bossBattle == 0)
        done = BattleTransition_RunNormal(transitionTimer, arg_0);
    else
        done = BattleTransition_RunBoss(transitionTimer, arg_0);

    if (done == 0)
    {
        transitionTimer = transitionTimer + 1; /* INC then A3 */
        return transitionTimer;
    }

    desc[2] = (int)FFBattleInitSystem;  /* C7 45 EC DWORD [ebp-14h] */
    desc[3] = (int)FFBattleExitSystem;  /* C7 45 F0 DWORD [ebp-10h] */
    desc[4] = (int)FFBattleModule;      /* C7 45 F4 DWORD [ebp-0Ch] */
    desc[5] = 0;                      /* C7 45 F8 DWORD [ebp-08h] */
    desc[6] = dword_204E2E4;          /* 89 55 FC DWORD [ebp-04h] */
    return FFSwitchModule_set_game_loop(desc, arg_0);
}
```
