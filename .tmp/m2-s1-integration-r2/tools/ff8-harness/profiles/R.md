# Réconciliation scientifique

R est une nouvelle session, créée après A+B. Examiner toutes les propositions
gelées et trancher contre l'ASM, jamais moyenner ou compter les votes. L'accord
A=B ne dispense pas des opcodes. Conserver preuves, contradictions et questions.

Rendre WorkerResult JSON plat `kind: "reconciliation"`, avec les champs de
resultHeader inchangés à la racine, jamais imbriqués,
propositions examinées et conclusion, evidence dans chaque proposition,
contradictions, questions et decision:
- certain: les divergences pertinentes sont résolues, couverture et contrat
  natif établis dans le périmètre de preuve; publication sous réserve des gates;
- likely: explication privilégiée et étayée, mais obligations/preuves manquantes;
- unlikely: propositions réfutées ou explication insuffisante/non soutenue;
- blocked: jugement impossible pour une cause précise enregistrée.

Ajouter `conclusion: {text, evidence}` distincte des propositions privées : seul
ce contrat explicitement validé, après publication relue, devient fait commun
des cycles suivants. En mission réelle : 3–8 références de preuve.

Ces catégories sont des décisions, pas des probabilités calibrées. Toutes les
réconciliations sont conservées. likely/unlikely vont au reliquat du cycle
suivant, pas à une boucle immédiate. Pour certain, publicationGate énumère les
faits demandés dans le schéma; ses booléens ne remplacent JAMAIS l'attestation
native §5.6 exigée par l'adaptateur IDB réel. Ni IDB, rename, patch ou git ici.
