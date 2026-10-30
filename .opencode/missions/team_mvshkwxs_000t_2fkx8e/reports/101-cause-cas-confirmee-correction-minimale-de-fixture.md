# 101. Cause des échecs de commande confirmée, correction minimale autorisée

## Objectif et constat

Les quatre échecs de commandes empêchent encore la réception du raccord. Le diagnostic statique de l'auteur est reçu et corroboré par le superviseur : le helper construit sa demande avant l'initialisation de l'identité parent. Cette initialisation ajoute un événement, ce qui rend immédiatement périmée la séquence attendue par la demande.

Le contrôle atomique de production refuse correctement cette différence. Son rollback annule aussi l'initialisation ; une nouvelle première demande non préparée reproduit donc le problème. Le helper historique des tests de commandes initialise déjà cette identité avant de capturer les versions.

## Décision et portée

Autoriser une seule ligne dans le helper de `client.test.ts` : initialiser l'autorité parent par son API vérifiée avant toute capture des révisions et du curseur. Aucun changement de production, comparaison affaiblie, décalage arbitraire du curseur, recalcul après échec ou assertion supprimée.

La production r6 reste gelée pendant sa revue indépendante. Le reviewer est informé de ce delta de test ; sa vérification finale portera aussi sur ce delta et le prochain pin, sans recommencer la revue des octets inchangés. L'auteur livre un nouveau manifeste cohérent puis laisse les tests au superviseur.

## Limites et preuves

Les 39 réussites et quatre échecs du rapport100 restent leur résultat réel. Le diagnostic ne prouve pas les assertions encore non atteintes ni l'absence d'un autre défaut aval. Aucune qualification native ou intégration acquise.

- Lectures parent : `graph-store.ts:1096–1101,1128–1136,2114–2121` ; `client.test.ts:160–165` ; `eventlog.test.ts:30–35`.
- Pin diagnostiqué : `8753f8c64d051e2003fd60d206f341aaf1b4563b`.
- Diagnostic auteur : `diagnostic-complete-read-only`, reçu par la file native ; aucune exécution auteur.
- [Résultats conservés](100-raccord-corrige-positifs-atteints-quatre-echecs-commandes.md).
