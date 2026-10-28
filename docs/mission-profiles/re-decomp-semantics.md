# Profil de mission — Décompilation et sémantification avec Ensemble

Identifiant : `re-decomp-semantics-v1`.
Statut : méthodologie proposée ; ce document ne lance ni ne configure une campagne.

Ce profil appartient au projet FF8 et décrit le pipeline commun à ses campagnes
de reverse engineering. Le brief
de chaque mission précise seulement le périmètre, les sources, les autorisations
et les paramètres d'exécution. Ce n'est pas un profil d'agent OpenCode.

## Objectif

Produire, pour chaque fonction, une reconstruction C fidèle à l'assembleur et une
description sémantique étayée : rôle, entrées/sorties, effets de bord, structures
utilisées et incertitudes restantes.

Ensemble sert de plan de contrôle pour les tâches, leurs dépendances, leur
classification, leur attribution et leur suivi. Le superviseur conserve la
responsabilité de la validation et de l'intégration ; la méthodologie ne suppose
pas que le plugin automatise déjà toutes les étapes ci-dessous.

## 1. Préparer un contexte commun factuel

Un observateur prépare et gèle les preuves nécessaires : ASM complet, identité du
binaire et de la fonction, ABI connue, références, dépendances et faits établis.
Il n'impose ni reconstruction C ni hypothèse sémantique aux producteurs aveugles.
Les productions historiques non validées restent séparées des preuves communes.

Son contexte natif sert de point de départ aux agents de production. Chaque fork
part d'une même source gelée, avant tout résultat de candidat. Le partage de ce
socle factuel ne doit pas partager les conclusions des autres agents.

Si le fork natif est indisponible ou incompatible, le dispatch dépendant s'arrête :
pas de remplacement silencieux par une pseudo-conversation. Les contraintes
Ensemble de contexte, de répertoire et de HEAD doivent être vérifiées au lancement.

## 2. Classifier et tracer avant de distribuer

Appeler `classify_x86` sur l'ASM de chaque fonction et conserver les scores de
complexité de reconstruction et d'incertitude de jugement. L'incertitude sert
d'indicateur de risque de routage ; ce n'est pas une probabilité de succès.

Le ledger de mission est append-only et conserve :

- avant l'appel : le payload exact, notamment `assembly`, `architecture` et les
  éventuelles `metadata`, avec l'identifiant de fonction et de tentative ;
- à réception : l'enveloppe native complète du résultat, avant normalisation ou
  suppression du helper ; les erreurs et tentatives échouées sont aussi tracées ;
- après traitement : la classe, la version des seuils, les scores utilisés, le
  modèle/variant retenu pour chaque volet et la justification du routage.

Les hashes et chemins complètent cette trace, sans remplacer les entrées/sorties
brutes. Un défaut de capture ou une classification manquante bloque les tâches
dépendantes, pas les fonctions indépendantes déjà admissibles.

## 3. Adapter le nombre d'agents

Une unité de production est un **volet pour une fonction** : décompilation C ou
sémantification. Les deux volets peuvent être exécutés en parallèle.

- **Fonction simple et à faible risque : un agent par volet**, sans protocole 2+1.
- **Fonction moyenne ou complexe, ou à risque élevé : 2+1 par volet** — deux
  productions indépendantes et aveugles, puis un troisième agent chargé de les
  réconcilier contre l'ASM.
- Un désaccord, une preuve insuffisante ou une difficulté imprévue sur une tâche
  simple déclenche une réévaluation et, si nécessaire, le passage au 2+1.

Les seuils de complexité et de risque doivent être définis, versionnés et
approuvés avant lancement ; ce profil ne les invente pas. Une faible complexité
ne suffit pas à classer une fonction comme simple si son risque est élevé.

Le réconciliateur ne démarre qu'une fois les deux productions terminées. Les
premiers producteurs n'accèdent ni aux réponses de leur pair ni aux résultats de
l'autre volet avant dépôt de leurs propres livrables. Leurs productions sont
ensuite confrontées lors de la validation finale C/sémantique.

## 4. Choisir le modèle pour chaque tâche

Le catalogue des 17 modèles est **global et partagé entre les projets** :
`C:/Users/djden/.config/opencode/ensemble.json`, section `modelRouting.models`.
Lire sa [notice d'accès](re-model-catalogue.md). Ne pas créer de catalogue FF8
concurrent ni d'override projet ; disponibilité déclarée ne vaut pas accès vérifié.

Découvrir et figer le catalogue autorisé des providers, modèles et variantes.
Utiliser la classification pour sélectionner le modèle adapté au volet, au niveau
de difficulté et au risque, selon une matrice de routage approuvée pour la mission.

Chaque attribution indique explicitement le provider, le modèle et la variante,
puis vérifie le `Model.Ref` natif effectif. Une réutilisation ne suppose pas un
changement automatique de modèle. Les routes payantes, de coût inconnu ou les
replis non autorisés ne sont jamais utilisés implicitement.

## 5. Alimenter un pool depuis la file de tâches

Le pool représente des **places de travail disponibles**, pas nécessairement des
sessions persistantes. Les tâches sont réclamées atomiquement depuis le tableau
Ensemble, seulement après satisfaction de leurs dépendances et de leur admission.

À réception d'un résultat, le superviseur vérifie le livrable, actualise la tâche
et remet la place à disposition. Un agent réutilisable peut réclamer la prochaine
tâche admissible et compatible ; sinon, seul le lead crée son remplaçant et lui
attribue une tâche. Les agents de production ne délèguent pas à leur tour.

- **Décompilation : nouvelle session par fonction et par producteur**, forkée
  depuis le contexte factuel approprié, pour éviter la contamination des résultats.
- **Sémantification : nouvelle session par défaut** ; réutilisation seulement si
  le socle factuel, le modèle, la capacité de contexte et l'indépendance restent
  compatibles. Sinon, recréer l'agent.
- **Réconciliation : session distincte**, qui reçoit les preuves et les deux
  livrables achevés, sans avoir participé à leur production.

Le réapprovisionnement s'appuie sur les événements et rapports de fin de tâche,
pas sur une boucle de polling des outils de statut. Les erreurs et blocages sont
enregistrés ; ils ne sont pas comptés comme des tâches achevées.

## 6. Maximiser le parallélisme utile

Décompilation et sémantification disposent de tâches séparées et partagent les
capacités autorisées des providers. Augmenter progressivement la concurrence
tant qu'il reste des tâches admissibles, des places utiles et du budget.

Tenir compte des quotas partagés entre modèles d'un même provider ou compte.
Sur limitation de débit/quota, notamment HTTP **429**, appliquer l'attente
indiquée par le provider et réduire temporairement la concurrence concernée.
Un HTTP **423** est un verrouillage à diagnostiquer séparément, pas une preuve de
saturation générale. Les autres providers disponibles peuvent continuer.

Ne pas fixer une taille permanente de pool ni chercher à multiplier les sessions
au-delà des dépendances, des quotas ou de la capacité de validation.

## 7. Valider et clôturer

Chaque livrable cite ses preuves ASM et expose ses limites. Le superviseur contrôle
la fidélité du C, la cohérence sémantique et les critères de clôture du projet.
Les scores de classification ne dispensent jamais des contrôles de sûreté.

Les workers produisent des artefacts disjoints, sans promotion IDB, intégration
Git, modification de registre partagé ni action live. Les validations,
promotions et intégrations autorisées sont effectuées par le superviseur, de
manière sérialisée, après les gates du projet. Toute action live exige un GO séparé.

## Contrat minimal de chaque mission

Le brief fixe :

- une nouvelle identité de campagne, le dépôt, le binaire et les sources gelées ;
- la liste dédupliquée des fonctions et les extensions explicitement incluses ;
- les seuils simple/moyenne/complexe et le traitement du risque ;
- le catalogue autorisé, la matrice de routage, les variantes, quotas et budgets ;
- le périmètre d'écriture, les critères de clôture et le chemin du ledger ;
- la capacité vérifiée de capture brute, de classification, de fork et de suivi ;
- le GO explicite, les conditions de pause/drain et les autorisations de promotion.

Pour les lancements suivants : « Utilise le profil `re-decomp-semantics-v1` dans
`docs/mission-profiles/re-decomp-semantics.md` pour le périmètre suivant… ».
Le pipeline n'a pas à être redéfini ; seuls ces paramètres changent.
