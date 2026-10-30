# 137. Candidats V3 vérifiés : syntaxe et quatorze contrôles prévus

## Objectif et livraison

Vérifier que l'architecture cible, l'identité et les chunks proviennent réellement de la fixture brute construite. Les trois nouveaux candidats sont reçus ; le parent confirme leurs empreintes, celles des entrées D3/Q3/configuration/blob et les18fichiers protégés inchangés.

Les deux contrôles de syntaxe réussissent en37ms chacun, sans évaluation. Aucun parcours ou calcul de sourceV3 n'a encore été exécuté. La création antérieure du blob de données ne vaut pas validation de son extracteur.

## Revue et vérification fermée

La revue indépendante porte seulement sur les nouvelles frontières depuis V2 : décodage base64 strict, padding et code réellement inspectés, mode32 fixé par la construction plutôt qu'inféré, chunks/instructions et tables fermés, hash du module sur les262bytes distinct du JSON, puis propagation aux identités et à la projection canonique. Les dépendances et invariants inchangés restent réutilisables.

Le parent a préparé un runner de14cas et contrôlé sa syntaxe sans évaluation. Après revue, il vérifiera les deux positifs (preuve exacte et source complète), puis douze refus ciblés de mode, bytes, layout, fermeture ou identité. Les mutations de descriptor atteindront la feuille sémantique, pas seulement le pin du constructeur. Les bytes modifiés restent des données en mémoire ; le stub n'est jamais exécuté.

Le processus parent sera borné à dix minutes avec durée par cas. Aucun test global, parcours scientifique, thread, appel service, installation ou nouveau framework. Les cent tests du produit inchangé ne sont pas rejoués.

## Limites

Une source construite sans diagnostic ne prouve encore aucune réservation, fence ou capacité physique. Les droits, acquisitions, inventaire/canary et origines restent HOLD. Les versions précédentes ne changent pas et aucun compte n'est réinitialisé.

Le stage130 demeure suspendu jusqu'aux preuves affectées ; aucun fichier de staging ou base opérationnelle créé. Les scripts et leurs preuves ne peuvent être déclarés qualifiés sur leur seule syntaxe.

## Preuves

- [Empreintes, syntaxe et quatorze cas](../evidence/constructed-source-candidates-syntax-v1.json).
- Runner parent : native-preparation-136/check-constructed-source-memory.mjs, syntaxe seule vérifiée.
- Décision136 : cible synthétique par construction, jamais architecture du service ou FF8.
