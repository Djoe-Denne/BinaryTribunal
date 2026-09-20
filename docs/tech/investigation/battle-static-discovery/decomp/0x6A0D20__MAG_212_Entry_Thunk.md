# MAG_212_Entry_Thunk @ 0x6A0D20

- Instr (live): 5 (14 o, 0x6A0D20-0x6A0D2D)
- Palier: 1+P (2 voix c_a + semantic_a, verification parent P)
- Verdict: CERTAIN - stub d'entree de la magie 212 (xref data unique table 0xC81AC0 = MagicList_Logic[0xC81AC0], cf. MAG_212_Timeline_Tick 0x6A1660 fermee) : thunk cdecl pur qui retransmet arg_0 au corps reel sub_6A0D50 et retourne son EAX sans modification
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: MAG_212_UNK8\nTYPE ; proposition: MAG_212_Entry_Thunk
- Notes parent: checks 5.6 OK (role P) : 5 instr integrales lues au sol (0x6A0D20-2D), forwarding pur, xref data 0xC81AC0, callee unique sub_6A0D50 dans callees.txt ; convergence c_a/sem_a (CERTAIN pose par la voix)

## C reconcilie

```c
// ============================================================================
// MAG_212_UNK8 @ 0x6A0D20  (stub MAG_212, table magie 0xC81AC0 -> slot 212)
// Taille : 14 octets (0x6A0D20..0x6A0D2D inclus)
// IDA type : int __cdecl(int)  |  Hex-Rays : void* __cdecl(unsigned __int8*)
//
// Ground truth = live ASM (asm.asm), Hex-Rays = vérificateur SEULEMENT.
// Schéma §0.1 : stub MAG_xxx -> thunk vers le corps réel (ici sub_6A0D50).
// ============================================================================

// ASM live (Intel, labels IDA) :
//   6a0d20  mov     eax, [esp+arg_0]
//   6a0d24  push    eax
//   6a0d25  call    sub_6A0D50
//   6a0d2a  add     esp, 4
//   6a0d2d  retn

// Convention : cdecl. Arg unique 32 bits lu AVANT le push (après push il
// serait à [esp+4], d'où le `mov eax` préalable — pas d'optimisation spéciale,
// simple pass-through). `add esp, 4` = nettoyage stack par le caller-appelé
// conforme cdecl, cohérent avec le 1 arg poussé.

// Retour : EAX tel que rendu par sub_6A0D50 (retn sans toucher EAX).
// Largeur exacte inconnue depuis ce thunk seul : si sub_6A0D50 ne remplit
// qu'AL (pattern Battle_GetRandomInt), les bits hauts d'EAX sont résiduels.
// UNCERTAIN 0x6A0D2D largeur de retour effective (EAX 32 bits vs AL only) ?
// Dépend du corps de sub_6A0D50 (0x6A0D50), non fourni dans ce pack.

// Xref unique : donnée @ 0xC81AC0 (table des stubs magie, slot 212) — aucun
// caller direct en code. Paramètre traité comme pointeur en pratique
// (Hex-Rays : unsigned __int8*), mais l'ASM ne fait que copier un dword.

// Rôle (famille mag FX battle, mode 1+P) : stub d'entrée MAG_212, thunk
// pur vers le corps réel sub_6A0D50 (0x6A0D50). Aucune logique propre.
// NOTE: Hex-Rays signe le paramètre `unsigned __int8*` mais la seule vérité
// live est un pass-through dword ; le pointage 0xC81AC0 est cohérent avec
// MAG_212 (magie 212, cf. MAG_212_Timeline_Tick 0x6A1660).

int __cdecl MAG_212_UNK8(int arg_0)   // arg passé tel quel à sub_6A0D50
{
    return sub_6A0D50(arg_0);         // 6a0d25 : thunk, retour EAX du callee
}
```

## Analyse semantique

# Sémantique MAG_212_UNK8 @ 0x6A0D20 (analyse A — mode aveugle, pack fermé)

- Rôle (1 phrase) : thunk d'entrée (stub) du handler de la magie 212, enregistré dans la table de dispatch `0xC81AC0`, qui retransmet son unique argument `int` tel quel au corps réel `sub_6A0D50` via un appel cdecl avec épilogue recopié.

- Confiance : **CERTAIN** (pour le rôle de thunk/forwarder ; la sémantique de l'effet magie 212 elle-même réside dans `sub_6A0D50`, hors périmètre de ce stub de 5 instructions).

- Nom catalogue : `MAG_212_UNK8` — trop vague (UNK8). Proposition (markdown seul, pas de rename) : **`MAG_212_Entry_Thunk`**. Le suffixe « Entry » reflète le rôle de point d'entrée de table (unique xref = donnée), « Thunk » le transfert d'argument sans altération vers le corps réel. Le nom actuel ne ment pas mais n'apporte aucune information.

- In / Out / Effets :
  - In : 1 argument cdecl sur la pile (`[esp+arg_0]`, 32 bits — probablement un handle/contexte d'effet, convention de la famille mag FX battle).
  - Out : valeur de retour 32 bits dans EAX, passage transparent du retour de `sub_6A0D50` (le stub ne touche jamais EAX lui-même). Largeur retour : `int` (32 bits), conforme au prototype IDA `int __cdecl(int)`.
  - Effets : aucun état global lu/écrit ; aucun registre persistant modifié ; nettoyage pile `add esp, 4` après appel (le stub impose lui-même la convention callee-cleanup vis-à-vis de `sub_6A0D50`, puis se retire en `retn` sans nettoyer son propre arg — cdecl strict). Aucun callee autre que `sub_6A0D50` ; aucun accès mémoire global (globals.txt vide).

- Preuves (ASM cité, adresses exactes) :
  1. `6a0d20 mov eax, [esp+arg_0]` — lit l'unique argument cdecl sans le modifier : signature 1-arg pass-through, pas de marshalling.
  2. `6a0d24 push eax` / `6a0d25 call sub_6A0D50` — retransmission immédiate de l'argument au corps réel ; schéma « stub → thunk vers corps réel » de la famille (cf. contexte : table `0xC81AC0` = magie 212).
  3. `6a0d2a add esp, 4` — l'épilogue cdecl est recopié après le `call` (le stub n'est pas un tail-jmp `jmp sub_6A0D50`) : il reste un frame complet, typique des wrappers générés/posés comme pointeurs de fonction.
  4. `6a0d2d retn` — retour sans retrait d'argument (cdecl), retour EAX du callee non altéré : largeur 32 bits confirmée.
  5. `callers.txt` : seule référence = xref **data** depuis `0xC81AC0` (ligne de dispatch de la magie 212), zéro caller code direct → le stub n'est invoqué qu'indirectement via la table, rôle de handler enregistré confirmé.
  6. `callees.txt` : ligne `6a0d25 call sub_6A0D50` présente dans la section CALL/ADD-ESP ; cohérence callees ✓ (un seul callee, pas d'invention de library call).
  7. Wiki (decomp-function-catalog, ff8-wiki) : `0x6A1660 | sub_6A1660 | high | CERTAIN` — le tick de timeline MAG_212 voisin (0x6A1660, même plage d'adresses 0x6Axxxx) est certifié ; la famille 212 est déjà fermée, ce stub s'insère dans la même trame.

- Checks demandés :
  - Callees cités présents dans callees.txt : ✓ (`sub_6A0D50` @ 6a0d25).
  - Largeur retour : ✓ 32 bits EAX (prototype `int __cdecl(int)`, stub ne modifie pas EAX).

- Questions ouvertes :
  - Sémantique effective de la magie 212 portée par `sub_6A0D50` (hors stub, nécessiterait son propre pack) — ce verdict ne couvre que le forwarding.
  - Nature exacte de l'argument (`int` : handle d'effet ? id de timeline ?) — inféré de la convention famille, non prouvable depuis 5 instructions.

- IDBCOMMENT :
  Stub d'entree de la magie 212, reference uniquement par la table de dispatch 0xC81AC0. Il relit son unique argument cdecl et le retransmet tel quel au corps reel sub_6A0D50, puis retablit la pile (add esp,4) avant de retourner la valeur EAX du callee sans la modifier. [semantic-triple 2026-09-20]
