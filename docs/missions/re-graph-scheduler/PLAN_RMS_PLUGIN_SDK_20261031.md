# Plan actif RMS — plugin OpenCode via son SDK

## 1. Décision utilisateur

Clarification du 2026-10-31 : le plugin fonctionne dans l'environnement OpenCode.
OpenCode fournit le SDK et porte la sécurité ainsi que les permissions. RMS doit
implémenter ses fonctions métier, pas une seconde couche d'authentification ou
d'autorisations.

HTTP est laissé de côté pour le moment. Son adaptateur conserve les fonctions du
port métier, mais chacune lève une exception explicite `not yet implemented`.

Ce plan remplace, pour la phase RMS active, les contraintes incompatibles ajoutées
dans les contrats et checkpoints antérieurs : opérateur authentifié propre à
RMS, grants/délégations, journal de grants, ActorContext authentifié, contrôle
d'audience d'autorisation et preuve de couverture de toutes les entrées.
Ces mécanismes doivent être retirés, pas simplement désactivés par un booléen.

## 2. Répartition des responsabilités

- **OpenCode et son SDK** : environnement d'exécution du plugin, mécanismes de
  sécurité/permissions et comportement natif de ses API. Pas d'audit applicatif
  RMS supplémentaire de tous les plugins, callers ou transports comme préalable.
- **Plugin RMS** : raccord des ports métier aux API publiques réelles du SDK,
  cycle de vie normal et présentation des commandes/résultats. Les API/RPC
  officiels sont utilisables ; l'absence d'une identité opérateur dans
  RpcCallContext n'est plus une raison de bloquer l'intégration.
- **RMS** : planification, octets et identités métier, ordre des commandes,
  capacité, reprise, CAS/fences métier, prévention des doublons, validation des
  résultats et publication. Ne pas ajouter un second scheduler.
- **Ensemble** : coordination et exécution via son interface publique. Le plugin
  n'importe pas ses modules privés et RMS ne lit pas directement sa base.
- **HTTP RMS** : indisponible explicitement dans cette phase. Cela n'interdit pas
  les transports internes normaux d'OpenCode ; cela ne crée pas un garde réseau.

Les erreurs ou refus natifs remontent normalement. Aucun contournement des
contrôles de l'hôte n'est proposé. Une API SDK inconnue doit être recherchée dans
sa documentation/source réelle, pas remplacée par un faux SDK ou callback brut.

## 3. Ordre de travail

1. **Nettoyer la surcouche de sécurité ajoutée à RMS** : inventorier ses références,
   supprimer ses modules et branches actives, simplifier les contrats et tests,
   retirer ses exigences du plan et des directives. Un seul propriétaire du lot ;
   corrections inter-dépôts intégrées par le parent.
2. **Finaliser l'adaptateur HTTP différé** : toutes ses fonctions lèvent
   `not yet implemented`. Pas de réseau, découverte/start d'hôte ou fallback.
   Cette surface différée est désormais intégrée et vérifiée : six tests HTTP
   satisfaits dans la sélection du port et vérification des types satisfaite.
   La commande initialement interrompue reste sans résultat ; les preuves
   nouvelles proviennent des contrôles ciblés exécutés après le nettoyage.
3. **Raccorder le service Ensemble et le plugin par le SDK officiel** : voie
   normale de l'hôte, sans grant ni principal applicatif RMS. Un même service
   métier, pas une copie du scheduler ou du stockage d'Ensemble.
4. **Vérifier le plugin** : compilation et petits tests de contrat/lifecycle,
   puis intégration réelle dans l'hôte existant avec procédure et chemins précis.
   Observer chargement/retrait et résultats sans transformer une fixture en
   preuve native. Pas de nouveau prérequis d'authentification/all-ingress.
5. **Raccorder l'analyse IDA et la boucle de connaissance prévues** : acquisition
   statique, exécution des travaux, revue, publication unique et remise des nouveaux
   octets au contexte suivant. Garder les interdits live/IDB et le code reconstruit
   non exécuté.

Les tâches historiques acceptées conservent leur résultat d'alors. Les revues de
sécurité/grants précédentes ne définissent plus le produit à construire. Le
nettoyage est un nouveau delta explicite, pas une réécriture de ces résultats.

## 4. Périmètre et compatibilité du nettoyage

Sources autorisées inchangées : `tools/ff8-harness`, `tools/rms-opencode-v2` et les
frontières d'exécution concernées de `opencode-ensemble-session`. Les directives
et documents de cadrage RMS correspondants sont également concernés.

Le lot doit notamment examiner le journal `operator-delegation-store`, les
records/refs de grants dans les contrats publics, les paramètres ActorContext
utilisés comme autorisation, les tests dédiés et les anciens bloqueurs actifs.
Une éventuelle donnée de contexte ne doit servir qu'au raccord métier/natif,
jamais à reconstruire une identité authentifiée ou un handle d'autorité RMS.

Les formats persistés et migrations déjà enregistrés ne sont pas réécrits
silencieusement. Retirer le code actif et versionner les évolutions nécessaires ;
documenter les seuls vestiges indispensables à la compatibilité historique.
Aucune donnée vivante effacée, origine/crédit remis à zéro, campagne arrêtée
relancée ou ancienne fixture rendue exécutable.

## 5. Vérification et critères fermés

La QA reste renforcée, indépendante et bornée aux frontières modifiées ; modèles
et fournisseurs approuvés inchangés. Réutiliser les preuves valides, rejouer les
contrôles affectés, ne pas chercher une couverture maximale.

Acceptation du nettoyage :

- aucun mécanisme d'authentification, de grant ou de permission propre à RMS dans
  le chemin actif ; pas de simple renommage ou de gate équivalente ;
- contrats, consommateurs et tests cohérents avec le SDK comme environnement de
  confiance ; versions et octets historiques préservés à leur portée ;
- contrôles métier utiles conservés et tests affectés satisfaits ;
- directives/plan/état de mission ne demandant plus les garanties supprimées ;
- revue indépendante des changements concernés et validation du parent.

Les commandes exactes sont fermées après inventaire des imports et fichiers du
lot. Aucun `bun test` global, test arrêté, installation ou changement global
implicite. L'historique `model-policy.json` reste inchangé : les choix de modèles,
la QA et leurs approbations ne sont pas réécrits par cet amendement de cadrage.

## 6. Prochaine action

Le nettoyage est intégré : acteurs d'autorisation, grants et journal applicatif
retirés, contrat Ensemble explicitement V2, formats métier RMS V1 et schéma
historique conservés. Deux vérifications de types et 102 tests ciblés sont
satisfaits, sans échec ou test ignoré. La revue indépendante fresh conclut
ACCEPTABLE sans correction demandée ; le parent accepte ce delta.

Le premier raccord statique service Ensemble/plugin RMS via le SDK officiel est
intégré et relu : deux vérifications de types et 27 tests ciblés satisfaits,
revue indépendante ACCEPTABLE POUR LOT STATIQUE. La dépendance locale Ensemble
utilise une archive standard du commit accepté, avec les mêmes modules publics,
sans copier les modifications utilisateur du dossier de travail.

Ce premier lot préparait une fabrique sans mission inventée et vérifiait
l'enregistrement et le retrait du service. Ses capacités restaient vides et les
quatre opérations d'exécution indisponibles. Son acceptation était statique,
pas celle du plugin ou du service complets.

Un correctif intermédiaire a ensuite refusé les quatre opérations indisponibles
**localement avant tout RPC**, avec typecheck, 13 tests et revue indépendante sans
bloquant. Cette garantie reste applicable aux opérations non implémentées ; elle
n'est pas un reçu métier de non-effet.

Depuis, les tranches suivantes sont acceptées après leurs contrôles ciblés et
revues indépendantes : état passif sur réservation existante (31 tests et témoin
du véritable adaptateur Node en mémoire), coordinateur SDK (29 tests), raccord
optionnel au service existant (26 tests), puis client RMS (35 tests). Ces preuves
ont leurs portées propres ; ce n'est pas un résultat de suite globale.

Le client implémente désormais submit, observe et reconcile sur le même V2,
avec captures complètes et un seul envoi par appel. Control reste indisponible
localement. La fermeture transmet le signal d'annulation sans prétendre prouver
la fin du travail. Le service sans raccord métier explicite reste désactivé ;
aucun appel ni campagne ne démarre au chargement du plugin. Le consommateur
durable RMS, la source native explicite et la qualification dans l'hôte restent
ouverts ; l'inventaire réel des origines est non acquis, sans crédit présumé.

Clarification utilisateur : rien n'est en production. La proposition de V3 et
de coexistence de protocoles est retirée ; client et service en développement
évolueront ensemble dans l'interface actuelle. Conserver les formats des données
historiques ne signifie pas maintenir plusieurs versions de logiciel actives.
Deux nouvelles tables ne sont pas une exigence préalable.

La file RMS existante conserve déjà les commandes avant envoi, les états ambigus
sans renvoi automatique et les observations tardives. Privilégier son adaptation
explicite au port natif, sans copier ces mécanismes ni rendre les anciens runs ou
fixtures exécutables. N'ajouter une donnée durable que si son absence dans les
structures existantes est démontrée. Le premier parcours doit rester explicite ;
une admission incertaine bloque le renvoi plutôt que lancer un moteur de retries.

La suite autorisée est la préparation bornée des preuves natives et de la tranche
d'exécution durable, sans nouveau GO de routine ni étude générale de sécurité.
Les contrats, le stockage et les effets exacts doivent être fermés avant code ou
activation. L'état interne a été ratifié séparément : une colonne optionnelle et
la migration source 34 ajoutée sans modifier les précédentes, pas de nouvelle
table. Aucune migration de base vivante ni effet natif n'est déduit de ces
acceptations logicielles.
