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

## Comparison with other MCP servers

There are a few IDA Pro MCP servers floating around, but I created my own for a few reasons:

1. Installation should be fully automated.
2. The architecture of other plugins make it difficult to add new functionality quickly (too much boilerplate of unnecessary dependencies).
3. Learning new technologies is fun!

If you want to check them out, here is a list (in the order I discovered them):

- https://github.com/taida957789/ida-mcp-server-plugin (SSE protocol only, requires installing dependencies in IDAPython).
- https://github.com/fdrechsler/mcp-server-idapro (MCP Server in TypeScript, excessive boilerplate required to add new functionality).
- https://github.com/MxIris-Reverse-Engineering/ida-mcp-server (custom socket protocol, boilerplate).

Feel free to open a PR to add your IDA Pro MCP server here.

## Development

Adding new features is a super easy and streamlined process. All you have to do is add a new `@tool` function to the modular API files in `src/ida_pro_mcp/ida_mcp/api_*.py` and your function will be available in the MCP server without any additional boilerplate! Below is a video where I add the `get_metadata` function in less than 2 minutes (including testing):

https://github.com/user-attachments/assets/951de823-88ea-4235-adcb-9257e316ae64

To test the MCP server itself:

```sh
npx -y @modelcontextprotocol/inspector
```

This will open a web interface at http://localhost:5173 and allow you to interact with the MCP tools for testing.

For testing I create a symbolic link to the IDA plugin and then POST a JSON-RPC request directly to `http://localhost:13337/mcp`. After [enabling symbolic links](https://learn.microsoft.com/en-us/windows/apps/get-started/enable-your-device-for-development) you can run the following command:

```sh
uv run ida-pro-mcp --install
```

Generate the changelog of direct commits to `main`:

```sh
git log --first-parent --no-merges 1.2.0..main "--pretty=- %s"
```
