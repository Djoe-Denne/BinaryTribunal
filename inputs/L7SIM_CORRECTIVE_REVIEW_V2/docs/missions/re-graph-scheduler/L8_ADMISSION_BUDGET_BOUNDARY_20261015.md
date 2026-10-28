# L8 — frontière pré-freeze du budget d'admission, analyse avant décision

2026-10-15. **Blocage d'intégration confirmé, aucun correctif/API encore autorisé.**
L8 A incomplet et gelé ; aucune acceptation de ses treize fichiers intermédiaires.
Ne pas assouplir L6, modifier un plan frozen ou gonfler des données scientifiques.

## Preuves exactes

Planner accepté : `planner.ts:518–520` mesure le canonical UTF8 de
`{snapshotId,snapshotFingerprint,policyVersion,unit,functions,requirements,dispensations}`.
GraphStore accepté : `graph-store.ts:648–649` exige que **canonical(body Admission)**
tienne dans cette valeur figée puis dans le plafond global. Le contrat §6 impose
enveloppe et métadonnées comprises ; SQLite length/String.length ne sont pas des budgets.

Dans la preuve fixture L8 une fonction/sans arête, unité **3 073 octets**, plafond
global **1 000 000**. Admission A réellement archivée **3 578 octets**, SHA
`47559b7436972a2eabce89c8913c1d0a92cd936b67036e3490837df17d078852`.
Le vrai chemin auteur Engine.startGraph/step a refusé le budget avant outbox/submit,
compteurs fake/legacy zéro ; DB propre conservée. Parent a ensuite rehashé les 31
payloads et reproduit le script pur : **A3578 / B3578 / R13590 >3073**, config et
validateurs locaux/attribution passés, R decision **likely**, aucune gate scientifique
native revendiquée. Ce repro ne valide pas les gates L6 situées après ce refus.

Paquet auteur 32 fichiers / 148 967 octets ; manifest
`ec7ef12b2c2200718eb3b9058d6f5ba50718d576ff691e535251dc7698b30ce4` ;
payloadFingerprint `6acf90a040809cbac58352d3826626b747f5c85e496187751ba056ebef595db1`.
Treize sources L8 gelées ; engine.test/recovery.test restent absents et les gates
verticales/reprise/concurrence restent pendantes. Source L5/L6 acceptée intacte.

## Travail d'analyse indépendante demandé

Proposer une frontière **explicite, versionnée, avant freeze/sélection**, pas écrire
du code ni accorder une exception. Lire les vrais contrats/ADRs/APIs et les preuves,
pas seulement le résumé auteur. Retour compact avec citations path:line :

1. Classifier précisément le défaut de contrat (entrée d'allocation runtime
   manquante vs garantie existante violée), limites des acceptations anciennes et
   couche/owner approprié. Ne pas renommer un bug en feature pour éluder le routage.
2. Comparer une extension L5 de policy/input pré-freeze à une frontière L8 revue,
   et expliquer si L6 devrait ou non changer. Recommander **une** solution minimale,
   champs/signatures, versions et invariants, sans padding ni cast/SQL d'autorité.
3. Distinguer taille scientifique mesurée, allocation complète par admission et
   coût/budget total de sélection/fermeture. Quel maximum couvre A/B/R et plusieurs
   fonctions/attempts ? R dépend de propositions encore inconnues : borner via contrat
   validé ou déclarer une allocation limitée avec échec fermé, pas une fausse borne.
4. Faire intervenir l'allocation dans les plafonds unitaires et totaux **avant**
   sélection et fermeture G1, y compris SCC/required callees. Pas sélectionner sur
   un prix inférieur puis simplement rehasher un sidecar plus large.
5. Nouvelle sémantique → nouveaux plan/run fingerprints/bindings appropriés, anciens
   plans/logs/readers conservés sans migration. Préciser les identités fonction/unité/
   famille qui doivent rester stables pour ne pas contourner les claims vivants.
6. Matrice de tests : one-node réel A/B/R, seuil exact/−1/+1 UTF8/multibyte, propositions
   R au maximum déclaré, multifonction/SCC/fermeture/total, config/mode/profile/model,
   invalidations/replay/reopen et ancien plan frozen qui **ne peut pas être élargi**.

Routage/permission d'implémentation restent décisions du parent après cette analyse,
notamment si une correction d'un ancien livrable déjà maximal est réellement requise.
Ne pas éditer L5/L6 ou la tranche L8 gelée ni inventer une nouvelle autorité.

## Exécution et portée

Reproduction fixture pure permise ; pas ouvrir/migrer la DB auteur pour réparer les
plans, pas DB privée Ensemble, réseau, submit/LLM/IDA/live, Git/install/sous-agents
ou inbox/team_results. Les données privées de preuve sont reçues explicitement et
hashées. Les sources L8 candidates ne sont pas un module accepté, encore moins une
preuve de validité native. Le parent garde l'arbitrage technique et les gates finales.
