# Paquets de suivi — échec de rename conservé, admission parent en place

La préparation mécanique du paquet benchmark a échoué au rename final avec EPERM.
Une seconde destination neuve, mêmes pins, a échoué de même. La première préparation
du paquet matrice a aussi échoué au rename. Pas de test/produit lancé. Les stderr et
requêtes restent conservés ; mécanisme EPERM non établi. Aucun nouveau retry, reset,
changement de permissions globales, nettoyage ou correction du helper n'est admis.
Les staging exacts ne sont pas réputés conservés : le staging benchmarkV2 était
absent au contrôle. Pas de claim d'atomic commit ou de reçu helper réussi.

Le parent choisit l'alternative de préparation statique en place : admettre comme
inputs readonly les SOURCE_PACKET explicitement créés par lui, sans les déplacer.
Ils sont distincts des candidats produit et des outputs des workers. Recontrôler
toutes tailles/SHA/regular/nonlink/nlink1/ancêtres, puis session/tâche/rôle natifs,
Model.Ref et garde de politique. Produire un PARENT_ACCESS_RECEIPT détaché ; il n'est
PAS une .preparation-receipt du helper et ne prétend pas à son succès. Pas de copie
ou remplacement d'un ancien gel. Les octets restent ceux des requêtes échouées.

Autoriser ensuite seulement leur lecture explicite, obtenir l'ACK physique et des
conditions, puis GO travail distinct. Aucun worker ne reçoit de droit par la seule
existence du paquet. Aucun test échoué n'est réarmé, aucune preuve native/promotion
n'est produite ; full et code privilégié conservent toutes leurs gates.
