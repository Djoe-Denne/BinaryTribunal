/* h2.c — mini-harness: DumpNode(51) on the deployed DLL (53464B47), sentinel node,
 * print g_dumpWrite delta + ring bytes around the idx/fvf boundary. cl /Ox h2.c */
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <stdio.h>
#include <string.h>

typedef void (__cdecl *PFN_DumpNode)(unsigned slot, const void* ctx, const void* node);

static unsigned char g_node[0x40];
static unsigned char g_geom[0x80];
static unsigned char g_pool[2 + 64 * 32];   /* [0..2) = prefix sentinel ; [2..) = grid */
static unsigned short g_idx[64];

int main(int argc, char** argv)
{
    const char* dll = (argc > 1) ? argv[1] : "C:\\Users\\djden\\AppData\\Local\\Temp\\harness_target.dll";
    HMODULE h;
    unsigned char* base;
    unsigned long *pSeq, *pCap, *pOvf, *pWrite, *pCommit, *pRec;
    unsigned long before, after, i;
    unsigned char* ring;
    PFN_DumpNode dump;

    h = LoadLibraryA(dll);
    if (!h) { printf("load failed %lu\n", GetLastError()); return 2; }
    base = (unsigned char*)h;
    printf("base=%p\n", (void*)base);
    /* ASLR may relocate: all accesses below are RVA-based (base + RVA), and the
     * DLL's own absolute refs are fixed up by its .reloc at the loaded base. */

    pSeq    = (unsigned long*)(base + 0x4054EB0ul); /* VA 0x14054EB0 */
    pCap    = (unsigned long*)(base + 0x4054EB4ul);
    pOvf    = (unsigned long*)(base + 0x4054EC8ul);
    pWrite  = (unsigned long*)(base + 0x0054E94ul); /* VA 0x10054E94 */
    pCommit = (unsigned long*)(base + 0x4054E98ul);
    pRec    = (unsigned long*)(base + 0x4054EB8ul);
    ring    = base + 0x0054E98ul;

    *pSeq = 100; *pCap = 115; *pOvf = 0; *pWrite = 0; *pCommit = 0; *pRec = 0;

    memset(g_node, 0, sizeof(g_node));
    *(unsigned long*)(g_node + 0x08) = 9;                    /* remaining */
    *(unsigned long*)(g_node + 0x14) = (unsigned long)(g_pool + 2);  /* verts */
    *(unsigned long*)(g_node + 0x20) = (unsigned long)g_idx;         /* idx */
    *(unsigned long*)(g_node + 0x2C) = (unsigned long)g_geom;        /* geom */
    *(unsigned long*)(g_geom + 0x3C) = 4;                    /* perV */
    *(unsigned long*)(g_geom + 0x40) = 6;                    /* perI */

    g_pool[0] = 0xA1; g_pool[1] = 0xA2;                      /* prefix sentinel */
    memset(g_pool + 2, 0x22, sizeof(g_pool) - 2);            /* grid sentinel 0x22 */
    for (i = 0; i < 54; ++i) g_idx[i] = 0x1100 + (unsigned short)i;  /* idx sentinel */

    dump = (PFN_DumpNode)(base + 0x19D0ul);
    before = *pWrite;
    dump(51, (const void*)0x12345678, g_node);
    after = *pWrite;
    printf("write delta = %lu (contract=1324, +2 model=1326)\n", after - before);
    printf("commit=%lu rec=%lu\n", *pCommit, *pRec);

    /* dump record bytes 100..140 (idx tail -> fvf head boundary at 164..174) */
    {
        unsigned long k;
        printf("ring[100..200): ");
        for (k = 100; k < 200; ++k) printf("%02x", ring[k]);
        printf("\n");
        printf("ring[163..185): ");
        for (k = 163; k < 185; ++k) printf("%02x ", ring[k]);
        printf("\n");
        printf("ring[tail-8..tail): ");
        for (k = after - 8; k < after; ++k) printf("%02x ", ring[k]);
        printf("\n");
    }
    FreeLibrary(h);
    return 0;
}
