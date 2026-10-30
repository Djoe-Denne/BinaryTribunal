# 230. Deux essais bornés de fenêtre avec code factice

## Décision et effet visible

L'avis indépendant `result_mvvbvfzd_0021_mpp16r` lève le dernier blocage du lanceur229 et confirme les pins ainsi que la reprise limitée. Le parent reçoit ce correctif et engage les deux petits essais natifs factices prévus228. Les revues des fichiers UI et du qualificateur sont réutilisées ; le produit226 n'est pas rouvert.

Deux fenêtres de test peuvent apparaître brièvement sur le bureau. Leur code est volontairement factice, pas un code de connexion. Aucune action humaine ou clic sur le bouton n'est demandé. L'agent ne cliquera pas, n'ouvrira pas le navigateur et n'appellera pas OpenAI. Aucun serveur ou magasin RMS n'est importé par ces scénarios.

## Commandes et bornes fermées

Depuis le projet, le parent vérifie le SHA du lanceur puis exécute successivement :

1. `private-ui-qualification-228/launch-native-private-ui-v1.ps1 -Scenario positive`.
2. Le même lanceur avec `-Scenario duplicate`, seulement après réception du premier résultat.

Le lanceur est épinglé à5148octets/SHA256 `9131ea1a43ff20fdf922e4d5980121ff2a272a74691c38ef4a74e59950e0ffef`. Il contrôle aussi Bun15277c59, qualificateur8fa5b798, relais8518b843 et fenêtre230f1855 avant effet et après exécution. Le marqueur d'essai CreateNew précède le lancement ; aucun retry automatique, aucun fichier historique écrasé.

Budget interne45secondes par scénario ; garde de processus extérieure50secondes, puis attentes de fermeture/drains explicitement bornées. Chaque appel outil est borné à65secondes, bien sous dix minutes par test. Sortie0, fermeture réellement observée et pins après sont requis, avec lecture indépendante du FINALOUTCOME factice en plus du reçu de processus extérieur. Aucun SKIP ou seul silence ne compte PASS.

## Critères fermés et limites

Positif : fenêtre réellement prête, enfant Bun possédé, trois ACK exacts après les deux probes puis affichage du code factice, enfant sortie0 sans arrêt forcé de cet enfant de test, fenêtre sortie observée et temps respecté. Le contrat du relais permet de terminer sa seule fenêtre possédée ; aucune fermeture coopérative de cette fenêtre n'est revendiquée.

Doublon : première probe acceptée, nonce répété refusé sans deuxième ACK, raison publique de refus de protocole, puis sorties réellement observées. L'absence de deuxième ACK est reliée à ce refus explicite et au scénario factice, pas présentée seule comme preuve de sûreté générale.

Les messages privés de l'interface ne sont pas enregistrés. Les reçus contiennent seulement compteurs, identités, statuts et pins de ce test. Les bases Auth et RMS, crédits, origines, modèles et IDA ne sont pas touchés. Même PASS, ce test ne prouvera ni vraie connexion OpenAI, ni droits Windows du futur dossier, ni raccord du véritable enfant RMS au receiver. Ces prérequis restent distincts.

## Résultats

Les deux essais ont été exécutés et les deux niveaux de reçus relus par le parent.

- Positif : trois ACK, durée1063,3732ms dans le qualificateur et1233ms extérieure ; parent53468, enfant25920 et fenêtre47196. Enfant sortie0 sans force, sortie de fenêtre observée. La raison finale RMS_CHANNEL_CLOSED correspond à la fin du canal de cet enfant factice après ses trois échanges, pas à un refus OpenAI.
- Doublon : un ACK puis refus explicite RMS_UI_PROTOCOL_REFUSED, durée6415,7774ms dans le qualificateur et6585ms extérieure ; parent43868, enfant45792 et fenêtre52840. Enfant sortie0 sans force, sortie de fenêtre observée.

Zéro timeout ou kill du Bun parent/enfant de test, drains prouvés, pins après concordants. Le relais a terminé sa fenêtre possédée conformément à son contrat ; ces données ne prouvent pas une fermeture coopérative de cette fenêtre. Les deux FINALOUTCOME portent uniquement PASS_SCOPED_UI_FIXTURE_ONLY. Aucun code réel, OAuth, accès de base, effet RMS, origine ou action IDA.

Preuves : `private-ui-qualification-228/{positive,duplicate}-FINALOUTCOME.json`, reçus extérieurs `*-native-receipt.json` et marqueurs `*-native-attempt.json`. Le parent a recroisé les identités, durées, raisons, compteurs et quatre pins actuels des sources avec les reçus. Une relecture indépendante limitée des artefacts est demandée sans rejouer les essais.

Le parent reçoit les résultats dans la seule portée du composant d'interface. Le vrai receiver Auth, la préallocation et la lecture des ACL Windows et le véritable raccord RMS restent à préparer et qualifier ; la connexion OpenAI elle-même n'a pas été tentée.

## Relecture indépendante reçue

L'avis `result_mvvbyl4z_0008_vdgatu` confirme la recevabilité230 dans la seule portée de la primitive UI, sans blocage dans les quatre JSON. Identités, compteurs, durées et fins observées concordent. Il distingue explicitement la terminaison des fenêtres par le relais de leur fermeture coopérative, et ne déduit aucun succès Auth, raccord RMS, ACL ou libération d'origine. Aucun contrôle rejoué. Le parent reçoit cette confirmation ; la préparation231 continue sans refaire ces essais.
