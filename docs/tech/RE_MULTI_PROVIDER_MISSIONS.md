# Futures missions RE x86 et live — coordination multi-provider

Accord de setup utilisateur : 2026-10-10. Ce guide configure une méthode,
**pas une campagne ni une autorisation d'injection**.

## 1. Périmètre et autorité

La campagne battle-static-discovery déjà enregistrée reste sous son
[avenant de pool](investigation/battle-static-discovery/POLICY_campaign-pool-2026-10-10.md)
et ses registres : harness natif, modèles/high, frontières pilote et gates
inchangés. Ne pas lui appliquer rétroactivement ce guide ou créer une équipe
Ensemble pour la reprendre sans migration séparément autorisée.

Une future mission possède un GO explicite, un ID, des EA/fichiers possédés,
un budget, des replis autorisés, des critères d'acceptation et une frontière
avec les campagnes actives. Charger `opencode-ensemble` ; utiliser son protocole
opérationnel plutôt que le recopier dans les profils.

Le profil `orchestrator` reste utile pour l'expertise et la supervision. Si la
session principale est déjà ce superviseur, elle peut être directement le lead ;
ne pas lancer un orchestrator enfant redondant. L'identité lead vient d'Ensemble,
pas du nom du profil. Le lead seul délègue, arbitre, intègre et valide.

Pas de taille d'équipe fixe pour ces futures missions. Choisir des tâches
réellement indépendantes ; alimenter les tâches prêtes sans sauter leurs
dépendances. Le modèle conversationnel du parent n'est pas changé par le routage
des workers. Aucun changement global de configuration n'est requis.

## 2. Routage : catalogue dynamique et signal Jev

### QA de mission — amendement utilisateur 2026-10-22

Les profils sont des compétences et permissions, pas un pipeline QA universel.
Convenir de `verification: { level, commands?, acceptance? }` via
`/ensemble-mission config`, puis approuver la présentation avec `start`.
Niveaux : light (checks ciblés), proportionate (défaut proposé, selon les risques),
reinforced (plan explicite et revue indépendante bornée). Ce choix est indépendant
du modèle/reasoning. Une mission déjà admise conserve son contrat ; ne pas modifier
ses critères silencieusement à la suite d'une nouvelle configuration.

Le lead ferme les obligations au lancement, rattache chaque vérification à un
comportement/risque requis et réutilise les preuves encore valides. Un changement
de code, d'entrées, d'oracle ou de conditions pertinentes déclenche les contrôles
affectés ; un changement de session ne justifie pas un rejeu. Les reprises de revue
portent sur les bloquants et l'impact des corrections ; les suggestions différables
ne créent pas une boucle automatique. Une preuve exigée absente reste bloquante.
Tests ciblés et corrections dans le périmètre sont autonomes sous autorisations
et budget ; nouveau harnais important ou extension d'exigences = arbitrage préalable.
Une fois les critères satisfaits, rendre le bilan pour acceptation et arrêter,
sans poursuivre pour améliorer un pourcentage de couverture.

Cela ne relâche ni le 2+1 scientifique du §3, ni l'ASM, les gates live ou les
permissions : tout conflit se soumet au superviseur. La réutilisation de preuves
ne permet jamais de contaminer un auteur aveugle. La campagne historique reste
inchangée. Pour une mission logicielle RMS statique, ces pipelines RE par EA ne
s'appliquent pas automatiquement ; l'ordre M2 amendé du 2026-10-22 fixe son contrat
reinforced (§7.1) et sa condition d'arrêt (§8). Les profils `re-*-ensemble` ne
deviennent pas des rôles d'implémentation/test RMS par cet amendement.

### Catalogue et évaluation

Découvrir au début de mission, puis après disparition/indisponibilité réelle,
les références exactes `provider/model`, variantes et capacités disponibles.
L'inscription au catalogue ne prouve ni authentification, ni quota, ni coût nul.
Les familles ci-dessous sont des préférences utilisateur, pas une allowlist
figée ni un ordre de fallback permanent :

- Sémantique/review/réconciliation : GPT-6.1 Sol, medium/high ; xhigh pour les
  fonctions difficiles ou défauts nécessitant une escalade motivée.
- Décompilation : GPT-6 Luna (OpenCode ou OpenAI), GLM Flash, Muse Spark
  Contributor Free, ou un successeur explicitement admissible pour la mission.
- Au setup, Sol/Luna/Muse offrent medium/high/xhigh ; GLM Flash offre
  low/high/max. Ne pas inventer une variante ou assimiler max à xhigh.
- Le catalogue distingue OpenAI, OpenCode, OpenCode Go, ZAI et Fireworks.
  Ne pas attribuer GLM à OpenAI par analogie avec Luna. Go n'est pas une preuve
  d'accès à Zen et n'est pas activé par ce guide.
- Un nouveau modèle est un candidat à évaluer, pas automatiquement un modèle
  équivalent ni une permission de payer. Si coût/accès sont inconnus, bloquer
  cette route jusqu'à décision ou choisir une alternative déjà autorisée.

Le superviseur appelle `classify_x86` sur une entrée pré-analyse gelée : ASM,
architecture et métadonnées extractibles à l'usage. Le mode/context versionné
peut inclure callers/callees bornés, imports PE et connaissances déjà validées
**avant** la prédiction. Exclure C/reviews/verdicts futurs de la fonction cible.
Tracer provenance et dates de chaque connaissance ajoutée ; séparer une entrée
numérique seule et une entrée enrichie si l'on veut mesurer l'apport du contexte.

Complexité/incertitude Jev sont des scores ordinaux normalisés, pas des
probabilités de réussite. Les causes et leurs probabilités restent des signaux.
Aucun seuil de production n'est validé par le benchmark de 21 fonctions.
Le superviseur choisit le modèle/reasoning en combinant Jev, structure native,
risques arithmétiques/ABI et preuves de review ; il journalise la justification.
Jev ne supprime jamais un plancher de contrôle. Erreur/timeout Jev : garder les
règles structurelles et noter l'absence de prédiction, sans fallback payant.

Passer un override modèle/variante explicite lors de chaque création de worker,
puis lire le `Model.Ref` natif `{providerID,id,variant}`. Une chaîne `#high` ne
prouve pas la variante effective. Variante absente/non supportée : bloquer la
tâche, ne pas accepter silencieusement un default. Un handoff conserve le modèle
de session ; il ne sélectionne pas celui du nouveau profil automatiquement.

## 3. Pipeline et contrats aveugles

Futur RE : **2+1 par défaut**, séparément pour C et sémantique lorsque les deux
sont demandés. Deux auteurs produisent A/B indépendamment, puis R tranche
contre l'ASM. Diversifier les modèles de C si les capacités et le budget le
permettent ; deux sessions du même modèle restent indépendantes mais ne prouvent
pas une diversité de raisonnement. Pour la sémantique, deux sessions Sol sont
compatibles avec la préférence utilisateur.

Une variante 1+V ou 1+P doit être explicitement autorisée dans le contrat de la
future mission et conserver ses critères/gates. V voit A volontairement et
n'est donc pas B aveugle. Les modes et triggers du
[protocole historique](investigation/battle-static-discovery/HANDOFF_semantic-triple-review.md)
restent applicables à la campagne historique, sans changement par ce setup.

### Entrée commune et projections

1. Le superviseur produit un gel natif : bytes/ASM, frontières/chunks, CFG,
   xrefs code/data et contexte autorisé. Hash, version et provenance enregistrés.
   Il fournit le C existant seulement à un rôle autorisé à le voir.
2. A et B partent en **fresh** distincts, sans fork/checkpoint/handoff du lead
   ou de l'autre auteur. Ne pas coller l'historique du superviseur dans le prompt.
   Même niveau de contexte et hash commun ; noms sémantiques dérivés exclus en
   mode aveugle. Le score/groupe Jev ne sert pas d'amorce aux auteurs.
3. Chaque worker reçoit une projection bornée dans `inputs/` de son worktree,
   et écrit dans `outputs/`. Le lead fournit les fichiers explicitement : les
   gels ignorés/hors git ne sont pas transférés implicitement par un worktree.
   Ne pas placer les sorties du voisin ni ses traces dans cette projection.
4. R est créé après A+B, avec leurs livrables gelés remis dans son `inputs/`.
   V reçoit uniquement le jeu nécessaire à sa review. Les lectures des sorties
   du voisin, du ledger cible ou d'un index contenant les résultats restent
   interdites pour A/B, même si le fichier existe ailleurs.
5. Un slot libéré est réutilisable ; le contexte d'un auteur aveugle ne l'est
   pas pour un autre rôle. Repli : nouvelle session possédée, même entrée gelée,
   tentative précédente conservée et motif explicite.

Les profils dédiés sont `mode: primary` (sessions/teammates) ; les workers natifs
existants restent inchangés. Leurs permissions partent de deny, autorisent la
lecture de `inputs/`, de leurs `outputs/`, des instructions communes et l'écriture
de `outputs/` seulement. Code Mode et `team_message` servent à rendre compte.
Shell, sous-agents, autres outils/plugins/MCP (dont IDA et index) sont refusés.
Un besoin de compilation, de contexte ou de lecture native passe par le lead.
Ne pas contourner ces restrictions par fetch/API, une autre session ou un outil
générique. Ces règles ne sont pas une preuve de sandbox de sécurité parfaite ;
valider l'isolation effective et la communication avant la première vraie équipe.

### Livrables et validation

- C : code complet, couverture des blocs/chunks, types/largeurs, wrap/shift,
  signedness, AL/AX/EAX, ordre des arguments, effets et retours, limites explicites.
- Sémantique : rôle, in/out/effets, confiance, nom proposé, 3–8 preuves ASM/xrefs
  et questions ouvertes. Ne pas déduire le métier du nom IDA seul.
- Review : chaque défaut doit citer une instruction/bloc et son effet observable ;
  distinguer échec technique, défaut C, manque de contexte et ambiguïté métier.
- R : matrice des divergences avec preuves, C/sémantique corrigés ou reste
  UNCERTAIN/CONFLICT. Accord A=B ne dispense pas de contrôle contre les opcodes.
- Le superviseur applique §5.6, réalise les vérifications/compilations autorisées,
  intègre, écrit l'IDB puis sauvegarde/readback en série. Workers : ni git,
  promotion, registre ni mutation du processus live. Respecter les règles de
  commit applicables ; ce guide n'autorise aucun commit automatique du setup.

## 4. Disponibilité, concurrence et budget

Concurrence/budgets par **service, compte et quota réellement partagés** ; deux
alias fournisseur ne prouvent pas deux capacités indépendantes. Séparer tâches
prêtes, sessions actives utiles, sessions terminées et tentatives échouées.
Les limites initiales et maximums sont ceux de la mission, pas ceux d'un exemple.

- Auth/403/permission : désactiver la route et demander correction ; pas de retry
  illimité ni déduction « saturation » à partir du code seul.
- Entrée/schéma/context trop grand : corriger ou borner l'entrée ; versionner la
  nouvelle projection. Pas de changement de modèle pour masquer l'erreur.
- Refus d'analyse/politique : diagnostiquer/escalader ; pas de fallback pour
  contourner une restriction de sécurité.
- Timeout/panne transitoire : retry borné dans le budget, conserver la tentative.
- Rate limit/quota/concurrence attestés : respecter Retry-After s'il existe,
  réduire les admissions/circuit de la route et utiliser un équivalent
  préautorisé ailleurs. Un provider bloqué n'arrête pas les routes saines.
- Défaut C/review : suivre correction + re-review, pas reclasser en panne réseau.

Définir avant dispatch un nombre maximal de tentatives, des alternatives
admissibles et un plafond de coût. Si tous les candidats échouent, déclarer
« aucune route admissible disponible » avec les causes ; ne pas prétendre avoir
mesuré le maximum global de parallélisme. Reprise/cooldown événementiels bornés,
pas d'attente occupée ni de boucle de polling. Aucune action power/veille.

## 5. Traçabilité et confrontation prédiction/réalité

Journal par EA et étape : ID de mission/tâche/session/rôle, hash/version des
inputs, prédiction Jev brute et modèle, choix modèle/variante motivé et readback,
timestamps, tentatives et erreurs typées, hashes des sorties, review, corrections,
réconciliation, validations finales et références d'evidence. Les quotas/coûts
connus restent distincts des hypothèses. Jamais de secrets dans ces traces.
Le superviseur seul met à jour le journal canonique de mission, séparé des
registres des campagnes actuelles. Conserver aussi les échecs, pas seulement
le livrable gagnant. Aucun journal de mission n'est créé par ce setup.

Prédiction gelée avant le travail = mesure prospective. Les anciennes fonctions
sont rétrospectives sauf preuve du contexte disponible à l'époque. En phase
d'observation, ne pas laisser la prédiction modifier le protocole évalué : le
routage Jev adaptatif et la validation shadow sont deux modes distincts.
Comparer aux défauts/corrections/escalades observés sous le modèle réellement
utilisé, pas au seul verdict CERTAIN ou au nombre d'instructions. Conserver un
baseline structurel ; rien n'autorise ici des seuils automatiques non évalués.

## 6. Missions live DLL/harness

Un GO RE ne vaut pas GO live. Définir hypothèses testables, processus/builds,
observations same-frame, write guards, restauration et critères PASS/FAIL.
Charger `ff8-live-necessity-filter` avant campagne ; gate `ff8-dump-writer-verify`
après build/déploiement d'un writer AF3DN.P concerné, avant sa campagne live.
Conserver hashes EXE/DLL déployés, contrat binaire, native helpers, observation
et restauration byte-exact. Aucun score Jev ne peut les dispenser.

Travaux offline/builds/analyses d'evidence peuvent être parallèles selon leurs
dépendances et outputs. Une session de capture/injection/debugger possède un
bail exclusif du processus et des écritures IDA. Les quatre profils RE dédiés
ne sont pas des opérateurs live : sélectionner séparément les profils/capacités
live et obtenir l'autorisation de les adapter à Ensemble si nécessaire.
Ingérer l'evidence après validation via le skill dédié ; préserver sources et
hashes. Aucune compilation, injection ou campagne live n'est exécutée au setup.

## 7. Validation du setup et première activation

Au setup : vérifier parsing/frontmatter, sources locales, catalogue effectif,
liens, permissions déclarées, absence de doublons, profils/config historiques
préservés et fichiers non ignorés. Une seconde installation ne doit ajouter
aucun bloc/source/profil en double.

À la première activation explicitement autorisée : vérifier Model.Ref,
communication team_message, transfert des projections, isolation et refus des
actions hors rôle avant d'élargir le pool. Catalogue vérifié ne signifie pas
smoke test de teammate réussi. Ce test peut consommer du quota : il n'est pas
implicitement autorisé par l'installation.

La découverte dépend de la location : vérifier aussi les profils/configuration
dans chaque worktree cible. Des fichiers non committés présents dans le dépôt
principal ne sont pas nécessairement présents à son HEAD ou transférés au
worktree. Préparer leur disponibilité explicitement avant admission, sans commit
ou copie opportuniste du travail utilisateur. Un catalogue correct au dépôt
principal ne suffit pas à certifier une session worker dans un autre répertoire.

### Correctif run01 du 2026-10-12 — attentes de modèles historiques

Pour `ff8-decomp-semantics-20261011-r01` seulement, appliquer l'avenant
[référence de contrôle des modèles](../missions/ff8-decomp-semantics-2026-10-11-run01/CONTRACT.md#avenant-2026-10-12--référence-de-contrôle-des-modèles).
Vérifier le `Model.Ref` natif, variante comprise, contre `model_routing.selected`
persisté à l'admission, ou contre l'override explicite de lancement prioritaire.
Les manifests v1 et anciennes mentions de modèle dans les tâches sont
historiques : leur seul écart ne doit plus déclencher pause d'autoscaling,
arrêt-worker ou rejet de production. Le modèle source d'un fork/checkpoint et
une politique révisée après admission ne remplacent pas la décision enregistrée.
Les divergences réelles, contraintes utilisateur exactes (dont VM `0x487DF0`),
entrées, permissions, provenance et gates restent à vérifier. Ce correctif ne
donne aucun GO de reprise et maintient le DRAIN utilisateur.
