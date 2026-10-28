import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Database } from "bun:sqlite";
import { canonical, hash, fingerprint, identityKey } from "../../tools/ff8-harness/src/validation";
import { buildStructuredResultSchema, decodeStructuredPayload } from "../../tools/ff8-harness/src/structured-result";
import { Service } from "../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js";
import { OpenCode } from "../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js";
import { validateExecutionValue } from "C:/Users/djden/AppData/Local/Temp/opencode/ensemble-mission-graph-20261011/src/execution-output";

const h = "C:/Users/djden/source/repos/retro-eng/re-ff8/tools/ff8-harness";
const proofPath = join(h, "evidence/native-canary-20261013-attempt16.json");
const proof = JSON.parse(readFileSync(proofPath, "utf8"));
const root = proof.isolatedDirectory;
const runtime = JSON.parse(readFileSync(join(root, "runtime.json"), "utf8"));
const endpoint = await Service.discover();
if (!endpoint) throw new Error("Public service unavailable");
const api = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const rows: any[] = [];

for (const role of proof.roles) {
  const evidence = proof.accessEvidence.find((e: any) => e.executionId === role.executionId);
  const capture = evidence.structuredResult;
  const sessionID = role.nativeSessionId;
  const session = await api.session.get({ sessionID });
  const context = await api.session.context({ sessionID });
  if (!Array.isArray(context)) throw new Error("Unexpected public context shape");
  const final = context.find((message: any) => message.id === capture.native.messageID) as any;
  const value = JSON.parse(final.content.filter((c: any) => c.type === "text").map((c: any) => c.text).join(""));
  const schema = buildStructuredResultSchema(role.role);
  validateExecutionValue(schema, value);
  const payload = decodeStructuredPayload(role.role, value);
  const schemaHash = hash(canonical(schema));
  const resources = evidence.boundaryChecks.flatMap((c: any) => c.resources ?? []).map((r: any) => r.resource);
  const dossierPath = resources.find((p: string) => p.endsWith("/dossier.json") || p.endsWith("\\dossier.json"));
  if (!dossierPath) throw new Error("No observed dossier read");
  const dossierBytes = readFileSync(dossierPath);
  const dossierText = dossierBytes.toString("utf8");
  const dossier = JSON.parse(dossierText);
  const certificate = dossier.controllerInputIntegrity.files;
  const artifact = readFileSync(dossier.outputPath);
  const document = JSON.parse(artifact.toString("utf8"));
  const certificateVerified = certificate.every((f: any) =>
    f.expectedSha256 === f.sourceSha256 && f.sourceSha256 === f.projectedSha256 &&
    f.sourceSha256 === hash(readFileSync(f.source)) && f.projectedSha256 === hash(readFileSync(f.projected)));
  const proposalsVerified = dossier.inputs.proposals === undefined || dossier.inputs.proposals.every((p: any) => {
    const content = p.contentLines.join("\n");
    return p.contentEncoding === "utf8-lines-lf" && !Object.hasOwn(p, "content") &&
      content === readFileSync(p.path, "utf8") && hash(content) === p.sha256 &&
      canonical(JSON.parse(content)) === canonical(p.document);
  });
  rows.push({
    role: role.role, executionId: role.executionId, sessionID,
    nativeModel: session.model,
    modelMatches: canonical(session.model) === canonical(proof.model),
    profileMatches: session.agent === runtime.execution.profiles[role.role] && session.agent === capture.native.profile,
    directoryMatches: session.location.directory === root,
    hasNativeFork: session.fork !== undefined, parentID: session.parentID ?? null,
    outcome: session.outcome, userMessages: context.filter((m: any) => m.type === "user").length,
    finalMessageID: final.id, finish: final.finish,
    finalHashMatches: hash(canonical(value)) === capture.sha256,
    schemaHashMatches: schemaHash === evidence.output.schemaSha256 && schemaHash === capture.schemaSha256,
    witnessCount: evidence.outputWitnesses.length,
    transports: [...new Set(evidence.outputWitnesses.map((x: any) => x.transport))],
    witnessesBound: capture.native.sessionId === sessionID && evidence.outputWitnesses.every((w: any) =>
      w.executionId === role.executionId && w.sessionId === sessionID && w.schemaSha256 === schemaHash &&
      canonical(w.model) === canonical(proof.model) && w.endpoint === "wss://chatgpt.com/backend-api/codex/responses"),
    strict: evidence.output.strict === true && evidence.output.mode === "json_schema",
    accessVerified: evidence.accessVerified === true,
    deniedProbe: evidence.boundaryChecks.some((c: any) => c.boundaryAllowed === false &&
      c.resources?.some((r: any) => r.resource.endsWith("denied-canary.json"))),
    artifact: { path: dossier.outputPath, sha256: hash(artifact),
      proofHashMatches: hash(artifact) === role.artifactSha256,
      payloadAndEnvelopeMatch: canonical(document) === canonical({ ...payload, ...dossier.resultEnvelope }) },
    dossier: { version: dossier.version, sha256: hash(dossierBytes),
      longestLine: Math.max(...dossierText.split("\n").map(l => l.length)), lines: dossierText.split("\n").length,
      instructionLossless: dossier.instructions.join("\n") === runtime.execution.roleInstructions[role.role],
      certificateCount: certificate.length, certificateRereadVerified: certificateVerified,
      blindInputHasNoProposals: !["A", "B"].includes(role.role) || dossier.inputs.proposals === undefined,
      frozenProposalsLossless: proposalsVerified },
  });
}

const closed = proof.nativeClosure.executions;
const nativeReport = {
  schemaVersion: 1, at: new Date().toISOString(), directory: root,
  source: "Public authenticated session.get/context; independent schema/value/provenance/artifact/dossier byte validation",
  proofSha256: hash(readFileSync(proofPath)), native: rows,
  strictFiveSessionsVerified: rows.length === 5 && new Set(rows.map(r => r.sessionID)).size === 5 && rows.every(r =>
    r.modelMatches && r.profileMatches && r.directoryMatches && !r.hasNativeFork && r.finalHashMatches &&
    r.schemaHashMatches && r.witnessesBound && r.strict && r.accessVerified && r.userMessages === 1 && r.finish === "stop" &&
    r.artifact.proofHashMatches && r.artifact.payloadAndEnvelopeMatch && r.dossier.version === 3 &&
    r.dossier.certificateRereadVerified && r.dossier.instructionLossless && r.dossier.longestLine <= 2000 &&
    r.dossier.blindInputHasNoProposals && r.dossier.frozenProposalsLossless),
  closureIdentitySetVerified: proof.nativeClosure.verified === true && proof.nativeClosure.admissionsPaused === true &&
    closed.length === rows.length && new Set(closed.map((e: any) => e.executionId)).size === rows.length &&
    closed.every((e: any) => e.state === "stopped" && rows.some(r => r.executionId === e.executionId && r.sessionID === e.sessionId)),
  nativeSessionsTerminal: rows.every(r => ["succeeded", "failed", "interrupted"].includes(r.outcome)),
};

// This is the harness-owned FIXTURE database only. Never read ensemble.db.
const fixturePath = join(root, "fixture-publication.db");
const beforeHash = hash(readFileSync(fixturePath));
const db = new Database(fixturePath, { readonly: true, create: false });
let publications: any[], targets: any[];
try {
  publications = db.query("SELECT id,request_hash,receipt,checked FROM ff8_fixture_publications").all();
  targets = db.query("SELECT id,revision,function_key,result_hash FROM ff8_fixture_targets").all();
} finally { db.close(); }
const rArtifact = rows.find(r => r.role === "R")!.artifact;
const rDocument = JSON.parse(readFileSync(rArtifact.path, "utf8"));
const receipt = publications.length === 1 ? JSON.parse(publications[0].receipt) : null;
const target = targets.length === 1 ? targets[0] : null;
const resultHash = fingerprint(rDocument);
const knowledgePath = join(root, "outputs", "knowledge", `${resultHash}.json`);
const knowledgeBytes = readFileSync(knowledgePath), knowledge = JSON.parse(knowledgeBytes.toString("utf8"));
const publicationReport = {
  schemaVersion: 1, at: new Date().toISOString(), source: "Read-only harness-owned fixture database and immutable files; no Ensemble database access",
  database: fixturePath, databaseSha256: beforeHash, databaseUnchanged: beforeHash === hash(readFileSync(fixturePath)),
  rows: publications.length, checkedReadbacks: publications.reduce((n, r) => n + r.checked, 0), targetCount: targets.length,
  receipt, target, reconciliationArtifactSha256: rArtifact.sha256, resultHash,
  verified: publications.length === 1 && publications[0].checked === 1 && publications[0].id === receipt.idempotencyKey &&
    targets.length === 1 && target.id === receipt.targetId && target.revision === 1 && receipt.revision === 1 &&
    receipt.resultHash === resultHash && target.result_hash === resultHash && target.function_key === identityKey(rDocument.identity) &&
    rDocument.kind === "reconciliation" && rDocument.decision === "certain" && proof.fixturePublication.writes === 1 && proof.fixturePublication.readbacks === 1,
  knowledge: { path: knowledgePath, sha256: hash(knowledgeBytes),
    conclusionOnly: knowledge.kind === "validated-conclusion" && !Object.hasOwn(knowledge, "propositions") &&
      !Object.hasOwn(knowledge, "questions") && canonical(knowledge.conclusion) === canonical(rDocument.conclusion) &&
      canonical(knowledge.publicationReceipt) === canonical(receipt) && knowledge.resultHash === resultHash },
};
const nativePath = join(h, "evidence/native-canary-20261013-attempt16-native-readback.json");
const publicationPath = join(h, "evidence/native-canary-20261013-attempt16-publication-readback.json");
writeFileSync(nativePath, JSON.stringify(nativeReport, null, 2), { flag: "wx" });
writeFileSync(publicationPath, JSON.stringify(publicationReport, null, 2), { flag: "wx" });
console.log(JSON.stringify({ nativePath, publicationPath,
  nativeVerified: nativeReport.strictFiveSessionsVerified, closureVerified: nativeReport.closureIdentitySetVerified,
  terminal: nativeReport.nativeSessionsTerminal, fixturePublicationVerified: publicationReport.verified,
  databaseUnchanged: publicationReport.databaseUnchanged, conclusionOnly: publicationReport.knowledge.conclusionOnly,
  witnesses: rows.reduce((n, r) => n + r.witnessCount, 0),
  rows: rows.map(r => ({ role: r.role, outcome: r.outcome, longestLine: r.dossier.longestLine, lines: r.dossier.lines })) }, null, 2));
if (!nativeReport.strictFiveSessionsVerified || !nativeReport.closureIdentitySetVerified || !nativeReport.nativeSessionsTerminal ||
  !publicationReport.verified || !publicationReport.databaseUnchanged || !publicationReport.knowledge.conclusionOnly) {
  throw new Error("Parent evidence verification failed; do not declare PASS");
}
