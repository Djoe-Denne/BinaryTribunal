# QA1 source C#4 indépendante — API fixée et oracles pinnés, pas implémentation

Objectif : GenericTargetPlanTests.cs + QA_PLAN.md + MANIFEST.json sous outputs.
API_FIXED_R1.md est l'autorité exacte, QA0 acceptée partielle fournit les oracles
de codec : aucun champ Intent/TimeProfile/Version arbitraire à inventer. GO source
après ACK_HOLD hash/NONBLIND+plan. Aucune lecture implémentation auteur/origins.

Code C#4/.NET4, namespace ReGraph.GuardV3. Entry `internal static class
GenericTargetPlanTests` avec `internal static int Main(string[] args)` pour futur
csc /main explicite. Petits helpers Assert comptés, output Console borné<=1024B
au total (codes courts, pas dumps argv/env/bytes), return0 si assertions toutes
vraies,1 sinon. Pas package test framework. Rien exécuté/compilé par le worker.
Pas File/Stream/Process/PInvoke/Job/OS/Thread/clock/réseau/DB, pas trusted authority.
SHA256 mémoire et data heap-only permis dans CODE proposé. Console est uniquement
le rapport court de cette suite après gate parent, pas un writer full44 qualifié.

GOLDEN_DATA.json : golden parent indépendant de l'implémentation, produit par
encodage DATA_ONLY de la recette API fixée. Reprendre la fixture dans le code et
des bytes/hex/SHA littéraux, pas génération d'attendus depuis le codec sous test
ni roundtrip comme oracle unique. Tests ne lisent pas ce JSON au runtime : embed
les valeurs nécessaires dans la source. Ce golden ne prouve aucun produit exécuté.

Couverture minimale :
- argv/env positifs exacts QA0 corrigés, limites128/129, cmd32766/32767 et
  env32767/32768 CODEC-only ; NUL/controls/surrogate/refus et tri vs doublons ;
- TryBuild positif data fixture/imagepin explicite et allowlist/metadata réels,
  canonical bytes/Intent/compteurs exacts au golden, tags/profil constants ;
- contrôle actual32767/32768/32769 via padding d'un artifact supplémentaire.
  Ne pas faire varier autre chose ni tester une fausse propriété d'entier déclaré.
  La longueur du record reste constante pour cette variation de payload : table
  lengths+SHA32 seulement. Assertions séparées sur canonical+sum des vrais bytes.
- alias input/output y compris nested bytes et tableaux metadata, repeatedsource
  SHA sous labels différents permis, labeldupliqué/imagepinmismatch refusés ;
- ordre/failure outputs et raisons de refus de TryBuild : partir d'une fixture
  valide, muter UN champ à la fois, aucun positif refusé pour éviter une faute ;
- allowlist explicite/noinherit/deny Q1 et flags exacts fixés ; codecs primitifs
  restent indépendants de cette politique. --no-env-file permis ;
- null/invalid context/codecs/arrays ; mode0/15 ; roots/SourcePins bounds, zeroB
  source nonimage permise. Pas de réflexion pour fabriquer CaseIdentity invalide :
  frozen ctor rejette déjà ces entrées ; Identity null est un test TryBuild réel.

Conserver U7 doc absent comme déclaration seulement ; pas aller le chercher.
Si ambiguïté réelle API/oracle → parent avant invention. Les refus additionnels
restent à adjudication. Matrice tests/attendus/limites dans QA_PLAN, pas couverture
exécutée. MANIFEST inputs/outputsha/tailles/selfhashdétaché. Aucun git/registre/
IDA/live/délégation/teamtools/claim/complete. Rendu NATIF final. Fresh V composé
sur source auteur+source QA ensuite ; parent seul compile et run sous gates séparées.
