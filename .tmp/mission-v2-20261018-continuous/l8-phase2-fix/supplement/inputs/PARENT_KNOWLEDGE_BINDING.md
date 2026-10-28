# Complément parent R1 — delta de connaissance déjà établi, pas delta inventé

Décision en réponseàlaquestionducorrecteur:retenir la variante transition de
connaissance DÉJÀ COMMISE avec toRevision=K courant (ou no-op vérifié K→K).
Ne pas faire de chaqueactivation une fausse nouvelletransition K→K+1 et ne
pas insérerdesfaits nonvides pour satisfaire un compteur. planAdoption
(lineage.ts:653–662) n'applique AUCUNknowledgeDelta;son gate ne créepas cette
obligation decommitter unnouveaudelta. assessKnowledgeDelta:219–236 régit
l'ADMISSION d'undelta,pas l'applicationrépétée d'undelta déjàcommis.

1. Candidate.sourceKnowledge/planning/admission sont tous liésàl'étatK
   réellementcourant/aprèspublicationsdrainées. SiK avance,le candidate
   immuable est remplacé SOUSbarrièrecontinue comme déjàdécidé(R1),avec
   nouvelles sourcesvraies et nouveauxdigests;pas recopie desversions.
2. FinalAdoption dansActivationAttempt référence unknowledgeTransitionWitness
   trusted horsJSON/référence immutable de provenance:delta exact/historique
   J→K déjàcommis au logautoritatif OUemptydelta K→K vérifié sans incrément.
   Le doc adoptionfromRevision/toRevision reprendcesrévisions,niheadCAS ni
   nouveaucompteurdenombredeproposals. Le champ/propriétéwitness est proposé
   dans recordprivé/codeportfutur,pas ajouté au schematransport existant.
3. Pour J→K nonempty: vérifierpreuvehistorique decommitexact/hash etadmission
   au contexteJ,ycomprisfromRevision J alorscourant;nepas réadmettrele delta
   avec currentRevision=K. Résoudre le witnesssurvrai backendtrusted avec
   candidat/head/fence/rootknowledgehashKcourant comme précondition àT2.
4. Pour emptyK→K:lesensemblesdu delta sont réellementvides,knowledgehash/source
   avant/après égaux;witness no-op issu du backend après lectureexacte duroot,
   bound au cas/candidat/fence/révision etvérifié auCAS. Aucune callerboolean,
   aucun JSONselfhash ne produitcewitness. Rien n'incrémenteK pourfaire joli.
5. T2commitatomiquement activationhead/attemptfinal/statuts/provenances/root
   nécessaires,mais NEréappliquePASce delta et NEmodifiePASlesfacts de
   connaissanceK. Le nouveauruntime démarre ainsiavec exactementle K lié
   àson origine/admission,non uneorigine aussitôt périmée àK+1.
6. Un futurmode qui voudrait stageddeltaK→K+1 exigerait uncontratdistinct de
   projectedKnowledge/planningavantcommit,qui n'est PAS livréparcecorrectif.
   Pasd'ambiguïtéentrecessémantiquesdans E/D/Q. Ajouteroracles Kcurrentstable
   àT2/historicaldelta nonréappliqué/no-op sansincrément/stalewitness refusé,
   etdrainquiavanceKexigeant replacement sousbarrière.

Bootstrap/transitionA n'utilisentpas de docadoptionB et ne fabriquentpas ce
witnessB. B conserveHOST-only/lineage/proofsfinals;nativefermée. Le backend
fixtureS2doit implémentercesvérifications vraies sursaOWN,pasles prétendre
déjàlivrées. Aucun budget/cap/sourcecentral/runtime/git oucontratupstream changé.
