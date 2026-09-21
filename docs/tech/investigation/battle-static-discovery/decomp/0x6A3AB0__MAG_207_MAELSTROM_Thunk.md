# MAG_207_MAELSTROM_Thunk @ 0x6A3AB0

- Instr (live): 5 (14 o, 0x6A3AB0-0x6A3ABD)
- Palier: 1+P (2 voix c_a + semantic_a, verification parent P + sondes)
- Verdict: CERTAIN - thunk d'entree de la table battle-FX MagicList_Logic (xref data 0xC81AAC = slot effet 207, base 0xC81774+206*4) : transfere tel quel son unique argument cdecl au corps reel sub_6A3AE0 et en restitue la valeur (gabarit byte-identique au thunk MAG_212 0x6A0D20 ferme CERTAIN)
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: MAG_207_MAELSTROM\nTYPE ; proposition: MAG_207_MAELSTROM_Thunk
- Notes parent: checks 5.6 OK (role P) : 5 instr integrales lues au sol (0x6A3AB0-BD), forwarding pur, xref data 0xC81AAC (slot 207), callee unique sub_6A3AE0 dans callees.txt ; CERTAIN pose par la voix (corrobore par magic-registry.json + gabarit famille)

## C reconcilie

```c
// ============================================================================
// c_a.c — MAG_207_MAELSTROM @ 0x6A3AB0 (stub MAG_207, mode 1+P)
// Ground truth = live ASM (asm.asm) + ida_dump_bytes, not Hex-Rays.
// Live size: 0x0E bytes (14), 5 instructions, .text @ 0x6A3AB0.
// IDA type: int __cdecl(int). No register saves (no push ebx/esi/edi, no ebp).
// ============================================================================

// Live ASM (Intel, labels IDA):
//   6a3ab0  mov     eax, [esp+arg_0]
//   6a3ab4  push    eax
//   6a3ab5  call    sub_6A3AE0
//   6a3aba  add     esp, 4          ; callee is __cdecl, caller cleans the stack
//   6a3abd  retn                    ; return value = EAX from sub_6A3AE0

// External callee: body of the MAG_207 effect (real implementation).
// Role proven by call + add esp,4 + direct return of EAX (pure forwarding thunk).
// Signature width of sub_6A3AE0: takes 1 dword arg (single push), returns via EAX.
extern int sub_6A3AE0(int a1); // UNCERTAIN 0x6A3AE0 exact prototype of the body: 1 dword arg confirmed by the single push, but the arg/return semantic type (pointer vs int) is not provable from this thunk alone

// __cdecl: caller cleans args (add esp, 4 after call) — matches live ASM.
// Return width: EAX (32-bit) — matches IDA type 'int __cdecl(int)'.
int __cdecl MAG_207_MAELSTROM(int arg_0)
{
    int eax;

    eax = sub_6A3AE0(arg_0);    // thunk pur: forward unique arg, return EAX untouched
    return eax;
}

// Notes:
// - Pure forwarding stub (§0.1 schema stub -> body): no logic of its own.
// - Single xref: data ref from 0xC81AAC = MagicList_Logic table (0xC81AC0 + id*4,
//   id = -5 -> slot MAG_207... slot index 0xFFFFFFFF*4 wraps; entry at 0xC81AAC
//   is the dispatch slot for this spell). No code callers found in-pack.
// - Family context: table 0xC81AC0+id*4 = MagicList_Logic; MAG_212 entry
//   (0xC81AC0+0x10) @0x6A0D20 is a proven pure thunk to the same body pattern.
// - Hex-Rays check: matches live ASM (forward + return). No divergence.
// - No globals touched, no stack frame beyond the incoming arg.
```

## Analyse semantique

# Sémantique MAG_207_MAELSTROM @ 0x6A3AB0 (analyse A, mode aveugle)

- Rôle (1 phrase) : thunk d'entrée de la table battle-FX `MagicList_Logic` (slot effet 207) qui transfère tel quel son unique argument cdecl au corps réel `sub_6A3AE0` et en restitue la valeur de retour.
- Confiance : CERTAIN
- Nom catalogue : confirme — la partie `MAG_207` est prouvée par données adresées (xref `0xC81AAC` = `MagicList_Logic[206]` = magic_id 207 en 1-based, cf. preuves 4–6) ; le libellé `MAELSTROM` est un libellé de catalogue (registre statique repo, wiki.md du pack vide) non démontrable depuis l'ASM seul, sans contradiction détectée. Nom alternatif descriptif (markdown seul, pas de rename) : `MAG_207_Logic_Thunk_To_sub_6A3AE0` — inutile en pratique, le nom catalogue est correct.
- In / Out / Effets :
  - In (cdecl) : 1 arg int `[esp+arg_0]` (= `[esp+4]` à l'entrée) — le contexte d'action/effet passé aux callbacks logic (`int(__cdecl*)(int)`, doc `magic_effect_table.md` : « State 3 invokes g_GfActiveCallbackPtr(ctx) »).
  - Out : int 32-bit — EAX de `sub_6A3AE0` inchangé (le thunk ne touche pas EAX après le call) ; `retn` sans n → l'argument reste à la charge de l'appelant (cdecl).
  - Effets : aucun propre — empile l'arg, délègue tout au corps `sub_6A3AE0`, purge uniquement son propre push (`add esp,4`).

- Preuves (ASM cité, adresses exactes) :
  1. `6a3ab0 mov eax, [esp+arg_0]` — lecture du 1er argument cdecl ; aucun autre accès à la pile d'entrée.
  2. `6a3ab4 push eax` + `6a3ab5 call sub_6A3AE0` — forward exact d'un seul arg int au corps réel ; callee présent dans callees.txt (`6a3ab5 call sub_6A3AE0`), arête confirmée dans battle-graph-ledger.json (`source_va 0x6A3AB0 → target_va 0x6A3AE0`).
  3. `6a3aba add esp, 4` + `6a3abd retn` — purge du push interne, retour immédiat : motif forwarder manuel 14 octets (meta SIZE 14, `end_va_exclusive 0x6A3ABE`), EAX = retour du corps (largeur 32-bit passthrough).
  4. callers.txt : unique xref = **data** à `0xC81AAC`, aucun caller code → entrée de table de pointeurs, cohérent avec le dispatch par callback résolu (`BattleGF_LoadCallbackByMagicID @ 0x50AF20`).
  5. Doc repo `docs/tech/reference/magic_effect_table.md` : `MagicList_Logic @ 0xC81774`, 400 entrées `int(__cdecl*)(int)` ; calcul `0xC81AAC − 0xC81774 = 0x338 = 206×4` → slot 0-based 206 = **magic_id 207** (1-based, idx = magicID−1) — colle exactement le xref data.
  6. `magic-registry.json` (entry MAG_207) : `magic_id_1based: 207`, `slot_index_0based: 206`, `slot_va: 0xC81AAC` (identique au xref IDA), `pointer_va: 0x6A3AB0`, validité `valid_function_start`.
  7. `battle-graph-ledger.json` : `byte_identical_target_vas` de 0x6A3AB0 inclut `0x6A0D20` — le thunk MAG_212 fermé CERTAIN (même gabarit famille) ; `HANDOFF_gfx-pipeline-decomp.md` L22 : « 0x6A3AB0/0x6A3AC0 (MAG_207) suivent le gabarit stub MAG_xxx (cf. 0x6A0D20/0x6A0D30 fermés) », corps suivant `0x6a3ae0(41)`.

- Checks :
  - Callees cités présents dans callees.txt : OUI — `sub_6A3AE0` (ligne `6a3ab5 call sub_6A3AE0`) ; aucun autre callee, aucune libcall supposée.
  - Largeur retour : int 32-bit (EAX passthrough), cohérent avec le type IDA `int __cdecl(int)` et le contrat `MagicList_Logic` `int(*)(int)`.
  - Nuance : registre `is_thunk: false` côté IDA — sans incidence : le motif ASM (call+retn, pas de jmp) est un forwarder explicite avec retour normal à l'appelant.

- Questions ouvertes :
  - wiki.md du pack vide (échec qmd à la génération) — la jambe « wiki » du barème est couverte ici par les docs repo (`magic_effect_table.md`, `magic-registry.json`, `battle-graph-ledger.json`, `HANDOFF_gfx-pipeline-decomp.md`), tous alignés sans divergence.
  - Libellé `MAELSTROM` : provenance kernel (nom de sorti pour effect_id 207) non vérifiable depuis l'ASM ; aucun conflit, réévaluation uniquement si un contrôle kernel dédié contredit le registre.
  - Contenu de `sub_6A3AE0` (41 instr.) non analysé (hors scope aveugle) — la mécanique interne de l'effet 207 reste à qualifier.
  - Écart arithmétique du contexte orchestrateur (« 0xC81AC0+0x14 ») vs preuves adresées (slot réel `0xC81774+0x338 = 0xC81AAC`) — sans incidence sur le verdict (xref + registre concordent), à corriger dans le contexte.

- IDBCOMMENT: Stub d'entree de la table MagicList_Logic (slot 0xC81AAC, effet 207) : lit son unique argument cdecl, l'empile et appelle le corps reel sub_6A3AE0, puis purge son push et retourne EAX sans le modifier. Aucune logique propre ; sert de point d'entree dispatch de l'effet de combat 207 (MAELSTROM au catalogue). [semantic-triple 2026-09-21]
