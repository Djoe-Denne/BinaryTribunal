# 192. Hygiène d'environnement contrôlée sans import

## Résultat

La correction cible uniquement les six noms ajoutés observés par la sonde190. Le parent a corroboré les nouveaux pins, vérifié que le runner reste inchangé et contrôlé la syntaxe du bootstrap : sortie0 en30ms, sans import.

Sept contrôles isolés passent en3ms sur le bloc extrait et la véritable garde d'allowlist, avec un objet d'environnement simulé : retrait exact, casse variée, aucune lecture des valeurs, maintien/refus d'une clé inconnue, refus d'une clé ciblée non supprimable, environnement propre inchangé et conservation/refus d'un nom seulement ressemblant.

Le contrôle des lectures utilise des getters qui lèvent une exception si une valeur ciblée est consultée. Aucun n'a été appelé. Aucun environnement réel, application ou processus enfant n'est modifié ou lancé par ces contrôles.

## Décision et suite

Le même reviewer reprend seulement le delta d'environnement et ses conséquences, en réutilisant l'avis du runner et les preuves antérieures. Aucune nouvelle qualification n'est encore autorisée. La correction n'élargit pas l'allowlist et ne garantit pas la réussite du prochain import ou démarrage.

Une première formulation de l'appel Code Mode des microcontrôles contenait une erreur de syntaxe : elle a été corrigée avant l'exécution du sandbox. Ce n'était ni une panne MCP ni un essai produit. Les sept résultats ci-dessus concernent l'appel corrigé.

## Preuves et limites

- [Résultats isolés](../evidence/host-env-hygiene-isolated-checks-192.json).
- Bootstrap10061octets/SHA `e25c43c7b4b2fd9a9f1dba7ece1dcc42d27a7650ee3444f9b2c2eec340cf9a99`.
- Plan16302octets/SHA `5d147c490a05f61323fb05436f835b058275c6933c3c6c9cd12494d83029ed67`.
- Runner20993octets/SHA5e612 inchangé ; baselines et reçu189 préservés.
- Livraison auteur `result_mvv3bwij_000r_pk8zfy`, aucun test ou lancement déclaré par lui. Les contrôles syntaxiques et isolés sont ceux du parent.
- La sonde190 ne permet pas d'affirmer rétroactivement les noms précis du refus189 ; les garanties HTTP et de chargement natif restent non acquises. Aucun nouveau modèle, session ou origine. D5/M2 restent ouverts.
