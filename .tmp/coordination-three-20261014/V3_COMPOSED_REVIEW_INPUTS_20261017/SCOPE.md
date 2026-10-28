# Review composée V3 — sources guardian core + kernel observer, scope source seulement

Fresh reviewer indépendant, NONBLIND déclaré. Objet : les livrables SOURCE gelés de
v3-guardian-core-r1 (task_mvc42woi_0006_kj3b51) et v3-kernel-observer-r1
(task_mvc42woi_0007_28drf0) contre le contrat ratifié draft2 (bb69e0ad), l'ABI1
physique (bb4758cc, 8016B), les scopes parent (f8611364) et le module budget accepté
(0944a3bb). Auteurs disjoints entre eux ; tu n'es ni l'un ni l'autre. Review seule :
pas compile, pas test, pas exécution native/Job/Process/écriture FS, pas transpile,
pas génération de fix, pas promotion, pas intégration centrale L8. Toute conclusion
= preuve source:ligne.

Attaquer (minimum, non exhaustif) :

- Conformité ABI1 : signatures, types, états/époques, bornes. Toute divergence
  source↔ABI est un ancrage.
- Handles typés, droits et durées de vie : CreateJobObjectW, assign-before-resume,
  ordre ResumeThread, doublons inventoriés, CloseHandle par outcome, aucun PID reopen.
- Correction #2 : ActiveProcesses ne décrémente qu'après exit ET libération de toutes
  les références process ; lecture exit sur le handle original, witness racine gelé,
  fermeture des refs owned + doublons inventoriés, puis requête J avec le handle
  original vivant.
- Correction #3 : deux requêtes non-atomiques — exiger même J original non NULL,
  même époque, admissions scellées, racine terminale, lectures réussies ultérieures,
  ET ActiveProcesses=0 ET NumberOfAssignedProcesses=0 ET
  NumberOfProcessIdsInList=0 ; liste tronquée jamais réputée vide ; buffer borné,
  retries bornés.
- Correction #4 : G crée/assigne T (pas de duplication J vers D) ; handles/droits/
  époques/drapeaux publiés, JobMemoryLimit réel 4GiB.
- Corrections #1/#5 : matrice S/D/G-loss publiée, G-loss = HOLD jamais PASS ; erreur
  ≠ cleanup immédiat — admissions bloquées, FORCED_STOP avec J tenu, clôture par
  outcome, distinction sortie ordonnée vs perte avant preuve ; ancien case6
  last-close reste NOT_ESTABLISHED.
- Observateur : injecté via IGuardKernelObserver, ne duplique aucun oracle natif ;
  records bornés, exceptions bornées, erreurs fail-closed, pas de compteur driver,
  pas d'IOCP.
- Budget : 8 slots fixes = 262144, chunk ≤4096, réservation capturée AVANT Read
  (≤min(4096,restant)), UTF8 invalide conservé brut, tuer G d'abord perd l'oracle,
  ledger writer catégorie→owner→sinks→sous-caps, budget intégré NOT_PROVEN, débit
  avant tentative, HOLD réentrant/concurrent collant sans charge. Toute divergence
  avec BudgetedEvidence.cs gelé = ancrage.
- Tests SOURCES eux-mêmes : vérifier que chaque clause contractuelle citée est
  réellement assertée par un test ; un test qui ne lie pas la clause ne prouve rien.
  Recalculer les petites constantes si des pins numériques existent.
- Intégration : façades assemblage candidat isolé seulement ; pas de câblage central
  L8, pas de run, pas de qualification.

Verdict : ACCEPTABLE_SOURCE_SCOPED | CORRIGE | BLOCK avec 3–8 ancrages
source:ligne, contraires précis, limites et plus petit travail suivant requis.
Rapport PUBLIC via team_message au lead seulement ; aucun fichier produit, aucune
écriture hors contexte. Bootstrap NONBLIND déclaré (lectures board/inbox au
démarrage), jamais packet-only. Si un input manque ou diverge : HOLD immédiat,
constat rapporté, aucune inférence. Aucun fallback modèle. Si un défaut est établi :
correction nouvelle pinée et review selon sa portée, gels et résultats conservés.

Cette review ne ferme ni tâche, ni gate, ni qualification ; compile/qualification
restent des gates parent distinctes (task_mvc44d90_000c, liage dependsOn à faire par
le parent). Modèle du reviewer : cursor/claude-opus-5-5 Claude Opus 5.5 Max
(complexité >80, règle utilisateur), spawn fresh, Model.Ref vérifié au spawn.
