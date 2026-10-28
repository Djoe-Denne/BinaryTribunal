# L8 delta r1 — unique correction mécanique autorisable

Disposition parent après review fresh CORRIGE task_mvdn0v6f_002e_dz6iwd :
les défauts R1/R1bis/R2 sont confirmés directement en sources. Un cycle unique
de correction isolée puis re-review fresh est autorisable ; si la re-review
échoue, HOLD sans nouvelle boucle automatique. Pas un repli modèle/provider.
Gel initial 4 fichiers conservé, jamais modifié ; aucun fichier central touché.

## Modifications EXACTES du seul schéma préparé

Notation : chemins d'INSTANCE, à convertir en chemins de nœuds de schéma via
properties/items. Aucun changement d'autres keywords/nœuds de validation.

R1 / R1bis : sur ces DEUX nœuds historiques seulement, supprimer enum[false],
garder type boolean, remplacer la description de tightening par miroir v1
historique ; ne transformer aucune donnée historique :
- $.proposalEvidence.source.previous.partition.adopted
- $.proposalEvidence.source.previous.authoritative.partition.adopted
Les descriptions des conteneurs historiques doivent cesser de les présenter
comme une copie contrainte du résultat préparé courant.
Garder enum[false] sur $.partition.adopted ET
$.proposalEvidence.result.partition.adopted.
Justification lineage.ts:496-502,991-997,1064-1080 : lifecycle historique boolean,
result courant false:1037 ; le fingerprint:900 normalise sans changer l'histoire.

R2 : supprimer minLength et maxLength sur exactement DIX nœuds string d'entrée :
1–2 $.proposalEvidence.source.constraints[].leftId/rightId ;
3–5 $.proposalEvidence.source.constraints[].provenance.moduleSha256/sourceHash/evidenceSha256 ;
6–7 $.proposalEvidence.source.snapshot.edges[].sourceId/destinationId ;
8–10 $.proposalEvidence.source.snapshot.edges[].sites[].provenance.moduleSha256/sourceHash/evidenceSha256.
Garder type string ; descriptions : source brute conservée y compris rejet,
membership/provenanceReady sont évaluations scientifiques ultérieures, pas
préconditions de longueur du transport. Les autres champs de provenance sont
déjà plain string/string|null (aucun enum/minLength à changer).
Ne pas retirer les 64/64 des vrais fingerprints calculés, des partitions v1 ou
d'autres objets ; ne pas changer config/nodeIDs/constraints kind ou validation.
Justification lineage.ts:952-955,1041-1045,1053-1058 et semantic-index.ts:646-656,
945-955,1098-1107,1215-1219 : forme string distincte de readiness/membership,
les sources négatives/rejets/diagnostics restent sérialisés pour replay.

## Trois autres sorties

Copier l8-partition-adoption-v1.schema.json BYTE-IDENTIQUE à l'original :
12396B SHA c6c60ab6c00f4720d58b893ac806e0e9603ee1eaeab8c49d6343eec0f36dae0e.
Pas de fix d'adoption requis ni autorisé dans ce delta.
DESIGN.md : corriger les passages R1/R2, distinguer partition primaire/courante
false et historique boolean, domaine source négative vs sorties/fingerprints
scientifiquement valides ; ajout section delta R1/R1bis/R2 + 3–8 ancres. Toutes
limites antérieures HOST/quiescence/subset/k1/A|B/central non intégré restent.
MANIFEST.json : actualiser hashes, source/delta-input refs et état SOURCE_DELTA
UNREVIEWED_UNINTEGRATED, pas de faux self-hash ni d'acceptance.

Outputs exclusifs l8-schema-delta-r1/outputs : mêmes 4 noms, aucun cinquième
fichier. Un tableau de diff des chemins de validation autorisés peut figurer
dans DESIGN/MANIFEST. Parsing/comparaison JSON en données permis, pas tests
d'instances, validateur externe/maison, import produit/build/run ou natif.

## Procédure

ACK-HOLD hashes/contrat, pas d'analyse ou source avant GO natif distinct. Le plan
de transformation est entièrement déterminé ci-dessus ; confirmer simplement
la capacité de respecter ces chemins et signaler toute anomalie avant d'élargir.
Après GO : patch/données sur copies outputs neuves uniquement ; gel final et
hashes4sorties, rehash inputs, rapport court. Tous origins hors paquet interdits.
Pas de git/registre/config/DB/IDA/live/réseau/délégation/central. Une tentative,
aucun retry/fallback automatique. Review fresh strong distincte obligatoire.
