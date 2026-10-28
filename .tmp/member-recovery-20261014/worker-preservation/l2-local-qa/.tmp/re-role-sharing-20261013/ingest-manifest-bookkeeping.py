# -*- coding: utf-8 -*-
"""Targeted ingest bookkeeping for batch ff8-harness-role-sharing-2026-10-13.

Owned by the obsidian-docs ingest worker (proof/script scope
.tmp/re-role-sharing-20261013/ingest-*). Manifest: BOM strip, format and
unknown fields preserved, targeted sources only (NOT a full repo sync),
last_commit_synced / last_synced preserved.
"""
import json, hashlib, os
from datetime import datetime, timezone, timedelta

repo = r'C:\Users\djden\source\repos\retro-eng\re-ff8'
vault = os.path.join(repo, 'obsidian-docs')
mpath = os.path.join(vault, '.manifest.json')
lpath = os.path.join(vault, 'log.md')

now = datetime.now().astimezone()
ts = now.isoformat(timespec='seconds')
tz = datetime.now(timezone(timedelta(hours=2))).isoformat(timespec='seconds')

CANARY = 'projects/re-ff8/references/ff8-harness-strict-canary-2026-10-13.md'
POLICY = 'projects/re-ff8/concepts/ff8-harness-role-policy.md'
SESS   = 'projects/re-ff8/references/ff8-harness-role-sharing-session-2026-10-13.md'
RAWREC = '_raw/ff8-harness-session-20261013/session-record.md'
RAWADD = '_raw/ff8-harness-session-20261013/session-addendum-20261013.md'
OVER   = 'projects/re-ff8/re-ff8.md'
TRIPLE = 'projects/re-ff8/references/semantic-triple-pipeline.md'

SRC = [
 ('tools/ff8-harness/docs/SESSION_20261013.md', 'document', [CANARY, POLICY, SESS, RAWREC], [OVER, TRIPLE]),
 ('tools/ff8-harness/docs/SESSION_20261013_ADDENDUM.md', 'document', [SESS, RAWADD], [OVER]),
 ('tools/ff8-harness/docs/ROLE_ACCESS.md', 'document', [POLICY, RAWREC], []),
 ('tools/ff8-harness/docs/STRICT_OUTPUT.md', 'document', [CANARY, RAWREC], []),
 ('tools/ff8-harness/docs/RESUME_STATUS.md', 'document', [CANARY, RAWREC], []),
 ('tools/ff8-harness/evidence/native-canary-20261013-attempt16-review.json', 'evidence', [CANARY, RAWREC], []),
 ('.tmp/re-role-sharing-20261013/CONTRACT.md', 'document', [POLICY, SESS, RAWREC], []),
 ('.tmp/re-role-sharing-20261013/GENERIC-WIRE.md', 'document', [POLICY, SESS, RAWREC], []),
 ('.tmp/re-role-sharing-20261013/FF8-WIRE-QUESTION.md', 'document', [SESS, RAWREC], []),
 ('.tmp/re-role-sharing-20261013/gates/ff8-prewire-1/results.json', 'data', [SESS, RAWREC], []),
 ('.tmp/re-role-sharing-20261013/gates/ensemble-review-1/results.json', 'data', [SESS, RAWREC], []),
 ('.tmp/re-role-sharing-20261013/gates/ensemble-utf8-final-1/results.json', 'data', [SESS, RAWADD], []),
 ('.tmp/re-role-sharing-20261013/gates/ensemble-utf8-final-2/results.json', 'data', [SESS, RAWADD], []),
 ('.tmp/re-role-sharing-20261013/parent-utf8-RED.log', 'data', [SESS, RAWREC], []),
 ('.tmp/re-role-sharing-20261013/parent-utf8-GREEN.log', 'data', [SESS, RAWREC], []),
 ('.tmp/re-role-sharing-20261013/grepai-session-retrieval.json', 'data', [SESS, RAWADD], []),
]

raw = open(mpath, 'rb').read()
had_bom = raw[:3] == b'\xef\xbb\xbf'
m = json.loads(raw.decode('utf-8-sig'))

created_all = [CANARY, POLICY, SESS, RAWREC, RAWADD]
updated_all = [OVER, TRIPLE]

for rel, stype, created, updated in SRC:
    full = os.path.join(repo, rel.replace('/', os.sep))
    data = open(full, 'rb').read()
    h = hashlib.sha256(data).hexdigest()
    mt = datetime.fromtimestamp(os.path.getmtime(full)).astimezone().isoformat(timespec='seconds')
    if rel in m['sources']:
        e = m['sources'][rel]
        e['last_ingested'] = ts
        e['size_bytes'] = len(data)
        e['modified_at'] = mt
        e['content_hash'] = 'sha256:' + h
        e['source_type'] = stype
        e['pages_created'] = sorted(set(e.get('pages_created', []) + created))
        e['pages_updated'] = sorted(set(e.get('pages_updated', []) + updated))
    else:
        m['sources'][rel] = {
            'ingested_at': ts, 'last_ingested': ts, 'size_bytes': len(data),
            'modified_at': mt, 'content_hash': 'sha256:' + h, 'source_type': stype,
            'project': 're-ff8', 'pages_created': created, 'pages_updated': updated,
        }

m['stats']['total_sources_ingested'] += len(SRC)
m['stats']['total_pages'] += len(created_all)
m['stats']['last_batch'] = {
    'batch': 'ff8-harness-role-sharing-2026-10-13',
    'sources': len(SRC),
    'pages_created': len(created_all),
    'pages_updated': len(updated_all),
    'pages_updated_list': updated_all,
}
proj = m['projects']['re-ff8']
piv = proj.setdefault('pages_in_vault', [])
for p in created_all + updated_all:
    if p not in piv:
        piv.append(p)
proj['targeted_ingest_2026-10-13'] = {
    'date': ts,
    'batch': 'ff8-harness-role-sharing-2026-10-13',
    'scope': 'targeted session-source ingest (uncommitted work); NOT a full repo sync',
    'last_commit_preserved': proj.get('last_commit_synced'),
    'sources': len(SRC),
    'pages_created': created_all,
    'pages_updated': updated_all,
}
m['last_updated'] = ts

out = json.dumps(m, indent=2, ensure_ascii=False) + '\n'
open(mpath, 'wb').write(out.encode('utf-8'))

note = ('canary strict essai 16 PASS confirme parent (5 sessions fresh openai/gpt-6-astra#high, 18 WS schema-bound, reprise, publication fixture) '
 '- PASS synthetique, ne valide NI science FF8 NI publication IDA/IDB NI la nouvelle extension role-sharing ; echecs 12-15 conserves (negatif durable) + dossiers v3 utf8-lines-lf ; '
 'role-sharing: 3 workers (portal-map-1, ff8-role-sharing-1 second passage audit EN COURS non valide, generic-role-sharing-1 valide) ; gates chronologie 242 PASS (ff8-prewire-1) puis 1438 (ensemble-review-1, PRE-correction UTF8) puis TS2769 (ensemble-utf8-final-1) fix assertion puis 1439 PASS/0 FAIL (ensemble-utf8-final-2, post-UTF8) ; '
 'audit bulletin FF8 + test croise role-sharing-offline.test.ts NON valides au snapshot ; complement final: retrieval GrepAI prouve sur UNE note source (SESSION_20261013.md lignes 117-148, score 0.393, grepai-session-retrieval.json) = pas l index entier ni addendum ni vault ; notes operationnelles: integrity verify exit0 79 fichiers (31 globaux+48 evidence/canary), memoire Serena relue (snapshot partiel), GrepAI 14 outils sans write-memory, watcher PID 40468 shared vs CLI not running (perimetre, pas restart), Obsidian CLI absent PATH ; '
 'raw preserve _raw/ff8-harness-session-20261013/ (session-record + session-addendum, frontmatter+SHA256) ; manifest +16 sources ciblees session (NOT fullsync, last_commit_synced 31b9f003 preserve, entree targeted_ingest ajoutee, BOM strip) ; '
 'QMD NON recompile (directive session: qmd update/embed interdits) - fraicheur index NON certifiee pour les 5 nouvelles pages, smokes read-only sur index existant seulement')
log_line = ('- [%s] INGEST source="tools/ff8-harness/docs/{SESSION_20261013,SESSION_20261013_ADDENDUM,'
            'ROLE_ACCESS,STRICT_OUTPUT,RESUME_STATUS}.md + tools/ff8-harness/evidence/'
            'native-canary-20261013-attempt16-review.json + .tmp/re-role-sharing-20261013/'
            '{CONTRACT,GENERIC-WIRE,FF8-WIRE-QUESTION}.md + gates/{ff8-prewire-1,ensemble-review-1,'
            'ensemble-utf8-final-1,ensemble-utf8-final-2}/results.json + parent-utf8-{RED,GREEN}.log + '
            'grepai-session-retrieval.json" project=re-ff8 selected_markdown=8 selected_data=8 '
            'pages_created=5 pages_updated=2 mode=append batch=ff8-harness-role-sharing-2026-10-13 '
            'status=partial\nnote="%s"\n' % (tz, note))
with open(lpath, 'ab') as f:
    f.write(log_line.encode('utf-8'))

# verification
m2 = json.loads(open(mpath, 'rb').read().decode('utf-8'))
print('had BOM:', had_bom, '| new head is { :', open(mpath, 'rb').read(1) == b'{')
print('sources now:', len(m2['sources']), '| stats:', m2['stats']['total_sources_ingested'], m2['stats']['total_pages'])
print('last_commit_synced preserved:', m2['projects']['re-ff8']['last_commit_synced'])
print('last_synced preserved:', m2['projects']['re-ff8']['last_synced'])
print('targeted entry date:', m2['projects']['re-ff8']['targeted_ingest_2026-10-13']['date'])
bad = [r for r, _, _, _ in SRC if m2['sources'][r]['content_hash'] != 'sha256:' + hashlib.sha256(open(os.path.join(repo, r.replace('/', os.sep)), 'rb').read()).hexdigest()]
print('hash mismatches:', bad)
tail = open(lpath, 'rb').read().decode('utf-8')[-90:]
print('log tail ok:', tail.replace('\n', ' | ')[:88])
