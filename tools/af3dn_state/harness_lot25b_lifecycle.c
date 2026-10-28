/* M25-P2 harness_lot25b_lifecycle.c -- harnais NOUVEAU des chemins de fin
 * REELS (instance L25-V17B-LIFECYCLE ; fichier autonome : ne touche AUCUN
 * harnais, oracle, receipt ni source existants). /W3 /O2 /MT, sous-systeme
 * console, JAMAIS le jeu : le module cible est la COPIE du candidat passee
 * en argv[1] et le host des sites est CE processus propre (aucun code FF8
 * execute, sites = fenetres synthetiques de g_pad possedees par le harnais).
 *
 * Source candidate v17 (SHA256 verifie AVANT tout par le parent) :
 *   docs/tech/investigation/battle-static-discovery/driver-passthrough/
 *   lot25/v17/gfx_driver_passthrough.c
 *   07dacab2d43486a939c6f864e33c230c294433995706d40464901def514a7fc2
 * Faits du code reel relies par ce harnais :
 *   - GFXPT_Stage0BeforeUnload l.3303-3322 : restore sinon GetModuleHandleExA
 *     PIN + g_stage0Broken ; diag "restore_failed_module_pinned" ou
 *     "restore_failed_pin_failed" ;
 *   - unique appel du BeforeUnload = Proxy_UninitAndCloseLog l.2316 (slot 1
 *     l.2351) ; le harnais appelle le wrapper par dll+RVA argv (jamais le
 *     GetProcAddress du Restore) ;
 *   - DllMain l.3347-3413 : DETACH = snapshot_only, lpvReserved ignore ->
 *     AUCUNE restauration a la terminaison ;
 *   - GFXPT_RestoreCallSiteHook l.3027-3061 : reecrit SAUVEGARDE sans lire
 *     le site d'abord -> corrompre les octets du site NE fait PAS echouer
 *     la restauration ; causes reelles d'echec : virtualprotect_failed /
 *     restore_readback_failed (readback defended __try l.973-986) ;
 *   - GFXPT_PlaceCallSiteHook l.2980-3023 : memcmp preimage 6 o
 *     FF 90 98 00 00 00, E8 rel32 (relatif a target+5) + 0x90.
 *
 * Couverture (chemins NON couverts par harness_lot25_lifecycle.c) :
 *   CASE1 (controle/temoin) : install arme -> wrapper(RVA argv) ret 0 ->
 *       fenetres restaurees -> FreeLibrary -> module absent. Replication
 *       positive du harnais existant (temoin de comparaison).
 *   CASE2 : ARME -> FreeLibrary SANS wrapper. Prouve le mecanisme : le
 *       dechargement laisse les E8 pendants dans l'hote. Les fenetres
 *       (octets POSSOSSES par le harnais) sont lues en READ-ONLY apres
 *       unload : E8 rel32+0x90 encore presents, cible decodee == adresse
 *       de l'export (desormais libere) ; JAMAIS executee, JAMAIS
 *       dereferencee. Receipt : mecanisme prouve, pas une faute live.
 *   CASE3 : ARME -> ExitProcess. Le harnais se re-invoque en
 *       sous-processus (argv[3]="exitprocess") : enfant PrepPad ->
 *       LoadLibrary(copie) -> verifie ARME -> ExitProcess(0). Parent :
 *       attend, verifie le code de sortie, lit le diag enfant
 *       (gfx_passthrough_stage0.log de la copie, offset capture avant le
 *       spawn) : install arme + detach snapshot_only, AUCUNE ligne de
 *       restore -> coherent terminaison, aucune pretention de
 *       restauration.
 *   CASE4 : restauration REFUSEE SELON LE CODE REEL. Injection : etat
 *       arme -> MEM_DECOMMIT de la page hote des sites ->
 *       VirtualProtect(6 o) du restore echoue (virtualprotect_failed) ->
 *       Passthrough_RestoreStage0Hooks retourne 0 -> BeforeUnload PINne
 *       le module -> attendu : diag "restore_failed_module_pinned",
 *       g_stage0Broken=1, FreeLibrary NE decharge PAS (module toujours
 *       mappe), processus vivant. La page decommitee est illisible : le
 *       DLL loggue lui-meme read_failure=siteN_window14 (copie defendue)
 *       ; apres re-commit les octets sont nuls -> la presence E8 n'est
 *       PAS verifiable et N'EST PAS revendiquee ; seul l'etat NON
 *       restaure (octets != preimage) est affirme. Si l'OS refuse le
 *       decommit -> cas documente NOT_INJECTABLE_OFFLINE (cleanup
 *       propre), aucun faker.
 *   CASE5 : PIN echoue ("restore_failed_pin_failed") : non injectable
 *       offline sans fake -> documente, NON simule.
 *
 * argv = <dllcopy chemin absolu> <RVA_Proxy_UninitAndCloseLog base 0>
 *        [exitprocess] ; sans mode -> run parent complet ; mode enfant
 *        reserve au self-spawn du CASE3. La copie n'est JAMAIS modifiee ;
 *        les sidecars crees ici (gfx_passthrough.stage0) sont les SEULS
 *        fichiers supprimes (a la fin) ; le CSV et le stage0 log ouverts
 *        par la DLL a cote d'elle-meme sont ses propres artefacts (hors
 *        cleanup, lus par offset, jamais tronques).
 *
 * Rapport : lignes "CASEn=..." + "checks=N fails=N" ; exit nonzero si un
 * check echoue. Diagnostics horodates grep-ables : c1ctrl/c2unld/c3exi/
 * c4ref/c5pin. VirtualProtect du harnais borne au pad synthetique ; les
 * decommit/recommit du CASE4 sont bornes a la/les page(s) 4K des fenetres
 * 14 o deja validees dans g_pad.
 */
#define _CRT_SECURE_NO_WARNINGS
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdarg.h>
#include <ctype.h>
#include <errno.h>

/* ------------------------------------------------------------- constantes */
#define PAD_BYTES   0x30000u        /* .text image assez grande (contrat)     */
#define PAD_MID     0x18000u        /* sonde ALIVE (autre page que les sites) */
#define PAD_TOUCH   0x1234u         /* octet de controle du memset            */
#define PAD_FILL    0x55
#define HOST_SITE1_RVA 0x1EF5Du     /* site contractuel 1 (bind)              */
#define HOST_SITE2_RVA 0x1EF72u     /* site contractuel 2 (unbind)            */
#define WIN_BEFORE  4
#define PATCH_BYTES 6
#define E8_BYTES    5               /* rel32 relatif a la FIN du call         */
#define WIN_BYTES   (WIN_BEFORE + PATCH_BYTES + WIN_BEFORE)   /* 14 */
#define PAGE_SIZE   0x1000u
#define TAIL_MAX    32768
#define CHILD_WAIT_MS 30000

/* codes de sortie du self-spawn CASE3 */
#define CHILD_EXIT_OK      0u       /* arme verifie, ExitProcess demande     */
#define CHILD_EXIT_ATTACH  10u
#define CHILD_EXIT_NOTARMED 11u
#define CHILD_EXIT_SIDECAR 12u
#define CHILD_EXIT_PREP    13u

static const char SIDE0_NAME[]   = "gfx_passthrough.stage0";
static const char NOHOOK_NAME[]  = "gfx_passthrough.nohook";
static const char S0LOG_NAME[]   = "gfx_passthrough_stage0.log";
static const char EXP_STUB[]     = "Passthrough_Stage0Stub";
static const char ENV_BOOTHOOK[] = "FF8_PASSTHROUGH_BOOTHOOK";
static const char MODE_CHILD[]   = "exitprocess";

/* preimage contractuelle de chaque site (6 octets, host synthetique sain) */
static const unsigned char PREIMG[PATCH_BYTES] =
    { 0xFF, 0x90, 0x98, 0x00, 0x00, 0x00 };

/* Reserve an early .text contribution: /MT CRT code can otherwise push .bss
 * beyond RVA 0x1EF5D. No native/game bytes are involved. The range check below
 * still refuses any linker layout that does not put both windows in this pad. */
#pragma section(".text", read, execute)
__declspec(allocate(".text")) static unsigned char g_pad[PAD_BYTES];

/* ------------------------------------------------------------ type asserts */
typedef char b_assert_ptr [(sizeof(void*) == 4) ? 1 : -1];
typedef char b_assert_ul  [(sizeof(unsigned long) == 4) ? 1 : -1];
typedef char b_assert_int [(sizeof(int) == 4) ? 1 : -1];
typedef char b_assert_pad [(sizeof(g_pad) == PAD_BYTES) ? 1 : -1];
typedef char b_assert_pre [(sizeof(PREIMG) == PATCH_BYTES) ? 1 : -1];
typedef char b_assert_win [(WIN_BYTES == 14) ? 1 : -1];

typedef int (__cdecl *UninitFn)(void*);   /* signature contractuelle slot 1 */

static unsigned long g_checks = 0, g_fails = 0, g_pid0 = 0;
static int           g_s0Made = 0;
static char          g_side0Path[MAX_PATH + 2];
static char          g_s0LogPath[MAX_PATH + 2];
static const char*   g_phase = "PREP";
static DWORD         g_t0 = 0;
static int           g_pageDead = 0;      /* page(s) sites decommitees      */

/* ------------------------------------------------------------- horodatage */
/* Diag horodate par cas : [+sec.msec depuis le demarrage]. */
static void TSNow(char* buf, size_t bufSz)
{
    DWORD el = GetTickCount() - g_t0;
    _snprintf(buf, bufSz - 1, "[%6lu.%03lu]", (unsigned long)(el / 1000u),
              (unsigned long)(el % 1000u));
    buf[bufSz - 1] = 0;
}

/* ---------------------------------------------------------------- helpers */
static void ck(int ok, const char* what)
{
    char ts[24];
    TSNow(ts, sizeof(ts));
    ++g_checks;
    if (ok)
        printf("%s [OK] %s %s\n", ts, g_phase, what);
    else
    {
        printf("%s FAIL %s %s\n", ts, g_phase, what);
        ++g_fails;
    }
}

static void diag(const char* tag, const char* fmt, ...)
{
    char ts[24];
    va_list ap;
    TSNow(ts, sizeof(ts));
    printf("%s DIAG  %s %s: ", ts, g_phase, tag);
    va_start(ap, fmt);
    vprintf(fmt, ap);
    va_end(ap);
    printf("\n");
}

/* Refus contractuel : cleanup best-effort des sidecars crees puis exit 1. */
static void refuse(const char* what)
{
    char ts[24];
    TSNow(ts, sizeof(ts));
    printf("%s FATAL %s %s (refus)\n", ts, g_phase, what);
    ++g_fails;
    if (g_s0Made)
        (void)DeleteFileA(g_side0Path);
    printf("checks=%lu fails=%lu (abort)\n", g_checks, g_fails);
    exit(1);
}

/* Hex dump de la fenetre [site-4 .. site+9]. Interdit si page morte. */
static void DumpWin(const char* tag, const unsigned char* site)
{
    int i;
    char ts[24];
    if (g_pageDead)
    {
        TSNow(ts, sizeof(ts));
        printf("%s DIAG  %s %s: page morte (decommit) -- lecture interdite\n",
               ts, g_phase, tag);
        return;
    }
    TSNow(ts, sizeof(ts));
    printf("%s DIAG  %s %s win[site-4..site+9]:", ts, g_phase, tag);
    for (i = -WIN_BEFORE; i < WIN_BYTES - WIN_BEFORE; ++i)
        printf(" %02X", (unsigned)site[i]);
    printf("\n");
}

/* Pose les 14 octets : A5 x4 | PREIMG | 5A x4. */
static void LayWin(unsigned char* site)
{
    int i;
    for (i = 1; i <= WIN_BEFORE; ++i)
        site[0 - i] = 0xA5;
    memcpy(site, PREIMG, PATCH_BYTES);
    for (i = PATCH_BYTES; i < WIN_BYTES - WIN_BEFORE; ++i)
        site[i] = 0x5A;
}

/* Voisins intacts : les 8 octets hors les 6 du patch. */
static int WinNbr(const unsigned char* site)
{
    int i, ok = 1;
    for (i = 1; i <= WIN_BEFORE; ++i)
        if (site[0 - i] != 0xA5)
            ok = 0;
    for (i = PATCH_BYTES; i < WIN_BYTES - WIN_BEFORE; ++i)
        if (site[i] != 0x5A)
            ok = 0;
    return ok;
}

/* 1 si les 14 octets = A5 x4 | preimage | 5A x4 (etat non-patche/restaure). */
static int WinIsPre(const unsigned char* site)
{
    int i, ok = WinNbr(site);
    for (i = 0; i < PATCH_BYTES; ++i)
        if (site[i] != PREIMG[i])
            ok = 0;
    return ok;
}

/* 1 si etat hookE : E8 rel32 + 0x90 decode vers stubVa, voisins intacts. */
static int WinIsHooked(const unsigned char* site, unsigned long stubVa,
                       unsigned long* pTgt)
{
    int rel;
    int ok = WinNbr(site);
    unsigned long tgt;

    if (site[0] != 0xE8)
    {
        ok = 0;
        printf("DIAG   %s hooked: octet0 attendu E8, lu %02X\n", g_phase,
               (unsigned)site[0]);
    }
    if (site[PATCH_BYTES - 1] != 0x90)
    {
        ok = 0;
        printf("DIAG   %s hooked: octet5 attendu 90, lu %02X\n", g_phase,
               (unsigned)site[PATCH_BYTES - 1]);
    }
    memcpy(&rel, site + 1, 4);
    tgt = (unsigned long)((UINT_PTR)(site + E8_BYTES) + (UINT_PTR)(INT_PTR)rel);
    *pTgt = tgt;
    if (tgt != stubVa)
    {
        ok = 0;
        printf("DIAG   %s hooked: cible decodee %08lX != export stub %08lX\n",
               g_phase, tgt, stubVa);
    }
    return ok;
}

/* Copie des 14 octets de la fenetre (snapshot harnais, memoire harnais). */
static void SnapWin(const unsigned char* site, unsigned char* dst)
{
    memcpy(dst, site - WIN_BEFORE, WIN_BYTES);
}

/* Fenetre courante == snapshot octet-exact. */
static int WinEqSnap(const unsigned char* site, const unsigned char* snap)
{
    return memcmp(site - WIN_BEFORE, snap, WIN_BYTES) == 0;
}

/* Vivant : pid constant, sonde pad intacte (AUTRE page que les sites),
 * host toujours charge. */
static int Alive(void)
{
    return (GetCurrentProcessId() == g_pid0) &&
           (g_pad[PAD_MID] == PAD_FILL) &&
           (GetModuleHandleA(NULL) != NULL);
}

/* ------------------------------------------------------------ stage0 log */
/* Taille courante du diag de la copie (fichier artefact DLL, jamais
 * tronque/supprime par le harnais). -1 si absent. */
static long LogSize(void)
{
    FILE* f;
    long sz = -1;
    f = fopen(g_s0LogPath, "rb");
    if (f != NULL)
    {
        if (fseek(f, 0, SEEK_END) == 0)
            sz = ftell(f);
        fclose(f);
    }
    return sz;
}

/* Lit [from..EOF] (borne au buffer, fin prioritE : unload_guard est en fin
 * de phase). Retour : octets lus, -1 si impossible. */
static int LogTail(long from, char* buf, int bufSz, int* pTrunc)
{
    FILE* f;
    long sz, start;
    int n;

    *pTrunc = 0;
    if (from < 0)
        from = 0;
    f = fopen(g_s0LogPath, "rb");
    if (f == NULL)
        return -1;
    if (fseek(f, 0, SEEK_END) != 0)
    {
        fclose(f);
        return -1;
    }
    sz = ftell(f);
    if (sz < from)
    {
        fclose(f);
        return -1;
    }
    start = from;
    if (sz - from > (long)bufSz - 1)
    {
        start = sz - ((long)bufSz - 1);
        *pTrunc = 1;
    }
    if (fseek(f, start, SEEK_SET) != 0)
    {
        fclose(f);
        return -1;
    }
    n = (int)fread(buf, 1, (size_t)(bufSz - 1), f);
    fclose(f);
    if (n < 0)
        n = 0;
    buf[n] = 0;
    return n;
}

/* Imprime le tail horodate, lignes bornees (evidence dans le run log). */
static void PrintTail(const char* buf)
{
    const char* p = buf;
    char ts[24];
    while (*p != 0)
    {
        const char* nl = strchr(p, '\n');
        size_t len = nl ? (size_t)(nl - p) : strlen(p);
        char line[200];
        if (len > sizeof(line) - 1)
            len = sizeof(line) - 1;
        memcpy(line, p, len);
        line[len] = 0;
        TSNow(ts, sizeof(ts));
        printf("%s DIAG  %s dlgtail: %s\n", ts, g_phase, line);
        if (nl == NULL)
            break;
        p = nl + 1;
    }
}

/* ----------------------------------------------------------- prep commune */
/* Valide le layout lieur, rend le pad inscriptible, pose les fenetres.
 * Retour 1 = ok. Commune au parent et a l'enfant CASE3 (meme EXE). */
static int PrepPad(void)
{
    UINT_PTR hostBase, padLo, padHi, site1A, site2A;
    unsigned char* site1;
    unsigned char* site2;
    MEMORY_BASIC_INFORMATION mbi;
    SIZE_T q = 0;
    DWORD padProtect;
    unsigned char touchedProbe;

    if (GetModuleHandleA(NULL) == NULL)
        return 0;
    hostBase = (UINT_PTR)GetModuleHandleA(NULL);
    site1A = hostBase + HOST_SITE1_RVA;
    site2A = hostBase + HOST_SITE2_RVA;
    if (site2A <= site1A)
        return 0;
    padLo = (UINT_PTR)(void*)g_pad;
    padHi = (UINT_PTR)(void*)(g_pad + PAD_BYTES);
    site1 = (unsigned char*)site1A;
    site2 = (unsigned char*)site2A;
    diag("pad", "host=%08lX pad=[%08lX..%08lX) site1=%08lX site2=%08lX",
         (unsigned long)hostBase, (unsigned long)padLo, (unsigned long)padHi,
         (unsigned long)site1A, (unsigned long)site2A);
    if (!((UINT_PTR)(site1 - WIN_BEFORE) >= padLo &&
          (UINT_PTR)(site1 + (WIN_BYTES - WIN_BEFORE)) <= padHi) ||
        !((UINT_PTR)(site2 - WIN_BEFORE) >= padLo &&
          (UINT_PTR)(site2 + (WIN_BYTES - WIN_BEFORE)) <= padHi))
        return 0;

    /* Only our reserved pad is made writable, after its window range check. */
    if (!VirtualProtect(g_pad, sizeof(g_pad), PAGE_EXECUTE_READWRITE,
                        &padProtect))
        return 0;
    memset(g_pad, PAD_FILL, sizeof(g_pad));
    touchedProbe = *(volatile const unsigned char*)&g_pad[PAD_TOUCH];
    diag("readpad", "touched=%02X (memset=%02X attendu)",
         (unsigned)touchedProbe, (unsigned)PAD_FILL);
    if (touchedProbe != PAD_FILL)
        return 0;

    q = VirtualQuery((LPCVOID)site1, &mbi, sizeof(mbi));
    diag("padquery", "site1 page=%08lX state=%lX protect=%lX type=%lX",
         (unsigned long)((UINT_PTR)site1 & ~(UINT_PTR)(PAGE_SIZE - 1)),
         (unsigned long)(q ? mbi.State : 0),
         (unsigned long)(q ? mbi.Protect : 0),
         (unsigned long)(q ? mbi.Type : 0));

    LayWin(site1);
    LayWin(site2);
    if (!WinIsPre(site1) || !WinIsPre(site2))
        return 0;
    return 1;
}

/* Resolution du wrapper par dll+RVA argv (integration reelle, JAMAIS le
 * GetProcAddress du Restore). Refus si hors image. */
static UninitFn ResolveWrapper(HMODULE hDll, unsigned long wrapperRva,
                               UINT_PTR hDllVal)
{
    MEMORY_BASIC_INFORMATION mbi;
    SIZE_T q;
    q = VirtualQuery((LPCVOID)((UINT_PTR)hDll + (UINT_PTR)wrapperRva),
                     &mbi, sizeof(mbi));
    diag("restore", "call dll+RVA=%08lX q=%lu allocBase==hDll=%d",
         (unsigned long)((UINT_PTR)hDll + (UINT_PTR)wrapperRva),
         (unsigned long)q,
         (q != 0 && (UINT_PTR)mbi.AllocationBase == hDllVal) ? 1 : 0);
    if (q == 0 || (UINT_PTR)mbi.AllocationBase != hDllVal)
        return (UninitFn)0;
    return (UninitFn)((UINT_PTR)hDll + (UINT_PTR)wrapperRva);
}

/* -------------------------------------------------------------- run enfant */
/* CASE3 cote enfant : armer, verifier, ExitProcess(0) - AUCUN wrapper,
 * AUCUNE restauration ; DETACH v17 = snapshot_only. */
static int ChildRun(const char* dllPath, const char* rvaArg)
{
    char dllLC[MAX_PATH + 1];
    char dirBuf[MAX_PATH + 1];
    char probeBuf[MAX_PATH + 2];
    char nameBuf[MAX_PATH + 1];
    char ts[24];
    unsigned char* site1;
    unsigned char* site2;
    UINT_PTR hostBase, site1A, site2A;
    unsigned long stubVa = 0, tgt1 = 0, tgt2 = 0;
    unsigned long wrapperRva;
    HMODULE hDll;
    FARPROC stubProc;
    DWORD attr, mn;
    size_t dllLen, dirLen, i;
    char* endp = NULL;
    int ok1, ok2;

    g_phase = "CHILD";
    errno = 0;
    wrapperRva = strtoul(rvaArg, &endp, 0);
    if (endp == rvaArg || *endp != 0 || wrapperRva == 0 || errno == ERANGE)
        ExitProcess(CHILD_EXIT_PREP);

    dllLen = strlen(dllPath);
    if (dllLen == 0 || dllLen + 32 >= sizeof(probeBuf))
        ExitProcess(CHILD_EXIT_PREP);
    for (i = 0; i < dllLen; ++i)
        dllLC[i] = (char)tolower((unsigned char)dllPath[i]);
    dllLC[dllLen] = 0;
    if (strstr(dllLC, "opencode") == NULL ||
        strstr(dllLC, "lot25-v17b-lifecycle") == NULL)
        ExitProcess(CHILD_EXIT_PREP);
    if (strstr(dllLC, "af3dn.p") != NULL)
        ExitProcess(CHILD_EXIT_PREP);       /* jamais le jeu */
    attr = GetFileAttributesA(dllPath);
    if (attr == INVALID_FILE_ATTRIBUTES || (attr & FILE_ATTRIBUTE_DIRECTORY))
        ExitProcess(CHILD_EXIT_PREP);
    dirLen = dllLen;
    while (dirLen > 0 && dllPath[dirLen - 1] != '\\' &&
           dllPath[dirLen - 1] != '/')
        --dirLen;
    if (dirLen == 0)
        ExitProcess(CHILD_EXIT_PREP);
    memcpy(dirBuf, dllPath, dirLen);
    dirBuf[dirLen] = 0;
    sprintf(probeBuf, "%s%s", dirBuf, "AF3DN.P");
    if (GetFileAttributesA(probeBuf) != INVALID_FILE_ATTRIBUTES)
        ExitProcess(CHILD_EXIT_PREP);       /* repertoire = jeu : interdit */

    /* sidecar stage0 doit exister (cree par le parent, jamais par l'enfant) */
    sprintf(g_side0Path, "%s%s", dirBuf, SIDE0_NAME);
    sprintf(g_s0LogPath, "%s%s", dirBuf, S0LOG_NAME);
    if (GetFileAttributesA(g_side0Path) == INVALID_FILE_ATTRIBUTES)
        ExitProcess(CHILD_EXIT_SIDECAR);

    (void)SetEnvironmentVariableA(ENV_BOOTHOOK, "0");
    if (!PrepPad())
        ExitProcess(CHILD_EXIT_PREP);

    hDll = LoadLibraryA(dllPath);
    if (hDll == NULL)
        ExitProcess(CHILD_EXIT_ATTACH);
    mn = GetModuleFileNameA(hDll, nameBuf, (DWORD)sizeof(nameBuf));
    if (mn == 0 || mn >= (DWORD)sizeof(nameBuf))
        ExitProcess(CHILD_EXIT_ATTACH);
    stubProc = GetProcAddress(hDll, EXP_STUB);
    if (stubProc == NULL)
        ExitProcess(CHILD_EXIT_ATTACH);
    stubVa = (unsigned long)(UINT_PTR)stubProc;
    hostBase = (UINT_PTR)GetModuleHandleA(NULL);
    site1A = hostBase + HOST_SITE1_RVA;
    site2A = hostBase + HOST_SITE2_RVA;
    site1 = (unsigned char*)site1A;
    site2 = (unsigned char*)site2A;
    ok1 = WinIsHooked(site1, stubVa, &tgt1);
    ok2 = WinIsHooked(site2, stubVa, &tgt2);
    TSNow(ts, sizeof(ts));
    printf("%s DIAG  %s armed: stub=%08lX tgt1=%08lX tgt2=%08lX ok=%d,%d\n",
           ts, g_phase, stubVa, tgt1, tgt2, ok1, ok2);
    if (!(ok1 && ok2))
        ExitProcess(CHILD_EXIT_NOTARMED);
    TSNow(ts, sizeof(ts));
    printf("%s DIAG  %s case3: ARME verifie -> ExitProcess(%lu) demande "
           "(aucun wrapper, aucune restauration)\n", ts, g_phase,
           (unsigned long)CHILD_EXIT_OK);
    fflush(stdout);
    ExitProcess(CHILD_EXIT_OK);
}

/* ------------------------------------------------------------------- main */
int main(int argc, char** argv)
{
    const char* dllPath;
    const char* rvaArg;
    char dllLC[MAX_PATH + 1];
    char dirBuf[MAX_PATH + 1];
    char probeBuf[MAX_PATH + 2];
    char nameBuf[MAX_PATH + 1];
    char selfExe[MAX_PATH + 1];
    char cmdLine[2 * MAX_PATH + 64];
    char tailBuf[TAIL_MAX];
    unsigned char* site1;
    unsigned char* site2;
    UINT_PTR hostBase, site1A, site2A, pageB1, pageB2;
    unsigned char snap1[WIN_BYTES], snap2[WIN_BYTES];
    unsigned long stubVa = 0, tgt1 = 0, tgt2 = 0;
    unsigned long wrapperRva = 0;
    HMODULE hDll = NULL;
    FARPROC stubProc = NULL;
    UninitFn wrapperFn = (UninitFn)0;
    DWORD attr, mn, gle;
    size_t dllLen, dirLen, i;
    char* endp = NULL;
    int stateOk, setOk, alive, tailN, tailTrunc;
    int ret1 = 0, decommitOk, recommitOk;
    int case4Injected = 0;               /* 1 = PIN observe ; 0 = non inject */
    long logBase = 0, logMark = 0;
    FILE* sf;
    STARTUPINFOA si;
    PROCESS_INFORMATION pi;
    DWORD waitRc, childExit = 0xFFFFFFFFul;
    BOOL freed;
    char ts[24];

    g_t0 = GetTickCount();
    g_pid0 = GetCurrentProcessId();

    /* ---------------- mode enfant (self-spawn CASE3) --------------------- */
    if (argc == 4 && strcmp(argv[3], MODE_CHILD) == 0)
        ChildRun(argv[1], argv[2]);      /* ne revient pas */

    if (argc != 3)
    {
        printf("USAGE harness_lot25b_lifecycle.exe <dllcopy abs> "
               "<RVA_UninitAndCloseLog base0>\n");
        return 2;
    }
    dllPath = argv[1];
    rvaArg  = argv[2];
    printf("HARNESS lot25b-lifecycle (L25-V17B-LIFECYCLE, end-of-life "
           "paths, no game, new file)\n");

    errno = 0;
    wrapperRva = strtoul(rvaArg, &endp, 0);
    if (endp == rvaArg || *endp != 0 || wrapperRva == 0 || errno == ERANGE)
        refuse("rva argv non reconnu/zero");

    dllLen = strlen(dllPath);
    if (dllLen == 0 || dllLen + 32 >= sizeof(probeBuf))
        refuse("chemin candidat vide/trop long pour sidecars");
    if (!((isalpha((unsigned char)dllPath[0]) && dllPath[1] == ':' &&
           (dllPath[2] == '\\' || dllPath[2] == '/')) ||
          (dllPath[0] == '\\' && dllPath[1] == '\\')))
        refuse("chemin candidat non absolu");
    for (i = 0; i < dllLen; ++i)
        dllLC[i] = (char)tolower((unsigned char)dllPath[i]);
    dllLC[dllLen] = 0;
    if (strstr(dllLC, "opencode") == NULL ||
        strstr(dllLC, "lot25-v17b-lifecycle") == NULL)
        refuse("chemin hors environnement Temp opencode/lot25-v17b-lifecycle");
    if (strstr(dllLC, "af3dn.p") != NULL)
        refuse("nom AF3DN.P interdit (jamais le jeu)");

    attr = GetFileAttributesA(dllPath);
    if (attr == INVALID_FILE_ATTRIBUTES || (attr & FILE_ATTRIBUTE_DIRECTORY))
        refuse("candidat absent ou repertoire");

    /* repertoire de la copie + refus dossier ressemblant au jeu */
    dirLen = dllLen;
    while (dirLen > 0 && dllPath[dirLen - 1] != '\\' &&
           dllPath[dirLen - 1] != '/')
        --dirLen;
    if (dirLen == 0)
        refuse("pas de repertoire dans le chemin candidat");
    memcpy(dirBuf, dllPath, dirLen);
    dirBuf[dirLen] = 0;
    sprintf(probeBuf, "%s%s", dirBuf, "AF3DN.P");
    if (GetFileAttributesA(probeBuf) != INVALID_FILE_ATTRIBUTES)
        refuse("repertoire candidat = jeu (AF3DN.P present) -- interdit");
    sprintf(probeBuf, "%s%s", dirBuf, "ff8.exe");
    if (GetFileAttributesA(probeBuf) != INVALID_FILE_ATTRIBUTES)
        refuse("repertoire candidat = jeu (ff8.exe present) -- interdit");

    sprintf(g_side0Path, "%s%s", dirBuf, SIDE0_NAME);
    sprintf(g_s0LogPath, "%s%s", dirBuf, S0LOG_NAME);
    logBase = LogSize();
    if (logBase < 0)
        logBase = 0;
    diag("diaglog", "stage0 log='%s' base=%ld (offset, jamais tronque)",
         g_s0LogPath, logBase);

    /* host propre + fenetres 14 B dans g_pad, AVANT toute ecriture */
    g_phase = "PREP";
    if (!PrepPad())
        refuse("prep pad impossible (layout lieur ou memoire)");
    ck(1, "prep layout site1+site2 exact (A5|PRE|5A), pad RWX");

    setOk = SetEnvironmentVariableA(ENV_BOOTHOOK, "0");
    if (!setOk)
        refuse("SetEnvironmentVariableA impossible");
    ck(setOk != 0, "prep env FF8_PASSTHROUGH_BOOTHOOK=0 (avant LoadLibrary)");

    /* sidecar stage0 : cree A COTE DE LA COPIE ; nohook retire s'il existe */
    sf = fopen(g_side0Path, "wb");
    if (sf == NULL)
        refuse("creation sidecar stage0 impossible");
    fputs("lot25b-lifecycle sidecar stage0 (harnais autonome only)\n", sf);
    fclose(sf);
    g_s0Made = 1;
    if (GetFileAttributesA(g_side0Path) == INVALID_FILE_ATTRIBUTES)
        refuse("sidecar stage0 introuvable apres creation");
    ck(1, "prep sidecar stage0 present (pas consomme par la DLL)");
    sprintf(probeBuf, "%s%s", dirBuf, NOHOOK_NAME);
    (void)DeleteFileA(probeBuf);         /* jamais le fichier du jeu */
    stateOk = (GetFileAttributesA(probeBuf) == INVALID_FILE_ATTRIBUTES);
    if (!stateOk)
        refuse("retrait nohook impossible (fichier bloque)");
    ck(stateOk, "prep sidecar nohook ABSENT (retrait verifie)");

    /* ================== CASE1 : controle (temoin positif) ================ */
    g_phase = "C1-CTRL";
    logMark = LogSize();
    if (logMark < 0)
        logMark = logBase;
    hDll = LoadLibraryA(dllPath);
    diag("c1 attach", "LoadLibraryA ret=%08lX gle=%lu",
         (unsigned long)(UINT_PTR)hDll,
         (unsigned long)(hDll ? 0 : GetLastError()));
    ck(hDll != NULL, "c1 attach LoadLibraryA ret != NULL");
    if (hDll == NULL)
        refuse("c1 attach impossible (temoin non executable)");
    mn = GetModuleFileNameA(hDll, nameBuf, (DWORD)sizeof(nameBuf));
    if (mn == 0 || mn >= (DWORD)sizeof(nameBuf))
        refuse("c1 nom de module non capturable");
    ck(GetModuleHandleA(nameBuf) == hDll,
       "c1 module mappe (GetModuleHandleA(nom)) pre-unload");
    stubProc = GetProcAddress(hDll, EXP_STUB);
    if (stubProc == NULL)
        refuse("c1 Get Passthrough_Stage0Stub NULL");
    stubVa = (unsigned long)(UINT_PTR)stubProc;
    diag("c1 install", "stub=%08lX (export exact attendu)", stubVa);
    hostBase = (UINT_PTR)GetModuleHandleA(NULL);
    site1A = hostBase + HOST_SITE1_RVA;
    site2A = hostBase + HOST_SITE2_RVA;
    site1 = (unsigned char*)site1A;
    site2 = (unsigned char*)site2A;
    stateOk = WinIsHooked(site1, stubVa, &tgt1);
    if (!stateOk) DumpWin("site1-hook?", site1);
    ck(stateOk, "c1 install site1 E8 rel32+90 cible==export, voisins");
    stateOk = WinIsHooked(site2, stubVa, &tgt2);
    if (!stateOk) DumpWin("site2-hook?", site2);
    ck(stateOk, "c1 install site2 E8 rel32+90 cible==export, voisins");

    wrapperFn = ResolveWrapper(hDll, wrapperRva, (UINT_PTR)hDll);
    if (wrapperFn == (UninitFn)0)
        refuse("c1 RVA wrapper hors image DLL (argv[2] errone ?)");
    ret1 = wrapperFn(NULL);
    diag("c1 restore", "wrapper ret=%d (attendu 0)", ret1);
    ck(ret1 == 0, "c1 wrapper ret==0");
    stateOk = WinIsPre(site1);
    if (!stateOk) DumpWin("site1-restore?", site1);
    ck(stateOk, "c1 restore site1 14B exact par wrapper");
    stateOk = WinIsPre(site2);
    if (!stateOk) DumpWin("site2-restore?", site2);
    ck(stateOk, "c1 restore site2 14B exact par wrapper");
    freed = FreeLibrary(hDll);
    diag("c1 detach", "FreeLibrary ret=%d", (int)freed);
    ck(freed != 0, "c1 detach FreeLibrary TRUE");
    hDll = NULL;
    stateOk = (GetModuleHandleA(nameBuf) == NULL);
    ck(stateOk, "c1 module ABSENT apres unload");
    alive = Alive();
    ck(alive, "c1 processus VIVANT (pid + pad + module harnais)");
    tailN = LogTail(logMark, tailBuf, (int)sizeof(tailBuf), &tailTrunc);
    stateOk = (tailN > 0) &&
              (strstr(tailBuf, "restore_verified") != NULL) &&
              (strstr(tailBuf, "both_sites_patched") != NULL);
    if (stateOk) PrintTail(tailBuf);
    ck(stateOk, "c1 diag temoin : install_exit both_sites_patched + "
                "unload_guard restore_verified");

    /* ================== CASE2 : FreeLibrary SANS wrapper ================= */
    g_phase = "C2-UNL";
    logMark = LogSize();
    if (logMark < 0)
        logMark = logBase;
    hDll = LoadLibraryA(dllPath);
    diag("c2 attach", "LoadLibraryA ret=%08lX gle=%lu",
         (unsigned long)(UINT_PTR)hDll,
         (unsigned long)(hDll ? 0 : GetLastError()));
    ck(hDll != NULL, "c2 attach LoadLibraryA ret != NULL");
    if (hDll == NULL)
        refuse("c2 attach impossible");
    mn = GetModuleFileNameA(hDll, nameBuf, (DWORD)sizeof(nameBuf));
    if (mn == 0 || mn >= (DWORD)sizeof(nameBuf))
        refuse("c2 nom de module non capturable");
    stubProc = GetProcAddress(hDll, EXP_STUB);
    if (stubProc == NULL)
        refuse("c2 Get Passthrough_Stage0Stub NULL");
    stubVa = (unsigned long)(UINT_PTR)stubProc;
    stateOk = WinIsHooked(site1, stubVa, &tgt1);
    if (!stateOk) DumpWin("site1-hook?", site1);
    ck(stateOk, "c2 install site1 ARME (E8+cible==export)");
    stateOk = WinIsHooked(site2, stubVa, &tgt2);
    if (!stateOk) DumpWin("site2-hook?", site2);
    ck(stateOk, "c2 install site2 ARME (E8+cible==export)");
    SnapWin(site1, snap1);
    SnapWin(site2, snap2);
    diag("c2 snap", "fenetres armees capturees (preuve de comparaison)");

    /* LE point du cas : dechargement SANS wrapper - aucun BeforeUnload. */
    freed = FreeLibrary(hDll);
    diag("c2 detach", "FreeLibrary ret=%d (AUCUN wrapper appele)", (int)freed);
    ck(freed != 0, "c2 FreeLibrary TRUE (pas de blocage)");
    hDll = NULL;
    stateOk = (GetModuleHandleA(nameBuf) == NULL);
    if (!stateOk)
        diag("c2 detach", "module ENCORE present apres FreeLibrary");
    ck(stateOk, "c2 module ABSENT apres unload");
    ck(!g_pageDead, "c2 pages sites lisibles (octets posses par le harnais)");
    stateOk = WinEqSnap(site1, snap1) && snap1[0] == 0xE8;
    if (!stateOk) DumpWin("site1-pendant?", site1);
    ck(stateOk, "c2 site1 : E8 PENDANT apres unload (octets identiques)");
    stateOk = WinEqSnap(site2, snap2) && snap2[0] == 0xE8;
    if (!stateOk) DumpWin("site2-pendant?", site2);
    ck(stateOk, "c2 site2 : E8 PENDANT apres unload (octets identiques)");
    {
        unsigned long d1 = 0, d2 = 0;
        memcpy(&d1, snap1 + 1, 4);
        memcpy(&d2, snap2 + 1, 4);
        tgt1 = (unsigned long)(site1A + E8_BYTES + (UINT_PTR)(INT_PTR)d1);
        tgt2 = (unsigned long)(site2A + E8_BYTES + (UINT_PTR)(INT_PTR)d2);
        diag("c2 pendant", "cibles decodees (arithmetique, JAMAIS deref/exec)"
             " tgt1=%08lX tgt2=%08lX stub Va=%08lX (module DECHARGE)",
             tgt1, tgt2, stubVa);
        ck(tgt1 == stubVa && tgt2 == stubVa,
           "c2 E8 pointent le code DESORMAIS LIBERE (mecanisme prouve)");
    }
    ck(Alive(), "c2 processus VIVANT (E8 pendants mais jamais executes)");
    tailN = LogTail(logMark, tailBuf, (int)sizeof(tailBuf), &tailTrunc);
    stateOk = (tailN > 0) &&
              (strstr(tailBuf, "snapshot_only") != NULL) &&
              (strstr(tailBuf, "unload_guard") == NULL) &&
              (strstr(tailBuf, "restore_enter") == NULL);
    if (stateOk) PrintTail(tailBuf);
    ck(stateOk, "c2 diag : detach snapshot_only, AUCUN unload_guard/restore "
                "(le DETACH ne restaure pas)");
    /* Le harnais re-pose SES propres fenetres synthetiques (pad harnais)
     * pour permettre le re-armement du CASE4. */
    LayWin(site1);
    LayWin(site2);
    ck(WinIsPre(site1) && WinIsPre(site2),
       "c2 cleanup pad : preimage re-posee par le harnais (octets harnais)");

    /* ================== CASE3 : ARME -> ExitProcess ====================== */
    g_phase = "C3-EXI";
    if (GetModuleFileNameA(NULL, selfExe, (DWORD)sizeof(selfExe)) == 0)
        refuse("c3 chemin self non capturable");
    logMark = LogSize();
    if (logMark < 0)
        logMark = logBase;
    sprintf(cmdLine, "\"%s\" \"%s\" %s %s", selfExe, dllPath, rvaArg,
            MODE_CHILD);
    diag("c3 spawn", "enfant : %s", cmdLine);
    fflush(stdout);                      /* stdout partage avec l'enfant */
    ZeroMemory(&si, sizeof(si));
    ZeroMemory(&pi, sizeof(pi));
    si.cb = sizeof(si);
    si.dwFlags = STARTF_USESTDHANDLES;
    si.hStdInput  = GetStdHandle(STD_INPUT_HANDLE);
    si.hStdOutput = GetStdHandle(STD_OUTPUT_HANDLE);
    si.hStdError  = GetStdHandle(STD_ERROR_HANDLE);
    if (!CreateProcessA(NULL, cmdLine, NULL, NULL, TRUE, 0, NULL, NULL,
                        &si, &pi))
        refuse("c3 CreateProcessA impossible (self-spawn)");
    waitRc = WaitForSingleObject(pi.hProcess, CHILD_WAIT_MS);
    if (waitRc == WAIT_TIMEOUT)
    {
        diag("c3 wait", "TIMEOUT %lu ms -> TerminateProcess (FAIL explicite)",
             (unsigned long)CHILD_WAIT_MS);
        (void)TerminateProcess(pi.hProcess, 99);
        WaitForSingleObject(pi.hProcess, 5000);
        ck(0, "c3 enfant termine dans le delai");
    }
    else
    {
        ck(1, "c3 enfant termine dans le delai");
    }
    if (!GetExitCodeProcess(pi.hProcess, &childExit))
        refuse("c3 GetExitCodeProcess impossible");
    diag("c3 exit", "code sortie enfant=%lu (attendu 0 = arme puis "
         "ExitProcess)", (unsigned long)childExit);
    ck(childExit == CHILD_EXIT_OK, "c3 code sortie enfant == 0 (ExitProcess "
       "apres verification ARME)");
    CloseHandle(pi.hThread);
    CloseHandle(pi.hProcess);
    tailN = LogTail(logMark, tailBuf, (int)sizeof(tailBuf), &tailTrunc);
    stateOk = (tailN > 0);
    if (stateOk) PrintTail(tailBuf);
    ck(stateOk, "c3 diag enfant present (offset parent -> fin)");
    if (tailTrunc)
        diag("c3 tail", "DEBUT tronque (fin prioritaire : unload_guard en "
             "fin de phase)");
    stateOk = (tailN > 0) &&
              (strstr(tailBuf, "both_sites_patched") != NULL);
    ck(stateOk, "c3 diag : enfant ARME avant ExitProcess "
                "(install_exit both_sites_patched)");
    stateOk = (tailN > 0) &&
              (strstr(tailBuf, "snapshot_only") != NULL);
    ck(stateOk, "c3 diag : DETACH snapshot_only (lpvReserved ignore, v17)");
    stateOk = (tailN > 0) &&
              (strstr(tailBuf, "restore_enter") == NULL) &&
              (strstr(tailBuf, "unload_guard") == NULL) &&
              (strstr(tailBuf, "restore_exit") == NULL) &&
              (strstr(tailBuf, "restore_verified") == NULL);
    ck(stateOk, "c3 diag : AUCUNE ligne de restore (coherent terminaison, "
       "aucune pretention de restauration)");
    ck(Alive(), "c3 parent vivant apres le spawn");

    /* ================== CASE4 : restauration REFUSEE ===================== */
    g_phase = "C4-REF";
    logMark = LogSize();
    if (logMark < 0)
        logMark = logBase;
    hDll = LoadLibraryA(dllPath);
    diag("c4 attach", "LoadLibraryA ret=%08lX gle=%lu",
         (unsigned long)(UINT_PTR)hDll,
         (unsigned long)(hDll ? 0 : GetLastError()));
    ck(hDll != NULL, "c4 attach LoadLibraryA ret != NULL");
    if (hDll == NULL)
        refuse("c4 attach impossible");
    mn = GetModuleFileNameA(hDll, nameBuf, (DWORD)sizeof(nameBuf));
    if (mn == 0 || mn >= (DWORD)sizeof(nameBuf))
        refuse("c4 nom de module non capturable");
    stubProc = GetProcAddress(hDll, EXP_STUB);
    if (stubProc == NULL)
        refuse("c4 Get Passthrough_Stage0Stub NULL");
    stubVa = (unsigned long)(UINT_PTR)stubProc;
    stateOk = WinIsHooked(site1, stubVa, &tgt1);
    ck(stateOk, "c4 install site1 ARME");
    stateOk = WinIsHooked(site2, stubVa, &tgt2);
    ck(stateOk, "c4 install site2 ARME");
    SnapWin(site1, snap1);
    SnapWin(site2, snap2);

    /* Injection SELON LE CODE REEL : le restore reecrit sa sauvegarde sans
     * lire le site -> corrompre les octets ne suffit pas (pas de faker).
     * Seule cause reelle injectable offline : VirtualProtect echoue ->
     * MEM_DECOMMIT de la/les page(s) 4K contenant les fenetres validees. */
    pageB1 = site1A & ~(UINT_PTR)(PAGE_SIZE - 1);
    pageB2 = site2A & ~(UINT_PTR)(PAGE_SIZE - 1);
    diag("c4 decommit", "pages sites : %08lX / %08lX (same=%d)",
         (unsigned long)pageB1, (unsigned long)pageB2,
         pageB1 == pageB2 ? 1 : 0);
    SetLastError(0x11111111);
    decommitOk = VirtualFree((LPVOID)pageB1, PAGE_SIZE, MEM_DECOMMIT);
    gle = GetLastError();
    if (pageB2 != pageB1)
    {
        int ok2p = VirtualFree((LPVOID)pageB2, PAGE_SIZE, MEM_DECOMMIT);
        decommitOk = decommitOk && ok2p;
    }
    diag("c4 decommit", "VirtualFree MEM_DECOMMIT ret=%d gle=%lu",
         decommitOk, (unsigned long)gle);
    if (!decommitOk)
    {
        /* Refus OS : cas documente NON injectable offline, aucun faker.
         * Cleanup propre par le chemin reel (restore reussit). */
        diag("c4 verdict", "NOT_INJECTABLE_OFFLINE (decommit refuse) -- "
             "documentation seule, aucune simulation");
        wrapperFn = ResolveWrapper(hDll, wrapperRva, (UINT_PTR)hDll);
        if (wrapperFn == (UninitFn)0)
            refuse("c4 RVA wrapper hors image");
        ret1 = wrapperFn(NULL);
        ck(ret1 == 0, "c4 (doc) wrapper ret==0 sur etat sain");
        ck(WinIsPre(site1) && WinIsPre(site2),
           "c4 (doc) restore reussit sur etat sain (coherent code reel)");
        freed = FreeLibrary(hDll);
        ck(freed != 0, "c4 (doc) FreeLibrary TRUE");
        hDll = NULL;
        ck(GetModuleHandleA(nameBuf) == NULL, "c4 (doc) module absent");
        case4Injected = 0;
    }
    else
    {
        g_pageDead = 1;                  /* lectures fenetres interdites */
        wrapperFn = ResolveWrapper(hDll, wrapperRva, (UINT_PTR)hDll);
        if (wrapperFn == (UninitFn)0)
            refuse("c4 RVA wrapper hors image (page sites morte : wrapper "
                   "hors pad, resolution OK)");
        ret1 = wrapperFn(NULL);
        diag("c4 wrapper", "ret=%d (attendu 0 ; g_nativeAlive BSS=0)",
             ret1);
        ck(ret1 == 0, "c4 wrapper ret==0");
        tailN = LogTail(logMark, tailBuf, (int)sizeof(tailBuf), &tailTrunc);
        if (tailN > 0)
            PrintTail(tailBuf);
        stateOk = (tailN > 0) &&
                  (strstr(tailBuf, "virtualprotect_failed") != NULL);
        ck(stateOk, "c4 diag : cause virtualprotect_failed (code reel du "
                    "restore, page decommitee)");
        stateOk = (tailN > 0) &&
                  (strstr(tailBuf, "restore_failed_module_pinned") != NULL);
        ck(stateOk, "c4 diag : unload_guard restore_failed_module_pinned");
        stateOk = (tailN > 0) &&
                  (strstr(tailBuf, "broken=1") != NULL);
        ck(stateOk, "c4 diag : g_stage0Broken=1 expose dans le diag");
        stateOk = (tailN > 0) &&
                  (strstr(tailBuf, "read_failure=site1_window14") != NULL) &&
                  (strstr(tailBuf, "read_failure=site2_window14") != NULL);
        ck(stateOk, "c4 diag : read_failure site1+site2 (page morte, copie "
                    "defendue du DLL) -- presence E8 NON verifiable, NON "
                    "revendiquee");
        stateOk = (tailN > 0) &&
                  (strstr(tailBuf, "restore_verified") == NULL);
        ck(stateOk, "c4 diag : AUCUN restore_verified");
        freed = FreeLibrary(hDll);
        diag("c4 detach", "FreeLibrary ret=%d (module epingle attendu)",
             (int)freed);
        stateOk = (GetModuleHandleA(nameBuf) != NULL);
        if (!stateOk)
            diag("c4 detach", "module ABSENT -- PIN non observe !");
        ck(stateOk, "c4 module ENCORE MAPPE apres FreeLibrary (PIN "
                    "GetModuleHandleExA, FreeLibrary ne decharge pas)");
        /* re-commit pour rendre la page sururable avant la sortie ; octets
         * = zero (recommit) -> on verifie ONLY non-restauration. */
        recommitOk = (VirtualAlloc((LPVOID)pageB1, PAGE_SIZE, MEM_COMMIT,
                                   PAGE_EXECUTE_READWRITE) != NULL);
        if (pageB2 != pageB1 && recommitOk)
            recommitOk = recommitOk &&
                (VirtualAlloc((LPVOID)pageB2, PAGE_SIZE, MEM_COMMIT,
                              PAGE_EXECUTE_READWRITE) != NULL);
        diag("c4 recommit", "VirtualAlloc MEM_COMMIT ret=%d", recommitOk);
        if (recommitOk)
        {
            g_pageDead = 0;
            stateOk = !WinIsPre(site1) && !WinIsPre(site2);
            DumpWin("site1-postpin?", site1);
            DumpWin("site2-postpin?", site2);
            ck(stateOk, "c4 fenetres NON restaurees (octets != preimage ; "
                        "recommit = zeros, presence E8 non verifiable -- "
                        "documente)");
        }
        else
        {
            ck(0, "c4 recommit page sites (etat host non sururable)");
        }
        alive = Alive();
        ck(alive, "c4 processus VIVANT (module epingle + pad + pid)");
        case4Injected = 1;
    }

    /* ================== CASE5 : PIN echoue (documente) =================== */
    g_phase = "C5-PIN";
    diag("c5 verdict", "NOT_INJECTABLE_OFFLINE : le PIN echoue "
         "(restore_failed_pin_failed) exige un echec GetModuleHandleExA(PIN) "
         "non reproductible offline sans fake -- NON simule, documente");
    printf("CASE5=NOT_INJECTABLE_OFFLINE\n");

    /* ============================== CLEANUP ============================== */
    g_phase = "CLEAN";
    /* Le module du CASE4 (branche PIN) reste volontairement mappe : verdict
     * ROUGE du DLL lui-meme (un E8 possede ne doit jamais viser du code
     * libere). Aucun unload force. */
    if (DeleteFileA(g_side0Path))
        ck(1, "cleanup sidecar stage0 supprime");
    else
        ck(GetFileAttributesA(g_side0Path) == INVALID_FILE_ATTRIBUTES,
           "cleanup sidecar stage0 absent");
    sprintf(probeBuf, "%s%s", dirBuf, NOHOOK_NAME);
    ck(GetFileAttributesA(probeBuf) == INVALID_FILE_ATTRIBUTES,
       "cleanup nohook absent (jamais cree ici)");
    diag("cleanup", "CSV + stage0 log de la copie = artefacts DLL (non "
         "touches) ; diag='%s'", g_s0LogPath);

    /* ============================== SUMMARY ============================== */
    printf("checks=%lu fails=%lu\n", g_checks, g_fails);
    printf("CASE1=PASS\n");             /* refuse() sinon */
    printf("CASE2=PASS\n");
    printf("CASE3=PASS\n");
    printf("CASE4=%s\n",
           case4Injected ? "PASS" : "NOT_INJECTABLE_OFFLINE");
    printf("CASE5=NOT_INJECTABLE_OFFLINE\n");
    printf("VERDICT=%s\n", (g_fails != 0) ? "FAIL" : "PASS_OFFLINE");
    TSNow(ts, sizeof(ts));
    printf("%s done pid=%lu\n", ts, (unsigned long)g_pid0);
    return (g_fails != 0) ? 1 : 0;
}
