# Profils PM de re-ff8

Installation : 2026-10-25. Deux domaines distincts, une catégorie métier `pm`.
Les PM assistent le superviseur existant ; ils ne le remplacent pas.

## Choisir le profil

- **pm-rms** : logiciel d'automatisation RE, machine d'état, contrats, graphe,
  planification, persistance, pont public OpenCode, plan TDD/QA et preuves.
- **pm-re-ff8** : missions scientifiques FF8, questions par EA/famille, gels ASM,
  indépendance des auteurs/reviewers, preuves, certitude et gates superviseur.

Les deux sont `mode: all`, préférence native `openai/gpt-6.1-sol#high`.
Les associations figurent dans `.opencode/ensemble.json`, pas dans le frontmatter.
Cette préférence ne remplace pas une politique modèle approuvée par mission.

Avec deux PM admissibles, sélectionner explicitement `--pm`. Exemples pour une
nouvelle préparation autorisée et des entrées compatibles avec ses limites :

```text
/ensemble-mission prepare --pm pm-rms --history fork <mandat logiciel autonome>
/ensemble-mission prepare --pm pm-re-ff8 --preplan <préplan court> <mandat scientifique autonome>
```

Les options précèdent le mandat. Fork est optionnel et ne confère pas d'autorité.
Ne pas transmettre cet historique aux futurs auteurs scientifiques aveugles.
Un PM connu de la mission n'est pas un worker affecté ; installer un profil ou
recevoir ready ne vaut ni import supplémentaire, ni autorisation start/live.

## Consultation MCP et execute

Les deux profils autorisent explicitement **execute** et les actions nommées de
GrepAI, Serena, QMD, Context Mode (`ctx_execute`, `ctx_execute_file`, `ctx_index`,
`ctx_search`). Autoriser execute seul ne rend pas les outils MCP disponibles.
Vérifier catalogue effectif, action native exacte, connexion et réussite réelle ;
ne pas supposer que le nom d'un namespace détermine son action de permission.

Ces capacités servent à lire/rechercher/analyser, pas à contourner les refus.
Les outils génériques de code, notamment Context Mode, ne constituent pas une
sandbox read-only parfaite : aucun script d'analyse ne doit écrire l'état métier,
lancer une commande/processus, exécuter la QA, lire des secrets ou appeler une
API de contrôle à la place d'un outil refusé. Les permissions natives d'édition,
shell, sous-agents et outils d'équipe partent de deny et ne sont pas ouvertes.

Racine source commune : `C:/Users/djden/source/repos/retro-eng`. Ne jamais changer
l'activation d'un Serena partagé. Le serveur courant est configuré pour C++ ;
un refus TS est une limite de couverture, pas une absence du fichier. GrepAI peut
également ne pas couvrir un sous-périmètre. Après constat, lire/rechercher les
fichiers ciblés disponibles, sans créer d'index ni reconfigurer les services.
QMD : ff8-wiki en consultation uniquement, jamais update/embed/ingestion.

## Responsabilités non transférées

- Le superviseur conserve délégation, décisions, intégration et acceptation.
- Les PM ne modifient ni tâches/sessions, ni bases, registres, IDB ou Git.
- Aucun test/exécutable/CLI de contrôle par défaut ; même un status RMS peut
  ouvrir SQLite et initialiser le schéma/WAL.
- Aucun IDA/debugger/jeu/live ou publication ; gels et reçus manquants sont
  demandés au superviseur. Aucune réactivation de la campagne historique.
- RMS M2 conserve son ordre logiciel reinforced et sa condition d'arrêt. Le
  2+1 scientifique, §5.6 et les gates live ne lui sont pas importés automatiquement.
- Les futures missions RE conservent le 2+1 et les projections indépendantes
  applicables ; le PM ne promeut jamais sur la seule prose ou une fixture.

Entrées de référence :

- `docs/missions/re-graph-scheduler/ORDRE_MISSION_02_REPRISE_RMS_APRES_M1_20261020.md:15–41,346–427` ;
- `docs/missions/re-graph-scheduler/contract/CONTRAT.md:465–517` ;
- `docs/tech/RE_MULTI_PROVIDER_MISSIONS.md:41–58,102–146,207–222` ;
- `AGENTS.md:34–39,59–97`.

## Dernière session et mission identifiées lors du setup

- Session : `ses_e8c853715ffdpywoSQ7gbvu0Eo`, « RMS M2 policy and task preview ».
- Mission : `team_mvnxgnse_0000_39vpc8`, ordre M2 handoff/reprise RMS sans C#.
- Interlocuteur de préparation correspondant : **pm-rms**. pm-re-ff8 est connu
  comme rôle distinct, pas comme spécialiste d'implémentation RMS.
- État relevé avant installation : brouillon révision 0, non approuvé, sans tâche
  ni worker. Le setup n'approuve ni ne démarre cette mission.

L'objectif existant mesure 27073 caractères ; la préparation actuelle en accepte
20000. L'installation ne raccourcit ni ne réécrit cet objectif et ne contourne pas
la limite. Ne pas promettre que prepare peut immédiatement réimporter ce contrat.
Traiter séparément cette incompatibilité si une nouvelle préparation est demandée.

Une notification synthétique informative, sans reprise d'exécution, renseigne la
session. Le rapport propre à la mission est conservé dans son dossier reports.
La politique, son approbation, le modèle/agent du superviseur et l'historique
antérieur ne sont pas réécrits.
