# Implementation sibling

`re-ff8` is documentation, contracts, process, and the Oxygen vault (`obsidian-docs`, QMD collection `ff8-wiki`). It is not the ISO/battle implementation.

## Code repo (separate Serena + GrepAI project)

- Path: `C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated`
- Serena name: `FinalFantasy_VIII_Reimaginated`
- Languages: `cpp`, `python`
- GrepAI: isolated `.grepai/` in that repo (Ollama `nomic-embed-text`, gob). No GrepAI workspace. Do not run `grepai workspace add`.

## How to switch

1. Before any symbol search or edit in the implementation: `activate_project` with that absolute path (or name `FinalFantasy_VIII_Reimaginated`).
2. Search that code with GrepAI **from that directory** (`grepai search ...` cwd = implementation root). Do not reuse `re-ff8` GrepAI hits after the switch.
3. After implementation work, `activate_project` back to `C:/Users/djden/source/repos/retro-eng/re-ff8`.

## Do not merge

Do not add Reimaginated paths to this Serena `project.yml`. Do not share a GrepAI index. Context Mode for the Cursor workspace `re-ff8` stays scoped here; the vault stays on QMD `ff8-wiki`.
