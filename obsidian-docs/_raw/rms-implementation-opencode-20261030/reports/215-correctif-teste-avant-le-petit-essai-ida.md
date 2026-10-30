# 215. Correctif testé avant le petit essai IDA

Le petit essai complet avec IDA n'a pas encore eu lieu. Le correctif du lanceur passe maintenant ses contrôles logiciels ciblés :

- Typecheck : réussi en3856ms.
- Client :3tests réussis,37assertions,98ms ;114cas filtrés non exécutés.
- Vérification par lots et protections associées :7tests réussis,202assertions,62ms ;6cas filtrés non exécutés.

Aucun échec ou timeout. Les cinq empreintes du candidat sont identiques avant et après chaque commande. Aucun test global, scan complet, serveur, demande de modèle ou accès supplémentaire à IDA n'est exécuté. Les tests simulés de lots ne prouvent pas encore que le scan réel termine dans le délai.

La revue indépendante du même delta reçoit ces preuves sans les rejouer. Son verdict reste nécessaire avant de recevoir le correctif et d'envisager un nouvel essai réel borné. Les primitives et frontières inchangées gardent leurs preuves précédentes ; aucune nouvelle chaîne de contrôles générale n'est lancée.

Preuves : `qa-owned-runtime-214` contient les trois reçus, commandes exactes, empreintes et logs. Gel courant : client414afd9d, binding7d5bd110, testsadf094ce ; transport54d35747 et tests client35d881db inchangés. Le gel FD rejeté n'a jamais été testé et reste séparé.

Les échecs207 et209, les limites105/120secondes et le compteur d'origine restent conservés. Ce résultat logiciel ne vaut ni qualification Bun→Bun, ni simulation IDA terminée, ni acceptation M2.
