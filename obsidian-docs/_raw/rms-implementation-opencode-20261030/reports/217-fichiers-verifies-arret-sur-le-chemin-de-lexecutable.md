# 217. Fichiers vérifiés ; arrêt sur le chemin de l'exécutable

## Résultat réel

Le correctif résout le dépassement observé209 : les32227fichiers, soit332635368octets, sont tous vérifiés en45497ms. Les compteurs sont complets, sans erreur ou lecture en vol, avec quatre lectures au maximum et une réservation nominale maximale de13933577octets.

L'enfant Bun démarre ensuite. L'essai reste toutefois **HOLD**, sortie1 après47180ms, sur le contrôle du message de démarrage, avant les deux GET. La fermeture du scope est reçue, l'enfant finit sortie0 et aucun arrêt forcé n'est demandé. Les sorties sont collectées sans troncature ni redaction. Cela ne constitue pas encore une qualification complète, un chargement natif exhaustif ou une simulation IDA.

## Défaut ciblé identifié

Le client compare strictement le texte du chemin d'exécutable annoncé par l'enfant avec le texte du plan. Le plan utilise des slashs, tandis que Bun sous Windows annonce des antislashs. Les sondes stdlib208 ont observé cette forme native, et le bootstrap épinglé envoie précisément process.execPath. Cette comparaison ne peut donc pas accepter les deux formes équivalentes attendues.

Le runner193 employait déjà une comparaison normalisée du chemin complet. Le parent autorise une correction compatible de ce seul point : comparer des chemins Windows absolus complets après normalisation des séparateurs et de la casse, jamais le nom de fichier seul. Chemins relatifs, URL, NUL, autre disque, répertoire ou exécutable restent refusés. Tous les autres contrôles du handle, nonce, parent, version, port, droits, expiration et hashes demeurent.

La candidate ne conserve pas tous les faits du message refusé : on ne prétend pas qu'aucune autre divergence ne pourrait être découverte ensuite. Aucun rejeu diagnostique de l'hôte n'est demandé pour cette analyse.

## Correction et contrôle prévus

Le constructeur peut modifier uniquement les trois fichiers client, binding et tests binding déjà ouverts. Un petit matcher DATA doit être consommé par la garde réelle et testé dans le fichier existant sur les formes équivalentes et les refus. Aucun nouveau fichier, lecteur, harnais, bootstrap, API native ou changement global. Le constructeur n'exécute rien.

Le parent a vérifié puis conservé les cinq sources214 dans `qa-owned-runtime-214/baseline-before-path-fix-217` avant d'autoriser les éditions. Le nouveau gel recevra le typecheck, les tests affectés et la revue limitée du delta. Aucun nouvel essai natif n'est autorisé par cet ordre de correction.

## Continuité et preuves

- Préparation216 : sortie0,141ms, fence4 acquis sans changement logique hors bail.
- Receiver216 :47180ms d'invocation,47267ms de collecte extérieure, sans timeout extérieur ou Kill.
- `owned-direct-216/FINALOUTCOME.json` reste HOLD. Candidate et reçu provisoire correspondent à leurs hashes ; le provisoire reste non adoptable.
- `evidence/owned-state-after-hold-216.json` :37tables identiques à l'état après acquisition, bail inclus. Root, origine unique, débits et historique inchangés.
- Bootstrap193:124–125 émet process.execPath ; runner193:233 normalise le chemin ; client courant:656 compare encore les textes strictement.

Aucun GET métier, POST, session, modèle, résultat scientifique ou effet IDA dans cet essai. Le petit parcours IDA et l'acceptation M2 restent ouverts.
