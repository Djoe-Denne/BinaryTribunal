# M2 — 138 : reconnaître les clés d'événements avant de conclure à l'absence

## Défaut recoupé et décision

Revue137 À_CORRIGER sur un seul défaut : finalActivationHistory136 lit toutes les colonnes d'événements, mais son type local et son classement ignorent key. Parent recoupe t2-fixtures244–250 ; seuls kind/prefixkind/headerpayload rendent un événement pertinent. Une clé activation-outcome:orphan avec kind inconnu/payload{} est donc ignorée, et un historique pré-final peut être classé ABSENT.

Ce défaut concerne le diagnostic/reopen, pas un compteur0 ou une autorité dangereuse observée. Les suppressions d'audits strictement dupliqués et la Map locale sont acceptées statiquement par la revue et réutilisables hors impact. Aucun gain temporel ou résultat de test n'est acquis.

## Correctif source autorisé

Après snapshot des douze sources136 et du manifeste, autoriser **deux fichiers seulement** : test/s2-author/t2-fixtures.ts et replacement.test.ts. Ajouter key au type local et reconnaître les vraies familles de clés produit dans la décision de pertinence. Parent recoupe candidate-staging: dans store et activation-attempt:/activation-outcome: dans activation194/231. Les clés réservées reconnaissables ne peuvent disparaître sous kind/payload inconnus.

La première trace de ces familles doit imposer le lecteur strict actuel, puis rendre les contradictions key/kind/payload/digest opposables. Si le compteur n'existe pas, garder son refus strict : ni init, ni faux0, ni branche ABSENT. Si le compteur existe, une clé réservée incompatible avec le kind ou sans join valide ne doit pas passer parce que le compteur est valide. Réutiliser les lecteurs et contraintes présents ; pas de nouveau classifieur général, format ou validation produit modifiée.

Écrire les négatifs manuels bornés : pré-final légitime, événement à clé candidate-staging:, activation-attempt: ou activation-outcome:, kind inconnu et payload sans header mais digest valide via EventLog. Le snapshotde réouverture doit refuser plutôt que déclarer ABSENT, sans réparer ou muter OWN ; garder les attentes spécifiques de cause et les58cas existants. Une variante kind altéré sur la même clé est équivalente : pas besoin de campagne exhaustive supplémentaire. Préserver les familles/versions records déjà contrôlées, le readonly et les comparaisons avant/après.

Les autres dix sources136 restent gelées, notamment store et inventory acceptés. Aucun autre fichier, entrée122, configuration, seuil15s/300s, record public, framework ou infrastructure. Besoin précis supplémentaire à escalader avant édition.

## Revue et limites

Livrer deux hashes/diff exact, familles de clés fondées sur les producteurs réels et nombre source des cas. Même reviewer reprend seulement REOPEN-KEY136 et l'impact du classement ; constats137:2–4 et preuves antérieures hors impact réutilisés. Ne pas refaire l'audit performance ni annoncer un gain.

Source seulement : aucun import/replan/seal/bind/typing/test/thread/SQL/DB/opener/asset/provider/native/Git/délégation/oracleQA. Après gel et revue, parent définira la compilation et le diagnostic/mesure ciblé nécessaires dans un gate neuf ;134 reste clos rouge. HOLD125 intégral sur tous les threads, aucune hausse de délai ni nouveau confinement. S2/M2/remplacement/S1concret global/contention non acceptés.
