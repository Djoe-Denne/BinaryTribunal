# MagFx_Call_32A0_WithTable_11843DC @ 0x6A33C0

- Instr (live): 6 (19 o, 0x6A33C0-0x6A33D2)
- Palier: 1+P (2 voix c_a + semantic_a, verification parent P)
- Verdict: CERTAIN - wrapper trivial de forwarding cdecl : pousse la constante de table unk_11843DC puis arg_0, appelle sub_6A32A0 (2 args), retour EAX passthrough (add esp,8)
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: sub_6A33C0\nTYPE ; proposition: MagFx_Call_32A0_WithTable_11843DC
- Notes parent: checks 5.6 OK (role P) : 6 instr integrales lues au sol, forwarding pur, xref data 0x6a2137 dans sub_6A1660 (ticker CERTAIN, table de handlers mag FX) ; convergence c_a/sem_a ; verdict UNCERTAIN de semantic_a leve par l'ancrage caller (jumeaux 0x6A3280/0x6A33E0 fermes, cluster 1184174/11843DC/1184694)

## C reconcilie

```c
// voxB 0x6A33C0 — stub, mode 1+P
// Ground truth = live ASM (asm.asm) — Hex-Rays (hexrays.c) utilisé comme vérificateur SEULEMENT.
// Taille live : 0x13 (19 octets), 6 instructions, aucune sauvegarde de registre callee-saved
// (EAX est recalcule, EBP/EBX/ESI/EDI non touches, pas de prologue/epilogue).

// Proto Hex-Rays : int __cdecl sub_6A33C0(int a1) — compatible ASM (arg_0 lu dans EAX,
// retn immediat, retour passe par EAX depuis sub_6A32A0, gcc/cdecl nettoyage caller

// ASM live :
//   6a33c0  mov eax, [esp+arg_0]        ; EAX = a1
//   6a33c4  push offset unk_11843DC     ; arg2 @unk_11843DC (push droite->gauche)
//   6a33c9  push eax                    ; arg1 = a1
//   6a33ca  call sub_6A32A0             ;
//   6a33cf  add esp, 8                  ; nettoyage cdecl caller de 2 args
//   6a33d2  retn                        ; retour EAX de sub_6A32A0 tel quel

// unk_11843DC : donnee statique de la famille mag FX battle (plage 0x6A2-3xxx) — role exact non prouve.
// Referencé en offset, jamais dereferencee; passer le pointeur tel quel.

int __cdecl sub_6A33C0(int a1)
{
  // thunk pur : transmet a1 en arg1 et l'offset statique unk_11843DC en arg2
  return sub_6A32A0(a1, (int)&unk_11843DC); // 8-bit  -> eax = retour de sub_6A32A0
}
// UNCERTAIN 0x6A33C0 : largeur de retour exacte — stub court, le type IDA est 'None'; genre de retour EAX = celui de sub_6A32A0, largeur non prouvable depuis ce stub seul.
// UNCERTAIN 0x6A33C0 : role de unk_11843DC (donnee statique 0x11843DC) et de son ԥ correpondance dans la famille mag FX battle.
```

## Analyse semantique

# Sémantique sub_6A33C0 @ 0x6A33C0 (analyse A, mode aveugle 1+P)

- Rôle (1 phrase) : thunk cdecl à 1 argument qui appelle `sub_6A32A0` avec `(arg0, &unk_11843DC)` — un wrapper "1er argument pré-lié" (partial binding) vers un worker de la famille magie/effets battle.
- Verdict : **UNCERTAIN** — l'ASM est limpide (6 instr, tous opcodes cités ci-dessous) mais CERTAIN exige callers + callees + wiki alignés ; ici `wiki.md` est vide (échec qmd) et l'unique caller est un xref **data** (0x6a2137 dans sub_6A1660, taille 0x10F9), donc ni signataire d'appel ni prototype de callee analysable. Le contenu du worker sub_6A32A0 n'est pas dans le pack.
- Nom catalogue : aucun nom fourni ; proposition (markdown seul, PAS de rename) : `MagicFX_BindAndCallSub_6A32A0_With_11843DC` — trop anecdotique ; un nom de type `MagicFX_FxCallbackThunk_C0` reflète mieux le rôle de thunk référencé en data. Ne pas affubler d'un nom `MAgic::Spawn*` sans preuve.
- In / Out / Effets :
  - In : 1 arg cdecl `[esp+4]` (pointeur inconnu, probablement handle/contexte).
  - Out : reth nue, EAX = retour exact de sub_6A32A0 (largeur = celle du callee, inconnue ici ; return-address renvoyée telle quelle).
  - Effets : passe `offset unk_11843DC` (donnée globale constante) comme 2e arg au worker ; nettoie 8 octets d'arg (`add esp,8`).
- Preuves ASM (adresses exactes) :
  1. `6a33c0 mov eax,[esp+arg_0]` — lit le 1er (et seul) argument cdecl : wrapper 1-arg.
  2. `6a33c4 push offset unk_11843DC` — constante globale pré-liée poussée en 2e position (arg2 du callee).
  3. `6a33c9 push eax` — arg1 = l'argument du caller, poussé après (donc transmis en 1er position cdecl au callee).
  4. `6a33ca call sub_6A32A0` — callee présent dans callees.txt (ligne `6a33ca call sub_6A32A0`), cohérent.
  5. `6a33cf add esp,8` — callee presumed cdecl stdcall à 2 args ; cleanup exact.
  6. `6a33d2 retn` — pas de retn imm : caller nettoie ses 4 octets d'arg → cdecl ; EAX du callee propagé.
  7. Caller xref `0x6a2137 type=data` (fn sub_6A1660, taille 0x10F9) — référence de table/pointer de handler, pas appel direct.
- Checks : callees cités présents dans callees.txt : oui (`sub_6A32A0`). Largeur retour : EAX propagé sans modification, largeur == sub_6A32A0 (indéterminée depuis le pack seul).
- IDBCOMMENT: thunk a un argument cdecl qui relaye l appel vers 6A32A0 avec une donnee globale fixe 11843DC passe en second argument. Serv de wrapper partiel pre-lie, reference par pointeur dans sub_6A1660. Le retour du callee est retourne tel quel. [semantic-triple 2026-09-20]
- Questions ouvertes : prototype/contenu de sub_6A32A0 ; sémantique de unk_11843DC ; comment le pointeur data à 0x6a2137 est invoqué dans sub_6A1660.
