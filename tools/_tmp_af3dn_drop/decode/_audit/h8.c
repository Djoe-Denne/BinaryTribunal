/* h8.c — full fidelity test of the three-record menu frame on the DEPLOYED dll:
 * slot51{rem=9} + slot47 + slot51{rem=14} + slot47 + slot51{rem=1} + slot47,
 * then pulse-flush; bin size + boundary bytes + a resync-free walk via python. */
#define WIN32_LEAN_AND_MEAN
#define _CRT_SECURE_NO_WARNINGS
#include <windows.h>
#include <stdio.h>
#include <string.h>

typedef void (__cdecl *PFN_DumpNode)(unsigned slot, const void* ctx, const void* node);
typedef void (__cdecl *PFN_Pulse)(void);

static unsigned char g_node[0x40];
static unsigned char g_geomA[0x80], g_geomB[0x80], g_geomC[0x80];
static unsigned char g_poolA[2 + 64 * 32], g_poolB[2 + 96 * 32], g_poolC[2 + 16 * 32];
static unsigned short g_idxA[64], g_idxB[96], g_idxC[16];

static void plant(unsigned char* node, unsigned char* pool, unsigned short* idx,
                  unsigned char* geom, unsigned remaining, unsigned perV, unsigned perI,
                  unsigned char gridFill, unsigned char idxHi, unsigned char guardByte)
{
    unsigned i, vc = perV * remaining, ic = perI * remaining;
    memset(node, 0, 0x40);
    *(unsigned long*)(node + 0x08) = remaining;
    *(unsigned long*)(node + 0x14) = (unsigned long)(pool + 2);
    *(unsigned long*)(node + 0x20) = (unsigned long)idx;
    *(unsigned long*)(node + 0x2C) = (unsigned long)geom;
    *(unsigned long*)(geom + 0x3C) = perV;
    *(unsigned long*)(geom + 0x40) = perI;
    pool[0] = guardByte; pool[1] = 0x00;
    memset(pool + 2, gridFill, 2 + vc * 32 + 8);
    for (i = 0; i < ic; ++i) idx[i] = (unsigned short)((idxHi << 8) | (i & 0xFF));
    ((unsigned char*)idx)[ic * 2] = 0xE1;          /* poison right after idx blob */
    ((unsigned char*)idx)[ic * 2 + 1] = 0xE2;
}

int main(int argc, char** argv)
{
    const char* dll = (argc > 1) ? argv[1] : "C:\\Users\\djden\\AppData\\Local\\Temp\\harness_target.dll";
    char bindir[MAX_PATH], binpath[MAX_PATH], logpath[MAX_PATH], sidecar[MAX_PATH], *slash;
    HMODULE h;
    unsigned char* base;
    unsigned long *pSeq, *pCap, *pOvf, *pWrite, *pCommit;
    unsigned long pend, fsz;
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
    dump = (PFN_DumpNode)(base + 0x19D0ul);
    pulse = (PFN_Pulse)(base + 0x1FC0ul);

    /* menu-like frame: three slot51 records (rem 9 / 14 / 1) interleaved with slot47 kind0 */
    plant(g_node, g_poolA, g_idxA, g_geomA, 9, 4, 6, 0x22, 0x11, 0xA1); dump(51, 0, g_node);
    memset(g_node, 0, sizeof(g_node));                              dump(47, 0, g_node);
    plant(g_node, g_poolB, g_idxB, g_geomB, 14, 4, 6, 0x33, 0x12, 0xB1); dump(51, 0, g_node);
    memset(g_node, 0, sizeof(g_node));                              dump(47, 0, g_node);
    plant(g_node, g_poolC, g_idxC, g_geomC, 1, 4, 6, 0x44, 0x13, 0xC1); dump(51, 0, g_node);
    memset(g_node, 0, sizeof(g_node));                              dump(47, 0, g_node);
    printf("write=%lu (contract = 3x(1324+56) = 4140)\n", *pWrite);

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
    printf("bin size=%lu (delta=%ld)\n", fsz, (long)fsz - (long)pend);
    /* copy for python walk */
    {
        FILE* s = fopen(binpath, "rb");
        FILE* d = fopen("h8_file.bin", "wb");
        char buf[4096]; size_t n;
        while ((n = fread(buf, 1, sizeof(buf), s)) > 0) fwrite(buf, 1, n, d);
        fclose(s); fclose(d);
    }
    FreeLibrary(h);
    return 0;
}
