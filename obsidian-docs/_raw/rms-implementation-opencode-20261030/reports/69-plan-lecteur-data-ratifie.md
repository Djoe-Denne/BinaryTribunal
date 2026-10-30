# 69. Plan du lecteur DATA ratifié pour réalisation

## Décision et portée

Le parent ratifie le plan final reçu du développeur. Les dépendances de protocole sont désormais livrées et les règles de curseur et de confidentialité sont explicites. La réalisation peut commencer, après handoff natif, dans le seul worktree dédié. Elle reste limitée à un lecteur de données : aucune exécution, qualification, preuve terminale ou libération de ressources n’est produite.

La base et la branche ont été relues par le parent : base81be09d, branche651cf87d, statut suivi propre. Le refus d’accès direct au gitdir par le développeur n’est pas contourné ; cette attestation parent ferme la vérification préalable nécessaire.

## Contrat de réalisation retenu

- Quatre fichiers : nouveaux `graph-native-observations.ts`, `native-observation-transport.ts`, test `native-observations.test.ts` et extension bornée de GraphStore. Admission au repos, EventLog, schéma de base, Engine, CLI, v3 et cycles existants inchangés.
- Journal existant : BEGIN et RESULT versionnés, scope/image retenus avant lecture, curseur repris des seuls lots vérifiés. BEGIN orphelin après crash reste incomplet. CAS du curseur de base et append transactionnel, aucune régression ou perte silencieuse.
- Premier after omis ; reprise exclusive depuis une valeur native exactement représentable. Pas de continuité seq+1 exigée. Curseur au watermark seulement après fin propre, marqueur cohérent et absence d’erreur/inconnu/dépassement, sous autorité actuelle. Message absent et complétude du log restent des états distincts.
- Framing UTF-8/SSE incrémental, un seul décodage JSON par donnée, enveloppes durable et synced distinctes. Événement de failure même après synced rend le lot incomplet. Onze variantes de message distinctes, aucune supposée assistant ; pas de sessionID commun inventé sur le message.
- Le journal et la lecture du message ne constituent pas un snapshot natif atomique. Les divergences de doublons concernent les événements immuables ; un message peut légitimement évoluer entre deux lectures, conservées comme snapshots DATA distincts, sans version « as-of-watermark » inventée.
- Projection d’enveloppe seulement : identités possédées, tags fermés, seq/version et empreintes séparées des octets, du JSON natif et de la projection. Aucun texte, argument/sortie d’outil, metadata libre, identifiant distant libre en clair, localisation ou erreur brute persistés. Le payload opaque n’est pas prétendu intégralement validé.
- Au plus cinq GET : identité, log possédé fini, identité avant message, message retenu, identité finale. Aucun endpoint caller, session étrangère ou liste active globale. Garde native privée, jamais remise au faux port. Révocation : conservation bornée des faits déjà reçus, aucune lecture suivante, ancien curseur conservé.
- Deadline globale10s,262144 octets cumulés,1024 frames/projections au plus,64KiB par frame, redirections refusées et lecteur annulé/libéré en finally. Discovery tardive ne peut lancer un GET après fermeture de la garde. Ne pas promettre l’annulation interne du SDK si son contrat ne la permet pas ; la fin bornée et l’absence d’effet ultérieur doivent être testées.

## Validation et condition d’arrêt

Auteur : code et tests hors ligne, aucun test/typecheck/CLI produit ou appel natif exécuté. Après gel, parent : compilation puis seules sélections ciblées inspectées, dix minutes par test ; primitives et admission antérieures réutilisées selon impact. Revue indépendante avant intégration, reprises limitées aux défauts bloquants et impacts.

La liste fermée comprend fragments/UTF-8/SSE et11 tags, after absent/seq0/gaps/marker vide, failure tardif, doublons/divergence, attribution étrangère,404, limites/deadline/cancel, crash/reopen/concurrence, révocation et non-promotion/absence de secrets. Aucun nouveau framework, watcher ou scénario scientifique. Arrêter la correction lorsque ces critères et la revue sont satisfaits, sans chercher une couverture abstraite maximale.

## Trace

Tâche `task_mvtmt1jp_0019_u4jghm`, session `ses_e77f5fdb0ffe9qGCyl5t0tQOX6`. Worktree `ensemble-793e3f62-2fkx8e-observations-native-data` ; base exacte `81be09dc390794aa19473438a68b6b0a0d8edabd`, branche `ensemble-651cf87d-a4d5-4c67-a801-93f4750561ca`. Contrat68 et paquets sources possédés restent les inputs ; aucun contexte privé de reviewer ne sera transmis au développeur.
