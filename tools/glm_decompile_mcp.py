"""GLM decompile MCP server — LiteLLM/GLM gateway as a decompilation tool.

Defaults baked in from session benchmarks:
- Gateway: https://desktop-s232dqi.tail040ac4.ts.net/litellm (POST /v1/chat/completions, OpenAI format, no auth)
- Models: glm53-flash (default), glm53
- Small inputs (<200 non-empty asm lines): reasoning_effort HIGH, max_tokens 8000 (~38s, best quality)
- Big inputs (>=200 lines): reasoning_effort LOW, max_tokens 32000 (HIGH burns 32k
  reasoning tokens and emits nothing on 653-line inputs)

Stdio MCP server (``mcp`` package). HTTP via stdlib urllib only, no extra deps.
Env:
  LITELLM_BASE_URL — default https://desktop-s232dqi.tail040ac4.ts.net/litellm
  GLM_MODEL        — default glm53-flash
"""

from __future__ import annotations

import json
import os
import re
import ssl
import sys
import time
import urllib.error
import urllib.request

from mcp.server.fastmcp import FastMCP

DEFAULT_BASE_URL = "https://desktop-s232dqi.tail040ac4.ts.net/litellm"
DEFAULT_MODEL = "glm53-flash"
REQUEST_TIMEOUT = 3600  # seconds

SYSTEM_PROMPT = (
    "You are a research-engineering decompilation specialist for x86 32-bit MSVC code "
    "(Final Fantasy VIII PC, 1999). Reconstruct clean, compilable C from disassembly. "
    "Preserve unsigned vs signed comparison semantics (ja/jb/jnb/jbe = unsigned). "
    "Name unknowns func-locally; do not invent library calls. "
    "Be concise in reasoning; prioritize emitting the final C code."
)

SMALL_LINE_THRESHOLD = 200
MAX_TOKENS_SMALL = 8000
MAX_TOKENS_BIG = 32000


def _base_url() -> str:
    return os.environ.get("LITELLM_BASE_URL", DEFAULT_BASE_URL).rstrip("/")


def _default_model() -> str:
    return os.environ.get("GLM_MODEL", DEFAULT_MODEL)


def _ssl_context() -> ssl.SSLContext:
    # Tailnet gateway may use a non-public CA; stdlib-only, so skip verification.
    return ssl._create_unverified_context()


def count_nonempty_lines(asm: str) -> int:
    return sum(1 for line in asm.splitlines() if line.strip())


def resolve_effort(reasoning_effort: str, asm: str) -> str:
    effort = (reasoning_effort or "auto").strip().lower()
    if effort in ("high", "low"):
        return effort
    # auto: high if <200 non-empty asm lines else low
    return "high" if count_nonempty_lines(asm) < SMALL_LINE_THRESHOLD else "low"


def resolve_max_tokens(max_tokens: int, asm: str) -> int:
    if max_tokens and max_tokens > 0:
        return int(max_tokens)
    return MAX_TOKENS_SMALL if count_nonempty_lines(asm) < SMALL_LINE_THRESHOLD else MAX_TOKENS_BIG


def build_user_prompt(asm: str, context_hints: str = "") -> str:
    hints = (context_hints or "").strip()
    hints_block = hints if hints else "(none)"
    return (
        "Decompile this x86-32 function to clean C.\n\n"
        f"{hints_block}\n\n"
        "Rules:\n"
        "- Output ONLY a single ```c fenced block with the decompiled function (no prose outside).\n"
        "- Preserve unsigned comparisons; express compiler idioms (neg/sbb/not masks, "
        "setcc tails, lea/shl strides) plainly with short comments.\n\n"
        "Disassembly (Intel syntax, IDA labels):\n"
        "```asm\n"
        f"{asm}\n"
        "```"
    )


_C_FENCE_RE = re.compile(r"```c\s*\n(.*?)```", re.DOTALL | re.IGNORECASE)


def extract_c_fence(content: str) -> tuple[str, bool]:
    """Extract first ```c fenced block. Returns (c_code, fence_found)."""
    if not content:
        return "", False
    match = _C_FENCE_RE.search(content)
    if not match:
        return "", False
    return match.group(1).strip(), True


def _http_get_json(url: str, timeout: int = 60) -> tuple[int, dict | list]:
    req = urllib.request.Request(url, method="GET", headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout, context=_ssl_context()) as resp:
        status = getattr(resp, "status", 200)
        raw = resp.read().decode("utf-8", errors="replace")
    return status, json.loads(raw) if raw.strip() else {}


def _http_post_json(url: str, payload: dict, timeout: int = REQUEST_TIMEOUT) -> tuple[int, dict]:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={"Content-Type": "application/json", "Accept": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=timeout, context=_ssl_context()) as resp:
        status = getattr(resp, "status", 200)
        raw = resp.read().decode("utf-8", errors="replace")
    return status, json.loads(raw) if raw.strip() else {}


def _reasoning_tokens(usage: dict) -> int:
    if not isinstance(usage, dict):
        return 0
    details = usage.get("completion_tokens_details") or {}
    if isinstance(details, dict) and "reasoning_tokens" in details:
        try:
            return int(details["reasoning_tokens"] or 0)
        except (TypeError, ValueError):
            pass
    try:
        return int(usage.get("reasoning_tokens") or 0)
    except (TypeError, ValueError):
        return 0


# ---------------------------------------------------------------------------
# Core logic (importable / testable without MCP transport)
# ---------------------------------------------------------------------------


def do_health() -> dict:
    """GET {base}/v1/models -> {ok, models[], latency_ms}."""
    url = f"{_base_url()}/v1/models"
    start = time.perf_counter()
    try:
        status, payload = _http_get_json(url, timeout=60)
    except urllib.error.HTTPError as exc:
        latency_ms = int((time.perf_counter() - start) * 1000)
        try:
            body = exc.read().decode("utf-8", errors="replace")[:2000]
        except Exception:
            body = ""
        return {"ok": False, "models": [], "latency_ms": latency_ms,
                "error": f"HTTP {exc.code}", "status": exc.code, "body_head": body}
    except Exception as exc:  # timeout, DNS, TLS, JSON...
        latency_ms = int((time.perf_counter() - start) * 1000)
        return {"ok": False, "models": [], "latency_ms": latency_ms,
                "error": f"{type(exc).__name__}: {exc}", "status": 0}
    latency_ms = int((time.perf_counter() - start) * 1000)
    models: list[str] = []
    if isinstance(payload, dict):
        data = payload.get("data") or []
        if isinstance(data, list):
            for entry in data:
                if isinstance(entry, dict) and entry.get("id"):
                    models.append(str(entry["id"]))
                elif isinstance(entry, str):
                    models.append(entry)
    return {"ok": status == 200, "models": models, "latency_ms": latency_ms}


def do_decompile(
    asm: str,
    model: str = "",
    reasoning_effort: str = "auto",
    max_tokens: int = 0,
    temperature: float = 0.0,
    context_hints: str = "",
) -> dict:
    """POST {base}/v1/chat/completions with pinned prompts and benchmark defaults."""
    model_used = (model or "").strip() or _default_model()
    effort_used = resolve_effort(reasoning_effort, asm)
    tokens_used = resolve_max_tokens(max_tokens, asm)
    payload = {
        "model": model_used,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": build_user_prompt(asm, context_hints)},
        ],
        "temperature": float(temperature),
        "max_tokens": tokens_used,
        "reasoning_effort": effort_used,
    }
    url = f"{_base_url()}/v1/chat/completions"
    start = time.perf_counter()
    try:
        _, data = _http_post_json(url, payload, timeout=REQUEST_TIMEOUT)
    except urllib.error.HTTPError as exc:
        try:
            body = exc.read().decode("utf-8", errors="replace")[:2000]
        except Exception:
            body = ""
        return {"error": f"HTTP {exc.code}: {exc.reason}", "status": exc.code,
                "body_head": body, "model_used": model_used, "effort_used": effort_used}
    except Exception as exc:
        return {"error": f"{type(exc).__name__}: {exc}", "status": 0,
                "body_head": "", "model_used": model_used, "effort_used": effort_used}
    elapsed = time.perf_counter() - start

    choices = data.get("choices") or []
    first = choices[0] if choices else {}
    message = first.get("message") or {} if isinstance(first, dict) else {}
    content = message.get("content") or "" if isinstance(message, dict) else ""
    finish_reason = first.get("finish_reason", "") if isinstance(first, dict) else ""
    usage = data.get("usage") or {}
    c_code, fence_found = extract_c_fence(content)
    return {
        "c_code": c_code,
        "fence_found": fence_found,
        "raw_content": content,
        "finish_reason": finish_reason,
        "reasoning_tokens": _reasoning_tokens(usage) if isinstance(usage, dict) else 0,
        "usage": usage,
        "model_used": model_used,
        "effort_used": effort_used,
        "elapsed_seconds": round(elapsed, 2),
    }


# ---------------------------------------------------------------------------
# MCP server
# ---------------------------------------------------------------------------

mcp = FastMCP("glm-decompile")


@mcp.tool()
def glm_health() -> dict:
    """Check LiteLLM/GLM gateway health via GET /v1/models."""
    return do_health()


@mcp.tool()
def glm_decompile_asm(
    asm: str,
    model: str = "",
    reasoning_effort: str = "auto",
    max_tokens: int = 0,
    temperature: float = 0.0,
    context_hints: str = "",
) -> dict:
    """Decompile x86-32 disassembly to C via the LiteLLM/GLM gateway.

    Args:
        asm: Disassembly text (Intel syntax, IDA labels).
        model: Model id; "" = $GLM_MODEL (default glm53-flash).
        reasoning_effort: high|low|auto (auto: high if <200 non-empty asm lines else low).
        max_tokens: 0 = auto (8000 small / 32000 big).
        temperature: Sampling temperature (default 0.0).
        context_hints: Optional free text (prototype, callees, globals).
    """
    return do_decompile(asm, model, reasoning_effort, max_tokens, temperature, context_hints)


SELFTEST_ASM = "\n".join([
    "mov eax, [esp+8]",
    "cmp eax, 5",
    "ja short def_48A689",
    "jmp ds:jpt_48A689[eax*4]",
    "mov eax, [esp+4]",
    "mov ecx, [esp+0Ch]",
    "cmp eax, ecx",
    "jnz short def_48A689",
    "mov eax, 1",
    "retn",
    "mov ecx, [esp+4]",
    "mov eax, [esp+0Ch]",
    "cmp ecx, eax",
    "jnb short def_48A689",
    "mov eax, 1",
    "retn",
    "mov edx, [esp+4]",
    "mov eax, [esp+0Ch]",
    "cmp edx, eax",
    "jbe short def_48A689",
    "mov eax, 1",
    "retn",
    "mov eax, [esp+4]",
    "mov ecx, [esp+0Ch]",
    "cmp eax, ecx",
    "jz short def_48A689",
    "mov eax, 1",
    "retn",
    "mov ecx, [esp+4]",
    "mov eax, [esp+0Ch]",
    "cmp ecx, eax",
    "ja short def_48A689",
    "mov eax, 1",
    "retn",
    "mov edx, [esp+4]",
    "mov eax, [esp+0Ch]",
    "cmp edx, eax",
    "jb short def_48A689",
    "mov eax, 1",
    "retn",
    "xor eax, eax",
    "retn",
])


def run_selftest() -> int:
    print(f"[selftest] lines={count_nonempty_lines(SELFTEST_ASM)}", flush=True)
    print("[selftest] decompile (effort=high, max_tokens=800)...", flush=True)
    res = do_decompile(SELFTEST_ASM, reasoning_effort="high", max_tokens=800)
    if "error" in res:
        print(f"[selftest] DECOMPILE ERROR: {res.get('error')} status={res.get('status')}", flush=True)
        print(f"[selftest] body_head={res.get('body_head', '')[:500]}", flush=True)
        return 1
    print(f"[selftest] finish_reason={res.get('finish_reason')} "
          f"fence_found={res.get('fence_found')} "
          f"reasoning_tokens={res.get('reasoning_tokens')} "
          f"model={res.get('model_used')} effort={res.get('effort_used')} "
          f"elapsed={res.get('elapsed_seconds')}s", flush=True)
    print("[selftest] c_code head (15 lines):", flush=True)
    for line in (res.get("c_code") or "").splitlines()[:15]:
        print(f"    {line}", flush=True)
    print("[selftest] health...", flush=True)
    health = do_health()
    print(f"[selftest] health ok={health.get('ok')} models={health.get('models')} "
          f"latency_ms={health.get('latency_ms')}", flush=True)
    ok = res.get("finish_reason") == "stop" and res.get("fence_found") is True
    print(f"[selftest] {'PASS' if ok else 'FAIL'}", flush=True)
    return 0 if ok else 2


if __name__ == "__main__":
    if "--selftest" in sys.argv or "selftest" in sys.argv:
        raise SystemExit(run_selftest())
    mcp.run()
