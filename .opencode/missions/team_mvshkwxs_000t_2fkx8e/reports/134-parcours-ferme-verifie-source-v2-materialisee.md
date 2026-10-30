# 134. Parcours fermé vérifié, source V2 matérialisée

## Objectif et résultats vérifiés

Prouver la couverture du modèle fini sans inventer une couverture machine. L'avis indépendant est favorable sur les nouvelles frontières de parcours et de construction. Le parent exécute ensuite les11contrôles ciblés : tous réussissent en193ms, avec un maximum par cas d'environ37,9ms.

Le modèle exact produit une preuve liée aux bytes et aux marqueurs de fin de tous ses tableaux. Une variante pure avec une tail explicite est réellement parcourue. Les sept refus sémantiques atteignent leurs gardes, et le refus de bytes distinct reste une vérification séparée. La source exacte est construite avec zéro diagnostic de planning, sans que cela soit assimilé à une réservation.

## Matérialisation et recharge

Le parent matérialise ensuite la sourceV2 et la preuve dans un namespace neuf, avec créations exclusives et refus d'écrasement. Trois documents sont rechargés séparément et leur liaison est acceptée ; les deux contrats et la règle de contrôle sont comparés aux bytes déclarés. La preuve de parcours est persistée exactement, et la provenance du snapshot la référence.

La première tentative de matérialisation échoue avant toute écriture en170ms : le runner parent utilisait artifacts au lieu du champ réel binaryArtifacts. Le parent constate l'absence des destinations, corrige ce seul champ après lecture du type puis reprend l'opération concernée. La seconde réussit en211ms. Les onze contrôles précédents ne sont pas rejoués ; leurs sources sont inchangées.

Six fichiers locaux sont créés au total, preuve et reçu inclus. Le parent confirme les cinq fichiers référencés, le manifeste, la préservation du bundleV1 et les18fichiers protégés. Le répertoire de sorties du scheduler reste absent.

## Reprise bornée du staging

Le diagnostic global qui interdisait le staging de V1 n'existe pas dans la nouvelle source prouvée. Le mandat130 reprend donc **uniquement pour écrire le petit candidat local de réservation**, avant inspection et QA parent. Il doit consommer V2 et sa preuve ; V1 partielle n'est ni modifiée ni utilisée pour masquer son refus.

Les véritables API de réservation doivent encore accepter le plan, ses versions, prérequis et ressources. Aucun RESERVED, fence ou renouvellement n'est déjà revendiqué. Aucun compte, base opérationnelle, session, travail ou grant natif créé. La preuve porte sur le modèle fixture ; inventaire/canary, acquisitions et droits natifs restent HOLD.

## Preuves

- [Onze contrôles parent](../evidence/closed-source-parent-checks-v1.json).
- [Deux tentatives et matérialisation V2](../evidence/closed-source-materialization-v2.json).
- [Manifeste V2 relu](../native-preparation-132/source-bundle-v2/manifest.json).
- Produit782 inchangé ; aucune suite globale, thread, campagne scientifique ou rejeu des cent tests produit.
