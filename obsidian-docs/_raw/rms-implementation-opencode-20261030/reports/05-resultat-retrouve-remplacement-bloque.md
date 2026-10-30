# 5. Analyse du remplacement retrouvée : ne pas lancer un correctif sans preuve

## Objectif et problème résolu

La mission vise toujours une réalisation RMS vérifiée. Une notification indiquait que le worker du remplacement était inactif sans finale récupérable. L'examen en lecture seule de sa session native a retrouvé une **réponse finale complète**, terminée normalement. Aucune relance ni remplacement de worker n'a été nécessaire.

Ce qui a échoué est la récupération de la finale par le canal de notification ; la cause n'est pas établie. Ce n'est pas une preuve d'échec du modèle ni de perte du travail.

## Décision technique

L'analyse recommande de **conserver source176, sans nouveau correctif sélectionné**. Le superviseur retient cette conclusion : le rapport historique 180 confirme environ 111 secondes contre quinze autorisées, mais ne démontre pas la cause racine ou le bénéfice d'une optimisation supplémentaire. La copie ciblée mesurée n'est pas un coût majeur ; cela ne généralise pas à toutes les copies.

Le chantier correctif est explicitement différé avant admission. Recevoir la tâche d'analyse ne valide ni le remplacement, ni son délai, ni les threads, ni le scénario nécessitant quatre origines. Les trois obstacles restent distincts et bloquants. Aucun nouveau diagnostic, mesure, test ou instrumentation exécuté.

La qualification des accès/runtime poursuit son travail indépendamment. La consultation de l'unique architecte restera fondée sur ses résultats et pourra traiter les interfaces sans inventer un correctif de performance.

## Preuves et limites

- Finale native conservée : `../evidence/ses_e7bfce26fffe9pekRRk3rnSFpV-native-final.json` ; réponse assistant `msg_184065ba4001ljwSZEZqNdPPXW`, finish `stop`, dernier événement idle `succeeded`.
- Model.Ref natif de la session et du message relu : `providerID=openai`, `id=gpt-6.1-sol`, `variant=xhigh`. La preuve du message est persistée dans `assistantModel` ; aucun override ou repli.
- Vérification parent : `.opencode/missions/team_mvnxgnse_0000_39vpc8/reports/180-bilan-copie-negligeable-arret-convenu.md:5–17,30–34`.
- Récupération via découverte du service existant et GET documentés par son OpenAPI. Aucun service démarré, redémarré ou reconfiguré, aucune session réassignée, aucune credential persistée. Seuls texte final et provenance sélectionnée sont conservés ; raisonnement privé exclu de l'artefact.
- Script local `../recover-owned-final.mjs`, limité à la session possédée : outil de récupération de livraison, pas harnais produit ni preuve native du parcours RMS. Syntaxe vérifiée ; première récupération réussie. Décodage de la réponse session corrigé ensuite pour prendre en charge l'enveloppe `data` ; aucun besoin de rejouer la livraison déjà conservée.

Localisation : finale de session possédée et reçu historique connu. Impact : réception de l'analyse et report du writer correctif seulement. Limites : aucun test produit, aucune qualification de performance ou native nouvelle, aucune clôture de la mission.
