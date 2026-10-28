# M2 — 175 : décider d'une dernière mesure ciblée ou conserver le blocage

## Objectif et problème concret

Nous cherchons à valider le remplacement d'un candidat sans rouvrir les admissions ni réutiliser des droits périmés. Les contrôles ciblés de sûreté passent, mais son trajet final prend environ94secondes et échoue à la limite obligatoire de15secondes. La dernière mesure est complète mais ne satisfait pas le critère fixé pour choisir une optimisation :27,6%de couverture contre50%requis. La condition d'arrêt s'applique ; aucune autre modification ou exécution n'est actuellement autorisée.

## Recommandation

Autoriser **une dernière mesure locale et bornée**, pour savoir ce que coûte la copie immuable des preuves courantes avant activation. Le parent recoupe l'expression dans trusted-authority80–82 : elle copie notamment les sources d'hôte retenues, puis les validations et comparaisons restent exécutées. Son coût dominant est une hypothèse, pas un fait mesuré. Cette mesure éviterait de modifier à l'aveugle les règles d'actualité ou les formats stockés.

L'autorisation ne vaudrait **ni choix de l'optimisationA/B précédemment refusé, ni permission d'optimiser cette copie, ni levée du blocage des threads**. Elle répond à une question distincte. La pertinence d'un changement d'architecture n'est pas démontrée.

## Choix et conséquences

### Autoriser la mesure de copie

Ajouter un seul scope de mesure autour de cette copie dans deux fichiers existants : module d'autorité et collecteurRAM. Pas de nouvelle dépendance, service, framework ou format de preuve. Corps, ordre, exception, provenance et comparaison aux preuves effectivement consommées inchangés ; aucune réutilisation d'une ancienne preuve comme preuve fraîche.

Préservation des sources actuelles ; revue indépendante ciblée de l'instrumentation, compilation ciblée neuve, puis **une seule invocation sans retry**, unOWN/asset neufs,15s/test et150s maximum de processus. Temps total d'édition/revue inconnu ; le plafond150s ne concerne que le processus de test. Mesures conservées même en échec ; l'overhead est inconnu et sera déclaré.

Critères fermés : source/intégrité conformes, diagnostic complet sur septphases et sixsites exacts, métriques finies et part du nouveau scope rapportée dans les phases fraîches. Part≥50% : coût majeur observé autorisant seulement une proposition d'étude ultérieure ; sinon piste non établie comme majeure. Diagnostic incomplet : aucune conclusion. **Dans tous les cas, bilan puis arrêt des nouvelles exécutions de ce diagnostic ; aucune optimisation ou seconde mesure automatiquement autorisée.** Aucun changement au tri170 ou au seuil produit15s.

Risque : nouveau run possiblement non concluant et toujours rouge ; mesure ajoutant du coût. Bénéfice possible : décider avec une preuve s'il faut étudier l'acquisition des preuves, plutôt qu'un autre microcorrectif spéculatif.

### Geler le remplacement bloqué

Conserver les sources, bases, assets, rapports et preuves gelés ; aucun nouveau patch ou test sur cette branche. S2/M2 et le remplacement restent explicitement non acceptés pour délai et preuves obligatoires manquantes. Aucun travail acquis n'est supprimé ou requalifié. Une reprise demanderait un nouveau mandat ; ne pas agir maintenant laisse ce blocage en place.

Un refactor de stockage, de contrat public ou de cache d'autorité serait un mandat distinct avec compatibilité et budget à définir. Il n'est pas proposé comme option immédiatement exécutable ou seul moyen d'atteindre15s.

## État des preuves et permissions

Compilation172 verte ; mutations161 et refus167 verts sur leurs versions/périmètres, réutilisés horsimpact. Run173 :0PASS/1FAIL,7assertions,93,55s ; aucune contention lancée. Trois commandesconsolidées toujours non exécutées. Les3threads restent HOLD125/nonwaived ; aucun commit/merge/push/cleanup, scientifique450+9, live ou exécution reconstruite. Politique modèles/révision2 et QArenforcée restent inchangées.

Décision demandée maintenant : autoriser cette extension diagnostique précise ou conserver le gel. Aucun GO supplémentaire demandé pour les petites étapes déjà incluses si la mesure est autorisée.

## Annexe technique

SynthèseRO174 reçue de l'auteur : aucune autre continuation technique exécutable déjà autorisée. Parent lit graph-trusted-authority73–85, copie80–82 puis contrôles83–84. Sources170 gelées, manifeste s2-replacement-source-170 ; preuves du dernier run dans [bilan174](174-diagnostic-inconclusif-appliquer-condition-arret.md). Le constat de manque de preuve n'est pas une démonstration d'impossibilité du seuil15s.
