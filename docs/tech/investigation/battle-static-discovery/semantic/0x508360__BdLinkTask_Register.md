# BdLinkTask_Register @ 0x508360 — tranchage CONFLICT (2+1 solo réduit)

- Confiance: CERTAIN (tranché contre l'ASM live)
- Mode: 2+1 réduit solo (A+B non spawnables) : dérivation parent double passe + §5.6 live ; R synthèse = parent
- Verdict CONFLICT : CONTRE L'ASM — allocation + append en queue, pas unregister/reregister.
- Push IDB: oui, [semantic-triple 2026-10-08], pas de rename
- Preuves §5.6 parent (live IDB 2026-10-08):
  - `508362 mov edi, [esp+arg_0]` (list_head) ; `508367 call sub_5083C0(list_head)` → esi = nœud alloué (allocateur)
  - `508375 jz | FAILED !!!!` — allocator debug path au sec (`OutputDebugString_1`"BdLinkTask: FAILED !!!!\n") si nul (5083a4-5083b1)
  - `50837b or byte ptr [esi],1` — flag bit0 posé ; `50837e` : `[nœud+8]` = callback
  - Append en queue : `[list_head+4]` (tail) ; jz = first insert ; insertion fin `tail->next = nœud ; tail = nœud` ; sinon 50839a premier nœud (`head` ET `tail` = nœud)
  -.sz de bœuf nœud ≥ 0xC octets = {flag/next?,u16,u32 pas s'entête, u32 `[esi+4]`, callback @+8}
  - cdecl, 2 args (`list_head`, callback), 2 pushes symétriques, `retn` sans imm16 ; retour EAX = nœud alloué
- Notes parent: CONFLICT résolu : rôle = CREATE (fonctionnement Recruite + register) ; l'ancien stocké « nœud déjà > callback » était barred.

## Analyse réconciliée

# Sémantique BdLinkTask_Register @ 0x508360

- Rôle (1 phrase) : alloue un nœud de tâche via `sub_5083C0(list_head)`, pose son bit0 flag/callback, l'append en queue des deux listes (`tail==NULL ? head=t=nœud : tail->next=t ; tail=nœud` configurable par "list_head"). retour peu important *(null si allocation échoué + OutputDebugString debug ; debug : 5083a4-5083b1 (debug) ; retour = nœud|nullpas important).*
- In / Out / Effets : cdecl, 2 args `list_head, callback` ; retour EAX = nœud (32 bits).
- Preuves : cf. §5.6 (5 items) + `or byte 1` à 0000b8d.
- Questions ouvertes : sémantique complète du champ bit0 dans la famille BdLinkCallbacks (0x5A6D20 est déjà suivi) ; ret sub_5083C0 → allocation contre le freelist du list_head.
