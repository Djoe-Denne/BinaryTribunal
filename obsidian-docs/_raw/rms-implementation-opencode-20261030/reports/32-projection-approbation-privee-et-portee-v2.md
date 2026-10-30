# 32. Projection : approbation privée exacte et portée v2 explicite

## Problème concret et décision

Les nouveaux contenus doivent être autorisés pour leur consommateur, pas seulement publiés. Le développeur a signalé qu'une image ou un événement public importé pourrait autrement se faire passer pour une approbation. Le parent a vérifié le code : appendGraphPreparation est explicitement un journal public ; assertAuthorizationEvent vérifie un événement et son digest, pas à lui seul une capacité parent.

Le parent **amende le choix de stockage du rapport31** : une table privée additive dans le GraphStore existant est autorisée pour l'approbation exacte après publication. Les grants prospectifs restent des limites de portée, pas une approbation suffisante. Ce changement reste dans l'objectif délégué et ne requiert ni nouvelle permission utilisateur ni second architecte.

## Contrat amendé, avant réalisation

- Une seule table privée additive `ff8_graph_next_context_approvals` dans la base GraphStore existante, avec document canonique, digest, clé d'événement et référence de révocation. Pas de nouveau fichier de base, identité, provider, store ou ordonnanceur. Initialisation/version du schéma explicitée, additive et compatible ; aucune réécriture/destruction des anciennes données ou relaxation de codec scientifique.
- La création et la révocation passent uniquement par une méthode parent vérifiée avec bootstrapParentAuthority existant et contrôleur courant. Un worker label, booléen, événement ou image importée ne peut créer la ligne privée. Le document lie le parent effectif, policy/run/plan/binding, producteur/commit/artéfact/hash/révision exacts, consommateur/fonction/rôles autorisés et les références attestées nécessaires.
- L'approbation intervient après publication réellement COMMITTED et readback/binding exacts, dans les limites des grants prospectifs. Comparaison de toutes les images et digests contre le store ; aucune prédiction d'octets futurs ni sélection du plus récent. Retry identique idempotent, même clé divergente refusée, révocation monotone et journalisée. Ligne privée et événement correspondant créés atomiquement dans la transaction existante.
- La projection reste une image non autorisante journalisée par famille. Les lecteurs actuels rapprochent ligne privée, événement, parent, publication et grants ; l'image seule, le receipt seul ou une copie d'événement n'autorisent rien. Retrait/révocation/fencing contrôlés avant/après matérialisation et aux barrières d'admission/dispatch. Lecture historique séparée, jamais réautorisation d'un effet.
- Ajouter le négatif indispensable « approbation/événement public sans ligne privée » et les cas de faux parent, tuple divergent, révocation après gel et reprise exacte. Aucun SQL de fixture ne doit être présenté comme une approbation parent réussie ; les injections négatives restent explicitement hors ligne.

Les autres garde-fous du rapport31 sont conservés : vrais octets bruts, fichiers exclusifs ou identiques avec readback, vue d'inputs versionnée sans mutation de cycleKnowledge, séparation des rôles jusque dans le body livré, budgets et reconstruction stricte, aucune suppression ou réparation implicite.

## Périmètre v2 et limite v3

Cet incrément fournit la projection effective dans graphInputs, dossier, pins et outbox du parcours **GraphRunV2 hors ligne**. Il ne modifie pas silencieusement RuntimeBindingV1 ou prepareRuntimeBindingV1 : leur knowledgeProjectionPolicyRef reste null dans le DATA v3 actuel. L'acquisition v3 n'est donc ni implémentée ni comptée PASS par cet incrément et reste un manque distinct au bilan. La route native reste fermée ; aucune fixture renommée en preuve native.

## Permissions et suite

Le catalogue de planification n'expose pas d'éditeur ni de commande générique : le développeur ne doit pas détourner un outil de lecture. Après approbation du plan et handoff natif d'implémentation, il vérifie ses outils ; une permission encore absente est remontée précisément au parent, sans contournement par le serveur canonique. Le parent reste exécutant des tests après gel/pin, quinze secondes par test.

Le développeur est autorisé à réaliser le plan avec cet amendement explicite ; pas de nouveau GO attendu. Un conflit de schéma ou extension importante doit être remonté avant action. Revue indépendante et réception parent restent requises.

Le plan final A–I reçu ensuite est confirmé ratifié avec deux précisions de réalisation bornée : grants à révisions exactes dans ce premier incrément, pas de plages implicites ; table additive IF NOT EXISTS avec refus de forme homonyme incompatible et version1 du document d'approbation, sans modification du PRAGMA user_version partagé ou des anciennes tables. Ces décisions sont explicitement livrées à la même session. Aucune attente de nouvelle ratification SQL ou de GO utilisateur ne subsiste ; seuls un vrai refus d'outil après handoff ou un conflit concret doivent être remontés.

Précision de migration autorisée pendant réalisation : la métadonnée locale `ff8_graph_metadata` passe explicitement de6 à7 pour la table additive ; ni PRAGMA user_version ni la métadonnée engine version1 ne changent. Le parent a vérifié le constructeur et les quatre attentes de version dans test/eventlog.test.ts : ce septième chemin est autorisé uniquement pour remplacer ces quatre constantes attendues6 par7, sans affaiblir les autres oracles. La QA ciblée devra démontrer qu'une fixture OWN v6 gagne seulement la table et sa métadonnée, avec documents/digests antérieurs identiques ; version future et table homonyme incompatible restent refusées. Les originaux historiques ne sont pas ouverts ou migrés pour ce contrôle.

Extension mécanique ensuite justifiée et autorisée après lecture parent de eventlog.test.ts:962–971 : le négatif de version future passe de7 à8, en conservant exactement son refus attendu. Sinon7 serait devenue la version courante et le test ne représenterait plus une version future. L'intitulé de la boucle des cinq cas v1–v5 peut annoncer « to v7 » au lieu de « to v6 ». Aucun ajout ou retrait de cas ni autre oracle modifié ; la migration6→7 est traitée par son nouveau cas dédié. L'assertion966 appartient à cette boucle, pas au cas RV6M-02 précédent.

## Preuves et limites

Code de base vérifié : graph-engine.ts:85–97 (préparation publique), graph-store.ts:773–799 (identité parent privée existante et vérification d'événement), graph-store.ts:814–822 (policy de publication issue du preparing). Ces octets sont ceux du socle intégré identique au worktree avant implémentation.

Localisation : autorisation de consommation de nouveaux contenus, distincte de l'attestation de publication. Impact : une table privée additive autorisée, contrats historiques et identité existante préservés. Limites : aucun code ou test de projection encore reçu, acquisition v3/natif non prouvée ; aucune clôture globale.
