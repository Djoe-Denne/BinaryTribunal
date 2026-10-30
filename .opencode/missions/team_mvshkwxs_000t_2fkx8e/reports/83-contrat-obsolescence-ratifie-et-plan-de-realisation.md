# 83. Obsolescence ratifiée : contrat et réalisation bornée

## Objectif et décision

Compléter le parcours RMS avec une annulation durable qui interdit les relances et les usages ultérieurs du résultat, sans exiger l'arrêt immédiat du calcul. Le superviseur ratifie le contrat ci-dessous et passe à la préparation de sa réalisation. Aucun nouveau GO utilisateur n'est nécessaire.

Le contrat n'est pas une preuve d'implémentation ni de qualification native. Une revue indépendante du candidat final reste requise ; aucun avis indépendant supplémentaire sur ce seul contrat n'est prétendu.

## Contrat ratifié

1. **Quatre dimensions séparées.** Autorisation courante du travail, historique d'admission, livraison des commandes et occupation physique. Une identité rendue obsolète ne redevient jamais autorisée ; les observations historiques ne sont ni effacées ni réécrites.
2. **Commandes durables et ordonnées.** Retenir identité, image exacte et empreinte, autorité superviseur, mission/run, tâche/exécution/génération, flux, séquence et versions attendues. Une livraison en vol par flux, admission précédente connue avant émission suivante. Portée minimale tâche/exécution, étendue à la session lorsqu'elle est partagée. Aucun ordre universel entre canaux natifs supposé. Même commande : même reçu ; divergence ou trou de séquence : refus sans avancer le curseur. Réponse perdue : rapprochement de l'identité existante, pas nouveau travail.
3. **Obsolescence effective au commit RMS.** Vérifier autorité, ownership et versions attendues dans une transaction du stockage existant ; retenir décision et événement, revérifier avant commit, rollback complet au refus. La décision locale ne doit pas attendre la résolution d'une admission distante ambiguë. Notification facultative, sans réveil involontaire ; reçu, admission et lecture par l'agent restent distincts.
4. **Aucune résurrection.** Refuser départ, réveil, retry quota, nouvelle tentative et réadmission automatiques, y compris après redémarrage. Une nouvelle demande exige une autorisation et une identité distinctes, sans remettre à zéro budget ou origines. Le rapprochement d'un effet engagé n'est pas une relance.
5. **Admissibilité courante des résultats.** Attribution/intégrité historiques valides ET autorisation courante ET dépendances encore admissibles. Contrôle avant sélection, revue/réconciliation, attestation, validation, publication, prérequis et consommation du prochain contexte ; revérification après les attentes asynchrones et aux commits. Résultat tardif conservable sous identité existante mais non consommable. Séparer le replay historique des usages actuellement autorisés ; ne pas réécrire les anciens événements `eligible:true` ni supprimer les témoins de fin physique.
6. **Dépendances et effets engagés.** Un résultat dépendant d'une source obsolète ne devient pas consommable par transitivité. Avant engagement : refuser. Effet engagé ambigu : rapprocher exactement, sans second effet. Effet déjà publié : préserver commit et historique, bloquer les nouveaux usages concernés ; retrait/correction versionnés si nécessaires, sans annulation rétroactive fictive.
7. **Ressources conservatrices.** L'obsolescence seule ne libère ni claim, allocation ou exclusivité à risque, et ne rembourse aucun débit historique. Ne pas la réaliser par `retireFamily(CANCELLED)` qui exige aujourd'hui la quiescence et libère le lease.

## Vérification parent déjà faite

Serena est rattaché à la racine commune attendue `retro-eng`, sans reconfiguration. Le superviseur a lu `GraphStore.retainResult` : l'admissibilité retenue dépend actuellement du lease, du type de source et de la complétion, sans marqueur général d'obsolescence. Les références de `scientificResult` montrent les consommateurs de publication, matérialisation, attestation et validation à couvrir. Le corps de `retireFamily` confirme l'exigence de quiescence et la libération des ressources. Ces vérifications corroborent les risques et le découpage proposés ; elles ne prouvent pas l'absence de tout autre consommateur.

## Plan de réalisation autorisé à préparer

Un auteur unique prépare un plan exact avant code. Production ciblée : `graph-store.ts`, `graph-engine.ts`, `client.ts` dans `tools/ff8-harness/src`. Stockage privé additif dans la base existante ; pas nouveau store, watcher, changement de noyau ou du cycle gelé. Toute extension de fichiers doit être justifiée au superviseur avant réalisation.

Tests proposés dans les fichiers existants : `test/eventlog.test.ts`, `test/client.test.ts`, `test/graph-integration/publication.test.ts`, `test/graph-integration/next-context.test.ts`, noms exclusifs `RMSO-`. Couvrir atomicité/rollback, identité/séquence/CAS, émission et reprise, réponse perdue, résultat déjà retenu/tardif, dépendances, publication avant/après effet et ressources inchangées. L'auteur peut écrire les tests après approbation du plan mais ne les exécute pas dans cette tâche.

Le superviseur inspectera imports et branches avant de fermer les sélections autorisées. Les imports de fixtures peuvent atteindre du code Worker : aucune exécution n'est autorisée par la seule présence d'un filtre de nom. Dix minutes par test, pas de suite globale, HOLD125, diagnostic gelé, cas quatre origines ou rejeu scientifique. Compilation et primitives pertinentes après contrôle du périmètre ; seules régressions affectées sont rejouées. Revue indépendante et intégration restent nécessaires avant réception de la réalisation.

## Obligations et limites

Les acquis de transfert, raccord statique, publication, projection hors ligne, admission au repos et lecteur DATA sont conservés dans leurs portées. Restent à implémenter : commandes, obsolescence et gardes ; puis raccord et consommation DATA v3. Restent à qualifier après prérequis : exécution native attribuable et scénario final complet. Les arrêts explicites demeurent ; la borne de dix minutes n'est pas une garantie générale de délai produit.

Aucun code modifié, test exécuté, effet natif ou nouvelle preuve produit à cette étape. Les méthodes runtime refusantes ne sont pas activées par cette ratification.

## Traçabilité

### Rattachement de l'auteur à son espace isolé

L'auteur a signalé que ses outils restaient enracinés dans le dépôt principal et que trois lectures absolues de son worktree étaient refusées comme répertoire externe. Aucun accès alternatif n'a été utilisé pour ces lectures. La branche possédée a été identifiée au pin de base attendu. Le superviseur a corrigé le rattachement par l'outil natif `opencode.session_move`, sur la session enfant possédée, vers le worktree déjà attribué ; reçu natif réussi. Aucun droit global ou profil n'a été modifié. La vérification de l'accès effectif dans ce nouveau périmètre reste à confirmer par l'auteur ; un refus persistant doit être signalé sans contournement. Cette correction ne vaut ni approbation du plan ni autorisation de test.

- Candidat lu intégralement : `result_mvtufjgw_0001_ue4te8`, session `ses_e773952f6ffee45XA6Yzd2LApf`, message `msg_188cb21d8001BHZnH25CNsRvcw`.
- Localisation parent : `GraphStore.retainResult`, lignes1515–1528 ; `scientificResult`, références626/638,1312/1331,1452,1539,1596 ; `retireFamily`, lignes1711–1719. Numéros humains à partir de1.
- Limite : navigation symbolique sur source canonique, pas encore sur un candidat modifié. L'auteur devra couvrir les usages SQL et les consommateurs non prouvés exhaustifs par l'index.
