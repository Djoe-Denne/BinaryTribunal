/* ===========================================================================
 * gfx_driver_passthrough.h — ABI publique du prototype DLL « observer Mode A »
 * Projet re-ff8, lot 12 (U29.7 / U29.8 / U30.5).
 *
 * Cible        : FF8_EN.exe 064d466b…, base 0x400000, x86 32-bit, __cdecl partout.
 * Spec contraignante : docs/tech/investigation/battle-static-discovery/driver-abi-spec.md
 * Ground truth : ASM/IDB (sondes 2026-09-20). Les EA cités en commentaire de
 * chaque typedef sont les sites d'appel indirect des wrappers engine (spec §5) ;
 * les signatures ont été dérivées du disasm (push droite→gauche, cleanup add esp,N).
 *
 * C pur MSVC (pas de STL / objet C++ crossing l'ABI).
 * =========================================================================== */
#ifndef GFX_DRIVER_PASSTHROUGH_H
#define GFX_DRIVER_PASSTHROUGH_H

#ifdef __cplusplus
extern "C" {
#endif

/* ---------------------------------------------------------------------------
 * Convention d'appel des slots (spec §4) :
 *   - tout callback est __cdecl, sans this explicite ;
 *   - les wrappers engine résolvent driver = *(engine+0xA74) (GetBufApp
 *     0x4098EE) puis call [driver+off](args..., engine...). La POSITION de
 *     l'engine dans la liste d'arguments varie par slot (dérivé du disasm) :
 *     partout où il est identifiable, il est nommé « engine » ci-dessous,
 *     sinon l'argument garde un nom neutre (a0/a1/…) et est forwardé tel quel.
 * --------------------------------------------------------------------------- */

/* slot 0 (+0x000) Init — call [eax] @0x409572 (dans Gfx_InitializeSelectedBackend 0x40942E), add esp,4 */
typedef int (__cdecl *GFXPT_PFN_Init)(void* engine);

/* slot 1 (+0x004) Uninit/shutdown — call [edx+4] @0x4096F2 (fn 0x409670), add esp,4 */
typedef int (__cdecl *GFXPT_PFN_Uninit)(void* engine);

/* slot 2 (+0x008) DirectX_7 — call [edx+8] @0x41DED4 (wrapper fn 0x41DEB0), add esp,4
 * 1 arg forwardé tel quel (le wrapper résout son engine via GetBufferAddress, pas via l'arg). */
typedef int (__cdecl *GFXPT_PFN_Slot2)(void* a0);

/* slot 3 (+0x00C) DirectX_8 — call [edx+0xC] @0x41DF02 (chunk jumeau 0x41DEDE du wrapper 0x41DEB0), add esp,4 */
typedef int (__cdecl *GFXPT_PFN_Slot3)(void* a0);

/* slot 4 (+0x010) Present — call [eax+0x10] @0x41DF32 (Render_FramePresent_Dispatch 0x41DF0C),
 * add esp,4 ; gated en amont par *(engine+0xB88) != 0. Le present natif GL est préservé. */
typedef int (__cdecl *GFXPT_PFN_Present)(void* engine);

/* slot 5 (+0x014) prep buffer (isGetDrawBuf2) — call [edx+0x14] @0x41DFE0 (fn 0x41DFBA), add esp,0x10 */
typedef int (__cdecl *GFXPT_PFN_Slot5)(void* a0, void* a1, void* a2, void* engine);

/* slot 6 (+0x018) support frame — call [edx+0x18] @0x41DFB0 (sub_41DF96), add esp,4 */
typedef int (__cdecl *GFXPT_PFN_Slot6)(void* engine);

/* slot 7 (+0x01C) viewport — call [eax+0x1C] @0x41E106 (gfx_driver_set_viewport_sub_41E070), add esp,0x14 ;
 * l'engine écrit aussi x/y/w/h dans engine+0x928..0x940. */
typedef int (__cdecl *GFXPT_PFN_SetViewport)(unsigned int x, unsigned int y,
                                            unsigned int w, unsigned int h,
                                            void* engine);

/* slot 8 (+0x020) isGetDrawBuf (clear-color + inline state writer) — call [ecx+0x20] @0x41E1A5
 * (isGetDrawBuf 0x41E168), add esp,8. arg0 = vec4 clear-color (16 octets copiés par l'engine
 * vers driver+0x28..+0x34, i.e. slots inline 10–13) AVANT l'appel ; engine = 2e arg. */
typedef int (__cdecl *GFXPT_PFN_ClearColor)(const void* clearColorVec4, void* engine);

/* slots 9–14 (+0x24..+0x38) : état inline (clear-color vec4 à +0x28), pas des fnptrs.
 * slot 15 (+0x3C) : inerte, toujours NULL. */

/* slot 16 (+0x040) / slot 17 (+0x044) : audio-adjacent (partagé GL/DD) — copiés tels quels
 * depuis l'objet natif (fnptrs natifs, pas de wrapper, pas de log). */

/* slot 18 (+0x048) — call [edx+0x48] @0x41E646 (Thunk_BufApp_Off72 0x41E620), add esp,0x10 */
typedef int (__cdecl *GFXPT_PFN_Slot18)(void* a0, void* a1, void* a2, void* engine);

/* slot 19 (+0x04C) — call [edx+0x4C] @0x419ED8 (fn 0x419E89 @0x419EA5), add esp,4 ;
 * 1 arg métier forwardé tel quel (l'engine du wrapper vient de GetBufferAddress). */
typedef int (__cdecl *GFXPT_PFN_Slot19)(void* a0);

/* slot 20 (+0x050) : GL natif = 0x4381F8 mais AUCUN wrapper engine au spec §5 —
 * signature non dérivable → no-op log + return 0 (risque documenté au README). */
typedef int (__cdecl *GFXPT_PFN_Slot20)(void* a0);

/* slots 21–24 (+0x54/+0x58/+0x5C/+0x60) : Alt-only. Sous proxy GL, slot natif toujours
 * NULL → wrapper no-op log + return 0 (invariant spec §4 : jamais NULL si appelable). */
typedef int (__cdecl *GFXPT_PFN_AltOnly1)(void* a0);                      /* slot 21 */
typedef int (__cdecl *GFXPT_PFN_AltOnly2)(void* a0, void* a1);            /* slots 22/23/24 */

/* slot 25 (+0x064) — call [ecx+0x64] @0x41EA61 (fn 0x41EA06 @0x41EA18), add esp,0x14 ;
 * second site call [eax+0x64] @0x40828A (fn 0x407EB4), add esp,0x14 — 5 args, forward verbatim. */
typedef int (__cdecl *GFXPT_PFN_Slot25)(void* a0, void* a1, void* a2, void* a3, void* a4);

/* slot 26 (+0x068) — call [ecx+0x68] @0x41E9FC (fn 0x41E9C4 @0x41E9D6), add esp,0x18 */
typedef int (__cdecl *GFXPT_PFN_Slot26)(void* a0, void* a1, void* a2,
                                       void* a3, void* a4, void* a5);

/* slot 27 (+0x06C) — call [eax+0x6C] @0x418815 (fn 0x4187F7 @0x4187FF), add esp,8 */
typedef int (__cdecl *GFXPT_PFN_Slot27)(void* a0, void* engine);

/* slot 28 (+0x070) — call [eax+0x70] @0x41EA99 (fn 0x41EA71 @0x41EA83), add esp,8 */
typedef int (__cdecl *GFXPT_PFN_Slot28)(void* a0, void* engine);

/* slot 29 (+0x074) SetRenderState — call [ecx+0x74] @0x41E67E (Gfx_SetRenderState 0x41E658),
 * add esp,0xC ; type 0–25 (le wrapper engine rejette type>=0x1A « INVALID RENDER STATE TYPE »). */
typedef int (__cdecl *GFXPT_PFN_SetRenderState)(int type, unsigned int value, void* engine);

/* slot 30 (+0x078) CommitRenderState — call [eax+0x78] @0x41E79B (fn 0x41E77D @0x41E785), add esp,8 */
typedef int (__cdecl *GFXPT_PFN_CommitRenderState)(void* a0, void* engine);

/* slot 31 (+0x07C) — 3 sites : call [edx+0x7C] @0x41E6C1, @0x41E6F5, call [eax+0x7C] @0x41E71D,
 * add esp,8 partout */
typedef int (__cdecl *GFXPT_PFN_Slot31)(void* a0, void* engine);

/* slot 32 (+0x080) — call [eax+0x80] @0x41E745 (fn 0x41E727 @0x41E72F), add esp,8 */
typedef int (__cdecl *GFXPT_PFN_Slot32)(void* a0, void* engine);

/* slot 33 (+0x084) SetBlendMode — call [eax+0x84] @0x41E770 (GfxDriver_SetBlendMode 0x41E75A),
 * add esp,8 ; valeurs 0–4 (le cas 3 est implémenté côté GL, aucun call-site ne le pousse). */
typedef int (__cdecl *GFXPT_PFN_SetBlendMode)(void* blend, void* engine); /* blend = valeur 0-4 forwardée telle quelle (ABI-fidèle, sémantique slot 33) */

/* slot 34 (+0x088) : hook optionnel NULL-guarded (wrapper 0x41E7AD, call @0x41E7CB) —
 * laissé NULL dans le proxy (miroir des ctors natifs). */

/* slot 35 (+0x08C) swap buffers via SelectTarget — call [eax+0x8C] @0x41E7F6 (fn 0x41E7D8 @0x41E7E0), add esp,8 */
typedef int (__cdecl *GFXPT_PFN_Slot35)(void* a0, void* engine);

/* slot 36 (+0x090) : override — wrapper fn 0x41E803 guard [driver+0x90]!=0 puis retombe sur
 * slot 35 (call @0x41E82D / fallback @0x41E843). Laissé NULL dans le proxy : le wrapper
 * engine fait le fallback tout seul. */

/* slot 37 (+0x094) : libre, NULL (miroir natif). */

/* slot 38 (+0x098) — call [eax+0x98] @0x41E93A (fn @0x41E924), add esp,8 ; l'ordre
 * (a0, a1) est forwardé tel quel. */
typedef int (__cdecl *GFXPT_PFN_Slot38)(void* a0, void* a1);

/* slot 39 (+0x09C) SelectRenderTarget — call [eax+0x9C] @0x41E965
 * (GfxDriver_SelectRenderTarget 0x41E947), add esp,8 ; écrit engine+2664, PAS end-scene. */
typedef int (__cdecl *GFXPT_PFN_SelectRenderTarget)(void* a0, void* engine);

/* slot 40 (+0x0A0) BeginScene — call [eax+0xA0] @0x41E990 (GfxDriver_BeginScene 0x41E972),
 * add esp,8 ; (wglMakeCurrent puis SelectTarget côté natif). */
typedef int (__cdecl *GFXPT_PFN_BeginScene)(void* a0, void* engine);

/* slot 41 (+0x0A4) LeaveScene — call [edx+0xA4] @0x41E9B7
 * (GfxDriver_LeaveScene 0x41E99D), add esp,4 ; flag-clear/unlock/EndScene, PAS present. */
typedef int (__cdecl *GFXPT_PFN_LeaveScene)(void* engine);

/* slot 42 (+0x0A8) : GL natif = 0x439000, aucun wrapper engine au spec — copie transparente
 * du fnptr natif (pas de log), choix conservateur documenté au README. */

/* slots 43–64 (+0xAC..+0x100) draw-list setup/walk (spec §6) — signatures prouvées
 * par Gfx_WalkDrawList 0x4178D7 ; bind par Gfx_BindDrawListBackendCallbacks 0x41619A
 * (list+0x9C setup, list+0xA0 walk). node : OT node 24 octets, next = *(void**)node. */
typedef int (__cdecl *GFXPT_PFN_ListFn)(void* ctx /*list+0x18*/, void* node /*list+0x94*/,
                                       void* arg);

/* slot 65 (+0x104) Alt-only, consumer engine-level — call [eax+0x104] @0x4097C6
 * (fn 0x4097A0 @0x4097A8), add esp,4 ; sous proxy GL le slot natif est NULL → return 0. */
typedef int (__cdecl *GFXPT_PFN_Slot65)(void* engine);

/* ---------------------------------------------------------------------------
 * Objet driver : 66 DWORDs (0x108) — même layout que les ctors natifs
 * (GL 0x4252B0 / DDraw 0x425540 / Alt 0x4257D0). Ce n'est pas une vtable pure.
 * Index i du tableau = offset 4*i. Slots 9–14 = état inline.
 * --------------------------------------------------------------------------- */
typedef struct GFXPT_DriverObj {
    void* slots[66];   /* 0x108 bytes ; slots 9–14 = état inline (clear-color vec4 à l'index 10..13 = +0x28..+0x34) */
} GFXPT_DriverObj;

/* ---------------------------------------------------------------------------
 * Config d'activation (36 bytes = 0x24) — Gfx_LoadExternalBackendFactory
 * (0x409805) : cdecl, poussée droite→gauche, proto (config, engine).
 * NB : le spec écrit reserved[9] mais borne la structure +0x0C..+0x23, soit
 * 6 DWORDs (0x24 - 0x0C = 0x18) ; le total 0x24 est confirmé par le
 * qmemcpy(engine+0xBB0, config, 0x24) — réservé à 6 pour rester byte-exact.
 * --------------------------------------------------------------------------- */
typedef struct GFXPT_ExternalBackendConfig36 {
    unsigned long backendType;    /* +0x00 : DOIT valoir 2 */
    const char*   dllName;        /* +0x04 : chemin LoadLibraryA */
    const char*   factoryExport;  /* +0x08 : "new_dll_graphics_driver" attendu */
    unsigned long reserved[6];    /* +0x0C..0x23 : copiés tels quels vers engine+0xBB0 */
} GFXPT_ExternalBackendConfig36;

/* ---------------------------------------------------------------------------
 * Captures draw-list (observer) — les captures référencent le ring de nodes.
 * --------------------------------------------------------------------------- */
#define GFXPT_NODE_BYTES     24u   /* OT node 24 octets (spec §8) */

typedef struct GFXPT_Capture {
    unsigned long slot;          /* slot natif 43–64 qui a produit la capture */
    void*         ctx;           /* list+0x18 au moment de la capture (peut devenir stale) */
    void*         arg;           /* 3e arg du premier call de la session */
    unsigned long gen;           /* *(*(list+0x34)) — génération au moment du call */
    unsigned long stamp;         /* *(list+0x58) — genstamp du list */
    unsigned long nodeCount;     /* nombre de nodes copiés */
    unsigned long firstNodeSeq;  /* index absolu du 1er node dans le ring global */
    unsigned long dropped;       /* nodes perdus (ring plein ou copie SEH échouée) */
} GFXPT_Capture;

/* ---------------------------------------------------------------------------
 * Exports (déclarés ici pour le lanceur / les outils ; l'export machine est
 * posé par pragma linker dans le .c, noms non décorés).
 * --------------------------------------------------------------------------- */

/* Factory type-2 attendue par Gfx_InitializeSelectedBackend (call [ebp-8] @0x40951D).
 * Crée le driver natif OpenGL (ctor 0x4252B0, 1 arg __cdecl) puis l'objet proxy
 * 0x108 et retourne UNIQUEMENT le proxy (l'engine le stocke en engine+0xA74). */
void* __cdecl new_dll_graphics_driver(void* engine);

/* Ré-émet les captures via les slots natifs 43–64.
 * Mode A (défaut) : dry-run — valide, journalise, retourne le nombre de captures.
 * Live (Passthrough_SetReplayLive(1)) : ré-émet réellement les nodes copiés
 * via les fnptrs natifs (risque ctx stale — replay différée complète = Mode B/C). */
int __cdecl Passthrough_ReplayCaptured(void);

void __cdecl Passthrough_SetReplayLive(int enable);

unsigned long __cdecl Passthrough_CaptureCount(void);

/* v2 — pose le détour boot sur CheckRegistry (0x401890) : le premier appel
 * arme engine+0xBA8=2 / engine+0xBD0=factory avant le dispatch type 2.
 * Posé automatiquement par DllMain (mode AF3DN.P) ; export conservé pour
 * une future voie injecteur. Retour : 1 posé/déjà posé, 0 refus (preimage). */
int __cdecl Passthrough_InstallBootHook(void* reserved);

#ifdef __cplusplus
}
#endif

#endif /* GFX_DRIVER_PASSTHROUGH_H */
