# M2 — 95 : fermer trois défauts T2 avant tout runtime

## Verdict et constat parent

La revue94 rend **À_CORRIGER** sur trois risques actuels. Parent recoupe store:515–524 et inventory:132–148/205–208 : constats confirmés. Les protections d'assets/rebinding, staging/attempt/T2 et histoire relevées statiquement sont conservées dans leurs portées, pas des PASS runtime.

Aucun import évalué, typing/test/SQL/DB/asset créé. Quota3 et crossEpochSPENT restent requis/non obtenus ; ces limites ne dispensent pas des trois corrections.

## A — borne exacte du TTL parent

Le contrôleur normal exige expiresAtEvent > sequence (store203), mais le garde postappendT2 accepte sequence <= expiresAtEvent (517). À l'égalité, le parent consommé est expiré selon le contrat même si le child reste valide.

Employer la même frontière stricte au point postappend. Négatif fini : une fixture parent dont E est atteint **exactement** par le vrai append T2, tentative précédente encore à E−1 ; tous autres caps/sources/child/final inventory valides. Attendre refus par ce garde et rollbackentier, pas seulement une exception au-delà deE ou un refus stale masquant le TTL.

## B — jointure sémantique des journaux

inventory135–138 accepte une opération dans une liste et sourceRef truthy ;207–208 ne demande que couverture des clés OWN. Une publication inconnue peut donc être présentée comme bootstrap avec sourceRef d'allocation et une collecte fraîche cohérente en clés/cuts, sans contradiction détectée.

Dans le domaine fermé déjà approuvé, joindre **le vrai producteur/opération/source et les catégories affectées aux bytes des événements/records OWN ou des opérations fichier**. Résoudre les sources et vérifier leur relation, pas leur seule présence ou un hash libre. Taxonomie fermée des opérations réellement admises et liens événement/clé/payload/source/acteur/catégorie ; kind inconnu ou attribution fausse => HOLD. Aucun validateur/journal général ou framework nouveau.

Négatif collecté avant tentative, pas vieille capture : append g3_unowned_publication(owner nonadmis), journal own-control lui donnant operationbootstrap/sourceallocation/key étrangère, puis collecte fraîche des snapshots/current/cuts. Le refus doit viser la contradiction sémantique, pas un ancien snapshot ou TTL insuffisant. Conserver le négatif stale/orphan existant, qui vérifie un autre risque.

## C — actualité des journaux après append

verifyFinalHost compare journauxLIVE/currentrefs/cuts avant effet ; store518–521 n'y revient pas après appendT2 et ne compare qu'une partie de current/snapshot/asset. Une mutation du contenu d'un journal laissant refs/cuts anciens peut donc être acceptée alors que la même prévalidation la refuserait.

Retenir la préimage **complète des sources externes consommées**, journaux/cuts/current inclus, et la revérifier LIVE après le vrai append avant commit. Distinguer cette vérification des sources de la comparaison à OWN : OWN a légitimement changé par T2. Ne pas comparer naïvement le snapshotpréT2 au head déjà activé, demander une collecte externe dans la TX, ni actualiser la vieille preuve. Les seuls effets de contrôle attendus sont expliqués par le reçu et les postimages exacts.

Négatif sur le point d'injection existant : vrai append puis remplacement d'un journal par un nouveau document contigu avec une entrée supplémentaire, sans mettre à jour current.journalRefs/snapshot/cuts ; retour normal. Refus et rollbacktotal. Aucune concurrence native, IO externe ou harnais supplémentaire requis.

## Ownership et procédure

Préserver les huit fichiers94/manifeste readonly avant dégel. GO source-only dans **six fichiers** : src/graph-generation-store.ts, src/graph-final-inventory.ts, src/graph-generation-activation.ts et test/s2-author/t2-fixtures.ts, t2-activation.test.ts, final-host-fixture.ts. Authority/transition restent inchangés/protégés, ainsi que tous anciens tests/seed/helpers/inputs/configs/DB/gels. Besoin précis d'un autre fichier/signature ou DDL à escalader avant modification.

L'auteur livre A/B/C ensemble, hashes/joins/scénarios/limites. Même reviewer reprend défauts et impact ; réutiliser ses preuves94:4–6 non affectées. Les23scénarios existants sont conservés ; adapter les journaux nominaux à de vrais liens est requis, pas un changement d'oracle permettant de masquer une incohérence.

Pas de patch après livraison/gel sans GO, même ancienne allowlist. Aucun importévalué/scellement/bind, typing/test/SQL/opener/DB/asset/provider/native/service/Git/délégation. Pas de registreglobal/framework, T2B/remplacement/succession/S3 ou nouveau contrat public. Futurs OWN/assets/manifest/registre/budget restent à fermer après revue.000b/S2global/M2 ouverts ; aucune commande consolidée ou preuve d'épuisement revendiquée.

Préservation réalisée : huit fichiers94 et SOURCE_MANIFEST conservés byte-exacts readonly sous snapshots/s2-t2-source-94. Les six fichiers de correction sont dégelés, authority/transition restent protégés. GO95 transmis à l'auteur ; reviewer informé d'attendre le prochain manifeste avant de lire le courant mutable. Aucun produit/SQL/asset exécuté.

## Paramètre de fixture pour isoler la borne de tentatives

L'auteur signale que l'ancien scénario «deux rejets puis cap2» atteindrait la séquence8 avec un parent expirant à8 ; le nouveau garde strict ferait alors refuser par TTL au lieu d'exercer le plafond2. Parent autorise de porter **le seul TTL du parent de ce scénario** à10000, dans la borne fixture existante, sans changer les attentes, compteurs ou plafonds de tentatives/préparations. Le négatif sémantique à collecte fraîche doit également disposer d'un TTL valide qui n'en masque pas la cause, comme déjà prévu95-B.

Ce n'est pas une augmentation du TTL produit par défaut ou un assouplissement du garde : cas dédiés d'expiration, notamment égalitéE6, conservent leurs échéances et vérifient la stricte validité. Les autres paramètres/scénarios restent inchangés. Fournir ce delta explicite à la livraison/revue ; aucun résultat runtime présumé du changement de fixture.
