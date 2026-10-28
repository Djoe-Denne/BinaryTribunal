# GO QA R2 — cinq défauts V + petite API commune, pas accès source auteur

Task/owner existants : task_mvdyy9ti_001i_4pvgrf / l8-pure-factoring-qa-r1.
Lire seulement ce supplément et références déjàpinnées/propresoutputs. R1
archivée l8-pure-factoring-qa-r1-frozen ; ne pas la changer. GO fix3outputs QA
possédés, pas main/produit/compile/test/run/validator/git/DB/OS/teamtools.

1. receiptBase(:325) dans un describe n'est pas visible au suivant(:391).
   Remonter le builder DATA à portée commune ou fournir helperlocal équivalent,
   pas de référence nonrésolue. byModel.m=estimate()(:394) doit perdre UNIQUEMENT
   sa propriété version ; le niveau byModel autorise A/B/R/validation, la version
   de l'estimate parent reste requise. Ne pas changer validatePlannerPolicy.
2. Positifs worker/compte(:428–451) : créer les vrais comptes correspondants via
   forme du validateur pinné, aucun worker→a avec accounts[]. Le prétendu
   négatif2workersIDs distincts sur compte existant est un positif de ce codec.
   Préserver ce positif et pour un vrai négatif muter un accountId vers un absent.
3. Spreads unknown(:549–561) : types explicites des champs de fixtures connues
   ou assertions locales justifiées, sans changement de scénario/guards. Arrays
   unknown[]→AnyRecord directs(:276/858) : enlever casts incompatibles, p.ex.
   Object.defineProperty d'une propriété extra ENUMERABLE pour même négatif.
   Ne pas présenter ces objets malformés négatifs comme données valides.
4. HUIT appels assertAdmissionBudgetBinding(:710–736) : signature réelle
   (plan,sidecar,expectedContext), pas objet enveloppe unique. Chaque fixture
   fournit3arguments ; aucun undefinedaccidentel qui masquerait le guard ciblé.
   toThrow/message spécifique et, pourProxy, arguments/counters ciblesréels.
   Pas de broadcatch/expect.anything qui ferait passer un mauvais motif.
5. isSerializableProposalData(new Proxy({},{}))(:852–859) rendtrue sous le body
   legacy (pas utilTypes.isProxy). Corriger cet oracle et son libellé ; ne PAS
   ajouter un nouveau guard à lineagepour faire passer le mauvais test. Les
   accessor/symbole/sparse/cycle restentleurspropres cas. Trustedcode/loader
   est la frontière retenue, aucune garantie contre importeurJS mutateur.

## Extension API commune source R2 (spécification, pas implémentation auteur)

Dans graph-pure-codecs, ajouter validatePlanningBindingV1, même signature logique
que validatePlanning mais partition structurelle {partitionId}, source optionnelle
avec vrais champs {context,allocation}, snapshot COMPLET GraphSnapshotV1.
Le wrapper historique validatePlanning garde son ancienne signature et transmet
les QUATRE refs arguments au cœur, sans lire/extraire de propriétés en avance.
Pas de nouveau export dans graph-pipeline. Corps/guards communs identiques.
Types exacts : PlanningPartitionBindingV1=Pick<ClusterPartition,"partitionId"> ;
PlanningAdmissionBindingV1=Pick<GraphAdmissionSource,"context"|"allocation">.
Nouvelle fonction asserts value is PlannerResult. Ce cœur n'admet pas une source
v2 ni une partitionB à lui seul : S1 fera la validation B/fullsource dédiée.

Ajouter test heap-only MINIMAL de disponibilité et guardordre identique entre
wrapper/cœur sur entrée invalide précoce, partition/source instrumentées dont
getters ne doivent pas être lus avant ce refus. Aucun faux positif B ou fake
sourcev1 pour tester le cœur. Paspositifcomplexnouveau/recopiecore/planner run.

Conserver57tests R1 sauf renommage/ajouts minimauxjustifiés, ne pas supprimer
des négatifs corrects ni modifierproduit. Source/QA R2 Vdeltafresh ensuite, aucune
couverture exécutée. QA_PLAN/MANIFEST provenance/hashes+rehash36pins et nouveaux
suppléments. RetourNATIF final hashes/tailles/diff/ancres/limites, parentseulclôture.
