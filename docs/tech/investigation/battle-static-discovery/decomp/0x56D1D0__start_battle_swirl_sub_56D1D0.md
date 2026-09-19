# start_battle_swirl_sub_56D1D0 @ 0x56D1D0

- Instr (live): 41
- Mode: 1+V
- Verdict: CERTAIN (monté depuis A=LIKELY) — one-shot prouvé : latch battle_swirl_dword_1CFF6F4 armé par BattleSwirl_ArmOneShot @0x47CF50, gate IS_BATTLE_PAUSED==0, effacé 0x47D1EA-ED juste après l'appel ; 1 seule xref code (0x47D1E5), zéro data xref ; dword_209ADE8 = handle/tête du bloc ressources (9 readers, écrit par Alloc @0x56D324, zéro par Release @0x56D79E) ; retour EAX non contractuel (ignoré par le caller)
- Palier: high
- Revue semantic-triple 2026-09-19: C re-dérivé de l'ASM (pack `tools/_tmp_semantic_triple/0x56d1d0/`), A==V sur le rôle, questions ouvertes de A closes par V (dumps lecture seule)
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=246
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=490
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=534
- A==B: non
- Push IDB: [glm-triple 2026-09-13] déjà présent ; append-only `[semantic-triple 2026-09-19]` + save_database (commentaire V conservé)
- SetType: int __cdecl start_battle_swirl_sub_56D1D0(int, int, int, int, int, int)
- Notes parent: ADE8==0 → Alloc, jnz ret EAX. Capture 4 args. BYTE color 0x55FFFFFF sur slot arg_C, ESI original. Submit 7 args. add esp,2Ch. Occupancy absente.

## C réconcilié

```c
/* start_battle_swirl_sub_56D1D0 @ 0x56D1D0
 * Ground truth = live ASM (asm.asm) + ida_dump_bytes, not Hex-Rays.
 * 41 instr, size 0x62, range 0x56D1D0-0x56D232. cdecl, 6 DWORD args. Saved EBX EBP ESI EDI. retn (C3), no sub esp.
 * Callees: BattleSwirl_AllocCaptureResources @ 0x56D240 int() 0 args (0x20000 arena + 2 draw-lists type 14);
 *         BattleSwirl_CaptureFrame @ 0x56D390 void __cdecl(int,int,int,int) (locks/composite/unlocks + Alt22/23 iff engine+0xBA8==0);
 *         BattleSwirl_SubmitOverlayQuad @ 0x56D5F0 int __cdecl(int x7) (textured quad + RS 0x0E + walk ADE8; expand iff arg).
 * add esp,2Ch ONCE after Submit = 44 = 16 leftover CaptureFrame + 28 Submit (11 dwords).
 * dword_209ADE8 @ 0x209ADE8 DWORD global. Occupancy / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: ABSENT.
 * Caller unique 0x47D1E5 FFBattleModule. No domain:: / main:: / presentation:: in C body.
 */

extern int dword_209ADE8;
int BattleSwirl_AllocCaptureResources(void);
void __cdecl BattleSwirl_CaptureFrame(int, int, int, int);
int __cdecl BattleSwirl_SubmitOverlayQuad(int, int, int, int, int, int, int);

int __cdecl start_battle_swirl_sub_56D1D0(int arg_0, int arg_4, int arg_8, int arg_C, int arg_10, int arg_14)
{
    int orig_arg_C;
    int z;
    int expand;

    if (dword_209ADE8 == 0)                    /* 56D1D0 test/jnz loc_56D1E2 */
    {
        int alloc_eax = BattleSwirl_AllocCaptureResources();  /* 56D1D9 */
        if (alloc_eax != 0)                    /* 56D1DE test/jnz locret_56D231: early ret, saved regs not pushed yet */
            return alloc_eax;
    }

    orig_arg_C = arg_C; /* ESI (56D1ED): original arg_C survives the BYTE stores into the stack slot */
    BattleSwirl_CaptureFrame(arg_0, arg_4, arg_8, orig_arg_C);  /* 56D1F6..FA pushes esi,edi,ebx,ebp cdecl */

    z = arg_10;                                /* EDX (56D1FF) snapshot BEFORE the color stores */
    *((unsigned char *)&arg_C + 2) = 0xFF;     /* 56D205 88 BYTE */
    *((unsigned char *)&arg_C + 1) = 0xFF;     /* 56D209 88 BYTE */
    *((unsigned char *)&arg_C + 0) = 0xFF;     /* 56D20D 88 BYTE */
    expand = arg_14;                           /* EAX (56D211) interleaved between store +0 and store +3 */
    *((unsigned char *)&arg_C + 3) = 0x55;     /* 56D215 C6 BYTE -> DWORD LE 0x55FFFFFF in caller arg_C slot */
    /* 56D21A 8B reload ecx = 0x55FFFFFF after the four BYTE stores */

    return BattleSwirl_SubmitOverlayQuad(      /* 56D21E..25 pushes eax,ecx,edx,esi,edi,ebx,ebp cdecl */
        arg_0, arg_4, arg_8, orig_arg_C, z, arg_C, expand);
    /* 56D22A add esp,2Ch once; 56D22D..30 pop edi,esi,ebp,ebx; 56D231 retn. Fall-through ret = EAX of Submit. */
}
```

## Preuves et validation parent

1. `dword_209ADE8` (0x209ADE8, DWORD) testé à `56D1D2` (`test eax,eax`), `jnz loc_56D1E2` : si ≠0, l'alloc est skippée. Lecture unique de la globale dans ce corps ; le "walk ADE8" est dans `BattleSwirl_SubmitOverlayQuad` (callees.txt, cmt IDA).
2. `BattleSwirl_AllocCaptureResources` @ 0x56D240 (call `56D1D9`, 0 args, proto int() — glm_meta.json callee_lookup) ; `test eax,eax` à `56D1DE` + `jnz locret_56D231` : EAX ≠0 → early return, registres EBX/EBP/ESI/EDI pas encore poussés.
3. Épargnes : `push ebx/ebp/esi/edi` `56D1E2..F1`, chargements `EBX=arg_4`, `EBP=arg_0`, `ESI=arg_C`, `EDI=arg_8` (offsets `[esp+N+arg_x]`, stack frame meta.json : 6 DWORD args, arg_0@0x4 … arg_14@0x18).
4. `BattleSwirl_CaptureFrame` @ 0x56D390 (call `56D1FA`, proto `void __cdecl(int,int,int,int)` — glm_meta.json) : pushes `56D1F6..F9` esi,edi,ebx,ebp → ordre C (arg_0, arg_4, arg_8, ESI=arg_C original). Non self-cleaning ; EAX écrasé ensuite.
5. Couleur : `mov al,0FFh` (`56D203`) puis stores BYTE `88` sur slot stack arg_C +2/+1/+0 (`56D205/09/0D`), intercalé `mov eax,[esp+20h+arg_14]` (`56D211`), store BYTE `C6` +3 = 0x55 (`56D215`), reload DWORD `8B` ECX (`56D21A`) → 0x55FFFFFF en LE. ESI conserve l'arg_C original.
6. `BattleSwirl_SubmitOverlayQuad` @ 0x56D5F0 (call `56D225`, proto `int __cdecl(int x7)` — glm_meta.json) : pushes `56D21E..24` eax,ecx,edx,esi,edi,ebx,ebp → ordre C (arg_0, arg_4, arg_8, orig_C, arg_10, couleur, arg_14). Cmt IDA : textured quad + RS 0x0E + walk ADE8 ; expand iff arg.
7. `add esp,2Ch` unique à `56D22A` = 44 = 16 (4 DWORDs CaptureFrame non nettoyés) + 28 (7 DWORDs Submit), puis `pop edi,esi,ebp,ebx` `56D22D..30`, `retn` `56D231`. Retour fall-through = EAX de Submit (aucun `mov eax` après le call).
8. Caller unique : xref code `0x47D1E5` `main::FFBattleModule` (callers.txt, `more:false`). Les portes pause + arm-latch (0x1CFF6F4) et le `setz` arg_14 sont dans le caller ; ce corps ne lit ni ne clear le latch.
- Risque: le slot stack arg_C est muté en couleur — tout lecteur ultérieur du DWORD arg_C original doit passer par un registre (ESI), fidèle à l'ASM.
