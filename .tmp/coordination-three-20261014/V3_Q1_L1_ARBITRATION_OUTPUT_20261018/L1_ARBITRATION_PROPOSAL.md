# Q1 — Arbitrage PROPOSÉ anomalie L1 (bridges-rare) — proposition au parent

- **Livrable** : 1/1 fichier (L1_ARBITRATION_PROPOSAL.md). Auteur fresh disjoint : l1-arbitration-r1 (task_mvdjqmb1_0000_4j3t2i, paquet 5e06bcd8, 4 inputs, 306048B).
- **NONBLIND déclaré** : INPUT_MANIFEST.json + SCOPE.md lus en entier ; L1_BRIDGES_RARE_INCOMPATIBILITY_20261015.md et ORDRE_MISSION_V2_20261018.md lus en entier ; CORRECTIVE_FINAL_GATES_20261014.json borné aux sections L1/G1 pertinentes (L1BridgesRare20261015 — ligne 1933 ; G1Ordering — lignes 1787, 1789 ; L7 initial QA — ligne 1929 ; refs L9/L10 — lignes 393, 418, 520).
- **Pins re-hachés par l'auteur in-place** : 4/4 exacts (2452 / 4276 / 286687 / 12633 B ; SHA256 identiques au manifeste ; total 306048B). Lecture seule depuis ; aucun fichier, schéma, manifeste, validateur ou source accepté modifié (cf. L1:3-5, L1:57-59).
- **Zéro code / zéro test / zéro exécution / zéro git / zéro native** — PROPOSITION seulement : le parent tranche.

---

## 1. Ce que la règle stricte protège — et pourquoi le rejet original est une RÉGRESSION exigée, pas un bug

La règle stricte protège trois invariants simultanés, tous documentés dans la reproduction parent (L1:9-17) :

- **Invariant de fin exclusive** (`caller end` vs span) : l'arête isolée part du caller `…:0x2100`, span unique **[0x2100,0x2110)**, taille connue **16** ; le site instruction/provenance est **0x2110**. `0x2110` est la borne exclusive — par définition le premier octet HORS du span. Le validateur main retourne exactement `edge instruction site is outside source function chunks` (L1:11-12). Le message réel est reproduit : la machine n'est pas en défaut.
- **Invariant d'identité/digests** : deux digests distincts et tous deux reproduits — SHA du contenu canonique complet (celui du manifeste) `21e7adc6…68a28f0` et `normalizedFingerprint` calculé excluant ce champ `21e42bba…776b9774` (L1:19-24). Toute « réconciliation » de l'original passe par une réécriture de l'un des deux — c'est réécrire un gel.
- **Invariant de prédominance des contrats acceptés** : la déclaration `expectedContract=accept` du manifeste gelé ne peut PAS annuler les invariants cross-field du L2 accepté, et l'ancienne couverture L1 n'est pas rétroactivement présentée comme validation de ce guard supplémentaire (L1:26-28). JSON ancre : `canonicalL1AndValidatorsUnchanged=true`, `noOriginalL1CompatibilityOrNativeClaim=true` (GATES:1933).

**Pourquoi « régression exigée » et pas « bug à corriger »** : le rejet de la fixture canonique 69278ee8 est le comportement correct du système sur une entrée réellement invalide — le site 0x2110 n'appartient pas au span déclaré par la fixture elle-même (L1:14-17 : « Le rejet est correct et ne doit jamais être contourné »). Transformant : si on « répare » la fixture originelle, on détruit le point de contrôle qui prouve que le validateur détecte ce type exact d'incohérence ; l'anomalie canonique DOIT donc rester un test de rejet vivant : « Garder une régression distincte : hash original exact et rejet réel de l'original, pas de skip, whitelist, auto-réparation ou loader permissif » (L1:32-33) ; `originalStrictRejectionRegressionRequired=true` (GATES:1933). L'incompatibilité est une propriété de la FIXTURE (données gelées), pas un défaut du validateur L2 (L1:3-4 ; GATES:1933 status « not L2 production defect ») ni une permission de modifier une fixture gelée (L1:4).

Conclusion protectrice : AUCUN assouplissement, whitelist, skip, auto-réparation, loader permissif, ni reclassement du statut de la fixture originelle ; le rejet strict exact (message + hash brut `69278ee8e28390b623f525774e8fe036231873934fb30ed0e98a2c33353105c4`, L1:9-10) est l'invariant négatif exigé.

---

## 2. Ce que la variante positive démontre réellement — et ce qu'elle ne démontre PAS

**Ce qu'elle démontre (prouvé, L1:32-53 + GATES:1933) :**

1. **Reproductibilité réglementaire du positif disjoint** : un constructeur de test explicite ET autorisé `syntheticRareBridgeDeclaredSpanV1` (L1:34-39), deep-clone avec préconditions source/pins/edge/span/size/site exactes, en changeant SEULEMENT `caller end → 0x2111`, `size known → 17` et l'identité/fingerprint d'un **nouveau** snapshot dérivé — toute arête/site/provenance, fonction-ID, couverture et déclaration d'accord/oracle inchangées (L1:36-39).
2. **Identité traçable du dérivé** : identité `fixture:bridges-rare:caller-span-v1:` + SHA256 canonique de `{domain:"re-graph-scheduler-test-only-bridges-rare-span-v1", originalContentSha256:<digest complet>, callerId:<ID>, oldEnd:"0x2110", newEnd:"0x2111"}` (L1:40-43).
3. **Exécution parent réelle et propre** : validation stricte `[]` (zéro erreur), nouveau snapshotId `fixture:bridges-rare:caller-span-v1:dfa3df47…` et `normalizedFingerprint` `bb3b194a9d51d181c61118a742223d91676983059a8ea8a549116a3627204630` (L1:48-53 ; GATES:1933 `derivedCallerSize=17`, `parentDerivedValidationErrors=0`, `derivedFingerprint=bb3b194a…`). La variante prouve donc : **le validateur strict accepte UN énoncé structurellement cohérent de même famille — c.-à-d. qu'il discrimine sur l'incohérence site/span, pas sur autre chose**. C'est la preuve empirique que le guard n'est ni sur-restrictif ni aveugle.
4. **Chemins de vérification exigés et déjà formulés** : vrai validateur, non-overlap, topologie/provenance inchangées, champs unknown/nonoracle inchangés, octets source intacts ; pas d'exigence que les nouveaux hashes/costs/plan-IDs égaux à l'ancien snapshot (L1:44-46).

**Ce qu'elle ne démontre PAS (bornage) :**

1. **Aucune compatibilité réelle L1↔L2** de la fixture originelle : « **Aucune preuve de vrais bytes ou réparation canonique L1** » (L1:52-53) ; `noOriginalL1CompatibilityOrNativeClaim=true` (GATES:1933). Le dérivé est un fichier DIFFÉRENT — il n'est pas un escape hatch pour l'original.
2. **Aucune promotion** : la décision « ne clôt pas l'anomalie L1 » et ne permet pas de déclarer « tous les originaux L1 sont valides au L2 » (L1:55-57) ; aucun gel historique réécrit implicitement (L1:58-59).
3. **Aucune preuve de vrais bytes/native** : l'écart voulu de la construction (taille 17, end 0x2111) est une donnée de test déclarée, tracée de bout en bout par la chaîne d'identité du dérivé ; il ne confirme aucun état L1 réel — tous nodes nonoracle, byteAgreement unknown (L1:52-53 ; GATES:1933).
4. **Pas de règle du validateur changée** : le guard main et le rejet strict restent dans leur version gélée ; seule la fixture dérivée est nouvelle (cf. L1:4-5).

Autrement dit, la variante est un **contrepoids positif borné** : elle admet le positif d'un cas disjoint SOUS contrôle — en tant que données de test — et jamais comme une autorisation de réparer l'original.

---

## 3. Le LIEN manquant aux tests DÉJÀ-acceptés — options + cas disjoint minimal restant (sourceGO parent séparé)

**Fait de bornage depuis les sources pinnées (exhaustivité vérifiée par greps ciblés) :**

- Le JSON pinné ne contient la mention bridges-rare que sous les clés GATES:1933 (L1BridgesRare20261015), GATES:1931 (decisionDelivery — livraison parents 3 fichiers/17492B, fingerprint fe672438, finalGo=true), et une occurrence sémantique disjointe (bridges = runtime15 readonly) à GATES:1787 (`runtime15IncludesTwoOriginalPartialUnintegratedReadonlyBridges=true` — NON liée au corpus L1-rare).
- La ligne GATES:1929 (L7InitialQADelivery20261015 : 852 pass / 504 acceptedRegressionsPass / 60 focused / 3149 assertions / independentReviewPending=true / PARTIAL_POST_L8_PENDING) est un **indice de volume de tests**, pas une preuve de liaison à la paire rejet-strict/positif-disjoint bridges-rare.
- **AUCUNE ancre test:ligne pour la paire rejet-strict (69278ee8 rejet exact) + positif-disjoint (bb3b194a accepté)** n'existe dans les 4 sources pinnées. L'exigence de lien est pourtant explicite : « La revue des nouveaux tests devra vérifier ce dérivé et le rejet original » (L1:55), et l'arbitrage final L9/L10 reste requis (L1:58-59 ; GATES:1933 `L9L10FinalScopeArbitrationStillRequired=true`).
- Contexte mission : Q1 anomalie L1 frontier = READY, pas encore engagée, lien « pont originel-rejet/variante positive » explicitement ouvert (ORDRE:184-186, ORDRE:193-197).

**Donc le lien NE PEUT PAS être démontré à partir des sources pinnées — c'est exactement le LIEN manquant pointé par SCOPE.md (SCOPE:23-25). Options explicites :**

- **Option A (affirmation forte NON jalonnable ici)** : les tests déjà acceptés couvrent déjà la paire — exige un ancre test:fichier:ligne vers le test gelé de la paire ; aucune source pinnée disponible pour l'affirmer. Refusée en l'état : une couverture affirmée sans ancre test:ligne ne satisfait pas l'exigence SCOPE:23-25.
- **Option B1 (recommandée) — sourceGO parent séparé, lecture seule** : un sourceGO parent lit (sans exécution) les fichiers de tests gelés (gel L7QA_INITIAL_E03, GATES:1929 + la livraison parents bridges-rare, GATES:1931) pour vérifier si la paire y est déjà couverte : (D1) test rejet original : parse du contenu canonique SHA brute 69278ee8 par le vrai validateur, assertion exacte du message `edge instruction site is outside source function chunks` ; (D2) test positif dérivé : construction `syntheticRareBridgeDeclaredSpanV1` → validation stricte `[]` → fingerprint bb3b194a. Si D1+D2 existent aux lignes de fichiers de tests gelés : le lien est fermé par l'Option A (cible test:ligne fournie alors par le parent). Sinon passer à l'Option B2.
- **Option B2 (cas disjoint minimal restant, si l'Option B1 échoue)** : le cas disjoint minimal restant est l'ensemble cumulatif de 3 sous-cases SANS ancre test:ligne actuelle, à rattacher par un sourceGO parent **séparé** (lecture seule, pas exécution, pas de code de ma part) autour des formulés L1:32-46 :
  - **(D1)** Rejet strict conservé : le contenu canonique complet `69278ee8…` doit rester rejeté avec le message exact ci-dessus (L1:9-17) — régression exigée.
  - **(D2)** Positif disjoint accepté : le constructeur `syntheticRareBridgeDeclaredSpanV1` doit, depuis le deep-clone, produire exactement le fingerprint `bb3b194a…` avec validation stricte `[]` (L1:34-53).
  - **(D3)** Invariants du dérivé : non-overlap, topologie/provenance inchangées, unknown/nonoracle inchangés, octets source intacts (L1:44-46), et digests L1 originels immuables (`21e7adc6…`, `21e42bba…`, L1:19-24).
  Ces 3 sous-cases composent la couverture indivisible de la paire rejet-strict/positif-disjoint. Uniquement le parent peut livrer un sourceGO séparé pour lire les fichiers de tests gelés hors paquet et, selon le résultat, soit rattacher la paire à test:ligne, soit autoriser un nouveau test gelé par un autre worker détaillé (hors ma capacité) dans une tranche ultérieure.

**Recommandation** : B1 puis, selon son résultat, A (si test:ligne trouvé) ou B2 (si le trou est confirmé) — jamais A sans ancre test:ligne en fichier gelé, jamais B2 sans les 3 sous-cases D1/D2/D3 réunies.

---

## 4. Conditions EXACTES proposées de CLÔTURE de L1-rare — sans whitelist, sans assouplissement, jamais de gel historique réécrit

Les conditions sont **cumulatives** (C1..C5). Elles ne modifient AUCUN fichier L1, schéma, manifeste, validateur ou source accepté (L1:3-5), et s'appliquent à la paire congelée (originelle 69278ee8 / dérivé bb3b194a) telle qu'exécutée par le parent (L1:48-53) jusqu'à la revue de clôture fresh.

- **C1 — Invariant négatif conservé en test vivant** : le rejet strict du contenu canonique complet `69278ee8…` avec le message exact `edge instruction site is outside source function chunks` reste passant et exigé (régression, pas de skip) (L1:11-17, L1:32-33) ; la fixture originelle n'est jamais reclassée « valides au L2 » (L1:56-57).
- **C2 — Invariant positif disjoint conservé** : le positif `syntheticRareBridgeDeclaredSpanV1` reste accepté dans les chemins QA déjà approuvés, avec identité `fixture:bridges-rare:caller-span-v1:` + SHA256 canonique comme identité de dérivé, unique dérivé officiel (pas de variantes alternatives autorisées) (L1:34-43) ; tout changement futur de ce constructeur exige un arbitrage parent séparé.
- **C3 — Liens revus en triple** : la couverture de la paire (D1+D2) et les invariants du dérivé (D3) sont attestés par au moins une revue endless par ancre test:ligne (lien fermable au terme de l'option B1/B2, section 3) — c'est le LIEN qui transforme les deux gels d'exécution (parent, L1:48-53) en preuve de test.
- **C4 — Pas d'expansion** : aucun fichier L1/schéma/manifeste/validateur/source accepté changé ; aucune désactivation de validation, aucun loader permissif, aucun bypass ; digests L1 originels immuables (`21e7adc6…`, `21e42bba…`) ; la précision « Ne pas imposer aux nouveaux hashes/costs/plan IDs d'être ceux de l'ancien snapshot » (L1:46) est un fait borné et ne constitue pas un droit d'émettre de nouveaux artefacts ponts.
- **C5 — Verbe de clôture parent verbatim honnête (bornage)** : le parent déclare explicitement : « L1-rare clos pour la paire originelle/dérivée TELLE QUE GÉLÉE AU MOMENT DE CETTE DÉCLARATION ; la variante enrichit la couverture QA L2 ; elle n'équivaut pas une compatibilité L1↔L2 pour l'originale ; aucune règle de validateur changée ». La déclaration doit être inscrite comme fait borné individuel, jamais une promotion (L1:57 ; GATES:1933).

**Ce qui reste HORS CLÔTURE quoi qu'il arrive (bornage strict)** :

1. Toute autre fixture (non gelée ici) qui ré-introduirait un mismatch site/span — le guard correspondant est générique, pas circonscrit à cette seule paille.
2. Les autres setup QA de L1:61-68 : `validation=validated` uniquement comme déclarations synthétiques explicites ; le négatif non validé reste conservé ; raw98 doit toujours refuser `selfLoopsPreserved=false` (tester la raison et l'absence d'effet) ; « pas d'acceptation sur les premiers tests verts » — L1-rare ne constitue pas une permission généralisée.
3. L'aspiration « tous les originaux L1 sont valides au L2 » (L1:57) — interdite par le concept même de régression exigée.
4. La réécriture de gels historiques (L1:58-59) ; la révision additive L9/L10 reste un arbitrage distinct (GATES:1933 `L9L10FinalScopeArbitrationStillRequired=true`).
5. La promotion native/production : `noGlobalL8NativeScienceInteropL9L10AcceptanceOrMainTransferGo=true` (GATES:1787) ; les gates L9/L10/main restent fermés — ancrages : GATES:393 (`oldLastCloseCase8GlobalBudgetNativeFull44L9L10IntegrationNotPromoted`), GATES:418 (`l7L8CrossQaGlobalOpenAndL9L10DependenciesUnchanged`), GATES:520 (`full44GlobalL9L10MainHoldsUnchanged`).

**Filet de sécurité** : les conditions C1-C5 sont conçues pour être satisfaites SANS contournement ; si les revues fresh montrent qu'elles ne sont pas encore satisfaites, L1-rare reste OUVERT et l'arbitrage revient au parent — aucune déclaration positive précipitée.

---

## 5. Gates impactés — et ce que cet arbitrage NE TRANCHE PAS

**Gates touchés (proposition, non décision) :**

- **G1 (régime L0-L6 / « L1 immuable G1 »)** : l'ordre de mission enregistre « L0-L6 hérités acceptés (…, L1 immuable G1) — hors périmètre de reprise » (ORDRE:164) et « G0/G1 acquis » (ORDRE:180). Mon arbitrage N'OUVRE PAS G1 : il maintient l'exigence du rejet strict (section 1) et n'admet aucune exception. Toute future tentative de rouvrir G1 par ce chemin est hors contrat.
- **L9/L10 (lectures finales de portée)** : l'arbitrage final de portée L1-rare reste EXPLICITEMENT requis et hors de mon périmètre : L1:58-59 (« L9/L10 devront conserver la limitation et arbitrer une éventuelle révision additive explicite ou sa portée finale ») et GATES:1933 (`L9L10FinalScopeArbitrationStillRequired=true`). Les lignes GATES:393/:418/:520 indiquent que L9/L10 restent fermés : ma clôture conditionnelle C5 ne confère AUCUNE autorisation de promotion vers L9/L10 ni main.
- **L7/QA (livraison 1929) & L8 (structure 1931)** : la livraison L7 initial QA est PARTIAL_POST_L8_PENDING et devra se conformer à la « revue des nouveaux tests » déjà exigée (L1:55, GATES:1929) ; je ne modifie ni L7 ni L8 (livraison parents bridges-rare achevée et finale, GATES:1931).
- **Frontier Q1 anomalie L1** : le frontier est READY pas encore engagé ; la tâche SP1 est en cours (ORDRE:184-186, ORDRE:207-211) — ce livrable alimente le frontier en PROPOSITION, pas en verdict.

**Ce que je ne tranche PAS (le parent tranche) :**

1. **Aucune décision de clôture** : C1-C5 sont des CONDITIONS proposées ; seul le parent déclare L1-rare clos si et seulement si elles sont satisfaites en revue fresh.
2. **Aucun choix parmi Option A / B1 / B2** (section 3) ; seul B1 est recommandé pour débloquer la preuve de lien sans nouvelle écriture de code.
3. **Aucune modification de priorité ni d'autorité** : ni priorité des travaux L2/L4/L7/L8 sur L1, ni réécriture du validateur strict, ni override des gates G1/G0/L9/L10.
4. **Aucune whitelist / auto-repair / loader permissif** en aucune circonstance (contraire à L1:32-33 et aux interdits permanents ORDRE:22-27 : pas de fallback non autorisé ; tout succès est un FAIT borné, jamais une promotion).
5. **Le cas de l'option B2 sous forme de code de test** : j'écris ZÉRO code/test (SCOPE:4, SCOPE:35-36) ; un D1/D2/D3 gélifié serait écrit par un worker détaillé sous un sourceGO parent séparé, avec auteur et reviewer fresh disjoints.

---

- **Fin de la proposition.** Le parent reste détenteur exclusif du verbe d'arbitrage (`CORRECTIVE_FINAL_GATES_20261014.json`, clé L1BridgesRare20261015 ligne 1933, demeure le statut OPEN jusqu'à disposition contraire), et ce livrable n'est ni une clôture, ni un verdict, ni un code — c'est un espace d'options argumentées préparé pour que le parent tranche en connaissance de cause.
- **Anomalie fichée inchangée jusqu'à disposition** : `L1BridgesRare20261015` reste OPEN (GATES:1933) — ce livrable ne change aucun statut.
