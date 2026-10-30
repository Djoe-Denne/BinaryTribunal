# 34. Projection corrigée reçue pour contrôle ; typecheck en échec

## Objectif et résultat

Le nouveau candidat contient désormais l'approbation privée requise par32. Le parent a vérifié sa présence et son rattachement aux méthodes parent, puis épinglé365 fichiers : sept chemins modifiés,3493 dépendances identiques. Le fichier eventlog ne porte que les adaptations de version autorisées. Ce rapprochement ne prouve pas encore la sûreté ni le comportement de la projection.

Le premier typecheck complet **échoue, code2**, environ10,9 secondes. Les quatre diagnostics sont dans le nouveau fichier next-context.test.ts : trois incompatibilités de surcharge aux assertions et un objet dont kind est inféré comme string au lieu du type ArtifactFile attendu.

**Aucun test comportemental de projection n'a été exécuté.** Les39 cas écrits restent des scénarios non prouvés ; aucun PASS ni revue indépendante déduit du commit ou du rapprochement statique.

## Correction décidée

Le même développeur est repris pour corriger seulement le typage du test et de son helper d'oracle indépendant. Le contrat d'approbation et les sources restent gelés ; aucune suppression d'assertion, usage de any pour masquer le défaut ou relaxation du type de production n'est autorisé. Il livre un nouveau commit et des pins sans exécuter de test produit. Le parent repinnera puis rejouera le contrôle affecté.

Ce correctif local ne nécessite ni nouvelle architecture, nouvelle phase de permissions ou GO utilisateur. La revue indépendante suivra le candidat suffisamment stable avec ses preuves réelles ; l'intégration reste interdite en l'état.

## Preuves et portée

- Candidat : HEAD `1a1e4f61d9e4b4dce72c4f55d8109313f74c6d36` ; premier pin parent `projection-r1-manifest.json`, SHA256 `be5402f7fa24bda513baadc16c09b003f7052673db31a02298ec2ea08e2ce3fd`. Le nom r1 parent désigne bien le candidat corrigé32, pas l'ancien commit dba86c50.
- Reçu/captures : `../evidence/projection-typecheck-r1.execution.json`, stdout et stderr associés.
- Diagnostics : test/graph-integration/next-context.test.ts:142:119,151:38,151:88 (TS2769) et442:7 (TS2322, kind:string non assignable à ArtifactFile).
- Contrôle ciblé du code : approveNextContextArtifact/revokeNextContextApproval et garde privé dans graph-store.ts ; test de forge sans ligne privée et migration additive présents. Leur exécution et leur revue restent à faire.

Localisation : candidat isolé conforme au périmètre annoncé, types des nouveaux tests. Impact : correction de compilation bornée avant QA comportementale. Limites : aucune acquisition de nouveaux contenus encore prouvée ; v3/natif et clôture globale non acquis.
