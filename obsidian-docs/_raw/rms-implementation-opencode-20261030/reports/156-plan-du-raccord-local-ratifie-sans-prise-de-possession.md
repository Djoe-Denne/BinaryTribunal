# 156. Plan du raccord local ratifié, sans prise de possession

## Objectif et décision

Les pièces de première acquisition et les déclarations de permissions étant matérialisées, le parent ratifie le plan d'un petit raccord local qui préparera les arguments exacts du chemin existant. Le constructeur peut écrire deux candidats : le runner et son manifeste. Il ne peut ni les exécuter, ni ouvrir une base opérationnelle ou prendre une possession.

Le runner réutilisera la réservation locale déjà vérifiée, puis relira ses véritables versions et matérialisera l'admission, l'image d'envoi, la demande préalable d'acquisition et le permis. Il ne créera pas lui-même l'autorité : les actes privés restent des invocations directes et séparées du parent, via l'entrée existante.

## Gardes conservées

Toutes les entrées statiques doivent être fermées avant la réservation. Aucune base QA n'est adoptée ; les versions de possession ne sont pas choisies à l'avance. Après réservation, pas de seconde initialisation, renouvellement automatique ou nouvelle prise de possession. Tout échec préserve l'état partiel et interdit le retry implicite.

L'image et l'admission gardent leurs empreintes distinctes. Le plafond de262144octets reste inchangé. Le champ d'identifiant d'octroi est absent de la demande pré-émetteur ; seule l'API privée existante le remplira. Le document d'occupation locale ne doit pas affirmer qu'une session distante ou un quota fournisseur a déjà été alloué.

## Point précis à résoudre pendant la réalisation

Le contrat technique du permis exige une empreinte de source en plus de celle du binaire et du schéma. Or les observations actuelles identifient réellement le binaire, pas son lien avec une source donnée. Le parent refuse de remplir ce champ avec une empreinte arbitraire pour rendre la requête valide.

Une vérification ciblée cherche le sens exact de ce champ dans les contrats existants : source documentaire utilisée pour interpréter le protocole, ou preuve de provenance du code chargé. Ces deux sens ne sont pas interchangeables. Si une preuve indispensable manque, le runner doit refuser **avant** toute possession ; cela n'empêche pas sa réalisation et sa revue en parallèle. Aucun changement de contrat ou exigence de build signé n'est présumé.

## Vérification prévue

Revue indépendante du raccord et contrôles ciblés des nouvelles frontières seulement, sur un espace de test distinct et non adoptable. Aucun rejeu des huit contrôles acquis, aucune suite globale, diagnostic gelé, chemin threads ou cas à quatre origines. Les commandes opérationnelles resteront des actes parent séparés après vérification.

## Annexe technique

- Plan reçu : message du constructeur en15points, deux fichiers proposés stage-materialize-native-inputs.mjs et son manifeste dans preparation-candidates du worktree possédé.
- Parent : lecture client333–411,615–671 ; entry client.ts native-qualify, capacité privée uniquement sous import.meta.main. Pas d'import capable de produire cette autorité.
- Champ source à clarifier : graph-runtime-binding.ts:34 ; graph-store.ts:553–571,1157. Les contrôles attendent un SHA concret ; aucune preuve de provenance ne découle du seul format hexadécimal.
- Racine Serena vérifiée : retro-eng. Le candidat782 non intégré est lu dans son worktree ; les résultats symboliques canoniques ne sont pas présumés décrire ces modifications.
- Aucun fichier produit modifié, test exécuté, appel réseau, octroi, session, origine ou possession opérationnelle lancé pour cette décision.
