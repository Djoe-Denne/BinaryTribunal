# M2 — 87 : préparation et barrière livrées en source, revue indépendante

## Livraison et intégrité observées

Les six fichiers86 sont livrés. Parent vérifie tailles/hashes, les autres pins82 inchangés, les309sources de base et contrôles de composition, ainsi que les entrées T1 corrigées : conformes. Bloc schéma/gardes textuellement identique82,8997caractères. [Manifeste source](../evidence/s2-t1-source-86.json), sourceSeta118dd9f… .

Le parent constate une livraison, **pas une qualification** :17cas annoncés écrits, aucun import évalué, typing, test ou SQL exécuté. La nouvelle fille n'a pas encore atteint les codecs S1 en exécution. Les60PASS82 restent attachés au snapshot précédent, pas au nouveau produit.

## Décision et contrat de revue

Re-geler les six fichiers et reprendre la revue indépendante existante sur les frontières **nouvelles T0/T1 et l'impact sur82**, en réutilisant les preuves inchangées. Contrat à dériver d'abord : décision utilisateur84–85 (plafond3), contratT1 corrigé, choixCAS et limites86, DRAIN18–68/128–162/296–337, S1T0/CandidateRef/DrainEntry/Head, QA_MATRIX132–161.

Risques et preuves distinctes attendues :

1. Octroi/compteur : source indépendante privilégiée, vraie connexion/ownership, octroi avant nouveaubootstrap, bootstrap1/nouveau+1 atomicité origine/pointeur/événement/compteur, set complet des origines/commits et immutabilité de l'historique. Aucun compteur caller, remise à zéro, nouvel OWN ou révocation historique transformée en autorité actuelle.
2. Candidat initial : enfant lié aux sources S1/parent/root/lineage/policy, non actif et sans droits fils. Préparation(h,c,q)→(h,c+1,q+1), record pré/post déterministe et T0 historique conservés. Toutes écritures concernées comparent h **et** c/pointeur/barrière/fences. Distinguer reprise exacte et nouvelle demande ; guard de plafond ne doit pas créer un nouveau débit sur retry.
3. AutoritéT1 : handle purpose=request-drain privé distinct du controller/bootstrap, vérification des sources/case révision/révocation au consommateur ; pas cohash JSON ou IDs de connexion acceptés comme preuve. Aucun casT1 réutilisable pour T2/B/native.
4. Cut/barrière : collections OWN complètes revérifiées contre l'énumération indépendante, toutes familles réservées même sans outbox, snapshots/pins/slots/fences/claims/sources/preuves et ledger physique82 audité. Cuts/DrainEntry et barrière immuables liés à événements/identités/pre-postimage exacts ; pas flagmode seul, [] par défaut ou garde inatteignable.
5. Races/atomicité : réserve avantT0 incluse ; réserve aprèsT0avantT1 rend T1 stale sans refresh ; nouvelle réserve aprèsT1 réussie refuse. Append ou CAS en échec annule tous effets T0/T1 ; contrôleTTL et sources après append ne laissent rien commis partiellement. Doublon exact ne crée ni cut ni événement ni charge neufs.
6. Continuation/reopen : drain bloque seulement nouvelles familles absentes du cut/candidat nonACTIVE ; observations/Q/release et seuls travaux engagés continuent sous origine/entitlements/profil/prédécesseurs. Rreviewer absent reste HOLD propre. WorkCuts ressources périmés nécessitent observation indépendante avant occupation, aucun quota neuf. Comparer intégration au ledger82/R1 et Q/release sans réaudit de leur code inchangé. Reopen ne lève pas une barrière ni ne recharge un compteur ; histoire et source courante demeurent distinctes.

L'absence de nouveau schéma permet de réutiliser la preuve de structure, mais pas de dispenser la vérification des nouvelles projections et de leurs consommateurs. Examiner les tests après dérivation des attentes, surtout leurs préconditions nominales et causes de refus ; tests auteur non oracle indépendant.

## Preuve encore absente, sans faux PASS

La tranche autorisée ne permet que bootstrap1+prepareInitial2 avec candidat pointé. Le cas d'épuisement après trois commits cohérents puis quatrième refus spécifique reste **obligatoire/non obtenu**, faute de cycle de vie ou histoire indépendante autorisés. Pas de waiver et pas de refus du pointeur compté comme plafond. Cette limite ne doit pas provoquer une APIstaging hors périmètre ou un nouveau harnais dans cette revue. Toute acceptation future de T0/T1 sera partielle sur cette dimension ; S2 global/budget préparation ne sont pas clos.

## Permissions et sortie

Reviewer readonly : aucun write, import évalué/scellement/bind, typing/test/SQL/opener/DB/native/service/Git/délégation, aucun oracleQA S1/L7. Lectures ciblées/hashes/AST statique autorisés. Retour PRÊT_FIXTURE (portée partielle explicite), À_CORRIGER ou BLOQUÉ avec preuves source/contrat/scénario pour chaque bloquant actuel ; suggestions différables et obligations futures séparées.

Après verdict, parent ferme corrections et futur runner/OWN/registre/budget distinct avant exécution. Aucun ancien paquet rouvert. 000b/S2/M2 ouverts, T2/ActivationAttempt/remplacement/succession/S3/S4global/public/native horsscope, pas de consolidation finale, Git ou nettoyage.

Re-gel des six fichiersa118dd9f… effectivement réussi après readback ; revue87 transmise au reviewer indépendant existant, sans nouveau profil/modèle ou contexte auteur. Auteur informé de ne plus retoucher le courant. Aucun verdict ou droit runtime présumé de cet envoi.

## Signalement sous gel : identité de l'autorisation au doublon T1

L'auteur signale ensuite que DrainResult ne retient pas la ref exacte du caseT1 consommé. Une tentative de patch a été refusée EPERM dès le premier fichier, sans contournement ni changement appliqué annoncé. Le parent rappelle qu'aucune tentative d'édition n'est autorisée après le gel sans nouveau GO, même dans une ancienne allowlist ; la version87 doit rester l'unique cible de revue.

Lecture parent requestDrain:420–430 : le case courant est résolu et lié au candidat/préparation/owner ; sur barrière existante, le retour ne compare que candidat et pré/postimage attendus, pas la source d'autorisation consommée lors du premier commit. Cela étaye le scénario d'un autre caseId visant les mêmes données. Aucun nouveau débit/event/activation n'est allégué ; le risque porte sur le contrat « doublon exact, différent refuse » et sa traçabilité.

Transmettre ce signalement à la revue en cours, sans lui prescrire un verdict ni appliquer un patch au milieu de son analyse. Elle doit dériver du contrat l'identité requise et vérifier si le scénario est effectivement admis. Si confirmé, correction potentielle bornée : ref d'autorisation persistée dans résultat/événement, égalité au retry et négatif autre-case/même-candidat. Ne pas la présenter comme déjà faite. Aucun runtime nouveau et aucun nouveau cycle de revue indépendant nécessaire pour ce signalement.
