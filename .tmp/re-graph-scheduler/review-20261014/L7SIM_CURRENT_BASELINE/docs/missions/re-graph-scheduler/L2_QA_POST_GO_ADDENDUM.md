# L2 — qualification finale post-GO : addendum borné

2026-10-14, même QA task `task_mv80a96u_003t_7t7cbp`, session Sol Max
`ses_ec5e6c9f0ffexTRNcZ4CoD8MH0`. Vrai rendu final après GO, ancien travail
conservé, board déjà completed ; pas une seconde campagne. NQA01–07 confirmés,
gel L2 manifest b881a7f0… et32/32 fichiers inchangés. Verdict reste BLOQUANT.

## Compléments réellement nouveaux

- **NQA02** précisé : root/artifact/node/edge schemaVersion2, chaque mutation
  rehashée, produit1fact via rawAPI ; cached ordinaire refuse les4cas.
- **NQA08 P2 conditionnel**, capabilities.ts:255–257,272–277 : preseed explicite
  cache.set(validkey,fact.schemaVersion99), puis hit renvoie ce fact invalide.
  Preseed key à config depth2/maxPropagationTotal−1 : cached accepte, raw et
  cached avec cachevide refusent. **Pas démontré sur chemin générateur ordinaire**.
  evaluateCapaAvailability:294–296 accepte backendBOGUS/7 et renvoie available
  hors type file|ida ; métadonnées locales seulement, pas disponibilité native.
- Chronologie : revision1/appear2 produitfact ; retire-before-appear3→2 et
  future-retire2 admis transport/helper. Décision parent déjà prise dans le
  contrat de correction : révisions sûres/canoniques, chronologie snapshot.
- Gap **target↔import** : import_unresolved avec referencedObject kindimport,
  targettable/register/unknown, objet renommé DDRAW.dll!DirectDrawCreate,
  produitfactfunctionobserved. CONTRAT:192–207 ne définit pas une bijection
  target/import. La cohérence de cette association reste à qualifier, pas un
  défaut normatif déclaré par simple analogie.

## Décisions parent transmises au correcteur ACTIF

Même owner/task/session, aucun nouveau worker, reset ou replay de QA.
Dans capabilities.ts déjà possédé : guard config **avant** cachelookup, revalidation
des facts exposés contre snapshot/invariants/provenance (pas seulement shape),
preseed invalide rejeté au set ou au hit fail-closed. Préserver caches ordinaires,
clones, invalidation et stats ; régressions conditionnelles distinguées des chemins
normaux. Capa metadata backend file|ida et primitives runtime vérifiées avec erreur
fail-closed existante ; aucune installation/analyse automatique/API nouvelle.

Pour target/import, ne pas inventer ban transport ni promotion observée en appel.
Qualifier seeds réels et portée exacte de observed (référence citée ≠ capacité
exécutée). Tout changement de sémantique doit être proposé au parent avantwrite.
L'addendum a été envoyé à l2-fix-max-final pendant sa correction autorisée.

## Limites et provenance

Positifs caches ordinaires confirmés par QA : clones/invalidation, chacune des
mutations revision/extractorID/extractorHash/normalizerID/config ajoute1miss,
receipt size6/hits1/misses6. Coverage5cas étudiés, PARTIAL historique admissible
au transport uniquement, pas SCC/planning. SHA des cinq sources et98raw inchangés.
Le manifeste de transfert était absent du **répertoire main examiné par QA** ;
le parent a depuis trouvé le manifeste ORIGINAL dans l2-graph-r3 et transféré
98raw+manifeste exact aux correcteurs (pas génération d'une nouvelle autorité).
Aucun nouveau test/extraction/native/IDA/install/Git/config/promotion de la QA.
