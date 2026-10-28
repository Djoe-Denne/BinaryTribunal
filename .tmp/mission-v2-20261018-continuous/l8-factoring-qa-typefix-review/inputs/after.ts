/**
 * QA SOURCE indépendante — extraction pure L8 (proposition, PAS de coverage exécutée).
 *
 * Contrat : mission l8-pure-factoring, SCOPE.md + MAPPING_DECISION.md pinnés,
 * adjudication parent .tmp/mission-v2-20261018-continuous/L8_PURE_FACTORING_QA_PLAN_ADJUDICATION.md
 * (sha256 a51b20d7ce94eb9efb42e745842731ac69a460bde9821eb615b5857f4767f4e7).
 *
 * Discipline de ce fichier (QA uniquement) :
 * - données heap-only ; aucune DB/OS/process/réseau/dispatch ; aucun EventLog,
 *   GraphStore, planMission, clusterGraph, buildGraphSnapshot exécuté ici.
 * - imports legacy STRICTEMENT pour vérifier l'identité === des publics
 *   historiques réels ; ils ne prouvent RIEN sur la closure pure du codec
 *   (le check statique pure-closure reste un contrôle parent distinct).
 * - validatePlanning / validateInputSource / parseAdmissionSource étaient
 *   PRIVÉS dans le graph-pipeline pinné : testés uniquement par leur nouveau
 *   point d'entrée, sans assertion de réexport legacy (correction 1).
 * - positifs complexes (plan/sidecar/prepared-graph/proposal-evidence
 *   produits par producteurs) : hors de ce fichier, remontés comme fixtures
 *   manquantes ; aucun faux dataset « valide » n'est inventé.
 * - ce fichier est une proposition : le parent exécute compile/typecheck/tests
 *   séparément après V fresh ; S1 source reste HOLD jusqu'aux gates.
 */
import { describe, expect, test } from "bun:test";
import * as graphPure from "../../src/graph-pure-codecs";
import * as lineagePure from "../../src/lineage-pure-codecs";
import * as configCodec from "../../src/semantic-config-codec";
import * as persistenceErrors from "../../src/graph-persistence-errors";
import * as graphPipeline from "../../src/graph-pipeline";
import * as graphStore from "../../src/graph-store";
import * as planner from "../../src/planner";
import * as eventlog from "../../src/eventlog";
import * as lineage from "../../src/lineage";
import * as semanticIndex from "../../src/semantic-index";
import { canonical, fingerprint, hash } from "../../src/validation";

// Nouveaux points d'entrée des anciens privés — JAMAIS assertés via graph-pipeline.
import {
  parseAdmissionSource,
  validateInputSource,
  validatePlanning,
} from "../../src/graph-pure-codecs";

type AnyRecord = Record<string, unknown>;
type SnapshotArg = Parameters<typeof validatePlanning>[1];
type PartitionArg = Parameters<typeof validatePlanning>[2];
type AdmissionSourceArg = Parameters<typeof graphPure.admissionScopeKey>[0];
type InputSnapshotArg = Parameters<typeof validateInputSource>[1];
type ConfigArg = Parameters<typeof configCodec.configFingerprint>[0];
type EncoderArg = NonNullable<Parameters<typeof configCodec.configFingerprint>[1]>;
type ProvenanceArg = Parameters<typeof configCodec.provenanceReady>[0];
type EvidenceArg = Parameters<typeof lineagePure.proposalEvidenceFingerprint>[0];
type PartitionViewArg = Parameters<typeof lineagePure.partitionProposalFingerprint>[0];
type PlanArg = Parameters<typeof graphPure.assertAdmissionBudgetBinding>[0];
type SidecarArg = Parameters<typeof graphPure.assertAdmissionBudgetBinding>[1];
type BudgetContextArg = Parameters<typeof graphPure.assertAdmissionBudgetBinding>[2];

const cast = <T,>(value: unknown): T => value as T;
const HEX64 = "a".repeat(64);
const moduleId = (letter: string) => letter.repeat(64);
const fnId = (rva: number) => `${"b".repeat(64)}:0x${rva.toString(16).toUpperCase()}`;

/** Receipt minimal de forme exacte (12 clés) — builder à portée commune (scope R2, finding 1). */
const receiptBase = () => ({
  artifactId: "art-1", artifactSha256: HEX64, functionId: fnId(1), moduleSha256: HEX64,
  artifactKind: "structural_fact", knowledgeRevision: 0, publicationLevel: 1,
  validation: "fixture-only", producerUnitId: null, commitId: "commit-1",
  readbackStatus: "verified", futurePrerequisiteEffect: "does_not_satisfy",
});

describe("graph-phase2 pure codecs — QA source (propositions, pas de coverage exécutée)", () => {
  describe("identité === des publics historiques (mapping parent, correction 1)", () => {
    test("primitives et validateurs historiques de graph-pipeline sont les mêmes références", () => {
      expect(graphPure.graphCheck).toBe(graphPipeline.graphCheck);
      expect(graphPure.graphObject).toBe(graphPipeline.graphObject);
      expect(graphPure.graphKeys).toBe(graphPipeline.graphKeys);
      expect(graphPure.graphString).toBe(graphPipeline.graphString);
      expect(graphPure.graphInteger).toBe(graphPipeline.graphInteger);
      expect(graphPure.graphNumber).toBe(graphPipeline.graphNumber);
      expect(graphPure.graphArray).toBe(graphPipeline.graphArray);
      expect(graphPure.graphJson).toBe(graphPipeline.graphJson);
      expect(graphPure.graphCopy).toBe(graphPipeline.graphCopy);
      expect(graphPure.graphFreeze).toBe(graphPipeline.graphFreeze);
      expect(graphPure.graphDigest).toBe(graphPipeline.graphDigest);
      expect(graphPure.assertReceiptCoherence).toBe(graphPipeline.assertReceiptCoherence);
      expect(graphPure.validatePlannerPolicy).toBe(graphPipeline.validatePlannerPolicy);
      expect(graphPure.validateExecutionTemplate).toBe(graphPipeline.validateExecutionTemplate);
      expect(graphPure.admissionScopeKey).toBe(graphPipeline.admissionScopeKey);
      expect(graphPure.parsePreparedGraph).toBe(graphPipeline.parsePreparedGraph);
      expect(graphPure.validateGraphDocument).toBe(graphStore.validateGraphDocument);
      expect(graphPure.assertAdmissionBudgetBinding).toBe(planner.assertAdmissionBudgetBinding);
    });

    test("publics lineage et immutableSnapshot sont les mêmes références", () => {
      expect(lineagePure.compareFunctionIds).toBe(lineage.compareFunctionIds);
      expect(lineagePure.sortFunctionIds).toBe(lineage.sortFunctionIds);
      expect(lineagePure.communityContentId).toBe(lineage.communityContentId);
      expect(lineagePure.proposalEvidenceFingerprint).toBe(lineage.proposalEvidenceFingerprint);
      expect(lineagePure.partitionProposalFingerprint).toBe(lineage.partitionProposalFingerprint);
      expect(lineagePure.isSerializableProposalData).toBe(lineage.isSerializableProposalData);
      expect(lineagePure.inspectProposalEvidence).toBe(lineage.inspectProposalEvidence);
      expect(configCodec.immutableSnapshot).toBe(lineage.immutableSnapshot);
    });

    test("publics semantic-index (config codec) et constantes sont les mêmes références", () => {
      expect(configCodec.configFingerprint).toBe(semanticIndex.configFingerprint);
      expect(configCodec.validConfig).toBe(semanticIndex.validConfig);
      expect(configCodec.provenanceReady).toBe(semanticIndex.provenanceReady);
      expect(configCodec.ALGORITHM).toBe(semanticIndex.ALGORITHM);
      expect(configCodec.ALGORITHM_VERSION).toBe(semanticIndex.ALGORITHM_VERSION);
      expect(configCodec.LEXICAL_RULESET_VERSION).toBe(semanticIndex.LEXICAL_RULESET_VERSION);
      expect(configCodec.ALGORITHM).toBe("multiview-components");
      expect(configCodec.ALGORITHM_VERSION).toBe("2");
      expect(configCodec.LEXICAL_RULESET_VERSION).toBe("ff8-tech-syn-1");
    });

    test("aucun wrapper nouveau : chaque export garde le nom de son implémentation déplacée", () => {
      const named: Array<[string, unknown]> = [
        ["graphCheck", graphPure.graphCheck], ["graphObject", graphPure.graphObject],
        ["graphKeys", graphPure.graphKeys], ["graphString", graphPure.graphString],
        ["graphInteger", graphPure.graphInteger], ["graphNumber", graphPure.graphNumber],
        ["graphArray", graphPure.graphArray], ["graphJson", graphPure.graphJson],
        ["graphCopy", graphPure.graphCopy], ["graphFreeze", graphPure.graphFreeze],
        ["graphDigest", graphPure.graphDigest],
        ["assertReceiptCoherence", graphPure.assertReceiptCoherence],
        ["validatePlannerPolicy", graphPure.validatePlannerPolicy],
        ["validateExecutionTemplate", graphPure.validateExecutionTemplate],
        ["admissionScopeKey", graphPure.admissionScopeKey],
        ["parsePreparedGraph", graphPure.parsePreparedGraph],
        ["validateGraphDocument", graphPure.validateGraphDocument],
        ["assertAdmissionBudgetBinding", graphPure.assertAdmissionBudgetBinding],
        ["compareFunctionIds", lineagePure.compareFunctionIds],
        ["sortFunctionIds", lineagePure.sortFunctionIds],
        ["communityContentId", lineagePure.communityContentId],
        ["proposalEvidenceFingerprint", lineagePure.proposalEvidenceFingerprint],
        ["partitionProposalFingerprint", lineagePure.partitionProposalFingerprint],
        ["isSerializableProposalData", lineagePure.isSerializableProposalData],
        ["inspectProposalEvidence", lineagePure.inspectProposalEvidence],
        ["immutableSnapshot", configCodec.immutableSnapshot],
        ["configFingerprint", configCodec.configFingerprint],
        ["validConfig", configCodec.validConfig],
        ["provenanceReady", configCodec.provenanceReady],
        // Anciens privés, nouveaux points d'entrée — même nom, jamais prétendus vieux publics.
        ["validatePlanning", validatePlanning],
        ["validateInputSource", validateInputSource],
        ["parseAdmissionSource", parseAdmissionSource],
      ];
      for (const [name, fn] of named) expect((fn as { name: string }).name, name).toBe(name);
    });
  });

  describe("graph-persistence-errors — classe déplacée jamais réimplémentée", () => {
    test("eventlog réexporte exactement la même classe et le même invariant", () => {
      expect(persistenceErrors.GraphPersistenceError).toBe(eventlog.GraphPersistenceError);
      expect(persistenceErrors.invariant).toBe(eventlog.invariant);
      expect(persistenceErrors.GraphPersistenceError.name).toBe("GraphPersistenceError");
    });

    test("instanceof, catégories intacts et message préservé", () => {
      const err = new persistenceErrors.GraphPersistenceError("schema", "boom");
      expect(err instanceof Error).toBe(true);
      expect(err instanceof persistenceErrors.GraphPersistenceError).toBe(true);
      expect(err.category).toBe("schema");
      expect(err.message).toBe("boom");
      for (const category of ["auth", "input", "schema", "quota", "outage", "scientific_block"] as const) {
        expect(new persistenceErrors.GraphPersistenceError(category, "m").category, category).toBe(category);
      }
    });

    test("invariant : catégorie par défaut input, catégorie explicite préservée, succès silencieux", () => {
      try {
        persistenceErrors.invariant(false, "guard");
        expect.unreachable();
      } catch (error) {
        expect(error instanceof persistenceErrors.GraphPersistenceError).toBe(true);
        expect((error as persistenceErrors.GraphPersistenceError).category).toBe("input");
        expect((error as Error).message).toBe("guard");
      }
      try {
        persistenceErrors.invariant(false, "guard", "quota");
        expect.unreachable();
      } catch (error) {
        expect(error instanceof persistenceErrors.GraphPersistenceError).toBe(true);
        expect((error as persistenceErrors.GraphPersistenceError).category).toBe("quota");
      }
      expect(() => persistenceErrors.invariant(true, "never")).not.toThrow();
      expect(() => persistenceErrors.invariant(1, "truthy passes")).not.toThrow();
    });

    test("les erreurs graph* restent des Error simples, pas des GraphPersistenceError", () => {
      try {
        graphPure.graphString("   ");
        expect.unreachable();
      } catch (error) {
        expect(error instanceof Error).toBe(true);
        expect(error instanceof persistenceErrors.GraphPersistenceError).toBe(false);
        expect((error as Error).message).toBe("graph: nonempty string required");
      }
    });
  });

  describe("graphObject / graphKeys / graphString — refus exacts", () => {
    test("proxy, instance de classe, null refusés ; objet à prototype null accepté", () => {
      expect(() => graphPure.graphObject(new Proxy({}, {}))).toThrow("graph: proxy is not JSON data");
      class Local { x = 1; }
      expect(() => graphPure.graphObject(new Local())).toThrow("graph: plain object required");
      expect(() => graphPure.graphObject(null)).toThrow("graph: plain object required");
      expect(() => graphPure.graphObject(Object.create(null))).not.toThrow();
    });

    test("accessor, clé symbole, propriété non énumérable refusés sans lire la valeur", () => {
      let calls = 0;
      const withGetter: AnyRecord = {};
      Object.defineProperty(withGetter, "a", { get: () => { calls += 1; return 1; }, enumerable: true });
      expect(() => graphPure.graphObject(withGetter)).toThrow("graph: accessor/symbol/nonenumerable data refused");
      expect(calls).toBe(0);
      expect(() => graphPure.graphObject({ [Symbol("s")]: 1 })).toThrow("graph: accessor/symbol/nonenumerable data refused");
      const hidden: AnyRecord = {};
      Object.defineProperty(hidden, "a", { value: 1, enumerable: false });
      expect(() => graphPure.graphObject(hidden)).toThrow("graph: accessor/symbol/nonenumerable data refused");
    });

    test("graphKeys : champ inconnu ou manquant, optionnels réels", () => {
      expect(() => graphPure.graphKeys({ a: 1 }, ["a"])).not.toThrow();
      expect(() => graphPure.graphKeys({ a: 1, b: 2 }, ["a"])).toThrow("graph: unknown or missing field");
      expect(() => graphPure.graphKeys({}, ["a"])).toThrow("graph: unknown or missing field");
      expect(() => graphPure.graphKeys({}, [], ["opt"])).not.toThrow();
      expect(() => graphPure.graphKeys({ opt: 1 }, [], ["opt"])).not.toThrow();
      expect(() => graphPure.graphKeys({ other: 1 }, [], ["opt"])).toThrow("graph: unknown or missing field");
    });

    test("graphString : blanc refusé, espaces d'extrémité acceptés, non-chaîne refusée", () => {
      expect(() => graphPure.graphString("   ")).toThrow("graph: nonempty string required");
      expect(() => graphPure.graphString(" a ")).not.toThrow();
      expect(() => graphPure.graphString(1)).toThrow("graph: nonempty string required");
    });
  });

  describe("discipline numérique — domaines distincts par API (correction 6)", () => {
    test("graphInteger : entier sûr >= minimum, -0 refusé, jamais élargi", () => {
      expect(() => graphPure.graphInteger(0)).not.toThrow();
      expect(() => graphPure.graphInteger(5, 10)).toThrow("graph: invalid integer");
      expect(() => graphPure.graphInteger(-1)).toThrow("graph: invalid integer");
      expect(() => graphPure.graphInteger(-0)).toThrow("graph: invalid integer");
      expect(() => graphPure.graphInteger(1.5)).toThrow("graph: invalid integer");
      expect(() => graphPure.graphInteger(2 ** 53)).toThrow("graph: invalid integer");
      expect(() => graphPure.graphInteger(Number.MAX_SAFE_INTEGER)).not.toThrow();
    });

    test("graphNumber : fini et >= 0 selon sa propre règle ; -0 est ACCEPTÉ ici", () => {
      expect(() => graphPure.graphNumber(0)).not.toThrow();
      expect(() => graphPure.graphNumber(-0)).not.toThrow();
      expect(() => graphPure.graphNumber(1.5)).not.toThrow();
      expect(() => graphPure.graphNumber(1e20)).not.toThrow();
      expect(() => graphPure.graphNumber(-1)).toThrow("graph: invalid finite nonnegative number");
      expect(() => graphPure.graphNumber(NaN)).toThrow("graph: invalid finite nonnegative number");
      expect(() => graphPure.graphNumber(Infinity)).toThrow("graph: invalid finite nonnegative number");
      expect(() => graphPure.graphNumber("1")).toThrow("graph: invalid finite nonnegative number");
    });
  });

  describe("graphJson / graphCopy / graphFreeze / graphDigest", () => {
    test("graphJson : nonfinite, cycle, primitives autorisées", () => {
      expect(() => graphPure.graphJson({ a: NaN })).toThrow("graph: nonfinite JSON number");
      expect(() => graphPure.graphJson({ a: [Infinity] })).toThrow("graph: nonfinite JSON number");
      expect(() => graphPure.graphJson(NaN)).toThrow("graph: nonfinite JSON number");
      const cyclic: AnyRecord = {};
      cyclic.self = cyclic;
      expect(() => graphPure.graphJson(cyclic)).toThrow("graph: non-JSON/cyclic data");
      expect(() => graphPure.graphJson("x")).not.toThrow();
      expect(() => graphPure.graphJson(null)).not.toThrow();
      expect(() => graphPure.graphJson(42)).not.toThrow();
    });

    test("phases exactes des guards de tableau (correction 5) : comptage Reflect.ownKeys d'abord", () => {
      const sparseWithAccessor: unknown[] = new Array(2);
      Object.defineProperty(sparseWithAccessor, 0, { get: () => 1, enumerable: true });
      expect(() => graphPure.graphJson(sparseWithAccessor)).toThrow("graph: sparse/extra array fields");
      const denseWithAccessor: unknown[] = [1, 2];
      let calls = 0;
      Object.defineProperty(denseWithAccessor, 0, { get: () => { calls += 1; return 9; }, enumerable: true });
      expect(() => graphPure.graphJson(denseWithAccessor)).toThrow("graph: array accessor/hole");
      expect(calls).toBe(0);
      const extraField: unknown[] = [1, 2];
      Object.defineProperty(extraField, "x", { value: 1, enumerable: true });
      expect(() => graphPure.graphJson(extraField)).toThrow("graph: sparse/extra array fields");
    });

    test("graphCopy : undefined REFUSÉ avant canonical (correction 2), getters jamais invoqués", () => {
      // Contraste documenté : canonical seul abandonnerait undefined ; la composition graphCopy refuse.
      expect(canonical({ a: undefined })).toBe("{}");
      expect(() => graphPure.graphCopy({ a: undefined })).toThrow("graph: non-JSON/cyclic data");
      expect(() => graphPure.graphCopy([1, undefined])).toThrow("graph: non-JSON/cyclic data");
      expect(() => graphPure.graphCopy(undefined)).toThrow("graph: non-JSON/cyclic data");
      let calls = 0;
      const withGetter: AnyRecord = {};
      Object.defineProperty(withGetter, "a", { get: () => { calls += 1; return 1; }, enumerable: true });
      expect(() => graphPure.graphCopy(withGetter)).toThrow("graph: accessor/symbol/nonenumerable data refused");
      expect(calls).toBe(0);
      expect(() => graphPure.graphCopy(new Proxy({}, {}))).toThrow("graph: proxy is not JSON data");
    });

    test("graphCopy : copie profonde, ordre de clés canonique, original intact", () => {
      const source = { nested: { x: 1 }, b: 2, a: 1 };
      const copy = graphPure.graphCopy(source);
      expect(copy).toEqual({ a: 1, b: 2, nested: { x: 1 } });
      expect((copy as { nested: object }).nested).not.toBe(source.nested);
      expect(source).toEqual({ nested: { x: 1 }, b: 2, a: 1 });
      expect(graphPure.graphCopy(null)).toBe(null);
    });

    test("graphFreeze : copie profonde congelée, original jamais congelé", () => {
      const source = { a: { b: [1, 2] } };
      const frozen = graphPure.graphFreeze(source);
      expect(frozen).not.toBe(source);
      expect(Object.isFrozen(frozen)).toBe(true);
      expect(Object.isFrozen((frozen as { a: object }).a)).toBe(true);
      expect(Object.isFrozen((frozen as { a: { b: object } }).a.b)).toBe(true);
      expect(Object.isFrozen(source)).toBe(false);
      expect(Object.isFrozen(source.a)).toBe(false);
    });

    test("graphDigest : positif calculé, digest faux ou non hex refusé au même message", () => {
      const content = { a: 1, b: "x" };
      expect(() => graphPure.graphDigest({ ...content, fingerprint: fingerprint(content) })).not.toThrow();
      expect(() => graphPure.graphDigest({ ...content, fingerprint: "0".repeat(64) }))
        .toThrow("graph: content fingerprint mismatch");
      expect(() => graphPure.graphDigest({ ...content, fingerprint: "zz" }))
        .toThrow("graph: content fingerprint mismatch");
    });
  });

  describe("assertReceiptCoherence — level2/fixture-only refusé (ancre)", () => {
    test("level1 fixture-only, level1/2 parent-validated acceptés ; producerUnitId string ok", () => {
      expect(() => graphPure.assertReceiptCoherence(receiptBase())).not.toThrow();
      expect(() => graphPure.assertReceiptCoherence({ ...receiptBase(), validation: "parent-validated" })).not.toThrow();
      expect(() => graphPure.assertReceiptCoherence({ ...receiptBase(), publicationLevel: 2, validation: "parent-validated" })).not.toThrow();
      expect(() => graphPure.assertReceiptCoherence({ ...receiptBase(), producerUnitId: "unit-1" })).not.toThrow();
    });

    test("level2 + fixture-only refusé avec le message exact inchangé", () => {
      expect(() => graphPure.assertReceiptCoherence({ ...receiptBase(), publicationLevel: 2 }))
        .toThrow("graph: receipt level2/fixture-only is incoherent (upstream OPEN); no relabel");
      expect(() => graphPure.assertReceiptCoherence({
        ...receiptBase(), publicationLevel: 2, validation: "parent-validated", readbackStatus: "mismatch",
      })).not.toThrow();
    });

    test("négatifs de forme : clés, hash, enums, révisions", () => {
      expect(() => graphPure.assertReceiptCoherence({ ...receiptBase(), extra: 1 })).toThrow("graph: unknown or missing field");
      expect(() => graphPure.assertReceiptCoherence({ ...receiptBase(), artifactSha256: "ab" })).toThrow("graph: invalid artifact hash");
      expect(() => graphPure.assertReceiptCoherence({ ...receiptBase(), artifactKind: "nope" })).toThrow("graph: invalid enum value");
      expect(() => graphPure.assertReceiptCoherence({ ...receiptBase(), readbackStatus: "nope" })).toThrow("graph: invalid enum value");
      expect(() => graphPure.assertReceiptCoherence({ ...receiptBase(), futurePrerequisiteEffect: "nope" })).toThrow("graph: invalid enum value");
      expect(() => graphPure.assertReceiptCoherence({ ...receiptBase(), knowledgeRevision: 1.5 })).toThrow("graph: invalid integer");
      expect(() => graphPure.assertReceiptCoherence({ ...receiptBase(), producerUnitId: 1 })).toThrow("graph: nonempty string required");
    });
  });

  describe("validatePlannerPolicy — forme seule ; admission=true ajoute des OPTIONNELS (correction 3)", () => {
    const policyBase = () => ({
      version: "policy-v1", estimationVersion: "est-v1", partitionId: "part-0001",
      investigationKind: "structural", artifactKind: "structural_fact", publicationLevel: 1,
      contextEnvelopeMaxUtf8Bytes: 100, totalContextBudgetUtf8Bytes: 1000, maxSelectedUnits: 2,
      sccMaxFunctions: 10, sccMaxIterations: 5, sccCostBudget: 1000,
      requirementsByFunction: {}, estimatesByFunction: {}, resourcesByFunction: {},
    });
    const estimate = () => ({ version: "v1", A: 0, B: 0, R: 0, validation: 0 });

    test("policy minimale valide (partition=true) ; policy sans partitionId acceptée si partition=false", () => {
      expect(() => graphPure.validatePlannerPolicy(policyBase(), true)).not.toThrow();
      const { partitionId: _omitted, ...noPartition } = policyBase();
      expect(() => graphPure.validatePlannerPolicy(noPartition, false)).not.toThrow();
      expect(() => graphPure.validatePlannerPolicy(noPartition, true)).toThrow("graph: unknown or missing field");
      // partitionId n'est permis QUE quand partition=true.
      expect(() => graphPure.validatePlannerPolicy(policyBase(), false)).toThrow("graph: unknown or missing field");
    });

    test("admission=true : champs budget OPTIONNELS — policy sans eux reste acceptée (pas de refus inventé)", () => {
      expect(() => graphPure.validatePlannerPolicy(policyBase(), true, true)).not.toThrow();
    });

    test("admission=false : les clés budget deviennent inconnues", () => {
      expect(() => graphPure.validatePlannerPolicy({ ...policyBase(), admissionBudgetMode: "x" }, true, false))
        .toThrow("graph: unknown or missing field");
    });

    test("policy entièrement chargée valide : estimates, byModel, resources, edgeKinds, dispensations, receipts, conflits", () => {
      const loaded = {
        ...policyBase(),
        edgeKinds: { e1: "obligatory", e2: "optional", e3: "external_satisfied", e4: "unknown_unresolved", e5: "non_blocking" },
        dispensationsByEdge: { e1: { reason: "r", policyVersion: "p", source: "s", sourceHash: HEX64, validation: "fixture-only", knowledgeRevision: 0 } },
        externalReceiptsByEdge: { e1: receiptBase() },
        extraConflictsByFunction: { f: [{ id: "x", kind: "k", resourceKey: "r", withUnitId: null }] },
        estimatesByFunction: { f: { ...estimate(), byModel: { m: { A: 0, B: 0, R: 0, validation: 0 } } } },
        resourcesByFunction: { f: { profiles: [], models: [], tools: [], accounts: [], slots: 0, cpu: 0, gpu: 0, budget: 0 } },
      };
      expect(() => graphPure.validatePlannerPolicy(loaded, true, true)).not.toThrow();
    });

    test("négatifs exacts : enums, entiers, nonfinite, dicts", () => {
      expect(() => graphPure.validatePlannerPolicy({ ...policyBase(), investigationKind: "weird" })).toThrow("graph: invalid enum value");
      expect(() => graphPure.validatePlannerPolicy({ ...policyBase(), artifactKind: "weird" })).toThrow("graph: invalid enum value");
      expect(() => graphPure.validatePlannerPolicy({ ...policyBase(), publicationLevel: 3 })).toThrow("graph: invalid enum value");
      expect(() => graphPure.validatePlannerPolicy({ ...policyBase(), contextEnvelopeMaxUtf8Bytes: 1.5 })).toThrow("graph: invalid integer");
      expect(() => graphPure.validatePlannerPolicy({ ...policyBase(), version: "" })).toThrow("graph: nonempty string required");
      expect(() => graphPure.validatePlannerPolicy({
        ...policyBase(), estimatesByFunction: { f: { ...estimate(), A: NaN } },
      })).toThrow("graph: invalid finite nonnegative number");
      expect(() => graphPure.validatePlannerPolicy({
        ...policyBase(), estimatesByFunction: { f: { ...estimate(), R: -1 } },
      })).toThrow("graph: invalid finite nonnegative number");
      expect(() => graphPure.validatePlannerPolicy({
        ...policyBase(), resourcesByFunction: { f: { profiles: [], models: [], tools: [], accounts: [], slots: 1.5, cpu: 0, gpu: 0, budget: 0 } },
      })).toThrow("graph: invalid integer");
      expect(() => graphPure.validatePlannerPolicy({ ...policyBase(), edgeKinds: { e: "weird" } })).toThrow("graph: invalid enum value");
    });
  });

  describe("validateExecutionTemplate — bornes exactes inchangées", () => {
    const templateBase = () => ({
      version: "l8-execution-template-v1",
      settings: { profiles: { A: "pa", B: "pb", R: "pr" }, maxConcurrent: 1, familyTtlEvents: 4, maxAdmissionAttempts: 1, retryDelayMs: 0 },
      workers: [], accounts: [],
    });
    const worker = (accountId: string, workerId = "w-1") => ({
      workerId, profile: "p", model: "m", tools: [], accountId, slots: 1, cpu: 0, gpu: 0, budget: 0, available: true,
    });

    const account = (accountId: string) => ({ accountId, slots: 1, budget: 1 });

    test("positifs : minimal, bornes 10000/10 incluses, workers sur comptes réels, 2 workers distincts même compte, disponible false", () => {
      expect(() => graphPure.validateExecutionTemplate(templateBase())).not.toThrow();
      expect(() => graphPure.validateExecutionTemplate({ ...templateBase(), settings: { ...templateBase().settings, familyTtlEvents: 10000 } })).not.toThrow();
      expect(() => graphPure.validateExecutionTemplate({ ...templateBase(), settings: { ...templateBase().settings, maxAdmissionAttempts: 10 } })).not.toThrow();
      // Tout worker référence un compte RÉELLEMENT présent (scope R2 finding 2).
      expect(() => graphPure.validateExecutionTemplate({
        ...templateBase(), accounts: [account("a")], workers: [worker("a", "w-1")],
      })).not.toThrow();
      expect(() => graphPure.validateExecutionTemplate({
        ...templateBase(), accounts: [account("a")], workers: [{ ...worker("a"), available: false }],
      })).not.toThrow();
      // Deux workers d'IDs DISTINCTS sur le même compte existant : positif de ce codec.
      expect(() => graphPure.validateExecutionTemplate({
        ...templateBase(), accounts: [account("a")], workers: [worker("a"), worker("a", "w-2")],
      })).not.toThrow();
    });

    test("négatifs : version, bornes strictes, inventaire worker/compte, entiers", () => {
      expect(() => graphPure.validateExecutionTemplate({ ...templateBase(), version: "other" })).toThrow("graph: execution template version");
      expect(() => graphPure.validateExecutionTemplate({ ...templateBase(), settings: { ...templateBase().settings, familyTtlEvents: 10001 } })).toThrow("graph: event lease bound");
      expect(() => graphPure.validateExecutionTemplate({ ...templateBase(), settings: { ...templateBase().settings, maxAdmissionAttempts: 11 } })).toThrow("graph: admission retry bound");
      expect(() => graphPure.validateExecutionTemplate({ ...templateBase(), settings: { ...templateBase().settings, maxConcurrent: 0 } })).toThrow("graph: invalid integer");
      expect(() => graphPure.validateExecutionTemplate({ ...templateBase(), settings: { ...templateBase().settings, retryDelayMs: -1 } })).toThrow("graph: invalid integer");
      expect(() => graphPure.validateExecutionTemplate({ ...templateBase(), settings: { ...templateBase().settings, profiles: { A: "", B: "b", R: "r" } } })).toThrow("graph: nonempty string required");
      expect(() => graphPure.validateExecutionTemplate({
        ...templateBase(), accounts: [account("a"), account("a")],
      })).toThrow("graph: duplicate account");
      expect(() => graphPure.validateExecutionTemplate({ ...templateBase(), workers: [worker("ghost")] })).toThrow("graph: worker/account inventory");
      // Vrai négatif : le positif 2-workers ci-dessus avec un accountId muté vers un compte
      // absent — workerId toujours distinct, donc le refus vient bien de l'inventaire compte.
      expect(() => graphPure.validateExecutionTemplate({
        ...templateBase(), accounts: [account("a")], workers: [worker("a"), worker("ghost", "w-2")],
      })).toThrow("graph: worker/account inventory");
      expect(() => graphPure.validateExecutionTemplate({
        ...templateBase(), accounts: [{ accountId: "a", slots: 1.5, budget: 1 }],
      })).toThrow("graph: invalid integer");
    });
  });

  describe("admissionScopeKey — empreinte de périmètre pure", () => {
    const source = (over: AnyRecord = {}) => ({
      cycle: 1, budgetEpoch: 1, context: { missionId: "m-1" }, allocation: null, ...over,
    });

    test("déterministe, 64 hex, sensible au cycle/budgetEpoch/context/allocation", () => {
      const key = graphPure.admissionScopeKey(cast<AdmissionSourceArg>(source()));
      expect(key).toMatch(/^[a-f0-9]{64}$/);
      expect(graphPure.admissionScopeKey(cast<AdmissionSourceArg>(source()))).toBe(key);
      expect(graphPure.admissionScopeKey(cast<AdmissionSourceArg>(source({ cycle: 2 })))).not.toBe(key);
      expect(graphPure.admissionScopeKey(cast<AdmissionSourceArg>(source({ budgetEpoch: 2 })))).not.toBe(key);
      expect(graphPure.admissionScopeKey(cast<AdmissionSourceArg>(source({ context: { missionId: "m-2" } })))).not.toBe(key);
      expect(graphPure.admissionScopeKey(cast<AdmissionSourceArg>(source({ allocation: { fingerprint: HEX64 } })))).not.toBe(key);
    });
  });

  describe("parseAdmissionSource — positif minimal de contrat + négatifs (privé historique : nouveau point d'entrée seulement)", () => {
    const modelRef = () => ({ providerID: "p", id: "m", variant: "high" });
    const file = (path = "C:/fixture/native.bin") => ({ path, sha256: HEX64, version: "1", provenance: "qa-min", kind: "native" });
    const knowledge = () => ({ version: "v1", fingerprint: HEX64, leadsFingerprint: HEX64, files: [] });
    const template = () => ({
      version: "l8-execution-template-v1",
      settings: { profiles: { A: "pa", B: "pb", R: "pr" }, maxConcurrent: 1, familyTtlEvents: 4, maxAdmissionAttempts: 1, retryDelayMs: 0 },
      workers: [], accounts: [],
    });
    // Types explicites des fixtures (scope R2 finding 3) : tout spread est typé,
    // aucun spread d'unknown ; les mutators peuvent retourner unknown pour un
    // négatif volontairement malformé, casté ensuite au point d'appel.
    type ModelRefFixture = ReturnType<typeof modelRef>;
    type FileFixture = ReturnType<typeof file>;
    type KnowledgeFixture = ReturnType<typeof knowledge>;
    type TemplateFixture = ReturnType<typeof template>;
    type AdmissionContextFixture = {
      version: string; missionId: string; snapshotId: string; snapshotFingerprint: string;
      partitionId: string; knowledgeRevision: number; missionConfigFingerprint: string;
      executionSpecFingerprint: string; inputManifestFingerprint: string; admissionCodecVersion: string;
      cycle: number; budgetEpoch: number;
    };
    type AdmissionSpecFixture = {
      version: string; templateFingerprint: string;
      models: Record<string, ModelRefFixture>;
      binary: { sha256: string; version: string };
      outputDirectory: string; rePolicy: null;
    };
    type AdmissionFixture = {
      version: string;
      executionTemplate: TemplateFixture;
      executionTemplateFingerprint: string;
      executionSourceSpec: AdmissionSpecFixture;
      executionSourceSpecFingerprint: string;
      inputManifestSource: {
        version: string; commonInputs: FileFixture[]; cycleKnowledge: KnowledgeFixture;
        inputsByFunction: Record<string, FileFixture[]>; accessibleRules: string[]; requiredTools: string[];
        publicationsByFunction: Record<string, unknown>; proposalPolicy: string;
      };
      inputManifestFingerprint: string;
      admissionCodecVersion: string;
      cycle: number; budgetEpoch: number;
      context: AdmissionContextFixture;
      allocation: null | {
        version: string; scope: string; executionProfile: string;
        context: AdmissionContextFixture; capsByFunction: Record<string, never>; fingerprint: string;
      };
    };
    const sourceFixture = (mutate: (parts: AdmissionFixture) => unknown = parts => parts) => {
      const executionTemplate = template();
      const executionSourceSpec: AdmissionSpecFixture = {
        version: "l8-execution-source-v1",
        templateFingerprint: fingerprint(executionTemplate),
        models: { A: modelRef(), B: modelRef(), R: modelRef(), explore: modelRef(), evaluate: modelRef() },
        binary: { sha256: HEX64, version: "1" },
        outputDirectory: "C:/out",
        rePolicy: null,
      };
      const inputManifestSource = {
        version: "l8-input-source-v1", commonInputs: [file()], cycleKnowledge: knowledge(),
        inputsByFunction: {}, accessibleRules: ["rule-a"], requiredTools: ["tool-a"],
        publicationsByFunction: {}, proposalPolicy: "exact-validated-same-function-A+B-v1",
      };
      const parts: AdmissionFixture = {
        version: "l8-admission-source-v1",
        executionTemplate,
        executionTemplateFingerprint: fingerprint(executionTemplate),
        executionSourceSpec,
        executionSourceSpecFingerprint: fingerprint(executionSourceSpec),
        inputManifestSource,
        inputManifestFingerprint: fingerprint(inputManifestSource),
        admissionCodecVersion: graphPipeline.GRAPH_ADMISSION_CODEC,
        cycle: 1, budgetEpoch: 1,
        context: {
          version: "planner-admission-context-v1", missionId: "m-1", snapshotId: "s-1",
          snapshotFingerprint: HEX64, partitionId: "part-0001", knowledgeRevision: 0,
          missionConfigFingerprint: HEX64,
          executionSpecFingerprint: fingerprint(executionSourceSpec),
          inputManifestFingerprint: fingerprint(inputManifestSource),
          admissionCodecVersion: graphPipeline.GRAPH_ADMISSION_CODEC,
          cycle: 1, budgetEpoch: 1,
        },
        allocation: null,
      };
      return mutate(parts);
    };
    const snapshot = () => cast<Parameters<typeof parseAdmissionSource>[1]>({
      missionId: "m-1", snapshotId: "s-1", normalizedFingerprint: HEX64, knowledgeRevision: 0, nodes: [],
    });
    const partition = () => cast<Parameters<typeof parseAdmissionSource>[2]>({ partitionId: "part-0001" });

    test("positif minimal sans allocation", () => {
      const fixture = sourceFixture();
      expect<unknown>(parseAdmissionSource(cast<never>(fixture), snapshot(), partition())).toEqual(fixture);
    });

    test("positif avec allocation cohérente (digest calculé, contexte canoniquement égal)", () => {
      const withAllocation = sourceFixture(parts => {
        const allocationContent = {
          version: "complete-admission-cap-v1", scope: "one-immutable-run",
          executionProfile: "one-execution-per-subintent-v1", context: parts.context, capsByFunction: {},
        };
        parts.allocation = { ...allocationContent, fingerprint: fingerprint(allocationContent) };
        return parts;
      });
      expect(() => parseAdmissionSource(cast<never>(withAllocation), snapshot(), partition())).not.toThrow();
    });

    test("négatifs exacts dans l'ordre des guards du corps historique", () => {
      expect(() => parseAdmissionSource(cast<never>(sourceFixture(p => ({ ...p, admissionCodecVersion: "other" }))), snapshot(), partition()))
        .toThrow("graph: admission source/codec version");
      expect(() => parseAdmissionSource(cast<never>(sourceFixture(p => ({ ...p, cycle: 0 }))), snapshot(), partition()))
        .toThrow("graph: invalid integer");
      expect(() => parseAdmissionSource(cast<never>(sourceFixture(p => ({
        ...p, executionSourceSpec: { ...p.executionSourceSpec, templateFingerprint: HEX64 },
      }))), snapshot(), partition()))
        .toThrow("graph: source spec/template relation");
      expect(() => parseAdmissionSource(cast<never>(sourceFixture(p => ({
        ...p, executionSourceSpec: { ...p.executionSourceSpec, binary: { sha256: "ab", version: "1" } },
      }))), snapshot(), partition()))
        .toThrow("graph: source binary SHA256");
      expect(() => parseAdmissionSource(cast<never>(sourceFixture(p => ({ ...p, executionTemplateFingerprint: HEX64 }))), snapshot(), partition()))
        .toThrow("graph: pre-selection source fingerprints");
      expect(() => parseAdmissionSource(cast<never>(sourceFixture(p => ({ ...p, context: {} }))), snapshot(), partition()))
        .toThrow("graph: unknown or missing field");
      expect(() => parseAdmissionSource(cast<never>(sourceFixture(p => ({
        ...p, context: { ...p.context, missionId: "m-2" },
      }))), snapshot(), partition()))
        .toThrow("graph: independent source/current context relation");
    });
  });

  describe("validateInputSource — positif minimal de contrat + négatifs (privé historique : nouveau point d'entrée seulement)", () => {
    const file = (path = "C:/fixture/native.bin") => ({ path, sha256: HEX64, version: "1", provenance: "qa-min", kind: "native" });
    const knowledge = () => ({ version: "v1", fingerprint: HEX64, leadsFingerprint: HEX64, files: [] });
    const fixture = (over: AnyRecord = {}) => ({
      version: "l8-input-source-v1",
      commonInputs: [file()],
      cycleKnowledge: knowledge(),
      inputsByFunction: {},
      accessibleRules: ["rule-a"],
      requiredTools: ["tool-a"],
      publicationsByFunction: {},
      proposalPolicy: "exact-validated-same-function-A+B-v1",
      ...over,
    });
    const snapshot = () => cast<InputSnapshotArg>({ nodes: [] });

    test("positif minimal", () => {
      expect(() => validateInputSource(cast<never>(fixture()), snapshot())).not.toThrow();
    });

    test("négatifs exacts : version/policy, manifest fichiers, fonctions inconnues, publications", () => {
      expect(() => validateInputSource(cast<never>(fixture({ version: "other" })), snapshot())).toThrow("graph: input source version/policy");
      expect(() => validateInputSource(cast<never>(fixture({ proposalPolicy: "other" })), snapshot())).toThrow("graph: input source version/policy");
      expect(() => validateInputSource(cast<never>(fixture({ commonInputs: [{ ...file(), sha256: "ab" }] })), snapshot())).toThrow("graph: source file hash");
      expect(() => validateInputSource(cast<never>(fixture({ commonInputs: [{ ...file(), kind: "nope" }] })), snapshot())).toThrow("graph: invalid enum value");
      expect(() => validateInputSource(cast<never>(fixture({ accessibleRules: [""] })), snapshot())).toThrow("graph: nonempty string required");
      expect(() => validateInputSource(cast<never>(fixture({ inputsByFunction: { [fnId(1)]: [file()] } })), snapshot())).toThrow("graph: unknown input source function");
      expect(() => validateInputSource(cast<never>(fixture({ publicationsByFunction: { [fnId(1)]: { artifactId: "a", artifactKind: "structural_fact", content: "c" } } })), snapshot()))
        .toThrow("graph: unknown publication function");
    });
  });

  describe("validatePlanning — négatifs de garde ; positif complexe hors périmètre QA", () => {
    const snapshot = () => cast<SnapshotArg>({ nodes: [] });
    const partition = () => cast<PartitionArg>({ partitionId: "part-0001" });

    test("clés racine exactes puis délégation au moteur legacy via validateGraphDocument déplacé", () => {
      expect(() => validatePlanning(cast<never>({}), snapshot(), partition())).toThrow("graph: unknown or missing field");
      const root = { plan: {}, units: [], sidecar: {}, diagnostics: [], binding: {} };
      try {
        validatePlanning(cast<never>(root), snapshot(), partition());
        expect.unreachable();
      } catch (error) {
        expect(error instanceof persistenceErrors.GraphPersistenceError).toBe(true);
        expect((error as persistenceErrors.GraphPersistenceError).category).toBe("schema");
        expect((error as Error).message).toBe("document: missing schemaVersion");
      }
    });

    test("validatePlanningBindingV1 : disponible, même garde précoce que le wrapper, partition/source jamais lues avant le refus", () => {
      // Spécification parent R2 (API commune) : le wrapper historique validatePlanning garde
      // sa signature et transmet les QUATRE refs (value, snapshot, partition, source) au cœur
      // sans lire/extraire de propriétés en avance ; le cœur reçoit partition {partitionId} et
      // source {context, allocation}. Test minimal heap-only : refus précoce identique
      // wrapper/cœur, getters instrumentés NON lus avant ce refus. Aucun faux positif B et
      // aucune fake source v1 (la validation B/fullsource est dédiée à S1).
      expect(typeof graphPure.validatePlanningBindingV1).toBe("function");
      let partitionReads = 0;
      let sourceReads = 0;
      const partitionBinding = cast<Parameters<typeof graphPure.validatePlanningBindingV1>[2]>({
        get partitionId() { partitionReads += 1; return "part-0001"; },
      });
      const sourceBinding = cast<Parameters<typeof graphPure.validatePlanningBindingV1>[3]>({
        get context() { sourceReads += 1; return {}; },
        get allocation() { sourceReads += 1; return null; },
      });
      expect(() => graphPure.validatePlanningBindingV1(cast<never>({}), cast<never>({ nodes: [] }), partitionBinding, sourceBinding))
        .toThrow("graph: unknown or missing field");
      expect(() => validatePlanning(cast<never>({}), cast<never>({ nodes: [] }), cast<never>(partitionBinding), cast<never>(sourceBinding)))
        .toThrow("graph: unknown or missing field");
      expect(partitionReads).toBe(0);
      expect(sourceReads).toBe(0);
    });
  });

  describe("parsePreparedGraph — négatifs de garde ; positif complexe hors périmètre QA", () => {
    test("version, digest, Proxy et admissionSource manquante (v2) aux phases exactes", () => {
      expect(() => graphPure.parsePreparedGraph({})).toThrow("graph: prepared graph version");
      expect(() => graphPure.parsePreparedGraph(new Proxy({}, {}))).toThrow("graph: proxy is not JSON data");
      const content = { version: "l8-prepared-graph-v1", snapshot: {}, partition: {}, groups: [], planning: {} };
      expect(() => graphPure.parsePreparedGraph({ ...content, fingerprint: "0".repeat(64) }))
        .toThrow("graph: content fingerprint mismatch");
      const v2MissingSource = { ...content, version: "l8-prepared-graph-v2", fingerprint: fingerprint(content) };
      expect(() => graphPure.parsePreparedGraph(v2MissingSource)).toThrow("graph: unknown or missing field");
    });
  });

  describe("validateGraphDocument — moteur legacy strict non élargi (ancre)", () => {
    const partitionDoc = () => ({
      schemaVersion: 1,
      partitionId: "part-0001",
      lineageId: "line-0001",
      parentLineageId: null,
      snapshotId: "snap-0001",
      snapshotFingerprint: HEX64,
      regime: "A",
      algorithm: "historical-cc",
      algorithmVersion: "1",
      configFingerprint: HEX64,
      seed: "none",
      communities: [{
        contentId: HEX64,
        lineageId: "lin-0001",
        parentContentIds: [],
        memberIds: [fnId(1)],
        kernelIds: [fnId(1)],
        externalContextIds: [],
        conductance: { known: false, value: null },
      }],
      modularity: { known: false, value: null },
      maturity: "structural",
      adopted: false,
    });

    test("positifs minimaux depuis le vrai schéma pinné cluster-partition-v1 (communities minItems 1 respecté)", () => {
      expect(() => graphPure.validateGraphDocument("cluster-partition", partitionDoc())).not.toThrow();
      const adopted = { ...partitionDoc(), adopted: true };
      expect(() => graphPure.validateGraphDocument("cluster-partition", adopted)).not.toThrow();
      const regimeB = { ...partitionDoc(), regime: "B" };
      expect(() => graphPure.validateGraphDocument("cluster-partition", regimeB)).not.toThrow();
    });

    test("kinds exacts : inconnu refusé, les cinq kinds historiques acceptés comme kinds", () => {
      for (const kind of ["graph-snapshot", "cluster-partition", "work-unit", "knowledge-commit", "mission-plan"]) {
        try {
          graphPure.validateGraphDocument(kind, {});
          expect.unreachable();
        } catch (error) {
          expect(error instanceof persistenceErrors.GraphPersistenceError).toBe(true);
          expect((error as Error).message).toBe("document: missing schemaVersion");
        }
      }
      try {
        graphPure.validateGraphDocument("unknown-kind", {});
        expect.unreachable();
      } catch (error) {
        expect(error instanceof persistenceErrors.GraphPersistenceError).toBe(true);
        expect((error as persistenceErrors.GraphPersistenceError).category).toBe("schema");
        expect((error as Error).message).toBe("unsupported graph document");
      }
    });

    test("négatifs exacts du moteur legacy : enum, bornes, type, clé supplémentaire", () => {
      expect(() => graphPure.validateGraphDocument("cluster-partition", { ...partitionDoc(), regime: "C" }))
        .toThrow("document.regime: invalid enumeration");
      expect(() => graphPure.validateGraphDocument("cluster-partition", { ...partitionDoc(), snapshotFingerprint: "short" }))
        .toThrow("document.snapshotFingerprint: text bounds");
      expect(() => graphPure.validateGraphDocument("cluster-partition", { ...partitionDoc(), communities: [] }))
        .toThrow("document.communities: array bounds");
      expect(() => graphPure.validateGraphDocument("cluster-partition", { ...partitionDoc(), modularity: { known: "yes", value: null } }))
        .toThrow("document.modularity.known: schema type mismatch");
      expect(() => graphPure.validateGraphDocument("cluster-partition", { ...partitionDoc(), zz: 1 }))
        .toThrow("document: unexpected zz");
      expect(() => graphPure.validateGraphDocument("work-unit", { schemaVersion: "x" }))
        .toThrow("document.schemaVersion: schema type mismatch");
    });
  });

  describe("assertAdmissionBudgetBinding — chaîne ordonnée de guards (prérequis heap réels, correction 5)", () => {
    const context = (over: AnyRecord = {}) => ({
      version: "planner-admission-context-v1", missionId: "m-1", snapshotId: "s-1",
      snapshotFingerprint: HEX64, partitionId: "part-0001", knowledgeRevision: 0,
      missionConfigFingerprint: HEX64, executionSpecFingerprint: HEX64,
      inputManifestFingerprint: HEX64, admissionCodecVersion: graphPipeline.GRAPH_ADMISSION_CODEC,
      cycle: 1, budgetEpoch: 1,
      ...over,
    });

    test("assertBudgetJson d'abord : nonfinite, -0, Proxy, symbole, cycle, prototype, accessor, array sparse", () => {
      const bind = (plan: unknown, sidecar: unknown, expected: unknown) =>
        graphPure.assertAdmissionBudgetBinding(cast<PlanArg>(plan), cast<SidecarArg>(sidecar), cast<BudgetContextArg>(expected));
      // Signature réelle (plan, sidecar, expectedContext) — chaque fixture fournit 3 arguments
      // (scope R2 finding 4) ; la violation cible toujours le 3e argument (expectedContext),
      // aucun undefined accidentel ne peut masquer le guard ciblé.
      expect(() => bind({}, {}, context({ cycle: NaN }))).toThrow("planner: noncanonical admission budget number");
      expect(() => bind({}, {}, context({ cycle: -0 }))).toThrow("planner: noncanonical admission budget number");
      expect(() => bind({}, {}, cast<never>(new Proxy({}, {})))).toThrow("planner: admission budget requires plain JSON data");
      const symbolContext: AnyRecord = context();
      Object.defineProperty(symbolContext, Symbol("s"), { value: 1, enumerable: true });
      expect(() => bind({}, {}, symbolContext)).toThrow("planner: symbol in admission budget data");
      const cyclic: AnyRecord = context();
      cyclic.self = cyclic;
      expect(() => bind({}, {}, cyclic)).toThrow("planner: cyclic admission budget data");
      class NotPlain { x = 1; }
      expect(() => bind({}, {}, cast<never>(new NotPlain()))).toThrow("planner: non-JSON admission budget prototype");
      const accessorContext: AnyRecord = context();
      Object.defineProperty(accessorContext, "zz", { get: () => 1, enumerable: true });
      expect(() => bind({}, {}, accessorContext)).toThrow("planner: accessor/non-enumerable admission budget data");
      expect(() => bind({}, {}, cast<never>({ arr: new Array(2) }))).toThrow("planner: sparse/non-JSON admission budget array");
    });

    test("mode de policy exigé AVANT la forme du contexte (ordre exact du corps historique)", () => {
      const bind = (plan: unknown, sidecar: unknown, expected: unknown) =>
        graphPure.assertAdmissionBudgetBinding(cast<PlanArg>(plan), cast<SidecarArg>(sidecar), cast<BudgetContextArg>(expected));
      const modePolicy = () => ({ admissionBudgetMode: "complete-admission-cap-v1", version: "complete-admission-cap-v1:x" });
      // Contexte toujours fourni via l'API publique : policy sans mode → refus de mode d'abord.
      expect(() => bind({}, { policy: {} }, context())).toThrow("planner: allocation/context requires explicit admissionBudgetMode");
      expect(() => bind({}, { policy: { admissionBudget: {} } }, context()))
        .toThrow("planner: allocation/context requires explicit admissionBudgetMode");
      expect(() => bind({}, { policy: { admissionBudgetMode: "other", version: "complete-admission-cap-v1:x" } }, context()))
        .toThrow("planner: unsupported admissionBudgetMode");
      expect(() => bind({}, { policy: { admissionBudgetMode: "complete-admission-cap-v1", version: "policy-v1" } }, context()))
        .toThrow("planner: new admission policy version required (maximum 32 UTF-16 code units)");
      // Mode/version valides → la forme du contexte devient la garde suivante (validateAdmissionContext est appelé DANS admissionMode).
      expect(() => bind({}, { policy: modePolicy() }, {})).toThrow("planner: unexpected/missing admission budget keys");
      expect(() => bind({}, { policy: modePolicy() }, context({ version: "other" }))).toThrow("planner: unsupported admission budget context version");
      expect(() => bind({}, { policy: modePolicy() }, context({ missionConfigFingerprint: "short" }))).toThrow("planner: noncanonical admission context fingerprint");
      expect(() => bind({}, { policy: modePolicy() }, context({ cycle: 0 }))).toThrow("planner: invalid admission context revision/cycle/epoch");
      // Contexte valide → relation scope/graph/partition/revision.
      expect(() => bind({}, {
        policy: {
          admissionBudgetMode: "complete-admission-cap-v1", version: "complete-admission-cap-v1:x", partitionId: "part-0001",
          contextEnvelopeMaxUtf8Bytes: 100, totalContextBudgetUtf8Bytes: 1000, maxSelectedUnits: 2, estimationVersion: "est-v1",
        },
      }, context())).toThrow("planner: admission context differs from graph/partition/revision");
    });

    test("chaîne complète jusqu'au dernier guard : identité de plan fausse refusée, comptabilité cohérente", () => {
      const budgetContext = context();
      const policy = {
        admissionBudgetMode: "complete-admission-cap-v1", version: "complete-admission-cap-v1:x", partitionId: "part-0001",
        contextEnvelopeMaxUtf8Bytes: 100, totalContextBudgetUtf8Bytes: 1000, maxSelectedUnits: 2, estimationVersion: "est-v1",
      };
      const planContent = {
        schemaVersion: 1, planId: "plan-wrong", missionId: "m-1", snapshotId: "s-1", partitionId: "part-0001",
        knowledgeRevision: 0, units: [], prerequisites: [], g1Edges: [], g2Conflicts: [], g3Affinities: [],
        sccs: [], selectedUnitIds: [], decisions: [],
        budgets: { contextEnvelopeMaxUtf8Bytes: 100 }, policyVersion: "complete-admission-cap-v1:x", estimationVersion: "est-v1",
      };
      const plan = { ...planContent, fingerprint: fingerprint(planContent) };
      const sidecarContent = {
        schemaVersion: 1, policyVersion: "complete-admission-cap-v1:x", estimationVersion: "est-v1",
        planId: "plan-wrong", planFingerprint: plan.fingerprint, snapshotFingerprint: HEX64, knowledgeRevision: 0,
        policy, unitFingerprints: {}, envelopeBytesByUnit: {},
        admissionBudget: {
          version: "planner-admission-accounting-v1", context: budgetContext, allocationFingerprint: null,
          byUnit: {}, selectedTotalAdmissionUtf8Bytes: 0,
        },
      };
      const sidecar = { ...sidecarContent, fingerprint: fingerprint(sidecarContent) };
      // Toutes les gardes précédentes passent, accounting absent (sidecar reconstruit avec son propre digest)
      // → refus exact à sa phase, pas un mismatch de digest.
      const sidecarNoAccounting = {
        schemaVersion: 1, policyVersion: "complete-admission-cap-v1:x", estimationVersion: "est-v1",
        planId: "plan-wrong", planFingerprint: plan.fingerprint, snapshotFingerprint: HEX64, knowledgeRevision: 0,
        policy, unitFingerprints: {}, envelopeBytesByUnit: {},
      };
      const sidecarNoAccountingSealed = { ...sidecarNoAccounting, fingerprint: fingerprint(sidecarNoAccounting) };
      expect(() => graphPure.assertAdmissionBudgetBinding(
        cast<PlanArg>(plan), cast<SidecarArg>(sidecarNoAccountingSealed), cast<BudgetContextArg>(budgetContext),
      )).toThrow("planner: missing admission accounting");
      // Chaîne complète : toutes les gardes précédentes passent, planId ne peut pas être
      // recertifié par QA sans repliquer l'identité privée → refus exact attendu.
      expect(() => graphPure.assertAdmissionBudgetBinding(cast<PlanArg>(plan), cast<SidecarArg>(sidecar), cast<BudgetContextArg>(budgetContext)))
        .toThrow("planner: admission plan identity changed; explicit replan required");
    });
  });

  describe("lineage-pure-codecs — ordre numérique et content-addressing", () => {
    const M1 = moduleId("a");
    const M2 = moduleId("c");

    test("compareFunctionIds : ordre numérique RVA (0x9 < 0x10), module d'abord, fallback texte (ancre)", () => {
      expect(lineagePure.compareFunctionIds(`${M1}:0x9`, `${M1}:0x10`)).toBe(-1);
      expect(lineagePure.compareFunctionIds(`${M1}:0x10`, `${M1}:0x9`)).toBe(1);
      expect(lineagePure.compareFunctionIds(`${M1}:0x9`, `${M1}:0x9`)).toBe(0);
      expect(lineagePure.compareFunctionIds(`${M1}:0xFFFF`, `${M2}:0x1`)).toBe(-1);
      expect(lineagePure.compareFunctionIds("abc", "abd")).toBe(-1);
      expect(lineagePure.compareFunctionIds("abd", "abc")).toBe(1);
      expect(lineagePure.compareFunctionIds("abc", `${M2}:0x1`)).toBe(-1);
      expect(lineagePure.compareFunctionIds(`${M1}:0x1a2b`, `${M1}:0x1A2B`)).toBe(0);
    });

    test("sortFunctionIds : nouveau tableau trié numériquement, entrée intacte", () => {
      const input = [`${M1}:0x10`, `${M1}:0x9`];
      const sorted = lineagePure.sortFunctionIds(input);
      expect(sorted).not.toBe(input);
      expect(sorted).toEqual([`${M1}:0x9`, `${M1}:0x10`]);
      expect(input).toEqual([`${M1}:0x10`, `${M1}:0x9`]);
    });

    test("communityContentId : déterministe, indépendant de l'ordre des membres, formule exacte", () => {
      const id = lineagePure.communityContentId("alg", "1", HEX64, [`${M1}:0x10`, `${M1}:0x9`]);
      expect(id).toMatch(/^[a-f0-9]{64}$/);
      expect(lineagePure.communityContentId("alg", "1", HEX64, [`${M1}:0x9`, `${M1}:0x10`])).toBe(id);
      expect(id).toBe(hash(canonical({ algorithm: "alg", algorithmVersion: "1", configFingerprint: HEX64, memberIds: [`${M1}:0x9`, `${M1}:0x10`] })));
      expect(lineagePure.communityContentId("alg", "2", HEX64, [])).not.toBe(id);
      expect(lineagePure.communityContentId("other", "1", HEX64, [])).not.toBe(id);
    });

    test("proposalEvidenceFingerprint : content-address exact sur version/source/result uniquement", () => {
      const evidence = { version: "l4-proposal-evidence-1", source: { s: 1 }, result: { r: 2 }, extra: "ignored" };
      const fp = lineagePure.proposalEvidenceFingerprint(cast<EvidenceArg>(evidence));
      expect(fp).toBe(hash(canonical({ version: evidence.version, source: evidence.source, result: evidence.result })));
      expect(lineagePure.proposalEvidenceFingerprint(cast<EvidenceArg>({ ...evidence, result: { r: 3 } }))).not.toBe(fp);
    });

    test("partitionProposalFingerprint : adopted forcé à false dans le digest", () => {
      const partition = { adopted: true, x: 1 };
      const fp = lineagePure.partitionProposalFingerprint(cast<PartitionViewArg>(partition));
      expect(fp).toBe(hash(canonical({ ...partition, adopted: false })));
      expect(lineagePure.partitionProposalFingerprint(cast<PartitionViewArg>({ ...partition, adopted: false }))).toBe(fp);
    });

    test("isSerializableProposalData : accessor d'objet plain instrumenté refusé sans invoquer son getter", () => {
      expect(lineagePure.isSerializableProposalData({ a: [1, "x", null, true, 1e20] })).toBe(true);
      expect(lineagePure.isSerializableProposalData({ a: NaN })).toBe(false);
      expect(lineagePure.isSerializableProposalData(Object.create(null))).toBe(false);
      const sparse: unknown[] = [1];
      Object.defineProperty(sparse, "x", { value: 1, enumerable: true });
      expect(lineagePure.isSerializableProposalData(sparse)).toBe(false);
      const cyclic: AnyRecord = {};
      cyclic.self = cyclic;
      expect(lineagePure.isSerializableProposalData(cyclic)).toBe(false);
      let calls = 0;
      const withGetter: AnyRecord = {};
      Object.defineProperty(withGetter, "a", { get: () => { calls += 1; return 1; }, enumerable: true });
      expect(lineagePure.isSerializableProposalData(withGetter)).toBe(false);
      expect(calls).toBe(0);
      expect(lineagePure.isSerializableProposalData({ [Symbol("s")]: 1 })).toBe(false);
      let deep: unknown = null;
      for (let index = 0; index < 200; index += 1) deep = { v: deep };
      expect(lineagePure.isSerializableProposalData(deep)).toBe(false);
      let shallow: unknown = null;
      for (let index = 0; index < 100; index += 1) shallow = { v: shallow };
      expect(lineagePure.isSerializableProposalData(shallow)).toBe(true);
    });

    test("isSerializableProposalData : Proxy vers cible plain vide ACCEPTÉ par le body legacy (pas de guard isProxy)", () => {
      // jsonData (lineage.ts:924-942) n'utilise pas utilTypes.isProxy : un Proxy sans trap vers
      // une cible plain vide passe les checks prototype/clés et rend true. Frontière retenue :
      // trusted code/loader, aucune garantie contre un import JS mutateur. Legacy inchangé :
      // ne PAS ajouter un guard au produit pour ce test (scope R2 finding 5).
      expect(lineagePure.isSerializableProposalData(new Proxy({}, {}))).toBe(true);
    });

    test("inspectProposalEvidence : refus fail-closed structurel (positif complet = fixture manquante)", () => {
      const refused = { wellFormed: false, admissible: false };
      expect(lineagePure.inspectProposalEvidence("x")).toEqual(refused);
      expect(lineagePure.inspectProposalEvidence({})).toEqual(refused);
      expect(lineagePure.inspectProposalEvidence({ a: NaN })).toEqual(refused);
      expect(lineagePure.inspectProposalEvidence({
        version: "l4-proposal-evidence-1", evidenceFingerprint: HEX64, source: {}, result: {},
      })).toEqual(refused);
      expect(lineagePure.inspectProposalEvidence({
        version: "other", evidenceFingerprint: HEX64, source: {}, result: {},
      })).toEqual(refused);
    });
  });

  describe("semantic-config-codec — empreinte, validité, provenance", () => {
    const config = () => ({
      rulesetVersion: "ff8-tech-syn-1", synonyms: true, bm25: { k1: 1.2, b: 0.75 }, topK: 10,
      scoreTieDecimals: 9, similarityThreshold: 0.45, maxPostingDf: 48, maxCandidates: 32,
      hubMinDegree: 8, hysteresis: 0.85,
      views: { structure: true, data: true, lexical: true, embeddings: true, validatedRelations: true, capabilities: true },
    });
    const encoder = () => ({ modelId: "m", tokenizerRevision: "t", parameterFingerprint: HEX64, dimension: 8, implementationSha256: HEX64, tokenizerSha256: HEX64 });

    test("configFingerprint : déterministe, ordre de clés indifférent, clés extra ignorées, config appelant non congelé", () => {
      const cfg = config();
      const fp = configCodec.configFingerprint(cast<ConfigArg>(cfg), null);
      expect(fp).toMatch(/^[a-f0-9]{64}$/);
      expect(configCodec.configFingerprint(cast<ConfigArg>(config()), null)).toBe(fp);
      const reordered: AnyRecord = {
        views: config().views, hysteresis: 0.85, hubMinDegree: 8, maxCandidates: 32, maxPostingDf: 48,
        similarityThreshold: 0.45, scoreTieDecimals: 9, topK: 10, bm25: { b: 0.75, k1: 1.2 },
        synonyms: true, rulesetVersion: "ff8-tech-syn-1",
      };
      expect(configCodec.configFingerprint(cast<ConfigArg>(reordered), null)).toBe(fp);
      expect(configCodec.configFingerprint(cast<ConfigArg>({ ...config(), extra: 1 }), null)).toBe(fp);
      expect(Object.isFrozen(cfg)).toBe(false);
    });

    test("configFingerprint : encodeur inclus seulement si views.embeddings ; sensibilité aux champs", () => {
      const fpNull = configCodec.configFingerprint(cast<ConfigArg>(config()), null);
      expect(configCodec.configFingerprint(cast<ConfigArg>(config()), cast<EncoderArg>(encoder()))).not.toBe(fpNull);
      const noEmbeddings = { ...config(), views: { ...config().views, embeddings: false } };
      expect(configCodec.configFingerprint(cast<ConfigArg>(noEmbeddings), cast<EncoderArg>(encoder())))
        .toBe(configCodec.configFingerprint(cast<ConfigArg>(noEmbeddings), null));
      expect(configCodec.configFingerprint(cast<ConfigArg>({ ...config(), topK: 11 }), null)).not.toBe(fpNull);
      expect(configCodec.configFingerprint(cast<ConfigArg>({ ...config(), bm25: { k1: 1.3, b: 0.75 } }), null)).not.toBe(fpNull);
    });

    test("validConfig : matrice exacte des bornes historiques", () => {
      expect(configCodec.validConfig(cast<ConfigArg>(config()))).toBe(true);
      const invalid = (patch: AnyRecord) => configCodec.validConfig(cast<ConfigArg>({ ...config(), ...patch }));
      expect(invalid({ rulesetVersion: "other" })).toBe(false);
      expect(invalid({ synonyms: "yes" })).toBe(false);
      expect(invalid({ bm25: { k1: 0, b: 0.5 } })).toBe(false);
      expect(invalid({ bm25: { k1: 101, b: 0.5 } })).toBe(false);
      expect(invalid({ bm25: { k1: NaN, b: 0.5 } })).toBe(false);
      expect(invalid({ bm25: { k1: 1.2, b: 1.1 } })).toBe(false);
      expect(invalid({ topK: 0 })).toBe(false);
      expect(invalid({ topK: 101 })).toBe(false);
      expect(invalid({ maxCandidates: 10001 })).toBe(false);
      expect(invalid({ maxPostingDf: 0 })).toBe(false);
      expect(invalid({ scoreTieDecimals: -1 })).toBe(false);
      expect(invalid({ scoreTieDecimals: 13 })).toBe(false);
      expect(invalid({ hubMinDegree: 0 })).toBe(false);
      expect(invalid({ similarityThreshold: 1.1 })).toBe(false);
      expect(invalid({ hysteresis: -0.1 })).toBe(false);
      expect(invalid({ views: { ...config().views, structure: "yes" } })).toBe(false);
      expect(configCodec.validConfig(null as unknown as ConfigArg)).toBe(false);
      expect(configCodec.validConfig(cast<ConfigArg>({ ...config(), views: undefined }))).toBe(false);
    });

    test("provenanceReady : matrice exacte (0x0 légal, 0x01 refusé, null réservé import/extractor)", () => {
      const provenance = (over: AnyRecord = {}) => ({
        moduleSha256: HEX64, siteRva: "0x1A", siteKind: "instruction", xrefType: "code",
        source: "ida", sourceVersion: "9", sourceHash: HEX64, evidenceSha256: HEX64, ...over,
      });
      expect(configCodec.provenanceReady(cast<ProvenanceArg>(provenance()))).toBe(true);
      expect(configCodec.provenanceReady(cast<ProvenanceArg>(provenance({ siteRva: null, siteKind: "import" })))).toBe(true);
      expect(configCodec.provenanceReady(cast<ProvenanceArg>(provenance({ siteRva: null, siteKind: "extractor" })))).toBe(true);
      expect(configCodec.provenanceReady(cast<ProvenanceArg>(provenance({ siteRva: "0x0" })))).toBe(true);
      expect(configCodec.provenanceReady(cast<ProvenanceArg>(provenance({ siteRva: "0x01" })))).toBe(false);
      expect(configCodec.provenanceReady(cast<ProvenanceArg>(provenance({ siteRva: null })))).toBe(false);
      expect(configCodec.provenanceReady(cast<ProvenanceArg>(provenance({ siteKind: "weird" })))).toBe(false);
      expect(configCodec.provenanceReady(cast<ProvenanceArg>(provenance({ xrefType: "maybe" })))).toBe(false);
      expect(configCodec.provenanceReady(cast<ProvenanceArg>(provenance({ moduleSha256: "ab" })))).toBe(false);
      expect(configCodec.provenanceReady(cast<ProvenanceArg>(provenance({ source: "" })))).toBe(false);
      expect(configCodec.provenanceReady(cast<ProvenanceArg>(provenance({ sourceVersion: "" })))).toBe(false);
      expect(configCodec.provenanceReady(cast<ProvenanceArg>(provenance({ evidenceSha256: "ab" })))).toBe(false);
      expect(configCodec.provenanceReady(null as unknown as ProvenanceArg)).toBe(false);
    });
  });

  describe("immutableSnapshot — copie séparée congelée, cycles vus, original intact (correction 4)", () => {
    test("copie profonde congelée ; l'original n'est jamais congelé", () => {
      const source = { a: { b: [1, 2] }, s: "x" };
      const snapshot = configCodec.immutableSnapshot(source);
      expect(snapshot).not.toBe(source);
      expect((snapshot as typeof source).a).not.toBe(source.a);
      expect(Object.isFrozen(snapshot)).toBe(true);
      expect(Object.isFrozen((snapshot as typeof source).a)).toBe(true);
      expect(Object.isFrozen((snapshot as typeof source).a.b)).toBe(true);
      expect(Object.isFrozen(source)).toBe(false);
      expect(Object.isFrozen(source.a)).toBe(false);
    });

    test("cycle heap-only supporté (seen-set), référence cyclique conservée dans la copie", () => {
      const cyclic: { name: string; self?: unknown } = { name: "c" };
      cyclic.self = cyclic;
      const snapshot = configCodec.immutableSnapshot(cyclic);
      expect(Object.isFrozen(snapshot)).toBe(true);
      expect(snapshot.self).toBe(snapshot);
      expect(Object.isFrozen(cyclic)).toBe(false);
    });
  });
});
