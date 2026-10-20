# Gate parent V3 — compilation seulement

Autorité : reprise continue utilisateur + ORDRE T1/T2, source matrix acceptée
source-scoped après V fresh et adjudication parent. Ancien GO source n'autorisait
pas un build : la présente gate distincte le permet maintenant après ses checks.

Parent seul. Closure9sources :8dépendances exactes déjà pinnées plus RunnerMatrix
ee6a830ce4e6e03fcdc7c3d743835bc87b1e96b9ce86cf05a635604fc2e16a7c.
Exclure RunnerReal et Tests. Namespace/assembly internal commun ; Framework64
csc.exe,C#5,x64,winexe,entrypointReGraph.GuardV3.RunnerMatrix explicite. Refs
mscorlib/System/System.Core explicites,nostdlib ;hashes compilateur/refs vérifiés
contre le build antérieur qualifié. Aucune installation/téléchargement.

Sortie dans un scratch Temp/opencode frais, jamais écrasement du précédent.
Une invocation du compilateur,timeout120s autorisé uniquement sur SON processus
enfant possédé ; aucune action sur d'autres processus. Diagnostics conservés,
fichierEXE/PE vérifié et hashé, sources/refs rehash avant/après. Pas de load/run
du produit par cette gate. Tout défaut source suit correction+review, pas de
patch binaire ni d'effacement d'échec ; panne commande corrigible localement.

La gate d'exécution sera encore distincte et parent-sérialisée : aucun EXE
exécuté par ce script. Pas FF8/run01/live/G5/G6/G7, IDA ou mutation centrale.
Pas de promotion/source ou résultat runtime à partir d'une compilation verte.
