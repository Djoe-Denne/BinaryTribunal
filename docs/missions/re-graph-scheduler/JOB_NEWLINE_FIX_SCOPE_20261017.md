# U1 — correctif parent mécanique, nouveau candidat seulement

Review indépendante finale UNCERTAIN, publique archivée :XML8124B/a32a8c64 et
details7850B/e2cf2789. Le sous-comptage CRLF est établi ;l'atteignabilité d'un
dépassement64MiB sous900s/cap8/4096identités n'est pas démontrée. Aucun overflow
OS ou BLOCK de confinement/ABI ne doit être inventé. Taskreviewcompleted puis
reviewer arrêté, aucun ancien auteur/reviewer à rouvrir implicitement.

## Décision technique du parent

Ne pas payer une preuve exhaustive du volume maximal pour conserver un compteur
manifestement inexact. Autoriser un nouveau candidat distinct avec UN remplacement
textuel unique dans JobRunner.cs, sans changement de politique, borne, format ou
comportement de lancement/arrêt. Le parent effectue lui-même ce petit edit
déterministe ;ce n'est pas une nouvelle implémentation déléguée.

Avant :`eventBytes = checked(eventBytes + Encoding.UTF8.GetByteCount(line) + 1);`

Après :`eventBytes = checked(eventBytes + Encoding.UTF8.GetByteCount(line) + Encoding.UTF8.GetByteCount(events.NewLine));`

Le writer reste UTF8 sans BOM, NewLine non réassigné :les logs gardent CRLF.
Les garde67108864/1000000 et les branches d'erreur restent inchangés. Une écriture
partielle/erreur du writer doit toujours rester télémétrieperdue/HOLD, pas succès.
L'argument de comptage et toute limite résiduelle seront examinés indépendamment,
pas présentés comme un test exécuté ou une qualification du framework/hôte.

## Scope d'écriture source, aucune exécution

Créer seulement .tmp/coordination-three-20261014/JOB_HELPER_NEWLINE_FIX_OUTPUT_20261017/ :
JobRunner.cs corrigé, Invoke-JobRunner.ps1 byte-exact100e329a,
HISTORICAL/DESIGN_AND_FIXTURES.md9ca22a88, HISTORICAL/MANIFEST.jsoneb0f6990,
FIX_NOTE.md et CANDIDATE_MANIFEST.json. Anciennes4sources7095/100e/9ca2/eb0f,
deuxpaquetsreview10+8/reçus/verdictUNCERTAIN intacts, jamais remplacés.
La nouvelle metadata indique que le design historique n'est pas un verdictV2.

Pin physique du candidat, diff strict UNremplacement et outputs6 seulement,
puis gel readonly. Pas Add-Type/csc/import/PowerShellchild/Win32JobAPI/fixture/
test/runtime/DB/cache/port/install/sourceprojet/Gitcode/IDA/FF8/native science.
Un nouveau reviewer indépendant fresh examinera le DELTA avec la couverture
statique antérieure explicitement bornée et les sources exactes, pas un rerun
de l'ancienne taskcompleted ni un nouveau scan complet non motivé.

Même ACCEPTABLEdelta laissera obligatoires compilation+qualificationinoffensive
et gatesrunconcret/outils/env/ownership/accès/exclusivité/FINALGO. Le contratB01/B02
ratifié prospectivement n'autorise toujours aucun full44, L9/L10/main/intégration.
