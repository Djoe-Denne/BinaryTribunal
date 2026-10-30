# 154. Permissions déclarées et contrôle avant le premier travail

## Objectif et constat

Le premier usage RMS doit partir avec des droits exacts, sans présenter une déclaration comme preuve d'exercice. L'avis du constructeur est reçu : le profil général et le modèle sont connus, la session prévue interdit tous les outils, et aucun exercice RMS antérieur n'est nécessaire. Les sources publiques expliquent la composition des règles, mais ne prouvent pas à elles seules le comportement du serveur chargé.

Le parent a rafraîchi les déclarations par trois lectures natives, sans création de session : même serveur2.2.1/PID31584, règles du profil inchangées, modèle Sol actif et variante high proposée. Ces lectures prennent272ms. Le chemin renvoyé utilise les séparateurs Windows ; un diagnostic confirme qu'il correspond exactement au chemin résolu attendu par le produit. La première comparaison textuelle sans résolution échouait sur cette seule différence d'écriture ; aucun changement produit n'est nécessaire.

## Frontière retenue pour la revue

Le parent distingue trois preuves : déclaration actuelle avant l'envoi ; attribution native des règles à la session ; comportement effectivement exercé. Il ne les fusionne pas.

Un contrôle important existe déjà dans le transport : après création, il relit la session et exige les mêmes profil, modèle, répertoire, permissions et métadonnées **avant d'envoyer le prompt**. Les identités du service sont également revérifiées aux frontières. Cela permet de vérifier l'attribution des règles sans ajouter un nouveau protocole ou une sonde utilisant des outils, contraire au prompt gelé.

La proposition soumise à revue ferme seulement les questions statiques applicables de la pièce de permissions. Les preuves de refus d'outil réellement exercé et de correspondance sources/binaire demeurent non observées dans le dossier de qualification ; ni une liste vide d'exercices ni une absence d'appels d'outil ne les transforme en succès. Aucune qualification complète ou clôture M2 n'en découle.

Une revue indépendante ciblée vérifie cette séparation contre le contrat94. La pièce finale de permissions n'est pas encore matérialisée ni promue en autorité. Les inconnues applicables ne seront pas effacées uniquement pour franchir un contrôle.

## Suite dans le mandat

Après ce contrôle de portée : matérialiser et relire les déclarations réellement justifiées, fermer les identités et images statiques restantes, puis seulement prendre une possession opérationnelle fraîche avec ses véritables versions. Les pièces153 restent acquises ; aucune répétition des huit tests ou des clusterisations. Aucun nouveau GO utilisateur de routine n'est demandé.

## Preuves techniques

- Avis constructeur : result_mvusqo26_0033_1lr9xc, msg_18c3c2722001tAkwHftGckUThi.
- Lecture parent du contrat94:36,42–46 ; client447–456 et486–559 ; native-runtime-transport176–185,212–228.
- Sources publiques conservées : permission.ts147–177 ; le refus configuré intervient avant les saved rules et hooks, sous ce code public seulement.
- [Observations déclaratives rafraîchies](../evidence/native-declarations-refresh-154.json), observations filtrées, pas empreintes des octets wire. Comparaison séparée du répertoire par path.resolve : vraie.
- Les deux fichiers source de composition restent pinnés :13612octets/SHA5038c579ed632333a4b0eb3b8ec9582305724ef68d5b1dce2e1bb98db6f6a5d7 ;2282octets/SHA45b63a6d9f7619d9285663111f26a9a939d64683cac3272881e6dd196409bc1d.
- Aucun effet RMS, droit émis, session créée, test comportemental ou déclaration d'enforcement positif.
