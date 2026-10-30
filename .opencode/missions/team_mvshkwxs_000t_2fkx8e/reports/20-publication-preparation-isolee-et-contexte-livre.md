# 20. Publication : préparation isolée et contexte livré

## Objectif et étape

Après l'intégration du raccord statique, la tâche déjà prévue de publication durable est lancée en préparation. Elle doit relier les nouveaux octets retenus à l'attestation parent, au pending, à la relecture exacte puis au commit/receipt, sans effet doublé et sans second store. La projection du contexte suivant reste l'étape suivante.

Le développeur prépare son plan en lecture seule. Son premier constat de blocage était valide : sa session native pointait encore vers le canonique malgré un worktree créé. Le parent a corrigé ce rattachement avant écriture, puis l'a relu. Le développeur confirme maintenant l'accès local au .git de son worktree. Aucun refus de rôle ou accès externe n'a été contourné.

## Prérequis vérifiés

- Base du worktree : commit d'intégration87a933f, **360 fichiers identiques** au raccord accepté, zéro différence. Aucun nouveau seed approximatif depuis un HEAD antérieur.
- Model.Ref natif relu : OpenAI Sol xhigh. Même politique approuvée, aucun override.
- Dépendances locales fournies :3493 fichiers/88061705 octets, source/destination vérifiés, sans réseau ni installation.
- Huit documents utiles et leur manifeste livrés dans un dossier **explicitement ignoré par Git**, sous evidence-private/mission-context : contrat ratifié, bilan d'intégration, obligations, parcours, D5/D6, contrat RMS et politique Context Mode. Ce sont des consignes de travail, jamais des capacités ou entrées runtime à importer.

Le contexte n'est pas placé dans une nouvelle file ancienne ni dans un paquet Git. La politique externe précédemment inaccessible est livrée au chemin local autorisé ; aucune nouvelle lecture du chemin refusé n'est demandée.

## Plan à recevoir et critères conservés

Le préplan propose un manifeste strict de matérialisation, lié à l'attestation avant publication, le journal GraphStore existant, une cible statique parent-owned exclusive/idempotente, readback exact et reprise aux quatre coupures. Le parent demande les champs, méthodes et consommateurs précis avant accord d'écriture.

Les nouveaux octets doivent provenir des résultats retenus, pas seulement d'un contenu préannoncé. Anciens cycles et gardes restent dans leur portée ; une entrée prospective explicite consomme le nouveau contrat. Le plan doit distinguer matérialisation physique et commit accepté, sans promettre une atomicité entre SQLite et le système de fichiers non démontrée.

Le parent exécutera les tests après pin stable ; quinze secondes/test, pas de suite globale ou de thread, aucun effet natif implicite. Les garanties natives absentes restent bloquantes pour leur preuve, pas une permission de renommer une fixture en natif.

## Trace

- Tâche : publication durable (`task_mvsiffq2_0008_g5nodn`).
- Session : `ses_e7bab5ebdffexwaMEofXNI7XMK`, worktree `ensemble-793e3f62-2fkx8e-publication-durable`.
- `../evidence/publication-base-receipt.json` et `publication-dependencies.json`.
- Les rapports de préparation failed reflètent les préconditions auparavant manquantes ; elles sont maintenant livrées et la même session est reprise, sans nouveau worker ni nouvelle autorisation utilisateur.

Localisation : base et contexte dans l'espace isolé. Impact : préparation du plan de publication seulement. Limites : aucune écriture produit, aucun test par ce développeur, publication et nouveau contexte non encore réalisés ; mission toujours non clôturée.
