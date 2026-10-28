# GO source R2 — frontière trusted + planning binding commun minimal

Task/owner : task_mvdyjxje_0014_wq2jrc / l8-pure-factoring-author-r1.
R1frozen l8-pure-factoring-r1-frozen est intangible. V R1 source+QA CORRIGE,
pas code accepté ; QA défauts routés à owner disjoint. Pas d'accès QAoutputs.

SourceR2 autorisée UNIQUEMENT outputs/src/graph-pure-codecs.ts + DESIGN.md et
MANIFEST.json, autres10candidats R1 byte-identiques. Aucun mainedit/compile/run/
validator/produit/DB/OS/git/IDA/live/réseau/délégation/teamtools/claim/complete.

1. Documenter explicitement code/module-loader TRUSTED,pinné,sansimporteurJS
   nontrusted ni mutation de schemas partagés. Consommateurs trusted ne mutent
   pas cache JSON/PARTITION_SCHEMA. Pas de garantie contre l'importeur qui
   ajoute régimeC ; aucun bypassJSON-only identifié,pasLOCAL/HOST authority.
   FS→JSON a ce delta de partage en plus du timing. PASfreeze/clone nouveau
   ou modification runtime schema choisie ici. Voir adjudication parent V R1.

2. Préflight S1 justifié : extraire un cœur de binding planning minimal, sans
   castB→A ni fausseAdmissionSourcev1. API fixée :
```
export type PlanningPartitionBindingV1 = Pick<ClusterPartition, "partitionId">;
export type PlanningAdmissionBindingV1 = Pick<GraphAdmissionSource, "context" | "allocation">;
export function validatePlanningBindingV1(value: unknown, snapshot: GraphSnapshotV1,
  partition: PlanningPartitionBindingV1, source?: PlanningAdmissionBindingV1):
  asserts value is PlannerResult;
```
   Son BLOC de corps est celui de validatePlanning R1, mêmes guards/messages/ordre,
   données scientifiques calculées depuis le snapshotCOMPLET. Seules signature/
   nom changent. Ancien validatePlanning garde EXACTEMENT ses types/signature
   A/v1 et devient wrapper minimal :
```
validatePlanningBindingV1(value, snapshot, partition, source);
```
   Transmettre refs originales directement : PAS objets {partitionId:...} ou
   {context:...,allocation:...} construits dans le wrapper, qui liraient getters
   AVANT les anciens guards. Pas nouvelle shapecheck avant refus précoce.
   Aucun export ajouté dans ancien graph-pipeline ; pas de changement au parser
   A ou parseAdmissionSourcev1. S1 seul validera ses documents complets v2/B puis
   fournira ses VRAIS champs structurels au cœur, pas création d'un faux A.

3. Inventaire/mapping R2 : distinguer ce nouveau cœur/wrapper+types (extension
   explicite parent) des93mappings historiques R1. Prouver blocBodyold→newcore
   textidentique, corps des autresdefs préservés. Pas prétention93unchanged pour
   la nouvelle signature. Imports supplémentaires type-only, aucune dépendance
   valeur ou algorithme/planner invocation. MANIFEST inclut delta before/R1.

RetourNATIF sourceR2proposée+hashs/37pins/suppléments/ancres/diff/limites. Puis
VdeltaFRESH composé source+QA et parentgates ; S1codeHOLD jusqu'au repinqualifié.
