"""
CLI entry point for the binaryTribunal hypothesis runner.

Usage (library mode — typically invoked by a domain-specific wrapper):

    from binaryTribunal.__main__ import main
    main(plugin_setup=my_plugin_setup)

Or directly for engine-only tests (no domain actions):

    python -m binaryTribunal run tests/MY_TEST.yaml
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Callable

from .evidence import Evidence
from .hypothesis import (
    HypothesisDefinition,
    Step,
    expand_hypothesis,
    is_suite_file,
    load_hypothesis,
    load_hypothesis_suite,
    load_hypotheses_from_dir,
    resolve_address,
)
from .mcp_client import McpClient
from .runner import HypothesisRunner


# Type for plugin setup callbacks.
# Receives the runner and the McpClient so it can register domain actions.
PluginSetup = Callable[[HypothesisRunner, McpClient], None]


def _resolve_test_path(raw: str, search_dirs: list[Path] | None = None) -> Path:
    """Resolve a test path against optional search directories or as-is."""
    p = Path(raw)
    if p.exists():
        return p
    for d in (search_dirs or []):
        rel = d / raw
        if rel.exists():
            return rel
    return p  # return as-is; will fail in loader with a clear error


def _load_latest_evidence_results(evidence_dir: Path) -> dict[str, str]:
    """Load latest deterministic result by test_id from evidence JSON files."""
    results: dict[str, str] = {}
    newest_mtime: dict[str, float] = {}
    if not evidence_dir.exists() or not evidence_dir.is_dir():
        return results

    for path in evidence_dir.glob("*.json"):
        if not path.is_file():
            continue
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue

        test_id = raw.get("test_id")
        result = raw.get("deterministic_result")
        if not isinstance(test_id, str) or not test_id:
            continue
        if test_id.endswith("__before_each"):
            continue
        if not isinstance(result, str) or not result:
            continue

        mtime = path.stat().st_mtime
        prev = newest_mtime.get(test_id, -1.0)
        if mtime >= prev:
            newest_mtime[test_id] = mtime
            results[test_id] = result

    return results


def _parse_param_value(text: str) -> int:
    """Parse one KEY=VALUE override scalar."""
    stripped = text.strip()
    if stripped.lower().startswith("0x"):
        return int(stripped, 16)
    return int(stripped)


def _parse_param_overrides(items: list[str] | None) -> dict[str, int]:
    """Parse repeated KEY=VALUE command-line overrides."""
    result: dict[str, int] = {}
    for item in items or []:
        if "=" not in item:
            raise ValueError(f"Invalid --param value {item!r}; expected KEY=VALUE")
        key, raw = item.split("=", 1)
        key = key.strip()
        if not key:
            raise ValueError(f"Invalid --param value {item!r}; key is empty")
        result[key] = _parse_param_value(raw)
    return result


def _apply_param_overrides(hypothesis: HypothesisDefinition, overrides: dict[str, int]) -> HypothesisDefinition:
    """Mutate one concrete hypothesis with command-line constant overrides."""
    if overrides:
        hypothesis.constants.update(overrides)
    return hypothesis


def _load_execution_plan(
    targets: list[str],
    *,
    search_dirs: list[Path] | None = None,
    replay_mode: bool = False,
    replay_index: dict[str, str] | None = None,
    param_overrides: dict[str, int] | None = None,
) -> list[dict[str, object]]:
    """Resolve targets into a concrete execution plan."""
    replay_index = replay_index or {}
    param_overrides = param_overrides or {}
    plan: list[dict[str, object]] = []
    for target in targets:
        path = _resolve_test_path(target, search_dirs)
        if path.is_dir():
            for hyp in load_hypotheses_from_dir(path):
                plan.append(
                    {
                        "hypothesis": _apply_param_overrides(hyp, param_overrides),
                        "before_steps": [],
                        "before_constants": {},
                    }
                )
        elif path.is_file():
            if is_suite_file(path):
                suite = load_hypothesis_suite(path)
                suite_search_dirs = [path.parent, *(search_dirs or [])]
                resolved = [_resolve_test_path(raw, suite_search_dirs) for raw in suite.hypotheses]
                if len(resolved) == 0:
                    raise ValueError(f"suite {path} has no hypotheses")

                for i, hyp_path in enumerate(resolved):
                    if not hyp_path.exists() or not hyp_path.is_file():
                        raise FileNotFoundError(
                            f"suite hypothesis not found: {hyp_path} "
                            f"(from '{suite.hypotheses[i]}')"
                        )
                    expanded = expand_hypothesis(load_hypothesis(hyp_path))
                    for hyp in expanded:
                        _apply_param_overrides(hyp, param_overrides)
                        if replay_mode:
                            prior = replay_index.get(hyp.id)
                            if prior not in (None, "FAIL"):
                                continue
                        plan.append(
                            {
                                "hypothesis": hyp,
                                "before_steps": suite.before_each,
                                "before_constants": {**suite.constants, **param_overrides},
                            }
                        )
            else:
                for hyp in expand_hypothesis(load_hypothesis(path)):
                    plan.append(
                        {
                            "hypothesis": _apply_param_overrides(hyp, param_overrides),
                            "before_steps": [],
                            "before_constants": {},
                        }
                    )
        else:
            raise FileNotFoundError(f"{target} not found (tried {path})")
    return plan


def cmd_run(
    args: argparse.Namespace,
    *,
    plugin_setup: PluginSetup | None = None,
    search_dirs: list[Path] | None = None,
) -> int:
    """Run one or more hypothesis YAML files."""
    replay_mode = bool(getattr(args, "replay", False))
    evidence_dir = Path(args.evidence_dir) if args.evidence_dir else None
    try:
        param_overrides = _parse_param_overrides(getattr(args, "param", None))
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    replay_index: dict[str, str] = {}
    if replay_mode:
        if evidence_dir is None:
            print("ERROR: --replay requires --evidence-dir", file=sys.stderr)
            return 1
        replay_index = _load_latest_evidence_results(evidence_dir)

    mcp = McpClient(
        base_url=args.mcp_url,
        timeout=args.timeout,
        dbg_timeout=args.dbg_timeout,
    )
    runner = HypothesisRunner(
        mcp,
        keep_breakpoints=args.keep_breakpoints,
    )

    # Let the plugin register its domain-specific actions
    if plugin_setup is not None:
        plugin_setup(runner, mcp)

    try:
        plan = _load_execution_plan(
            list(args.targets),
            search_dirs=search_dirs,
            replay_mode=replay_mode,
            replay_index=replay_index,
            param_overrides=param_overrides,
        )
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    if not plan:
        print("No hypothesis files found.", file=sys.stderr)
        return 1

    print(f"Running {len(plan)} hypothesis/hypotheses...\n")

    results: list[Evidence] = []
    for entry in plan:
        hyp = entry["hypothesis"]
        assert isinstance(hyp, HypothesisDefinition)

        before_steps = entry["before_steps"]
        before_constants = entry["before_constants"]
        assert isinstance(before_steps, list)
        assert isinstance(before_constants, dict)
        if before_steps:
            hook_evidence = Evidence(
                test_id=f"{hyp.id}__before_each",
                title=f"before_each hooks before {hyp.id}",
            )
            print(f"--- {hyp.id}: before_each hooks ---")
            try:
                runner.run_hook_steps(
                    [s for s in before_steps if isinstance(s, Step)],
                    before_constants,
                    hook_evidence,
                    phase_name="Before hypothesis",
                )
            except Exception as exc:
                hook_evidence.log(
                    f"EXCEPTION during before_each: {type(exc).__name__}: {exc}"
                )
                hook_evidence.add_assertion("before_each_completed", False, str(exc))
                for line in hook_evidence.raw_log:
                    print(line)
                print("ERROR: before_each hooks failed", file=sys.stderr)
                return 1

            for line in hook_evidence.raw_log:
                print(line)
            print()

        print(f"--- {hyp.id}: {hyp.title} ---")
        evidence = runner.run(hyp)
        results.append(evidence)

        # Print log
        for line in evidence.raw_log:
            print(line)

        # Print assertions
        for a in evidence.assertions:
            status = "PASS" if a["passed"] else "FAIL"
            print(f"  [{status}] {a['check']}: {a.get('detail', '')}")

        # Write evidence
        if args.evidence_dir:
            path = evidence.write_json(args.evidence_dir)
            print(f"  Evidence: {path}")
        print()

    # Summary
    passed = sum(1 for r in results if r.deterministic_result == "PASS")
    failed = sum(1 for r in results if r.deterministic_result == "FAIL")
    no_assert = sum(1 for r in results
                    if r.deterministic_result == "NO_ASSERTIONS")

    print("=" * 60)
    print(f"RESULTS: {passed} passed, {failed} failed, "
          f"{no_assert} no-assertions, {len(results)} total")
    print("=" * 60)

    return 0 if failed == 0 else 1


def _validate_step(
    step: Step,
    *,
    constants: dict[str, int],
    phase: str,
    known_actions: set[str],
    known_assertions: set[str],
    errors: list[str],
    prefix: str,
) -> None:
    """Validate one step and its nested structures."""
    if phase == "assert":
        name = step.check or step.action
        if name not in known_assertions:
            errors.append(f"{prefix}: unknown assertion '{name}'")
    else:
        name = step.action or step.check
        if name not in known_actions:
            errors.append(f"{prefix}: unknown action '{name}'")

    if step.address:
        try:
            step.resolved_address(constants)
        except Exception as exc:
            errors.append(f"{prefix}: invalid address expression {step.address!r}: {exc}")

    for idx, region in enumerate(step.regions, start=1):
        addr = region.get("address")
        if addr:
            try:
                if isinstance(addr, str):
                    resolve_address(addr, constants)
            except Exception as exc:
                errors.append(
                    f"{prefix}: invalid region[{idx}] address {addr!r}: {exc}"
                )

    if name in {"continue_execution", "trace_breakpoint_hits"}:
        if step.timeout_ms <= 0:
            errors.append(f"{prefix}: {name} requires timeout_ms > 0")
        if not step.wait_until:
            errors.append(f"{prefix}: {name} requires non-empty wait_until")

    if name == "sample_memory":
        if step.timeout_ms <= 0:
            errors.append(f"{prefix}: sample_memory requires timeout_ms > 0")
        if not step.regions and not step.address:
            errors.append(f"{prefix}: sample_memory requires regions or address")

    if name in {"set_watchpoint", "delete_watchpoint"}:
        size = int(step.size or step.fields.get("size", 1) or 1)
        if size not in (1, 2, 4):
            errors.append(f"{prefix}: watchpoint size must be 1, 2, or 4")

    for idx, nested in enumerate(step.on_hit, start=1):
        _validate_step(
            nested,
            constants=constants,
            phase="capture",
            known_actions=known_actions,
            known_assertions=known_assertions,
            errors=errors,
            prefix=f"{prefix}.on_hit[{idx}]",
        )

    for idx, nested in enumerate(step.checks, start=1):
        _validate_step(
            nested,
            constants=constants,
            phase="assert",
            known_actions=known_actions,
            known_assertions=known_assertions,
            errors=errors,
            prefix=f"{prefix}.checks[{idx}]",
        )


def cmd_validate(
    args: argparse.Namespace,
    *,
    plugin_setup: PluginSetup | None = None,
    search_dirs: list[Path] | None = None,
) -> int:
    """Validate hypothesis files without requiring a live debugger session."""
    try:
        param_overrides = _parse_param_overrides(getattr(args, "param", None))
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    runner = HypothesisRunner(McpClient())
    if plugin_setup is not None:
        plugin_setup(runner, runner.mcp)

    try:
        plan = _load_execution_plan(
            list(args.targets),
            search_dirs=search_dirs,
            param_overrides=param_overrides,
        )
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    if not plan:
        print("No hypothesis files found.", file=sys.stderr)
        return 1

    known_actions = set(runner.known_actions())
    known_assertions = set(runner.known_assertions())
    total_errors = 0

    for entry in plan:
        hyp = entry["hypothesis"]
        assert isinstance(hyp, HypothesisDefinition)
        errors: list[str] = []
        phases = [
            ("setup", hyp.setup),
            ("act", hyp.act),
            ("observe", hyp.observe),
            ("assert", hyp.asserts),
            ("cleanup", hyp.cleanup),
        ]
        for phase_name, steps in phases:
            for idx, step in enumerate(steps, start=1):
                _validate_step(
                    step,
                    constants=hyp.constants,
                    phase=phase_name,
                    known_actions=known_actions,
                    known_assertions=known_assertions,
                    errors=errors,
                    prefix=f"{hyp.id}.{phase_name}[{idx}]",
                )

        if errors:
            total_errors += len(errors)
            print(f"[FAIL] {hyp.id}:")
            for error in errors:
                print(f"  - {error}")
        else:
            print(f"[PASS] {hyp.id}")

    print("=" * 60)
    print(
        f"VALIDATION: {len(plan)} hypothesis/hypotheses, {total_errors} error(s)"
    )
    print("=" * 60)
    return 0 if total_errors == 0 else 1


def build_parser(
    prog: str = "binaryTribunal",
    description: str = "RE Hypothesis Runner",
    default_evidence_dir: str | None = None,
) -> argparse.ArgumentParser:
    """Build the CLI argument parser.

    Domain wrappers can call this to get the base parser, then add
    their own subcommands or arguments.
    """
    parser = argparse.ArgumentParser(prog=prog, description=description)
    parser.add_argument(
        "--mcp-url", default="http://127.0.0.1:13337",
        help="Base URL of the IDA MCP server (default: %(default)s)")
    parser.add_argument(
        "--timeout", type=float, default=60,
        help="HTTP timeout for standard MCP calls in seconds (default: %(default)s)")
    parser.add_argument(
        "--dbg-timeout", type=float, default=120,
        help="HTTP timeout for debugger MCP calls in seconds (default: %(default)s)")
    parser.add_argument(
        "--evidence-dir", type=str, default=default_evidence_dir,
        help="Directory to write evidence JSON files (default: %(default)s)")

    sub = parser.add_subparsers(dest="command")

    # run subcommand
    run_parser = sub.add_parser("run", help="Run hypothesis YAML files")
    run_parser.add_argument(
        "targets", nargs="+",
        help="YAML files or directories of YAML files to execute")
    run_parser.add_argument(
        "--evidence-dir",
        type=str,
        default=argparse.SUPPRESS,
        help=("Directory to write evidence JSON files. "
              "Can be provided before or after 'run'."),
    )
    run_parser.add_argument(
        "--keep-breakpoints",
        action="store_true",
        help=("Do not delete breakpoints during cleanup phase. "
              "Useful for manual post-run debugging in IDA."),
    )
    run_parser.add_argument(
        "--replay",
        action="store_true",
        help=("Replay only failed-or-missing suite hypotheses based on prior "
              "evidence in --evidence-dir."),
    )
    run_parser.add_argument(
        "--param",
        action="append",
        default=argparse.SUPPRESS,
        help="Override a constant for all loaded hypotheses (KEY=VALUE).",
    )

    validate_parser = sub.add_parser(
        "validate",
        help="Validate hypothesis YAML files without connecting to a live target",
    )
    validate_parser.add_argument(
        "targets",
        nargs="+",
        help="YAML files or directories of YAML files to validate",
    )
    validate_parser.add_argument(
        "--param",
        action="append",
        default=argparse.SUPPRESS,
        help="Override a constant for all loaded hypotheses (KEY=VALUE).",
    )

    return parser


def main(
    *,
    plugin_setup: PluginSetup | None = None,
    prog: str = "binaryTribunal",
    description: str = "RE Hypothesis Runner",
    default_evidence_dir: str | None = None,
    search_dirs: list[Path] | None = None,
) -> int:
    """Generic CLI entry point.

    Domain plugins call this from their own ``__main__.py``, passing
    a *plugin_setup* callback that registers domain-specific actions
    on the runner.
    """
    parser = build_parser(
        prog=prog,
        description=description,
        default_evidence_dir=default_evidence_dir,
    )
    args = parser.parse_args()

    if args.command == "run":
        return cmd_run(args, plugin_setup=plugin_setup, search_dirs=search_dirs)
    elif args.command == "validate":
        return cmd_validate(args, plugin_setup=plugin_setup, search_dirs=search_dirs)
    else:
        parser.print_help()
        return 0


if __name__ == "__main__":
    sys.exit(main())
