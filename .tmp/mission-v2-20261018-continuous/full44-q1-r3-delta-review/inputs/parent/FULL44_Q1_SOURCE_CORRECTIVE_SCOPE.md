# Correctif source C#4 — PLAN D'ABORD, ownership R3 isolé

Lire SCOPE/API_R1/R2/R3/RATIFICATION et sourceR2 baselinepinnée ; aucunQAoutput,
origine ou main. ACK_HOLD TOUSpins/tailles+NONBLIND + PLAN précis et borné,
attendre GO CODEparent. Pas code sursimpleACK. Tâche nouvelle justifiée par
quatre défautssource V et surtout ordre de validation/copies/mesures interactif.

Outputs3seulement GenericTargetPlan.cs + DESIGN.md + MANIFEST.json sous ce
sibling. SourceR2historique/frozen intacte. Garder API/layout/IDs/caps/enums/
ordre firstfailure, C#4/.NET4, .GuardianPredicates gelés et DTO DATA_ONLY.
Pas nouvelle crypto/IO/OS/Job/native/Stream/File/Process/Thread/clock/env/DB,
git/registre/IDA/live/réseau/délégation/teamtools/claim/complete. Pas compiler/
test/run/validator/importproduit. Hash et parsing des inputs data-only permis.

Défauts source à corriger, sans accès à QA :
1. IComparer<string> nonrésolu : System.Collections.Generic import/qualification.
2. Primitives argv : null/NUL/char<32/surrogateisolé refusés, vide encodable,
   rawetencodedlimites32766, argv1..128,cmdtotale<=32766. Flags policy NONdans
   quoter : -r et flagsvalides restentencodables. Positifs natifs limites conservés.
3. Env[] vide → EXACT2NUL, succès. TryBuild with emptyallowlist+emptyentries
   valide data-only. Entréesnonvidestriées/doublons/allowlist/règlesinchangés.
4. Aucune duplication de payload64MiB puisrefus32768, aucune expansion134Mchars
   pourenvplustardrefusée. Mesures/précontrôles bornés AVANT allocations.

Architecture de plan requise (choiximplementationàproposer, invariantsimposés) :
- Entrée : capturer scalaires immuables et REFÉRENCES de tableaux seulement,
  jamais CopyJagged/clonepayload avant guards. Ne jamais relire builder mutable
  ensuite pour construire un objet/record ayant d'autres valeurs que validées.
- À chaque étape de l'ordre fixé, cardinalité avant copie externe, puis petit
  snapshot des références/éléments bornés, validation uniquement sur snapshot.
  Args<=128,env/allowlist<=4096,pins<=64,roots<=16,artifacts<=16.
- Rawargv ENTIER valide à étapeBadArgv avant cmdmeasure/BadCommandLine ; un
  invalidrawtardifnepeutêtremasquéparcmdtropgrand. Mesurer quoter/cmdsans
  expansion nonbornée, allouer seulementquandsizeok. Pas capintMax substituted.
- Enventriesraw/duplicates/membership à étape9 AVANT taillebloc10 ; mesurer
  bloc UTF16 avant StringBuilder/ToString. Emptycas2 explicite. Allouer<=32767.
- Artifacts étape17 : outerarrayborné, snapshotrefs<=16, vérifier TOUTES les
  nulls/longueurs<=32768 AVANT clone de payload. Ensuite mesurer canonical+
  sumactualpayload (tablelen/SHA32 fixe permet mesurer sans hacher/copier raws).
  Cap15 après tous guards17 ; pas retourner15 masquant un dernierartifactinvalide.
  Si capéchoue, pas de payloadcopy massives. Après taillevalidée copier les
  bytes, hasher ces mêmescopies, encoder objet/intent cohérents. Pas de capnouveau.
- Conserver ordre complet NullInput→Identity→pins→target/argv/cmd/cwd→allowlist→
  entries→envblock→reservation→sources→roots→mode→artifacts→cap→encodingfailure.
  Défaut de ressources ne crée jamais plan partiellement valide ou succèsfactice.
  Capture/exceptions bornées explicites autour des allocations autorisées,
  sans promesse hard-RT/OS. Getters du plan restent deepcopies fraîches.

Le PLAN détaille par méthode : champ snapshot/stade/mesure/limite/allocation et
raisonfirstfailure ; impacts privés minimaux et preuve de l'ordre. Pasnouveau
framework/context/policy ; toute API/cap/profil requisnouveau→parentavantcode.
AprèsGO : comparer R2→R3 et documenterdeltas, hashsthreeoutputs/inputs/suppléments,
retourNATIFsourceproposée/ancres/limites ; Vdeltafreshavantgatesparent.
