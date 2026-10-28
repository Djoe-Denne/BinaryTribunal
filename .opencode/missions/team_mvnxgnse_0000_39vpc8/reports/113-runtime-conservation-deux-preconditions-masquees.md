# M2 — 113 : deux négatifs masqués, corriger les préconditions sans affaiblir les attentes

## Résultat réellement observé

Gate112 : typingvert2056ms, puis **129PASS/2FAIL/0SKIP,845assertions sur131tests**, runtime157010ms. Deuxinvocations/159066ms, paquet clos sansretry ; sources stables9b049bc8… . Hashs logs/reçus vérifiés.

Le nominal A_SPENT/B_BURNED/R_ENCUMBERED avec T2/reopen a réussi, ainsi que les autres négatifsCrossEpoch saufACKaprèsretraite. Ce sont des observations positives partielles ; la tranche n'est **pas acceptée** avec deux échecs ouverts. Les quinze nouveaux cas ne sont pas tousPASS et les116précédents ne sont pas tous conservés dans cette version.

143basesSQLite/527990784octets et44casesassets/132entrées/44fichiers retenus ; zéro chemin non possédé, aucune dérive dehash, manifest inchangé. AucuneouvertureSQL de diagnostic ou cleanup. Inventaires DB4c7ec318… et assets064ad4b5… ; reçus typingff9e781f… et runtimec3d98c61… . Anciennes preuves/rouges demeurent distincts.

## Deux causes recoupées

1. **ACK tardif aprèsreopen.** cross-epoch.test96 attend la contradictionQ, mais reçoit «private origin grant handle missing/wrongDB». Parent recoupe reopenT2 : nouvelleconnexion/authority sanssourceorigine et conservation parspread de l'ancienoriginGrant. freshConsumption lance nextCandidate avec ce handle de l'ancienneDB. Ce refus est sûr mais ne prouve pas le risqueACK ; le négatifQrévoquéeaprèsreopen60–65 peut aussi être masqué par ce même prérequis, malgré sonPASS générique.
2. **Publication étrangère maquillée.** t2-test139 attend le joinsémantiqueproducteur/op/source. Le nouvel audit vide du stagingterminal intercepte l'événement inconnu avant la collecte finale. Le refus estfailclosed, mais ne rejoue plus le contrôle précis initialement visé. Ne pas remplacer l'attente par toThrow() générique ni enlever la nouvelle garde d'histoire.

## Correction source autorisée : helpers/tests seulement

Après préservation des11sources111, du testT2 protégé et du contrôleur112, dégel **quatre fichiers** : test/s2-author/t2-fixtures.ts, cross-epoch-fixtures.ts, cross-epoch.test.ts, t2-activation.test.ts. Aucun produit ou contrôle d'autorité modifié. Besoin précis d'un autre fichier à remonter avant édition.

Pour les consommationsfraîches aprèsreopen, fournir explicitement aux seuls cas qui les réclament la sourcehôte **déjà retenue et encore courante**, sur la mêmeidentitéOWN/path/root/domaine, puis résoudre un nouveauhandle vers la **mêmegrantRef durable**. Ne jamais register un nouveloctroi, rappeler uneallocation/firstissuance, remettre compteur0 ou recycler l'ancienobjetconnexion. Les sources indépendantes inconnues restentHOLD et le défautminimalhistoricalreopen sansprovider ne doit pas devenir permissif. Un raccordprivé optionnel du helperCrossEpoch peut attacher lesrecordsretenus à la nouvelleconnexion et obtenir leshandlesactuels ; le reviewer vérifie propriété/actualité et absence de réémission. Refaire les deux préconditionsQrévoquée/ACKtardif avec un refus **spécifique au risque visé**, pas à un mauvaishandle ; conserver l'audit de l'anciencommit, pins/slots/débits et absence de nouvelleactivation. Si la sourcecourante ne peut être reconnectée sansnouveaucontrat ou fauxproof, escalader plutôt que contourner.

Pour le joinsémantiquepublication, établir le staging légitime **avant** l'événementétranger, puis injecter l'opérationmalétiquetée et effectuer une collecte réellementfraîche. Réutiliser/factoriser l'étapeprivée de staging du helperT2 (vraiévénement et journal correctementliés), sans appendtentative/activation anticipé, fauxsnapshot ou suppressiondeguard. Le contrôle d'histoire déjàstagé puis la collecte doivent encore atteindre le joinsémantiqueinitial et refuser la publication inconnue. Garder l'attente précise, et les effetsdurables attendus comparés au bonétatavantattaque.

Le tempspertest et les plafondsproduit ne sont pas relevés par cette décision. Les autres cas, oracles et131scénarios sont conservés ; quelques assertions spécifiques sur les prérequis remis enétat sont permises, pas un nouveauframework/campagne. Les preuvesfonctionnelles/source111 restent valables hors impacthelpers ; la preuveaprèsreopen masquée n'est pas réutilisée comme validation du mauvaisrisque.

## Revue et suite

Livrer quatrehashs/deltas/preconditions/causesrefus avec nouveauxhandles/sourcesexplicitementretenus. Même reviewer reprend ces deux corrections et leurimpact, sansréauditproduit106–111. SOURCE ONLY : zéroimportévalué/seal/bind/typing/test/SQL/DB/opener/asset/provider/native/Git/délégation/oraclesQA. Aucun accès aux143DB/assets112 ; prochainruntime seulement aprèsrevue et nouveaupaquetOWN/budget distinct. Gate112clos, pasretry.

Quota3baseline106vérifié ; nominalCrossEpoch observémaisacceptationglobale de cette tranchebloquée sur ces deuxscénarios.000bownerlead/S2global/M2 ouverts, aucune extensionS3publication/envoyé/succession/remplacement ou consolidationfinale.

Préservation effectuée :11sources112, testT2protégé, manifeste110 et contrôleur112 conservés byte-exacts readonly sous snapshots/s2-cross-epoch-112. Seuls quatrehelpers/tests annoncés sont dégelés ; GO113 transmis à l'auteur et reviewer informé d'attendre le prochain manifeste. Aucunproduit/DB/asset exécuté pendant cette préparation.

## Extension locale précise : ordre des deux validations de l'inventaire

L'auteur relève une deuxième occurrence opposable, recoupée par le parent à inventory336/347–350 : même avec staging antérieur, verifyFinalHost appelle encore collectTerminalHistory **avant** le joinsémantiquejournal. Le correctif de fixtures seul ne peut donc atteindre le risqueprécis avec ce mêmeévénement.

Autoriser **un cinquième fichier**, src/graph-final-inventory.ts, uniquement pour déplacer l'appel EXISTANT collectTerminalHistory108 et son commentaire après la boucle sémantique347–350, avant les étapes suivantes/retour373. Le résultat n'est pas consommé par les lignes intermédiaires. Tous contrôles (roster/current/forme/join/history/controllers/files/catégories) restent obligatoires dans le même appel synchrone avant retour et avant tout effetT2 ; aucune collecte ou source rafraîchie, branche contournée, exception aval absorbée ou message renommé pour imiter un join atteint.

Ce choix conserve les deux preuves de sûreté et fait dériver le refus d'opération inconnue du validateur sémantique précis. Pas d'assouplissement du non-envoi ou de l'histoirevide ; aucun nouveaucycle/import/DTOpublic/backend/DDL. Les autres lignes du produit doivent rester identiques. inventorysource112 est déjà conservé dans snapshots/s2-cross-epoch-112 et sera dégelé après readback. Allowlisttotale113 désormais cinqfichiers, non une permissiongénérale sur le produit. Revueindépendante reprend explicitement cet ordre et l'atteignabilité des deuxnégatifs avec leshelpers corrigés ; aucunruntime accordé avant.
