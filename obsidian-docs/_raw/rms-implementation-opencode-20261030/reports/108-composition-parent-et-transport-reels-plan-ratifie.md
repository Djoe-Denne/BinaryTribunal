# 108. Composition parent et transport réels : plan ratifié

## Objectif et décision

Rendre le raccord invocable par le superviseur, au lieu de laisser ses interfaces utilisables seulement par les tests. Le superviseur ratifie le plan borné de composition locale, transport HTTP réel et rafraîchissement des faits du service hors transaction SQL. La réalisation peut reprendre dans cinq modules existants ; aucun octroi, initialisation de compte ou effet natif n'est autorisé à l'auteur.

## Frontière d'autorité retenue

Le point d'entrée de confiance est **l'invocation effective du processus possédé par le superviseur via son outil natif autorisé**. Son reçu est une preuve externe du parent, pas un rôle reçu du serveur REST ou un champ actorId d'une requête. Dans ce processus, la capability parent reste en mémoire, limitée à mission, base OWN, compte, durée, lease et version de décision. Elle n'est pas sérialisable ni exposée à l'API worker, au RPC ou à la CLI historique.

L'identité descriptive et son document journalisé restent des traces, jamais suffisantes pour créer ce droit. L'auteur ne doit pas inventer une API cryptographique ou un contexte natif transmis par un SDK qui n'existe pas. Si le raccord exact de cette invocation requiert une extension indisponible, il doit en décrire la limite concrète avant de l'implémenter ; les parties indépendantes utiles continuent. La preuve de l'invocation réelle et de l'octroi sera produite par le parent, pas par une fixture ou un faux callback.

La première acquisition et les permis privés resteront soumis aux conditions du rapport107 : données indépendantes, provenance, inventaire, caps et origines, jamais octroi calculé depuis la seule demande.

## Réalisation bornée

- `graph-store.ts` : décisions locales privées versionnées dans les tables déjà autorisées, genèse/permis/révocation et intégrité bidirectionnelle. Contrôles actuels de fence, lease, scope et comparaison atomique, sans recréer l'autorité depuis un événement.
- `native-runtime-transport.ts` : découverte du service existant, headers d'authentification en mémoire, fetch réel avec routes/identités fermées, bodies UTF-8 inchangés, redirect refusé, signal borné, aucun autostart ou retry. Mêmes encodeur et décodeur que r8.
- `client.ts` : composition parent du Store/GraphStore, provider et capability HTTP unique ; chargement indépendant des sources avant préparation, aucun passage par le RPC historique.
- `engine.ts` : entrée asynchrone additive pour rafraîchir avant le démarrage existant ; préserver les signatures historiques.
- `graph-native-observations.ts` : rafraîchissements aux frontières d'I/O, conservation physique des réponses déjà engagées, sans réouvrir un nouvel effet.

Les faits REST sont rafraîchis hors transaction ; les décisions, versions et ownership locaux sont relus avant effet. Aucun GET n'est prétendu atomique avec un futur POST. Toute divergence pertinente conduit à HOLD/ambiguïté et refus d'usage, pas à un retry ou à une annulation rétroactive fictive. Les gardes déjà vérifiées doivent être réutilisées plutôt qu'un second système de consensus ou scheduler.

Les nouveaux profils/modèles/grants réels entrent avant le scellement d'une nouvelle préparation. Les sources de fixture, anciens cycles, pins qualifiés et run retenus restent inchangés. Le provider n'est pas qualifié par sa seule construction ; ses autorisations restent fermées tant que leurs preuves manquent.

## Recherche de droits fournie

Le superviseur a acquis et épinglé les sources publiques pertinentes au commit2.2.1 déjà vérifié, avec manifeste de tailles et hashes. L'évaluation concatène agent et session, bloque les deny configurés avant les permissions sauvegardées, puis peut passer par un hook plugin. Le dernier match wildcard compte, et le défaut est ask.

Il est donc interdit de déclarer un évaluateur local équivalent depuis les seuls DTO GET. Les sources publiques décrivent un contrat, pas l'implémentation chargée, les hooks actifs ou les droits réellement exercés. Un extrait court et les sources ont été livrés à l'auteur sans nouvel appel au service natif. Aucune donnée privée envoyée au dépôt public.

## Vérification et limites

Précisions de réalisation transmises ensuite : Model.Variant est un objet fermé dont id est requis, pas une chaîne ; la sélection se fait par variant.id exact (extrait conservé dans l'evidence). La recherche d'origines n'a fourni ni schéma d'allocation native ni montants réels. Le loader peut donc définir un type privé fermé de proposition/évidence dans les modules autorisés, avec sources indépendantes, inventaire et attribution, acquisitions par slot, histoire et états UNKNOWN/HOLD explicites. Il ne doit pas attendre ou inventer une allocation « produite » par cette recherche. Absence de valeur chiffrée n'est jamais zéro ; cette donnée proposée ne crée pas le véritable octroi privé du parent. La forme locale et ses refus devront être déclarés au checkpoint.

Tests ciblés existants selon l'impact : capability parent contre document copié, révocation/expiry/fence pendant attente, nouveau transport respectant les octets et absence de retry, conservation post-effet, genèse ambiguë/double grant refusés, modèle/profil/grant incohérents avant scellement. Les risques et gates existants restent requis ; pas de nouveau grand harnais, noyau, SDK, table, store, configuration globale ou suite exhaustive.

L'auteur écrit seulement les modules ratifiés et leurs tests existants, puis livre un pin/manifeste cohérents. Aucun test, réseau, import produit exécuté ou effet natif par l'auteur. Le superviseur conserve QA, revue, qualification et réception. Les 75 réussites r8 restent valides pour r8, sans transfert automatique aux nouveaux octets.

## Traçabilité

- Plan reçu : `host-plan-part-1-of-2` et `host-plan-part-2-of-2-for-ratification`, même auteur et tâche ouverte.
- [Extrait public de composition des permissions](../evidence/native-permission-composition-2.2.1-extract.md), manifeste `evidence/public-native-rights-2.2.1/manifest.json`.
- [Prérequis d'acquisition](107-premiere-acquisition-possible-sans-reset-ni-autorite-fictive.md), [QA r8](104-regressions-fermees-preparation-qualification-reelle.md).
- Aucun compte/grant réel créé, permission native modifiée ou effet demandé par cette ratification.
