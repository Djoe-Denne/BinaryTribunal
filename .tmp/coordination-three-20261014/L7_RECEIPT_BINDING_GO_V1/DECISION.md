# L7 — redélivraison complète receipts/binding, full toujours sérialisé

Même tâche `task_mv9m9894_0015_cjacy0`, même session Astra max
`ses_ec0192753ffeWKOqq53yPbjVoL`, aucun restart ou nouvelle mission.
Le worker confirme avoir reçu le HOLD full mais pas les deux arbitrages détaillés.
Pas de reprise déduite d'un ancien envoi/texte de résumé. Paquet séparé piné,
lecture réelle/ACK puis GO final ciblé avant toute application.

## 1. Receipt contradictoire — décision complète opposable

Lire aussi RECEIPT_POLICY.md intégralement. **Refuser fail-closed publicationLevel2
+validation fixture-only AVANT satisfaction SIM**, diagnostic explicite. Garder
les autres vérifications de receipt, ne pas rétrograder/relabel ou inventer un
commit/publication. CONTRAT§4 niveau2 exige validation parent réelle ; le booléen
receiptSatisfies n'atteste pas cette autorité.

Parent reproduit le true dans OLD377 et candidat budget985, plan external_satisfied
sans diagnostic, ac82 accepte aussi. C'est une incohérence upstream **préexistante
OPEN**, pas un défaut créé par le budget. L5/L6 ne sont pas à modifier ici.

Différentiel L5 sur les receipts **sémantiquement cohérents** seulement ; ajouter
le négatif L5=true/SIM=refus explicite et les positifs légaux validation/niveau>=
plus forts. Ne jamais revendiquer équivalence pour tout valid-typed. Le guard SIM
ne résout pas la prévalidation host L8/proofs/disposition L9/L10.

## 2. Requirement binding — proposition minimale ratifiée

Parent relit l'ancien test simulator.test.ts:167–171 et vérifie ses bytes intacts.
Il clone une projection valide puis altère le hash de l'obligation du consommateur :
runScenario doit rester exécutable, **producteur seul commité**, consommateur jamais
satisfait. Ce test fail-closed local est conservé, pas une preuve de cohérence
globale/authenticité de tout champ d'une projection mutée.

**Ratifié : binding strict requirementById pour external_satisfied et la branche
exported-unresolved-prerequisite**, périmètre des deux findings. Garder la copie
complète liée au vrai export et ses hashes, pas d'édition de l'export source.
La branche unresolved exige toujours absence de requirement/receipt et provenance
originale exacte ; retirer une citation d'une vraie relation demeure refusé.

Pour une obligation locale ordinaire, ne pas transformer le mismatch de requirement
en exception globale à l'entrée. Conserver l'ancien chemin receiptMatches qui
compare l'artefact réellement produit au besoin déclaré et bloque la satisfaction
du consommateur. Ne pas corriger/relabel le besoin altéré, utiliser silencieusement
la source pour satisfaire à sa place, inventer un receipt ou débloquer d'autres unités.
Producteur indépendant et autres branches légalement prêtes restent opérables.

Nouveau test négatif propre possible : source/export non altérés, mismatch besoin
consommateur ⇒ consommateur bloqué, aucun faux commit, producteur indépendant avance.
Ajouter aussi les mutations qui DOIVENT refuser en entrée dans les branches external/
unresolved. Pas nouvelle politique globale BLOCKED/diagnostics, élargissement L5/L6,
preuve d'intégrité universelle ou changement des54 assertions historiques.
Si cette solution minimale ne tient pas les invariants déjà ratifiés, STOP/escalade.

## 3. Gates et sérialisation

État exact actuel : premier focused67PASS/2FAIL conservé ; nouveaux17PASS/1225
assertions. **Aucun full L7 lancé et aucune livraison finale**, pas71PASS inféré.
Corriger seulement dans les trois paths ratifiés, puis typecheck et54anciens+
17nouveaux (ou comptes effectivement livrés), avec nouveaux logs/codes/pins.
Pas besoin de répéter les probes qui ne dépendent pas du delta sans motif.

**HOLD FULL demeure**, parent possède actuellement le full main L5. La lecture de
ce paquet n'autorise pas le lancement du full simulateur ; il attend un message
parent distinct de libération. Pas de second full concurrent ni kill d'un processus.

Après libération : borne420s, TEMP/TMP enfant frais/opencode, LOCALAPPDATA inchangé.
Les seuls hooks cleanup existants permis sont sur retours mkdtemp frais de CE run
ff8-re-policy-/ff8-runtime-test- sous Temp/opencode ; jamais glob/delete manuel.
Troisième namespace graph-interop-* de CE run explicitement permis, mais son
lifecycle ferme/hache/**conserve** own.sqlite/sidecars, pas suppression. Paths/
tailles/SHA des artefacts conservés dans le handoff, autre escape STOP.

Pas source QA/helpers/54tests/L5/L6/L8/store/config changés. Pas Git/install/réseau/
LLM/dispatch/IDA/live/DB privée/inbox/sous-agent/reset/suppression manuelle.
Gel final puis nouvelle review indépendante/gates parent avant intégration ;
aucune autorité scientifique/native ou clôture L8 déduite du succès offline.
