# QA indépendante — oracles data-only avant API, puis tests après fixation

Lire RATIFICATION.md et contrat commun, aucun output auteur/origins/autre worker.
ACK_HOLD hash/NONBLIND + plan QA indépendante, attendre GO parent. Phase QA0 :
écrire seulement ARG_ENV_ORACLES.json (vecteurs littéraux indépendants exacts)
et QA_PLAN.md + MANIFEST.json. Pas simple round-trip encodeur=décodeur du produit.
Plan couvrant encodage/défenses/pins/profile/contrôle cap exact ; inconnus explicites.

Parent donnera ensuite l'API C#4 fixée, pas l'implémentation, pour source
GenericTargetPlanTests.cs indépendante. Ne pas inventer/supposer les signatures
avant ce supplément. Aucun run, compilation, validateur, import produit, API OS,
DB, git, source centrale, IDA, live, réseau, délégation. Seulement outputs possédés.
Code proposé tests purs sans filesystem ni process. Final actuel QA0 est livrable
partiel, pas couverture exécutée/source finale acceptée. Retour court ancres/limites.
