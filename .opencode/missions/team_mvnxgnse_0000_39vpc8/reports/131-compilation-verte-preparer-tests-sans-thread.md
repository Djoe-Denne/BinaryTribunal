# M2 — 131 : compilation verte, préparer les tests sans thread

## Résultat vérifié

Paquet130 : **TypeScript exit0, zéro diagnostic,2141ms**, une invocation sans retry. Sources128 stables, logs et reçu vérifiés par hashes, aucune base ni asset créé ; aucun thread ou test lancé. Paquet clos vert. Le rouge127 reste conservé et distinct.

La compilation directe tsc --noEmit ciblée n'est pas l'exécution des trois commandes consolidées M2. Elle ne prouve ni les50cas ni la qualification S1concrète ou la contention. La revue source129 demeure valable sur cette version ; ne pas la rejouer pour ce seul résultat.

## Prochaine étape autorisée : préparation en lecture seule

Préparer la sélection exacte des tests **sans thread**, sans modifier les sources gelées ou transformer les cas bloqués en PASS. Parent repère trois cas appelant contendReplacement120 : le nominal «replacement two genuinely overlapping…» et les deux variantes «replacement contender …». Le mécanisme de sélection doit exclure tous les lancements, y compris import/hook exécuté au chargement ; ne pas se contenter d'un comptage des noms.

Autoriser une courte vérificationRO de l'auteur, limitée aux helpers/tests auteur connus : relever les sites Worker/new Worker et les appels, l'absence d'initialisation/hook lançant un thread hors corps de ces trois cas, les noms exacts et une proposition de filtre positif/négatif compatible avec le runner existant. Énumérer les cas ordinaires attendus, les trois non lancés sous HOLD125 et les ressources nouvelles nécessaires par invocation. Fournir les bornes de nombre de fixtures depuis le code, pas des temps runtime inventés. Aucune recherche des oraclesQA ni nouveau mécanisme/runner.

La sélection ne supprime pas les cas : leur source reste intacte et leur preuve obligatoire est toujours manquante. Les sorties filtrées/SKIP éventuelles doivent être rapportées comme **non exécutées sous HOLD**, jamais comptées PASS ou comme acceptation complète. Si le filtrage ne garantit pas l'absence de lancement, signaler le blocage avant RUN. Aucun gate runtime autorisé par ce rapport.

Après ce contrôle, le parent fermera commandes, namespaces OWN/assets/env, invocations et budget du seul lot sans thread ; il réutilisera le typingvert et les revues valides, sans compilation gratuite. La contention reste HOLD125 et pourra nécessiter un arbitrage séparé si une infrastructure importante est indispensable. Ne pas créer cette infrastructure pendant la préparation.

## Permissions et preuves

RO seulement : pas d'édition, import évalué, help/runner exécutable, replan/seal/bind, typing/test/thread/SQL/DB/opener/asset/provider/native/Git/délégation. Sources et anciens artefacts intacts. S2/M2/remplacement/S1concret/contention restent ouverts.

Reçu130 : evidence/s2-replacement-128-typing/typecheck.result.json, SHA256e15b54f9ea1658eb6a01e9f5ded9c5585fa958d4156779617e0ef8c9761e2b6c. SourceSet exécuté6db2232209298c721e24af2078a545a36b4eebf0ad491360b8ade261a6dc8c9a ; fichiers source128 SHA76d0983b… .
