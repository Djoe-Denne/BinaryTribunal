# 148. Export IDA interrompu : lecture ciblée et corpus retrouvé

## Objectif et résultat réel

Le premier test doit alimenter les clusterisations existantes avec une topologie actuelle d'IDA, puis aider à choisir un cluster grâce aux notes. La revue indépendante avait levé les réserves sur l'exporteur et son lanceur, dans leur seule portée DATA partielle.

L'invocation réelle a rencontré deux événements distincts : une erreur d'échappement du chemin avant lancement, corrigée en chemin forward-slash ; puis un **IDASyncError imposé par le MCP à15secondes**, pendant FuncItems. Ce second appel a bien commencé la lecture, sans terminer. Le fichier de sortie est vérifié absent. Aucun cluster ou export complet n'est déclaré PASS.

Cette limite est celle du MCP observé, pas un rétablissement de l'ancien seuil de quinze secondes de la mission. Aucune configuration, timeout global ou serveur n'est modifié pour la contourner. Aucun autre canal HTTP/shell n'est utilisé pour joindre IDA.

## Correction locale de la méthode d'extraction

Au lieu de parcourir toutes les instructions, la nouvelle version indexe les chunks des fonctions retenues, puis lit les références de code vers leurs entrées. Chaque référence est encore décodée et doit être un call direct ou un jmp inconditionnel vers cette entrée. Un index d'intervalles résout tous les propriétaires des chunks partagés ; get_func(site) seul ne serait pas suffisant.

Cette économie de lecture ne prouve pas que le prochain appel tiendra dans15secondes. Elle constitue une stratégie différente à vérifier, pas un retry identique. Si le domaine reste trop grand, il faudra une extraction bornée/paginée par les primitives existantes, non une modification du backend. Aucun framework supplémentaire n'est construit.

Les métriques non parcourues deviennent explicitement inconnues : nombre d'instructions, appels indirects et cibles directes non référencées. Elles ne sont pas mises à zéro. Le runner conserve coverage partial et adapte ces champs à ClusterInput ; aucun GraphSnapshotV1, plan admissible ou registre RMS n'est revendiqué. La suggestion de comparer group-context-codecs.ts est intégrée au garde de version.

Les syntaxes passent sans évaluation. Revue ciblée du delta en cours avant cette nouvelle stratégie. Les anciennes versions sont conservées comme traces de l'échec ; aucun fichier de résultat ne doit être adopté d'une exécution interrompue.

## Corpus documentaire vérifié

Le worker documentaire retrouve le ledger semantic-certainty et les pages. Le parent compte la table complète :594EA distinctes,101CERTAIN,340LIKELY,1UNCERTAIN,152SKIP répartis sur les catégories historiques. Présence de573pages decomp et85pages semantic, avec recouvrement : ne pas les additionner. Ce sont des statuts documentaires, pas de nouvelles preuves natives.

Trois zones sont proposées pour confrontation après clustering : draw-lists/réservation/callbacks ; BdLink et séquencement d'actions ; animation/géométrie. Aucun cluster n'est encore choisi. Certaines introductions et le catalogue QMD sont périmés ; la table actuelle et les pages doivent primer pour le rapprochement précis. Les quatre quarantaines historiques restent inchangées.

## Preuves, versions et suite

- Revue préalable : result_mvuqn30m_0004_8t72gr ; msg_18c06348e001R3iShhVaq9smde, favorable aux versions cd8f5f82/08320814 dans leur portée.
- Exception native réelle : ida_mcp.sync.IDASyncError, Tool timed out after15.00s, FuncItems/next_code ; cible absente après échec.
- Nouvelle stratégie candidate : export_ida_calls.py6888octets/SHA9100a98e597e31c466eab4b699365d07e7befa4625c10a3a6219c1aa8566f53e ; run-clustering.mjs7474octets/SHA0e58a3c00fbfdb3592aee2b851b71cdf602db9234d4d879d45fd67af62db5094.
- Recherche documentaire : result_mvuqbvhe_002n_zs2aoa ; table parent contrôlée à semantic-certainty.md53–651, sans modification.
- Aucun fichier source du produit, IDB, compte, origine, session ou octroi modifié. La première acquisition RMS reste préparée séparément ; ce diagnostic topologique ne la remplace pas.
