"""Backward-compatibility re-export.  Canonical module: binaryTribunal.hypothesis."""
from binaryTribunal.hypothesis import *  # noqa: F401,F403
from binaryTribunal.hypothesis import (  # noqa: F401
    HypothesisDefinition,
    HypothesisSuiteDefinition,
    Step,
    is_suite_file,
    load_hypothesis,
    load_hypothesis_suite,
    load_hypotheses_from_dir,
    resolve_address,
)
