/** The only S1 producer entry. Never re-export this from either pure codec module. */
import { planMission, type PlannerPolicy } from "./planner";
import { bindExecutionPreparationV1, bindExecutionSourcesV1, makeBoundDocumentV1, sealExecutionEnvelopeV1, makeGraphRunV3,
  EXECUTION_DOCUMENT_KINDS_V1, assertExecutionJsonV1, type CodecResult, type ReadonlyData, type ExecutionPreparationBodyV1,
  type IndependentlyLoadedSourcesV1, type ParsedExecutionEnvelopeV1, type ParsedGraphRunV3 } from "./graph-execution-envelope";
import type { PlannerGraphInput, PlannerGroupInput, AdmissionBudgetContextV1 } from "./planner";

export interface ExecutionPreparationRequestV1 {
  body: ExecutionPreparationBodyV1; independentSources: IndependentlyLoadedSourcesV1; policy: PlannerPolicy;
}
export interface PreparedExecutionV1 { origin: ParsedExecutionEnvelopeV1; run: ParsedGraphRunV3 }

/** New preparation only. Parsing/loading/exporting an origin cannot reach this module. */
export function prepareExecutionV1(request: ExecutionPreparationRequestV1): CodecResult<ReadonlyData<PreparedExecutionV1>> {
  try {
    assertExecutionJsonV1(request);
    const bound = bindExecutionPreparationV1(request.body, request.independentSources, request.policy);
    if (!bound.ok) return bound;
    if (bound.value.projection.regime === "B" && bound.value.projection.proposalAdmissible !== true)
      return { ok: false, reasons: ["l8-prepare: B evidence is negative/unknown; no plan or execution prepared"] };
    // Inputs are detached after complete source checks. These assertions remove deep readonly,
    // not a regime or a scientific contract; planMission accepts graph/groups, never an A partition.
    const graph = structuredClone(bound.value.projection.graph) as PlannerGraphInput;
    const groups = structuredClone(bound.value.projection.groups) as PlannerGroupInput[];
    const context = structuredClone(bound.value.body.admissionSource.context) as AdmissionBudgetContextV1;
    const planning = planMission(graph, groups, structuredClone(request.policy), context);
    const sealed = sealExecutionEnvelopeV1({ ...structuredClone(bound.value.body),
      planning: makeBoundDocumentV1(EXECUTION_DOCUMENT_KINDS_V1.planning, planning) });
    if (!sealed.ok) return sealed;
    const checked = bindExecutionSourcesV1(sealed.value, request.independentSources);
    if (!checked.ok) return checked;
    const run = makeGraphRunV3(sealed.value); if (!run.ok) return run;
    return { ok: true, value: Object.freeze({ origin: sealed.value, run: run.value }) as ReadonlyData<PreparedExecutionV1> };
  } catch (e) {
    return { ok: false, reasons: [e instanceof Error ? e.message : "l8-prepare: unreadable source"] };
  }
}
