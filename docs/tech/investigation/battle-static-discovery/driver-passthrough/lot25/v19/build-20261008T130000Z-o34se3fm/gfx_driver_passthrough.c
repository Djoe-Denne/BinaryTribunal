/* ===========================================================================
 * gfx_driver_passthrough.c â€” prototype DLL Â« observer Mode A Â» (lot 12, re-ff8)
 * Version v8 (AF3DN.P) â€” extension du dump v7 avec capture du miroir VRAM
 * (TX07) ; passthrough v6.1 avec dump mÃ©moire des draw lists au vol.
 *
 * RÃ´le : factory type-2 `new_dll_graphics_driver` + proxy complet de l'objet
 * driver (66 DWORDs, 0x108). Le driver natif (ctor 0x4257D0 DDrawAlt case 0
 * vanilla ; 0x4252B0 OpenGL case 3) est crÃ©Ã© par la factory et gardÃ© en static
 * (g_native) â€” il n'est JAMAIS retournÃ© Ã  l'engine. L'objet proxy porte :
 *   - des wrappers __cdecl (log CSV + forward vers le slot Ã©quivalent de
 *     g_native si non-nul, sinon return 0) pour slots 0â€“8, 18â€“33, 35, 38â€“41,
 *     43â€“64, 65 ;
 *   - des copies de fnptrs natifs pour slots 16/17 (partagÃ©s) et 42 (pas de
 *     wrapper engine au spec â€” choix transparent, documentÃ©) ;
 *   - 0 pour slots 15/34/36/37 (miroir des ctors natifs ; 36 retombe sur 35
 *     via le wrapper engine 0x41E803) ;
 *   - un no-op log pour slots 20/21 (signature non dÃ©rivable / Alt-only).
 *
 * Logging : OutputDebugStringA (Ã©vÃ©nements majeurs) + CSV lazy
 * (FF8_PASSTHROUGH_LOG ; env absent â†’ ODS seul). DllMain trace le chargement ;
 * v17 ajoute une trace stage0 texte bornee, active seulement par sidecar.
 * Capture/replay draw-list : slots 43â€“64 capturÃ©s (copie 24 octets/node,
 * pointer-free) ; Passthrough_ReplayCaptured rÃ©-Ã©met via les slots natifs
 * (dry-run par dÃ©faut). Replay diffÃ©rÃ©e complÃ¨te = Mode B/C.
 *
 * v7 â€” dump mÃ©moire (nouveau, additif, CSV v6.1 inchangÃ©) :
 *   - Armement : sidecar `gfx_passthrough.dump` Ã  cÃ´tÃ© de la DLL, vÃ©rifiÃ©
 *     UNIQUEMENT au present dispatch (stat cheap) ; prÃ©sent â†’ capture des 16
 *     prochains frames (seq..seq+15) puis suppression du sidecar.
 *   - Capture : dans chaque wrapper 43â€“64, si la fenÃªtre est armÃ©e pour le
 *     seq courant, le node visitÃ© est copiÃ© dans un ring RAM BSS 64 Mo selon
 *     la table de closure slotâ†’gÃ©omÃ©trie (voir le bloc Â« v7 â€” dump mÃ©moire Â»
 *     ci-dessous, provenance : ctor 0x4257D0 + decomp 0x43E24A/0x43E356 +
 *     bytes live du PE 064d466b). Aucune IO dans le detour draw ; SEH sur
 *     chaque copie ; gardes vcountâ‰¤4096, icountâ‰¤16384, nodeâ‰¤256 Ko,
 *     4096 records/frame.
 *   - Flush : au present dispatch, ring non vide â†’ append binaire vers
 *     `gfx_passthrough_dump.bin` + ligne dans `gfx_passthrough_dump.log`
 *     (Ã  cÃ´tÃ© de la DLL), puis ring vidÃ©. Ouvert/fermÃ© en append.
 *
 * v8 additifs â€” capture du miroir VRAM (TX07, frame-level) : extension
 *   additive du dump v7 (fermeture de la chaÃ®ne texture du spec
 *   driver-abi-spec.md Â§6.2, lot 14) ; le bloc Â« v8 â€” dump mÃ©moire (TX07) Â»
 *   ci-dessous (enregistrements : hdr 32 o + miroir VRAM complet 0x100000 o
 *   = 0x100020 o ; Ã©mission UNE fois par frame armÃ© â€” dÃ©dup par pulse,
 *   premier node walk texturÃ©, Ã  la tÃªte de GFXPT_DumpNode pour les slots
 *   walk 48â€“50/57â€“59/63â€“64/51/60 ; additif log `tx=N`) â€” purement
 *   additif : aucun chemin engine natif n'est modifiÃ© (blits VRAM, closure).
 *
 * v9 additifs â€” ids texture par node (ND08) + ligne CLUT systÃ¨me (TX07) :
 *   (1) footer texture APPEND au payload des records geom_kind==2 â€” magic
 *   'ND07' â†’ 'ND08', build 0x5639 : tpage/mode (texinfo = *(node+0x2C)),
 *   clut = *(u16*)(ctx+0x448), id_count + ids = stream u8-par-groupe
 *   {51,60} tel que consommÃ© par le walk natif (cap 255, dropped_ids u32).
 *   Analyse noise-render : tpage/mode/clut vivent AU-DELÃ€ de la copie 24 o
 *   du node ; le grain 16 couleurs = sous-palette par groupe d'id ;
 *   (2) TX07 : payload + sys_clut_row[2048] = copie de &unk_1B47818 +
 *   2048*((clut&0x7FFF)>>6) (unk_1B47818 = base statique littÃ©rale â€”
 *   HostEA EST l'adresse de la table) â€” record passe Ã  0x100820.
 *
 * v10 additifs â€” ressource texture TIM bataille (TR08, per-texobj) :
 *   (1) NOUVEAU record UN par texobj unique PAR FRAME (dÃ©dup par VALEUR du
 *   pointeur T â€” table per-frame g_resSeen[64], reset au pulse), Ã©mis au
 *   PREMIER node walk texturÃ© qui le rÃ©fÃ©rence, AVANT le ND08 de ce node
 *   (mÃªme point d'Ã©mission que TX07) : hdr 10 x u32 (magic 'TR08'
 *   0x38305254, build 0x563A, seq, texobj, w, h, pal_entries, pal_count
 *   cap 32, pixel_size cap 65536, clut_size cap 32768) + pixels (1 o/texel,
 *   *(T+0xD8)) + raw_clut (u32/couleur, *(T+0x60)) â€” record max 0x18028 ;
 *   Ã©chec SEH d'une copie â†’ aucun record (rÃ¨gle TX) ; cap 32/frame (log
 *   `tr=N`) ;
 *   (2) ND08 : footer +1 u32 APPEND (texobj = *(texinfo+0x10)) â€” magic
 *   inchangÃ©, le dÃ©codeur distingue v9/v10 par le BUILD id.
 *
 * Shutdown natif : fn 0x409670 appelle slot 1 puis FreeLibrary(engine+0xBCC) ;
 * DllMain conserve les hooks attach v16 ; DETACH ne fait qu'un snapshot v17
 * et le flag existant (aucun nouvel install/restore).
 *
 * Ground truth = ASM (FF8_EN.exe 064d466bâ€¦, base 0x400000) â€” EAs du spec
 * driver-abi-spec.md Â§1/Â§5 uniquement. C pur MSVC x86 /W3, __cdecl partout.
 * =========================================================================== */

/* ===========================================================================
 * v15 (lot 24) â€” FORK APPEND-ONLY du writer v14 (0x5641, lot 22 â€” copies
 * fraÃ®ches 508ab14b/01dd5c43 ; SOURCE v14 INTOUCHÃ‰E : lot22/ et racine).
 * Contrat = PROMPT_lot24-stage0-instrumentation-0x5642.md (mÃªme rÃ©pertoire
 * parent). Deltas v14â†’v15 :
 *   - build 0x5642 ; VERSION_TEXT Â« v15-lot24 Â» ;
 *   - ST09 40 o (10 x u32) : +ctx_token/+device_token bruts opaques
 *     (0 = non capturÃ©) ; kinds 8 STAGE0_REQ / 9 STAGE0_RESULT ;
 *   - flags footer : bit1 STAGE0_VALID (armÃ© ET kind9 vu), bit2 INCOMPLETE
 *     dÃ©sormais aussi sur cap/overflow, bit3 ST_LOSS (â‰¥1 refus d'Ã©mission
 *     ST09 sur la frame) â€” plus aucune perte muette (1 refus = 1 lost +
 *     1 drop) ;
 *   - kind2 (30/31/32) aux = retour natif brut ; kind6 aux = retour natif
 *     brut, device_token = gate AC4 ; DumpNode cdecl 6 args (+nativeResult) ;
 *   - footer ND08 +6 u32 (triple stage0 cache writer + st_emitted|st_lost),
 *     record max 0x28188 âŠ‚ cap 0x100C80 inchangÃ©e ;
 *   - instrumentation stage0 SetTexture option B (sites g_hostModule+
 *     0x1EF5D / +0x1EF72, prÃ©image FF 90 98 00 00 00, stub naked exportÃ©,
 *     installateur/restore fail-closed) ; v16 auto-installe dans DllMain
 *     si gfx_passthrough.stage0 est present et nohook absent.
 * IntouchÃ©s : fopen "ab"/flush/replay, dead-code GFXPT_BootPreimage,
 * 9 forwards PE. v17-lot25diag (0x5644), fork v16-lot25 (0x5643) : diagnostics
 * et fermeture stage0 avant unload ; ST09/ND08/ASM/installation attach inchanges.
 * Bit1 = Armed && Seen :
 * bit1=0 et kinds 8/9 absents ne prouvent PAS un refus d'installation.
 * =========================================================================== */
#define _CRT_SECURE_NO_WARNINGS   /* fopen/fprintf/sprintf (C4996) */

#include <windows.h>
#include <tlhelp32.h>
#include <stdio.h>
#include <string.h>

#include "gfx_driver_passthrough.h"

/* ===========================================================================
 * EAs ground truth (constantes nommÃ©es + evidence)
 * =========================================================================== */
#define GFXPT_EA_HOST_BASE       0x400000ul /* base attendue de FF8_EN.exe */
/* Gfx_LoadExternalBackendFactory (triple decomp existant) â€” appelÃ© par le
 * lanceur uniquement (zÃ©ro caller statique vÃ©rifiÃ© 2026-09-20). La DLL ne
 * l'appelle pas ; constante documentaire. */
#define GFXPT_EA_FACTORY_LOADER  0x409805ul
/* Gfx_InitializeSelectedBackend â€” boot natif (call @0x401905). Documentaire. */
#define GFXPT_EA_INIT_BACKEND    0x40942Eul
/* Shutdown : slot 1 @0x4096F2 puis FreeLibrary @0x40971A. Documentaire. */
#define GFXPT_EA_SHUTDOWN        0x409670ul
/* presentation__RenderBackend_Construct_OpenGL â€” ctor natif appelÃ© ici (1 arg __cdecl). */
#define GFXPT_EA_CTOR_OPENGL     0x4252B0ul
#define GFXPT_EA_CTOR_DDRAWALT   0x4257D0ul /* case 0 vanilla (build DotEmu 064d466b) */

#define GFXPT_EA_CHECKREGISTRY   0x401890ul /* v2-v5.5 : retirÃ© du live en v6 */
#define GFXPT_EA_ODSTRACE        0x403D99ul /* boot v5.2 : OutputDebugString_1 (traceur du jeu) */
#define GFXPT_EA_PRESENTDISPATCH 0x41DF0Cul /* boot v6 : present dispatch (point de consommation du driver) */
/* GetBufApp_0xA74 â€” rÃ©fÃ©rence (spec Â§4) ; non appelÃ© par ce .c. */
#define GFXPT_EA_GETBUFAPP       0x4098EEul

/* v8 â€” EAs BSS engine, chaines texture (SPEC Â§6.2 uniquement â€” no offset
 * invented) : base VRAM mmap (page pixel addr formula C, dword_1CB602C),
 * dword_1CA89A8 = live CLUT PTR (256 x u16; written word_1CA89B8 = clut &
 * 0x7FFF + (int)&unk_1B47818 + 2048*(clut>>6) + 32*(clut&0x3F) by
 * sub_45B920 â€” SPEC Â§6.2-C), dword_1CA89E8 = luma-shift base (alpha mode),
 * dword_B7DB44 = mode-2 RGB555-path flag stored by
 * Gfx_AllocTexturePageSlot (decomp 0x464F70: dword_B7DB44 =
 * (*(int*)(hit+0x44) == 0x7E0), within mode==2 arm only) and read by
 * TexStaging_BlitRows 0x4675C0 mode-2 PATH (decomp 0x4675C0). */
#define GFXPT_EA_VRAM_BASE       0x1CB602Cul /* dword_1CB602C (pointeur base VRAM, formule pixel Â§6.2-C) */
#define GFXPT_EA_VRAM_CLUT_LIVE  0x1CA89A8ul /* dword_1CA89A8 (live CLUT u16[256] non.rotated) */
#define GFXPT_EA_VRAM_CLUT_LUTB  0x1B47818ul /* unk_1B47818 (CLUT staging base, sub_45B920) */
#define GFXPT_EA_VRAM_LUMA       0x1CA89E8ul /* dword_1CA89E8 (luma-shift base, alpha mode) */
#define GFXPT_EA_M_B7DB44        0xB7DB44ul  /* dword_B7DB44 (flag, TexStaging_BlitRows path.2) */
/* v8 TX07 frame-level : word_1CA89B8 = id CLUT vivant (sub_45B920 : le u16
 * vit dans ce dword, word + 0x7FFF) â€” lecture SEH du dword CONTENANT, copie
 * BRUT dans le hdr TX07, mask & 0x7FFF appliquÃ© dÃ©code-side. La base table
 * systÃ¨me CLUT reste GFXPT_EA_VRAM_CLUT_LUTB (0x1B47818, sub_45B920 :
 * base + 2048*(clut>>6) + 32*(clut&0x3F)). */
#define GFXPT_EA_CLUT_ID         0x1CA89B8ul /* word_1CA89B8 (id CLUT vivant â€” dword contenant lu SEH) */
/* v9 â€” alias documentaire : la table CLUT systÃ¨me EST unk_1B47818 (static
 * array, base LITTÃ‰RALE) â€” la row copiÃ©e dans TX07 = HostEA(GFXPT_EA_SYS_CLUT)
 * + 2048*((clut_now & 0x7FFF) >> 6) (sub_45B920 : la fenÃªtre CLUT d'un id
 * vit dans la row `clut>>6`, 64 sous-CLUT Ã— 32 o). */
#define GFXPT_EA_SYS_CLUT        GFXPT_EA_VRAM_CLUT_LUTB /* 0x1B47818 (unk_1B47818) */

#define GFXPT_DRIVER_OBJ_BYTES   0x108ul   /* 66 DWORDs */

/* Ctor natif backend â€” proto void* __cdecl(void* engine)
 * (call sites boot 0x4094D9/0x409531 : add esp,4). */
typedef void* (__cdecl *GFXPT_PFN_BackendCtor)(void* engine);

/* EA absolue â†’ VA hÃ´te : base du module EXE + delta depuis 0x400000. */
#define GFXPT_HostEA(ea) \
    ((void*)((unsigned long)g_hostModule + ((ea) - GFXPT_EA_HOST_BASE)))

/* ===========================================================================
 * Exports (noms non dÃ©corÃ©s pour GetProcAddress("new_dll_graphics_driver"))
 * =========================================================================== */
#pragma comment(linker, "/EXPORT:new_dll_graphics_driver=_new_dll_graphics_driver")
#pragma comment(linker, "/EXPORT:Passthrough_ReplayCaptured=_Passthrough_ReplayCaptured")
#pragma comment(linker, "/EXPORT:Passthrough_SetReplayLive=_Passthrough_SetReplayLive")
#pragma comment(linker, "/EXPORT:Passthrough_InstallBootHook=_Passthrough_InstallBootHook")
/* v15 (lot 24) â€” instrumentation stage0 SetTexture : export explicite ;
 * v16/v17 : auto-install attach opt-in par sidecar + stub naked testable par
 * GetProcAddress. Total : 14 + 3 = 17 exports (9 forwards PE inchangÃ©s). */
#pragma comment(linker, "/EXPORT:Passthrough_InstallStage0Hooks=_Passthrough_InstallStage0Hooks")
#pragma comment(linker, "/EXPORT:Passthrough_RestoreStage0Hooks=_Passthrough_RestoreStage0Hooks")
#pragma comment(linker, "/EXPORT:Passthrough_Stage0Stub=_Passthrough_Stage0Stub")

/* ---------------------------------------------------------------------------
 * v4 â€” forwards PE vers le shim DotEmu original (dotemu_orig.dll).
 *
 * FF8_EN.exe importe STATIQUEMENT 9 fonctions dotemu* depuis le module
 * "AF3DN.P" (dumpbin /imports, table d'imports) : sans ces exports, le
 * loader Windows aborte le process au chargement ("point d'entrÃ©e
 * introuvable"), avant tout DllMain. Les forwards PE (rÃ©solus par le
 * loader vers dotemu_orig.dll, copie renommÃ©e de l'AF3DN.P DotEmu 2014)
 * rendent notre DLL drop-in compatible, sans un seul octet de code.
 * ------------------------------------------------------------------------- */
#pragma comment(linker, "/EXPORT:dotemuCreateFileA=dotemu_orig.dotemuCreateFileA")
#pragma comment(linker, "/EXPORT:dotemuDeleteFileA=dotemu_orig.dotemuDeleteFileA")
#pragma comment(linker, "/EXPORT:dotemuGetDriveTypeA=dotemu_orig.dotemuGetDriveTypeA")
#pragma comment(linker, "/EXPORT:dotemuRegCloseKey=dotemu_orig.dotemuRegCloseKey")
#pragma comment(linker, "/EXPORT:dotemuRegDeleteValueA=dotemu_orig.dotemuRegDeleteValueA")
#pragma comment(linker, "/EXPORT:dotemuRegFlushKey=dotemu_orig.dotemuRegFlushKey")
#pragma comment(linker, "/EXPORT:dotemuRegOpenKeyExA=dotemu_orig.dotemuRegOpenKeyExA")
#pragma comment(linker, "/EXPORT:dotemuRegQueryValueExA=dotemu_orig.dotemuRegQueryValueExA")
#pragma comment(linker, "/EXPORT:dotemuRegSetValueExA=dotemu_orig.dotemuRegSetValueExA")
#pragma comment(linker, "/EXPORT:Passthrough_CaptureCount=_Passthrough_CaptureCount")

/* ===========================================================================
 * Ã‰tat DLL (BSS zÃ©ro-rempli ; aucun init CRT requis)
 * =========================================================================== */
static HMODULE        g_hostModule;     /* base hÃ´te (GetModuleHandleA(NULL)) */
static void*          g_native;         /* objet driver natif GL (ctor 0x4252B0) */
static void*          g_proxy;          /* objet proxy 0x108 retournÃ© Ã  l'engine */
static int            g_nativeAlive;    /* slot 1 l'a uninit ? */
static int            g_replayLive;     /* 0 = dry-run (dÃ©faut Mode A) */
static unsigned long  g_seq;            /* compteur global d'appels loggÃ©s */
static HMODULE        g_hinstDLL;       /* module de cette DLL (fallback CSV) */
static FILE*          g_logFile;        /* CSV lazy */
static volatile LONG g_modulePinned;
static volatile LONG g_diagnosticActive;
static volatile LONG g_diagnosticAttempted;
static volatile LONG g_diagnosticLock;
static int GFXPT_EnsureResident(void);
static int GFXPT_QuiesceBegin(BYTE* target, DWORD bytes);
static int GFXPT_QuiesceEnd(void);
static int GFXPT_RestoreGenericHooks(void);
static const BYTE     GFXPT_PresentPreimage[8] = { 0x55u, 0x8Bu, 0xECu, 0x51u,
                                                   0x8Bu, 0x45u, 0x08u, 0x50u };
static void* volatile g_pdTrampoline;   /* v6 : trampoline du present dispatch */
static char           g_logPath[MAX_PATH];
static int            g_logDisabled;    /* env absent ou fopen KO â†’ ODS seul */

#define GFXPT_CAP_COUNT  (1u << 8)        /* 256 captures (ring) */
#define GFXPT_NODE_COUNT (1u << 13)       /* 8192 nodes (ring, 192 Ko) */

static GFXPT_Capture  g_caps[GFXPT_CAP_COUNT];
static unsigned char  g_nodes[GFXPT_NODE_COUNT * GFXPT_NODE_BYTES];
static unsigned long  g_capWrite;       /* compteur absolu de captures ouvertes */
static unsigned long  g_nodeWrite;      /* compteur absolu de nodes copiÃ©s */
static int            g_curValid;
static unsigned       g_cur;            /* index ring de la capture courante */

/* ===========================================================================
 * Helpers lecture/copie SEH (les lectures list+0x34/+0x58 sont faites sur un
 * ctx vivant cÃ´tÃ© engine, mais l'outil observer ne doit JAMAIS faire tomber
 * le jeu : tout accÃ¨s indirect est dÃ©fendu).
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
 *   - ODS : Ã©vÃ©nements majeurs uniquement (factory, init, uninit, replay).
 *   - CSV  : une ligne par slot appelÃ© : seq,slot,arg0..3 (%p),ret.
 * =========================================================================== */
static void GFXPT_ODS(const char* msg)
{
    OutputDebugStringA(msg);
}

static void GFXPT_LogOpen(void)
{
    char env[MAX_PATH];
    char cand[MAX_PATH];
    char tmp[MAX_PATH];
    DWORD n, m;
    char* slash;

    if (g_logDisabled || g_logFile)
        return;

    /* Candidat 1 : FF8_PASSTHROUGH_LOG (prioritaire, sinon refus dÃ©finitif). */
    n = GetEnvironmentVariableA("FF8_PASSTHROUGH_LOG", env, (DWORD)sizeof(env));
    if (n > 0 && n < (DWORD)sizeof(env))
    {
        lstrcpynA(g_logPath, env, (int)sizeof(g_logPath));
        g_logFile = fopen(g_logPath, "a");
        if (!g_logFile)
        {
            g_logDisabled = 1;
            return;
        }
        goto opened;
    }

    /* Candidat 2 : Ã  cÃ´tÃ© de la DLL (dossier du jeu â€” Program Files peut Ãªtre
     * read-only pour le processus : fopen peut Ã©chouer silencieusement). */
    m = GetModuleFileNameA(g_hinstDLL, cand, (DWORD)sizeof(cand));
    if (m > 0 && m < (DWORD)sizeof(cand) - 20)
    {
        slash = cand + m;
        while (slash > cand && slash[-1] != '\\' && slash[-1] != '/')
            --slash;
        *slash = 0;
        lstrcpynA(slash, "gfx_passthrough.csv",
                  (int)(sizeof(cand) - (size_t)(slash - cand)));
        g_logFile = fopen(cand, "a");
        if (g_logFile)
        {
            lstrcpynA(g_logPath, cand, (int)sizeof(g_logPath));
            goto opened;
        }
    }

    /* Candidat 3 : %TEMP% (toujours inscriptible â€” v3.2 diagnostic). */
    if (GetTempPathA((DWORD)sizeof(tmp), tmp) > 0)
    {
        lstrcpynA(g_logPath, tmp, (int)sizeof(g_logPath));
        slash = g_logPath + lstrlenA(g_logPath);
        lstrcpynA(slash, "gfx_passthrough.csv",
                  (int)(sizeof(g_logPath) - (size_t)(slash - g_logPath)));
        g_logFile = fopen(g_logPath, "a");
        if (g_logFile)
            goto opened;
    }

    g_logDisabled = 1;
    return;

opened:
    fprintf(g_logFile, "seq,slot,arg0,arg1,arg2,arg3,ret\n");
    fprintf(g_logFile, "#csv,%s\n", g_logPath);
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

/* RÃ©solution du fnptr natif Ã©quivalent (slot index = offset/4). */
static void* GFXPT_Native(unsigned slot)
{
    if (!g_native || slot >= 66u)
        return 0;
    return ((void**)g_native)[slot];
}

/* ===========================================================================
 * Capture draw-list (slots 43â€“64, spec Â§6)
 *   ctx = list+0x18 â†’ list = ctx-0x18 ; stamp = *(list+0x58) ;
 *   gen = *(*(list+0x34)) (les mÃªmes lectures que les guards de
 *   Gfx_WalkDrawList 0x4178D7, dÃ©fendues par SEH).
 *   Session = (slot, ctx, gen) ; nodes copiÃ©s 24 octets dans le ring global
 *   (pointer-free). Ring plein â†’ dropped++ (dÃ©gradation silencieuse, observer).
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
        cap->dropped++;                 /* ring plein : dÃ©gradation silencieuse */
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
 * v7 â€” dump mÃ©moire des draw lists au vol (contrat binaire avec le dÃ©codeur)
 *
 * FORMAT D'ENREGISTREMENT (PINÃ‰ â€” respecter Ã  l'octet prÃ¨s) : little-endian,
 * enregistrements auto-descriptifs, alignÃ©s 4 octets. Par node capturÃ© :
 *
 *   u32 magic 'ND07' (0x3730444E)
 *   u32 slot          // 43..64
 *   u32 seq           // compteur de frames, incrÃ©mentÃ© au present dispatch
 *   u32 ctx           // arg_0 tel quel
 *   u32 node_addr     // adresse live du node (debug)
 *   u32 geom_kind     // 0=none, 1=poly_packet, 2=fvf_verts+indices
 *   u32 fails         // nb d'Ã©checs SEH pour ce node (blocs idx/fvf mis Ã  0)
 *   u32 payload_size  // octets APRÃˆS ce champ (= node[24] + payload)
 *   u32 build         // v8 : GFXPT_BUILD_ID (0x5638) â€” 9e u32 (offset 0x20),
 *                     // APPEND aprÃ¨s payload_size (en-tÃªte 32 â†’ 36 o) ;
 *                     // lesson lot 13 Â« dÃ©ployÃ© â‰  cru dÃ©ployÃ© Â» ; le
 *                     // dÃ©codeur v2 s'attend Ã  un en-tÃªte ND07 de 36 octets
 *   u8  node[24]      // copie brute du node
 *   payload selon geom_kind :
 *     1: u32 prim (3=FT3, 4=FT4) ; u8 packet[40] (copie brute 32 ou 40 o,
 *        complÃ©tÃ© Ã  0) â€” AUCUN slot DDrawAlt n'Ã©met ce kind (rÃ©servÃ©) ;
 *     2: u32 vcount ; u32 icount ; u16 idx[icount] ; u16 pad[(icount&1)]
 *        (rembourrage alignement 4, zÃ©ros) ; u8 fvf[vcount*32].
 *
 * Taille record = 36 (en-tÃªte, 9 x u32 â€” v8 ; 32 o en v7) + payload_size.
 * Le build-id est prÃ©sent dans CHAQUE record (v8) ; un bloc idx/fvf
 * illisible est mis Ã  zÃ©ro et compte un `fails` (le dÃ©codeur ignore le
 * bloc si fails>0).
 *
 * TABLE DE CLOSURE slot â†’ gÃ©omÃ©trie (provenance : ctor DDrawAlt 0x4257D0,
 * bind 0x41619A, decomp 0x43E24A/0x43E356, et bytes live du PE 064d466b
 * (SHA256 064D466Bâ€¦9570) dÃ©sassemblÃ©s hors-ligne pour les impls sans decomp ;
 * AUCUN offset inventÃ©) :
 *
 *   Slots walking Â« direct Â» (descriptor = arg node) â€” vcount@node+0x0C,
 *   verts@node+0x14, icount@node+0x18, indices@node+0x20 :
 *     48, 49, 50 â†’ 0x43E24A (RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4,
 *                  TRIANGLELIST 4, FVF 0x1C4)
 *     57, 58, 59 â†’ 0x43E5E9 (TRIANGLELIST 4, FVF 0x1E2)
 *     63, 64     â†’ 0x43E540 (LINELIST 2, FVF 0x1C4)
 *   Slots walking Â« VB batch Â» â€” remaining(@node+0x08, s32 groupes), verts
 *   base@node+0x14, indices@node+0x20, ids stream@node+0x28, geom=*(node+0x2C),
 *   vcount = *(s32*)(geom+0x3C) Ã— remaining, icount = *(s32*)(geom+0x40) Ã—
 *   remaining (groupes de mÃªme id ; stride vertex 32 = shl 5) :
 *     51         â†’ 0x43E356 (RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4_VB)
 *     60         â†’ 0x43E692 (FVF 0x1E2 â€” push @0x43E7C5 â€” stride 32 identique,
 *                  shl 5 @0x43E79A ; capture kind2 inchangÃ©e)
 *   NB ids (preuve live PE 064d466b, disasm 2026-09-25) : le stream ids est
 *   consommÃ© U8 PAR GROUPE par le walk natif (mov cl,[eax] @0x43E419 / 0x43E725,
 *   ids+=1 par groupe) ; il n'existe AUCUN champ u16 natif entre le blob idx et
 *   le blob fvf, et les blobs sont des pointeurs indÃ©pendants (node+0x14/+0x20/
 *   +0x28). Le payload kind2 ci-dessus est donc complet tel quel.
 *   ANOMALIE CONNUE (dump campagne 2026-09-25 13:50, seq 9720..9735) : les 32
 *   records multigroupes slot 51 du fichier produits ce jour-lÃ  font 2 octets
 *   de plus que payload_size (grille fvf dÃ©calÃ©e de +2, prÃ©fixe hors contrat
 *   `22 00`/`36 00`, queue de dernier vertex dÃ©passant la fin dÃ©clarÃ©e) : ils
 *   proviennent d'une IMAGE DÃ‰PLOYÃ‰E ANTÃ‰RIEURE (build supprimÃ© depuis, copie
 *   [verts-2, verts-2+vcount*32+2) avec curseur need+2) â€” PAS du prÃ©sent code
 *   (preuve : .text du rebuild identique + harnais GFXPT_DumpNode = delta 1324
 *   pour remaining=9/perV=4/perI=6). Un dÃ©codeur lisant CE fichier historique
 *   doit resynchroniser sur 'ND07' ; les dumps futurs du build courant sont
 *   conformes au contrat ci-dessus.
 *   Slots setup â€” le node N'EST JAMAIS lu (prouvÃ© bytes live : lecture de
 *   ctx+0x30/ctx+0x38 uniquement, forward natif slots 31/32 ; 46/52â€“56 lisent
 *   node+0x2Câ†’geom+0x80/0xA4/0xA8/0xAC = Ã©tat/matÃ©riau, pas de gÃ©omÃ©trie) :
 *     43, 44 â†’ 0x43DF00 ; 45 â†’ 0x43DF2A ; 46 â†’ 0x43DF54 ; 47 â†’ 0x43DFA6 ;
 *     52, 53 â†’ 0x43DFD0 ; 54 â†’ 0x43E059 ; 55 â†’ 0x43E0E2 ; 56 â†’ 0x43E197 ;
 *     61, 62 â†’ 0x43E220  â†’ geom_kind = 0 (node 24 o seul).
 *
 * ---------------------------------------------------------------------------
 * v8 â€” FORMAT TX07 (PINÃ‰ â€” respecter Ã  l'octet prÃ¨s) : little-endian, alignÃ©
 * 4, Ã©mis UNE fois par frame armÃ© (dÃ©dup par pulse â€” flag per-frame
 * g_frameTxEmitted), sur le PREMIER node walk texturÃ© de la fenÃªtre armÃ©e,
 * Ã  la TÃŠTE de GFXPT_DumpNode pour les slots walk texturÃ©s (48â€“50/57â€“59/
 * 63â€“64 direct, 51/60 VB batch â€” chaÃ®ne Â§6.2 : texinfo|geom = *(node+0x2C)
 * puis page = *(texinfo+0x10)), AVANT le record ND07 du node rÃ©fÃ©rent.
 * TX07 ne participe PAS Ã  l'ordre painter ND07 (mapping pageâ†”node dÃ©codÃ©-
 * side sur l'adresse).
 *
 * Pourquoi FRAME-LEVEL : le miroir VRAM est adressÃ© u16-par-mot avec pitch
 * 0x800 mots/row (vramOff = (page_y + y) << 10 + page_x + (x >> (2 - mode)),
 * pixel .u16 Ã  base + 2*vramOff, base = dword_1CB602C â€” decomp 0x464F70
 * (TexStaging_BlitRows call @0x465235), 0x464DB0 (Gfx_UploadCLUTSlot),
 * 0x4653E0 (isUpdateVRAMOrSomething), 0x4675C0 (TexStaging_BlitRows : dest
 * pitch 0x800/row ; row start 0x200 pour 4bpp, 0x400 pour 8bpp, 1024 u16
 * pour 16bpp)). Une page (256Ã—256 texels) occupe les rows
 * [pageY..pageY+256) Ã  stride 2048 o â€” une copie contiguÃ« lue depuis un
 * page pointer donnerait une bande diagonale, pas la page. Le miroir
 * COMPLET (1024 u16/row Ã— 512 rows = 0x100000 o) contient TOUTES les pages
 * ET toutes les CLUTs (fenÃªtres CLUT dans le mÃªme miroir : clut_src =
 * base + (clut_word << 5)) â€” UN snapshot par frame armÃ© ; le dÃ©codage
 * expÃ©rimental PNG-side itÃ¨re OFFLINE sur le miroir entier (aucune
 * gÃ©omÃ©trie de page cÃ´tÃ© DLL).
 *
 * u32 magic 'TX07' (0x37305458)
 * u32 build       // GFXPT_BUILD_ID â€” 2e u32
 * u32 seq         // g_frameSeq (mÃªme compteur ND07)
 * u32 clut_now    // dword_1CA89B8 : id CLUT vivant (sub_45B920 â€” word +
 *                 // 0x7FFF ; dword contenant copiÃ© BRUT, mask & 0x7FFF
 *                 // appliquÃ© dÃ©code-side)
 * u32 vram_base   // dword_1CB602C : pointeur miroir VRAM (u16-par-mot,
 *                 // pitch 0x800)
 * u32 sys_clut_base // 0x1B47818 : base table systÃ¨me CLUT (sub_45B920 :
 *                 // base + 2048*(clut>>6) + 32*(clut&0x3F))
 * u32 m_B7DB44    // flag RGB555 swap (TexStaging_BlitRows mode 2 path)
 * u32 page_probe  // *(texinfo+0x10) du PREMIER node walk texturÃ© du frame
 *                 // (diagnostic dÃ©codÃ©-side)
 * u8  vram[0x100000] // miroir VRAM COMPLET : 1024 u16/row Ã— 512 rows
 *                 // (pixel u16 Ã  vram[2*off])
 *
 * Record size = 32 + 0x100000 = 0x100020 (cap garde :
 * GFXPT_DUMP_MAX_NODE_BYTES = 0x100480). Ã‰chec vram_base (SEH/0) â†’ PAS de
 * record du tout (le miroir = la valeur seule) ; Ã©chec copie miroir (SEH)
 * â†’ rien Ã©crit, g_dumpWrite jamais avancÃ©. Ã‰checs clut_now/m_B7DB44 â†’
 * champ 0 + fails comptÃ©s g_txSehFails (non-fatal, record quand mÃªme Ã©mis)
 * ; Ã©chec page_probe â†’ 0, non-fatal (diagnostic, sans compteur). L'en-tÃªte
 * TX07 PINÃ‰ 8 x u32 n'a PAS de champ fails.
 * ---------------------------------------------------------------------------
 * v9 patch â€” (a) ND08 : footer texture des records geom_kind==2 SEULEMENT.
 * La copie node 24 o (pointer-free) ne touche NI la chaÃ®ne texture NI le
 * CLUT du slot : tpage/mode vivent dans texinfo AU-DELÃ€ du node
 * (texinfo = *(node+0x2C) ; tpage = *(texinfo+0x20) ; mode = *(texinfo+
 * 0x14), 0=4bpp 1=8bpp 2=16bpp) et clut = *(u16*)(ctx+0x448) (lecture WORD
 * 66h-prefixed du champ CLUT du record slot ; SEH dword + mask 0xFFFF).
 * MAILLAGE ids (analyse noise-render) : le grain 16 couleurs = sous-palette
 * par id groupe â€” le walk natif 51/60 consomme le stream ids u8 PAR GROUPE
 * (node+0x28) et chaque groupe prend SA sous-CLUT (sub_45B920 : row =
 * base + 2048*(clut>>6), 32 o de sous-CLUT 16 couleurs dans la row) ;
 * sans le stream, l'assignation sous-paletteâ†”grain est perdue. Extension
 * ADDITIVE du payload pinÃ© v7/v8 ci-dessus (tous les champs du payload v8
 * gardent leur offset) â€” footer APPEND aprÃ¨s (vcount|icount|idx|pad|
 * fvf) :
 *   u32 tpage        // *(u32*)(texinfo+0x20) â€” SEH, 0 si fail (diagnostic)
 *   u32 mode         // *(u32*)(texinfo+0x14) â€” SEH, 0 si fail (diagnostic)
 *   u32 clut         // *(u16*)(ctx+0x448) â€” SEH dword, mask & 0xFFFF appliquÃ©
 *   u32 id_count     // 0 pour slots directs {48,49,50,57,58,59,63,64} ;
 *                    // min(remaining,255) pour {51,60} (ids ABSENTS sinon)
 *   u8 ids[id_count] // (51/60) stream TEL QUE CONSOMMÃ‰ par le walk natif :
 *                    // 1 octet PAR GROUPE lu dans *(u8**)(node+0x28) â€”
 *                    // copie SEH UNIQUE â‰¤ 256 o (pas de read par groupe) ;
 *                    // pad zÃ©ro jusqu'au prochain u32
 *   u32 dropped_ids  // TOUJOURS prÃ©sent en fin de footer (align u32) :
 *                    // gcount si gcount>255, sinon 0 (id_count est saturÃ©
 *                    // Ã  255 â€” pas de bit d'overflow)
 * payload_size v9 = 24 (node) + (8 + idx + pad + fvf) + (16 + ceil4(id_count)
 * + 4). Header magic : 'ND08' (0x3830444E â€” ASCII LE Â« ND08 Â», famille
 * 'ND07' 0x3730444E) pour TOUT record geom_kind==2 ; kind 0/1 gardent
 * 'ND07' ; hdr inchangÃ© (9 x u32), build 0x5639 (v8 = 0x5638). Footer
 * fails : stream ids illisible (pointeur node+0x28 ou copie SEH) â†’
 * id_count=0, dropped_ids=0, hdr.fails++ (style Â« bloc mis Ã  zÃ©ro +
 * fails Â») ; tpage/mode/clut illisibles â†’ champ 0 NON fatal (diagnostic,
 * style page_probe TX07) ; le record de budget ND08 max recomputÃ© =
 * 36 + 24 + (8 + idx 32768 + fvf 131072) + footer 276 = 164 184 o (0x28158)
 * âŠ‚ GFXPT_DUMP_MAX_NODE_BYTES (0x100C80, calÃ© sur le record TX07 v9).
 * ---------------------------------------------------------------------------
 * v9 patch â€” (b) TX07 : payload Ã©tendu u8 sys_clut_row[2048] APPEND aprÃ¨s le
 * miroir VRAM â†’ record 32 + 0x100000 + 0x800 = 0x100820 o (hdr TX07 PINÃ‰ 8 x
 * u32 INCHANGÃ‰ â€” sys_clut_row est du PAYLOAD, pas un champ d'en-tÃªte).
 * sys_clut_row = copie SEH de la row CLUT systÃ¨me du clut_now du frame :
 *   src = HostEA(GFXPT_EA_SYS_CLUT) + 2048 * ((clut_now & 0x7FFF) >> 6)
 * (unk_1B47818 = base statique LITTÃ‰RALE â€” donc HostEA(0x1B47818) EST
 * l'adresse rÃ©elle de la table ; sub_45B920 : la fenÃªtre CLUT d'un id vit
 * dans la row `clut>>6`, cf. formule base + 2048*(clut>>6) + 32*(clut&0x3F)
 * oÃ¹ 32*(clut&0x3F) pointe DANS la row copiÃ©e). Ã‰chec SEH de la copie â†’
 * 2048 o Ã  zÃ©ro + fails comptÃ©s g_txSehFails (non-fatal, record Ã©mis ; 1
 * ODS par fenÃªtre d'armement max â€” g_txSysWarned). Le miroir VRAM reste
 * copiÃ© Ã€ L'IDENTIQUE (source pixels inchangÃ©e ; la rÃ©solution de palette
 * seule exige la row systÃ¨me â€” l'Ã©chantillonnage garde le miroir). Ring :
 * 64 MiB / 0x100820 = 63 records TX co-rÃ©sidents max ; TX reste 1 par frame
 * armÃ© â€” aucune pression (ND08 : â‰¤4096 records Ã— ~200 B mÃ©dian, fits).
 * ---------------------------------------------------------------------------
 * v10 â€” FORMAT TR08 (PINÃ‰ â€” respecter Ã  l'octet prÃ¨s) : ressource texture TIM
 * bataille, UN record par TEXOBJ unique PAR FRAME (dÃ©dup par VALEUR du
 * pointeur T â€” table per-frame g_resSeen[64]/g_resCount, reset au pulse Ã 
 * cÃ´tÃ© de g_frameTxEmitted), Ã©mis au PREMIER node walk texturÃ© qui le
 * rÃ©fÃ©rence, AVANT le record ND08 de CE node (mÃªme point d'Ã©mission que
 * TX07 â€” tÃªte de GFXPT_DumpNode, slots walk 48â€“50/57â€“59/63â€“64 direct +
 * 51/60 VB batch). Ordre flux du frame : TX07 â†’ TR08 â†’ ND07/ND08 ; TR08 ne
 * participe pas plus que TX07 Ã  l'ordre painter (mapping dÃ©code-side :
 * footer ND08.texobj â†” TR08.texobj, sur la VALEUR du pointeur).
 *
 * GROUND TRUTH IDB (chaÃ®ne sub_407EB4 â†’ sub_4221E6 â†’ sub_421C41 ; T EST la
 * valeur page_probe de TX07, i.e. *(texinfo+0x10) avec texinfo =
 * *(node+0x2C)) :
 *   T+0x3C = w ; T+0x40 = h
 *   T+0x5C = entries/palette (256 pour 8bpp, 16 pour 4bpp)
 *   T+0xA0 = palMgr M â€” M[3] = T+0xAC = *(u32*)(M+12) = nb de palettes
 *   T+0x60 = ptr CLUT BRUT (u32 PAR COULEUR, TOUTES les sous-palettes
 *            consÃ©cutives : palette i commence Ã  raw + 4*entries*i)
 *   T+0xD8 = ptr PIXELS (1 o PAR TEXEL : w*h o)
 * Adressage palette du MÃŠME moteur : palette i, couleur j =
 * raw[4*(entries*i + j)..+4] â€” l'octet 3 de chaque u32 = bit de
 * transparence PSX (STP). AUCUNE rÃ©solution de palette cÃ´tÃ© DLL :
 * raw_clut = copie BRUTE (u32/couleur, toutes les sous-palettes du texobj).
 *
 * u32 magic 'TR08' (0x38305254)
 * u32 build       // GFXPT_BUILD_ID (v10 = 0x563A) â€” 2e u32
 * u32 seq         // g_frameSeq (mÃªme compteur ND08/TX07)
 * u32 texobj      // VALEUR de T (clÃ© de dÃ©dup + clÃ© footer ND08)
 * u32 w           // *(T+0x3C)
 * u32 h           // *(T+0x40)
 * u32 pal_entries // *(T+0x5C)
 * u32 pal_count   // *(u32*)(*(T+0xA0)+12) â€” cap 32 (saturÃ©, sans bit d'overflow)
 * u32 pixel_size  // w*h â€” cap 65536
 * u32 clut_size   // pal_count*pal_entries*4 â€” cap 32768
 * u8  pixels[pixel_size]   // copie SEH de *(T+0xD8) â€” 1 o/texel
 * u8  raw_clut[clut_size]  // copie SEH de *(T+0x60) â€” u32/couleur
 *
 * Record total = 40 + pixel_size + clut_size â‰¤ 40 + 65536 + 32768 =
 * 98 344 o (0x18028) âŠ‚ GFXPT_DUMP_MAX_NODE_BYTES (0x100C80 â€” inchangÃ© ;
 * le record max EFFECTIF du flux reste TX07 0x100820, marge 0x460). Ring
 * espace vÃ©rifiÃ© comme TX07 : plein â†’ drop (g_trRingDrops/g_frameTrDrops)
 * + 1 ODS par fenÃªtre d'armement (g_trRingWarned) â€” le record ND08 du node
 * rÃ©fÃ©rent passe. Cap 32 records TR08/frame (compteur g_frameTrRecs, flush
 * log `,tr=%lu`). Ã‰chec SEH d'UNE des copies (pixels OU CLUT) â†’ AUCUN
 * octet Ã©crit, g_dumpWrite jamais avancÃ©, g_txSehFails++ (rÃ¨gle Â« pixel =
 * la valeur seule Â», style TX) â€” le texobj est marquÃ© vu AVANT la copie
 * (style g_frameTxEmitted : un multi-node ne retente pas). Lectures de
 * chaÃ®ne/champs illisibles (texinfo, T, w/h/entries/palMgr, ptr pixels/
 * CLUT quand requis) â†’ pas de tentative ce node, texobj NON marquÃ© (le
 * node rÃ©fÃ©rent suivant retente) ; pal_count illisible (palMgr lisible) â†’
 * 0 (clut_size 0, pixels seuls â€” non-fatal). w*h > 65536 ou clut_size >
 * 32768 o â†’ skip garde (g_dumpGuardSkips/g_frameGuardSkips). Le detour
 * draw ne fait JAMAIS tomber le jeu.
 * ---------------------------------------------------------------------------
 * v10 patch â€” ND08 : footer texture APPEND d'UN u32 APRÃˆS dropped_ids :
 *   u32 texobj       // *(texinfo+0x10) â€” la VALEUR T â€” SEH, 0 si fail
 *                    // (non-fatal, diagnostic â€” style page_probe TX07 ;
 *                    // clÃ© de mapping dÃ©code-side avec le TR08 du texobj)
 * Tous les champs v9 gardent leur offset ; hdr 9 x u32 inchangÃ© ; magic
 * 'ND08' INCHANGÃ‰ â€” le dÃ©codeur distingue v9/v10 par le BUILD id (0x5639/
 * 0x563A) qu'il parse dÃ©jÃ . Fails inchangÃ©s : stream ids illisible â†’
 * id_count=0, dropped_ids=0, hdr.fails++ ; texobj illisible â†’ champ 0 NON
 * fatal. Footer v10 = 24 o de champs u32 (6 x u32 : tpage|mode|clut|
 * id_count|dropped_ids|texobj) + ids[id_count] (pad align u32) â†’
 * payload_size v10 = 24 (node) + (8 + idx + pad + fvf) + (16 +
 * ceil4(id_count) + 4 + 4). Record ND08 max recomputÃ© = 36 + 24 + (8 + idx
 * 32768 + fvf 131072) + footer 280 = 164 188 o (0x2815C) âŠ‚
 * GFXPT_DUMP_MAX_NODE_BYTES (0x100C80) â€” le pin reste inchangÃ©.
 * =========================================================================== */
#define GFXPT_VERSION_TEXT          "v19-retained-diagnostic"
#define GFXPT_DUMP_MAGIC            0x3730444Eul        /* 'ND07' (restaurÃ© : utilisÃ© par
                                 * le chemin ND07 â€” kind 0/1 â€” hdr.magic
                                 * @GFXPT_DumpNode) : le chemin kind2 passe
                                 * au magic ND08 ci-dessous */
/* v9 â€” magic ND08 : TOUT record geom_kind==2 (footer texture appended).
 * ASCII LE Â« ND08 Â» = 4E 44 30 38 â†’ 0x3830444E (famille 'ND07'). */
#define GFXPT_DUMP_MAGIC_ND08       0x3830444Eul        /* 'ND08' */
#define GFXPT_BUILD_ID            0x5648ul            /* v19 diagnostic NO_HOT_UNLOAD */    /* build-id u32 dans CHAQUE
                                                 * record (ND07/ND08 champ 9,
                                                 * TX07/TR08 2e u32) â€” v9 : bump
                                                 * 0x5638 â†’ 0x5639 (leÃ§on lot
                                                 * 13 Â« dÃ©ployÃ© â‰  cru
                                                 * dÃ©ployÃ© Â») ; v10 : bump 0x5639 â†’ 0x563A ;
                                                 * v11 : bump 0x563D â†’ 0x563E (slots
                                                 * directs 48/49/50 : chaÃ®ne matdesc
                                                 * ctx+0x38 inconditionnelle â€” CLOSURE
                                                 * walkdirect-texture-chain Â§10) ;
                                                 * v12 : bump 0x563E â†’ 0x563F (footer
                                                 * ND08 + window_word|clut_sys_id|ot_z
                                                 * â€” formule fenÃªtre sub_45BC60 +
                                                 * z-sort ParsePolygons, PROMPT lot 19)  ;
 * v13 : bump 0x563F â†’ 0x5640 (TX07 payload + TEXWIN 8 o : origin_xy/wh â€”
 * globals dword_1CA8870/word_1CA8874/word_1CA8876 â€” PROMPT lot 20) ;
 * v14 : bump 0x5640 â†’ 0x5641 (lot 22 : sideband ST09 â€” transitions
 * SetRenderState raw 0..25 / commits descripteur slots 30/31/32 / blend
 * mode raw 0..4 / target token slot 39 / invalidations init-uninit /
 * commits de session setup 43-47+55 â€” preuves Phase B STATE_MATRIX_lot22.md
 * : backends 0x440FF0 (applied-at-call, pas de table shadow Alt),
 * sub_441560/sub_441581/sub_44162E, wrapper 0x41E650 (48 rel-callers) ;
 * footer ND08 +2 o (state_epoch | state_flags) â€” stage0_valid = 0
 * (Phase D gate : MissingEvidence(SetTexture stage0)) ;
 * v15 : bump 0x5641 â†’ 0x5642 (lot 24 : ST09 40 o +ctx_token/+device_token
 * bruts opaques ; kinds 8 STAGE0_REQ / 9 STAGE0_RESULT ; flags footer bit1
 * STAGE0_VALID (armÃ© ET kind9 vu), bit2 INCOMPLETE aussi sur cap/overflow,
 * bit3 ST_LOSS ; pertes ST09 explicites â€” 1 refus = 1 lost + 1 drop ;
 * kind2/kind6 aux = retour natif brut ; footer ND08 +6 u32 (triple stage0
 * + st_emitted|st_lost) ; DumpNode cdecl 6 args (+nativeResult) ;
 * instrumentation stage0 SetTexture option B â€” PROMPT lot24) */
#define GFXPT_DUMP_MAGIC_TX         0x37305458ul        /* 'TX07' */
/* v10 â€” magic TR08 (ressource texture TIM bataille, UN record par texobj
 * unique par frame â€” voir le contrat Â« v10 â€” FORMAT TR08 Â»). */
#define GFXPT_DUMP_MAGIC_TR         0x38305254ul        /* 'TR08' */
#define GFXPT_DUMP_RING_BYTES       (64ul * 1024ul * 1024ul)   /* BSS, 64 Mo */
#define GFXPT_DUMP_MAX_FRAME        4096ul              /* records max / frame */
#define GFXPT_DUMP_MAX_NODE_BYTES   0x100C80ul          /* garde payload node/TX â€” v9 :
                                 * recalcul prÃ©cis : le record TX07 passe Ã 
                                 * 0x100820 o (hdr 32 + miroir VRAM 0x100000
                                 * + sys_clut_row 0x800) qui DÃ‰PASSE le pin
                                 * v8 0x100480 â†’ pin = 0x100820 + marge
                                 * 0x460 (marge v8 conservÃ©e) = 0x100C80
                                 * exact. ND08 : record max recomputÃ© =
                                 * 36 + 24 + (8 + idx 32768 + fvf 131072)
                                 * + footer 276 = 164 184 o (0x28158) âŠ‚ cap
                                 * â€” aucun rehaussement ND requis. v10 :
                                 * TR08 = 98 344 o (0x18028) et ND08 =
                                 * 164 188 o (0x2815C, footer +1 u32
                                 * texobj) âŠ‚ cap inchangÃ© â€” record max
                                 * effectif du flux = TX07 0x100820. */
#define GFXPT_DUMP_FRAMES           16ul                /* frames par armement */
#define GFXPT_DUMP_VCOUNT_MAX       4096ul
#define GFXPT_DUMP_ICOUNT_MAX       16384ul

/* En-tÃªte 36 octets (v8 â€” 9 x u32 LE : le 9e champ est le build-id), sans
 * padding (MSVC x86) â€” en v7 c'Ã©tait 8 x u32 = 32 o ; le build-id est le
 * 9e u32, APPEND aprÃ¨s payload_size (AUCUNE relocation des 8 champs v7). */
typedef struct GFXPT_DumpHdr {
    unsigned long magic;
    unsigned long slot;
    unsigned long seq;
    unsigned long ctx;
    unsigned long nodeAddr;
    unsigned long geomKind;
    unsigned long fails;
    unsigned long payloadSize;   /* octets aprÃ¨s ce champ (node[24] + payload ;
                                 * v9 : payload kind2 inclut le footer ND08) */
    unsigned long build;         /* v8 : GFXPT_BUILD_ID (offset 0x20) */
} GFXPT_DumpHdr;

/* v8 â€” en-tÃªte TX07 (32 o, 8 x u32 LE, sans padding MSVC x86) : build en
 * 2e u32 ; gÃ©omÃ©trie page (w/h/mode/tpage) dÃ©rivÃ©e dÃ©code-side sur
 * l'adresse â€” AUCUNE gÃ©omÃ©trie copiÃ©e cÃ´tÃ© DLL. v9 : 8 x u32 INCHANGÃ‰S â€”
 * la ligne CLUT systÃ¨me est du PAYLOAD (u8 sys_clut_row[2048] aprÃ¨s le
 * miroir), pas un champ d'en-tÃªte. */
typedef struct GFXPT_Tx07Hdr {
    unsigned long magic;
    unsigned long build;
    unsigned long seq;
    unsigned long clut_now;     /* dword_1CA89B8 BRUT (mask & 0x7FFF dÃ©code-side) */
    unsigned long vram_base;    /* dword_1CB602C (ptr miroir VRAM, u16/word, pitch 0x800) */
    unsigned long sys_clut_base; /* GFXPT_EA_VRAM_CLUT_LUTB 0x1B47818 (base systÃ¨me, sub_45B920) */
    unsigned long m_B7DB44;
    unsigned long page_probe;   /* *(texinfo+0x10) du 1er node walk texturÃ© du frame */
} GFXPT_Tx07Hdr;

/* v13 - TEXWIN : scales de fenetre texture resolus par sub_45BC60 dans des
 * globals statiques : dword_1CA8870 (HIWORD=x0, LOWORD=y0), word_1CA8874 (W),
 * word_1CA8876 (H ; 0 -> 256). Lisibles au detour present (BSS absolu, SEH) -
 * 8 o APPEND au payload TX07 (build 0x5640) : fenetre GLOBALE au frame. */
typedef struct GFXPT_Tx07Win {
    unsigned long origin_xy;
    unsigned long wh;
} GFXPT_Tx07Win;
#define GFXPT_EA_WINDOW_XY      0x1CA8870ul
#define GFXPT_EA_WIN_W          0x1CA8874ul
#define GFXPT_EA_WIN_H          0x1CA8876ul
#define GFXPT_DUMP_TX_WIN_BYTES 8ul

#define GFXPT_DUMP_TX_VRAM_BYTES    0x100000ul  /* miroir VRAM complet 1024x512 u16 */
/* v9 â€” ligne CLUT systÃ¨me copiÃ©e en payload TX07 (2048 o = 64 sous-CLUT Ã—
 * 32 o ; row choisie par (clut_now & 0x7FFF) >> 6). */
#define GFXPT_DUMP_TX_SYSROW_BYTES  0x800ul
/* Record TX07 = hdr 32 + miroir VRAM 0x100000 + sys_clut_row 0x800 =
 * 0x100820 o (v8 : 0x100020 sans la row) ; cap pinÃ© recalÃ© :
 * GFXPT_DUMP_MAX_NODE_BYTES = 0x100C80 o = record TX07 + marge 0x460. */
#define GFXPT_DUMP_TX_REC_BYTES     ((unsigned long)sizeof(GFXPT_Tx07Hdr) \
                                     + GFXPT_DUMP_TX_VRAM_BYTES \
                                     + GFXPT_DUMP_TX_SYSROW_BYTES)

/* v10 â€” TR08 : caps de record. hdr 10 x u32 = 40 o + pixels w*h (cap
 * 65536 = 256 x 256) + CLUT brut pal_count x pal_entries x 4 (pal_count
 * cap 32 â†’ cap 32768 = 32 x 256 x 4) â€” record max =
 * 40 + 65536 + 32768 = 98 344 o (0x18028) âŠ‚ GFXPT_DUMP_MAX_NODE_BYTES
 * (0x100C80, inchangÃ© â€” TX07 0x100820 reste le max effectif). */
#define GFXPT_DUMP_TR_PIXEL_MAX     65536ul     /* cap pixel_size (w*h) */
#define GFXPT_TR_PAL_COUNT_MAX      32ul        /* cap pal_count */
#define GFXPT_DUMP_TR_CLUT_MAX      32768ul     /* cap clut_size */
#define GFXPT_TR_MAX_FRAME          32ul        /* records TR08 max / frame */
#define GFXPT_RES_SEEN_MAX          64ul        /* entrÃ©es dÃ©dup texobj per-frame */

/* v10 â€” en-tÃªte TR08 (40 o, 10 x u32 LE, sans padding MSVC x86) : build en
 * 2e u32 (comme TX07) ; les buffers pixels/CLUT sont APRÃˆS le hdr dans le
 * ring (payload, pas champs d'en-tÃªte). Adressage palette du MÃŠME moteur :
 * palette i, couleur j = raw + 4*(entries*i + j) ; l'octet 3 de chaque u32
 * = bit de transparence PSX (STP). */
typedef struct GFXPT_Tr08Hdr {
    unsigned long magic;         /* 'TR08' */
    unsigned long build;         /* GFXPT_BUILD_ID (v10 = 0x563A) */
    unsigned long seq;           /* g_frameSeq au node rÃ©fÃ©rent */
    unsigned long texobj;        /* VALEUR de T = *(texinfo+0x10) (clÃ© dÃ©dup + footer ND08) */
    unsigned long w;             /* *(T+0x3C) */
    unsigned long h;             /* *(T+0x40) */
    unsigned long pal_entries;   /* *(T+0x5C) (256 pour 8bpp, 16 pour 4bpp) */
    unsigned long pal_count;     /* *(u32*)(M+12), M = *(T+0xA0) â€” cap 32 */
    unsigned long pixel_size;    /* w*h (cap 65536) */
    unsigned long clut_size;     /* pal_count*pal_entries*4 (cap 32768) */
} GFXPT_Tr08Hdr;

/* v14 (lot 22) â€” magic ST09 (sideband Ã©tat par transition, v14 : 32 o =
 * 8 x u32 LE â€” v15 (lot 24) : 40 o = 10 x u32, +ctx_token/+device_token
 * pointeurs bruts OPAQUES, 0 = non capturÃ© pour kinds sans ctx dispo ;
 * alignÃ© 4, Ã©mis DANS le ring partagÃ© ND/TX/TR/ST â€” ordre total du flux =
 * vÃ©ritÃ©). Kinds :
 *   1 RS_SET         â€” slot 29 : type raw 0..25 + value raw (backend Alt
 *                      0x440FF0 applique au device immÃ©diatement â€” pas de
 *                      table shadow Alt ; le reader garde type/value RAW,
 *                      aucun alias sÃ©mantique tant que non prouvÃ©).
 *   2 COMMIT         â€” slots 30/31/32 : value = token matdesc (opaque
 *                      runtime) ; backend = sub_41F99A/sub_441560/
 *                      sub_441581 (re-apply descripteur : texture + RS
 *                      alpha device). PAS un flush de table RS.
 *   3 BLEND          â€” slot 33 : value = mode raw 0..4 (backend
 *                      sub_44162E : mode<5 â†’ commit matdesc
 *                      *(cookie+0x900+4*mode)). Aucune conversion STP.
 *   4 TARGET         â€” slot 39 : value = token opaque (backend
 *                      RenderDDrawAlt_SelectRenderTarget Ã©crit engine+0xA68).
 *   5 INVALIDATE     â€” slot 0 init / slot 1 uninit (l'Ã©tat device n'est
 *                      plus traÃ§able : le reader vide son ledger).
 *   6 SETUP_COMMIT   â€” slots de setup 43/44/45/46/47/55 : les impls
 *                      (sub_43DF00/43DF2A/43DF54/43DFA6/43E0E2) appellent
 *                      sub_441560/sub_441581(matdesc, cookie) EN DIRECT
 *                      dans le forward natif (EA 0x43DF07â†’0x43DF1E,
 *                      0x43DF72, 0x43DFC4, 0x43E104). Event Ã©mis si les
 *                      gates prouvÃ©es sont actives : *(ctx+0x30) != 0,
 *                      *(cookie+0xAC4) != 0, matdesc = *(ctx+0x38) != 0 ;
 *                      value = token matdesc, aux = gate *(cookie+0xAC4).
 *                      Slots 52/53/54/56 : commit non prouvÃ© â†’ PAS
 *                      d'event (MissingEvidence documentÃ©e).
 *   7 SCENE          â€” slots 40/41 begin/leave scene : marqueur d'ordre,
 *                      NON invalidant (l'Ã©tat D3D persiste entre scÃ¨nes).
 *   8 STAGE0_REQ     â€” v15 (lot 24) : stub stage0 SetTexture AVANT le call
 *                      COM indirect [devVT+0x98] â€” type = site 1/2
 *                      (RVA 0x1EF5D bind / 0x1EF72 unbind), value = texture,
 *                      aux = stage, ctx_token = device, device_token = devVT.
 *   9 STAGE0_RESULT  â€” v15 : stub APRÃˆS le call COM â€” type = site, value =
 *                      texture, aux = HRESULT BRUT (witness candidat, jamais
 *                      interprÃ©tÃ©), ctx_token = device, device_token = devVT.
 *                      Le cache writer footer (g_stage0_*) est mis Ã  jour par
 *                      le logger result UNIQUEMENT.
 * Flags ND08 footer : bit0 has_epoch, bit1 stage0_valid â€” v15 : hooks stage0
 * ARMÃ‰S ET â‰¥1 kind9 vu (triple footer fiable ; 0 en v14 â€” Phase D gate),
 * bit2 incomplete â€” v15 : trou d'epoch OU toute perte ST09 (cap/overflow
 * inclus â€” plus aucune perte muette), bit3 ST_LOSS â€” v15 : â‰¥1 refus
 * d'Ã©mission ST09 sur la frame (footer st_lost). */
#define GFXPT_DUMP_MAGIC_ST         0x39305453ul        /* 'ST09' */
#define GFXPT_ST_KIND_RS_SET        1ul
#define GFXPT_ST_KIND_COMMIT        2ul
#define GFXPT_ST_KIND_BLEND         3ul
#define GFXPT_ST_KIND_TARGET        4ul
#define GFXPT_ST_KIND_INVALIDATE    5ul
#define GFXPT_ST_KIND_SETUP_COMMIT  6ul
#define GFXPT_ST_KIND_SCENE         7ul
#define GFXPT_ST_KIND_STAGE0_REQ    8ul    /* v15 (lot 24) : request SetTexture */
#define GFXPT_ST_KIND_STAGE0_RESULT 9ul    /* v15 (lot 24) : result (aux = HRESULT brut) */
#define GFXPT_ST_FLAG_HAS_EPOCH     1ul
#define GFXPT_ST_FLAG_STAGE0_VALID  2ul
#define GFXPT_ST_FLAG_INCOMPLETE    4ul
#define GFXPT_ST_FLAG_ST_LOSS       8ul    /* v15 (lot 24) : â‰¥1 refus ST09 sur la frame */
#define GFXPT_ST_REC_BYTES          40ul   /* v15 (lot 24) : 10 x u32 (+ctx_token,+device_token) */
#define GFXPT_ST_MAX_FRAME          1024ul
#define GFXPT_EA_COOKIE_GATE_AC4    0xAC4ul             /* *(cookie+0xAC4) â€” gate commit (sub_441581 @0x44158A) */
#define GFXPT_EA_COOKIE_BLD_TABLE   0x900ul             /* *(cookie+0x900+4*mode) â€” table 5 matdescs (sub_44162E @0x44165c) */

/* v14 (lot 22) â€” en-tÃªte ST09 (v14 : 32 o, 8 x u32 LE â€” v15 (lot 24) :
 * 40 o, 10 x u32 LE, sans padding MSVC x86 : +ctx_token/+device_token). */
typedef struct GFXPT_St09Hdr {
    unsigned long magic;         /* 'ST09' */
    unsigned long build;         /* GFXPT_BUILD_ID (v15 = 0x5642) */
    unsigned long seq;           /* g_frameSeq au moment de la transition */
    unsigned long epoch;         /* monotone 1-based, jamais rÃ©utilisÃ© */
    unsigned long kind;          /* GFXPT_ST_KIND_* */
    unsigned long type;          /* RS raw 0..25 (kind 1) / slot (kind 2/6/5/7) / 33 (kind 3) / 39 (kind 4) / site 1-2 (kind 8/9) */
    unsigned long value;         /* value raw / token matdesc / mode raw / token target / texture (kind 8/9) */
    unsigned long aux;           /* gate *(cookie+0xAC4) (kind 6) / retour natif brut (v15 : kind 2/6) / stage (kind 8) / HRESULT brut (kind 9) ; 0 sinon */
    unsigned long ctx_token;     /* v15 : ptr brut opaque â€” ctx list (kind 6), device (kind 8/9) ; 0 = non capturÃ© */
    unsigned long device_token;  /* v15 : ptr brut opaque â€” gate AC4 (kind 6), devVT (kind 8/9) ; 0 = non capturÃ© */
} GFXPT_St09Hdr;

static unsigned char g_dumpRing[GFXPT_DUMP_RING_BYTES];  /* BSS zÃ©ro-rempli */
static unsigned long g_dumpWrite;       /* curseur d'Ã©criture absolu (octets) */
static unsigned long g_dumpCommit;      /* curseur flushÃ© (octets) */
static unsigned long g_dumpRecords;     /* global : records Ã©crits */
static unsigned long g_dumpBytes;       /* global : octets Ã©crits (ring) */
static unsigned long g_dumpRingDrops;   /* global : records perdus (ring plein) */
static unsigned long g_dumpSehFails;    /* global : Ã©checs SEH de copie */
static unsigned long g_dumpGuardSkips;  /* global : records refusÃ©s par garde */
static unsigned long g_frameSeq;        /* compteur de frames (present dispatch) */
static unsigned long g_capEndSeq;       /* 0 = dÃ©sarmÃ© ; sinon derniÃ¨re seq capturÃ©e */
static unsigned long g_frameRecords;    /* per-frame : records Ã©crits */
static unsigned long g_frameFails;      /* per-frame : Ã©checs SEH */
static unsigned long g_frameDrops;      /* per-frame : ring plein */
static unsigned long g_frameGuardSkips; /* per-frame : gardes */
static int            g_frameOverflow;  /* cap 4096 records atteint ce frame */

/* v8 â€” BSS TX07 (capture frame-level du miroir VRAM, spec Â§6.2 ; zÃ©ro-rempli) */
static unsigned long  g_frameTxRecs;    /* per-frame : records TX07 Ã©crits (log tx=N, 0..1) */
static int            g_frameTxEmitted; /* per-frame : 1 = TX07 dÃ©jÃ  Ã©mis ce frame (dÃ©dup pulse) */
static unsigned long  g_frameTxDrops;   /* per-frame : ring plein pour TX07 */
static unsigned long  g_txRingDrops;    /* global : records TX07 perdus (ring plein) */
static unsigned long  g_txSehFails;     /* global : Ã©checs SEH du chemin texture */
static int            g_txRingWarned;   /* ODS ring plein : 1 par fenÃªtre d'armement max */
static int            g_txSysWarned;    /* v9 : ODS sys_clut_row illisible â€” 1 par fenÃªtre max */

/* v10 â€” BSS TR08 (ressource texture TIM bataille ; zÃ©ro-rempli) */
static unsigned long  g_resSeen[GFXPT_RES_SEEN_MAX]; /* per-frame : VALEURS T dÃ©jÃ  Ã©mises (dÃ©dup TR08) */
static unsigned       g_resCount;       /* per-frame : nb d'entrÃ©es g_resSeen */
static unsigned long  g_frameTrRecs;    /* per-frame : records TR08 Ã©crits (log tr=N) */
static unsigned long  g_frameTrDrops;   /* per-frame : ring plein pour TR08 */
static unsigned long  g_trRingDrops;    /* global : records TR08 perdus (ring plein) */
static int            g_trRingWarned;   /* ODS ring plein TR08 : 1 par fenÃªtre max */

/* v14 (lot 22) â€” BSS Ã©tat (sideband ST09 ; zÃ©ro-rempli). g_stateEpoch est
 * MONOTONE sur toute la capture (jamais reset intra-capture : le reader
 * dÃ©tecte les trous par epoch ; l'invalidation est un EVENT kind=5, pas un
 * reset du compteur). */
static unsigned long  g_stateEpoch;     /* epoch courant (0 = unknown) */
static unsigned long  g_stRingDrops;    /* global : Ã©vÃ©nements ST09 perdus (ring plein) */
static unsigned long  g_stStreamBroken; /* 1 = trou d'epoch (drop ST09) â†’ bit2 footers */
static unsigned long  g_frameStRecs;    /* per-frame : records ST09 Ã©crits (log st=N) */

/* v15 (lot 24) â€” BSS pertes explicites + instrumentation stage0 (zÃ©ro-rempli).
 * UNIFICATION v15 : CHAQUE refus d'Ã©mission ST09 (hors fenÃªtre/frame
 * saturÃ©e, cap 1024/frame, ring plein) incrÃ©mente g_stLostCount/g_frameStLost
 * ET g_stRingDrops (1 refus = 1 lost + 1 drop) et pose g_stStreamBroken=1 â€”
 * plus aucune perte muette. Cache writer g_stage0_* : mis Ã  jour par le
 * logger result (kind9) UNIQUEMENT â€” lu au flush footer ND08 (triple
 * texture/device/devVT + hr). g_stage0_ret[2] = ret VAs (target+5) des deux
 * sites patchÃ©s â€” clÃ© d'identification du site dans le stub naked. */
static unsigned long  g_stLostCount;      /* global : refus d'Ã©mission ST09 */
static unsigned long  g_frameStLost;      /* per-frame : refus d'Ã©mission ST09 */
static int            g_stage0Armed;      /* 1 = les 2 hooks stage0 posÃ©s */
static int            g_stage0Broken;     /* echec install/restore ; distinct de Armed/Seen */
static int            g_stage0Seen;       /* 1 = â‰¥1 kind9 reÃ§u (avec Armed â†’ bit1) */
static unsigned long  g_stage0_tex;       /* cache writer : texture du dernier kind9 */
static unsigned long  g_stage0_dev;       /* cache writer : device du dernier kind9 */
static unsigned long  g_stage0_devvt;     /* cache writer : devVT du dernier kind9 */
static unsigned long  g_stage0_hr;        /* cache writer : HRESULT brut du dernier kind9 */
static unsigned char  g_stage0_saved[2][6]; /* prÃ©images sauvÃ©es (restore byte-exact) */
static void*          g_stage0_target[2]; /* VA des 2 sites patchÃ©s (0 = non posÃ©) */
static unsigned long  g_stage0_ret[2];    /* ret VAs (target+5) â€” id site du stub */

/* v17 : compteurs lifetime (y compris hors capture), sans IO dans les loggers.
 * Le helper est defini apres les constantes stage0 ; aucun nouveau format ABI. */
static int            g_stage0DiagEnabled;
static int            g_stage0DiagNoHook;
static int            g_stage0DiagBootHook;
static volatile LONG  g_stage0DiagReq[3]; /* 0=inconnu, 1=bind, 2=unbind */
static volatile LONG  g_stage0DiagRes[3];
static unsigned long  g_stage0DiagSavedMask;
static const char*    g_stage0DiagCause;
static DWORD          g_stage0DiagWinError; /* uniquement sur echec VirtualProtect */
static void GFXPT_Stage0Diag(const char* phase, const char* cause, int ret,
                             unsigned long siteMask);
static void GFXPT_Stage0BeforeUnload(void);

/* v18: stage0-only residence contract. The lock serializes installer/restore,
 * NOT executing stubs, other detours or the driver wrappers (no rundown).
 * InDllMain detects OUR callback only. Other DLL callbacks are forbidden
 * callers by contract; this is NOT a universal loader-lock detector. */
static int            g_stage0OptIn;
static volatile LONG  g_stage0Pinned;
static volatile LONG  g_stage0PinAttempts;
static volatile LONG  g_stage0PatchWrites;
static volatile LONG  g_stage0Activation; /* one attempt per module lifetime */
static volatile LONG  g_stage0Lock;
static volatile LONG  g_stage0InDllMain;
static DWORD          g_stage0LifecycleState;
static DWORD          g_stage0ActivationSource; /* 1=Present, 2=explicit export */
static DWORD          g_stage0PID;
static FILETIME       g_stage0ProcessCreation;
static HANDLE         g_stage0LifeFile = INVALID_HANDLE_VALUE;
static unsigned char  g_stage0Window[2][14];
static DWORD g_stage0OriginalProtect[2];
static DWORD g_stage0StableRet[2]; /* immutable while this pinned image exists */
static int            g_stage0LastWritten;
static int GFXPT_SideFileExists(const char* name);
static int GFXPT_Stage0Activate(DWORD source);

/* Copie gÃ©nÃ©rique dÃ©fendue (le detour draw ne doit JAMAIS faire tomber le jeu). */
static int GFXPT_CopyBytes(void* dst, const void* src, unsigned long n)
{
    int ok = 0;
    __try
    {
        memcpy(dst, src, (size_t)n);
        ok = 1;
    }
    __except (EXCEPTION_EXECUTE_HANDLER)
    {
        ok = 0;
    }
    return ok;
}

/* ---------------------------------------------------------------------------
 * v8 â€” Ã©mission du record TX07 : snapshot FRAME-LEVEL du miroir VRAM. Ã‰mis
 * UNE fois par frame armÃ© (dÃ©dup par pulse â€” flag per-frame
 * g_frameTxEmitted), sur le PREMIER node walk texturÃ© de la fenÃªtre.
 * AppelÃ© Ã  la TÃŠTE de GFXPT_DumpNode pour les slots walk texturÃ©s
 * (48â€“50/57â€“59/63â€“64 : texinfo = *(node+0x2C), page = *(texinfo+0x10) ;
 * 51/60 VB batch : geom = *(node+0x2C), page = *(geom+0x10) â€” mÃªmes offsets
 * +0x2C puis +0x10 â€” spec driver-abi-spec.md Â§6.2-A, decomp
 * 0x43E24A/0x43E356/0x43E692). Deref/lectures/copies TOUTES SEH-dÃ©fendues
 * (comme v7). Le detour draw ne fait JAMAIS tomber le jeu : tout Ã©chec â†’
 * counters + skip silencieux. Ring BSS partagÃ© avec ND07
 * (g_dumpRing/g_dumpWrite/g_dumpCommit) â€” aucune IO disque.
 *
 * Miroir VRAM : base = dword_1CB602C (valeur pointeur, lu SEH) ; espace
 * u16, pitch 0x800 mots/row (decomp 0x464F70 @0x465235, 0x464DB0, 0x4653E0,
 * 0x4675C0). Le miroir ENTIER = 1024 u16/row Ã— 512 rows = 0x100000 o et
 * contient TOUTES les pages ET toutes les CLUTs (dÃ©code/itÃ©ration
 * PNG-side OFFLINE sur le miroir complet). vram_base 0/illisible â†’ PAS de
 * record du tout (le miroir = la seule valeur ; g_txSehFails++, flag NON
 * posÃ© â€” le node walk texturÃ© suivant du frame retente). Copie miroir
 * Ã©chouÃ©e (SEH) â†’ RIEN Ã©crit, g_dumpWrite jamais avancÃ© (g_txSehFails++).
 * g_frameTxEmitted est posÃ© AVANT la copie : un multi-node frame n'Ã©met
 * JAMAIS deux fois. clut_now = dword contenant word_1CA89B8, copiÃ© BRUT
 * (mask & 0x7FFF appliquÃ© dÃ©code-side) ; Ã©chec â†’ 0 + fails (non-fatal).
 * m_B7DB44 : Ã©chec â†’ 0 + fails (non-fatal). page_probe = *(texinfo+0x10)
 * : Ã©chec â†’ 0, non-fatal (diagnostic pur). AUCUNE rÃ©solution de
 * CLUT/page gÃ©omÃ©trie cÃ´tÃ© DLL (contrat Â§2-2).
 * ------------------------------------------------------------------------- */
static void GFXPT_TxEmit(unsigned long seq, const void* node)
{
    GFXPT_Tx07Hdr        hdr;
    unsigned char*       p;
    unsigned char*       sysRow;                /* v9 : dest de sys_clut_row */
    unsigned long        holder = 0;
    unsigned long        v11 = 0;
    unsigned long        pageProbe = 0;
    unsigned long        clutNow = 0;
    unsigned long        vramBase = 0;
    unsigned long        m_B7DB44 = 0;
    unsigned long        fails = 0;
    unsigned long        need = GFXPT_DUMP_TX_REC_BYTES + GFXPT_DUMP_TX_WIN_BYTES; /* v13 : + TEXWIN 8 o */

    if (!node)
        return;

    /* DÃ©dup frame : UNE Ã©mission TX07 par frame armÃ© (flag per-frame). */
    if (g_frameTxEmitted)
        return;

    /* page_probe : *(texinfo+0x10), texinfo = *(node+0x2C) â€” champ
     * purement diagnostic dÃ©code-side ; Ã©chec SEH â†’ 0, non-fatal. */
    if (GFXPT_ReadU32((const char*)node + 0x2C, &holder) && holder != 0)
        (void)GFXPT_ReadU32((const void*)(holder + 0x10), &pageProbe);

    /* clut_now : dword contenant word_1CA89B8 (id CLUT vivant, sub_45B920 :
     * word + 0x7FFF), copiÃ© BRUT â€” mask & 0x7FFF appliquÃ© dÃ©code-side.
     * Ã‰chec â†’ 0 + fails (non-fatal, record quand mÃªme Ã©mis). */
    if (!GFXPT_ReadU32((const void*)GFXPT_HostEA(GFXPT_EA_CLUT_ID), &clutNow))
    {
        clutNow = 0;
        fails++;
    }

    /* Base miroir VRAM : dword_1CB602C (valeur pointeur). 0/illisible â†’
     * PAS de record du tout (miroir = la seule valeur) ; flag non posÃ© :
     * le node walk texturÃ© suivant du frame retente. */
    if (!GFXPT_ReadU32((const void*)GFXPT_HostEA(GFXPT_EA_VRAM_BASE), &vramBase) ||
        vramBase == 0)
    {
        g_txSehFails++;
        return;
    }

    /* Flag RGB555 : lecture SEH du BSS dword_B7DB44 (calibre le chemin
     * dÃ©codeur mode-2 de BlitRows ; stockÃ© par AllocTexturePageSlot
     * 0x465117-0x465135 â€” decomp 0x464F70 : dword_B7DB44 =
     * (*(int*)(hit + 0x44) == 0x7E0), armÃ© mode==2 uniquement). */
    if (!GFXPT_ReadU32((const void*)GFXPT_HostEA(GFXPT_EA_M_B7DB44), &m_B7DB44))
    {
        m_B7DB44 = 0;
        fails++;
    }

    /* Flag posÃ© AVANT la copie : un frame multi-node n'Ã©met jamais deux
     * fois (la base miroir est la mÃªme pour tout le frame). */
    g_frameTxEmitted = 1;

    if (need > GFXPT_DUMP_RING_BYTES - (g_dumpWrite - g_dumpCommit))
    {
        g_txRingDrops++;                    /* ring plein : TX seul (le record ND07 du node rÃ©fÃ©rent passe) */
        g_frameTxDrops++;
        if (!g_txRingWarned)
        {
            g_txRingWarned = 1;             /* 1 ODS par fenÃªtre d'armement : pas de spam par frame */
            GFXPT_ODS("gfx_passthrough " GFXPT_VERSION_TEXT
                      ": ring 64 Mo plein pour TX07, snapshot miroir VRAM droppe\n");
        }
        return;
    }

    /* Copie du miroir VRAM ENTIER (0x100000 o) SEH-dÃ©fendue directement
     * dans le ring. Ã‰chec SEH â†’ retour sans rien Ã©crire ni avancer
     * g_dumpWrite ; le record ND07 du node rÃ©fÃ©rent reste dans son flux. */
    p = &g_dumpRing[g_dumpWrite];
    if (!GFXPT_CopyBytes(p + sizeof(hdr), (const void*)vramBase,
                         GFXPT_DUMP_TX_VRAM_BYTES))
    {
        g_txSehFails++;                     /* rien Ã©crit (le miroir = la seule valeur) */
        return;                             /* pas de TX07 du tout */
    }

    /* v9 â€” sys_clut_row[2048] : row CLUT systÃ¨me du clut_now du frame â€”
     * src = HostEA(GFXPT_EA_SYS_CLUT) + 2048*((clut_now & 0x7FFF) >> 6)
     * (unk_1B47818 = base statique LITTÃ‰RALE ; sub_45B920 : fenÃªtre CLUT
     * dans la row `clut>>6`, 64 sous-CLUT Ã— 32 o â€” le grain 16 couleurs =
     * sous-palette par groupe d'id). Ã‰chec SEH â†’ 2048 o Ã  zÃ©ro + fails
     * (non-fatal, record Ã©mis) ; 1 ODS par fenÃªtre d'armement max. */
    sysRow = p + sizeof(hdr) + GFXPT_DUMP_TX_VRAM_BYTES;
    if (!GFXPT_CopyBytes(sysRow,
                         (const void*)((unsigned long)GFXPT_HostEA(GFXPT_EA_SYS_CLUT)
                                       + 0x800ul * ((clutNow & 0x7FFFul) >> 6)),
                         GFXPT_DUMP_TX_SYSROW_BYTES))
    {
        memset(sysRow, 0, (size_t)GFXPT_DUMP_TX_SYSROW_BYTES);
        fails++;
        if (!g_txSysWarned)
        {
            g_txSysWarned = 1;
            GFXPT_ODS("gfx_passthrough " GFXPT_VERSION_TEXT
                      ": sys CLUT row illisible, sys_clut_row a zero (tx)\n");
        }
    }

    /* v13 - TEXWIN : scales resolus de la fenetre texture (sub_45BC60),
     * globals BSS absolus dword_1CA8870 / word_1CA8874 / word_1CA8876 ;
     * echec SEH -> 0 (non-fatal, decodeur fallback LUT /256). */
    {
        GFXPT_Tx07Win        win;
        win.origin_xy = 0;
        win.wh = 0;
        (void)GFXPT_ReadU32((const void*)GFXPT_HostEA(GFXPT_EA_WINDOW_XY), &win.origin_xy);
        (void)GFXPT_ReadU32((const void*)GFXPT_HostEA(GFXPT_EA_WIN_W), &win.wh);
        memcpy(sysRow + GFXPT_DUMP_TX_SYSROW_BYTES, &win, GFXPT_DUMP_TX_WIN_BYTES);
    }

    hdr.magic = GFXPT_DUMP_MAGIC_TX;
    hdr.build = GFXPT_BUILD_ID;
    hdr.seq = seq;                          /* g_frameSeq au node rÃ©fÃ©rent */
    hdr.clut_now = clutNow;                 /* brut ; & 0x7FFF appliquÃ© dÃ©code-side */
    hdr.vram_base = vramBase;               /* ptr miroir VRAM (dword_1CB602C) */
    hdr.sys_clut_base = GFXPT_EA_VRAM_CLUT_LUTB;    /* constante : base systÃ¨me CLUT */
    hdr.m_B7DB44 = m_B7DB44;
    hdr.page_probe = pageProbe;             /* diagnostic ; 0 si chaÃ®ne illisible */
    memcpy(p, &hdr, sizeof(hdr));

    if (fails)
        g_txSehFails += fails;
    g_dumpWrite += need;
    g_dumpRecords++;
    g_dumpBytes += need;
    g_frameRecords++;
    g_frameTxRecs++;
}

/* ---------------------------------------------------------------------------
 * v10 â€” Ã©mission du record TR08 (ressource texture TIM bataille) : UN record
 * par texobj unique PAR FRAME (dÃ©dup par VALEUR du pointeur T â€” table
 * per-frame g_resSeen[64]/g_resCount, reset au pulse), sur le PREMIER node
 * walk texturÃ© qui le rÃ©fÃ©rence, AVANT le ND08 de CE node. AppelÃ© Ã  la TÃŠTE
 * de GFXPT_DumpNode juste aprÃ¨s GFXPT_TxEmit pour les slots walk texturÃ©s
 * (48â€“50/57â€“59/63â€“64 : texinfo = *(node+0x2C) ; 51/60 VB : geom =
 * *(node+0x2C) â€” mÃªmes offsets +0x2C puis +0x10 ; T = *(texinfo+0x10) EST la
 * valeur page_probe de TX07). Deref/lectures/copies TOUTES SEH-dÃ©fendues.
 *
 * Ground truth (chaÃ®ne IDB sub_407EB4 â†’ sub_4221E6 â†’ sub_421C41) : w/h =
 * *(T+0x3C/+0x40) ; entries/palette = *(T+0x5C) (256 pour 8bpp, 16 pour
 * 4bpp) ; palMgr M = *(T+0xA0) â€” pal_count = *(u32*)(M+12) = M[3] Ã  T+0xAC,
 * cap 32 ; CLUT BRUT = *(T+0x60), u32 PAR COULEUR, TOUTES les sous-palettes
 * consÃ©cutives (palette i Ã  raw + 4*entries*i ; l'octet 3 de chaque u32 =
 * bit de transparence PSX STP) ; pixels = *(T+0xD8), 1 o/texel (w*h).
 *
 * Ã‰checs : lecture de chaÃ®ne (texinfo/T) ou champ T illisible â†’ pas de
 * tentative ce node (texobj NON marquÃ© â€” le prochain node rÃ©fÃ©rent
 * retente) ; pal_count illisible (palMgr lisible) â†’ 0 (clut_size 0, pixels
 * seuls, non-fatal) ; garde taille (w*h > 65536 o ou clut > 32768 o) â†’
 * skip comptÃ© g_dumpGuardSkips/g_frameGuardSkips (non marquÃ©) ; ring
 * plein â†’ drop g_trRingDrops/g_frameTrDrops + 1 ODS par fenÃªtre
 * (g_trRingWarned) ; Ã©chec SEH d'UNE des copies (pixels OU CLUT) â†’ AUCUN
 * record du tout (rÃ¨gle Â« pixel = la valeur seule Â», style TX),
 * g_txSehFails++ â€” texobj marquÃ© vu AVANT la copie (style
 * g_frameTxEmitted : pas de seconde tentative). Cap 32 records TR08/frame
 * (g_frameTrRecs). Le detour draw ne fait JAMAIS tomber le jeu. Ring BSS
 * partagÃ© ND/TX/TR (g_dumpRing/g_dumpWrite/g_dumpCommit) â€” aucune IO
 * disque. AUCUNE rÃ©solution de palette cÃ´tÃ© DLL (raw_clut copiÃ© BRUT).
 * ------------------------------------------------------------------------- */
static void GFXPT_TrEmit(unsigned long seq, const void* node, const void* ctx)
{
    GFXPT_Tr08Hdr        hdr;
    unsigned char*       p;
    unsigned long        holder = 0;
    unsigned long        v11 = 0;
    unsigned long        texObj = 0;
    unsigned long        w = 0;
    unsigned long        h = 0;
    unsigned long        palEntries = 0;
    unsigned long        palMgr = 0;
    unsigned long        palCount = 0;
    unsigned long        pixelBuf = 0;
    unsigned long        clutBuf = 0;
    unsigned long        pixelSize;
    unsigned long        clutSize;
    unsigned long        need;
    unsigned             i;

    if (!node)
        return;

    /* v10.1 â€” chaÃ®ne TIM (live-probe 26/09 + decomp sub_407EB4/sub_421C41) :
     * backend = ctx[0x3C] ? ctx[0x68] : ctx[0x38] (override du walk 0x4178D7) ;
     * v11 = *(backend+20) ; T = *(v11+152) = l'OBJET DONNÃ‰ES texture. La clÃ©
     * de dÃ©dup ET la clÃ© du footer ND08 = T (VALEUR). Ã‰chec | 0 â†’ pas de
     * TR08 ce node (T non marquÃ© : retry au rÃ©fÃ©rent suivant). */
    {
        unsigned long override38 = 0;
        unsigned long backend = 0;
        if (!GFXPT_ReadU32((const char*)ctx + 0x3C, &override38))
            return;
        if (override38 != 0) {
            if (!GFXPT_ReadU32((const char*)ctx + 0x68, &backend) || backend == 0)
                return;
        } else {
            if (!GFXPT_ReadU32((const char*)ctx + 0x38, &backend) || backend == 0)
                return;
        }
        if (!GFXPT_ReadU32((const void*)(backend + 20), &v11) || v11 == 0)
            return;
        if (!GFXPT_ReadU32((const void*)(v11 + 152), &texObj) || texObj == 0)
            return;
        (void)holder;
    }

    /* DÃ©dup par frame par texobj (UN record par texobj unique). */
    for (i = 0; i < g_resCount; ++i)
    {
        if (g_resSeen[i] == texObj)
            return;
    }

    /* Cap 32 records TR08 par frame (au-delÃ  : skip silencieux). */
    if (g_frameTrRecs >= GFXPT_TR_MAX_FRAME)
        return;

    /* Champs T (ground truth ci-dessus). Ã‰chec SEH (ou valeur nulle pour
     * w/h/entries/palMgr) â†’ pas de tentative (texobj non marquÃ©). */
    if (!GFXPT_ReadU32((const void*)(texObj + 0x3C), &w) || w == 0)
        return;
    if (!GFXPT_ReadU32((const void*)(texObj + 0x40), &h) || h == 0)
        return;
    if (!GFXPT_ReadU32((const void*)(texObj + 0x5C), &palEntries) ||
        palEntries == 0)
        return;
    if (!GFXPT_ReadU32((const void*)(v11 + 0xA0), &palMgr) || palMgr == 0)
        return;

    /* pal_count = *(u32*)(M+12) (= T+0xAC) â€” cap 32 (saturÃ©, style
     * id_count) ; illisible (palMgr lisible) â†’ 0 (clut_size 0, pixels
     * seuls â€” non-fatal). */
    (void)GFXPT_ReadU32((const void*)(palMgr + 0xC), &palCount);
    if (palCount > GFXPT_TR_PAL_COUNT_MAX)
        palCount = GFXPT_TR_PAL_COUNT_MAX;

    /* pixel_size = w*h â€” cap 65536 ; dÃ©passement â†’ skip (garde). La
     * division Ã©vite tout dÃ©bordement u32 du produit. */
    if (w > GFXPT_DUMP_TR_PIXEL_MAX / h)
    {
        g_dumpGuardSkips++;
        g_frameGuardSkips++;
        return;
    }
    pixelSize = w * h;

    /* clut_size = pal_count * pal_entries * 4 â€” cap 32768 (= 32 Ã— 256 Ã— 4) ;
     * garantit need = 40 + pixel + clut â‰¤ 98 344 o (0x18028) par construction. */
    clutSize = 0;
    if (palCount != 0)
    {
        if (palEntries > GFXPT_DUMP_TR_CLUT_MAX / (4ul * palCount))
        {
            g_dumpGuardSkips++;
            g_frameGuardSkips++;
            return;
        }
        clutSize = palCount * palEntries * 4ul;
    }

    /* Buffers Ã  copier : pixels *(T+0xD8), CLUT brut *(T+0x60) â€” ptrs
     * requis (non nuls) Ã  hauteur des tailles. */
    if (!GFXPT_ReadU32((const void*)(texObj + 0xD8), &pixelBuf) ||
        (pixelSize != 0 && pixelBuf == 0))
        return;
    if (clutSize != 0)
    {
        if (!GFXPT_ReadU32((const void*)(texObj + 0x60), &clutBuf) ||
            clutBuf == 0)
            return;
    }

    /* MarquÃ© vu AVANT les copies (style g_frameTxEmitted : ni ring-drop ni
     * copie SEH ratÃ©e ne retentent ce frame). */
    if (g_resCount >= GFXPT_RES_SEEN_MAX)
        return;                             /* table pleine (cap 32 < 64 : inatteignable) */
    g_resSeen[g_resCount++] = texObj;

    need = (unsigned long)sizeof(hdr) + pixelSize + clutSize;

    /* Ring-space style TX07 : plein â†’ drop + 1 ODS par fenÃªtre d'armement
     * (le ND08 du node rÃ©fÃ©rent passe). */
    if (need > GFXPT_DUMP_RING_BYTES - (g_dumpWrite - g_dumpCommit))
    {
        g_trRingDrops++;
        g_frameTrDrops++;
        if (!g_trRingWarned)
        {
            g_trRingWarned = 1;
            GFXPT_ODS("gfx_passthrough " GFXPT_VERSION_TEXT
                      ": ring 64 Mo plein pour TR08, ressource texture droppe\n");
        }
        return;
    }

    /* Copie pixels (1 o/texel) SEH-dÃ©fendue directement dans le ring â€”
     * Ã©chec â†’ AUCUN octet Ã©crit ni g_dumpWrite avancÃ© (rÃ¨gle TX Â« pixel =
     * la valeur seule Â» â€” no record at all). */
    p = &g_dumpRing[g_dumpWrite];
    if (!GFXPT_CopyBytes(p + sizeof(hdr), (const void*)pixelBuf, pixelSize))
    {
        g_txSehFails++;
        return;
    }

    /* Copie CLUT BRUT (u32 PAR COULEUR, toutes sous-palettes consÃ©cutives)
     * â€” Ã©chec â†’ AUCUN record du tout. */
    if (clutSize &&
        !GFXPT_CopyBytes(p + sizeof(hdr) + pixelSize, (const void*)clutBuf,
                         clutSize))
    {
        g_txSehFails++;
        return;
    }

    hdr.magic = GFXPT_DUMP_MAGIC_TR;
    hdr.build = GFXPT_BUILD_ID;
    hdr.seq = seq;                          /* g_frameSeq au node rÃ©fÃ©rent */
    hdr.texobj = texObj;                    /* VALEUR T â€” clÃ© footer ND08 */
    hdr.w = w;
    hdr.h = h;
    hdr.pal_entries = palEntries;
    hdr.pal_count = palCount;
    hdr.pixel_size = pixelSize;
    hdr.clut_size = clutSize;
    memcpy(p, &hdr, sizeof(hdr));

    g_dumpWrite += need;
    g_dumpRecords++;
    g_dumpBytes += need;
    g_frameRecords++;
    g_frameTrRecs++;
}

/* Chemin d'un fichier sidecar Ã  cÃ´tÃ© de la DLL (mÃªme mÃ©canisme que le CSV). */
static int GFXPT_BuildSidePath(const char* name, char* out)
{
    char path[MAX_PATH];
    char* slash;
    DWORD m;

    m = GetModuleFileNameA(g_hinstDLL, path, (DWORD)sizeof(path));
    if (m == 0 || m >= (DWORD)sizeof(path) - 64)
        return 0;
    slash = path + m;
    while (slash > path && slash[-1] != '\\' && slash[-1] != '/')
        --slash;
    *slash = 0;
    if ((size_t)lstrlenA(name) + 1 > (sizeof(path) - (size_t)(slash - path)))
        return 0;
    lstrcpynA(slash, name, (int)(sizeof(path) - (size_t)(slash - path)));
    lstrcpynA(out, path, (int)sizeof(path));
    return 1;
}

/* ---------------------------------------------------------------------------
 * v14 (lot 22) â€” Ã©mission d'un Ã©vÃ©nement d'Ã©tat ST09 dans le ring.
 * Points d'Ã©mission = wrappers proxied slots 29/30/31/32/33/39 (+ setup
 * kind=6 dans GFXPT_DumpNode + invalidations 0/1 + scÃ¨nes 40/41). AUCUNE
 * lecture Get* (GetRenderState/GetTexture) dans le detour, aucune IO,
 * tout SEH-dÃ©fendu (matdesc/gate lus via GFXPT_ReadU32 Ã  l'appelant).
 * v15 (lot 24) â€” cÅ“ur = GFXPT_StEmitCtx (ST09 40 o : +ctx_token/
 * +device_token bruts opaques, 0 = non capturÃ©). GFXPT_StEmit = wrapper
 * compat (tokens 0) pour les sites sans contexte dispo. UNIFICATION DES
 * PERTES : CHAQUE refus PENDANT la fenÃªtre armÃ©e (frame saturÃ©e >4096
 * records, cap 1024 ST/frame, ring plein) passe par GFXPT_StLost :
 * g_stStreamBroken=1 + g_stRingDrops++ + g_stLostCount++ + g_frameStLost++ â€”
 * 1 refus = 1 lost + 1 drop, plus aucune perte muette (bit2/bit3 footers).
 * Hors fenÃªtre / capture dÃ©sarmÃ©e : refus SILENCIEUX (sÃ©mantique v14) â€” ce
 * n'est pas une perte, INCOMPLETE ne doit pas Ãªtre collant Ã  l'idle.
 * g_stateEpoch avance UNIQUEMENT
 * sur Ã©mission rÃ©ussie : un footer draw rÃ©fÃ©rence toujours le dernier
 * event rÃ©ellement Ã©crit.
 * ------------------------------------------------------------------------- */
static void GFXPT_StLost(void)
{
    g_stStreamBroken = 1;                   /* trou explicite (bit2 footers) */
    g_stRingDrops++;
    g_stLostCount++;
    g_frameStLost++;                        /* bit3 footer de la frame */
}

static void GFXPT_StEmitCtx(unsigned long kind, unsigned long type,
                            unsigned long value, unsigned long aux,
                            unsigned long ctxTok, unsigned long devTok)
{
    GFXPT_St09Hdr hdr;
    unsigned char* p;
    unsigned long need = GFXPT_ST_REC_BYTES;

    if (g_capEndSeq == 0 || g_frameSeq > g_capEndSeq)
        return;                             /* hors armement : refus silencieux, PAS une perte */
    if (g_frameOverflow)
    {
        GFXPT_StLost();                     /* frame saturÃ©e pendant la fenÃªtre : perte rÃ©elle */
        return;
    }
    if (g_frameStRecs >= GFXPT_ST_MAX_FRAME)
    {
        GFXPT_StLost();                     /* cap ST09/frame */
        return;
    }
    if (need > GFXPT_DUMP_RING_BYTES - (g_dumpWrite - g_dumpCommit))
    {
        GFXPT_StLost();                     /* ring plein */
        return;
    }
    hdr.magic = GFXPT_DUMP_MAGIC_ST;
    hdr.build = GFXPT_BUILD_ID;
    hdr.seq = g_frameSeq;
    hdr.epoch = g_stateEpoch + 1;
    hdr.kind = kind;
    hdr.type = type;
    hdr.value = value;
    hdr.aux = aux;
    hdr.ctx_token = ctxTok;                 /* v15 : brut opaque (0 = non capturÃ©) */
    hdr.device_token = devTok;              /* v15 : brut opaque (0 = non capturÃ©) */
    p = &g_dumpRing[g_dumpWrite];
    memcpy(p, &hdr, sizeof(hdr));
    g_dumpWrite += need;
    g_stateEpoch++;
    g_dumpRecords++;
    g_dumpBytes += need;
    g_frameStRecs++;
}

/* v15 (lot 24) â€” wrapper compat v14 : sites sans ctx/device observable
 * (tokens Ã  0 = Â« non capturÃ© Â», sÃ©mantique ST09 v15). */
static void GFXPT_StEmit(unsigned long kind, unsigned long type,
                         unsigned long value, unsigned long aux)
{
    GFXPT_StEmitCtx(kind, type, value, aux, 0ul, 0ul);
}

/* ---------------------------------------------------------------------------
 * Capture d'un node au vol (appelÃ© depuis chaque wrapper 43â€“64, synchrone,
 * APRÃˆS le forward natif â€” mÃªme ordre que la capture v6.1). Ã‰criture ring
 * seule : AUCUNE IO disque ici.
 *
 * v8 â€” TX07 frame-level : pour les slots walk texturÃ©s (48â€“50/57â€“59/63â€“64
 * direct, 51/60 VB batch), le snapshot miroir VRAM (TX07) est Ã©mis UNE fois
 * par frame armÃ© (dÃ©dup par pulse â€” g_frameTxEmitted) AVANT la copie du
 * node, sur le PREMIER node walk texturÃ© de la frame, TOUTE de suite aprÃ¨s
 * les guards de fenÃªtre et le guard node. L'Ã©mission TX est indÃ©pendante
 * du sort du record node (skips/gardes node) : le mapping dÃ©codeur se fait
 * par ADRESSE, pas par position de flux (voir le contrat TX07 au-dessus de
 * GFXPT_DumpHdr).
 * v9 â€” footer ND08 (kind2 only) : footer texture APPEND au payload (voir le
 * contrat Â« v9 patch Â» ci-dessus) ; la sÃ©lection du magic ND07/ND08 se fait
 * sur geom_kind, l'Ã©mission TX07 n'est pas modifiÃ©e.
 * v10 â€” TR08 (ressource texture par texobj) au MÃŠME point d'Ã©mission que
 * TX07 (appel GFXPT_TrEmit juste aprÃ¨s GFXPT_TxEmit â€” dÃ©dup g_resSeen) ;
 * footer ND08 Ã©tendu du champ texobj (voir contrat Â« v10 patch Â»).
 * v15 (lot 24) â€” signature cdecl 6 args : +nativeResult = retour brut du
 * forward natif (capturÃ© par GFXPT_WRAP_LIST aprÃ¨s le call), transmis au
 * kind6 en aux (witness candidat, jamais interprÃ©tÃ©) ; footer ND08 Ã©tendu
 * des 6 u32 stage0/perte (voir contrat Â« v15 Â» au bloc ST09).
 * ------------------------------------------------------------------------- */
static void GFXPT_DumpNode(unsigned slot, const void* ctx, const void* node,
                           unsigned long preStateEpoch, const void* cookie,
                           unsigned long nativeResult)
{
    unsigned char        nodeCopy[GFXPT_NODE_BYTES];
    unsigned long        geomKind = 0;
    unsigned long        vcount = 0;
    unsigned long        icount = 0;
    const unsigned char* verts = 0;
    const unsigned char* idx = 0;
    unsigned long        remaining = 0;
    unsigned long        geomPtr = 0;
    unsigned long        perV = 0;
    unsigned long        perI = 0;
    unsigned long        idxBytes;
    unsigned long        idxPad;
    unsigned long        payload;
    unsigned long        need;
    unsigned long        fails;
    GFXPT_DumpHdr        hdr;
    unsigned char*       p;
    unsigned long        texinfoPtr = 0;        /* v9 footer : texinfo = *(node+0x2C) */
    unsigned long        tpage = 0;             /* v9 footer : *(texinfo+0x20) */
    unsigned long        tmode = 0;             /* v9 footer : *(texinfo+0x14) */
    unsigned long        clut = 0;              /* v9 footer : *(u16*)(ctx+0x448) */
    unsigned long        idCount = 0;           /* v9 footer : min(remaining,255) */
    unsigned long        droppedIds = 0;        /* v9 footer : gcount si >255 sinon 0 */
    unsigned long        idsPtr = 0;            /* v9 footer : *(u8**)(node+0x28) */
    unsigned long        idsFailed = 0;         /* v9 footer : 1 = stream illisible */
    unsigned long        texObj = 0;            /* v10 footer : *(texinfo+0x10) */
    unsigned long        windowWord = 0;        /* v12 footer : *(ctx+0x28) & 0xFFFFFF */
    unsigned long        clutSysId = 0;         /* v12 footer : clut & 0x7FFF */
    unsigned long        otZ = 0;               /* v12 footer : z-sort PSX (0 = non branchÃ©) */
    unsigned long        idsPad;
    unsigned long        footerBytes;
    unsigned char        idsStage[256];         /* v9 : copie SEH unique du stream */

    if (g_capEndSeq == 0 || g_frameSeq > g_capEndSeq || g_frameOverflow)
        return;                             /* hors fenÃªtre ou frame saturÃ© */
    if (g_frameRecords >= GFXPT_DUMP_MAX_FRAME)
    {
        g_frameOverflow = 1;                /* stop capture du frame */
        return;
    }
    if (!node)
        return;                             /* garde : node non nul */

    /* v8 â€” TX07 frame-level : miroir VRAM une fois par frame armÃ© (premier
     * node walk texturÃ© de la frame), Ã©mis AVANT la copie du node (ordre :
     * window guard â†’ TX emit â†’ node copy). L'Ã©mission est pour slots walk
     * texturÃ©s SEULEMENT (Â§6.2-A) ; dÃ©dup par pulse intÃ©grÃ© Ã 
     * GFXPT_TxEmit, ring-drop isolÃ© (node non affectÃ©).
     * v10 â€” TR08 : ressource texture TIM (UN record par texobj unique par
     * frame, dÃ©dup g_resSeen) au MÃŠME point d'Ã©mission, juste aprÃ¨s le
     * TX emit â€” ordre flux : TX07 â†’ TR08 â†’ ND07/ND08. */
    switch (slot)
    {
    case 48: case 49: case 50:
    case 51:
    case 57: case 58: case 59: case 60:
    case 63: case 64:
        GFXPT_TxEmit(g_frameSeq, node);
        GFXPT_TrEmit(g_frameSeq, node, ctx);
        break;
    default:
        break;
    }

    if (!GFXPT_CopyBytes(nodeCopy, node, (unsigned long)GFXPT_NODE_BYTES))
    {
        g_dumpSehFails++;                   /* node illisible : pas d'ancrage */
        return;
    }

    /* Closure slot â†’ classe gÃ©omÃ©trique (table prouvÃ©e en tÃªte de bloc). */
    switch (slot)
    {
    case 48: case 49: case 50:              /* 0x43E24A (tri FVF 0x1C4) */
    case 57: case 58: case 59:              /* 0x43E5E9 (tri FVF 0x1E2) */
    case 63: case 64:                       /* 0x43E540 (linelist FVF 0x1C4) */
        geomKind = 2;
        if (!GFXPT_ReadU32((const char*)node + 0x0C, &vcount) ||
            !GFXPT_ReadU32((const char*)node + 0x18, &icount) ||
            !GFXPT_ReadU32((const char*)node + 0x14, (unsigned long*)&verts) ||
            !GFXPT_ReadU32((const char*)node + 0x20, (unsigned long*)&idx))
        {
            g_dumpSehFails++;
            return;                         /* closure illisible : skip record */
        }
        /* v9 â€” footer ND08 : lecture texinfo DÃ‰DIÃ‰E (indÃ©pendante du holder
         * de GFXPT_TxEmit) ; Ã©chec â†’ 0 (tpage/mode restent 0, diagnostic). */
        (void)GFXPT_ReadU32((const char*)node + 0x2C, &texinfoPtr);
        break;
    case 51:                                /* 0x43E356 (VB batch) */
    case 60:                                /* 0x43E692 (VB batch) */
        geomKind = 2;
        if (!GFXPT_ReadU32((const char*)node + 0x08, &remaining) ||
            !GFXPT_ReadU32((const char*)node + 0x2C, &geomPtr) ||
            !GFXPT_ReadU32((const char*)node + 0x14, (unsigned long*)&verts) ||
            !GFXPT_ReadU32((const char*)node + 0x20, (unsigned long*)&idx))
        {
            g_dumpSehFails++;
            return;
        }
        /* v9 â€” footer ND08 : texinfo|geom du node (dÃ©jÃ  lu) + stream d'ids
         * tel que consommÃ© par le walk natif : ids = *(node+0x28), 1 octet
         * PAR GROUPE (0x43E419/0x43E725), remaining = *(s32*)(node+0x08).
         * Copie SEH UNIQUE (â‰¤ 256 o, 255 Ã©mis max) â€” AUCUN read par groupe.
         * Ã‰chec (pointeur SEH fail, 0, ou copie SEH) â†’ id_count=0,
         * dropped_ids=0, comptÃ© dans hdr.fails (bloc mis Ã  zÃ©ro, style
         * idx/fvf). */
        texinfoPtr = geomPtr;
        if (remaining > 0)
        {
            idCount = (remaining > 255ul) ? 255ul : remaining;
            if (remaining > 255ul)
                droppedIds = remaining;     /* cap : gcount est dans dropped_ids */
            if (!GFXPT_ReadU32((const char*)node + 0x28, &idsPtr) || idsPtr == 0 ||
                !GFXPT_CopyBytes(idsStage, (const void*)idsPtr,
                                 (remaining > 255ul) ? 256ul : idCount))
            {
                idCount = 0;
                droppedIds = 0;
                idsFailed = 1;
            }
        }
        if (geomPtr)
        {
            (void)GFXPT_ReadU32((const void*)(geomPtr + 0x3C), &perV);
            (void)GFXPT_ReadU32((const void*)(geomPtr + 0x40), &perI);
        }
        /* remaining = s32 cÃ´tÃ© natif ; nÃ©gatif â†’ Ã©norme non-signÃ© â†’ garde. */
        if (remaining > 0 && perV > 0 && remaining <= GFXPT_DUMP_VCOUNT_MAX / perV)
            vcount = perV * remaining;
        if (remaining > 0 && perI > 0 && remaining <= GFXPT_DUMP_ICOUNT_MAX / perI)
            icount = perI * remaining;
        break;
    default:
        geomKind = 0;                       /* setups : node jamais lu (prouvÃ©) */
        /* v14 (lot 22) â€” commit de session setup (kind=6) : les impls
         * sub_43DF00 (43/44), sub_43DF2A (45), sub_43DF54 (46),
         * sub_43DFA6 (47), sub_43E0E2 (55) appellent sub_441560/
         * sub_441581(matdesc, cookie) EN DIRECT dans le forward natif
         * (EA 0x43DF07â†’0x43DF1E, 0x43DF72, 0x43DFC4, 0x43E104) â€” hors
         * slots proxied. Event si les gates prouvÃ©es sont actives ;
         * aucun event si le commit est no-op (transition non exÃ©cutÃ©e :
         * *(ctx+0x30)==0 ou gate *(cookie+0xAC4)==0 ou matdesc 0).
         * Slots 52/53/54/56 : commit NON prouvÃ© â†’ aucun event. */
        if (slot == 43 || slot == 44 || slot == 45 || slot == 46 ||
            slot == 47 || slot == 55)
        {
            unsigned long gate30 = 0;
            unsigned long matdesc = 0;
            unsigned long gateAC4 = 0;
            if (GFXPT_ReadU32((const char*)ctx + 0x30, &gate30) && gate30 != 0 &&
                GFXPT_ReadU32((const char*)ctx + 0x38, &matdesc) && matdesc != 0 &&
                GFXPT_ReadU32((const char*)cookie + GFXPT_EA_COOKIE_GATE_AC4, &gateAC4) &&
                gateAC4 != 0)
            {
                /* v15 (lot 24) : aux = retour natif brut du forward (witness
                 * candidat â€” JAMAIS interprÃ©tÃ© HRESULT) ; device_token = gate
                 * AC4 ; ctx_token = ctx brut (list+0x18). */
                GFXPT_StEmitCtx(GFXPT_ST_KIND_SETUP_COMMIT, (unsigned long)slot,
                                matdesc, nativeResult, (unsigned long)ctx,
                                gateAC4);
            }
        }
        break;
    }

    if (geomKind == 2)
    {
        if (vcount == 0 && icount == 0)
            return;                         /* rien Ã  dessiner */
        if (vcount > GFXPT_DUMP_VCOUNT_MAX || icount > GFXPT_DUMP_ICOUNT_MAX)
        {
            g_dumpGuardSkips++;
            g_frameGuardSkips++;
            return;
        }
    }

    idxBytes = icount * 2ul;
    idxPad = (idxBytes & 3ul) ? (4ul - (idxBytes & 3ul)) : 0ul;
    /* v9 â€” footer ND08 (kind2 only) : 4 x u32 (tpage/mode/clut/id_count) +
     * ids[id_count] (pad align u32) + dropped_ids u32 toujours prÃ©sent.
     * v10 : +1 u32 texobj APPEND en fin â€” 6 x u32 always-present (24 o)
     * + ids.
     * v12 : +3 u32 (window_word|clut_sys_id|ot_z) â€” 9 x u32 always-present
     * (36 o) + ids. */
    idsPad = (idCount & 3ul) ? (4ul - (idCount & 3ul)) : 0ul;
    /* v9 â€” footer ND08 (kind2 only) : 4 x u32 (tpage/mode/clut/id_count) +
     * ids[id_count] (pad align u32) + dropped_ids u32 toujours prÃ©sent.
     * v10 : +1 u32 texobj APPEND en fin â€” 6 x u32 always-present (24 o)
     * + ids.
     * v12 : +3 u32 (window_word|clut_sys_id|ot_z) â€” 9 x u32 always-present
     * (36 o) + ids.
     * v14 : +2 u32 (state_epoch|state_flags) â€” 11 x u32 always-present
     * (44 o) + ids ; footerBytes = 16 + ids + pad + 4 (dropped) + 4
     * (texobj) + 12 (v12) + 8 (v14). ND08 v14 record max = 0x28170 âŠ‚ cap
     * 0x100C80 (marge inchangÃ©e).
     * v15 : +6 u32 (stage0_tex|stage0_dev|stage0_devvt|stage0_hr|
     * st_emitted|st_lost) â€” 17 x u32 always-present (68 o) + ids ;
     * footerBytes = 16 + ids + pad + 4 (dropped) + 4 (texobj) + 12 (v12)
     * + 8 (v14) + 24 (v15). ND08 v15 record max = 0x28170 + 24 = 0x28188
     * âŠ‚ cap 0x100C80 (marge inchangÃ©e). */
    idsPad = (idCount & 3ul) ? (4ul - (idCount & 3ul)) : 0ul;
    footerBytes = (geomKind == 2)
                ? (16ul + idCount + idsPad + 4ul + 4ul + 4ul + 4ul + 4ul
                   + 4ul + 4ul + 24ul)
                : 0ul;
    payload = (geomKind == 2)
            ? (8ul + idxBytes + idxPad + (vcount * 32ul) + footerBytes)
            : 0ul;
    need = (unsigned long)sizeof(hdr) + (unsigned long)GFXPT_NODE_BYTES + payload;
    if (need > GFXPT_DUMP_MAX_NODE_BYTES)   /* garde (v9 : 0x100C80 â€” voir define) */
    {
        g_dumpGuardSkips++;
        g_frameGuardSkips++;
        return;
    }
    if (need > GFXPT_DUMP_RING_BYTES - (g_dumpWrite - g_dumpCommit))
    {
        g_dumpRingDrops++;                  /* ring plein : dÃ©gradation silencieuse */
        g_frameDrops++;
        return;
    }

    /* v9 â€” inputs du footer ND08 lus ICI (aprÃ¨s gardes/ring â€” un drop ring
     * ne paie pas les lectures) ; Ã©checs SEH â†’ 0, non-fatal (diagnostic,
     * style page_probe TX07). */
    if (geomKind == 2)
    {
        if (texinfoPtr != 0)
        {
            (void)GFXPT_ReadU32((const void*)(texinfoPtr + 0x20), &tpage);
            (void)GFXPT_ReadU32((const void*)(texinfoPtr + 0x14), &tmode);
        }
        if (ctx != 0)
        {
            /* v10.3 â€” footer texobj = T via la CHAÃŽNE ctx (la mÃªme que
             * GFXPT_TrEmit : backend = ctx[0x3C] ? ctx[0x68] : ctx[0x38] ;
             * v11 = *(backend+20) ; T = *(v11+152)) â€” *(texinfo+0x10) pointait
             * le mauvais objet (le backend, pas les donnÃ©es). */
            /* v11 â€” slots DIRECTS 48/49/50 : sub_43E0E2 lit matdesc =
             * *(ctx+0x38) INCONDITIONNELLEMENT (@0x43e0f3-f6) â€” le branchement
             * ctx+0x3C est le backend des VB batch (51/60) et dead-end pour
             * les directs (sonde live 26/09 : texobj=0 sur tous les records
             * slot 49). ChaÃ®ne : texobj = *(matdesc+0x14) [@0x4415a7,
             * @0x41F011] ; T = *(texobj+152) [@0x41F038, w/h @0x4202C1/
             * 0x4202D3]. MÃªme espace de valeurs que les clÃ©s TR08. La capture
             * in-detour EST la sonde du champ transitoire (post-hoc faussÃ©
             * par le rendu pause â€” CLOSURE walkdirect Â§10). */
            unsigned long bkw = 0;
            unsigned long ovl = 0;
            unsigned long v11f = 0;
            if (slot == 48 || slot == 49 || slot == 50)
            {
                if (GFXPT_ReadU32((const char*)ctx + 0x38, &bkw) && bkw != 0)
                {
                    if (GFXPT_ReadU32((const void*)(bkw + 20), &v11f) && v11f != 0)
                        (void)GFXPT_ReadU32((const void*)(v11f + 152), &texObj);
                }
            }
            else if (GFXPT_ReadU32((const char*)ctx + 0x3C, &ovl) && ovl != 0)
            {
                if (GFXPT_ReadU32((const char*)ctx + 0x68, &bkw) && bkw != 0)
                    if (GFXPT_ReadU32((const void*)(bkw + 20), &v11f) && v11f != 0)
                        (void)GFXPT_ReadU32((const void*)(v11f + 152), &texObj);
            }
            else if (GFXPT_ReadU32((const char*)ctx + 0x38, &bkw) && bkw != 0)
            {
                if (GFXPT_ReadU32((const void*)(bkw + 20), &v11f) && v11f != 0)
                    (void)GFXPT_ReadU32((const void*)(v11f + 152), &texObj);
            }
        }
        if (ctx)
        {
            (void)GFXPT_ReadU32((const char*)ctx + 0x448, &clut);
        }
        clut &= 0xFFFFul;                   /* champ WORD (66h-prefixed) du record slot */

        /* v12 â€” 3 champs APPEND (build 0x563F) â€” chaque chaÃ®ne est EA-citÃ©e :
         * 1) window_word : le word fenÃªtre consommÃ© @0x45BC65 (packet TPage
         *    actif Ã  T_draw) â€” W=256-(w&0x1F)*8, H=256-((w>>5)&0x1F)*8 ;
         *    ferme l'arbitrage 128 vs 256 par la DONNÃ‰E.
         * 2) clut_sys_id : la rÃ©fÃ©rence CLUT systÃ¨me active (formule
         *    sub_45B920 @0x45B94A : 0x1B47818 + 2048*(clut>>6) + 32*(clut&0x3F)).
         * 3) ot_z : le z-sort PSX battle â€” ParsePolygons (0x50FDF0, decomp
         *    committÃ©e) insÃ¨re chaque primitive via OT_InsertPrimitive(ot_base +
         *    (zmin>>ot_shift), ...) avec zmin = MIN des z16 des verts projetÃ©s
         *    (stride 8 : {int xy; u16 z; ...} @verts) et zbias = (i0>>12)-8
         *    @0x50fe9c/@0x5100a8. Notre detour n'accÃ¨de pas aux verts projetÃ©s
         *    (consumÃ©s avant le draw D3D) : on capture le RHW float moyen du
         *    record comme proxy depth (dÃ©jÃ  dans le FVF @+12) + le clut>>6
         *    bucket. Le vrai ot_z reste Ã  brancher via la liste OT si dispo â€”
         *    champ 0 sinon (non-fatal). */
        windowWord = 0;
        clutSysId = 0;
        otZ = 0;
        /* window_word : le pack window du texinfo (champ +0x28 du ctx packet
         * Â« tpage-ish Â» de ParsePolygons) â€” le ctx du detour IS le packet ctx
         * (arg_0 du slot) : lecture SEH de *(ctx+0x28) LOWORD. */
        if (ctx != 0)
        {
            unsigned long wraw = 0;
            if (GFXPT_ReadU32((const char*)ctx + 0x28, &wraw))
                windowWord = wraw & 0xFFFFFF;      /* tpage_word mask 0x00FFFFFF @0x50fe20 */
        }
        /* clut_sys_id : dÃ©rive de `clut` (champ WORD @ctx+0x448 dÃ©jÃ  lu) â€”
         * band = clut>>6, idx = clut&0x3F (sub_45B920 layout). */
        clutSysId = clut & 0x7FFF;
    }

    hdr.magic = (geomKind == 2) ? GFXPT_DUMP_MAGIC_ND08 : GFXPT_DUMP_MAGIC;
    hdr.slot = (unsigned long)slot;
    hdr.seq = g_frameSeq;
    hdr.ctx = (unsigned long)ctx;
    hdr.nodeAddr = (unsigned long)node;
    hdr.geomKind = geomKind;
    hdr.fails = 0;
    hdr.payloadSize = (unsigned long)GFXPT_NODE_BYTES + payload;
    hdr.build = GFXPT_BUILD_ID;             /* v8 : 9e u32 (offset 0x20), Â« dÃ©ployÃ© â‰  cru Â» */

    p = &g_dumpRing[g_dumpWrite];
    memcpy(p, &hdr, sizeof(hdr));
    memcpy(p + sizeof(hdr), nodeCopy, (size_t)GFXPT_NODE_BYTES);
    p += sizeof(hdr) + GFXPT_NODE_BYTES;
    fails = 0;
    if (geomKind == 2)
    {
        memcpy(p, &vcount, 4ul);
        memcpy(p + 4ul, &icount, 4ul);
        p += 8ul;
        if (idxBytes)
        {
            if (GFXPT_CopyBytes(p, idx, idxBytes))
            {
                if (idxPad)
                    memset(p + idxBytes, 0, (size_t)idxPad);
            }
            else
            {
                memset(p, 0, (size_t)(idxBytes + idxPad));
                fails++;
            }
        }
        else if (idxPad)
        {
            memset(p, 0, (size_t)idxPad);
        }
        p += idxBytes + idxPad;
        if (vcount)
        {
            if (!GFXPT_CopyBytes(p, verts, vcount * 32ul))
            {
                memset(p, 0, (size_t)(vcount * 32ul));
                fails++;
            }
        }
        p += vcount * 32ul;
        if (fails)
        {
            ((GFXPT_DumpHdr*)(void*)&g_dumpRing[g_dumpWrite])->fails = fails;
            g_dumpSehFails += fails;
            g_frameFails += fails;
        }
        /* v10 â€” footer ND08 APPEND : tpage|mode|clut|id_count|ids[+pad]|
         * dropped_ids|texobj. Slots directs : id_count=0 â†’ ids absents
         * (pad 0), footer 24 o (dropped_ids=0, texobj=0 si chaÃ®ne
         * illisible). {51,60} : idsStage dÃ©jÃ  copiÃ©. */
        memcpy(p, &tpage, 4ul);
        memcpy(p + 4ul, &tmode, 4ul);
        memcpy(p + 8ul, &clut, 4ul);
        memcpy(p + 12ul, &idCount, 4ul);
        p += 16ul;
        if (idCount)
            memcpy(p, idsStage, (size_t)idCount);
        if (idsPad)
            memset(p + idCount, 0, (size_t)idsPad);
        p += idCount + idsPad;
        memcpy(p, &droppedIds, 4ul);
        p += 4ul;
        /* v10 â€” texobj APPEND aprÃ¨s dropped_ids (6e u32 always-present du
         * footer ; le dÃ©codeur distingue v9/v10 par le BUILD id). */
        memcpy(p, &texObj, 4ul);
        p += 4ul;
        /* v12 â€” APPEND : window_word | clut_sys_id | ot_z (3 x u32
         * always-present, 0 si fail/non-fatal â€” le dÃ©codeur distingue par le
         * BUILD id 0x563F). */
        memcpy(p, &windowWord, 4ul);
        memcpy(p + 4ul, &clutSysId, 4ul);
        memcpy(p + 8ul, &otZ, 4ul);
        p += 12ul;
        /* v14 (lot 22) â€” APPEND footer Ã©tat : state_epoch = snapshot AVANT
         * le forward natif du draw (l'Ã©tat device appliquÃ© Ã  T_draw â€” les
         * commits internes du forward (setups â†’ sub_441581) NE sont PAS
         * inclus, conformÃ©ment Ã  la sÃ©mantique "Ã©tat Ã  l'entrÃ©e du draw").
         * v15 (lot 24) â€” flagsOut : bit0 has_epoch ; bit1 STAGE0_VALID =
         * hooks stage0 armÃ©s ET â‰¥1 kind9 vu (triple footer fiable â€” cache
         * writer mis Ã  jour par le logger result UNIQUEMENT) ; bit2
         * INCOMPLETE = trou d'epoch OU toute perte ST09 persistante
         * (cap/overflow inclus â€” plus aucune perte muette) ; bit3 ST_LOSS =
         * â‰¥1 refus d'Ã©mission ST09 sur CETTE frame (st_lost). */
        memcpy(p, &preStateEpoch, 4ul);
        {
            unsigned long flagsOut = GFXPT_ST_FLAG_HAS_EPOCH
                                   | (g_stStreamBroken ? GFXPT_ST_FLAG_INCOMPLETE : 0ul)
                                   | (g_frameStLost ? GFXPT_ST_FLAG_ST_LOSS : 0ul)
                                   | ((g_stage0Armed && g_stage0Seen)
                                      ? GFXPT_ST_FLAG_STAGE0_VALID : 0ul);
            memcpy(p + 4ul, &flagsOut, 4ul);
        }
        p += 8ul;
        /* v15 (lot 24) â€” APPEND 6 x u32 always-present (footer 68 o) :
         * triple stage0 = cache writer g_stage0_* (dernier kind9 vu avant
         * le draw â€” 0 si aucun) + compteurs ST09 de la frame. */
        memcpy(p, &g_stage0_tex, 4ul);
        memcpy(p + 4ul, &g_stage0_dev, 4ul);
        memcpy(p + 8ul, &g_stage0_devvt, 4ul);
        memcpy(p + 12ul, &g_stage0_hr, 4ul);
        memcpy(p + 16ul, &g_frameStRecs, 4ul);
        memcpy(p + 20ul, &g_frameStLost, 4ul);
        p += 24ul;
        if (idsFailed)
        {
            ((GFXPT_DumpHdr*)(void*)&g_dumpRing[g_dumpWrite])->fails += 1;
            g_dumpSehFails++;
            g_frameFails++;
        }
    }
    g_dumpWrite += need;
    g_dumpRecords++;
    g_dumpBytes += need;
    g_frameRecords++;
}

/* ---------------------------------------------------------------------------
 * Pulse present dispatch : seq++, flush ring â†’ disque, reset compteurs frame,
 * contrÃ´le sidecar d'armement. SEUL point d'IO disque du dump v7.
 * ------------------------------------------------------------------------- */
static void GFXPT_DumpFlushAtPresent(void)
{
    char         binPath[MAX_PATH];
    char         logPath[MAX_PATH];
    FILE*        f;
    FILE*        l;
    unsigned long pending;
    unsigned long drainedSeq;

    pending = g_dumpWrite - g_dumpCommit;
    if (pending == 0)
    {
        if (g_capEndSeq != 0 && g_frameSeq - 1 == g_capEndSeq)
            GFXPT_Stage0Diag("capture_end", "last_frame_empty", -1, 3ul);
        return;
    }
    drainedSeq = g_frameSeq - 1;            /* seq des records flushÃ©s */
    if (!GFXPT_BuildSidePath("gfx_passthrough_dump.bin", binPath))
        return;                             /* ring conservÃ© (drops visibles) */
    f = fopen(binPath, "ab");   /* mode BINAIRE : fopen "a" (texte) Ã©tend chaque 0x0A
                                   des donnÃ©es en 0D 0A sur disque (+2 o par record
                                   contenant un LF â€” bug de la campagne 25/09, lot 13) */
    if (!f)
        return;                             /* jamais bloquÃ© : rÃ©essai au prochain present */
    fwrite(&g_dumpRing[g_dumpCommit], 1, (size_t)pending, f);
    fclose(f);
    if (GFXPT_BuildSidePath("gfx_passthrough_dump.log", logPath))
    {
        l = fopen(logPath, "a");
        if (l)
        {
            fprintf(l, "frame,seq=%lu,records=%lu,fails=%lu,drops=%lu,guards=%lu,overflow=%d,bytes=%lu,tx=%lu,tr=%lu,st=%lu\n",
                    drainedSeq, g_frameRecords, g_frameFails, g_frameDrops,
                    g_frameGuardSkips, g_frameOverflow, pending, g_frameTxRecs,
                    g_frameTrRecs, g_frameStRecs);
            fclose(l);
        }
    }
    g_dumpCommit = 0;                       /* ring vidÃ© (jamais de wrap) */
    g_dumpWrite = 0;
    if (g_capEndSeq != 0 && drainedSeq == g_capEndSeq)
        GFXPT_Stage0Diag("capture_end", "last_frame_drained", -1, 3ul);
}

static void GFXPT_DumpArmAtPresent(void)
{
    char path[MAX_PATH];
    char buf[96];

    if (!GFXPT_BuildSidePath("gfx_passthrough.dump", path))
        return;
    if (GetFileAttributesA(path) == INVALID_FILE_ATTRIBUTES)
        return;
    GFXPT_Stage0Diag("capture_arm", "dump_sidecar", -1, 3ul); /* AVANT armement */
    g_capEndSeq = g_frameSeq + (GFXPT_DUMP_FRAMES - 1);   /* seq courant..+15 */
    g_txRingWarned = 0;         /* v8 : 1 ODS Â« ring plein TX Â» par fenÃªtre max */
    g_txSysWarned = 0;          /* v9 : 1 ODS Â« sys CLUT row illisible Â» par fenÃªtre max */
    g_trRingWarned = 0;         /* v10 : 1 ODS Â« ring plein TR08 Â» par fenÃªtre max */
    DeleteFileA(path);
    sprintf(buf, "gfx_passthrough %s: dump arme frames %lu..%lu (+TX07 miroir VRAM, 1/frame)\n",
            GFXPT_VERSION_TEXT, g_frameSeq, g_capEndSeq);
    GFXPT_ODS(buf);
}

static void GFXPT_DumpFramePulse(void)
{
    g_frameSeq++;
    GFXPT_DumpFlushAtPresent();
    g_frameRecords = 0;
    g_frameFails = 0;
    g_frameDrops = 0;
    g_frameGuardSkips = 0;
    g_frameOverflow = 0;
    /* v8 â€” reset TX intra-frame : flag d'Ã©mission TX07 (dÃ©dup par pulse) +
     * compteurs log `tx=N`. */
    g_frameTxRecs = 0;
    g_frameTxEmitted = 0;
    g_frameTxDrops = 0;
    /* v10 â€” reset TR08 intra-frame : dÃ©dup texobj (table per-frame) +
     * compteurs log `tr=N`. */
    g_frameTrRecs = 0;
    g_frameTrDrops = 0;
    g_resCount = 0;
    g_frameStRecs = 0;                      /* v14 (lot 22) : reset ST09 intra-frame */
    g_frameStLost = 0;                      /* v15 (lot 24) : reset refus ST09 intra-frame */
    GFXPT_DumpArmAtPresent();
}

/* ===========================================================================
 * Wrappers de slots â€” pattern unique :
 *     fnptr natif ; ret = p ? p(args...) : 0 ; log(slot, args..., ret).
 * Le forward reprend EXACTEMENT la pile d'args reÃ§ue du wrapper engine
 * (ordres dÃ©rivÃ©s du disasm : push droiteâ†’gauche, cleanup add esp,N).
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

/* arity 3 (sÃ©mantique typÃ©e SetRenderState) */
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

/* arity 5 : f(x, y, w, h, engine) â€” slot 7 */
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

/* arity 5 : f(a0..a4) â€” slot 25 */
#define GFXPT_WRAP5(NAME, SLOT, PFN)                                          \
static int __cdecl NAME(void* a0, void* a1, void* a2, void* a3, void* a4)     \
{                                                                             \
    PFN p = (PFN)GFXPT_Native((unsigned)(SLOT));                              \
    int r = p ? p(a0, a1, a2, a3, a4) : 0;                                    \
    GFXPT_LogCall((unsigned)(SLOT), a0, a1, a2, a3, r);                       \
    return r;                                                                 \
}

/* arity 6 : f(a0..a5) â€” slot 26 */
#define GFXPT_WRAP6(NAME, SLOT, PFN)                                          \
static int __cdecl NAME(void* a0, void* a1, void* a2, void* a3,               \
                        void* a4, void* a5)                                   \
{                                                                             \
    PFN p = (PFN)GFXPT_Native((unsigned)(SLOT));                              \
    int r = p ? p(a0, a1, a2, a3, a4, a5) : 0;                                \
    GFXPT_LogCall((unsigned)(SLOT), a0, a1, a2, a3, r);                       \
    return r;                                                                 \
}

/* draw-list (slots 43â€“64) : log + capture + forward (+ dump v7 si armÃ©).
 * v15 (lot 24) : le retour natif brut r est transmis Ã  GFXPT_DumpNode
 * (6e arg â€” kind6 aux Â« commit_result_observed Â», jamais interprÃ©tÃ©). */
#define GFXPT_WRAP_LIST(NAME, SLOT)                                           \
static int __cdecl NAME(void* ctx, void* node, void* arg)                     \
{                                                                             \
    GFXPT_PFN_ListFn p = (GFXPT_PFN_ListFn)GFXPT_Native((unsigned)(SLOT));    \
    unsigned long preStateEpoch = g_stateEpoch; /* v14 : epoch AVANT forward */\
    int r = p ? p(ctx, node, arg) : 0;                                        \
    GFXPT_LogCall((unsigned)(SLOT), ctx, node, arg, 0, r);                    \
    GFXPT_CaptureCall((unsigned)(SLOT), ctx, node, arg);                      \
    GFXPT_DumpNode((unsigned)(SLOT), ctx, node, preStateEpoch, arg,           \
                   (unsigned long)r);                                         \
    return r;                                                                 \
}

/* --- slots 0â€“8 ----------------------------------------------------------- */
/* slot 0 Init â€” wrapper engine : call [eax] @0x409572 (dans 0x40942E), add esp,4
 * v14 (lot 22) â€” invalidation (kind=5) : l'Ã©tat device n'est plus traÃ§able
 * aprÃ¨s init (le reader vide son ledger sur l'event). */
static int __cdecl Proxy_Init(void* a0)
{
    GFXPT_PFN_Init p = (GFXPT_PFN_Init)GFXPT_Native(0u);
    int r = p ? p(a0) : 0;
    GFXPT_StEmit(GFXPT_ST_KIND_INVALIDATE, 0, 0, 0);
    GFXPT_LogCall(0u, a0, 0, 0, 0, r);
    return r;
}
/* slot 2 DirectX_7 â€” wrapper engine fn 0x41DEB0 : call [edx+8] @0x41DED4, add esp,4 */
GFXPT_WRAP1(Proxy_Slot2, 2, GFXPT_PFN_Slot2)
/* slot 3 DirectX_8 â€” chunk jumeau 0x41DEDE : call [edx+0xC] @0x41DF02, add esp,4 */
GFXPT_WRAP1(Proxy_Slot3, 3, GFXPT_PFN_Slot3)
/* slot 4 Present â€” Render_FramePresent_Dispatch 0x41DF0C : call [eax+0x10] @0x41DF32, add esp,4 */
GFXPT_WRAP1(Proxy_Present, 4, GFXPT_PFN_Present)
/* slot 5 prep buffer â€” isGetDrawBuf2 0x41DFBA : call [edx+0x14] @0x41DFE0, add esp,0x10 */
GFXPT_WRAP4(Proxy_Slot5, 5, GFXPT_PFN_Slot5)
/* slot 6 support frame â€” sub_41DF96 : call [edx+0x18] @0x41DFB0, add esp,4 */
GFXPT_WRAP1(Proxy_Slot6, 6, GFXPT_PFN_Slot6)
/* slot 7 viewport â€” gfx_driver_set_viewport_sub_41E070 : call [eax+0x1C] @0x41E106, add esp,0x14 */
GFXPT_WRAP5V(Proxy_SetViewport, 7, GFXPT_PFN_SetViewport)
/* slot 8 clear-color â€” isGetDrawBuf 0x41E168 : call [ecx+0x20] @0x41E1A5, add esp,8 */
GFXPT_WRAP2(Proxy_ClearColor, 8, GFXPT_PFN_ClearColor)

/* --- slots 18â€“24 --------------------------------------------------------- */
/* slot 18 â€” Thunk_BufApp_Off72 0x41E620 : call [edx+0x48] @0x41E646, add esp,0x10 */
GFXPT_WRAP4(Proxy_Slot18, 18, GFXPT_PFN_Slot18)
/* slot 19 â€” fn 0x419E89 @0x419EA5 : call [edx+0x4C] @0x419ED8, add esp,4 */
GFXPT_WRAP1(Proxy_Slot19, 19, GFXPT_PFN_Slot19)
/* slot 20 â€” PAS de wrapper engine au spec Â§5 (signature non dÃ©rivable) :
 * no-op log + return 0 ; GL natif 0x4381F8 reste hors d'atteinte (risque README). */
static int __cdecl Proxy_Slot20(void* a0)
{
    GFXPT_LogCall(20u, a0, 0, 0, 0, 0);
    return 0;
}
/* slot 21 Alt-only â€” wrapper 0x41B06B (site 0x41B15D) partiellement analysÃ© :
 * call indirect non rÃ©solu â†’ no-op log + return 0 (inatteignable sous proxy GL). */
static int __cdecl Proxy_Slot21(void* a0)
{
    GFXPT_LogCall(21u, a0, 0, 0, 0, 0);
    return 0;
}
/* slot 22 Alt-only (Release/eviction famille) â€” fn 0x419F38 : call [ecx+0x58] @0x419F57, add esp,8 */
GFXPT_WRAP2(Proxy_Slot22, 22, GFXPT_PFN_AltOnly2)
/* slot 23 Alt-only â€” fn 0x419F80 : call [ecx+0x5C] @0x419F9F, add esp,8 */
GFXPT_WRAP2(Proxy_Slot23, 23, GFXPT_PFN_AltOnly2)
/* slot 24 Alt-only â€” fn 0x417D84 @0x417E1A : call [ecx+0x60] @0x417E39, add esp,8 */
GFXPT_WRAP2(Proxy_Slot24, 24, GFXPT_PFN_AltOnly2)

/* --- slots 25â€“33 --------------------------------------------------------- */
/* slot 25 â€” fn 0x41EA06 @0x41EA18 : call [ecx+0x64] @0x41EA61, add esp,0x14
 *          (2e site fn 0x407EB4 : call [eax+0x64] @0x40828A, add esp,0x14) */
GFXPT_WRAP5(Proxy_Slot25, 25, GFXPT_PFN_Slot25)
/* slot 26 â€” fn 0x41E9C4 @0x41E9D6 : call [ecx+0x68] @0x41E9FC, add esp,0x18 */
GFXPT_WRAP6(Proxy_Slot26, 26, GFXPT_PFN_Slot26)
/* slot 27 â€” fn 0x4187F7 @0x4187FF : call [eax+0x6C] @0x418815, add esp,8 */
GFXPT_WRAP2(Proxy_Slot27, 27, GFXPT_PFN_Slot27)
/* slot 28 â€” fn 0x41EA71 @0x41EA83 : call [eax+0x70] @0x41EA99, add esp,8 */
GFXPT_WRAP2(Proxy_Slot28, 28, GFXPT_PFN_Slot28)
/* slot 29 SetRenderState â€” Gfx_SetRenderState 0x41E650 : call [ecx+0x74] @0x41E67E, add esp,0xC
 * v14 (lot 22) â€” transition RS raw (kind=1, ST09) : type 0..25 (bornÃ© par le
 * wrapper engine 0x41E650 jl/jge signÃ©) + value raw. Le backend Alt
 * 0x440FF0 applique au device immÃ©diatement (applied-at-call). */
static int __cdecl Proxy_SetRenderState(int a0, unsigned int a1, void* a2)
{
    GFXPT_PFN_SetRenderState p = (GFXPT_PFN_SetRenderState)GFXPT_Native(29u);
    int r = p ? p(a0, a1, a2) : 0;
    GFXPT_StEmit(GFXPT_ST_KIND_RS_SET, (unsigned long)a0, a1, 0);
    GFXPT_LogCall(29u, (const void*)(unsigned long)a0,
                  (const void*)(unsigned long)a1, a2, 0, r);
    return r;
}
/* slot 30 CommitRenderState â€” fn 0x41E77D @0x41E785 : call [eax+0x78] @0x41E79B, add esp,8
 * v14 â€” commit descripteur (kind=2) : backend = sub_41F99A(matdesc, cookie)
 * (ctor +0x78) â€” re-apply texture+RS alpha, PAS un flush de table RS. */
static int __cdecl Proxy_Slot30(void* a0, void* a1)
{
    GFXPT_PFN_CommitRenderState p = (GFXPT_PFN_CommitRenderState)GFXPT_Native(30u);
    int r = p ? p(a0, a1) : 0;
    /* v15 (lot 24) : aux = retour natif brut du forward (witness candidat,
     * jamais interprÃ©tÃ© HRESULT) ; ctx_token = a1 (engine â€” seul pointeur
     * de contexte dispo au proxy, signature .h slot 30) brut opaque ;
     * device_token = 0 (gate cookie non observable au wrapper). */
    GFXPT_StEmitCtx(GFXPT_ST_KIND_COMMIT, 30, (unsigned long)a0,
                    (unsigned long)r, (unsigned long)a1, 0ul);
    GFXPT_LogCall(30u, a0, a1, 0, 0, r);
    return r;
}
/* slot 31 â€” sites @0x41E69F/0x41E6D3/0x41E707 : calls @0x41E6C1/@0x41E6F5/@0x41E71D, add esp,8
 * v14 â€” commit descripteur (kind=2) : backend sub_441560 (gate
 * *(cookie+0xAC4) â†’ sub_41F99A). 2 rel-callers backend-internal
 * (sub_43CB55/sub_43D900). */
static int __cdecl Proxy_Slot31(void* a0, void* a1)
{
    GFXPT_PFN_Slot31 p = (GFXPT_PFN_Slot31)GFXPT_Native(31u);
    int r = p ? p(a0, a1) : 0;
    /* v15 (lot 24) : aux = retour natif brut ; ctx_token = a1 brut opaque
     * (cf. Proxy_Slot30) ; device_token = 0. */
    GFXPT_StEmitCtx(GFXPT_ST_KIND_COMMIT, 31, (unsigned long)a0,
                    (unsigned long)r, (unsigned long)a1, 0ul);
    GFXPT_LogCall(31u, a0, a1, 0, 0, r);
    return r;
}
/* slot 32 â€” fn 0x41E727 @0x41E72F : call [eax+0x80] @0x41E745, add esp,8
 * v14 â€” commit descripteur (kind=2) : backend sub_441581 (gate
 * *(cookie+0xAC4) + device-lost check â†’ sub_41F99A). */
static int __cdecl Proxy_Slot32(void* a0, void* a1)
{
    GFXPT_PFN_Slot32 p = (GFXPT_PFN_Slot32)GFXPT_Native(32u);
    int r = p ? p(a0, a1) : 0;
    /* v15 (lot 24) : aux = retour natif brut ; ctx_token = a1 brut opaque
     * (cf. Proxy_Slot30) ; device_token = 0. */
    GFXPT_StEmitCtx(GFXPT_ST_KIND_COMMIT, 32, (unsigned long)a0,
                    (unsigned long)r, (unsigned long)a1, 0ul);
    GFXPT_LogCall(32u, a0, a1, 0, 0, r);
    return r;
}
/* slot 33 SetBlendMode â€” GfxDriver_SetBlendMode 0x41E752 : call [eax+0x84] @0x41E770, add esp,8
 * v14 â€” blend mode raw (kind=3) : value = (unsigned long)a0 (0..4 forwardÃ©
 * tel quel, ABI-fidÃ¨le). Backend sub_44162E : mode<5 â†’ commit du matdesc
 * *(cookie+0x900+4*mode). AUCUNE conversion STP. */
static int __cdecl Proxy_SetBlendMode(void* a0, void* a1)
{
    GFXPT_PFN_SetBlendMode p = (GFXPT_PFN_SetBlendMode)GFXPT_Native(33u);
    int r = p ? p(a0, a1) : 0;
    GFXPT_StEmit(GFXPT_ST_KIND_BLEND, 33, (unsigned long)a0, 0);
    GFXPT_LogCall(33u, a0, a1, 0, 0, r);
    return r;
}

/* --- slots 35â€“41 --------------------------------------------------------- */
/* slot 35 swap buffers â€” fn 0x41E7D8 @0x41E7E0 : call [eax+0x8C] @0x41E7F6, add esp,8 */
GFXPT_WRAP2(Proxy_Slot35, 35, GFXPT_PFN_Slot35)
/* slots 36 (overrideâ†’35), 34 (hook gardÃ©), 37 (libre) : laissÃ©s Ã  0 (miroir natif). */
/* slot 38 â€” fn @0x41E924 : call [eax+0x98] @0x41E93A, add esp,8 */
GFXPT_WRAP2(Proxy_Slot38, 38, GFXPT_PFN_Slot38)
/* slot 39 SelectRenderTarget â€” GfxDriver_SelectRenderTarget 0x41E947 : call [eax+0x9C] @0x41E965, add esp,8
 * v14 â€” token target (kind=4) : value = (unsigned long)a0, traitÃ© comme
 * identifiant opaque de la capture (JAMAIS une EA statique). */
static int __cdecl Proxy_SelectRenderTarget(void* a0, void* a1)
{
    GFXPT_PFN_SelectRenderTarget p = (GFXPT_PFN_SelectRenderTarget)GFXPT_Native(39u);
    int r = p ? p(a0, a1) : 0;
    GFXPT_StEmit(GFXPT_ST_KIND_TARGET, 39, (unsigned long)a0, 0);
    GFXPT_LogCall(39u, a0, a1, 0, 0, r);
    return r;
}
/* slot 40 BeginScene â€” GfxDriver_BeginScene 0x41E972 : call [eax+0xA0] @0x41E990, add esp,8
 * v14 â€” marqueur scene (kind=7, NON invalidant : l'Ã©tat D3D persiste). */
static int __cdecl Proxy_BeginScene(void* a0, void* a1)
{
    GFXPT_PFN_BeginScene p = (GFXPT_PFN_BeginScene)GFXPT_Native(40u);
    int r = p ? p(a0, a1) : 0;
    GFXPT_StEmit(GFXPT_ST_KIND_SCENE, 40, 0, 0);
    GFXPT_LogCall(40u, a0, a1, 0, 0, r);
    return r;
}
/* slot 41 LeaveScene â€” GfxDriver_LeaveScene 0x41E99D : call [edx+0xA4] @0x41E9B7, add esp,4
 * v14 â€” marqueur scene (kind=7, NON invalidant). */
static int __cdecl Proxy_LeaveScene(void* a0)
{
    GFXPT_PFN_LeaveScene p = (GFXPT_PFN_LeaveScene)GFXPT_Native(41u);
    int r = p ? p(a0) : 0;
    GFXPT_StEmit(GFXPT_ST_KIND_SCENE, 41, 0, 0);
    GFXPT_LogCall(41u, a0, 0, 0, 0, r);
    return r;
}

/* --- slots 43â€“64 draw-list (spec Â§6) ------------------------------------- */
GFXPT_WRAP_LIST(Proxy_List43, 43)  /* types 0,8  setup (bind 0x416358) */
GFXPT_WRAP_LIST(Proxy_List44, 44)  /* types 2,10 setup (bind 0x416381) */
GFXPT_WRAP_LIST(Proxy_List45, 45)  /* pas de case de bind connue â€” capture passive */
GFXPT_WRAP_LIST(Proxy_List46, 46)  /* types 4,6,12,14,17 : Ã©criture d'Ã©tat [ecx+0xB8], pas fnptr â€” capture passive */
GFXPT_WRAP_LIST(Proxy_List47, 47)  /* pas de case de bind connue â€” capture passive */
GFXPT_WRAP_LIST(Proxy_List48, 48)  /* types 0,8 walk (bind 0x416306) */
GFXPT_WRAP_LIST(Proxy_List49, 49)  /* types 2,10 walk (bind 0x41632F) */
GFXPT_WRAP_LIST(Proxy_List50, 50)  /* pas de case de bind connue â€” capture passive */
GFXPT_WRAP_LIST(Proxy_List51, 51)  /* pas de case de bind connue â€” capture passive */
GFXPT_WRAP_LIST(Proxy_List52, 52)  /* types 1,9 setup (bind 0x4164FF) */
GFXPT_WRAP_LIST(Proxy_List53, 53)  /* types 3,11 setup (bind 0x416528) */
GFXPT_WRAP_LIST(Proxy_List54, 54)  /* pas de case de bind connue â€” capture passive */
GFXPT_WRAP_LIST(Proxy_List55, 55)  /* types 5,7,13,15 setup seul (bloc 0x416551) */
GFXPT_WRAP_LIST(Proxy_List56, 56)  /* pas de case de bind connue â€” capture passive */
GFXPT_WRAP_LIST(Proxy_List57, 57)  /* types 1,9 walk (bind 0x4164AD) */
GFXPT_WRAP_LIST(Proxy_List58, 58)  /* types 3,11 walk (bind 0x4164D6) */
GFXPT_WRAP_LIST(Proxy_List59, 59)  /* pas de case de bind connue â€” capture passive */
GFXPT_WRAP_LIST(Proxy_List60, 60)  /* pas de case de bind connue â€” capture passive */
GFXPT_WRAP_LIST(Proxy_List61, 61)  /* type 18 setup (bind 0x416651) */
GFXPT_WRAP_LIST(Proxy_List62, 62)  /* type 19 setup (bind 0x416677) */
GFXPT_WRAP_LIST(Proxy_List63, 63)  /* type 18 walk (bind 0x416651) */
GFXPT_WRAP_LIST(Proxy_List64, 64)  /* type 19 walk (bind 0x416677) */

/* --- slot 65 ------------------------------------------------------------- */
/* slot 65 Alt-only, consumer engine-level â€” fn 0x4097A0 @0x4097A8 : call [eax+0x104] @0x4097C6, add esp,4 */
GFXPT_WRAP1(Proxy_Slot65, 65, GFXPT_PFN_Slot65)

/* slot 1 Uninit/shutdown â€” wrapper engine fn 0x409670 : call [edx+4] @0x4096F2, add esp,4.
 * Le forward natif prÃ©cÃ¨de la fermeture du CSV ; la fn FreeLibrary @0x40971A suit. */
static int __cdecl Proxy_UninitAndCloseLog(void* engine)
{
    GFXPT_PFN_Uninit p;
    int r;
    /* The engine calls FreeLibrary after slot 1. Restore before either the
     * native forward or the already-uninitialized early return. */
    GFXPT_Stage0BeforeUnload();
    if (!g_nativeAlive)                 /* dÃ©jÃ  uninit (re-boot engine) */
    {
        GFXPT_LogCall(1u, engine, 0, 0, 0, 0);
        return 0;
    }
    p = (GFXPT_PFN_Uninit)GFXPT_Native(1u);
    r = p ? p(engine) : 0;
    /* v14 (lot 22) â€” invalidation (kind=5) avant la fermeture du CSV. */
    GFXPT_StEmit(GFXPT_ST_KIND_INVALIDATE, 1, 0, 0);
    GFXPT_LogCall(1u, engine, 0, 0, 0, r);
    if (g_logFile)
    {
        fflush(g_logFile);
        fclose(g_logFile);
        g_logFile = 0;                  /* rÃ©-ouverture lazy Ã  la prochaine session */
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

    /* slots 0â€“8 */
    slots[0]  = (void*)Proxy_Init;            /* Init (log + forward) */
    slots[1]  = (void*)Proxy_UninitAndCloseLog;
    slots[2]  = (void*)Proxy_Slot2;
    slots[3]  = (void*)Proxy_Slot3;
    slots[4]  = (void*)Proxy_Present;         /* present natif prÃ©servÃ© (Mode A) */
    slots[5]  = (void*)Proxy_Slot5;
    slots[6]  = (void*)Proxy_Slot6;
    slots[7]  = (void*)Proxy_SetViewport;
    slots[8]  = (void*)Proxy_ClearColor;

    /* slots 9â€“14 (+0x24..+0x38) : Ã©tat inline, initialisÃ©s Ã  0 (VirtualAlloc
     * zero-fill). L'engine les Ã©crit directement via isGetDrawBuf (0x41E168
     * copie le vec4 clear-color vers driver+0x28..+0x34). */

    /* slots 15 (+0x3C) inerte, 34 (+0x88), 36 (+0x90), 37 (+0x94) : 0 (miroir natif). */

    /* slots 16/17 : fnptrs natifs partagÃ©s, copie telle quelle (pas de wrapper). */
    slots[16] = nat[16];
    slots[17] = nat[17];

    /* slots 18â€“33 */
    slots[18] = (void*)Proxy_Slot18;
    slots[19] = (void*)Proxy_Slot19;
    /* slot 20 : v6.1 â€” copie du fnptr natif DDrawAlt (sub_420917). Le no-op
     * ret 0 tuait le jeu en live (run 25/09 : mort immÃ©diate aprÃ¨s 2 appels
     * slot 20, derniÃ¨re trace CSV). Transparence totale = pas de log ce slot. */
    if (nat[20])
        slots[20] = nat[20];
    else
        slots[20] = (void*)Proxy_Slot20;      /* dÃ©gradÃ© : natif absent (ne doit pas arriver) */
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

    /* slots 35, 38â€“41 */
    slots[35] = (void*)Proxy_Slot35;
    slots[38] = (void*)Proxy_Slot38;
    slots[39] = (void*)Proxy_SelectRenderTarget;
    slots[40] = (void*)Proxy_BeginScene;
    slots[41] = (void*)Proxy_LeaveScene;

    /* slot 42 : pas de wrapper engine au spec (hors 18â€“41, hors liste =0) â€”
     * copie transparente du fnptr natif 0x439000, comportement prÃ©servÃ©. */
    slots[42] = nat[42];

    /* slots 43â€“64 : draw-list setup/walk (log + capture + forward) */
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

    /* slot 65 : wrapper Alt-only (slot natif GL = NULL â†’ return 0 ; jamais NULL fnptr). */
    slots[65] = (void*)Proxy_Slot65;
}

/* ===========================================================================
 * Replay (Mode A)
 * =========================================================================== */
int __cdecl Passthrough_ReplayCaptured(void)
{
#if 0 /* v19 diagnostic has no proxy/native-object ownership or replay. */
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
                    continue;               /* node Ã©vincÃ© du ring */
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
#endif
    return 0;
}

void __cdecl Passthrough_SetReplayLive(int enable)
{
    (void)enable;
    g_replayLive = 0;
}

unsigned long __cdecl Passthrough_CaptureCount(void)
{
    return g_capWrite;
}

/* ===========================================================================
 * Factory type-2 â€” proto imposÃ© par le boot natif :
 *   driver = *(engine+0xA74) = factory(engine)   (call [ebp-8] @0x40951D, cdecl, 1 arg)
 *   slot 0 = call [driver]  @0x409572   (Init immÃ©diat)
 * =========================================================================== */
void* __cdecl new_dll_graphics_driver(void* engine)
{
#if 0 /* retained as historical implementation, unreachable in diagnostic */
    GFXPT_PFN_BackendCtor ctor;
    void* native;
    void* mem;
    char buf[128];

    if (!engine)
        return 0;

    if (g_proxy && g_nativeAlive)
        return g_proxy;                     /* rÃ©-entrÃ©e : proxy dÃ©jÃ  en place */

    if (!g_hostModule)
        g_hostModule = GetModuleHandleA(NULL);   /* base EXE (0x400000 attendu) */
    if (!g_hostModule)
        return 0;

    GFXPT_LogOpen();                    /* CSV crÃ©Ã© dÃ¨s l'entrÃ©e factory (trace mÃªme si ctor KO) */

    {
        /* Backend natif du proxy : le case vanilla de cette build est DDrawAlt
           (engine+0xBA8=0 â†’ case 0, ctor 0x4257D0). Le ctor OpenGL 0x4252B0
           (case 3) Ã©choue en live sur le port DotEmu (crash 2026-09-23 18:05 :
           present 0x41DF32, AV sur driver nul â€” journal WER). FF8_PASSTHROUGH_NATIVE=gl
           pour l'ancien comportement. */
        char nativeSel[8];
        unsigned long ctorEA = GFXPT_EA_CTOR_DDRAWALT;
        if (GetEnvironmentVariableA("FF8_PASSTHROUGH_NATIVE", nativeSel,
                                    (DWORD)sizeof(nativeSel)) > 0
            && nativeSel[0] == 'g')
            ctorEA = GFXPT_EA_CTOR_OPENGL;
        ctor = (GFXPT_PFN_BackendCtor)GFXPT_HostEA(ctorEA);
        native = ctor(engine);
    }
    if (!native)
    {
        GFXPT_ODS("gfx_passthrough: ctor backend natif a echoue\n");
        if (g_logFile)
        {
            fprintf(g_logFile, "#factory,ctor_failed\n");
            fflush(g_logFile);
        }
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
        g_proxy = mem;                      /* zero-fill : slots 9â€“15/34/36/37 = 0 */
    }

    GFXPT_FillProxy();
    GFXPT_LogOpen();

    sprintf(buf, "gfx_passthrough: native=0x%p proxy=0x%p engine=0x%p\n",
            g_native, g_proxy, engine);
    GFXPT_ODS(buf);
    return g_proxy;
#endif
    if (!engine) return 0;
    if (!g_hostModule) g_hostModule = GetModuleHandleA(NULL);
    if (!g_hostModule) return 0;
    return ((GFXPT_PFN_BackendCtor)GFXPT_HostEA(GFXPT_EA_CTOR_DDRAWALT))(engine);
}

/* ===========================================================================
 * Boot hook v2 â€” armement du chemin type 2 au premier CheckRegistry.
 *
 * Faits (2026-09-23) :
 *  - Le loader DotEmu charge AF3DN.P (= cette DLL) avant le boot graphics
 *    mais n'appelle AUCUN export : le chemin type 2 natif exige que
 *    engine+0xBA8 (current_gfx_driver) = 2 et engine+0xBD0
 *    (create_gfx_driver) = factory soient armÃ©s avant 0x40942E
 *    (mÃ©canisme FFNx : ffnx-driver-reference.md Â§1.2, provenance lot +6).
 *  - Point d'ancrage : CheckRegistry 0x401890, __cdecl(engine), appelÃ©
 *    juste avant Gfx_InitializeSelectedBackend (call @0x401905) ; le decomp
 *    0x401890 prouve qu'il ne touche jamais +0xBA8/+0xBD0 (registry son,
 *    mutex, dispatch uniquement) â†’ Ã©criture pre-call sans course.
 *  - Preimage 5 bytes sur 064d466bâ€¦ : 83 EC 38 56 57
 *    (sub esp,38h / push esi / push edi â€” dÃ©plaÃ§ables, pas de RIP-relative).
 *  - DÃ©tour posÃ© dans DllMain (pattern FFNx replace_function au
 *    DLL_PROCESS_ATTACH : VirtualProtect + memcpy uniquement).
 *  - Preimage divergente â†’ refus, AUCUNE Ã©criture (build non cible).
 * =========================================================================== */

static const BYTE GFXPT_BootPreimage[5] = { 0x83u, 0xECu, 0x38u, 0x56u, 0x57u };
static void* volatile g_bootTrampoline;   /* preimage + jmp retour (16 bytes) */
static volatile LONG g_bootArmed;         /* champs Ã©crits ? (idempotent) */
static volatile LONG g_bootHookInstalled; /* E9 dÃ©jÃ  posÃ© ? */

/* v6 â€” PresentWrapC : appelÃ© par le detour du present dispatch (0x41DF0C),
 * PAR FRAME. Au premier appel post-init, le driver natif est installÃ© en
 * engine+0xA74 (case 0 DDrawAlt, boot 100 % natif â€” prouvÃ© v5.5 :
 * #checkreg,ret=1,sel=0). On l'entoure alors du proxy (capture Mode A) ;
 * le present original tourne ensuite via le proxy â†’ tous les slots,
 * draw lists comprises, passent par nos wrappers. Idempotent et lÃ©ger
 * (un test non-nul par frame aprÃ¨s le wrap). */
static volatile LONG g_presentWrapped;

static void GFXPT_PresentWrapC(void* engine)
{
#if 0 /* Full capture/proxy wrapping requires a separate lifetime qualification. */
    void* native;
    void* mem;

    if (!engine)
        return;

    /* Existing Present detour -> this helper; no new host hook/address.
     * The controlled caller must be a normal frame dispatch outside loader
     * callbacks. Until that first dispatch, the persistent marker is merely
     * an opt-in; its contents are not consumed or interpreted. */
    if (g_stage0OptIn && !g_stage0Activation)
        GFXPT_Stage0Activate(1);

    /* v7 â€” pulsation par frame : seq++, flush ring dump, contrÃ´le sidecar.
     * DOIT tourner Ã  chaque frame, avant le fast-path du wrap. */
    GFXPT_DumpFramePulse();

    if (g_proxy)
        return;                             /* dÃ©jÃ  wrappÃ© (fast path par frame) */

    native = *(void**)((DWORD*)engine + (0xA74u / 4));
    if (!native)
        return;                             /* backend pas encore construit */

    g_native = native;
    g_nativeAlive = 1;
    mem = VirtualAlloc(NULL, (SIZE_T)GFXPT_DRIVER_OBJ_BYTES,
                       MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);
    if (!mem)
        return;
    g_proxy = mem;                          /* zero-fill (Ã©tat inline 9â€“14) */
    GFXPT_FillProxy();
    *(void**)((DWORD*)engine + (0xA74u / 4)) = g_proxy;
    GFXPT_LogOpen();
    if (g_logFile)
    {
        fprintf(g_logFile, "#wrapped_at_present,native=0x%p,proxy=0x%p\n",
                native, g_proxy);
        fflush(g_logFile);
    }
    GFXPT_ODS("gfx_passthrough " GFXPT_VERSION_TEXT
              ": driver natif wrappe au present dispatch\n");
#endif
    (void)engine;
    if (g_diagnosticActive)
        InterlockedIncrement((volatile LONG*)&g_frameSeq);
}

__declspec(naked) static void GFXPT_PresentDetour(void)
{
    __asm
    {
        pushad
        pushfd
        mov  eax, [esp + 0x28]             /* arg0 = engine : ret(4) + pushad(32) + pushfd(4) */
        push eax
        call GFXPT_PresentWrapC             /* wrap idempotent (fast path) */
        add  esp, 4
        popfd
        popad
        jmp  dword ptr [g_pdTrampoline]     /* corps original du present dispatch */
    }
}

/* v5.3 â€” pose un detour E9 gÃ©nÃ©rique. preimageLen doit couvrir des
 * instructions COMPLÃˆTES ; si la preimage contient un call rel32 (E8) Ã 
 * callRel32At (offset), son rel32 est recalculÃ© dans le trampoline. */
#include "gfx_lifetime_v19.h"
static int GFXPT_PlaceHook(unsigned long ea, const BYTE* preimage, int preimageLen,
                           int callRel32At, void* detour, void* volatile* trampolineOut)
{
    return GFXPT_PlaceHookRetained(ea, preimage, preimageLen, callRel32At, detour, trampolineOut);
#if 0 /* frozen implementation retained for comparison; never compiled */
    BYTE*  target;
    BYTE*  tramp;
    int    trampSize = preimageLen + 5;
    DWORD  oldProtect;
    DWORD  rel32;

    if (*trampolineOut)
        return 1;                           /* dÃ©jÃ  posÃ© */

    if (!g_hostModule)
        g_hostModule = GetModuleHandleA(NULL);
    if (!g_hostModule)
        return 0;

    target = (BYTE*)GFXPT_HostEA(ea);
    if (memcmp(target, preimage, (size_t)preimageLen) != 0)
        return 0;                           /* build non cible : refus */

    tramp = (BYTE*)VirtualAlloc(NULL, (SIZE_T)trampSize, MEM_COMMIT | MEM_RESERVE,
                                PAGE_EXECUTE_READWRITE);
    if (!tramp)
        return 0;
    memcpy(tramp, preimage, (size_t)preimageLen);
    if (callRel32At >= 0 && preimage[callRel32At] == 0xE8)
    {
        /* call dÃ©placÃ© : recalcule le rel32 (absolu conservÃ©). */
        DWORD oldTarget = ea + (unsigned long)(callRel32At + 5)
                        + *(const DWORD*)(preimage + callRel32At + 1);
        *(DWORD*)(tramp + callRel32At + 1) = oldTarget - (DWORD)(tramp + callRel32At + 5);
    }
    tramp[preimageLen] = 0xE9;
    *(DWORD*)(tramp + preimageLen + 1) = (DWORD)(ea + preimageLen) - (DWORD)(tramp + preimageLen + 5);
    *trampolineOut = tramp;

    if (!VirtualProtect(target, (SIZE_T)preimageLen, PAGE_EXECUTE_READWRITE, &oldProtect))
    {
        VirtualFree(tramp, 0, MEM_RELEASE);
        *trampolineOut = 0;
        return 0;
    }
    rel32 = (DWORD)((BYTE*)detour - (target + 5));
    target[0] = 0xE9;
    *(DWORD*)(target + 1) = rel32;
    VirtualProtect(target, (SIZE_T)preimageLen, oldProtect, &oldProtect);
    FlushInstructionCache(GetCurrentProcess(), target, (SIZE_T)preimageLen);
    return 1;
#endif
}

/* v5.2 â€” traceur : le jeu logue son boot via OutputDebugString_1 ; on capture
 * la sÃ©quence dans le CSV (cap 400 lignes anti-spam). */
static const BYTE GFXPT_ODSPreimage[9]  = { 0x55u, 0x8Bu, 0xECu, 0x51u, 0xE8u,
                                            0xA8u, 0x62u, 0x00u, 0x00u };
/* v6 â€” preimage du present dispatch : push ebp / mov ebp,esp / push ecx /
 * mov eax,[ebp+8] / push eax â€” 8 bytes d'instructions complÃ¨tes, aucun rel32. */
static void* volatile g_odsTrampoline;
static volatile LONG  g_odsCount;

static void GFXPT_ODSTrace(char* msg)
{
#if 0 /* v19 counters only; the concurrent CSV writer is unreachable. */
    char clean[160];
    int  i, j;

    if (!g_logFile || !msg)
        return;
    if (InterlockedCompareExchange(&g_odsCount, 0, 0) >= 400)
        return;
    InterlockedIncrement(&g_odsCount);

    for (i = 0, j = 0; msg[i] && j < (int)sizeof(clean) - 1; ++i)
    {
        char ch = msg[i];
        if (ch == ',' || ch == '\r' || ch == '\n')
            ch = ' ';
        clean[j++] = ch;
    }
    clean[j] = 0;
    fprintf(g_logFile, "#ods,%s\n", clean);
    fflush(g_logFile);
#endif
    (void)msg;
    if (g_diagnosticActive) InterlockedIncrement(&g_odsCount);
}

__declspec(naked) static void GFXPT_ODSDetour(void)
{
    __asm
    {
        pushad
        pushfd
        mov  eax, [esp + 0x28]             /* arg0 = char* msg */
        push eax
        call GFXPT_ODSTrace
        add  esp, 4
        popfd
        popad
        jmp  dword ptr [g_odsTrampoline]
    }
}

int __cdecl Passthrough_InstallBootHook(void* reserved)
{
    int r1, r2;
    (void)reserved;
    if (g_stage0InDllMain || InterlockedCompareExchange(&g_diagnosticLock, 1, 0)) return 0;
    if (g_diagnosticAttempted)
    {
        r1 = g_diagnosticActive;
        InterlockedExchange(&g_diagnosticLock, 0);
        return r1;
    }
    InterlockedExchange(&g_diagnosticAttempted, 1);
    if (g_stage0DiagNoHook || GFXPT_SideFileExists("gfx_passthrough.nohook") ||
        !GFXPT_EnsureResident())
    {
        InterlockedExchange(&g_diagnosticLock, 0);
        return 0;
    }
    r1 = GFXPT_PlaceHook(GFXPT_EA_PRESENTDISPATCH, GFXPT_PresentPreimage, 8, -1,
                         (void*)&GFXPT_PresentDetour, &g_pdTrampoline);
    r2 = GFXPT_PlaceHook(GFXPT_EA_ODSTRACE, GFXPT_ODSPreimage, 9, 4,
                         (void*)&GFXPT_ODSDetour, &g_odsTrampoline);

    if (r1 && r2) InterlockedExchange(&g_diagnosticActive, 1);
    else GFXPT_RestoreGenericHooks();
    InterlockedExchange(&g_diagnosticLock, 0);
    return (r1 && r2) ? 1 : 0;
}

__declspec(dllexport) int __cdecl Passthrough_StopDiagnostic(void)
{
    int ok, stage;
    if (g_stage0InDllMain || InterlockedCompareExchange(&g_diagnosticLock, 1, 0)) return 0;
    InterlockedExchange(&g_diagnosticAttempted, 1);
    InterlockedExchange(&g_diagnosticActive, 0);
    if (g_quiesceFault)
    {
        if (InterlockedCompareExchange(&g_patchLock, 1, 0))
        { InterlockedExchange(&g_diagnosticLock, 0); return 0; }
        if (!GFXPT_QuiesceEnd())
        { InterlockedExchange(&g_diagnosticLock, 0); return 0; }
    }
    stage = Passthrough_RestoreStage0Hooks();
    ok = GFXPT_RestoreGenericHooks();
    if (!stage && (g_stage0_target[0] || g_stage0_target[1] || g_stage0Lock)) ok = 0;
    if (g_quiesceFault) ok = 0;
    InterlockedExchange(&g_diagnosticLock, 0);
    return ok;
}

/* DG19 is telemetry, not a frame-coherent rendering capture. Caller owns a
 * writable 128-byte buffer and calls outside every loader callback. */
__declspec(dllexport) int __cdecl Passthrough_QueryDiagnostic(DWORD* out, DWORD bytes)
{
    if (!out || bytes < 128 || g_stage0InDllMain ||
        InterlockedCompareExchange(&g_diagnosticLock, 1, 0)) return 0;
    if (InterlockedCompareExchange(&g_stage0Lock, 1, 0))
    { InterlockedExchange(&g_diagnosticLock, 0); return 0; }
    out[0] = 0x39314744; out[1] = 128; out[2] = GFXPT_BUILD_ID;
    out[3] = GetCurrentProcessId(); out[4] = (DWORD)g_hinstDLL;
    out[5] = g_modulePinned; out[6] = g_stage0Pinned;
    out[7] = (g_generic[0].owned ? 1 : 0) | (g_generic[1].owned ? 2 : 0);
    out[8] = (g_stage0_target[0] ? 1 : 0) | (g_stage0_target[1] ? 2 : 0);
    out[9] = g_stage0Armed; out[10] = g_diagnosticActive;
    out[11] = g_diagnosticAttempted; out[12] = g_quiesceFault;
    out[13] = g_quiescePasses; out[14] = g_frameSeq; out[15] = g_odsCount;
    out[16] = g_stage0DiagReq[0]; out[17] = g_stage0DiagReq[1]; out[18] = g_stage0DiagReq[2];
    out[19] = g_stage0DiagRes[0]; out[20] = g_stage0DiagRes[1]; out[21] = g_stage0DiagRes[2];
    out[22] = (DWORD)g_proxy; out[23] = (DWORD)g_native;
    out[24] = g_nativeAlive; out[25] = g_capEndSeq; out[26] = g_dumpWrite;
    out[27] = g_frameSeq; out[28] = g_stage0LifecycleState;
    out[29] = g_stage0PatchWrites; out[30] = g_stage0PinAttempts;
    out[31] = g_stage0Activation;
    InterlockedExchange(&g_stage0Lock, 0);
    InterlockedExchange(&g_diagnosticLock, 0);
    return 128;
}

/* ===========================================================================
 * v15 (lot 24) â€” instrumentation stage0 SetTexture (option B, PROMPT lot24
 * Â§1/Â§4/Â§5 ; export pour harnais. v18 defers the opt-in to the existing
 * Present path; the explicit export uses the same PIN-before-patch path.
 *
 * Deux call-sites `call dword ptr [eax+98h]` du SetTexture device (prÃ©image
 * 6 o `FF 90 98 00 00 00`) : RVA 0x1EF5D (bind) et 0x1EF72 (unbind) â€”
 * VA hÃ´te = g_hostModule + RVA (base EXE 0x400000 â†’ EA 0x41EF5D/0x41EF72).
 * Patch 6 o = E8 rel32 + 0x90 (nop) ; le stub naked fait LUI-MÃŠME le call
 * indirect (pas de trampoline VirtualAlloc â€” plus simple que
 * GFXPT_PlaceHook, rÃ©fÃ©rence style VirtualProtect/Flush ci-dessus).
 *
 * ABI stub Ã  l'entrÃ©e (le site a poussÃ© 3 args puis `call [eax+0x98]`) :
 *   [esp+0]=ret VA, [esp+4]=device, [esp+8]=stage, [esp+0xC]=texture,
 *   eax=devVT. Sortie : EAX = HRESULT propagÃ©, esp byte-exact, ret 12
 * (contrat stdcall du site). SÃ©quence : pushad â†’ log kind8 â†’ popad â†’
 * call [eax+0x98] (stdcall, nettoie ses 12 o) â†’ pushad â†’ log kind9 â†’
 * popad â†’ ret 12.
 * =========================================================================== */

/* v15 â€” preimage des deux sites (pinÃ©e PROMPT lot24 Â§1 ; refus sans
 * Ã©criture si divergente â€” build non cible). */
static const unsigned char GFXPT_Stage0Preimage[6] = { 0xFFu, 0x90u, 0x98u,
                                                       0x00u, 0x00u, 0x00u };
/* v15 â€” RVAs des 2 sites depuis la base module hÃ´te (PROMPT lot24 Â§1 :
 * sites 0x41EF5D/0x41EF72 Ã  base 0x400000). */
#define GFXPT_STAGE0_RVA_SITE1      0x1EF5Dul    /* bind SetTexture */
#define GFXPT_STAGE0_RVA_SITE2      0x1EF72ul    /* unbind SetTexture */
#define GFXPT_STAGE0_SITE_COUNT     2ul
#define GFXPT_STAGE0_PATCH_BYTES    6ul          /* E8 rel32 + 90 */
#define GFXPT_STAGE0_E8_BYTES       5ul          /* retour du call = site+5 (le NOP suit) */

/* v17 : une ligne texte par transition, jamais par appel ni par frame.
 * Sequence normale attach/install/capture/restore/detach : 16 lignes au plus.
 * Les seules lectures de code/preimage/native slot25 passent par CopyBytes.
 * GetLastError est preserve ; winerr n'est publie QUE pour VirtualProtect KO,
 * jamais comme errno de fopen ni apres un appel reussi. */
static void GFXPT_Stage0Diag(const char* phase, const char* cause, int ret,
                             unsigned long siteMask)
{
    char path[MAX_PATH];
    char modulePath[MAX_PATH];
    char stagePath[MAX_PATH];
    char noHookPath[MAX_PATH];
    FILE* log;
    BYTE* host;
    BYTE* siteVA;
    unsigned char bytes[14];
    unsigned char saved[6];
    unsigned long i, j;
    unsigned long decoded;
    long rel32;
    int bytesOK, savedOK;
    void* nativeSlot25 = 0;
    DWORD entryError, n;

    if (!g_stage0DiagEnabled || g_stage0InDllMain)
        return;
    entryError = GetLastError();
    if (!GFXPT_BuildSidePath("gfx_passthrough_stage0.log", path))
    {
        SetLastError(entryError);
        return;
    }
    log = fopen(path, "a");
    if (!log)
    {
        SetLastError(entryError);
        return;
    }
    host = (BYTE*)(g_hostModule ? g_hostModule : GetModuleHandleA(NULL));
    fprintf(log, "phase=%s build=0x%04lX version=%s ret=%d cause=%s host=%p"
                 " armed=%d broken=%d seen=%d seq=%lu cap_end=%lu"
                 " req[0,1,2]=%lu,%lu,%lu res[0,1,2]=%lu,%lu,%lu stub=%p",
            phase, GFXPT_BUILD_ID, GFXPT_VERSION_TEXT, ret, cause, (void*)host,
            g_stage0Armed, g_stage0Broken, g_stage0Seen, g_frameSeq, g_capEndSeq,
            (unsigned long)g_stage0DiagReq[0], (unsigned long)g_stage0DiagReq[1],
            (unsigned long)g_stage0DiagReq[2], (unsigned long)g_stage0DiagRes[0],
            (unsigned long)g_stage0DiagRes[1], (unsigned long)g_stage0DiagRes[2],
            (void*)&Passthrough_Stage0Stub);
    fprintf(log, " pid=%lu tid=%lu process_created=%08lX%08lX module=%p"
                 " lifecycle=%lu source=%lu pinned=%ld pin_attempts=%ld patch_writes=%ld",
            g_stage0PID, GetCurrentThreadId(), g_stage0ProcessCreation.dwHighDateTime,
            g_stage0ProcessCreation.dwLowDateTime, (void*)g_hinstDLL,
            g_stage0LifecycleState, g_stage0ActivationSource,
            g_stage0Pinned, g_stage0PinAttempts, g_stage0PatchWrites);
    if (strcmp(cause, "virtualprotect_failed") == 0)
        fprintf(log, " winerr=%lu", (unsigned long)g_stage0DiagWinError);
    if (!g_native)
        fprintf(log, " native_slot25=absent");
    else if (GFXPT_CopyBytes(&nativeSlot25, (const BYTE*)g_native + 25ul * 4ul,
                             (unsigned long)sizeof(nativeSlot25)))
        fprintf(log, " native_slot25=%p", nativeSlot25);
    else
        fprintf(log, " native_slot25=read_failure");

    if (strcmp(phase, "attach") == 0)
    {
        n = GetModuleFileNameA(g_hinstDLL, modulePath, (DWORD)sizeof(modulePath));
        if (n == 0 || n >= (DWORD)sizeof(modulePath))
            lstrcpynA(modulePath, "path_failure", (int)sizeof(modulePath));
        if (!GFXPT_BuildSidePath("gfx_passthrough.stage0", stagePath))
            lstrcpynA(stagePath, "path_failure", (int)sizeof(stagePath));
        if (!GFXPT_BuildSidePath("gfx_passthrough.nohook", noHookPath))
            lstrcpynA(noHookPath, "path_failure", (int)sizeof(noHookPath));
        fprintf(log, " stage0_present=%d nohook_present=%d boothook_enabled=%d"
                     " module=\"%s\" stage0_path=\"%s\" nohook_path=\"%s\" log_path=\"%s\"",
                g_stage0DiagEnabled, g_stage0DiagNoHook, g_stage0DiagBootHook,
                modulePath, stagePath, noHookPath, path);
    }
    for (i = 0; i < GFXPT_STAGE0_SITE_COUNT; ++i)
    {
        if (!(siteMask & (1ul << i)))
            continue;
        siteVA = host ? host + (i == 0 ? GFXPT_STAGE0_RVA_SITE1
                                       : GFXPT_STAGE0_RVA_SITE2) : 0;
        fprintf(log, " site%lu_va=%p", i + 1, (void*)siteVA);
        bytesOK = siteVA && GFXPT_CopyBytes(bytes, siteVA - 4, 14ul);
        if (!bytesOK)
            fprintf(log, " read_failure=site%lu_window14", i + 1);
        else
        {
            fprintf(log, " hex14[-4,+10)=");
            for (j = 0; j < 14ul; ++j)
                fprintf(log, "%02X", (unsigned)bytes[j]);
            if (bytes[4] == 0xE8u)
            {
                memcpy(&rel32, bytes + 5, 4ul);
                decoded = (unsigned long)siteVA + GFXPT_STAGE0_E8_BYTES
                        + (unsigned long)rel32;
                fprintf(log, " e8_target=%p stub_match=%d", (void*)decoded,
                        decoded == (unsigned long)&Passthrough_Stage0Stub);
            }
            else
                fprintf(log, " e8_target=not_e8");
        }
        if (g_stage0DiagSavedMask & (1ul << i))
        {
            savedOK = GFXPT_CopyBytes(saved, g_stage0_saved[i], 6ul);
            if (!savedOK)
                fprintf(log, " read_failure=site%lu_saved6", i + 1);
            else
            {
                fprintf(log, " saved6=");
                for (j = 0; j < 6ul; ++j)
                    fprintf(log, "%02X", (unsigned)saved[j]);
                if (bytesOK)
                    fprintf(log, " saved_match=%d", memcmp(bytes + 4, saved, 6ul) == 0);
            }
        }
        else
            fprintf(log, " saved6=not_saved");
    }
    fprintf(log, "\n");
    fclose(log);
    SetLastError(entryError);
}

/* v15 â€” logger request (kind8) : appelÃ© depuis le stub naked, cdecl.
 * type=site 1/2, value=texture, aux=stage, ctx_token=device,
 * device_token=devVT â€” passe par les gardes/gardous v15 de GFXPT_StEmitCtx. */
static void __cdecl GFXPT_Stage0LogReq(unsigned long site, unsigned long device,
                                       unsigned long stage, unsigned long texture,
                                       unsigned long devVT)
{
    InterlockedIncrement(&g_stage0DiagReq[site <= 2ul ? site : 0ul]);
    GFXPT_StEmitCtx(GFXPT_ST_KIND_STAGE0_REQ, site, texture, stage,
                    device, devVT);
}

/* v15 â€” logger result (kind9) :cdecl. type=site, value=texture,
 * aux=HRESULT BRUT (witness candidat, jamais interprÃ©tÃ©), ctx_token=device,
 * device_token=devVT. Met Ã  jour le CACHE WRITER (g_stage0_*) et
 * g_stage0Seen â€” SEUL point de mise Ã  jour du triple footer ND08. */
static void __cdecl GFXPT_Stage0LogRes(unsigned long site, unsigned long texture,
                                       unsigned long hr, unsigned long device,
                                       unsigned long devVT)
{
    InterlockedIncrement(&g_stage0DiagRes[site <= 2ul ? site : 0ul]);
    /* Runtime v19 never opens a capture window. The serialized offline
     * writer harness still exercises the inherited binary contract. */
    if (!g_capEndSeq) return;
    g_stage0_tex = texture;
    g_stage0_dev = device;
    g_stage0_devvt = devVT;
    g_stage0_hr = hr;
    g_stage0Seen = 1;
    GFXPT_StEmitCtx(GFXPT_ST_KIND_STAGE0_RESULT, site, texture, hr,
                    device, devVT);
}

/* ---------------------------------------------------------------------------
 * v15 â€” pose un call-site hook 6 o (E8 rel32 + 0x90). Signature :
 * GFXPT_PlaceCallSiteHook(targetVA, preimage[6], stubVA, savedOut[6]).
 * memcmp 6 o (refus sans Ã©criture si divergente) ; VirtualProtect
 * PAGE_EXECUTE_READWRITE ; Ã©criture E8+rel32+0x90 (fail-closed si
 * |rel32| >= 0x7FFF0000) ; FlushInstructionCache ; restauration de la
 * protection ; prÃ©image copiÃ©e dans savedOut (restore byte-exact).
 * rel32 relatif Ã  l'instruction SUIVANT le call (target+5) ; le 6e octet
 * (0x90) est un nop â€” le ret du site reste target+6.
 * ------------------------------------------------------------------------- */
#include "gfx_stage0_v19.h"
static int GFXPT_PlaceCallSiteHook(void* targetVA, const unsigned char* preimage,
                                   void* stubVA, unsigned char* savedOut)
{
    unsigned long i;
    g_stage0LastWritten = 0;
    g_stage0DiagWinError = 0;
    g_stage0DiagCause = "invalid_args";
    if (!g_stage0Pinned || g_stage0InDllMain || !targetVA ||
        !preimage || stubVA != (void*)&Passthrough_Stage0Stub || !savedOut) return 0;
    for (i = 0; i < GFXPT_STAGE0_SITE_COUNT; ++i)
        if (savedOut == g_stage0_saved[i]) break;
    if (i == GFXPT_STAGE0_SITE_COUNT) return 0;
    if (memcmp(targetVA, preimage, 6) != 0)
    { g_stage0DiagCause = "preimage_mismatch"; return 0; }
    memcpy(savedOut, preimage, 6);
    return GFXPT_Stage0Write(targetVA, savedOut, i, 0);
#if 0 /* v18 historical body, excluded */
    BYTE*  target = (BYTE*)targetVA;
    BYTE   patch[GFXPT_STAGE0_PATCH_BYTES];
    DWORD  oldProtect;
    long   rel32;

    g_stage0DiagCause = "invalid_args";
    g_stage0DiagWinError = 0;
    g_stage0LastWritten = 0;
    if (!g_stage0Pinned || g_stage0InDllMain)
    {
        g_stage0DiagCause = "pin_required_outside_dllmain";
        return 0;
    }
    if (!targetVA || !preimage || !stubVA || !savedOut)
        return 0;
    if (memcmp(target, preimage, (size_t)GFXPT_STAGE0_PATCH_BYTES) != 0)
    {
        g_stage0DiagCause = "preimage_mismatch";
        return 0;                           /* build non cible : refus */
    }

    rel32 = (long)((BYTE*)stubVA - (target + 5));
    if (rel32 > 0x7FFF0000L || rel32 < -0x7FFF0000L)
    {
        g_stage0DiagCause = "rel32_range";
        return 0;                           /* hors bornes rel32 : fail-closed */
    }

    patch[0] = 0xE8;
    memcpy(patch + 1, &rel32, 4ul);
    patch[5] = 0x90;

    memcpy(savedOut, target, (size_t)GFXPT_STAGE0_PATCH_BYTES);  /* prÃ©image gardÃ©e */
    if (!VirtualProtect(target, (SIZE_T)GFXPT_STAGE0_PATCH_BYTES,
                        PAGE_EXECUTE_READWRITE, &oldProtect))
    {
        g_stage0DiagWinError = GetLastError();
        g_stage0DiagCause = "virtualprotect_failed";
        return 0;
    }
    memcpy(target, patch, (size_t)GFXPT_STAGE0_PATCH_BYTES);
    g_stage0LastWritten = 1; /* ownership survives ALL errors after the write */
    InterlockedIncrement(&g_stage0PatchWrites);
    if (!VirtualProtect(target, (SIZE_T)GFXPT_STAGE0_PATCH_BYTES, oldProtect, &oldProtect))
    {
        g_stage0DiagWinError = GetLastError();
        g_stage0DiagCause = "virtualprotect_failed";
        return 0;
    }
    if (!FlushInstructionCache(GetCurrentProcess(), target,
                               (SIZE_T)GFXPT_STAGE0_PATCH_BYTES))
    {
        g_stage0DiagCause = "instruction_cache_failed";
        return 0;
    }
    if (memcmp(target, patch, sizeof(patch)) != 0)
    {
        g_stage0DiagCause = "patch_readback_failed";
        return 0;
    }
    g_stage0DiagCause = "patched";
    return 1;
#endif
}

/* v15 â€” rÃ©Ã©criture byte-exact de la prÃ©image (compagnon de
 * GFXPT_PlaceCallSiteHook ; mÃªme discipline VirtualProtect/Flush). */
static int GFXPT_RestoreCallSiteHook(void* targetVA, const unsigned char* saved)
{
    unsigned long index;
    g_stage0DiagCause = "invalid_args";
    g_stage0DiagWinError = 0;
    if (!targetVA || !saved || !g_stage0Pinned || g_stage0InDllMain) return 0;
    for (index = 0; index < GFXPT_STAGE0_SITE_COUNT; ++index)
        if (saved == g_stage0_saved[index]) break;
    if (index == GFXPT_STAGE0_SITE_COUNT) return 0;
    return GFXPT_Stage0Write(targetVA, saved, index, 1);
#if 0 /* v18 historical body, excluded */
    BYTE*  target = (BYTE*)targetVA;
    DWORD  oldProtect;
    unsigned char readback[14];
    unsigned long i;

    g_stage0DiagCause = "invalid_args";
    g_stage0DiagWinError = 0;
    if (!targetVA || !saved)
        return 0;
    for (i = 0; i < GFXPT_STAGE0_SITE_COUNT; ++i)
        if (saved == g_stage0_saved[i])
            break;
    if (i == GFXPT_STAGE0_SITE_COUNT)
        return 0;
    if (!VirtualProtect(target, (SIZE_T)GFXPT_STAGE0_PATCH_BYTES,
                        PAGE_EXECUTE_READWRITE, &oldProtect))
    {
        g_stage0DiagWinError = GetLastError();
        g_stage0DiagCause = "virtualprotect_failed";
        return 0;
    }
    memcpy(target, saved, (size_t)GFXPT_STAGE0_PATCH_BYTES);
    if (!VirtualProtect(target, (SIZE_T)GFXPT_STAGE0_PATCH_BYTES, oldProtect, &oldProtect))
    {
        g_stage0DiagWinError = GetLastError();
        g_stage0DiagCause = "virtualprotect_failed";
        return 0;
    }
    if (!FlushInstructionCache(GetCurrentProcess(), target,
                               (SIZE_T)GFXPT_STAGE0_PATCH_BYTES))
    {
        g_stage0DiagCause = "instruction_cache_failed";
        return 0;
    }
    if (!GFXPT_CopyBytes(readback, target - 4, 14ul) ||
        memcmp(readback + 4, saved, GFXPT_STAGE0_PATCH_BYTES) != 0 ||
        memcmp(readback, g_stage0Window[i], 14ul) != 0)
    {
        g_stage0DiagCause = "restore_readback_failed";
        return 0;
    }
    g_stage0DiagCause = "restored";
    return 1;
#endif
}

/* ---------------------------------------------------------------------------
 * v15 â€” stub naked des 2 call-sites SetTexture (exportÃ©
 * Passthrough_Stage0Stub : testable par le harnais via GetProcAddress,
 * vÃ©rifiable byte-level par la gate).
 *
 * MATH D'OFFSET (documentÃ©e â€” aucune rÃ©fÃ©rence absolue hors g_ globals) :
 * aprÃ¨s `pushad`, un champ k de la pile d'entrÃ©e se lit Ã 
 * [esp + 32 + 4*npush + 4k] â€” delta = 32 + 4Ã—npush, npush = nombre de
 * pushes effectuÃ©s depuis l'entrÃ©e du stub (ici 0 dans les deux blocs
 * pushad). Champs d'entrÃ©e : +0=ret VA, +4=device, +8=stage, +12=texture.
 * Identification du site : comparaison du ret VA ([esp+32 aprÃ¨s pushad])
 * aux g_stage0_ret[2] (posÃ©s par l'installateur = target+5) â€” site 1/2,
 * 0 si inconnu (loguÃ© tel quel, jamais supposÃ©).
 *
 * Le call COM est fait avec les 3 args RÃ‰PLIQUES au-dessus de la
 * sauvegarde devVT (push eax + 3 push lecteurs dÃ©calÃ©s de +12) â€” le callee
 * stdcall lit ses args Ã  [esp+4..+0xC] de SA frame et nettoie ses 12 o
 * (ret 12) : la pile d'entrÃ©e du stub reste byte-exact, devVT survit au
 * call via la sauvegarde [S-4]. EAX = HRESULT propagÃ© (popad du 2e bloc).
 * ------------------------------------------------------------------------- */
__declspec(naked) void __cdecl Passthrough_Stage0Stub(void)
{
    __asm
    {
        /* ---- bloc 1 : logger la REQUEST (kind8) avant le call COM ---- */
        pushad                              /* esp -= 32 ; delta = 32 + 4*npush, npush = 0 */
        mov  esi, eax                       /* esi = devVT (eax Ã  l'entrÃ©e) */
        mov  eax, [esp + 32]                /* ret VA ([esp+32 aprÃ¨s pushad]) */
        xor  edi, edi                       /* site 0 = inconnu */
        cmp  eax, DWORD PTR [g_stage0StableRet]
        jne  stage0_site2
        mov  edi, 1                         /* site 1 : bind (RVA 0x1EF5D) */
        jmp  stage0_site_ok
stage0_site2:
        cmp  eax, DWORD PTR [g_stage0StableRet + 4]
        jne  stage0_site_ok
        mov  edi, 2                         /* site 2 : unbind (RVA 0x1EF72) */
stage0_site_ok:
        mov  ebx, [esp + 36]                /* device  (entrÃ©e +4) */
        mov  ecx, [esp + 40]                /* stage   (entrÃ©e +8) */
        mov  edx, [esp + 44]                /* texture (entrÃ©e +12) */
        push esi                            /* devVT   */
        push edx                            /* texture */
        push ecx                            /* stage   */
        push ebx                            /* device  */
        push edi                            /* site    */
        call GFXPT_Stage0LogReq             /* cdecl (callee ne nettoie pas) */
        add  esp, 20
        popad                               /* eax = devVT ; esp byte-exact */

        /* ---- call COM stdcall (nettoie ses 12 o) + sauvegarde devVT ---- */
        /* EntrÃ©e : [S+4]=device, [S+8]=stage, [S+12]=texture. RÃ©plication
         * exacte du site original (push texture, stage, device) â€” offsets
         * recalculÃ©s aprÃ¨s CHAQUE push : depuis S-4/S-8/S-12, l'argument
         * visÃ© est toujours Ã  [esp+16]. */
        push eax                            /* [S-4] = devVT ; eax intact */
        push dword ptr [esp + 16]           /* texture ([S+12] depuis esp=S-4) */
        push dword ptr [esp + 16]           /* stage   ([S+8]  depuis esp=S-8) */
        push dword ptr [esp + 16]           /* device  ([S+4]  depuis esp=S-12) */
        call DWORD PTR [eax + 98h]          /* eax = HRESULT brut ; stdcall nettoie ses 12 o => esp = S-4 */
        mov  edx, [esp]                     /* edx = devVT (sauvegarde [S-4]) */
        add  esp, 4                         /* dÃ©pile la sauvegarde ; esp = S */

        /* ---- bloc 2 : logger le RESULT (kind9, hr) aprÃ¨s le call COM ----
         * pushad/popad UNIQUEMENT (EBX/ESI/EDI/EBP non volatils â€” l'ID de
         * site et le chemin d'Ã©pilogue s'Ã©changent par les globales). Deux
         * formes d'entrÃ©e : DIRECTE harnais (call du stub : [S]=ret harnais,
         * 3 args Ã  nettoyer) et SITE rÃ©el (l'E8 a empilÃ© site+5 : [S]=site+5,
         * ret 16 => eip=site+5 (NOP) puis instruction suivante â€” sÃ©mantique
         * du flux jeu). DÃ©tection par la valeur [S] (ret VA) ; les 3 pushes
         * du caller restent [S+4..S+0xC] dans les DEUX cas (le harnais
         * reproduit l'ABI exact du site). */
        pushad                              /* esp = S-32 ; [S-32+32]=[S]=ret */
        mov  esi, eax                       /* esi = hr */
        mov  eax, [esp + 32]                /* ret VA ([S] aprÃ¨s pushad) */
        xor  edi, edi
        cmp  eax, DWORD PTR [g_stage0StableRet]
        jne  stage0_site2r
        mov  edi, 1
        jmp  stage0_site_okr
stage0_site2r:
        cmp  eax, DWORD PTR [g_stage0StableRet + 4]
        jne  stage0_site_okr
        mov  edi, 2
stage0_site_okr:
        mov  ebx, [esp + 44]                /* texture (entrÃ©e +12) */
        mov  ecx, [esp + 36]                /* device  (entrÃ©e +4) */
        push edx                            /* devVT   */
        push ecx                            /* device  */
        push esi                            /* hr      */
        push ebx                            /* texture */
        push edi                            /* site    */
        call GFXPT_Stage0LogRes             /* cdecl â€” cache writer + g_stage0Seen */
        add  esp, 20
        /* Known sites return to +6 even after the NOP has been restored.
         * Stable IDs survive until the pinned module's process terminates. */
        test edi, edi
        jz stage0_direct_return
        inc DWORD PTR [esp + 32]
stage0_direct_return:
        mov  eax, esi                       /* eax = HRESULT PROPAGÃ‰ */
        popad                               /* registres restaurÃ©s, esp = S */
        /* Ã‰pilogue UNIQUE ret 12 : le stub REMPLACE le callee stdcall
         * (entrÃ©e via l'E8 : [S]=site+5, args [S+4..C]) => eip=site+5 (le
         * NOP), esp = prÃ©-args â€” sÃ©mantique jeu exacte ; la forme "call
         * direct harnais" ([S]=ret_harnais) est IDENTIQUE et rejoint
         * RunStubCall. Les deux formes partagent cet Ã©pilogue. */
        ret  12
    }
}

/* ---------------------------------------------------------------------------
 * v15 â€” installateur EXPORTÃ‰ (fail-closed) : boucle sur les 2 sites
 * (g_hostModule+0x1EF5D / +0x1EF72, prÃ©image FF 90 98 00 00 00, stub =
 * Passthrough_Stage0Stub) ; ARMÃ‰ SI ET SEULEMENT SI les 2 rÃ©ussissent
 * (g_stage0Armed=1), sinon restauration partielle (aucun patch rÃ©siduel)
 * + g_stage0Broken=1 (bit1 footers = 0, dump continue dÃ©gradÃ©).
 * Sauvegarde : prÃ©images (g_stage0_saved[2][6]) + ret VAs target+5
 * (g_stage0_ret[2] â€” clÃ© d'identification du site dans le stub).
 * Export explicite ; auto-install v16/v17 dans DllMain avec sidecar stage0.
 * Retour : 1 armÃ©, 0 refus.
 * ------------------------------------------------------------------------- */
/* Only the common activation path may enter this installer, after PIN. */
static int GFXPT_Stage0InstallPinned(void)
{
    BYTE* site[GFXPT_STAGE0_SITE_COUNT];
    int   ok[GFXPT_STAGE0_SITE_COUNT];
    int   restored;
    unsigned long i;

    GFXPT_Stage0Diag("install_enter", "requested", -1, 0ul);
    if (g_stage0Armed)
    {
        GFXPT_Stage0Diag("install_exit", "already_armed", 1, 3ul);
        return 1;                           /* dÃ©jÃ  armÃ© (idempotent) */
    }
    if (g_stage0_target[0] || g_stage0_target[1])
    {
        GFXPT_Stage0Diag("install_exit", "residual_owned_site", 0, 3ul);
        return 0; /* Do not overwrite ownership after a failed rollback. */
    }
    if (!g_hostModule)
        g_hostModule = GetModuleHandleA(NULL);
    if (!g_hostModule)
    {
        g_stage0Broken = 1;
        GFXPT_Stage0Diag("install_exit", "host_absent", 0, 3ul);
        return 0;
    }

    site[0] = (BYTE*)g_hostModule + GFXPT_STAGE0_RVA_SITE1;
    site[1] = (BYTE*)g_hostModule + GFXPT_STAGE0_RVA_SITE2;
    for (i = 0; i < GFXPT_STAGE0_SITE_COUNT; ++i)
    {
        MEMORY_BASIC_INFORMATION memory;
        if (VirtualQuery(site[i], &memory, sizeof(memory)) != sizeof(memory)) return 0;
        g_stage0OriginalProtect[i] = memory.Protect;
        if (!GFXPT_CopyBytes(g_stage0Window[i], site[i] - 4, 14ul))
        {
            g_stage0Broken = 1;
            GFXPT_Stage0Diag("install_exit", "window_read_failed", 0, 0ul);
            return 0;
        }
    }
    g_stage0DiagSavedMask = 0;
    for (i = 0; i < GFXPT_STAGE0_SITE_COUNT; ++i)
    {
        g_stage0_ret[i] = (unsigned long)(site[i] + GFXPT_STAGE0_E8_BYTES);
        g_stage0StableRet[i] = g_stage0_ret[i];
        GFXPT_Stage0Diag("install_site_before", "requested", -1, 1ul << i);
        ok[i] = GFXPT_PlaceCallSiteHook(site[i], GFXPT_Stage0Preimage,
                                        (void*)&Passthrough_Stage0Stub,
                                        g_stage0_saved[i]);
        if (ok[i] || g_stage0LastWritten || strcmp(g_stage0DiagCause, "virtualprotect_failed") == 0)
            g_stage0DiagSavedMask |= 1ul << i; /* savedOut copie avant VirtualProtect */
        g_stage0_target[i] = g_stage0LastWritten ? (void*)site[i] : 0;
        if (!g_stage0_target[i])
            g_stage0_ret[i] = 0;            /* site absent : id stub inerte */
        GFXPT_Stage0Diag("install_site_after", g_stage0DiagCause, ok[i], 1ul << i);
    }

    if (ok[0] && ok[1])
    {
        g_stage0Armed = 1;                  /* armÃ© SI ET SEULEMENT SI les 2 ok */
        GFXPT_ODS("gfx_passthrough " GFXPT_VERSION_TEXT
                  ": stage0 SetTexture hooks poses (sites 0x1EF5D/0x1EF72)\n");
        GFXPT_Stage0Diag("install_exit", "both_sites_patched", 1, 3ul);
        return 1;
    }

    /* fail-closed : restauration partielle â€” aucun patch rÃ©siduel. */
    for (i = 0; i < GFXPT_STAGE0_SITE_COUNT; ++i)
    {
        if (g_stage0_target[i])
        {
            GFXPT_Stage0Diag("rollback_site_before", "partial_install", -1, 1ul << i);
            restored = GFXPT_RestoreCallSiteHook(g_stage0_target[i], g_stage0_saved[i]);
            GFXPT_Stage0Diag("rollback_site_after", g_stage0DiagCause, restored, 1ul << i);
            if (!restored)
                continue; /* Keep target/ret ownership for shutdown retry. */
        }
        g_stage0_target[i] = 0;
        g_stage0_ret[i] = 0;
    }
    g_stage0Broken = 1;
    GFXPT_ODS("gfx_passthrough " GFXPT_VERSION_TEXT
              ": stage0 install REFUSE (preimage/rel32) â€” restaure, desarme\n");
    GFXPT_Stage0Diag("install_exit", ok[0] ? "site2_refused"
                     : (ok[1] ? "site1_refused" : "both_sites_refused"), 0, 3ul);
    return 0;
}

/* ---------------------------------------------------------------------------
 * v15 â€” restore EXPORTÃ‰ : rÃ©Ã©criture byte-exact des prÃ©images des 2 sites
 * puis dÃ©sarmement (g_stage0Armed=0 â†’ bit1 footers = 0 ; g_stage0_ret
 * remis Ã  0 â†’ id site du stub inerte). Ã‰chec d'une rÃ©Ã©criture â†’
 * g_stage0Broken=1. Retour : 1 restaurÃ©, 0 (rien armÃ© ou Ã©chec).
 * ------------------------------------------------------------------------- */
static int GFXPT_Stage0RestoreOwned(void)
{
    int ok = 1;
    int siteOK;
    unsigned long i;

    GFXPT_Stage0Diag("restore_enter", "requested", -1, 3ul);
    if (!g_stage0Armed && !g_stage0_target[0] && !g_stage0_target[1])
    {
        GFXPT_Stage0Diag("restore_exit", "not_armed", 0, 3ul);
        return 0;                           /* rien Ã  restaurer */
    }
    for (i = 0; i < GFXPT_STAGE0_SITE_COUNT; ++i)
    {
        if (g_stage0_target[i])
        {
            GFXPT_Stage0Diag("restore_site_before", "requested", -1, 1ul << i);
            siteOK = GFXPT_RestoreCallSiteHook(g_stage0_target[i], g_stage0_saved[i]);
            GFXPT_Stage0Diag("restore_site_after", g_stage0DiagCause, siteOK, 1ul << i);
            if (!siteOK)
            {
                ok = 0;
                continue; /* Failed restores retain ownership and return VA. */
            }
        }
        g_stage0_target[i] = 0;
        g_stage0_ret[i] = 0;
    }
    g_stage0Armed = 0;                      /* dÃ©sarme */
    if (!ok)
        g_stage0Broken = 1;
    GFXPT_ODS(ok ? "gfx_passthrough " GFXPT_VERSION_TEXT
                   ": stage0 hooks restaures byte-exact, desarmes\n"
                 : "gfx_passthrough " GFXPT_VERSION_TEXT
                    ": stage0 restore PARTIELLE (echec) â€” broken\n");
    GFXPT_Stage0Diag("restore_exit", ok ? "restored" : "restore_site_failed", ok, 3ul);
    return ok;
}

/* v18 NO_HOT_UNLOAD: one PIN-first activation per loaded module. */
static int GFXPT_Stage0Activate(DWORD source)
{
    HMODULE retained = 0;
    int ok;
    /* This guard cannot see a different DLL's DllMain. Public exports and
     * Present have an explicit caller precondition: outside loader callbacks.
     * No loader-lock probe, thread creation, waiting or PIN in our DllMain. */
    if (g_stage0InDllMain)
        return 0;
    if (InterlockedCompareExchange(&g_stage0Lock, 1, 0) != 0)
        return 0;
    if (g_stage0Activation)
    {
        ok = g_stage0Armed;
        InterlockedExchange(&g_stage0Lock, 0);
        return ok;
    }
    if (source == 1 && !g_stage0OptIn)
    {
        InterlockedExchange(&g_stage0Lock, 0);
        return 0;
    }
    g_stage0ActivationSource = source;
    InterlockedExchange(&g_stage0Activation, 1); /* failure is terminal too */
    /* Attach-time nohook remains authoritative; a newly added nohook also
     * vetoes the activation. Explicit opt-in cannot bypass it. */
    if (g_stage0DiagNoHook || GFXPT_SideFileExists("gfx_passthrough.nohook"))
    {
        g_stage0LifecycleState = 7;
        GFXPT_Stage0Diag("activate_refused", "nohook", 0, 0ul);
        InterlockedExchange(&g_stage0Lock, 0);
        return 0;
    }
    InterlockedIncrement(&g_stage0PinAttempts);
    ok = GetModuleHandleExA(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS |
                           GET_MODULE_HANDLE_EX_FLAG_PIN,
                           (LPCSTR)&Passthrough_Stage0Stub, &retained);
    if (!ok || retained != g_hinstDLL)
    {
        g_stage0Broken = 1;
        g_stage0LifecycleState = 2;
        GFXPT_Stage0Diag("activate_refused", "self_pin_not_confirmed", 0, 0ul);
        InterlockedExchange(&g_stage0Lock, 0);
        return 0; /* zero stage0 writes; no compensating PIN on shutdown */
    }
    InterlockedExchange(&g_stage0Pinned, 1);
    InterlockedExchange(&g_modulePinned, 1);
    GFXPT_Stage0Diag("activate_pin", "self_pin_confirmed", 1, 0ul);
    ok = GFXPT_Stage0InstallPinned();
    g_stage0LifecycleState = ok ? 3 : 4;
    GFXPT_Stage0Diag("activate_exit", ok ? "ARMED_RETAINED" : "REFUSED_RETAINED", ok, 3ul);
    InterlockedExchange(&g_stage0Lock, 0);
    return ok;
}

int __cdecl Passthrough_InstallStage0Hooks(void)
{
    return GFXPT_Stage0Activate(2);
}

int __cdecl Passthrough_RestoreStage0Hooks(void)
{
    int ok;
    if (g_stage0InDllMain || InterlockedCompareExchange(&g_stage0Lock, 1, 0) != 0)
        return 0;
    InterlockedExchange(&g_stage0Activation, 1); /* cancel pending Present opt-in */
    ok = GFXPT_Stage0RestoreOwned();
    if (g_stage0Pinned)
    {
        if (ok)
            g_stage0LifecycleState = 5;
        else if (g_stage0_target[0] || g_stage0_target[1])
            g_stage0LifecycleState = 6;
        GFXPT_Stage0Diag("restore_residence", ok ? "RESTORED_RETAINED"
                        : "RESTORE_NOT_PROVEN_RETAINED", ok, 3ul);
    }
    InterlockedExchange(&g_stage0Lock, 0);
    return ok;
}

static void GFXPT_Stage0BeforeUnload(void)
{
    /* Compatibility wrapper only. Residence was established before E8 writes,
     * independently of whether the host ever calls this slot. */
    if (g_stage0Armed || g_stage0_target[0] || g_stage0_target[1])
        Passthrough_RestoreStage0Hooks();
}

/* ===========================================================================
 * DllMain â€” flag + boot hook v2 (VirtualProtect/memcpy uniquement, pattern
 * FFNx replace_function au DLL_PROCESS_ATTACH ; aucun chargement de lib).
 * Contrainte shutdown 0x409670/FreeLibrary inchangÃ©e.
 * =========================================================================== */
static int g_dllAttached = 0;

/* v5.4 â€” interrupteur par fichier sidecar (manipulable sans env ni rebuild). */
static int GFXPT_SideFileExists(const char* name)
{
    char path[MAX_PATH];
    char* slash;
    DWORD m = GetModuleFileNameA(g_hinstDLL, path, (DWORD)sizeof(path));
    if (m == 0 || m >= (DWORD)sizeof(path) - 48)
        return 0;
    slash = path + m;
    while (slash > path && slash[-1] != '\\' && slash[-1] != '/')
        --slash;
    *slash = 0;
    lstrcpynA(slash, name, (int)(sizeof(path) - (size_t)(slash - path)));
    return GetFileAttributesA(path) != INVALID_FILE_ATTRIBUTES;
}

/* LC18 diagnostic: 16 little-endian DWORDs (64 bytes). Only two records per
 * module lifetime, preopened file, no formatter/CRT locks at termination.
 * Missing/short IO is NOT a successful observation: controller validates
 * size, PID+creation identity, reason and process exit independently. */
static void GFXPT_Stage0LifeRecord(DWORD reason, LPVOID reserved)
{
    DWORD row[16];
    DWORD written, error;
    if (g_stage0LifeFile == INVALID_HANDLE_VALUE)
        return;
    error = GetLastError();
    row[0] = 0x3831434Cul; /* LC18 */
    row[1] = sizeof(row);
    row[2] = g_stage0PID;
    row[3] = GetCurrentThreadId();
    row[4] = g_stage0ProcessCreation.dwLowDateTime;
    row[5] = g_stage0ProcessCreation.dwHighDateTime;
    row[6] = (DWORD)g_hinstDLL;
    row[7] = reason;
    row[8] = reserved != NULL;
    row[9] = g_stage0OptIn;
    row[10] = g_stage0DiagNoHook;
    row[11] = g_stage0LifecycleState;
    row[12] = g_stage0Pinned;
    row[13] = (g_stage0_target[0] ? 1ul : 0ul) | (g_stage0_target[1] ? 2ul : 0ul);
    row[14] = g_stage0Armed;
    row[15] = g_frameSeq;
    WriteFile(g_stage0LifeFile, row, sizeof(row), &written, NULL);
    SetLastError(error);
}

BOOL WINAPI DllMain(HINSTANCE hinstDLL, DWORD fdwReason, LPVOID lpvReserved)
{
    char lifePath[MAX_PATH];
    FILETIME exited, kernel, user;

    InterlockedExchange(&g_stage0InDllMain, 1);
    if (fdwReason == DLL_PROCESS_ATTACH)
    {
        g_dllAttached = 1;
        g_hinstDLL = hinstDLL;
        g_stage0PID = GetCurrentProcessId();
        GetProcessTimes(GetCurrentProcess(), &g_stage0ProcessCreation,
                        &exited, &kernel, &user);
        g_stage0OptIn = GFXPT_SideFileExists("gfx_passthrough.stage0");
        g_stage0DiagEnabled = g_stage0OptIn;
        g_stage0DiagNoHook = GFXPT_SideFileExists("gfx_passthrough.nohook");
        g_stage0LifecycleState = g_stage0DiagNoHook ? 7 : (g_stage0OptIn ? 1 : 0);
        /* Fixed-size kernel32-only lifecycle witness. No CRT, allocation,
         * symbol lookup, native calls, PIN or memory walk at detach. */
        if (g_stage0OptIn && GFXPT_BuildSidePath("gfx_passthrough_lifecycle.bin", lifePath))
            g_stage0LifeFile = CreateFileA(lifePath, FILE_APPEND_DATA,
                FILE_SHARE_READ | FILE_SHARE_WRITE, NULL, OPEN_ALWAYS,
                FILE_ATTRIBUTE_NORMAL, NULL);
        GFXPT_Stage0LifeRecord(fdwReason, lpvReserved);
#if 0 /* v19 has explicit post-load activation only. */
        /* Trace de chargement : CSV crÃ©Ã© DÃˆS DllMain (diagnostic drop test). */
        GFXPT_LogOpen();
        if (g_logFile)
        {
            fprintf(g_logFile, "#dll_loaded\n");
            fflush(g_logFile);
        }
        /* Existing non-stage0 hooks unchanged and OUTSIDE this residence
         * guarantee: Present/ODS may be installed BEFORE stage0 PIN. */
        if (g_stage0DiagNoHook)
        {
            GFXPT_ODS("gfx_passthrough: nohook file present, hooks disabled\n");
        }
        else
        {
            if (GetEnvironmentVariableA("FF8_PASSTHROUGH_BOOTHOOK", disableFlag,
                                        (DWORD)sizeof(disableFlag)) == 0
                || disableFlag[0] != '0')
            {
                Passthrough_InstallBootHook(0);
            }
        }
#endif
    }
    else if (fdwReason == DLL_PROCESS_DETACH)
    {
        GFXPT_Stage0LifeRecord(fdwReason, lpvReserved);
        if (g_stage0LifeFile != INVALID_HANDLE_VALUE)
        {
            CloseHandle(g_stage0LifeFile);
            g_stage0LifeFile = INVALID_HANDLE_VALUE;
        }
        g_dllAttached = 0;
    }
    InterlockedExchange(&g_stage0InDllMain, 0);
    return TRUE;
}
