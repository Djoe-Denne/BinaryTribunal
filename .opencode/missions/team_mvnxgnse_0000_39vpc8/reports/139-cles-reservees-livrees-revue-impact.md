# M2 — 139 : clés réservées livrées, revue de leur classification

## État vérifié

Le parent vérifie les deux tailles/hashes138, les dix autres pins136 et les deux entrées122 inchangés, puis gèle les douze sources. Le texte des58cas précédents est un préfixe exact du nouveau fichier de tests ; seuls les trois négatifs annoncés sont ajoutés. [Manifeste138](../evidence/s2-replacement-source-138.json), baseline sous snapshots/s2-replacement-137.

61cas écrits,58sans thread et3HOLD125 ; **aucun exécuté sur cette version**. Typing et performance138 inconnus. Les optimisations136 acceptées statiquement137 restent inchangées ; aucun gain net ou respect15s revendiqué. Les résultats historiques128 restent attachés à leur source et134 reste rouge partiel.

## Revue bornée au défaut clé et son impact

Reprendre le même reviewer sur t2-fixtures et l'ajout de trois tests seulement. Vérifier :

1. mission/key réellement lues et familles candidate-staging:/activation-attempt:/activation-outcome: issues des producteurs existants. Clé entière et suffixe conservés, y compris ':' internes d'identifiants. Reconnaissance indépendante du kind/header ; clé réservée+payloadinconnu/malformé ne peut redevenir ABSENT. Au premier indice, lecteur strict avant toute décision d'absence ou rejet secondaire, sans init ou faux0.
2. Compteur présent : reconnaître une clé n'accorde pas de permission. Contradictions mission/root/kind/unité/payload/digest/recordévénement opposables par les lecteurs historiques réels. Joins staging/enveloppe/run/DrainEntry et chaîneOLD→NEW cohérents ; ne pas ajouter de provider LIVE au simple audit de preuve passée. L'EventLog doit être celui de la même OWN et aucun constructeur/callback externe nouveau.
3. Trois négatifs pré-final atteignent bien le refus strict quand seul le fait de clé réservée subsiste, kind inconnu/payload{} et digest EventLog valide. Avant/après refus ne doit pas réparer OWN. Les58cas antérieurs et autres branches readonlyreopen/strictness gardent leur sens ; le coût des nouveaux joins n'est pas une mesure de performance.

Réutiliser constats137 sur l'absence de compteur0, les deux audits dupliqués et la Map acceptés hors impact, ainsi que les revues antérieures valides. Pas de réaudit performance, catalogue61/131, nouveau pipeline ou framework. Tout défaut bloquant doit citer contrat/source/scénario ; suggestions différables séparées.

## Permissions et suite

RO uniquement : lectures/hash/AST/refs bornées, aucun write/importévalué/replan/seal/bind/typing/test/thread/SQL/DB/opener/asset/provider/native/Git/délégation/oracleQA S1/L7. Tâche globale propriété du lead. Après verdict seulement, parent fermera un gate neuf de compilation puis les mesures/tests ciblés utiles selon impact, pas un retry134 ou une hausse15s/300s.

HOLD125 intégral pour les trois chemins thread, aucune infrastructure de confinement ajoutée. S2/M2/remplacement/S1concret global/contention non acceptés ; trois commandes consolidées non lancées.
