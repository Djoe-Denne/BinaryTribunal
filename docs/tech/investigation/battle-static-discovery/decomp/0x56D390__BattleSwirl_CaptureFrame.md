# BattleSwirl_CaptureFrame @ 0x56D390

- Instr (live): 139
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1052
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=744
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1163
- A==B: non
- Push IDB: [glm-triple 2026-09-13] déjà présent ; append-only `[semantic-triple 2026-09-19]` + save_database
- SetType: int __cdecl BattleSwirl_CaptureFrame(int start_x, int start_y, int src_w, int src_h)
- Notes parent: C GLM double-deref dword_209ADE8. Lock vtbl+64h 5 stdcall flags 11h/21h. Unlock +80h. Alt 22/23 ssi BA8==0 ET ebp==0. dest arena dword_209AEC8 DWORD. EAX -1/0. Occupancy/0xD0/0x1D0/GF+0x44 absents.
- Mode: 1+V
- Verdict: noyau CERTAIN / résidu LIKELY (contrat wrapper COM E2 +0x64/+0x80, détails sub_4203B2/420476) — V CORRIGE(4) vs A : prototype **4 args correct** (les « 7 slots » = 4 args + 3 champs DDSURFACEDESC2 locaux var_58/var_E8/var_D4) ; wrapper lock = HRESULT standard (DD_ErrorMessage @0x403AF8 retourne 1 si hr==0) ; 0x11=READONLY|WAIT, 0x21=WRITEONLY|WAIT ; [ctx+0xBEC] = flag config DX6 8-bit statique (DD_init 0x40D815/31), PAS un compteur ping-pong
- Revue semantic-triple 2026-09-19: C re-dérivé de l'ASM ; remontée catalogue justifiée : UNCERTAIN → LIKELY

## C réconcilié

```c
/* BattleSwirl_CaptureFrame @ 0x56D390 — revue semantic-triple 2026-09-19
 * Ground truth = live ASM (asm.asm) + ida_dump_bytes, not Hex-Rays.
 * 139 instr, size 0x193, end 0x56D523. IDA type courant: int __cdecl(int,int,int,int)
 * (historique void; EAX est live: or eax,-1 / xor eax,eax => int).
 * cdecl, 4 args start_x/start_y/src_w/src_h (arg_0/arg_4/arg_8/arg_C).
 * Prologue: sub esp,0FC (56d390) puis push ebx,ebp,esi,edi. retn C3. add esp,0FC par épilogue.
 * COM: Lock stdcall 5 args vtable+0x64 (src flags 11h, dest 21h, rect=NULL, hEvent=0);
 *      Unlock stdcall 2 args vtable+0x80 (lpRect=NULL).
 * DD_ErrorMessage cdecl (hr, file, line) add esp,0Ch; Resample256 cdecl 7 args add esp,1Ch;
 *      paire Alt22/23 cdecl add esp,10h.
 * Desc DDSURFACEDESC 0x7C NON packé: dwSize@+0 (DWORD 7Ch), lPitch@+0x10 (var_E8),
 *      lpSurface@+0x24 (var_D4 src / var_58 dest). Stores DWORD only. Pas de 66. Pas de setcc.
 *      Pas de ja/jg (jz/jnz seulement). Pas de jpt_.
 * Occupancy / slot 0xD0 / F_CHAR 0x1D0 / GF Exists +0x44: absents. Pas de domain::.
 */

extern int dword_209ADE8;     /* draw-list swirl; [val+0x10] puis [..+0x14] => nested (var_FC) */
extern int dword_209AEC8;     /* IDA name "dest": arène de capture 256x256 16bpp (slot ALT +0xBA8!=0) */

extern int __cdecl FFGetBufferAddress(void);            /* 0x40A04A, 0 arg -> engine (EBX) */
extern int __cdecl DD_ErrorMessage(int hr, const char *file, int line); /* 0x403AF8 */
extern int __cdecl BattleSwirl_Resample256(int src, int pitch, int start_x, int start_y,
                                           int src_w, int src_h, int dest); /* 0x56D530 */
extern int __cdecl sub_4203B2(int nested, int engine);  /* Alt driver slot 22 (56d4b6) */
extern int __cdecl sub_420476(int nested, int engine);  /* Alt driver slot 23 (56d4bd) */

typedef int (__stdcall *DDS_LockFn)(void *self, void *rect, void *desc, unsigned flags, void *event);
typedef int (__stdcall *DDS_UnlockFn)(void *self, void *rect);

int __cdecl BattleSwirl_CaptureFrame(int start_x, int start_y, int src_w, int src_h)
{
    unsigned char src_desc[0x7C];   /* var_F8 @ T-0xF8, 56d3cd/56d3d3: dwSize=0x7C */
    unsigned char dest_desc[0x7C];  /* var_7C @ T-0x7C (= var_F8+0x7C), 56d419/56d422 */
    int engine;                     /* ebx = FFGetBufferAddress() (56d39a/56d39f) */
    int nested;                     /* var_FC, sauvegardé 56d3b7, rechargé 56d4b0 */
    int dest_sel;                   /* ebp = [engine+0xBEC] (56d3a9) */
    int src_surf;                   /* esi = [engine+0x7C] (56d3af) */
    int dest_surf;                  /* edi = [nested+0/8] selon ebp (56d3bd/56d3c2) */
    int hr;

    engine = FFGetBufferAddress();

    /* 56d3a1..56d3b2: eax=dword_209ADE8; ecx=[eax+0x10]; eax=[ecx+0x14] (double deref réelle) */
    nested = *(int *)(*(int *)(dword_209ADE8 + 0x10) + 0x14);
    dest_sel = *(int *)(engine + 0xBEC);
    src_surf = *(int *)(engine + 0x7C);

    /* 56d3b5 test ebp; jz loc_56D3C2 => ebp==0: [nested+0]; sinon [nested+8] (56d3bd) */
    if (dest_sel != 0)
        dest_surf = *(int *)(nested + 8);
    else
        dest_surf = *(int *)nested;

    /* 56d3d3: dwSize DWORD = 7Ch dans var_F8 */
    *(int *)(src_desc + 0) = 0x7C;
    /* 56d3e1: Lock(this=esi, rect=0, desc=var_F8, flags=11h, hEvent=0) via [esi]+0x64 */
    hr = (*(DDS_LockFn *)(*(int *)src_surf + 0x64))(src_surf, 0, src_desc, 0x11, 0);
    /* 56d3e5 DD_ErrorMessage(hr, ssi.cpp, 0x7C); add esp,0Ch; test eax; jnz loc_56D3FF:
     * eax==0 => or eax,-1 et retour SANS unlock (56d3f1..56d3fe) */
    if (DD_ErrorMessage(hr, "C:\\FF8\\Common\\psx2ssi\\ssimotionblur.cpp", 0x7C) == 0)
        return -1; /* or eax,0FFFFFFFFh ; aucun Unlock */

    /* 56d3ff/56d405/56d407: eax=[ebx+0xBA8]; test; jnz loc_56D4D2 (chemin ALT, pas de 2e Lock) */
    if (*(int *)(engine + 0xBA8) == 0) {
        /* 56d422: dwSize DWORD = 7Ch dans var_7C */
        *(int *)(dest_desc + 0) = 0x7C;
        /* 56d433: Lock(dest, 0, var_7C, 21h, 0) via [edi]+0x64 */
        hr = (*(DDS_LockFn *)(*(int *)dest_surf + 0x64))(dest_surf, 0, dest_desc, 0x21, 0);
        /* 56d437/56d441: eax==0 => Unlock src (56d448) puis or eax,-1 (56d44e..56d45b) */
        if (DD_ErrorMessage(hr, "C:\\FF8\\Common\\psx2ssi\\ssimotionblur.cpp", 0x82) == 0) {
            (*(DDS_UnlockFn *)(*(int *)src_surf + 0x80))(src_surf, 0);
            return -1;
        }

        /* 56d45c..56d48e: pushes dest(var_58),src_h(arg_C),src_w(arg_8),start_y(arg_4),
         * start_x(arg_0),pitch(var_E8),src(var_D4) => args cdecl (src,pitch,start_x,
         * start_y,src_w,src_h,dest). add esp,1Ch (56d495). */
        BattleSwirl_Resample256(
            *(int *)(src_desc + 0x24),  /* var_D4: lpSurface */
            *(int *)(src_desc + 0x10),  /* var_E8: lPitch */
            start_x,
            start_y,
            src_w,
            src_h,
            *(int *)(dest_desc + 0x24)); /* var_58: lpSurface */

        /* 56d49b Unlock dest (vtbl+0x80, lpRect=0) ; 56d4a6 Unlock src */
        (*(DDS_UnlockFn *)(*(int *)dest_surf + 0x80))(dest_surf, 0);
        (*(DDS_UnlockFn *)(*(int *)src_surf + 0x80))(src_surf, 0);

        /* 56d4ac test ebp; jnz loc_56D516: ebp!=0 => saute Alt 22/23, retour 0.
         * ebp==0 => 56d4b0 recharge var_FC (esi), push ebx, push esi => (nested, engine). */
        if (dest_sel == 0) {
            sub_4203B2(nested, engine); /* 56d4b6, Alt slot 22 */
            sub_420476(nested, engine); /* 56d4bd, Alt slot 23 */
        }
        /* add esp,10h couvre les 4 pushes (56d4c2); xor eax,eax (56d4c5) */
        return 0;
    }

    /* loc_56D4D2: dest = dword_209AEC8 (IDA "dest"); mêmes var_E8/var_D4/args.
     * add esp,1Ch (56d50a); Unlock src ONLY (56d510); pas de Unlock dest, pas d'Alt 22/23. */
    BattleSwirl_Resample256(
        *(int *)(src_desc + 0x24),
        *(int *)(src_desc + 0x10),
        start_x,
        start_y,
        src_w,
        src_h,
        dword_209AEC8);

    (*(DDS_UnlockFn *)(*(int *)src_surf + 0x80))(src_surf, 0);
    return 0; /* loc_56D516: xor eax,eax (56d519) */
}
```

## Preuves et validation parent

1. `nested` = double déréf prouvée : `mov eax, dword_209ADE8` (56d3a1 charge la VALEUR du global) → `mov ecx, [eax+10h]` (56d3a6) → `mov eax, [ecx+14h]` (56d3b2) ; sauvée dans `var_FC` (56d3b7), rechargée en esi pour la paire Alt (56d4b0).
2. `callees.txt` : `add esp` de 0Ch (×2 DD_ErrorMessage), 1Ch (×2 Resample256), 10h (paire 4203B2/420476), 0FCh (×4 épilogues) — corrobore les arités cdecl 3/7/2 ; Lock/Unlock stdcall (aucun `add esp` après les `call dword ptr [reg+64h/80h]`).
3. Ordre d'args Resample256 prouvé par l'ordre des pushes (56d45c..56d48e) : dest(var_58), src_h(arg_C), src_w(arg_8), start_y(arg_4), start_x(arg_0), pitch(var_E8), src(var_D4) → proto cdecl (src, pitch, start_x, start_y, src_w, src_h, dest).
4. Chemin ALT `[engine+0xBA8]!=0` (56d407 jnz loc_56D4D2) : pas de 2e Lock, dest = global dword_209AEC8 (bare `mov ecx, dest`, 56d4d2), Unlock src seul (56d510), retour 0 sans Alt 22/23.
5. Rôle double de ebp=[engine+0xBEC] : sélecteur de surface dest ([nested+0] si 0, [nested+8] sinon, 56d3b5..56d3c2) ET gate des Alt 22/23 (56d4ac test ebp; jnz loc_56D516) — la paire ne tourne que si ebp==0, après resample+unlocks.
6. Callers (callers.txt, fan-in faible) : `start_battle_swirl_sub_56D1D0` @ 0x56d1fa et `BattleSwirl_EnsureAndCapture` @ 0x56d746 ; `more=false` — 2 callers, cohérent avec la chaîne AllocCaptureResources → CaptureFrame du wiki.
7. Gestion d'erreur COM : échec Lock src → `or eax,0FFFFFFFFh` sans unlock (56d3f1..56d3fe) ; échec Lock dest → Unlock src puis -1 (56d443..56d45b) ; succès → 0 (xor eax,eax, 56d4c5/56d519). Retour EAX large ⇒ int (IDA void historique faux).
8. Aucune struct pixel packée inventée : seuls dwSize@+0 (store DWORD 7Ch ×2), lPitch@+0x10 (var_E8) et lpSurface@+0x24 (var_D4/var_58) sont touchés ; aucun store 66, aucun setcc, aucun saut signé, pas de jpt_.

- Risque: le prototype de `sub_4203B2`/`sub_420476` (rôle Alt driver slots 22/23) reste inféré de leurs slots; hexrays.c indisponible ce cycle (stub d'erreur) — aucune contre-vérification Hex-Rays.
