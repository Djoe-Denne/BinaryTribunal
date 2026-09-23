/* ===========================================================================
 * gfx_driver_passthrough.c — prototype DLL « observer Mode A » (lot 12, re-ff8)
 *
 * Rôle : factory type-2 `new_dll_graphics_driver` + proxy complet de l'objet
 * driver (66 DWORDs, 0x108). Le driver natif OpenGL (ctor 0x4252B0) est créé
 * par la factory et gardé en static (g_native) — il n'est JAMAIS retourné à
 * l'engine. L'objet proxy porte :
 *   - des wrappers __cdecl (log CSV + forward vers le slot équivalent de
 *     g_native si non-nul, sinon return 0) pour slots 0–8, 18–33, 35, 38–41,
 *     43–64, 65 ;
 *   - des copies de fnptrs natifs pour slots 16/17 (partagés) et 42 (pas de
 *     wrapper engine au spec — choix transparent, documenté) ;
 *   - 0 pour slots 15/34/36/37 (miroir des ctors natifs ; 36 retombe sur 35
 *     via le wrapper engine 0x41E803) ;
 *   - un no-op log pour slots 20/21 (signature non dérivable / Alt-only).
 *
 * Logging : OutputDebugStringA (événements majeurs) + CSV lazy
 * (FF8_PASSTHROUGH_LOG ; env absent → ODS seul). Pas de log dans DllMain.
 * Capture/replay draw-list : slots 43–64 capturés (copie 24 octets/node,
 * pointer-free) ; Passthrough_ReplayCaptured ré-émet via les slots natifs
 * (dry-run par défaut). Replay différée complète = Mode B/C.
 *
 * Shutdown natif : fn 0x409670 appelle slot 1 puis FreeLibrary(engine+0xBCC) ;
 * DllMain ne fait RIEN à part un flag.
 *
 * Ground truth = ASM (FF8_EN.exe 064d466b…, base 0x400000) — EAs du spec
 * driver-abi-spec.md §1/§5 uniquement. C pur MSVC x86 /W3, __cdecl partout.
 * =========================================================================== */
#define _CRT_SECURE_NO_WARNINGS   /* fopen/fprintf/sprintf (C4996) */

#include <windows.h>
#include <stdio.h>
#include <string.h>

#include "gfx_driver_passthrough.h"

/* ===========================================================================
 * EAs ground truth (constantes nommées + evidence)
 * =========================================================================== */
#define GFXPT_EA_HOST_BASE       0x400000ul /* base attendue de FF8_EN.exe */
/* Gfx_LoadExternalBackendFactory (triple decomp existant) — appelé par le
 * lanceur uniquement (zéro caller statique vérifié 2026-09-20). La DLL ne
 * l'appelle pas ; constante documentaire. */
#define GFXPT_EA_FACTORY_LOADER  0x409805ul
/* Gfx_InitializeSelectedBackend — boot natif (call @0x401905). Documentaire. */
#define GFXPT_EA_INIT_BACKEND    0x40942Eul
/* Shutdown : slot 1 @0x4096F2 puis FreeLibrary @0x40971A. Documentaire. */
#define GFXPT_EA_SHUTDOWN        0x409670ul
/* presentation__RenderBackend_Construct_OpenGL — ctor natif appelé ici (1 arg __cdecl). */
#define GFXPT_EA_CTOR_OPENGL     0x4252B0ul

#define GFXPT_EA_CHECKREGISTRY   0x401890ul /* boot v2 : point d'ancrage pre-dispatch */
/* GetBufApp_0xA74 — référence (spec §4) ; non appelé par ce .c. */
#define GFXPT_EA_GETBUFAPP       0x4098EEul

#define GFXPT_DRIVER_OBJ_BYTES   0x108ul   /* 66 DWORDs */

/* Ctor natif backend — proto void* __cdecl(void* engine)
 * (call sites boot 0x4094D9/0x409531 : add esp,4). */
typedef void* (__cdecl *GFXPT_PFN_BackendCtor)(void* engine);

/* EA absolue → VA hôte : base du module EXE + delta depuis 0x400000. */
#define GFXPT_HostEA(ea) \
    ((void*)((unsigned long)g_hostModule + ((ea) - GFXPT_EA_HOST_BASE)))

/* ===========================================================================
 * Exports (noms non décorés pour GetProcAddress("new_dll_graphics_driver"))
 * =========================================================================== */
#pragma comment(linker, "/EXPORT:new_dll_graphics_driver=_new_dll_graphics_driver")
#pragma comment(linker, "/EXPORT:Passthrough_ReplayCaptured=_Passthrough_ReplayCaptured")
#pragma comment(linker, "/EXPORT:Passthrough_SetReplayLive=_Passthrough_SetReplayLive")
#pragma comment(linker, "/EXPORT:Passthrough_InstallBootHook=_Passthrough_InstallBootHook")
#pragma comment(linker, "/EXPORT:Passthrough_CaptureCount=_Passthrough_CaptureCount")

/* ===========================================================================
 * État DLL (BSS zéro-rempli ; aucun init CRT requis)
 * =========================================================================== */
static HMODULE        g_hostModule;     /* base hôte (GetModuleHandleA(NULL)) */
static void*          g_native;         /* objet driver natif GL (ctor 0x4252B0) */
static void*          g_proxy;          /* objet proxy 0x108 retourné à l'engine */
static int            g_nativeAlive;    /* slot 1 l'a uninit ? */
static int            g_replayLive;     /* 0 = dry-run (défaut Mode A) */
static unsigned long  g_seq;            /* compteur global d'appels loggés */
static HMODULE        g_hinstDLL;       /* module de cette DLL (fallback CSV) */
static FILE*          g_logFile;        /* CSV lazy */
static char           g_logPath[MAX_PATH];
static int            g_logDisabled;    /* env absent ou fopen KO → ODS seul */

#define GFXPT_CAP_COUNT  (1u << 8)        /* 256 captures (ring) */
#define GFXPT_NODE_COUNT (1u << 13)       /* 8192 nodes (ring, 192 Ko) */

static GFXPT_Capture  g_caps[GFXPT_CAP_COUNT];
static unsigned char  g_nodes[GFXPT_NODE_COUNT * GFXPT_NODE_BYTES];
static unsigned long  g_capWrite;       /* compteur absolu de captures ouvertes */
static unsigned long  g_nodeWrite;      /* compteur absolu de nodes copiés */
static int            g_curValid;
static unsigned       g_cur;            /* index ring de la capture courante */

/* ===========================================================================
 * Helpers lecture/copie SEH (les lectures list+0x34/+0x58 sont faites sur un
 * ctx vivant côté engine, mais l'outil observer ne doit JAMAIS faire tomber
 * le jeu : tout accès indirect est défendu).
 * =========================================================================== */
static int GFXPT_ReadU32(const void* addr, unsigned long* out)
{
    int ok = 0;
    __try
    {
        *out = *(const unsigned long*)addr;
        ok = 1;
    }
    __except (EXCEPTION_EXECUTE_HANDLER)
    {
        ok = 0;
    }
    return ok;
}

static int GFXPT_Copy24(void* dst, const void* src)
{
    int ok = 0;
    __try
    {
        memcpy(dst, src, (size_t)GFXPT_NODE_BYTES);
        ok = 1;
    }
    __except (EXCEPTION_EXECUTE_HANDLER)
    {
        ok = 0;
    }
    return ok;
}

/* ===========================================================================
 * Logging
 *   - ODS : événements majeurs uniquement (factory, init, uninit, replay).
 *   - CSV  : une ligne par slot appelé : seq,slot,arg0..3 (%p),ret.
 * =========================================================================== */
static void GFXPT_ODS(const char* msg)
{
    OutputDebugStringA(msg);
}

static void GFXPT_LogOpen(void)
{
    char env[MAX_PATH];
    DWORD n;

    if (g_logDisabled || g_logFile)
        return;
    if (!g_logPath[0])
    {
        n = GetEnvironmentVariableA("FF8_PASSTHROUGH_LOG", env, (DWORD)sizeof(env));
        if (n > 0 && n < (DWORD)sizeof(env))
        {
            lstrcpynA(g_logPath, env, (int)sizeof(g_logPath));
        }
        else
        {
            /* v2 : défaut = à côté de la DLL (dossier du jeu en mode AF3DN.P). */
            char* slash;
            DWORD m = GetModuleFileNameA(g_hinstDLL, g_logPath,
                                         (DWORD)sizeof(g_logPath));
            if (m == 0 || m >= (DWORD)sizeof(g_logPath) - 16)
            {
                /* Pas de chemin possible : CSV désactivé, ODS seul. */
                g_logDisabled = 1;
                return;
            }
            slash = g_logPath + m;
            while (slash > g_logPath && slash[-1] != '\\' && slash[-1] != '/')
                --slash;
            *slash = 0;
            lstrcpynA(slash, "gfx_passthrough.csv",
                      (int)(sizeof(g_logPath) - (size_t)(slash - g_logPath)));
        }
    }
    g_logFile = fopen(g_logPath, "a");
    if (!g_logFile)
    {
        g_logDisabled = 1;
        return;
    }
    fprintf(g_logFile, "seq,slot,arg0,arg1,arg2,arg3,ret\n");
    fflush(g_logFile);
}

static void GFXPT_LogCall(unsigned slot, const void* a0, const void* a1,
                          const void* a2, const void* a3, int ret)
{
    g_seq++;
    GFXPT_LogOpen();
    if (g_logFile)
    {
        fprintf(g_logFile, "%lu,%u,%p,%p,%p,%p,%d\n",
                g_seq, slot, a0, a1, a2, a3, ret);
        fflush(g_logFile);
    }
}

/* Résolution du fnptr natif équivalent (slot index = offset/4). */
static void* GFXPT_Native(unsigned slot)
{
    if (!g_native || slot >= 66u)
        return 0;
    return ((void**)g_native)[slot];
}

/* ===========================================================================
 * Capture draw-list (slots 43–64, spec §6)
 *   ctx = list+0x18 → list = ctx-0x18 ; stamp = *(list+0x58) ;
 *   gen = *(*(list+0x34)) (les mêmes lectures que les guards de
 *   Gfx_WalkDrawList 0x4178D7, défendues par SEH).
 *   Session = (slot, ctx, gen) ; nodes copiés 24 octets dans le ring global
 *   (pointer-free). Ring plein → dropped++ (dégradation silencieuse, observer).
 * =========================================================================== */
static void GFXPT_CaptureCall(unsigned slot, void* ctx, void* node, void* arg)
{
    unsigned long  stamp = 0;
    unsigned long  gen = 0;
    unsigned long  genPtr = 0;
    const unsigned char* list;
    GFXPT_Capture* cap;
    unsigned long  seq;

    if (!ctx || !node)
        return;
    list = (const unsigned char*)ctx - 0x18;
    (void)GFXPT_ReadU32(list + 0x58, &stamp);
    if (GFXPT_ReadU32(list + 0x34, &genPtr) && genPtr != 0)
        (void)GFXPT_ReadU32((const void*)genPtr, &gen);

    if (!g_curValid ||
        g_caps[g_cur].slot != slot ||
        g_caps[g_cur].ctx != ctx ||
        g_caps[g_cur].gen != gen)
    {
        g_cur = (unsigned)(g_capWrite & (GFXPT_CAP_COUNT - 1u));
        g_capWrite++;
        cap = &g_caps[g_cur];
        memset(cap, 0, sizeof(*cap));
        cap->slot = slot;
        cap->ctx = ctx;
        cap->arg = arg;
        cap->gen = gen;
        cap->stamp = stamp;
        cap->firstNodeSeq = g_nodeWrite;
        g_curValid = 1;
    }

    cap = &g_caps[g_cur];
    seq = g_nodeWrite;
    if (seq - cap->firstNodeSeq >= GFXPT_NODE_COUNT)
    {
        cap->dropped++;                 /* ring plein : dégradation silencieuse */
        return;
    }
    if (!GFXPT_Copy24(&g_nodes[(unsigned)(seq & (GFXPT_NODE_COUNT - 1u)) * GFXPT_NODE_BYTES],
                      node))
    {
        cap->dropped++;
        return;
    }
    cap->nodeCount++;
    g_nodeWrite++;
}

/* ===========================================================================
 * Wrappers de slots — pattern unique :
 *     fnptr natif ; ret = p ? p(args...) : 0 ; log(slot, args..., ret).
 * Le forward reprend EXACTEMENT la pile d'args reçue du wrapper engine
 * (ordres dérivés du disasm : push droite→gauche, cleanup add esp,N).
 * =========================================================================== */

/* arity 1 : f(a0) */
#define GFXPT_WRAP1(NAME, SLOT, PFN)                                          \
static int __cdecl NAME(void* a0)                                             \
{                                                                             \
    PFN p = (PFN)GFXPT_Native((unsigned)(SLOT));                              \
    int r = p ? p(a0) : 0;                                                    \
    GFXPT_LogCall((unsigned)(SLOT), a0, 0, 0, 0, r);                          \
    return r;                                                                 \
}

/* arity 2 : f(a0, a1) */
#define GFXPT_WRAP2(NAME, SLOT, PFN)                                          \
static int __cdecl NAME(void* a0, void* a1)                                   \
{                                                                             \
    PFN p = (PFN)GFXPT_Native((unsigned)(SLOT));                              \
    int r = p ? p(a0, a1) : 0;                                                \
    GFXPT_LogCall((unsigned)(SLOT), a0, a1, 0, 0, r);                         \
    return r;                                                                 \
}

/* arity 3 (sémantique typée SetRenderState) */
#define GFXPT_WRAP3RS(NAME, SLOT, PFN)                                        \
static int __cdecl NAME(int a0, unsigned int a1, void* a2)                     \
{                                                                             \
    PFN p = (PFN)GFXPT_Native((unsigned)(SLOT));                              \
    int r = p ? p(a0, a1, a2) : 0;                                            \
    GFXPT_LogCall((unsigned)(SLOT), (const void*)(unsigned long)a0,           \
                  (const void*)(unsigned long)a1, a2, 0, r);                  \
    return r;                                                                 \
}

/* arity 4 : f(a0, a1, a2, engine) */
#define GFXPT_WRAP4(NAME, SLOT, PFN)                                          \
static int __cdecl NAME(void* a0, void* a1, void* a2, void* a3)               \
{                                                                             \
    PFN p = (PFN)GFXPT_Native((unsigned)(SLOT));                              \
    int r = p ? p(a0, a1, a2, a3) : 0;                                        \
    GFXPT_LogCall((unsigned)(SLOT), a0, a1, a2, a3, r);                       \
    return r;                                                                 \
}

/* arity 5 : f(x, y, w, h, engine) — slot 7 */
#define GFXPT_WRAP5V(NAME, SLOT, PFN)                                         \
static int __cdecl NAME(unsigned int a0, unsigned int a1, unsigned int a2,     \
                        unsigned int a3, void* a4)                            \
{                                                                             \
    PFN p = (PFN)GFXPT_Native((unsigned)(SLOT));                              \
    int r = p ? p(a0, a1, a2, a3, a4) : 0;                                    \
    GFXPT_LogCall((unsigned)(SLOT), (const void*)(unsigned long)a0,           \
                  (const void*)(unsigned long)a1, (const void*)(unsigned long)a2, \
                  (const void*)(unsigned long)a3, r);                         \
    return r;                                                                 \
}

/* arity 5 : f(a0..a4) — slot 25 */
#define GFXPT_WRAP5(NAME, SLOT, PFN)                                          \
static int __cdecl NAME(void* a0, void* a1, void* a2, void* a3, void* a4)     \
{                                                                             \
    PFN p = (PFN)GFXPT_Native((unsigned)(SLOT));                              \
    int r = p ? p(a0, a1, a2, a3, a4) : 0;                                    \
    GFXPT_LogCall((unsigned)(SLOT), a0, a1, a2, a3, r);                       \
    return r;                                                                 \
}

/* arity 6 : f(a0..a5) — slot 26 */
#define GFXPT_WRAP6(NAME, SLOT, PFN)                                          \
static int __cdecl NAME(void* a0, void* a1, void* a2, void* a3,               \
                        void* a4, void* a5)                                   \
{                                                                             \
    PFN p = (PFN)GFXPT_Native((unsigned)(SLOT));                              \
    int r = p ? p(a0, a1, a2, a3, a4, a5) : 0;                                \
    GFXPT_LogCall((unsigned)(SLOT), a0, a1, a2, a3, r);                       \
    return r;                                                                 \
}

/* draw-list (slots 43–64) : log + capture + forward */
#define GFXPT_WRAP_LIST(NAME, SLOT)                                           \
static int __cdecl NAME(void* ctx, void* node, void* arg)                     \
{                                                                             \
    GFXPT_PFN_ListFn p = (GFXPT_PFN_ListFn)GFXPT_Native((unsigned)(SLOT));    \
    int r = p ? p(ctx, node, arg) : 0;                                        \
    GFXPT_LogCall((unsigned)(SLOT), ctx, node, arg, 0, r);                    \
    GFXPT_CaptureCall((unsigned)(SLOT), ctx, node, arg);                      \
    return r;                                                                 \
}

/* --- slots 0–8 ----------------------------------------------------------- */
/* slot 0 Init — wrapper engine : call [eax] @0x409572 (dans 0x40942E), add esp,4 */
GFXPT_WRAP1(Proxy_Init, 0, GFXPT_PFN_Init)
/* slot 2 DirectX_7 — wrapper engine fn 0x41DEB0 : call [edx+8] @0x41DED4, add esp,4 */
GFXPT_WRAP1(Proxy_Slot2, 2, GFXPT_PFN_Slot2)
/* slot 3 DirectX_8 — chunk jumeau 0x41DEDE : call [edx+0xC] @0x41DF02, add esp,4 */
GFXPT_WRAP1(Proxy_Slot3, 3, GFXPT_PFN_Slot3)
/* slot 4 Present — Render_FramePresent_Dispatch 0x41DF0C : call [eax+0x10] @0x41DF32, add esp,4 */
GFXPT_WRAP1(Proxy_Present, 4, GFXPT_PFN_Present)
/* slot 5 prep buffer — isGetDrawBuf2 0x41DFBA : call [edx+0x14] @0x41DFE0, add esp,0x10 */
GFXPT_WRAP4(Proxy_Slot5, 5, GFXPT_PFN_Slot5)
/* slot 6 support frame — sub_41DF96 : call [edx+0x18] @0x41DFB0, add esp,4 */
GFXPT_WRAP1(Proxy_Slot6, 6, GFXPT_PFN_Slot6)
/* slot 7 viewport — gfx_driver_set_viewport_sub_41E070 : call [eax+0x1C] @0x41E106, add esp,0x14 */
GFXPT_WRAP5V(Proxy_SetViewport, 7, GFXPT_PFN_SetViewport)
/* slot 8 clear-color — isGetDrawBuf 0x41E168 : call [ecx+0x20] @0x41E1A5, add esp,8 */
GFXPT_WRAP2(Proxy_ClearColor, 8, GFXPT_PFN_ClearColor)

/* --- slots 18–24 --------------------------------------------------------- */
/* slot 18 — Thunk_BufApp_Off72 0x41E620 : call [edx+0x48] @0x41E646, add esp,0x10 */
GFXPT_WRAP4(Proxy_Slot18, 18, GFXPT_PFN_Slot18)
/* slot 19 — fn 0x419E89 @0x419EA5 : call [edx+0x4C] @0x419ED8, add esp,4 */
GFXPT_WRAP1(Proxy_Slot19, 19, GFXPT_PFN_Slot19)
/* slot 20 — PAS de wrapper engine au spec §5 (signature non dérivable) :
 * no-op log + return 0 ; GL natif 0x4381F8 reste hors d'atteinte (risque README). */
static int __cdecl Proxy_Slot20(void* a0)
{
    GFXPT_LogCall(20u, a0, 0, 0, 0, 0);
    return 0;
}
/* slot 21 Alt-only — wrapper 0x41B06B (site 0x41B15D) partiellement analysé :
 * call indirect non résolu → no-op log + return 0 (inatteignable sous proxy GL). */
static int __cdecl Proxy_Slot21(void* a0)
{
    GFXPT_LogCall(21u, a0, 0, 0, 0, 0);
    return 0;
}
/* slot 22 Alt-only (Release/eviction famille) — fn 0x419F38 : call [ecx+0x58] @0x419F57, add esp,8 */
GFXPT_WRAP2(Proxy_Slot22, 22, GFXPT_PFN_AltOnly2)
/* slot 23 Alt-only — fn 0x419F80 : call [ecx+0x5C] @0x419F9F, add esp,8 */
GFXPT_WRAP2(Proxy_Slot23, 23, GFXPT_PFN_AltOnly2)
/* slot 24 Alt-only — fn 0x417D84 @0x417E1A : call [ecx+0x60] @0x417E39, add esp,8 */
GFXPT_WRAP2(Proxy_Slot24, 24, GFXPT_PFN_AltOnly2)

/* --- slots 25–33 --------------------------------------------------------- */
/* slot 25 — fn 0x41EA06 @0x41EA18 : call [ecx+0x64] @0x41EA61, add esp,0x14
 *          (2e site fn 0x407EB4 : call [eax+0x64] @0x40828A, add esp,0x14) */
GFXPT_WRAP5(Proxy_Slot25, 25, GFXPT_PFN_Slot25)
/* slot 26 — fn 0x41E9C4 @0x41E9D6 : call [ecx+0x68] @0x41E9FC, add esp,0x18 */
GFXPT_WRAP6(Proxy_Slot26, 26, GFXPT_PFN_Slot26)
/* slot 27 — fn 0x4187F7 @0x4187FF : call [eax+0x6C] @0x418815, add esp,8 */
GFXPT_WRAP2(Proxy_Slot27, 27, GFXPT_PFN_Slot27)
/* slot 28 — fn 0x41EA71 @0x41EA83 : call [eax+0x70] @0x41EA99, add esp,8 */
GFXPT_WRAP2(Proxy_Slot28, 28, GFXPT_PFN_Slot28)
/* slot 29 SetRenderState — Gfx_SetRenderState 0x41E658 : call [ecx+0x74] @0x41E67E, add esp,0xC */
GFXPT_WRAP3RS(Proxy_SetRenderState, 29, GFXPT_PFN_SetRenderState)
/* slot 30 CommitRenderState — fn 0x41E77D @0x41E785 : call [eax+0x78] @0x41E79B, add esp,8 */
GFXPT_WRAP2(Proxy_Slot30, 30, GFXPT_PFN_CommitRenderState)
/* slot 31 — sites @0x41E69F/0x41E6D3/0x41E707 : calls @0x41E6C1/@0x41E6F5/@0x41E71D, add esp,8 */
GFXPT_WRAP2(Proxy_Slot31, 31, GFXPT_PFN_Slot31)
/* slot 32 — fn 0x41E727 @0x41E72F : call [eax+0x80] @0x41E745, add esp,8 */
GFXPT_WRAP2(Proxy_Slot32, 32, GFXPT_PFN_Slot32)
/* slot 33 SetBlendMode — GfxDriver_SetBlendMode 0x41E75A : call [eax+0x84] @0x41E770, add esp,8 */
GFXPT_WRAP2(Proxy_SetBlendMode, 33, GFXPT_PFN_SetBlendMode)

/* --- slots 35–41 --------------------------------------------------------- */
/* slot 35 swap buffers — fn 0x41E7D8 @0x41E7E0 : call [eax+0x8C] @0x41E7F6, add esp,8 */
GFXPT_WRAP2(Proxy_Slot35, 35, GFXPT_PFN_Slot35)
/* slots 36 (override→35), 34 (hook gardé), 37 (libre) : laissés à 0 (miroir natif). */
/* slot 38 — fn @0x41E924 : call [eax+0x98] @0x41E93A, add esp,8 */
GFXPT_WRAP2(Proxy_Slot38, 38, GFXPT_PFN_Slot38)
/* slot 39 SelectRenderTarget — GfxDriver_SelectRenderTarget 0x41E947 : call [eax+0x9C] @0x41E965, add esp,8 */
GFXPT_WRAP2(Proxy_SelectRenderTarget, 39, GFXPT_PFN_SelectRenderTarget)
/* slot 40 BeginScene — GfxDriver_BeginScene 0x41E972 : call [eax+0xA0] @0x41E990, add esp,8 */
GFXPT_WRAP2(Proxy_BeginScene, 40, GFXPT_PFN_BeginScene)
/* slot 41 LeaveScene — GfxDriver_LeaveScene 0x41E99D : call [edx+0xA4] @0x41E9B7, add esp,4 */
GFXPT_WRAP1(Proxy_LeaveScene, 41, GFXPT_PFN_LeaveScene)

/* --- slots 43–64 draw-list (spec §6) ------------------------------------- */
GFXPT_WRAP_LIST(Proxy_List43, 43)  /* types 0,8  setup (bind 0x416358) */
GFXPT_WRAP_LIST(Proxy_List44, 44)  /* types 2,10 setup (bind 0x416381) */
GFXPT_WRAP_LIST(Proxy_List45, 45)  /* pas de case de bind connue — capture passive */
GFXPT_WRAP_LIST(Proxy_List46, 46)  /* types 4,6,12,14,17 : écriture d'état [ecx+0xB8], pas fnptr — capture passive */
GFXPT_WRAP_LIST(Proxy_List47, 47)  /* pas de case de bind connue — capture passive */
GFXPT_WRAP_LIST(Proxy_List48, 48)  /* types 0,8 walk (bind 0x416306) */
GFXPT_WRAP_LIST(Proxy_List49, 49)  /* types 2,10 walk (bind 0x41632F) */
GFXPT_WRAP_LIST(Proxy_List50, 50)  /* pas de case de bind connue — capture passive */
GFXPT_WRAP_LIST(Proxy_List51, 51)  /* pas de case de bind connue — capture passive */
GFXPT_WRAP_LIST(Proxy_List52, 52)  /* types 1,9 setup (bind 0x4164FF) */
GFXPT_WRAP_LIST(Proxy_List53, 53)  /* types 3,11 setup (bind 0x416528) */
GFXPT_WRAP_LIST(Proxy_List54, 54)  /* pas de case de bind connue — capture passive */
GFXPT_WRAP_LIST(Proxy_List55, 55)  /* types 5,7,13,15 setup seul (bloc 0x416551) */
GFXPT_WRAP_LIST(Proxy_List56, 56)  /* pas de case de bind connue — capture passive */
GFXPT_WRAP_LIST(Proxy_List57, 57)  /* types 1,9 walk (bind 0x4164AD) */
GFXPT_WRAP_LIST(Proxy_List58, 58)  /* types 3,11 walk (bind 0x4164D6) */
GFXPT_WRAP_LIST(Proxy_List59, 59)  /* pas de case de bind connue — capture passive */
GFXPT_WRAP_LIST(Proxy_List60, 60)  /* pas de case de bind connue — capture passive */
GFXPT_WRAP_LIST(Proxy_List61, 61)  /* type 18 setup (bind 0x416651) */
GFXPT_WRAP_LIST(Proxy_List62, 62)  /* type 19 setup (bind 0x416677) */
GFXPT_WRAP_LIST(Proxy_List63, 63)  /* type 18 walk (bind 0x416651) */
GFXPT_WRAP_LIST(Proxy_List64, 64)  /* type 19 walk (bind 0x416677) */

/* --- slot 65 ------------------------------------------------------------- */
/* slot 65 Alt-only, consumer engine-level — fn 0x4097A0 @0x4097A8 : call [eax+0x104] @0x4097C6, add esp,4 */
GFXPT_WRAP1(Proxy_Slot65, 65, GFXPT_PFN_Slot65)

/* slot 1 Uninit/shutdown — wrapper engine fn 0x409670 : call [edx+4] @0x4096F2, add esp,4.
 * Le forward natif précède la fermeture du CSV ; la fn FreeLibrary @0x40971A suit. */
static int __cdecl Proxy_UninitAndCloseLog(void* engine)
{
    GFXPT_PFN_Uninit p;
    int r;
    if (!g_nativeAlive)                 /* déjà uninit (re-boot engine) */
    {
        GFXPT_LogCall(1u, engine, 0, 0, 0, 0);
        return 0;
    }
    p = (GFXPT_PFN_Uninit)GFXPT_Native(1u);
    r = p ? p(engine) : 0;
    GFXPT_LogCall(1u, engine, 0, 0, 0, r);
    if (g_logFile)
    {
        fflush(g_logFile);
        fclose(g_logFile);
        g_logFile = 0;                  /* ré-ouverture lazy à la prochaine session */
    }
    g_nativeAlive = 0;
    return r;
}

/* ===========================================================================
 * Remplissage du proxy (miroir exact du pattern des ctors natifs)
 * =========================================================================== */
static void GFXPT_FillProxy(void)
{
    void** slots = (void**)g_proxy;
    void** nat = (void**)g_native;
    unsigned i;

    for (i = 0; i < 66u; ++i)
        slots[i] = 0;

    /* slots 0–8 */
    slots[0]  = (void*)Proxy_Init;            /* Init (log + forward) */
    slots[1]  = (void*)Proxy_UninitAndCloseLog;
    slots[2]  = (void*)Proxy_Slot2;
    slots[3]  = (void*)Proxy_Slot3;
    slots[4]  = (void*)Proxy_Present;         /* present natif préservé (Mode A) */
    slots[5]  = (void*)Proxy_Slot5;
    slots[6]  = (void*)Proxy_Slot6;
    slots[7]  = (void*)Proxy_SetViewport;
    slots[8]  = (void*)Proxy_ClearColor;

    /* slots 9–14 (+0x24..+0x38) : état inline, initialisés à 0 (VirtualAlloc
     * zero-fill). L'engine les écrit directement via isGetDrawBuf (0x41E168
     * copie le vec4 clear-color vers driver+0x28..+0x34). */

    /* slots 15 (+0x3C) inerte, 34 (+0x88), 36 (+0x90), 37 (+0x94) : 0 (miroir natif). */

    /* slots 16/17 : fnptrs natifs partagés, copie telle quelle (pas de wrapper). */
    slots[16] = nat[16];
    slots[17] = nat[17];

    /* slots 18–33 */
    slots[18] = (void*)Proxy_Slot18;
    slots[19] = (void*)Proxy_Slot19;
    slots[20] = (void*)Proxy_Slot20;          /* no-op log (signature non dérivable) */
    slots[21] = (void*)Proxy_Slot21;          /* Alt-only no-op log */
    slots[22] = (void*)Proxy_Slot22;          /* Alt-only forward-guard */
    slots[23] = (void*)Proxy_Slot23;          /* Alt-only forward-guard */
    slots[24] = (void*)Proxy_Slot24;          /* Alt-only forward-guard */
    slots[25] = (void*)Proxy_Slot25;
    slots[26] = (void*)Proxy_Slot26;
    slots[27] = (void*)Proxy_Slot27;
    slots[28] = (void*)Proxy_Slot28;
    slots[29] = (void*)Proxy_SetRenderState;
    slots[30] = (void*)Proxy_Slot30;
    slots[31] = (void*)Proxy_Slot31;
    slots[32] = (void*)Proxy_Slot32;
    slots[33] = (void*)Proxy_SetBlendMode;

    /* slots 35, 38–41 */
    slots[35] = (void*)Proxy_Slot35;
    slots[38] = (void*)Proxy_Slot38;
    slots[39] = (void*)Proxy_SelectRenderTarget;
    slots[40] = (void*)Proxy_BeginScene;
    slots[41] = (void*)Proxy_LeaveScene;

    /* slot 42 : pas de wrapper engine au spec (hors 18–41, hors liste =0) —
     * copie transparente du fnptr natif 0x439000, comportement préservé. */
    slots[42] = nat[42];

    /* slots 43–64 : draw-list setup/walk (log + capture + forward) */
    slots[43] = (void*)Proxy_List43;
    slots[44] = (void*)Proxy_List44;
    slots[45] = (void*)Proxy_List45;
    slots[46] = (void*)Proxy_List46;
    slots[47] = (void*)Proxy_List47;
    slots[48] = (void*)Proxy_List48;
    slots[49] = (void*)Proxy_List49;
    slots[50] = (void*)Proxy_List50;
    slots[51] = (void*)Proxy_List51;
    slots[52] = (void*)Proxy_List52;
    slots[53] = (void*)Proxy_List53;
    slots[54] = (void*)Proxy_List54;
    slots[55] = (void*)Proxy_List55;
    slots[56] = (void*)Proxy_List56;
    slots[57] = (void*)Proxy_List57;
    slots[58] = (void*)Proxy_List58;
    slots[59] = (void*)Proxy_List59;
    slots[60] = (void*)Proxy_List60;
    slots[61] = (void*)Proxy_List61;
    slots[62] = (void*)Proxy_List62;
    slots[63] = (void*)Proxy_List63;
    slots[64] = (void*)Proxy_List64;

    /* slot 65 : wrapper Alt-only (slot natif GL = NULL → return 0 ; jamais NULL fnptr). */
    slots[65] = (void*)Proxy_Slot65;
}

/* ===========================================================================
 * Replay (Mode A)
 * =========================================================================== */
int __cdecl Passthrough_ReplayCaptured(void)
{
    unsigned long first;
    unsigned long captured = 0;
    unsigned long emitted = 0;
    char buf[160];

    GFXPT_LogOpen();
    if (!g_native || !g_nativeAlive)
    {
        GFXPT_ODS("gfx_passthrough: replay impossible (pas de driver natif vivant)\n");
        return 0;
    }
    first = (g_capWrite > GFXPT_CAP_COUNT) ? (g_capWrite - GFXPT_CAP_COUNT) : 0u;
    for (; first < g_capWrite; ++first)
    {
        GFXPT_Capture* cap = &g_caps[(unsigned)(first & (GFXPT_CAP_COUNT - 1u))];
        void* fn;

        if (cap->slot < 43u || cap->slot > 64u)
            continue;
        captured++;
        if (!g_replayLive)
            continue;                       /* Mode A : dry-run, validation seule */
        fn = GFXPT_Native(cap->slot);
        if (fn)
        {
            unsigned long i;
            for (i = 0; i < cap->nodeCount; ++i)
            {
                unsigned long seq = cap->firstNodeSeq + i;
                if (seq >= g_nodeWrite)
                    break;
                if (g_nodeWrite - seq > GFXPT_NODE_COUNT)
                    continue;               /* node évincé du ring */
                ((GFXPT_PFN_ListFn)fn)(cap->ctx,
                    &g_nodes[(unsigned)(seq & (GFXPT_NODE_COUNT - 1u)) * GFXPT_NODE_BYTES],
                    cap->arg);
                emitted++;
            }
        }
    }
    sprintf(buf, "gfx_passthrough: replay: %lu captures, %lu noeuds re-emis (live=%d)\n",
            captured, emitted, g_replayLive);
    GFXPT_ODS(buf);
    return (int)captured;
}

void __cdecl Passthrough_SetReplayLive(int enable)
{
    g_replayLive = enable ? 1 : 0;
}

unsigned long __cdecl Passthrough_CaptureCount(void)
{
    return g_capWrite;
}

/* ===========================================================================
 * Factory type-2 — proto imposé par le boot natif :
 *   driver = *(engine+0xA74) = factory(engine)   (call [ebp-8] @0x40951D, cdecl, 1 arg)
 *   slot 0 = call [driver]  @0x409572   (Init immédiat)
 * =========================================================================== */
void* __cdecl new_dll_graphics_driver(void* engine)
{
    GFXPT_PFN_BackendCtor ctor;
    void* native;
    void* mem;
    char buf[128];

    if (!engine)
        return 0;

    if (g_proxy && g_nativeAlive)
        return g_proxy;                     /* ré-entrée : proxy déjà en place */

    if (!g_hostModule)
        g_hostModule = GetModuleHandleA(NULL);   /* base EXE (0x400000 attendu) */
    if (!g_hostModule)
        return 0;

    ctor = (GFXPT_PFN_BackendCtor)GFXPT_HostEA(GFXPT_EA_CTOR_OPENGL);
    native = ctor(engine);
    if (!native)
    {
        GFXPT_ODS("gfx_passthrough: ctor OpenGL natif 0x4252B0 a echoue\n");
        return 0;
    }
    g_native = native;
    g_nativeAlive = 1;

    if (!g_proxy)
    {
        mem = VirtualAlloc(NULL, (SIZE_T)GFXPT_DRIVER_OBJ_BYTES,
                           MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);
        if (!mem)
        {
            GFXPT_ODS("gfx_passthrough: VirtualAlloc 0x108 a echoue\n");
            g_native = 0;
            g_nativeAlive = 0;
            return 0;
        }
        g_proxy = mem;                      /* zero-fill : slots 9–15/34/36/37 = 0 */
    }

    GFXPT_FillProxy();
    GFXPT_LogOpen();

    sprintf(buf, "gfx_passthrough: native=0x%p proxy=0x%p engine=0x%p\n",
            g_native, g_proxy, engine);
    GFXPT_ODS(buf);
    return g_proxy;
}

/* ===========================================================================
 * Boot hook v2 — armement du chemin type 2 au premier CheckRegistry.
 *
 * Faits (2026-09-23) :
 *  - Le loader DotEmu charge AF3DN.P (= cette DLL) avant le boot graphics
 *    mais n'appelle AUCUN export : le chemin type 2 natif exige que
 *    engine+0xBA8 (current_gfx_driver) = 2 et engine+0xBD0
 *    (create_gfx_driver) = factory soient armés avant 0x40942E
 *    (mécanisme FFNx : ffnx-driver-reference.md §1.2, provenance lot +6).
 *  - Point d'ancrage : CheckRegistry 0x401890, __cdecl(engine), appelé
 *    juste avant Gfx_InitializeSelectedBackend (call @0x401905) ; le decomp
 *    0x401890 prouve qu'il ne touche jamais +0xBA8/+0xBD0 (registry son,
 *    mutex, dispatch uniquement) → écriture pre-call sans course.
 *  - Preimage 5 bytes sur 064d466b… : 83 EC 38 56 57
 *    (sub esp,38h / push esi / push edi — déplaçables, pas de RIP-relative).
 *  - Détour posé dans DllMain (pattern FFNx replace_function au
 *    DLL_PROCESS_ATTACH : VirtualProtect + memcpy uniquement).
 *  - Preimage divergente → refus, AUCUNE écriture (build non cible).
 * =========================================================================== */

static const BYTE GFXPT_BootPreimage[5] = { 0x83u, 0xECu, 0x38u, 0x56u, 0x57u };
static void* volatile g_bootTrampoline;   /* preimage + jmp retour (16 bytes) */
static volatile LONG g_bootArmed;         /* champs écrits ? (idempotent) */
static volatile LONG g_bootHookInstalled; /* E9 déjà posé ? */

static void GFXPT_BootArm(void* engine)
{
    char buf[96];

    if (!engine)
        return;
    if (InterlockedCompareExchange(&g_bootArmed, 1, 0) != 0)
        return;                             /* déjà armé (idempotent) */

    *((volatile DWORD*)engine + (0xBA8u / 4)) = 2;                    /* current_gfx_driver = 2 */
    *((volatile DWORD*)engine + (0xBD0u / 4)) = (DWORD)&new_dll_graphics_driver;

    GFXPT_LogOpen();
    if (g_logFile)
    {
        fprintf(g_logFile, "#boot,armed,engine=0x%p,factory=0x%p\n",
                engine, (const void*)&new_dll_graphics_driver);
        fflush(g_logFile);
    }
    sprintf(buf, "gfx_passthrough: boot armed engine=0x%p\n", engine);
    GFXPT_ODS(buf);
}

__declspec(naked) static void GFXPT_CheckRegistryDetour(void)
{
    __asm
    {
        pushad
        pushfd
        mov  eax, [esp + 0x24]             /* arg0 = engine (pushad 32 + pushfd 4) */
        push eax
        call GFXPT_BootArm
        add  esp, 4
        popfd
        popad
        jmp  dword ptr [g_bootTrampoline]
    }
}

int __cdecl Passthrough_InstallBootHook(void* reserved)
{
    BYTE*  target;
    BYTE*  tramp;
    BYTE*  detour;
    DWORD  oldProtect;
    DWORD  rel32;

    (void)reserved;

    if (InterlockedCompareExchange(&g_bootHookInstalled, 1, 0) != 0)
        return 1;                           /* déjà installé */

    if (!g_hostModule)
        g_hostModule = GetModuleHandleA(NULL);
    if (!g_hostModule)
        return 0;

    target = (BYTE*)GFXPT_HostEA(GFXPT_EA_CHECKREGISTRY);
    if (memcmp(target, GFXPT_BootPreimage, sizeof(GFXPT_BootPreimage)) != 0)
    {
        /* Build non cible (hash-bound) : refus, aucune écriture. */
        GFXPT_ODS("gfx_passthrough: CheckRegistry preimage inattendue, hook refuse\n");
        InterlockedExchange(&g_bootHookInstalled, 0);
        return 0;
    }

    tramp = (BYTE*)VirtualAlloc(NULL, 16, MEM_COMMIT | MEM_RESERVE,
                                PAGE_EXECUTE_READWRITE);
    if (!tramp)
        return 0;
    memcpy(tramp, GFXPT_BootPreimage, sizeof(GFXPT_BootPreimage));
    tramp[5] = 0xE9;
    rel32 = (DWORD)((target + 5) - (tramp + 10));
    *(DWORD*)(tramp + 6) = rel32;
    g_bootTrampoline = tramp;

    detour = (BYTE*)&GFXPT_CheckRegistryDetour;
    if (!VirtualProtect(target, 5, PAGE_EXECUTE_READWRITE, &oldProtect))
    {
        VirtualFree(tramp, 0, MEM_RELEASE);
        g_bootTrampoline = 0;
        return 0;
    }
    rel32 = (DWORD)(detour - (target + 5));
    target[0] = 0xE9;
    *(DWORD*)(target + 1) = rel32;
    VirtualProtect(target, 5, oldProtect, &oldProtect);
    FlushInstructionCache(GetCurrentProcess(), target, 5);

    GFXPT_ODS("gfx_passthrough: boot hook installe sur CheckRegistry 0x401890\n");
    return 1;
}

/* ===========================================================================
 * DllMain — flag + boot hook v2 (VirtualProtect/memcpy uniquement, pattern
 * FFNx replace_function au DLL_PROCESS_ATTACH ; aucun chargement de lib).
 * Contrainte shutdown 0x409670/FreeLibrary inchangée.
 * =========================================================================== */
static int g_dllAttached = 0;

BOOL WINAPI DllMain(HINSTANCE hinstDLL, DWORD fdwReason, LPVOID lpvReserved)
{
    char disableFlag[8];

    (void)lpvReserved;
    if (fdwReason == DLL_PROCESS_ATTACH)
    {
        g_dllAttached = 1;
        g_hinstDLL = hinstDLL;
        /* Boot hook v2 actif par défaut (mode AF3DN.P). FF8_PASSTHROUGH_BOOTHOOK=0
           pour l'inertie (tests hors run live). */
        if (GetEnvironmentVariableA("FF8_PASSTHROUGH_BOOTHOOK", disableFlag,
                                    (DWORD)sizeof(disableFlag)) == 0
            || disableFlag[0] != '0')
        {
            Passthrough_InstallBootHook(0);
        }
    }
    else if (fdwReason == DLL_PROCESS_DETACH)
    {
        g_dllAttached = 0;
    }
    return TRUE;
}
