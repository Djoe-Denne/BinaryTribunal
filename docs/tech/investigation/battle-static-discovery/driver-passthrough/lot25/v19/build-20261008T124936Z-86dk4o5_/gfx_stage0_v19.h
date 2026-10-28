/* One six-byte transaction, under the stage0 activation lock and the shared
 * patch lock. Original protection is captured for BOTH sites before writes.
 * No diagnostic IO or heap work while peer threads are suspended. */
static int GFXPT_Stage0Write(void* address, const unsigned char* saved,
                            unsigned long index, int restore)
{
    BYTE* target = (BYTE*)address;
    BYTE patch[6];
    DWORD previous, ignored;
    int ok = 0;
    patch[0] = 0xE8;
    *(DWORD*)(patch + 1) = (DWORD)&Passthrough_Stage0Stub - (DWORD)(target + 5);
    patch[5] = 0x90;
    g_stage0DiagWinError = 0;
    if (!GFXPT_QuiesceBegin(target - 4, 14))
    { g_stage0DiagCause = "quiescence_refused"; return 0; }
    if (restore)
    {
        if (memcmp(target, patch, 6) != 0 && memcmp(target, saved, 6) != 0)
        { g_stage0DiagCause = "foreign_site_bytes"; goto done; }
    }
    else if (memcmp(target - 4, g_stage0Window[index], 14) != 0)
    { g_stage0DiagCause = "window_changed"; goto done; }
    if (!VirtualProtect(target, 6, PAGE_EXECUTE_READWRITE, &previous))
    {
        g_stage0DiagWinError = GetLastError();
        g_stage0DiagCause = "virtualprotect_failed";
        goto done;
    }
    memcpy(target, restore ? saved : patch, 6);
    if (!restore)
    {
        g_stage0LastWritten = 1;
        InterlockedIncrement(&g_stage0PatchWrites);
    }
    if (!VirtualProtect(target, 6, g_stage0OriginalProtect[index], &ignored))
    {
        g_stage0DiagWinError = GetLastError();
        g_stage0DiagCause = "virtualprotect_failed";
        goto done;
    }
    if (!FlushInstructionCache(GetCurrentProcess(), target, 6))
    { g_stage0DiagCause = "instruction_cache_failed"; goto done; }
    if (memcmp(target, restore ? saved : patch, 6) != 0 ||
        memcmp(target - 4, g_stage0Window[index], 4) != 0 ||
        memcmp(target + 6, g_stage0Window[index] + 10, 4) != 0)
    { g_stage0DiagCause = "window_readback_failed"; goto done; }
    g_stage0DiagCause = restore ? "restored" : "patched";
    ok = 1;
done:
    if (!GFXPT_QuiesceEnd()) { g_stage0DiagCause = "resume_failed"; ok = 0; }
    return ok;
}
