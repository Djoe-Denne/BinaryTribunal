# PM disponibles pour RMS M2 — information de configuration

Date : 2026-10-25. Mission `team_mvnxgnse_0000_39vpc8`.
Session superviseur : `ses_e8c853715ffdpywoSQ7gbvu0Eo`.

Deux profils projet sont déclarés dans la catégorie métier pm :

- **pm-rms** : conseiller logiciel RMS, machine d'état, contrats, graphe,
  persistance, raccordement public OpenCode et plans TDD/QA.
- **pm-re-ff8** : conseiller de préparation scientifique FF8, gels ASM, preuves,
  indépendance des auteurs/reviewers et gates superviseur ; périmètre distinct.

Pour cette mission logicielle RMS M2, le PM correspondant est **pm-rms**.
Ce choix documentaire ne modifie ni le schéma model-policy.json, ni l'objectif,
les scores/modèles/budgets, les tâches, admissions ou autorisations existantes.

Les deux disposent de Code Mode execute et des permissions MCP d'analyse
explicitement nommées, dont les exécutions Context Mode. Cela ne permet ni
écriture métier, shell/tests, délégation, base/registre, IDA ou live.
Guide complet : `docs/tech/PM_PROFILES.md`.

Les deux explorations préparatoires ont été read-only et disjointes :

- RMS : `ses_e8c7554f2ffeeKzk5CzqYDM74h` ;
- RE : `ses_e8c74ad8bffeGLQdUoxGmmM4pO` ;
- modèle effectif des deux : openai/gpt-6.1-sol, variant high.

Point d'attention : l'objectif persistant fait 27073 caractères, au-delà de la
borne de 20000 de prepare. Aucun raccourcissement, contournement, prepare ou
réimport n'est réalisé ici. La limite relève d'un traitement séparé éventuel.

**Configuration seulement, pas un GO.** Ne pas relancer la mission, créer de
workers, exécuter prepare/start ou changer un état pour accuser réception de
cette information. L'orchestrator reste le superviseur ; sa session, son modèle,
sa politique de mission et les campagnes historiques sont conservés.

## Vérifications d'installation

Les deux profils sont présents au catalogue natif, mode all, modèle effectif
openai/gpt-6.1-sol, variant high. Leurs règles résolues autorisent execute et
les actions MCP listées ; édition, shell, délégation, outils d'équipe et
activation Serena restent refusés. Aucun run PM supplémentaire n'a été lancé :
ces contrôles prouvent la configuration, pas la réussite future de chaque MCP.

Le validateur métier accepte les deux associations ; les entrées précédentes
et l'extension operator sont identiques. Le lint des profils existants est
inchangé : quatre erreurs préexistantes. Les nouveaux profils n'ajoutent aucune
erreur ; leurs warnings concernent le modèle préféré et les heuristiques de
texte (chemins pris pour modèles, restrictions prises pour refus d'execute).
Execute est explicitement autorisé dans le corps et les règles natives.

Notification durable déposée via API publique avec resume:false, delivery queue :
`msg_173b6d11a001gTYbWoixn3K0xW`. Présence dans l'inbox vérifiée, aucun nouveau
message assistant. Agent/modèle/permissions du superviseur, ligne de politique,
fichier de politique, AGENTS.md et profil orchestrator inchangés par empreintes.
Toujours zéro tâche et zéro membre. Aucun commit/push, test RMS, IDA ou live.
