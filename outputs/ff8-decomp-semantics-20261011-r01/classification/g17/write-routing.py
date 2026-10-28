import json, hashlib
from pathlib import Path

root = Path(__file__).resolve().parents[4]
own = Path(__file__).resolve().parent
mission = root / 'docs/missions/ff8-decomp-semantics-2026-10-11-run01'
inputs = root / 'inputs/ff8-decomp-semantics-20261011-r01/g17'
def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()
def rel(p):
    return p.relative_to(root).as_posix()
eas = next(g['eas'] for g in json.loads((mission/'native-groups.json').read_text())['groups'] if g['id']=='g17')
verify = json.loads((mission/'native-pe-verification.json').read_text())
harvest = next(g for g in json.loads((mission/'discovery-harvest.json').read_text()) if g['group']=='g17')
routing = {
    'group': 'g17', 'task_id': 'task_mv435ed6_002y_irtdux',
    'status': 'CHECKPOINT_REQUIRED', 'routing_preparation': 'DISPATCH_READY',
    'SOURCE': 'discover-g17', 'source_session_id': harvest['session_id'],
    'inheritance': 'All authors independently inherit the same factual explorer checkpoint; never classifier, lead or sibling output. R starts only after A+B.',
    'checkpoint_reason': 'Source report admits historical target decomp header previews (A!=B / Push IDB=oui). No C bodies reported read. Parent must select/verify a factual checkpoint before those previews; do not fork final explorer context silently.',
    'source_report': {'path': rel(mission/'discovery-harvest/g17.source.native.json'), 'sha256': sha(mission/'discovery-harvest/g17.source.native.json'), 'report_message': harvest['report_message']},
    'common_factual_input': {'path': rel(inputs/'common-compaction.md'), 'sha256': sha(inputs/'common-compaction.md')},
    'native_pe_verification': {'path': rel(mission/'native-pe-verification.json'), 'sha256': sha(mission/'native-pe-verification.json'), 'disk_pe_sha256': verify['disk_pe_sha256']},
    'catalogue': {'path': 'docs/missions/ff8-decomp-semantics-2026-10-11-run01/catalogue.snapshot.json', 'sha256': sha(mission/'catalogue.snapshot.json')},
    'model_ref_gate': 'Lead verifies effective providerID/id/variant on creation. Routes are proposed only; no producers started.',
    'entries': []
}
flags = {
    '0x502380': ['243 native instructions (>200)', 'raw switch table outside exported chunks', 'partial-register DWORD provenance / shift count masking', 'unresolved helper ABI'],
    '0x505C00': ['full DWORD argument vs BH/BL operations', 'ring integrity and helper ABI/return contract unresolved'],
    '0x509C80': ['SUB/NEG/SBB DL carry and partial-register arithmetic', 'both helper native packets missing; return ABI unresolved'],
    '0x50B2A0': ['400 native instructions (>200)', 'raw switch table outside exported chunks', 'unresolved indirect callback target and reload/aliasing ordering'],
    '0x506690': ['helper ABI/side effects unresolved', 'partial-width data flow and aliasing/order constraints'],
    '0x50B830': ['raw switch table outside exported chunks', 'unresolved indirect callback target', 'partial-register full DWORD provenance and reload ordering']
}
models = {
    'c_A': ('openai/gpt-6-astra', 'high'),
    'c_B': ('opencode/claude-opus-5-5', 'high'),
    'c_R': ('openai/gpt-6.1-sol', 'high'),
    'semantic_A': ('openai/gpt-6.1-sol', 'high'),
    'semantic_B': ('openai/gpt-6.1-sol', 'high'),
    'semantic_R': ('openai/gpt-6.1-sol', 'high')
}
for ea in eas:
    req = own/(ea+'.request.json')
    resp = own/(ea+'.response.json')
    assert req.read_bytes() == (mission/'classifier-payloads'/(ea+'.request.json')).read_bytes()
    v = next(v for v in verify['results'] if v['ea']==ea)
    assert v['idb_equals_pe_and_freeze']
    p = json.loads(req.read_text(encoding='utf-8'))
    r = json.loads(resp.read_text(encoding='utf-8'))
    assert len(p['assembly']) <= 100000 and r.get('evidence', {}).get('usage')
    fact = inputs/(ea+'.json')
    n = json.loads(fact.read_text(encoding='utf-8'))['instruction_count']
    dispatches = []
    for role, (model, variant) in models.items():
        volet, letter = role.split('_')
        dispatches.append({'role': role, 'model': model, 'variant': variant, 'SOURCE': 'discover-g17', 'source_session_id': harvest['session_id'], 'context_mode': 'checkpoint', 'status': 'CHECKPOINT_REQUIRED' if letter!='R' else 'WAIT_A_B_AND_CHECKPOINT', 'depends_on': [volet+'_A', volet+'_B'] if letter=='R' else [], 'output_path': f'outputs/ff8-decomp-semantics-20261011-r01/production/g17/{ea}/{volet}/{letter}.md', 'fresh_independent_session': True})
    routing['entries'].append({'ea': ea, 'status': 'CHECKPOINT_REQUIRED', 'routing_preparation': 'DISPATCH_READY', 'classifier_kind': 'classify_x86', 'classifier_tool': 'tools.classify_x86', 'complexity': r['complexity'], 'risk': r['uncertainty'], 'risk_mapping': 'native uncertainty used as v1 operational risk, not calibrated probability', 'uncertainty_cause': r['uncertainty_cause'], 'instruction_count': n, 'assembly_characters': len(p['assembly']), 'pe_verified': True, 'tier': 'complex_high_risk', 'protocol': '2+1 per volet', 'rationale': 'v1 complex/high-risk: uncertainty >50 for every EA; existing structural flags retained, never waive native gates', 'structural_flags': flags[ea], 'factual_input': {'path': rel(fact), 'sha256': sha(fact)}, 'request': {'path': rel(req), 'sha256': sha(req), 'unchanged': True}, 'native_response': {'path': rel(resp), 'sha256': sha(resp), 'complete_native_response': True}, 'dispatches': dispatches})
(own/'routing.json').write_text(json.dumps(routing, indent=2)+'\n', encoding='utf-8')
print(json.dumps({'routing_sha256':sha(own/'routing.json'), 'status':routing['status'], 'scores':[(e['ea'], e['complexity'], e['risk']) for e in routing['entries']], 'proposed_dispatches':sum(len(e['dispatches']) for e in routing['entries']), 'pe_mismatches':[], 'oversize':[]}))
