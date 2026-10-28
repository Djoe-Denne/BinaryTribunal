# Review ciblée correction runtime budget — fixture ProbeStream seule

Fresh reviewer indépendant, disjoint de v3-budget-runtime-correction-r1 (auteur),
de v3-budget-source-r1, de la review budget et de la review composée. NONBLIND
déclaré. Objet : 4 livrables gelés de V3_BUDGET_RUNTIME_CORRECTION_OUTPUT_20261017
(BudgetedEvidence.cs 0944a3bb inchangé, BudgetedEvidence.Tests.cs e24df773/32653B
corrigé, DESIGN.md b54b561f inchangé, MANIFEST.json 0fcb436d/4661B) contre le
finding runtime réel (reçu pinné 23b51154) et les originaux gelés.

Cause racine revendiquée — à re-dériver, pas à recopier : MemoryStream.Write et
WriteByte (CLR 4.0.30319) appellent EnsureWriteable qui fait callvirt
Stream.get_CanWrite ; le probe gelé jetait unexpected-CanWrite sur TOUT CanWrite
(Tests gelés :521), donc tout Write légitime du module jetait avant tout octet ;
le catch module (:289) mappait en Hold StreamWriteFailed sans remboursement et
TryWrite rendait false (:297 writeReturned && !held) ; Check jetait
ownership-write. Vérifier la cohérence de CE mécanisme avec la source module
gelée (aucun accès CanWrite dans le module — vérifié parent), et qu'aucune autre
explication ne colle aux faits (invocations 1..10 passées dans le même run,
échec 9ms à la 11e).

Vérifier ensuite :

- Diff structural (baselines gelées fournies) : module et DESIGN byte-identiques
  au gel (pins) ; Tests : lignes 1..515 identiques, première diff à :516, région
  de diff confinée au corps de ProbeStream (pas de nouvelle classe ; parent a
  vérifié), suffixe depuis PartialThrowStream identique ; +19 lignes = membres
  Length/ToArray du probe.
- Le probe corrigé : CanWrite jette toujours (l'invariant ownership-no-canwrite
  reste testé) ; Write/WriteByte enregistrent SANS déléguer à MemoryStream
  (aucun EnsureWriteable) ; Length/ToArray dérivés des octets enregistrés ;
  Flush/Seek/SetLength/Dispose inchangés (jettes ou comptent) ; l'assertion
  ownership-no-canwrite (:291) reste donc VALABLE contre le module gelé.
- Aucun affaiblissement : caps 8 slots=262144 exacts, chunk ≤4096, HOLD collant
  réentrant/concurrent sans charge, débit avant tentative, réserve avant Read,
  UTF8 brut — invocations 1..10 du RunAll gelé inchangées et toujours passantes
  PAR LECTURE contre le module gelé (raisonnement de chemins, jamais exécution).
- Le scénario complet de CallerRetainsStreamOwnership re-raisonné : TryWrite
  {4,5} réussit désormais (Write ne jette plus), null→hold (:290) inchangé,
  CanWrite/Flush/Seek/Truncate/Dispose à zéro, write direct hors quota
  documenté au commentaire.
- MANIFEST : JSON valide sans BOM, self-hash exclu, statuts corrected exacts.
- C#5 strict ; conventions conservées ; aucun changement hors ProbeStream.

Verdict : ACCEPTABLE_SOURCE_SCOPED | CORRIGE | BLOCK, 3–8 ancrages source:ligne,
contraires précis, limites, plus petit travail suivant. Rapport PUBLIC
team_message ; aucun fichier ; aucune écriture ; re-hash début ET fin.
Interdits : compile/transpile/test exécuté/Bun.test/run natif/Job/Process/DB/
git/IDB/board-write/indexquery/délégation/changement de modèle/autre OWN.
Bootstrap NONBLIND déclaré.

Après acceptation par le parent : NOUVEAU compileGO parent (budget corrigé),
puis ré-exécution du test mémoire 002r' sur les octets corrigés. Ce verdict n'est
ni le compile ni la réexécution. Modèle : cursor/grok-4.7 Grok 4.7 Extra High.
