# BinaryTribunal

Deterministic, test-driven reverse engineering of FF8 battle systems with AI-assisted hypothesis generation and judgment.

## What this project is

This project implements a closed-loop epistemic engine for reverse engineering:

1. AI proposes a hypothesis.
2. A deterministic runner executes it against a live target process.
3. A separate judge model evaluates the evidence.
4. Documentation is updated when evidence is strong enough.

Instead of letting a model speculate, every claim is tested mechanically with runtime instrumentation.

## How hypotheses are tested

Each hypothesis becomes a deterministic scenario with:

- A defined claim
- A sequence of runtime actions
- Measurable outcomes

Typical runtime actions include:

- Reading and writing process memory
- Injecting runtime commands
- Setting and removing breakpoints
- Continuing execution and observing control-flow behavior

Typical outcomes include:

- Memory diffs
- Breakpoint hits
- Register and stack snapshots
- Explicit assertion pass/fail results

## Validation loop

- If evidence confirms the claim, the hypothesis is marked validated and can feed documentation updates.
- If evidence refutes the claim, it is rejected and new hypotheses are generated.
- If evidence is incomplete, the result is inconclusive and follow-up tests are created.

Core loop:

`AI proposes -> deterministic engine tests -> judge evaluates -> documentation evolves`

## Repository map

- `PLAN.md`: high-level architecture and implementation roadmap
- `ff8re/README.md`: executable hypothesis runner details, actions, assertions, CLI usage
- `tech/`: technical reverse engineering documentation
- `product/`: product/domain perspective documentation
- `ai-prompt/`: prompts for hypothesis generation and evidence-to-doc workflows

## Evidence policy

Evidence artifacts generated from live targets are intentionally kept local and excluded from version control for legal/compliance reasons.

## Current focus

The active direction is building and scaling deterministic executable hypotheses for FF8 battle behavior, especially action resolution, ATB flow, and G-Force invocation chains.
