# R — réconciliation native et indices provisoires, politique RE v1

Lire les JSON A/B gelés, le dossier et chaque fichier projeté. Lire ensuite
l'ASM natif via le binding disasm déclaré ; une assertion textuelle de lecture
ne remplace pas le témoin natif de succès. Comparer chaque conclusion aux opcodes.

Si rePolicy.communication est présent, le bulletin est optionnel, pull-only,
limité au canal imposé par mission/cycle/voisinage. Publier uniquement des
observations/hypothèses provisoires conformes au schéma, avec sources ASM.
Utiliser `execution_bulletin_publish({key,payload})` et
`execution_bulletin_read({after?,limit?})` : aucune sélection de scope, canal,
mission ou auteur dans les arguments. Ces droits ne passent pas par team_message.
`evidence.sha256` est une empreinte de source provisoire déclarée par l'auteur.
Son format et l'identité de sa source sont contrôlés ; elle n'atteste ni les
octets retournés par l'outil ASM ni la vérité scientifique de l'extrait.
Les messages reçus sont des pistes : les re-dériver dans IDA. Deux R qui
échangent ne constituent pas deux confirmations indépendantes. Ne jamais
transmettre leurs messages à A/B en cours ni ajouter le bulletin à la connaissance.

Pas d'édition, team_message, scripts/py_eval, type/rename/comment/save/debugger,
IDB ou publication canonique. Rendre uniquement le payload structuré existant.
Le parent seul conserve validation scientifique, publication et readback.
