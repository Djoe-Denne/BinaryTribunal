# 97. Raccord partiel conservé, continuation ciblée

## Objectif et état réel

Le raccord natif doit être complet et vérifié avant réception. L'auteur a conservé un premier état partiel avec son manifeste et sa note de reprise, en déclarant explicitement ses manques. Le superviseur ne l'accepte ni ne l'intègre. L'échec de livraison complète n'arrête pas la mission : une continuation bornée est confiée au même propriétaire, sans nouvelle session ou GO utilisateur.

## Travail et manques déclarés

Le code partiel contient les objets et ledger natifs, la migration privée, la préparation transactionnelle, les engagements REST, les jonctions client/propriétaire et Engine/GraphEngine, ainsi que l'observateur runtime séparé. Ces éléments ne sont pas réputés compilables ou corrects par la seule prose auteur.

Restent notamment : transport réel des notifications ordonnées sans réveil, comptabilité et rapprochement correspondants ; tests positifs et coupures hors ligne du parcours réellement consommé (pertes CREATE/PROMPT, reprises, comparaisons de versions, concurrence, droits/modèle et obsolescence). La revue indépendante et les qualifications natives réelles restent également à faire. Aucun provider synthétique ou référence de qualification inventée n'est accepté pour fermer ces obligations.

## Vérifications et image en évolution

Les16fichiers produit/tests du commit partiel correspondent à leurs tailles et empreintes manifestées ; les18chemins committés incluent ses deux preuves et aucun fichier d'agent tiers. Le lecteur d'inventaire parent a été corrigé pour tenir compte de la racine relative `tools/ff8-harness/` explicitement fournie par ce manifeste ; l'erreur de chemin initiale n'a exécuté aucun produit.

Le worktree a toutefois déjà évolué après ce pin, notamment dans graph-store et le transport. Ces octets ne sont pas assimilés au commit vérifié et leur origine n'est pas déduite sans confirmation de l'auteur. Aucun reset ou restauration n'est effectué. Un point stabilisé, avec pin et manifeste cohérents, est demandé avant compilation parent attribuable.

Les dépendances locales déjà présentes ont été reliées au worktree, sans installation ou réseau, pour préparer cette compilation. Aucun typecheck, test ou effet natif n'a encore été exécuté sur ce raccord dans cette étape. Le contrôle de syntaxe/diff auteur ne vaut pas QA comportementale.

## Suite autonome

À sa prochaine frontière sûre, l'auteur doit confirmer les deltas postérieurs et livrer une image stabilisée pour un contrôle de compilation parent, puis achever les manques déclarés dans le périmètre déjà approuvé. Les modifications tierces d'agents restent exclues, sans lecture ou restauration. L'auteur n'exécute toujours pas de produit, test, réseau ou qualification native.

La réception et l'intégration restent gelées pour ce raccord seulement. Les refus d'accès et les arrêts explicites restent maintenus ; aucune absence de preuve ou livraison partielle ne devient PASS. Les acquis de l'incrément précédent sont conservés.

## Traçabilité

- Pin partiel : `c92ab3625789371eca04dcf09ca1d3022f111440`, base `9c1b6aaf5288445c06d82978b122091111c2bc8f`.
- Documents auteur : `native-runtime-r1-manifest.json` et `native-runtime-r1-handoff.md` dans le dossier mission du worktree `raccord-native-runtime`.
- Contrat/plan : [contrat94](94-contrat-natif-ratifie-autorite-et-qualification-bornees.md), [plan95](95-plan-raccord-natif-approuve-sources-courantes-livrees.md).
