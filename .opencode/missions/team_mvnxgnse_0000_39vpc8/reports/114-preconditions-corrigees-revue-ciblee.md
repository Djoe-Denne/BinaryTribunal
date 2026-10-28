# M2 — 114 : préconditions corrigées, revue ciblée avant rejeu

## Livraison vérifiée

Cinq fichiers113 livrés, hashes parent conformes. Sept autres sources112 byte-exactes. Le seul changementproduit est bien le déplacement d'un bloc de trois lignes inventory334→348, taille inchangée, corps/commentaire conservés et appel unique. [Manifeste corrigé](../evidence/s2-cross-epoch-source-113.json), sourceSetef534b1a… . Baseline112, testT2protégé et contrôleur sont conservés sous snapshots/s2-cross-epoch-112.

131scénarios annoncés conservés ; aucune nouvelle compilation/importévalué/test/SQL/DB/asset. Gate112 reste rouge129PASS/2FAIL. Son nominalCrossEpoch reste observation positive partielle, pas acceptationglobale. Quota3baseline106 demeurevérifié.

## Reprise indépendante bornée

Re-geler les douze fichierspinnés et reprendre le même reviewer sur **préconditions de consommation fraîche, stagingavantattaque et ordre des validations**. Les preuves109/111 horsimpact restent réutilisées, pas de nouvel audit général ou pipeline.

1. Reconnexionoptionnelle privée : mêmeOWN/path réel et mêmesrecordshôte retenus, aucun nouveauassign/firstissuance/grant/counter. Nouveauport lié ànouvelleDB et gettercurrentLIVE, nouveauhandle résolu sur mêmegrantRef. Vérifier les gardes records/propriété/current et que la source pargetter n'est ni clone périmé ni autoritécaller fabriquée. Defaultreopenhistorique sanssource demeurefailclosed ; les deux cas Qrévoquée/ACKtardif doivent atteindre leur refusspécifique et ne plus «réussir» sur vieuxhandle. Replayscommitted et absence d'effets nouveaux restent vérifiés.
2. stageT2factorise la vraieétape : registrecontrollerenfant, stagingcritique audité, clé/payload/journal du vraiévénement. Pas de capturefinale/tentative/activation d'avance ; collectT2 réutilise ce chemin sans ajouter d'effets au doublon. L'attaqueunknownpublication se produit ensuite et la collecteestfraîche, donc l'ancienjoinsémantique s'exerce réellement avec son attenteexacte.
3. Ordreproduit autorisé : journalshapes/roster/current et joinsémantique sont vérifiés avant l'appelterminaldéplacé ; historique, controllers, fichiers et vingtcatégories restent obligatoires avantretour/CAS. Aucun earlyreturn, résultatignoré, nouvellecatch, messagealias ou source rafraîchie. Cet ordre doit préserver les appels de validationfinale et postappend, y compris les famillesjamaisenvoyées et les sources contradictoires.

Les déclarations131cas, plafonds/TTL/defaults/inputs/politiques sont annoncésinchangés : vérifier les deltas concernés et l'atteignabilitéstatique, sans prétendre observer les deux refus corrigés. Un prérequis encore masquant est bloquant, pas motif pour remplacer les attentes par toThrowgénérique.

## Permissions et suite

StrictRO : lectures/hashes/AST/refs, aucunwrite/importévalué/seal/bind/typing/test/SQL/DB/opener/asset/provider/native/Git/délégation/oraclesQA/claim000b. Retour PRÊT_FIXTURE ou bloquantprécis contrat/source/scénario, suggestionsdifférables séparées. Aucun framework/modèle/profil supplémentaire.

Aprèsverdict, parent matérialise compilation+runtime dans paquetOWN/assets/budget distinct ;112nepasrejouer.143DB/44cases112 conservés, aucune réouvertureSQL/cleanup.000bownerlead/S2global/M2 ouverts ; CrossEpoch pas encore accepté, S3/publication/envoyé/remplacement/succession/S4global/consolidationfinale nonacquis.

Gel effectué après readback des12pinsef534b1a… ; reviewerindépendant retenu réactivé sur cette reprise, auteur informé du gel. Aucun nouveau rôle/modèle/profil ou runtime autorisé.
