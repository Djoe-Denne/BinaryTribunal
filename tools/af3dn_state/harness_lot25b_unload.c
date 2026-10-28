/* harness_lot25b_unload.c -- reproducteur isole control vs bypass-wrapper.  */
/* Autonome (aucun ancien harnais/candidat/source/_IDB touche). /W3 /O2 /MT, */
/* console, JAMAIS le jeu reel (0 octet du jeu) : host des sites = CE        */
/* process, GetFF8Process et API de debug interdits, copie DLL JAMAIS        */
/* editee. UN SEUL chemin teste (attach sidecar stage0 -> install E8 ->      */
/* control: wrapper | unload: FreeLibrary bypass -> readback 14B) ;          */
/* AUCUNE causalite vif, pas de test ExitProcess ni fault-injection,         */
/* AUCUNE promotion ; hash v17 exact gere par le PARENT. Exit : 0=pass,      */
/* 3=SAFETY rouge INTENTIONNEL (dangling E8, pas un crash), 2=FAIL infra.    */
/* argv : <copie ABSOLUE test_candidate.dll> <control|unload> <RVA base0>.   */
#define _CRT_SECURE_NO_WARNINGS
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdarg.h>
#include <ctype.h>
#include <errno.h>
#define PAD_BYTES      0x30000u
#define HOST_SITE1_RVA 0x1EF5Du
#define HOST_SITE2_RVA 0x1EF72u
#define WNB            4                   /* voisins avant / apres        */
#define WPB            6                   /* patch E8 rel32 + 90          */
#define WIN_LEN        (2 * WNB + WPB)     /* 14 = [site-4, site+10)       */
static const char SD0[] = "gfx_passthrough.stage0"; static const char
NOK[] = "gfx_passthrough.nohook";                  /* stage0 seul cree ; nohook JAMAIS */
static const char CPY[] = "test_candidate.dll"; static const char
EXP[] = "Passthrough_Stage0Stub";                  /* stub JAMAIS execute           */
static const char ENVB[] = "FF8_PASSTHROUGH_BOOTHOOK", GTAG[] = "FINAL FANTASY VIII";
static const char S0TXT[] = "lot25b stage0 sidecar (harnais autonome only)\n";
/* fenetres originales synthetiques imposees (14B = pre x4 | IP | post x4)  */
static const unsigned char
ORIG1[WIN_LEN] = { 0x8B,0x4D,0x0C,0x51,0xFF,0x90,0x98,0x00,0x00,0x00,0xEB,0x13,0x6A,0x00 },
ORIG2[WIN_LEN] = { 0x8B,0x4D,0x0C,0x51,0xFF,0x90,0x98,0x00,0x00,0x00,0x5D,0xC3,0x55,0x8B };
/* .text precoce : /MT peut pousser .bss au-dela des RVA contractuels.      */
#pragma section(".text", read, execute)
__declspec(allocate(".text")) static unsigned char g_pad[PAD_BYTES];
typedef char sr_ptr4 [(sizeof(void*) == 4) ? 1 : -1];  /* x86 uniquement      */
typedef int (__cdecl *WrapFn)(void*);                  /* wrapper du contrat  */
static unsigned long g_checks = 0, g_fails = 0; static int g_s0Made = 0, g_dontFree = 0;
static HMODULE g_hDll = NULL;
static unsigned char *g_s1 = NULL, *g_s2 = NULL;  static char g_s0Path[MAX_PATH + 2];
static const char* g_phase = "PREP";
/* ---------------------------------------------------------------- helpers */
static void ck(int ok, const char* what)
{ ++g_checks;
  if (ok) printf("[OK]   %s %s\n", g_phase, what);
  else printf("FAIL   %s %s\n", g_phase, what), ++g_fails; }
static void diag(const char* tag, const char* fmt, ...)
{ va_list ap; printf("DIAG   %s %s: ", g_phase, tag);
  va_start(ap, fmt); vprintf(fmt, ap); va_end(ap); printf("\n"); }
static unsigned long WinTgt(const unsigned char* site)   /* cible E8 rel32 */
{ int rel; memcpy(&rel, site + 1, 4);
  return (unsigned long)((UINT_PTR)(site + 5) + (UINT_PTR)(INT_PTR)rel); }
static int WinEq(const unsigned char* site, const unsigned char* ref)
{ return memcmp(site - WNB, ref, WIN_LEN) == 0; }
/* 14B exact : E8 rel32(-stub) + 90, voisins 4+4, ref = fenetre entiere     */
static int WinIsHooked(const unsigned char* site, const unsigned char* ref,
                       unsigned long stubVa)
{ unsigned char w[WIN_LEN]; int rel; unsigned long tgt;
  memcpy(w, site - WNB, WIN_LEN);
  if (memcmp(w, ref, WNB) != 0 ||
      memcmp(w + WNB + WPB, ref + WNB + WPB, WNB) != 0 ||
      w[WNB] != 0xE8 || w[WNB + WPB - 1] != 0x90)
      return 0;
  memcpy(&rel, w + WNB + 1, 4); tgt = (unsigned long)((UINT_PTR)site + 5 + (UINT_PTR)(INT_PTR)rel);
  return tgt == stubVa; }
/* pose 14B : VirtualProtect fenetre-seule RWX, memcpy, flush cache + restore */
static int SetWin(unsigned char* site, const unsigned char* src)
{ unsigned char* base = site - WNB; DWORD oldP = 0, tmp = 0; int flushed, protOk;
  if (!VirtualProtect(base, WIN_LEN, PAGE_EXECUTE_READWRITE, &oldP)) return 0;
  memcpy(base, src, WIN_LEN);
  flushed = FlushInstructionCache(GetCurrentProcess(), base, WIN_LEN) != 0;
  protOk = VirtualProtect(base, WIN_LEN, oldP, &tmp) != 0;
  if (!protOk) printf("FATAL protect precedente NON restauree (jamais silencieux)\n");
  return flushed && protOk; }
/* lecture pure : hex 14B + cible numerique (avant/apres)                   */
static void DumpWin(const char* tag, const unsigned char* site)
{ int i; printf("DIAG   %s win[%s]:", g_phase, tag);
  for (i = 0; i < WIN_LEN; ++i) printf(" %02X", (unsigned)site[i - WNB]);
  printf(" tgt=%08lX\n", WinTgt(site)); }
/* refus infra : restauration best-effort des fenetres possedees (JAMAIS de */
/* code arbitraire execute), FreeLibrary UNE fois (JAMAIS force-unload si  */
/* module retenu), SEUL le sidecar cree supprime ; puis exit 2              */
static void Refuse(const char* what)
{ int r1, r2, fr = 1, sd;
  printf("FATAL  %s %s (refus infra, exit 2)\n", g_phase, what); ++g_fails;
  r1 = g_s1 ? SetWin(g_s1, ORIG1) : 1; r2 = g_s2 ? SetWin(g_s2, ORIG2) : 1;
  if (g_hDll && !g_dontFree) { fr = (FreeLibrary(g_hDll) != 0); g_dontFree = 1; }
  sd = g_s0Made ? (DeleteFileA(g_s0Path) != 0) : 1;
  printf("DIAG   cleanup s1=%d s2=%d free=%d seam=%d checks=%lu fails=%lu\n",
         r1, r2, fr, sd, g_checks, g_fails);
  exit(2); }
static void Req(int ok, const char* what) { if (!ok) Refuse(what); ck(1, what); }
static void Finish(const char* verdict, int code)   /* verdict imprime      */
{ int r, sd;                                        /* (jamais vert si rouge)*/
  g_phase = "FIN"; printf("RESULT %s\n", verdict);
  r = ((g_s1 ? SetWin(g_s1, ORIG1) : -1) & (g_s2 ? SetWin(g_s2, ORIG2) : -1));
  sd = g_s0Made ? (DeleteFileA(g_s0Path) != 0) : 1;
  ck(r && WinEq(g_s1, ORIG1) && WinEq(g_s2, ORIG2), "fin fenetres host restaurees = originales");
  ck(sd, "fin seam stage0 retire (SEUL cote cree supprime)");
  printf("checks=%lu fails=%lu\n", g_checks, g_fails);
   exit(g_fails ? 2 : code); }
static int ChkAbs(const char* p)
{ return (p[0]=='\\' && p[1]=='\\') ||
         (((p[0]>='A' && p[0]<='Z') || (p[0]>='a' && p[0]<='z')) && p[1]==':' && p[2]=='\\'); }
/* contient "FINAL FANTASY VIII" (ASCII insensible casse) -> chemin du jeu  */
static int HasGameTag(const char* p)
{ size_t nl = strlen(GTAG), i, j;
  for (i = 0; p[i]; ++i)
  { for (j = 0; j < nl; ++j)
      if (p[i+j] == '\0' || tolower((unsigned char)p[i+j]) != tolower((unsigned char)GTAG[j])) break;
    if (j == nl) return 1; }
  return 0; }
static const char* BaseName(const char* p)
{ const char* a = strrchr(p, '\\'), *b = strrchr(p, '/');
  if (b && (!a || b > a)) a = b;
  return a ? a + 1 : p; }
/* ------------------------------------------------------------------ main */
int main(int argc, char** argv)
{ const char* dllPath;
  char dirBuf[MAX_PATH + 4], nhBuf[MAX_PATH + 4], *endp = NULL, *c, *cut = NULL;
  unsigned char sn1[WIN_LEN], sn2[WIN_LEN];
  UINT_PTR base, s1a, s2a, padLo, padHi;
  DWORD pid0, wrote_n, qret;
  unsigned long rva, stVa;
  FARPROC stub; MEMORY_BASIC_INFORMATION mbi;
  int modeCtl, fresh, dangle, rstrd;
  /* argv strict : refus avant TOUT effet de bord (aucun fichier, 0 octet)   */
  if (argc != 4)
  { printf("usage: harness_lot25b_unload <dllcopy ABSOLU (nom test_candidate.dll)> <control|unload> <wrapper RVA base0>\n");
    return 2; }
  printf("START  lot25b pid=%lu mode=%s\n", GetCurrentProcessId(), argv[2]);
  dllPath = argv[1];
  if (strlen(dllPath) + sizeof(SD0) + sizeof(NOK) >= MAX_PATH)
  { printf("FATAL  PREP chemin trop long\n"); return 2; }
  if (!ChkAbs(dllPath)) { printf("FATAL  PREP chemin non absolu\n"); return 2; }
  if (HasGameTag(dllPath)) { printf("FATAL  PREP chemin du JEU refuse (copie seule)\n"); return 2; }
  if (_stricmp(BaseName(dllPath), CPY) != 0) { printf("FATAL  PREP nom de module refuse (attendu %s)\n", CPY); return 2; }
  modeCtl = strcmp(argv[2], "control") == 0;
  if (!modeCtl && strcmp(argv[2], "unload") != 0) { printf("FATAL  PREP mode invalide (control|unload)\n"); return 2; }
  errno = 0; rva = strtoul(argv[3], &endp, 0);
  if (argv[3][0] == '-' || endp == argv[3] || *endp != '\0' || errno == ERANGE || rva == 0) { printf("FATAL  PREP RVA invalide (strtoul base 0)\n"); return 2; }
  diag("argv", "mode=%s rva=%lX dll=%s", argv[2], rva, dllPath);
  /* fenetres 14B ENTIEREMENT dans g_pad AVANT TOUTE ecriture (exit 2 sinon) */
  base = (UINT_PTR)GetModuleHandleA(NULL); s1a = base + HOST_SITE1_RVA;
  s2a = base + HOST_SITE2_RVA; pid0 = GetCurrentProcessId();
  padLo = (UINT_PTR)g_pad; padHi = padLo + PAD_BYTES;
  g_s1 = (unsigned char*)s1a; g_s2 = (unsigned char*)s2a;
  diag("pad", "host=%08lX pad=[%08lX..%08lX) s1=%08lX s2=%08lX probe=%02X", (unsigned long)base,
       (unsigned long)padLo, (unsigned long)padHi, (unsigned long)s1a, (unsigned long)s2a,
       (unsigned)*(volatile const unsigned char*)&g_pad[0]);
  if (base == 0 || s2a <= s1a || (UINT_PTR)(g_s1 - WNB) < padLo ||
      (UINT_PTR)(g_s1 + (WIN_LEN - WNB)) > padHi ||
      (UINT_PTR)(g_s2 - WNB) < padLo ||
      (UINT_PTR)(g_s2 + (WIN_LEN - WNB)) > padHi)
  { printf("FATAL  PREP layout refus (fenetres 14B hors g_pad, AUCUN octet ecrit) checks=%lu fails=%lu\n", g_checks, g_fails);
    return 2; }
  /* fenetres ORIGINALES synthetiques posees (helper 14B verifie)            */
  Req(SetWin(g_s1, ORIG1) && SetWin(g_s2, ORIG2) && WinEq(g_s1, ORIG1) && WinEq(g_s2, ORIG2),
      "prep fenetres 14B = originales posees+reverifiees");
  /* env anti-hook (evite l'autre hook), PUIS seams FRAIS obligatoires       */
  Req(SetEnvironmentVariableA(ENVB, "0") != 0, "prep env FF8_PASSTHROUGH_BOOTHOOK=0 (avant LoadLibrary)");
  strcpy(dirBuf, dllPath);
  for (c = dirBuf; *c; ++c) if (*c == '\\' || *c == '/') cut = c;
  if (cut) cut[1] = '\0'; else strcpy(dirBuf, ".\\");
  sprintf(g_s0Path, "%s%s", dirBuf, SD0); sprintf(nhBuf, "%s%s", dirBuf, NOK);
  fresh = GetFileAttributesA(g_s0Path) == INVALID_FILE_ATTRIBUTES &&
          GetFileAttributesA(nhBuf) == INVALID_FILE_ATTRIBUTES;
  Req(fresh, "prep seams stage0+nohook ABSENTS");
  { int wrote_ok, closed_ok;
    HANDLE sf = CreateFileA(g_s0Path, GENERIC_WRITE, 0, NULL, CREATE_NEW, FILE_ATTRIBUTE_NORMAL, NULL);
    if (sf == INVALID_HANDLE_VALUE) Refuse("CREATE_NEW seam stage0 impossible");
    g_s0Made = 1;
    wrote_ok = WriteFile(sf, S0TXT, (DWORD)(sizeof(S0TXT) - 1), &wrote_n, NULL) != 0;
    closed_ok = CloseHandle(sf) != 0;
    Req(wrote_ok && closed_ok && wrote_n == sizeof(S0TXT) - 1,
        "prep seam stage0 cree CREATE_NEW (ecrit+ferme, verifie)"); }
  /* attach copie + export stub (le stub n'est JAMAIS execute)               */
  g_phase = "LOAD";
  g_hDll = LoadLibraryA(dllPath);
  Req(g_hDll != NULL, "attach LoadLibraryA(test_candidate.dll)");
  stub = GetProcAddress(g_hDll, EXP);
  if (stub == NULL) Refuse("install GetProcAddress Passthrough_Stage0Stub absent");
  stVa = (unsigned long)(UINT_PTR)stub;
  diag("module", "pid=%lu base=%08lX stub=%08lX rva=%lX", GetCurrentProcessId(), (unsigned long)(UINT_PTR)g_hDll, stVa, rva);
  /* install E8 rel32+90 exige aux 2 sites (cible exacte == export stub)     */
  if (!(WinIsHooked(g_s1, ORIG1, stVa) && WinIsHooked(g_s2, ORIG2, stVa)))
  { DumpWin("site1-install?", g_s1); DumpWin("site2-install?", g_s2);
    Refuse("install E8 absente/incomplete (octet attendu manquant)"); }
  ck(1, "install E8 aux 2 sites (cible=stub, voisins exacts)");
  DumpWin("pre", g_s1); DumpWin("pre", g_s2);
  /* =================== MODE control : wrapper appelle =================== */
  g_phase = "ACT";
  if (modeCtl)
  { qret = VirtualQuery((LPCVOID)((UINT_PTR)g_hDll + rva), &mbi, sizeof(mbi));
    Req(qret == sizeof(mbi) && mbi.AllocationBase == g_hDll && mbi.State == MEM_COMMIT,
        "control VirtualQuery wrapper allocBase==dll MEM_COMMIT");
    diag("control", "wrapper_called=true engine=NULL");
    Req(((WrapFn)((UINT_PTR)g_hDll + rva))(NULL) == 0, "control wrapper ret=0");
    Req(WinEq(g_s1, ORIG1) && WinEq(g_s2, ORIG2), "control fenetres = ORIGINALES exactes");
    DumpWin("after-wrapper", g_s1); DumpWin("after-wrapper", g_s2); }
  /* ============= MODE unload : bypass wrapper, JAMAIS appele ============= */
  if (!modeCtl) diag("unload", "wrapper_called=false (bypass wrapper impose)");
  memcpy(sn1, g_s1 - WNB, WIN_LEN); memcpy(sn2, g_s2 - WNB, WIN_LEN);
  if (!FreeLibrary(g_hDll)) { g_dontFree = 1; Refuse("detach FreeLibrary KO (pas de force)"); }
  g_dontFree = 1;
  g_hDll = NULL;
  Req(1, "detach FreeLibrary");
  if (GetModuleHandleA(dllPath) != NULL)
  { g_dontFree = 1; Refuse("module retenu apres unload (pas de force-unload, FAIL sans inference)"); }
  Req(GetModuleHandleA(dllPath) == NULL, "detach module absent (GetModuleHandleA chemin absolu)");
  /* post-unload : processus vivant puis LECTURE SEULE (jamais GetProcAddress
     ni wrapper sur le module libere ; stub libere jamais execute)           */
  Req(GetCurrentProcessId() == pid0, "detach processus vivant (PID inchange)");
  Req(GetModuleHandleA(NULL) != NULL, "detach host module alive");
  g_phase = "POST";
  DumpWin("post", g_s1); DumpWin("post", g_s2);
  if (modeCtl)
  { Req(WinEq(g_s1, ORIG1) && WinEq(g_s2, ORIG2), "control post-FreeLibrary fenetres originales exactes");
    Finish("SAFETY=CONTROL_EXACT_ORIGINAL exit0", 0); }
  dangle = memcmp(g_s1 - WNB, sn1, WIN_LEN) == 0 && memcmp(g_s2 - WNB, sn2, WIN_LEN) == 0;
  rstrd = WinEq(g_s1, ORIG1) && WinEq(g_s2, ORIG2);
  if (dangle)
    { diag("verdict", "module absent + fenetres E8 identiques");
      Finish("SAFETY=FAIL_DANGLING_E8_REPRODUCED exit3 (intentional red)", 3); }
  if (rstrd)
    { diag("verdict", "no-dangling observe: fenetres = originales exactes");
      Finish(g_fails ? "SAFETY=OK_NO_DANGLING_OBSERVED (fails infra>0) exit2"
                     : "SAFETY=OK_NO_DANGLING_OBSERVED exit0", g_fails ? 2 : 0); }
  Refuse("unload: etat post ni E8-identique ni original exact");
  return 2;
}
