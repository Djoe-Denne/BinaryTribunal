// Parent public API projection: types/signatures/literal protocol tags only; no implementation.
import type { FunctionNodeV1, FunctionEdgeV1, ReferencedObjectV1, UnresolvedReferenceV1, CapabilityFactV1 } from "./graph";
import type { GraphSnapshotView } from "./semantic-index";
import type { PlannerGraphInput, PlannerGroupInput } from "./planner";
import type { GroupConfig, GroupMetrics } from "./investigation-groups";
import type { CodecResult, ReadonlyData } from "./graph-execution-envelope";
export interface CommunityBindingV1 {
    version: "l8-community-binding-v1";
    groups: Array<{
        groupId: string;
        communityContentId: string;
        kernelIds: string[];
        parentContentIds: string[];
        capabilityIds: string[];
        memberMaturity: Array<{
            functionId: string;
            semanticMaturity: FunctionNodeV1["semanticMaturity"];
        }>;
    }>;
}
export interface FullContextByGroupV1 {
    version: "l8-full-context-by-group-v1";
    groups: Array<{
        groupId: string;
        functionIds: string[];
        nodes: FunctionNodeV1[];
        edges: FunctionEdgeV1[];
        objects: ReferencedObjectV1[];
        unresolved: UnresolvedReferenceV1[];
        capabilities: CapabilityFactV1[];
    }>;
}
export interface ContextOmissionsV1 {
    version: "l8-context-omissions-v1";
    byGroup: Array<{
        groupId: string;
        functionIds: string[];
    }>;
    byCommunity: Array<{
        communityContentId: string;
        functionIds: string[];
    }>;
}
export interface DecodedGroupSourceV1 {
    groupingConfig: GroupConfig;
    groupingMetrics: GroupMetrics;
    communityBinding: CommunityBindingV1;
    fullContextByGroup: FullContextByGroupV1;
    contextOmissions: ContextOmissionsV1;
}
export interface ExecutionProjectionV1 {
    graph: PlannerGraphInput;
    groups: PlannerGroupInput[];
    partitionId: string;
    regime: "A" | "B";
    snapshotView: GraphSnapshotView;
    proposalAdmissible: boolean | null;
    sourceBindings: {
        snapshotFingerprint: string;
        partitionStoreDigest: string;
        proposalFingerprint: string;
        groupMetricsFingerprint: string;
        fullContextFingerprint: string;
    };
}
export declare function projectGraphSnapshotViewV1(fullSnapshot: unknown): CodecResult<ReadonlyData<GraphSnapshotView>>;
export declare function projectExecutionSourcesForL5V1(fullSnapshot: unknown, rawTransport: unknown, rawGrouping: unknown, rawPolicy: unknown, rawContext: unknown): CodecResult<ReadonlyData<ExecutionProjectionV1>>;
export declare function projectRegimeBForL5(fullSnapshot: unknown, transport: unknown, grouping: unknown, policy: unknown, context: unknown): CodecResult<ReadonlyData<ExecutionProjectionV1>>;
