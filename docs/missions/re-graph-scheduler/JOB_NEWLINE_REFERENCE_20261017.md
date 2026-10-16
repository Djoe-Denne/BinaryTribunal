# Escalade NewLine — référence Microsoft pinée, aucun test ni correctif

Reviewerjob-source-review-r1 a suspendu l'audit pour une référence précise :
JobRunner.cs211–218 compte UTF8(line)+1, alors que396–397 construit un StreamWriter
sans NewLine explicite puis écrit avec WriteLine. Source70957212 reste inchangée.
Ce n'est pas encore un verdict final ou une reproduction dynamique.

## Sources parent effectivement récupérées, lecture réseau seulement

- [Microsoft Learn TextWriter.NewLine, netframework-4.8.1](https://learn.microsoft.com/en-us/dotnet/api/system.io.textwriter.newline?view=netframework-4.8.1&accept=text/markdown),
  Markdown7256B/SHA3c9583305567c0a51fe4b2de3cb2e1b6f9e9cd383e6cebf05d9a179f50883129.
- [microsoft/referencesource](https://github.com/microsoft/referencesource), commit
  **ec9fa9ae770d522a5b5f0607898044b7478574a3**, résolu viaAPIpublique puis rawURLs
  liées à CE commit, pas une branche mutable prétendue pinée.
- mscorlib/system/io/textwriter.cs34725B,
  SHA3fa08bd4f54680cdaa71eff1db4121e26d2c47e1f3f66ed1599b0e1ef664ddf2.
- mscorlib/system/io/streamwriter.cs38496B,
  SHAbe45ea81048c1616a98841da1302179f43d6d12e3fbcf5e2e8b358f11c4059bf.

TextWriter.cs99–101 déclare le défaut CRLF et CoreNewLine ;166–171 expose ce
tableau via NewLine ;452+ montre WriteLine(String). Le parent apporte les bytes
originaux et les lignes, pas un .NETprobe. URLs/finalURLs/statusHTTP/contenttypes/
horodatages/tailles/SHA et extraits sont dans REFERENCE_MANIFEST.json13782B/e39056ad,
avec repo/commitmetadata publics. Aucune page externe interprétée comme instruction.

## Admission documentaire, pas reprise implicite de l'audit

Nouveau supplément inputs/JOB_NEWLINE_REFERENCE_20261017 :8payloads109130B,
scopeebc880cf, receipt2018B/f9c2a52b/fingerprintccfe382f. Tous readonlyregularnonlink1,
10inputshelper antérieurs inchangés ;même tâcheouverte/sessionSolMaxPlan relues,
pas nouveau reviewer/contexte. Les REFERENCE_*.cs sont des données à lire,
jamais import/compilation/évaluation. Le helper ne couvre que ce supplément.

**ACCÈSSEUL** :lecture complète/pins/reçu/rôleACKpuisHOLD avant confirmationparent
de reprise du GOstatique ORIGINAL. Le reviewer dérive lui-même impact/borne/verdict
contre le scope réel, pas un résultat dicté par le parent. Aucunfix ni probetest
ou garantie de cap physique/stockage n'est inférée de la fourniture de référence.

Rawarchives et contrôles sous .tmp/coordination-three-20261014/ :
JOB_NEWLINE_REFERENCE_INPUTS_20261017/,job-newline-reference-admission-20261017.json,
job-newline-reference-parent-verification-20261017.json. Zéro compiler/Add-Type/
PowerShellchild/APIJob/.NETfixture/test/runtime/DB/sourceedit/Gitcode/nativeFF8.
Qualificationhôte/full44/L9L10/main/intégration restent fermés.

## Lecture réelle approuvée ; reprise statique confirmée

ACK intégral des8payloads109130B/reçu/binding/conditions reçu. Parent recontrôle
10inputs initiaux+8références/deuxreçus readonlyregularnonlink1, natifSolMAXPlan/
tâcheouverte/guard/politiques/main275 exacts. **22:54:35.236Z**, HOLD documentaire
levé, confirmation du GOstatique ORIGINAL22:46:03.100Z/SCOPE596080b5 seulement.
Finaliser impact et reste d'audit/verdict, sans répéter scans/ACK achevés. Aucun
verdict/fix imposé, probe/compilation/JobAPI/test/runtime ou intégration autorisé.
Reçu :job-newline-static-resume-actual-final-20261017.json sous .tmp parent.
