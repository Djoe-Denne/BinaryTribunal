import json
import hashlib
from pathlib import Path

ROOT = Path(r'C:/Users/djden/source/repos/retro-eng/re-ff8')
MISSION = ROOT / 'docs/missions/ff8-decomp-semantics-2026-10-11-run01'
OUT = Path(__file__).resolve().parent
INPUT = ROOT / 'inputs/ff8-decomp-semantics-20261011-r01/g08'
def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()
def rel(p):
    return p.relative_to(ROOT).as_posix()
groups = json.loads((MISSION / 'native-groups.json').read_text())
eas = next(g['eas'] for g in groups['groups'] if g['id'] == 'g08')
pe = {r['ea']: r for r in json.loads((MISSION / 'native-pe-verification.json').read_text())['results']}
facts = {f['ea']: f for f in groups['functions']}
source = next(g for g in json.loads((MISSION / 'discovery-harvest.json').read_text()) if g['group'] == 'g08')
result = {'group': 'g08', 'status': 'DISPATCH_READY', 'SOURCE': 'discover-g08',
          'source_session_id': source['session_id'], 'source_report_message': source['report_message'],
          'source_receipt_sha256': source['receipt_sha256'],
          'source_candidate_preview_flag': False,
          'source_note': 'Source report separates legacy IDB annotations; no target candidate-preview flag reported. Four packets inventoried only; this prevents simple-route admission, not dual independent production.',
          'common_compaction': rel(INPUT / 'common-compaction.md'),
          'common_compaction_sha256': sha(INPUT / 'common-compaction.md'),
          'contract_sha256': sha(MISSION / 'CONTRACT.md'),
          'native_groups_sha256': sha(MISSION / 'native-groups.json'),
          'native_pe_verification_sha256': sha(MISSION / 'native-pe-verification.json'),
          'model_ref_gate': 'Lead must verify effective provider/id/variant before admission; classification author is never fork source.',
          'routes': []}
for ea in eas:
    request = OUT / (ea + '.request.json')
    payload = json.loads(request.read_text())
    packet = INPUT / (ea + '.json')
    row = {'ea': ea, 'SOURCE': 'discover-g08', 'source_session_id': source['session_id'],
           'request_path': rel(request), 'request_sha256': sha(request),
           'input_packet_path': rel(packet), 'input_packet_sha256': sha(packet),
           'frozen_native_sha256': facts[ea]['sha256'],
           'instruction_count': facts[ea]['instructions'], 'native_assembly_chars': facts[ea]['asm_chars'],
           'classifier_assembly_chars': len(payload['assembly']), 'pe_verified': pe[ea]['idb_equals_pe_and_freeze']}
    if not row['pe_verified']:
        row.update(status='QUARANTINED_PE_MISMATCH', dispatches=[])
        result['routes'].append(row)
        continue
    oversize = len(payload['assembly']) > 100000
    if oversize:
        row.update(status='LUNA_OVERSIZE_REQUIRED', classifier_kind='luna_oversize_pending',
                   complexity=None, risk=None, route='complex',
                   oversize_classifier={'model': 'openai/gpt-6-luna-fast', 'variant': 'medium', 'owner': 'lead', 'unchanged_full_payload': rel(request)},
                   rationale='Complete classifier assembly is 147281 characters including inherited compaction; native ASM is 140198 characters / 2447 instructions. No Classify call or truncation. Production override remains dedicated GLM max 2+1 for each volet.',
                   production_override={'model': 'zai-coding-plan/glm-5.3-flash', 'variant': 'max', 'protocol': '2+1_per_volet'})
    else:
        response_path = OUT / (ea + '.response.native.json')
        response = json.loads(response_path.read_text())
        c, risk = response['complexity'], response['uncertainty']
        major = facts[ea]['instructions'] > 200
        level = 'medium' if c <= 65 and risk <= 50 and not major else 'complex'
        row.update(status='DISPATCH_READY', classifier_kind='classify_x86',
                   response_path=rel(response_path), response_sha256=sha(response_path),
                   complexity=c, risk=risk, risk_source='native uncertainty (operational risk proxy, not calibrated)', route=level,
                   rationale=f'v1: complexity {c}, uncertainty/risk {risk}; native instructions {facts[ea]["instructions"]}. Not simple (scores exceed 25/20). No major structural trigger reported; inherited factual limitations and legacy labels require independent A+B and ASM-grounded R.',
                   structural_flags=['legacy_IDB_annotations_not_semantic_evidence', 'common_compaction_partial_deep_read'])
    dispatches = []
    for volet in ['C', 'semantics']:
        for role in ['A', 'B', 'R']:
            if oversize:
                model, variant = 'zai-coding-plan/glm-5.3-flash', 'max'
            elif volet == 'C':
                model, variant = {'A': ('zai-coding-plan/glm-5.3-flash', 'max'), 'B': ('opencode-go/gpt-6-luna', 'medium'), 'R': ('openai/gpt-6.1-sol', 'high')}[role]
            else:
                model, variant = 'openai/gpt-6.1-sol', ('high' if role == 'R' else 'medium')
            dispatches.append({'volet': volet, 'role': role, 'model': model, 'variant': variant,
                               'SOURCE': 'discover-g08', 'source_session_id': source['session_id'],
                               'inheritance': 'same factual explorer source; fresh independent fork per author; never classifier or sibling',
                               'output_path': f'outputs/ff8-decomp-semantics-20261011-r01/productions/g08/{ea}/{volet}/{role}.md',
                               'depends_on': [f'{volet}.A', f'{volet}.B'] if role == 'R' else [],
                               'admission_gate': 'lead_oversize_classification_then_Model.Ref' if oversize else 'lead_Model.Ref',
                               'reconciler_gate': 'A+B deposited; compare against complete native ASM' if role == 'R' else None})
    row['dispatches'] = dispatches
    result['routes'].append(row)
path = OUT / 'routing.json'
path.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'routing_path': rel(path), 'routing_sha256': sha(path), 'compaction_sha256': result['common_compaction_sha256'], 'routes': [{k: r.get(k) for k in ['ea', 'status', 'complexity', 'risk', 'request_sha256', 'response_sha256']} for r in result['routes']]}, indent=2))
