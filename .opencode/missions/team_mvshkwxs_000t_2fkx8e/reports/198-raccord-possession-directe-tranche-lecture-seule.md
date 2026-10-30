# 198. Raccord de possession directe : tranche lecture seule

## Architecture retenue

Le parent ratifie le mécanisme concret proposé : l'invocation RMS Bun lance et possède directement l'enfant Bun. La capability est émise seulement après un handshake attribué à l'objet ChildProcess réellement créé, sous l'invocation privée, et invalidée à la fermeture, expiration ou révocation. Aucun helper Node, service découvert adopté ou reçu193 ne peut créer cette possession.

L'issuer reste privé ; les fichiers conservent des faits non secrets, jamais le handle, le secret IPC ou une autorité désérialisable. La factory doit consommer un vérificateur non-minting lié statiquement au registre privé, pas un callback fourni par l'appelant. Ce choix ferme le chaînon architectural du rapport197 ; son implémentation et son comportement restent à vérifier.

## Réalisation autorisée : tranche A, lecture seule

Le parent autorise un candidat logiciel limité à la possession vivante, la provenance npm typée et un port owned **refusant tous les POST**, même avec une capability valide. La composition tient le même enfant pendant son segment de lecture autorisé, puis le ferme en finally. L'ancienne voie service/V1 et ses champs de provenance restent inchangés.

Les fichiers retenus sont `src/client.ts`, `src/native-runtime-transport.ts`, `src/graph-runtime-binding.ts` et les deux tests existants `test/client.test.ts`, `test/runtime-binding.test.ts`. Aucun nouveau moteur, store ou transport. Toute extension nécessaire de ces fichiers doit être remontée avant édition. La branche opérationnelle, les mutations GraphStore et la publication ne font pas partie de cette tranche.

La barrière après CREATE prévue par le contrat demeure obligatoire avant toute future activation POST. Elle n'est pas remplacée par un booléen de callback ou un TODO annoncé comme une protection active. La tranche B devra la réaliser et vérifier tous les chemins, dont le rapprochement après réponse perdue ; jusque-là la tranche A reste entièrement non mutante côté HTTP métier.

## Isolation du candidat et QA

Le parent a créé un worktree détaché neuf `rms-owned-runtime-readonly-198`, depuis la révision retenue340386a9926f8afafc6dab6fe08f9a237afb2c75, après contrôle du HEAD et de la propreté des cinq cibles. Sa création, son HEAD et la présence du transport ont été relus. Le runtime retenu et les preuves antérieures ne sont pas édités ; aucune base RMS n'est copiée.

Le constructeur édite uniquement les cinq fichiers autorisés, sans import, test, hôte ou accès réseau. Il ajoute des tests offline ciblés dans les fichiers existants : faux cap JSON, provenance invalide, absence de mint public et refus POST. Aucun test de spawn ou cas natif n'est exécuté ou autorisé implicitement. Le parent fermera les sélections et dépendances avant tests, puis demandera une revue du code et une qualification pré-modèle Bun→Bun des frontières affectées.

Les preuves Node→Bun193 sont réutilisées pour leur portée, pas transférées à la nouvelle composition. Des droits B/R manquants ne seront pas créés dans la factory ; root, origine déjà comptée et droits170 expirés restent inchangés.

## Références et limites

- Mécanisme auteur `CONCRETE_PARENT_OWNERSHIP_TO_CAPABILITY_CONTRACT_ONLY_PENDING_RATIFICATION`, lignes de contrat1–8, sans effet exécuté.
- Revue conditionnelle197 et lecture parent de l'issuer391–412 réutilisées ; le handle enfant doit maintenant être ajouté au lien d'invocation, pas supposé déjà présent.
- Worktree : `C:/Users/djden/AppData/Local/Temp/opencode/rms-owned-runtime-readonly-198`. node_modules absent au contrôle initial ; aucune installation ou modification globale autorisée.
- Le parent conserve la validation, les actions Git et toute exécution. Cette réalisation ne vaut ni activation POST, ni acquisition d'origine, ni D5/M2 accepté.

## Préparation des dépendances sans installation

Après création du candidat, le parent a établi et relu une jonction node_modules vers la même cible déjà utilisée par le harness retenu340 : `ensemble-793e3f62-2fkx8e-raccord-native-runtime/tools/ff8-harness/node_modules`. Aucun paquet n'a été installé ou importé. La cible partagée n'est pas autorisée en écriture ; elle ne remplace pas la vérification des imports et des chemins réellement exécutés avant les tests.

Cette opération ne copie aucune base ou autorité RMS. Le constructeur reste limité à ses cinq fichiers et n'exécute pas les contrôles. Les preuves et tests nécessaires seront rapprochés du candidat gelé, sans réactiver les anciennes files.

## Complément préparatoire reçu après ratification

Le retour `ROOT_OF_TRUST_PACKET_FINISHED_CONCRETE_OWNERSHIP_AND_ALL_PATH_BARRIER_PENDING_RATIFICATION` termine le paquet préparatoire précédent. Il corrobore le mécanisme de possession déjà retenu, mais ne remet pas198en attente de ratification. Son détail CHECKING/OPEN/HOLD pour la barrière durable appartient à la future tranche B : il n'est pas autorisé en réalisation dans la tranche A, qui refuse toujours tous les POST. La clarification de séquence a été transmise au constructeur, sans réactiver le paquet historique.
