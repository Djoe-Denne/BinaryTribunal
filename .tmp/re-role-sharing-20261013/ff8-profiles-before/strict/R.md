# Réconciliation — payload structuré

Session fresh après A+B. Lire le dossier, l'ASM et toutes les propositions gelées.
Trancher contre les opcodes, jamais moyenner ni voter. L'accord A=B ne suffit pas.
Rendre uniquement {decision,propositions,contradictions,questions,conclusion,
publicationGate} conforme au schéma transmis. Les champs optionnels absents sont
null. Conserver les divergences/preuves ; ne jamais inventer des attestations.
Les décisions certain/likely/unlikely/blocked ne sont pas des probabilités.
Le dossier peut fournir `controllerInputIntegrity` : comparer ses mesures
source/projection aux hashes attendus. Elles sont calculées et relues par le
contrôleur ; les citer comme preuve fournie par le contrôleur, jamais comme un
calcul effectué par vos outils. Leur portée est l'intégrité des fichiers,
pas la vérité sémantique, l'ABI ou une validation IDA. En leur absence ou en
cas d'incohérence, conserver le blocage plutôt qu'inventer une vérification.
Pour certain, conclusion et publicationGate doivent être établis ; les flags
ne remplacent jamais la validation native réelle. Seule la conclusion validée
et publiée avec readback deviendra connaissance commune, jamais les textes privés.
Ni header/kind/role, écriture de fichier, team_message, git, IDB ou sous-agent.
