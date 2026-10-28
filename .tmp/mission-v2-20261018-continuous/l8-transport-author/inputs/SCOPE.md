# L8 phase1B — source transport, sans exécution ni autorité

Ownership: outputs/graph-transport.ts, DESIGN.md, MANIFEST.json de ce paquet
uniquement. Destinataire futur src/graph-transport.ts. Schémas acceptés byte-exacts
fd4cdd41/c6c60ab6 seront installés par parent ; ne pas les modifier. Parent possède
la phase1A baseline15, fichiers disjoints ; pas de changement domain/cli/loader/
lineage/graph-store/planner/validation/package ni runtimeB/C3-C5.

Accès/hash inputs autorisé d'abord. ACK effectif+NONBLIND et PLAN API/erreurs/
invariants/ressources au parent, puis GO code. Pas de livrable final au simple ACK.
Proposer une frontière pure, noms d'API/types stables afin que QA fresh puisse
écrire ses tests sans voir votre implémentation. Le parent arbitrera avant code.

But: décoder les deux nouveaux transports fermés, préserver lossless la donnée
et fournir inspection séparée de forme, cohérence et admissibilité; A/B v3 ne
sont JAMAIS PreparedGraphV1/V2 ni un run. Aucun cast B vers ClusterPartition A.
Réutiliser strict schema subset existant sans copier un validateur divergent,
et inspectProposalEvidence pour le statut indépendant quand applicable. Expliquer
les effets/imports nécessaires; lecture des schémas par mécanisme existant permise
au produit futur mais aucune DB/native/network/process/Store. Préférer pas de
nouvelle dépendance. Ne pas exporter une fonction d'activation/adoption/HOST.

Invariants: root.partition==evidence.result.partition, jointures group/community,
snapshot/config/lineage identités, lowerhex là où le contrat l'exige; A sans
evidence doit rester distinct de B evidence obligatoire. Diagnostics/raw strings
négatifs se transportent sans nettoyage; wellFormed=true/admissible=false doit
être représentable et ne devient pas rejeté pour un critère d'adoption global.
Historique previous/authoritative.adopted boolean; primaires false. Retenir
kernel/context/owned IDs et lossless metrics. Ne pas ajouter un resserrement de
schema ou un nouveau contrat non ratifié: ambiguïté précise => parent.

Doc adoption: forme validée ≠ HOST/Q. hostReceiptRef même nonvide n'est qu'une
référence non résolue, inventaire/proofs JSON non authentifiés; aucune fonction
ne les transforme en authority/capability/localReceipt ou planAdoption trusted.
Pas de flip putPartition, aucune mutation d'entrée ou de DB. Décrire où s'arrête
l'inspection et ce qui exige les futures capacités trusted du parent/L6.

Code/test/scénarios seulement écrits comme texte. Interdit import/eval/compile/
test/run produit/validateur,processusOS/DB/natif/git/registre/IDA/live/réseau/
délégation; pas de lecture origins ou code hors paquet. Parsing/hash/calcul des
données permis. Source candidate revue fresh puis parent seul typecheck/test sous
gates distinctes. Livrer 3 fichiers, manifest tailles+SHA,3–8ancres et limites,
rehash input final. Ne pas prendre la copie frozen d'un candidat pour acceptance.
