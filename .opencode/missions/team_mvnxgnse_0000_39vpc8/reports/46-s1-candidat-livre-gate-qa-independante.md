# M2 — 46 : candidat S1 livré et vérifié, QA API indépendante suivante

## Identité et preuves parent

Candidat interne D=.tmp/m2-s1-candidate-r2, sources sous D/tools/ff8-harness. Le parent reconstruit puis persiste le manifeste final : **47 fichiers / 1177022 octets**, SHA `58e8e422ff0a350ff975692d21bfd131236fd3ee49555eeceb37f5a6780d1610`. [Manifeste](../evidence/s1-final-manifest-r2.json) et [reçu de livraison](../evidence/s1-candidate-r2-delivery-verification.json).

Seuls deux fichiers produit modifiés par rapport à la projection : envelope.ts et son schéma. Projection/prepare/run-v3 inchangés, 37 supports protégés conformes ; cinq fichiers auteur ajoutés. Le parent a vérifié chaque source du manifeste et les dix paths suivis dans chacun des deux derniers reçus contre les bytes actuels : zéro écart. Les sept documents contractuels sont référencés par leurs hashes dans le reçu parent.

- **author14-typecheck : exit0, aucun diagnostic,1793ms**. C'est le typing final acquis ; les author10/12/13 rouges sont conservés, pas renommés en succès.
- **author15-all : exit0,72PASS/0FAIL/237assertions**,1562ms. Les logs/hashes correspondent aux reçus et aux bytes finaux, dont le test supplémentaire de gel/détachement. Aucun rejeu parent.
- Ledger conservé :9tests/6typings/18542ms, aucun incident/timeout/signal ; extensions typing44/45 explicites, pas de compteur effacé.

Les 47 fichiers candidats sont gelés RO par le parent, sans toucher aux sources canoniques ou aux gels historiques. Les contrôles parent (runner/config/bytes Bun) sont identifiés séparément, pas dissimulés dans le manifeste core. Namespace QA neuf interne `.tmp/m2-s1-qa-r2` réservé, pas de test QA exécuté.

## Décision

Le parent accepte **la livraison du candidat et les preuves auteur ciblées**, ce qui permet de clore la tâche d'implémentation0009 et d'admettre la QA API000a prévue. Cela ne vaut **pas acceptation S1, intégration canonique ou clôture M2**. Les vertes auteur ne remplacent pas l'oracle indépendant.

QA en session fraîche : partir du contrat ratifié01–07 et des interfaces publiques, définir les attentes/scénarios avant lecture des détails d'implémentation. Ne pas copier les fixtures, goldens ou attendus `test/s1-author` pour fabriquer l'oracle QA. Réutiliser les preuves recevables de dépendances, typing final et tests auteur dans leur portée ; couvrir distinctement les obligations API encore à établir, pas maximiser un taux abstrait.

La première phase QA sera un plan borné de risques/preuves/fixtures/commandes/ownership ; aucun test ou écriture avant approbation des permissions et du budget. Pas d'import producteur/store/client/DB involontaire, pas de replay numeric/planner ou reprise des trois checks globaux sur ce fragment isolé. Un nouveau défaut concret déclenche une correction et contrôle d'impact, pas un pipeline universel.

## Reste

QA API S1, intégration et frontières affectées, S2–S4, L7 indépendant/L9/L10 et parcours public restent ouverts. Les trois checks consolidés M2 sont NON EXÉCUTÉS. Aucun commit/merge/push/cleanup, C#, DB/native/live/IDA/Docker ou nouvelle permission globale.

## Admissions utiles effectives

Implémentation0009 close par le parent comme **livraison candidate vérifiée**, débloquant000a ; arrêt normal demandé à l'auteur et à l'ancien reviewer contractuel, sans nettoyage ou Git. Ni ce statut ni leurs éventuelles anciennes réserves ne remplacent la QA.

`s1-api-qa-r2` admis sur000a en session fraîche `ses_e860de5e7ffeDhHeTIN1I7ijp7`, plan_approval, lecture seule initialement et écritures futures réservées au namespace QA distinct. GET natif confirme `openai/gpt-6.1-sol`, variant `xhigh`, statutbusy observé. Attentes contractuelles avant détails d'implémentation ; pas d'exposition des oracles auteur. Aucun test QA encore exécuté.

Une seconde tâche déjà READY et indépendante est préparée en parallèle : L7 `000e`, désormais réellement réattribuée à `l7-scenarios-r2` fresh `ses_e860c8796ffeMVd2moCCtTqHWW` sans contexte de l'auteur contrat refusé au rapport38. GET natif confirme Solhigh, busy observé. But borné : scénarios/oracles tirés des contrats, réutilisation des preuves et plan des seuls compléments requis ; pas d'exécution L7/L9/L10 ou DB/native à ce stade, ni nouveau simulateur/framework. L'exécution sur candidat intégré restera derrière ses dépendances S2–S4.

Les deux admissions utilisent le catalogue gouverné sans modèle/reasoning override de spawn. Elles ne créent ni pool permanent ni pipeline supplémentaire : QA S1 et préparation L7 sont deux obligations existantes, objectifs et sorties disjoints. Réattribuer la tâche L7 originale est devenu possible après le shutdown de l'auteur, sans fausse complétion ni nouvelle tâche duplicative.
