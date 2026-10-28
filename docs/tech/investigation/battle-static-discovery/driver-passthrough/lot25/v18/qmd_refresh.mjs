// Refresh only the existing ff8-wiki collection through QMD 2.8.x's SDK.
// The installed CLI's `update` command is not collection-scoped.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const out = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(out, '../../../../../../..');
const packageRoot = path.join(process.env.APPDATA, 'npm/node_modules/@tobilu/qmd');
const packageInfo = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
const { createStore } = await import(pathToFileURL(path.join(packageRoot, 'dist/index.js')));
const receiptPath = path.join(out, 'qmd_refresh_receipt.json');
assert(!fs.existsSync(receiptPath), 'Preserve the existing refresh receipt');
const dbPath = process.argv[2]; // Supply the existing path reported by `qmd status`.
assert(dbPath && path.isAbsolute(dbPath) && fs.existsSync(dbPath), 'Existing absolute DB path required');
const store = await createStore({ dbPath });
const receipt = { utc: new Date().toISOString(), version: packageInfo.version,
  db: store.dbPath, collection: 'ff8-wiki', status: 'RUNNING' };
try {
  const before = await store.listCollections();
  const collection = before.find(c => c.name === 'ff8-wiki');
  assert(collection, 'ff8-wiki collection absent');
  assert.equal(path.resolve(collection.pwd).toLowerCase(),
    path.join(repo, 'obsidian-docs').toLowerCase(), 'Unexpected vault root');
  receipt.before = collection;
  receipt.update = await store.update({ collections: ['ff8-wiki'] });
  assert.equal(receipt.update.collections, 1);
  receipt.embed = await store.embed({ collection: 'ff8-wiki' });
  const after = await store.listCollections();
  receipt.after = after.find(c => c.name === 'ff8-wiki');
  const other = rows => rows.filter(c => c.name !== 'ff8-wiki');
  assert.deepEqual(other(after), other(before), 'Other collection metadata changed');
  const hits = await store.search({
    queries: [{ type: 'lex', query: '"NO_HOT_UNLOAD" "0x5646"' }],
    intent: 'Verify newly refreshed Lot25 v18 offline evidence is retrievable',
    collections: ['ff8-wiki'], rerank: false, limit: 5,
  });
  receipt.hits = hits.map(h => ({ file: h.filepath ?? h.file, title: h.title }));
  assert(hits.some(h => JSON.stringify(h).includes('af3dn-lot25-v18-no-hot-unload-2026-10-07')),
    'New v18 note absent from scoped search');
  receipt.status = 'PASS';
} catch (error) {
  receipt.status = 'FAIL';
  receipt.error = String(error);
  process.exitCode = 1;
} finally {
  await store.close();
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2), { flag: 'wx' });
  console.log(JSON.stringify(receipt, null, 2));
}
