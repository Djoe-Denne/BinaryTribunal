# 173. Contrat du journal confirmé ; cause active encore inconnue

## Résultat vérifié

Le contrat source prévoit bien le replay initial sans curseur, puis un marqueur de synchronisation. Le curseur est un entier décimal provenant d'un événement ou marqueur observé ; aucun header supplémentaire n'est requis dans le chemin examiné. Le client conserve le chemin GET et sa query tels que fournis. Les arguments déjà émis portent bien le chemin complet en un seul argument.

Le parent a corroboré ces points directement dans l'archive source associée. Il ne modifiera donc ni l'encodage du curseur ni les headers pour tenter un correctif sans preuve. Les observations RMS demeurent complètes au sens transport, mais vides au sens métier : aucun intervalle ou auteur n'a été collecté.

## Cause encore non établie

Deux filtres source peuvent avancer le marqueur sans exposer les événements : types non enregistrés dans le manifeste durable et événements non publics de session. Leur activation sur notre opération n'est pas prouvée. L'association de l'archive à la distribution ne suffit pas à affirmer le chemin précis du code chargé.

La réponse native170 reste une preuve positive séparée ; elle ne comble pas les faits manquants du journal. Aucun test source lu n'est compté PASS et aucune cause de bug n'est déclarée acquise.

## Prochaine investigation bornée

Le constructeur prépare seulement un petit plan de diagnostic local readonly : tables, colonnes et sélection exacte de cette session, sans payload, secret ou autre session. Il ne doit ouvrir aucune base, appeler une API ou modifier quoi que ce soit. Le parent vérifiera si cette inspection peut distinguer historique absent et filtrage, dans les permissions natives existantes.

Ce diagnostic éventuel ne remplacera pas une observation RMS qualifiée et ne créera aucune autorité. Les droits privés expirés ne sont pas renouvelés ; aucune nouvelle exécution, origine ou boucle de replay n'est prévue. Si l'accès nécessaire est refusé, la limite sera conservée, pas contournée. Aucun correctif du serveur OpenCode ou changement global n'est engagé.

## Ancrages source

- packages/protocol/src/groups/session.ts656–663 et packages/schema/src/event.ts16–24 : endpoint et codecs, corroborés parent.
- packages/core/src/bus.ts805–815,857–885 : filtrage du manifeste, replay initial et marqueur, corroborés parent.
- packages/core/src/session.ts474–483 : filtre public de session, corroboré parent.
- packages/cli/src/commands/handlers/api.ts62–69 : rawRequest conserve le chemin exact, corroboré parent.
- Finding constructeur READONLY_LOG_CONTRACT_FOUND_QUALIFICATION_INTERVAL_NOT_COLLECTED_NO_NATIVE_READ ; aucune API, base ou exécution par lui. Ses suggestions de statut CLI plus explicite restent différables : elles n'expliquent ni ne réparent le journal vide.

## Complément du même brief source reçu

Le finding READONLY_BRIEF171_COMPLETE_CAUSE_NATIVE_UNKNOWN_CLI_QUERY_DROP_NOT_ESTABLISHED précise que l'observateur RMS utilise directement son port HTTP, pas la CLI : graph-native-observations55–56 et native-runtime-transport90–105 conservent la query construite. Une éventuelle erreur des appels CLI diagnostiques ne suffirait donc pas à expliquer la première observation RMS vide.

Les routes/paramètres des appels diagnostiques figurent dans les entrées des outils parent ; l'evidence171 n'en conserve qu'un résumé filtré, pas des octets HTTP ou un reçu natif complet des argv. Cette distinction limite ce qui peut être certifié. Aucun appel n'est refait pour recréer une trace manquante. Ce complément termine l'ancien brief171 ; il ne contient pas encore le plan ultérieurement demandé d'inspection locale des seules métadonnées.
