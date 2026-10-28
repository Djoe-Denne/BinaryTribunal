# Ensemble : changements vérifiés et récupération avant remplacement

## Objectif et conclusion

L'objectif reste de terminer le pipeline statique RMS sans refaire des travaux déjà livrés ni accepter un résultat non vérifié. Cette enquête répond à la demande d'examiner les changements du plugin depuis le lancement du plan, avant de poursuivre avec des hypothèses périmées.

**Votre remarque est fondée : le plugin possède désormais un mécanisme explicite de réveil du superviseur et plusieurs protections de restitution des résultats. La version qui tourne contient ces changements.** Il ne faut donc pas assimiler une notification manquante à un agent défaillant, ni créer immédiatement son remplaçant.

Une distinction chronologique importe : la récupération des réponses finales existait déjà le 19 octobre, avant l'ordre M2 du 20 octobre. Le réveil conditionnel du superviseur est, lui, introduit dans le commit du 27 octobre. Une fonction ancienne présente dans un commit d'intégration récent n'est pas nécessairement une nouveauté de ce commit.

Recommandation retenue pour la supervision : **rechercher et vérifier un livrable existant avant toute réaffectation**. Cette correction de méthode ne change ni le contrat du produit ni les autorisations d'exécution.

## Ce qui a réellement changé

### 1. Un superviseur silencieux peut être réveillé sans relancer les auteurs

Le changement du 27 octobre ajoute une vérification toutes les dix minutes. Elle consulte l'activité native du superviseur, des auteurs et des auxiliaires, plutôt que les seuls états enregistrés par Ensemble. Si du travail ou des résultats restent sans traitement depuis au moins dix minutes et que les conditions d'admission le permettent, elle conserve un message de diagnostic puis tente de réveiller le superviseur.

Le mécanisme évite de multiplier les diagnostics identiques et peut retenter le réveil à une vérification ultérieure. Il ne crée pas d'auteur, ne termine pas de tâche, ne change pas les permissions et ne transforme pas l'inactivité en réussite. Les demandes de permission en attente, les états natifs actifs ou inconnus et les arrêts de mission applicables empêchent le réveil. Rien ne tourne lorsque le service ou le plugin est arrêté.

Conséquence : l'hypothèse « aucun filet de récupération automatique du superviseur » est périmée. En revanche, « un réveil prouve que le travail a repris » reste faux.

### 2. Une réponse finale peut devenir un livrable à examiner, pas une réussite automatique

Le code récupère la dernière réponse d'auteur si elle est terminée normalement, comporte du texte visible et appartient à la période de travail courante. Il conserve le texte complet avec les identifiants de session, de message et de tâches. La récupération et la lecture ne terminent pas la tâche : le superviseur doit encore contrôler le résultat et les fichiers.

Le contenu conservé est accessible par `team_results`, y compris par son identifiant après une première lecture. Le redémarrage recherche aussi les réponses d'auteurs déjà inactifs et tente de notifier les messages en attente, après installation du contexte et des outils.

Cette récupération est antérieure au lancement M2. Elle n'offre pas une garantie de transport exactement une fois, et l'absence de contenu dans `team_results` n'est pas une preuve d'absence de travail dans la session native. Cet outil lit les résultats déjà conservés ; il ne lance pas lui-même une nouvelle collecte native.

### 3. Les retours de préparation ont été rendus plus accessibles et moins ambigus

Les changements des 24 et 25 octobre rendent le préparateur de mission visible comme session enfant native, rendent la main une fois cette session créée et préservent son identifiant dans les réponses au superviseur. La restitution finale est prise en charge avant l'envoi de l'accusé initial : un rejet de cet accusé ne doit plus abandonner automatiquement le résultat ultérieur.

Les retours distinguent aussi l'état administratif de la préparation de l'activité native de la session. Ils donnent accès au candidat complet et séparent les anciennes erreurs de format des blocages actuels. Importer un plan ne vaut toujours pas autorisation de l'exécuter.

Ces protections concernent la préparation des missions ; elles ne démontrent pas à elles seules la récupération de tous les messages de tous les auteurs.

### 4. La communication de supervision et l'isolement des revues sont plus explicites

Les changements du 22 octobre imposent des rapports compréhensibles aux jalons et avant les décisions utilisateur, ainsi qu'une vérification choisie par mission. Ceux du 27 octobre renforcent aussi l'admission d'un contexte indépendant : cette exigence doit être portée par la tâche avant sa mise à disposition, pas seulement par un lancement ultérieur.

La sélection de modèles par tâche ajoutée le 23 octobre ne migre pas automatiquement notre politique approuvée. **La révision 2, la classification manuelle et la vérification renforcée de M2 restent inchangées.** Aucun contexte de revue indépendant déjà qualifié n'a été invalidé ou rejoué pour cette enquête.

## Version installée, version active et comportement observé

Trois vérifications distinctes ont été faites, sans installation ni redémarrage :

- **Historique source :** le dépôt réellement utilisé est `opencode-ensemble-session`, pas le dépôt voisin `opencode-ensemble`. Sa lignée courante comporte 22 commits depuis le 20 octobre, jusqu'au commit du 27 octobre.
- **Installation :** le fichier exécutable du paquet local a le même SHA-256 que son reçu de déploiement. Il contient les chemins de récupération de réponses, de notification au redémarrage et de réveil du superviseur. Le paquet a été produit depuis un arbre modifié : son contenu ne doit pas être identifié au seul commit source.
- **Exécution :** l'API native d'OpenCode indique ce paquet précis comme plugin Ensemble actif pour `re-ff8`, sous OpenCode 2.1.4. Ce n'est donc pas seulement du code présent dans un dépôt.

Cela ne certifie pas tous les comportements en conditions réelles. Le reçu de déploiement annonce une compilation et 1 807 tests réussis ; ces résultats sont des déclarations du reçu, **pas des tests relancés ou requalifiés ici**. Les tests source de récupération ont été examinés, notamment la déduplication, les générations périmées, les échecs de réveil et l'activité native. Leur présence n'est pas un nouveau résultat PASS.

## Ce que l'incident de notre auteur permet de conclure

L'incident déjà documenté dans le [rapport de livraison retrouvée](177-copie-livree-revue-independante.md) reste établi : Ensemble annonçait une session inactive sans réponse récupérable, alors que la session native contenait le livrable et que les fichiers avaient été produits.

La présente enquête a relu uniquement les métadonnées nécessaires de cette session. Le contexte natif contient bien deux réponses finales avec une fin normale, une date de fin et une partie texte. Il est présenté chronologiquement, contrairement à la liste HTTP de messages utilisée lors de la récupération précédente. **L'ordre inversé de cette liste HTTP ne suffit donc pas à expliquer l'échec du collecteur**, qui utilise le contexte natif.

La cause exacte au moment de l'incident reste inconnue : cette lecture n'a pas reconstitué les états de génération, l'activité et l'ordre des événements au moment du refus. Je ne conclus ni que le problème a disparu, ni que le plugin n'avait aucune récupération. Le message signalait l'échec de sa tentative, pas l'inexistence du livrable.

## Conséquences pour la suite du plan

1. **Avant de remplacer un auteur :** distinguer travail réellement interrompu, résultat achevé mais non remonté, et contenu remonté mais non encore vérifié. Examiner les résultats conservés puis, si nécessaire, la session native et les fichiers. Ne pas refaire un travail retrouvé et vérifié.
2. **Avant de conclure à une indisponibilité :** établir le problème concret de session, de fournisseur, de capacité ou de permission. Un état « inactif » ou une boîte de résultats vide n'en constitue pas la preuve.
3. **Conserver la barrière de validation :** notification, récupération, lecture, acceptation et intégration restent des étapes différentes. Un résultat retrouvé ne libère pas automatiquement ses dépendances.
4. **Ne pas confondre le plugin et le produit RMS :** ces notifications natives ne prouvent pas que les règles de remplacement RMS sont effectivement raccordées aux événements réels d'OpenCode. Ce raccordement reste à démontrer ; les scénarios de remplacement actuels simulent une indisponibilité.
5. **Ne pas modifier les droits ni les compteurs :** la récupération d'un message ne rembourse aucune origine et n'autorise ni nouvelle branche de remplacement, ni repli de modèle, ni nouvelle exécution scientifique.

Les blocages produit restent inchangés : le dernier trajet de remplacement dépasse la limite de quinze secondes ; les trois scénarios avec lancement de threads restent interdits ; S2 et M2 ne sont pas acceptés. Le [gel après mesure](180-bilan-copie-negligeable-arret-convenu.md) demeure applicable. Aucune optimisation, seconde mesure ou reprise de test n'est autorisée par cette enquête.

## Annexe technique et limites de l'enquête

### Historique et sources consultés

Borne de recherche : ordre M2 du 20 octobre 2026, avec lecture des antécédents du 19 octobre pour ne pas attribuer les fonctions à la mauvaise date. Historique local et diffs seulement, sans `fetch` ni modification Git.

- `e446c88`, 19 octobre : création de `src/member-report.ts` ; `463d4fb`, même jour : durcissement du protocole et de la consultation des candidats.
- `11f3806` et `bc0fbef`, 22 octobre : autonomie/vérification par mission et rapports de supervision.
- `3357f0c`, `9b33f7d`, `3570063`, 24 octobre : récupération et restitution des préparations, session enfant native, conservation de son accès. Sources actuelles : `src/mission-commands.ts:140–265` et `src/preparation-runtime.ts`.
- `bfab9b2`, 25 octobre : diagnostic des régressions de préparation et distinction entre erreurs historiques et blocages actuels ; `src/mission-commands.ts:97–109`.
- `88efee8`, 27 octobre : ajout de `src/supervisor-recovery.ts:34–167`, branchement V2 dans `src/v2-setup.ts:488–502`, admission du contexte indépendant et diagnostics de permissions.
- Récupération et consultation : `src/member-report.ts:19–65`, `src/tools/team-results.ts:17–53`, `src/v2-client.ts:173–186`, `src/v2-setup.ts:144–224,453–468`.
- Limite du transport documentée : `docs/worker-reporting.md:50–100,102–135`. L'indicateur « livré » est posé lors de l'injection dans le contexte, pas après une preuve d'acceptation du résultat : `src/system-prompt.ts:93–107`.
- Tests examinés sans exécution : `test/member-report.test.ts`, `test/supervisor-recovery.test.ts` et cas pertinents de `test/preparation-runtime.test.ts`.

### Installation et observations natives

- Source : `C:/Users/djden/source/repos/opencode-ensemble-session`, HEAD `88efee8f402a8f24322a0e2db681f7ce0e176bf3`.
- Paquet actif : `C:/Users/djden/.config/opencode/local-plugins/ensemble/20261027-preparation-admission-ac2bbe7eb142`, version `0.19.0-local.20261027.admission.ac2bbe7eb142`.
- SHA-256 du `index.js` relu : `ac2bbe7eb1424c27b0885aa2709e9ac58d38db7e05017a4249d66519c1509d21`, conforme au reçu ; taille 1 541 757 octets. Récupération directement relue dans ce fichier aux lignes 11620–11667 ; classe de réveil à la ligne 18201 ; notification au redémarrage autour de 22539.
- Le reçu porte `sourceClean:false`. Parmi ses 25 fichiers source explicitement épinglés, 24 correspondent encore ; seul le document `docs/plans/2026-10-27-preparation-admission-gap.md` diffère. Ce constat n'étend pas la vérification à tous les fichiers du dépôt et ne remplace pas le hash du paquet actif.
- Lectures natives du 28 octobre : `GET /api/info`, `GET /api/plugin` avec la localisation `re-ff8`, `GET /api/session/ses_e7d3ca60dffeXo6CDLmSkdNMoB/context` et consultation ciblée de `msg_182c6d8aa001Bp6U655rplxVTb`. Plugin actif confirmé ; service 2.1.4, PID 38776. Aucun texte de raisonnement privé reproduit.
- Le contexte observé contient 24 messages. Les finales `msg_182c6d8aa001Bp6U655rplxVTb` et `msg_182ca1f0e001d4z2rnTz1EiHr5` portent `finish:stop`, un horodatage de fin et du texte visible. Cela vérifie leur existence, pas leur admissibilité historique à chaque garde du collecteur.

**Localisation / impact / limites :** inspection de l'historique, du code ciblé, du paquet installé et de métadonnées natives. Serena est attaché à la racine commune `retro-eng` et ne couvre pas ce dépôt de plugin extérieur ; cette connexion partagée n'a pas été réactivée. Les lectures ciblées et l'analyse via Context Mode ont servi à l'enquête. Aucun fichier source, réglage global, base, actif ou snapshot n'a été modifié ; seuls ce rapport et son pointeur au journal ont été écrits. Aucun auteur lancé, test exécuté, appel `team_results` marquant les résultats comme lus, commit, merge, push, nettoyage ou redémarrage effectué.
