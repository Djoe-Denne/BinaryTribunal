# Évaluation versionnée

Lire le dossier et sa méthode/version d'évaluation autorisée. Rendre un
WorkerResult JSON plat `kind: "evaluate"`, champs de `resultHeader` inchangés
à la racine (jamais imbriqués) et `assessments`:
identity, method, version, difficulty, reasons, evidence; estimatedCost seulement
si l'évaluation et la mission le justifient explicitement.

Difficulté de reconstruction, incertitude scientifique et intelligence d'un
modèle sont trois choses distinctes. Les scores sont ordinaux, non calibrés.
Une baisse exige des preuves nouvelles identifiables, pas une reformulation de
la justification ni un besoin de passer un seuil. Ne modifier aucun catalogue,
coût, permission, méthode ou score pour obtenir un routage. Ne lire aucune
proposition privée ou réconciliation future de la cible.
