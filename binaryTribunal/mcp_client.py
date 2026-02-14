"""
MCP transport layer for IDA Pro debugger integration.

Dual-endpoint McpClient: standard ``/mcp`` for IDB analysis tools,
``/mcp?ext=dbg`` for live-debugger tools (memory, breakpoints, execution).
"""

from __future__ import annotations

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
        result = self.tool("dbg_regs_named", {"names": [name]})
        if isinstance(result, list) and result:
            row = result[0]
            return row.get("value", row.get("result", 0))
        if isinstance(result, dict):
            return result.get(name, 0)
        return 0

    # ==================================================================
    # Stack
    # ==================================================================

    def stacktrace(self) -> list[dict[str, Any]]:
        """Call stack with module/symbol info."""
        result = self.tool("dbg_stacktrace")
        return result if isinstance(result, list) else []

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


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------

class McpTransportError(RuntimeError):
    """Network-level error communicating with the MCP server."""

class McpToolError(RuntimeError):
    """The MCP server returned an error for a tool call."""
