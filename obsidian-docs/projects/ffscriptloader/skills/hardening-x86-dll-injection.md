---
title: >-
  Hardening Win32 x86 DLL Injection
category: skills
tags: [reverse-engineering, testing, skill]
aliases: [safe remote bootstrap, transactional x86 detours]
sources:
  - C:/Users/djden/source/repos/FFScriptLoader/injector/src/injector_core.cpp
  - C:/Users/djden/source/repos/FFScriptLoader/injector/tests/injector_smoke.cpp
  - C:/Users/djden/source/repos/FFScriptLoader/core_hook/src/hook/transactional_detour.cpp
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/blocked/live-shutdown-2026-07-18.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/blocked/debugger-resume-crash-2026-07-18.md
summary: >-
  Repeatable procedure for safe x86 DLL loading, typed remote bootstrap, idempotent module reuse, and quiescent MinHook rollback.
provenance:
  extracted: 0.86
  inferred: 0.11
  ambiguous: 0.03
created: 2026-07-18T17:48:00+02:00
updated: 2026-07-18T17:48:00+02:00
---

# Hardening Win32 x86 DLL Injection

Use this procedure when an injector must do more than call remote `LoadLibraryA`: it must validate the target, transfer a versioned request, invoke an explicit export, support retries, and remove hooks without racing active callbacks.

## 1. Validate before remote mutation

- Confirm injector, target, and DLL architecture with PE headers and `IsWow64Process2`.
- Verify the target executable identity against the pinned hash/build manifest.
- Parse the local DLL export table without loading the payload DLL into the injector process.
- Verify every intended hook preimage before creating any hook.
- Fail closed on an unknown hash, missing export, wrong machine, or stale preimage.

## 2. Resolve remote calls without address assumptions

Locate the owning module in the remote process, compute the desired export RVA from the corresponding local module, and invoke `remote_module_base + export_rva`. Do not copy a local `LoadLibraryA` pointer into a different process.

For a newly created process, allow a short bounded retry while kernel modules appear. Treat exhaustion as a resolver failure, not as permission to guess an address.

## 3. Bootstrap outside loader lock

Keep `DllMain` inert. After remote `LoadLibraryA` finishes:

1. find the loaded module by normalized full path;
2. resolve the bootstrap export from its RVA;
3. allocate and write a fixed-size, versioned POD request;
4. invoke the export with a bounded timeout;
5. read the fixed-size result and free the temporary remote buffer.

Repeated injection should reuse the existing module and re-invoke an idempotent bootstrap. It must not add unbounded loader references.

## 4. Install and remove detours transactionally

- Create every hook disabled and retain typed trampolines.
- Publish ownership only after the whole hook set can be enabled.
- Disable hooks first during shutdown so no new callbacks can enter.
- Wait for all callbacks to leave, counting the complete original-trampoline interval.
- Release lifecycle mutexes while waiting; otherwise a callback that needs the same lock can deadlock shutdown.
- Remove hooks and free state only after quiescence.
- Keep timeout failure retryable.

Calling `callback_leave` before the native trampoline is unsafe: shutdown may then remove trampoline storage while the callback is still executing through it.

## 5. Run live tests at a safe process state

For FF8, inject from field/menu rather than during an active battle. Do not attach a debugger for the routine injection sequence: remote thread creation can produce debugger stops, injector timeouts, and WOW64 resume exceptions unrelated to the payload.

Use a read-only process-memory canary tool for:

- process identity and module base;
- battle mode/substeps;
- target preimage before bootstrap;
- detour bytes after bootstrap;
- exact preimage restoration after shutdown;
- target process liveness.

Attach IDA only for a narrow ABI question that cannot be answered read-only, and ask for a fresh game process before repeating any test that could leave a loaded DLL or hook state behind.

## 6. Preserve evidence

Record target/DLL hashes, selected export, request version, remote module reuse, hook preimages, runtime status transitions, call audit, write-guard violations, shutdown result, restored bytes, and target liveness. A successful remote thread exit code alone is not sufficient evidence.

## Related

- [[projects/ffscriptloader/ffscriptloader]]
- [[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-harness-validation]]
- [[projects/re-ff8/skills/implementing-iso-battle-migration]]

