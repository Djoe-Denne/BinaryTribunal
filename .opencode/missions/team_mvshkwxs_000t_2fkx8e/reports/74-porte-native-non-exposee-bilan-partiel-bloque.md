# 74. Porte native non exposée — bilan partiel bloqué avant activation

> **Réévaluation fonctionnelle demandée depuis ce bilan :** le rapport76 enregistre la directive utilisateur acceptant qu’un agent continue ou termine, avec obsolescence ordonnée, résultat identifiable/invalide et aucun retry automatique. Les garanties natives fortes discutées ici ne sont plus à imposer automatiquement à ce besoin. Leur nécessité et le chemin conforme sont réexaminés par deux build ; aucune qualification ou activation n’est pour autant déclarée acquise.

## Objectif, résultat et conséquence concrète

La mission vise un parcours RMS vérifié jusqu’à l’exécution native et la publication des nouveaux contenus. La continuation a intégré deux incréments supplémentaires vérifiés : admission au repos et lecture finie des observations DATA. Ils restent reçus.

La qualification suivante révèle une limite fonctionnelle précise du composant actuel : **aucun contrôle atomique owner/fence au point d’admission ni témoin de clôture empêchant un successeur n’est exposé dans les API et contrats de plugin lus**. Un compteur local, une metadata, un hook HTTP ou le lecteur de données ne peuvent remplacer ces garanties.

Le parent conserve donc l’exécution refusante. **M2 reste partiel/bloqué, pas terminé avec succès.** Ce n’est ni un nouveau GO de routine attendu, ni une permission de lecture manquante : les sources sont maintenant accessibles et les passages critiques ont été relus. La porte manquante est dans le comportement du propriétaire natif effectivement déployé.

## Vérification parent des faits

1. `Bus.publish` sait appeler un callback local `commit(seq)` dans la même transaction immédiate que les projecteurs et le journal. La diffusion vient ensuite. C’est une primitive **interne**, pas une précondition publique d’admission.
2. L’admission Inbox actuelle reçoit ID/session/item, peut renvoyer un existant avant insertion, puis publie sans callback de fence. Ajouter un contrôle seulement sur une insertion nouvelle ne suffirait donc pas aux retries.
3. Les hooks plugin de session portent sur prompt/contexte/modèle/HTTP/retry ; le domaine événement public ne fournit que subscribe. Ils ne constituent pas les projecteurs ou callbacks transactionnels internes recherchés.
4. Le lifecycle associe bien terminal et libération de claim, sauf shutdown, mais pas à une génération owner/fence RMS. Une wake tardive peut démarrer un successeur ; awaitIdle ne ferme pas les admissions futures.

Les contrats publics actuels sont ainsi insuffisants pour la propriété exigée. Cela ne prouve pas qu’aucune évolution du noyau n’est possible : les primitives existent dans la source. Cela interdit de déclarer la capacité présente ou de la simuler dans un adaptateur client.

## Décision technique et frontière de reprise

Le parent rejette les faux raccourcis : suppression d’un garde, promotion d’une fixture, nouveau flag de qualification, souscription prise pour transaction ou patch HTTP prétendant fermer une course interne. Aucun nouveau writer n’est admis pour ces contournements.

La reprise sur cette porte doit d’abord désigner un **composant natif modifiable et sa cible de déploiement autorisée**, avec provenance vérifiable. Modifier le noyau OpenCode chargé n’est pas un correctif des quatre fichiers RMS reçus ; la restriction de changement global ne peut pas être levée silencieusement. La correspondance source/binaire actuel n’est toujours pas démontrée. Le mandat ne vaut pas autorisation implicite de remplacer le binaire installé ou d’ajouter une infrastructure de test importante.

Le contrat du raccord interne devra fermer au minimum :

- comparaison durable owner/fence/image dans la transaction d’admission, **nouveaux messages et doublons/retries compris** ;
- révocation/clôture consultée avant toute nouvelle admission ou continuation autorisée de cette génération ;
- témoin de clôture attribuable à cette même génération et au lifecycle, sans confondre fin d’une période et interdiction de successeur ;
- maintien des garanties RMS d’unicité d’admission/charge/publication et des ressources détenues, sans inventer une exigence universelle d’inférence exactement une fois.

Ce contrat interne et le cadre de modification/déploiement ne sont pas réalisés par les surfaces qualifiées. Aucun changement global, nouveau serveur ou fork construit/déployé n’est entrepris sous couvert de la recherche. Les arrêts G5–G7/HOLD125/diagnostic gelé/quatre origines demeurent opposables.

## Obligations restantes, sans nouveau PASS administratif

- Raccord et qualification native d’exécution, droits effectifs et témoins de clôture adéquats.
- Projection des nouveaux contenus dans le parcours DATA v3 réellement consommé, pas remplacement silencieux d’une référence nulle.
- Scénario final D5 natif unique, revue d’impact et acceptation parent complète seulement après preuves.
- Résolution séparée des scénarios explicitement arrêtés ; nettoyage des worktrees conservés différable.

Les tâches des incréments intégrés sont clôturées dans leur portée. Les obligations ci-dessus ne le sont pas. Aucun replay scientifique ou test déjà valide n’est requis pour masquer cette distinction. Le bilan intégré courant, ses durées et ses readbacks restent au rapport72 ; ils ne sont pas rejoués pour ce constat.

## Preuves techniques

- Finale possédée : `../evidence/ses_e7bfd1130ffeJqogvfIcT2LqBE-native-finals-bundle-r4.json`, message `msg_18835f6db001Ozex7sLfG0XuGS`, SHA256 texte `d6c5d0d739d8070780a853cdcd174e590feec75a8fdfbe3d56c9221d741f1b3d`.
- Passages relus par le parent : capture `public-core-v2.1.4-observation-contract-r1/...bus.ts:384–449,469–477`, capture initiale `...inbox.ts:178–210`, `public-core-v2.1.4-observation-r1/...run-coordinator.ts:109–169`, lifecycle précédemment relu au rapport67.
- Deux sources plugin capturées/hachées sans exécution : `public-core-v2.1.4-owner-r1/manifest.json`, `session.ts:139–174`, `event.ts:1–3`, commit officiel `68bc26b7da1990ce10ffecfbc1e09eb13aa5d824`.
- Aucun code, test, modèle ou appel natif d’exécution lancé dans cette qualification ; aucun refus d’accès externe contourné.
