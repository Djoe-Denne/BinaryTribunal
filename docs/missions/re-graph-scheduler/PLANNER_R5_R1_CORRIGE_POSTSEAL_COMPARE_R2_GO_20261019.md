# R5-R1 CORRIGE : signal postseal indépendant et comparaison jusqu'aux EOF

V `result_mvfdk5of_008z_sx7175` CORRIGE, parent24pins1367155B/ancres réels
capture191–266/stream274–301 vérifiés. Aucun candidatR5 exécuté. Findings acceptés,
reviewtask clôturée/session arrêtée, R5R1sources et R4rouge conservés.

- Critique : aprèsfooter propre, postseal + échecmarkerappend peut laisser trace/
  footer propres et exitCode0 réinitialisé. Hookdéjàterminé/exitBun insuffisants.
- Contractuel : aprèspremierécart lesqueues sontlues/hashées maisnoncomparées.
  Ce n'estpasfausseégalité, mais viole RAWcompare jusqu'auxEOF.

Parentretient signalmicrotask native capturée au chargement, coalescée/uncaught
horscontrôle producteur lorspostseal, avantaction originaleUNEfois. MarkerWritten
seulement aprèswrite réussi ; footer scellé nonmodifié. ProbeBun SYNTHÉTIQUE :
markeréchoue, footerpropre, action1retour42, exitCode remis0 ; contrôleexit0,
signalexit1. Aucun candidat/gate/produit importé. Champ fixé sansprocess.exit/
abort ni handlerhostile avalant erreursglobales/queue remplacée, aucunepromesse
contrecompromission/OOM arbitraires. Candidatréel devra subirfaultinjectionavec
traces/footerpropres inchangés + exitCodereset aprèsV, pas preuveparhypothèse.

Comparateur : toutesfenêtres alignées comparées, seulpremieroffset protégé ;
compteurs bornés defenêtres/écarts/octetsalignés/nonappariés ajoutés, hash jusqu'aux
EOF maintenu. Aucun raccourci digest/normalisation.

GO R5-R2mêmewriter5nouveauxoutputs23pins479297B/
ac695659f28fd6aff474532fc28461ff1527b110b78c9dfe38a387aa805e2da1,
Solxhighnatifstage r5-r2-postseal-compare-fix revérifié. gate.cjs47304B reste
BYTEidentique, encoderDATA/lexer/Reader/limits/phase/hooks invariants. FreshdeltaV
et selfchecksruntimeexacts avant toutessai. PasS1/main/numeric/native/full44,
pas de commit/push/cleanup/configglobal, aucun blocker utilisateur.
