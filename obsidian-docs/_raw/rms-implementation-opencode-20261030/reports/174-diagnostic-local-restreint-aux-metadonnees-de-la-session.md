# 174. Diagnostic local restreint aux métadonnées de la session

## Objectif et décision parent

Départager un marqueur durable sans événements conservés d'un filtrage de projection, sans relancer le travail. Le parent retient le plan des trois SELECT agrégés du constructeur, avec une portée diagnostique uniquement.

Le GET d'information du serveur ne donne que son chemin temporaire, pas sa base. Le journal desktop déjà identifié ne fournit pas ce chemin non plus. Le fichier par défaut décrit par les sources existe avec ses fichiers WAL/SHM ; **son attribution au processus actif n'est pas encore démontrée**.

Le parent autorise donc une inspection limitée de ce seul fichier candidat. Elle ne sera présentée comme vue de la session que si son identifiant exact et son marqueur concordent. Même dans ce cas, l'attribution au processus restera une inférence distincte, pas un fait obtenu par interrogation de ses handles. Si le schéma ou l'identifiant ne correspondent pas, aucune recherche dans d'autres bases n'est lancée automatiquement.

## Garanties de lecture

Utiliser le lecteur SQLite Bun déjà installé, en ouverture readonly avec query_only, sans importer le runtime OpenCode. Les trois requêtes seront dans une même transaction de lecture, avec prise en compte normale du WAL : vue cohérente au moment de lecture, **pas fichier actif déclaré immutable**. Pas de copie du contenu global, checkpoint, migration ou requête d'écriture. La coordination interne des lecteurs via les sidecars n'est pas présentée comme une immutabilité byte-exacte de ces fichiers vivants.

La sélection porte uniquement sur aggregate_id de notre session et renvoie séquence, nombre d'événements, bornes et types/version suffixée. Aucun payload, identifiant d'autre session ou contenu privé n'est lu par les requêtes. Au plus32types, sortie partielle si la borne est atteinte. Le schéma vérifié se limite aux deux tables concernées. La commande est bornée à dix secondes, et aucun outil n'est installé.

## Limites

Le diagnostic ne crée pas de preuve d'intervalle RMS, de résultat ou de permission. Il ne renouvelle pas l'invocation expirée, ne modifie pas la base RMS OWN et n'ajoute aucune origine. Un marqueur12 avec zéro ligne event expliquerait l'absence locale d'historique dans cette vue, pas l'absence historique passée. Des lignes présentes permettraient seulement de comparer leur type au registre source, pas de certifier le registre chargé.

## Éléments établis avant inspection

- Source : event_sequence porte le marqueur indépendamment des lignes event ; la version est encodée dans type, pas dans une colonne SQL version.
- Candidat unique : C:/Users/djden/.local/share/opencode/opencode.db ; fichier, WAL et SHM existants constatés sans lecture de payload.
- Session ciblée : ses_rms168_53a8e323ef544e7c8a6db75e5bda50c8, marqueur natif précédemment observé12.
- Le plan préparatoire du constructeur n'a ouvert aucune base ni exécuté de diagnostic. Cette décision est celle du parent dans son mandat de lectures locales non secrètes.

## Résultat réel de l'inspection parent

La transaction readonly réussit en10ms, le30octobre à12:59:58.084Z. Elle retrouve exactement notre session avec le marqueur12, mais **zéro ligne dans event**, bornes nulles et aucun type à classer. Les valeurs numériques de métadonnées rapportées avant/après restent les mêmes ; cette observation ne constitue pas une comparaison exacte d'identifiants OS64bits, ni une immutabilité byte-exacte des fichiers actifs.

Le [reçu filtré](../evidence/native-session-metadata-174.json) contient2363octets, SHA256400eb4b4edd98e4d58e9e38f9dc859382d8d0b52d430b1962ca0b30397ec1a4e. Il conserve explicitement activeProcessPathProven=false et les limites de la vue candidate. Une revue indépendante ciblée du script et des conclusions est engagée, sans réexécution de la lecture.

Cela établit un marqueur sans événements conservés dans cette vue, pas un filtre défectueux ni une absence historique passée. Le constructeur recherche seulement les mécanismes source de suppression d'événements qui pourraient conserver les séquences. Leur existence éventuelle ne prouvera pas leur activation ici. Aucun résultat RMS ou témoin d'intervalle n'est fabriqué depuis ce diagnostic.

## Revue indépendante reçue

L'avis result_mvuzg1yt_0002_glqvkg (message msg_18ce7bc16001vk9Z5fbe52rYbe) confirme le reçu2363octets/SHA400eb4b4 et accepte la conclusion SQL limitée, sans bloquant. Il vérifie l'ouverture readonly/query-only, les trois SELECT paramétrés dans une même transaction et l'absence de payload ou de runtime OpenCode chargé.

La revue relève une limite non bloquante : les ino enregistrés dépassent les entiers JavaScript sûrs. L'égalité des nombres rapportés ne prouve donc pas une identité OS64bits exacte. Le constat SQL ne dépend pas de cette identité forte ; il n'est pas nécessaire de rejouer le diagnostic. Si une preuve exacte de fichier devient indispensable, les stats devront être collectées en BigInt et sérialisées en chaînes dans une preuve distincte. Le reçu original reste inchangé et cette réserve n'est pas comptée comme contrôle réussi.
