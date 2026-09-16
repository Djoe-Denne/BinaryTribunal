#!/usr/bin/env python3
"""Phase 0 — ledger de certitude sémantique (travail parent, pas de Grok)."""
import json, re
from pathlib import Path
from collections import Counter

root = Path(r'c:\Users\djden\source\repos\retro-eng\re-ff8')
budget_path = root/'docs/tech/investigation/battle-static-discovery/glm-mcp-function-budget.md'
decomp_dir = root/'docs/tech/investigation/battle-static-discovery/decomp'
gap_path = root/'tools/_tmp_wiki_func_gap.json'
classified_path = root/'tools/_tmp_wiki_func_gap_classified.json'

# --- budget ---
rows = []
for line in budget_path.read_text(encoding='utf-8', errors='replace').splitlines():
    if not line.startswith('| `0x'):
        continue
    parts = [p.strip() for p in line.strip('|').split('|')]
    if len(parts) < 5:
        continue
    ea = parts[0].strip('`')
    name = parts[1].strip('`')
    try:
        nins = int(parts[2])
    except ValueError:
        nins = None
    rows.append({'ea': ea, 'eal': ea.lower(), 'name': name, 'nins': nins,
                 'palier': parts[3], 'vague': parts[4]})
print(f'budget={len(rows)}')

# --- decomp ---
decomp = {}
for f in decomp_dir.glob('*.md'):
    ea = f.name.split('__')[0].lower()
    try:
        t = f.read_text(encoding='utf-8', errors='replace')
    except Exception:
        continue
    m_a = re.search(r'^- A==B:\s*(.+)$', t, re.M)
    m_p = re.search(r'^- Push IDB:\s*(.+)$', t, re.M)
    m_n = re.search(r'^- Notes parent:\s*(.+)$', t, re.M)
    a_eq = (m_a.group(1).strip() if m_a else '')
    push = (m_p.group(1).strip().lower() if m_p else '')
    notes = (m_n.group(1).strip() if m_n else '')
    decomp[ea] = {'file': f.name, 'a_eq': a_eq, 'push': push, 'notes': notes,
                  'uncertain': 'uncertain' in t[:2000].lower(),
                  'conflict': any(k in notes.lower() for k in ['diverge', 'contradit', 'mensong', 'conflit', '≠'])}
print(f'decomp={len(decomp)}')

# --- wiki gap ---
gap = json.loads(gap_path.read_text(encoding='utf-8'))
names_with_ea = set(gap.get('names_with_ea_on_same_line', []))
classified = json.loads(classified_path.read_text(encoding='utf-8'))
name_only_known = set(classified.get('name_only_known', []))
print(f'wiki_ea_aligned={len(names_with_ea)} known37={len(name_only_known)}')

def strip_prefix(n):
    for p in ('domain::', 'presentation::', 'main::'):
        if n.startswith(p):
            return n[len(p):]
    return n

L3_EXACT = {'GetSingletonAddress', 'OutputDebugString_1', 'nullsub', 'fopen'}
def is_l3(name):
    if name in L3_EXACT or name.startswith('OutputDebug') or name.startswith('nullsub'):
        return True
    if name.startswith('Gfx_') or name.startswith('GfxDriver_') or name.startswith('gl'):
        return True
    if name.startswith('Thunk_') or name.startswith('thunk_'):
        return True
    if name.startswith('presentation::Render') or name.startswith('RenderDDraw') or name.startswith('RenderGL'):
        return True
    if name in ('UpdateRateRelated', 'TextureRelated2', 'TIMrelated_0'):
        return True
    return False

TRIVIAL_PATTERNS = ('InvokeSummonScript', 'ClearBusy', 'InitDeadTimer', 'EnterHudMode',
                    'DirectorReady', 'ActivateTargetRelay', 'SetOwnedFlag', 'ArmOneShot',
                    'GetEscape', 'SequenceTick', 'InitSummonContext', 'FillDwords',
                    'LcgRand', 'MakeRot', 'AssetLoadCompletion', 'BindDispatch',
                    'QueueChunk', 'SetSeqCtx', 'PlaySE', 'SubmitTIM', 'SeqPtrBind')

def in_battle_range(ea):
    v = int(ea, 16)
    return 0x470000 <= v <= 0x51BFFF

results = []
for r in rows:
    ea, eal, name, nins, palier = r['ea'], r['eal'], r['name'], r['nins'], r['palier']
    short = strip_prefix(name)
    d = decomp.get(eal)
    has_decomp = d is not None
    wiki_aligned = (name in names_with_ea) or (short in names_with_ea)
    known37 = (name in name_only_known) or (short in name_only_known)
    push_ok = bool(d and d['push'].startswith('oui'))
    a_eq_oui = bool(d and d['a_eq'].strip().lower().startswith('oui'))
    uncertain = bool(d and d['uncertain'])
    conflict = bool(d and d['conflict'])

    if palier == 'chunk':
        cls, why = 'SKIP_CHUNK', '>600 instr'
    elif is_l3(name) or is_l3(short):
        cls, why = 'SKIP_L3', 'vendor/gfx/crt/thunk'
    elif not has_decomp:
        cls, why = 'SKIP_NODECOMP', 'pas de C réconcilié'
    elif uncertain or (d and 'UNCERTAIN' in d['push'].upper()):
        cls, why = 'UNCERTAIN', 'decomp UNCERTAIN'
    elif conflict:
        cls, why = 'CONFLICT', 'divergence notée parent'
    elif known37 and push_ok and a_eq_oui:
        cls, why = 'CERTAIN', 'name_only_known + A==B + push'
    elif nins is not None and nins <= 5 and push_ok and any(p in name for p in TRIVIAL_PATTERNS):
        cls, why = 'CERTAIN', f'trivial ≤5 ({nins}) + push'
    elif nins is not None and nins <= 10 and push_ok and wiki_aligned and a_eq_oui and any(p in name for p in TRIVIAL_PATTERNS):
        cls, why = 'CERTAIN', f'trivial ≤10 ({nins}) + wiki + A==B'
    elif push_ok and wiki_aligned and a_eq_oui:
        cls, why = 'LIKELY', 'wiki + A==B + push'
    elif push_ok and wiki_aligned:
        cls, why = 'LIKELY', 'wiki + push (A≠B)'
    elif push_ok:
        cls, why = 'LIKELY', 'push seul'
    else:
        cls, why = 'UNCERTAIN', 'pas de push / vérif manquante'

    results.append({**r, 'short': short, 'has_decomp': has_decomp,
                    'wiki_aligned': wiki_aligned, 'known37': known37,
                    'push_ok': push_ok, 'a_eq_oui': a_eq_oui,
                    'cls': cls, 'why': why,
                    'battle': in_battle_range(ea)})

cnt = Counter(x['cls'] for x in results)
print('classes', dict(cnt))
file_grok = [x for x in results if x['cls'] in ('LIKELY', 'UNCERTAIN', 'CONFLICT')]
file_battle = [x for x in file_grok if x['battle']]
print(f'file_grok={len(file_grok)} dont_battle={len(file_battle)}')
print('battle_classes', dict(Counter(x['cls'] for x in results if x['battle'])))

# premier lot : 5 premières NON-certaines avec decomp, filtre bataille, ordre adresse
file_battle_sorted = sorted(file_battle, key=lambda x: int(x['ea'], 16))
print('--- LOT 1 (5) ---')
for x in file_battle_sorted[:5]:
    print((x['ea'] + ' ' + x['name'] + ' ' + str(x['nins']) + ' ' + x['cls'] + ' ' + x['why']).encode('ascii', 'replace').decode())

# --- écrire semantic-certainty.md ---
out = []
out.append('# Ledger de certitude sémantique — 498 fonctions wiki')
out.append('')
out.append('> Phase 0 parent (2026-09-15). Barème strict : seules les fonctions')
out.append('> « absolument sûres » sautent le triple Grok. Les autres vont en file Grok.')
out.append('> Sources : budget wiki, `decomp/` (A==B, push, notes parent),')
out.append('> `_tmp_wiki_func_gap.json` (noms EA-alignés), `_tmp_wiki_func_gap_classified.json`')
out.append('> (`name_only_known` = 37). Pas de Grok dans cette phase.')
out.append('')
out.append('## Totaux')
out.append('')
out.append('| Classe | Nombre | Règle |')
out.append('|---|---:|---|')
for cls in ['CERTAIN', 'LIKELY', 'UNCERTAIN', 'CONFLICT', 'SKIP_L3', 'SKIP_CHUNK', 'SKIP_NODECOMP']:
    rule = {
        'CERTAIN': 'name_only_known+A==B+push, ou wrapper trivial ≤5/≤10 wiki+A==B',
        'LIKELY': 'decomp poussé (wiki ± A==B)',
        'UNCERTAIN': 'decomp UNCERTAIN ou sans push',
        'CONFLICT': 'divergence notée parent',
        'SKIP_L3': 'vendor/gfx/crt/thunk',
        'SKIP_CHUNK': '>600 instr.',
        'SKIP_NODECOMP': 'pas de C réconcilié',
    }[cls]
    out.append(f'| {cls} | {cnt.get(cls, 0)} | {rule} |')
out.append('')
out.append(f'File Grok (LIKELY+UNCERTAIN+CONFLICT) : **{len(file_grok)}**, '
           f'dont filtre bataille `0x47xxxx`–`0x51Bxxx` : **{len(file_battle)}**.')
out.append('')
out.append('## Premier lot Grok (tête de file bataille, ordre adresse)')
out.append('')
out.append('| # | EA | Nom | Instr | Classe | Pourquoi |')
out.append('|---|---|---|---:|---|---|')
for i, x in enumerate(file_battle_sorted[:5], 1):
    out.append(f"| {i} | `{x['ea']}` | `{x['name']}` | {x['nins']} | {x['cls']} | {x['why']} |")
out.append('')
out.append('## Table complète (ordre adresse)')
out.append('')
out.append('| EA | Nom | Instr | Classe | Decomp | Wiki EA | A==B | Push | Pourquoi |')
out.append('|---|---|---:|---|---|---|---|---|---|')
for x in sorted(results, key=lambda v: int(v['ea'], 16)):
    d = decomp.get(x['eal'], {})
    a_eq = (d.get('a_eq', '')[:24] if d else '—')
    push = (d.get('push', '')[:12] if d else '—')
    out.append(f"| `{x['ea']}` | `{x['name']}` | {x['nins']} | {x['cls']} | "
               f"{'oui' if x['has_decomp'] else '—'} | {'oui' if x['wiki_aligned'] else '—'} | "
               f"{a_eq} | {push} | {x['why']} |")
out.append('')

out_path = root/'docs/tech/investigation/battle-static-discovery/semantic-certainty.md'
out_path.write_text('\n'.join(out), encoding='utf-8')
print(f'wrote {out_path} ({len(out)} lignes)')
