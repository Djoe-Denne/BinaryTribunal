# M2 — 85 : borne de trois origines approuvée

## Décision utilisateur

À la question autonome du rapport84, l'utilisateur choisit exactement **« Trois dossiers (recommandé) »**. La politique proposée84 est donc approuvée pour les nouvelles fixtures de cette mission : maximum3origines durables par root/lineage, bootstrap compris, commit d'une origine nouvelle+1, retry exact0, rollback avant persistance0, aucun remboursement/reset. Compteurs d'activation et de remplacement indépendants et inchangés.

Cette décision ferme uniquement la borne manquante ; elle ne qualifie pas les blueprints83, ne modifie pas les bases historiques et n'autorise ni activation/remplacement ni exécution native. Aucun changement de modèle, de catalogue ou de contrat QA M2 ; pas de nouvelle config/start nécessaire.

## Raccord fixture à matérialiser

L'auteur peut mettre à jour seulement les deux artefacts83, après conservation de leur version initiale : CONTRACT.md et transition-fixtures.ts sous inputs/s2-t1-fixture-r2.

Définir un record d'octroi privé privilégié, fermé et indépendant de la requête : mission/lineage/root exacts, plafond3 et unité « origine durable », source/provenance/révision/révocation liées à l'hôte fixture. L'enregistrer avant le bootstrap des nouvelles fixtures ; compteur initial0 puis1 au commit du bootstrap, avec preuve durable. Ne pas accorder rétroactivement cette politique aux bases82 ni construire un nouveau root pour effacer le compteur d'une lignée.

Une constante3 dans le code appelant ne vaut pas autorité ; entrée/source absente ou périmée => HOLD. Conserver le cas manquant comme négatif explicite, mais remplacer le blocage structurel83 par des blueprints conditionnés à cet octroi et au compteur courant vérifiés. Aucune valeur de compteur copiée de la demande pour s'authentifier. Toute origine persistée consomme, même stage ultérieurement perdant ; préparer ne consomme pas une tentative d'activation/remplacement à sa place.

Mettre à jour les attentes finies : octroi absent/révoqué, bootstrap compté, création nouvelle comptée une fois, retry/rollback sans incrément et plafond épuisé refus avant effet. Les scénarios futurs de remplacement restent hors implémentation T1 ; ne pas les introduire pour remplir le budget de trois.

## Choix local de projection retenu pour la future implémentation

Le parent retient sous conditions contrôlables le schéma83 : avant préparation(h,c,q), après préparation initiale(h,c+1,q+1), puis T1(h+1,c+2,q+2). DRAIN302–309 n'impose pas un nouvel incrément de head actif à la préparation ; le candidat courant reste non actif. **Toutes les mutations concernées doivent comparer candidateRevision/pointeur/barrière en plus de h**. Une implémentation ne comparant que h est bloquante. Le record privé pré/post explique le seul événement préparatoire sans réécrire le T0 historique ou tolérer d'autres mouvements ; tout autre changement périmant T0 exige refus/préparation autorisée appropriée.

Cette décision locale n'est pas un GO produit : vérifier le raccord concret avec les codecs/consommateurs avant son delta, et escalader une contradiction sourcée plutôt que forcer un cast ou un refresh T0. Cuts/autorité transitionA restent ceux définis83, sources et records indépendants à fermer.

## Droits et suite

Écriture de ces deux artefacts seulement ; aucune modification produit, import évalué/scellement/bind, typing/test/SQL/DB/native/service/Git/délégation. Entrées et sources82,70DB et tous paquets clos restent intacts. Livrer deux hashes et les champs/attentes corrigés, pas un nouveau catalogue.

Le parent inspectera cette intégration de la décision puis autorisera le delta T0/T1 fermé ; revues et gate runtime s'appliqueront aux changements. Poursuite autonome dans le mandat, pas nouvelle approbation à chaque jalon. 000b/S2global/M2 ouverts ; aucune consolidation finale ou nouveau PASS revendiqué.
