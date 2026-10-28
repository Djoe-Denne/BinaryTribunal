# M2 — 156 : compteurs de test séparés, revue du raccord

## Livraison et preuves parent

Le seul test autorisé est livré :33641octets, empreinte1a6bce29… vérifiée. Les treize autres sources153 et inputs122 sont inchangés ; les tests antérieurs aux cinq variantes sont un préfixe exact. Quatorze sources sont gelées readonly. [Manifeste155](../evidence/s2-replacement-source-155.json). Baseline conservée sous snapshots/s2-measure-154.

Le parent lit les lignes297–390 : précondition sur les bytes réels de l'événement, spy pass-through sur le même EventLog.read, profondeur restaurée en finally, compteurs séparés et somme confrontée au total natif. Les lectures SQL, mutations et assertions d'ownership restent présentes. Il ne s'agit pas d'une preuve runtime ; compilation et mesures actuelles restent non exécutées.

## Reprise de revue demandée

Vérifier uniquement TEST-PARSE153 et l'impact du test155. Deux appels sans mutation doivent chacun décoder une fois au préambule et parser une fois l'événement ; aucune lecture historique dans les quatre branches rejetées avant cet audit. Vérifier que le spy ne change ni instance, arguments, résultat, exception ou restauration, et que le compteur préambule reste sensible à un mémo absent ou partagé abusivement entre appels. Garder les cinq scénarios, quatre lectures natives du nominal, métadonnées courantes, ownership et snapshots exacts.

Réutiliser l'acceptation statique du produit par154 et les preuves antérieures hors impact. Pas de réaudit du mémo produit, des66cas ou du scientifique450+9. Retour prêt pour compilation ou défaut bloquant précis ; suggestions différables séparées.

Strictement lecture seule : aucun write/import évalué/typing/test/thread/SQL/DB/asset/provider/Git/délégation/oracleQA. Après acceptation seulement, compilation neuve avec308base+overlaycodec exact puis mutations et diagnostic ciblés sur ressources neuves. Aucun gain promis, seuil15s inchangé, trois threads toujours HOLD125. S2/M2 restent non acceptés, commandes consolidées non lancées.
