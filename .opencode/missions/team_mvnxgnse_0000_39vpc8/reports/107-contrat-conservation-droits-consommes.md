# M2 — 107 : formaliser la conservation des droits réellement consommés

## Objectif et constat recoupé

T2 minimal et plafond3 sont vérifiés106 ; les slots des positifs étaient AUTHORIZED. La preuve restante exige des droits réellement SPENT/BURNED/ENCUMBERED conservés entre générations. DRAIN606–650 impose les mêmes slotkeys et compteursroot, sans crédit par epoch, abandon ou libération physique.

Préparation auteur reçue en lecture seule. Parent recoupe store821–865/902–925 : une preuve exacteQ «absent» peut terminer une outbox PREPARED/attempt0/receiptNULL ; release enlève seulement les claims physiques/scientifiques, conserve la familleRELEASED, l'unitéCANCELLED et les droits. Ceci ne prouve pas à lui seul l'absence d'effet scientifique : elle doit être opposable dans le domaine hôte fermé avantbootstrap et ses journaux.

Les gardes T2 actuelles refusent toute famille/outbox et histoire retired avec travail. Elles ne sont pas à supprimer : un nouvel audit positif devra expliquer toute histoire terminale et distinguer absence d'occupation de disparition des preuves. La tranche ne doit pas inventer publication/COMMITTED/readback scientifique ou exécuter du code reconstruit.

## Décision et livraison autorisée

Autoriser exactement deux nouveaux fichiers sous `inputs/s2-cross-epoch-fixture-r2/` après absence vérifiée : `CONTRACT.md` et `cross-epoch-fixtures.ts`. Entrées et attentes réutilisables seulement, aucun produit/test existant modifié. Contrat utile≤6500caractères hors exemples, pas de catalogueS2–S4 ou infrastructure nouvelle.

Chemin proposé à fermer, pas encore qualifié : dans une nouvelle fixture parcas avantbootstrap, mêmeOWN/root/octroi/grants/acquisition/asset ensuite ; réserveA/B/R ; A réellement pinnéSPENT et jamais envoyé ; B réellementBURNED sur bodyAdmission dépassantC sans modifier le command S1 ni releverC ; R demeureENCUMBERED. PreuvesQ exactes et retraite de famille sans effet, libération physique puis photographieT0 et T1/T2. Tous les effets de travail doivent être antérieurs àT0 pour ne pas rafraîchir une observation périmée.

## Contrat à fermer

1. Sources indépendantes privilégiées opposables : domaine et producteurs permis acquis avantbootstrap, journaux de contrôle et fichier complets avec vraies opérations ; absence de sender/executor/publisher n'est ni déduite d'API absente ni attestée par la même demande. PREPARED/FAILED/CANCELLED ne signifie pas «jamaisenvoyé». Une émission/tentative/receipt/effect externe inconnu ou publication requise=>HOLD.
2. A : identitéBody/command/pinSPENT/journal intégraux, tentative0/receiptNULL, proofHOSTcurrent «absent+quiescent» attaché àexecution/body/attempt/gen/fences exacts, événementQ et releasedallocation+releasedfamily explicables. Un lateACK, preuve révoquée ou contradiction rend le nouveau final inexploitable avant effet. Réutiliser les contrôles existants, sans transférer l'ancien controller comme actuel aprèsT2.
3. B : Admission réellement>C au pin, étatBURNED/pin complet/événement conservés, zérooutbox/allocation/IO. Le dépassement doit provenir de donnéesAdmission permises horscommand ; pas changement d'oracleC ou test sous autre refus. R : engagement initial démontré, jamaispin/IO, reste lié à l'origine et n'est pas réassigné à la fille.
4. Distinguer sources LIVE exigées lors d'une nouvelle activation et histoire d'un commit déjà audité. Un reopen ne doit ni réactiver la famille retirée ni refaire une charge, ni prendre une révocation ultérieure pour une permission d'émettre. Histoire inexpliquée=>UNKNOWN/HOLD pour toute nouvelle consommation ; pas effacement des lignes pour retrouver un inventaire vide.
5. Inventaire20catégories : joindre les vraies familles/exécutions/intents/outboxes/slots/proofs/releases/allocations HISTORIQUES, les cadres d'autorité et leurs liens aux journaux producteurs. Seuls claims/occupations **courants** doivent être vides. Étendre la taxonomie aux seules opérations réellement admises reserve/prepare/burn/observation/allocate/release, y compris unitId ; aucun kind omis, mauvaise source ou collection par défaut[]. Le roster ne peut être élargi après les faits pour légaliser un producteur inconnu.
6. Fille : nouvelle entrée scientifique avantseal avec planDEFER/selected=[] cohérent selon les codecsS1 existants. Garder same rootAllocation/rootLimits/rootGrants/rootAccount et slots originaux ; aucun nouveaubootstrap/octroi/assetrelocation pour refaire le budget. La fonction privée de ses droits ne doit pas devenirREADY ou recevoir une admission. Root remaining limits doivent être explicites et dérivés de l'histoire auditée, pas d'un compteur fourni par le demandeur.
7. Attentes manuelles : mêmes trois slotkeys/grants/pins/C/reservedDebit100000, états[SPENT,BURNED,ENCUMBERED], engagementtotal300000 et restant0 avant/aprèsT2/reopen, K inchangé ; confirmer ces unités/montants dans la nouvelle origine et les primitives existantes, sinon HOLD et contradiction précise. A retry exact ne crée aucun débit ; Q/libération ne rembourse rien ; ressources physiques seules redeviennent disponibles. La première admission de fille reste une transaction distincte et doit refuser faute de nouveaux droits.

## Cas finis et frontières

Nominal avec vraies consommations/retraite puis T2/reopen ; retry exact ; Q absente/révoquée/mauvaisbody/attempt/fence ; famille ou worker encore actif ; lateacceptance contradictoire ; histoire/category/source non expliquée. Les causes doivent être atteintes sans masqueTTL/staleT0 ou incohérenceS1. Aucune publication scientifique fictive ; si sa preuve est indispensable, nommer la dépendanceS3 et maintenirHOLD au lieu de l'implémenter implicitement.

Proposer le plus petit raccord produit dans les modules existants, checker privé d'audit partagé si utile ; aucun nouveau contrat public/DDL/backend/service/registre global/framework. Besoin précis d'extension à remonter avant code. Les preuves primitives et106 restent réutilisables hors impact.

## Permissions et suite

Écriture de ces deux artefacts seulement. Zéroimport évalué/seal/bind/typing/test/SQL/DB/opener/asset/provider/native/Git/délégation ; aucune ouverture des bases106. Toutes sources105,inputs,128DB/assets/logs et anciens rouges restent gelés, gate105 close. Parent inspectera le contrat avant d'autoriser un delta produit source, puis revue indépendante et gateOWNdistincte.

Quota3 resteVÉRIFIÉ en fixture ; conservationcrossEpoch resteREQUIS/NONOBTENU.000bownerlead/S2global/M2 ouverts, pas de remplacement/succession/S3public/S4global ou consolidation finale acquis.
