# Clarification parent R2 — flag -r, sans réécrire le pin API R1

Source candidate result_mvdze979_001s_i9shq3 lue, pas acceptée. R1 source +
DESIGN/MANIFEST conservés avant correction. Le texte parent R1 était ambigu dans
sa parenthèse, mais «flags exacts ... et -r» incluait bien `-r` nu.

Décision commune opposable au source et à QA1 : TryBuild doit refuser exactement
`-r` OU les formes commençant par `-r=` (comparaison Ordinal, comme flags fixés),
avec BadArgv et sorties d'échec habituelles. `-rmodule` n'est PAS refusé par cette
règle précise ; pas de blanket StartsWith("-r"). Long flags fixés inchangés,
`--no-env-file` toujours permis. Les codecs primitifs continuent à ENCODER ces
chaînes ; la règle de refus appartient à TryBuild, pas au quoter.

GO delta source dans les trois outputs auteur seulement : ajouter l'égalité
Ordinal de `-r` au prédicat qui refuse déjà `-r=`, corriger commentaires/DESIGN
et manifest/provenance. Pas d'autre API/layout/cap/algorithme modifié. Référencer
le hash de ce supplément en plus du pin API R1 intact. Remonter ambiguïtés avant
implémentation la prochaine fois, pas attendre une note après code.

QA1 reçoit cette clarification uniquement, jamais code auteur. Négatifs TryBuild
`-r`, `-r=fixture`, positifs quoter des mêmes chaînes ; absence d'interdiction
nouvelle `-rfixture` selon cette règle versionnée. Aucun launch/target réel qualifié,
la fermeture effective exige toujours exact image/argv/env/ownership du host futur.
R2 = résolution d'ambiguïté data-only, pas hausse, fallback ou run autorisé.
