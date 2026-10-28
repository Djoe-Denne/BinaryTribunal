# M2 — 119 : aligner les exemples avant le code du remplacement

## Livraison reçue et vérification

Inputs118hashsparentconformes : CONTRACT6408B/b24823af… ; DATA28419B/a7d62889… . Douze sources116 inchangées ; DATA sansimports/fonctions. Parent lit contrat/sourcejoins et exemples.

Un écart concret empêche encore de ratifier le nominal telquel : DATA30–41 décrit worker/account uniques et maxConcurrent1. Le cheminfixtureT2qualifié compose final-host.perCaseSource20–21→createResourceCompleteInput, qui émet worker-a/worker-b sur compte shared et maxConcurrent3 (sourcefixture22–30). Cette différence ne serait pas une simpledisponibilitéréduite si les exemples étaient appliqués aux helpers116.

## Décision et correction autorisée

Choisir la réutilisation de la fixtureT2complète existante, plutôt que reconstruire une autre racine/ressources pour ce test. Après conservation des deuxinputs118initiaux readonly, autoriser correction **de ces deuxfichiersseulement**. Pas de produit/codeexécuté.

Littéraux BEFORE/AFTER doivent correspondre aux settings/identités/dimensions de la source qualifiée : maxConcurrent3, workers worker-a(primary)/worker-b(alias), profileauthor, accountshared, chacun slots4/cpu8/gpu3/budget10, compte sharedslots4/budget10, autres settings inchangés. BEFORE : lesdeuxavailabletrue ; AFTER : **seul worker-a.available=false**, worker-bresteavailabletrue. RootTemplate acquis initial inchangé. Ce choix ne relève ni cap/concurrenceproduit ni budget : il corrige l'exemple vers le baseline existant, pas un changementaprèsbootstrap.

Conserver les autresjoins/invariants contractuels, pré/postimagescomplets et compteurs3/1/2 ; nouveauplanning doit être explicitement recomputé et rester qualifiableS1 sous les sources réellementcourantes. Les examples ne deviennent pas autoritéHOST : celle-ci doit encore acquérir indépendamment ces bytes/current avantdemande. Ne pas recopier une demandedans un record de source pour l'authentifier.

Les symboles/sourcepolicynames et cas doivent viser worker-a/shared si nécessaire ; ne pas modifier les primitives/resourcefixtures ou rootgrants pour accommoder une donnéeerronée. Si la réduction de disponibilité n'est pas admissible selon le binder réel, signaler une contradiction précise avant code, pas cast/refrefresh.

## Point du plafond et concurrence conservés

Règle3 inchangée ; bootstrap+OLD+NEW épuise la préparation. Le test demêmeNEW peut vérifier un seulswap sous contentionréelle, pasdeuxNEWdistincts. Cette dernièretrajectoire reste inatteignable/limiteexplicite, pas une preuve obtenueouwaiver. Pas de nouveausharnessimportant à ce stade.

## Incident117 : provenance reçue, sans relecture d'oracle

L'auteur fournit depuisle reçuantérieur : ContextModectx_execute_file(languagepython), wrapperproductsrc/graph-execution-envelope.ts ; racinecandidate/test et rglob("*.ts"), exclusion despaths avecs2-author ; recherchesexactes S1CandidateReplacement/CandidateReplacementV1, reçu0match/0extrait, nombrefichierslus noncompté. Aucune nouvelle relecturetest/oracle pour reconstituer selonsonretour. Consigner ce détail comme provenance déclarée, sans transformer la rechercheinterdite en preuve d'absence ni promettre absence de toutaccès. Pas d'exposition d'oracle retourné établie ; indépendance du reviewer inchangée.

## Permissions et suite

Deuxinputsuniquementaprèspréservation ; zéroproduit/test/importévalué/seal/bind/typing/SQL/DB/asset/provider/native/Git/délégation/oraclesQA. Sources116/143DB/44assets et gate115clos intacts. Parentinspecte ces exemples puis autorise deltaSOURCEborné, revue et futuregateOWN séparées ;000bownerlead/S2global/M2 restentouverts.
