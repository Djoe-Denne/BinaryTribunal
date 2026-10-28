# L8 — deux schémas candidats isolés

Autorité : binding l8-parser-b-binding-20261018-r1 adopté comme BASE DE DESIGN
dans L8ParserBRatification20261018, pas une ratification C3-C5 ou G7.
L'extrait parent BINDING_PROVENANCE.json conserve le hash du registre source.
Les schémas et sources existants sont des snapshots en lecture seule.

Ownership : uniquement les nouveaux fichiers dans l8-schema-source/outputs :
l8-prepared-graph-v3.schema.json, l8-partition-adoption-v1.schema.json,
DESIGN.md (mapping champ→contrat/source:ligne/limite) et MANIFEST.json.
Aucun fichier tools/ff8-harness, schéma existant, loader, code central, config,
registre, historique ou tâche étrangère ne peut être écrit. Cette source
candidate ne résout pas l'ownership central l8-integration-r1, qui reste bloqué.

Phases : ACK-HOLD hashes+contrat ; GO parent de lecture/plan ; mapping exact
proposé avant écriture ; approbation explicite parent ; livraison ; review fresh.
NONBLIND déclaré. Ne pas finaliser la tâche sur le seul ACK/plan intermédiaire.

Exigences : nouveaux $id selon conventions réelles, contrats stricts versionnés,
ne pas modifier le v1 stocké (adopted reste false dans ces chemins), pas de cast B
en L3, pas de localReceipt présenté comme autorité HOST. Branch A et B doivent
rester distinctes conformément au binding, avec groupes aux noms réels et
provenance/révisions/acteur/inventaire reliés aux structures du code.
Séparer syntaxe JSON/schema et invariants relationnels nécessitant code/reçus ;
ne jamais prétendre qu'un schéma seul vérifie un digest, une signature, une
quiescence, une autorité ou une relation cross-document. Distinguer contrainte
proposée (ex. lowercase hex) de contrat réellement imposé par les vieux schémas.

Ce qui n'est pas fixé par le binding doit être signalé dans le plan, avec
options et ancres ; aucune migration/champ/obligation d'autorité inventée.
Si référence absente ou dérive input, HOLD puis demande au parent. Pas de
copie de contexte d'un autre worker ou accès aux outputs voisins/index.

Workers : pas de build, tests, import produit, exécution/API native, DB,
processus, réseau, IDA/live, git, registre, configuration ou délégation.
Lecture/hash et parsing JSON des seuls fichiers autorisés ne constituent pas
un run produit ; pas de compilation ou validateur externe. Un seul auteur,
une tentative ; corrections et revue delta nécessitent disposition séparée.

Routage grille r1 sans override : complexité60, risque60, groupe standard.
Review future fresh : complexité65, risque75, groupe strong.
Livrable = proposition source seulement, jamais acceptance L8, C3-C5 ou G7.
