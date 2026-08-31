# Waiver ledger template

Copy this block into the session note or evidence file **before**
injection. One row per contract item. Do not leave a SET-ASIDE row
without `evidence` or `sq`.

```text
gate:
candidate_source:
candidate_dll_sha256:          # fill after RelWithDebInfo build
policy_status:
review_or_test_pack:
date:

# item id | bucket | claim | evidence or SQ | safety still live? | blocks promotion?
```

## Row fields

| Field | Rule |
| --- | --- |
| `id` | Stable id (`T22-04`, `U22.7`, `SQ-G22-003`, policy key) |
| `bucket` | `LIVE-REQUIRED` \| `SET-ASIDE-VERIFIED` \| `SET-ASIDE-CERTAIN-UNKNOWN` |
| `claim` | The contract sentence being classified, quoted or paraphrased tightly |
| `evidence` | Offline test name, evidence path, or commit. Required for VERIFIED |
| `sq` | Open SQ id. Required for CERTAIN-UNKNOWN |
| `fail_closed_live` | `yes` if live still checks "not written / named refuse". Default `yes` for CERTAIN-UNKNOWN |
| `blocks_promotion` | `yes` if this row is in `[promotion.Gxx].required` and is not green |

## Validity checks

Reject the ledger if any of these hold:

- A hard-law row is marked SET-ASIDE
- `SET-ASIDE-VERIFIED` has neither test name nor evidence path
- `SET-ASIDE-CERTAIN-UNKNOWN` has no SQ / catalog gap named
- `fail_closed_live` is `no` on a residual the gate might write
- Two DLL hashes appear under one `candidate_dll_sha256`
- The live card contains a SET-ASIDE scenario

## After-action addendum

Append, do not rewrite:

```text
process_id:
dll_sha256_observed:
actions_run:
safety_red:
remaining_live_required:
promotion_decision: no | constrained-live-anchor | live-promoted
```
