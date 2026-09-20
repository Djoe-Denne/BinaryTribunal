# MagFx_Call_32A0_WithTable_1184694 @ 0x6A33E0

- Instr (live): 6 (19 o, 0x6A33E0-0x6A33F2)
- Palier: 1+P (2 voix c_a + semantic_a, verification parent P)
- Verdict: CERTAIN - wrapper trivial de forwarding cdecl : pousse la constante de table unk_1184694 puis arg_0, appelle sub_6A32A0 (2 args), retour EAX passthrough (add esp,8 @0x6A33EF)
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: sub_6A33E0\nTYPE ; proposition: MagFx_Call_32A0_WithTable_1184694
- Notes parent: checks 5.6 OK (role P) : 6 instr integrales lues au sol, forwarding pur, xref data 0x6a212d dans sub_6A1660 (ticker CERTAIN) ; CERTAIN pose par la voix + cluster jumeaux 0x6A3280/1184174 et 0x6A33C0/11843DC fermes

## C reconcilie

```c
// c_a.c — voix c_a (reconstruction C depuis ASM live)
// Cellule 0x6A33E0 (stub, mode 1+P) — famille mag FX battle (plage 0x6A2-3xxx)
// Ground truth = live ASM (asm.asm, 6 instr @ 0x6a33e0, taille 0x13), Hex-Rays = vérificateur SEULEMENT.
// Préambule : Ground truth = live ASM + ida_dump_bytes, not Hex-Rays.
//
// Métadonnées :
//   Instr (live) : 6
//   Palier       : mode 1+P (stub)
//   Type IDA     : int __cdecl sub_6A33E0(int)
//   Sauvegardes de registres : aucune (pas de push de callee-saved, pas d'ebp frame)
//   Corrections add esp : 6a33ef  add esp, 8  (2 args cdecl, nettoyage par le caller OK)
//
// Structure ASM live (0x6a33e0..0x6a33f2) :
//   6a33e0  mov eax, [esp+arg_0]        ; eax = 1er argument (a1)
//   6a33e4  push offset unk_1184694     ; arg 2 (poussé en premier = le plus à droite)
//   6a33e9  push eax                    ; arg 1 = a1
//   6a33ea  call sub_6A32A0             ; cdecl, 2 args
//   6a33ef  add esp, 8
//   6a33f2  retn                        ; eax de sub_6A32A0 retourné tel quel (pas de troncature)
//
// Verdict Hex-Rays vs ASM : CONCORDANT. Ordre de poussée droite->gauche vérifié dans l'ASM
// (offset unk_1184694 poussé AVANT eax => a1 est bien l'arg de gauche). Retour int via eax
// sans troncature : largeur de retour exacte = eax (32 bits) telle quelle.
//
// Rôle (index, non verdict) : thunk 1 arg -> sub_6A32A0 avec pointeur de table/contexte
// constant unk_1184694 en 2e arg. Renvoi direct du résultat (tail-call sémantique).

// UNCERTAIN 0x6a33e4  rôle exact de unk_1184694 (table statique ? struct FX ?) — hors ASM live, non prouvé ici.
// UNCERTAIN 0x6a33ea  prototype réel de sub_6A32A0 (nombre/types d'args au-delà des 2 poussés, registres optionnels) — non prouvé ici.

int __cdecl sub_6A33E0(int a1)
{
  // Thunk pur : délégation directe, eax de sub_6A32A0 retourné sans modification.
  return sub_6A32A0(a1, (int)&unk_1184694);  // unk_1184694 : pointeur constant poussé en 2e arg (offset .data)
}
```

## Analyse semantique

# Sémantique sub_6A33E0 @ 0x6A33E0 (analyse A, mode 1+P, aveugle)

- Rôle (1 phrase) : thunk/forwarder cdecl à 1 argument qui appelle `sub_6A32A0(arg0, 0x1184694)` avec un 2ᵉ paramètre fixé à la constante de données `0x1184694` et retourne la valeur EAX du callee telle quelle.
- Confiance : CERTAIN — sur le rôle mécanique de forwarder (corps cité à 100 %, 6 instructions, callee et caller confirmés, aucun point d'ASM ambigu). Réserve explicite : la sémantique métier de `unk_1184694` (table descripteur ? contexte statique ?) et le domaine précis de `sub_6A32A0` restent non tranchés par le pack et le wiki (LIKELY au niveau libellé) — ceci ne fragilise pas le verdict mécanique.
- Nom catalogue : aucun nom IDA (sub_*). Proposition markdown seule, sans rename : `MagFx_Call6A32A0_WithTable1184694`. Justification : pas de preuve d'un nom MAG_xxx spécifique (aucun magic ID cité dans le corps, aucune chaîne, aucun caller nommé) — un nom `MAG_*_...` serait une invention ; le nom proposé décrit uniquement le lien ASM vérifiable.
- In / Out / Effets :
  - In : 1 argument cdecl `[esp+arg_0]` (largeur dword, sens inconnu : id, pointeur ou handle — le pack ne le précise pas).
  - Out : valeur de retour = EAX de `sub_6A32A0` non modifié (forwarding complet) ; largeur EAX (32 bits), pas AL/AX seul démontrable ici.
  - Effets de bord : purge propre de 2 dword de pile (`add esp, 8`) ; aucune écriture mémoire propre, aucun accès global direct — le thunk est pur transitaire.
- Preuves (ASM cité) :
  1. `0x6a33e0  mov eax, [esp+arg_0]` — exactement un argument cdecl, chargé dans EAX avant usage.
  2. `0x6a33e4  push offset unk_1184694` puis `0x6a33e9  push eax` — poussé droite→gauche : appel effectif `sub_6A32A0(arg0, 0x1184694)` ; le 2ᵉ paramètre est une constante de données liée en dur, signature typique d'un worker commun paramétré par descripteur statique.
  3. `0x6a33ea  call sub_6A32A0` — callee présent dans callees.txt (ligne 8, avec `add esp, 8` en ligne 9) : check callees OK.
  4. `0x6a33ef  add esp, 8` — purge de 2 args, cohérence cdecl exacte (2 paramètres poussés, 8 octets).
  5. `0x6a33f2  retn` — aucun mouvement d'EAX après le call : la valeur de retour du callee est retournée telle quelle (forwarding de largeur EAX).
  6. callers.txt : unique xref à `0x6a212d`, type **data**, depuis `sub_6A1660` (`0x6a1660`, taille 0x10F9) — l'adresse de `sub_6A33E0` est prise comme donnée (stockage dans table/handler ou push comme callback), pas d'appel direct ; cohérent avec le cluster mag FX où les workers sont enregistrés par tables (voisins catalogue : 0x6A1660 CERTAIN, 0x6A45E0, 0x6A6360 MAG_140_PHOENIX_FL_Callback, 0x6A79B0 MagFx_RenderComposedFK_Alloc4C CERTAIN).
- Checks :
  - Callees cités présents dans callees.txt : OUI (`sub_6A32A0` @ `0x6a33ea`).
  - Largeur retour : EAX (forwardé) ; aucun signe de retour AL seul.
  - Pas d'invention de library call ; pas de constante stride connue (F_CHAR 0x1D0, slot 0xD0, magie 32×5) présente dans ce corps de 6 instructions.
  - Wiki : aucune entrée directe pour 0x6A33E0 / 0x6A32A0 / 0x1184694 (qmd ff8-wiki : « No results » sur les trois) ; divergences : AUCUNE ; convergence indirecte par le cluster famille 0x6A2-3xxx (catalogue decomp-function-catalog).
  - Aucun fichier interdit lu (hexrays.c, c_a.c, c_reconciled.c, decomp*.md, semantic_*.md, champ CMT de meta.json ignorés).
- Questions ouvertes :
  1. Que contient `unk_1184694` (table descripteur de l'effet mag ? contexte statique partagé ?) — nécessite un dump data hors périmètre A.
  2. Quel est le rôle exact de `sub_6A32A0` (worker commun de la famille mag FX ? dispatcher sur le descripteur ?) — c'est le nœud qui déterminerait un nom métier.
  3. Pourquoi la xref du caller est-elle de type data (`0x6a212d` dans `sub_6A1660`) : enregistrement dans une table de handlers construite par `sub_6A1660`, ou push comme callback BdLink ? À trancher au niveau du caller.
- IDBCOMMENT (proposition) :
  Thunk cdecl a un argument : il pousse la constante 0x1184694 en second parametre et delegue a sub_6A32A0(arg0, 0x1184694), dont la valeur EAX est retournee telle quelle. Reference comme donnee depuis sub_6A1660 @ 0x6a212d, probablement handler ou entree de table de la famille mag FX 0x6A2 ; la signification de la table 0x1184694 reste a identifier. [semantic-triple 2026-09-20]
