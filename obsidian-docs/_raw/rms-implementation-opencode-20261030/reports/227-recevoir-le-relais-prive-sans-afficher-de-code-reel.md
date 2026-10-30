# 227. Recevoir le relais privé sans afficher de code réel

## Livraison et but

Les deux candidats de fenêtre privée sont livrés. Ils doivent permettre à l'utilisateur de valider sa connexion sur la page officielle OpenAI sans enregistrer le code temporaire. Ils n'ont encore été ni importés ni exécutés, et ne sont pas une preuve de connexion.

Le parent a relevé leurs empreintes et lu le code. La fenêtre doit être démarrée et prête avant le lancement RMS, puis liée au seul enfant réel. Deux probes puis un challenge sont acceptés dans cet ordre ; les ACK ne contiennent pas le code et n'attestent pas une connexion. La fenêtre reçoit le code par son pipe privé, le garde dans un contrôle mémoire et n'ouvre la page officielle fixe que sur clic humain.

## Contrôles fermés

Avant tout affichage, le parent autorise seulement :

- `node --check` sur le fichier relais candidat ;
- analyse syntaxique PowerShell avec Parser.ParseFile sur le fichier fenêtre candidat, sans dot-source, import ou évaluation.

Sortie0 et zéro erreur syntaxique attendus. Pins des deux fichiers avant/après, identités des commandes, durées et résultats seront conservés dans `qa-private-ui-227`. Aucune fenêtre, pipe, processus candidat, page Web, OAuth, base ou modèle n'est lancé par ces contrôles. Ils ne prouvent pas les comportements Windows ou la confidentialité de bout en bout.

Le reviewer indépendant reçoit les deux fichiers et leurs pins pour une revue bornée du canal, des identités, messages, secret, délais et fermeture. Cette revue est indépendante de l'auteur de l'interface et ne rejoue pas les tests. Le correctif226 de réponse native reste un travail distinct en cours ; aucun résultat de l'un ne lève les prérequis de l'autre.

Après ces vérifications, le parent fermera le petit essai nécessaire avec des données factices explicites avant tout vrai challenge. Aucun clic navigateur ou appel OpenAI n'est autorisé implicitement ; les commandes et bornes seront arrêtées avant exécution. Un nouveau harnais général n'est pas requis : seulement le raccord possédé du protocole existant.

## Pins et limites

- `auth-parent-225/private-ui-relay-v1.mjs` :11439octets, SHA256 `8518b843eab468c34c1b0060f61c06e98cbe499c08079992d718e529c0674053`.
- `auth-parent-225/private-ui-window-v1.ps1` :9775octets, SHA256 `230f1855d3ffc753def468f5321c4325e864002f668c93decf86d199e22d212f`.

L'auteur n'a pas calculé de pins ou exécuté de contrôle ; les empreintes ci-dessus viennent des lectures du parent, pas de sa prose. Les fichiers produit, scripts219, ACL et dépendances sont hors de ce delta.

Le module retourne des observations publiques non secrètes ; closed et windowExitObserved distinguent demande et sortie effectivement reçue. Aucun ACK, fenêtre fermée ou silence ne vaut succès OAuth, fin native complète, grant ou libération d'origine. Le futur receiver et les droits privés Windows restent à réaliser et vérifier. Le parcours IDA et M2 restent ouverts.

## Résultats syntaxiques réels

Node --check réussit : sortie0,29ms. Le parseur PowerShell retourne zéro erreur en4ms. Les deux pins concordent avant/après ; reçu `qa-private-ui-227/syntax-only.json`. Aucun candidat n'a été évalué, aucune fenêtre ou connexion ouverte. La revue indépendante reçoit ces résultats ; sa conclusion reste attendue.
