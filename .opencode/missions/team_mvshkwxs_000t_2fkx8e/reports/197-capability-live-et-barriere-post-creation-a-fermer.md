# 197. Capability vivante et barrière après création à fermer

## Décision avant modification produit

Le contrat de fichiers reçu vise une extension additive du port existant : provenance npm typée, connexion possédée et barrière de persistance après création de session, avant tout claim de prompt. Le parent conserve cette direction, mais ne ratifie pas encore un issuer abstrait de capability.

Une capability privée doit être liée à **un processus vivant réellement possédé par l'invocation RMS**, avec son handle, secret IPC, expiration, révocation et fermeture. Le reçu193 ne peut pas la créer : son hôte est arrêté. Ni une attestation JSON, ni une URL et un mot de passe, ni un callback public ne remplacent ce lien de possession.

## Point concret en cours de fermeture

Le client RMS utilise Bun pour sa base OWN. La qualification193 utilisait un parent Node qui lançait Bun. Le constructeur précise la composition minimale du futur propriétaire : lancement direct depuis l'invocation RMS Bun ou nécessité justifiée d'un helper Node. Une éventuelle nouvelle frontière Bun→Bun devra être vérifiée avant modèle ; elle n'est pas déjà prouvée par193.

La revue contractuelle cible ce lien de confiance et la cohérence du port/provenance/barrière, sans nouvelle étude générale. Aucun fichier produit ou worktree n'est créé dans cette préparation.

## Invariants du contrat proposé

Le port demeure celui marqué dans son registre privé ; l'ancienne discovery reste compatible. La provenance du nouvel hôte n'altère pas le sens des champs desktop existants. Les POST futurs devraient vérifier les octets/identités retenus, droits et claims durables sans mint d'autorité dans la factory.

La barrière après CREATE doit conserver une preuve positive de persistance rattachée à l'instance, l'image et la session, avec CAS et droits recontrôlés avant le prompt. Une absence ou ambiguïté conserve CREATE, débit et origine puis HOLD, sans nouveau prompt ou remboursement inventé. Ni cette tranche ni ses tests ne rendent une qualification publiable ou ne retirent le veto170.

## Livrables et limites

- Contrat auteur `READONLY_FILE_CONTRACT_OWNED_HOST_PROVENANCE_POSTCREATE_ONLY_PENDING_RATIFICATION`, sources du worktree340 et tests existants ciblés ; aucune réalisation.
- Le budget reste celui clarifié196 : droits B/R non établis, pas impossibilité démontrée du plafond de trois. Aucun effet d'allocation pendant ces travaux.
- La qualification HTTP193 est reçue dans sa portée ; aucun nouveau serveur, session, prompt ou modèle n'est actif. Le raccord, les preuves natives du parcours D5 et M2 restent ouverts.

## Avis contractuel et corroboration parent

L'avis `result_mvv3yaaw_0006_hhfzyo` juge l'architecture compatible sous condition : la custody vivante reste bloquante avant ratification. Le parent a directement relu `client.ts:391–412` : l'issuer privé vérifie l'invocation directe, son expiration et le contrôleur courant, puis enregistre une capability d'invocation. Il ne possède pas encore de handle du futur enfant.

La revue précise que la barrière doit s'appliquer aussi après rapprochement d'un CREATE à réponse perdue, avant tout claim de prompt. Un HOLD après création doit rester durable et interdire le prompt après reprise tant que la preuve et les droits ne sont pas établis. Ni l'ancien claim CREATE ni son débit ou son origine ne sont annulés pour faciliter la suite.

Les contrôles de handle mort, IPC divergent, pins modifiés, révocation entre barrière et claim, interruption et reprise du HOLD seront requis sur les frontières affectées après implémentation ; ils ne sont pas déclarés acquis par193. L'auteur ferme seulement le mécanisme concret de possession demandé, sans réalisation ou nouvelle étude générale.
