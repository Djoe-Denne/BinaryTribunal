/* h7.c — final probe: DumpNode(51,{remaining=1,perV=4,perI=6}) alone; dump the
 * ring's spill zone [1316..1344) BEFORE the pulse; then pulse; then bin size. */
#define WIN32_LEAN_AND_MEAN
#define _CRT_SECURE_NO_WARNINGS
#include <windows.h>
#include <stdio.h>
#include <string.h>

typedef void (__cdecl *PFN_DumpNode)(unsigned slot, const void* ctx, const void* node);
typedef void (__cdecl *PFN_Pulse)(void);

static unsigned char g_node[0x40];
static unsigned char g_geom[0x80];
static unsigned char g_pool[2 + 64 * 32];
static unsigned short g_idx[64];

static void hd(const char* tag, const unsigned char* p, unsigned long off, unsigned long n)
{
    unsigned long k;
    printf("%s [%lu..%lu): ", tag, off, off + n);
    for (k = 0; k < n; ++k) printf("%02x ", p[off + k]);
    printf("\n");
}

int main(int argc, char** argv)
{
    const char* dll = (argc > 1) ? argv[1] : "C:\\Users\\djden\\AppData\\Local\\Temp\\harness_target.dll";
    char bindir[MAX_PATH], binpath[MAX_PATH], logpath[MAX_PATH], sidecar[MAX_PATH], *slash;
    HMODULE h;
    unsigned char* base;
    unsigned long *pSeq, *pCap, *pOvf, *pWrite, *pCommit;
    unsigned long i, pend, fsz;
    unsigned char* ring;
    PFN_DumpNode dump;
    PFN_Pulse pulse;
    FILE* f;

    h = LoadLibraryA(dll);
    if (!h) { printf("load failed %lu\n", GetLastError()); return 2; }
    base = (unsigned char*)h;

    pSeq    = (unsigned long*)(base + 0x4054EB0ul);
    pCap    = (unsigned long*)(base + 0x4054EB4ul);
    pOvf    = (unsigned long*)(base + 0x4054EC8ul);
    pWrite  = (unsigned long*)(base + 0x0054E94ul);
    pCommit = (unsigned long*)(base + 0x4054E98ul);
    ring    = base + 0x0054E98ul;

    *pSeq = 100; *pCap = 115; *pOvf = 0; *pWrite = 0; *pCommit = 0;

    memset(g_node, 0, sizeof(g_node));
    *(unsigned long*)(g_node + 0x08) = 1;                      /* remaining = 1 */
    *(unsigned long*)(g_node + 0x14) = (unsigned long)(g_pool + 2);
    *(unsigned long*)(g_node + 0x20) = (unsigned long)g_idx;
    *(unsigned long*)(g_node + 0x2C) = (unsigned long)g_geom;
    *(unsigned long*)(g_geom + 0x3C) = 4;
    *(unsigned long*)(g_geom + 0x40) = 6;
    g_pool[0] = 0xA1; g_pool[1] = 0xA2;
    memset(g_pool + 2, 0x22, sizeof(g_pool) - 2);
    for (i = 0; i < 6; ++i) g_idx[i] = 0x1100 + (unsigned short)i;
    ((unsigned char*)g_idx)[12] = 0xC1; ((unsigned char*)g_idx)[13] = 0xC2;
    ((unsigned char*)g_idx)[14] = 0xC3; ((unsigned char*)g_idx)[15] = 0xC4;
    /* poison 8 bytes after the grid: g_pool[2+128 .. +136) */
    memset(g_pool + 2 + 128, 0xD1, 8);

    dump = (PFN_DumpNode)(base + 0x19D0ul);
    pulse = (PFN_Pulse)(base + 0x1FC0ul);

    dump(51, (const void*)0x12345678, g_node);
    printf("after dump(51,{rem=1}): write=%lu (contract: 32+24+8+12+0+128=204)\n", *pWrite);
    hd("ring idx-tail->fvf-head", ring, 100, 24);   /* [100..124): idx [104..116), fvf [116..) */
    hd("ring fvf-tail->spill", ring, 196, 16);      /* [196..212): fvf ends at 204 */

    GetModuleFileNameA(h, bindir, MAX_PATH);
    slash = bindir + strlen(bindir);
    while (slash > bindir && slash[-1] != '\\' && slash[-1] != '/') --slash;
    *slash = 0;
    sprintf(binpath, "%s\\gfx_passthrough_dump.bin", bindir);
    sprintf(logpath, "%s\\gfx_passthrough_dump.log", bindir);
    sprintf(sidecar, "%s\\gfx_passthrough.dump", bindir);
    DeleteFileA(binpath); DeleteFileA(logpath); DeleteFileA(sidecar);

    pend = *pWrite - *pCommit;
    pulse();
    printf("pending=%lu\n", pend);

    f = fopen(binpath, "rb");
    if (!f) { printf("bin missing\n"); return 3; }
    fseek(f, 0, SEEK_END); fsz = ftell(f); fclose(f);
    printf("bin size=%lu (pending=%lu, delta=%ld)\n", fsz, pend, (long)fsz - (long)pend);
    {
        static unsigned char buf[300];
        size_t got;
        f = fopen(binpath, "rb");
        got = fread(buf, 1, sizeof(buf), f);
        fclose(f);
        hd("bin idx-tail->fvf-head", buf, 100, 24);
        if (fsz >= 204) hd("bin fvf-tail->spill", buf, 196, (fsz - 196) < 16 ? (fsz - 196) : 16);
        if (fsz > 8) hd("bin tail", buf, fsz - 8, 8);
    }
    f = fopen(logpath, "rb");
    if (f) { char line[512]; while (fgets(line, sizeof(line), f)) printf("log: %s", line); fclose(f); }
    FreeLibrary(h);
    return 0;
}
