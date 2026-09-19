# BattleSwirl_AllocCaptureResources @ 0x56D240

- Instr (live): 97
- Palier: high
- Mode: 1+V
- Verdict: CERTAIN — V CORRIGE(2) vs A : Gfx_Psx2Lookup_OrPoolAlloc_B7E018 = **1 arg size_t** (buffer arena 0x20000, ni TPage ni &desc ; `add esp,0Ch` = 8 InitDrawListDesc + 4 push) ; dest @0x56D2F4 = **global 0x209AEC8** (blob 0x209ADF0+0xD8), relu par CaptureFrame @0x56d4d2, libéré par ReleaseResources @0x56d770/82
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1284
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1420
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1239
- A==B: non
- Push IDB: [glm-triple 2026-09-13] déjà présent ; append-only `[semantic-triple 2026-09-19]` + save_database
- SetType: int BattleSwirl_AllocCaptureResources(void)
- Notes parent: add esp 0Ch = leftover InitDrawListDesc 8 + alloc 1 arg (push 20000h), pas 3 args. CreateDrawList 5 args (1, 0Eh, desc, 0, [ebx+0A50h]) add esp 14h puis 20h. DWORD only, F3 A5 ecx=20h puis overwrite 100h/100h/200h. +0x28 = &unk_209ADF0. Fail or -1; tail neg/sbb/neg/dec → 0/-1. Occupancy/0xD0/0x1D0/GF+0x44 absents.
- Hex-Rays: extrait le 2026-09-19 (pack corrigé) — conforme à l'ASM et à c_reconciled.c (arités 1/2/5/2/1, ordre copie→patches, polarité (list2!=0)-1)
- Revue semantic-triple 2026-09-19: C re-dérivé de l'ASM

## C réconcilié

```c
/* BattleSwirl_AllocCaptureResources @ 0x56D240
 * Ground truth = live ASM (asm.asm) + ida_dump_bytes, not Hex-Rays (indisponible: stub pack).
 * 97 instr, size 0x14D, end 0x56D38D. IDA type int().
 * cdecl, 0 args. Saved EBX EBP ESI EDI. sub esp,84h local desc. retn C3.
 * ebp XOR 0 = DWORD zero. ebx = FFGetBufferAddress (engine).
 * add esp,0Ch = InitDrawListDesc leftover 8 + alloc 4 (1 arg, not 3).
 * add esp,14h = first CreateDrawList 5 args. add esp,20h = SetDescFilterMode 8
 * + GetNested 4 + second CreateDrawList 20.
 * DWORD stores only (A3/C7 05/C7 44/89 2D). No 66. F3 A5 ecx=20h.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No packed blob struct: named dwords only. No domain::.
 */

extern void *FFGetBufferAddress(void);
extern void Gfx_InitDrawListDesc(int filter, void *desc);
extern void *Gfx_Psx2Lookup_OrPoolAlloc_B7E018(unsigned int size);
extern void *Gfx_CreateDrawList(int a, int type, void *desc, int z, void *engine_A50);
extern int Gfx_SetDescFilterMode(int mode, void *desc);
extern void *Gfx_GetNested_Plus10_14(void *list);

extern unsigned char unk_209ADF0;
extern unsigned int dword_209ADE8;
extern unsigned int dword_209ADEC;
extern unsigned int dword_209ADF4;
extern unsigned int dword_209AE04;
extern unsigned int dword_209AE08;
extern unsigned int dword_209AE0C;
extern unsigned int dword_209AE10;
extern unsigned int dword_209AE14;
extern unsigned int dword_209AE18;
extern unsigned int dword_209AE28;
extern unsigned int dword_209AE2C;
extern unsigned int dword_209AE30;
extern unsigned int dword_209AE34;
extern unsigned int dword_209AE68;
extern unsigned int dword_209AE78;
extern unsigned int dword_209AE88;
extern unsigned int dword_209AE98;
extern unsigned int dword_209AEA8;
extern unsigned int dword_209AEC8;

int BattleSwirl_AllocCaptureResources(void)
{
    unsigned char desc[0x84];
    unsigned char *engine;
    unsigned int v8B0;
    unsigned int *src;
    unsigned int *dst;
    int n;
    void *arena;
    void *list1;
    void *list2;

    engine = (unsigned char *)FFGetBufferAddress();
    Gfx_InitDrawListDesc(0, desc);
    *(unsigned int *)(desc + 0x28) = (unsigned int)&unk_209ADF0;

    v8B0 = *(unsigned int *)(engine + 0x8B0);
    dword_209AE04 = v8B0;
    dword_209AE08 = v8B0;
    dword_209AE18 = 0x10u;
    dword_209AE14 = 0x10u;
    dword_209AE28 = 0x10u;
    dword_209AE0C = 0;
    dword_209AE10 = 0;
    dword_209ADF4 = 0;

    src = (unsigned int *)(engine + 0x87C);
    dst = &dword_209AE2C;
    n = 0x20;
    while (n-- > 0)
        *dst++ = *src++;

    dword_209AE2C = 0x100u;
    dword_209AE30 = 0x100u;
    dword_209AE34 = 0x200u;
    dword_209AE68 = 0;
    dword_209AE78 = 0;
    dword_209AE88 = 0;
    dword_209AE98 = 0;
    dword_209AEA8 = 0;

    arena = Gfx_Psx2Lookup_OrPoolAlloc_B7E018(0x20000u);
    dword_209AEC8 = (unsigned int)arena;
    if (arena == 0)
        return -1;

    list1 = Gfx_CreateDrawList(1, 0xE, desc, 0, *(void **)(engine + 0xA50));
    dword_209ADE8 = (unsigned int)list1;
    if (list1 == 0)
        return -1;

    Gfx_SetDescFilterMode(1, desc);
    *(unsigned int *)(desc + 0x2C) = 1u;
    *(unsigned int *)(desc + 0x30) = (unsigned int)Gfx_GetNested_Plus10_14((void *)dword_209ADE8);

    list2 = Gfx_CreateDrawList(1, 0xE, desc, 0, *(void **)(engine + 0xA50));
    dword_209ADEC = (unsigned int)list2;
    return (list2 != 0) ? 0 : -1;
}
```

## Preuves et validation parent

Vérifiées contre `asm.asm`, `callees.txt`, `callers.txt` (pack `tools/_tmp_semantic_triple/0x56d240/`), revue 2026-09-19.

1. `Gfx_InitDrawListDesc(0, desc)` : `push eax` (desc) @0x56D257 puis `push ebp` (=0) @0x56D258, `call` @0x56D259, **aucun** `add esp` — les 8 octets sont nettoyés plus bas par `add esp,0Ch` @0x56D2EF (callees.txt lignes 9/11).
2. `*(desc+0x28) = &unk_209ADF0` : `mov [esp+9Ch+var_5C], offset unk_209ADF0` @0x56D25E ; var_5C → E−0x5C, desc → E−0x84 ⇒ +0x28.
3. Copie `F3 A5 rep movsd` @0x56D2B6 : `mov ecx,20h` @0x56D290, `lea esi,[ebx+87Ch]` @0x56D27B, `mov edi,offset dword_209AE2C` @0x56D295 ⇒ 0x20 DWORD (0x80 octets) depuis `engine+0x87C` vers `0x209AE2C` ; puis écrasements @0x56D2B8–0x56D2E4 : `100h/100h/200h` et cinq zéros `AE68/AE78/AE88/AE98/AEA8` — tous DANS la zone copiée (dest +0x00..+0x7C).
4. Pool alloc à **UN argument** : seul `push 20000h` @0x56D2B1 ; `call Gfx_Psx2Lookup_OrPoolAlloc_B7E018` @0x56D2EA ; `add esp,0Ch` @0x56D2EF = 8 (reliquat Init) + 4 — pas 3 args. Store `mov dest, eax` @0x56D2F4 (live label `dest` = `dword_209AEC8`, blob +0xD8) AVANT `cmp eax,ebp` / `jnz` @0x56D2F9 : stocké même si NULL ; échec = `or eax,0FFFFFFFFh` @0x56D2FE → −1.
5. `Gfx_CreateDrawList` 5 args cdecl `(1, 0Eh, &desc, 0, [ebx+0A50h])` : `mov ecx,[ebx+0A50h]` @0x56D309, pushes @0x56D313–0x56D31A, `add esp,14h` @0x56D31F (callees.txt lignes 13/14) ; `mov dword_209ADE8,eax` @0x56D324 avant `jnz` @0x56D329 ; échec `or eax,0FFFFFFFFh` @0x56D32E → −1.
6. `Gfx_SetDescFilterMode(1, desc)` : `push eax`/`push 1` @0x56D33D/33E, `call` @0x56D340, pas d'`add esp` ; puis `mov [esp+9Ch+var_58],1` @0x56D34B → desc+0x2C ; `mov ecx,dword_209ADE8` @0x56D345 (recharge le GLOBAL) → `call Gfx_GetNested_Plus10_14` @0x56D354, `mov [esp+0A0h+var_54],eax` @0x56D359 → desc+0x30 (callees.txt lignes 16/17).
7. CreateDrawList #2 identique @0x56D36E ; `add esp,20h` @0x56D373 = 8 (SetDesc) + 4 (GetNested) + 0x14 (Create) ; `mov dword_209ADEC,eax` @0x56D376 ; tail @0x56D37B `neg eax`/`sbb eax,eax`/`neg eax`/`dec eax` ⇒ `(list2 != 0) ? 0 : -1`, retour EAX 32 bits (callees.txt lignes 18/19).
8. Callers (callers.txt, `more:false`) : exactement 2 xrefs code — `0x56D1D9` dans `start_battle_swirl_sub_56D1D0` et `0x56D729` dans `BattleSwirl_EnsureAndCapture`.

- Risque: l'équivalence live label `dest` = `dword_209AEC8` (blob +0xD8) repose sur les artefacts antérieurs du pack ; non re-vérifiée contre l'IDB dans cette session (pas d'ida-pro-mcp, écriture IDB interdite). Le comportement (store du résultat d'alloc post-`call`) est, lui, direct dans l'ASM.
- Risque: aucun free partiel sur les chemins d'échec (fidèle à l'ASM) ; dword_209AEC8 peut rester NULL après retour −1.
