# Plan complet conforme, full bloqué ; tranche compile séparée préparée

## Plan statique reçu et contrôlé

L8owner/cycle1 inchangés. Quatre documents45415B sous OWN/
COMBINED_FULL_VALIDATION_PLAN_20261016, manifeste03ef85bd174e1a056c7bc7f01bedf370b79c2b3adbb5f23ca15bde185a4a5b72 :
PLAN11659B515b296a, INVENTAIRE12224B820e8a62, EFFETS15121B56c2768d.
Parent confirme les trois payloads39004B et les436inputs ; documents gelés readonly.
45*.test.ts du corpus correspondent exactement à l'inventaire ;proposition44
tests sous test/, seule exclusion visible scripts/role-sharing-offline.test.ts.
92TS analysés textuellement, pas compilés ;381arêtes littérales/87TS atteints sont
une analyse conservatrice, pas une preuve de tous les chemins JavaScript.

Le plan est **conforme comme livraison statique**, non exécutable. Les trois
blocages restent pour le full :

- B01 :hooks byte-identiques détruisant des DB physiques incompatibles avec la
  conservation de chaque DB/suffixe ;pas d'ancienne exception appliquée.
- B02 :créations fraîches hors TEMP (LOCALAPPDATA/littérauxWindows), preuve de
  possession et collecte en échec partiel à qualifier, pas glob d'anciens Temp.
- B03 :outillage réel et arbre des enfants Bun/Python/Worker à qualifier ;timeout
  parent n'est pas preuve d'arrêt des descendants.

Sourcecleanup déjà relue par le parent, inventaire26sites/16fichiers fourni ;
mémoire, DB physiques et nonDBstaging distingués. Aucun helperpatch/interception/
copieauvol/cleanup/skip de non-régression ni waiver éphémère n'est autorisé.
Reçu :`combined-full-validation-plan-final-parent-qualification-20261016.json` sous .tmp parent.

## Décision prospective : ne pas bloquer la compilation sur les hooks de tests

Le parent sépare TC noEmit puis bundling CLI, sans test ni code projet exécuté.
Cette route ne résout PAS B01/B02/B03full ni ne justifie un PASSglobal. Contrat
complet :COMBINED_PARTIAL_TC_BUILD_GATE_20261016.md, plus JSON matériel.

Métadonnées d'outillage qualifiées, pas résultat de compilation :Bun1.4.2,
Node24.11.1 ;SHA exécutables15277c59…519ca4/f13ac3ca…128eaf. Entrées/metadata des
packages installés et lock concordants :SDK2.0.26,TypeScript5.9.3,typesBun1.4.0,
bun-types1.4.0,typesNode26.6.5,undici-types8.9.0. Pas install/achat/configglobal.
NodeOPTIONS absent, bunfigglobal connu absent, pas de bunfig/.env ou attribut
importmacro dans le corpus, tsconfig sans plugins/incremental/composite. Help
Bun a accepté no-install/no-macros/no-env-file en routebuild, rien n'a été buildé.
Pins d'entrée/version ne prouvent pas tous les bytes vendor/OS ou blocWin32.

Node direct/binTypeScript --noEmit --project sera utilisé plutôt que bun run,
puis Bunbuild avec gardes additionnelles déclarées et chemins absolus normalisés.
Cette substitution de commande est PROSPECTIVE/explicite, pas un fix de run rouge.
Deux étapes180s/120s,deadline300s seulement après ACK/réservation/FINALGO distinct.
BUILD ne se lance qu'après TC naturel0/postpins/guard ;aucun bundle exécuté.

## Image et contrôle préparés, aucune compilation encore autorisée

Parent seul a créé la nouvelle racine
C:/Users/djden/AppData/Local/Temp/opencode/CVB-d2d2b842e3, repo+control+OWNER.
436payloadsrepo17625182B byte-exacts/readonly,301harness inchangés,ledger séparé b5c9,
aucun ancienDB/cache/runtime copié. IMAGE_PARENT_RECEIPT SHA9ca4693c…71a22c lie
chaque copie ;seule junction node_modules explicitement déclarée vers dépendances
canoniques existantes, accèslecture seulement. Aucun install ou lien ancienOWN.
Run/cache/dist absents, pas TSC/build/test/CLI/applicationDB/port créé/exécuté.

Nouveau paquet OWN/inputs/COMBINED_PARTIAL_TC_BUILD_GATE_20261016 :MD6305Bd2c6d480,
JSON15252B281f60de,2payloads21557B ;receipt888Be3a96595/fingerprint357ad9bd.
**Ce helper ne couvre que ces deux contrôles, PAS l'image copiée par le parent.**
OWNER et IMAGE_PARENT_RECEIPT distincts sont requis à l'ACK. Sourcehelper435 et
ledgerparent gardent leurs couvertures distinctes ;cap8MiB inchangé.

ACCÈS SEUL :lirecontrats/reçus/image/outillage autorisé, hash436image+2contrôles,
ACKréel/rôleconditions puisHOLD. Aucun worker n'est autorisé à créer run/cache/
dist ou lancer compilateur/build à ce stade. Ancien plan/full reste gelé/bloqué,
L9global/L10/main/native/intégration fermés, toutes limites scoped conservées.
