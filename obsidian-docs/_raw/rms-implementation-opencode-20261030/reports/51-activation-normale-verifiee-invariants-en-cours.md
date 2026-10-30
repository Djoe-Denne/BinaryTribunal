# 51. Activation normale vérifiée ; reprises et barrières en cours

## Résultat nouveau

Le cas normal d'activation fraîche termine avec **1 PASS, six assertions**, exit0,91720 ms de processus, soit environ1 min32 s. Les365 fichiers restent identiques. Il vérifie le candidatNEW, la présence de son observation dans les sources de l'inventaire final, le lien entre remplacement, tentative et inventaire, puis l'activation COMMITTED.

Le positif de remplacement précédent reste acquis séparément :1 PASS/17 assertions en14813 ms. Ces deux résultats ne sont pas des rejeux du diagnostic gelé et ne prouvent pas la concurrence native ou un scénario de quatre origines.

## Contrôles suivants, sélection fermée

Neuf cas existants sont sélectionnés, sans modifier le produit ou les attentes :

- stage au plafond3, bootstrap inclus ;
- réouverture du stage avec refus d'admettreNEW ;
- réponse perdue de préparation, retry identique sans recharge ;
- réponse perdue CAS, réouverture et résultat immuable sans recharge ;
- révocation lors de l'append de préparation et de swap (deux cas) ;
- égalitéTTL après append en préparation et en swap (deux cas) ;
- conservation de la famille engagée et des ressources, avec refus du final tant que la quiescence est incomplète.

Les helpers et corps de tests concernés ont été lus ; ils n'appellent ni le diagnostic86 ni les contenders ou la demande de quatrième origine. Le parent réserve neuf fixtures neuves distinctes selon les baux prescrits, chaque domaine explicitement isolé au plafond3 bootstrap compris. Ce ne sont pas des copies réinitialisant un ancien compte. Les ressources et les refus restent conservés.

Exécution sérielle,600000ms par test, arrêt au premier échec pour correction justifiée. La borne du processus couvre le lot et n'est pas la borne individuelle. Aucun résultat n'est anticipé. Les anciennes preuves valides non affectées ne sont pas rejouées pour cette consolidation.

## Limites et suite

Une réussite confirmerait qu'aucun nouveau correctif de performance n'est nécessaire pour ces cas sous le budget actuel, pas une absence universelle de défaut. Le volet remplacement sera alors rapproché des autres preuves acquises pour décider si un delta de code est encore justifié. Les obligations interdites ou natives manquantes resteront explicites dans la vérification finale et la revue indépendante ; aucune dépendance ne sera sautée en créant un reviewer parallèle équivalent.

## Preuves

- `../evidence/replacement-activation-ten-minutes-r1.execution.json` et captures : six assertions,91720ms, sourceDrift vide.
- Sélection en cours : `run-final-replacement-nominal.mjs invariants`, handle `sh_1877110e9001GyRSKisCf53f3H`.
- Corps de référence : replacement.test.ts:19–68,76–85,129–155 et157–165 ; ces tests sont purement hors ligne même lorsque leurs noms mentionnent HOST, LIVE ou activation.
