/* M23-P1B harness_lot23.c — synthetic harness for the hash-pinned dump-writer
 * candidate 0x5641 (parent gate guarantees the pinned copy). LoadLibraryA of
 * argv[1] only; no hook/vtable/VirtualProtect/ReadProcessMemory; no game
 * exports; LoadLibrary/FreeLibrary stay in this clean harness process.
 * argv = <dllcopy> <outputdir>, exactly (no defaults, no live/AF3DN.P paths).
 * sizeof(void*)==4 and sizeof(unsigned long)==4 hard gates. Every failcheck
 * exits 1 after cleanup; expected anomalies are named characterizations
 * (CONFIRMED_SILENT_ST_CAP, ring-drop flagged 1|4, epoch hole), never a
 * "contract PASS" claim.
 * Parent-verified RVAs (PE ImageBase 0x10000000, sha256
 * 3ab7f5c45855f1de59c5d80481ebb2e1ac17e1e2eba4d71a6ddce9951b9d9a01):
 *   DumpNode cdecl 5 args RVA 0x2160; StEmit cdecl 4xu32 RVA 0x2080;
 *   g_hostModule 0x23E98 (ctor 10001053 push0, 10001055 callIAT,
 *   1000105B store [10023E98]); g_dumpWrite 0x55FD4; g_dumpRing 0x55FD8
 *   (64 MiB array ending exactly at RVA 0x55FD8+0x4000000);
 *   g_dumpCommit 0x4055FD8 (instr 100020BC loads [14055FD8]);
 *   g_frameSeq 0x4055FF0; g_capEndSeq 0x4055FF4; g_frameOverflow 0x4056008;
 *   stateEpoch 0x405613C; stRingDrops 0x4056140; stBroken 0x4056144;
 *   frameStRecs 0x4056148.
 * Record grammars are the repo's own decoders (ff8dump / analyze_lot22_state /
 * lot23_contract, nothing invented): ST09 hdr 8xu32; ND hdr 9xu32 (slot@4,
 * seq@8, ctx@12, node@0x10, kind@0x14, fails@24, psize@28, build@0x20);
 * ND08 kind2 payload = node[24]+counts(8)+idx(12)+fvf(192)+v14 footer 44B
 * (tpage,mode,clut,idc,dropped,texobj,window,clut_sys,ot_z,epoch,flags);
 * TX07 '<8I'+VRAM 0x100000+sysrow 2048+texwin 8; TR08 '<10I'+psz+csz;
 * kind6 ST09: value = matdesc token *(ctx+0x38), aux = gate *(ctx+0xAC4).
 */
#define _CRT_SECURE_NO_WARNINGS
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

typedef unsigned long u32;
typedef void (__cdecl *StEmitFn)(u32, u32, u32, u32);
typedef void (__cdecl *DumpNodeFn)(u32, const void*, const void*, u32, const void*);

#define RVA_ST_EMIT     0x2080u
#define RVA_DUMP_NODE   0x2160u
#define RVA_HOST_MODULE 0x23E98u
#define RVA_WRITE       0x55FD4u
#define RVA_RING        0x55FD8u
#define RING_CAP        0x4000000u
#define RVA_COMMIT      0x4055FD8u
#define RVA_FRAME_SEQ   0x4055FF0u
#define RVA_CAP_END_SEQ 0x4055FF4u
#define RVA_OVERFLOW    0x4056008u
#define RVA_EPOCH       0x405613Cu
#define RVA_DROPS       0x4056140u
#define RVA_BROKEN      0x4056144u
#define RVA_STRECS      0x4056148u

#define BUILD_EXPECT 0x5641u
#define MAGIC_ST     0x39305453u      /* 'ST09' */
#define MAGIC_ND7    0x3730444Eu      /* 'ND07' */
#define MAGIC_ND8    0x3830444Eu      /* 'ND08' */
#define MAGIC_TX     0x37305458u      /* 'TX07' */
#define MAGIC_TR     0x38305254u      /* 'TR08' */
#define SYS_CLUT     0x1B47818u
#define TX_OFF       0x40u
#define TR_OFF       0x100868u
#define ND1_OFF      0x1008E0u
#define ST3_OFF      0x100A1Cu
#define ND2_OFF      0x100A3Cu
#define ND_K2_BYTES  316u             /* 36+24+8+12+192+44 */
#define ND_K0_BYTES  60u              /* 36+24 */
#define MAIN_END     1051512u         /* 32+32+TX+TR+ND+ST+ND */
#define CAP_SAT_END  33432u           /* 32768+ND+32+ND */
#define RD_DROP_END  348u             /* 32+ND */

static u32 Checks, Fails;
static unsigned char* Base;
static const unsigned char* Ring;
static const char* OutDir;

static void chk(const char* name, u32 got, u32 want)
{
    ++Checks;
    if (got == want) printf("PASS %s=%lu\n", name, got);
    else { ++Fails; printf("FAIL %s got=%lu want=%lu\n", name, got, want); }
}
static void chkz(const char* tag, const char* field, u32 got, u32 want)
{
    char nm[64];
    _snprintf(nm, sizeof(nm) - 1, "%s.%s", tag, field);
    nm[sizeof(nm) - 1] = 0;
    chk(nm, got, want);
}
static void chkzone(const char* name, u32 byte, const unsigned char* p, size_t n)
{
    size_t i; u32 bad = 0;
    for (i = 0; i < n; ++i) if (p[i] != byte) ++bad;
    ++Checks;
    if (bad == 0) printf("PASS %s (n=%lu)\n", name, (unsigned long)n);
    else { ++Fails; printf("FAIL %s mismatches=%lu want_byte=0x%02x\n", name, bad, byte); }
}
#define P32(p, off)   (*(u32*)((unsigned char*)(p) + (off)))
#define RDW(rva)      (*(volatile u32*)(Base + (rva)))
#define RS32(off)     (*(volatile u32*)(Ring + (off)))

static u32 SehEmit(StEmitFn fn, u32 a, u32 b, u32 c, u32 d)
{
    __try { fn(a, b, c, d); }
    __except (EXCEPTION_EXECUTE_HANDLER) {
        u32 error = GetExceptionCode();
        printf("FAIL emit_exception=%08lx\n", error); ++Fails; return error;
    }
    return 0;
}
static u32 SehNode(DumpNodeFn fn, u32 slot, const void* ctx, const void* node,
                   u32* pep)
{
    __try { fn(slot, ctx, node, *pep, ctx); }
    __except (EXCEPTION_EXECUTE_HANDLER) { return GetExceptionCode(); }
    return 0;
}

static int SaveRing(u32 n, const char* name)
{
    char path[512];
    FILE* f;
    _snprintf(path, sizeof(path) - 1, "%s\\%s", OutDir, name);
    path[sizeof(path) - 1] = 0;
    f = fopen(path, "wb");
    if (!f) { printf("FAIL save_open=%s\n", name); ++Fails; return 0; }
    if (fwrite(Ring, 1, n, f) != n) { printf("FAIL save_fwrite=%s\n", name); ++Fails; }
    if (fclose(f) != 0) { printf("FAIL save_fclose=%s\n", name); ++Fails; }
    printf("SAVED %s bytes=%lu\n", name, (unsigned long)n);
    return 1;
}

static void StChk(const char* tag, u32 off, u32 seq, u32 ep, u32 kind, u32 typ,
                  u32 val, u32 aux)
{
    const u32* w = (const u32*)(Ring + off);
    chkz(tag, "magic", w[0], MAGIC_ST);
    chkz(tag, "build", w[1], BUILD_EXPECT);
    chkz(tag, "seq",   w[2], seq);
    chkz(tag, "epoch", w[3], ep);
    chkz(tag, "kind",  w[4], kind);
    chkz(tag, "rtype", w[5], typ);
    chkz(tag, "value", w[6], val);
    chkz(tag, "aux",   w[7], aux);
}
static void NdHdrChk(const char* tag, u32 off, u32 slot, u32 seq, u32 kind,
                     u32 psize, u32 ctxv, u32 nodev)
{
    const u32* w = (const u32*)(Ring + off);
    chkz(tag, "magic", w[0], (kind == 2) ? MAGIC_ND8 : MAGIC_ND7);
    chkz(tag, "slot",  w[1], slot);
    chkz(tag, "seq",   w[2], seq);
    chkz(tag, "ctx", w[3], ctxv);
    chkz(tag, "node", w[4], nodev);
    chkz(tag, "kind",  w[5], kind);
    chkz(tag, "fails", w[6], 0);
    chkz(tag, "psize", w[7], psize);
    chkz(tag, "build", w[8], BUILD_EXPECT);
}
static u32 CtxAt, NodeAt;          /* pointers echoed into ND hdr ctx/node */

/* ND08 kind2 with vc=6 ic=6 idc=0: idx u16 [0..5] at +68, fvf at +80, footer
 * 44B (tpage@+272,mode@+276,clut@+280,idc@+284,dropped,window,clut_sys,ot_z
 * then epoch@+308, flags@+312). Ctx/node header words are echoed by the
 * writer for kind0 (directly copied) and are probed for kind2 payloads. */
static void Nd8Chk(const char* tag, u32 off, u32 slot, u32 seq, u32 ep, u32 fl)
{
    char ht[64];
    _snprintf(ht, sizeof(ht) - 1, "%s.hdr", tag);
    ht[sizeof(ht) - 1] = 0;
    NdHdrChk(ht, off, slot, seq, 2, 280, CtxAt, NodeAt);
    printf("probe nd.ctx=0x%08lx node_addr=0x%08lx (harness ctx=0x%08lx "
           "node=0x%08lx)\n", RS32(off + 12), RS32(off + 16), CtxAt, NodeAt);
    chkz(tag, "vc",  RS32(off + 60), 6);
    chkz(tag, "ic",  RS32(off + 64), 6);
    chkz(tag, "idx_01", RS32(off + 68), 0x00010000u);
    chkz(tag, "idx_23", RS32(off + 72), 0x00030002u);
    chkz(tag, "idx_45", RS32(off + 76), 0x00050004u);
    chkzone("nd_fvf_zone", 0x22, Ring + off + 80, 192);
    chkz(tag, "footer_idc", RS32(off + 284), 0);
    printf("probe nd.footer tpage=%08lx mode=%08lx clut=%08lx dropped=%08lx "
           "texobj=%08lx window=%08lx clut_sys=%08lx ot_z=%08lx\n",
           RS32(off + 272), RS32(off + 276), RS32(off + 280),
           RS32(off + 288), RS32(off + 292), RS32(off + 296),
           RS32(off + 300), RS32(off + 304));
    chkz(tag, "footer_epoch", RS32(off + 308), ep);
    chkz(tag, "footer_flags", RS32(off + 312), fl);
}

int main(int argc, char** argv)
{
    HMODULE hmod = NULL;
    unsigned char *host, *vram, *ctx, *backend, *v11, *T, *palMgr, *pixels;
    unsigned char *clut, *node, *vbuf, *idxs;
    StEmitFn stEmit;
    DumpNodeFn dumpNode;
    u32 i, w0, e0, d0, ep, av;
    static const u32 SETUP_SLOTS[6] = {43, 44, 45, 46, 47, 55};
    static const u32 NONSET_SLOTS[4] = {52, 53, 54, 56};

    host = vram = ctx = backend = v11 = T = palMgr = pixels = clut = NULL;
    node = vbuf = idxs = NULL;
    if (argc != 3) {
        printf("usage: harness_lot23.exe <dllcopy> <outputdir>\n");
        printf("FAIL argv_exact_pair_required (no defaults, no live paths)\n");
        return 1;
    }
    OutDir = argv[2];
    if (sizeof(void*) != 4 || sizeof(unsigned long) != 4) {
        printf("FAIL sizeof_voidp=%u sizeof_ulong=%u (x86 only)\n",
               (unsigned)sizeof(void*), (unsigned)sizeof(u32));
        return 1;
    }
    /* DllMain would otherwise try its boot hook. Disable BEFORE LoadLibrary. */
    if (!SetEnvironmentVariableA("FF8_PASSTHROUGH_BOOTHOOK", "0")) {
        printf("FAIL disable_boothook_env=%08lx\n", GetLastError()); return 1;
    }
    {
        const char* base = strrchr(argv[1], '\\');
        base = base ? base + 1 : argv[1];
        if (_stricmp(base, "harness_target.dll") != 0) {
            printf("FAIL pinned_workspace_copy_name_required\n"); return 1;
        }
    }
    hmod = LoadLibraryA(argv[1]);        /* hash-pinned copy (parent gate) */
    if (!hmod) { printf("FAIL load_getlasterror=%08lx\n", GetLastError()); return 1; }
    Base = (unsigned char*)hmod;
    printf("probe module_base=0x%08lx preferred_iba=0x10000000\n", (u32)Base);

    host    = (unsigned char*)calloc(1, 0x1900000);   /* synth host image */
    vram    = (unsigned char*)calloc(1, 0x100000);
    ctx     = (unsigned char*)calloc(1, 0xB00);
    backend = (unsigned char*)calloc(1, 0x30);
    v11     = (unsigned char*)calloc(1, 0xB0);
    T       = (unsigned char*)calloc(1, 0xE0);
    palMgr  = (unsigned char*)calloc(1, 0x20);
    pixels  = (unsigned char*)calloc(1, 16);
    clut    = (unsigned char*)calloc(1, 64);
    node    = (unsigned char*)calloc(1, 64);
    vbuf    = (unsigned char*)calloc(1, 208);   /* 8 guard + 192 verts + 8 guard */
    idxs    = (unsigned char*)calloc(1, 16);    /* 6 u16 */
    if (!host || !vram || !ctx || !backend || !v11 || !T || !palMgr || !pixels ||
        !clut || !node || !vbuf || !idxs) {
        printf("FAIL calloc_alloc\n");
        ++Fails;
        goto cleanup;
    }
    memset(pixels, 0x55, 16);
    memset(clut,   0x66, 64);
    memset(vram,   0x77, 0x100000);
    memset(vbuf,       0x33, 8);
    memset(vbuf + 8,   0x22, 192);
    memset(vbuf + 200, 0xEE, 8);
    for (i = 0; i < 6; ++i) ((unsigned short*)idxs)[i] = (unsigned short)i;

    /* synth tree wiring (parent offsets; host mirrors ff8.exe base 0x400000) */
    *(u32*)(host + (0x1CB602Cu - 0x400000u)) = (u32)vram;   /* dword 1CB602C */
    P32(ctx, 0x30) = 0;
    /* Source backend+20 is decimal 20 = 0x14, not 0x20. */
    P32(ctx, 0x38) = (u32)backend;    P32(backend, 0x14) = (u32)v11;
    P32(v11, 0x98)  = (u32)T;         P32(v11, 0xA0)  = (u32)palMgr;
    P32(T, 0x3C) = 4;   P32(T, 0x40) = 4;   P32(T, 0x5C) = 16;
    P32(T, 0x60) = (u32)clut;  P32(T, 0xD8) = (u32)pixels;
    P32(palMgr, 0xC) = 1;
    P32(node, 0x0C) = 6;  P32(node, 0x18) = 6;
    P32(node, 0x14) = (u32)(vbuf + 8);  P32(node, 0x20) = (u32)idxs;
    P32(node, 0x2C) = 0;              /* slot49 uses ctx T matdesc chain */
    CtxAt = (u32)ctx; NodeAt = (u32)node;
    RDW(RVA_HOST_MODULE) = (u32)host; /* set DLL g_hostModule = host */

    /* init state: write0 commit0 seq1000 cap1015 epoch0 stcount0 broken0 ovf0 */
    RDW(RVA_WRITE) = 0;  RDW(RVA_COMMIT) = 0;  RDW(RVA_FRAME_SEQ) = 1000;
    RDW(RVA_CAP_END_SEQ) = 1015;  RDW(RVA_EPOCH) = 0;  RDW(RVA_STRECS) = 0;
    RDW(RVA_BROKEN) = 0;  RDW(RVA_DROPS) = 0;  RDW(RVA_OVERFLOW) = 0;

    Ring = Base + RVA_RING;
    stEmit   = (StEmitFn)(Base + RVA_ST_EMIT);
    dumpNode = (DumpNodeFn)(Base + RVA_DUMP_NODE);

    /* ---- main stream: 2 ST, DumpNode49 (TX+TR+ND), ST, DumpNode49 (ND) ---- */
    SehEmit(stEmit, 1, 5, 0, 0);                        /* st1 ep1 */
    SehEmit(stEmit, 3, 33, 0, 0);                       /* st2 ep2 */
    ep = RDW(RVA_EPOCH); av = SehNode(dumpNode, 49, ctx, node, &ep);
    if (av) { printf("FAIL nd1_xcp=%08lx\n", av); ++Fails; }
    SehEmit(stEmit, 1, 5, 7, 0);                        /* st3 ep3 */
    ep = RDW(RVA_EPOCH); av = SehNode(dumpNode, 49, ctx, node, &ep);
    if (av) { printf("FAIL nd2_xcp=%08lx\n", av); ++Fails; }

    chk("main_write", RDW(RVA_WRITE), MAIN_END);   /* counts ND2 ST3 TX1 TR1 */
    chk("main_epoch", RDW(RVA_EPOCH), 3);
    StChk("main_st1", 0x0, 1000, 1, 1, 5, 0, 0);
    StChk("main_st2", 0x20, 1000, 2, 3, 33, 0, 0);
    /* TX07 @ 0x40: magic/build/seq + sys_clut (vram word probe below) */
    chkz("main_tx", "ptr", RS32(0x40), MAGIC_TX);
    chkz("main_tx", "build", RS32(0x40 + 4), BUILD_EXPECT);
    chkz("main_tx", "seq", P32(Ring + TX_OFF, 8), 1000);
    chkz("main_tx", "sys_clut_base", P32(Ring + TX_OFF, 20), SYS_CLUT);
    printf("probe tx.clut_now=%08lx tx.vram_base=%08lx "
           "expected_vram_ptr=%08lx tx.m_B7DB44=%08lx tx.page_probe=%08lx\n",
           P32(Ring + TX_OFF, 12), P32(Ring + TX_OFF, 16),
           *(volatile u32*)(host + (0x1CB602Cu - 0x400000u)),
           P32(Ring + TX_OFF, 24), P32(Ring + TX_OFF, 28));
    chkzone("main_tx_vram77",  0x77, Ring + 0x60, 0x100000);
    chkzone("main_tx_sysrow0", 0x00, Ring + 0x60 + 0x100000, 2048);
    printf("probe tx_win8 lo=%08lx hi=%08lx\n",
            RS32(0x60 + 0x100000 + 2048), RS32(0x64 + 0x100000 + 2048));
    /* TR08 @ 0x100868 */
    chkz("main_tr", "magic", RS32(TR_OFF), MAGIC_TR);
    chkz("main_tr", "build", P32(Ring + TR_OFF, 4), BUILD_EXPECT);
    chkz("main_tr", "seq",   P32(Ring + TR_OFF, 8), 1000);
    printf("probe tr.texobj=%08lx\n", P32(Ring + TR_OFF, 12));
    chkz("main_tr", "w",     P32(Ring + TR_OFF, 16), 4);
    chkz("main_tr", "h",     P32(Ring + TR_OFF, 20), 4);
    chkz("main_tr", "pal_entries", P32(Ring + TR_OFF, 24), 16);
    chkz("main_tr", "pal_count",   P32(Ring + TR_OFF, 28), 1);
    chkz("main_tr", "psz",   P32(Ring + TR_OFF, 32), 16);
    chkz("main_tr", "csz",   P32(Ring + TR_OFF, 36), 64);
    chkzone("main_tr_pixels55", 0x55, Ring + TR_OFF + 40, 16);
    chkzone("main_tr_clut66",   0x66, Ring + TR_OFF + 56, 64);
    /* ND08 draws @ 0x1008E0 / 0x100A3C; ctx/node echo goes through the probe */
    Nd8Chk("main_nd1", ND1_OFF, 49, 1000, 2, 1);
    NdHdrChk("main_nd1", ND1_OFF, 49, 1000, 2, 280, (u32)ctx, (u32)node);
    StChk("main_st3", ST3_OFF, 1000, 3, 1, 5, 7, 0);
    Nd8Chk("main_nd2", ND2_OFF, 49, 1000, 3, 1);
    chkzone("src_guard_pre33",  0x33, vbuf, 8);
    chkzone("src_guard_postEE", 0xEE, vbuf + 200, 8);
    SaveRing(MAIN_END, "roundtrip.bin");
    fflush(stdout);

    /* ---- guard: vc5000 must add no record (TX/TR dedup latched) ---- */
    P32(node, 0x0C) = 5000;
    w0 = RDW(RVA_WRITE); e0 = RDW(RVA_EPOCH); ep = e0;
    av = SehNode(dumpNode, 49, ctx, node, &ep);
    if (av) { printf("FAIL guardvc_xcp=%08lx\n", av); ++Fails; }
    chk("guardvc_write_still", RDW(RVA_WRITE), w0);
    chk("guardvc_epoch_still", RDW(RVA_EPOCH), e0);
    P32(node, 0x0C) = 6;                       /* restore vc=6 */
    fflush(stdout);

    /* ---- setup gates: AC4 on -> ST(kind6)+ND07; off -> ND07 only ---- */
    P32(ctx, 0x30) = 1;
    P32(ctx, 0xAC4) = 1;
    printf("probe ctx38_backend_token=0x%08lx (must be nonzero)\n", P32(ctx, 0x38));
    for (i = 0; i < 6; ++i) {
        char tag[40], nt[48];
        _snprintf(tag, sizeof(tag) - 1, "su%02u", (unsigned)i);
        tag[sizeof(tag) - 1] = 0;
        w0 = RDW(RVA_WRITE); e0 = RDW(RVA_EPOCH); ep = e0;
        av = SehNode(dumpNode, SETUP_SLOTS[i], ctx, node, &ep);
        if (av) { printf("FAIL %s_xcp=%08lx\n", tag, av); ++Fails; }
        chkz(tag, "write_delta", RDW(RVA_WRITE), w0 + 32 + ND_K0_BYTES);
        chkz(tag, "epoch_delta", RDW(RVA_EPOCH), e0 + 1);
        StChk(tag, w0, 1000, e0 + 1, 6, SETUP_SLOTS[i], (u32)backend, 1);
        _snprintf(nt, sizeof(nt) - 1, "%s_nd", tag);
        nt[sizeof(nt) - 1] = 0;
        NdHdrChk(nt, w0 + 32, SETUP_SLOTS[i], 1000, 0, 24, (u32)ctx, (u32)node);
        chkz(nt, "vc_in_node_copy", RS32(w0 + 32 + 36 + 0x0C), 6);
    }
    P32(ctx, 0xAC4) = 0;                       /* gate down: ND07 only */
    for (i = 0; i < 6; ++i) {
        char nt[48];
        w0 = RDW(RVA_WRITE); e0 = RDW(RVA_EPOCH); ep = e0;
        av = SehNode(dumpNode, SETUP_SLOTS[i], ctx, node, &ep);
        if (av) { printf("FAIL suoff%02u_xcp=%08lx\n", (unsigned)i, av); ++Fails; }
        chkz("su_off", "write_delta", RDW(RVA_WRITE), w0 + ND_K0_BYTES);
        chkz("su_off", "epoch_same", RDW(RVA_EPOCH), e0);
        _snprintf(nt, sizeof(nt) - 1, "su_off%02u_nd", (unsigned)i);
        nt[sizeof(nt) - 1] = 0;
        NdHdrChk(nt, w0, SETUP_SLOTS[i], 1000, 0, 24, (u32)ctx, (u32)node);
        chkz(nt, "vc_in_node_copy", RS32(w0 + 36 + 0x0C), 6);
    }
    P32(ctx, 0xAC4) = 1;
    for (i = 0; i < 4; ++i) {                  /* 52/53/54/56: no kind6 ST */
        char nt[48];
        w0 = RDW(RVA_WRITE); e0 = RDW(RVA_EPOCH); ep = e0;
        av = SehNode(dumpNode, NONSET_SLOTS[i], ctx, node, &ep);
        if (av) { printf("FAIL nsu%02u_xcp=%08lx\n", (unsigned)i, av); ++Fails; }
        chkz("nsu", "write_delta", RDW(RVA_WRITE), w0 + ND_K0_BYTES);
        chkz("nsu", "epoch_same", RDW(RVA_EPOCH), e0);
        _snprintf(nt, sizeof(nt) - 1, "nsu%02u_nd", (unsigned)i);
        nt[sizeof(nt) - 1] = 0;
        NdHdrChk(nt, w0, NONSET_SLOTS[i], 1000, 0, 24, (u32)ctx, (u32)node);
        chkz(nt, "vc_in_node_copy", RS32(w0 + 36 + 0x0C), 6);
    }
    fflush(stdout);

    /* ---- saturation: per-frame silent ST cap at 1024 (stcount=frameStRecs) */
    RDW(RVA_WRITE) = 0; RDW(RVA_COMMIT) = 0; RDW(RVA_EPOCH) = 0;
    RDW(RVA_STRECS) = 0; RDW(RVA_BROKEN) = 0;   /* drops stays 0 */
    for (i = 0; i < 1024; ++i) SehEmit(stEmit, 1, 0, i + 1, 0);
    chkz("sat", "write", RDW(RVA_WRITE), 32768);
    chkz("sat", "epoch", RDW(RVA_EPOCH), 1024);
    chkz("sat", "strecs", RDW(RVA_STRECS), 1024);
    StChk("sat_last", 32 * 1023, 1000, 1024, 1, 0, 1024, 0);
    SehEmit(stEmit, 1, 0, 99999, 0);
    chkz("sat_cap", "write", RDW(RVA_WRITE), 32768);
    chkz("sat_cap", "epoch", RDW(RVA_EPOCH), 1024);
    chkz("sat_cap", "broken", RDW(RVA_BROKEN), 0);
    chkz("sat_cap", "drops", RDW(RVA_DROPS), 0);
    chkz("sat_cap", "strecs", RDW(RVA_STRECS), 1024);
    printf("probe sat.ovf=%lu\n", (unsigned long)RDW(RVA_OVERFLOW));
    printf("CONFIRMED_SILENT_ST_CAP (1025th raw emit: write/epoch/broken/drops "
           "unchanged)\n");
    ep = 1024; av = SehNode(dumpNode, 49, ctx, node, &ep);
    if (av) { printf("FAIL satnd_xcp=%08lx\n", av); ++Fails; }
    Nd8Chk("sat_nd1", 32768, 49, 1000, 1024, 1);   /* flags 1, not 4 */
    chkz("sat_nd1", "write", RDW(RVA_WRITE), 32768 + ND_K2_BYTES);
    RDW(RVA_FRAME_SEQ) = 1001; RDW(RVA_STRECS) = 0;
    SehEmit(stEmit, 1, 0, 5, 0);
    StChk("sat_st5", 32768 + ND_K2_BYTES, 1001, 1025, 1, 0, 5, 0);
    chkz("sat_st5", "write", RDW(RVA_WRITE), 32768 + ND_K2_BYTES + 32);
    chkz("sat_st5", "epoch", RDW(RVA_EPOCH), 1025);
    ep = 1025; av = SehNode(dumpNode, 49, ctx, node, &ep);
    if (av) { printf("FAIL satnd2_xcp=%08lx\n", av); ++Fails; }
    Nd8Chk("sat_nd2", 32768 + ND_K2_BYTES + 32, 49, 1001, 1025, 1);
    printf("sat.final_write=%lu\n", (unsigned long)RDW(RVA_WRITE));
    SaveRing(CAP_SAT_END, "cap_saturation.bin");
    fflush(stdout);

    /* ---- ring drop: near-cap StEmit -> broken sticky, drops+1, no advance */
    RDW(RVA_WRITE) = RING_CAP - 16; RDW(RVA_COMMIT) = 0;
    w0 = RDW(RVA_WRITE); e0 = RDW(RVA_EPOCH); d0 = RDW(RVA_DROPS);
    SehEmit(stEmit, 1, 0, 0, 0);
    chkz("drop", "write_still", RDW(RVA_WRITE), w0);
    chkz("drop", "epoch_still", RDW(RVA_EPOCH), e0);
    chkz("drop", "broken", RDW(RVA_BROKEN), 1);
    chkz("drop", "drops_p1", RDW(RVA_DROPS), d0 + 1);
    /* reset write/commit/seq/stcount; broken stays sticky */
    RDW(RVA_WRITE) = 0; RDW(RVA_COMMIT) = 0;
    RDW(RVA_FRAME_SEQ) = 1002; RDW(RVA_STRECS) = 0;
    chkz("drop", "broken_sticky", RDW(RVA_BROKEN), 1);
    SehEmit(stEmit, 1, 0, 0, 0);
    chkz("rd", "st_write", RDW(RVA_WRITE), 32);
    StChk("rd_st", 0, 1002, e0 + 1, 1, 0, 0, 0);
    ep = RDW(RVA_EPOCH); av = SehNode(dumpNode, 49, ctx, node, &ep);
    if (av) { printf("FAIL rdnd_xcp=%08lx\n", av); ++Fails; }
    chkz("rd", "write", RDW(RVA_WRITE), RD_DROP_END);
    Nd8Chk("rd_nd", 32, 49, 1002, e0 + 1, 5);      /* flags 1|4 sticky */
    chkz("rd", "broken", RDW(RVA_BROKEN), 1);
    printf("probe rd.drops=%lu seq=%lu commit=%lu\n",
           (unsigned long)RDW(RVA_DROPS), (unsigned long)RDW(RVA_FRAME_SEQ),
           (unsigned long)RDW(RVA_COMMIT));
    SaveRing(RD_DROP_END, "ring_drop.bin");
    printf("EXPECTED_HAZARD state_event_loss_not_recoverable_from_codec "
           "(root strict reader detects first epoch hole; report, not repair)\n");
    fflush(stdout);

    printf("checks=%lu fails=%lu exit=%d\n",
           (unsigned long)Checks, (unsigned long)Fails, Fails ? 1 : 0);
cleanup:
    if (host) free(host);       if (vram) free(vram);
    if (ctx) free(ctx);         if (backend) free(backend);
    if (v11) free(v11);         if (T) free(T);
    if (palMgr) free(palMgr);   if (pixels) free(pixels);
    if (clut) free(clut);       if (node) free(node);
    if (vbuf) free(vbuf);       if (idxs) free(idxs);
    if (hmod) FreeLibrary(hmod);
    return Fails ? 1 : 0;
}
