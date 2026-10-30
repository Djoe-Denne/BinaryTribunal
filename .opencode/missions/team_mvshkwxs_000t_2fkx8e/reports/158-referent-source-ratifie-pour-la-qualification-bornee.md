# 158. Référent source ratifié pour la qualification bornée

## Décision et conséquence

La revue indépendante accepte le nouveau rapprochement de provenance et a recalculé séparément l'empreinte de l'archive source. Le parent ratifie le sens précis du champ source du permis : **empreinte des octets de l'archive source associée à la distribution desktop identifiée**.

Le blocage spécifique à ce champ est levé. Il ne l'est pas en remplaçant une inconnue par un hash documentaire : le fichier source existe réellement, son contenu est épinglé, et le lien avec la distribution est documenté. La comparaison négative de l'archive CLI demeure conservée.

## Limites et gardes

Ce référent repose sur l'association release/tag publiée par le distributeur. Il ne prouve ni un build reproductible, ni les entrées exactes du compilateur ou le code effectivement chargé en mémoire. Il ne qualifie pas l'enforcement des outils, le quota, le résultat ou la fin native.

Le raccord doit recharger et hacher le véritable artefact, conserver sa définition et la preuve de provenance dans les références existantes, puis vérifier les autres prérequis. Le fichier source n'est pas ajouté au body REST ; sa taille locale n'augmente aucun plafond de travail. Le binaire et le processus devront encore être courants aux frontières d'effet.

La réalisation du raccord local peut donc achever sa préparation avec ce référent explicite. Aucune possession opérationnelle, session, origine ou autorisation privée n'est créée par cette décision. Aucun nouveau GO de routine n'est demandé.

## Preuves

- Avis indépendant : result_mvutpls2_0000_hbn431, msg_18c547a2d00188ezpU7qgOnNJW ; hash local de l'archive source recalculé et conforme,82421743octets/SHA752dbd73150920607daa8d4d87d3080451fb3f89973d98141897392348bbaedd.
- [Définition ratifiée et artefact précis](../evidence/server-source-field-decision-158.json).
- [Provenance157](../evidence/server-release-provenance-157.json) :4908octets/SHAd98df6a08fe2245ca4ec2a8acf2b75dbfcb063f90ba9caec77d0441e9cdb1999.
- Pas de nouveau téléchargement, extraction, test, changement produit ou effet natif pour cette ratification. M2 reste ouvert.
