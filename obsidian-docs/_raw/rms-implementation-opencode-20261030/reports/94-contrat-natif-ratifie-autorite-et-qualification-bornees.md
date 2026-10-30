# 94. Contrat natif ratifié : autorité distincte, qualification bornée

## Objectif et décision

Le superviseur ratifie la jonction du parcours natif sous les contraintes ci-dessous. Les données v3 et leurs preuves hors ligne restent intactes ; elles ne sont pas promues en autorité native. L'autorisation nouvelle et l'état opérationnel natif appartiennent au GraphStore existant, dans la même base et les mêmes transactions, pas à un second store ou scheduler.

La tâche de contrat est reçue dans cette portée. Cette ratification autorise la préparation d'un plan de réalisation exact, pas l'exécution native, le remplissage de qualifications manquantes ou une déclaration de parcours final réussi.

## Frontières vérifiées et conservées

Le superviseur a corroboré le marqueur privé de store génération fixture et les enveloppes v3 `mode:offline-fixture-v1`, ainsi que les refus runtime et les préconditions de l'observateur au repos. Les handles et fences des composants fixture restent des faits de leurs domaines, jamais une autorité native réutilisée. Les bindings/observateurs v1 et leurs preuves restent inchangés.

Le GraphStore opérationnel utilise ses vrais ControllerAuthority et UnitLease. Le provider parent actuel est étendu de façon compatible pour vérifier une autorisation native réelle. Un document fourni par le worker, une identité synthétique, une copie de source ou un événement public ne peut pas créer cette autorité. Les vérifications portent sur la connexion OWN autorisée et les sources indépendamment chargées.

## Objets et persistance autorisés

- `NativeRuntimeAuthorityV1` : vérification par le provider parent, mission/lineage/root, sources, allocations, révocations, histoire complète des origines et slots. Autorité actuelle relue aux frontières et après append ; refus si provenance ou histoire inconnue.
- `NativeRuntimeBindingV2` : référence les données v3 originales, plan/snapshot et autorité native, avec propriétaire `graph-store-native-v1`. La politique de nouveaux contenus reste nulle uniquement dans le mode explicitement gelé ; cela ne qualifie pas la projection future. Le binding historique v1 n'est pas réinterprété.
- `NativeRootLedgerV1` : continuité de rootAccountId, caps, grants, origines bootstrap comprises, slots et débits antérieurs. Une origine déjà comptée ajoute zéro ; une véritable nouvelle origine ajoute un atomiquement sous le plafond trois. Conserver un head/génération actif et ses révisions/fences dans le même propriétaire, sans activation parallèle permissive ni import d'un head fixture faisant autorité. Historique incomplet ou remise à zéro par copie : refus.
- `NativeRestWireImageV1` : IDs session/message, méthodes/routes fermées, octets UTF-8 exacts des créations/prompts, tailles et empreintes distinctes des domaines payload/admission/body client. `DispatchJoinV1.rpcBodySha256` demeure nul ; aucune empreinte REST ne le remplace.

Trois tables privées additives sont autorisées dans le GraphStore existant : native roots, bindings et operations, avec migration privée versionnée. EventLog conserve les faits liés ; les tables existantes gardent admissions, résultats et commandes. Aucun nouvel espace `g3_*` natif, second store, fichier d'autorité public ou remise à zéro des comptes.

## Parcours de réalisation

1. Lier les données v3 vérifiées à une autorisation native distincte et privée, avec sources relues indépendamment et continuité de root/head vérifiée.
2. Préparer l'exécution avec les primitives existantes de plan/inputs/admission et vrais leases. Dans la même transaction IMMEDIATE, retenir image native et claim de slot ; vérifier autorité, révisions, ownership, obsolescence et fences avant/après append. Les opérations de plan ne sont pas recréées à chaque tentative ni utilisées pour contourner une origine existante.
3. `submitRuntime` ne consomme que l'opération préretenue, via transport REST fermé ; pas ensureTeam/RPC legacy ou fallback fixture. L'engagement d'envoi précède le POST. Une réponse perdue n'autorise que le rapprochement des mêmes identités et images, jamais nouveau prompt ou origine.
4. Les caps couvrent les octets réellement émis, y compris tous les bodies REST d'admission. Aucun cap augmenté pour absorber un emballage non prévu. Slots autorisés, encumbered, spent/burned restent monotones ; pas de remboursement par obsolescence ou fin.
5. Un port natif discriminé relie effectivement Engine/GraphEngine au client, sans fabriquer un GraphRunV2 ni caster un port fixture. L'ancrage de cycle natif est prospectif et distinct ; le planificateur existant demeure.

## Observation, résultat et ordre

Créer un observateur runtime versionné distinct, à GET finis, sur les identités de l'opération retenue. Il peut observer envoyé/ambigu/obsolète sous ownership physique encore vérifié. Il conserve faits, attribution, complétude, curseurs et hashes ; il ne produit pas seul une autorisation, un résultat courant, un terminalProof ou une libération.

Des vérificateurs distincts rapprochent l'admission et les témoins positifs de fin : message exact livré, intervalle concerné, résultat, auteur/session/Model.Ref et droits réellement attribuables. Les événements session-scoped seuls ne prouvent pas un résultat ou une quiescence universelle. L'admissibilité courante est ensuite recalculée par les consommateurs existants ; l'obsolescence interdit l'usage sans empêcher l'observation tardive sous droits conservés.

Les notifications réutilisent le journal ordonné, avec session liée à l'image runtime avant la première commande, non-réveil explicite, reçu RMS et admission native distincts. Une livraison en vol par flux, admission précédente connue avant suivante ; ambiguïté : rapprochement seul. L'ordre reçu doit être démontré, pas un FIFO universel supposé, et ne prouve pas la lecture/application.

## Qualification sans exemption d'origine

La qualification du couplage courant2.2.1 peut précéder les nouveaux contenus v3, sur inputs gelés et sans publication ou admissibilité scientifique. Un permis privé parent exact et borné est possible, mais **ce n'est pas une exemption de budget, d'origine ou de ressource**. Toute session/travail/compte/origine effectivement créé est rapproché de sa comptabilité ; bootstrap et sondes comptent selon les mêmes règles applicables. Aucun champ `probe` ou renaming ne permet de déclarer gratuitement une origine non comptée. Si la continuité ou le budget disponible ne sont pas prouvés, aucun effet n'est autorisé.

Le permis de qualification ne crée pas un second transport ou un raccourci vers un résultat : même encodeur, préparation durable, méthode submitRuntime, décodeur, ownership et gardes. Le mode qualification-only est explicitement refusé par validation/publication/consommation scientifique. Le provider vérifie ce permis réel ; aucun cast ni marqueur synthétique n'ouvre la route.

Avant chaque effet natif, le superviseur ferme images, identités, droits, serveur/PID/hash, schémas utiles, bornes et bail/ressources requis. La ratification n'est pas cette preuve. Les anciennes observations2.1.4 ne sont pas automatiquement actuelles. Le scénario minimal propose admission réelle, perte de réponse injectée localement et déclarée, rapprochement sans second prompt, résultat/fin/droit positifs, obsolescence et reprise sans retry, puis notifications ordonnées. Pas de redémarrage serveur imposé.

La tâche suivante de nouveaux contenus crée une projection native versionnée avec politique non nulle avant ancrage et entrées réellement matérialisées, en réutilisant les approbations privées existantes sans modifier un binding ou cycle gelé. D5 attend ensuite le parcours complet indépendant, publication/readback et nouveaux contenus reçus. Aucune sonde ou fixture ne ferme ce scénario.

## Plan de fichiers à préparer avant code

Neuf fichiers produit sous `tools/ff8-harness/src` : `domain.ts`, `graph-runtime-binding.ts`, `graph-store.ts`, `client.ts`, nouveau `native-runtime-transport.ts`, `graph-native-observations.ts`, `graph-adapter.ts`, `graph-engine.ts`, `engine.ts`.

Tests ciblés existants, préfixe `RMSN-` : `test/runtime-binding.test.ts`, `test/client.test.ts`, `test/eventlog.test.ts`, `test/graph-integration/native-observations.test.ts`, `engine.test.ts` et `recovery.test.ts` dans ce même sous-dossier. Impacts éventuels publication/projection à motiver avant extension. Aucun module génération/autorité/ressource fixture, SDK/package, noyau, configuration globale ou nouveau harnais n'est autorisé à modification par ce plan.

Le futur auteur doit soumettre le plan de symboles/migration/états, les imports et la preuve de couverture des contrats avant écriture. Il n'exécute pas de tests/typecheck/module produit ou appel natif ; le superviseur ferme puis exécute les sélections autorisées, dix minutes par test. Revue indépendante du candidat et intégration parent demeurent obligatoires.

## Traçabilité et limites

La tâche de contrat a été clôturée par le superviseur dans cette portée ; la réalisation dépendante a été publiée et prise par une session build fraîche isolée, encore en préparation de plan. Son rattachement natif au worktree a été effectué ; le contrat ratifié et la politique de scripts y ont été copiés avec vérification SHA256. Une capture GET parent du contrat OpenAPI courant a aussi été conservée dans l'evidence puis livrée comme entrée locale préparatoire. Aucune de ces copies ne fait partie du produit ou ne prouve la qualification du serveur. Aucun code ou test n'est encore autorisé avant approbation du plan de réalisation.

- Complément intégralement reçu : `result_mvtx6zcu_0006_psrpr3`, session `ses_e76fe00c8ffecFIDm69GY1zfH9`, message `msg_189115918001XxQ09onfR4gYDT`.
- Lectures parent : graph-generation-store27–44, graph-execution-envelope166–188, graph-store370–392 et client58–81 ; version2.2.1 observée par GET parent.
- Amendement parent au candidat : rejet de l'affirmation « la sonde ne crée pas d'origine RMS » comme dispense implicite. La comptabilité et les preuves réelles priment sur son nom.
- Capture du schéma observé : `evidence/native-openapi-2.2.1-after-r4.json`, OpenAPI3.1.0,330732octets, SHA256 `b2b8c4cfd4ba7e4f4566481628aa22527935351d461fca29646a1df37ed5a37f`. Empreinte du document CLI retenu, pas des octets wire ni d'un binaire.
- Aucun code natif réalisé, hash binaire requalifié, test ou effet natif exécuté par la ratification. HOLD125, diagnostic gelé, quatre origines, science et G5–G7 inchangés.
