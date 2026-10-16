# L7 copie851 — portée standalone clarifiée, pas de waiver des publications

La review statique a lu le candidat entier1385lignes/4fichiers, redérivé33DTO et
85membres (40champs/45méthodes), sans exécution produit ni BLOCK certain signalé.
Elle a escaladé une ambiguïté avant le verdict :`SimStore.write` appelé directement
fige aussi les tableaux imbriqués du commit fourni, malgré une copie superficielle.

## Décision parent contre code et contrat

- `simulator.ts:648–652` fait effectivement freeze({...commit,...}) et partage les
  références imbriquées standalone. Ne pas prétendre que cette API est pure ou
  détache tous les objets qu'un appelant peut lui fournir.
- SimStore et les builders `buildContextEnvelope`/`buildAdmissionEnvelope:673–685`
  sont textuellement identiques à la source6d00 conservée ;le parent recompare les
  corps, et non seulement le verdict d'un worker. L'effet standalone est hérité.
- `commit:1157–1159` passe des tableaux nouvellement construits par filter/map au
  Store. Le chemin moteur ne repasse pas les arrays d'un caller scénario brut.
- Le plan ratifié (APPROVED_COPY_PLAN:9–55) impose qualification/capture/image
  conservée et non-mutation aux frontières plan/scénario/config/incidents/durées,
  export/shape/compare/capture/replay. Il ne crée pas une nouvelle garantie hostile-JS
  ou de détachement pour tous les points d'entrée bas niveau publics inchangés.

La qualification standalone proposée est donc confirmée **pour cette garantie de
détachement d'entrées**. La limite doit figurer dans la livraison finale. Ce n'est
ni une preuve que SimStore est généralement correct,ni une dispense de vérifier
révisions,duplicates,publication,readback,delta,retours,effets et usage réel du moteur.
Toute régression de ces contrats ou de freeze liée au correctif reste attaquable.
Pas de hardening opportuniste,sourcefix,extension silencieuse de domaine ou promesse
«aucune API publique ne gèle le caller». Aucune autorité native/scientifique acquise.

## Gate dynamique distincte donnée

Après readback natifSolMAX/Plan/taskouverte/politiques4/2/guardready/393pins etdeux
receipts exacts, TEMPfuturabsent etzérotest/probe/TSCconcurrent observé sanskill,
GO FINAL REVIEW_DYNAMIC17:57:47.744Z :UNE TSC≤120s →si0+postpinsUNE255/14paths≤180s
→si0≤12casmémoirePUBLICS/≤8unités/≤4invocations60s/0DBextra/0port.
Les tailles propres des benchmarks nommés ne deviennent pas une limite produit.

Le projet d'oracle18/20 du reviewer n'est pas endossé sans paramètres complets
(rolesParallel,workers,ressources,validation,mesure du travail) et calcul indépendant.
Rouge/setup/tool/pindrift→HOLDsansfix/rerun/probeextra ;refusPlan→STOPinline sansbypass.
Seuls les retours explicites de DBgraph NEUVES des14tests (≤12total) sont autorisés,
fermés/conservés/pinés, sansSQLdirect/delete/ancienneDB. TEMPcourtpréparéroot/opencode
etspawnROOT,guardabsent/envhéritésinchangés ;393sources/testsreadonly.
PréambuleNONBLIND reste déclaré,aucunctx_search/sharedindex/inboxboard. Fins avant
collecte puisverdictscopé etgatesparent ;aucune intégration/globalQA/native autorisée.
