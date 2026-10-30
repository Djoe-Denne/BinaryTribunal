# 3. Livraison retrouvée, versions rapprochées, études du parcours engagées

## Objectif et résultat d’étape

La mission produit un dossier documentaire pour préparer la réalisation RMS.
La première étude est reçue et publiée dans
[Preuves et versions](../../../../docs/missions/re-graph-scheduler/rms-static-documentation-20261028/01-preuves-et-versions.md).
Elle est acceptée comme entrée documentaire des études suivantes, pas comme
acceptation du logiciel ou du dossier final.

Les études du parcours complet et du contrat public travaillent désormais en
parallèle sur cette base. Les autres dépendances restent intactes.

## Livraison retrouvée avant remplacement

Ensemble a signalé l’auteur inactif sans finale récupérable. Le superviseur a
consulté sa seule session native : une finale visible complète existe, avec
`finish:stop` et un dernier événement natif `idle/succeeded`. Aucun auteur
remplaçant n’a été créé, aucune reprise de son travail n’a été demandée.

La cause exacte du défaut de récupération n’est pas établie. L’incident ne
prouve ni indisponibilité de modèle ni absence de travail. Aucun correctif de
plugin ou récupérateur concurrent n’est nécessairement justifié par ce seul fait.

## Preuves vérifiées et conséquences

Le parent a confronté les affirmations déterminantes aux fichiers conservés :

- Les 47 fichiers du candidat S1 correspondent au manifeste qualifié.
- La composition intégrée isolée correspond à 308 des 309 lignes historiques ;
  l’exception est le codec diagnostic autorisé, avec sa propre empreinte. Il ne
  faut pas transférer automatiquement la qualification du codec original.
- Les quatorze sources du dernier manifeste de remplacement correspondent.
- Le plan indépendant L7 existe et son empreinte a été revérifiée : le travail
  documentaire ne doit pas être recréé.
- L’adjudication numeric conserve ses 450 paires qualifiées et ses limites ;
  les neuf régressions restent une preuve distincte, sans nouvelle invocation.
- Le reçu final du diagnostic conserve zéro PASS, un FAIL et une condition
  explicite d’arrêt malgré un diagnostic complet. Le remplacement reste bloqué.

Ces comparaisons d’octets ne sont pas des tests produit, une qualification
fonctionnelle actuelle ou une preuve d’intégration Git. Les scopes des autres
reçus sont cités sans additionner leurs compteurs.

## Vérifications et suite autorisée

Le risque de transfert injustifié entre versions reste un point central de la
revue finale. Les auteurs suivants reçoivent seulement le document accepté et
leurs sources utiles, pas les conversations d’auteurs. Aucun test, base, module
produit ou événement natif de démonstration n’a été exécuté.

L’auteur des preuves a été arrêté après réception ; lecture seule, sans fichier
écrit ni branche de travail, donc aucune fusion Git n’est applicable.
Le superviseur continuera les études prêtes puis la consolidation et la revue,
sans nouvelle demande de GO pour les choix documentaires courants.

## Annexe de traçabilité

- Finale D1 : session `ses_e7c63ec35ffe58ue1aTqsOQjJO`,
  message `msg_183a182a0001RRVQlw3605VCow`, Sol xhigh natif conforme.
- [Lecture parent du reçu primaire](../evidence/parent-receipt-readback.json).
- [Comparaisons de fichiers et portée exacte](../evidence/parent-d1-file-comparison.json).
- Étude du parcours : `doc-parcours`, session `ses_e7c59f3d9ffe6PS5DpgaUbaU4k`,
  `{providerID:openai,id:gpt-6.1-sol,variant:high}` lu nativement.
- Contrat public : `doc-public`, session `ses_e7c59b4e0ffeh07eCVh0C0Axvz`,
  `{providerID:openai,id:gpt-6.1-sol,variant:xhigh}` lu nativement.

Localisation / impact / limites : publication du premier livrable et preuves
documentaires de cette mission, sans modification des sources ou historiques.
La revue indépendante et les cinq autres documents restent à produire ; le
dossier n’est pas déclaré complet.
