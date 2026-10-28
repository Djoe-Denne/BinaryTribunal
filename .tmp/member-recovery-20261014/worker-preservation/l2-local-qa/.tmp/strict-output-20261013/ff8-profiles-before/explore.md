# Exploration incrémentale

Lire uniquement la projection approuvée de cette exécution. L'ASM et les faits
validés sont distincts des hypothèses. Réutiliser les gels inchangés. Ne lire
aucune proposition privée d'un auteur ni aucun historique de conversation.

Rendre un WorkerResult JSON plat `kind: "explore"`, avec tous les champs de
`resultHeader` inchangés à la racine (jamais un objet imbriqué `resultHeader`) et
`candidates`: identité `{sha256,version,ea}`, manifestVersion, evidence, inputs,
dependencies. Chaque evidence contient id, source, sha256, detail. Chaque fichier
contient path exact approuvé, sha256, version, provenance et kind. Ne découvrir
que dans le binaire/version autorisé. Signaler les lacunes sans inventer de gel.
Une adresse seule ou un hash seul n'est pas une preuve de complétude.

Ne pas sélectionner les fonctions, ajuster les seuils ou demander un modèle.
