# Préparation parent compile C# — conditionnée au dernier delta documentaire

Inspection seulement, aucun compiler ni testC# lancé. V3receipt historique
v3-compile-receipt.json :9sources gelées, csc.exeFramework64v4.0.30319 et3refs
mscorlib/System/System.Core. Parent rehash9+4pins exacts. Une précédente invocation
avait /langversion:5, PAS une preuve de compatibilitéC#4 ; aucune mentionlexicale
async/await détectée, ce qui n'est pas une preuve syntaxique nonplus.

Après reviewinventairefreshacceptable et adjudicationparent seulement : compiler
les9sources inchangées +GenericTargetPlan.csR3 +GenericTargetPlanTests.csR3
dans un unique assembly possédé, refs exactes, /noconfig /nostdlib+ /platform:x64
/langversion:4 /target:exe /main:ReGraph.GuardV3.GenericTargetPlanTests,
/codepage:65001 /debug- /optimize-. Strict4 est volontaire pour le contratdata,
pas réutilisation silencieuse du flag5. Toute erreur donne nouveau rouge,
pas modificationV3/augmentationdialecte/fallback implicites.

Snapshot neuf sousTemp/opencode avec sources+outils/refs pinés avant/après,
logs et executable hashés si compilationverte ; timeout/buffer bornés, env
profiling/startup hooks nonhérité, aucun shell/PATH search pour csc. Cette gate
ne lance PAS l'exécutable compilé ni les entrypointsV3 historiques.
Run puredata séparé seulement après compileverte, préflight sûr des types utilisés,
entryQA explicite, logsConsole<=1024B et compteurruntime réel. Pas Job/targetT/
FF8/DB/nativecampaign ni qualification full44/broker/125s/OSauthority acquise.
