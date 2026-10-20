# Qualification future et slices minimales — `generic-t-qualification-1`

**Matrice d'attendus, aucune exécution ni PASS nouveau.** Même paquet/tâche que les
deux contrats voisins. Aucun code source, import produit, compile, validateur,
test, API Job, processus OS, IDA/live, réseau, DB ou git exécuté par cette mission.
Seuls lectures des copies gelées, hashes et parsing de données ont été utilisés.

## 1. Acquis réutilisés, inconnus à falsifier

Acquis bornés : V3 source revue, compilation, mémoire pure, première issue naturelle
et cinq variantes dont captures réelles conservées. Ils ne sont pas full44,
budget intégré, stderr T, extinction G midRun ni last-close [Q1]. L'ancien helper
et la fixture sont déjà revus/compilés; **pas de nouvelle tâche identique**, aucun
appel Job sur leur seul reçu compile [Q2]. Les gels restent byte-exacts.

À établir pour le sibling : vrai target binding, progression simultanée des deux
pipes, permits avant Read/write, broker unique tous huit slots, EOF séparés,
captures complètes ou HOLD honnête, protection du stop, publication byte-exact,
ledger de tous writers y compris wrapper/collector, bornes DB/caches propres,
durées opposables et release CDB-1. L'absence de preuve reste UNKNOWN/NOT_PROVEN.

## 2. Oracles indépendants et cas futurs nommés

Une fixture inoffensive nouvelle/extension déclarée émet des séquences brutes
déterministes par flux (seed, index, longueur, bytes invalidUTF8/NUL), avec
spécification data calculable indépendamment du runner. Sa source, son image,
modes et writers sont pinés avant le GO run. Aucun scénario ne charge FF8/DB
produit, ne contacte un provider/réseau ni ne découvre des processus étrangers.
Une sortie0 du runner n'est qu'une correspondance des faits attendus [Q1].

- **C01 stdout seul / C02 stderr seul** : bytes par flux exactement égaux à
  l'oracle, autre flux réellement EOF avec zéro payload; stdout/stderr wrapper
  inventoriés séparément. C02 doit échouer si stderr T est remplacé par parentstderr.
- **C03 alternance / C04 simultané soutenu** : volumes dépassant le buffer pipe
  demandé mais tenant dans les permits evidence. Barrières/sequence de fixture,
  pas Sleep comme preuve. Comparaison byte-exact par flux, aucune présomption
  d'ordre causal inter-flux. Montrer Read stderr pendant Read stdout pending et
  réciproquement; deux fichiers finaux sans cette progression ne prouvent pas le
  risque de deadlock éliminé. Buffers kernel effectifs non présumés égaux à4096.
- **C05 raw binaire / découpage** : valeurs0..255, UTF8 invalide, fragments1B,
 4080B, et dernière lecture courte. Décoder l'enveloppe16B depuis son layout
  indépendant; reconstruire par flux sans modification, duplication ou seconde
  copie persistée hors ledger. Examiner A_s et C_s, noRefund des courts Reads.
- **C06 limite-1 / limite / limite+1** : tests distincts pour capture114688,
  chaque sous-cap et total262144. Les longueurs ciblent les **débits** (headers,
  EOF/errors/permits brûlés inclus), pas seulement le payload/fichier. À la limite,
  succès permis seulement si EOF vraiment établi; sinon HOLD. +1 doit refuser
  avant Read/write incriminé; pas de probe hors quota ni cap par flux. Un total
  est à sa limite seulement avec la répartition compatible de ses huit slots.
- **C07 capture concurrente + writer autre slot** : producteurs control/marker/
  driver/G/S et deux flux, interleavings contrôlés. Aucun appel concurrent de
  Stream.Write; A/C monotones; premier HOLD inchangé. Un sink réentrant qui tente
  un nouveau write est refusé sans deadlock; le budget gelé conserve sa politique
  de refus, il n'est pas devenu concurrent. Oracle trace bornée prépayée, pas log
  arbitraire utilisé comme preuve de lui-même [Q3].
- **C08 stall / EOF unilatéral / erreur / invalidRead / sink partiel** : Read
  bloqué d'un côté, autre côté actif; Read zéro sans EOF; EOF puis données
  illégales; exception à code borné; count négatif/>permit; commit partiel puis
  exception. Attendus : HOLD sticky, pas refund/retry, suffixe UNKNOWN, pas ACK
  positif. Si sink/Read ne revient pas, le contrôle G doit encore demander stop
  dans sa deadline; persistance/join peut rester non établie, nonrelease [Q4].
- **C09 root nonzero / C10 child persistant** : witness depuis handle original,
  exitcode conservé; root terminé n'est pas Job0. Le child reste dans le Job exact;
  après stop owned, G vivant observe la paire réelle; aucune collection CDB-1
  normale sur nonzero/forced. Marker, PID ou fin du wrapper ne remplacent aucun
  witness. Ne pas introduire breakaway/nested/last-close comme raccourci [Q4].
- **C11 ACK mismatch / readback court / receiver perdu** : publication192 depuis
  destination réelle, receipt lu et comparé par oracle indépendant. Muter un
  octet y compris191, puis rejeter sans nouveau try positif. Quiescence peut être
  établie alors qu'ACK/release restent refusés. Pumps/producteurs ordinaires
  terminaux, broker idle exclusif FINALIZING avant readback, pas broker fermé.
  Oracle d'ordre GRwrite → vrai readback → Receiptwrite via même broker → ACK G
  → derniers records terminaux déclarés/pré-réservés → CLOSED; tout write/permit
  après CLOSED est refusé, sans réanimation/second writer. ACK positif sans vrai
  receipt/finalisation complète ne qualifie pas le cas; pas de succès fondé sur
  le buffer original [Q5].
- **C12 pertes D/S/G** : réutiliser la frontière connue sans rerun routinier des
  cinq anciens cas. Seulement nouveaux interleavings nécessaires avec capture
  active : D-loss et S-loss signallés, G-thread loss postRun/préACK, tels quels.
  Une perte G midRun ou processus G distinct est une nouvelle hypothèse à
  autoriser/qualifier, pas un acquis. Last-close reste NOT_ESTABLISHED [Q1].
- **C13 temps / C14 admission/retention** : épuiser setup/normal/cleanup/total,
  compteur avant tentative, absence de reset via wait/EOF/ACK; plan/profile drift,
  image/env/argv/pin drift, double run, owner/slot/token/epoch faux. Tous refusent
  sans fausse release. Après issue normale autorisée seulement, collection des
  paths effectivement émis; crash, inventaire incomplet, path ambigu, receipt
  manquant =>HOLD. Aucun scan d'orphelins/nettoyage partagé [Q6].

Les vérifications de seuils, encodage argv/env, tokens et concurrence déterministe
peuvent être spécifiées en QA pure; elles ne remplacent pas C03/C04/C08/C09 réels
avec oracle Job/handles indépendant ni le protocole collector cross-process.
Ces exécutions futures restent aux gates parent, **aucune autorisation présente**.

## 3. Slices et fichiers exacts proposés pour la suite

Chemins **futurs sous un nouveau sibling possédé**, à nommer/fixer par le parent;
ces fichiers n'existent pas dans cette livraison et aucun central n'est attribué.
Ne pas créer une autre tour de contrats pour les parties V3 déjà acceptées.

1. **Binding/ABI data + QA pure** — auteur : `GenericTargetPlan.cs`; QA indépendante :
   `GenericTargetPlanTests.cs`. Signatures du contrat voisin, encodeur argv/env,
   compteurs/pins/epochs, refus data-only; aucune capacité depuis JSON. Parent
   fixe closure sources/refs et oracles avant auteur, review V fresh avant compile.
2. **Broker/ledger et drain dual** — auteur : `GenericEvidenceBroker.cs` (ledger
   huit slots, permits, framing, queues), `DualCaptureCoordinator.cs` (deux lecteurs
   ICaptureSource, signaux/bornes). QA indépendante : `GenericEvidenceBrokerTests.cs`,
   `DualCaptureCoordinatorTests.cs`. Priorité C05-C08, deux grilles A/C, erreurs et
   reentrance. Réutiliser BudgetedEvidence et réservations gelés; aucun accès privé
   ni changement de leur politique. L'ancien WriterLedger ne couvre pas à lui seul
   les writes des huit catégories [Q3].
3. **Wiring hôte/generic entry** — auteur : `GenericHostLauncher.cs` et
   `RunnerGeneric.cs`, adaptateur pipe minimum déclaré `GenericCaptureIo.cs`.
   Réutiliser RealNative/KernelObserver/core/types accepted; ne pas importer
   RunnerMatrix.Main, son argv fixe ou sa pompe tardive. QA :
   `GenericHostLauncherTests.cs`; V fresh composé contre contracts + oracle natif.
   Inventaire explicite fermeture read/write ends; pas un nouveau helper Job [Q2,Q5].
4. **Qualification fixture/oracles + gate** — auteur fixture indépendant :
   `GenericCaptureFixture.cs`, attendu data `generic-capture-cases.json`;
   QA/decoder indépendant : `GenericCaptureOracle.cs` et
   `GenericCaptureQualificationTests.cs`. Source-only d'abord, puis V fresh.
   Parent seul compile la closure nouvelle et qualifie les cas inoffensifs après
   gate d'exécution distincte. Pas de répétition du helper/fixture existant.
5. **Option time distincte seulement si ratifiée** — nouveau sibling
   `GuardGenericTime.Contracts.cs` et `GuardianCore.GenericTime.cs`, pas overwrite
   de GuardV3.Contracts/GuardianCore. V review du delta temps/ABI et QA deadlines;
   ne pas prétendre que modifier uniquement RunnerGeneric ou le timeout parent
   change normal20s. Si Q1 retenu, cette slice n'est ni créée ni nécessaire [Q7].

Les noms/fonctions partagés ci-dessus constituent la proposition d'ownership
minimale; un auteur peut posséder plusieurs fichiers couplés. QA et V ont contextes
fresh distincts, outputs disjoints; pas de worker qui délègue, écrit git/DB/IDB ou
exécute des API OS. Toute adaptation supplémentaire est remontée au parent avant
élargissement. Aucune nouvelle review des composants inchangés pour remplir un slot.

## 4. Gates et décision de rattachement full44

- **G0** parent reçoit ces4outputs; V fresh examine architecture/budget/temps/
  coverage et leurs pins. Parent tranche les défauts puis **ratifie explicitement**
  les contrats, profil temps et capacités ressources avant tout GO source.
- **G1** sources sibling + QA source indépendantes; V fresh composé, pins exacts,
  writer plan fermé, API et workload réels. « Source recevable » n'est pas compile.
- **G2** parent gate compile seule : outils/refs/images/paths/accès/closure et
  rehash avant/après. Un nouvel EXE reste non chargé; acquis compile inchangés gardés.
- **G3** parent gate qualification inoffensive liée à une seule invocation par
  cas prévu, tableaux d'attendus, caps, logs, durée et ressources exacts. Oracles
  indépendants, raws/receipts/pins retained, V fresh de l'evidence utile; pas de
  requalification automatique d'un cas sans impact.
- **G4** parent adjudique l'admission000d→000c seulement quand tous manquants sont
  prouvés; rattache explicitement obligations/tâches historiques, jamais closure
  silencieuse. Le rattachement000m garde ses propres dépendances. Rien ici n'adopte
  L8 B/C3-C5, L9/L10, G5-G7, live/FF8 ou le produit.
- **G5 futur full44** : exact snapshot/list44/argv/env/image, caps evidence et
  stockage propres, roots/collectors/writers/ownership, normalexit/Job0/EOF/ACK/
  CDB-1, et FINALGO parent liés. Si durée ou writers encore inconnus : HOLD, pas
  appel d'un argv supposé compatible. 63.67s pour sept suites ne suffit pas;
  leurs96DB/24743936B ne sont ni zéro ni majorant full44 [Q7].

Parent peut avancer tous travaux techniques READY sans GO utilisateur de routine.
Escalades utilisateur seulement pour des choix hors préautorisation nommés dans
GENERIC_T_CONTRACT.md; aucune tâche d'architecture offline ne crée elle-même un
tel besoin. V fresh et ratification parent restent deux actes distincts [Q8].

## 5. Lecture honnête de la livraison

Établi ici : paquet hashé, analyse statique, proposition d'interfaces/borne/
composition et plan de qualification. Non établi : fonctionnement des pumps,
cross-process accounting, stockage full44, délais d'un vrai full44, nouvelle image,
capacité kernel, compile/exécution des futurs siblings, acceptance/run000d.
Les sorties sont quatre fichiers docs/manifest seulement. Le manifeste répertorie
les trois hashes docs et les21pins, exclut son selfhash circulaire; le hash du
MANIFEST.json est fourni séparément dans le résultat final, pas inventé en lui-même.

## Ancres vérifiables

- **Q1** `docs/V3_MATRIX_SUBGATES_RESULTS_20261018.md:16-25,38-80,91-97` : acquis et frontière exacte V3→000d.
- **Q2** `docs/FULL44_ADMISSION_FRONTIER_20261018.md:18-52` et `docs/JOB_OFFICIAL_REFERENCE_CONTRACT_FINAL_HOLD_20261017.md:20-67` : travaux acquis, refus IOCP, pas de magic Job/interface ni répétition.
- **Q3** `source/BudgetedEvidence.cs:119-137,214-307` et `source/WriterLedger.cs:37-98` : caps, single writer et couverture réelle des méthodes.
- **Q4** `docs/JOB_GUARDIAN_V3_CONTRACT_DRAFT2_20261017.md:40-100,117-128` : witnesses, Job0, stop/logs et refus capture incomplet.
- **Q5** `source/HostLauncher.cs:205-252` et `source/WriterLedger.cs:100-138` : pompage tardif et vrai readback192/ACK.
- **Q6** `docs/FULL44_POLICY_RATIFICATION_20261017.md:12-64` : invocation future liée, rétention et collection normale seulement.
- **Q7** `source/GuardV3.Contracts.cs:7-23` et `docs/L8_PHASE1A_FOCUSED_RESULTS_20261018.md:3-5,18-24,27-33` : temps courant, mesure partielle et stockage connu.
- **Q8** `CONTINUATION.md:3-26` et `SCOPE.md:3-41` : reprise technique, gates parent/worker et livrables source-only.
