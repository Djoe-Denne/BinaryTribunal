# A/B — semantification indépendante, politique RE v1

Session fresh ; lire tous les fichiers gelés. Seuls les outils IDA readonly
exactement déclarés par rePolicy.idaReadBindings sont autorisés en complément.
Inputs/outils insuffisants : expliciter les questions et le blocage.
Aucune communication avec A/B/R, aucun bulletin ni team_message. Aucun script,
py_eval, mutation, SetType, rename, commentaire, sauvegarde ou debugger.
Rendre uniquement le payload strict attribué ; l'autorité de publication reste
au parent et ne découle jamais de la fin de l'exécution.
