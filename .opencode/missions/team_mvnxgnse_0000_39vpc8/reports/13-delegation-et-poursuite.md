# M2 — 13 : délégation d'arbitrage et poursuite vers la qualification

## Instruction utilisateur reçue

L'utilisateur délègue par avance les décisions techniques pour maximiser la progression vers l'objectif final, en demandant qu'elles soient consignées. Le superviseur prend donc les arbitrages utiles dans M2 sans répéter des demandes d'approbation de détail.

Cette délégation s'ajoute à l'autorisation explicite L2 du rapport 12. Elle ne crée ni PASS, ni permission native effective, ni droit de contourner une gate. Les limites de mission (pas de C#/jeu/live/IDA/G5–G7, pas de réglage global/achat/fallback ou Git final implicites) restent respectées. Les contrôles d'approbation natifs ne sont pas simulés.

## Décisions d'exécution

1. Finir L1, contrôler son diff et ses preuves ; ne pas multiplier les reviews de ce seul seam. La QA numeric indépendante obligatoire relira le candidat composé et les risques pertinents, pas une chaîne nouvelle de spécialistes.
2. Poursuivre L2 dans la même tâche/session, via adaptation finie des moyens existants. Retenir l'objectif d'équivalence native/source démontrée ; ne pas remplacer la qualification par le diagnostic RAW conservateur qui laisserait les refus non qualifiés.
3. Fermer explicitement champs Error/relation/preuves, fermeture de sources et trust boundary. Conserver tous RAW/frames/indices/cas et les oracles ; aucune simplification masquant un inconnu. Code et contrôles locaux pertinents permis dans le périmètre approuvé ; invocation scientifique reste derrière revue indépendante et validation parent exacte, au plus une sous 180 s/attente provenance ≤10 s.
4. Préparer les seules projections/pins nécessaires, sans restaurer C# ni copier WIP/node_modules en bloc. Les sources scientifiques doivent venir de la candidate gelée, pas du checkout baseline.

## État des preuves au moment de ce rapport

Le worker annonce L1 : rouge 90 échecs/7 succès, puis rouge 90/8 après ajout d'un cas, puis vert 98 succès/0 échec/2 023 assertions ; trois invocations utilisées sur quatre. Ces nombres sont **annoncés par le worker, pas encore validés par lecture parent des logs/artifacts**. Rapport/pins en cours sous le namespace possédé. Aucun run scientifique des 450 ou neuf régressions observé. Aucun des trois checks globaux M2 n'est déclaré exécuté.

Prochaine étape : recevoir/contrôler les artefacts L1, puis candidate L2 et contrat fermé ; progression événementielle sans polling de worker ni perfectionnement hors besoin.
