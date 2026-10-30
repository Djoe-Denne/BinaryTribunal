# 161. Revue du raccord : délai à revérifier après fermeture

## Résultat et décision

La première revue complète du raccord local trouve un défaut bloquant précis : il décide que les entrées sont prêtes avant de fermer la connexion de lecture. Une fermeture lente pourrait dépasser le délai tout en laissant un statut prêt et une durée restante périmée.

Le parent corrobore ce défaut et autorise sa correction minimale : recalculer la marge **après** fermeture, puis refuser si elle est insuffisante. Les fichiers partiels restent conservés ; aucune réouverture de base, nouvelle possession, prolongation ou tentative automatique. Le reçu existant reste un checkpoint explicitement non final.

## Ce que la revue confirme dans sa portée

La lecture du code est favorable sur les autres frontières : archive source réellement hachée avant possession, documents et portées rapprochés, stage existant appelé une fois, relecture readonly des versions, deux fences réelles dans l'image, empreintes distinctes et plafond inchangé, identifiant d'octroi absent avant émetteur, occupation décrite comme locale, écritures exclusives et conservation des échecs. Aucun émetteur d'autorité ou appel réseau n'est identifié dans le raccord.

Ces résultats sont des preuves de lecture indépendante, pas une exécution réussie. Ils seront réutilisés ; la reprise de revue portera sur le correctif et ses impacts, non sur tout le module à nouveau.

## Suite et limites

La correction produit du pont d'adresse160 reste distincte et en réalisation. Le raccord doit ensuite être lié aux nouveaux bytes acceptés, pas rester sur sa copie refusante du prédicat782 ni désactiver celle-ci.

Les vérifications ciblées prévues restent : refus avant possession sur mauvaises entrées, une réservation QA distincte non adoptable après correction, exactitude des relectures et images, puis refus d'un namespace existant ou d'un second appel. Les branches de fermeture et expiration non réellement exercées seront signalées comme telles ; aucun nouveau framework d'injection n'est ajouté par défaut.

Aucune possession opérationnelle, origine, session ou effet natif n'a encore été lancé. Aucun succès complet n'est déclaré.

## Preuves

- Avis : result_mvuuf04o_000f_9en80j, msg_18c65de11001cuR4m4PNfn6lQd.
- Module local revu37378/SHA5094911410706b55458215630071724fdf785d1e5d7f4f3b8fbfeb445688ac8f ; manifeste21234/SHA8ce8dd5bb076e6649e81fa408929cc7c99c28981b2340f127fece0da8de5aa07.
- Lecture parent345–373 : statut et marge360–363, fermeture369–372, retour373. La portée de deadline est bornée par celle du contrôleur291–292.
- Ancienne garde EA199–202 connue et maintenue refusante en attendant la correction produit ; ce n'est pas un nouveau défaut de provenance source.
