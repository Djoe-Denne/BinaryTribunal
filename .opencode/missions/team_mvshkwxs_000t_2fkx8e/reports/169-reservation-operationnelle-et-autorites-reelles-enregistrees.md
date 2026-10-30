# 169. Réservation opérationnelle et autorités réelles enregistrées

## Objectif et résultat

Le premier usage RMS passe de la préparation à un état opérationnel réel, distinct de la QA. Une seule réservation locale a été créée. Les12fichiers produits sont relus et leurs empreintes correspondent ; les deux fences observées valent1/1 dans cette nouvelle base. Ces valeurs viennent de ses transactions, pas de la copie des fences QA.

Les invocations directes parent de l'inspection des entrées et du préflight réussissent. Le parent émet ensuite séparément l'autorisation de racine, la relit, émet le permis A, le relit, puis prépare l'opération. Les sources, le modèle Sol high, le corps exact et les droits sont rapprochés par les gardes existantes.

La préparation engage **une origine durable**, sur un maximum de trois bootstrap compris. La relecture avant envoi montre une seule opération et aucun claim de création ou de prompt consommé. L'autorisation de racine seule n'avait ajouté aucune origine. L'acquisition reste A seulement avec cap et débit262144octets.

## Deux refus préalables conservés

La première entrée refuse le fichier JSON mis en forme, car la CLI exige une image canonique. Aucun stage n'est tenté. Une nouvelle image conserve strictement les valeurs et l'expiration initiales.

La suivante refuse la nouvelle référence de fichier d'observation : le raccord épingle expressément la pièce historique155. Le parent conserve cette référence, et garde le rafraîchissement168 comme preuve externe distincte. PID, création du processus et hash binaire concordent. Aucune garde n'est assouplie, aucun fichier historique réécrit et aucune expiration prolongée. Cette nouvelle requête corrigée produit le seul stage réel.

Les refus ne sont pas reclassés en succès. Aucun état partiel de réservation n'existait à leur suite ; les reçus le conservent explicitement.

## Preuves techniques

- Dossier des reçus : operational-preparation-168 ; requête finale request-retained-identity-169.json et stage-retained-identity-169.json.
- Refus d'entrée :39ms, HOLD_LOCAL_ENTRY/canonical JSON. Refus statique :217ms, HOLD_BEFORE_STAGE, stageAttempted=false/outputCreated=false.
- Stage réel :543ms, LOCAL_INPUTS_READY_PARENT_ACTS_ONLY,12fichiers, marge après fermeture183916ms.
- Relecture readonly : unité et famille effectivement réservées, contrôleur courant, racines natives0 avant autorisation ; aucun transfert QA.
- inspect-inputs-169.jsonl et preflight-169.jsonl : sourceRequest et run historiques inchangés, modèle explicite, wire22044octets ; permissionsEvaluation reste NOT_PROVEN_BY_GET.
- authorize-root-169.jsonl / inspect-root-169.jsonl : racine révision0, un slot A, origines0, permis absent.
- grant-169.jsonl / inspect-permit-169.jsonl : permis révision0, Sol high, droits effect/physical vrais, expiration1793364016019, origines0.
- prepare-169.jsonl puis lecture SQL : racine révision1, origine unique origin-rms168-53a8e323ef544e7c8a6db75e5bda50c8 ; opération unique, create_claim=0/prompt_claim=0 avant POST.
- Le résultat de l'envoi et la qualification native sont traités dans le bilan suivant, sans les confondre avec ces actes locaux. Aucun test acquis rejoué, aucune suite interdite.
