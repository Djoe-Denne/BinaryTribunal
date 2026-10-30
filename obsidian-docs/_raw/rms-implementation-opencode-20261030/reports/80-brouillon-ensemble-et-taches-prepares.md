# 80. Brouillon Ensemble et tâches préparés — affichage et approbation restants

## Objectif et état actuel

Le plan de complétion n’est désormais plus seulement un texte : **le brouillon de politique de la mission actuelle a été amendé et huit tâches ont été créées nativement**, avec dépendances, périmètres, critères de réception et admission différée.

Ce brouillon n’est **pas approuvé** et son aperçu natif n’a pas encore été affiché. Ensemble confirme le blocage attendu des nouvelles admissions : la politique a changé depuis l’approbation précédente. Aucune réalisation, qualification native ou nouvelle session de travail n’est lancée. Les vingt tâches antérieures terminées et leurs preuves ne sont pas réinitialisées.

## Changements proposés

- Obsolescence durable décidée par le superviseur, notification facultative, ordre dans le flux ratifié et aucune relance automatique d’un travail volontairement obsolète, y compris après redémarrage.
- Exclusion des résultats obsolètes à chaque consommation, même déjà retenus ; historique et attribution conservés. Calcul résiduel acceptable, mais aucune restitution fictive de ressources ou annulation rétroactive d’effet physique.
- Conception et réalisation par des build utiles, sans profil architecte imposé. Le superviseur tranche et conserve la réception finale.
- Scénario final distinguant travaux légitimes et travaux logiquement annulés, sans exiger par défaut un arrêt natif instantané ou une clôture physique permanente.

Le catalogue OpenAI Sol et ses quatre variantes, les paramètres de routage, l’autonomie long_run et la QA reinforced sont inchangés. Les permissions, dix minutes par test et arrêts explicites restent maintenus. Aucun changement global ni modification manuelle d’une révision approuvée stockée : seul le **fichier de brouillon prévu par le protocole Ensemble** est modifié ; sa version antérieure est conservée.

## Plan natif créé

Huit tâches, toutes différées et à réception parent, dans cet ordre de dépendance :

1. Fermer l’avenant fonctionnel et les obligations de complétion.
2. Réaliser les commandes ordonnées et l’obsolescence durable sans retry.
3. Fermer le contrat du parcours natif sous cette directive.
4. Compléter et qualifier le raccord d’exécution native autorisé.
5. Raccorder les nouveaux contenus au parcours DATA v3 réellement consommé.
6. Vérifier le scénario final natif et consolider le candidat.
7. Revoir indépendamment le candidat final et les risques requis.
8. Intégrer et rendre l’acceptation finale avec obligations fermées.

Chaque réalisation exige un plan de fichiers avant code. Les qualifications natives sont réservées au superviseur, après fermeture de leurs permissions et prérequis. La revue finale est fresh et indépendante. Aucun nouveau harnais ou pipeline universel imposé. Les preuves encore valides sont réutilisées selon leur version et leur impact.

## Vérifications réellement faites

- JSON du brouillon lisible ; structure de contrôle et tailles d’instructions vérifiées.
- Comparaison du catalogue et du routage avec la copie précédente : identiques.
- Sept instructions d’autonomie, six commandes/contrôles de référence, dix critères d’acceptation.
- Reçus des huit créations de tâches conservés par le tableau natif ; dépendances chaînées avec les IDs effectivement retournés.
- Readback natif :28 tâches au total,20 terminées,1 pending et7 blocked ; les huit nouvelles ont `publication:deferred`. Politique signalée bloquée jusqu’à config/start, QA reinforced inchangée.

Il ne s’agit pas d’une validation produit : aucun typecheck, test, appel d’exécution ou preuve scientifique supplémentaire. La validation native de schéma/modèles et l’empreinte d’approbation appartiennent encore à l’aperçu `config`.

## Étape d’approbation qui reste

Dans cette même mission, l’utilisateur doit afficher le brouillon exact avec :

```text
/ensemble-mission config
```

Si l’aperçu correspond au contrat souhaité, l’utilisateur peut ensuite approuver sa révision avec :

```text
/ensemble-mission start
```

Le superviseur ne lance pas `start` à sa place. Sans approbation, les nouvelles tâches restent différées/non admises ; les acquis restent inchangés. Après approbation, publication et traitement autonomes de la première tâche prête, sans GO intermédiaire à chaque étape. Cette approbation ne lève aucun arrêt explicite et ne garantit pas une clôture complète si une preuve obligatoire demeure inaccessible.

## Annexe technique

- Brouillon : `../model-policy.json`, schéma de politique version2 conservé (pas de migration implicite vers le schéma version3).
- Copie avant édition : `../evidence/model-policy-before-completion-draft.json`.
- Le hash brut du fichier de brouillon est `a33e6788311f1abdc7f59dc339347650815230b0e02b6d4dff5907349aca8066` ; **ce n’est pas une empreinte native d’approbation affichée**.
- Tâches : `task_mvtsy9rj_0005_ayjury` → `task_mvtsy9sr_0006_byd61i` → `task_mvtsy9tz_0007_ysl7ta` → `task_mvtsy9v2_0008_2n3fue` → `task_mvtsy9vz_0009_f5wolo` → `task_mvtsy9wv_000a_55y4d0` → `task_mvtsy9xv_000b_t9a5aq` → `task_mvtsy9z2_000c_m9cary`.
- Base intégrée de référence : `e1a58997b6d0fe4e145aa844382f9ce1c637d0e2` ; plan79 et directives76/78.
