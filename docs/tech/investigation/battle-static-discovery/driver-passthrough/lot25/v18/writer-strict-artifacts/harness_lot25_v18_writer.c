/* v18 (0x5646) offline writer sentinel, derived from harness_lot25.c.
 * argv: <Temp/opencode DLL copy> <outputdir> <writer|refusal>.
 * The gate starts a FRESH OS PROCESS for each scenario. No lifecycle BSS is
 * reset, no reactivation is expected after restore/refusal, no test export.
 * Capture cursor/counter resets below are writer fixtures only; PIN, attach,
 * detach and in-flight safety belong to the separate lifecycle harness.
 *
 * ABI: ST09 = 40 bytes; ND08 footer = 68 bytes (17 DWORDs); raw RS/blend;
 * direct stub AND faithful host E8 -> stub -> ret 12 -> NOP -> E9 sentinel.
 * E9 at site+6 adds no stack slot. ESP and EBX/ESI/EDI/EBP are canaries.
 * All DLL-private RVAs come from this candidate's MAP via the gate header.
 * No v17 placeholder/address may be reused. Stable exports resolve by name.
 */
#define _CRT_SECURE_NO_WARNINGS
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "lot25_v18_writer_rvas.h"

typedef unsigned long u32;
typedef void (__cdecl *StEmitFn)(u32, u32, u32, u32);
typedef void (__cdecl *DumpNodeFn)(u32, const void*, const void*, u32,
                                  const void*, u32);
typedef int (__cdecl *VoidFn)(void);

#define RING_CAP       0x4000000u
#define HOST_SITE1     0x1EF5Du
#define HOST_SITE2     0x1EF72u
#define BUILD_EXPECT   0x5646u
#define MAGIC_ST       0x39305453u
#define MAGIC_ND7      0x3730444Eu
#define MAGIC_ND8      0x3830444Eu
#define MAGIC_TX       0x37305458u
#define MAGIC_TR       0x38305254u
#define SYS_CLUT       0x1B47818u
static const unsigned char PREIMAGE[6] = {0xFF, 0x90, 0x98, 0, 0, 0};
static const unsigned char CORRUPT[6]  = {0xFF, 0x90, 0x98, 0, 0, 1};

/* Same recomputed record layout as the v15-v17 writer sentinels. */
#define ST_BYTES       40u
#define ND_K2_BYTES    340u
#define ND_K0_BYTES    60u
#define TX_OFF         0x50u
#define TX_BYTES       0x100828u
#define TR_OFF         (TX_OFF + TX_BYTES)
#define TR_BYTES       0x78u
#define ND1_OFF        (TR_OFF + TR_BYTES)
#define ST3_OFF        (ND1_OFF + ND_K2_BYTES)
#define ND2_OFF        (ST3_OFF + ST_BYTES)
#define MAIN_END       (ND2_OFF + ND_K2_BYTES)
#define SAT_ST_END     (ST_BYTES * 1024u)
#define SAT_ND1_OFF    SAT_ST_END
#define SAT_ST5_OFF    (SAT_ND1_OFF + ND_K2_BYTES)
#define SAT_ND2_OFF    (SAT_ST5_OFF + ST_BYTES)
#define CAP_SAT_END    (SAT_ND2_OFF + ND_K2_BYTES)
#define RD_ND_OFF      ST_BYTES
#define RD_DROP_END    (RD_ND_OFF + ND_K2_BYTES)
#define S0_NDA_OFF     (2u * ST_BYTES)
#define S0_B1_K8_OFF   (S0_NDA_OFF + ND_K2_BYTES)
#define S0_B2_K8_OFF   (S0_B1_K8_OFF + 2u * ST_BYTES)
#define S0_NDB_OFF     (S0_B1_K8_OFF + 4u * ST_BYTES)
#define S0_BIN_END     (S0_NDB_OFF + ND_K2_BYTES)
#define S0_NDC_OFF     S0_BIN_END
#define S0_NDD_OFF     (S0_NDC_OFF + ND_K2_BYTES)
#define S0_NEG_END     (S0_NDD_OFF + ND_K2_BYTES)

#define ND_F_IDC       284u
#define ND_F_EPOCH     308u
#define ND_F_FLAGS     312u
#define ND_F_S0TEX     316u
#define ND_F_S0DEV     320u
#define ND_F_S0DEVVT   324u
#define ND_F_S0HR      328u
#define ND_F_STEMIT    332u
#define ND_F_STLOST    336u
#define FL_HAS_EPOCH   1u
#define FL_STG0_VALID  2u
#define FL_INCOMPLETE  4u
#define FL_ST_LOSS     8u
#define S0_DEV        0x00D1CE01u
#define S0_TEX_A      0x0A11CE01u
#define S0_TEX_B      0x0B0B0002u
#define S0_TEX_C      0x0C0C0003u
#define S0_HR         0x1234u

static u32 Checks, Fails;
static unsigned char* Base;
static const unsigned char* Ring;
static const char* OutDir;
static u32 CtxAt, NodeAt;
static u32 g_target_va, g_dev_arg, g_tex_arg, g_devvt_arg;
static u32 g_hr_out, g_esp_a, g_esp_b;
static u32 g_can_ebx, g_can_esi, g_can_edi, g_can_ebp;
static u32 g_fake_calls, g_fake_arg;

static void chk(const char* name, u32 got, u32 want)
{
    ++Checks;
    if (got == want) printf("PASS %s=%lu\n", name, got);
    else { ++Fails; printf("FAIL %s got=%lu want=%lu\n", name, got, want); }
}
static void chkz(const char* tag, const char* field, u32 got, u32 want)
{
    char nm[80];
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
    else { ++Fails; printf("FAIL %s mismatches=%lu want_byte=0x%02lx\n", name, bad, byte); }
}
#define P32(p, off) (*(u32*)((unsigned char*)(p) + (off)))
#define RDW(rva)    (*(volatile u32*)(Base + (rva)))
#define RS32(off)   (*(volatile u32*)(Ring + (off)))

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
                   u32* pep, u32 nres)
{
    __try { fn(slot, ctx, node, *pep, ctx, nres); }
    __except (EXCEPTION_EXECUTE_HANDLER) { return GetExceptionCode(); }
    return 0;
}
static int SaveRing(u32 n, const char* name)
{
    char path[512]; FILE* f;
    u32 pos = 0, nd = 0, st = 0, tx = 0, tr = 0;
    _snprintf(path, sizeof(path) - 1, "%s\\%s", OutDir, name);
    path[sizeof(path) - 1] = 0;
    f = fopen(path, "wb");
    if (!f) { printf("FAIL save_open=%s\n", name); ++Fails; return 0; }
    if (fwrite(Ring, 1, n, f) != n) { printf("FAIL save_fwrite=%s\n", name); ++Fails; }
    if (fclose(f) != 0) { printf("FAIL save_fclose=%s\n", name); ++Fails; }
    while (pos + 4 <= n) {
        u32 magic = RS32(pos);
        if (magic == MAGIC_ST) { ++st; pos += ST_BYTES; }
        else if (magic == MAGIC_TX) { ++tx; pos += TX_BYTES; }
        else if (magic == MAGIC_TR) { ++tr; pos += TR_BYTES; }
        else if ((magic == MAGIC_ND7 || magic == MAGIC_ND8) && pos + 36 <= n)
            { ++nd; pos += 36u + RS32(pos + 28); }
        else break;
    }
    chkz(name, "scan_end", pos, n);
    printf("SAVED %s bytes=%lu counts: nd=%lu st=%lu tx=%lu tr=%lu\n",
           name, n, nd, st, tx, tr);
    return 1;
}
static void StChk(const char* tag, u32 off, u32 seq, u32 ep, u32 kind, u32 typ,
                  u32 val, u32 aux)
{
    const u32* w = (const u32*)(Ring + off);
    chkz(tag, "magic", w[0], MAGIC_ST);
    chkz(tag, "build", w[1], BUILD_EXPECT);
    chkz(tag, "seq", w[2], seq); chkz(tag, "epoch", w[3], ep);
    chkz(tag, "kind", w[4], kind); chkz(tag, "rtype", w[5], typ);
    chkz(tag, "value", w[6], val); chkz(tag, "aux", w[7], aux);
    printf("probe %s.ctx_token=%08lx dev_token=%08lx\n", tag, w[8], w[9]);
}
static void StChkT(const char* tag, u32 off, u32 seq, u32 ep, u32 kind, u32 typ,
                   u32 val, u32 aux, u32 ctx_token, u32 dev_token)
{
    StChk(tag, off, seq, ep, kind, typ, val, aux);
    chkz(tag, "ctx_token", RS32(off + 32), ctx_token);
    chkz(tag, "dev_token", RS32(off + 36), dev_token);
}
static void NdHdrChk(const char* tag, u32 off, u32 slot, u32 seq, u32 kind,
                     u32 psize, u32 ctxv, u32 nodev)
{
    const u32* w = (const u32*)(Ring + off);
    chkz(tag, "magic", w[0], kind == 2 ? MAGIC_ND8 : MAGIC_ND7);
    chkz(tag, "slot", w[1], slot); chkz(tag, "seq", w[2], seq);
    chkz(tag, "ctx", w[3], ctxv); chkz(tag, "node", w[4], nodev);
    chkz(tag, "kind", w[5], kind); chkz(tag, "fails", w[6], 0);
    chkz(tag, "psize", w[7], psize); chkz(tag, "build", w[8], BUILD_EXPECT);
}
static void Nd8Chk(const char* tag, u32 off, u32 slot, u32 seq, u32 ep, u32 fl,
                   u32 st_emit, u32 st_lost)
{
    NdHdrChk(tag, off, slot, seq, 2, 304, CtxAt, NodeAt);
    chkz(tag, "vc", RS32(off + 60), 6); chkz(tag, "ic", RS32(off + 64), 6);
    chkz(tag, "idx_01", RS32(off + 68), 0x00010000u);
    chkz(tag, "idx_23", RS32(off + 72), 0x00030002u);
    chkz(tag, "idx_45", RS32(off + 76), 0x00050004u);
    chkzone("nd_fvf_zone", 0x22, Ring + off + 80, 192);
    chkz(tag, "footer_idc", RS32(off + ND_F_IDC), 0);
    chkz(tag, "footer_epoch", RS32(off + ND_F_EPOCH), ep);
    chkz(tag, "footer_flags", RS32(off + ND_F_FLAGS), fl);
    chkz(tag, "st_emitted", RS32(off + ND_F_STEMIT), st_emit);
    chkz(tag, "st_lost", RS32(off + ND_F_STLOST), st_lost);
}
static void Nd8Stg0Chk(const char* tag, u32 off, u32 tex, u32 dev, u32 devvt, u32 hr)
{
    chkz(tag, "s0_tex", RS32(off + ND_F_S0TEX), tex);
    chkz(tag, "s0_dev", RS32(off + ND_F_S0DEV), dev);
    chkz(tag, "s0_devvt", RS32(off + ND_F_S0DEVVT), devvt);
    chkz(tag, "s0_hr", RS32(off + ND_F_S0HR), hr);
}
static void ChkPreimageAt(const char* tag, const unsigned char* p)
{
    chkz(tag, "preimage_eq", (u32)(memcmp(p, PREIMAGE, 6) == 0), 1);
}
static void ChkPatchedSite(const char* tag, const unsigned char* site, u32 stub_va)
{
    chkz(tag, "e8", site[0], 0xE8); chkz(tag, "nop6", site[5], 0x90);
    chkz(tag, "rel32", P32(site, 1), stub_va - ((u32)site + 5));
}
static DWORD __stdcall fake_settexture(DWORD device, DWORD stage, DWORD texture)
{
    ++g_fake_calls; g_fake_arg = device ^ stage ^ texture;
    return S0_HR;
}

/* Direct stdcall: exactly three arguments, ret 12, no synthetic fourth slot. */
static void RunStubCall(u32 target_va, u32 dev, u32 tex, u32 devvt)
{
    g_target_va = target_va; g_dev_arg = dev; g_tex_arg = tex; g_devvt_arg = devvt;
    __asm {
        push ebx
        push esi
        push edi
        push ebp
        mov ebx, 0DEADBEEFh
        mov esi, 0DEADF00Dh
        mov edi, 0FEEDFACEh
        mov ebp, 0CAFEBABEh
        mov dword ptr [g_esp_a], esp
        push dword ptr [g_tex_arg]
        push 0
        push dword ptr [g_dev_arg]
        mov eax, dword ptr [g_devvt_arg]
        call dword ptr [g_target_va]
        mov dword ptr [g_hr_out], eax
        mov dword ptr [g_esp_b], esp
        mov dword ptr [g_can_ebx], ebx
        mov dword ptr [g_can_esi], esi
        mov dword ptr [g_can_edi], edi
        mov dword ptr [g_can_ebp], ebp
        pop ebp
        pop edi
        pop esi
        pop ebx
    }
}
static u32 TryStubCall(u32 target, u32 dev, u32 tex, u32 devvt, u32* xcp)
{
    *xcp = 0;
    __try { RunStubCall(target, dev, tex, devvt); }
    __except (EXCEPTION_EXECUTE_HANDLER) { *xcp = GetExceptionCode(); return 1; }
    return 0;
}
static int g_warm;
static u32 g_back_addr;
/* Faithful host flow: JMP site, E8 pushes site+5, ret 12 pops three args,
 * site+5 NOP then site+6 E9 jumps back without touching the stack. */
static void RunSiteCall(u32 site_va, u32 dev, u32 tex, u32 devvt)
{
    g_target_va = site_va; g_dev_arg = dev; g_tex_arg = tex; g_devvt_arg = devvt;
    __asm {
        push ebx
        push esi
        push edi
        push ebp
        mov ebx, 0DEADBEEFh
        mov esi, 0DEADF00Dh
        mov edi, 0FEEDFACEh
        mov ebp, 0CAFEBABEh
        mov dword ptr [g_esp_a], esp
        mov dword ptr [g_back_addr], OFFSET sitecall_back
        cmp dword ptr [g_warm], 0
        je sitecall_go
        pop ebp
        pop edi
        pop esi
        pop ebx
        jmp sitecall_end
sitecall_go:
        push dword ptr [g_tex_arg]
        push 0
        push dword ptr [g_dev_arg]
        mov eax, dword ptr [g_devvt_arg]
        jmp dword ptr [g_target_va]
sitecall_back:
        mov dword ptr [g_hr_out], eax
        mov dword ptr [g_esp_b], esp
        mov dword ptr [g_can_ebx], ebx
        mov dword ptr [g_can_esi], esi
        mov dword ptr [g_can_edi], edi
        mov dword ptr [g_can_ebp], ebp
        pop ebp
        pop edi
        pop esi
        pop ebx
sitecall_end:
    }
}
static u32 TrySiteCall(u32 site, u32 dev, u32 tex, u32 devvt, u32* xcp)
{
    *xcp = 0;
    __try { RunSiteCall(site, dev, tex, devvt); }
    __except (EXCEPTION_EXECUTE_HANDLER) { *xcp = GetExceptionCode(); return 1; }
    return 0;
}
static void StubMechChk(const char* tag, u32 want_calls, u32 tex)
{
    chkz(tag, "hr", g_hr_out, S0_HR);
    chkz(tag, "fake_calls", g_fake_calls, want_calls);
    chkz(tag, "fake_arg_echo", g_fake_arg, S0_DEV ^ tex);
    chkz(tag, "can_ebx", g_can_ebx, 0xDEADBEEFu);
    chkz(tag, "can_esi", g_can_esi, 0xDEADF00Du);
    chkz(tag, "can_edi", g_can_edi, 0xFEEDFACEu);
    chkz(tag, "can_ebp", g_can_ebp, 0xCAFEBABEu);
    chkz(tag, "esp_delta", g_esp_b - g_esp_a, 0);
}
static int CallPatchedSite(const char* tag, unsigned char* site, u32 tex, u32 devvt)
{
    DWORD op, restored; u32 xc, bad;
    unsigned char savedTail[5];
    g_warm = 1; bad = TrySiteCall((u32)site, S0_DEV, tex, devvt, &xc); g_warm = 0;
    chkz(tag, "warmup_exception", bad, 0);
    if (bad) return 0;
    if (!VirtualProtect(site, 16, PAGE_EXECUTE_READWRITE, &op)) {
        printf("FAIL %s_virtualprotect=%08lx\n", tag, GetLastError()); ++Fails; return 0;
    }
    memcpy(savedTail, site + 6, sizeof(savedTail));
    site[6] = 0xE9;
    P32(site, 7) = g_back_addr - ((u32)site + 11);
    chkz(tag, "flush_cache", FlushInstructionCache(GetCurrentProcess(), site, 16) != 0, 1);
    bad = TrySiteCall((u32)site, S0_DEV, tex, devvt, &xc);
    chkz(tag, "exception", bad, 0);
    if (bad) printf("probe %s_xcp=%08lx\n", tag, xc);
    /* This synthetic continuation is NOT part of the candidate patch. Put
     * back the fixture's neighbors before the candidate's 14-byte restore
     * readback; do not weaken that readback or change its saved window. */
    memcpy(site + 6, savedTail, sizeof(savedTail));
    chkz(tag, "flush_tail_restore", FlushInstructionCache(GetCurrentProcess(), site + 6, sizeof(savedTail)) != 0, 1);
    chkz(tag, "protect_restore", VirtualProtect(site, 16, op, &restored) != 0, 1);
    return bad == 0;
}

int main(int argc, char** argv)
{
    HMODULE hmod = NULL;
    unsigned char *host, *vram, *ctx, *backend, *v11, *T, *palMgr, *pixels;
    unsigned char *clut, *node, *vbuf, *idxs, *devvt, *site1p, *site2p;
    StEmitFn stEmit = NULL; DumpNodeFn dumpNode = NULL;
    VoidFn pInstall = NULL, pRestore = NULL;
    u32 stubVa = 0, ret_ok, ret_fc, ret2, i, w0, e0, d0, ep, av, xc, x;
    int refusal;
    char sidepath[512];
    static const u32 SETUP_SLOTS[6] = {43, 44, 45, 46, 47, 55};
    static const u32 NONSET_SLOTS[4] = {52, 53, 54, 56};
    host = vram = ctx = backend = v11 = T = palMgr = pixels = clut = NULL;
    node = vbuf = idxs = devvt = site1p = site2p = NULL;
    ret_ok = ret_fc = ret2 = w0 = e0 = d0 = ep = av = xc = x = 0;
    if (argc != 4 || (strcmp(argv[3], "writer") && strcmp(argv[3], "refusal"))) {
        printf("usage: harness_lot25_v18_writer.exe <dllcopy> <outputdir> <writer|refusal>\n");
        return 1;
    }
    OutDir = argv[2]; refusal = strcmp(argv[3], "refusal") == 0;
    printf("phase=%s pid=%lu\n", argv[3], GetCurrentProcessId());
    if (sizeof(void*) != 4 || sizeof(u32) != 4) {
        printf("FAIL x86_only\n"); return 1;
    }
    chk("layout_st09", ST_BYTES, 40);
    chk("layout_tx_bytes", TX_BYTES, 0x100828u);
    chk("layout_tr_bytes", TR_BYTES, 0x78u);
    chk("layout_nd_k2", ND_K2_BYTES, 36u + 24u + 8u + 12u + 192u + 68u);
    chk("layout_nd_k0", ND_K0_BYTES, 60);
    chk("layout_nd2_off", ND2_OFF, ND1_OFF + ND_K2_BYTES + ST_BYTES);
    chk("layout_main_end", MAIN_END, ND2_OFF + ND_K2_BYTES);
    chk("layout_cap_end", CAP_SAT_END, SAT_ST_END + 2 * ND_K2_BYTES + ST_BYTES);
    chk("layout_rd_end", RD_DROP_END, ST_BYTES + ND_K2_BYTES);
    if (!SetEnvironmentVariableA("FF8_PASSTHROUGH_BOOTHOOK", "0")) {
        printf("FAIL disable_boothook_env=%08lx\n", GetLastError()); return 1;
    }
    {
        const char* base = strrchr(argv[1], '\\');
        base = base ? base + 1 : argv[1];
        if (_stricmp(base, "harness_target.dll")) {
            printf("FAIL pinned_workspace_copy_name_required\n"); return 1;
        }
    }
    _snprintf(sidepath, sizeof(sidepath) - 1, "%s\\gfx_passthrough.stage0", OutDir);
    sidepath[sizeof(sidepath) - 1] = 0;
    if (GetFileAttributesA(sidepath) != INVALID_FILE_ATTRIBUTES) {
        printf("FAIL writer_uses_export_optin_not_attach_marker\n"); return 1;
    }
    _snprintf(sidepath, sizeof(sidepath) - 1, "%s\\gfx_passthrough.nohook", OutDir);
    sidepath[sizeof(sidepath) - 1] = 0;
    if (GetFileAttributesA(sidepath) != INVALID_FILE_ATTRIBUTES) {
        printf("FAIL nohook_would_block_pin\n"); return 1;
    }
    hmod = LoadLibraryA(argv[1]);
    if (!hmod) { printf("FAIL load_getlasterror=%08lx\n", GetLastError()); return 1; }
    Base = (unsigned char*)hmod;
    printf("probe module_base=0x%08lx preferred_iba=0x10000000\n", (u32)Base);
    host = (unsigned char*)calloc(1, 0x1900000);
    vram = (unsigned char*)calloc(1, 0x100000);
    ctx = (unsigned char*)calloc(1, 0xB00);
    backend = (unsigned char*)calloc(1, 0x30);
    v11 = (unsigned char*)calloc(1, 0xB0);
    T = (unsigned char*)calloc(1, 0xE0);
    palMgr = (unsigned char*)calloc(1, 0x20);
    pixels = (unsigned char*)calloc(1, 16);
    clut = (unsigned char*)calloc(1, 64);
    node = (unsigned char*)calloc(1, 64);
    vbuf = (unsigned char*)calloc(1, 208);
    idxs = (unsigned char*)calloc(1, 16);
    devvt = (unsigned char*)calloc(1, 0x100);
    if (!host || !vram || !ctx || !backend || !v11 || !T || !palMgr || !pixels ||
        !clut || !node || !vbuf || !idxs || !devvt) {
        printf("FAIL calloc_alloc\n"); ++Fails; goto cleanup;
    }
    memset(pixels, 0x55, 16); memset(clut, 0x66, 64); memset(vram, 0x77, 0x100000);
    memset(vbuf, 0x33, 8); memset(vbuf + 8, 0x22, 192); memset(vbuf + 200, 0xEE, 8);
    memset(devvt, 0x41, 0x100);
    for (i = 0; i < 6; ++i) ((unsigned short*)idxs)[i] = (unsigned short)i;
    P32(host, 0x1CB602Cu - 0x400000u) = (u32)vram;
    P32(ctx, 0x38) = (u32)backend; P32(backend, 0x14) = (u32)v11;
    P32(v11, 0x98) = (u32)T; P32(v11, 0xA0) = (u32)palMgr;
    P32(T, 0x3C) = 4; P32(T, 0x40) = 4; P32(T, 0x5C) = 16;
    P32(T, 0x60) = (u32)clut; P32(T, 0xD8) = (u32)pixels; P32(palMgr, 0xC) = 1;
    P32(node, 0x0C) = 6; P32(node, 0x18) = 6;
    P32(node, 0x14) = (u32)(vbuf + 8); P32(node, 0x20) = (u32)idxs;
    P32(devvt, 0x98) = (u32)fake_settexture;
    CtxAt = (u32)ctx; NodeAt = (u32)node;
    RDW(RVA_HOST_MODULE) = (u32)host; /* writer-only synthetic host injection */
    site1p = host + HOST_SITE1; site2p = host + HOST_SITE2;
    memcpy(site1p, PREIMAGE, 6); memcpy(site2p, PREIMAGE, 6);
    /* These sites are created after attach: no claim about attach patching. */
    RDW(RVA_WRITE) = 0; RDW(RVA_COMMIT) = 0; RDW(RVA_FRAME_SEQ) = 1000;
    RDW(RVA_CAP_END_SEQ) = 1015; RDW(RVA_EPOCH) = 0; RDW(RVA_STRECS) = 0;
    RDW(RVA_BROKEN) = 0; RDW(RVA_DROPS) = 0; RDW(RVA_OVERFLOW) = 0;
    Ring = Base + RVA_RING;
    stEmit = (StEmitFn)(Base + RVA_ST_EMIT);
    dumpNode = (DumpNodeFn)(Base + RVA_DUMP_NODE);
    pInstall = (VoidFn)GetProcAddress(hmod, "Passthrough_InstallStage0Hooks");
    pRestore = (VoidFn)GetProcAddress(hmod, "Passthrough_RestoreStage0Hooks");
    stubVa = (u32)GetProcAddress(hmod, "Passthrough_Stage0Stub");
    chk("gp_install_nonnull", pInstall != NULL, 1);
    chk("gp_restore_nonnull", pRestore != NULL, 1); chk("gp_stub_nonnull", stubVa != 0, 1);
    if (!pInstall || !pRestore || !stubVa) goto cleanup;

    if (refusal) {
        /* This module has never attempted activation in any other process. */
        memcpy(site2p, CORRUPT, 6);
        ret_fc = (u32)pInstall(); chk("fc_first_install_refused", ret_fc, 0);
        ChkPreimageAt("fc_site1", site1p);
        chk("fc_site2_untouched", memcmp(site2p, CORRUPT, 6) == 0, 1);
        memcpy(site2p, PREIMAGE, 6);
        ret2 = (u32)pInstall(); chk("fc_repaired_retry_terminal", ret2, 0);
        ChkPreimageAt("fc_retry_site1", site1p); ChkPreimageAt("fc_retry_site2", site2p);
        printf("CONFIRMED_INITIAL_REFUSAL_TERMINAL (no lifecycle state reset)\n");
    } else {
        ret_ok = (u32)pInstall(); chk("install_success", ret_ok, 1);
        ChkPatchedSite("inst_site1", site1p, stubVa);
        ChkPatchedSite("inst_site2", site2p, stubVa);
        chk("inst_ret1", RDW(RVA_S0_RET1), (u32)site1p + 5);
        chk("inst_ret2", RDW(RVA_S0_RET2), (u32)site2p + 5);
        printf("CONFIRMED_STAGE0_INSTALLER_ARMED\n");
    }
    if (Fails) goto cleanup;

    /* Regression stream: two ST, TX+TR+ND, one ST, ND. No kind9 yet. */
    SehEmit(stEmit, 1, 5, 0, 0); SehEmit(stEmit, 3, 33, 0, 0);
    ep = RDW(RVA_EPOCH); av = SehNode(dumpNode, 49, ctx, node, &ep, 5);
    chk("nd1_exception", av, 0);
    SehEmit(stEmit, 1, 5, 7, 0);
    ep = RDW(RVA_EPOCH); av = SehNode(dumpNode, 49, ctx, node, &ep, 5);
    chk("nd2_exception", av, 0);
    chk("main_write", RDW(RVA_WRITE), MAIN_END); chk("main_epoch", RDW(RVA_EPOCH), 3);
    StChk("main_st1", 0, 1000, 1, 1, 5, 0, 0);
    StChk("main_st2", ST_BYTES, 1000, 2, 3, 33, 0, 0);
    chkz("main_tx", "magic", RS32(TX_OFF), MAGIC_TX);
    chkz("main_tx", "build", RS32(TX_OFF + 4), BUILD_EXPECT);
    chkz("main_tx", "seq", RS32(TX_OFF + 8), 1000);
    chkz("main_tx", "sys_clut_base", RS32(TX_OFF + 20), SYS_CLUT);
    chkzone("main_tx_vram77", 0x77, Ring + TX_OFF + 32, 0x100000);
    chkzone("main_tx_sysrow0", 0, Ring + TX_OFF + 32 + 0x100000, 2048);
    chkz("main_tr", "magic", RS32(TR_OFF), MAGIC_TR);
    chkz("main_tr", "build", RS32(TR_OFF + 4), BUILD_EXPECT);
    chkz("main_tr", "seq", RS32(TR_OFF + 8), 1000);
    chkz("main_tr", "w", RS32(TR_OFF + 16), 4);
    chkz("main_tr", "h", RS32(TR_OFF + 20), 4);
    chkz("main_tr", "pal_entries", RS32(TR_OFF + 24), 16);
    chkz("main_tr", "pal_count", RS32(TR_OFF + 28), 1);
    chkz("main_tr", "psz", RS32(TR_OFF + 32), 16);
    chkz("main_tr", "csz", RS32(TR_OFF + 36), 64);
    chkzone("main_tr_pixels55", 0x55, Ring + TR_OFF + 40, 16);
    chkzone("main_tr_clut66", 0x66, Ring + TR_OFF + 56, 64);
    Nd8Chk("main_nd1", ND1_OFF, 49, 1000, 2, FL_HAS_EPOCH, 2, 0);
    StChk("main_st3", ST3_OFF, 1000, 3, 1, 5, 7, 0);
    Nd8Chk("main_nd2", ND2_OFF, 49, 1000, 3, FL_HAS_EPOCH, 3, 0);
    chkzone("src_guard_pre33", 0x33, vbuf, 8);
    chkzone("src_guard_postEE", 0xEE, vbuf + 200, 8);
    SaveRing(MAIN_END, refusal ? "preimage_refusal.bin" : "roundtrip.bin");
    if (refusal || Fails) goto cleanup;

    /* Count guard: excessive vertices must not read/write a partial record. */
    P32(node, 0x0C) = 5000;
    w0 = RDW(RVA_WRITE); e0 = RDW(RVA_EPOCH); ep = e0;
    av = SehNode(dumpNode, 49, ctx, node, &ep, 5);
    chk("guardvc_exception", av, 0); chk("guardvc_write_still", RDW(RVA_WRITE), w0);
    chk("guardvc_epoch_still", RDW(RVA_EPOCH), e0); P32(node, 0x0C) = 6;

    /* Setup gates: kind6 aux is the raw native result, not an applied state. */
    P32(ctx, 0x30) = 1; P32(ctx, 0xAC4) = 1;
    for (i = 0; i < 6; ++i) {
        char tag[40];
        _snprintf(tag, sizeof(tag) - 1, "su%02u", (unsigned)i); tag[sizeof(tag) - 1] = 0;
        w0 = RDW(RVA_WRITE); e0 = RDW(RVA_EPOCH); ep = e0;
        av = SehNode(dumpNode, SETUP_SLOTS[i], ctx, node, &ep, 7);
        chkz(tag, "exception", av, 0);
        chkz(tag, "write_delta", RDW(RVA_WRITE), w0 + ST_BYTES + ND_K0_BYTES);
        chkz(tag, "epoch_delta", RDW(RVA_EPOCH), e0 + 1);
        StChk(tag, w0, 1000, e0 + 1, 6, SETUP_SLOTS[i], (u32)backend, 7);
        chkz(tag, "dev_token_gate", RS32(w0 + 36), 1);
        NdHdrChk(tag, w0 + ST_BYTES, SETUP_SLOTS[i], 1000, 0, 24, CtxAt, NodeAt);
        chkz(tag, "vc_in_node_copy", RS32(w0 + ST_BYTES + 36 + 0x0C), 6);
    }
    P32(ctx, 0xAC4) = 0;
    for (i = 0; i < 6; ++i) {
        w0 = RDW(RVA_WRITE); e0 = RDW(RVA_EPOCH); ep = e0;
        av = SehNode(dumpNode, SETUP_SLOTS[i], ctx, node, &ep, 7);
        chkz("su_off", "exception", av, 0);
        chkz("su_off", "write_delta", RDW(RVA_WRITE), w0 + ND_K0_BYTES);
        chkz("su_off", "epoch_same", RDW(RVA_EPOCH), e0);
        NdHdrChk("su_off", w0, SETUP_SLOTS[i], 1000, 0, 24, CtxAt, NodeAt);
        chkz("su_off", "vc_in_node_copy", RS32(w0 + 36 + 0x0C), 6);
    }
    P32(ctx, 0xAC4) = 1;
    for (i = 0; i < 4; ++i) {
        w0 = RDW(RVA_WRITE); e0 = RDW(RVA_EPOCH); ep = e0;
        av = SehNode(dumpNode, NONSET_SLOTS[i], ctx, node, &ep, 7);
        chkz("nsu", "exception", av, 0);
        chkz("nsu", "write_delta", RDW(RVA_WRITE), w0 + ND_K0_BYTES);
        chkz("nsu", "epoch_same", RDW(RVA_EPOCH), e0);
        NdHdrChk("nsu", w0, NONSET_SLOTS[i], 1000, 0, 24, CtxAt, NodeAt);
        chkz("nsu", "vc_in_node_copy", RS32(w0 + 36 + 0x0C), 6);
    }

    /* Writer-only counters, never the activation state machine or PIN state. */
    RDW(RVA_WRITE) = 0; RDW(RVA_COMMIT) = 0; RDW(RVA_EPOCH) = 0;
    RDW(RVA_STRECS) = 0; RDW(RVA_BROKEN) = 0;
    for (i = 0; i < 1024; ++i) SehEmit(stEmit, 1, 0, i + 1, 0);
    chkz("sat", "write", RDW(RVA_WRITE), SAT_ST_END);
    chkz("sat", "epoch", RDW(RVA_EPOCH), 1024);
    chkz("sat", "strecs", RDW(RVA_STRECS), 1024);
    StChk("sat_last", 40 * 1023, 1000, 1024, 1, 0, 1024, 0);
    SehEmit(stEmit, 1, 0, 99999, 0);
    chkz("sat_cap", "write", RDW(RVA_WRITE), SAT_ST_END);
    chkz("sat_cap", "epoch", RDW(RVA_EPOCH), 1024);
    chkz("sat_cap", "broken", RDW(RVA_BROKEN), 1);
    chkz("sat_cap", "drops_p1", RDW(RVA_DROPS), 1);
    chkz("sat_cap", "strecs", RDW(RVA_STRECS), 1024);
    ep = 1024; av = SehNode(dumpNode, 49, ctx, node, &ep, 5);
    chk("satnd_exception", av, 0);
    Nd8Chk("sat_nd1", SAT_ND1_OFF, 49, 1000, 1024,
           FL_HAS_EPOCH | FL_INCOMPLETE | FL_ST_LOSS, 1024, 1);
    chkz("sat_nd1", "write", RDW(RVA_WRITE), SAT_ND1_OFF + ND_K2_BYTES);
    RDW(RVA_FRAME_SEQ) = 1001; RDW(RVA_STRECS) = 0; RDW(RVA_ST_LOST) = 0;
    SehEmit(stEmit, 1, 0, 5, 0);
    StChk("sat_st5", SAT_ST5_OFF, 1001, 1025, 1, 0, 5, 0);
    chkz("sat_st5", "write", RDW(RVA_WRITE), SAT_ST5_OFF + ST_BYTES);
    chkz("sat_st5", "epoch", RDW(RVA_EPOCH), 1025);
    ep = 1025; av = SehNode(dumpNode, 49, ctx, node, &ep, 5);
    chk("satnd2_exception", av, 0);
    Nd8Chk("sat_nd2", SAT_ND2_OFF, 49, 1001, 1025, FL_HAS_EPOCH | FL_INCOMPLETE, 1, 0);
    SaveRing(CAP_SAT_END, "cap_saturation.bin");

    RDW(RVA_WRITE) = RING_CAP - 16; RDW(RVA_COMMIT) = 0;
    w0 = RDW(RVA_WRITE); e0 = RDW(RVA_EPOCH); d0 = RDW(RVA_DROPS);
    SehEmit(stEmit, 1, 0, 0, 0);
    chkz("drop", "write_still", RDW(RVA_WRITE), w0);
    chkz("drop", "epoch_still", RDW(RVA_EPOCH), e0);
    chkz("drop", "broken", RDW(RVA_BROKEN), 1);
    chkz("drop", "drops_p1", RDW(RVA_DROPS), d0 + 1);
    RDW(RVA_WRITE) = 0; RDW(RVA_COMMIT) = 0;
    RDW(RVA_FRAME_SEQ) = 1002; RDW(RVA_STRECS) = 0; RDW(RVA_ST_LOST) = 0;
    chkz("drop", "broken_sticky", RDW(RVA_BROKEN), 1);
    SehEmit(stEmit, 1, 0, 0, 0);
    chkz("rd", "st_write", RDW(RVA_WRITE), ST_BYTES);
    StChk("rd_st", 0, 1002, e0 + 1, 1, 0, 0, 0);
    ep = RDW(RVA_EPOCH); av = SehNode(dumpNode, 49, ctx, node, &ep, 5);
    chk("rdnd_exception", av, 0); chkz("rd", "write", RDW(RVA_WRITE), RD_DROP_END);
    Nd8Chk("rd_nd", RD_ND_OFF, 49, 1002, e0 + 1, FL_HAS_EPOCH | FL_INCOMPLETE, 1, 0);
    chkz("rd", "broken", RDW(RVA_BROKEN), 1);
    SaveRing(RD_DROP_END, "ring_drop.bin");
    if (Fails) goto cleanup;

    /* Stage0 frames A/B. TX/TR remain deduplicated; only capture state reset. */
    RDW(RVA_WRITE) = 0; RDW(RVA_COMMIT) = 0; RDW(RVA_FRAME_SEQ) = 3000;
    RDW(RVA_EPOCH) = 0; RDW(RVA_STRECS) = 0; RDW(RVA_BROKEN) = 0;
    RDW(RVA_CAP_END_SEQ) = 4000; RDW(RVA_ST_LOST) = 0;
    RDW(RVA_DROPS) = 0; RDW(RVA_OVERFLOW) = 0;
    x = TryStubCall(stubVa, S0_DEV, S0_TEX_A, (u32)devvt, &xc);
    chk("s0a_exception", x, 0);
    if (x) { printf("probe s0a_xcp=%08lx\n", xc); goto cleanup; }
    StubMechChk("s0a", 1, S0_TEX_A);
    StChkT("s0a_k8", 0, 3000, 1, 8, 0, S0_TEX_A, 0, S0_DEV, (u32)devvt);
    StChkT("s0a_k9", ST_BYTES, 3000, 2, 9, 0, S0_TEX_A, S0_HR, S0_DEV, (u32)devvt);
    chk("s0a_epoch", RDW(RVA_EPOCH), 2); chk("s0a_write", RDW(RVA_WRITE), 2 * ST_BYTES);
    ep = RDW(RVA_EPOCH); av = SehNode(dumpNode, 49, ctx, node, &ep, 5);
    chk("nda_exception", av, 0);
    Nd8Chk("nda", S0_NDA_OFF, 49, 3000, 2, FL_HAS_EPOCH | FL_STG0_VALID, 2, 0);
    Nd8Stg0Chk("nda", S0_NDA_OFF, S0_TEX_A, S0_DEV, (u32)devvt, S0_HR);
    chk("nda_write", RDW(RVA_WRITE), S0_NDA_OFF + ND_K2_BYTES);
    RDW(RVA_FRAME_SEQ) = 3001; RDW(RVA_STRECS) = 0;
    if (!CallPatchedSite("s0b1", site1p, S0_TEX_B, (u32)devvt)) goto cleanup;
    StubMechChk("s0b1", 2, S0_TEX_B);
    StChkT("s0b1_k8", S0_B1_K8_OFF, 3001, 3, 8, 1, S0_TEX_B, 0, S0_DEV, (u32)devvt);
    StChkT("s0b1_k9", S0_B1_K8_OFF + ST_BYTES, 3001, 4, 9, 1,
           S0_TEX_B, S0_HR, S0_DEV, (u32)devvt);
    if (!CallPatchedSite("s0b2", site2p, S0_TEX_C, (u32)devvt)) goto cleanup;
    StubMechChk("s0b2", 3, S0_TEX_C);
    StChkT("s0b2_k8", S0_B2_K8_OFF, 3001, 5, 8, 2, S0_TEX_C, 0, S0_DEV, (u32)devvt);
    StChkT("s0b2_k9", S0_B2_K8_OFF + ST_BYTES, 3001, 6, 9, 2,
           S0_TEX_C, S0_HR, S0_DEV, (u32)devvt);
    chk("s0b_epoch", RDW(RVA_EPOCH), 6);
    ep = RDW(RVA_EPOCH); av = SehNode(dumpNode, 49, ctx, node, &ep, 5);
    chk("ndb_exception", av, 0);
    Nd8Chk("ndb", S0_NDB_OFF, 49, 3001, 6, FL_HAS_EPOCH | FL_STG0_VALID, 4, 0);
    Nd8Stg0Chk("ndb", S0_NDB_OFF, S0_TEX_C, S0_DEV, (u32)devvt, S0_HR);
    chk("stage0_write", RDW(RVA_WRITE), S0_BIN_END);
    SaveRing(S0_BIN_END, "stage0.bin");
    printf("CONFIRMED_STAGE0_STUB_RET12_SENTINEL (ESP/canaries, raw HRESULT, ST09/footer)\n");

    ret2 = (u32)pRestore(); chk("restore_success", ret2, 1);
    ChkPreimageAt("rst_site1", site1p); ChkPreimageAt("rst_site2", site2p);
    RDW(RVA_FRAME_SEQ) = 3002; RDW(RVA_STRECS) = 0;
    ep = RDW(RVA_EPOCH); av = SehNode(dumpNode, 49, ctx, node, &ep, 5);
    chk("ndc_exception", av, 0);
    Nd8Chk("ndc", S0_NDC_OFF, 49, 3002, 6, FL_HAS_EPOCH, 0, 0);
    chk("ndc_write", RDW(RVA_WRITE), S0_NDC_OFF + ND_K2_BYTES);
    /* Intact preimages: refusal must be terminal, not caused by corruption. */
    ret2 = (u32)pInstall(); chk("restored_retry_terminal", ret2, 0);
    ChkPreimageAt("terminal_site1", site1p); ChkPreimageAt("terminal_site2", site2p);
    RDW(RVA_FRAME_SEQ) = 3003; RDW(RVA_STRECS) = 0;
    ep = RDW(RVA_EPOCH); av = SehNode(dumpNode, 49, ctx, node, &ep, 5);
    chk("ndd_exception", av, 0);
    Nd8Chk("ndd", S0_NDD_OFF, 49, 3003, 6, FL_HAS_EPOCH, 0, 0);
    chk("terminal_write", RDW(RVA_WRITE), S0_NEG_END);
    SaveRing(S0_NEG_END, "hook_negative.bin");
    printf("CONFIRMED_RESTORE_TERMINAL (no re-arm; no lifecycle state reset)\n");

cleanup:
    /* Restore while host storage is alive, including early failures. No
     * expectation that FreeLibrary can unload a module pinned by activation. */
    if (pRestore) pRestore();
    if (host) free(host); if (vram) free(vram);
    if (ctx) free(ctx); if (backend) free(backend); if (v11) free(v11);
    if (T) free(T); if (palMgr) free(palMgr); if (pixels) free(pixels);
    if (clut) free(clut); if (node) free(node); if (vbuf) free(vbuf);
    if (idxs) free(idxs); if (devvt) free(devvt);
    if (hmod) FreeLibrary(hmod);
    printf("checks=%lu fails=%lu exit=%d\n", Checks, Fails, Fails ? 1 : 0);
    return Fails ? 1 : 0;
}
