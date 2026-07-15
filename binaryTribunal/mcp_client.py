"""
MCP transport layer for IDA Pro debugger integration.

Dual-endpoint McpClient: standard ``/mcp`` for IDB analysis tools,
``/mcp?ext=dbg`` for live-debugger tools (memory, breakpoints, execution).
"""

from __future__ import annotations

import ast
import json
import struct
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen


# ---------------------------------------------------------------------------
# Tool name prefixes that require the debugger extension endpoint
# ---------------------------------------------------------------------------
_DBG_PREFIXES = ("dbg_",)


class McpClient:
    """JSON-RPC client for IDA Pro MCP server with debugger support."""

    def __init__(
        self,
        base_url: str = "http://127.0.0.1:13337",
        timeout: float = 60,
        dbg_timeout: float = 120,
    ) -> None:
        base = base_url.rstrip("/")
        self._url_std = base + "/mcp"
        self._url_dbg = base + "/mcp?ext=dbg"
        self._req_id = 1
        self._timeout = timeout
        self._dbg_timeout = dbg_timeout
        self._global_addrs: dict[str, int] = {}

    # ------------------------------------------------------------------
    # Low-level transport
    # ------------------------------------------------------------------

    def _url_for(self, tool_name: str) -> str:
        """Route a tool call to the correct endpoint."""
        if any(tool_name.startswith(p) for p in _DBG_PREFIXES):
            return self._url_dbg
        return self._url_std

    def _timeout_for(self, tool_name: str) -> float:
        if any(tool_name.startswith(p) for p in _DBG_PREFIXES):
            return self._dbg_timeout
        return self._timeout

    def _post(self, url: str, method: str, params: dict[str, Any],
              timeout: float) -> dict[str, Any]:
        payload = {
            "jsonrpc": "2.0",
            "id": self._req_id,
            "method": method,
            "params": params,
        }
        self._req_id += 1
        data = json.dumps(payload).encode("utf-8")
        req = Request(url, data=data,
                      headers={"Content-Type": "application/json"})
        try:
            with urlopen(req, timeout=timeout) as resp:
                obj = json.loads(resp.read().decode("utf-8"))
        except URLError as exc:
            raise McpTransportError(f"MCP transport error: {exc}") from exc
        if "error" in obj:
            raise McpToolError(f"MCP error: {obj['error']}")
        return obj.get("result", {})

    def tool(self, name: str, arguments: dict[str, Any] | None = None,
             *, timeout: float | None = None) -> Any:
        """Call an MCP tool by name and return its structured result."""
        url = self._url_for(name)
        tout = timeout if timeout is not None else self._timeout_for(name)
        result = self._post(url, "tools/call",
                            {"name": name, "arguments": arguments or {}},
                            tout)
        if result.get("isError"):
            raise McpToolError(
                f"Tool call error for {name}: {result.get('content')}")
        sc = result.get("structuredContent")
        if isinstance(sc, dict) and "result" in sc:
            return sc["result"]
        return sc

    def py_eval(self, code: str, *, timeout: float | None = None) -> dict[str, Any]:
        """Execute Python in IDA and normalize the result payload."""
        raw = self.tool("py_eval", {"code": code}, timeout=timeout)
        if isinstance(raw, dict):
            stderr = str(raw.get("stderr", "") or "").strip()
            if stderr:
                raise McpToolError(f"py_eval stderr: {stderr}")
            return {
                "result": raw.get("result"),
                "stdout": str(raw.get("stdout", "") or ""),
                "stderr": stderr,
            }
        return {"result": raw, "stdout": "", "stderr": ""}

    # ==================================================================
    # Debugger Memory — read
    # ==================================================================

    def read_bytes(self, addr: int, size: int) -> bytes:
        """Read *size* bytes from the debugged process at *addr*."""
        region = {"addr": hex(addr), "size": size}
        rows = self.tool("dbg_read", {"regions": [region]})
        # The server returns a list of results per region.
        row = rows[0] if isinstance(rows, list) else rows
        if row.get("error"):
            raise McpToolError(f"dbg_read error @ {hex(addr)}: {row['error']}")
        hex_str: str = row.get("hex", "") or row.get("data", "")
        return bytes.fromhex(hex_str.replace(" ", ""))

    def read_u8(self, addr: int) -> int:
        return struct.unpack_from("<B", self.read_bytes(addr, 1))[0]

    def read_u16(self, addr: int) -> int:
        return struct.unpack_from("<H", self.read_bytes(addr, 2))[0]

    def read_u32(self, addr: int) -> int:
        return struct.unpack_from("<I", self.read_bytes(addr, 4))[0]

    def read_i8(self, addr: int) -> int:
        return struct.unpack_from("<b", self.read_bytes(addr, 1))[0]

    def read_i16(self, addr: int) -> int:
        return struct.unpack_from("<h", self.read_bytes(addr, 2))[0]

    def read_i32(self, addr: int) -> int:
        return struct.unpack_from("<i", self.read_bytes(addr, 4))[0]

    # ==================================================================
    # Debugger Memory — write
    # ==================================================================

    def write_bytes(self, addr: int, data: bytes) -> None:
        """Write *data* bytes to the debugged process at *addr*."""
        region = {"addr": hex(addr), "data": data.hex()}
        result = self.tool("dbg_write", {"regions": [region]})
        if isinstance(result, list):
            for r in result:
                if r.get("error"):
                    raise McpToolError(
                        f"dbg_write error @ {hex(addr)}: {r['error']}")

    def write_u8(self, addr: int, val: int) -> None:
        self.write_bytes(addr, struct.pack("<B", val & 0xFF))

    def write_u16(self, addr: int, val: int) -> None:
        self.write_bytes(addr, struct.pack("<H", val & 0xFFFF))

    def write_u32(self, addr: int, val: int) -> None:
        self.write_bytes(addr, struct.pack("<I", val & 0xFFFFFFFF))

    # ==================================================================
    # Breakpoints
    # ==================================================================

    def add_breakpoint(self, addr: int) -> Any:
        """Add a software breakpoint at *addr*."""
        return self.tool("dbg_add_bp", {"addrs": [hex(addr)]})

    def delete_breakpoint(self, addr: int) -> Any:
        """Remove the breakpoint at *addr*."""
        return self.tool("dbg_delete_bp", {"addrs": [hex(addr)]})

    def list_breakpoints(self) -> list[dict[str, Any]]:
        """Return all currently-set breakpoints."""
        result = self.tool("dbg_bps")
        return result if isinstance(result, list) else []

    def toggle_breakpoint(self, addr: int, enabled: bool) -> Any:
        """Enable or disable a breakpoint without removing it."""
        return self.tool("dbg_toggle_bp",
                         {"items": [{"addr": hex(addr),
                                     "enabled": enabled}]})

    def add_watchpoint(self, addr: int, size: int) -> dict[str, Any]:
        """Add a write watchpoint via IDA's Python API."""
        if size not in (1, 2, 4):
            raise ValueError(f"watchpoint size must be 1, 2, or 4 bytes, got {size}")
        if addr % size != 0:
            raise ValueError(
                f"watchpoint address {hex(addr)} must be aligned to its size {size}"
            )
        payload = self.py_eval(
            f"""
import ida_dbg
import ida_idd

addr = {addr}
size = {size}
ok = ida_dbg.add_bpt(addr, size, ida_idd.BPT_WRITE)
try:
    ida_dbg.enable_bpt(addr, True)
except Exception:
    pass
result = {{
    "added": bool(ok),
    "addr": addr,
    "size": size,
}}
result
""",
        )
        result = _normalize_py_eval_result(payload.get("result"))
        return result if isinstance(result, dict) else {"result": result}

    def delete_watchpoint(self, addr: int) -> dict[str, Any]:
        """Delete a watchpoint via IDA's Python API."""
        payload = self.py_eval(
            f"""
import ida_dbg

addr = {addr}
ok = ida_dbg.del_bpt(addr)
result = {{
    "deleted": bool(ok),
    "addr": addr,
}}
result
""",
        )
        result = _normalize_py_eval_result(payload.get("result"))
        return result if isinstance(result, dict) else {"result": result}

    # ==================================================================
    # Execution control
    # ==================================================================

    def continue_exec(self, *, timeout: float | None = None) -> Any:
        """Continue execution. Blocks until the debugger suspends again."""
        return self.tool("dbg_continue", timeout=timeout)

    def run_to(self, addr: int, *, timeout: float | None = None) -> Any:
        """Run until *addr* is reached."""
        return self.tool("dbg_run_to", {"addr": hex(addr)}, timeout=timeout)

    def step_over(self) -> Any:
        return self.tool("dbg_step_over")

    def step_into(self) -> Any:
        return self.tool("dbg_step_into")

    def request_continue_process(self) -> dict[str, Any]:
        """Request debugger resume without blocking on the next stop."""
        payload = self.py_eval(
            """
import ida_dbg

request = getattr(ida_dbg, "request_continue_process", None)
if request is not None:
    requested = request()
    try:
        run_requests = getattr(ida_dbg, "run_requests", None)
        if run_requests is not None:
            run_requests()
    except Exception:
        pass
else:
    request = getattr(ida_dbg, "continue_process", None)
    if request is None:
        raise RuntimeError("IDA debugger continue API not available")
    requested = request()

result = {
    "requested": bool(requested),
}
result
""",
        )
        result = _normalize_py_eval_result(payload.get("result"))
        return result if isinstance(result, dict) else {"result": result}

    def suspend_process(self, timeout_ms: int = 5000) -> dict[str, Any]:
        """Request suspension and wait for the next debugger event."""
        payload = self.py_eval(
            f"""
import ida_dbg

timeout_ms = {timeout_ms}
request = getattr(ida_dbg, "suspend_process", None)
if request is None:
    request = getattr(ida_dbg, "request_suspend_process", None)
if request is None:
    raise RuntimeError("IDA debugger suspend API not available")

requested = request()
event = None
event_value = None
wait_fn = getattr(ida_dbg, "wait_for_next_event", None)
if wait_fn is not None:
    wfne_susp = getattr(ida_dbg, "WFNE_SUSP", 0)
    try:
        event = wait_fn(wfne_susp, timeout_ms)
    except TypeError:
        event = wait_fn(wfne_susp, int(timeout_ms))
if event is not None:
    try:
        event_value = int(event)
    except Exception:
        event_value = str(event)

result = {{
    "requested": bool(requested),
    "event": event_value,
}}
result
""",
            timeout=max(self._timeout, timeout_ms / 1000.0 + 5.0),
        )
        result = _normalize_py_eval_result(payload.get("result"))
        return result if isinstance(result, dict) else {"result": result}

    def get_process_state(self) -> dict[str, Any]:
        """Return the debugger attachment and process-state information."""
        payload = self.py_eval(
            """
import ida_dbg

get_state = getattr(ida_dbg, "get_process_state", None)
is_on = getattr(ida_dbg, "is_debugger_on", None)

state = get_state() if get_state is not None else None
debugger_on = is_on() if is_on is not None else False

def _as_int(value, default=None):
    try:
        return int(value)
    except Exception:
        return default

result = {
    "debugger_on": bool(debugger_on),
    "process_state": _as_int(state),
    "DSTATE_NOTASK": _as_int(getattr(ida_dbg, "DSTATE_NOTASK", None), 0),
    "DSTATE_RUN": _as_int(getattr(ida_dbg, "DSTATE_RUN", None), 1),
    "DSTATE_SUSP": _as_int(getattr(ida_dbg, "DSTATE_SUSP", None), -1),
}
result
""",
        )
        result = _normalize_py_eval_result(payload.get("result"))
        return result if isinstance(result, dict) else {"result": result}

    def wait_for_suspend(self, timeout_ms: int = 5000) -> dict[str, Any]:
        """Wait until the debugger reports a suspend event without forcing one."""
        payload = self.py_eval(
            f"""
import ida_dbg

timeout_ms = {timeout_ms}
wait_fn = getattr(ida_dbg, "wait_for_next_event", None)
if wait_fn is None:
    raise RuntimeError("IDA wait_for_next_event API not available")

wfne_susp = getattr(ida_dbg, "WFNE_SUSP", 0)
event = None
event_value = None
try:
    event = wait_fn(wfne_susp, timeout_ms)
except TypeError:
    event = wait_fn(wfne_susp, int(timeout_ms))

if event is not None:
    try:
        event_value = int(event)
    except Exception:
        event_value = str(event)

result = {{
    "event": event_value,
}}
result
""",
            timeout=max(self._timeout, timeout_ms / 1000.0 + 5.0),
        )
        result = _normalize_py_eval_result(payload.get("result"))
        return result if isinstance(result, dict) else {"result": result}

    # ==================================================================
    # Registers
    # ==================================================================

    def get_regs(self) -> dict[str, Any]:
        """All registers, current thread."""
        return self.tool("dbg_regs")

    def get_gpregs(self) -> dict[str, Any]:
        """General-purpose registers, current thread."""
        return self.tool("dbg_gpregs")

    def get_reg(self, name: str) -> int:
        """Read a single named register."""
        result = self.tool("dbg_regs_named", {"register_names": name})
        if isinstance(result, list) and result:
            row = result[0]
            return _coerce_int(row.get("value", row.get("result", 0)))
        if isinstance(result, dict):
            return _coerce_int(result.get(name, 0))
        return 0

    def get_stack_pointer(self) -> int:
        """Read ESP/RSP depending on the active debugger target."""
        regs = self.get_gpregs()
        if isinstance(regs, dict):
            for name in ("esp", "ESP", "rsp", "RSP", "sp", "SP"):
                if name in regs:
                    return _coerce_int(regs[name])
            nested = regs.get("registers")
            if isinstance(nested, list):
                regs = nested
        if isinstance(regs, list):
            for row in regs:
                if not isinstance(row, dict):
                    continue
                name = str(row.get("name", "")).lower()
                if name in ("esp", "rsp", "sp"):
                    return _coerce_int(row.get("value", row.get("result", 0)))
        return 0

    # ==================================================================
    # Stack
    # ==================================================================

    def stacktrace(self) -> list[dict[str, Any]]:
        """Call stack with module/symbol info."""
        result = self.tool("dbg_stacktrace")
        return result if isinstance(result, list) else []

    def get_last_debug_event(self) -> dict[str, Any]:
        """Return a normalized view of IDA's latest debugger event."""
        payload = self.py_eval(
            """
import ida_dbg

def _resolve_attr(obj, name):
    value = getattr(obj, name, None)
    if callable(value):
        try:
            value = value()
        except TypeError:
            pass
    return value

evt = ida_dbg.get_debug_event()
out = {}
if evt is not None:
    for attr in ("eid", "pid", "tid", "ea", "handled"):
        value = _resolve_attr(evt, attr)
        if value is not None:
            try:
                out[attr] = int(value)
            except Exception:
                out[attr] = value
    bpt = getattr(evt, "bpt", None)
    if bpt is not None:
        bpt_out = {}
        for attr in ("ea", "kea", "hea"):
            value = _resolve_attr(bpt, attr)
            if value is not None:
                try:
                    bpt_out[attr] = int(value)
                except Exception:
                    bpt_out[attr] = value
        out["bpt"] = bpt_out
result = out
result
""",
        )
        result = _normalize_py_eval_result(payload.get("result"))
        return result if isinstance(result, dict) else {"result": result}

    # ==================================================================
    # IDB analysis helpers (non-debugger)
    # ==================================================================

    def decompile(self, addr: int) -> str:
        """Decompile function at *addr*, return pseudocode string."""
        result = self.tool("decompile", {"addr": hex(addr)})
        if isinstance(result, dict):
            return result.get("code", "")
        return str(result)

    def lookup_func(self, query: str) -> dict[str, Any] | None:
        """Look up a single function by name or address."""
        rows = self.tool("lookup_funcs", {"queries": query})
        if isinstance(rows, list) and rows:
            return rows[0].get("fn")
        return None

    def resolve_global_addr(self, name: str) -> int:
        """Resolve a named global to an address and cache the result."""
        if name in self._global_addrs:
            return self._global_addrs[name]
        payload = self.py_eval(
            f"""
import idc
import idaapi

name = {json.dumps(name)}
ea = idc.get_name_ea_simple(name)
result = None if ea == idaapi.BADADDR else int(ea)
result
""",
        )
        addr = _normalize_py_eval_result(payload.get("result"))
        if addr is None:
            raise McpToolError(f"Could not resolve global address for {name!r}")
        resolved = _coerce_int(addr)
        if resolved == 0:
            raise McpToolError(
                f"Resolved global address for {name!r} was 0x0; "
                "the symbol is likely unresolved or not named in the current IDB"
            )
        self._global_addrs[name] = resolved
        return resolved


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------

class McpTransportError(RuntimeError):
    """Network-level error communicating with the MCP server."""

class McpToolError(RuntimeError):
    """The MCP server returned an error for a tool call."""


def _normalize_py_eval_result(value: Any) -> Any:
    """Best-effort normalization for py_eval results returned as strings."""
    if not isinstance(value, str):
        return value
    stripped = value.strip()
    if not stripped:
        return value
    try:
        return ast.literal_eval(stripped)
    except Exception:
        return value


def _coerce_int(value: Any) -> int:
    """Best-effort conversion of a debugger value to int."""
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, int):
        return value
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return 0
        try:
            return int(text, 16) if text.lower().startswith("0x") else int(text)
        except ValueError:
            return 0
    return 0
