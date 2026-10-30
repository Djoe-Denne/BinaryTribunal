# 35. Projection : compilation réussie, cas central interrompu sans résultat

## Résultats vérifiés

La correction de typage est exactement limitée aux trois annotations autorisées dans le test ; les sources restent identiques. Le parent a épinglé365 fichiers et3493 dépendances, puis relancé le typecheck : **réussi, code0**, environ3,4 secondes.

Le parent a ensuite exécuté **un seul cas central**, pas les39 cas annoncés. Bien que le timeout Bun soit fixé à quinze secondes, la commande n'a pas produit de reçu final avant la limite externe de l'outil à25 secondes. Elle a été interrompue ; les captures ne contiennent que la bannière Bun et aucun résumé d'assertions.

Ce résultat est **incomplet et non acceptable pour l'obligation de délai**, pas PASS, pas SKIP, ni zéro assertion réputée réussie. La cause n'est pas établie ; aucune attribution à SQL, GC ou une boucle n'est avancée sans preuve.

## Sécurité et décision

Le parent n'a pas relancé le test ou allongé son délai. Une inspection des processus Bun visant exactement next-context.test.ts ne trouve aucun enfant restant au moment du contrôle. Deux chemins de fixtures sont réservés ; aucun pin de base fermée n'a été produit. Ces ressources sont conservées sans réouverture ou suppression pour masquer l'arrêt.

Les365 fichiers source sont identiques après l'interruption. Le même développeur reçoit une investigation **statique ciblée seulement**, afin de rechercher une récursion ou un coût redondant concret dans son delta avant tout correctif. Pas de test par le worker, instrumentation nouvelle, profilage ou nouveau framework. Les sources restent gelées jusqu'à justification d'un delta ; la difficulté ne lève aucune barrière de temps.

Les autres contrôles de projection et la revue indépendante n'ont pas encore été exécutés/obtenus. Intégration interdite en l'état. Les preuves de publication et du raccord antérieurs gardent leurs versions et limites, sans propagation automatique à cette projection.

## Preuves

- `../evidence/projection-r2-manifest.json`, SHA256 `62140f55f1a9c3e75afbf624fc8cb5e2643c54bcda476845f689ba4f412744cd` ; HEAD `3a102221c828224a51116bb8ccad12529b2a0f6d`.
- Typecheck : `projection-typecheck-r2.execution.json` et captures.
- Interruption : `../evidence/projection-core-r2.interrupted.json`, captures stdout/stderr, propriété du registre `projection-fixture-owner-r2.json`.
- Le reçu normal projection-core-r2.execution.json n'existe pas, car la commande a été interrompue avant son écriture ; aucun exit code enfant n'est inventé.

Localisation : exécution du seul cas d'acquisition centrale dans le worktree possédé. Impact : compilation levée, nouveau blocage d'exécution/délai à expliquer avant poursuite. Limites : acquisition effective, v3/natif et acceptation globale non prouvés.
