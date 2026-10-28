# Mission préparée, archives QMD vérifiées et checkpoint publié

## Résultat

La [nouvelle mission](../../../../docs/missions/rms-static-closure-20261028/MISSION.md) reprend le plan initial, les acquis M2 et les manques établis. C'est un préplan documentaire : aucune nouvelle équipe native importée et aucun `start` exécuté.

La conversation, ses seize auteurs et son préparateur ont été archivés : **18 sessions, 65 fragments publics assainis**. La couverture des messages et descendants est vérifiée, avec une coupe temporelle explicite. Raisonnements privés et contexte système exclus ; trois chaînes reconnues comme secrets masquées.

QMD retrouve tous les 69 fichiers Markdown d'archive et de sources préparées. Quatre synthèses ont été créées et deux pages rapprochées. La mise à jour textuelle autorisée n'a changé aucun document des huit autres collections. La vectorisation de `ff8-wiki` a terminé 77 documents et 27 638 fragments ; recherches textuelles, recherche sémantique et lecture d'une synthèse réussies.

## Publication confirmée

Le checkpoint **`d9bc333bd4fba8253b082487545f507f2a97831b`** est committé et poussé sur `origin/main` dans `Djoe-Denne/BinaryTribunal`. Une lecture indépendante de la référence distante confirme ce même commit.

- 33 434 changements de fichiers : 33 328 ajouts, 105 modifications et une suppression préexistante.
- Sélection indexée exactement conforme à la liste approuvée : aucun chemin supplémentaire ou manquant.
- Les 78 sources gérées par l'ingestion ont le même SHA-256 dans les objets Git que dans leur manifeste ; aucune dérive de fin de ligne.
- Plus gros nouvel objet retenu : 9 417 560 octets, sous la limite de 100 MiB.
- Aucun hook actif, aucun contournement de hook, force-push, amend ou fusion.

Les deux fichiers du présent compte rendu de clôture font l'objet d'un commit documentaire de suivi ; la réponse finale donne la tête réellement publiée après ce suivi. Le checkpoint de données ci-dessus reste leur référence de preuve, sans prétention auto-référentielle.

## Exclusions et limites

Conformément au choix utilisateur, ce n'est pas une sauvegarde distante de chaque octet. Gros artefacts et captures, dépendances, caches, trois réglages propres à la machine, contenus nécessitant encore une revue et dépôt imbriqué restent locaux. Les manifestes détaillent ces exclusions et leurs empreintes. Aucun fichier local exclu n'a été supprimé, déplacé ou réécrit.

L'index Git est vide après le checkpoint. Les modifications locales restantes correspondent toutes aux exclusions approuvées ou aux journaux de cette opération, sans chemin inattendu. Deux réglages suivis restent modifiés localement : `.codex/config.toml` et `.cursor/mcp.json`.

**Aucun test produit relancé.** Les trois commandes consolidées restent non exécutées ; les limites de délai, interdictions de threads et contraintes d'origines restent applicables. S2/M2 ne sont pas acceptés. L'archivage et le push n'autorisent pas l'exécution de la nouvelle mission.

## Preuves

- `docs/missions/rms-static-closure-20261028/receipts/qmd-ingest.json`.
- `docs/missions/rms-static-closure-20261028/publication/README.md` et les manifestes associés.
- `docs/missions/rms-static-closure-20261028/receipts/publication-confirmed.json` : référence du checkpoint, push et readback distant.
- Inventaires d'archive sous `obsidian-docs/_raw/rms-m2-opencode-20261028/`.
