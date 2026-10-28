# PLAN ONLY — contrat public commun S1 final, pas de GO source/QA

GO direct ACK+PLAN complet en UNE réponse finale. Lecture/hash/parsing du packet
seul ; aucun accès origine, aucune écriture, aucune exécution.

## État des prérequis (pinnés dans ce packet)

- Recherche S1 close : result_mvfhmdpx (R1), result_mvfidupq (R2), finalisation
  result_mvfixg0l / msg_155301299001lGK4njCJ1lw7Cn acceptée comme recherche
  uniquement (`PARENT_RESEARCH_ACCEPTANCE.json` — correction parent : non-injectivité
  nativeModelRef→label NON ratifiée ; plusieurs labels root explicites peuvent
  partager un même Ref exact, immuable, fourni indépendamment, sans alias inventé).
- Direction root slot option A ratifiée (`PARENT_ROOT_DIRECTION.md` +
  `PARENT_ROOT_ADJUDICATION.json`) : grants acquis explicites par slot
  (fonction/rôle/pass 1), cap et débit root immuables, Cunit courant ≤ grant,
  budgets L5 courant et débit root distincts, aucun crédit par repacking ;
  S1 = cohérence de données, jamais preuve d'acquisition/auth (S2 obligatoire).
- Dépendance planner désormais QUALIFIÉE offline : R2 complétion 415 tests /
  17 077 assertions / 13 fichiers, FULL RAW identique, TSC strict complet
  (`qualified/planner-*`). Sources gelées fournies (`qualified/planner-R2-frozen/`).
- Source numeric/context R2 gelée statiquement acceptée
  (`qualified/numeric-context-R2-frozen/`) — comportement PAS encore qualifié ;
  les 450 paires restent non exécutées. Le contrat peut référencer ces types,
  mais aucune direction S1 ne peut présumer une qualification numérique acquise.

## Livrable attendu (PLAN, pas d'implémentation)

Le schéma/API public commun minimal S1, champ par champ, fermé :

1. RootSlotGrantsV1 / RootModelBindingsV1 / KnowledgeMaterializationV1.provenance
   (directions déjà proposées dans `PARENT_ROOT_DIRECTION.md` et la recherche
   finale) — types fermés, joins exacts, ByteRefs/BoundDocuments, null
   inspectables, négatifs API-only, domaines de hashes distincts.
2. Placement exact dans les types existants (RootLimitsV1, T0, enveloppe) :
   décider champ par champ ; séparer DÉCIDÉ parent / PROPOSé / BLOCK.
3. Joins vers les sources qualifiées : planner (sub-intents, estimates,
   resources, G3, pipelineCost) et numeric/context (partition, communautés,
   métriques) — références par ByteRef vers les sources gelées pinnées ici,
   jamais réimport ou rejeu de producteur.
4. Ce qui reste BLOCK précis : acquisition bootstrap réelle/records S2,
   qualification numérique, closure complète des codecs à pinner avant
   ratification ; ne rien fabriquer depuis Cf/max/shape/hash.

## Interdits

Aucune écriture, compilation, import produit, test, Bun, OS, DB, git, IDA, live,
réseau, délégation, team tools, task close. Aucun GO source/QA/implémentation.
Pas de réécriture des propositions antérieures ; raffiner vers le contrat final
minimal ratifiable. Toute donnée réellement manquante → BLOCK précis.

## Format final

PLAN complet en une réponse : types fermés (blocs de code), table décisions
DÉCIDÉ/PROPOSÉ/BLOCK, 3–8 ancres `chemin:ligne` par pilier, négatifs API-only,
limites et prérequis de ratification. Rehash bookend du packet (50 pins,
981 990 B, RAW `8092fdbaab01429b1360479dfe047735ae3d46d91cd593f0907544943088ee72`).
