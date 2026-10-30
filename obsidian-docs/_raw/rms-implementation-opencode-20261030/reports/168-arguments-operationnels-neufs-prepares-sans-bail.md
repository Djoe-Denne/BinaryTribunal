# 168. Arguments opérationnels neufs préparés, sans bail

## Objectif et avancement

Préparer le premier parcours RMS natif avec des identités et ressources propres, sans adopter les ressources de test. Les schémas natifs conservés ont été relus : les identifiants choisis respectent leurs formats et le modèle conserve fournisseur, identifiant et variante explicites.

Le parent a matérialisé un modèle de requête et un plan d'actions. Les fichiers sources épinglés ont tous été relus et leurs empreintes vérifiées, y compris l'archive source associée au serveur. La requête opérationnelle a de nouveaux identifiants de contrôleur, session, message, permis et origine prospective ; elle ne recopie pas les identités QA.

La date d'expiration reste volontairement nulle dans ce modèle : **ce n'est pas une requête exécutable**. L'identité du serveur devra être rafraîchie et la date finale fermée juste avant l'unique réservation. Aucun namespace OWN opérationnel, bail, octroi, session ou origine n'est créé par cette préparation.

## Ordre retenu

Après rafraîchissement : une matérialisation locale, relecture indépendante des fichiers et véritables fences, inspection des entrées et préflight, puis actes privés parent séparés : autorisation de racine, octroi du permis et préparation. Chaque acte est suivi d'une relecture durable avant le suivant. Le POST reste séparé et interdit tant que ses prérequis ne sont pas établis. Une réponse ambiguë ne permettra pas un second prompt.

Les ressources QA166 restent préservées et non adoptables. La provenance du canary historique n'est pas réattribuée. L'acquisition demeure A seulement, cap et débit262144octets ; le plafond de trois origines bootstrap compris n'est pas remis à zéro par copie. Le premier commit de préparation natif comptera son origine.

## Preuves et limites

- [Plan d'actions](../operational-preparation-168/plan.json) :1879octets/SHA c858d7579136bf14b19b4470ccf2224d45f9ace2fe452ab97a46855c765459fe.
- Modèle de requête :8489octets/SHA 1ffc6fcfd2b0545bc2cbdf1ae0e080b4ee7f4d1feb3b708e3d7ee939c66061f4, sous operational-preparation-168.
- Schémas OpenAPI : Session.ID `^ses`, Session.Message.ID `^msg_`, Model.Ref fermé avec providerID/id et variant ; identifiants proposés conformes aussi aux gardes client plus strictes.
- Runner de préparation statique : syntaxe vérifiée, sortie0 ; aucune importation du runtime, connexion, base ou action native.
- QA167 et correctif340 réutilisés sans rejeu. Enforcement, exécution fournisseur, résultat, fin native et parcours final restent à prouver ; M2 ouvert.
