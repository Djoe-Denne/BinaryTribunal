# 7. Premier contrôle logiciel ciblé réussi, avis architectural en cours

## Objectif et avancement

La mission réalise le parcours RMS sans refaire les études acceptées. Après réception de la qualification, le superviseur a exécuté uniquement le script de primitives explicitement prévu au contrat. Résultat : **55 tests réussis, zéro échec, 125 assertions, un seul fichier**.

Le plafond de quinze secondes par test est conservé et passé explicitement à Bun. La suite sélectionnée rapporte 27 ms ; le processus a duré 80 ms. Les 357 fichiers du candidat ont ensuite été comparés à leur manifeste : aucune modification.

## Portée exacte

Ce contrôle porte sur les fonctions primitives pures et leurs valeurs attendues indépendantes déjà présentes. Il ne prouve pas le raccordement runtime, le remplacement, l'admission publique native, la publication ou l'acquisition du contexte suivant. Ni typecheck ni suite complète exécutés ; la suite globale demeure interdite. Aucun SKIP converti en succès.

Le parent a contrôlé les imports du test, l'absence d'import et d'effet externe dans le module pur, les données locales et la configuration vide. Aucun fichier .env ou bunfig.toml local, ni configuration Bun utilisateur trouvés lors de ce contrôle. Aucun besoin de dépendance réseau, service ou base de données pour cette sélection.

## Suite

L'unique architecte travaille en lecture seule sur les deux contrats liés : préparation v3 vers moteur et publication vers nouveau contexte. Il est autorisé à rechercher sur Internet ; la ratification et l'acceptation restent au superviseur. Aucun writer du raccordement n'est encore admis avant réception de cet avis et ratification.

La décision de remplacement reste sans delta justifié, donc son writer est différé. Les préconditions natives manquantes et les trois arrêts existants restent consignés ; aucun nouveau GO demandé.

## Preuves

- `../evidence/q1-primitives-parent-result.json` : entrées épinglées, oracle, commande, résultat et limites.
- `../evidence/q1-primitives.execution.json` et captures stdout/stderr. Les captures sont celles de PowerShell, dont le formatage peut entourer stderr ; elles ne sont pas présentées comme des flux enfant bruts byte-exact.
- Commande exécutée depuis le candidat : `bun --no-env-file --config=./bunfig.integration.toml run test:q1-primitives --timeout 15000`.
- Les deux finales précédemment manquantes sont conservées avec leurs Model.Ref natifs, sans nouveau worker de remplacement. L'avis architectural est gouverné par la même politique OpenAI, sans override.

Localisation : sélection de test et module purs déjà connus. Impact : captures et preuve de vérification ciblée, aucun octet produit changé. Limites : revue indépendante finale et validation intégrée restent à obtenir ; mission non clôturée.
