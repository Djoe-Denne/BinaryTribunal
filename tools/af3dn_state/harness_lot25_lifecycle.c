/* M25-P2 harness_lot25_lifecycle.c -- harnais Win32 de cycle de vie REEL
 * sidecar (nouveau fichier autonome : ne touche AUCUN ancien harnais,
 * oracle, source,_IDB). /W3 /O2 /MT, sous-systeme console, JAMAIS le jeu :
 * le module cible est la COPIE du candidat passee par le parent en argv[1]
 * et le host des sites est CE processus propre (aucun code FF8 execute).
 *
 * argv = <dllcopy chemin absolu> <Proxy_UninitAndCloseLog RVA (strtoul
 * base 0)> exactement ; non fourni -> usage + exit 2. La copie du candidat
 * n'est JAMAIS modifiee ; les sidecars crees ici (gfx_passthrough.stage0,
 * gfx_passthrough.nohook) sont les SEULS fichiers supprimes (a la fin).
 *
 * Le host porte g_pad[0x30000] (contribution .text reservee, remplie par memset,
 * protection modifiee seulement apres verification de bornes, sonde volatile pour
 * survivre a /O2) ; la fenetre de 14 octets [site-4 .. site+9] de CHACUN
 * des deux sites contractuels host+0x1EF5D / host+0x1EF72 est verifiee
 * DANS g_pad AVANT TOUTE ECRITURE (comparaisons UINT_PTR, refus sinon),
 * puis posee comme :
 *   voisins 0xA5 x4 | preimage FF 90 98 00 00 00 | voisins 0x5A x4
 * (patch contrat = E8 rel32 + 0x90, 6 octets, cible = export).
 *
 * PHASE 1 (positive) -- sidecar stage0 present, nohook absent (retire s'il
 * existait), FF8_PASSTHROUGH_BOOTHOOK=0 pose AVANT LoadLibraryA :
 *   1. attach  : LoadLibraryA(dllcopy) -> DLL_PROCESS_ATTACH sidecar
 *      auto-installe stage0 sur GetModuleHandleA(NULL) = ce harnais ;
 *   2. install : les DEUX sites portent E8 rel32 + 0x90 dont la cible
 *      decodee == adresse EXACTE de l'export Passthrough_Stage0Stub,
 *      voisins intacts (readback 6 octets/site + 4 voisins de chaque cote) ;
 *   3. restore : appel int __cdecl(void*) @ dll+argvRVA, engine=NULL
 *      (g_nativeAlive BSS=0 -> chemin early-return) -- JAMAIS via
 *      GetProcAddress du Restore (on teste l'INTEGRATION reelle du
 *      wrapper) -- retour attendu 0 et fenetres remises EXACTES par le
 *      wrapper AVANT la branche early-return ;
 *   4. detach  : FreeLibrary TRUE attendu, readback post-unload identique,
 *      GetModuleHandleA(nom du module capture) == NULL (pas de detach
 *      premature : pre-unload, le meme nom renvoyait h), processus VIVANT.
 *
 * PHASE 2 (negative) -- les DEUX sidecars (stage0 ET nohook) ensemble :
 *   LoadLibraryA NE patche PAS (fenetres toujours preimage+voisins),
 *   appel wrapper no-op (ret 0), FreeLibrary n'ecrit RIEN (readback
 *   identique), module absent apres unload, processus vivant.
 *
 * Pas de fake device/application HRESULT, pas d'execution du stub, on teste
 * le LIFECYCLE seulement. Aucune adresse hard-codee en dehors des sites du
 * contrat (0x1EF5D/0x1EF72) et du RVA fourni : toute autre adresse provient
 * de Win32 (GetModuleHandleA/GetProcAddress/GetModuleFileNameA/VirtualQuery).
 * Rapport : "checks=N fails=N" + verdict phase positive/negative ; exit
 * nonzero si un check echoue. Diagnostics grep-ables : attach, install,
 * restore, detach. Le fichier CSV ouvert par la DLL a cote d'elle-meme est
 * son propre artefact (hors scope de cleanup de ce harnais).
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
#define PAD_BYTES   0x30000u        /* .bss image assez grande (contrat)     */
#define PAD_MID     0x18000u        /* sonde ALIVE au centre de g_pad        */
#define PAD_TOUCH   0x1234u         /* octet de controle du memset           */
#define PAD_FILL    0x55
#define HOST_SITE1_RVA 0x1EF5Du     /* site contractuel 1 (bind)             */
#define HOST_SITE2_RVA 0x1EF72u     /* site contractuel 2 (unbind)           */
#define WIN_BEFORE  4
#define PATCH_BYTES 6
#define E8_BYTES    5             /* rel32 is relative to CALL end, before NOP */
#define WIN_BYTES   (WIN_BEFORE + PATCH_BYTES + WIN_BEFORE)   /* 14 */

static const char SIDE0_NAME[]   = "gfx_passthrough.stage0";
static const char NOHOOK_NAME[]  = "gfx_passthrough.nohook";
static const char EXP_STUB[]     = "Passthrough_Stage0Stub";
static const char ENV_BOOTHOOK[] = "FF8_PASSTHROUGH_BOOTHOOK";

/* preimage contractuelle de chaque site (6 octets, host synthetique sain) */
static const unsigned char PREIMG[PATCH_BYTES] =
    { 0xFF, 0x90, 0x98, 0x00, 0x00, 0x00 };

/* Reserve an early .text contribution: /MT CRT code can otherwise push .bss
 * beyond RVA 0x1EF5D. No native/game bytes are involved. The range check below
 * still refuses any linker layout that does not put both windows in this pad. */
#pragma section(".text", read, execute)
__declspec(allocate(".text")) static unsigned char g_pad[PAD_BYTES];

/* ------------------------------------------------------------ type asserts */
typedef char sr_assert_abi_ptr [(sizeof(void*) == 4) ? 1 : -1];
typedef char sr_assert_abi_ul  [(sizeof(unsigned long) == 4) ? 1 : -1];
typedef char sr_assert_abi_int [(sizeof(int) == 4) ? 1 : -1];
typedef char sr_assert_pad     [(sizeof(g_pad) == PAD_BYTES) ? 1 : -1];
typedef char sr_assert_pre     [(sizeof(PREIMG) == PATCH_BYTES) ? 1 : -1];
typedef char sr_assert_win     [(WIN_BYTES == 14) ? 1 : -1];

typedef int (__cdecl *UninitFn)(void*);   /* signature contractuelle slot 1 */

static unsigned long g_checks = 0, g_fails = 0, g_pid0 = 0;
static int           g_s0Made = 0, g_nhMade = 0;
static char          g_side0Path[MAX_PATH + 2];
static char          g_nohookPath[MAX_PATH + 2];
static const char*   g_phase = "PREP";

/* ---------------------------------------------------------------- helpers */
static void ck(int ok, const char* what)
{
    ++g_checks;
    if (ok)
        printf("[OK]   %s %s\n", g_phase, what);
    else
    {
        printf("FAIL   %s %s\n", g_phase, what);
        ++g_fails;
    }
}

static void diag(const char* tag, const char* fmt, ...)
{
    va_list ap;
    printf("DIAG   %s %s: ", g_phase, tag);
    va_start(ap, fmt);
    vprintf(fmt, ap);
    va_end(ap);
    printf("\n");
}

/* Refus contractuel : cleanup best-effort des sidecars crees puis exit 1. */
static void refuse(const char* what)
{
    printf("FATAL  %s %s (refus)\n", g_phase, what);
    ++g_fails;
    if (g_s0Made)
        (void)DeleteFileA(g_side0Path);
    if (g_nhMade)
        (void)DeleteFileA(g_nohookPath);
    printf("checks=%lu fails=%lu (abort)\n", g_checks, g_fails);
    exit(1);
}

/* Hex dump de la fenetre [site-4 .. site+9]. */
static void DumpWin(const char* tag, const unsigned char* site)
{
    int i;
    printf("DIAG   %s %s win[site-4..site+9]:", g_phase, tag);
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

/* 1 si etat hookE : E8 rel32 + 0x90 decode vers stubVa, voisins intacts
 * (readback complet des 6 octets + 4 voisins de chaque cote). */
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

/* Vivant : pid constant, sonde pad intacte, host toujours charge. */
static int Alive(void)
{
    return (GetCurrentProcessId() == g_pid0) &&
           (g_pad[PAD_MID] == PAD_FILL) &&
           (GetModuleHandleA(NULL) != NULL);
}

/* Cleanup final : UNIQUEMENT les sidecars crees ici (workspace harnais). */
static void CleanupSidecars(void)
{
    if (DeleteFileA(g_side0Path))
        ck(1, "cleanup sidecar stage0 supprime");
    else
        ck(GetFileAttributesA(g_side0Path) == INVALID_FILE_ATTRIBUTES,
           "cleanup sidecar stage0 absent");
    if (DeleteFileA(g_nohookPath))
        ck(1, "cleanup sidecar nohook supprime");
    else
        ck(GetFileAttributesA(g_nohookPath) == INVALID_FILE_ATTRIBUTES,
           "cleanup sidecar nohook absent");
}

int main(int argc, char** argv)
{
    const char* dllPath;
    const char* rvaArg;
    char dllLC[MAX_PATH + 1];
    char dirBuf[MAX_PATH + 1];
    char probeBuf[MAX_PATH + 2];
    char nameBuf[MAX_PATH + 1];
    unsigned char* site1;
    unsigned char* site2;
    UINT_PTR hostBase, padLo, padHi;
    UINT_PTR site1A, site2A;
    unsigned long stubVa = 0, tgt1 = 0, tgt2 = 0;
    unsigned long wrapperRva = 0;
    HMODULE hDll = NULL;
    FARPROC stubProc = NULL;
    UninitFn wrapperFn = (UninitFn)0;
    MEMORY_BASIC_INFORMATION mbi;
    SIZE_T q = 0;
    FILE* sf;
    DWORD attr, mn, padProtect;
    size_t dllLen, dirLen, i;
    char* endp = NULL;
    int stateOk, setOk, alive;
    unsigned char touchedProbe = 0;
    int ret1 = 0, ret2 = 0;
    BOOL freed = FALSE;
    unsigned long f1 = 0, f2 = 0;

    g_pid0 = GetCurrentProcessId();

    if (argc != 3)
    {
        printf("USAGE harness_lot25_lifecycle.exe <dllcopy abs> "
               "<RVA_UninitAndCloseLog base0>\n");
        return 2;
    }
    dllPath = argv[1];
    rvaArg  = argv[2];
    printf("HARNESS lot25-lifecycle (lifecycle only, no game, new file)\n");

    errno = 0;
    wrapperRva = strtoul(rvaArg, &endp, 0);
    if (endp == rvaArg || *endp != 0 || wrapperRva == 0 ||
        errno == ERANGE)
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
        strstr(dllLC, "lot25-lifecycle") == NULL)
        refuse("chemin hors environnement Temp opencode/lot25-lifecycle");
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

    /* host propre + fenetres 14 B dans g_pad, AVANT toute ecriture */
    g_phase = "PREP";
    if (GetModuleHandleA(NULL) == NULL)
        refuse("GetModuleHandleA(NULL) NULL");
    hostBase = (UINT_PTR)GetModuleHandleA(NULL);
    site1A = hostBase + HOST_SITE1_RVA;
    site2A = hostBase + HOST_SITE2_RVA;
    if (site2A <= site1A)
        refuse("sites mal ordonnes (attendu site2 > site1)");
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
        refuse("fenetres 14B hors g_pad (layout lieur) -- aucune ecriture");

    /* Only our reserved pad is made writable, after its window range check. */
    if (!VirtualProtect(g_pad, sizeof(g_pad), PAGE_EXECUTE_READWRITE, &padProtect))
        refuse("VirtualProtect du pad synthetique KO");
    memset(g_pad, PAD_FILL, sizeof(g_pad));
    touchedProbe = *(volatile const unsigned char*)&g_pad[PAD_TOUCH];
    diag("readpad", "touched=%02X (memset=%02X attendu)",
         (unsigned)touchedProbe, (unsigned)PAD_FILL);
    if (touchedProbe != PAD_FILL)
        refuse("memset g_pad non observable");

    /* redaction des fenetres puis verification de notre propre ecriture */
    LayWin(site1);
    LayWin(site2);
    stateOk = WinIsPre(site1);
    if (!stateOk) DumpWin("site1-layout?", site1);
    ck(stateOk, "prep layout site1 exact (A5|PRE|5A)");
    stateOk = WinIsPre(site2);
    if (!stateOk) DumpWin("site2-layout?", site2);
    ck(stateOk, "prep layout site2 exact (A5|PRE|5A)");

    setOk = SetEnvironmentVariableA(ENV_BOOTHOOK, "0");
    if (!setOk)
        refuse("SetEnvironmentVariableA impossible (exploitable diagnosis)");
    ck(setOk != 0, "prep env FF8_PASSTHROUGH_BOOTHOOK=0 (avant LoadLibrary)");

    /* sidecars : stage0 cree a cote de la copie ; nohook retire s'il existe */
    sprintf(g_side0Path, "%s%s", dirBuf, SIDE0_NAME);
    sprintf(g_nohookPath, "%s%s", dirBuf, NOHOOK_NAME);
    sf = fopen(g_side0Path, "wb");
    if (sf == NULL)
        refuse("creation sidecar stage0 impossible");
    fputs("lot25-lifecycle sidecar stage0 (harnais autonome only)\n", sf);
    fclose(sf);
    g_s0Made = 1;
    if (GetFileAttributesA(g_side0Path) == INVALID_FILE_ATTRIBUTES)
        refuse("sidecar stage0 introuvable apres creation");
    ck(1, "prep sidecar stage0 present (pas consomme par la DLL)");
    (void)DeleteFileA(g_nohookPath);       /* jamais le fichier du jeu */
    stateOk = (GetFileAttributesA(g_nohookPath) == INVALID_FILE_ATTRIBUTES);
    if (!stateOk)
        refuse("retrait nohook impossible (fichier bloque)");
    ck(stateOk, "prep sidecar nohook ABSENT (retrait verifie)");

    /* =========================== PHASE 1 (positive) ===================== */
    g_phase = "P1+POS";
    f1 = g_fails;
    hDll = LoadLibraryA(dllPath);
    diag("attach", "LoadLibraryA ret=%08lX gle=%lu",
         (unsigned long)(UINT_PTR)hDll,
         (unsigned long)(hDll ? 0 : GetLastError()));
    ck(hDll != NULL, "p1 attach LoadLibraryA ret != NULL");
    if (hDll != NULL)
    {
        mn = GetModuleFileNameA(hDll, nameBuf, (DWORD)sizeof(nameBuf));
        if (mn == 0 || mn >= (DWORD)sizeof(nameBuf))
            refuse("nom de module non capturable");
        ck(GetModuleHandleA(nameBuf) == hDll,
           "p1 module mappe (GetModuleHandleA(nom)) pre-unload");

        stubProc = GetProcAddress(hDll, EXP_STUB);
        if (stubProc == NULL)
            refuse("Get Passthrough_Stage0Stub NULL");
        stubVa = (unsigned long)(UINT_PTR)stubProc;
        diag("install", "stub=%08lX (export exact attendu)", stubVa);

        stateOk = WinIsHooked(site1, stubVa, &tgt1);
        if (!stateOk) DumpWin("site1-hook?", site1);
        ck(stateOk, "p1 install site1 E8 rel32+90 cible==export, voisins");
        stateOk = WinIsHooked(site2, stubVa, &tgt2);
        if (!stateOk) DumpWin("site2-hook?", site2);
        ck(stateOk, "p1 install site2 E8 rel32+90 cible==export, voisins");
        diag("install", "targets decoded tgt1=%08lX tgt2=%08lX", tgt1, tgt2);

        /* shutdown par l'INTEGRATION reelle : RVA argv, engine=NULL --
         * GetProcAddress du Restore volontairement NON utilisee. */
        wrapperFn = (UninitFn)((UINT_PTR)hDll + (UINT_PTR)wrapperRva);
        q = VirtualQuery((LPCVOID)((UINT_PTR)hDll + (UINT_PTR)wrapperRva),
                         &mbi, sizeof(mbi));
        diag("restore", "call dll+RVA=%08lX q=%lu allocBase==hDll=%d",
             (unsigned long)((UINT_PTR)hDll + (UINT_PTR)wrapperRva),
             (unsigned long)q,
             (q != 0 && (UINT_PTR)mbi.AllocationBase == (UINT_PTR)hDll) ? 1 : 0);
        if (q == 0 || (UINT_PTR)mbi.AllocationBase != (UINT_PTR)hDll)
            refuse("RVA wrapper hors image DLL (argv[2] errone ?)");
        ret1 = wrapperFn(NULL);
        diag("restore", "wrapper ret=%d (attendu 0)", ret1);
        ck(ret1 == 0, "p1 wrapper ret==0");
        stateOk = WinIsPre(site1);
        if (!stateOk) DumpWin("site1-restore?", site1);
        ck(stateOk, "p1 restore site1 14B exact (6c + voisins) par wrapper");
        stateOk = WinIsPre(site2);
        if (!stateOk) DumpWin("site2-restore?", site2);
        ck(stateOk, "p1 restore site2 14B exact (6c + voisins) par wrapper");

        freed = FreeLibrary(hDll);
        diag("detach", "FreeLibrary ret=%d", (int)freed);
        ck(freed != 0, "p1 detach FreeLibrary TRUE");
        hDll = NULL;
        stateOk = WinIsPre(site1);
        if (!stateOk) DumpWin("site1-postunload?", site1);
        ck(stateOk, "p1 readback post-unload site1 (memes octets)");
        stateOk = WinIsPre(site2);
        if (!stateOk) DumpWin("site2-postunload?", site2);
        ck(stateOk, "p1 readback post-unload site2 (memes octets)");
        stateOk = (GetModuleHandleA(nameBuf) == NULL);
        if (!stateOk)
            diag("detach", "module toujours present apres FreeLibrary");
        ck(stateOk, "p1 module ABSENT apres unload (pas de detach premature)");
        alive = Alive();
        diag("detach", "alive pid=%lu padMid=%02X hostHandle=%08lX",
             GetCurrentProcessId(), (unsigned)g_pad[PAD_MID],
             (unsigned long)(UINT_PTR)GetModuleHandleA(NULL));
        ck(alive, "p1 processus VIVANT (pid + pad + module harnais)");
    }
    f1 = g_fails - f1;

    /* =========================== PHASE 2 (negative) ===================== */
    g_phase = "P2-NEG";
    f2 = g_fails;
    sf = fopen(g_nohookPath, "wb");     /* nohook EN PLUS, stage0 toujours */
    if (sf == NULL)
        refuse("creation sidecar nohook phase2 impossible");
    fputs("lot25-lifecycle sidecar nohook (harnais autonome only)\n", sf);
    fclose(sf);
    g_nhMade = 1;
    stateOk = (GetFileAttributesA(g_nohookPath) != INVALID_FILE_ATTRIBUTES);
    if (!stateOk)
        refuse("sidecar nohook introuvable apres creation phase 2");
    ck(stateOk, "p2 sidecars stage0+nohook ENSEMBLE");

    hDll = LoadLibraryA(dllPath);
    diag("attach", "LoadLibraryA#2 ret=%08lX gle=%lu",
         (unsigned long)(UINT_PTR)hDll,
         (unsigned long)(hDll ? 0 : GetLastError()));
    ck(hDll != NULL, "p2 attach LoadLibraryA nohook ret != NULL");
    if (hDll != NULL)
    {
        mn = GetModuleFileNameA(hDll, nameBuf, (DWORD)sizeof(nameBuf));
        if (mn == 0 || mn >= (DWORD)sizeof(nameBuf))
            refuse("nom de module #2 non capturable");
        ck(GetModuleHandleA(nameBuf) == hDll,
           "p2 module mappe pre-unload (pas de detach premature)");

        stateOk = WinIsPre(site1);
        if (!stateOk) DumpWin("site1-attach2?", site1);
        ck(stateOk, "p2 attach n'a PAS patchE site1 (preimage+voisins)");
        stateOk = WinIsPre(site2);
        if (!stateOk) DumpWin("site2-attach2?", site2);
        ck(stateOk, "p2 attach n'a PAS patchE site2 (preimage+voisins)");

        wrapperFn = (UninitFn)((UINT_PTR)hDll + (UINT_PTR)wrapperRva);
        q = VirtualQuery((LPCVOID)((UINT_PTR)hDll + (UINT_PTR)wrapperRva),
                         &mbi, sizeof(mbi));
        if (q == 0 || (UINT_PTR)mbi.AllocationBase != (UINT_PTR)hDll)
            refuse("RVA wrapper#2 hors image DLL");
        ret2 = wrapperFn(NULL);
        diag("restore", "wrapper#2 ret=%d (no-op attendu 0)", ret2);
        ck(ret2 == 0, "p2 wrapper no-op ret==0");
        stateOk = WinIsPre(site1);
        if (!stateOk) DumpWin("site1-wrap2?", site1);
        ck(stateOk, "p2 wrapper n'a rien ecrit site1");
        stateOk = WinIsPre(site2);
        if (!stateOk) DumpWin("site2-wrap2?", site2);
        ck(stateOk, "p2 wrapper n'a rien ecrit site2");

        freed = FreeLibrary(hDll);
        diag("detach", "FreeLibrary#2 ret=%d", (int)freed);
        ck(freed != 0, "p2 detach FreeLibrary TRUE");
        hDll = NULL;
        stateOk = WinIsPre(site1);
        if (!stateOk) DumpWin("site1-pru2?", site1);
        ck(stateOk, "p2 unload aucune ecriture site1 (readback identique)");
        stateOk = WinIsPre(site2);
        if (!stateOk) DumpWin("site2-pru2?", site2);
        ck(stateOk, "p2 unload aucune ecriture site2 (readback identique)");
        stateOk = (GetModuleHandleA(nameBuf) == NULL);
        if (!stateOk)
            diag("detach", "module #2 toujours present apres FreeLibrary");
        ck(stateOk, "p2 module ABSENT apres unload");
        alive = Alive();
        diag("detach", "alive pid=%lu padMid=%02X hostHandle=%08lX",
             GetCurrentProcessId(), (unsigned)g_pad[PAD_MID],
             (unsigned long)(UINT_PTR)GetModuleHandleA(NULL));
        ck(alive, "p2 processus VIVANT (pid + pad + module harnais)");
    }
    f2 = g_fails - f2;

    /* cleanup : uniquement les sidecars crees ici */
    g_phase = "CLEAN";
    CleanupSidecars();
    g_s0Made = 0;
    g_nhMade = 0;

    printf("checks=%lu fails=%lu\n", g_checks, g_fails);
    printf("PHASE-POSITIVE %s\n", (f1 == 0) ? "PASSED" : "FAILED");
    printf("PHASE-NEGATIVE %s\n", (f2 == 0) ? "PASSED" : "FAILED");
    return (g_fails != 0) ? 1 : 0;
}
