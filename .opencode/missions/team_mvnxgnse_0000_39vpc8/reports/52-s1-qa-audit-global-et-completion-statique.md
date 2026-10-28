# M2 — 52 : audit global QA reçu, finir les cas avant le paquet final

## Lecture parent et portée du diagnostic

Le parent a lu Q/reports/plan-and-cases.md:73–138 (Q=.tmp/m2-s1-qa-r2), matrice A01–A22. Statuts explicitement séparés : VS=contrôle statique, VR=résultat réellement observé, L=lacune. Ce n'est pas un ensemble de PASS nouveaux. Zéro run ajouté, ledger toujours9runs/4reprises/4255ms.

La fixture actuelle sélectionne une unité réelle A/B/R avec caps et accounting non vides ; l'ancien nominal « sans unité sélectionnée » est historique et ne satisfait pas les conditions à prouver. Les corrections statiques conservent le snapshot brut3057octets, le conflit owned_function/G2 et le SCC singleton/ordre cohérents. Formule planId/context/versions explicitée, pas de producteur appelé. Version déclarée manual-root25040B/SHA88eb0634… ; qa09 typing sur l'ancienne version n'est pas reporté sur ces bytes.

Ce diagnostic ferme utilement la méthode des préconditions A de base, pas la couverture : A12 expose encore les frontières S/C et octets, A19 les rôles raw/affinity non triviaux, A21 la pureté sur nouveaux nominaux, A22 knowledge/attestation/admission historique et B encore à construire.

## Décision : terminer statiquement, sans nouveau run pour l'instant

Autoriser la continuation du **travail QA déjà prévu**, dans les fichiers de l'allowlist48, sur les lacunes précises A12/A19/A21/A22 : B nominal, cas multifonction et bornes de budget réellement consommées par S1, source/group context divergents, knowledge niveau1/niveau2 avec07, et gardes des chemins nominaux complets. Attentes du contrat fixées avant corps, fixtures manuelles, aucun oracle auteur/SUTproducteur ou validateur miroir.

Avant de demander le paquet exécutable final, fournir la liste finie des cas complétés, leurs données et préconditions source/version, les hashes des fichiers QA et les lacunes restantes. Ne pas renvoyer l'ancien catalogue ou faire de nouveaux runs root pour vérifier chaque champ de la construction. Les corrections purement statiques de données peuvent continuer sous ces droits ; aucune donnée produit RO modifiable.

Les bornes de budget S1 doivent être testées sur les valeurs/bytes que l'API consomme réellement ; une simple déclaration C100000 et « S est petit » n'est pas une mesure. Identifier la clause et la donnée requise si elle n'est pas disponible dans S1, sans simuler une capture native ni déclarer cette obligation satisfaite par le typing. Acquisition/authentification/S2 et requestDigest historique opaque gardent leurs limites ratifiées, pas un waiver silencieux d'une mesure applicable.

## Paquet futur retenu dans son principe, non encore autorisé

Après cette complétion et contrôle de préparation : une invocation root-sources, une knowledge complète, une isolation sur les nouveaux nominaux, puis typing final. Parent devra donner l'extension précise du runner/compteurs ; **le plafond actuel10runs/4reprises demeure** à ce stade, et aucun de ces nouveaux runs n'est autorisé par ce rapport. La durée300s reste la borne proposée ; aucun nouveau harnais/framework/processus/DB nécessaire par principe.

Arrêt à un nominal non atteint, verdict partiel de son groupe et dépendants, version/cause exactes ; pas d'itération champ par champ ou de contournement par un autre nom de check. Les37PASS initiaux demeurent bornés et réutilisés ; aucun renvoi de leurs malformed-cases comme preuve du bind complet.

## Mission

000a reste ouverte, S1 non accepté/intégré, S2–S4 et exécution L7/L9/L10 non débloqués par cet audit. Numeric450+9 et candidat auteur vérifié restent valides dans leurs portées. Trois checks consolidés M2 NON EXÉCUTÉS. Aucun nouvel appel produit, Git/DB/native/live/IDA/configuration ou ressource créée par cette décision.
