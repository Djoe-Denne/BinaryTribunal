# 68. Prochain incrément : lecteur d’observations DATA sans activation

## Décision et utilité

Le parent retient l’avis du même architecte : un lecteur fini d’observations peut compléter utilement l’adaptateur au repos en fermant réception, attribution et reprise des données. Il ne ferme pas les garanties natives manquantes. Il n’y a ni second propriétaire, ni magasin, ni surveillance permanente, ni nouvelle infrastructure de test.

La jonction prospective est acceptée dans le mandat D6§6, sous le contrat ci-dessous. Un développeur doit d’abord soumettre le plan exact de persistance, fichiers, schémas et tests ; le parent le ratifiera avant écriture produit. La base reçue est l’intégration81be09d, pas un ancien candidat.

## Contrat fermé

1. **Lectures finies seulement.** Découverte du service existant, vérification de son identité, GET du journal de la session possédée avec `follow=false` et GET du message par les identifiants retenus. Aucun réveil, prompt, contrôle, suppression, PATCH, ensure/start, installation ou endpoint fourni par le body. Pas de lecture d’autres sessions ; la liste active globale n’est pas nécessaire à ce premier incrément.
2. **Attribution et autorité distinctes.** La session, le message, le scope et l’image d’admission proviennent de l’opération déjà retenue, pas d’un identifiant importé. Réutiliser les barrières existantes, sans donner une garde privée à un port injectable. Une observation tardive reste rattachée au scope original et ne restaure aucun droit.
3. **SSE et enveloppes explicites.** Le journal est un flux SSE avec JSON encodé ; le message est enveloppé dans `{data:...}` et peut appartenir à plusieurs types. Décoder les fragments et limites sans traiter n’importe quel message comme un assistant. Les schémas réellement consommés doivent être explicités au plan et confrontés à la source épinglée, pas devinés depuis un seul marqueur.
4. **Reprise sans perte silencieuse.** Retenir le curseur `after`, les empreintes et la complétude du lot dans le journal RMS existant. Doublon identique accepté, divergence refusée ; coupure, dépassement, événement d’échec ou décodage inconnu marqués incomplets. Ne pas inventer une séquence contiguë numérique si le journal natif filtre des événements : le plan doit établir la sémantique exacte de curseur et la règle de progression.
5. **Bornes et confidentialité.** Temps, octets et redirections fermés, traitement fini et annulation propre. Les erreurs et en-têtes ne sont pas persistés en clair. Retenir une projection DATA autorisée et des empreintes ; le plan doit définir les champs nécessaires sans copier aveuglément des textes, sorties d’outil ou credentials éventuellement présents dans le journal natif.
6. **Aucune promotion.** `log.synced`, terminal/shutdown, absence d’événement/message/état actif, `executed:false` ou configuration modèle/droits ne produisent ni receipt d’exécution, ni qualification, ni terminalProof, ni libération de claim, ni transition RUNNING/COMMITTED. Les méthodes d’exécution non qualifiées restent refusantes. Pas de raccord implicite GraphEngine/CLI, v3 ou ancien cycle.

## Vérification prévue

Tests hors ligne dans le cadre existant : SSE fragmenté et encodage, enveloppes, attribution étrangère, doublons/divergence, coupure/failure/limites, curseur/reprise, révocation tardive et impossibilité de promotion. Faux réseau seulement. Auteur sans exécution de tests/CLI produit/réseau natif ; parent après gel : compilation, primitives si affectées, ciblés inspectés à dix minutes/test, puis revue indépendante. Réutiliser les preuves inchangées, pas refaire les26 cas déjà valides par principe.

## Limites et preuve de décision

Les garanties de fence serveur, droits exercés, clôture native et ressources externes restent distinctes et non acquises. La reprise d’inférence « au moins une fois » n’impose pas une nouvelle exigence universelle « exactement une fois » : ce sont notamment seconde admission/charge/publication et libération indue de claims RMS qu’il faut empêcher selon le contrat accepté.

Avis : `../evidence/ses_e7bf518b0ffeIgOkK5bOJW2gKI-native-finals-bundle-r3.json`, message `msg_188063b6a0011ZWxMnsrSt9PAm`, SHA256 texte `f30cb59a36ccd42be2b403122fdcd0fb177b127e6525b4187c41796a74402204`. Schémas et sources : rapport67 et `native-observation-api-r1.json`. Aucun code, test ou réveil n’a été effectué par cet avis.
