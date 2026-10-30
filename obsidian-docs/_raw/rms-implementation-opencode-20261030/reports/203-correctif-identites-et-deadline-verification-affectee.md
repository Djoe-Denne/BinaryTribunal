# 203. Correctif identités et deadline : vérification affectée

## Candidat reçu et contrôle prévu

Le correctif des deux blocages202 est livré dans trois des cinq fichiers autorisés. Le parent a recalculé les cinq pins et confirmé que le périmètre reste identique. Le transport et les tests client sont inchangés ; la baseline201 et tous les résultats précédents sont conservés.

Le parent autorise le typecheck et les seuls tests affectés : les trois cas client précédents et les trois cas binding précédents plus deux nouveaux oracles. Les primitives Q1, dont le module et les entrées restent inchangés, ne sont pas rejouées. Aucun test global ou natif n'est autorisé.

## Corrections à vérifier, pas encore acceptées

Les captures/relectures d'identités sont passées en BigInt ; les sorties durables utilisent des chaînes décimales explicites. Le parent a lu les helpers purs correspondants. Le nouveau test distingue deux identifiants au-delà de2^53, même si une conversion Number pourrait les confondre.

Le budget monotone est conservé jusqu'aux logs, synchronisations, reçu, readback et publication candidate. Le parent a relu ce chemin. Le reçu disque est désormais **provisoire et non adoptable seul** : la candidate stdout exige encore une attestation parent externe de fin d'invocation, sortie0, respect du budget total et vérification des hashes. Le test de coût simulé doit refuser les dépassements et la frontière exacte120s, sans sleep, hôte ou horloge globale modifiée.

Le même reviewer reprend ces deux défauts et leurs impacts. Son avis reste nécessaire : un oracle pur réussi ne prouve pas à lui seul le bon placement de toutes les gardes dans les E/S réelles.

## Commandes et limites

Depuis le harness du candidat198 : `bun run typecheck`, puis deux sélections ancrées dans les fichiers client et runtime-binding existants, respectivement3 et5cas attendus. Les regex exactes, argv, pins avant/après et durées seront conservés dans les reçus. Borne dix minutes par invocation, sans retry automatique. Les cas filtrés restent non exécutés.

Aucune composition Bun→Bun, base, API native, session ou modèle n'est lancé par ces contrôles. Les POST restent refusés et la tranche B n'est pas implémentée. Une qualification éventuelle devra intégrer le nouveau protocole parent de finalisation, sans adopter un reçu provisoire ou une ancienne forme de succès.

## Pins courants

- client95259octets/SHA `994c496eb938fc57826854a541ce511071d597965a52b8db98ecdda13a10a010`.
- binding20934octets/SHA `ae6fe77b33b09b24091492443301e613ecd3448e1b46bd4ca88e97ad2f5d18bb`.
- tests binding12657octets/SHA `5edd70434afa27c283c44612b59643cb3bbc6326cf1ee521af223e290b8c711e`.
- transport25629/54d35747 et tests client112023/35d881db inchangés ; pins complets à retenir avec les reçus QA.

Livraison `result_mvv5wyfv_0000_gwtl90`, aucune QA auteur. Acceptation du code, qualification native, D5 et M2 restent ouverts.
