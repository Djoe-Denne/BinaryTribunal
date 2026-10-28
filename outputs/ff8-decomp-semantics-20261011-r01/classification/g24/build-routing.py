import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
MISSION = ROOT / 'docs/missions/ff8-decomp-semantics-2026-10-11-run01'
OWN = Path(__file__).resolve().parent
INPUT = ROOT / 'inputs/ff8-decomp-semantics-20261011-r01/g24'

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def ref(path):
    return {'path': path.relative_to(ROOT).as_posix(), 'sha256': sha(path)}

groups = json.loads((MISSION / 'native-groups.json').read_text(encoding='utf-8'))
eas = next(g['eas'] for g in groups['groups'] if g['id'] == 'g24')
facts = {f['ea']: f for f in groups['functions'] if f['ea'] in eas}
pe = json.loads((MISSION / 'native-pe-verification.json').read_text(encoding='utf-8'))
checks = {v['ea']: v for v in pe['results']}
harvest = next(g for g in json.loads((MISSION / 'discovery-harvest.json').read_text(encoding='utf-8')) if g['group'] == 'g24')

# Preserve the actual first submission. Its base64 was decoded as Latin-1,
# not UTF-8: the accented character in common context was mojibake.
# Never represent the receipt as an unchanged-payload classification.
expected = OWN / '0x50AED0.request.json'
submitted = json.loads(expected.read_bytes().decode('latin-1'))
actual = OWN / '0x50AED0.submitted-encoding-mismatch.request.json'
actual.write_text(json.dumps(submitted, ensure_ascii=False, indent=2), encoding='utf-8')

source = {
    'SOURCE': 'discover-g24',
    'session_id': harvest['session_id'],
    'context_mode': 'fork',
    'classifier_is_fork_source': False,
    'source_report_flags_target_candidate_previews': False,
    'checkpoint_status': 'NOT_REQUIRED_BY_SOURCE_REPORT',
    'native_receipt': ref(MISSION / harvest['receipt']),
    'compaction': ref(INPUT / 'common-compaction.md'),
}
routes = []
for ea in eas:
    request = OWN / f'{ea}.request.json'
    prepared = MISSION / 'classifier-payloads' / f'{ea}.request.json'
    assert request.read_bytes() == prepared.read_bytes()
    payload = json.loads(request.read_text(encoding='utf-8'))
    response_path = OWN / f'{ea}.response.native.json'
    response = json.loads(response_path.read_text(encoding='utf-8'))
    assert response['evidence']['usage'] and response['evidence']['answers']
    assert sha(ROOT / facts[ea]['path']) == facts[ea]['sha256']
    route = {
        'ea': ea,
        'SOURCE': 'discover-g24',
        'native_instructions': facts[ea]['instructions'],
        'factual_input': ref(INPUT / f'{ea}.json'),
        'native_frozen_export': ref(ROOT / facts[ea]['path']),
        'common_compaction': source['compaction'],
        'pe_verification': checks[ea],
        'classifier_kind': 'native_classify_x86',
        'classifier_tool': 'tools.classify_x86',
        'request': ref(request),
        'response': ref(response_path),
        'assembly_characters': len(payload['assembly']),
        'complexity': response['complexity'],
        'risk': response['uncertainty'],
        'risk_mapping': 'v1 operational risk = native Classify uncertainty; non-calibrated judgement signal',
        'uncertainty_cause': response['uncertainty_cause'],
        'producer_context': source,
        'admission_owner': 'lead',
        'native_model_ref_readback_required': True,
    }
    if not checks[ea]['idb_equals_pe_and_freeze']:
        route.update(status='QUARANTINED_PE_MISMATCH', productions=[])
    elif ea == '0x50AED0':
        route.update(
            status='BLOCKED_PAYLOAD_ENCODING_MISMATCH',
            classifier_receipt_valid_for_dispatch=False,
            actual_submitted_request=ref(actual),
            rationale=['First call decoded UTF-8 bytes as Latin-1; common-compaction accented character changed. Full native response retained, but invalid for unchanged-payload admission. No corrective double call without lead authorization.'],
            productions=[],
        )
    else:
        c, u, n = response['complexity'], response['uncertainty'], facts[ea]['instructions']
        flags = []
        if n > 200:
            flags.append('native_instruction_count_gt_200')
        if ea in ['0x50A9A0', '0x50B0C0', '0x50B190']:
            flags.append('indirect_callback_target_not_fully_resolved_in_common_facts')
        level = 'complex' if c > 65 or u > 50 or flags else 'medium'
        assert not (c <= 25 and u <= 20 and n <= 80)
        route.update(
            status='DISPATCH_READY',
            classifier_receipt_valid_for_dispatch=True,
            level=level,
            structural_flags=flags,
            policy='2+1_per_volet',
            rationale=[f'v1 complexity={c}, risk={u}, native instructions={n}; {level} route.', *flags],
        )
        models_c = [('openai/gpt-6-astra', 'high'), ('opencode/claude-opus-5-5', 'high')] if level == 'complex' else [('zai-coding-plan/glm-5.3-flash', 'max'), ('opencode-go/gpt-6-luna', 'medium')]
        models_s = [('openai/gpt-6.1-sol', 'high'), ('openai/gpt-6-astra', 'high')] if level == 'complex' else [('openai/gpt-6.1-sol', 'medium'), ('openai/gpt-6.1-sol', 'medium')]
        productions = []
        for volet, authors in [('c', models_c), ('semantic', models_s)]:
            paths = {}
            for role, (model, variant) in zip(['A', 'B'], authors):
                path = f'outputs/ff8-decomp-semantics-20261011-r01/production/g24/{ea}/{volet}/{role.lower()}.md'
                paths[role] = path
                productions.append({'volet': volet, 'role': role, 'model': model, 'variant': variant, 'output_path': path, 'SOURCE': 'discover-g24', 'context_mode': 'fork', 'fresh_independent_session': True, 'admit_after': ['lead_source_and_Model.Ref_validation'], 'reads_sibling_outputs': False})
            productions.append({'volet': volet, 'role': 'R', 'model': 'openai/gpt-6.1-sol', 'variant': 'high', 'output_path': f'outputs/ff8-decomp-semantics-20261011-r01/production/g24/{ea}/{volet}/r.md', 'SOURCE': 'discover-g24', 'context_mode': 'fork', 'fresh_independent_session': True, 'admit_after': [paths['A'], paths['B']], 'requires_both_A_and_B': True, 'truth_source': 'complete frozen native ASM'})
        route['productions'] = productions
    routes.append(route)

manifest = {
    'schema': 'ff8_classification_routing_v1',
    'group': 'g24',
    'status': 'DISPATCH_READY',
    'status_scope': 'Five safe EAs ready for lead admission; one encoding-mismatch EA blocked.',
    'SOURCE': 'discover-g24',
    'source': source,
    'contract': ref(MISSION / 'CONTRACT.md'),
    'native_groups': ref(MISSION / 'native-groups.json'),
    'native_pe_verification': ref(MISSION / 'native-pe-verification.json'),
    'catalogue': ref(MISSION / 'catalogue.snapshot.json'),
    'disk_pe_sha256': pe['disk_pe_sha256'],
    'calls': {'native': 6, 'reused': 0, 'retries': 0},
    'blocked_eas': ['0x50AED0'],
    'quarantined_pe_mismatch_eas': [],
    'luna_oversize_required_eas': [],
    'routes': routes,
    'scope_guards': {'no_producers_spawned': True, 'no_IDB_git_ledger_registry_live_config_mutation': True, 'writes_only_own_classification_directory': True},
}
path = OWN / 'routing.json'
path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
all_paths = [p['output_path'] for r in routes for p in r['productions']]
assert len(all_paths) == len(set(all_paths)) == 30
print(json.dumps({'routing': ref(path), 'source': source, 'scores': [{'ea': r['ea'], 'complexity': r['complexity'], 'risk': r['risk'], 'status': r['status'], 'request': r['request'], 'response': r['response']} for r in routes], 'author_admissions': 20, 'reconciliations_deferred': 10}, indent=2))
