# Proposition B01/B02 pour 44 fichiers offline — NON APPROUVÉE

Ce texte est une proposition parent pour review indépendante, pas un GO, pas un
waiver actuellement effectif. Il ne remplace aucun gel ou BLOCK enregistré.
Le raffinement9ba22e13 (4docs86498B) est conforme comme livraison, mais full44
reste bloqué. ParentTC/build acquis ne sont pas à rejouer. L9global/L10/main/native
et l'interop du script45 demeurent fermés. Même mission/politiques4/2/budget5.

## Question technique à trancher

Une obligation d'inventaire durable ATOMIQUE avant chaque création de fixture et
de collecte exhaustive même en crash n'est pas satisfaite par le code existant.
Un JobObject ne la fournit pas. Peut-on néanmoins autoriser une non-régression
offline bornée, source byte-identique, sous les garanties PLUS ÉTROITES ci-dessous,
en les nommant explicitement plutôt qu'en prétendant résoudre cette obligation ?
La revue doit examiner aussi la compatibilité avec l'autorité utilisateur et les
règles de conservation, pas seulement la facilité d'obtenir un PASS.

## CDB-1 proposée : cleanup des fixtures éphémères explicitement listées

Seuls les9groupes E01–E09/callbacks et sites exacts du ROOTS_AND_CLEANUPc2a508fc :
client/eventlog/deuxengine/ida-publication/re-policy/runtime/deuxstore. Le nom
«foreign/ensemble/native/i64» dans un mock n'autorise jamais la ressource réelle.
La création doit provenir des sources pinées, dans un namespace neuf vide possédé
ou un répertoire créé exclusivement par mkdtemp de ces seuls callbacks.
Les UUID seuls ne prouvent pas exclusivité ;les paths correspondants sont admis
uniquement DANS le TEMP neuf vide possédé, pas une base partagée existante.

Proposition explicite de perte :laisser leurs afterEach/finally/cleanup déjà
présents supprimer les DB/suffixes et les données synthétiques connexes de LEUR
nouveau root, y compris après assertionFAIL. Aucun rawDB/per-close/posthash ne
sera inventé pour ces fixtures détruites. Logs/erreurs/sourcepins/caches/registry/
receipts du run ne sont jamais couverts par l'exception. Un run rouge reste rouge,
avec cette limite de diagnostic ;aucune reprise/fix/rerun automatique.

Les suppressions nonDB nécessaires aux tests négatifs et aux staging transactionnels
restent distinguées et limitées à leurs nouveaux artefacts synthétiques. Aucun
intercept, copie-au-vol, backup SQL, mutation de test/oracle ou retrait de cas.
Les fixtures durables R18/R19/R21 restent conservées ;sidecars SQLite peuvent
disparaître naturellement par checkpoint/close. «Absents après close» n'est pas
«jamais créés» ou «tout sidecar préservé durant sa vie».

## B02 proposée : provenance source bornée, pas journal de création crash-proof

1. Parent réserve un namespace image/TEMP neuf vide et une registry image neuve.
   Tout path UUID/non-exclusif dans ce namespace est nouveau par construction,
   sans retoucher une ressource ancienne. Aucun fake LOCALAPPDATA/HOME/host.
2. Quatre classes partagées R10/R14/R18/R19 :seul le mkdtemp de source pinée peut
   réserver un root neuf. La base commune n'est PAS possédée et n'est pas scannée
   ou nettoyée. L'OS attribue un nom nouveau au créateur ;ce n'est pas une preuve
   d'un journal durable parent atomique. Pas de prétention de confinement FS/réseau.
3. Les sources L7 poussent le path avant Store ;L8 écrit reserved avant de retourner
   le path au constructeur. Après fin NORMALE testroot0 ET JobActive0, collecte
   seulement les paths effectivement émis par hooks/registry de CE run. Vérifier
   task, préfixe/base exacte, canonicalité/nonlink, fileIDs/naissance cohérents et
   accords raw post-exit/receipts. Ces checks seuls ne prouvent pas creatorPID ;
   l'attribution repose également sur source pinée, nouveau root mkdtemp et logs
   de l'arbre owned. Les limites de cette provenance doivent rester explicites.
4. Pas de prise de possession par nom/date seuls, glob des anciennes42L7/636L8/
   deuxcrossQA DB, ni lecture de leurs contenus ou metadata pour les «retrouver».
   Refus si un path émis est ambigu, hors contrat, un reparsepoint ou ne correspond
   pas au nouveau run. Aucun effacement pour réparer un conflit.
5. Crash/timeout/registry tronquée/receipt manquant :HOLD, aucune acceptation ou
   publication de couverture complète. Conserver les seuls artefacts attribués ;
   les roots orphelins inconnus restent INTACTS et non réputés safe-to-delete.
   Ne pas promettre inventaire/collecte exhaustive de toutes les créations crash.
   Ne pas considérer incomplet comme zéroDB ou preuve d'absence de fuite.
6. Menaces de remplacement concurrent malveillant par un acteur local privilégié
   ne sont PAS couvertes par une simple non-régression fixture. Une preuve de
   sandbox Windows hostile ou d'autorité scientifique ne doit pas être inférée.

## Autres gates conservées

B03 exige un vrai helper de confinement/processus indépendant revu et QUALIFIÉ
par fixtures inoffensives avant toute suite produit :root suspendu, assigné avant
resume, no-breakaway/kill-on-close, rootexit ET jobActive0. Ce mécanisme n'autorise
aucune filesystem policy ni acquisition scientifique. Outillage Bun/Python réel,
guards d'environnement, bounds/logs/ownership/accès/réservation et FINALGO distinct
restent à qualifier. Le launcher worker NODE_OPTIONS reste HOLD sans clearing.

Review attendue :ACCEPTABLE_PROPOSAL_SCOPED | BLOCK | UNCERTAIN,3–8ancrages,
pertes/gaps résiduels, contradictions avec les règles supérieures et conditions
minimales d'un futur GO. Pas de nouvelle policy inventée par le reviewer, ni
exécution/sourcefix. Le parent seul peut ratifier prospectivement après la review ;
aucune approbation ou permission dynamique n'est acquise par ce document.
