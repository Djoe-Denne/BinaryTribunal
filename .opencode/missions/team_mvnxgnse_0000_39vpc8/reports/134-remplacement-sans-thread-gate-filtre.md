# M2 — 134 : tester le remplacement sans lancer les trois cas thread

## Filtre vérifié, oracle de comptage corrigé sans rejeu

La sonde133 a réellement terminé Bun exit0,1PASS/0FAIL, «Ran1test»,22ms, source inchangée. Ses trois autres corps ne peuvent que lever une erreur ; aucun n'a été exécuté. Elle ne contient aucun worker ou import produit. Le contrôleur s'est néanmoins clos exit2/acceptedfalse, car il exigeait3SKIP imprimés : **Bun ne rapporte pas les noms filtrés comme SKIP**. Ce défaut de comptage ne signifie pas échec du filtre.

Le parent corrige l'interprétation, pas les logs ou la sonde : quatre cas déclarés, seul le cas sûr exécuté, trois sentinelles non exécutées établies par les corps et le résultat. Les3exclusions sont une déduction de sélection, pas un compteur SKIP observé. Reçu et contrôleur133 restent intacts avec leur refus initial ; aucune seconde invocation. Cela satisfait le critère de sécurité initial d'exclure les3corps, sans waiver d'un test produit ni faux PASS.

Parent corrobore aussi la fermeture du fichier remplacement par AST TypeScript :41TS+10JSON, unique new Worker dans la fonction contendReplacement120, aucun hook/dynamic-import/require/eval ou import contendeur. Les deux callsites de cette fonction sont dans les trois corps filtrés ; la préparationRO131 et les noms sont cohérents. La preuve est bornée aux sources gelées et au Bun pinné.

## Gate B autorisé

Autoriser **une invocation Bun test** du seul fichier explicite ./test/s2-author/replacement.test.ts, filtre exact `^replacement (?!two genuinely overlapping |contender ).+$`, concurrence1 et15s/test inchangé. Plafond processus300s, zéro retry ; les limites de temps des assertions ne sont pas relevées. Attendre47cas exécutés,0FAIL/0SKIP/TODO ; les3thread sont séparément déclarés **non lancés sous HOLD125**, jamais ajoutés aux PASS.

Rouge/timeout/signal, nombre exécuté différent de47 ou défaut d'intégrité ferme le paquet sans reprise implicite. Source et filtre restent constants. Aucun second fichier de test, glob, preload, hook ou contendeur autorisé. Une commande complète bun test reste interdite tant qu'elle pourrait lancer les trois cas.

## Préconditions et ownership

Réutiliser typing130vert, revues129/126/123 et non-régression132sans les rejouer. Même sourceSet128 ; vérifier12pins+4baseline113/base309/extras/contrôles/dixinputs avant/après. Ajouter comme précondition le reçu133 original et la présente décision parent de sélection : Bun status0/1PASS/0FAIL/source stable, même filtre et même binaire, pas acceptedfalse ignoré silencieusement.

Namespace neuf evidence/s2-replacement-128-nonthread et environnement dédié homonyme. Réserver256DB/compagnons et128casesassets neufs avant exécution ; borne source ≤47OWN/47assets, sans adoption/relocalisation d'une ancienne base. Même contrat de leases parent/dev:inoBigInt/écritureexclusive/readbacks autorisés queA. Environnement isolé/no-env/configvide/outils pinnés ; aucun secret/options hérité.

Conserver tous artefacts même rouge, logs/reçu/inventaires/hashs, sans réouvertureSQL de diagnostic ni cleanup. Aucun thread créé par un chemin admis ; HOLD125 maintenu intégralement. Le plafond300s borne un run inédit, ne promet pas une durée observée. Aucun nouveau runner ou confinement.

## Acceptation et limites

Un résultat vert qualifierait uniquement les47cas réellement lancés, dont replan/S1concret/final et mutations LIVE selon leurs assertions. Le remplacement global reste partiel tant que la contention obligatoire manque. Les trois cas thread sont conservés en source et explicitement non exécutés ; deuxNEWdistincts restent inatteignables sous cap3, sans waiver.

S2/M2 restent ouvertes, commandes consolidées non lancées. Pas de commit/merge/push, infrastructure externe, live ou code reconstruit exécuté. Le besoin de sûreté du thread sera traité séparément avec arbitrage si nécessaire, pas dissimulé par ce lot.

## Annexe

Reçu133 SHAaa0a8c08414dc5624fe860702fa3c3924e3908a9f00a8ac985a271f900b98842 ; source sonde SHA8afad18bbbac5abbcd2516897e42125698dfa59f2ec739ce4e3b63fdd5bd37fd, logs vérifiés. Reçu132vert7f9053c7… ; sourceSet128exécuté6db22322… .
