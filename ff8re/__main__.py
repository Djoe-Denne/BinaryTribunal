"""
CLI entry point for the FF8 battle RE hypothesis runner.

This is the FF8-specific wrapper around the generic binaryTribunal engine.
It registers FF8 battle domain actions (slot snapshots, pending
action injection, phase flags, etc.) before delegating to the
engine's run loop.

Usage:
    python -m ff8re smoke                      # MCP transport smoke test
    python -m ff8re run tests/SLOT_001.yaml    # run a single hypothesis
    python -m ff8re run tests/tier1_layout/    # run all hypotheses in a dir
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from binaryTribunal.evidence import Evidence
from binaryTribunal.mcp_client import McpClient
from binaryTribunal.runner import HypothesisRunner
from binaryTribunal.__main__ import build_parser, cmd_run as engine_cmd_run

from .actions import register_ff8_actions
from .battle_state import FF8BattleState
from .smoke import run_smoke_test


# Where we look for test YAML files relative to this package
_PACKAGE_DIR = Path(__file__).resolve().parent
_EVIDENCE_DIR = _PACKAGE_DIR.parent / "evidence"
_SEARCH_DIRS = [
    _PACKAGE_DIR / "tests",
    _PACKAGE_DIR.parent,
]


def _ff8_plugin_setup(runner: HypothesisRunner, mcp: McpClient) -> None:
    """Plugin callback: wire FF8 battle domain into the runner."""
    battle = FF8BattleState(mcp)
    register_ff8_actions(runner, battle)


def cmd_smoke(args: argparse.Namespace) -> int:
    """Run the MCP transport smoke test (Phase 0 validation)."""
    mcp = McpClient(base_url=args.mcp_url,
                    timeout=args.timeout,
                    dbg_timeout=args.dbg_timeout)
    battle = FF8BattleState(mcp)
    evidence = run_smoke_test(mcp, battle)

    # Output
    print("\n" + "=" * 60)
    print(f"SMOKE TEST: {evidence.deterministic_result}")
    print("=" * 60)
    for line in evidence.raw_log:
        print(line)
    print()
    for a in evidence.assertions:
        status = "PASS" if a["passed"] else "FAIL"
        print(f"  [{status}] {a['check']}: {a.get('detail', '')}")

    if args.evidence_dir:
        path = evidence.write_json(args.evidence_dir)
        print(f"\nEvidence written to: {path}")

    return 0 if evidence.deterministic_result == "PASS" else 1


def main() -> int:
    parser = build_parser(
        prog="ff8re",
        description="FF8 Battle RE Hypothesis Runner",
        default_evidence_dir=str(_EVIDENCE_DIR),
    )

    # Add the smoke subcommand (FF8-specific)
    sub = parser._subparsers._group_actions[0]  # type: ignore[union-attr]
    sub.add_parser("smoke", help="Run MCP transport smoke test (Phase 0)")

    args = parser.parse_args()

    if args.command == "smoke":
        return cmd_smoke(args)
    elif args.command == "run":
        return engine_cmd_run(
            args,
            plugin_setup=_ff8_plugin_setup,
            search_dirs=_SEARCH_DIRS,
        )
    else:
        parser.print_help()
        return 0


if __name__ == "__main__":
    sys.exit(main())
