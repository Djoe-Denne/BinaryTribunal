# Parent — sémantique publique connaissance/policy S1, complément R3

Décisionparent sur gapQA result_mvf2jyfr_0034_hnierq. Le contratR3 dephase2
exige desliaisons exactes,mais nepublie aucunepréimage pourlesdeuxdigestsbackend
etne désignepas le document policy. Ce complément résout ceslacunes sansutiliser
de code/golden candidat comme oracle et sansinventer unbackend d'activation.
Signaturespubliques etchampsenveloppe restentinchangés ; S1est DATA ONLY.

## 1. rootHash et ledgerDigest sont des témoins backend OPAQUES

KnowledgeSourceV1.rootHash et ledgerDigest sont desSHA256externes64hexminuscules,
fournis par la sourceindépendante/backend pour la révisioncorrespondante. Ils
n'ont PAS de préimage normative calculabledepuis lesseulsfacts/frozen/files/
materializationsdans S1. Ce ne sont pas desaliases obligatoires de
FrozenKnowledge.fingerprint/leadsFingerprint et aucune formuleprivée du candidat
ne devient uncontrat implicite. Pas défaut,zerodigestautomatique ou recalculpour
fabriqueruntémoinabsent. ledgerRevision/knowledgeRevision restententierssûrs,
et toutes référencesau MÊMEétat/révision doivent matcher exactement les valeurs
indépendantes(dontT0). Ne pas imposerl'égalité entredeuxrévisionsJ→K légitimes.

Pour fixturesHEAP,desdigests opaques explicitesdistincts tels que64fois"1" et
64fois"2" sontdesvaleursde testvalables si touteslesliaisons correspondantes
concordent. C'est une déclarationde données, paspreuve de préimage/acquisition/
durabilité. Il n'y a donc aucune recette candidate àcopier ou àdeviner.

Conserver TOUTES validationsstructurelles/contenus/faits/fichiers/rawbytes/
materializations/fonction/commit/readback/approval etcomparaison auxdocuments
indépendants. L'opacité nepermetpas de faireduhashseul une validationdefaits.
S1 inspection authorityVerified=false toujours. S2/portbackend devra prouverla
lectureauthentifiée duvrairoot/ledger etlecommitJ→K ouemptyK→K ; aucune promotion
ouactivation n'est accordée par cetémoinfixture opaque. Le backend n'estpas
implémenté niqualifié par cetajout,aucunewaiver depreuve native/authority.

## 2. Quel document sourcePolicyRef identifie

Le document est une règlefixtureexplicitement sélectionnée comme inputcommon
opérateur, AVECsesoctetsréellement fournis. ValeurJSON FERMÉE exacte :

```json
{
  "version":"l8-activation-policy-source-v1",
  "missionId":"<mission exacte>",
  "lineageId":"<lineage racine exacte>",
  "maxActivationAttempts":1,
  "maxCandidateReplacements":0
}
```

Les deuxbornes sont desentierssûrs,attempts>=1/remplacements>=0 ; lesvaleurs1/0
ci-dessus sont unexemplefixture,pasdéfauts. Ellesdoivent être EXACTEMENT celles
del'envelope.activationPolicy,missionId/lineageId exacts. Paschampauthorized:true,
issuerlabel ou booléen capabledefabriquer HOST/LOCAL/autorisationbackend.

sourcePolicyRef = ByteRef de sesOCTETSJSON :
kind="l8-activation-policy-source-v1",encoding="utf8-json-v1",byteLength=longueur
UTF8,sha256=SHA256(octetsUTF8originaux). JSONvalide sansBOM/doublons/surrogateisolé
seloncontratByteRef. Lesfixtures peuventémettreC1 pourstableformatting ; une
reformatation valide a un AUTREByteRef,pas lamêmeorigine. Pasd'hashdomaine de
valeur substitué au hash brut. Leslimites ettagversion danslesoctets ne sont
pas unobjet reconstruitdepuisl'enveloppe ettenupourreadback indépendant.

Ces octets sont fournis dansun ArtifactBytesV1 des inputManifestSource.files
indépendants etreténus dans l'enveloppe(admissionSource.inputManifestSource.files).
L'ArtifactFile associé est kind="rule",identity ABSENTE,approvedForBlind=false
explicite ; il figure identique dans inputSource.commonInputs ET
sourceMissionSnapshot.config.commonInputs,et sonpath dans accessibleRules des
deuxsources(leur égalité existe déjà). MissionConfig.fixture doit êtretrue.
Lablobrefraw-v1 deArtifactBytesV1 décrit lesmêmesoctetsretenus ; sha256 et
byteLength doivent matcher sourcePolicyRef etfile.sha256,même si les encodings/
kindstypés diffèrent(raw-v1 pour blob,utf8-json-v1 pourdoc). Décodeurvérifie les
octetsréels,le document fermé etsesliaisons,pasjuste deuxhashs égaux.

Cette sélectioncommonrule est une déclaration fixtureàT0 liée auxsources
indépendantes. L'acquisition/configopérateur etl'autoritébackend restentincombant
auportS2 ; le JSONne les établitpas. Absence/refnonrésolue/fichiernoncommon/
mauvaisesbornes/mauvaiskind/version/mission/lineage/sourcebytes → bindingS1
refusé,aucunesourcepar défaut ; backendultérieurdoit tenirHOLD. Surtransition,
originparent immutable etpolicyref/limitesracines restentconservés seloncontrat,
pasnouveau plafond depuis unerecopieJSON. Aucun nouvelargument/API,docport ou
loaderlegacy n'estnécessaire : fichierscommon existants portentlesbytes.

## 3. Conséquences de travail et preuve

QA utilise uniquement ce contratpublic etlesréférencesqualifiées,aucuncode/
schema/DESIGN candidat. GOQA précédent restevalide,poursuivre sans nouveauplan
niGOderoutine ; si lesmétadonnées ownenvelopeCodec changent en sourceR3,leparent
fournira un complémentDATAseulement(nouveaushashs),pasl'implémentation.
Source doit respectercesrègles,pas imposerunepréimage nondocumentée n'accepter
unepolicyrefinexistante. Toutecorrectionen siblingR3,priorR2intact,newV/gates
parentexigéesavant intégration. Pascompiler/test/run/validator/OS/native/full44.
