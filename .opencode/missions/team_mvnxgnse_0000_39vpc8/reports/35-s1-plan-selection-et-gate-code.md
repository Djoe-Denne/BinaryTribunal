# M2 — 35 : sélection S1 et vérification ciblée du candidat

## Plan reçu et décision

Plan auteur 1/3–3/3 complet : base 39 fichiers (29 TS/10 JSON), 1 019 711 octets ; cinq cibles produit et cinq fichiers auteur supplémentaires, uniquement dans D interne (`.tmp/m2-s1-candidate-r2`). Dix supports hors paquets seront comparés au GO par le parent, les autres aux manifestes S1/supplément. Les couches commit/WIP/gels restent distinctes : aucune équivalence HEAD/WIP supposée.

Le parent retient cette sélection et les scénarios du plan : codecs purs distincts de l'entrée producteur prepare, imports DB/client atteignables pour les types seulement depuis l'API pure, root/knowledge/context/planner et B1/B2 ratifiés couverts. Pas d'élargissement engine/adapter anciens ou de modification des sources scientifiques qualifiées.

## Projection parent avant GO auteur

`evidence/prepare-s1-candidate-r2.mjs` vérifiera les pins, les 39 destinations sans doublon et la fermeture des imports relatifs avant création ; puis copies exactes, readback et supports RO (nouvelles copies seulement). Trois fichiers tooling GO conservés, config Bun vide. Pas de node_modules copié, installé ou lien à créer : résolutions TS explicites vers les déclarations existantes ; le CLI TS est appelé par chemin absolu. Les trois messages publics de plan seront persistés par décodage AST des seuls littéraux, pas de raisonnement privé.

L'auteur devra faire `tsconfig.s1.json` étendant la config parent `tsconfig.s1-resolution.json`, qui conserve le tsconfig GO et fournit seulement resolveJsonModule/typeRoots/paths. Aucun stub, any d'évitement ou suppression de diagnostics ; CJS/DB/client ne deviennent pas autorisés par cette résolution.

## Budget et commandes retenus

Après projection contrôlée et approbation native du plan seulement : au plus **12 invocations test** ciblées, 30 s wall chacune, et **4 typings**, 60 s chacune ; plafond cumulé 600 s, sans recherche d'épuisement. Chaque reprise doit avoir une correction/entrée/oracle affectée identifiée ; incident persistant ou dépassement → retour parent, pas retry automatique.

Runner parent fini `D/run-s1-check.mjs`, commande `node <runner> <envelope|projection|prepare|all|typecheck>`, cwd candidat explicite `D/tools/ff8-harness`. Il appelle Bun absolu pinné/no-env/config vide et concurrence1, limite Bun10s/test ; typing via CLI TS existant absolu. Environnement fermé à dossiers HOME/config/temp possédés, SystemRoot/WINDIR vérifiés ; pas PATH/options/preloads/tokens hérités. Logs/code/conditions et compteurs sous D/evidence. Aucun nouveau framework, service, DB, inspector ou processus de campagne.

Les quatre tests/fichiers auteur et tsconfig sont les seuls extras. Les autres sources restent RO et canoniques/gels intacts. Pas de tests graph-contract/transport/phase2 impliquant DB ou producteurs supplémentaires implicitement autorisés : frontières inchangées réutilisées ; tout changement ultérieur de ces frontières demande une analyse d'impact.

## Preuves attendues et limites

Rouge précis, correction, vert de la zone affectée ; composition finale seulement quand utile ; cas n-1/n/n+1 UTF8, joins nominaux/refus et fermeture d'imports émis contrôlés. Oracles auteur issus du contrat/attentes manuelles, pas goldens du candidat ; QA API indépendante prévue ensuite.

Pas de reprise numeric450/9/planner FULL, pas de code reconstruit du jeu. Trois commandes consolidées M2 encore NON EXÉCUTÉES et non remplacées par ces checks ciblés. Aucun commit/merge/push/nettoyage/config globale. Le GO code effectif et résultat de projection seront consignés après contrôle ; ce plan ne vaut ni tests exécutés ni acceptation S1.

## Résultats parent et GO borné

Projection effectuée : 39 sources/schémas/1019711 octets et trois tooling, **42/42 pins/readbacks conformes**, fermeture relative sans import manquant ; dix supports conformes GO. Les trois parties publiques de plan sont persistées dans `../inputs/s1-implementation-r2/plan/` avec IDs/tailles/hashes dans le [reçu de projection](../evidence/s1-candidate-r2-projection.json). Aucun fichier canonique ou gel modifié.

Runner fini syntaxiquement vérifié par `node --check`, SHA `d2bf81c5c85c9df25629be7bc5beff4621b249a0e6b2c808eea4188c59926fc6`. Commande exacte retenue : `node <D>/run-s1-check.mjs <check> <motif précis>`, check dans envelope/projection/prepare/all/typecheck ; toutes les autres commandes produit directes restent hors GO. Le runner lie commandes/cwd/env/sources et plafonds par des reçus conservés ; sa syntaxe seule ne prouve pas les futurs comportements S1. Aucun test ni typing lancé pendant la projection.

**Le parent approuve le plan et autorise le code/TDD ciblé sous `D/CODE_AUTHORIZATION.md`**, après passage natif du worker en implementation si requis et sans élargissement de permissions. Reasoning high proposé accepté dans le catalogue gouverné (pas override de modèle). Autorisation cinq cibles + cinq extras seulement ; résultat produit/QA/intégration toujours à venir.

### Reprise effective après fin du tour de préparation

Le rendu final de préparation est arrivé après le message d'approbation ; ses attentes de projection/GO sont désormais historiques. Une réactivation avec `approve:true` a été refusée car l'approbation native n'était déjà plus pending (pas un refus de permission d'implémenter). Message corrective `force:true` sans répéter l'approbation envoyé dans la même session ; `team_view` confirme ensuite **busy**. Le worker doit lire le GO et reprendre code/TDD, pas refaire son plan. Aucun test produit observé au moment de ce constat d'activité.
