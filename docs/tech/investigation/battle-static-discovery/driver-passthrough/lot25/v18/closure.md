# Clôture documentaire et preuves — 2026-10-07

Rapport principal : `../../LOT25_V18_OFFLINE_REPORT_2026-10-07.md`.
Clôture machine/hash/processus : `final_validation.json`.
Inventaire hashé des livrables et sources : `artifact_manifest.json` (s'exclut
lui-même pour éviter une référence circulaire).

Le parent a vérifié les huit copies brutes du vault contre leurs sources,
les 18 entrées du manifest et les quatre liens de la nouvelle note. Le journal
d'ingestion délégué a été corrigé contre les reçus avant indexation.
La CLI Obsidian étant absente, les éditions ont été effectuées directement
dans le vault confirmé `re-ff8/obsidian-docs`.

QMD 2.8.3 : le SDK permet une mise à jour ciblée de `ff8-wiki`, contrairement
à la commande CLI `update`. Première tentative : exit 1 avant ouverture du
store, faute de chemin explicite ; script/log/reçu conservés sous
`qmd-attempt1/`. Retry avec le chemin existant confirmé par `qmd status` :
**exit 0**, 7 documents nouveaux, 4 mis à jour, 177 inchangés, zéro suppression
ou skip ; 11 documents/168 chunks vectorisés, zéro erreur. Les métadonnées
des autres collections sont restées identiques.

Le MCP QMD confirme **188 documents ff8-wiki**, aucun embedding en attente et
la note v18 en premier résultat. Voir `qmd_refresh_receipt.json`,
`qmd_controller_receipt.json`, `qmd_mcp_check.json` et `wiki_parent_validation.json`.
La mémoire Serena `battle_driver_lot25_v18_offline` est enregistrée ; la mémoire
v17 renvoie désormais vers cette suite tout en conservant ses résultats rouges.
