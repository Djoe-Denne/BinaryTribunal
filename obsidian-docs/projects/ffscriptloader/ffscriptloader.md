---
title: >-
  FFScriptLoader Injector
category: project
tags: [reverse-engineering, testing, project]
aliases: [FFScriptLoader, FFXLuaScriptLoader, x86 DLL injector]
sources:
  - C:/Users/djden/source/repos/FFScriptLoader
  - C:/Users/djden/source/repos/FFScriptLoader/injector/include/ffscriptloader/injector.hpp
  - C:/Users/djden/source/repos/FFScriptLoader/injector/src/injector_core.cpp
  - C:/Users/djden/source/repos/FFScriptLoader/app_hook/src/dllmain.cpp
  - C:/Users/djden/source/repos/FFScriptLoader/core_hook/src/hook/transactional_detour.cpp
summary: >-
  Hardened Win32/x86 injection foundation with explicit remote bootstrap, loaded-module reuse, transactional detours, and non-interactive validation.
provenance:
  extracted: 0.91
  inferred: 0.07
  ambiguous: 0.02
created: 2026-07-18T17:48:00+02:00
updated: 2026-07-18T17:48:00+02:00
---

# FFScriptLoader Injector

FFScriptLoader is the generic Win32/x86 injection foundation used by [[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated|Final Fantasy VIII Reimaginated]]. It remains a separate project so process control, PE validation, remote export invocation, and MinHook lifecycle safety can evolve independently from FF8 battle-domain code.

The synchronized source state is based on commit `6f10d16d8a9f3d57521127342a30c54d8a55b447`, plus the current uncommitted hardening work.

## Current architecture

- `injector/` is both a reusable library and a non-interactive CLI.
- `app_hook/` has an inert `DllMain`; `FFSL_Bootstrap` and `FFSL_Shutdown` perform explicit post-loader-lock lifecycle work.
- `core_hook/` owns transactional MinHook installation/removal and active-callback accounting.
- Existing TOML configuration, plugin/task factories, logging, and memory tooling remain development facilities, not the certified FF8 runtime ABI.

## Hardening delivered

The injector now:

- validates PE type and x86 target compatibility before injection;
- hashes the target executable and can reject an unsupported build before any remote write;
- resolves remote `kernel32` exports by remote module base plus local export RVA instead of assuming identical process addresses;
- waits with bounded timeouts and structured error results;
- invokes a named remote export with a fixed-size bootstrap payload;
- recognizes stdcall-decorated exports where required;
- detects an already loaded DLL by normalized full path and reuses its module base instead of loading a second copy;
- supports `validate`, self-test, `--bootstrap-export`, `--bootstrap-payload`, `--no-bootstrap`, and `--timeout-ms`.

The remote resolver retries briefly while a newly created target is still loading its kernel modules. This removes a startup race observed by the injector smoke test.

## Detour lifecycle contract

A replacement hook is installed transactionally:

1. verify every target preimage;
2. create hooks disabled and capture typed trampolines;
3. enable the complete set only after all preparations succeed;
4. on shutdown, disable hooks before waiting for callbacks to become quiescent;
5. count the entire callback, including the native trampoline interval;
6. remove hooks only after quiescence, or fail without freeing live state.

The active count uses guarded atomic decrement so an exceptional path cannot underflow it. A timeout remains recoverable and must not silently free hook-owned storage.

## Boundary with the remaster

FFScriptLoader may load `ff8_battle_iso.dll` and call its exported C ABI, but it does not own battle rules, battle state, FF8 addresses, or fidelity profiles. The remaster does not use the existing C++ `IPlugin` ABI for certified boundaries because that interface carries virtual classes, STL types, callbacks, and allocator ownership across DLLs.

## Validation checkpoint

The hardened tree passed 151/151 tests on 2026-07-18, including remote bootstrap payload transfer, repeated invocation, and loaded-module reuse. Live FF8 validation also proved that explicit shutdown can restore the hook preimage while leaving the game process running.

See [[projects/ffscriptloader/skills/hardening-x86-dll-injection]] for the operational procedure and [[projects/final-fantasy-viii-reimaginated/references/p0-harness-validation]] for the FF8 run.

