/* Harness: call GFXPT_DumpNode (deployed v7 code) directly with a synthetic
 * slot-51 node and observe the exact ring bytes written.
 * Build: cl /nologo /W3 /Ox harness_dumpnode.c /Fe:harness.exe
 */
#include <windows.h>
#include <stdio.h>
#include <string.h>
#include <psapi.h>

typedef int (__cdecl *PFN_DumpNode)(unsigned slot, const void* ctx, const void* node);

static unsigned char g_node[0x40];
static unsigned char g_geom[0x80];
static unsigned char g_verts[2 + 36*32];
static unsigned short g_idx[54];
static unsigned char g_ids[9];

int main(int argc, char** argv)
{
    HMODULE h;
    unsigned char* base;
    PFN_DumpNode dumpNode;
    unsigned long *pFrameSeq, *pCapEnd, *pFrameRec, *pOverflow, *pWrite, *pCommit;
    unsigned long before, after, i;
    unsigned char* ring;
    FILE* f;
    const char* dll = (argc > 1) ? argv[1] : "gfx_driver_passthrough_v7fix.dll";

    h = LoadLibraryA(dll);
    if (!h) { printf("load failed %lu\n", GetLastError()); return 2; }
    printf("base=0x%p\n", (void*)h);
    fflush(stdout);
    if ((unsigned long)h != 0x10000000ul) {
        /* who occupies 0x10000000? */
        {
            HMODULE mods[512]; DWORD needed = 0, k;
            HANDLE me = GetCurrentProcess();
            if (EnumProcessModules(me, mods, sizeof(mods), &needed)) {
                char nm[MAX_PATH];
                for (k = 0; k < needed / sizeof(HMODULE); ++k) {
                    unsigned long b = (unsigned long)mods[k];
                    if (b >= 0x0FE00000ul && b <= 0x1FFFFFFFFul && b <= 0x7FFE0000ul) {
                        nm[0] = 0;
                        GetModuleFileNameA(mods[k], nm, MAX_PATH);
                        printf("  occupant 0x%08lx %s\n", b, nm);
                    }
                }
            }
        }
        printf("FATAL: relocated (code assumes 0x10000000)\n"); fflush(stdout);
        return 4;
    }

    base = (unsigned char*)h;
    /* offsets = VA - 0x10000000 */
    pFrameSeq  = (unsigned long*)(base + 0x4054eb0ul);  /* VA 0x14054eb0 */
    pCapEnd    = (unsigned long*)(base + 0x4054eb4ul);  /* VA 0x14054eb4 */
    pFrameRec  = (unsigned long*)(base + 0x4054eb8ul);
    pOverflow  = (unsigned long*)(base + 0x4054ec8ul);
    pWrite     = (unsigned long*)(base + 0x54e94ul);    /* VA 0x10054e94 */
    pCommit    = (unsigned long*)(base + 0x4054e98ul);  /* VA 0x14054e98 */
    ring       = base + 0x54e98ul;

    printf("frameSeq=%lu capEnd=%lu write=%lu commit=%lu\n",
           *pFrameSeq, *pCapEnd, *pWrite, *pCommit);
    fflush(stdout);

    *pFrameSeq = 1; *pCapEnd = 2; *pFrameRec = 0; *pOverflow = 0;
    *pWrite = 0; *pCommit = 0;

    dumpNode = (PFN_DumpNode)(base + 0x19c6ul);   /* GFXPT_DumpNode VA 0x100019C6 */

    memset(g_node, 0, sizeof(g_node));
    *(unsigned long*)(g_node + 0x08) = 9;     /* remaining */
    *(unsigned long*)(g_node + 0x0C) = 36;
    *(unsigned long*)(g_node + 0x10) = (unsigned long)g_verts;
    *(unsigned long*)(g_node + 0x14) = (unsigned long)g_verts;
    *(unsigned long*)(g_node + 0x20) = (unsigned long)g_idx;
    *(unsigned long*)(g_node + 0x28) = (unsigned long)g_ids;
    *(unsigned long*)(g_node + 0x2C) = (unsigned long)g_geom;

    memset(g_geom, 0, sizeof(g_geom));
    *(unsigned long*)(g_geom + 0x3C) = 4;     /* perV */
    *(unsigned long*)(g_geom + 0x40) = 6;     /* perI */

    g_verts[0] = 0x22; g_verts[1] = 0x00;     /* 2-byte prefix before the grid */
    for (i = 0; i < 36; ++i) {
        float x = 266.0f + (float)i, y = 342.0f + (float)i, z = 1.0f, rhw = 1.0f;
        unsigned long diff = 0xFF000000ul, spec = 0x00007FFFul;
        float u = 0.5f, v = 0.25f;
        memcpy(g_verts + 2 + i*32 +  0, &x, 4);
        memcpy(g_verts + 2 + i*32 +  4, &y, 4);
        memcpy(g_verts + 2 + i*32 +  8, &z, 4);
        memcpy(g_verts + 2 + i*32 + 12, &rhw, 4);
        memcpy(g_verts + 2 + i*32 + 16, &diff, 4);
        memcpy(g_verts + 2 + i*32 + 20, &spec, 4);
        memcpy(g_verts + 2 + i*32 + 24, &u, 4);
        memcpy(g_verts + 2 + i*32 + 28, &v, 4);
    }
    for (i = 0; i < 54; ++i) g_idx[i] = (unsigned short)(i % 36);
    memcpy(g_ids, "\x22\x00\x34\x00\x22\x00\x34\x00\x22", 9);

    before = *pWrite;
    {
        unsigned long off;
        unsigned char* t = base;
        dumpNode = NULL;
        for (off = 0x1000; off < 0x1B000; ++off) {
            if (t[off] == 0x83 && t[off+1] == 0xEC && t[off+2] == 0x48 &&
                t[off+3] == 0x33 && t[off+4] == 0xC0 && t[off+5] == 0x53 &&
                t[off+6] == 0x56 && t[off+7] == 0x33 && t[off+8] == 0xDB) {
                printf("DumpNode prologue found at RVA 0x%lx\n", off);
                fflush(stdout);
                dumpNode = (PFN_DumpNode)(t + off);
                break;
            }
        }
        if (!dumpNode) { printf("prologue not found in image\n"); fflush(stdout); return 6; }
    }
    printf("dumpnode bytes ok\n");
    fflush(stdout);
    {
        unsigned long code = 0;
        __try {
            dumpNode(51, (const void*)0x1234, g_node);
        } __except (code = GetExceptionCode(), EXCEPTION_EXECUTE_HANDLER) {
            printf("AV code=0x%08lx\n", code);
            fflush(stdout);
            return 5;
        }
    }
    after = *pWrite;

    printf("g_dumpWrite: %lu -> %lu (delta=%lu)  frameRecords=%lu\n",
           before, after, after - before, *pFrameRec);
    if (after > before) {
        unsigned long n = after - before, k, start = before;
        printf("head 72: ");
        for (k = 0; k < 72 && k < n; ++k) printf("%02x ", ring[start + k]);
        printf("\ntail 40: ");
        for (k = (n > 40 ? n - 40 : 0); k < n; ++k) printf("%02x ", ring[start + k]);
        printf("\n");
        f = fopen("harness_record.bin", "wb");
        if (f) { fwrite(ring + start, 1, n, f); fclose(f); }
    }
    FreeLibrary(h);
    return 0;
}
