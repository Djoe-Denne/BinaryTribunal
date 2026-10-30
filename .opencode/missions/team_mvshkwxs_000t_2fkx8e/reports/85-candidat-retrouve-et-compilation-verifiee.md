# 85. Candidat retrouvé : compilation vérifiée, revue engagée

## Objectif et résultat

La réalisation des commandes ordonnées et de l'obsolescence n'était pas perdue : l'auteur avait terminé et conservé un candidat, mais son rapport n'était pas remonté dans la file du superviseur. Une récupération bornée des messages natifs de la session possédée a retrouvé son état final, sans recréer de worker ni relancer le travail.

Les sept fichiers du manifeste correspondent au candidat épinglé. La compilation TypeScript a réussi en 3 882 ms après correction d'un prérequis local manquant. Une revue indépendante fraîche est engagée. Aucune intégration ni réception de cette réalisation n'est encore prononcée.

## Preuves et incident de préparation

- Lecture du handoff et du manifeste conservés dans le worktree ; vérification parent des sept tailles et empreintes : conformes, HEAD attendu confirmé.
- Premier `bun run typecheck` : échec d'environnement en23 ms, compilateur introuvable car `node_modules` absent du worktree. Ce n'est ni un PASS ni un défaut TypeScript démontré.
- Dépendances locales du dépôt principal vérifiées : TypeScript5.9.3, types Bun1.4.0, client OpenCode2.0.26. Jonction locale du worktree vers ces dépendances déjà présentes, sans installation, réseau ni modification globale.
- Deuxième `bun run typecheck` sur les mêmes octets : code0 en3882 ms.

L'outil de rapports annonçait des éléments non lus mais renvoyait une file vide, voire réaffichait les demandes du superviseur. La lecture native a établi la livraison du candidat ; elle ne prouve pas la correction du mécanisme de notification. Le binaire CLI actif a été localisé parmi les processus existants, puis seules les routes GET découvertes par son OpenAPI ont été utilisées pour cette récupération. Aucun réveil ou nouvel essai de travail n'a été demandé.

## Manques et suite

L'auteur déclare sept nouveaux cas de test, mais reconnaît des négatifs non dédiés : révocation parent injectée après append, obsolescence pendant quota et publication physique ambiguë. Ces risques requis doivent être couverts par des preuves pertinentes existantes ou des corrections ciblées ; ils ne sont pas réputés satisfaits par la compilation.

La revue indépendante examine le candidat sans exécution. Le superviseur inspecte imports et branches avant les primitives et les sélections ciblées. Aucun test produit, qualification native, suite globale ou chemin gelé n'a été exécuté dans cette étape. La livraison ordonnée reste explicitement hors ligne ; son raccord natif et le scénario final demeurent des obligations ultérieures.

## Annexe technique

- Candidat : `77200f40c1892480b7deb97110abbfaf451ad2bb`, base `e1a58997b6d0fe4e145aa844382f9ce1c637d0e2`.
- Finale native retrouvée : `msg_188ddf5a8001gTVHUWhUQHvXv5` ; confirmation conservée : `msg_188de74b3001UubeXcvQcv81wk`.
- Revue : `task_mvtv59zu_0002_weqm1s`, `revue-commandes-obsolescence`.
- [Reçu de compilation parent](../evidence/obsolescence-r1-typecheck-parent.json).
- Contrat et plan : [rapport83](83-contrat-obsolescence-ratifie-et-plan-de-realisation.md), [rapport84](84-plan-commandes-obsolescence-approuve.md).
