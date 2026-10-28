# L8 delta unique — GO de source mécanique

task_mvdnf0ro_002n_nxb4ya, l8-schema-delta-r1,
ses_eb190d82fffe4qaTVvJufnMT7F, GLM Flash/max Model.Ref natif conforme.
ACK9/9 accepté ; rehash parent indépendant9/9=292510B ; manifeste
98ddf0ba63893f43010b5b525879c638e006c56a9b21865ca20d8f6eca8a8adb.
Inputs réguliers non-symlinks nlink1, outputs absents avant GO.
Approbation native approve=true et réactivation explicite transmises.

GO des4 sorties neuves uniquement, correction SCOPE exacte. Diff de validation
limité à12 nœuds (2 suppressions enum,20 suppressions min/maxLength). Descriptions
sur ces nœuds et conteneur historique authoritative sont séparément autorisées ;
ce rewording ne peut modifier de validation. Garderfalse2courants, bool2historiques.
Schéma adoption byte-identique ; DESIGN/MANIFEST actualisés, originaux immuables.
Anciennes refs16+2 = provenance historique, pas un rehash actuel effectué par le
delta. Preuve actuelle du delta limitée à9pins ; ne pas fabriquer une vérification.

Écart de phase déclaré : l'ACK a inclus des vérifications d'ancres sources et
du parsing de nœuds JSON au-delà du strict hash préalable. Lecture seule bornée
aux9pins, aucun write/produit ; cette autorisation source est donnée seulement
après réception/rehash parent et n'étend aucun accès hors paquet ou protocole futur.

Un cycle correctif isolé puis reviewfresh strong. Toute nouvelle anomalie ou
re-review défavorable -> HOLD, pas nouvelle boucle automatique. Pas de validateur,
instance test, import produit/build/run, central, git/registre/config, DB/natif,
IDA/live, réseau ou délégation. Aucune acceptance L8/C3-C5/G7/intégration.
