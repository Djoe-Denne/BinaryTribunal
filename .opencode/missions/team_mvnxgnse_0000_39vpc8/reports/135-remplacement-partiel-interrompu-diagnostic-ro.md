# M2 — 135 : remplacement interrompu, diagnostiquer sans augmenter les délais

## Résultat observé et conséquence

Le lotB134 n'est **pas qualifié** : processus statusnull/SIGTERM à300130ms pour plafond300000ms, une invocation sans retry. Traces partielles :21lignesPASS et5FAIL, sans résumé final. Sur47cas sélectionnés,21n'ont donc aucun verdict final dans ces traces ; ils peuvent être non commencés ou interrompus, pas tous déclarés exécutés. Les3cas thread sont restés exclus/HOLD125, jamais PASS.

Quatre lignes de timeout de test15s sont présentes, dont le nominal swap15872ms, le replay16537ms, l'ancien/frais final110828ms et l'inventairehistorique59418ms. Deux traces distinctes signalent aussi `activation root counter unknown/corrupt` lors de reopenT2. Ces erreurs peuvent se chevaucher sur un cas : ne pas les additionner aux5FAIL comme de nouveaux tests.

Le plafond global a fermé le paquet ; aucun relèvement de timeout, réduction d'assertions/cas ou retry autorisé. Les131régressions du lotA et le typingvert restent des preuves distinctes sur source128, pas un PASS du remplacement.

## Processus et artefacts

Après retour, le parent a interrogé les processus Windows : aucun bun.exe dont la commande cible replacement.test.ts n'était encore actif à cette observation. C'est un contrôle ciblé, pas une garantie de terminaison native universelle. Aucun thread n'a été lancé par les chemins admis.

27DB/587788288octets et27casesassets/81entrées/27fichiers conservés,0unowned/0hashdrift/manifest inchangé après recontrôle. Aucun SQL de diagnostic ou cleanup. L'inventaire original porte processExitedfalse car statusnull/error à la collecte ; il reste intact, le contrôle de processus postérieur est consigné séparément plutôt que réécrire ce champ.

Le contrôleur a également écrasé son erreur primaire de spawn/timeout par NONTHREAD_SELECTION_OR_RESULT_MISMATCH quand les47PASS manquaient. Ce défaut de restitution ne change pas l'échec, mais masque le code primaire exact : statusnull/SIGTERM/durée/plafond restent observés, aucun errno de timeout non conservé ne doit être inventé. Un futur contrôleur devra conserver les erreurs primaires et secondaires séparément ; pas de modification du reçu134 rouge.

## Diagnostic source en lecture seule

Autoriser l'auteur à diagnostiquer **sans édition ou exécution** les logs134 et les chemins produit/helpers connus. Le parent recoupe : reopenT2 lit activationCounter dès le snapshotavantfermeture225–226 ; activationCounter98–103 exige une ligne durable nonrévoquée et digestvalide. Identifier le moment d'initialisation autorisé du compteur, si son absence au stadeNEW est un état légitime du fixture ou un raccordproduit manquant, et pourquoi le helper le lit trop tôt. Ne pas inventer compteur0 à partir d'une absence ni enregistrer un octroi juste pour faire passer le reopen.

Pour les durées, cartographier les appels synchrones répétitifs sur stage/swap/collecte/final/audit : multiplicité, éventuelle récursion ou sérialisation expansive des sources/frames/documents. Distinguer hypothèses des causes prouvées par les lignes de code. Pas de profiling/import/runtime ou lectureDB ; aucune nouvelle campagne. Proposer le plus petit delta compatible avec les mêmes validations LIVE avant/après append, sans cache traversant une frontière d'actualité, garde supprimée ou oracleaffaibli.

Retour compact : causes recoupées et incertitudes, fichiers/callers affectés, correction proposée avec invariants et tests ciblés futurs. Si une mesure instrumentée est indispensable pour trancher, nommer son besoin exact avant toute exécution ; elle n'est pas autorisée ici. Ne pas reclasser un timeout en PASS sous prétexte que le corps synchrone a pu continuer jusqu'au retour.

## Frontières inchangées

Sources128 gelées, inputs122 et tous artefacts conservés. RO seulement : lectures/hash/AST/refs, pas write/import/replan/seal/bind/typing/test/thread/SQL/DB/opener/asset/provider/native/Git/délégation/oracleQA. HOLD125 intégral ; aucune infrastructure externe nouvelle. Après diagnostic, parent décidera un correctif source borné puis revue et gate neuf selon impact, jamais reprise de134.

S2/M2/remplacement/S1concret global/contention non acceptés ; les3commandes consolidées restent non lancées. Quelques assertions de remplacement ont passé dans les traces, mais cela ne qualifie ni lescasinachevés ni le trajet final complet.

## Annexe preuves

Evidence s2-replacement-128-nonthread ; reçu SHA305631f0ea5092286b6e4f27fbfd5cbeb907ae191c95edf4f194bc0c306bc2f5, logs vérifiés. InventaireDBc3cabf6e… ; assets050860b2… . SourceSet6db22322… inchangé ; sourceFiles76d0983b… .
