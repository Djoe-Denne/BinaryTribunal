# Parent API fixée R1 — source DATA_ONLY puis QA indépendante

Plan auteur result_mvdyffua_0010_omiamb lu ; 9pins150960B exacts confirmés.
Ce document fixe l'API commune, sans implémentation auteur ni oracles QA exposés.
Complète RATIFICATION.md, ne modifie aucun pin initial. Chaque MANIFEST de source/
QA référence son hash. GO source parent après lecture/ACK correctifs ci-dessous.

## Décisions E1–E10 et corrections obligatoires

- E1 réservation = label immutable `{ReservationSha256,ReservationEpoch>0}`.
- E2 root = `{BindingLabel,BindingSha256,BindingEpoch>0}`, array <=16, labels
  distincts Ordinal. Aucun handle/lease/OS droit depuis ces champs.
- E3 pins = `{PathLabel,Bytes,Sha256}` ; labels distincts Ordinal, SHA répétés
  permis (mêmes bytes sous deux labels distincts). Bytes 0..int.MaxValue ; vide
  légitime sauf pin d'image qui doit être >0. Labels <=259 UTF16, pas de controles,
  NUL ou surrogate invalide. Labels ne sont pas une preuve filesystem.
- E4 UTF8 strict sans BOM, encodeur à erreur sur surrogate isolé ; les limites
  natives argv/env restent des UTF16 code units. UTF8 ne prouve pas le cap global.
- E5 dérivés WindowsCommandLine/EnvironmentBlock exclus du record canonique,
  calculés seulement depuis vecteurs/IDs de codecs bindés. Intent=SHA256(record)
  lowercasehex64, hors self-reference ; aucun IntentSha256 arbitraire en input.
- E6 PAS de sous-cap8192 nouveau. `AdditionalControlArtifacts` obligatoire comme
  tableau (vide permis DATA_ONLY), deep-copié ; max16 éléments nonnull, chaque
  byte[] <=32768. Le record canonique lie chaque artifact par longueur+SHA256.
  `ControlFileByteCount = canonical.Length + sum(actual artifact.Length)` doit
  tenir32768 dans TryBuild lui-même, pas agrégateur futur facultatif. Le record
  ne contient pas aussi les bytes d'artifacts : pas de double crédit/écriture
  supposée. Une liste vide/partielle ne prouve JAMAIS l'inventaire hôte complet.
  Host futur doit vérifier tous OWNER/lease/ledger/registry effectifs et leurs
  octets/caps ; data acceptance n'autorise pas un lancement.
- E7 limites data ratifiées ici : env4096, allowed names4096, pins64, roots16,
  labels259, args128, source bytes0..int.MaxValue, additional artifacts16.
  Pas de hausse des caps/Q1, pas de prétendue compatibilité full44.
- E8 OUI pin d'image explicite requis : SourcePins contient exactement un label
  Ordinal égal à TargetImagePath, son SHA égal à TargetImageSha256 et Bytes>0.
  Vérification données seulement ; pas de hash d'image réelle prétendu.
- E9 appel des prédicats GuardianPredicates gelés réutilisé dans même assembly.
  Closure parent mono-assembly sera le V3 source gelé déjà connu + nouveau source/
  QA, après V fresh. Aucun appel au core/owner/native au runtime pure QA.
- E10 mode C01..C14 requis, pins >=1, roots >=1, const TimeProfile=V3-Q1.

Arg vide DOIT être encodable : `argument == ""` est permis explicitement avant
PlainBounded pour arguments nonvides ; toutes les autres chaînes valides gardent
les contrôles core. `a` suivi d'un backslash sans espace/quote reste NON QUOTÉ,
contrairement à l'exemple isolé erroné du plan. Version `win-quote-v1` : quote ssi
vide, espace ou quote ; dans quotes n backslashes avant une quote =>2n+1, avant
quote finale=>2n, sinon inchangés. Codec commandline assemble par espace unique.
Codec seul encode des chaînes ; seul TryBuild lie argv[0] à image DOS .exe exacte.

Env : encodeur trie les entrées par nom OrdinalIgnoreCase, rejette doublons, entrée
sans '=' ou nom vide, controles/NUL/surrogate invalide ; valeurs vides permises.
Env vide encode exactement deux NUL. Une liste caller non triée n'est PAS refusée.
TryBuild reçoit AllowedEnvironmentNames explicite, jamais Environment.Get... ;
tableau <=4096, noms ASCII `[A-Za-z_][A-Za-z0-9_]*`, chaque nom<=259, pas doublon
ignore-case. Entries doivent toutes être allowlistées ; aucune injection d'entry
absente ou d'environnement hérité. Plan conserve la liste allowlist triée/copiée.
Politique Q1 fermée : noms NODE_OPTIONS/BUN_OPTIONS/NODE_PATH/FF8_ENSEMBLE_SOURCE
refusés ignore-case même s'ils sont déclarés. TryBuild refuse les flags argv exacts
ou forme `flag=value` --preload/--require/--watch/--hot/--env-file et `-r` (avec
forme `-r=value` seulement) ; pas de blanket substring sur toutes les valeurs.
--no-env-file est permis. Ceci est une restriction data profile ratifiée, pas
une preuve universelle qu'un target inconnu n'interprétera pas d'autres options.
Les codecs primitifs restent indépendants de cette politique TryBuild.

## Surface C#4 interne exacte

Namespace ReGraph.GuardV3, pas readonly auto-properties C#6 : backing readonly
fields + getters explicites. Les constructions ci-dessous sont des signatures,
pas du code proposé à compiler. DTOs metadata n'accordent aucune capacité.

```
GenericTargetPlanContract:
 Version="generic-t-dual-1", TimeProfileQ1="V3-Q1",
 WindowsArgvCodecId="win-quote-v1", WindowsEnvCodecId="win-env-v1",
 CanonicalEncodingId="gtplan-canonical-v1";
 MaxArgumentCount=128, MaxCommandLineChars=32766,
 MaxEnvironmentBlockUnits=32767, MaxEnvironmentEntries=4096,
 MaxSourcePins=64, MaxOwnershipRootBindings=16, MaxLabelChars=259,
 MaxAdditionalControlArtifacts=16.
GenericQualificationMode: C01=1,...,C14=14.
GenericPlanRefusal:
 None=0,NullInput=1,BadIdentity=2,BadPin=3,BadLedgerPlanPin=4,
 BadTargetPath=5,BadArgv=6,BadCommandLine=7,BadWorkingDirectory=8,
 BadEnvironmentEntries=9,BadEnvironmentBlock=10,BadReservationBinding=11,
 BadSourcePins=12,BadOwnershipRootBindings=13,BadQualificationMode=14,
 ControlBudgetExceeded=15,InternalEncodingFailure=16,
 BadControlArtifacts=17,BadEnvironmentAllowlist=18.

sealed GenericPlanReservationBinding:
 ctor(string reservationSha256,long reservationEpoch)
 readonly fields ReservationSha256:string,ReservationEpoch:long
sealed GenericSourcePin:
 ctor(string pathLabel,long bytes,string sha256)
 readonly fields PathLabel:string,Bytes:long,Sha256:string
sealed GenericOwnershipRootBinding:
 ctor(string bindingLabel,string bindingSha256,long bindingEpoch)
 readonly fields BindingLabel:string,BindingSha256:string,BindingEpoch:long
// Metadata constructors retain scalar data; TryBuild validates. No authority.

sealed GenericTargetPlanInput: mutable fields
 Identity:CaseIdentity;
 LeaseReceiptSha256,LedgerPlanSha256,TargetImagePath,TargetImageSha256,
 WorkingDirectory:string;
 Argv,EnvironmentEntries,AllowedEnvironmentNames:string[];
 ReservationBinding:GenericPlanReservationBinding;
 SourcePins:GenericSourcePin[];
 OwnershipRootBindings:GenericOwnershipRootBinding[];
 QualificationMode:GenericQualificationMode;
 AdditionalControlArtifacts:byte[][];

sealed GenericTargetPlanV1: construction restricted to validated codec path; internal getters
 Version,LeaseReceiptSha256,TargetImagePath,TargetImageSha256,WindowsCommandLine,
 WorkingDirectory,EnvironmentBlock,IntentSha256,LedgerPlanSha256,TimeProfileId:string;
 Identity:CaseIdentity; ReservationBinding:GenericPlanReservationBinding;
 Argv,EnvironmentEntries,AllowedEnvironmentNames:string[];
 SourcePins:GenericSourcePin[]; OwnershipRootBindings:GenericOwnershipRootBinding[];
 QualificationMode:GenericQualificationMode;
 CanonicalByteCount:int; ControlFileByteCount:long;
 GetCanonicalEncoding():byte[];
 GetAdditionalControlArtifacts():byte[][];
// Every array getter/method returns a fresh defensive copy, including nested bytes.
// Internal construction/factory implementation detail in this file is permitted;
// no public raw constructor or new authority is exposed. C#4 access must compile.

static GenericTargetPlanCodec:
 bool TryBuild(GenericTargetPlanInput input,out GenericTargetPlanV1 plan,
               out GenericPlanRefusal refusal);
 bool TryEncodeWindowsArgument(string argument,out string encoded);
 bool TryEncodeWindowsCommandLine(string[] argv,out string commandLine);
 bool TryEncodeEnvironmentBlock(string[] entries,out string block);
 bool TryEncodeCanonical(GenericTargetPlanV1 plan,out byte[] canonical,
                         out GenericPlanRefusal refusal);
 bool TryCountControlFiles(byte[][] encodedArtifacts,out long totalBytes);
```

Failure outputs : TryBuild plan=null/refusal!=None ; succès refusal=None.
Codec string output=null sur false ; canonical=null/refusal!=None sur false ;
Count totalBytes=0 sur false. Données invalides sont refusées, pas exceptions
non bornées ; pas catch qui convertit un état inconnu en succès. Les exceptions
de ressources/outage ne créent jamais de plan partiellement valide.
TryCountControlFiles compte les arrays réellement fournis, refuse null/innernull
ou somme>32768, ne prétend pas savoir que l'inventaire est complet.

Ordre TryBuild : NullInput, identité, lease/image pins, ledger pin, targetpath,
argv (y compris flags policy), commandline, cwd, allowlist(18), entries(9),
envblock(10), réservation, sources(imagebound), roots, mode, artifacts(17),
canonical+aggregate cap(15), internal encoding failure(16). Pas d'input version,
profile ou intent : QA les vérifie comme constantes/dérivés, pas faux champ fictif.

## Layout canonique gtplan-canonical-v1

Primitives u32LE/i64LE, countedUtf8 = u32LE(byteLength)+UTF8strict. Ordre stable :
```
GTPL (4 bytes) | u32LE(1)
countedUtf8(Version),countedUtf8(WindowsArgvCodecId),countedUtf8(WindowsEnvCodecId)
countedUtf8(NonceHex),i64LE(Epoch),countedUtf8(LeaseReceiptSha256)
countedUtf8(ReservationSha256),i64LE(ReservationEpoch)
countedUtf8(TargetImagePath),countedUtf8(TargetImageSha256)
u32LE(argc),each countedUtf8(arg),countedUtf8(WorkingDirectory)
u32LE(envCount),each countedUtf8(sortedEntry)
u32LE(allowedNameCount),each countedUtf8(sortedAllowedName)
u32LE(pinCount),each countedUtf8(label),i64LE(bytes),countedUtf8(sha)
countedUtf8(LedgerPlanSha256),countedUtf8(TimeProfileId),u32LE(mode)
u32LE(rootCount),each countedUtf8(label),countedUtf8(sha),i64LE(epoch)
u32LE(additionalCount),each u32LE(actualBytesLength),raw32(SHA256(actualBytes))
```
SourcePins/roots/additional order is preserved and bound, not silently sorted.
All additional arrays copied before hash/encoding. Encode two passes, checked
arithmetic and cap before large allocation ; no Stream/File/OS/IO/native call.
Actual aggregate cap includes this metadata table and artifact bytes once each.

QA receives this API only, not source author. QA0 remains partial; QA1 C# source
against this surface is separately GO parent after QA0 receipt. Fresh V composé
before any parent compile/run gate. No runtime/budget/native/full44 proof implied.
