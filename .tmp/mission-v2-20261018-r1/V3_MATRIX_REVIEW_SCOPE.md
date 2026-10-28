# Review fresh V3 matrix — source statique seulement

Rôle V indépendant de l'auteur. Session fresh, aucun fork ou contexte d'auteur.
Le candidat et son DESIGN sont visibles volontairement ; pas de rôle B aveugle.
Sources autorisées : seuls les fichiers de ce paquet, jamais origin/ hors paquet.

Phase initiale ACK-HOLD : vérifier accès/hash de tous les pins, NONBLIND, puis
demander approbation du plan et rester IN_PROGRESS. Aucune analyse avant GO
distinct ; ne pas rendre une livraison terminale sur le reçu d'accès seul.

Après GO : review adversariale RunnerMatrix.cs contre les 8 dépendances réelles,
le RunnerReal de référence NON invoqué, les contrats et dispositions parent.
Contrôler syntaxe/API C#5 statiquement SANS compiler/parser produit, entrypoint,
closure, namespace/internal, limites et ownership des threads/handles/writers.

Attaques prioritaires :
- les 14 membres owner délèguent réellement, sans observations fabriquées ;
- D/S injection tentée une fois après vrai Resume, erreur SetEvent visible,
  attendre signal réel et vérifier que le cas exercé ne peut être déclaré
  conforme si le chemin n'est pas observé ;
- G = faute managée injectée postRun/préACK, capturée puis terminaison effective
  du thread, GuardianAlive réel ; zéro ACK cross-thread ou après mort, zéro
  Thread.Abort, aucune prétention midRun/processus distinct ;
- altération uniquement slotGuardianResult, exactement une vraie Write192B avec
  XOR byte191, copie bornée après débit du budget, vraie destination/readback,
  aucune source substituée ou autre slot contaminé ;
- incohérence transfers length4 rejetée avant core/owner, distinguer ressources
  préparatoires events/pipes et création Job/T ;
- at-most-once, enfant inerte/join bornés (60s proposés), délais globaux futurs
  documentés, timeout/injection absente/cleanup/stdout failure jamais succès ;
- aucun close J par harness/faux GuardianAlive/stop externe/recrédit budget ;
- sorties/attendus honnêtes, jamais PASS de DriverLoss ni résultat observé.

Ne pas confondre le comportement prévu avec un run. Échec de compilation
potentiel se signale avec symbole/API/ligne ; aucun build pour le tester.
Pas de nouvelle fixture oraculaire, modification, import produit, exécution,
probe, API native/processus/DB/git/registre/configuration/IDA/live/réseau/délégation.
Les hash/lectures de données statiques sont permis, pas le chargement du produit.

Rapport terminal ACCEPTABLE_SOURCE_SCOPED | CORRIGE | BLOCK : défauts précis,
effet observable conditionnel, 3–8 ancres, contrôles restants, rehash final.
Le parent intégrateur seul décide ; review source seule n'ouvre aucune gate.
Budget intégré cross-process NOT_PROVEN, last-close case6 NOT_ESTABLISHED,
S/D events stand-ins, G postRun/préACK seulement, pas C3-C5/G5/G6/G7/full44.
