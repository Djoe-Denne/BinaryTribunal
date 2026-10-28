# Parent GO R4 source : caches neutralisés et marques natives indépendantes

R3 review result_mvf9phny_0086_bfwi3g CORRIGE confirmé aux ancres réelles.
R3gate n'a PAS été exécuté. Conserver source/gels/review et ancien rouge TSC.

Quatre NOUVEAUX outputs sibling gate.cjs/capture.ts/DESIGN.md/MANIFEST.json.
Partir de ownR3 fourni ; pas refaire architecture, sourcesproduits/main/S1/numeric/
tests scientifiques inchangés. Même269guards/4plannerTS/2tests/methods/FULLtraces.

1. Env cache : NODE_DISABLE_COMPILE_CACHE='1' ; NE PAS définir NODE_COMPILE_CACHE.
   BUN_RUNTIME_TRANSPILER_CACHE_PATH='0' ; ne pas accepter nouveaux fichiers caches.
   Parent probes stdlib seuls ont vérifié controls sur runtimes pinnés : Node
   enabled(controlflagABSENT)1cachefile vs disabledstatusDISABLED0 ; Bun sourceTS
   synthétique >200KB enabled1file vs disabled0, pas directoryliteral0. Node string
   '0' est AUSSI nonvide et désactive : première tentative contrôlepositif rouge
   retenue, corrigée séparément. Deux receipts et shim TSC sont fournis ; ajouter
   receipts exacts au binding externe requis/receipt ; pas flagCLI inventé.
2. Avant admission object/null-object, marques natives indépendantes du prototype.
   util.types réels isPromise/isMap/isSet/isNativeError/isProxy disponibles et
   reconnaissent PromiseprotoNull/MapprotoObject dans les probes parent fournis.
   Promise/Date/RegExp/ArrayBuffer/views/boxed/weakcontainers/autres marques natives
   interdites -> fatal ; Map/Set/NativeError autorisés UNIQUEMENT avec prototype
   exact cohérent. Prédicat requis absent -> fatal, jamais fallbackprototype.
   N'oublier pas tableau natif prototype remplacé. Aucun getter/proxy/hook à
   exécuter pour examiner une valeur. No instrumentation throw into producer.

   Pour fallback ordinaire, contre-probe native structuredClone peut être utilisée
   APRÈS validation complète de tous descriptors/graph (donc sans getters/proxies).
   Option ratifiée : collecter tous candidatsobject/null et cloner leur liste UNE
   fois après traversal ; chaque root clonée doit rester ordinaire (null devient
   Object possible), aucun natif retourné ni erreur clonage. Cela détecte aussi
   des natifs clonables non reconnus par util ; pas de clone parobjetquadratique.
   Garder alias/cycles/ownproperties fidèle dans encodage original, clone n'est
   qu'une contre-probe, jamais payloadcomparé ni normalisationmasquantdesdifférences.

   Ne pas prétendre prouver origine « objet littéral », provenance générale ou
   état privé/WeakMap externe d'arbitraires classes déguisées. Le contrat testé est
   le graphe DATA des producteurs fixes approuvés, pas l'équivalence opérationnelle
   universelle d'objets JS. Types natifs connus interdits ne doivent jamais être
   acceptés silencieusement par changementprototype. Toute ambiguïté au-delà de
   ce contrat explicitement borné -> parent AVANT nouvellearchitecture.

Deltas hors2correctifs : seulement labelsSTEM/approval/sourceGO R4 et références
receipts nécessaires pour once-only/pinbinding. Nouveau STEM s1-r5-planner-isolated-
r4-gate ; nouvelleadjudication planner-isolated-gate-r4-parent-adjudication.json,
schema planner-gate-r4-approval-v1/verdict ACCEPTABLE_PLANNER_GATE_R4_PENDING_PARENT_ONESHOT.
Pas réécriture des6autres contrôles déjàreviewés, pas fallback d'inventaire ni
capture. DESIGNliste exacte des marques/contre-probe/domaine et limitations.
Manifestbookends/4hashs/delta et contrôlescachepins obligatoires.

GO CODE direct aprèshashpacket, pas nouveauACKroutine. Ecritures OWN4outputs
seulement. Aucun compiler/typecheck/transpile/test/run/validator/productimport/
Bunexec/OSprobe/DB/git/IDA/live/network/originsnonlistées/delegation/teamtools/
taskclose. SourcePROPOSED, freshdeltaV et parentselfchecks brandspoofs/cache/
fatalfooter avant nouvelleoncegate ; aucun acquis produit/S1/native/full44.
