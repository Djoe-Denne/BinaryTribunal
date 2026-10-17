# Préférences modèles — économie de crédit OpenAI, demande utilisateur

L'utilisateur demande pour cette mission : GLM Flash jusqu'à complexité60,
Cursor Grok4.7 ExtraHigh de61à80, Cursor Opus5.5 au-dessus80. Les seuils sont
des scores manuels0–100, pas des probabilités. Ne pas modifier scores de modèles,
coûts, classification manuelle, capacité5, autoDispatch/autoScale=false ou gates RE.

## Appliqué dans la mission

- Providerorder revision5 : cursor > opencode-go > zai-coding-plan ; OpenAI retiré.
- Modelpolicy revision3 : Grok4.7 ExtraHigh et Opus5.5 Max préférences100 ; autres
  modèles non demandés désactivés pour les futurs départs. Algorithme legacy/gap2
  et base de coût effective conservés ; les seuils sont appliqués MANUELLEMENT par
  le superviseur via paires exactes, ils ne sont pas encodables par ces seuls poids.
- Aucun nouveau départ OpenAI. Solmax/xhigh poids1/réserve temporairement conservés
  UNIQUEMENT pour ne pas interrompre le superviseur et les deux auteurs déjà admis
  (v3-guardian-core-r1 et v3-kernel-observer-r1). Ne pas attribuer de nouveau travail
  à une ancienne session OpenAI au titre de cette exception.

## Deux points d'identité/autorisation, sans substitution silencieuse

Le catalogue natif expose GLM5.3Flash, pas GLM5.0Flash demandé. OpenCodeGo et ZAI
max sont déjà évalués et restent à leurs poids antérieurs50/25, mais la nouvelle
tranche Flash attend confirmation de l'identité5.3. Cursor GLM5.3Flash est natif,
pas encore évalué dans le catalogue de routage : ne pas copier le score Go/ZAI.

Paires Cursor exactes évaluées : cursor/grok-4.7 + `Grok 4.7 Extra High`,
cursor/claude-opus-5-5 + `Claude Opus 5.5 Max`. Elles sont disponibles nativement
mais `available:false` dans le catalogue OPÉRATEUR global. La préférence mission
enregistrée ne réactive pas ce niveau et ne l'outrepasse pas. Aucun nouveau worker
Cursor ni changement du modèle superviseur avant autorisation d'activation.
Ne pas modifier globalement config/providers/comptes à partir de ce seul routage.

Après confirmation/activation : vérifier Model.Ref effectif à chaque nouvelle
session, conserver les contextes indépendants/reçus et limiter Opus aux tâches>80.
Faire migrer le superviseur existant, pas créer un autre orchestrator. Retirer
l'exception OpenAI quand les deux travaux engagés et le transfert sont achevés.
La demande ne relance aucun test/fixture/FF8/live, ni une mission historique.

## Confirmation utilisateur et activation effective

L'utilisateur confirme GLM5.3Flash et autorise explicitement la réactivation
globale des DEUX paires Cursor seulement. Deux flags available=false→true ont
été modifiés ; diffstructurel exact, aucun score/prix/autrechamp changé. Backups
config+state sous .tmp/coordination-three-20261014/ENSEMBLE_MODEL_ACTIVATION_20261017/.
Journal ciblé ajouté sans avancer lastEvaluatedAt/lastSyncedAt.

09:32:14.680Z : running modelAuthorizationStatus ready=true,29paires contre27 ;
GrokExtraHigh et OpusMax visibles dans le catalogue effectif. Aucune réinstallation,
restart ou modification de credentials. Les deux blocages « GLMàconfirmer » et
« Cursoravailablefalse » ci-dessus sont HISTORIQUES, supersédés par cette confirmation.
La version CursorFlash reste non évaluée ; Go/ZAImax sont utilisables pour≤60.

Routage manuel futur :0–60 GoFlash5.3max (ZAIalternative explicite),61–80 Cursor
Grok4.7ExtraHigh,81–100 CursorOpus5.5Max. Pas de classification modifiée pour changer
de tranche. Toutes les nouvelles admissions portent modèle+variante explicites.
Pas nouveau départ OpenAI ; les deux auteurs déjà engagés conservent leur provenance.

## Superviseur migré, routage vérifié et corrigé — 2026-10-17

Le superviseur existant ses_eca40a8e2ffeanEKTBLiGjDNw8 est passé de
openai/gpt-6.1-sol xhigh à cursor/claude-opus-5-5 `Claude Opus 5.5 Max` à
09:33:20.016Z, même session, sans second orchestrateur.

Vérification hors ligne : les fonctions pures du routeur ont été extraites du bundle
actif `20261016-mission-policy-5504fe8e8df8`, puis évaluées avec le catalogue global
(beta 0.35, échelle d'intelligence 30–51) et la politique de la mission, sur une
grille complexité × risque. Aucun spawn, aucun appel modèle, aucun crédit consommé.

Défaut constaté sur la révision 3 et l'ordre révision 5 : **toutes** les tâches,
complexité 0 comprise, partaient vers Opus 5.5 Max. En mode `legacy`, le provider
`cursor` passe d'abord. Le coût `effective` est inconnu pour Grok comme pour Opus,
donc l'égalité est tranchée par l'intelligence la plus haute. GLM et Grok n'étaient
jamais choisis automatiquement. `opencode/step-5-preview-free`, non listé dans la
politique, restait aussi autorisé par héritage (poids 10).

Corrections appliquées, contrôlées par relecture :

- Ordre des providers, révision 6 : opencode-go > zai-coding-plan > cursor. Il
  respecte Go puis Z.ai pour GLM ; aucune paire Cursor GLM n'est activée.
- Politique, révision 4 : `legacy` conservé (déterministe, sans tirage pondéré).
  La base de coût passe à `benchmark` : elle sert seulement à départager Grok
  et Opus chez Cursor, sans modifier aucune valeur de coût ou de score. Le modèle
  step-5-preview-free est exclu de cette mission.
- Politique, révision 5 : l'exception OpenAI est retirée et Sol max/xhigh sont
  désactivés. Les deux auteurs engagés ont livré, aucun membre n'est actif et le
  superviseur tourne sur Opus. Seules quatre paires restent autorisées : GLM 5.3
  Flash max (Go, Z.ai), Grok 4.7 Extra High et Opus 5.5 Max.

Routage automatique obtenu : à risque 0, GLM de 0 à 57, Grok de 58 à 76 et Opus de
77 à 100. Le risque décale vers le haut ; à risque 80, par exemple, GLM couvre 0–40,
Grok 41–66 et Opus 67–100. Aucune sélection OpenAI n'apparaît sur la grille. Les seuils 60/80
ne sont pas encodables exactement sans modifier beta ou l'échelle globale, qui
restent volontairement inchangés. La tranche automatique n'est jamais inférieure à
celle de la règle, puisque la demande est toujours au moins égale à la complexité.

La règle manuelle ci-dessus reste donc l'autorité : chaque départ porte la paire
exacte correspondant à la complexité de sa tâche. Les anciennes sessions épinglées
sur OpenAI (Sol ou Astra) sont désormais refusées par la garde. Toute réutilisation
exige d'abord une bascule explicite vers la paire de la tranche, consignée.

Inchangé : capacité 5, classification manuelle, dispatch et scaling automatiques
désactivés, scores, coûts, beta et échelle du catalogue, indépendance des reviews et
toutes les gates. La version Cursor de GLM 5.3 Flash reste non évaluée, donc inutilisée.

Traces : `.tmp/coordination-three-20261014/ENSEMBLE_MODEL_ACTIVATION_20261017/`
(`route-preview-20261017.ts`, résultats `before-rev4`, `after-rev4`, `after-rev5`,
relectures `policy-rev4/rev5-readback`, `lead-model-readback.json`).
