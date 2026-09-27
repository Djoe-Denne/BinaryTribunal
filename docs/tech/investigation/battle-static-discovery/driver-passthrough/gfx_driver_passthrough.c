/* ===========================================================================
 * gfx_driver_passthrough.c — prototype DLL « observer Mode A » (lot 12, re-ff8)
 * Version v8 (AF3DN.P) — extension du dump v7 avec capture du miroir VRAM
 * (TX07) ; passthrough v6.1 avec dump mémoire des draw lists au vol.
 *
 * Rôle : factory type-2 `new_dll_graphics_driver` + proxy complet de l'objet
 * driver (66 DWORDs, 0x108). Le driver natif (ctor 0x4257D0 DDrawAlt case 0
 * vanilla ; 0x4252B0 OpenGL case 3) est créé par la factory et gardé en static
 * (g_native) — il n'est JAMAIS retourné à l'engine. L'objet proxy porte :
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
 * v7 — dump mémoire (nouveau, additif, CSV v6.1 inchangé) :
 *   - Armement : sidecar `gfx_passthrough.dump` à côté de la DLL, vérifié
 *     UNIQUEMENT au present dispatch (stat cheap) ; présent → capture des 16
 *     prochains frames (seq..seq+15) puis suppression du sidecar.
 *   - Capture : dans chaque wrapper 43–64, si la fenêtre est armée pour le
 *     seq courant, le node visité est copié dans un ring RAM BSS 64 Mo selon
 *     la table de closure slot→géométrie (voir le bloc « v7 — dump mémoire »
 *     ci-dessous, provenance : ctor 0x4257D0 + decomp 0x43E24A/0x43E356 +
 *     bytes live du PE 064d466b). Aucune IO dans le detour draw ; SEH sur
 *     chaque copie ; gardes vcount≤4096, icount≤16384, node≤256 Ko,
 *     4096 records/frame.
 *   - Flush : au present dispatch, ring non vide → append binaire vers
 *     `gfx_passthrough_dump.bin` + ligne dans `gfx_passthrough_dump.log`
 *     (à côté de la DLL), puis ring vidé. Ouvert/fermé en append.
 *
 * v8 additifs — capture du miroir VRAM (TX07, frame-level) : extension
 *   additive du dump v7 (fermeture de la chaîne texture du spec
 *   driver-abi-spec.md §6.2, lot 14) ; le bloc « v8 — dump mémoire (TX07) »
 *   ci-dessous (enregistrements : hdr 32 o + miroir VRAM complet 0x100000 o
 *   = 0x100020 o ; émission UNE fois par frame armé — dédup par pulse,
 *   premier node walk texturé, à la tête de GFXPT_DumpNode pour les slots
 *   walk 48–50/57–59/63–64/51/60 ; additif log `tx=N`) — purement
 *   additif : aucun chemin engine natif n'est modifié (blits VRAM, closure).
 *
 * v9 additifs — ids texture par node (ND08) + ligne CLUT système (TX07) :
 *   (1) footer texture APPEND au payload des records geom_kind==2 — magic
 *   'ND07' → 'ND08', build 0x5639 : tpage/mode (texinfo = *(node+0x2C)),
 *   clut = *(u16*)(ctx+0x448), id_count + ids = stream u8-par-groupe
 *   {51,60} tel que consommé par le walk natif (cap 255, dropped_ids u32).
 *   Analyse noise-render : tpage/mode/clut vivent AU-DELÀ de la copie 24 o
 *   du node ; le grain 16 couleurs = sous-palette par groupe d'id ;
 *   (2) TX07 : payload + sys_clut_row[2048] = copie de &unk_1B47818 +
 *   2048*((clut&0x7FFF)>>6) (unk_1B47818 = base statique littérale —
 *   HostEA EST l'adresse de la table) — record passe à 0x100820.
 *
 * v10 additifs — ressource texture TIM bataille (TR08, per-texobj) :
 *   (1) NOUVEAU record UN par texobj unique PAR FRAME (dédup par VALEUR du
 *   pointeur T — table per-frame g_resSeen[64], reset au pulse), émis au
 *   PREMIER node walk texturé qui le référence, AVANT le ND08 de ce node
 *   (même point d'émission que TX07) : hdr 10 x u32 (magic 'TR08'
 *   0x38305254, build 0x563A, seq, texobj, w, h, pal_entries, pal_count
 *   cap 32, pixel_size cap 65536, clut_size cap 32768) + pixels (1 o/texel,
 *   *(T+0xD8)) + raw_clut (u32/couleur, *(T+0x60)) — record max 0x18028 ;
 *   échec SEH d'une copie → aucun record (règle TX) ; cap 32/frame (log
 *   `tr=N`) ;
 *   (2) ND08 : footer +1 u32 APPEND (texobj = *(texinfo+0x10)) — magic
 *   inchangé, le décodeur distingue v9/v10 par le BUILD id.
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
#define GFXPT_EA_CTOR_DDRAWALT   0x4257D0ul /* case 0 vanilla (build DotEmu 064d466b) */

#define GFXPT_EA_CHECKREGISTRY   0x401890ul /* v2-v5.5 : retiré du live en v6 */
#define GFXPT_EA_ODSTRACE        0x403D99ul /* boot v5.2 : OutputDebugString_1 (traceur du jeu) */
#define GFXPT_EA_PRESENTDISPATCH 0x41DF0Cul /* boot v6 : present dispatch (point de consommation du driver) */
/* GetBufApp_0xA74 — référence (spec §4) ; non appelé par ce .c. */
#define GFXPT_EA_GETBUFAPP       0x4098EEul

/* v8 — EAs BSS engine, chaines texture (SPEC §6.2 uniquement — no offset
 * invented) : base VRAM mmap (page pixel addr formula C, dword_1CB602C),
 * dword_1CA89A8 = live CLUT PTR (256 x u16; written word_1CA89B8 = clut &
 * 0x7FFF + (int)&unk_1B47818 + 2048*(clut>>6) + 32*(clut&0x3F) by
 * sub_45B920 — SPEC §6.2-C), dword_1CA89E8 = luma-shift base (alpha mode),
 * dword_B7DB44 = mode-2 RGB555-path flag stored by
 * Gfx_AllocTexturePageSlot (decomp 0x464F70: dword_B7DB44 =
 * (*(int*)(hit+0x44) == 0x7E0), within mode==2 arm only) and read by
 * TexStaging_BlitRows 0x4675C0 mode-2 PATH (decomp 0x4675C0). */
#define GFXPT_EA_VRAM_BASE       0x1CB602Cul /* dword_1CB602C (pointeur base VRAM, formule pixel §6.2-C) */
#define GFXPT_EA_VRAM_CLUT_LIVE  0x1CA89A8ul /* dword_1CA89A8 (live CLUT u16[256] non.rotated) */
#define GFXPT_EA_VRAM_CLUT_LUTB  0x1B47818ul /* unk_1B47818 (CLUT staging base, sub_45B920) */
#define GFXPT_EA_VRAM_LUMA       0x1CA89E8ul /* dword_1CA89E8 (luma-shift base, alpha mode) */
#define GFXPT_EA_M_B7DB44        0xB7DB44ul  /* dword_B7DB44 (flag, TexStaging_BlitRows path.2) */
/* v8 TX07 frame-level : word_1CA89B8 = id CLUT vivant (sub_45B920 : le u16
 * vit dans ce dword, word + 0x7FFF) — lecture SEH du dword CONTENANT, copie
 * BRUT dans le hdr TX07, mask & 0x7FFF appliqué décode-side. La base table
 * système CLUT reste GFXPT_EA_VRAM_CLUT_LUTB (0x1B47818, sub_45B920 :
 * base + 2048*(clut>>6) + 32*(clut&0x3F)). */
#define GFXPT_EA_CLUT_ID         0x1CA89B8ul /* word_1CA89B8 (id CLUT vivant — dword contenant lu SEH) */
/* v9 — alias documentaire : la table CLUT système EST unk_1B47818 (static
 * array, base LITTÉRALE) — la row copiée dans TX07 = HostEA(GFXPT_EA_SYS_CLUT)
 * + 2048*((clut_now & 0x7FFF) >> 6) (sub_45B920 : la fenêtre CLUT d'un id
 * vit dans la row `clut>>6`, 64 sous-CLUT × 32 o). */
#define GFXPT_EA_SYS_CLUT        GFXPT_EA_VRAM_CLUT_LUTB /* 0x1B47818 (unk_1B47818) */

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

/* ---------------------------------------------------------------------------
 * v4 — forwards PE vers le shim DotEmu original (dotemu_orig.dll).
 *
 * FF8_EN.exe importe STATIQUEMENT 9 fonctions dotemu* depuis le module
 * "AF3DN.P" (dumpbin /imports, table d'imports) : sans ces exports, le
 * loader Windows aborte le process au chargement ("point d'entrée
 * introuvable"), avant tout DllMain. Les forwards PE (résolus par le
 * loader vers dotemu_orig.dll, copie renommée de l'AF3DN.P DotEmu 2014)
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
static const BYTE     GFXPT_PresentPreimage[8] = { 0x55u, 0x8Bu, 0xECu, 0x51u,
                                                   0x8Bu, 0x45u, 0x08u, 0x50u };
static void* volatile g_pdTrampoline;   /* v6 : trampoline du present dispatch */
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
    char cand[MAX_PATH];
    char tmp[MAX_PATH];
    DWORD n, m;
    char* slash;

    if (g_logDisabled || g_logFile)
        return;

    /* Candidat 1 : FF8_PASSTHROUGH_LOG (prioritaire, sinon refus définitif). */
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

    /* Candidat 2 : à côté de la DLL (dossier du jeu — Program Files peut être
     * read-only pour le processus : fopen peut échouer silencieusement). */
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

    /* Candidat 3 : %TEMP% (toujours inscriptible — v3.2 diagnostic). */
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
 * v7 — dump mémoire des draw lists au vol (contrat binaire avec le décodeur)
 *
 * FORMAT D'ENREGISTREMENT (PINÉ — respecter à l'octet près) : little-endian,
 * enregistrements auto-descriptifs, alignés 4 octets. Par node capturé :
 *
 *   u32 magic 'ND07' (0x3730444E)
 *   u32 slot          // 43..64
 *   u32 seq           // compteur de frames, incrémenté au present dispatch
 *   u32 ctx           // arg_0 tel quel
 *   u32 node_addr     // adresse live du node (debug)
 *   u32 geom_kind     // 0=none, 1=poly_packet, 2=fvf_verts+indices
 *   u32 fails         // nb d'échecs SEH pour ce node (blocs idx/fvf mis à 0)
 *   u32 payload_size  // octets APRÈS ce champ (= node[24] + payload)
 *   u32 build         // v8 : GFXPT_BUILD_ID (0x5638) — 9e u32 (offset 0x20),
 *                     // APPEND après payload_size (en-tête 32 → 36 o) ;
 *                     // lesson lot 13 « déployé ≠ cru déployé » ; le
 *                     // décodeur v2 s'attend à un en-tête ND07 de 36 octets
 *   u8  node[24]      // copie brute du node
 *   payload selon geom_kind :
 *     1: u32 prim (3=FT3, 4=FT4) ; u8 packet[40] (copie brute 32 ou 40 o,
 *        complété à 0) — AUCUN slot DDrawAlt n'émet ce kind (réservé) ;
 *     2: u32 vcount ; u32 icount ; u16 idx[icount] ; u16 pad[(icount&1)]
 *        (rembourrage alignement 4, zéros) ; u8 fvf[vcount*32].
 *
 * Taille record = 36 (en-tête, 9 x u32 — v8 ; 32 o en v7) + payload_size.
 * Le build-id est présent dans CHAQUE record (v8) ; un bloc idx/fvf
 * illisible est mis à zéro et compte un `fails` (le décodeur ignore le
 * bloc si fails>0).
 *
 * TABLE DE CLOSURE slot → géométrie (provenance : ctor DDrawAlt 0x4257D0,
 * bind 0x41619A, decomp 0x43E24A/0x43E356, et bytes live du PE 064d466b
 * (SHA256 064D466B…9570) désassemblés hors-ligne pour les impls sans decomp ;
 * AUCUN offset inventé) :
 *
 *   Slots walking « direct » (descriptor = arg node) — vcount@node+0x0C,
 *   verts@node+0x14, icount@node+0x18, indices@node+0x20 :
 *     48, 49, 50 → 0x43E24A (RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4,
 *                  TRIANGLELIST 4, FVF 0x1C4)
 *     57, 58, 59 → 0x43E5E9 (TRIANGLELIST 4, FVF 0x1E2)
 *     63, 64     → 0x43E540 (LINELIST 2, FVF 0x1C4)
 *   Slots walking « VB batch » — remaining(@node+0x08, s32 groupes), verts
 *   base@node+0x14, indices@node+0x20, ids stream@node+0x28, geom=*(node+0x2C),
 *   vcount = *(s32*)(geom+0x3C) × remaining, icount = *(s32*)(geom+0x40) ×
 *   remaining (groupes de même id ; stride vertex 32 = shl 5) :
 *     51         → 0x43E356 (RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4_VB)
 *     60         → 0x43E692 (FVF 0x1E2 — push @0x43E7C5 — stride 32 identique,
 *                  shl 5 @0x43E79A ; capture kind2 inchangée)
 *   NB ids (preuve live PE 064d466b, disasm 2026-09-25) : le stream ids est
 *   consommé U8 PAR GROUPE par le walk natif (mov cl,[eax] @0x43E419 / 0x43E725,
 *   ids+=1 par groupe) ; il n'existe AUCUN champ u16 natif entre le blob idx et
 *   le blob fvf, et les blobs sont des pointeurs indépendants (node+0x14/+0x20/
 *   +0x28). Le payload kind2 ci-dessus est donc complet tel quel.
 *   ANOMALIE CONNUE (dump campagne 2026-09-25 13:50, seq 9720..9735) : les 32
 *   records multigroupes slot 51 du fichier produits ce jour-là font 2 octets
 *   de plus que payload_size (grille fvf décalée de +2, préfixe hors contrat
 *   `22 00`/`36 00`, queue de dernier vertex dépassant la fin déclarée) : ils
 *   proviennent d'une IMAGE DÉPLOYÉE ANTÉRIEURE (build supprimé depuis, copie
 *   [verts-2, verts-2+vcount*32+2) avec curseur need+2) — PAS du présent code
 *   (preuve : .text du rebuild identique + harnais GFXPT_DumpNode = delta 1324
 *   pour remaining=9/perV=4/perI=6). Un décodeur lisant CE fichier historique
 *   doit resynchroniser sur 'ND07' ; les dumps futurs du build courant sont
 *   conformes au contrat ci-dessus.
 *   Slots setup — le node N'EST JAMAIS lu (prouvé bytes live : lecture de
 *   ctx+0x30/ctx+0x38 uniquement, forward natif slots 31/32 ; 46/52–56 lisent
 *   node+0x2C→geom+0x80/0xA4/0xA8/0xAC = état/matériau, pas de géométrie) :
 *     43, 44 → 0x43DF00 ; 45 → 0x43DF2A ; 46 → 0x43DF54 ; 47 → 0x43DFA6 ;
 *     52, 53 → 0x43DFD0 ; 54 → 0x43E059 ; 55 → 0x43E0E2 ; 56 → 0x43E197 ;
 *     61, 62 → 0x43E220  → geom_kind = 0 (node 24 o seul).
 *
 * ---------------------------------------------------------------------------
 * v8 — FORMAT TX07 (PINÉ — respecter à l'octet près) : little-endian, aligné
 * 4, émis UNE fois par frame armé (dédup par pulse — flag per-frame
 * g_frameTxEmitted), sur le PREMIER node walk texturé de la fenêtre armée,
 * à la TÊTE de GFXPT_DumpNode pour les slots walk texturés (48–50/57–59/
 * 63–64 direct, 51/60 VB batch — chaîne §6.2 : texinfo|geom = *(node+0x2C)
 * puis page = *(texinfo+0x10)), AVANT le record ND07 du node référent.
 * TX07 ne participe PAS à l'ordre painter ND07 (mapping page↔node décodé-
 * side sur l'adresse).
 *
 * Pourquoi FRAME-LEVEL : le miroir VRAM est adressé u16-par-mot avec pitch
 * 0x800 mots/row (vramOff = (page_y + y) << 10 + page_x + (x >> (2 - mode)),
 * pixel .u16 à base + 2*vramOff, base = dword_1CB602C — decomp 0x464F70
 * (TexStaging_BlitRows call @0x465235), 0x464DB0 (Gfx_UploadCLUTSlot),
 * 0x4653E0 (isUpdateVRAMOrSomething), 0x4675C0 (TexStaging_BlitRows : dest
 * pitch 0x800/row ; row start 0x200 pour 4bpp, 0x400 pour 8bpp, 1024 u16
 * pour 16bpp)). Une page (256×256 texels) occupe les rows
 * [pageY..pageY+256) à stride 2048 o — une copie contiguë lue depuis un
 * page pointer donnerait une bande diagonale, pas la page. Le miroir
 * COMPLET (1024 u16/row × 512 rows = 0x100000 o) contient TOUTES les pages
 * ET toutes les CLUTs (fenêtres CLUT dans le même miroir : clut_src =
 * base + (clut_word << 5)) — UN snapshot par frame armé ; le décodage
 * expérimental PNG-side itère OFFLINE sur le miroir entier (aucune
 * géométrie de page côté DLL).
 *
 * u32 magic 'TX07' (0x37305458)
 * u32 build       // GFXPT_BUILD_ID — 2e u32
 * u32 seq         // g_frameSeq (même compteur ND07)
 * u32 clut_now    // dword_1CA89B8 : id CLUT vivant (sub_45B920 — word +
 *                 // 0x7FFF ; dword contenant copié BRUT, mask & 0x7FFF
 *                 // appliqué décode-side)
 * u32 vram_base   // dword_1CB602C : pointeur miroir VRAM (u16-par-mot,
 *                 // pitch 0x800)
 * u32 sys_clut_base // 0x1B47818 : base table système CLUT (sub_45B920 :
 *                 // base + 2048*(clut>>6) + 32*(clut&0x3F))
 * u32 m_B7DB44    // flag RGB555 swap (TexStaging_BlitRows mode 2 path)
 * u32 page_probe  // *(texinfo+0x10) du PREMIER node walk texturé du frame
 *                 // (diagnostic décodé-side)
 * u8  vram[0x100000] // miroir VRAM COMPLET : 1024 u16/row × 512 rows
 *                 // (pixel u16 à vram[2*off])
 *
 * Record size = 32 + 0x100000 = 0x100020 (cap garde :
 * GFXPT_DUMP_MAX_NODE_BYTES = 0x100480). Échec vram_base (SEH/0) → PAS de
 * record du tout (le miroir = la valeur seule) ; échec copie miroir (SEH)
 * → rien écrit, g_dumpWrite jamais avancé. Échecs clut_now/m_B7DB44 →
 * champ 0 + fails comptés g_txSehFails (non-fatal, record quand même émis)
 * ; échec page_probe → 0, non-fatal (diagnostic, sans compteur). L'en-tête
 * TX07 PINÉ 8 x u32 n'a PAS de champ fails.
 * ---------------------------------------------------------------------------
 * v9 patch — (a) ND08 : footer texture des records geom_kind==2 SEULEMENT.
 * La copie node 24 o (pointer-free) ne touche NI la chaîne texture NI le
 * CLUT du slot : tpage/mode vivent dans texinfo AU-DELÀ du node
 * (texinfo = *(node+0x2C) ; tpage = *(texinfo+0x20) ; mode = *(texinfo+
 * 0x14), 0=4bpp 1=8bpp 2=16bpp) et clut = *(u16*)(ctx+0x448) (lecture WORD
 * 66h-prefixed du champ CLUT du record slot ; SEH dword + mask 0xFFFF).
 * MAILLAGE ids (analyse noise-render) : le grain 16 couleurs = sous-palette
 * par id groupe — le walk natif 51/60 consomme le stream ids u8 PAR GROUPE
 * (node+0x28) et chaque groupe prend SA sous-CLUT (sub_45B920 : row =
 * base + 2048*(clut>>6), 32 o de sous-CLUT 16 couleurs dans la row) ;
 * sans le stream, l'assignation sous-palette↔grain est perdue. Extension
 * ADDITIVE du payload piné v7/v8 ci-dessus (tous les champs du payload v8
 * gardent leur offset) — footer APPEND après (vcount|icount|idx|pad|
 * fvf) :
 *   u32 tpage        // *(u32*)(texinfo+0x20) — SEH, 0 si fail (diagnostic)
 *   u32 mode         // *(u32*)(texinfo+0x14) — SEH, 0 si fail (diagnostic)
 *   u32 clut         // *(u16*)(ctx+0x448) — SEH dword, mask & 0xFFFF appliqué
 *   u32 id_count     // 0 pour slots directs {48,49,50,57,58,59,63,64} ;
 *                    // min(remaining,255) pour {51,60} (ids ABSENTS sinon)
 *   u8 ids[id_count] // (51/60) stream TEL QUE CONSOMMÉ par le walk natif :
 *                    // 1 octet PAR GROUPE lu dans *(u8**)(node+0x28) —
 *                    // copie SEH UNIQUE ≤ 256 o (pas de read par groupe) ;
 *                    // pad zéro jusqu'au prochain u32
 *   u32 dropped_ids  // TOUJOURS présent en fin de footer (align u32) :
 *                    // gcount si gcount>255, sinon 0 (id_count est saturé
 *                    // à 255 — pas de bit d'overflow)
 * payload_size v9 = 24 (node) + (8 + idx + pad + fvf) + (16 + ceil4(id_count)
 * + 4). Header magic : 'ND08' (0x3830444E — ASCII LE « ND08 », famille
 * 'ND07' 0x3730444E) pour TOUT record geom_kind==2 ; kind 0/1 gardent
 * 'ND07' ; hdr inchangé (9 x u32), build 0x5639 (v8 = 0x5638). Footer
 * fails : stream ids illisible (pointeur node+0x28 ou copie SEH) →
 * id_count=0, dropped_ids=0, hdr.fails++ (style « bloc mis à zéro +
 * fails ») ; tpage/mode/clut illisibles → champ 0 NON fatal (diagnostic,
 * style page_probe TX07) ; le record de budget ND08 max recomputé =
 * 36 + 24 + (8 + idx 32768 + fvf 131072) + footer 276 = 164 184 o (0x28158)
 * ⊂ GFXPT_DUMP_MAX_NODE_BYTES (0x100C80, calé sur le record TX07 v9).
 * ---------------------------------------------------------------------------
 * v9 patch — (b) TX07 : payload étendu u8 sys_clut_row[2048] APPEND après le
 * miroir VRAM → record 32 + 0x100000 + 0x800 = 0x100820 o (hdr TX07 PINÉ 8 x
 * u32 INCHANGÉ — sys_clut_row est du PAYLOAD, pas un champ d'en-tête).
 * sys_clut_row = copie SEH de la row CLUT système du clut_now du frame :
 *   src = HostEA(GFXPT_EA_SYS_CLUT) + 2048 * ((clut_now & 0x7FFF) >> 6)
 * (unk_1B47818 = base statique LITTÉRALE — donc HostEA(0x1B47818) EST
 * l'adresse réelle de la table ; sub_45B920 : la fenêtre CLUT d'un id vit
 * dans la row `clut>>6`, cf. formule base + 2048*(clut>>6) + 32*(clut&0x3F)
 * où 32*(clut&0x3F) pointe DANS la row copiée). Échec SEH de la copie →
 * 2048 o à zéro + fails comptés g_txSehFails (non-fatal, record émis ; 1
 * ODS par fenêtre d'armement max — g_txSysWarned). Le miroir VRAM reste
 * copié À L'IDENTIQUE (source pixels inchangée ; la résolution de palette
 * seule exige la row système — l'échantillonnage garde le miroir). Ring :
 * 64 MiB / 0x100820 = 63 records TX co-résidents max ; TX reste 1 par frame
 * armé — aucune pression (ND08 : ≤4096 records × ~200 B médian, fits).
 * ---------------------------------------------------------------------------
 * v10 — FORMAT TR08 (PINÉ — respecter à l'octet près) : ressource texture TIM
 * bataille, UN record par TEXOBJ unique PAR FRAME (dédup par VALEUR du
 * pointeur T — table per-frame g_resSeen[64]/g_resCount, reset au pulse à
 * côté de g_frameTxEmitted), émis au PREMIER node walk texturé qui le
 * référence, AVANT le record ND08 de CE node (même point d'émission que
 * TX07 — tête de GFXPT_DumpNode, slots walk 48–50/57–59/63–64 direct +
 * 51/60 VB batch). Ordre flux du frame : TX07 → TR08 → ND07/ND08 ; TR08 ne
 * participe pas plus que TX07 à l'ordre painter (mapping décode-side :
 * footer ND08.texobj ↔ TR08.texobj, sur la VALEUR du pointeur).
 *
 * GROUND TRUTH IDB (chaîne sub_407EB4 → sub_4221E6 → sub_421C41 ; T EST la
 * valeur page_probe de TX07, i.e. *(texinfo+0x10) avec texinfo =
 * *(node+0x2C)) :
 *   T+0x3C = w ; T+0x40 = h
 *   T+0x5C = entries/palette (256 pour 8bpp, 16 pour 4bpp)
 *   T+0xA0 = palMgr M — M[3] = T+0xAC = *(u32*)(M+12) = nb de palettes
 *   T+0x60 = ptr CLUT BRUT (u32 PAR COULEUR, TOUTES les sous-palettes
 *            consécutives : palette i commence à raw + 4*entries*i)
 *   T+0xD8 = ptr PIXELS (1 o PAR TEXEL : w*h o)
 * Adressage palette du MÊME moteur : palette i, couleur j =
 * raw[4*(entries*i + j)..+4] — l'octet 3 de chaque u32 = bit de
 * transparence PSX (STP). AUCUNE résolution de palette côté DLL :
 * raw_clut = copie BRUTE (u32/couleur, toutes les sous-palettes du texobj).
 *
 * u32 magic 'TR08' (0x38305254)
 * u32 build       // GFXPT_BUILD_ID (v10 = 0x563A) — 2e u32
 * u32 seq         // g_frameSeq (même compteur ND08/TX07)
 * u32 texobj      // VALEUR de T (clé de dédup + clé footer ND08)
 * u32 w           // *(T+0x3C)
 * u32 h           // *(T+0x40)
 * u32 pal_entries // *(T+0x5C)
 * u32 pal_count   // *(u32*)(*(T+0xA0)+12) — cap 32 (saturé, sans bit d'overflow)
 * u32 pixel_size  // w*h — cap 65536
 * u32 clut_size   // pal_count*pal_entries*4 — cap 32768
 * u8  pixels[pixel_size]   // copie SEH de *(T+0xD8) — 1 o/texel
 * u8  raw_clut[clut_size]  // copie SEH de *(T+0x60) — u32/couleur
 *
 * Record total = 40 + pixel_size + clut_size ≤ 40 + 65536 + 32768 =
 * 98 344 o (0x18028) ⊂ GFXPT_DUMP_MAX_NODE_BYTES (0x100C80 — inchangé ;
 * le record max EFFECTIF du flux reste TX07 0x100820, marge 0x460). Ring
 * espace vérifié comme TX07 : plein → drop (g_trRingDrops/g_frameTrDrops)
 * + 1 ODS par fenêtre d'armement (g_trRingWarned) — le record ND08 du node
 * référent passe. Cap 32 records TR08/frame (compteur g_frameTrRecs, flush
 * log `,tr=%lu`). Échec SEH d'UNE des copies (pixels OU CLUT) → AUCUN
 * octet écrit, g_dumpWrite jamais avancé, g_txSehFails++ (règle « pixel =
 * la valeur seule », style TX) — le texobj est marqué vu AVANT la copie
 * (style g_frameTxEmitted : un multi-node ne retente pas). Lectures de
 * chaîne/champs illisibles (texinfo, T, w/h/entries/palMgr, ptr pixels/
 * CLUT quand requis) → pas de tentative ce node, texobj NON marqué (le
 * node référent suivant retente) ; pal_count illisible (palMgr lisible) →
 * 0 (clut_size 0, pixels seuls — non-fatal). w*h > 65536 ou clut_size >
 * 32768 o → skip garde (g_dumpGuardSkips/g_frameGuardSkips). Le detour
 * draw ne fait JAMAIS tomber le jeu.
 * ---------------------------------------------------------------------------
 * v10 patch — ND08 : footer texture APPEND d'UN u32 APRÈS dropped_ids :
 *   u32 texobj       // *(texinfo+0x10) — la VALEUR T — SEH, 0 si fail
 *                    // (non-fatal, diagnostic — style page_probe TX07 ;
 *                    // clé de mapping décode-side avec le TR08 du texobj)
 * Tous les champs v9 gardent leur offset ; hdr 9 x u32 inchangé ; magic
 * 'ND08' INCHANGÉ — le décodeur distingue v9/v10 par le BUILD id (0x5639/
 * 0x563A) qu'il parse déjà. Fails inchangés : stream ids illisible →
 * id_count=0, dropped_ids=0, hdr.fails++ ; texobj illisible → champ 0 NON
 * fatal. Footer v10 = 24 o de champs u32 (6 x u32 : tpage|mode|clut|
 * id_count|dropped_ids|texobj) + ids[id_count] (pad align u32) →
 * payload_size v10 = 24 (node) + (8 + idx + pad + fvf) + (16 +
 * ceil4(id_count) + 4 + 4). Record ND08 max recomputé = 36 + 24 + (8 + idx
 * 32768 + fvf 131072) + footer 280 = 164 188 o (0x2815C) ⊂
 * GFXPT_DUMP_MAX_NODE_BYTES (0x100C80) — le pin reste inchangé.
 * =========================================================================== */
#define GFXPT_VERSION_TEXT          "v10.1"
#define GFXPT_DUMP_MAGIC            0x3730444Eul        /* 'ND07' (restauré : utilisé par
                                 * le chemin ND07 — kind 0/1 — hdr.magic
                                 * @GFXPT_DumpNode) : le chemin kind2 passe
                                 * au magic ND08 ci-dessous */
/* v9 — magic ND08 : TOUT record geom_kind==2 (footer texture appended).
 * ASCII LE « ND08 » = 4E 44 30 38 → 0x3830444E (famille 'ND07'). */
#define GFXPT_DUMP_MAGIC_ND08       0x3830444Eul        /* 'ND08' */
#define GFXPT_BUILD_ID              0x563Eul    /* build-id u32 dans CHAQUE
                                                 * record (ND07/ND08 champ 9,
                                                 * TX07/TR08 2e u32) — v9 : bump
                                                 * 0x5638 → 0x5639 (leçon lot
                                                 * 13 « déployé ≠ cru
                                                 * déployé ») ; v10 : bump 0x5639 → 0x563A ;
                                                 * v11 : bump 0x563D → 0x563E (slots
                                                 * directs 48/49/50 : chaîne matdesc
                                                 * ctx+0x38 inconditionnelle — CLOSURE
                                                 * walkdirect-texture-chain §10) */
#define GFXPT_DUMP_MAGIC_TX         0x37305458ul        /* 'TX07' */
/* v10 — magic TR08 (ressource texture TIM bataille, UN record par texobj
 * unique par frame — voir le contrat « v10 — FORMAT TR08 »). */
#define GFXPT_DUMP_MAGIC_TR         0x38305254ul        /* 'TR08' */
#define GFXPT_DUMP_RING_BYTES       (64ul * 1024ul * 1024ul)   /* BSS, 64 Mo */
#define GFXPT_DUMP_MAX_FRAME        4096ul              /* records max / frame */
#define GFXPT_DUMP_MAX_NODE_BYTES   0x100C80ul          /* garde payload node/TX — v9 :
                                 * recalcul précis : le record TX07 passe à
                                 * 0x100820 o (hdr 32 + miroir VRAM 0x100000
                                 * + sys_clut_row 0x800) qui DÉPASSE le pin
                                 * v8 0x100480 → pin = 0x100820 + marge
                                 * 0x460 (marge v8 conservée) = 0x100C80
                                 * exact. ND08 : record max recomputé =
                                 * 36 + 24 + (8 + idx 32768 + fvf 131072)
                                 * + footer 276 = 164 184 o (0x28158) ⊂ cap
                                 * — aucun rehaussement ND requis. v10 :
                                 * TR08 = 98 344 o (0x18028) et ND08 =
                                 * 164 188 o (0x2815C, footer +1 u32
                                 * texobj) ⊂ cap inchangé — record max
                                 * effectif du flux = TX07 0x100820. */
#define GFXPT_DUMP_FRAMES           16ul                /* frames par armement */
#define GFXPT_DUMP_VCOUNT_MAX       4096ul
#define GFXPT_DUMP_ICOUNT_MAX       16384ul

/* En-tête 36 octets (v8 — 9 x u32 LE : le 9e champ est le build-id), sans
 * padding (MSVC x86) — en v7 c'était 8 x u32 = 32 o ; le build-id est le
 * 9e u32, APPEND après payload_size (AUCUNE relocation des 8 champs v7). */
typedef struct GFXPT_DumpHdr {
    unsigned long magic;
    unsigned long slot;
    unsigned long seq;
    unsigned long ctx;
    unsigned long nodeAddr;
    unsigned long geomKind;
    unsigned long fails;
    unsigned long payloadSize;   /* octets après ce champ (node[24] + payload ;
                                 * v9 : payload kind2 inclut le footer ND08) */
    unsigned long build;         /* v8 : GFXPT_BUILD_ID (offset 0x20) */
} GFXPT_DumpHdr;

/* v8 — en-tête TX07 (32 o, 8 x u32 LE, sans padding MSVC x86) : build en
 * 2e u32 ; géométrie page (w/h/mode/tpage) dérivée décode-side sur
 * l'adresse — AUCUNE géométrie copiée côté DLL. v9 : 8 x u32 INCHANGÉS —
 * la ligne CLUT système est du PAYLOAD (u8 sys_clut_row[2048] après le
 * miroir), pas un champ d'en-tête. */
typedef struct GFXPT_Tx07Hdr {
    unsigned long magic;
    unsigned long build;
    unsigned long seq;
    unsigned long clut_now;     /* dword_1CA89B8 BRUT (mask & 0x7FFF décode-side) */
    unsigned long vram_base;    /* dword_1CB602C (ptr miroir VRAM, u16/word, pitch 0x800) */
    unsigned long sys_clut_base; /* GFXPT_EA_VRAM_CLUT_LUTB 0x1B47818 (base système, sub_45B920) */
    unsigned long m_B7DB44;
    unsigned long page_probe;   /* *(texinfo+0x10) du 1er node walk texturé du frame */
} GFXPT_Tx07Hdr;

#define GFXPT_DUMP_TX_VRAM_BYTES    0x100000ul  /* miroir VRAM complet 1024x512 u16 */
/* v9 — ligne CLUT système copiée en payload TX07 (2048 o = 64 sous-CLUT ×
 * 32 o ; row choisie par (clut_now & 0x7FFF) >> 6). */
#define GFXPT_DUMP_TX_SYSROW_BYTES  0x800ul
/* Record TX07 = hdr 32 + miroir VRAM 0x100000 + sys_clut_row 0x800 =
 * 0x100820 o (v8 : 0x100020 sans la row) ; cap piné recalé :
 * GFXPT_DUMP_MAX_NODE_BYTES = 0x100C80 o = record TX07 + marge 0x460. */
#define GFXPT_DUMP_TX_REC_BYTES     ((unsigned long)sizeof(GFXPT_Tx07Hdr) \
                                     + GFXPT_DUMP_TX_VRAM_BYTES \
                                     + GFXPT_DUMP_TX_SYSROW_BYTES)

/* v10 — TR08 : caps de record. hdr 10 x u32 = 40 o + pixels w*h (cap
 * 65536 = 256 x 256) + CLUT brut pal_count x pal_entries x 4 (pal_count
 * cap 32 → cap 32768 = 32 x 256 x 4) — record max =
 * 40 + 65536 + 32768 = 98 344 o (0x18028) ⊂ GFXPT_DUMP_MAX_NODE_BYTES
 * (0x100C80, inchangé — TX07 0x100820 reste le max effectif). */
#define GFXPT_DUMP_TR_PIXEL_MAX     65536ul     /* cap pixel_size (w*h) */
#define GFXPT_TR_PAL_COUNT_MAX      32ul        /* cap pal_count */
#define GFXPT_DUMP_TR_CLUT_MAX      32768ul     /* cap clut_size */
#define GFXPT_TR_MAX_FRAME          32ul        /* records TR08 max / frame */
#define GFXPT_RES_SEEN_MAX          64ul        /* entrées dédup texobj per-frame */

/* v10 — en-tête TR08 (40 o, 10 x u32 LE, sans padding MSVC x86) : build en
 * 2e u32 (comme TX07) ; les buffers pixels/CLUT sont APRÈS le hdr dans le
 * ring (payload, pas champs d'en-tête). Adressage palette du MÊME moteur :
 * palette i, couleur j = raw + 4*(entries*i + j) ; l'octet 3 de chaque u32
 * = bit de transparence PSX (STP). */
typedef struct GFXPT_Tr08Hdr {
    unsigned long magic;         /* 'TR08' */
    unsigned long build;         /* GFXPT_BUILD_ID (v10 = 0x563A) */
    unsigned long seq;           /* g_frameSeq au node référent */
    unsigned long texobj;        /* VALEUR de T = *(texinfo+0x10) (clé dédup + footer ND08) */
    unsigned long w;             /* *(T+0x3C) */
    unsigned long h;             /* *(T+0x40) */
    unsigned long pal_entries;   /* *(T+0x5C) (256 pour 8bpp, 16 pour 4bpp) */
    unsigned long pal_count;     /* *(u32*)(M+12), M = *(T+0xA0) — cap 32 */
    unsigned long pixel_size;    /* w*h (cap 65536) */
    unsigned long clut_size;     /* pal_count*pal_entries*4 (cap 32768) */
} GFXPT_Tr08Hdr;

static unsigned char g_dumpRing[GFXPT_DUMP_RING_BYTES];  /* BSS zéro-rempli */
static unsigned long g_dumpWrite;       /* curseur d'écriture absolu (octets) */
static unsigned long g_dumpCommit;      /* curseur flushé (octets) */
static unsigned long g_dumpRecords;     /* global : records écrits */
static unsigned long g_dumpBytes;       /* global : octets écrits (ring) */
static unsigned long g_dumpRingDrops;   /* global : records perdus (ring plein) */
static unsigned long g_dumpSehFails;    /* global : échecs SEH de copie */
static unsigned long g_dumpGuardSkips;  /* global : records refusés par garde */
static unsigned long g_frameSeq;        /* compteur de frames (present dispatch) */
static unsigned long g_capEndSeq;       /* 0 = désarmé ; sinon dernière seq capturée */
static unsigned long g_frameRecords;    /* per-frame : records écrits */
static unsigned long g_frameFails;      /* per-frame : échecs SEH */
static unsigned long g_frameDrops;      /* per-frame : ring plein */
static unsigned long g_frameGuardSkips; /* per-frame : gardes */
static int            g_frameOverflow;  /* cap 4096 records atteint ce frame */

/* v8 — BSS TX07 (capture frame-level du miroir VRAM, spec §6.2 ; zéro-rempli) */
static unsigned long  g_frameTxRecs;    /* per-frame : records TX07 écrits (log tx=N, 0..1) */
static int            g_frameTxEmitted; /* per-frame : 1 = TX07 déjà émis ce frame (dédup pulse) */
static unsigned long  g_frameTxDrops;   /* per-frame : ring plein pour TX07 */
static unsigned long  g_txRingDrops;    /* global : records TX07 perdus (ring plein) */
static unsigned long  g_txSehFails;     /* global : échecs SEH du chemin texture */
static int            g_txRingWarned;   /* ODS ring plein : 1 par fenêtre d'armement max */
static int            g_txSysWarned;    /* v9 : ODS sys_clut_row illisible — 1 par fenêtre max */

/* v10 — BSS TR08 (ressource texture TIM bataille ; zéro-rempli) */
static unsigned long  g_resSeen[GFXPT_RES_SEEN_MAX]; /* per-frame : VALEURS T déjà émises (dédup TR08) */
static unsigned       g_resCount;       /* per-frame : nb d'entrées g_resSeen */
static unsigned long  g_frameTrRecs;    /* per-frame : records TR08 écrits (log tr=N) */
static unsigned long  g_frameTrDrops;   /* per-frame : ring plein pour TR08 */
static unsigned long  g_trRingDrops;    /* global : records TR08 perdus (ring plein) */
static int            g_trRingWarned;   /* ODS ring plein TR08 : 1 par fenêtre max */

/* Copie générique défendue (le detour draw ne doit JAMAIS faire tomber le jeu). */
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
 * v8 — émission du record TX07 : snapshot FRAME-LEVEL du miroir VRAM. Émis
 * UNE fois par frame armé (dédup par pulse — flag per-frame
 * g_frameTxEmitted), sur le PREMIER node walk texturé de la fenêtre.
 * Appelé à la TÊTE de GFXPT_DumpNode pour les slots walk texturés
 * (48–50/57–59/63–64 : texinfo = *(node+0x2C), page = *(texinfo+0x10) ;
 * 51/60 VB batch : geom = *(node+0x2C), page = *(geom+0x10) — mêmes offsets
 * +0x2C puis +0x10 — spec driver-abi-spec.md §6.2-A, decomp
 * 0x43E24A/0x43E356/0x43E692). Deref/lectures/copies TOUTES SEH-défendues
 * (comme v7). Le detour draw ne fait JAMAIS tomber le jeu : tout échec →
 * counters + skip silencieux. Ring BSS partagé avec ND07
 * (g_dumpRing/g_dumpWrite/g_dumpCommit) — aucune IO disque.
 *
 * Miroir VRAM : base = dword_1CB602C (valeur pointeur, lu SEH) ; espace
 * u16, pitch 0x800 mots/row (decomp 0x464F70 @0x465235, 0x464DB0, 0x4653E0,
 * 0x4675C0). Le miroir ENTIER = 1024 u16/row × 512 rows = 0x100000 o et
 * contient TOUTES les pages ET toutes les CLUTs (décode/itération
 * PNG-side OFFLINE sur le miroir complet). vram_base 0/illisible → PAS de
 * record du tout (le miroir = la seule valeur ; g_txSehFails++, flag NON
 * posé — le node walk texturé suivant du frame retente). Copie miroir
 * échouée (SEH) → RIEN écrit, g_dumpWrite jamais avancé (g_txSehFails++).
 * g_frameTxEmitted est posé AVANT la copie : un multi-node frame n'émet
 * JAMAIS deux fois. clut_now = dword contenant word_1CA89B8, copié BRUT
 * (mask & 0x7FFF appliqué décode-side) ; échec → 0 + fails (non-fatal).
 * m_B7DB44 : échec → 0 + fails (non-fatal). page_probe = *(texinfo+0x10)
 * : échec → 0, non-fatal (diagnostic pur). AUCUNE résolution de
 * CLUT/page géométrie côté DLL (contrat §2-2).
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
    unsigned long        need = GFXPT_DUMP_TX_REC_BYTES;

    if (!node)
        return;

    /* Dédup frame : UNE émission TX07 par frame armé (flag per-frame). */
    if (g_frameTxEmitted)
        return;

    /* page_probe : *(texinfo+0x10), texinfo = *(node+0x2C) — champ
     * purement diagnostic décode-side ; échec SEH → 0, non-fatal. */
    if (GFXPT_ReadU32((const char*)node + 0x2C, &holder) && holder != 0)
        (void)GFXPT_ReadU32((const void*)(holder + 0x10), &pageProbe);

    /* clut_now : dword contenant word_1CA89B8 (id CLUT vivant, sub_45B920 :
     * word + 0x7FFF), copié BRUT — mask & 0x7FFF appliqué décode-side.
     * Échec → 0 + fails (non-fatal, record quand même émis). */
    if (!GFXPT_ReadU32((const void*)GFXPT_HostEA(GFXPT_EA_CLUT_ID), &clutNow))
    {
        clutNow = 0;
        fails++;
    }

    /* Base miroir VRAM : dword_1CB602C (valeur pointeur). 0/illisible →
     * PAS de record du tout (miroir = la seule valeur) ; flag non posé :
     * le node walk texturé suivant du frame retente. */
    if (!GFXPT_ReadU32((const void*)GFXPT_HostEA(GFXPT_EA_VRAM_BASE), &vramBase) ||
        vramBase == 0)
    {
        g_txSehFails++;
        return;
    }

    /* Flag RGB555 : lecture SEH du BSS dword_B7DB44 (calibre le chemin
     * décodeur mode-2 de BlitRows ; stocké par AllocTexturePageSlot
     * 0x465117-0x465135 — decomp 0x464F70 : dword_B7DB44 =
     * (*(int*)(hit + 0x44) == 0x7E0), armé mode==2 uniquement). */
    if (!GFXPT_ReadU32((const void*)GFXPT_HostEA(GFXPT_EA_M_B7DB44), &m_B7DB44))
    {
        m_B7DB44 = 0;
        fails++;
    }

    /* Flag posé AVANT la copie : un frame multi-node n'émet jamais deux
     * fois (la base miroir est la même pour tout le frame). */
    g_frameTxEmitted = 1;

    if (need > GFXPT_DUMP_RING_BYTES - (g_dumpWrite - g_dumpCommit))
    {
        g_txRingDrops++;                    /* ring plein : TX seul (le record ND07 du node référent passe) */
        g_frameTxDrops++;
        if (!g_txRingWarned)
        {
            g_txRingWarned = 1;             /* 1 ODS par fenêtre d'armement : pas de spam par frame */
            GFXPT_ODS("gfx_passthrough " GFXPT_VERSION_TEXT
                      ": ring 64 Mo plein pour TX07, snapshot miroir VRAM droppe\n");
        }
        return;
    }

    /* Copie du miroir VRAM ENTIER (0x100000 o) SEH-défendue directement
     * dans le ring. Échec SEH → retour sans rien écrire ni avancer
     * g_dumpWrite ; le record ND07 du node référent reste dans son flux. */
    p = &g_dumpRing[g_dumpWrite];
    if (!GFXPT_CopyBytes(p + sizeof(hdr), (const void*)vramBase,
                         GFXPT_DUMP_TX_VRAM_BYTES))
    {
        g_txSehFails++;                     /* rien écrit (le miroir = la seule valeur) */
        return;                             /* pas de TX07 du tout */
    }

    /* v9 — sys_clut_row[2048] : row CLUT système du clut_now du frame —
     * src = HostEA(GFXPT_EA_SYS_CLUT) + 2048*((clut_now & 0x7FFF) >> 6)
     * (unk_1B47818 = base statique LITTÉRALE ; sub_45B920 : fenêtre CLUT
     * dans la row `clut>>6`, 64 sous-CLUT × 32 o — le grain 16 couleurs =
     * sous-palette par groupe d'id). Échec SEH → 2048 o à zéro + fails
     * (non-fatal, record émis) ; 1 ODS par fenêtre d'armement max. */
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

    hdr.magic = GFXPT_DUMP_MAGIC_TX;
    hdr.build = GFXPT_BUILD_ID;
    hdr.seq = seq;                          /* g_frameSeq au node référent */
    hdr.clut_now = clutNow;                 /* brut ; & 0x7FFF appliqué décode-side */
    hdr.vram_base = vramBase;               /* ptr miroir VRAM (dword_1CB602C) */
    hdr.sys_clut_base = GFXPT_EA_VRAM_CLUT_LUTB;    /* constante : base système CLUT */
    hdr.m_B7DB44 = m_B7DB44;
    hdr.page_probe = pageProbe;             /* diagnostic ; 0 si chaîne illisible */
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
 * v10 — émission du record TR08 (ressource texture TIM bataille) : UN record
 * par texobj unique PAR FRAME (dédup par VALEUR du pointeur T — table
 * per-frame g_resSeen[64]/g_resCount, reset au pulse), sur le PREMIER node
 * walk texturé qui le référence, AVANT le ND08 de CE node. Appelé à la TÊTE
 * de GFXPT_DumpNode juste après GFXPT_TxEmit pour les slots walk texturés
 * (48–50/57–59/63–64 : texinfo = *(node+0x2C) ; 51/60 VB : geom =
 * *(node+0x2C) — mêmes offsets +0x2C puis +0x10 ; T = *(texinfo+0x10) EST la
 * valeur page_probe de TX07). Deref/lectures/copies TOUTES SEH-défendues.
 *
 * Ground truth (chaîne IDB sub_407EB4 → sub_4221E6 → sub_421C41) : w/h =
 * *(T+0x3C/+0x40) ; entries/palette = *(T+0x5C) (256 pour 8bpp, 16 pour
 * 4bpp) ; palMgr M = *(T+0xA0) — pal_count = *(u32*)(M+12) = M[3] à T+0xAC,
 * cap 32 ; CLUT BRUT = *(T+0x60), u32 PAR COULEUR, TOUTES les sous-palettes
 * consécutives (palette i à raw + 4*entries*i ; l'octet 3 de chaque u32 =
 * bit de transparence PSX STP) ; pixels = *(T+0xD8), 1 o/texel (w*h).
 *
 * Échecs : lecture de chaîne (texinfo/T) ou champ T illisible → pas de
 * tentative ce node (texobj NON marqué — le prochain node référent
 * retente) ; pal_count illisible (palMgr lisible) → 0 (clut_size 0, pixels
 * seuls, non-fatal) ; garde taille (w*h > 65536 o ou clut > 32768 o) →
 * skip compté g_dumpGuardSkips/g_frameGuardSkips (non marqué) ; ring
 * plein → drop g_trRingDrops/g_frameTrDrops + 1 ODS par fenêtre
 * (g_trRingWarned) ; échec SEH d'UNE des copies (pixels OU CLUT) → AUCUN
 * record du tout (règle « pixel = la valeur seule », style TX),
 * g_txSehFails++ — texobj marqué vu AVANT la copie (style
 * g_frameTxEmitted : pas de seconde tentative). Cap 32 records TR08/frame
 * (g_frameTrRecs). Le detour draw ne fait JAMAIS tomber le jeu. Ring BSS
 * partagé ND/TX/TR (g_dumpRing/g_dumpWrite/g_dumpCommit) — aucune IO
 * disque. AUCUNE résolution de palette côté DLL (raw_clut copié BRUT).
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

    /* v10.1 — chaîne TIM (live-probe 26/09 + decomp sub_407EB4/sub_421C41) :
     * backend = ctx[0x3C] ? ctx[0x68] : ctx[0x38] (override du walk 0x4178D7) ;
     * v11 = *(backend+20) ; T = *(v11+152) = l'OBJET DONNÉES texture. La clé
     * de dédup ET la clé du footer ND08 = T (VALEUR). Échec | 0 → pas de
     * TR08 ce node (T non marqué : retry au référent suivant). */
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

    /* Dédup par frame par texobj (UN record par texobj unique). */
    for (i = 0; i < g_resCount; ++i)
    {
        if (g_resSeen[i] == texObj)
            return;
    }

    /* Cap 32 records TR08 par frame (au-delà : skip silencieux). */
    if (g_frameTrRecs >= GFXPT_TR_MAX_FRAME)
        return;

    /* Champs T (ground truth ci-dessus). Échec SEH (ou valeur nulle pour
     * w/h/entries/palMgr) → pas de tentative (texobj non marqué). */
    if (!GFXPT_ReadU32((const void*)(texObj + 0x3C), &w) || w == 0)
        return;
    if (!GFXPT_ReadU32((const void*)(texObj + 0x40), &h) || h == 0)
        return;
    if (!GFXPT_ReadU32((const void*)(texObj + 0x5C), &palEntries) ||
        palEntries == 0)
        return;
    if (!GFXPT_ReadU32((const void*)(v11 + 0xA0), &palMgr) || palMgr == 0)
        return;

    /* pal_count = *(u32*)(M+12) (= T+0xAC) — cap 32 (saturé, style
     * id_count) ; illisible (palMgr lisible) → 0 (clut_size 0, pixels
     * seuls — non-fatal). */
    (void)GFXPT_ReadU32((const void*)(palMgr + 0xC), &palCount);
    if (palCount > GFXPT_TR_PAL_COUNT_MAX)
        palCount = GFXPT_TR_PAL_COUNT_MAX;

    /* pixel_size = w*h — cap 65536 ; dépassement → skip (garde). La
     * division évite tout débordement u32 du produit. */
    if (w > GFXPT_DUMP_TR_PIXEL_MAX / h)
    {
        g_dumpGuardSkips++;
        g_frameGuardSkips++;
        return;
    }
    pixelSize = w * h;

    /* clut_size = pal_count * pal_entries * 4 — cap 32768 (= 32 × 256 × 4) ;
     * garantit need = 40 + pixel + clut ≤ 98 344 o (0x18028) par construction. */
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

    /* Buffers à copier : pixels *(T+0xD8), CLUT brut *(T+0x60) — ptrs
     * requis (non nuls) à hauteur des tailles. */
    if (!GFXPT_ReadU32((const void*)(texObj + 0xD8), &pixelBuf) ||
        (pixelSize != 0 && pixelBuf == 0))
        return;
    if (clutSize != 0)
    {
        if (!GFXPT_ReadU32((const void*)(texObj + 0x60), &clutBuf) ||
            clutBuf == 0)
            return;
    }

    /* Marqué vu AVANT les copies (style g_frameTxEmitted : ni ring-drop ni
     * copie SEH ratée ne retentent ce frame). */
    if (g_resCount >= GFXPT_RES_SEEN_MAX)
        return;                             /* table pleine (cap 32 < 64 : inatteignable) */
    g_resSeen[g_resCount++] = texObj;

    need = (unsigned long)sizeof(hdr) + pixelSize + clutSize;

    /* Ring-space style TX07 : plein → drop + 1 ODS par fenêtre d'armement
     * (le ND08 du node référent passe). */
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

    /* Copie pixels (1 o/texel) SEH-défendue directement dans le ring —
     * échec → AUCUN octet écrit ni g_dumpWrite avancé (règle TX « pixel =
     * la valeur seule » — no record at all). */
    p = &g_dumpRing[g_dumpWrite];
    if (!GFXPT_CopyBytes(p + sizeof(hdr), (const void*)pixelBuf, pixelSize))
    {
        g_txSehFails++;
        return;
    }

    /* Copie CLUT BRUT (u32 PAR COULEUR, toutes sous-palettes consécutives)
     * — échec → AUCUN record du tout. */
    if (clutSize &&
        !GFXPT_CopyBytes(p + sizeof(hdr) + pixelSize, (const void*)clutBuf,
                         clutSize))
    {
        g_txSehFails++;
        return;
    }

    hdr.magic = GFXPT_DUMP_MAGIC_TR;
    hdr.build = GFXPT_BUILD_ID;
    hdr.seq = seq;                          /* g_frameSeq au node référent */
    hdr.texobj = texObj;                    /* VALEUR T — clé footer ND08 */
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

/* Chemin d'un fichier sidecar à côté de la DLL (même mécanisme que le CSV). */
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
 * Capture d'un node au vol (appelé depuis chaque wrapper 43–64, synchrone,
 * APRÈS le forward natif — même ordre que la capture v6.1). Écriture ring
 * seule : AUCUNE IO disque ici.
 *
 * v8 — TX07 frame-level : pour les slots walk texturés (48–50/57–59/63–64
 * direct, 51/60 VB batch), le snapshot miroir VRAM (TX07) est émis UNE fois
 * par frame armé (dédup par pulse — g_frameTxEmitted) AVANT la copie du
 * node, sur le PREMIER node walk texturé de la frame, TOUTE de suite après
 * les guards de fenêtre et le guard node. L'émission TX est indépendante
 * du sort du record node (skips/gardes node) : le mapping décodeur se fait
 * par ADRESSE, pas par position de flux (voir le contrat TX07 au-dessus de
 * GFXPT_DumpHdr).
 * v9 — footer ND08 (kind2 only) : footer texture APPEND au payload (voir le
 * contrat « v9 patch » ci-dessus) ; la sélection du magic ND07/ND08 se fait
 * sur geom_kind, l'émission TX07 n'est pas modifiée.
 * v10 — TR08 (ressource texture par texobj) au MÊME point d'émission que
 * TX07 (appel GFXPT_TrEmit juste après GFXPT_TxEmit — dédup g_resSeen) ;
 * footer ND08 étendu du champ texobj (voir contrat « v10 patch »).
 * ------------------------------------------------------------------------- */
static void GFXPT_DumpNode(unsigned slot, const void* ctx, const void* node)
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
    unsigned long        idsPad;
    unsigned long        footerBytes;
    unsigned char        idsStage[256];         /* v9 : copie SEH unique du stream */

    if (g_capEndSeq == 0 || g_frameSeq > g_capEndSeq || g_frameOverflow)
        return;                             /* hors fenêtre ou frame saturé */
    if (g_frameRecords >= GFXPT_DUMP_MAX_FRAME)
    {
        g_frameOverflow = 1;                /* stop capture du frame */
        return;
    }
    if (!node)
        return;                             /* garde : node non nul */

    /* v8 — TX07 frame-level : miroir VRAM une fois par frame armé (premier
     * node walk texturé de la frame), émis AVANT la copie du node (ordre :
     * window guard → TX emit → node copy). L'émission est pour slots walk
     * texturés SEULEMENT (§6.2-A) ; dédup par pulse intégré à
     * GFXPT_TxEmit, ring-drop isolé (node non affecté).
     * v10 — TR08 : ressource texture TIM (UN record par texobj unique par
     * frame, dédup g_resSeen) au MÊME point d'émission, juste après le
     * TX emit — ordre flux : TX07 → TR08 → ND07/ND08. */
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

    /* Closure slot → classe géométrique (table prouvée en tête de bloc). */
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
        /* v9 — footer ND08 : lecture texinfo DÉDIÉE (indépendante du holder
         * de GFXPT_TxEmit) ; échec → 0 (tpage/mode restent 0, diagnostic). */
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
        /* v9 — footer ND08 : texinfo|geom du node (déjà lu) + stream d'ids
         * tel que consommé par le walk natif : ids = *(node+0x28), 1 octet
         * PAR GROUPE (0x43E419/0x43E725), remaining = *(s32*)(node+0x08).
         * Copie SEH UNIQUE (≤ 256 o, 255 émis max) — AUCUN read par groupe.
         * Échec (pointeur SEH fail, 0, ou copie SEH) → id_count=0,
         * dropped_ids=0, compté dans hdr.fails (bloc mis à zéro, style
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
        /* remaining = s32 côté natif ; négatif → énorme non-signé → garde. */
        if (remaining > 0 && perV > 0 && remaining <= GFXPT_DUMP_VCOUNT_MAX / perV)
            vcount = perV * remaining;
        if (remaining > 0 && perI > 0 && remaining <= GFXPT_DUMP_ICOUNT_MAX / perI)
            icount = perI * remaining;
        break;
    default:
        geomKind = 0;                       /* setups : node jamais lu (prouvé) */
        break;
    }

    if (geomKind == 2)
    {
        if (vcount == 0 && icount == 0)
            return;                         /* rien à dessiner */
        if (vcount > GFXPT_DUMP_VCOUNT_MAX || icount > GFXPT_DUMP_ICOUNT_MAX)
        {
            g_dumpGuardSkips++;
            g_frameGuardSkips++;
            return;
        }
    }

    idxBytes = icount * 2ul;
    idxPad = (idxBytes & 3ul) ? (4ul - (idxBytes & 3ul)) : 0ul;
    /* v9 — footer ND08 (kind2 only) : 4 x u32 (tpage/mode/clut/id_count) +
     * ids[id_count] (pad align u32) + dropped_ids u32 toujours présent.
     * v10 : +1 u32 texobj APPEND en fin — 6 x u32 always-present (24 o)
     * + ids. */
    idsPad = (idCount & 3ul) ? (4ul - (idCount & 3ul)) : 0ul;
    footerBytes = (geomKind == 2)
                ? (16ul + idCount + idsPad + 4ul + 4ul)
                : 0ul;
    payload = (geomKind == 2)
            ? (8ul + idxBytes + idxPad + (vcount * 32ul) + footerBytes)
            : 0ul;
    need = (unsigned long)sizeof(hdr) + (unsigned long)GFXPT_NODE_BYTES + payload;
    if (need > GFXPT_DUMP_MAX_NODE_BYTES)   /* garde (v9 : 0x100C80 — voir define) */
    {
        g_dumpGuardSkips++;
        g_frameGuardSkips++;
        return;
    }
    if (need > GFXPT_DUMP_RING_BYTES - (g_dumpWrite - g_dumpCommit))
    {
        g_dumpRingDrops++;                  /* ring plein : dégradation silencieuse */
        g_frameDrops++;
        return;
    }

    /* v9 — inputs du footer ND08 lus ICI (après gardes/ring — un drop ring
     * ne paie pas les lectures) ; échecs SEH → 0, non-fatal (diagnostic,
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
            /* v10.3 — footer texobj = T via la CHAÎNE ctx (la même que
             * GFXPT_TrEmit : backend = ctx[0x3C] ? ctx[0x68] : ctx[0x38] ;
             * v11 = *(backend+20) ; T = *(v11+152)) — *(texinfo+0x10) pointait
             * le mauvais objet (le backend, pas les données). */
            /* v11 — slots DIRECTS 48/49/50 : sub_43E0E2 lit matdesc =
             * *(ctx+0x38) INCONDITIONNELLEMENT (@0x43e0f3-f6) — le branchement
             * ctx+0x3C est le backend des VB batch (51/60) et dead-end pour
             * les directs (sonde live 26/09 : texobj=0 sur tous les records
             * slot 49). Chaîne : texobj = *(matdesc+0x14) [@0x4415a7,
             * @0x41F011] ; T = *(texobj+152) [@0x41F038, w/h @0x4202C1/
             * 0x4202D3]. Même espace de valeurs que les clés TR08. La capture
             * in-detour EST la sonde du champ transitoire (post-hoc faussé
             * par le rendu pause — CLOSURE walkdirect §10). */
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
    }

    hdr.magic = (geomKind == 2) ? GFXPT_DUMP_MAGIC_ND08 : GFXPT_DUMP_MAGIC;
    hdr.slot = (unsigned long)slot;
    hdr.seq = g_frameSeq;
    hdr.ctx = (unsigned long)ctx;
    hdr.nodeAddr = (unsigned long)node;
    hdr.geomKind = geomKind;
    hdr.fails = 0;
    hdr.payloadSize = (unsigned long)GFXPT_NODE_BYTES + payload;
    hdr.build = GFXPT_BUILD_ID;             /* v8 : 9e u32 (offset 0x20), « déployé ≠ cru » */

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
        /* v10 — footer ND08 APPEND : tpage|mode|clut|id_count|ids[+pad]|
         * dropped_ids|texobj. Slots directs : id_count=0 → ids absents
         * (pad 0), footer 24 o (dropped_ids=0, texobj=0 si chaîne
         * illisible). {51,60} : idsStage déjà copié. */
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
        /* v10 — texobj APPEND après dropped_ids (6e u32 always-present du
         * footer ; le décodeur distingue v9/v10 par le BUILD id). */
        memcpy(p, &texObj, 4ul);
        p += 4ul;
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
 * Pulse present dispatch : seq++, flush ring → disque, reset compteurs frame,
 * contrôle sidecar d'armement. SEUL point d'IO disque du dump v7.
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
        return;
    drainedSeq = g_frameSeq - 1;            /* seq des records flushés */
    if (!GFXPT_BuildSidePath("gfx_passthrough_dump.bin", binPath))
        return;                             /* ring conservé (drops visibles) */
    f = fopen(binPath, "ab");   /* mode BINAIRE : fopen "a" (texte) étend chaque 0x0A
                                   des données en 0D 0A sur disque (+2 o par record
                                   contenant un LF — bug de la campagne 25/09, lot 13) */
    if (!f)
        return;                             /* jamais bloqué : réessai au prochain present */
    fwrite(&g_dumpRing[g_dumpCommit], 1, (size_t)pending, f);
    fclose(f);
    if (GFXPT_BuildSidePath("gfx_passthrough_dump.log", logPath))
    {
        l = fopen(logPath, "a");
        if (l)
        {
            fprintf(l, "frame,seq=%lu,records=%lu,fails=%lu,drops=%lu,guards=%lu,overflow=%d,bytes=%lu,tx=%lu,tr=%lu\n",
                    drainedSeq, g_frameRecords, g_frameFails, g_frameDrops,
                    g_frameGuardSkips, g_frameOverflow, pending, g_frameTxRecs,
                    g_frameTrRecs);
            fclose(l);
        }
    }
    g_dumpCommit = 0;                       /* ring vidé (jamais de wrap) */
    g_dumpWrite = 0;
}

static void GFXPT_DumpArmAtPresent(void)
{
    char path[MAX_PATH];
    char buf[96];

    if (!GFXPT_BuildSidePath("gfx_passthrough.dump", path))
        return;
    if (GetFileAttributesA(path) == INVALID_FILE_ATTRIBUTES)
        return;
    g_capEndSeq = g_frameSeq + (GFXPT_DUMP_FRAMES - 1);   /* seq courant..+15 */
    g_txRingWarned = 0;         /* v8 : 1 ODS « ring plein TX » par fenêtre max */
    g_txSysWarned = 0;          /* v9 : 1 ODS « sys CLUT row illisible » par fenêtre max */
    g_trRingWarned = 0;         /* v10 : 1 ODS « ring plein TR08 » par fenêtre max */
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
    /* v8 — reset TX intra-frame : flag d'émission TX07 (dédup par pulse) +
     * compteurs log `tx=N`. */
    g_frameTxRecs = 0;
    g_frameTxEmitted = 0;
    g_frameTxDrops = 0;
    /* v10 — reset TR08 intra-frame : dédup texobj (table per-frame) +
     * compteurs log `tr=N`. */
    g_frameTrRecs = 0;
    g_frameTrDrops = 0;
    g_resCount = 0;
    GFXPT_DumpArmAtPresent();
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

/* draw-list (slots 43–64) : log + capture + forward (+ dump v7 si armé) */
#define GFXPT_WRAP_LIST(NAME, SLOT)                                           \
static int __cdecl NAME(void* ctx, void* node, void* arg)                     \
{                                                                             \
    GFXPT_PFN_ListFn p = (GFXPT_PFN_ListFn)GFXPT_Native((unsigned)(SLOT));    \
    int r = p ? p(ctx, node, arg) : 0;                                        \
    GFXPT_LogCall((unsigned)(SLOT), ctx, node, arg, 0, r);                    \
    GFXPT_CaptureCall((unsigned)(SLOT), ctx, node, arg);                      \
    GFXPT_DumpNode((unsigned)(SLOT), ctx, node);                              \
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
    /* slot 20 : v6.1 — copie du fnptr natif DDrawAlt (sub_420917). Le no-op
     * ret 0 tuait le jeu en live (run 25/09 : mort immédiate après 2 appels
     * slot 20, dernière trace CSV). Transparence totale = pas de log ce slot. */
    if (nat[20])
        slots[20] = nat[20];
    else
        slots[20] = (void*)Proxy_Slot20;      /* dégradé : natif absent (ne doit pas arriver) */
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

    GFXPT_LogOpen();                    /* CSV créé dès l'entrée factory (trace même si ctor KO) */

    {
        /* Backend natif du proxy : le case vanilla de cette build est DDrawAlt
           (engine+0xBA8=0 → case 0, ctor 0x4257D0). Le ctor OpenGL 0x4252B0
           (case 3) échoue en live sur le port DotEmu (crash 2026-09-23 18:05 :
           present 0x41DF32, AV sur driver nul — journal WER). FF8_PASSTHROUGH_NATIVE=gl
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

/* v6 — PresentWrapC : appelé par le detour du present dispatch (0x41DF0C),
 * PAR FRAME. Au premier appel post-init, le driver natif est installé en
 * engine+0xA74 (case 0 DDrawAlt, boot 100 % natif — prouvé v5.5 :
 * #checkreg,ret=1,sel=0). On l'entoure alors du proxy (capture Mode A) ;
 * le present original tourne ensuite via le proxy → tous les slots,
 * draw lists comprises, passent par nos wrappers. Idempotent et léger
 * (un test non-nul par frame après le wrap). */
static volatile LONG g_presentWrapped;

static void GFXPT_PresentWrapC(void* engine)
{
    void* native;
    void* mem;

    if (!engine)
        return;

    /* v7 — pulsation par frame : seq++, flush ring dump, contrôle sidecar.
     * DOIT tourner à chaque frame, avant le fast-path du wrap. */
    GFXPT_DumpFramePulse();

    if (g_proxy)
        return;                             /* déjà wrappé (fast path par frame) */

    native = *(void**)((DWORD*)engine + (0xA74u / 4));
    if (!native)
        return;                             /* backend pas encore construit */

    g_native = native;
    g_nativeAlive = 1;
    mem = VirtualAlloc(NULL, (SIZE_T)GFXPT_DRIVER_OBJ_BYTES,
                       MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);
    if (!mem)
        return;
    g_proxy = mem;                          /* zero-fill (état inline 9–14) */
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

/* v5.3 — pose un detour E9 générique. preimageLen doit couvrir des
 * instructions COMPLÈTES ; si la preimage contient un call rel32 (E8) à
 * callRel32At (offset), son rel32 est recalculé dans le trampoline. */
static int GFXPT_PlaceHook(unsigned long ea, const BYTE* preimage, int preimageLen,
                           int callRel32At, void* detour, void* volatile* trampolineOut)
{
    BYTE*  target;
    BYTE*  tramp;
    int    trampSize = preimageLen + 5;
    DWORD  oldProtect;
    DWORD  rel32;

    if (*trampolineOut)
        return 1;                           /* déjà posé */

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
        /* call déplacé : recalcule le rel32 (absolu conservé). */
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
}

/* v5.2 — traceur : le jeu logue son boot via OutputDebugString_1 ; on capture
 * la séquence dans le CSV (cap 400 lignes anti-spam). */
static const BYTE GFXPT_ODSPreimage[9]  = { 0x55u, 0x8Bu, 0xECu, 0x51u, 0xE8u,
                                            0xA8u, 0x62u, 0x00u, 0x00u };
/* v6 — preimage du present dispatch : push ebp / mov ebp,esp / push ecx /
 * mov eax,[ebp+8] / push eax — 8 bytes d'instructions complètes, aucun rel32. */
static void* volatile g_odsTrampoline;
static volatile LONG  g_odsCount;

static void GFXPT_ODSTrace(char* msg)
{
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
    static volatile LONG g_hookLogged;
    int r1, r2;

    (void)reserved;

    /* v6 — plus aucun hook sur CheckRegistry (le boot natif doit rester
     * intact) : le wrap se pose au present dispatch, point de consommation
     * du driver, appelé par frame. */
    r1 = GFXPT_PlaceHook(GFXPT_EA_PRESENTDISPATCH, GFXPT_PresentPreimage, 8, -1,
                         (void*)&GFXPT_PresentDetour, &g_pdTrampoline);
    r2 = GFXPT_PlaceHook(GFXPT_EA_ODSTRACE, GFXPT_ODSPreimage, 9, 4,
                         (void*)&GFXPT_ODSDetour, &g_odsTrampoline);

    if (r1 && InterlockedCompareExchange(&g_hookLogged, 1, 0) == 0)
    {
        GFXPT_LogOpen();
        if (g_logFile)
        {
            fprintf(g_logFile, "#hook,present=%d,ods=%d\n", r1, r2);
            fflush(g_logFile);
        }
    }
    return (r1 && r2) ? 1 : 0;
}

/* ===========================================================================
 * DllMain — flag + boot hook v2 (VirtualProtect/memcpy uniquement, pattern
 * FFNx replace_function au DLL_PROCESS_ATTACH ; aucun chargement de lib).
 * Contrainte shutdown 0x409670/FreeLibrary inchangée.
 * =========================================================================== */
static int g_dllAttached = 0;

/* v5.4 — interrupteur par fichier sidecar (manipulable sans env ni rebuild). */
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

BOOL WINAPI DllMain(HINSTANCE hinstDLL, DWORD fdwReason, LPVOID lpvReserved)
{
    char disableFlag[8];

    (void)lpvReserved;
    if (fdwReason == DLL_PROCESS_ATTACH)
    {
        g_dllAttached = 1;
        g_hinstDLL = hinstDLL;
        /* Trace de chargement : CSV créé DÈS DllMain (diagnostic drop test). */
        GFXPT_LogOpen();
        if (g_logFile)
        {
            fprintf(g_logFile, "#dll_loaded\n");
            fflush(g_logFile);
        }
        /* Boot hook v2 actif par défaut (mode AF3DN.P). FF8_PASSTHROUGH_BOOTHOOK=0
           ou le fichier sidecar gfx_passthrough.nohook désactivent (contrôle). */
        if (GFXPT_SideFileExists("gfx_passthrough.nohook"))
        {
            GFXPT_ODS("gfx_passthrough: nohook file present, hooks disabled\n");
        }
        else if (GetEnvironmentVariableA("FF8_PASSTHROUGH_BOOTHOOK", disableFlag,
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
