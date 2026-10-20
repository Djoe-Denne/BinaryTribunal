# Ratification parent partielle — Q1 données/codec seulement, révision 2

Autorité : reprise continue ORDRE_MISSION_V2, politique Ensemble approuvée v2,
hash b97d940a25f7e2db6feab6224441e5f5a12e4d81e22220a80ce84aee00586f11.
G0 est ratifié UNIQUEMENT pour la slice 1 data/codec source. Contrats corrigés :
full44-t-fix/outputs (manifest 0e4aa24412ffa53994cc54560377ccbadcba30504876cbb3a4fd0d5c2986120c),
Vdelta historique ACCEPTABLE_DELTA_CONTRACT_SOURCE_SCOPED. Pas ratification globale.

Possession nouvelle : full44-q1-data-author/outputs/GenericTargetPlan.cs + DESIGN.md
+ MANIFEST.json. QA disjointe : full44-q1-data-qa/outputs/ ; d'abord vecteurs
argv/env indépendants + matrice de refus, puis GenericTargetPlanTests.cs après
fixation de l'API par le parent. Auteur et QA ne voient pas leurs travaux mutuels
avant cette fixation. V fresh composé ensuite, avant gate compile parent séparée.
Aucun changement aux sources V3 gelées ou aux fichiers centraux. Pas de git worker.

GO SOURCE DATA ONLY après ACK+plan puis GO parent. Aucune API Win32, Process,
Stream/file IO, réseau, clock, DB, Job, handles, thread ou launch dans le code de
cette slice. Pas compilation/exécution/validateur par workers. SHA256 mémoire,
encodages, copies défensives et validation pure sont permis dans le code proposé.
Une valeur validée est DATA_ONLY, pas trusted authority/lease/proof/OS pin acquis.

Q1 seul : setup5000/normal20000/cleanup30000/total55000 ms ; nouvelle version
125s non ratifiée. Ledger evidence 262144 total et capture114688 restent inchangés.
ControlFiles32768 couvre ensemble les bytes réellement encodés de plan/argv/env/
pins/OWNER/lease/ledger/registry. Le validateur data doit recevoir les bytes de
contrôle supplémentaires et compter l'ensemble sans double crédit ; ne pas croire
un simple entier déclaré comme preuve du coût. Codec n'est ni writer ni débit
runtime. Bases/caches ne sont pas couverts par ces caps evidence : inventaires et
capacités ressources full44 restent à ratifier. Aucun lancement full44/Q1 réel,
ni broker/dual pump, ni nouvelle qualification native, ni hausse du profil temps.

Contrat slice : GENERIC_T_CONTRACT §2 + bornes Q1. CaseIdentity existant immuable,
nonce lowercasehex64/epoch>0 ; image DOS absolue .exe et cwd compatibles core ;
argv[0] exact image, <=128 args, NUL refusé, Windows quoting versionné ; bloc env
allowlist parent explicite, tri ordinal ignore-case, sans doublons ni héritage,
double NUL et <=32767 UTF16 code units ; command line <=32766. Ne pas modifier
le core pour rendre un cas admissible. Contrôles de chemins sont syntaxiques :
canonique/reparse/hash image/ownership sont obligations futures du trusted host.
Pins lowercasehex64, bytes/epochs/compteurs intégraux bornés, données copiées
défensivement à l'entrée et à la sortie ; pas champ inconnu promu en capacité.
TimeProfile Q1 seulement et QualificationMode C01–C14 data-only, pas full44.
Pas d'invention de contrat native ni de widening du loader produit.

Le plan initial auteur doit proposer les signatures C#4 exactes et l'encodage
canonique compté (pin d'intent sans self-reference). Parent fixe l'API avant code
et donne cette API à QA pour son test source indépendant. Types/propriétés restent
dans un sibling ReGraph.GuardV3, pas d'édition de CaseIdentity/core. Bounds data
plus restrictifs nécessaires sont remontés avant adoption ; pas d'API requise
inventée dans une dépendance. Le plan QA inclut oracles littéraux Windows pour
vide/espace/quote/backslashes finaux, env vide/sort/duplicate/NUL/allowlist et
seuils contrôle32767/32768/32769, mutation alias, faux profile/pins/identity.

Cette ratification n'autorise aucun run01/live/FF8/G5–G7, aucune adoption L8,
ni 000d/full44. Les gates V fresh, compile et éventuelle qualification parent
restent distinctes. Un défaut source suit fix+Vdelta, pas fallback ni retry aveugle.
