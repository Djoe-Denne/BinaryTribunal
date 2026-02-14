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
    is_suite_file,
    load_hypothesis,
    load_hypothesis_suite,
    load_hypotheses_from_dir,
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


def cmd_run(
    args: argparse.Namespace,
    *,
    plugin_setup: PluginSetup | None = None,
    search_dirs: list[Path] | None = None,
) -> int:
    """Run one or more hypothesis YAML files."""
    replay_mode = bool(getattr(args, "replay", False))
    evidence_dir = Path(args.evidence_dir) if args.evidence_dir else None
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

    # Collect execution plan
    # Each entry: hypothesis + optional before-each steps/constants to run before it.
    plan: list[dict[str, object]] = []
    for target in args.targets:
        path = _resolve_test_path(target, search_dirs)
        if path.is_dir():
            for hyp in load_hypotheses_from_dir(path):
                plan.append({
                    "hypothesis": hyp,
                    "before_steps": [],
                    "before_constants": {},
                })
        elif path.is_file():
            if is_suite_file(path):
                suite = load_hypothesis_suite(path)
                suite_search_dirs = [path.parent, *(search_dirs or [])]
                resolved = [
                    _resolve_test_path(raw, suite_search_dirs)
                    for raw in suite.hypotheses
                ]
                if len(resolved) == 0:
                    print(f"ERROR: suite {path} has no hypotheses", file=sys.stderr)
                    return 1

                suite_total = len(resolved)
                suite_selected = 0
                for i, hyp_path in enumerate(resolved):
                    if not hyp_path.exists() or not hyp_path.is_file():
                        print(
                            f"ERROR: suite hypothesis not found: {hyp_path} "
                            f"(from '{suite.hypotheses[i]}')",
                            file=sys.stderr,
                        )
                        return 1
                    hyp = load_hypothesis(hyp_path)
                    if replay_mode:
                        prior = replay_index.get(hyp.id)
                        # Replay failed runs and scenarios with absent evidence.
                        if prior not in (None, "FAIL"):
                            continue
                    suite_selected += 1
                    plan.append({
                        "hypothesis": hyp,
                        "before_steps": suite.before_each,
                        "before_constants": suite.constants,
                    })
                if replay_mode:
                    suite_skipped = suite_total - suite_selected
                    print(
                        f"Replay filter [{path.name}]: "
                        f"selected={suite_selected}, skipped={suite_skipped}, "
                        "rule=(FAIL or missing evidence)"
                    )
            else:
                plan.append({
                    "hypothesis": load_hypothesis(path),
                    "before_steps": [],
                    "before_constants": {},
                })
        else:
            print(f"ERROR: {target} not found (tried {path})", file=sys.stderr)
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
        return cmd_run(args, plugin_setup=plugin_setup,
                       search_dirs=search_dirs)
    else:
        parser.print_help()
        return 0


if __name__ == "__main__":
    sys.exit(main())
