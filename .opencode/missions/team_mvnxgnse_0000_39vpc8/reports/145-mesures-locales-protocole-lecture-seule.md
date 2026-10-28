# M2 — 145 : préparer des mesures locales sans relance à l'aveugle

## Constat et arrêt de la piste CPU

L'aide spécifique bun test144 a réellement terminé exit0/16ms ; elle ne liste pas --cpu-prof, contrairement à l'aide globale142. Le run143, flags avant test, n'a produit aucun profil. Ces constats n'établissent pas l'impossibilité de tout profilage Bun, mais **la capacité nécessaire n'est pas démontrée dans les conditions testées**. Pas de sonde supplémentaire autorisée puisque la condition d'options exposées au runner n'est pas satisfaite ; aucun nouveau run produit sur la seule promesse de l'aide globale.

Le test143 reste0PASS/1FAIL/105975ms et la captureCPU reste non obtenue. Reçu/logs/intégrité vérifiés : uneDB/40738816octets, unasset/troisentrées,0unowned/0hashdrift/manifeststable/processExited. ReçuSHAfc95637e2bb964a8d93c3fb3b704b3697de1139edab2b9fd847c71f0e7b1bd85 ; profilabsent, artefacts conservés sanscleanup.

## Prochaine préparation autorisée, pas instrumentation

Demander à l'auteur un **protocoleRO compact de mesures en mémoire** du trajet existant OLDREADY→swap→freshfinal. Préférer quelques chronos de phases horsTX et compteurs temps/bytes aux sites bind/stage/finalDocument déjà identifiés. Nommer les fichiers et le delta minimal nécessaires, sans l'écrire. Aucune nouvelle dépendance, module général de tracing, service, inspector, framework, process/runner externe, callback fourni par le demandeur ou IO dans une transaction.

Le protocole doit isoler instrumentation et autorité : résultats diagnostics ne sont jamais lus par les gardes, pas cache ou évaluation évitée, pas modification des preuves persistées/publictypes/oracles/branches. Les compteurs sont des données de mesureRAM, pas un input de décision ; collecte/readout uniquement horsTX, avec attribution propre/inclusive claire et entrées/bytes exacts, erreur/throw comptés sans modifier l'exception. Pas de nouvelle source HOST ou de variable cachée qui élargirait les permissions.

Spécifier activation explicite privée, durée de vie/reset, absence d'exposition RPC/effets de concurrence, et comment préserver la version138. Tout besoin de nouveau fichier/module/contrat doit être nommé avant autorisation. Une mesure ciblée future pourrait créer un OWN/asset neuf et exécuter le même cas/les mêmes assertions sous15s et un plafond fini ; les résultats resteront FAIL si le délai est dépassé. Aucun run ou métrique de cette proposition ne sera pris pour une qualification générale ou un gain causal.

Si le worker estime qu'un harnais important ou une frontière d'architecture est indispensable, le signaler au parent avant conception/exécution : arbitrage requis. Sinon le parent pourra autoriser un petit raccord local dans le périmètre mission, puis revue ciblée et gate diagnostic distinct. Cette préparation ne crée pas un nouveau pipeline de reviewers ni un objectif de couverture maximal.

## Permissions et limites

Message de proposition uniquement, aucun fichier écrit. RO sources/helpers auteur connus et logs déjà autorisés, pas importévalué/replan/seal/bind/typing/test/thread/SQL/DB/opener/asset/provider/native/Git/délégation/oracleQA. Pas de nouvelle recherche de méthode/provider ou d'installation. Source138/inputs122 et tous artefacts gelés.

HOLD125 intégral ; trois vrais cas thread toujours non lancés. Les lots141/143 restent rouges,134 partiel clos, typing140vert ne compense pas ces défauts. S2/M2/remplacement/S1concret global/contention non acceptés, commandes consolidées non lancées. Aucun seuil15s/300s relevé.
