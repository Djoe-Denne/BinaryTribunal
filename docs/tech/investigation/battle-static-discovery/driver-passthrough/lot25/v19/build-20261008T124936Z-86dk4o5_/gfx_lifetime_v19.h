/* v19: all helpers below run outside loader callbacks. No CRT/heap/IO while
 * other threads are suspended. A stable second enumeration closes thread
 * births by process-owned runnable threads. Foreign injection/debuggers are
 * excluded by the controlled-session contract and must be checked live.
 */
#define GFXPT_MAX_THREADS 128
typedef struct GFXPT_FrozenThread { HANDLE handle; DWORD id; } GFXPT_FrozenThread;
static GFXPT_FrozenThread g_frozen[GFXPT_MAX_THREADS];
static DWORD g_frozenCount;
static volatile LONG g_patchLock;
static volatile LONG g_quiesceFault;
static volatile LONG g_quiescePasses;

typedef struct GFXPT_GenericOwned {
    BYTE* target;
    DWORD count;
    DWORD protect;
    BYTE window[17];
    BYTE patch[9];
    LONG owned;
} GFXPT_GenericOwned;
static GFXPT_GenericOwned g_generic[2];

static int GFXPT_EnsureResident(void)
{
    HMODULE retained = 0;
    if (g_stage0InDllMain) return 0;
    if (g_modulePinned) return 1;
    if (!GetModuleHandleExA(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS |
                            GET_MODULE_HANDLE_EX_FLAG_PIN,
                            (LPCSTR)&GFXPT_EnsureResident, &retained)
        || retained != g_hinstDLL) return 0;
    InterlockedExchange(&g_modulePinned, 1);
    return 1;
}

static int GFXPT_QuiesceEnd(void)
{
    int ok = 1;
    while (g_frozenCount)
    {
        HANDLE h = g_frozen[--g_frozenCount].handle;
        if (ResumeThread(h) == (DWORD)-1) ok = 0;
        CloseHandle(h);
    }
    if (!ok) InterlockedExchange(&g_quiesceFault, 1);
    InterlockedExchange(&g_patchLock, 0);
    return ok;
}

static int GFXPT_QuiesceBegin(BYTE* target, DWORD bytes)
{
    DWORD round, self = GetCurrentThreadId(), pid = GetCurrentProcessId();
    int stable = 0, ok = 1;
    if (g_stage0InDllMain || g_quiesceFault ||
        InterlockedCompareExchange(&g_patchLock, 1, 0) != 0) return 0;
    g_frozenCount = 0;
    for (round = 0; round < 4 && ok; ++round)
    {
        HANDLE snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPTHREAD, 0);
        THREADENTRY32 entry;
        DWORD added = 0;
        BOOL more;
        if (snapshot == INVALID_HANDLE_VALUE) { ok = 0; break; }
        entry.dwSize = sizeof(entry);
        more = Thread32First(snapshot, &entry);
        if (!more) ok = 0;
        while (more && ok)
        {
            DWORD i;
            if (entry.th32OwnerProcessID == pid && entry.th32ThreadID != self)
            {
                for (i = 0; i < g_frozenCount; ++i)
                    if (g_frozen[i].id == entry.th32ThreadID) break;
                if (i == g_frozenCount)
                {
                    HANDLE h;
                    CONTEXT context;
                    if (g_frozenCount == GFXPT_MAX_THREADS) { ok = 0; break; }
                    h = OpenThread(THREAD_SUSPEND_RESUME | THREAD_GET_CONTEXT |
                                   THREAD_QUERY_INFORMATION, FALSE, entry.th32ThreadID);
                    if (!h) { ok = 0; break; }
                    if (SuspendThread(h) == (DWORD)-1) { CloseHandle(h); ok = 0; break; }
                    g_frozen[g_frozenCount].handle = h;
                    g_frozen[g_frozenCount++].id = entry.th32ThreadID;
                    ++added;
                    context.ContextFlags = CONTEXT_CONTROL;
                    if (!GetThreadContext(h, &context) ||
                        ((BYTE*)context.Eip >= target && (BYTE*)context.Eip < target + bytes))
                    { ok = 0; break; }
                }
            }
            entry.dwSize = sizeof(entry);
            more = Thread32Next(snapshot, &entry);
        }
        if (ok && GetLastError() != ERROR_NO_MORE_FILES) ok = 0;
        CloseHandle(snapshot);
        if (ok && added == 0) { stable = 1; break; }
    }
    if (!ok || !stable) { GFXPT_QuiesceEnd(); return 0; }
    InterlockedIncrement(&g_quiescePasses);
    return 1;
}

static int GFXPT_PlaceHookRetained(unsigned long ea, const BYTE* preimage,
                                 int count, int callAt, void* detour,
                                 void* volatile* out)
{
    GFXPT_GenericOwned* owned;
    BYTE* target;
    BYTE* tramp;
    DWORD old, ignored;
    int ok = 0;
    if (ea == GFXPT_EA_PRESENTDISPATCH && count == 8 && callAt == -1) owned = &g_generic[0];
    else if (ea == GFXPT_EA_ODSTRACE && count == 9 && callAt == 4) owned = &g_generic[1];
    else return 0;
    if (owned->owned) return 1;
    if (*out || !GFXPT_EnsureResident()) return 0; /* never rearm retained trampolines */
    if (!g_hostModule) g_hostModule = GetModuleHandleA(NULL);
    if (!g_hostModule) return 0;
    target = (BYTE*)GFXPT_HostEA(ea);
    if (!GFXPT_CopyBytes(owned->window, target - 4, (DWORD)count + 8) ||
        memcmp(owned->window + 4, preimage, count) != 0) return 0;
    tramp = (BYTE*)VirtualAlloc(NULL, count + 5, MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);
    if (!tramp) return 0;
    memcpy(tramp, preimage, count);
    if (callAt >= 0)
        *(DWORD*)(tramp + callAt + 1) =
            (DWORD)(target + callAt + 5) + *(const DWORD*)(preimage + callAt + 1)
            - (DWORD)(tramp + callAt + 5);
    tramp[count] = 0xE9;
    *(DWORD*)(tramp + count + 1) = (DWORD)(target + count) - (DWORD)(tramp + count + 5);
    if (!VirtualProtect(tramp, count + 5, PAGE_EXECUTE_READ, &old) ||
        !FlushInstructionCache(GetCurrentProcess(), tramp, count + 5))
    { VirtualFree(tramp, 0, MEM_RELEASE); return 0; }
    memset(owned->patch, 0x90, count);
    owned->patch[0] = 0xE9;
    *(DWORD*)(owned->patch + 1) = (DWORD)detour - (DWORD)(target + 5);
    if (!GFXPT_QuiesceBegin(target - 4, count + 8))
    { VirtualFree(tramp, 0, MEM_RELEASE); return 0; }
    if (memcmp(target - 4, owned->window, count + 8) == 0 &&
        VirtualProtect(target, count, PAGE_EXECUTE_READWRITE, &old))
    {
        owned->target = target; owned->count = count; owned->protect = old;
        *out = tramp; /* immutable; residency confirmed before this publication */
        InterlockedExchange(&owned->owned, 1);
        memcpy(target, owned->patch, count);
        ok = VirtualProtect(target, count, old, &ignored) &&
             FlushInstructionCache(GetCurrentProcess(), target, count) &&
             memcmp(target, owned->patch, count) == 0 &&
             memcmp(target - 4, owned->window, 4) == 0 &&
             memcmp(target + count, owned->window + 4 + count, 4) == 0;
    }
    if (!GFXPT_QuiesceEnd()) ok = 0;
    if (!owned->owned) VirtualFree(tramp, 0, MEM_RELEASE);
    return ok;
}

static int GFXPT_RestoreGenericHooks(void)
{
    unsigned i;
    int all = 1;
    for (i = 0; i < 2; ++i)
    {
        GFXPT_GenericOwned* owned = &g_generic[i];
        DWORD old, ignored;
        int ok = 0;
        if (!owned->owned) continue;
        if (!GFXPT_QuiesceBegin(owned->target - 4, owned->count + 8)) { all = 0; continue; }
        if ((memcmp(owned->target, owned->patch, owned->count) == 0 ||
             memcmp(owned->target, owned->window + 4, owned->count) == 0) &&
            VirtualProtect(owned->target, owned->count, PAGE_EXECUTE_READWRITE, &old))
        {
            memcpy(owned->target, owned->window + 4, owned->count);
            ok = VirtualProtect(owned->target, owned->count, owned->protect, &ignored) &&
                 FlushInstructionCache(GetCurrentProcess(), owned->target, owned->count) &&
                 memcmp(owned->target - 4, owned->window, owned->count + 8) == 0;
        }
        if (!GFXPT_QuiesceEnd()) ok = 0;
        if (ok) InterlockedExchange(&owned->owned, 0);
        else all = 0;
    }
    return all; /* trampolines remain mapped for already-entered detours */
}
