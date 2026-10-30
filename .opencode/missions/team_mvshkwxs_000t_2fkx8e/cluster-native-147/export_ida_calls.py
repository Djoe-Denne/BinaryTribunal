"""Read-only IDB topology export for the user-requested clustering test.

Writes a new owned DATA artifact; never mutates/saves IDB or starts a debugger.
Not a complete GraphSnapshotV1 or an executable RMS source/admission.
"""
import hashlib
import json
import os
import time
import bisect
import ida_bytes
import ida_funcs
import ida_idp
import ida_nalt
import ida_segment
import ida_ua
import idautils

TARGET = r"C:\Users\djden\source\repos\retro-eng\re-ff8\.opencode\missions\team_mvshkwxs_000t_2fkx8e\cluster-native-147\ida-calls.json"
EXPECTED_SHA = "064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570"
start = time.monotonic()
def check_deadline(phase):
    if time.monotonic() - start > 540:
        raise RuntimeError("Export deadline exceeded at " + phase + "; preserve any created DATA file, no retry")

if os.path.lexists(TARGET):
    raise RuntimeError("Target exists: no overwrite or implicit retry")
module_sha = ida_nalt.retrieve_input_file_sha256().hex()
if module_sha != EXPECTED_SHA:
    raise RuntimeError("Unexpected IDA input identity")
base = ida_nalt.get_imagebase()
starts = list(idautils.Functions())
# Existing harness policy, graph.ts::QUARANTINE_EAS; never repair/promote here.
quarantine = {0x465720, 0x495960, 0x48D200, 0x48FE20}
universe = set(starts) - quarantine
nodes = []
relations = {}
counts = {"incomingCodeRefsVisited": 0, "candidateInstructionsDecoded": 0,
          "outsideOwnedFunction": 0, "otherCodeRefsIgnored": 0,
          "indirectCalls": {"known": False, "value": None},
          "unresolvedDirectTargets": {"known": False, "value": None}}
intervals = []

for ea in starts:
    if time.monotonic() - start > 540:
        raise RuntimeError("Bounded extraction expired; no complete artifact emitted")
    if ea in quarantine:
        continue
    f = ida_funcs.get_func(ea)
    if f is None or f.start_ea != ea or ea < base:
        raise RuntimeError("Function enumeration changed or invalid RVA")
    chunks = [(int(a), int(b)) for a, b in idautils.Chunks(ea)]
    if not chunks or any(a >= b for a, b in chunks):
        raise RuntimeError("Missing/invalid native function chunks")
    seg = ida_segment.getseg(ea)
    cls = "external" if seg and seg.type == ida_segment.SEG_XTRN else "thunk" if f.flags & ida_funcs.FUNC_THUNK else "internal"
    intervals.extend((a, b, ea) for a, b in chunks)
    nodes.append({"ea": ea, "rva": ea - base, "name": ida_funcs.get_func_name(ea),
                  "functionClass": cls, "isLibrary": bool(f.flags & ida_funcs.FUNC_LIB),
                  "chunks": chunks, "sizeBytes": sum(b-a for a, b in chunks),
                  "instructionCount": None})

# Index every retained owner's chunks, including shared tails. Never infer a
# unique source owner from get_func(site), which can choose one shared parent.
intervals.sort()
interval_starts = [a for a, b, owner in intervals]
prefix_max_end = []
max_end = 0
for a, b, owner in intervals:
    max_end = max(max_end, b)
    prefix_max_end.append(max_end)
classes = {n["ea"]: n["functionClass"] for n in nodes}

for dest in sorted(universe):
    check_deadline("incoming references")
    for site in idautils.CodeRefsTo(dest, False):
        counts["incomingCodeRefsVisited"] += 1
        if counts["incomingCodeRefsVisited"] % 1024 == 0:
            check_deadline("reference scan")
        if not ida_bytes.is_code(ida_bytes.get_flags(site)):
            counts["otherCodeRefsIgnored"] += 1
            continue
        insn = ida_ua.insn_t()
        if ida_ua.decode_insn(insn, site) <= 0:
            raise RuntimeError("IDA code item could not be decoded")
        counts["candidateInstructionsDecoded"] += 1
        call = ida_idp.is_call_insn(insn)
        jump = insn.get_canon_mnem().lower() == "jmp"
        if (not call and not jump) or insn.ops[0].type not in (ida_ua.o_near, ida_ua.o_far) or int(insn.ops[0].addr) != dest:
            counts["otherCodeRefsIgnored"] += 1
            continue
        owners = set()
        i = bisect.bisect_right(interval_starts, site) - 1
        while i >= 0 and prefix_max_end[i] > site:
            a, b, owner = intervals[i]
            if a <= site < b:
                owners.add(owner)
            i -= 1
        if not owners:
            counts["outsideOwnedFunction"] += 1
        for owner in owners:
            if jump and owner == dest:
                continue  # Intra-function jump, not an inter-function tail relation.
            kind = "direct_call" if call else "thunk" if classes[owner] == "thunk" else "tail_jump"
            relations.setdefault((owner, dest, kind), set()).add(int(site))

if list(idautils.Functions()) != starts or ida_nalt.retrieve_input_file_sha256().hex() != module_sha:
    raise RuntimeError("IDA input/function universe changed during scan")
check_deadline("completed scan")
edges = [{"sourceEa": s, "destinationEa": d, "kind": k, "sites": sorted(sites)}
         for (s, d, k), sites in sorted(relations.items())]
check_deadline("sorted relations")
value = {"version": "ida-direct-topology-test-v2", "inputPath": ida_nalt.get_input_file_path(),
         "inputSha256": module_sha, "imageBase": base,
         "extractorSha256": hashlib.sha256(open(__file__, "rb").read()).hexdigest(),
         "quarantinedEas": sorted(quarantine.intersection(starts)),
         "quarantinePolicy": "Existing graph.ts::QUARANTINE_EAS, not a new semantic decision",
         "nodes": nodes, "edges": edges, "counts": counts,
         "coverage": {"status": "partial", "uncoveredReason": "Incoming code references to retained IDA function entries, confirmed as direct call operands or unconditional jumps and attributed through all owner's chunks. Existing four-EA quarantine excluded. Instruction counts, indirect resolution, mid-function targets, data/callback affinity and native completeness remain unknown."},
         "scope": "Topology test only, not GraphSnapshotV1 or an RMS operative admission",
         "idbMutated": False, "debuggeeStarted": False,
         "collectionDurationSeconds": time.monotonic()-start}
raw = (json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n").encode("utf-8")
check_deadline("serialized output before exclusive write")
with open(TARGET, "xb") as out:
    out.write(raw)
with open(TARGET, "rb") as inp:
    actual = inp.read()
if actual != raw:
    raise RuntimeError("Readback differs: preserve file and do not retry")
output_sha = hashlib.sha256(raw).hexdigest()
check_deadline("completed write and readback")
elapsed = time.monotonic() - start
print(json.dumps({"status": "TOPOLOGY_DATA_EXPORTED", "path": TARGET,
                  "byteLength": len(raw), "sha256": output_sha,
                  "functionCount": len(nodes), "relationCount": len(edges), "counts": counts,
                  "durationSeconds": elapsed, "idbMutated": False,
                  "rmsAdmissionOrOriginCreated": False}))
