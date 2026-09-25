/* h3.c — DumpNode(51) sentinel + call the pulse/flush (RVA 0x1FC0) and inspect
 * what lands in the .bin next to the DLL copy (TEMP). cl /Ox h3.c */
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <stdio.h>
#include <string.h>

typedef void (__cdecl *PFN_DumpNode)(unsigned slot, const void* ctx, const void* node);
typedef void (__cdecl *PFN_Pulse)(void);

static unsigned char g_node[0x40];
static unsigned char g_geom[0x80];
static unsigned char g_pool[2 + 64 * 32];
static unsigned short g_idx[64];

static void hexdump(const unsigned char* p, unsigned long off, unsigned long n)
{
    unsigned long k;
    printf("  [%lu..%lu): ", off, off + n);
    for (k = 0; k < n; ++k) printf("%02x", p[off + k]);
    printf("\n");
}

int main(int argc, char** argv)
{
    const char* dll = (argc > 1) ? argv[1] : "C:\\Users\\djden\\AppData\\Local\\Temp\\harness_target.dll";
    char bindir[MAX_PATH], binpath[MAX_PATH], logpath[MAX_PATH], *slash;
    HMODULE h;
    unsigned char* base;
    unsigned long *pSeq, *pCap, *pOvf, *pWrite, *pCommit, *pRec;
    unsigned long before, after, pend, i, fsz;
    unsigned char* ring;
    PFN_DumpNode dump;
    PFN_Pulse pulse;
    FILE* lf;

    h = LoadLibraryA(dll);
    if (!h) { printf("load failed %lu\n", GetLastError()); return 2; }
    base = (unsigned char*)h;
    printf("base=%p\n", (void*)base);

    pSeq    = (unsigned long*)(base + 0x4054EB0ul);
    pCap    = (unsigned long*)(base + 0x4054EB4ul);
    pOvf    = (unsigned long*)(base + 0x4054EC8ul);
    pWrite  = (unsigned long*)(base + 0x0054E94ul);
    pCommit = (unsigned long*)(base + 0x4054E98ul);
    pRec    = (unsigned long*)(base + 0x4054EB8ul);
    ring    = base + 0x0054E98ul;

    *pSeq = 100; *pCap = 115; *pOvf = 0; *pWrite = 0; *pCommit = 0;

    memset(g_node, 0, sizeof(g_node));
    *(unsigned long*)(g_node + 0x08) = 9;
    *(unsigned long*)(g_node + 0x14) = (unsigned long)(g_pool + 2);
    *(unsigned long*)(g_node + 0x20) = (unsigned long)g_idx;
    *(unsigned long*)(g_node + 0x2C) = (unsigned long)g_geom;
    *(unsigned long*)(g_geom + 0x3C) = 4;
    *(unsigned long*)(g_geom + 0x40) = 6;

    g_pool[0] = 0xA1; g_pool[1] = 0xA2;
    memset(g_pool + 2, 0x22, sizeof(g_pool) - 2);
    for (i = 0; i < 54; ++i) g_idx[i] = 0x1100 + (unsigned short)i;

    dump = (PFN_DumpNode)(base + 0x19D0ul);
    pulse = (PFN_Pulse)(base + 0x1FC0ul);

    before = *pWrite;
    dump(51, (const void*)0x12345678, g_node);
    after = *pWrite;
    printf("write delta = %lu (contract=1324)\n", after - before);

    /* second record: kind0 slot 47 (node-only) to see inter-record spacing in ring+file */
    memset(g_node, 0, sizeof(g_node));
    dump(47, (const void*)0x12345678, g_node);
    printf("after kind0: write=%lu (delta2=%lu, contract=56)\n", *pWrite, *pWrite - after);

    /* ensure the sidecar is ABSENT so the pulse flushes but does not re-arm */
    GetModuleFileNameA(h, bindir, MAX_PATH);
    slash = bindir + strlen(bindir);
    while (slash > bindir && slash[-1] != '\\' && slash[-1] != '/') --slash;
    *slash = 0;
    sprintf(binpath, "%s\\gfx_passthrough_dump.bin", bindir);
    sprintf(logpath, "%s\\gfx_passthrough_dump.log", bindir);
    DeleteFileA(binpath);
    DeleteFileA(logpath);
    sprintf(binpath, "%s\\gfx_passthrough.dump", bindir);
    DeleteFileA(binpath);

    pend = *pWrite - *pCommit;
    printf("pending=%lu ; calling pulse @RVA 0x1FC0\n", pend);
    pulse();
    printf("post-pulse: write=%lu commit=%lu seq=%lu\n", *pWrite, *pCommit, *pSeq);

    lf = fopen(binpath, "rb");
    if (!lf) { printf("bin missing\n"); return 3; }
    fseek(lf, 0, SEEK_END);
    fsz = ftell(lf);
    fclose(lf);
    printf("bin size=%lu (pending=%lu, delta=%ld)\n", fsz, pend, (long)fsz - (long)pend);
    {
        FILE* f = fopen(binpath, "rb");
        static unsigned char buf[1400];
        size_t got;
        if (f) {
            got = fread(buf, 1, sizeof(buf), f);
            fclose(f);
            printf("bin bytes [150..200): ");
            { unsigned long k; for (k = 150; k < 200 && k < got; ++k) printf("%02x", buf[k]); }
            printf("\n");
            printf("bin bytes [160..186): ");
            { unsigned long k; for (k = 160; k < 186 && k < got; ++k) printf("%02x ", buf[k]); }
            printf("\n");
        }
    }
    lf = fopen(logpath, "rb");
    if (lf) { char line[512]; while (fgets(line, sizeof(line), lf)) printf("log: %s", line); fclose(lf); }
    FreeLibrary(h);
    return 0;
}
