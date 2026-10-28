# L5 allocation — candidat gelé, nouvelle review pendante

2026-10-15, auteur fresh Astra max, task `task_mv9k1ikn_0000_bo44nq`, session
`ses_ec051dad7ffeMZ5jqeWhGUzt3H`. Livraison completed pour le correcteur seulement,
worker fermé normalement ; changements non committés conservés, aucun merge.

Deux sources seulement :
- planner.ts,84 699B,SHA
  `985e5ead945ac742a7df5370c0009b2e8f1aab357286ad2cb67b3cf01c858988` ;
- nouveau planner-admission-budget.test.ts,39 066B,SHA
  `8d02cbec8c7cd8a4f3d8d5a766d18716f9a0bcd370f95fcad74509a4cdff3edb`.
Ancien planner.test.ts inchangé. Module candidat **NON accepté/NON intégré**.

## Preuves vérifiées parent

Manifest auteur SHA
`bb50a722c7475a742522ecbdd2e8dfbc99e7a326d93a73945dc36142fa687200` ;
fingerprint d'ensemble **déclaré**4494280f…bfe31b, sans recette supposée par parent.
Vérification réelle :2 sources,14 preuves,487 inputs (486+1 décision),306 autres
ROOT inchangés,4 DB fixture1 388 544B hashées/retentues, aucun WAL/SHM restant.
Ce gel est un manifeste de fichiers ROOT immobiles, pas un sous-dossier FROZEN
inexistant. Le parent crée ensuite sa propre copie immuable de revue.

Parent exécute le nouveau planMission sur les vrais inputs de l'ancienne fixture :
**planning complet byte-exact**, digest
`8f5a36ff063a30ca16fafee89236b8e67ba7d9c79172e838274fd7ee0888d7c8`.
Ce vecteur unique ne prouve pas tous les comportements legacy ; la review inclut
les branches partagées et sondes propres/différentiel OLD.

Gates auteur : typecheck0,143PASS/13 583assertions, full870PASS/1SKIP/74 305assertions,
871tests22files,156.965s. Pas QA60 intégrée ultérieurement en main ni26 maintenances
non committées. Exceptions cleanup exactes précédemment approuvées/rapportées,
nouveaux gates L6 DB fermés/conservés ; aucun cleanup manuel/global env modifié.
L6 public réel : freeze/reopen/readback/binding, C−1/C PREPARED, C+1 refusé avant
outbox/événement,0 envoi/publication/science. Cela reste un gate fixture offline.

## Review indépendante

Gel parent `L5_BUDGET_985E_REVIEW`, **474 fichiers /10 470 218 octets**, manifest
`36c6eb0d365fc5097e3d1bf69e076b2153df3ee97e0fa712619dcf27f1dfcc2d`,
sur modules acceptés HEAD94203d3 +overlay candidat, OLD code accepté et exemple
legacy, quatre artefacts SQLite. Ledger9MB omis explicitement, pas full/native gel.
Pré-gates parent sur ce vrai gel : **typecheck0 et143PASS/13 583assertions**.

Fresh reviewer `l5-budget-review`, nouvelle task `task_mv9ntc9a_001m_ahmspg`,
session `ses_ebff13ea5ffeqgqh2NPnl1FL6i`, **openai/gpt-6.1-sol / max natif vérifié**.
Paquet inputs/L5_BUDGET_REVIEW_985E, mêmes474 fichiers/10 470 218B,
receipt `4c243003fbc9226a76ccd3a0352e84ad7678f700905a5d38af5471df71a07a02`.
474pins/manifest/receipt, lecture complète des scopes/GO et accès deps effectivement
ACK ; parent approuve rôle/accès puis donne **GO analyse review**. Appel inbox initial
pour assignment/HOLD déclaré : pas de prétention zéro lifetime ; autre contenu
exposé → STOP/précision avant analyse. Pas de restart imposé pour le seul HOLD.
Source/docs/root reader
explicitement pinés, dépendances readonly sous le module, pas autre WT/private DB.
Voir `L5_ADMISSION_BUDGET_REVIEW_SCOPE_20261015.md`.

L8 reste gelé : contexte dérivé des vrais inputs, lecteur prospective, mesure body
final, N=1 durable à travers générations/passes et recovery/CAS/retry non prouvés.
Allocation limitée, pas borne universelle de R ni trafic réseau. Aucune autorité
native/scientifique ou clôture L8/L9/L10 ; parent seul acceptera/intégrera.
