# M2 — 136 : corriger la réouverture et les calculs répétés sans affaiblir les preuves

## Diagnostic et décision

L'auteur a terminé le diagnosticRO135. Le compteur d'activation est initialisé uniquement au staging final autorisé, non au bootstrap/stage remplacement/swap. Les deux reopens sans ancien final sont donc antérieurs à sa création ; le helper exige néanmoins activationCounter et refuse. Plafond2 acquis et compteur durable0 ne sont pas synonymes. Corriger ce raccord helper sans initialisation anticipée ni absence assimilée à0.

Les répétitions d'audit sont établies par le code : captureOperational appelle auditGenerationHistory, puis prepareReplacement/swap le rappellent sans écriture intermédiaire. Le parent recoupe store627–628/683–684. Les lecteurs stage/counter/forOld répètent aussi bind/parse/canonical ; les frames et inventaires rééchappent des documents sérialisés. Aucun cycle infini n'est identifié. Le rôle dominant de ces coûts dans les110s/59s n'est **pas mesuré** ; un correctif local peut réduire des duplications prouvées, pas promettre15s ni masquer des échecs.

## Ownership et permissions

Préserver douze sources128, manifeste et contrôleur134 byte-exacts readonly. Autoriser source dans **six fichiers existants au maximum** :

- test/s2-author/t2-fixtures.ts et replacement.test.ts ;
- src/graph-generation-store.ts, graph-generation-transition.ts, graph-generation-replacement.ts, graph-final-inventory.ts.

Aucun autre module, type public, format persisté/record/frame, schéma, entrée, configuration, runner ou framework. Les sources HOST/autorité/activation/lifecycle, basrecords, budget/ledger, cinquante cas existants,131tests historiques et artefacts restent protégés. Besoin d'un autre fichier ou d'une représentation persistée différente à escalader **avant** édition. Examiner les références/consommateurs utiles avecSerena ; pas de recherche d'oracleQA.

## Correction du snapshot de réouverture

Le helper doit retenir en lecture seule l'absence ou l'état strict du compteur avant fermeture, puis vérifier la même situation après reopen. Absence permise seulement si l'énumération complète ne contient **aucun** fait de staging final ou d'activation : candidate-staging/g3_candidate_staged, pointer/counter/attempt/receipt/outcome/result/commit et événements associés. Ne pas se fonder seulement sur candidateRef ou un compteur manquant.

Si un seul fait existe, conserver activationCounter strict et les joins/histoire : pointer absent/révoqué/corrompu ou record orphelin=>HOLD. Ni register, collect, initialise, write ou nouveloctroi pour réparer le reopen. Préserver root/policy2, les bytes/sources/cursor et la chaîne d'essais déjà acquis. L'absence est un état historique à comparer, pas une permission de consommer ni un faux compteur0.

Attentes manuelles source : reopen stage/swap pré-final garde absence exacte sans écriture ; après ancien final/attempt lecteur strict ; corruption ou disparition après staging ne passe pas par la branche absence. Réutiliser les cas existants et variantes strictement nécessaires, sans supprimer les cinquante ni remplacer leurs attentes spécifiques.

## Réduire uniquement les calculs purs redondants

1. Retirer l'appel d'audit strictement dupliqué immédiatement après captureOperational seulement si le contrôle identique est bien inclus et si aucun effet/lecture externe mutable entre les deux ne crée une nouvelle frontière. Conserver captureOperational et son contrôle de fermeture des sources, les autres postconditions et les appels qui vérifient un risque distinct.
2. Réutilisation locale possible des calculs purs decode/canonical/bind sur les **mêmes bytes exacts** et documents immuables dans une seule invocation synchrone d'audit. Énumérations SQL, statut/revision/revoked, kind/ref et autres métadonnées effectives restent réellement relus et contrôlés à chaque frontière pertinente ; ne pas mémoïser une permission, un succès de validation LIVE ou une existence de ligne.
3. Contexte interne à l'audit, jamais paramètre public/store/RPC ou booléen/map fourni par le demandeur pouvant usurper une preuve. Pas de cache global, weakcache cross-transaction, objet mutable identifié seulement par sa référence, résultat mutable réutilisé ou lookup par ref seul. La clé couvre exactement les entrées pures ; des bytes différents ne peuvent partager un résultat validé.
4. Contexte neuf à chaque append, mutation OWN, lectureHOST/current/Q/epoch/proof ou nouvelle phase. Ne pas traverser une frontière pour éviter sa relecture ; les contrôles LIVE avant/après append, TTL, refs/fences et frame réellement consommée restent opposables. L'histoire consommée et l'autorité courante ne se confondent pas. Aucun expected head/final rafraîchi.
5. Une catégorie peut être décodée une seule fois au sein d'une vérification finale si tous les joins/énumérations restent évalués contre la même preuve immuable. Ne pas réduire les gros documents, changer la représentation persistée, omettre les sources/proofs ou déplacer les contrôles hors de la transaction pour accélérer.

Le worker choisit les plus petits gains prouvables dans cette portée et documente ceux non entrepris. Ne pas construire un moteur général de cache. Si un gain suffisant nécessite un changement de format ou des validations moins nombreuses **à des frontières différentes**, escalader plutôt qu'implémenter. Aucune garantie de performance issue d'une simple analyse statique.

## Livraison et validation proportionnée

Retour hashes/diffs, absence/presence du compteur et inventaire complet des faits, calculs réutilisés/entrées/clés/durée de vie/points de réinitialisation, preuves d'absence de garde supprimée et références des consommateurs. Distinguer gains attendus de mesures non faites ; aucunprofiling ou runtime autorisé ici. Les petits calculs source comptant les appels sont permis, pas les imports ou benchmarks évaluant le produit.

Même reviewer sur ces frontières/risques et impacts, preuves129/126/123 réutilisées hors impact. Après gel/revue, parent fermera une nouvelle compilation et des tests ciblés nouveauxOWN selon impact ; ne pas rejouer134,132 ou130 par automatisme. Les50cas restent obligatoires,3thread sous HOLD125 non exécutés. Aucune hausse15s/test ou300s/process pour transformer le rouge en vert.

Source seulement : aucun import évalué/replan/seal/bind/typing/test/thread/SQL/DB/opener/asset/provider/native/Git/délégation/oracleQA. Les27DB/27assets134 et143DB/44assets132 restent intacts, aucuncleanup. Pas de containment ou infrastructure externe. S2/M2/remplacement/S1concret global/contention toujours non acceptés ; tâche globale propriété du lead.
