# 4. Route publique identifiée, raccordement natif encore à établir

## Objectif et résultat d’étape

Le dossier doit distinguer les composants existants des preuves restant à
obtenir, pour préparer une réalisation minimale respectant Ensemble.
Le [contrat public documentaire](../../../../docs/missions/re-graph-scheduler/rms-static-documentation-20261028/04-contrat-public-et-observations.md)
est reçu et accepté comme entrée de consolidation, sous revue documentaire globale.

Il existe bien une route de code publique : `connectPublic` appelle le RPC
`ensemble.execution.v1`, et le client gère des identités et receipts persistants.
Cela ne démontre pas le raccordement RMS aux événements natifs. Le port consommé
par GraphEngine est explicitement fixture et requiert des preuves terminales.
Renommer ce port ou déduire sa preuve de l’inactivité ne fermerait pas la lacune.

## Contrôles parent et portée

Le parent a relu via Serena les corps de `ExecutionClient.submit`, `connectPublic`,
`FixtureExecutionPort` et `GraphEngine.observe`, ainsi que les consommateurs de
`connectPublic`. La racine commune `retro-eng` est confirmée ; aucun changement
de projet symbolique ou de source n’a été effectué.

Le client, le port, le moteur et le test client ciblés sont égaux octet pour
octet entre canonique et candidat isolé ; leurs empreintes figurent au document.
Cette comparaison borne les lectures statiques, sans qualifier une exécution.

Le document sépare digest du payload client et digest upstream du body historique,
réponse perdue et absence transactionnelle à démontrer, refus typés et erreurs
d’infrastructure, observation terminale et publication scientifique. Les tests
conservés sont des bases futures, pas de nouveaux PASS.

## Inconnues maintenues, sans arbitrage prématuré

L’auteur a rencontré un refus de permission pour les sources externes du plugin
et ne l’a pas contourné. Le parent n’a pas trouvé le nom exact du RPC dans la
source locale `opencode-ensemble-session` consultée : ni absence globale de
handler ni identité du code déployé n’en découlent. La source serveur autorisée,
épinglée et compatible reste nécessaire au futur contrat et préflight public.
Ce manque est circonscrit dans le document, pas masqué par un appel natif interdit.

Les garanties de terminalité, événements précis et permissions effectives restent
à prouver sous mandat futur. Le dossier documentaire peut préparer cette décision
sans prétendre l’avoir exécutée. Aucun nouveau récupérateur ou test n’est proposé
comme opération actuellement autorisée.

## Livraison conservée et suite

Le système avait encore signalé une finale non récupérable ; la réponse complète
était présente dans la session native avec fin normale et événement idle/succeeded.
Elle a été retrouvée par le superviseur, sans remplacement, reprise ou nouveau modèle.
L’auteur a été arrêté après réception, sans fichier ni branche à fusionner.

L’étude du parcours reste le prérequis actif du remplacement. La suite se poursuit
sur réception ; aucune nouvelle décision utilisateur n’est nécessaire à ce stade.
Aucun test, module produit, base, live, IDA ou démonstration native exécuté.

## Annexe technique

Finale D4 : session `ses_e7c59b4e0ffeh07eCVh0C0Axvz`,
message `msg_183aa7b08001UgtOIjpFV71Rn3`, Sol xhigh natif conforme.
Les lectures du parent sont statiques et ciblées ; la couverture des consommateurs
n’est pas déclarée exhaustive. Le dossier final et sa revue indépendante restent
à terminer ; aucune acceptation logicielle n’est rendue.
