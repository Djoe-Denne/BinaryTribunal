---
title: Binary Tribunal IDA MCP Debugger Transport
category: references
tags: [reverse-engineering, testing, reference]
aliases: [McpClient, IDA MCP transport, debugger MCP endpoint]
sources: [binaryTribunal/mcp_client.py]
summary: Reference for Binary Tribunal's IDA MCP client, including endpoint routing, debugger memory helpers, breakpoints, registers, and IDB helpers.
provenance:
  extracted: 0.92
  inferred: 0.06
  ambiguous: 0.02
created: 2026-06-02T17:10:00+02:00
updated: 2026-06-02T17:10:00+02:00
---

# Binary Tribunal IDA MCP Debugger Transport

`McpClient` is the JSON-RPC transport layer used by Binary Tribunal to talk to an IDA Pro MCP server.

## Endpoints

The client derives two endpoints from the base URL:

- Standard analysis endpoint: `/mcp`
- Debugger extension endpoint: `/mcp?ext=dbg`

Tool names beginning with `dbg_` are routed to the debugger endpoint. Other tools use the standard endpoint.

## Transport Behavior

- Calls are sent as JSON-RPC `tools/call` requests.
- Each request receives an incrementing JSON-RPC id.
- Standard calls use the normal timeout; debugger calls use a separate debugger timeout.
- Tool errors and transport errors are raised as `McpToolError` and `McpTransportError`.

## Debugger Helpers

The client wraps common debugger operations:

- Memory reads and writes: `read_bytes`, typed integer reads, `write_bytes`, and typed integer writes.
- Breakpoints: add, delete, list, and toggle.
- Execution control: continue, run-to, step-over, and step-into.
- Registers and stack: full registers, general-purpose registers, named register reads, and stacktrace.

## IDB Analysis Helpers

The same client also exposes non-debugger helpers for decompilation and function lookup. These use the standard endpoint, not the debugger endpoint.

## Related

- [[projects/binary-tribunal/binary-tribunal]]
- [[projects/binary-tribunal/concepts/hypothesis-runner-architecture]]
- [[projects/binary-tribunal/skills/running-binary-tribunal-hypotheses]]
