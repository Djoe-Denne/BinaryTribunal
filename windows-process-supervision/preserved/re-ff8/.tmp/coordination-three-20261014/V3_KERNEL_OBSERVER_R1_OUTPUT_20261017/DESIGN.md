# Kernel observer R1 — source delivery, not native qualification

## Authority, independence, and stage

- Task: `task_mvc42woi_0007_28drf0`; session:
  `ses_eb6eb1dc5ffeFBZOGgB5yVJ5ES`; profile `build`, role O, cycle 1.
- Effective native model was verified by the parent as
  `openai/gpt-6.1-sol`, variant `max`. No model fallback or delegation.
- Bootstrap is **NONBLIND**. There is **no packet-only claim**. The independent
  source boundary is nevertheless maintained: no GuardianCore implementation,
  its tests, or its results were supplied, sought, or consumed.
- Access-only approval preceded a real packet ACK. The later, distinct parent
  SOURCE GO authorized only the four files in this output directory.
- All 27 physical payloads (210473 bytes), the detached parent receipt, role
  conditions, ratification, physical ABI, and the bodies of all 18 Microsoft
  reference files were read/processed. Sizes and SHA256 matched independently.
  Frontmatter was processed in the sandbox; article bodies were consumed in full.
- This is a new implementation of `IGuardKernelObserver`, not a wrapper around
  any historical runner. ABI1 was not edited or copied into the output.
- **No C# source was compiled, imported, or executed. No test was run. No real
  Win32 API, .NET probe, Marshal.SizeOf, process/Job operation, runtime, DB, Git,
  source index, board/inbox, other owner's output, or delegation was used.**
- File hashing and bounded text inspection are source-delivery checks only.
  Tool-script syntax errors were corrected; they were not C# or native results.

## Frozen inputs and binding

The readonly input root is
`inputs/V3_KERNEL_OBSERVER_R1_20261017/`.

- `INPUT_MANIFEST.json`: 5941 bytes,
  `3d519a3dd4bd21475c574cbd5314f8053184ec27af32b2413c03ce195ef7dc1e`.
- `PARENT/SCOPE.md`: 5073 bytes,
  `f861136446decd8ed33ce07e6e26acca111758e7337ef5903d3288bb9969b2b4`.
- `PARENT/JOB_GUARDIAN_V3_CONTRACT_DRAFT2_20261017.md`: 9919 bytes,
  `bb69e0ade4c0b48c8d1c420e528683fe2d614eff6cac80fa64e6f58df33cafd3`.
- `ABI/GuardV3.Contracts.cs`: 8016 bytes,
  `bb4758cc60d6ff32176b01b87d72ac94685729796afb3b585b0a29e6d4864709`.
- `PARENT/V3_CORE_ABI1_SOURCE_BOUNDARY_20261017.md`: 2118 bytes,
  `084e847cf8192613a9559ad5bfb9f0bfdb5d2fa0bbe90a377fc82448e941958f`.
- `PARENT/V3_CORE_PARENT_SOURCE_RATIFICATION_20261017.md`: 1894 bytes,
  `ed2be9a003315ddaa3eade015473212032d0e461258041fc03ade48c764bbfe8`.
- `PARENT/BINDING.json`: 892 bytes,
  `7fc106ebcbb69c60b11472d62a972ee935f15c47e4680ecefe97a2a77eea2c10`.
- Detached access receipt: 5500 bytes,
  `2579ced7303eed3fb2c7aac7677790141a93aa99161f233d25237e46eff7d556`;
  `helperCompleted=true`. The helper's receipt is not native validation.
- `PARENT/CSC_METADATA.json` was read as supplied metadata only. No path in that
  document was probed or invoked.

Only these output files are owned by this delivery: `KernelObserver.cs`,
`KernelObserver.Tests.cs`, `DESIGN.md`, and `MANIFEST.json`. No shared ABI,
registry, central source, historical fixture, or G output is owned here.

## Implementation and permitted native surface

`KernelObserver` implements the exact frozen methods:

- `ObserveRoot(RootProcessBorrow, uint)` returns `RootObservation`.
- `CapturePair(JobQueryBorrow, ObservationPermit)` returns
  `KernelPairObservation`.

The default constructor selects `KernelObserverWin32Calls`; construction itself
does not call a native API. That class declares exactly three kernel32 imports:
`WaitForSingleObject`, `GetExitCodeProcess`, and `QueryInformationJobObject`.
BOOL is explicitly marshalled as a four-byte Win32 BOOL. Handles are `IntPtr`,
DWORD arguments/results are `uint`, and JOBOBJECTINFOCLASS is a four-byte `int`.
`SetLastError=true` is set on each declaration. The very next operation after a
failed PInvoke reads `Marshal.GetLastWin32Error`; no other native call intervenes.
Success clears the exposed error rather than returning a stale last-error value.

There is no close, create, assign, duplicate, terminate, debug, reopen, file,
process discovery, publication, finalizer, SafeHandle, callback from native code,
or kernel-object ownership in this component. No NULL/current Job lookup exists.
Read-only queries use fresh fixed managed byte arrays passed as output buffers;
there is no explicit unmanaged allocation/free or CLR structure-size probe.

Both the observer and native adapter require a pointer size of eight. A mismatch
fails before any kernel call. This is a Windows x64 ABI implementation, with no
32-bit fallback. DLL/entry-point/platform failures remain failures, not support
discovery or proof that a Windows operation succeeded.

## Handle borrowing and the trusted-source boundary

Each native operation is preceded by `TryBorrow` for the exact `CaseIdentity`
reference and correct `NativeBorrowKind`. A refusal, exception, NULL, or negative
handle rejects the operation. Negative values are conservatively refused,
including pseudo-handles; an unusual legitimate negative handle would fail closed.
The filter does not authenticate a positive number or prove an object type.

The owner G must enforce identity reference, current epoch, kind, liveness, actual
original-handle provenance, and single-control-thread serialization throughout
borrow/query/close. ABI1 explicitly makes that a trusted-assembly source/protocol
invariant, not a defence against arbitrary code already loaded in the assembly.
This observer cannot verify those obligations independently with its restricted
surface, and cannot prevent a racing owner from violating them.

Before exit-code reading or the second Job query, the observer borrows again and
requires exactly the same handle value as the first call. This catches refusal or
change; it does NOT turn numerical equality into identity, pin the handle against
closure, or substitute for owner serialization. No handle is retained after return.

G must supply JOB_OBJECT_QUERY rights on the Job, and SYNCHRONIZE plus
PROCESS_QUERY_INFORMATION or PROCESS_QUERY_LIMITED_INFORMATION on the root as
required by the supplied Microsoft articles. Insufficient rights stay API failures;
the observer never opens a replacement handle or retries with greater privileges.

`IKernelObserverCalls` is an internal memory-test seam. Injecting an arbitrary
implementation is trusted source activity, never a JSON/driver capability or a
qualified launcher binding. Production uses the real Win32 adapter, not a mock.

## Root observations

One `ObserveRoot` performs at most one wait and, only after `WAIT_OBJECT_0`, one
exit-code query. Zero-time polling and waits up to 100 ms are accepted; longer
waits, including INFINITE, fail before borrowing. There is no wait loop.

- `WAIT_TIMEOUT` (0x102): wait succeeded, not signaled, exit not queried.
- `WAIT_FAILED` (0xffffffff): failed observation with immediately captured error.
  Even an error code of zero does not change its failure flags.
- `WAIT_OBJECT_0` (0): signaled original root; reborrow then exit-code query.
- Mutex `WAIT_ABANDONED` and unknown statuses: invalid process-wait data.
- Exit-query refusal/failure/exception retains the successful/signaled wait flags
  but sets `ExitCodeSucceeded=false`; a placeholder zero is not a valid exit value.
- A successfully read DWORD exit value is preserved, including 259 and high-bit
  values. A signaled process is not made live again by an exit value of 259.

ABI1's `RootObservation` has no identity/sequence fields. None were invented. G
must correlate the direct result with its original borrow, debit the separate
4096 normal / 300 cleanup root-wait counters, check time before/after calls, close
all known root process/thread references, and construct its own RootExitWitness.
Neither a signaled wait nor an exit code is a release decision or a test PASS.

## Accounting and fixed PID wire layouts

Layouts are decoded from raw Windows little-endian bytes, without relying on
CLR sequential packing, reflection, Marshal.SizeOf, or PtrToStructure.

`JOBOBJECT_BASIC_ACCOUNTING_INFORMATION` is 48 bytes:

- Four eight-byte LARGE_INTEGER fields at offsets 0, 8, 16, 24.
- Four DWORD fields at offsets 32, 36, 40, 44.
- Exposed fields are TotalProcesses at 36 and ActiveProcesses at 40.
- A successful query must return exactly 48 bytes. Active must be at most eight
  and at most TotalProcesses; violated predicates fail with raw counts retained.
- TotalProcesses is cumulative: large values, including uint.MaxValue, are not
  capped to eight and are not interpreted as a live inventory. Other accounting
  members are not used to infer quiescence.

`JOBOBJECT_BASIC_PROCESS_ID_LIST` uses a fixed 72-byte buffer:

- Assigned DWORD at offset 0; listed DWORD at offset 4; first ULONG_PTR at 8.
- Eight pointer-sized entries occupy offsets 8 through 64, eight bytes each.
- Capacity is `8 + 8*8 = 72`, not `sizeof(header-with-[1]) + 8*8 = 80`.
- Native success, returned length in [8,72], whole eight-byte strides, both
  counts at most eight, assigned == listed, and enough returned bytes for every
  claimed entry are required. Both compact empty headers and padded empty
  responses are accepted. Unused array tails are not valid returned entries.
- Every returned entry must be nonzero and unique within this single response.
  Words remain 64-bit; they are not truncated to DWORD, reopened, or retained.
  There is no lifetime PID set or inference that a PID is a stable identity.
- Count checks precede multiplication, indexing, and iteration. At most eight
  entry checks / 28 preceding-entry comparisons occur. Each word reader is an
  eight-iteration bounded byte loop. There is no variable allocation or retry.

Sources: the supplied Microsoft `JOB_ACCOUNTING`, `JOB_PID_LIST`, and `QUERY_JOB`
articles, plus their nested-Job scope described by `NESTED_JOBS`. The other
fourteen supplied articles were also consumed; they do not enlarge this observer's
native authority. All reference hashes are transitively pinned by INPUT_MANIFEST.

## Pair contract, correlation, errors, and freshness

A pair uses accounting class 1 followed by PID-list class 3 on the same explicit
non-NULL Job. Failure/invalidity of accounting stops before the second query.
Failure of the second query retains valid accounting, but ListSucceeded is false.
`ERROR_MORE_DATA` (234) is preserved as failure even if a partial header looks zero.
There is never buffer growth, an internal retry, or a fabricated empty success.

The pair is **not atomic**. The component does not require accounting active count
to equal list count across the two calls. G must establish root terminal,
root-reference release and sealed admissions, then validate both successful raw
observations, exact identity/epoch/sequence, sizes and all three zero counts.
The observer does not have those prerequisites and never publishes quiescence.

Permit validation requires reference-equal borrow/permit identities, positive
sequence, nonnegative elapsed time, and elapsed time below the 55000 ms total
deadline. Identity is the exact borrow identity; sequence is echoed unchanged.
A rejected/null job has null identity; a missing permit has sequence zero. Both
are failed records, never valid measurements. No timestamp or capability is made up.

`Cleanup` does not create credits or expand authority. G owns permit issuance,
normal/cleanup attempt debits (4096/300), phase start times, monotonic sequencing,
and 5000/20000/30000/55000 ms pre/post-call checks. This observer neither maintains
a parallel sequence ledger nor certifies a reused permit. Each admitted call
queries afresh; no successful zero, response array, or prior epoch is cached.
Old sequence/epoch observations remain inadmissible to G even if copied by a caller.

Success flags require native success AND structural/predicate validity. On local
invalidity, flags are false and a bounded synthetic code explains rejection.
This is not a claim that GetLastError supplied that synthetic value. The ABI
does not contain a separate native-success/local-validation-success pair.

- 6: rejected/changed/null/pseudo borrow; 87: invalid argument/correlation.
- 193: non-64-bit ABI (also mapped BadImageFormatException).
- 24: invalid buffer/ReturnLength/bounds; 13: invalid counts/entries/wait status.
- 1460: supplied elapsed time has reached/exceeded the total deadline.
- Mapped managed exceptions: out-of-memory 8, DLL missing 126, entry point
  missing 127, other caught Exception 31. No Exception.Message/ToString is emitted.
- Actual API failures preserve their captured int error, including zero. An
  unattempted second operation has false status, zero size and zero error: status
  is mandatory and zero error alone is NEVER success.
- Failed native buffers are not parsed. Zero placeholders in their fields carry
  no measurement authority. Valid-size malformed headers retain observed counts.
- DWORD ReturnLength bits are preserved by unchecked conversion to ABI1's int:
  a high-bit length is negative, not a smaller valid size. No saturated/truncated
  length can be used as a valid 48-byte or bounded-list success.

## Writers, memory, and bounds (not a global budget proof)

Production has no file/stream/console writer, callback log, history, queue, static
case collection, or serialization. Its concrete memory writers are:

- Each pair: fresh accounting byte[48] and PID byte[72], written only by their
  respective native query, then read by bounded parsers. At most 120 payload bytes
  of scratch per attempt, even when only the first call is made. No scratch escapes.
- Local scalar status/count/handle/length/error variables and one ABI observation
  result per returned call. Only bounded scalars and existing identity references
  escape; no exception text, PID array, or handle does.
- Each root call: local scalars and one RootObservation; no scratch collection.
- Native marshalling may pin/copy buffers; CLR/object/interop overhead and GC
  timing are not claimed to be 120 bytes or a hard process-memory bound.

If G obeys 4396 maximum pair attempts, payload arrays allocate cumulatively at
most 527520 bytes (120*4396), plus overhead. This is NOT retained history, disk
output, a new allowance against any category, or proof of the 262144-byte mutable
case-output budget. Scratch, resulting evidence records, framing, copies, and
any future sink still need explicit ownership/classification in the closed global
writer ledger. No unknown runtime/writer term has been declared zero here.

Every loop in production is a fixed-size parser loop (eight entries, at most
28 duplicate comparisons, eight bytes per word). There are no observation,
allocation-resize, retry, drain, sleep, polling, or acknowledgement loops. Native
calls are synchronous and may fail to return; their software limits are not a
hard-real-time guarantee. Owner/controller failure still requires external HOLD.

## Deferred test-source inventory and limitations

`KernelObserver.Tests.cs` contains 40 explicit source cases and no Main or
automatic initializer. RunAll is present solely for a later separately authorized
parent route. No assertion has been executed or described as passing.

All cases inject MemoryCalls and MemoryBorrow. They use fixed reply/handle slots,
literal 48/72-byte fixture encoders, independent numeric expected values, bounded
in-memory call counts, and no PInvoke/reflection/layout probe or production encoder.
Scripted faults are exception objects, not actual loader/memory failures. Coverage:

- Numeric layout/offsets/classes; cumulative totals; impossible active counts.
- Compact/padded empty lists; 64-bit stride; eight-entry capacity; short, oversized,
  unaligned and high-bit sizes; truncated/mismatched/oversized counts; zero/duplicate
  identifiers; unused-tail handling.
- Exact identity reference and epoch refusal; null permit/job; total deadline;
  correct kind/liveness; refusal/change between queries; NULL and pseudo handles.
- First/second-query errors, partial ERROR_MORE_DATA, success with invalid fields,
  failure with zero last-error, managed faults, no internal retry or old-zero cache.
- Separate non-atomic raw counts; same explicit Job; fresh buffers and exact
  accounting/list class/size order; x64 rejection before borrow or native activity.
- Wait timeout/failure/unexpected/mutex statuses, 100 ms cap, original-root exit
  read including 259/high bits, stale error suppression, failed exit, reborrow,
  and bounded managed-exception mapping.

Mocks do NOT prove Win32 marshalling, installed ABI/layout, actual handle type,
native close/termination, safe closure serialization, real root-reference release,
true quiescence, elapsed deadlines, host binding, capture, filesystem confinement,
or a global writer budget. No new live/static source claim upgrades old last-close,
case8, integrated-budget, full44, or FF8 gates.

## Handoff / remaining gates

Deliver four output pins, then **HOLD for a fresh independent composed review**
against G, ABI1, draft2, source scopes, and official references, plus the separate
budget review. No compiled/source acceptance is claimed by this author. The parent
must issue a separate compile GO; no import/test/runtime permission follows from
this source delivery. Launcher S, driver D, original control-handle bindings,
capture reservation-before-Read, and the closed worldwide writer ledger remain
unimplemented/unproven by this component. Native qualifications need their own GO
and gates. Only the parent can integrate, publish, accept, or release anything.
