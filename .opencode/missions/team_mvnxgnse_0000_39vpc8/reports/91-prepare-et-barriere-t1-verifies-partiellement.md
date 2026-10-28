# M2 — 91 : préparation et barrière T1 vérifiées, acceptation partielle

## Résultat parent

**Typing vert et87PASS/0FAIL/0SKIP,592assertions.** Trois fichiers exécutés :60cas de réservation/atomicité affectés par le nouveau seed, plus27casT1. Sources et contrôles inchangés ; gate90 close après2invocations/21307ms, aucun retry, timeout, signal ou erreur d'outil.

Le parent accepte **prepareInitial + entrée en drain T1 en fixture**, partiellement sur le budget de préparation : bootstrap1, nouvelle origine+1, retry0 et rollback0 sont observés, mais **trois commits puis quatrième refus au plafond restent obligatoires/non obtenus**. Aucun waiver ni clôture globale deS2/M2. Le87 n'est pas additionné aux60 du snapshot82 pour fabriquer une couverture différente.

## Ce qui est réellement exercé

Les27nomsPASS T1 ont été relus : T0 et compteur1→2, cut incluant une vraie famille réservée sans outbox, doublon exact sans effet, rollback après vrai appendT0/T1, révocation de l'observation après append annulant toute la transaction, head/case révoqué/bootstrap-handle refusés, réservation aprèsT0 rendantT1 stale sans refresh, continuation A avec capacité fraîche et refus propre du profilR, Q/release sous drain avec case révoqué/provider inconnu sans levée de barrière ni remboursement, counter/source/grant indisponibles, B/native refusés, reopen conservant barrière/cuts/compteur, autre-case/mêmesbindings refusé et preuves d'issuer/ownership/première émission manquantes/révoquées/renommées refusées.

La fille a effectivement passé les préconditions S1 des scénarios nominaux. Ce n'est pas une nouvelle campagne complèteQA S1. Les octrois et preuves d'hôte restent synthétiques privilégiés ; aucun issuer natif ou garantie globale inter-OWN inféré.

## Intégrité et conservation

[Bilan machine](../evidence/s2-t1-88-validation.json). Typing1962ms, runtime19345ms ; source revuead2577ba… et sourceSet exécuté7776eee7… . Hashes stdout/stderr conformes aux reçus ;87nomsPASS,0FAIL/SKIP. Reçus typecheck8e40333d… et runtime380377ed… .

99basesSQLite neuves/158896128octets, toutes réservées et possédées ; aucun fichier inconnu ni dérive de hash, processus terminé. Inventaired93cfeb8… . Conservées avec les traces, sans cleanup ou réouvertureSQL cachée ; les157réservations restantes ne sont pas annoncées créées. Bases82 intactes/nonréutilisées. Anciens paquets et échecs préservés, aucun compteur réinitialisé.

## Suite bornée : examiner T2 sur une transition A→A minimale

La prochaine obligation est la collecte finale ActivationAttempt etT2 ; T1 seul ne rend jamais la fille ACTIVE. DRAIN70–95 impose un inventaire final complet et la quiescence réelle, absence de champ/API=>UNKNOWN. DRAIN339–378 sépare la tentative immuable des attentes courantes et le CAS final, interdit la levée implicite de barrière et exige encore une admission distincte après ACTIVE.

Continuer par une préparation **lecture seule**, limitée à la voie fixtureA→A sans famille engagée comme premier chemin minimal. Ce chemin n'est valide qu'avec une preuve indépendante explicitement complète de l'absence de tous intents/outboxes/claims/publications/matérialisations en attente ; ne pas transformer les interfaces manquantes en tableaux vides. Une famille engagée ou catégorie inconnue demeure HOLD, sans fabriquer receipts/fichiers ou entreprendreS3 en cachette.

Identifier les préconditions/ports/records manquants, les unités critiques à préparer avantCAS, les compteurs de tentatives (indépendants de préparation3), l'autoritéA finale distincte du caseT1, et le petit delta nécessaire. Examiner si ce cycle autorisé peut ultérieurement produire une vraie histoire de trois origines puis quatrième refus, sans ouvrir replacement/staging hors scope ni biaiser le motif du refus. C'est une piste de preuve, pas un résultat ni un GO codeT2.

Sources91/inputs/99DB/logs gelés. Aucun nouveau code/importévalué/scellement/typing/test/SQL/DB/native/Git par cette préparation. T2/attempt/replacement/succession/S3/public/publication/S4global et QA indépendante plus large/L9/L10 restent non acquis ;000b/S2global/M2 ouverts. Trois commandes consolidées toujours à exécuter au stade applicable.
