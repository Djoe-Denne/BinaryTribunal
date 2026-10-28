# L2 — dernier blocage générateur ordinaire, RV2FINAL-01

2026-10-14. Revue finale `task_mv8eb18r_00l6_ax23oo`, fresh Sol Max
`ses_ec47ee67dffe4aMPc5sSTVYrb2` : **BLOQUANT,1findingP2**. Tous les anciens
NQA01–08/RV2MAX01–06 exercés sont corrigés ; pas acceptation sur189testsverts.
Gel L2FINAL343manifestf3402be1 inchangé, V4341/OLD32 également intacts.

## Défaut et preuve indépendante parent

capabilities.ts:110–123,130–143 construit evidence.id='ev:'+object.id et
subjectId=object.id. Le L1 autorise object.id160, mais subjectId/evidence.id128.
Retour raw:228 et cachemiss:294–300 ne vérifient pas la sortie ; hit297 la vérifie.

Fixture ff8-imports-thunks, objet126caractères, nom DDRAW.dll!DirectDrawCreate,
unresolved.referencedObjectId rélié, normalizedFingerprint recalculé vraieprimitive :
inputvalidateur=[], raw1fact avec evidenceid129, candidate refusée maxLength.
Cache **VIDE** : miss retourne/stocke le factinvalide, hit identique le refuse.
Contrôle125→evidence128 passe ;129/160 donnent aussi subjectId>128. Revue a
reproduit table g_PrimDispatch mêmedéfaut. IDs actuels courts ne l'exposent pas,
mais entrée parfaitement légale L1. Pas preseedmalformé, pas défaut scientifique
native ni autorité ; générateur ordinaire réellement touché.

Parent a reproduit125/126/129/160 sur gel final, input[] dans4cas, outputs/miss/hit
ci-dessus. Premièreprobe avait importéwithCapabilities du mauvais module,
TypeError **non preuve** ; corrigée par candidateGraph+fingerprint+validator réel.
Aucun source/gel modifié, aucun test189/full612 rejoué lors de ce diagnostic.

## Contrat de correction ciblée renforcée

SourcecorrecteurSolMAX + reviewSolMAX encoreBLOQUANTS : **Astra Max dernier recours
préautorisé** pour cette tranche finie, nouvelle session possédée, oldgels préservés.
Edit2 capabilities.ts/graph-extract.test.ts ; graph.ts et graph-normalize.ts readonly.
Pas nouvelle schemaL1/bantransport/troncature ou rename des objets/sourceIDs.

Obligations :
- Tout fact renvoyé par raw/cachemiss/hit respecte le vrai L1 et ses bindings.
  Pas cachepollué/erreur retardée au secondappel. Guard final beforeexpose/store.
- IDs de preuves générés bornés, déterministes, collision-safe, citations complètes
  conservées ; pas simpletroncature/nom comme identité ni pertes en Unicode.
- subjectId régional160→128 requiert **arbitrage explicite de représentation**,
  pas permission de changer silencieusement le sens du sujet. Proposer avantwrite
  une projection régioncanonique/lossless avec liaison originelle et versionnement,
  ou une erreur d'impossibilité de représentation claire au niveau featurecaps
  (l'entrée GraphSnapshot restevalide). Le parent choisit ; API nouvelle nonautorisée.
- Conserver association objetoriginal↔seedfonction et module/provenance/citations,
  shortIDpositifs, functionIDs/familles et snapshots historiques inchangés.
- Régressions import/table125/126/128/129/160, Unicodecodepoints, conflits/collisions,
  raw/candidate/cacheVIDEmiss/hit etseedfonctionliée. Tous anciens146tests conservés,
  delta inversible byteexact en mémoire et depsraw343 intactes. Gates proportionnés
  puis review **fresh ciblée**, pasfullreviewinfini189anciensexécutionssansnouveaucode.

## Portée composée de la review finale

189focused+contractPASS/10995expect, typecheck mémoire0diagnostic417transitives
(SDK mainreadonly fallback explicite).31checks capa late,30checks shards shapevalid.
Inventaire485call/8jmp/82IAT/116DRAW/27HUD/263LOT2/5GHOST,493sites physiques ;
mutationscomptes/classes/e2/versions refusées.98raw+originalmanifest79790bef…exact.
Adaptateur7582nodes/30620records/105obj/509unresolved,4divergents/0concordants,
PARTIAL/selfLoopsfalse/oraclefalse. PEboolean historique+octetrehashed resteunknown.
Target/import demeure référenceDÉCLARÉEcitéepasnativecall/IAT/G1 ; gapnon-normatif
assumé, pasbanmetadata inventé. Aucune science/native/L8/G4/G6/G7acceptance.
