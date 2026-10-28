# Fresh review — extraction pure exacte, pas un nouveau planner

ACK_HOLD allpins/tailles+NONBLIND+microplan puis GOaudit parent avant final.
Objectif : source S1 a détecté un manque réel ; sa proposition partielle est
figée/nonacceptée. Binding source→sidecar doit comparer relations/sites/observations,
pas seuls digests. canonicalRelationView privé dans planner est le codec original.

Delta parent déterministe : déplacer six fonctions contiguës sans changement de
corps vers planner-relation-codecs.ts ; exports canonicalRelationKey existant,
isPlannerCall et canonicalRelationView ajoutés. Planner importe ses deuxhelpers et
réexporte canonicalRelationKey ; retrait RELATION_VIEW_VERSION import devenu inutile.
Pas copycore/deux implémentations, pas de recompute planner/SCC/IO dans le codec.
Imports runtime seulement graph-pure-codecs/validation ; import planner TYPEONLY,
cycle type effacé. Pas widening d'input/guards/erreurs/version/ordre/policy/defaults.

Ré-dériver identité avant/après, closure complète/helpers/types et dépendances
runtime, backward compat planner export et comportement/call sites. Examiner aussi
que le codec renvoie la vue complète avec metadata/sitesBySourceEdgeId, donc l'API
permet comparaison réelle source→relationView, sans prétendre QA S1 déjà établie.
Review étroite, pas audit de tout planner ou du draft S1. Aucun test/compiler/run/
validator/import produit/OS/DB/git/IDA/live/réseau/origins/écriture/teamtools.
Lecture/hash/parsing statique permis ; sources proposées pas intégrées main.

Final NATIF ACCEPTABLE_EXACT_RELATION_EXTRACTION | CORRIGE | BLOCK,3–6ancres,
rehash allpins final et limites. Parent seul intégration/typecheck/régressions,
puis repin S1 et GO continuation ; pas suppression du failclosed avant qualification.
