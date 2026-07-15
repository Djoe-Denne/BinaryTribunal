# Agent Instructions for re-ff8

## Reverse Engineering Workflow

**When reverse engineering a function or any other element, always push your findings back to IDA.** This ensures the IDB stays up-to-date and serves as the single source of truth.

After analyzing code, use the appropriate tools to persist your discoveries:

| Finding | Tool to use |
|---|---|
| Function/variable purpose | `user-ida-pro-mcp-set_comments` |
| Better name for function | `user-ida-pro-mcp-rename` (key: `func`) |
| Better name for global | `user-ida-pro-mcp-rename` (key: `data`) |
| Better name for local var | `user-ida-pro-mcp-rename` (key: `local`) |
| Better name for stack var | `user-ida-pro-mcp-rename` (key: `stack`) |
| Type information | `user-ida-pro-mcp-set_type` |
| New struct/enum definition | `user-ida-pro-mcp-declare_type` |
| Stack variable declaration | `user-ida-pro-mcp-declare_stack` |

**Example workflow:**
1. Decompile the function with `decompile`
2. Analyze the code and understand its purpose
3. Rename the function with a descriptive name via `rename`
4. Add a comment explaining what it does via `set_comments`
5. Rename local/stack variables to meaningful names via `rename`
6. Set proper types for parameters and variables via `set_type`

---

## IDA Pro MCP Tools

This project has an IDA Pro MCP server configured (`ida-pro-mcp` in `~/.cursor/mcp.json`).
All IDA tools are available as **`user-ida-pro-mcp-*`** prefixed tool calls. Use them directly.

**Do NOT fall back to curl, HTTP requests, or Shell commands to reach IDA.** The tools work natively.

Common examples:

| Task | Tool call |
|---|---|
| Look up a function | `user-ida-pro-mcp-lookup_funcs` |
| Decompile | `user-ida-pro-mcp-decompile` |
| Call graph | `user-ida-pro-mcp-callgraph` |
| Cross-references | `user-ida-pro-mcp-xrefs_to` |
| Callees of a function | `user-ida-pro-mcp-callees` |
| Rename functions/globals | `user-ida-pro-mcp-rename` |
| List functions | `user-ida-pro-mcp-list_funcs` |
| Execute Python in IDA | `user-ida-pro-mcp-py_eval` |

The full API reference for parameters and return values is below.

---

## MCP Resources

**Resources** represent browsable state (read-only data) following MCP's philosophy.

**Core IDB State:**
- `ida://idb/metadata` - IDB file info (path, arch, base, size, hashes)
- `ida://idb/segments` - Memory segments with permissions
- `ida://idb/entrypoints` - Entry points (main, TLS callbacks, etc.)

**UI State:**
- `ida://cursor` - Current cursor position and function
- `ida://selection` - Current selection range

**Type Information:**
- `ida://types` - All local types
- `ida://structs` - All structures/unions
- `ida://struct/{name}` - Structure definition with fields

**Lookups:**
- `ida://import/{name}` - Import details by name
- `ida://export/{name}` - Export details by name
- `ida://xrefs/from/{addr}` - Cross-references from address

## Core Functions

- `lookup_funcs(queries)`: Get function(s) by address or name (auto-detects, accepts list or comma-separated string).
- `int_convert(inputs)`: Convert numbers to different formats (decimal, hex, bytes, ASCII, binary).
- `list_funcs(queries)`: List functions (paginated, filtered).
- `list_globals(queries)`: List global variables (paginated, filtered).
- `imports(offset, count)`: List all imported symbols with module names (paginated).
- `decompile(addr)`: Decompile function at the given address.
- `disasm(addr)`: Disassemble function with full details (arguments, stack frame, etc).
- `xrefs_to(addrs)`: Get all cross-references to address(es).
- `xrefs_to_field(queries)`: Get cross-references to specific struct field(s).
- `callees(addrs)`: Get functions called by function(s) at address(es).

## Modification Operations

- `set_comments(items)`: Set comments at address(es) in both disassembly and decompiler views.
- `patch_asm(items)`: Patch assembly instructions at address(es).
- `declare_type(decls)`: Declare C type(s) in the local type library.

## Memory Reading Operations

- `get_bytes(addrs)`: Read raw bytes at address(es).
- `get_int(queries)`: Read integer values using ty (i8/u64/i16le/i16be/etc).
- `get_string(addrs)`: Read null-terminated string(s).
- `get_global_value(queries)`: Read global variable value(s) by address or name (auto-detects, compile-time values).

## Stack Frame Operations

- `stack_frame(addrs)`: Get stack frame variables for function(s).
- `declare_stack(items)`: Create stack variable(s) at specified offset(s).
- `delete_stack(items)`: Delete stack variable(s) by name.

## Structure Operations

- `read_struct(queries)`: Read structure field values at specific address(es).
- `search_structs(filter)`: Search structures by name pattern.

## Debugger Operations (Extension)

Debugger tools are hidden by default. Enable with `?ext=dbg` query parameter:

```
http://127.0.0.1:13337/mcp?ext=dbg
```

**Control:**
- `dbg_start()`: Start debugger process.
- `dbg_exit()`: Exit debugger process.
- `dbg_continue()`: Continue execution.
- `dbg_run_to(addr)`: Run to address.
- `dbg_step_into()`: Step into instruction.
- `dbg_step_over()`: Step over instruction.

**Breakpoints:**
- `dbg_bps()`: List all breakpoints.
- `dbg_add_bp(addrs)`: Add breakpoint(s).
- `dbg_delete_bp(addrs)`: Delete breakpoint(s).
- `dbg_toggle_bp(items)`: Enable/disable breakpoint(s).

**Registers:**
- `dbg_regs()`: All registers, current thread.
- `dbg_regs_all()`: All registers, all threads.
- `dbg_regs_remote(tids)`: All registers, specific thread(s).
- `dbg_gpregs()`: GP registers, current thread.
- `dbg_gpregs_remote(tids)`: GP registers, specific thread(s).
- `dbg_regs_named(names)`: Named registers, current thread.
- `dbg_regs_named_remote(tid, names)`: Named registers, specific thread.

**Stack & Memory:**
- `dbg_stacktrace()`: Call stack with module/symbol info.
- `dbg_read(regions)`: Read memory from debugged process.
- `dbg_write(regions)`: Write memory to debugged process.

## Advanced Analysis Operations

- `py_eval(code)`: Execute arbitrary Python code in IDA context (returns dict with result/stdout/stderr, supports Jupyter-style evaluation).
- `analyze_funcs(addrs)`: Comprehensive function analysis (decompilation, assembly, xrefs, callees, callers, strings, constants, basic blocks).

## Pattern Matching & Search

- `find_regex(queries)`: Search strings with case-insensitive regex (paginated).
- `find_bytes(patterns, limit=1000, offset=0)`: Find byte pattern(s) in binary (e.g., "48 8B ?? ??"). Max limit: 10000.
- `find_insns(sequences, limit=1000, offset=0)`: Find instruction sequence(s) in code. Max limit: 10000.
- `find(type, targets, limit=1000, offset=0)`: Advanced search (immediate values, strings, data/code references). Max limit: 10000.

## Control Flow Analysis

- `basic_blocks(addrs)`: Get basic blocks with successors and predecessors.

## Type Operations

- `set_type(edits)`: Apply type(s) to functions, globals, locals, or stack variables.
- `infer_types(addrs)`: Infer types at address(es) using Hex-Rays or heuristics.

## Export Operations

- `export_funcs(addrs, format)`: Export function(s) in specified format (json, c_header, or prototypes).

## Graph Operations

- `callgraph(roots, max_depth)`: Build call graph from root function(s) with configurable depth.

## Batch Operations

- `rename(batch)`: Unified batch rename operation for functions, globals, locals, and stack variables (accepts dict with optional `func`, `data`, `local`, `stack` keys).
- `patch(patches)`: Patch multiple byte sequences at once.
- `put_int(items)`: Write integer values using ty (i8/u64/i16le/i16be/etc).

**Key Features:**

- **Type-safe API**: All functions use strongly-typed parameters with TypedDict schemas for better IDE support and LLM structured outputs
- **Batch-first design**: Most operations accept both single items and lists
- **Consistent error handling**: All batch operations return `[{..., error: null|string}, ...]`
- **Cursor-based pagination**: Search functions return `cursor: {next: offset}` or `{done: true}` (default limit: 1000, enforced max: 10000 to prevent token overflow)
- **Performance**: Strings are cached with MD5-based invalidation to avoid repeated `build_strlist` calls in large projects
