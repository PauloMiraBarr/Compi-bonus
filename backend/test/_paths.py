"""Registra TopDown/ y BottomUp/ en sys.path para ejecutar tests desde backend/test/."""
from __future__ import annotations

import sys
from pathlib import Path

_BACKEND = Path(__file__).resolve().parent.parent

for _subdir in ("TopDown", "BottomUp"):
    _p = str(_BACKEND / _subdir)
    if _p not in sys.path:
        sys.path.insert(0, _p)
