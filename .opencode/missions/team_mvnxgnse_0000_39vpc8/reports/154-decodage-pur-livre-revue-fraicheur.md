# M2 — 154 : décodage pur livré, revue de la fraîcheur et de l'ownership

## État vérifié

Le parent vérifie tailles/hashes des deux fichiers153, douze autres pins148 et inputs122 inchangés, puis gèle les quatorze sources. [Manifeste153](../evidence/s2-replacement-source-153.json), baseline complète148 sous snapshots/s2-measure-152. Le codec overlay146 et le collecteur148 ne changent pas.

66cas annoncés écrits (61préservés+5variantes),63sans thread et3HOLD125. Aucun import évalué, typing, test ou nouvelle mesure. Le gain net et respect15s restent inconnus ; les mesures151 attachées148 ne deviennent pas des timings153 ou un PASS produit.

## Revue indépendante sur les deux deltas

Reprendre le reviewer retenu, décision153 et lecteurs148 comme oracle de préservation. Réutiliser preuves149/147/139/137 hors impact, pas un nouvel audit général61/131/scientifique450+9.

1. Contexte d'une entrée interne au seul préambule replacementStage, noninjectable par caller/APIexportée. Clé rawSQL complète exacte, fingerprint/décodage pur seuls ; calculs paresseux pour ne pas déplacer les erreurs de parsing avant les guards d'origine. Aucun verdict/existence/métadonnée/LIVE mémorisé. Vérifier signatures exportées identiques et délégation sans contexte des anciens lecteurs.
2. Mêmes requêtes/ordre/énumérations et lookup de chaque ligne puis stage ciblé. Tous champscourants kind/ref/revision/revoked/digest/mode/version sont relus et leurs validations évaluées **même hit** ; digestactuel comparé au contenu pur. Bytesdiffsameréf doit miss, digest/révocation/revision contradictoires doivent refuser, pas d'orphan/ambiguïté ignorée.
3. Décodage possédé profondément immuable, enveloppes/ref fraîches et pas d'alias mutable du cache vers caller. Purge sur throw/null et aprèsrelecture avant bind/sourcecurrent/proofs. Aucun partage entre appels/append/OWNmutation/HOSTQepochTTL, résultatstage ou frameactualisée. Instrumentation inchangée : le calcul évité doit se refléter naturellement, pas fausser le compteur.
4. Cinq variantes source : unchangedhit, same-refbytes, digest, revokedLIVE et revision. Spieslocaux doivent atteindre le **deuxième get natif** sur la même clé après exactdecode initial, sans rowfactice/provider ou résultat fabriqué ; WeakSet/restore/JSON.parse natif ne doivent pas masquer une lecture ou altérer un comportement. Oracle manuel de refus précis et OWN attendu tenant compte seulement de corruption volontaire, aucune charge/controlmutation légitime. Deux appels distincts doivent recréer leur contexte et garder ownershipretour distinct. Les61cas/7assertions cible et3titres threads restent intacts.

Une différence de nombreparse ou site exact non atteignable est un blocage de scénario, pas motif pour accepter un toThrow générique ou ignorer un test. Les callbacks de spy sont des fautes testfixture futures, aucun hook produit nouveau. Le coût des spies et du factoring n'est pas encore mesuré.

## Permissions et suite

StrictRO : lectures/hash/AST/refs bornées, aucun write/import/replan/seal/bind/typing/test/thread/SQL/DB/opener/asset/provider/native/Git/délégation/oracleQA. Tâcheglobale lead inchangée. Retour source prêt pour compilation/validation ou défaut concret contrat/source/scénario, suggestionsdifférables à part.

Après gel/revue, parent fermera compilation puis tests de mutation et diagnostic existant dans gate neuf selon impact. Aucun RUN actuel, hausse15s/300s ou changement de représentation persistée. HOLD125 intégral ; S2/M2/remplacement/S1concret global/contention non acceptés, troiscommandesconsolidées nonlancées.
