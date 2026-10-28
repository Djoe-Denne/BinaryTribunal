# GO de reprise — 2026-10-15

L'utilisateur autorise explicitement la reprise de `re-graph-scheduler` et laisse
au chat de maintenance le choix de transmettre le contexte utile au superviseur.
On reprend le **lead existant**, pas une nouvelle équipe :
`ses_eca40a8e2ffeanEKTBLiGjDNw8`, modèle natif relu
`openai/gpt-6.1-sol`, variante `xhigh`, toujours sélectionné.

## À retenir de la maintenance du 14

- Plugin actif `20261014-coordination-three-0b4e7444042b` : réveils coalescés,
  lecture/livraison distinctes, scopes destinataires corrigés. Trente réveils
  obsolètes annulés ; deux conservés. Rapports et historique scientifique intacts.
  Ne pas relancer une ancienne revue sur le seul fait d'un réveil rejoué.
- Préparation mécanique explicite avec SHA256/reçus et binding session/tâche via
  API publique ; un reçu n'est ni approbation ni preuve d'accès effectif du worker.
  Une tâche completed ne peut pas être rouverte implicitement par un transfert.
- Avant une revue L2 : préflight sur le **même gel/fingerprint**, puis reviewer
  frais/indépendant et gates parent. Delta-review seulement avec une couverture
  antérieure effectivement endossée et un périmètre correspondant ; sinon full.
- Plugin 1 266 tests PASS ; harnais 492 PASS, types/lint/builds et tests du code
  déployé PASS. Snapshot L2 évalué : 52 cas / 481 assertions PASS,
  fingerprint `845540432bf821aa70e7222d3eb560747777c5555dc5c4211f8f4964eed74509`.
  Ce PASS offline ne constitue **pas** une acceptation L2 ni une preuve native.

## Reprise utile, sous l'autorité du lead

Relire l'état du board et les livrables : la tâche `l2-ids-astra`
`task_mv8fxhjq_00lh_ap0fn4` est completed, pas automatiquement acceptée.
Vérifier son gel réel, la livraison et la revue/gates encore nécessaires, puis
débloquer les transferts et dépendances selon l'ordre existant. Ne pas refaire
les acceptations L4/L5/L6 sans changement ou preuve nouvelle le justifiant.

Le lead seul supervise les claims, le contexte, les workers, les acceptations et
l'intégration. Conserver modèles/variantes, préférences, budget, limites et
indépendance des sessions ; aucun fallback silencieux. Aucun reset, nouveau run01
ou nouvel essai scientifique natif/live n'est autorisé implicitement par ce GO.

Détails : `tools/ff8-harness/docs/COORDINATION_FIX_20261014.md`,
`tools/ff8-harness/docs/COORDINATION_HELPERS.md` et
`.tmp/coordination-three-20261014/native-verification.json`.
Les anciens documents de pause décrivent l'état historique avant ce GO.
