"""Explicit fixture resolution for the tools/af3dn_state offline test pack.

The three real external fixtures are never searched in the workspace and the
upstream working tree is never imported. The path always comes from the
dedicated environment variable; when the variable is unset the returned path
is a guaranteed-absent sentinel (tests then skip, and run_offline.py never
lets a full run pass through skips).
"""
import os
from pathlib import Path

_UNSET = '<AF3DN_FIXTURE_UNSET>'


def _resolve(env_var: str) -> Path:
    value = os.environ.get(env_var)
    return Path(value) if value else Path(_UNSET)


def v13() -> Path:
    """Absolute path of the v13 baseline dump (env AF3DN_V13_BASELINE)."""
    return _resolve('AF3DN_V13_BASELINE')


def historical() -> Path:
    """Absolute path of the historical baseline capture
    (env AF3DN_HISTORICAL_BASELINE)."""
    return _resolve('AF3DN_HISTORICAL_BASELINE')


def reference() -> Path:
    """Absolute path of the reference image (env AF3DN_REFERENCE_IMAGE)."""
    return _resolve('AF3DN_REFERENCE_IMAGE')
