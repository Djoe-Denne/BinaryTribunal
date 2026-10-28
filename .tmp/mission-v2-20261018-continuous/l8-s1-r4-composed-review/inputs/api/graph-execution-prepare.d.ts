// Parent public API projection: types/signatures/literal protocol tags only; no implementation.
import type { PlannerPolicy } from "./planner";
import type { CodecResult, ReadonlyData, ExecutionPreparationBodyV1, IndependentlyLoadedSourcesV1, ParsedExecutionEnvelopeV1, ParsedGraphRunV3 } from "./graph-execution-envelope";
export interface ExecutionPreparationRequestV1 {
    body: ExecutionPreparationBodyV1;
    independentSources: IndependentlyLoadedSourcesV1;
    policy: PlannerPolicy;
}
export interface PreparedExecutionV1 {
    origin: ParsedExecutionEnvelopeV1;
    run: ParsedGraphRunV3;
}
export declare function prepareExecutionV1(request: ExecutionPreparationRequestV1): CodecResult<ReadonlyData<PreparedExecutionV1>>;
