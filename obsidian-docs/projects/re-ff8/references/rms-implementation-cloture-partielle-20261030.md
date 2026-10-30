---
title: RMS — clôture partielle et erreur de frontière d'intégration
category: reference
tags: [reverse-engineering, testing, reference]
summary: Acquis statiques conservés, voie isolée écartée, Auth inconnue après HOLD et reprise préparée comme plugin interne de l'hôte OpenCode V2.
sources:
  - docs/missions/rms-plugin-recovery-20261030/CLOSURE.md
  - docs/missions/rms-plugin-recovery-20261030/preservation-manifest.json
  - .opencode/missions/team_mvshkwxs_000t_2fkx8e/reports/239-connexion-arretee-fenetre-de-validation-trop-courte.md
  - .opencode/missions/team_mvshkwxs_000t_2fkx8e/reports/240-cloture-partielle-et-conservation-dans-main.md
provenance: {extracted: 1.0, inferred: 0.0, ambiguous: 0.0}
created: 2026-10-30
updated: 2026-10-30
---

# Une clôture demandée, pas une réussite technique

L'utilisateur arrête la mission, demande la conservation dans main, l'ingestion et la préparation corrective. **M2 et le parcours RMS/IDA complet ne sont pas acceptés.** Le superviseur reconnaît avoir choisi une instance OpenCode isolée sans démontrer sa nécessité : RMS était attendu comme plugin interne de l'instance hôte.

L'authentification isolée passait bien par l'API OpenCode, pas par un appel direct au modèle substitué à OpenCode. Cette précision ne corrige pas la mauvaise frontière d'intégration. La question de validation humaine OAuth du rapport239 est désormais retirée : aucune nouvelle connexion ou exécution n'est requise pour clôturer.

## Ce que les preuves établissent réellement

- Les acquis statiques intégrés couvrent jonction, admission au repos, observations finies, publication, projection du contexte, commandes ordonnées et obsolescence durable. Ils ne constituent pas ensemble une preuve du parcours natif complet.
- Qualification170 : unique envoi Sol high, réponse exacte QUALIFICATION_RMS_REÇUE en 3,378 s et outils interdits. Pas de travail scientifique ou droit IDA/B/R.
- Lecture seule219 : 32227 fichiers, deux GET200 et fermeture normale en 19,445 s, dans le raccord isolé seulement.
- Correctif226 : typecheck 4096 ms et trois tests ciblés, 98 assertions. Les cas filtrés restent non exécutés. Les preuves224/225 réutilisées gardent leur portée et leur version.
- Interface230 : deux tests factices, trois acquittements positifs en 1,063 s et doublon refusé après un acquittement en 6,416 s. Pas de qualification de connexion.
- Prepare237 : protection du dossier et changement de fence5→6 du bail, sans nouvelle origine. Connect238 : HOLD, quinze événements Auth et aucun COMPLETE/FAILED ; historique et 35 autres tables conservés. runtimeAuthPersisted:null signifie **inconnu**, pas absent ou réussi.
- Identité IDA232 vérifiée en lecture seule. Aucun parcours auteur/revue/publication IDA n'a été exécuté ; le cluster historique de 149 fonctions autour de 0x4ADD10 n'est pas une analyse scientifique réalisée.

## Temps, échec et inconnues

Connect dure 118,869 s extérieurement. Environ 108 s étaient consommées avant l'intention RMS, dont 99,295 s de scan ; environ 15,651 s restent entre tentative connue et HOLD. Ce résultat n'établit ni faute utilisateur, ni refus OpenAI, ni absence de persistance. Le provisoire non adopté ne devient pas une fin native supplémentaire prouvée.

Les limites d'obsolescence logique, de ressources physiques, de délai, de threads et d'origines restent distinctes. Pas de retry automatique, reset, nouvelle lecture Auth ou levée d'arrêt. La suite globale bun test n'est pas revendiquée. La limite applicable est dix minutes par test ; les anciennes mentions de quinze secondes dans les documents historiques ne sont pas la politique courante.

## Conservation et reprise

Le candidat340 et ses six fichiers finaux198 sont archivés de manière reconstructible, **sans activation**. Les rapports et reçus publics sont conservés avec hashes. Bases natives, secrets, dépendances et caches restent hors Git/wiki. Cette archive ne transfère aucun droit et ne remet aucune origine à zéro.

Voir [[projects/re-ff8/concepts/rms-plugin-hote-opencode-v2|contrat de reprise plugin]], [[_raw/rms-implementation-opencode-20261030/catalogue|catalogue des sources]], [[projects/re-ff8/references/rms-documentation-cloture-20261028|plan documentaire accepté]] et [[projects/re-ff8/re-ff8|projet]]. Les récits du 28 octobre restent historiques ; ils ne prouvent pas les réalisations du 30 octobre.

L'ingestion met les fichiers du vault à jour. L'index QMD n'est pas recompilé : update/embed sont interdits dans cette supervision. Une recherche sur l'ancien index n'est pas un contrôle de découvrabilité des nouvelles pages.
