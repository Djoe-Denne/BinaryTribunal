# -*- coding: utf-8 -*-
"""Callback addendum bookkeeping (chronological append; prior lot entries immutable)."""
import json, hashlib, os
from datetime import datetime, timezone, timedelta

repo = r'C:\Users\djden\source\repos\retro-eng\re-ff8'
vault = os.path.join(repo, 'obsidian-docs')
mpath = os.path.join(vault, '.manifest.json')
lpath = os.path.join(vault, 'log.md')

now = datetime.now().astimezone()
ts = now.isoformat(timespec='seconds')
tz = datetime.now(timezone(timedelta(hours=2))).isoformat(timespec='seconds')

CALLBACK = '_raw/ff8-harness-session-20261013/session-callback-20261013.md'
SESS = 'projects/re-ff8/references/ff8-harness-role-sharing-session-2026-10-13.md'
OVER = 'projects/re-ff8/re-ff8.md'

SRC = [
 ('.tmp/re-role-sharing-20261013/ff8-audit-RED.log', 'data', [CALLBACK], []),
 ('.tmp/re-role-sharing-20261013/ff8-audit-GREEN.log', 'data', [CALLBACK], []),
 ('tools/ff8-harness/src/bulletin-audit.ts', 'document', [CALLBACK, SESS], []),
]

raw = open(mpath, 'rb').read()
m = json.loads(raw.decode('utf-8'))

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
        e['pages_created'] = sorted(set(e.get('pages_created', []) + created))
        e['pages_updated'] = sorted(set(e.get('pages_updated', []) + updated))
    else:
        m['sources'][rel] = {
            'ingested_at': ts, 'last_ingested': ts, 'size_bytes': len(data),
            'modified_at': mt, 'content_hash': 'sha256:' + h, 'source_type': stype,
            'project': 're-ff8', 'pages_created': created, 'pages_updated': updated,
        }

m['stats']['total_sources_ingested'] += len(SRC)
m['stats']['total_pages'] += 1
lb = m['stats']['last_batch']
lb['sources'] += len(SRC)
lb['pages_created'] += 1
if SESS not in lb['pages_updated_list']:
    lb['pages_updated_list'].append(SESS)

proj = m['projects']['re-ff8']
ti = proj.get('targeted_ingest_2026-10-13')
ti['callback_worker_audit'] = {
    'date': ts,
    'status': 'worker-announcement-unvalidated',
    'session': 'ses_eca91da05ffeJzm2AvvYKG2eU6',
    'sources': [r for r, _, _, _ in SRC],
    'pages_created': [CALLBACK],
    'pages_updated': [SESS, OVER],
    'note': 'FF8 bulletin audit announced done by worker (219 targeted tests); parent cross-test and full gates still pending',
}
piv = proj['pages_in_vault']
if CALLBACK not in piv:
    piv.append(CALLBACK)
m['last_updated'] = ts

out = json.dumps(m, indent=2, ensure_ascii=False) + '\n'
open(mpath, 'wb').write(out.encode('utf-8'))

log_line = ('- [%s] INGEST_UPDATE batch=ff8-harness-role-sharing-2026-10-13 scope="callback worker ff8-role-sharing-1 '
            '(ses_eca91da05ffeJzm2AvvYKG2eU6)" status=worker-announcement-unvalidated pages_created=1 pages_updated=2 mode=append\n'
            'note="audit FF8 bulletin ANNONCE termine par le worker (stub retire, Inspection.communicationTrace exact + communicationAudit '
            'scope-verified snapshot/hash/auteurs natifs/politiques/bindings/disasm, inspections persistees, journal client antirollback, 2 R meme groupe '
            'dont peer actif, zero publication auto) ; 219 tests cibles PASS/0 FAIL 9 fichiers + typecheck ANNONCES worker (relus ff8-audit-GREEN.log) ; '
            'logs ff8-audit-*.log + src/bulletin-audit.ts hashes ; parent n a PAS encore execute test croise ni gates complets -> extension NON validee parent ; '
            'sources precedentes du lot restent chronologiques/immutables ; raw _raw/ff8-harness-session-20261013/session-callback-20261013.md ; '
            'manifest +3 sources (19 total batch), entree targeted_ingest extondue callback_worker_audit ; demande user fusion mission graph+scheduler future = '
            'pas de lancement, aucune campagne relancee ; QMD non recompile (directive session)"\n') % tz
with open(lpath, 'ab') as f:
    f.write(log_line.encode('utf-8'))

m2 = json.loads(open(mpath, 'rb').read().decode('utf-8'))
bad = [r for r, _, _, _ in SRC if m2['sources'][r]['content_hash'] != 'sha256:' + hashlib.sha256(open(os.path.join(repo, r.replace('/', os.sep)), 'rb').read()).hexdigest()]
print('sources now:', len(m2['sources']), '| stats:', m2['stats']['total_sources_ingested'], m2['stats']['total_pages'])
print('last_batch:', m2['stats']['last_batch']['sources'], 'sources,', m2['stats']['last_batch']['pages_created'], 'created')
print('callback status:', m2['projects']['re-ff8']['targeted_ingest_2026-10-13']['callback_worker_audit']['status'])
print('hash mismatches:', bad)
