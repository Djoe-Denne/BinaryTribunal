# L7 copie851 — revue indépendante NONBLIND finale

## Verdict

**ACCEPTABLE_SCOPED_OFFLINE** pour le candidat entier piné, dans les frontières ratifiées d'acquisition et de simulation. Aucun BLOCK produit non résolu n'a été trouvé. Ce verdict de worker n'est ni l'acceptation parent, ni une intégration, ni une validation globale L7/L8/native.

Session ses_eba369739ffehvsCe5mwiHl4YJ, openai/gpt-6.1-sol/max, profil Plan, tâche task_mvb91iar_003f_0d5wmp. Lecture statique entière de simulator.ts lignes 1–1385, 33 DTO recalculés au texte exact, 85 membres Engine (40 champs/45 méthodes), quatre candidats et contrats lus. L'identité des 254 fichiers harness V1/V2 a permis la réutilisation explicite du TSC0 et de cette lecture, pas une nouvelle compilation implicite.

## Exécutions réelles et conservation de l'histoire

- TSC unique : PID45324, exit0 naturel, 4.8735924 s. Lifecycle SHA256 4b9be4c7afc11e60a696f9f8e047f497ec7f7517f67899c53c7f17a27e73758e. Aucun rerun TSC.
- V1 : la tentative de wrapper a arrêté avant le test sur une ancienne comparaison inter-sandboxes envDigest OR guard. Sa branche/clef causale reste non attribuée. Diagnostic604a5c8b, flag de layout FALSE, cache outil et snapshot sont conservés; aucun nettoyage ou changement global n'a servi de réparation.
- V1 ciblée réelle : PID43764, exit1 naturel, 254 PASS/1 FAIL/0 SKIP, 17608 assertions, 255 tests/14 fichiers. Le ledger était absent du paquet parent; le cas raw98 n'avait pas atteint ses assertions aval. Ce rouge et ses dix DB restent rouges et conservés; aucune attente de test n'a changé.
- V2 : nouveau gel, seul ledger local byte-exact ajouté par le parent, reçu distinct du helper. PID4276, 18:34:11.326Z–18:34:29.096Z, exit0 naturel, 17.7691268 s : **255 PASS/0 FAIL/0 SKIP, 17622 assertions, 255 tests/14 fichiers**. Le cas raw98 est réellement PASS; ses données restent OFFLINE/PARTIAL/quarantined, non une preuve native. Le créneau a été rendu avant collecte.
- Probes indépendantes : PID48168, 18:59:46.080Z–18:59:46.200Z, exit0 naturel, 119.6444 ms : **12 cas déclarés, 12 exécutés, 12 PASS**, une invocation, au plus deux unités par fixture. Zéro nouveau TSC/ciblée/full/benchmark, zéro nouvelle DB/port. Aucun follow-up, changement d'oracle ou rerun après résultat.

## Oracle indépendant, variantes et contraires

PLAN.json et PROBE_SCRIPT.ts ont été figés AVANT toute exécution de produit. Les paramètres complets, transformations, attentes, contraires et importations publiques sont conservés; il n'y a ni algorithme de scheduler réimplémenté comme oracle, ni helper de test auteur appelé, ni accès privé as-any.

M01 : quatre workers compatibles speed=1, quota4, capacités compte slots4/budget40, unités manuelles v2 unrestricted, outil cpu, policy event_driven et rolesParallel absent (donc true), validation1. Pour chaque unité A2/B5 en parallèle, puis R3, puis validation1 : max(2,5)+3+1=9. P précède C via commit : chemin et makespan18; travail nominal hors validation=2*(2+5+3)=20; occupation/useful20. Prototypes custom/null, aliases acycliques, freeze légitime, source own-undefined et caller inchangé sont contrôlés.

M02 réutilise M01 pour event_driven et déclare l'unique variante sequential : rolesParallel absent y devient false, donc (2+5+3+1)*2=22. Le chemin nominal reste18. Aucune troisième politique/config cachée.

M03 mute seulement les objets caller dans le premier callback, réutilise puis modifie son retour; l'image privée reste18/20, deux callbacks P/C, observation au frontier d'événement2 et occupation4. M04 refuse un getter auxiliaire sans appel du getter ou des durées. M05 est le journal valide explicite de M01, capture/replay et voie Map interne légale. M06 est son UNIQUE variante dupliquée, self-hash recomputé publiquement : refus qualifié des tuples avant Map, journal caller inchangé. La proposition informelle de fixture Map-subclass supplémentaire a été retirée AVANT déclaration/exécution pour ne pas dépasser douze variantes.

M07 construit deux nœuds synthétiques par les APIs publiques graph-normalize/L5 puis exporte vers SIM : archive v2 égale au vrai MissionPlan, P commit9/C18, travail20. M08 enlève seulement le besoin local de C : P commit9, C BLOCKED/0 tentative, archive non réparée et inchangée, occupation10. Le makespan STUCK observé64 n'est pas confondu avec publicationEnd9.

M09 fournit une archive legacy v1 sans backfill : validate/run refusent avant callback; planShape conserve son rôle de mesure et capture avec résultat fourni conserve son rôle d'attente, pas de validation globale ajoutée. Version1 non réparée, quatre callbacks pour les deux acquisitions explicitement déclarées. Le journal legacy produit est une SORTIE, jamais un treizième input de replay. Aucun claim d'exécution de ce scénario invalide par capture.

M10–M12 : deux familles indépendantes A/B partagent UNE clé exclusive directe, durées auteurs4/7, R2, validation1, quatre workers speed1. Une famille complète coûte13 worker-ticks et10 ticks après admission. Adoption@1 puis HARD@2 et stop@3 : deux jobs A occupent6 ticks, HARD interdit une nouvelle génération, B démarre3/commit13, occupation19/useful13/rework6, zéro reworkAttempt. Le makespan STUCK67 n'est pas présenté comme13. Adoption seule : A commit10/B20, occupation26, une tentative chacune, duplicate publication refusée. Cancel@2/stop@3 retry légal : FIFO B démarre3/commit13, A retry13/commit23, occupation32/useful26/rework6, une reworkAttempt. Ces contraires étaient préplanifiés dans la même invocation.

## Huit ancrages de revue et reproduction

Chemins source relatifs au gel inputs/L7_COPY851_LEDGER_V2_REVIEW_20261016/ :

1. tools/ff8-harness/src/simulator.ts:149–205 — qualification/copie/fidélité de l'image, aliases, descriptors et erreurs bornées.
2. tools/ff8-harness/src/simulator.ts:284–311 — plan/config/incidents acquis avant callbacks; durée capturée, pas de recapture dans observe/boucle.
3. tools/ff8-harness/src/simulator.ts:365–403 — namespace complet, archive réelle et vues normalisées, sans reconstruction opaque de WorkUnit.
4. tools/ff8-harness/src/simulator.ts:1142–1152 — besoin local opposable, jamais substitué depuis archive; producteur indépendant préservé.
5. tools/ff8-harness/src/simulator.ts:1115–1125 — exigence nouveau-plan monotone, HARD dominant l'adoption.
6. tools/ff8-harness/src/simulator.ts:995–1107 — holders identitaires, attente/réveil FIFO, release réel; pas de fermeture G2 transitive.
7. tools/ff8-harness/src/simulator.ts:1343–1384 — compare/capture/replay, stades conservés et tuples qualifiés avant Map destructrice.
8. PROBES-9c4a62f1c225/PROBE_SCRIPT.ts:29–99 — repros publics M01–M12 complets avec attentes externes PLAN.json et assertions des contraires.

Commande exacte de l'invocation indépendante, depuis le harness du GEL V2 :

    bun C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014/L7_COPY851_LEDGER_V2_PROOFS_20261016/PROBES-9c4a62f1c225/PROBE_SCRIPT.ts

La reproduction n'est pas une autorisation de relance. Les règles du parent, TEMP/TMP enfant et guard doivent toujours être respectées.

## Empreintes, fixtures et artefacts

- Helper402 payloads/9300341B, manifest68d08ec952f40d39e4d4d81cf9a4a80965a385b86bd3d53a9e739dc50c43c1aa, receiptf1d8c527c2209f157c006c6f435d382444090bb3a6e4e7eabdd5791cfc8f31f6.
- PLUS ledger séparé8943882B/b5c9dfa112e53ffde99d7a30ef54a1ce13ae28a4e3c8e14432f085536310e4d4, mode444, regular/nonlink/nlink1; reçu parentf552cc5a0a5fe0adb8f862daea5a6c668540388c7f635e9220e2a3875b2ee988. Total403 payloads18244223B; le reçu helper ne couvre PAS le ledger. Hash-stream seulement côté reviewer, aucun dump/parse modèle9MB.
- Les403 inputs, deux reçus, contrôles parent, scripts/PLAN et sept artefacts TARGETV2+manifest sont exacts avant/après probes. PLAN31776B/132b4b86587bc13d7771da990dca3ccf0f13196e051572b52d09373a6c8e954e; script14312B/8ee92923240f5d8417720b254d8b69d12655fbe60f596edd5f9d5df157e22f98.
- TARGETV2 manifest1350B/400d9a0d538ad9831f7a612df937e4f53bedb243c6944e6df34a8c0167eac276 conserve7 payloads303532B. Ses dix NOUVELLES DB2936832B sont retenues en place, nées pendant ce run, hashes après close-hook=post-exit10/10, zéro sidecar présent. Close qualifié : tentatives du hook (catch déjà-closed) puis fin naturelle du processus; pas instrumentation native additionnelle. Aucun SQL direct worker.
- POST_PROBE_QUALIFICATION.json105891B/e9d7801afc1e064688aab5f271e20ca6abc6a04d7043a01667c9edef25562a43 détaille les résultats et postpins. Les DB anciennes42L7/636L8 n'ont PAS été relues lors des probes; seuls leurs receipts déjà autorisés dans les preuves TARGET sont hashés comme métadonnées, sans ouvrir ces DB.
- TEMP OWN V2 est une continuation non recréée : root[opencode]/nestedEMPTY après probes; zéro cache opaque observé, pas absence forcée. Parent.env inchangé dans CHAQUE sandbox mesuré; guard casefold absent, APPDATA/LOCALAPPDATA uniques exacts, seules overrides TEMP/TMP enfant. Pas d'audit global du système de fichiers ou de causalité native inventé.

## Limites obligatoires

**NONBLIND, pas packet-only depuis création.** Avant réception des consignes FIRST_HOLD détaillées, deux inbox vides, board et un index générique ont exposé des résumés publics historiques incluant d'anciens findings. Le parent a conservé l'admissibilité de la session native distincte avec exposition déclarée. Aucun ancien rapport/session/reasoning privé n'a été importé; aucune ancienne conclusion/PASS n'est l'oracle des présents résultats. La qualification est conservée dans PARENT/PREAMBLE_QUALIFICATION/DECISION.md.

SimStore.write standalone peut figer les tableaux imbriqués d'un commit caller par partage. Les builders bas niveau ne promettent pas une acquisition hostile-JS universelle. C'est la frontière parent explicitement ratifiée, pas une promesse de pureté de toute API ni un waiver révisions/duplicates/publications/deltas. Le moteur passe des tableaux de commit neufs; M11 attaque le duplicate. Les entrées scenario/plan/config/incidents/durées et les wrappers nommés restent sous leur garantie de détachement.

Suppression TOTALE d'origine/export : limite d'authenticité explicitement ratifiée, pas résolue par self-hash. Pas de garantie portable de détection/atomicité de tout Proxy. Petites probes et tests bornés ne prouvent ni exhaustivité JS hostile, ni near-linearité100k, ni couplage host/provider/durable/native. Le modèle de ressources SIM demeure conservateur et non équivalent au family packing L5.

Aucune source/test/oracle/ancien gel, DB, configuration globale, modèle/provider, permission, Git/IDB/live n'a été modifié. Aucun sous-agent, LLM externe, install, reset, delete ou cleanup global. Le parent seul peut accepter/intégrer après ses contrôles finaux et gates croisées; globalQA L7/L8/native demeure ouvert.
