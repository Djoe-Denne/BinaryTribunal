# M2 — 58 : ajouts TDD publics conservés, consigne RO désambiguïsée

## Chronologie et clarification

pool-1 a livré un plan refus/ambiguïtés du client et signale avoir ajouté des tests après son handoff d'implémentation, avant réception de la consigne parent PASGO. Il a suspendu les écritures/exécutions et son dernier message accepte le mandat RO57. Des messages historiques56/S1 dans le mailbox ne sont pas des autorisations000c. Aucun blocage actuel de lecture de politique : la copie57 locale exacte a été fournie et son chemin rappelé.

**Consigne présente : préparation000c RO seulement**, ni code produit ni nouveaux tests écrits ou exécutés. Le déblocage/autorisation technique du task board ne remplace pas l'approbation parent du plan/droits. Le parent n'accorde pas rétroactivement un GO d'écriture aux ajouts ; il les conserve comme travail TDD non exécuté à examiner. Aucun rollback ou nettoyage automatique.

## État fichier vérifié par le parent

- src/client.ts canonique :16526octets/SHA620c690b1dca3c4f47e9e428d6441df331b1b39c576ebd6545fa74e4d685656d, **identique au pin GO**.
- test/client.test.ts :10464octets/SHA0d1100e1671aeea648bd5593887424c2b8d65595f935272a1a8deb12a2d1e5d0. PinGO7167octets/SHA3962639ba3f842ea2ba40be0bf6cac9bd5e1be9e20016fd73f0116bc83c6e22a.
- Parent hache les7167premiers octets du fichier actuel : **exactement le pinGO**. Le changement est donc un ajout de3297octets, pas un effacement ou remplacement du WIP précédent. Aucun module importé/test lancé pour ces vérifications.

Le constat antérieur «300/300 WIP inchangés» du planS2 était une observation d'un état antérieur ; il ne couvre pas cet ajout. La prochaine projection doit distinguer baseline GO et suffixe TDD public non qualifié, sans copier le fichier actuel comme s'il appartenait au gel antérieur. Les tests ajoutés ne sont ni une preuve de défaut ni un PASS.

## Plan public reçu et dépendance S2

Delta envisagé : erreurs publiques SDK2.0.26 et redaction sans fabriquer execution_rejected, refus snapshot absent/malformé/paused/ambigu, contrôle receipt/inspect avant cache/usage ; client.ts et client.test.ts uniquement. Documenter les conventions réellement observées, fixtures contrôlées distinctes de preuve native. Plan utile, non approuvé pour code/exécution tant que périmètre exact/contrat transport/ownership/candidat/budget ne sont pas fermés.

La révision body56 n'est **pas encore ratifiée/disponible**. client.ts est la frontière coordonnée, aucun nouveau domaine body/encoding/exclusion/retry imposé par000c. 000b et000c peuvent comparer leurs obligations en lecture seule ; le parent possède le choix et l'attribution sérialisée. Ne pas exposer oraclesQA indépendants aux auteurs.

## Suite et limites

Demander à000c une restitution finale courte du plan et du suffixe ajouté (tests/conditions/sha), en distinguant défauts réellement déduits du code et hypothèses à confirmer contre contrat public. Aucun patch/refactor/review-pipeline/framework supplémentaire à créer. Après fermeture des contrats, parent décidera seulement les changements et tests affectés utiles, sur candidat isolé si nécessaire ; pas de nouvel accès externe pour contourner le refus.

S1 DATA qualifié/non intégré ; S2/public en préparation ; aucune preuve native, DB, Git ou commande consolidéeM2 exécutée par cette transition. L'ajout TDD reste conservé, non autorisation générale de mutation canonique.
