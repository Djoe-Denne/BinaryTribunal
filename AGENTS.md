# re-ff8 — directives locales de campagne

Lire `AGENT.md` et les protocoles applicables avant travail RE. L'ASM natif est
la source de vérité ; aucune promotion sur la seule prose d'un worker.

## Pool battle-static-discovery — avenant utilisateur 2026-10-10

- **12 agents de campagne au total : 1 superviseur + au plus 11 workers**.
  Le chat racine extérieur n'est pas un treizième agent de campagne.
- Le superviseur seul délègue. Les feuilles ne créent aucun sous-agent.
- Appliquer `docs/tech/investigation/battle-static-discovery/POLICY_campaign-pool-2026-10-10.md`
  et sa file JSON ; cette règle supersède les anciens plafonds 3/5 et la cadence
  par batch. Recycler immédiatement tout slot libéré si une tâche est READY et
  autorisée. Ne pas remplir artificiellement les slots ni sauter les dépendances.
- Tous les appels worker portent un override explicite : Flash high pour pack/C
  primaire, Sol high pour reviews/sémantique/contrôles/R. Un échec Flash technique,
  refus ou résultat incomplet inutilisable autorise **une seule** tentative de
  remplacement Sol high, même rôle/inputs, nouvelle session possédée et provenance
  conservée. Pas de fallback solo. Un défaut C de review suit le protocole de fix.
- Les slots sont recyclés, **pas les contextes aveugles** : A, V, B et auteurs C
  indépendants sont disjoints. Pas de reprise d'une session enfant étrangère.
- §5.6, écritures IDB, sauvegarde/readback et commits restent réservés au
  superviseur et sérialisés. Les workers ne modifient ni IDB, ni git, ni registre.
- Ce setup ne lance aucune campagne. Activation seulement sur GO long du parent.
  Aucun suspend/veille/réarmement/action d'alimentation n'est autorisé.
- L'adaptatif est limité aux six EA du pilote. Après bilan, pas d'extension
  adaptative automatique ; la suite éventuelle conserve le canon enregistré.
