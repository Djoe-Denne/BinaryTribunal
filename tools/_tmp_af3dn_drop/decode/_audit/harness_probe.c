/* Harnais lot 13 : appelle GFXPT_DumpNode (RVA 0x19D0) du DLL deploye avec un node
 * synthétique à sentinelles, puis scanne le ring pour lire le record réel.
 * But : identifier la SOURCE réelle de la copie fvf (verts ? verts-2 ? idx ?) et
 * l'écart curseur (advance) vs psize déclaré. x86, stdlib, /MT. */
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

typedef void (__cdecl *DumpNodeFn)(unsigned slot, const void* ctx, const void* node);

static unsigned char* FindBytes(const unsigned char* base, size_t len,
                                const unsigned char* pat, size_t plen)
{
    size_t i, j;
    for (i = 0; i + plen <= len; ++i)
    {
        int ok = 1;
        for (j = 0; j < plen; ++j)
            if (base[i + j] != pat[j]) { ok = 0; break; }
        if (ok) return (unsigned char*)(base + i);
    }
    return 0;
}

int main(int argc, char** argv)
{
    const char* dllPath = (argc > 1) ? argv[1] : "harness_target.dll";
    HMODULE h;
    unsigned char* base;
    unsigned char* ring;
    unsigned long *pSeq, *pCap, *pWrite, *pCommit;
    unsigned char node[24];
    unsigned char idxArea[128];
    unsigned char geomArea[128];
    unsigned char vertsArea[64 * 32 + 16];
    unsigned char guard[4];
    unsigned char beforeVerts[4];
    DumpNodeFn dump;
    unsigned i, seq = 1000, capEnd;
    unsigned char* rec;

    h = LoadLibraryA(dllPath);
    if (!h) { printf("LoadLibrary failed %lu\n", GetLastError()); return 1; }
    base = (unsigned char*)h;
    printf("loaded at %p\n", base);

    /* RNG (écriture directe des globales ; VAs disasm : g_frameSeq ds:[14054EB0h]
     * et g_capEndSeq ds:[14054EAC] → base 0x10000000 ⇒ RVA 0x4054EB0 / 0x4054EAC
     * (elles vivent APRÈS le ring 64 Mo). g_dumpWrite ds:[10054E94] ⇒ RVA 0x54E94. */
    pSeq   = (unsigned*)(base + 0x4054EB0);
    pCap   = (unsigned*)(base + 0x4054EB4);
    pWrite = (unsigned*)(base + 0x54E94);
    pCommit= (unsigned*)(base + 0x54E90); /* heuristic : g_dumpCommit just before write */
    *pSeq = seq;
    capEnd = seq + 15;
    *pCap = capEnd;
    *pWrite = 0;
    *pCommit = 0;

    /* node synthétique : slot-51 closure fields */
    memset(node, 0, sizeof(node));
    *(unsigned*)(node + 0x08) = 9;                    /* remaining = 9 */
    *(unsigned*)(node + 0x14) = (unsigned)(vertsArea); /* verts */
    *(unsigned*)(node + 0x20) = (unsigned)(idxArea);   /* idx */
    *(unsigned*)(node + 0x2C) = (unsigned)(geomArea);  /* geom */
    *(unsigned*)(geomArea + 0x3C) = 4;                 /* perV */
    *(unsigned*)(geomArea + 0x40) = 6;                 /* perI */
    /* sentinelles : idx = 0x11, verts = 0x22, garde avant verts = 0x33 */
    memset(idxArea, 0x11, sizeof(idxArea));
    memset(vertsArea, 0x22, sizeof(vertsArea));
    memset(guard, 0x33, 4);
    memcpy(beforeVerts, guard, 4);
    /* on place la garde 4 octets AVANT le premier vertex : vertsArea[-4..) inexistant,
       donc on copie la garde DANS les 4 octets juste avant (via un buffer plus grand) */
    {
        static unsigned char pool[64 * 32 + 16];
        memset(pool, 0xEE, sizeof(pool));
        memset(pool + 8, 0x33, 4);                    /* pool[8..12) = garde */
        memset(pool + 12, 0x22, 64 * 32);             /* verts @ pool+12 */
        *(unsigned*)(node + 0x14) = (unsigned)(pool + 12);
    }

    dump = (DumpNodeFn)(base + 0x19D0);
    dump(51, (const void*)0x12345678, node);

    printf("after: seq=%lu capEnd=%lu write=%lu commit=%lu\n",
           *pSeq, *pCap, *pWrite, *pCommit);
    {
        /* compteurs globaux (VAs disasm) : g_dumpSehFails EA8, g_frameFails?, guards, overflow */
        unsigned long* cEA0 = (unsigned long*)(base + 0x4054EA0);
        unsigned long* cEA4 = (unsigned long*)(base + 0x4054EA4);
        unsigned long* cEA8 = (unsigned long*)(base + 0x4054EA8);
        unsigned long* cEAC = (unsigned long*)(base + 0x4054EAC);
        unsigned long* cEC0 = (unsigned long*)(base + 0x4054EC0);
        unsigned long* cEC4 = (unsigned long*)(base + 0x4054EC4);
        unsigned long* cEC8 = (unsigned long*)(base + 0x4054EC8);
        printf("counters: EA0=%lu EA4=%lu EA8(sehfails)=%lu EAC=%lu EC0=%lu EC4=%lu EC8(overflow)=%lu\n",
               *cEA0, *cEA4, *cEA8, *cEAC, *cEC0, *cEC4, *cEC8);
    }

    /* scan le ring : base RVA 0x54E98 */
    {
        unsigned char pat[4] = {0x4E, 0x44, 0x30, 0x37};
        unsigned char* section = base + 0x54E98;
        size_t secLen = 0x1000;
        rec = FindBytes(section, secLen, pat, 4);
        if (!rec) { printf("ring vide (write=%lu)\n", *pWrite); return 2; }
        printf("ring candidate at %p (delta %ld)\n", rec, (long)((unsigned char*)rec - base));
        /* dump 24 octets du header + 56 premiers octets du node+payload + zone idx/fvf */
        {
            unsigned hdrSlot = *(unsigned*)(rec + 4);
            unsigned hdrKind = *(unsigned*)(rec + 20);
            unsigned hdrPsize = *(unsigned*)(rec + 28);
            unsigned k;
            printf("hdr: slot=%u kind=%u psize=%u\n", hdrSlot, hdrKind, hdrPsize);
            printf("record bytes 32..200:\n");
            for (k = 32; k < 200; ++k)
            {
                printf("%02X ", rec[k]);
                if ((k - 31) % 16 == 0) printf("\n");
            }
            printf("\n");
            /* localisation des sentinelles */
            {
                unsigned char* p33 = FindBytes(rec, 600, (unsigned char*)"\x33\x33\x33\x33", 4);
                unsigned char* p22 = FindBytes(rec, 600, (unsigned char*)"\x22\x22\x22\x22", 4);
                unsigned char* p11 = FindBytes(rec, 600, (unsigned char*)"\x11\x11\x11\x11", 4);
                printf("sentinel idx(0x11) at record+%ld ; verts(0x22) at + %ld ; guard(0x33) at + %ld\n",
                       p11 ? (long)(p11 - rec) : -9999L,
                       p22 ? (long)(p22 - rec) : -9999L,
                       p33 ? (long)(p33 - rec) : -9999L);
            }
        }
    }
    FreeLibrary(h);
    return 0;
}
