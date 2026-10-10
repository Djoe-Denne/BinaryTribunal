"""Offline pool-policy checks; never spawns, writes state, or calls IDA/API."""

import argparse
import copy
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIRECTORY = ROOT / "docs/tech/investigation/battle-static-discovery"
POOL = DIRECTORY / "CAMPAIGN_POOL_2026-10-10.json"
FLASH = "zai-coding-plan/glm-5.3-flash#high"
SOL = "openai/gpt-6.1-sol#high"
STATUSES = {"ready", "running", "failed", "fallback", "completed", "blocked"}
FLASH_ROLES = {"pack_C_A", "neutral_repair", "propagation", "C_fix"}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def model_ref_matches(requested, actual):
    """Explicit high syntax is not a literal native model ID."""
    reference, _, variant = requested.partition("#")
    provider, _, model = reference.partition("/")
    return bool(actual and actual.get("providerID") == provider
                and actual.get("id") == model
                and actual.get("variant") == variant)


def ready_tasks(pool, actor="worker"):
    tasks = {t["id"]: t for t in pool["tasks"]}
    return sorted(
        (t for t in tasks.values()
         if t["actor"] == actor and t["status"] in {"ready", "blocked"}
         and not t.get("dispatch_block_reason")
         and all(tasks[d]["status"] == "completed" for d in t["depends_on"])),
        key=lambda t: (t.get("priority", 100), t["id"]),
    )


def task_input_digest(pool, task):
    """Administrative input snapshot, not a substitute for a dispatch read manifest."""
    payload = {"source": pool["sources"].get(task["case"]), "files": {}}
    for key in task.get("inputs", []):
        item = pool["input_snapshots"][key]
        payload["files"][key] = {"path": item["path"], "sha256": item["sha256"]}
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    return digest(encoded)


def fallback_attempt(task):
    """Plan one fresh Sol replacement, retaining failed attempts; no mutation."""
    require(task["model"] == FLASH, "fallback only for a Flash primary")
    require(task["status"] == "failed", "task must have a real failed receipt")
    attempts = task.get("attempts", [])
    require(not any(a.get("kind") == "sol_fallback" for a in attempts),
            "Sol fallback already consumed")
    require(attempts and attempts[-1]["model"] == FLASH
            and attempts[-1]["status"] == "failed", "missing Flash failure provenance")
    require(task.get("inputs_digest"), "missing frozen inputs digest")
    result = copy.deepcopy(task)
    result["status"] = "fallback"
    result["attempts"].append({
        "kind": "sol_fallback", "model": SOL, "status": "ready",
        "session_id": None, "inputs_digest": task["inputs_digest"],
        "fresh_owned_session_required": True,
    })
    return result


def validate(pool, verify_files=True):
    cap = pool["capacity"]
    require((cap["campaign_agents_total"], cap["supervisors"], cap["worker_slots"])
            == (12, 1, 11), "capacity must be exactly 1+11")
    require(not cap["runtime_hardlimit_proved"], "policy is not a proven runtime limit")
    slots = pool["slots"]
    require([s["id"] for s in slots] == list(range(12)), "slot IDs must be 0..11")
    require(slots[0]["kind"] == "supervisor"
            and all(s["kind"] == "worker" for s in slots[1:]), "slot ownership")
    require(pool["fallback"]["max_sol_fallback_attempts_per_task"] == 1,
            "exactly one Sol replacement maximum")
    require(not pool["fallback"]["solo_fallback"], "solo fallback forbidden")
    migration = pool.get("native_migration_2026_10_10")
    if migration:
        require(migration["transport"] == "functions.subagent", "native transport required")
        require(slots[0]["session_id"] == migration["new_supervisor_session_id"],
                "current supervisor binding")
        require(model_ref_matches(SOL, migration["self_model_actual"])
                and slots[0].get("model_actual") == migration["self_model_actual"],
                "supervisor high contract not proved")
        old = migration["old_Ensemble_quiescence"]
        require(old["native_API_sessions_checked"] == 6 and old["all_outcomes_failed"]
                and old["all_time_idle_present"] and old["all_token_fields_zero"]
                and old["workers_computing_observed"] == 0, "old writers not quiescent")
        canaries = migration["canaries"]
        require(len(canaries) == 2 and {c["model"] for c in canaries} == {FLASH, SOL},
                "bounded native probes required")
        for c in canaries:
            require(c["parent_id"] == slots[0]["session_id"]
                    and model_ref_matches(c["model"], c["model_actual"])
                    and c["assistant_model_matches_session"]
                    and c["outcome"] == "succeeded"
                    and c["result"] == "NATIVE_HIGH_CANARY_OK"
                    and c["time_idle_ms"] and c["tokens"]["output"] > 0
                    and c["tool_calls"] == 0 and not c["snapshot_files"]
                    and c["accepted_RE_results"] == 0, "native canary receipt mismatch")
    tasks = {t["id"]: t for t in pool["tasks"]}
    require(len(tasks) == len(pool["tasks"]), "duplicate task IDs")
    require(set(pool["sources"]) == {f"P{i}" for i in range(1, 7)}, "six-case scope")
    require({k for k, s in pool["sources"].items() if s["control"]}
            == {"P1", "P3", "P5"}, "frozen control cohort")
    visiting, visited = set(), set()

    def visit(key):
        require(key in tasks, "missing dependency " + key)
        require(key not in visiting, "dependency cycle")
        if key in visited:
            return
        visiting.add(key)
        for dep in tasks[key]["depends_on"]:
            visit(dep)
        visiting.remove(key)
        visited.add(key)

    for t in tasks.values():
        visit(t["id"])
        require(t["status"] in STATUSES, "invalid task status")
        require(t["case"] in {*pool["sources"], "J3"}, "out-of-scope task")
        if t["case"] != "J3":
            require(t["ea"] == pool["sources"][t["case"]]["ea"], "EA mismatch")
        if t["status"] in {"ready", "running", "fallback", "completed"}:
            require(all(tasks[d]["status"] == "completed" for d in t["depends_on"]),
                    "unfinished dependency for " + t["id"])
            if t["role"] == "semantic_A":
                require(all(tasks[d].get("C_final_accepted", True)
                            for d in t["depends_on"] if tasks[d]["role"] == "C_review"),
                        "semantic A cannot consume a CORRIGE C review")
        if t["actor"] == "worker":
            expected = FLASH if t["role"] in FLASH_ROLES else SOL
            if t.get("dispatch_attempt_kind") == "sol_fallback":
                require(t.get("primary_model") == FLASH and t["model"] == SOL,
                        "explicit fallback model mismatch")
            else:
                require(t["model"] == expected, "explicit primary model mismatch")
            require(t["fresh_session"], "independent context required in this setup")
        for key in t.get("inputs", []):
            require(key in pool["input_snapshots"], "missing input snapshot")
        if t["role"] == "parent_native_gate" and t["case"] != "J3":
            require("J3_commit" in t["depends_on"], "J3 must close before promotion")
        attempts = t.get("attempts", [])
        replacements = [a for a in attempts if a.get("kind") == "sol_fallback"]
        require(len(replacements) <= 1, "multiple Sol fallbacks")
        for a in replacements:
            require(t.get("primary_model", t["model"]) == FLASH and a["model"] == SOL,
                    "fallback provenance")
            require(a["inputs_digest"] == t.get("inputs_digest"), "fallback inputs drift")
            require(any(old.get("kind") == "primary" and old.get("model") == FLASH
                        and old.get("status") == "failed" for old in attempts),
                    "fallback without Flash failed receipt")
        for a in attempts:
            if a.get("kind") == "harness_contract_failure":
                receipt = pool["ensemble_run_2026_10_10"]["receipts"].get(t["id"], {})
                require(migration and t["id"] == "P3_pack"
                        and a["session_id"] == receipt.get("session_id")
                        and receipt.get("API_outcome") == "failed"
                        and not model_ref_matches(a["model"], receipt.get("model_actual"))
                        and a.get("counts_against_execution_budget") is False
                        and a.get("original_kind") == "sol_fallback",
                        "only recorded pre-execution migration failure is exempt")
    active = [s for s in slots[1:] if s["status"] == "running"]
    sessions = [s["session_id"] for s in active]
    require(len(active) <= 11 and len(set(sessions)) == len(sessions), "active pool cap/isolation")
    require(not active or all(sessions), "real session IDs required")
    require(len({s["task_id"] for s in active}) == len(active), "duplicate active task")
    grouped = {}
    for s in active:
        require(s["task_id"] in tasks, "slot task missing")
        t = tasks[s["task_id"]]
        require(t["actor"] == "worker" and t["status"] == "running", "slot/task mismatch")
        require(s["inputs_digest"] and s["model"] in {FLASH, SOL}, "unbound dispatch")
        require(model_ref_matches(s["model"], s.get("model_actual")),
                "actual native model/variant contract not proved")
        require(s["role"] == t["role"], "slot role mismatch")
        grouped.setdefault(t["ea"], []).append(t["role"])
    for roles in grouped.values():
        require(len(roles) == 1 or sorted(roles) == ["control_C_B", "control_semantic_B"],
                "concurrent EA writers except disjoint blind controls")
    for event in pool["events"]:
        require({"timestamp_utc", "task_id", "ea", "role", "depends_on", "status",
                 "slot_id", "session_id", "model", "inputs_digest"} <= event.keys(),
                "incomplete event record")
    if pool["activation"] in {"awaiting_parent_long_GO", "awaiting_background_GO"} or pool["activation"].startswith("blocked_"):
        require(not pool["guards"]["dispatch_GO"], "global gate must prevent new dispatch")
        drain = pool.get("global_stop_drain")
        if drain and pool["activation"] == "blocked_native_ida_mcp_absent_after_restart":
            require(set(drain["nonterminal_owned_session_ids"]) == set(sessions),
                    "restart drain must retain all actual nonterminal session slots")
            require(drain["dispatch_closed_before_fallback_or_new_roles"]
                    and drain["no_cancel_force_foreign_resume_or_harness_change"],
                    "restart stop must not silently cancel or redispatch")
            require(not any(t["status"] == "fallback" for t in tasks.values()),
                    "critical restart gate precedes fallback dispatch")
        else:
            require(not active and not any(t["status"] in {"running", "fallback"} for t in tasks.values()),
                    "globally blocked pool contains an unaccounted live task")
    if verify_files:
        config = ROOT / pool["config"]["local_file"]
        require(digest(config.read_bytes()) == pool["config"]["sha256"], "local config drift")
        require(json.loads(config.read_text(encoding="utf-8"))["experimental"]["subagent_depth"] == 2,
                "existing depth guard changed")
        for key, item in pool["input_snapshots"].items():
            path = ROOT / item["path"]
            require(path.is_file() and digest(path.read_bytes()) == item["sha256"],
                    "input drift: " + key)
            if item.get("check_freeze_members"):
                freeze = json.loads(path.read_text(encoding="utf-8"))
                for name, expected in freeze["freeze_files"].items():
                    require(digest((path.parent / name).read_bytes()) == expected,
                            "freeze member drift: " + name)
        for key, expected in pool.get("ready_input_digests", {}).items():
            require(key in tasks and task_input_digest(pool, tasks[key]) == expected,
                    "administrative inputs digest drift: " + key)
    return tasks


def self_test(pool):
    checks = 0

    def rejects(edit):
        nonlocal checks
        specimen = copy.deepcopy(pool)
        edit(specimen)
        try:
            validate(specimen, verify_files=False)
        except ValueError:
            checks += 1
        else:
            raise AssertionError("invalid specimen accepted")

    rejects(lambda p: p["capacity"].update(worker_slots=12))
    rejects(lambda p: p["slots"].append(dict(p["slots"][-1], id=12)))
    rejects(lambda p: p["fallback"].update(max_sol_fallback_attempts_per_task=2))
    rejects(lambda p: (next(t for t in p["tasks"] if t["id"] == "P2_neutral_guard").update(status="blocked"),
                       next(t for t in p["tasks"] if t["id"] == "P2_A").update(status="ready")))
    rejects(lambda p: next(t for t in p["tasks"] if t["id"] == "P4_pack").update(model=SOL))
    rejects(lambda p: next(t for t in p["tasks"] if t["id"] == "P3_pack").update(depends_on=["P3_A"]))
    failed = dict(next(t for t in pool["tasks"] if t["id"] == "P4_pack"),
                  status="failed", inputs_digest="a" * 64,
                  attempts=[{"model": FLASH, "status": "failed", "kind": "primary"}])
    original = copy.deepcopy(failed)
    fallback = fallback_attempt(failed)
    require(failed == original and fallback["role"] == failed["role"], "fallback mutation/role drift")
    require(fallback["attempts"][-1]["model"] == SOL, "fallback model")
    checks += 1
    try:
        fallback_attempt(dict(fallback, status="failed"))
    except ValueError:
        checks += 1
    else:
        raise AssertionError("repeat fallback accepted")
    sample = copy.deepcopy(pool)
    next(t for t in sample["tasks"] if t["id"] == "P3_pack")["status"] = "completed"
    review = next(t for t in sample["tasks"] if t["id"] == "P3_C_review")
    review.update(status="blocked")
    review.pop("dispatch_block_reason", None)
    next(t for t in sample["tasks"] if t["id"] == "P3_A")["status"] = "blocked"
    require("P3_C_review" in [t["id"] for t in ready_tasks(sample)],
            "next role must become ready without a batch barrier")
    require("P3_A" not in [t["id"] for t in ready_tasks(sample)], "dependency bypass")
    checks += 1
    review["dispatch_block_reason"] = "await_parent_acceptance_of_returned_artifacts"
    require("P3_C_review" not in [t["id"] for t in ready_tasks(sample)],
            "returned-but-unaccepted role must not be dispatched twice")
    checks += 1
    require(model_ref_matches(SOL, {"providerID": "openai", "id": "gpt-6.1-sol",
                                    "variant": "high"}), "valid high reference rejected")
    checks += 1
    require(not model_ref_matches(SOL, {"providerID": "openai", "id": "gpt-6.1-sol#high",
                                        "variant": "default"}), "literal high suffix accepted")
    checks += 1
    drain_sample = copy.deepcopy(pool)
    drain_sample["activation"] = "blocked_native_ida_mcp_absent_after_restart"
    drain_sample["guards"]["dispatch_GO"] = False
    drain_sample["global_stop_drain"] = {
        "nonterminal_owned_session_ids": [s["session_id"] for s in drain_sample["slots"][1:]
                                         if s["status"] == "running"],
        "dispatch_closed_before_fallback_or_new_roles": True,
        "no_cancel_force_foreign_resume_or_harness_change": True,
    }
    validate(drain_sample, verify_files=False)
    checks += 1
    drain_sample["guards"]["dispatch_GO"] = True
    try:
        validate(drain_sample, verify_files=False)
    except ValueError:
        checks += 1
    else:
        raise AssertionError("critical restart drain accepted new dispatch")
    if pool.get("native_migration_2026_10_10"):
        rejects(lambda p: p["native_migration_2026_10_10"]["self_model_actual"].update(variant="default"))
        rejects(lambda p: p["native_migration_2026_10_10"]["canaries"][0]["model_actual"].update(id="glm-5.3-flash#high"))
        rejects(lambda p: p["native_migration_2026_10_10"]["old_Ensemble_quiescence"].update(workers_computing_observed=1))
        rejects(lambda p: (p.update(activation="awaiting_background_GO"),
                           p["guards"].update(dispatch_GO=True)))
    return checks


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    pool = json.loads(POOL.read_text(encoding="utf-8"))
    validate(pool)
    ready = ready_tasks(pool)
    print(f"PASS: 12 total / 11 workers; {len(pool['tasks'])} DAG tasks; "
          f"{len(ready)} worker-ready; {len(ready_tasks(pool, 'supervisor'))} supervisor-ready")
    print("READY:", ", ".join(t["id"] for t in ready))
    print(f"Activation: {pool['activation']}; dispatch_GO={pool['guards']['dispatch_GO']}; "
          "no runtime concurrency/load test.")
    if args.self_test:
        print(f"PASS: {self_test(pool)} offline policy tests; no state writes or worker calls")


if __name__ == "__main__":
    main()
