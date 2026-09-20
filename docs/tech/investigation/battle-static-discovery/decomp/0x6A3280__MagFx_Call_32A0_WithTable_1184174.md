# MagFx_Call_32A0_WithTable_1184174 @ 0x6A3280

- Instr (live): 6 (19 o, 0x6A3280-0x6A3292)
- Palier: 1+P (2 voix c_a + semantic_a, verification parent P)
- Verdict: CERTAIN - wrapper trivial de forwarding cdecl : pousse la constante de table unk_1184174 puis arg_0, appelle sub_6A32A0 (2 args), retour EAX passthrough (add esp,8 @0x6A328F)
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: sub_6A3280\nTYPE ; proposition: MagFx_Call_32A0_WithTable_1184174
- Notes parent: checks 5.6 OK (role P) : 6 instr integrales lues au sol (0x6A3280-92), forwarding pur, xref data 0x6A2141 dans sub_6A1660 (ticker CERTAIN, table de handlers) ; convergence c_a/sem_a ; verdict UNCERTAIN de semantic_a leve par l'ancrage caller (constante 1184174 = contexte du callee, pas prouvable dans ce stub seul)

## C reconcilie

```c
// c_a.c — sub_6A3280 (stub, mode 1+P, voix c_a)
// Ground truth = live ASM (asm.asm), Hex-Rays = vérificateur seulement.
// Taille : 19 octets (0x6A3280..0x6A3292), 6 instructions.
// Sauvegardes de registres : aucune (pas d'EBX/ESI/EDI/EBP touché).

// === ASM live (0x6A3280) ===
// 6a3280  mov     eax, [esp+arg_0]      ; eax = 1er arg cdecl ([esp+4])
// 6a3284  push    offset unk_1184174    ; 2e argument (const globale)
// 6a3289  push    eax                   ; 1er argument repoussé en tête
// 6a328a  call    sub_6A32A0            ; cdecl -> 2 args sur la pile
// 6a328f  add     esp, 8                ; nettoyage des 2 pushes
// 6a3292  retn                          ; eax = retour de sub_6A32A0 (passthrough)

// Remarque ordre de push : unk_1184174 est poussé AVANT eax,
// donc côté callee : (eax, &unk_1184174) = (arg0, &unk_1184174).
// Concordant avec Hex-Rays (vérificateur OK, pas de divergence).

// Thunk de forwarding pur : famille mag FX battle (plage 0x6A2-3xxx).
// sub_6A3280 est référencé comme donnée à 0x6A2141 dans sub_6A1660
// (table de handlers / vtable, xref type "data").

int __cdecl sub_6A3280(int a1)
{
    return sub_6A32A0(a1, (int)&unk_1184174);
}

// UNCERTAIN 0x6A3292 largeur de retour exacte : eax est transmis tel quel
// depuis sub_6A32A0 ; la largeur réelle (int / char via AL / WORD) dépend
// du prototype de sub_6A32A0, non fourni dans ce pack (callees.txt vide
// côté PROTOS). `int` retenu par défaut, à réconcilier avec c_b/c_c.
// UNCERTAIN unk_1184174 : rôle de la donnée globale inconnu (globals.txt vide) ;
// probablement contexte/statique de la magie FX, non prouvé ici.
```

## Analyse semantique

# Sémantique sub_6A3280 @ 0x6A3280 (analyse A, mode 1+P aveugle)

- Rôle (1 phrase) : wrapper/thunk trivial qui transmet son unique argument cdecl à sub_6A32A0 en y ajoutant la constante de table `unk_1184174` (argc unique, appel direct, retour EMPHASISdirect de la cible).
- In / Out / Effets :
  - In (cdecl) : 1 arg (arg_0, dword) — probablement un index/handle ou un pointeur de contexte consommé par sub_6A32A0.
  - Out : retour = valeur de retour de sub_6A32A0 (largeur non vérifiable : pas de `movsx/movzx` avant `retn`, stub passe-partout, `eax` simplement renvoyé tel quel — compat. 32-bit attendue).
  - Effets de bord : empile `0x1184174` (constante absolue, adresse de table) + `arg_0`, `add esp, 8` puis `retn` — aucun état global touché localement, aucun registre callee-saved altéré.
- Verdict : **UNCERTAIN** (mode 1+P exige CERTAIN ; non atteint). Raisons :
  1. Unseul xref, et en type **data** (0x6a2141 dans sub_6A1660) → appel indirect via table, pas d'appel direct descendant certifiable.
  2. Aucun prototype pour sub_6A32A0 (callees.txt sans ligne PROTOS).
  3. Aucune corroboration wiki/qmd sur `unk_1184174` ou sur la plage 0x6A3xxx (recherches négatives).
  C'est fonctionnellement un thunk 1:1 vers sub_6A32A0, mais le sens de `arg_0` et le contenu de `unk_1184174` ne sont pas tranchables depuis ce stub seul.
- Nom proposé (markdown seul, pas de rename) : `MagFx_Call_32A0_WithTable_1184174` — justifié par :
  - `0x6a3284 push offset unk_1184174` : constante de table explicite passée en argument (preuve ASM 1).
  - `0x6a328a call sub_6A32A0 ; 0x6a328f add esp, 8 ; 0x6a3292 retn` : forwarding cdecl pur sans logique propre (preuve ASM 2).
  - Xref **data** unique (0x6a2141, dans sub_6A1660) cohérent avec un pointeur de fonction référencé depuis une table/vtable MAGIC-FX, dans la famille mag FX battle 0x6A2–3xxx (preuve callers.txt).
- Preuves (ASM cité, 3 minimum) :
  1. `0x6a3280 mov eax, [esp+arg_0]` — lit l'unique argument cdecl.
  2. `0x6a3284 push offset unk_1184174` — ajoute une constante de table comme 2e argument (ordre droite→gauche : c'est le 1er arg poussé, donc l'arg le plus haut dans la signature attendue).
  3. `0x6a3289 push eax` — re-push son propre argument pour le forwarder intact.
  4. `0x6a328a call sub_6A32A0` — appel direct unique, cible non renommée dans callees.txt.
  5. `0x6a328f add esp, 8 ; 0x6a3292 retn` — purge 2 slots (2 args cdecl poussés), retour automatique de la valeur de sub_6A32A0 dans eax.
  6. callers.txt : xref unique, type **data**, site 0x6a2141 dans sub_6A1660 (size 0x10f9) → référencé comme pointeur depuis une table, pas appelé direct.
- Checks :
  - Callees cités présents dans callees.txt : **oui** — `sub_6A32A0` apparaît ligne `CALL/ADD-ESP` (0x6a328a / 0x6a328f).
  - Largeur de retour : non déterminable depuis le stub (pas de `movzx/movsx` ni de sign-extension avant `retn`, l'eax passe tel quel) → signale 32-bit ambiguous.
  - Aucun accès global, aucun push de registre callee-saved : pure forwarding function.
- Limites mode aveugle :
  - hexrays.c masqué par contrat → pas de vérification du prototype réconcilié IDA.
  - wiki.md vide (échec qmd au moment du pack), qmd direct `ff8-wiki` sans hit pour `sub_6A3280`/`unk_1184174`/`0x6A32A0`.
  - Contexte famille "mag FX battle" heuristique (plage 0x6A2-3xxx) jamais confirmé par une preuve directe du pack.
- IDBCOMMENT: Petit wrapper transmettant un seul argument cdecl a sub_6A32A0 avec en plus la table fixe 0x1184174. Aucune logique locale, retour direct de la cible. Reference unique en tant que pointeur de donnees dans sub_6A1660, famille mag FX battle. [semantic-triple 2026-09-20]
