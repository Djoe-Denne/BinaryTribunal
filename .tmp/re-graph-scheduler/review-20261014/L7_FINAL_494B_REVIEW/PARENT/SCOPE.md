# L7 494b — review fresh indépendante après exception ciblée

Candidat95 290B/SHA494b8bf87fa7a5e4b3c66058869d12be765a066c8ca9882d8a6ad12d2006fcde,
nouveau test21 963B/SHA8d44e0f640d969399682d498babfe81e7ecf04332b16d42f6dd80c891a288991.
Auteur fresh Astra max task_mv9si4oj_003p_veyhvi livré/fermé, jamais accepté/intégré.
Nouveau reviewer fresh **Sol max**, indépendant **NON aveugle**, ni auteur ni review
terminée repris. Décisions parent et contre-exemples sont autorisés ; ré-dériver
les preuves, aucun verdict/test auteur ou ancien reviewer ne sert d'oracle.

Paquet courant L5accepté985, source494b et corpus100 contrôles ; OLD/simulator.ts
contient3ea comme référence textuelle seulement, pas un arbre de modules exécutable.
Raw98+manifest d'origine fournis, aucune extraction/native nouvelle. Ledger9MB absent.
Rapports/logs/gates auteur et anciennes reviews non transférés comme autorité.
Les limites des snippets/projections/fixturessynthétiques restent explicites.

## Dérivation ciblée et adversariale sur le module

1. **Besoin original non effaçable** : vrai normalizer→L5→projection à deux unités,
   producteur indépendant avance ; besoin absent/hash/champs altérés ne peut devenir
   satisfaction niveau-seul quand l'original existe. Aucun besoin substitué/relabel
   ou dispense inventée. Contrôle manuel sans besoin original reste légal. Index
   own-only et binding evidence/IDs/consumer/producteur/révision : mutations isolées
   d'ID ou namespace ne doivent pas contourner un besoin connu ; ne pas prétendre
   qu'un self-hash permet de prouver une extraction native authentique.
2. **Attentes par phase** : pause des admissions ≠ interruption des jobs/validation.
   READY paused pendant la vraie union ; dépendance reste dependency ; VALIDATING
   reste validation ; RESERVED/RUNNING ne paused que si une tâche DAG-ready est
   réellement admissible selon rolesParallel (séquentiel : pas de job actif).
   Response-lost sans admission, terminal/fenced, fin validation sans job : aucune
   attente nouvelle indue. Restauration seulement cause encore légale à la reprise.
   Horaires et sommes attendus par intervalles indépendants, pas recopie du code.
3. **Frontières et wake** : pauses à0, contiguës/overlap, événements simultanés dans
   les deux ordres, cause changeante, consommateurs prêts et libérations clé/quota/
   ressource/barrière durant pause. Pas micro-dispatch entre deux pauses contiguës,
   attente double, starvation, coût de scan par tick ou mutation dans observe.
   Métrique waitReason ne doit pas devenir autorité de holding/ticket/waitingKey.
4. **Lifecycle** : cancel/invalidate à0 avant start → raison nulle/0 ; à1 garde
   l'histoire fermée1, pas reset global des métriques. Callback producteur ne remet
   pas CANCELLED/STALE/fenced en BLOCKED/READY si le besoin est insuffisant. Garde
   ciblée ne supprime pas done/stop/releaseJob : occupation réelle encore active
   retenue jusqu'au vrai arrêt, tokens/jobs/retry/lateevents exacts. Vérifier aussi
   transitions légitimes PENDING/BLOCKED/RETRYABLE→READY et fin de validation.

Préserver/attaquer les jonctions antérieures pertinentes : G2multiclé repark K1→K2/
FIFO/cancel/capacité indisponible,3holders/stop partiel/oldcallbacks/nontransitivité,
ressourcesv2conservatrices≠packingfamilleL5/unknown/empty/account, localDAG/G1/CP/
attribution A/B/R. observe versionné détaché/gelé sans SimStore et snapshots antérieurs
immutables, closed+open horizon exact et replay/decisions futures inchangés.

Receipts cohérents vrais niveau>=/force (hash/rev/producteur/null/readback/effect),
**divergence voulue** L5true/SIMrefuse pour niveau2+fixture-only. Gap upstream OPEN,
pas allocation-régression ni publication réellement autorisée. Binding external et
unresolved strict ; vrai kindindirect_call sans relation indexée, provenance versionnée
non blanchie, pas rawID/call inventé. Petite probe nouveau mode allocation985 en
mémoire, sans prétendre Ndurable/proofs host/L8 fournis par SimStore.

## Validation bornée et livrable

Après Model.Ref/paquet/accès réel approuvés : typecheck puis **100tests attendus** :
test/simulator/simulator.test.ts,simulator-corrective.test.ts,
simulator-g2-review-regressions.test.ts,simulator-final-review-regressions.test.ts ;
test/benchmarks/benchmarks.test.ts,simulator-corrective.test.ts.
Petites probes mémoire propres et benchmarks existants10k/K16–64, pas full/100k
imposés. Coûts réels O(V) par frontière effective,O(I incidents) pour paused(),
scans runnable/ressources et G2 honnêtes ; pas near-linear universel.

Source/paquet hashés avant/après. Evidence uniquement dossier parent explicitement
fourni ; limiter la campagne à ce module/invariants, consolider dès findings certains.
Rendre ACCEPTABLE ou BLOCK scoped avec path:line, scénarios complets minimaux,
contraires/codes/comptes/pins/limites, erreurs de setup et leurs contrôles conservés.
Un test PASS n'est pas review, un old finding résolu n'exclut pas un bypass voisin.

Pas source/test/projet/Git/install/réseau/LLM/dispatch réel/Ensemble/IDA/live/SQLite/
DB privée/sous-agent/inbox/team_results/delete ; déps préinstallées module readonly.
Pas besoin de full : les gates parent finales suivront une review recevable.
Parent seul accepte/intègre ; L8indépendant n'a pas reçu le simulateur, son timeout
D/E→B et ses autres gates restent ouverts. Aucun nouveau correcteur/repli autorisé
implicitement si BLOCK, pas author/reviewer terminé réactivé. Native/SKIP/host/
L9/L10/régimeB/simulationCLI hors cette acceptation offline bornée.
