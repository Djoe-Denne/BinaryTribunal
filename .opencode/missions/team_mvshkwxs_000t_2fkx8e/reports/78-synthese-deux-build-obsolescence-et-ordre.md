# 78. Synthèse des deux build : obsolescence RMS, ordre et absence de retry

## Recommandation retenue pour répondre au besoin utilisateur

Les deux agents de type build convergent. Sous la directive76, le rejet instantané natif et l’interdiction physique permanente de continuation ne sont plus des prérequis automatiques. Le besoin peut être formulé comme un protocole RMS d’**obsolescence durable et ordonnée**, avec résultats identifiables, retrait de leur admissibilité et absence de relance automatique.

Le parent retient cette direction fonctionnelle et corrige en conséquence le diagnostic74. **Cette capacité n’est pas encore implantée ni vérifiée** : les avis ne sont pas une preuve de comportement du code actuel. Aucun architecte supplémentaire, code ou test n’a été lancé pour ces recommandations.

## Contrat minimal proposé

1. **Décision du superviseur.** Journaliser une commande d’obsolescence avec identité stable, portée tâche/exécution/génération, séquence, motif volontaire et disposition sans retry. La décision devient effective au commit RMS, sans attendre une déclaration textuelle de l’agent.
2. **Notification distincte.** Message ou interruption native éventuellement envoyés pour économiser le travail. Leur livraison, lecture ou perte de réponse ne restaurent pas l’autorisation. L’agent peut finir ; ce n’est pas une anomalie sous ce contrat.
3. **Ordre dans le périmètre utile.** Une file par tâche/exécution, élargie à la session si plusieurs commandes y partagent la même cible. Un seul émetteur superviseur et une seule livraison en vol par file. Admission précédente connue avant livraison suivante, sans attendre la fin du calcul. Pas d’ordre global gratuit entre tâches indépendantes.
4. **Ambiguïté conservée.** Sur réponse perdue, rapprocher l’identité déjà retenue et récupérer le même reçu ; suspendre la seule file concernée si l’admission demeure inconnue. Ne pas resoumettre aveuglément le travail. Récupérer un reçu ou répéter une lecture n’est pas une nouvelle tentative de travail.
5. **Résultat attribuable.** Réutiliser les identités d’exécution/tentative/génération et les digests existants. Conserver les résultats tardifs dans l’historique, mais recalculer leur admissibilité à chaque sélection, revue/réconciliation, validation, publication et consommation future concernée.
6. **Aucune relance volontaire.** Une tâche obsolète n’est pas une panne retryable. L’obsolescence prime sur les reprises, les admissions PREPARED et les rejets quota récupérables, y compris après redémarrage. Une nouvelle demande explicite serait un nouveau travail autorisé, pas la résurrection silencieuse du précédent.

## Cas déjà engagés et limites honnêtes

- Avant émission : ne plus démarrer le travail, sans notification native inutile.
- En transit ou en cours : conserver l’identité et l’ambiguïté ; invalider le résultat sans exiger l’arrêt immédiat.
- Résultat déjà reçu/non publié : retirer sa sélection et invalider les décisions dépendantes concernées, sans effacer le passé ni relancer automatiquement.
- Publication déjà engagée/réponse perdue : rapprocher l’effet physique et empêcher un second effet ou une acceptation périmée ; ne pas promettre qu’aucun octet n’a été écrit.
- Publication déjà committée : retrait/correction versionnés et usages futurs à traiter séparément. Un effet irréversible ou un contexte déjà consommé ne peut pas être annulé rétroactivement.

Occupation physique, coûts, allocations et ressources à risque restent suivis distinctement. L’obsolescence logique ne prouve pas la quiescence et n’accorde pas une libération dangereuse. La portée exacte des ressources conservées ou réaffectables doit être justifiée par leurs risques, pas par une exigence de quiescence universelle.

## Ce que le code doit encore acquérir

Le code actuel conserve déjà des identités et résultats tardifs, mais cela n’est pas un marqueur général d’obsolescence. `GraphEngine.observe` peut soumettre une admission PREPARED ; `retainResult` calcule l’éligibilité depuis lease/source/complétion ; les consommateurs relisent cette éligibilité. Un simple message natif ne ferme donc pas encore les chemins sans retry et sans publication attendus.

Les contrôles physiques existants ne doivent pas être réutilisés à tort comme une annulation logique : `retireFamily(CANCELLED)` exige actuellement la quiescence et libère les ressources. Le futur contrat devra distinguer ces responsabilités au lieu de fabriquer une fin native.

L’ordre effectivement reçu/application native reste à qualifier. La source montre une file triée par admission mais une priorité des steers : mélanger plusieurs modes de messages ou interruption et prompt ne prouve pas un FIFO universel. Pour les notifications sans réveil, `resume:false` est pertinent ; sa qualification au repos existe mais n’atteste pas l’exécution ou la lecture par l’agent.

## Suite et périmètre de validation

Ces deux avis satisfont la demande de recommandations. Le parent n’engage pas encore de réalisation par cette synthèse. La prochaine réalisation, si retenue, devra fermer les états/événements et les frontières exactes, puis vérifier les cas discriminants : annulation avant/en cours/après résultat, réponse perdue/doublons/ordre, reprise après redémarrage sans retry, retrait d’un résultat déjà retenu et effets engagés distincts. Réutiliser les preuves valides ; pas de nouveau pipeline ou harnais important imposé par un conseiller.

QA reinforced, modèle/catalogue, budget de dix minutes/test et arrêts explicites restent inchangés. Aucun PASS natif, waiver ou clôture complète M2 n’est déduit des avis. Les livraisons intégrées e1a58997 restent reçues.

## Provenance et vérifications parent

- Révocation : `../evidence/ses_e7788a8c8ffeUaP50uzCw35U24-native-finals-bundle-r1.json`, avis `msg_18882de88001AYIkph6vQitQjF`, SHA256 texte `1a954d45af38433b5c0f074f151ae627fd890adb987bd103134cdcf7968f5c56` ; build Sol xhigh relu.
- Clôture : `../evidence/ses_e7782688dffefbVWl2bQdeuGdU-native-finals-bundle-r1.json`, avis `msg_1888064fb001kfuwegW2TZEWI2`, SHA256 texte `3b93990f246632c1d2c197d7d18bb645be54dba97925c261631d14d56f0fd405` ; build Sol high relu.
- Passages relus parent : `graph-engine.ts:377–409,531–558`, `graph-adapter.ts:278–285`, `graph-store.ts:1515–1543,1706–1725` et capture Inbox `395–432`.
- Les deux build ont fait des lectures/recherches, sans test/typecheck/CLI produit, mutation native ou code. Leurs contextes sont fresh et leurs recommandations rapprochées par le parent, pas réconciliées par une chaîne d’architectes.
