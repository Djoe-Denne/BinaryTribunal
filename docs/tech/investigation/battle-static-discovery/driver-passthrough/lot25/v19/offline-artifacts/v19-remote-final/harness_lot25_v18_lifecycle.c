/* Offline x86/MSVC lifecycle witness for the FINAL lot25/v18 candidate.
 * Build/run only through gate_lot25_v18_lifecycle.py: its candidate-specific
 * header is derived from, and bound to, the SHA256-pinned DLL and linker MAP.
 * argv: <A..H> <absolute path to test_candidate.dll>. One process per case.
 *
 * The two host callsites are synthetic, never executed, and must fall wholly
 * in this harness's .text pad. No game, native driver, candidate rebuild,
 * test export, extra LoadLibrary reference, or lifecycle-global substitution.
 * IAT seams affect ONLY this candidate: GetModuleHandleExA observes the REAL
 * PIN before any E8 write (E returns FALSE instead); VirtualProtect in F
 * refuses the initial RWX transition of BOTH owned six-byte stage0 sites.
 *
 * Present seam: call the production naked GFXPT_PresentDetour at its MAP RVA.
 * It executes pushad/pushfd -> GFXPT_PresentWrapC -> production activation ->
 * popfd/popad -> g_pdTrampoline. Only that final return target is a harness
 * function; the non-null engine has native slot +0xA74 == NULL.
 * FF8_PASSTHROUGH_BOOTHOOK=0 in EVERY case: Present/ODS E9 are not installed.
 * This proves the detour path, not the lifecycle of the pre-PIN host E9 hooks.
 *
 * All output is JSONL, unbuffered; checks/counts/actual returns survive faults.
 * H emits its summary BEFORE ExitProcess(73), without Restore or FreeLibrary.
 * The controller validates the subsequent fixed 64-byte LC18 detach witness.
 */
#define _CRT_SECURE_NO_WARNINGS
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <stdio.h>
#include <string.h>
#include "lot25_v18_config.h"

#define PAD_BYTES 0x30000u
#define SITE1_RVA 0x1EF5Du
#define SITE2_RVA 0x1EF72u
#define PRESENT_SENTINEL 0x18C0DE
#define PIN_FLAGS (GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS | GET_MODULE_HANDLE_EX_FLAG_PIN)
#define U32(name) (*(volatile DWORD*)((BYTE*)g_dll + RVA_##name))
#define ARRAY32(name) ((volatile DWORD*)((BYTE*)g_dll + RVA_##name))

typedef char require_x86[(sizeof(void*) == 4 && sizeof(DWORD) == 4) ? 1 : -1];
typedef int (__cdecl *StageFn)(void);
typedef int (__cdecl *PresentFn)(void*);
typedef BOOL (WINAPI *PinFn)(DWORD, LPCSTR, HMODULE*);
typedef BOOL (WINAPI *ProtectFn)(LPVOID, SIZE_T, DWORD, PDWORD);

#pragma section(".text", read, execute)
__declspec(allocate(".text")) static unsigned char g_pad[PAD_BYTES];
static const BYTE g_preimage[6] = {0xFF, 0x90, 0x98, 0, 0, 0};
static DWORD g_engine[0xC00u / 4u];
static BYTE *g_site[2];
static BYTE g_original[2][14];
static HMODULE g_dll;
static StageFn g_install, g_restore;
static FARPROC g_stub;
static PinFn g_realPin;
static ProtectFn g_realProtect;
static DWORD *g_pinSlot, *g_protectSlot;
static DWORD g_pinOriginal, g_protectOriginal;
static int g_failPin, g_failRestore;
static DWORD g_checks, g_fails, g_pinCalls, g_realPinCalls, g_protectFaults;
static DWORD g_loadCalls, g_freeCalls, g_installCalls, g_restoreCalls;
static DWORD g_presentCalls, g_presentReturns;
static char g_case;
static FILETIME g_creation;

static void Check(const char* name, int ok)
{
    ++g_checks;
    if (!ok) ++g_fails;
    printf("{\"event\":\"check\",\"case\":\"%c\",\"index\":%lu,"
           "\"ok\":%s,\"name\":\"%s\"}\n", g_case, g_checks,
           ok ? "true" : "false", name);
}

static int Summary(void)
{
    printf("{\"event\":\"summary\",\"case\":\"%c\",\"checks\":%lu,\"fails\":%lu,"
           "\"load_calls\":%lu,\"free_calls\":%lu,\"install_calls\":%lu,"
           "\"restore_calls\":%lu,\"present_calls\":%lu,\"present_returns\":%lu,"
           "\"pin_calls\":%lu,\"real_pin_calls\":%lu,\"protect_faults\":%lu}\n",
           g_case, g_checks, g_fails, g_loadCalls, g_freeCalls, g_installCalls,
           g_restoreCalls, g_presentCalls, g_presentReturns, g_pinCalls,
           g_realPinCalls, g_protectFaults);
    return g_fails ? 2 : 0;
}

static int Original(int i)
{
    return memcmp(g_site[i] - 4, g_original[i], 14) == 0;
}

static void Windows(const char* phase, int expectHook)
{
    int i, j;
    DWORD target;
    char hex[29];
    for (i = 0; i < 2; ++i)
    {
        for (j = 0; j < 14; ++j)
            sprintf(hex + j * 2, "%02X", (unsigned)g_site[i][j - 4]);
        target = 0;
        if (g_site[i][0] == 0xE8)
            target = (DWORD)g_site[i] + 5u + *(DWORD*)(g_site[i] + 1);
        printf("{\"event\":\"window\",\"phase\":\"%s\",\"site\":%d,\"va\":%lu,"
               "\"hex14\":\"%s\",\"e8_target\":%lu,\"original14\":%s}\n",
               phase, i, (DWORD)g_site[i], hex, target, Original(i) ? "true" : "false");
        Check("window_neighbors_unchanged", memcmp(g_site[i] - 4, g_original[i], 4) == 0
              && memcmp(g_site[i] + 6, g_original[i] + 10, 4) == 0);
        if (expectHook)
            Check("window_E8_stub_Nop", g_site[i][0] == 0xE8 && g_site[i][5] == 0x90
                  && target == (DWORD)g_stub);
        else
        {
            Check("window_original6_exact", memcmp(g_site[i], g_preimage, 6) == 0);
            Check("window_original14_exact", Original(i));
        }
    }
}

static int PrepareHost(void)
{
    BYTE* host = (BYTE*)GetModuleHandleA(NULL);
    DWORD old, ignored;
    int i;
    g_site[0] = host + SITE1_RVA;
    g_site[1] = host + SITE2_RVA;
    Check("synthetic_sites_inside_owned_text_pad",
          (DWORD)(g_site[0] - 4) >= (DWORD)g_pad
          && (DWORD)(g_site[1] + 10) <= (DWORD)(g_pad + sizeof(g_pad)));
    if (g_fails) return 0;
    for (i = 0; i < 2; ++i)
    {
        memset(g_original[i], 0xA0 + i, 14);
        memcpy(g_original[i] + 4, g_preimage, 6);
        memset(g_original[i] + 10, 0xD0 + i, 4);
        Check("prepare_protect", VirtualProtect(g_site[i] - 4, 14,
                                               PAGE_EXECUTE_READWRITE, &old) != 0);
        if (g_fails) return 0;
        memcpy(g_site[i] - 4, g_original[i], 14);
        Check("prepare_protection_restored", VirtualProtect(g_site[i] - 4, 14, old, &ignored) != 0);
        Check("prepare_icache", FlushInstructionCache(GetCurrentProcess(), g_site[i] - 4, 14) != 0);
    }
    Windows("prepared", 0);
    return g_fails == 0;
}

static DWORD OwnedMask(void)
{
    return (ARRAY32(g_stage0_target)[0] ? 1u : 0u)
         | (ARRAY32(g_stage0_target)[1] ? 2u : 0u);
}

static void Snapshot(const char* phase)
{
    printf("{\"event\":\"snapshot\",\"phase\":\"%s\",\"module\":%lu,"
           "\"optin\":%lu,\"nohook\":%lu,\"pinned\":%lu,\"pin_attempts\":%lu,"
           "\"patch_writes\":%lu,\"activation\":%lu,\"lock\":%lu,\"state\":%lu,"
           "\"source\":%lu,\"in_dllmain\":%lu,\"armed\":%lu,\"owned_mask\":%lu,"
           "\"target\":[%lu,%lu],\"ret\":[%lu,%lu],\"frame_seq\":%lu}\n",
           phase, (DWORD)g_dll, U32(g_stage0OptIn), U32(g_stage0DiagNoHook),
           U32(g_stage0Pinned), U32(g_stage0PinAttempts), U32(g_stage0PatchWrites),
           U32(g_stage0Activation), U32(g_stage0Lock), U32(g_stage0LifecycleState),
           U32(g_stage0ActivationSource), U32(g_stage0InDllMain), U32(g_stage0Armed),
           OwnedMask(), ARRAY32(g_stage0_target)[0], ARRAY32(g_stage0_target)[1],
           ARRAY32(g_stage0_ret)[0], ARRAY32(g_stage0_ret)[1], U32(g_frameSeq));
}

static void State(const char* phase, DWORD state, DWORD pinned, DWORD attempts,
                  DWORD writes, DWORD armed, DWORD owned, DWORD activation)
{
    int i;
    Snapshot(phase);
    Check("lifecycle_state", U32(g_stage0LifecycleState) == state);
    Check("pinned_state", U32(g_stage0Pinned) == pinned);
    Check("pin_attempt_count", U32(g_stage0PinAttempts) == attempts);
    Check("E8_write_count", U32(g_stage0PatchWrites) == writes);
    Check("activation_state", U32(g_stage0Activation) == activation);
    Check("armed_state", U32(g_stage0Armed) == armed);
    Check("ownership_mask", OwnedMask() == owned);
    Check("outside_dllmain_lock_released", U32(g_stage0InDllMain) == 0 && U32(g_stage0Lock) == 0);
    for (i = 0; i < 2; ++i)
    {
        Check("target_ret_ownership_exact",
              ARRAY32(g_stage0_target)[i] == ((owned & (1u << i)) ? (DWORD)g_site[i] : 0)
              && ARRAY32(g_stage0_ret)[i] == ((owned & (1u << i)) ? (DWORD)g_site[i] + 5u : 0));
        if (owned & (1u << i))
            Check("saved6_exact", memcmp((BYTE*)g_dll + RVA_g_stage0_saved + i * 6,
                                         g_preimage, 6) == 0);
    }
}

/* Candidate imports only; never hook kernel32 or another module. */
static DWORD* ImportSlot(const char* name)
{
    BYTE* base = (BYTE*)g_dll;
    IMAGE_NT_HEADERS32* nt = (IMAGE_NT_HEADERS32*)(base + ((IMAGE_DOS_HEADER*)base)->e_lfanew);
    IMAGE_DATA_DIRECTORY d = nt->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_IMPORT];
    IMAGE_IMPORT_DESCRIPTOR* id;
    DWORD offset, n;
    DWORD* result = NULL;
    if (!d.VirtualAddress || d.Size < sizeof(*id)) return NULL;
    for (offset = 0; offset + sizeof(*id) <= d.Size; offset += sizeof(*id))
    {
        id = (IMAGE_IMPORT_DESCRIPTOR*)(base + d.VirtualAddress + offset);
        if (!id->Name) break;
        if (!id->OriginalFirstThunk) continue;
        for (n = 0; n < nt->OptionalHeader.SizeOfImage / 4; ++n)
        {
            DWORD rva = ((DWORD*)(base + id->OriginalFirstThunk))[n];
            IMAGE_IMPORT_BY_NAME* ibn;
            if (!rva) break;
            if (IMAGE_SNAP_BY_ORDINAL32(rva)) continue;
            if (rva >= nt->OptionalHeader.SizeOfImage - sizeof(WORD)) return NULL;
            ibn = (IMAGE_IMPORT_BY_NAME*)(base + rva);
            if (strcmp((const char*)ibn->Name, name) == 0)
            {
                if (result) return NULL; /* ambiguous import: refuse */
                result = (DWORD*)(base + id->FirstThunk) + n;
            }
        }
    }
    return result;
}

static int ExchangeImport(DWORD* slot, DWORD expected, DWORD replacement)
{
    DWORD old, ignored;
    DWORD failuresBefore = g_fails;
    BOOL writable;
    Check("IAT_expected_pointer", slot != NULL && *slot == expected);
    if (!slot || *slot != expected) return 0;
    writable = VirtualProtect(slot, 4, PAGE_READWRITE, &old);
    Check("IAT_make_writable", writable != 0);
    if (!writable) return 0;
    InterlockedExchange((volatile LONG*)slot, (LONG)replacement);
    Check("IAT_restore_protection", VirtualProtect(slot, 4, old, &ignored) != 0);
    Check("IAT_readback", *slot == replacement);
    return g_fails == failuresBefore;
}

static BOOL WINAPI ObservePin(DWORD flags, LPCSTR address, HMODULE* retained)
{
    BOOL ok;
    DWORD error;
    MEMORY_BASIC_INFORMATION mbi;
    ++g_pinCalls;
    Check("pin_flags_FROM_ADDRESS_PIN", flags == PIN_FLAGS);
    Check("pin_address_candidate", VirtualQuery(address, &mbi, sizeof(mbi)) == sizeof(mbi)
          && mbi.AllocationBase == (void*)g_dll && mbi.Type == MEM_IMAGE);
    Check("pin_before_writes_before_API", Original(0) && Original(1) && U32(g_stage0PatchWrites) == 0);
    Check("pin_outside_dllmain_serialized", U32(g_stage0InDllMain) == 0
          && U32(g_stage0Lock) == 1 && U32(g_stage0Activation) == 1
          && U32(g_stage0PinAttempts) == 1 && U32(g_stage0Pinned) == 0);
    if (g_failPin)
    {
        if (retained) *retained = NULL;
        SetLastError(ERROR_ACCESS_DENIED);
        ok = FALSE;
    }
    else
    {
        ++g_realPinCalls;
        ok = g_realPin(flags, address, retained);
    }
    error = GetLastError();
    Check("pin_before_writes_after_API", Original(0) && Original(1) && U32(g_stage0PatchWrites) == 0);
    if (!g_failPin)
        Check("real_pin_handle_confirmed", ok && retained && *retained == g_dll
              && U32(g_hinstDLL) == (DWORD)g_dll);
    printf("{\"event\":\"pin_observer\",\"injected_failure\":%s,\"flags\":%lu,"
           "\"result\":%s,\"handle\":%lu,\"original14_after_api\":%s,"
           "\"patch_writes_after_api\":%lu,\"in_dllmain\":%lu,\"winerror\":%lu}\n",
           g_failPin ? "true" : "false", flags, ok ? "true" : "false",
           retained ? (DWORD)*retained : 0, Original(0) && Original(1) ? "true" : "false",
           U32(g_stage0PatchWrites), U32(g_stage0InDllMain), error);
    SetLastError(error);
    return ok;
}

static BOOL WINAPI RefuseRestore(LPVOID address, SIZE_T size, DWORD protect, PDWORD old)
{
    if (g_failRestore && size == 6 && protect == PAGE_EXECUTE_READWRITE
        && (address == g_site[0] || address == g_site[1]))
    {
        ++g_protectFaults;
        printf("{\"event\":\"expected_fault\",\"api\":\"VirtualProtect\","
               "\"phase\":\"restore_initial_protect\",\"address\":%lu,"
               "\"size\":%lu,\"protection\":%lu,\"winerror\":%lu}\n",
               (DWORD)address, (DWORD)size, protect, (DWORD)ERROR_ACCESS_DENIED);
        SetLastError(ERROR_ACCESS_DENIED);
        return FALSE;
    }
    return g_realProtect(address, size, protect, old);
}

static int InstallPinObserver(void)
{
    g_pinSlot = ImportSlot("GetModuleHandleExA");
    Check("candidate_PIN_import_found", g_pinSlot != NULL);
    if (!g_pinSlot) return 0;
    g_pinOriginal = *g_pinSlot;
    g_realPin = (PinFn)g_pinOriginal;
    Check("candidate_PIN_import_is_real_API", (FARPROC)g_realPin ==
          GetProcAddress(GetModuleHandleA("kernel32.dll"), "GetModuleHandleExA"));
    return ExchangeImport(g_pinSlot, g_pinOriginal, (DWORD)&ObservePin);
}

static int InstallProtectFault(void)
{
    g_protectSlot = ImportSlot("VirtualProtect");
    Check("candidate_VirtualProtect_import_found", g_protectSlot != NULL);
    if (!g_protectSlot) return 0;
    g_protectOriginal = *g_protectSlot;
    g_realProtect = (ProtectFn)g_protectOriginal;
    Check("candidate_VirtualProtect_import_is_real_API", (FARPROC)g_realProtect ==
          GetProcAddress(GetModuleHandleA("kernel32.dll"), "VirtualProtect"));
    return ExchangeImport(g_protectSlot, g_protectOriginal, (DWORD)&RefuseRestore);
}

static int ResetImports(void)
{
    if (g_protectSlot && *g_protectSlot == (DWORD)&RefuseRestore)
        if (!ExchangeImport(g_protectSlot, (DWORD)&RefuseRestore, g_protectOriginal)) return 0;
    if (g_pinSlot && *g_pinSlot == (DWORD)&ObservePin)
        if (!ExchangeImport(g_pinSlot, (DWORD)&ObservePin, g_pinOriginal)) return 0;
    return 1;
}

static int __cdecl SyntheticPresentReturn(void* engine)
{
    ++g_presentReturns;
    Check("Present_trampoline_engine_preserved", engine == g_engine);
    return PRESENT_SENTINEL;
}

static void Present(const char* phase)
{
    DWORD before = U32(g_frameSeq), returns = g_presentReturns;
    int result;
    PresentFn detour = (PresentFn)((BYTE*)g_dll + RVA_GFXPT_PresentDetour);
    Check("Present_seam_initially_empty", U32(g_pdTrampoline) == 0);
    Check("Present_engine_nonnull_native_slot_null", g_engine[0xA74u / 4u] == 0);
    Check("Present_boot_hooks_disabled", U32(g_pdTrampoline) == 0 && U32(g_odsTrampoline) == 0);
    if (g_fails) return;
    U32(g_pdTrampoline) = (DWORD)&SyntheticPresentReturn;
    ++g_presentCalls;
    result = detour(g_engine); /* Production naked detour, NOT WrapC or an export. */
    U32(g_pdTrampoline) = 0;
    printf("{\"event\":\"present\",\"phase\":\"%s\",\"detour_rva\":%lu,"
           "\"trampoline_slot_rva\":%lu,\"return\":%d,\"frame_before\":%lu,"
           "\"frame_after\":%lu,\"seam\":\"harness_owned_return_only\"}\n",
           phase, (DWORD)RVA_GFXPT_PresentDetour, (DWORD)RVA_g_pdTrampoline,
           result, before, U32(g_frameSeq));
    Check("Present_production_detour_returned", result == PRESENT_SENTINEL && g_presentReturns == returns + 1);
    Check("Present_production_frame_pulse", U32(g_frameSeq) == before + 1);
    Check("Present_native_wrapper_not_created", U32(g_proxy) == 0 && g_engine[0xA74u / 4u] == 0);
}

static void Install(const char* phase, int expected)
{
    int result;
    ++g_installCalls;
    result = g_install();
    printf("{\"event\":\"install_return\",\"phase\":\"%s\",\"value\":%d}\n", phase, result);
    Check("InstallStage0Hooks_return", result == expected);
}

static void Restore(const char* phase, int expected)
{
    int result;
    ++g_restoreCalls;
    result = g_restore();
    printf("{\"event\":\"restore_return\",\"phase\":\"%s\",\"value\":%d}\n", phase, result);
    Check("RestoreStage0Hooks_return", result == expected);
}

static int ReleaseOnlyReference(const char* path, int retained)
{
    MEMORY_BASIC_INFORMATION mbi;
    HMODULE observed;
    SIZE_T queried;
    BOOL result;
    if (!ResetImports()) return 0;
    Check("sole_LoadLibrary_reference", g_loadCalls == 1 && g_freeCalls == 0);
    ++g_freeCalls;
    result = FreeLibrary(g_dll);
    Check("FreeLibrary_return", result != 0);
    observed = GetModuleHandleA(path); /* observation only: no acquired reference */
    memset(&mbi, 0, sizeof(mbi));
    queried = VirtualQuery(g_dll, &mbi, sizeof(mbi));
    printf("{\"event\":\"residence\",\"module\":%lu,\"get_module_handle\":%lu,"
           "\"query_bytes\":%lu,\"allocation_base\":%lu,\"state\":%lu,\"type\":%lu,"
           "\"load_calls\":%lu,\"free_calls\":%lu}\n", (DWORD)g_dll, (DWORD)observed,
           (DWORD)queried, (DWORD)mbi.AllocationBase, mbi.State, mbi.Type, g_loadCalls, g_freeCalls);
    if (retained)
        Check("pinned_module_still_mapped", observed == g_dll && queried == sizeof(mbi)
              && mbi.AllocationBase == g_dll && mbi.Type == MEM_IMAGE && mbi.State == MEM_COMMIT);
    else
        Check("unretained_module_absent", observed == NULL && queried == sizeof(mbi)
              && mbi.State == MEM_FREE && mbi.AllocationBase == NULL);
    return g_fails == 0;
}

int main(int argc, char** argv)
{
    FILETIME exitTime, kernel, user;
    DWORD expectedOptIn, expectedNoHook;
    int status;
    setvbuf(stdout, NULL, _IONBF, 0);
    SetErrorMode(SEM_FAILCRITICALERRORS | SEM_NOGPFAULTERRORBOX | SEM_NOOPENFILEERRORBOX);
    if (argc != 3 || strlen(argv[1]) != 1 || argv[1][0] < 'A' || argv[1][0] > 'H')
    {
        fprintf(stderr, "usage: harness_lot25_v18_lifecycle A..H absolute-test_candidate.dll\n");
        return 64;
    }
    g_case = argv[1][0];
    expectedOptIn = g_case == 'B' ? 0u : 1u;
    expectedNoHook = g_case == 'G' ? 1u : 0u;
    Check("process_creation_time", GetProcessTimes(GetCurrentProcess(), &g_creation,
                                                   &exitTime, &kernel, &user) != 0);
    printf("{\"event\":\"identity\",\"case\":\"%c\",\"pid\":%lu,\"tid\":%lu,"
           "\"creation_lo\":%lu,\"creation_hi\":%lu,\"dll_sha256\":\"%s\","
           "\"map_sha256\":\"%s\",\"build\":%lu}\n", g_case,
           GetCurrentProcessId(), GetCurrentThreadId(), g_creation.dwLowDateTime,
           g_creation.dwHighDateTime, CANDIDATE_DLL_SHA256, CANDIDATE_MAP_SHA256,
           (DWORD)CANDIDATE_BUILD_ID);
    Check("disable_boot_hooks", SetEnvironmentVariableA("FF8_PASSTHROUGH_BOOTHOOK", "0") != 0);
    if (!PrepareHost()) return Summary();
    ++g_loadCalls;
    g_dll = LoadLibraryA(argv[2]);
    Check("LoadLibrary_candidate", g_dll != NULL);
    if (!g_dll) return Summary();
    g_install = (StageFn)GetProcAddress(g_dll, "Passthrough_InstallStage0Hooks");
    g_restore = (StageFn)GetProcAddress(g_dll, "Passthrough_RestoreStage0Hooks");
    g_stub = GetProcAddress(g_dll, "Passthrough_Stage0Stub");
    Check("unchanged_exports_resolve", g_install && g_restore && g_stub);
    Check("export_MAP_Install_match", (DWORD)g_install == (DWORD)g_dll + RVA_Passthrough_InstallStage0Hooks);
    Check("export_MAP_Restore_match", (DWORD)g_restore == (DWORD)g_dll + RVA_Passthrough_RestoreStage0Hooks);
    Check("export_MAP_Stub_match", (DWORD)g_stub == (DWORD)g_dll + RVA_Passthrough_Stage0Stub);
    if (g_fails) return Summary();
    Check("attach_optin", U32(g_stage0OptIn) == expectedOptIn);
    Check("attach_nohook", U32(g_stage0DiagNoHook) == expectedNoHook);
    Check("attach_activation_source_zero", U32(g_stage0ActivationSource) == 0);
    Check("attach_frame_zero", U32(g_frameSeq) == 0);
    Check("boot_hooks_not_installed", U32(g_pdTrampoline) == 0 && U32(g_odsTrampoline) == 0);
    State("attached", expectedNoHook ? 7 : expectedOptIn, 0, 0, 0, 0, 0, 0);
    Windows("attached", 0);
    if (g_fails) return Summary();

    if (g_case == 'A')
    {
        ReleaseOnlyReference(argv[2], 0);
        Windows("after_free", 0);
        return Summary();
    }
    if (!InstallPinObserver()) return Summary();
    if (g_case == 'B')
    {
        Present("no_sidecar_first");
        Present("no_sidecar_second");
        State("no_sidecar_present_inert", 0, 0, 0, 0, 0, 0, 0);
        Windows("no_sidecar_present_inert", 0);
        Install("explicit_no_sidecar", 1);
        Install("explicit_duplicate", 1);
    }
    else if (g_case == 'C')
    {
        Present("optin_first");
        State("first_present", 3, 1, 1, 2, 1, 3, 1);
        Present("optin_second");
        Check("Present_activation_source", U32(g_stage0ActivationSource) == 1);
        Check("Present_never_called_export", g_installCalls == 0);
    }
    else if (g_case == 'E')
    {
        g_failPin = 1;
        Install("expected_PIN_failure", 0);
        State("pin_failed", 2, 0, 1, 0, 0, 0, 1);
        Windows("pin_failed", 0);
        g_failPin = 0;
        Install("terminal_failure_retry", 0);
        Present("terminal_failure_present");
        State("pin_failure_terminal", 2, 0, 1, 0, 0, 0, 1);
        Check("PIN_failure_injected_once_no_real_PIN", g_pinCalls == 1 && g_realPinCalls == 0);
        ReleaseOnlyReference(argv[2], 0);
        Windows("after_free", 0);
        return Summary();
    }
    else if (g_case == 'G')
    {
        Present("nohook_first");
        Install("nohook_export", 0);
        Present("nohook_second");
        State("nohook_terminal", 7, 0, 0, 0, 0, 0, 1);
        Check("nohook_never_PIN", g_pinCalls == 0 && g_realPinCalls == 0);
        Windows("nohook_terminal", 0);
        ReleaseOnlyReference(argv[2], 0);
        Windows("after_free", 0);
        return Summary();
    }
    else Install("explicit_activation", 1);

    State("armed", 3, 1, 1, 2, 1, 3, 1);
    Windows("armed", 1);
    Check("one_real_PIN_before_writes", g_pinCalls == 1 && g_realPinCalls == 1);
    if (g_case != 'C') Check("explicit_activation_source", U32(g_stage0ActivationSource) == 2);
    if (g_fails) return Summary();
    if (g_case == 'D')
    {
        Restore("normal_restore", 1);
        State("restored", 5, 1, 1, 2, 0, 0, 1);
        Windows("restored", 0);
        Install("terminal_after_restore", 0);
        Present("terminal_after_restore_present");
        State("restore_terminal", 5, 1, 1, 2, 0, 0, 1);
    }
    else if (g_case == 'F')
    {
        if (!InstallProtectFault()) return Summary();
        g_failRestore = 1;
        Restore("expected_restore_fault", 0);
        g_failRestore = 0;
        Check("both_initial_restoration_protects_refused", g_protectFaults == 2);
        State("restore_failed", 6, 1, 1, 2, 0, 3, 1);
        Windows("restore_failed", 1);
        if (!ReleaseOnlyReference(argv[2], 1)) return Summary();
        State("restore_failed_after_free", 6, 1, 1, 2, 0, 3, 1);
        Windows("restore_failed_after_free", 1);
        /* PIN keeps code valid after the sole load reference has been released. */
        Restore("retry_after_free", 1);
        State("retry_restored_retained", 5, 1, 1, 2, 0, 0, 1);
        Windows("retry_restored_retained", 0);
        Install("terminal_after_retry", 0);
        State("final", 5, 1, 1, 2, 0, 0, 1);
        return Summary();
    }
    else if (g_case == 'H')
    {
        if (!ResetImports()) return Summary();
        Check("ExitProcess_armed_without_restore_or_free", g_restoreCalls == 0 && g_freeCalls == 0);
        State("before_ExitProcess", 3, 1, 1, 2, 1, 3, 1);
        status = Summary();
        ExitProcess(status ? (UINT)status : 73u);
    }
    if (!ReleaseOnlyReference(argv[2], 1)) return Summary();
    if (g_case == 'D')
    {
        State("after_free", 5, 1, 1, 2, 0, 0, 1);
        Windows("after_free", 0);
    }
    else
    {
        State("after_free", 3, 1, 1, 2, 1, 3, 1);
        Windows("after_free", 1);
    }
    return Summary();
}
