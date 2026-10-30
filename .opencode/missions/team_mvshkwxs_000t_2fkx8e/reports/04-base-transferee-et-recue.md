# 4. Base candidate transférée et reçue, sans test produit

## Résultat

Le préalable à la réalisation RMS est satisfait dans sa portée : une copie possédée conserve exactement **357 fichiers**, sans toucher aux originaux. Le superviseur a recalculé indépendamment les tailles et empreintes des fichiers source et destination : **zéro différence**. Les deux copies du nouveau manifeste sont identiques.

La copie comprend la composition attendue et son exception codec, les quatorze sources176, les quatre fichiers protégés source113, les onze extras, les contrôles hérités et courants, les dix entrées et le codec qualifié original séparé. Les cinq configurations supplémentaires présentes dans le harness ont aussi été conservées et inventoriées. Les catégories se recouvrent : leurs nombres ne s'additionnent pas en couverture.

## Ce que cette réception ne prouve pas

Aucune base active, autorité, actif ou origine n'est transféré. Le nouveau manifeste a sa propre identité ; l'ancien sourceSet n'est pas réutilisé. L'égalité d'octets ne prouve ni le comportement du candidat ni la validité des nouveaux chemins d'exécution.

Vingt-six fichiers sont signalés pour qualification de références de chemins ou dépendances. Les configurations héritées de typage font notamment référence au node_modules canonique : elles ne sont pas réputées immédiatement exécutables dans la nouvelle copie. Aucun test ou CLI produit lancé.

Les trois arrêts liés au délai, aux threads et aux origines restent inchangés. La suite consiste à qualifier accès et chemins, consulter l'unique architecte pour les jonctions, et analyser le remplacement sur les preuves conservées. Ces travaux en lecture seule peuvent avancer indépendamment après cette réception.

## Preuves et traçabilité

- Destination : `.tmp/rms-static-realisation-20261028-r1`.
- Manifeste : `../evidence/base-transfer-manifest.json` ; reçu parent : `../evidence/base-transfer-parent-readback.json`.
- Journal unique des obligations : `../OBLIGATIONS.md`.
- Outil local de copie : `../transfer-base.mjs`, jamais d'import/exécution de code produit. Syntaxe et préflight observationnel : code 0 ; copie et readback : réussis.
- Le contrôle de phase worker `team_handoff` a répondu qu'il exige une affectation autonome. Aucune phase worker n'a donc été activée ; le lead a effectué lui-même le transfert/intégration sous le contrat approuvé et ses permissions natives, sans reconfiguration.

Localisation : manifestes et recette connus. Impact : copie possédée et artefacts locaux de mission. Limites : réception de fichiers uniquement, pas de qualification native ou produit. Aucun nouveau GO nécessaire.
