# Parent GO R5-R2 source : postseal durable-runtime signal + comparaison entière

V result_mvfdk5of_008z_sx7175 CORRIGE confirmé parent capture191–266/stream281–299.
R5R1source jamais évaluée/exécutée ; R4red inchangé. Cinq outputs nouveaux sibling,
mêmes noms. gate.cjs DOIT rester BYTE-identiqueR5R1 ; encoderDATA8420B et lexer/
Reader/limits/phase/hooks/binding/othercontrols inchangés horsfixesci-dessous.

## 1. Signal postseal indépendant de FS/footer/exitCode

Mécanisme adjudiqué : référence native queueMicrotask capturée au chargement du
module ; lors d'un postseal programmer UNE microtâche qui lève une Error dédiée
hors pile productrice/hook déjàretourné. Aucun catch de cette Error dans sa
microtâche. Préserver action productrice UNEfois et retour/throw original,
programmer avant action pour couvrir aussi son throw. Ne pas réécrire un footer
scellé, ne pas reconstruire compteurs. Signalement privé/coalescé (unflag), aucune
API/argument externe de réparation ou de faultport.

Parent probe Bun pinné a vérifié le mécanisme dans fixture synthétique : marker
append échoue, footer propre subsiste, action1retour42, exitCode remis0 ; sans
signal exit0, avec microtâche uncaught exit1. Receipt fournie. Ce n'est PAS une
qualification candidate ; selfcheckcandidat doit injecter échecappendSANSmodifier
bytes trace/footer déjàpropres (mockfs isolé enfant permis ensuite auparent),
resetexitCode et observer échecBun, pas simple absence de trace.

Champopérationnel : corpus tests fixé/pinné, pas process.exit/abort explicite,
pas handler hostile avalant erreurhost ni remplacement hostile de queue native.
Pas garantie contre arrêtforcé/OOM/compromissionruntime arbitraire inventée.
Si référence/programmation native nepeutêtre garantie dans ce champ, escalader
AVANTinventer ; pas fallback silencieux exitCodeoumarqueur seulement.

Le marqueur reste protection additionnelle. markerWritten ne devient vrai
qu'APRÈS append réussi (ou état distinct écrit vs tenté) ; aucun succès de signal
durable déclaré après échec. Réserve4096/caps/footer idempotence inchangées.

## 2. RAWcompare jusqu'aux deux EOF sans saut après écart

Dans compareFilesExact comparer CHAQUE fenêtre alignée, même après premier écart ;
protéger SEULEMENT enregistrement firstDifference. Continuer lectures/hashes deux
fichiers/shortreads/EOF dissymétriques, pas digestshortcut. Ajouter compteurs
bornés windowsCompared/unequalWindows/comparedAlignedBytes/trailingUnpairedBytes
aux observations sans changer champs/APIexistants. fullComparison true seulement
si aucun segment aligné n'a été sauté ; lesoctets nonappariés sont lus/hashés et
comptés, pas comparés à un fauxbuffer. Selfcheckearlydiff+laterdiff doitexposer
au moins2fenêtresdifférentes et exactpremieroffset, limitesmémoire inchangées.

## Delta/propriété/preuves

Cinq NOUVEAUX ../outputs gate.cjs/capture.ts/trace-stream.cjs/DESIGN/MANIFEST,
R5R1frozen/résultats V conservés. Gate47304B/c2dc8fd6 EXACT, streamingReader/
Parser/apis4autres/existinggrammar/payload/normalisationZERO inchangés. Capture
seulement contrôlepostseal/fatalmarker/bindingMicrotask privés ; pas tests/source
scientifiques/main/config modifiés. DESIGN/MANIFESTR2 provenance/delta/bookends.

GO CODEdirectaprèshashpacket, pas extraACKroutine. Staticread/hash/parsing+
OWN5outputs ONLY ; NOcompiler/typecheck/transpile/test/run/validator/productimport/
requireCANDIDATE/Bunexec/OSprobe/DB/git/IDA/live/network/originsnonpacket/delegation/
teamtools/taskclose. Newgapstructurant→parentavantinventer. Final5hashs/bytes/
delta/bookendSOURCE_PROPOSED. FreshdeltaV puis parentcandidatefaultselfchecks/
offlineR4 et décisiononcegate séparée, aucunequalification source/R5globale.
