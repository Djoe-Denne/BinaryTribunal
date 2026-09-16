import io, os, re, yaml, tomllib

SRC = r"C:\Users\djden\source\repos\retro-eng\re-ff8\.cursor\agents"
DST = r"C:\Users\djden\source\repos\retro-eng\re-ff8\.codex\agents"
os.makedirs(DST, exist_ok=True)

REPL = [
    ("`.cursor/skills/`, `.agents/skills/`", "`.agents/skills/`"),
    (".cursor/skills/", ".agents/skills/"),
    ("Ne lis pas `.cursor/agents/*.md`. Cursor expose", "Ne lis pas `.codex/agents/*.toml`. Codex expose"),
    (".cursor/mcp.json", ".codex/config.toml"),
]

def esc(s):
    return s.replace("\\", "\\\\").replace('"""', '\\"""')

def esc_desc(s):
    return s.replace("\\", "\\\\").replace('"', '\\"')

for fn in sorted(os.listdir(SRC)):
    if not fn.endswith(".md"):
        continue
    raw = io.open(os.path.join(SRC, fn), encoding="utf-8").read()
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n?(.*)$", raw, re.S)
    fm = yaml.safe_load(m.group(1))
    body = m.group(2).lstrip("\n")
    name = str(fm["name"]).strip()
    desc = " ".join(str(fm["description"]).split())
    model_raw = str(fm.get("model", ""))
    model = "glm-5.3-flash" if "flash" in model_raw else "glm-5.3"
    for a, b in REPL:
        desc = desc.replace(a, b)
        body = body.replace(a, b)
    toml = (
        'name = "%s"\n'
        'description = "%s"\n'
        'model = "%s"\n'
        'model_reasoning_effort = "max"\n'
        'developer_instructions = """\n%s\n"""\n'
    ) % (name, esc_desc(desc), model, esc(body.rstrip("\n")))
    out = os.path.join(DST, name + ".toml")
    io.open(out, "w", encoding="utf-8", newline="\n").write(toml)
    d = tomllib.load(io.open(out, "rb"))
    print("%s.toml | model=%s effort=%s | desc=%d chars | instr=%d chars" % (
        name, d["model"], d["model_reasoning_effort"], len(d["description"]), len(d["developer_instructions"])))
