# Budget V3-Q1 — décision parent de concurrence, addendum source

Décision applicable au seul module pur task_mvc422gy_0001_tt123k. Les paquets et
contrats antérieurs restent gelés ; cet addendum tranche leur ambiguïté, sans
autoriser compilation, exécution, Job ou source privilégiée.

Un seul I/O actif par instance CaseBudgetV3. Admission sous section critique
courte, puis Stream.Write hors verrou. Aucun appelant n'attend la fin d'un I/O.
Une tentative d'écriture pendant l'I/O actif, même 0 octet, échoue immédiatement
avec stickyHOLD ReentrantOrConcurrentWrite : aucun débit/charge/I/O supplémentaire.
L'I/O déjà chargé peut finir ou échouer partiellement ; sa réservation demeure.
Le cas reste HOLD. Les getters ne gardent jamais de verrou pendant un appel Stream.

La concurrence ordinaire n'a donc aucune garantie de succès ni d'ordre. Le caller
doit séquencer ses écritures pour éviter ce rejet. La garantie du module est
l'exclusion, les bornes et le rejet fail-closed, pas une file d'attente équitable.
Les tests doivent coordonner un I/O retenu et une seconde tentative pour établir
ce rejet, sans supposer lequel des deux threads gagne une course non ordonnée.

Le module n'offre pas de garantie de retour pour un Stream.Write qui ne revient
jamais ; il garantit de ne pas créer lui-même une attente cyclique autour de cet
appel. Un Stream hostile ou des callbacks externes arbitrairement bloquants sont
hors contrat. Réentrance synchrone et callback cross-thread TryWrite sont rejetés
sans attendre le Stream actif. Aucun verrou ne traverse ce Stream.Write.

OpenSink ne doit pas appeler de membre Stream sous le verrou d'état. Ne pas
introduire de callback CanWrite/Dispose/Flush pour prétendre contrôler la capacité.
Tout appel d'extension externe, si indispensable, demande une règle équivalente
d'exclusion sans bloquer l'état ; le choix minimal est de n'en faire aucun.

Capacités, slot unique, somme262144, chunk4096, invalidrange/HOLDcasewide,
précharge atomique/noRefund et ownership du Stream inchangés. Tests source et
documentation doivent refléter cette décision. La review indépendante recevra
l'addendum et les attendus parent ; ce choix ne vaut pas validation du code.
