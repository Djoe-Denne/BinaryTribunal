# Parent QA0 plan — corrections puis GO écriture des trois outputs uniquement

Candidat lu result_mvdycjb9_000s_92mec8, native msg_14f858d8e001Lj6z27XwFPCJ6s.
Ce n'est pas une revue/livraison finale acceptée. NativeModelRef Flash/max vérifié.
Parent rehash 9pins/150730B exacts. Corriger le plan avant les outputs :

1. U1 est une ERREUR D'INTERPRÉTATION, pas hash/provenance inconnu. L'algorithme
   est SHA-256 sur les bytes RAW de INPUT_MANIFEST.json. Digest hex64 complet :
   `384734b29766a3bc5c99c0e15ba668c4eba6594adb4485265070fa2d6e26c557`.
   «SHA384734...» concaténait le libellé SHA et le digest commençant par 384 ;
   il ne désignait jamais SHA384. Aucune recette de concat/canonisation des pins.
   Noter la fausse piste comme correction, pas un HOLD restant ni data drift.
2. Séparer clairement oracle d'ENCODEUR argv/env, validateur bloc PRÉENCODÉ et
   validateur PLAN complet. Encodeur env trie les entrées caller non triées ;
   ENV03b doit accepter [B=2,a=1] et produire a=1\0B=2\0\0. Un bloc fourni déjà
   encodé non trié est refusé s'il existe une API de validation de bloc. Aucun
   refus d'une entrée non triée par simple réutilisation de GuardianPredicates.
3. Seuils UTF16/code units argv/env sont codecs seuls : env32767 code units
   peut être encodable, mais son coût réel avec le plan/OWNER/lease/etc dépasse
   souvent ControlFiles32768. Ne pas qualifier un PLAN positif sur la seule
   longueur du bloc. Idem cmd32766. Les tests contrôle32767/8/9 attendent encoding
   canonical fixé puis ajustent les bytes supplémentaires réellement fournis.
4. MaxChunk4096 concerne writes runtime FUTURS, pas la taille du document/array
   data ni d'une fonction Encode. F framing GTC1, capture114688 et total262144
   restent obligations broker futures, pas couverture de ce DTO. Les retirer de
   la table d'attendus exécutables QA0 ou les marquer futur/hors slice sans oracle
   d'une méthode qui n'existe pas. Aucun broker/writer/authority dans cette slice.
5. Distinct TargetPin du ledger HostComplete ≠ interdiction de SHA répété dans
   SourcePins. Des sources distinctes peuvent légitimement avoir les mêmes bytes.
   Ne pas inventer de contrainte digest unique pour tous pins. API pin/identité
   exacte attend le plan auteur fixé par parent. U7 référence absente reste
   déclaration documentaire seulement, pas besoin d'origin/réseau.
6. Les ACCEPT/REFUSE de codecs sont exacts sur domaine commun fixé. Une restriction
   additionnelle ne s'auto-ratifie pas : remonter avant adoption. Hors table, un
   écart est à adjudication parent, pas «autorisé par défaut». Ne pas accepter une
   implémentation qui refuse un positif contractualisé pour éviter le défaut.

GO QA0 après lecture de cette correction : écrire ARG_ENV_ORACLES.json,
QA_PLAN.md et MANIFEST.json seulement. Pas GenericTargetPlanTests.cs avant API
parent ; pas product import/compile/run/validator. U2/U3/U4/partie U5 restent
API/encoding à fixer, pas blockers utilisateur. Hash du supplément à déclarer
dans manifest avec les 9pins intacts ; rehash final. Verdict final QA0 livraison
partielle seulement, aucune couverture réelle ni clôture teamtools.
