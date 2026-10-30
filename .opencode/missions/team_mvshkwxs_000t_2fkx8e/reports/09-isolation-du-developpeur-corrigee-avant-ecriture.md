# 9. Isolation du développeur corrigée avant toute écriture

## Problème concret

La réalisation RMS doit préserver les originaux et se faire dans l'espace isolé du développeur. Celui-ci a signalé que ses chemins relatifs résolvaient encore vers le dépôt principal, malgré la création de sa branche de travail. Il a arrêté ses actions avant écriture produit.

Le superviseur a confirmé le décalage par lecture native de la session : sa localisation était encore le dépôt principal. La création d'une branche et le seed correct de ses fichiers ne suffisaient donc pas à prouver le rattachement effectif de la session.

## Correction vérifiée

Le superviseur a déplacé **cette seule session possédée** vers son worktree via l'outil natif `session_move`. Un second GET indépendant confirme la localisation corrigée ; Model.Ref demeure OpenAI Sol xhigh. Le développeur doit aussi vérifier sa racine effective au prochain appel et rester en lecture seule tant que son plan n'est pas approuvé.

Un accès externe à la politique Context Mode lui avait été refusé. Le refus n'a pas été contourné : les règles déjà lues par le parent lui sont livrées explicitement dans son canal autorisé. Cinq fichiers de contexte utiles ont été copiés dans son propre espace, sans modifier les sources produit ou les permissions globales.

## Conséquences et suite

Les 356 fichiers déjà seedés restent la base de son plan. Aucun besoin de recréer le worker, changer de modèle, lire à nouveau le chemin refusé ou demander un GO utilisateur. Aucune preuve de fuite ou de modification produit n'est constatée dans cet incident ; le seed parent avait été effectué uniquement sur la branche possédée, vérifiée propre avant copie.

Le plan de réalisation reste attendu avant commandes produit. Les résultats précédents — 55 tests primitifs et leurs octets exacts — ne sont pas invalidés par le déplacement de cette session ; ils gardent leur portée sur la copie parent. Aucun nouveau test exécuté pendant cette correction.

## Trace technique

- Session : `ses_e7be66e44ffeDGFyMV1ca7Rgj8`.
- Localisation native avant correction : `C:/Users/djden/source/repos/retro-eng/re-ff8`.
- Localisation native après correction : `C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-793e3f62-2fkx8e-raccord-runtime-public`.
- Contrôles : GET session avant, `session_move`, GET session après ; mêmes fournisseur/modèle/variante.
- Livraison contexte : rapports06/08, bundle final de l'architecte, manifeste writer-base-seed et OBLIGATIONS.md, sous la mission locale du worktree. Aucun raisonnement privé des auteurs ni audit indépendant distribué.
- Un premier appel de message a échoué en syntaxe Code Mode ; corrigé puis livré. Ce n'était ni un refus d'outil ni une panne MCP.

Localisation : session et worktree possédés. Impact : rattachement de session et livraison de contexte seulement. Limites : plan non encore approuvé, code et preuve native non encore réalisés, cause du mauvais rattachement initial non établie.
