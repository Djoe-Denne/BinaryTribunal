# Parent GO R5 source — cinq livrables, trois correctifs ratifiés

Plan result_mvfc0szs_008o_o7d4s7 accepté AVEC précisions ci-dessous. R4 reste
ROUGE/nonqualifié, toutes preuves et1.2GBtraces retenues, aucun retryautomatique.
Il s'agit du harnais planning uniquement, pas produit/S1/numeric/native/full44.

## Propriété des cinq outputs

gate.cjs, capture.ts, trace-stream.cjs, DESIGN.md, MANIFEST.json dans outputs
siblingnouveau. Module trace-stream.cjs Node/stdlib pur àl'import, aucun package/
globalconfig, importable parselfchecks sans exécuter gate. CaptureTS ne doit pas
importer ce .cjs sans declarations/types : pas de nouveau .d.ts ni strictassoupli.
Les limites copiées danscapture doiventêtre exactes/consignées, ou autre seam
typée sans sixièmefichier à escalader avant invention.

## A. Streaming et limites FERMEES

APIs approuvées : hashFile(path,limits), scanTrace(path,limits), readFooter(path,
limits), compareFilesExact(left,right,limits), validateCapture(summary,footer).
Les lecteurs renvoient pins/statistiques/totalité, jamais graphe ni texte intégral.
Zéro footer construit d'aprèsobservations. Remplacer TOUTES lectures massives :
filePin/inventory/rememberFile/checkScratch/parseTrace/fullbytecompare. Les JSON
de contrôle seulement peuventêtre matérialisés après contrôle de taille.

Bornes ratifiées :
- blocs<=1048576B ; trace<=1073741824B parbranche, pair<=2147483648B ;
- record<=268435456B ; <=200000lignes, <=100000appels ; profondeurJSON<=64 ;
- footer<=65536B ; JSONdecontrôle<=16777216B, vérifier pins réels avant essai ;
- étatvivant du lecteur explicite<=8MiB, PAS RSSNode/Bun/ni mémoireencodeur ;
  utiliser typedarrays compactes bornées pour100000états d'appels, pas Mapobjets
  parappel incompatible avec cette borne. UTF8/tokenizer ne retient pas de DATA
  stringgéante ni de ligne ; seuls petits champs structurels bornés sont décodés.
- budgetanalyse partagé600000ms, contrôlé monotoniquement et nonréinitialisé
  par fichier ; deadline/cap/ENOSPC => rouge, aucun résultat partiel accepté.

Valider UTF8strict, grammaireJSON ycompris échappements/surrogatesJSONautorisés,
framingLF, closedheaders/shape roots-nodes/atoms/tuples/bool/mapset, entiers/
méthodes/BEGINcontigus/terminalunique/refus/couverture/footerprivateexact.
Pas nouvelle preuve globale de refgraph ; sourcecapturepinnée et bytecompare
préservent aliases/cycles. Comparaison RAW jusqu'aux deux EOF, lectures courtes
correctes, jamais hashseul comme raccourci. SourceURL/metadata restent TOUTES
dans bytes, zéro substitution/filtre/normalisation/réécriture.

EncodeurR4parrecord conservé (aucun chantierwriterstreaming implicite). Contrôler
record/trace avant append sans tronquer ; réserver un petit espace fatalmarker
dans budgettrace pour éviter qu'un appel postseal n'apparaisse silencieux àcap.
Pas garantie RSSendtoend inventée. Budget nouveau disque
2*(S0+S1)+2GiB+64MiB, S0/S1tailles snapshotsinstrumentés exactes ; R4retenu enplus.
Pas cleanup/spillmassif/réemploi artefacts pour rentrer dansborne.

## B. Finalisation privée effective dans Bun test

finalizeCapture():boolean export enplus de traceCall, AUCUN argument de compteur/
footer externe. Etatprivé open/finalizing/finalized/failed, un writewx unique,
répétitions idempotentes sans réparation. Ajouter finalizedBy:'afterAll'|'exit'
aux5champsR4, schemaR5 ; vrai gate exigeafterAll, fallbackexit appellemême mécanisme.
Echecs marqués horsproducteur et erreur du HOOK, pas seulementprocess.exitCode.
Appelpostseal reste actionproductrice UNEfois/retourthrowidentique et fatalgate.

Dans COPYplanner.test.ts uniquement : même redirectiond'import R4, importsalias
réservés afterAll+finalizeCapture et un afterAll(()=>{if(!finalizeCapture())throw...}).
Aucun nouveau expect/test/corps/assertions scientifique ; retirercesadditions
restaure exactement originalpinné. Pas de nouveau compteur d'assertions positif.
Hooketwrapper résolvent UNEMEME capsule absolue.

Parent a vérifié les deux vraistests pinnés : aucun testasync/hook/detachedtimer
explicite trouvé ; seulplanner.test importeplanner directement. ParentprobeBun
à2fichiers etordresAB/BA confirme afterAlldeAaprès2calls privés, mêmeétat partagé
hook/wrapper, avecflagsenvpinnés. Ce sont preuvespréflight bornées, pas qualification
du candidat : nouveauxselfchecks DOIVENTtester vrai bun test, défautsfooter,
capsulewrongpath/postseal/exitcodereset/tamperedJSON/fragments/UTF8/limites.

## C. MÊME runtime pathname, aucune normalisation

Deux snapshots instrumentés immuables explicitement pinnés ; typecheckcandidat
séparé puis activeROOTunique. Baseline depuisfreshactive. Aprèsprocessretourné/
handlesfermés, vérifier, RENOMMERintégralement versarchive-baseline (aucuneperte),
vérifierabsenceactive et archive. Créerfreshactivecandidatdepuisbonsnapshot.
Mêmesabsargv/cwd/envHOME/config/temp/cache/traces/footer pourlesdeuxprocessus,
branche seulement dansreceiptparent. Aucunejunction/symlink/rechargementprocess/
cache/tempanciennecopie/réutilisationIO. ConserverruntimePath observé + phasehash
et cheminarchivé actuel distincts, sans changerunbyte de payload.

## D. Contrôles conservés et validation future

269guards,4plannerTS,2tests,methods etassertions,DATAencoder/prototypes/marques/
clonedomain,cache0,closedinventories,exactreviewhashbinding/leasepremutation/
structuredredclosure identiques hors3fixes/labelsR5/refstools nécessaires.
STEM/adjudication/schema/sourceGO R5nouveaux, jamaisrejouerR4. Inventaires approuvés
doivent englober5outputs et nouvelles références ; pas rebaseline silencieux.

DESIGN doitmontrer deltasexact/seams/bornes/preuvesphase/fatalprotocol/limites,
MANIFEST5hashs(autohashviarenvoinatif)/inputbookends/exports/imports. Selfchecks
moduleEXACTserontparent :13anciens+fragments/shortreads/UTF8/largefakeheaders/
limit+1/lastbyte ; offlineR4retrouvehashs/falseégalité/footerabsents SANSrerun ;
vraiBuntestfinalizer ; phaseactivepath/cache/renamerejection. FreshV source
avantselfchecks, puis adjudicationexacte et décisionSEPARÉE d'unique essai.

GO CODE direct aprèshashpacket, pas routineACK→GO. WRITEonlyOWN5outputs ; aucun
compiler/typecheck/transpile/test/run/validator/productimport/Bunexec/OSprobe/
DB/git/IDA/live/network/originsnonlistées/delegation/teamtools/taskclose. Tout
choixstructurant horscecontrat => parentAVANTinventer. Finalnatifs5hashs/bytes/
delta/pinsbookend/SOURCE_PROPOSED, pasqualification ni reprisedeLIVE/portabilité.
