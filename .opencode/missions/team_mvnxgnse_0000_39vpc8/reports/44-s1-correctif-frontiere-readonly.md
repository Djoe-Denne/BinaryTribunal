# M2 — 44 : correction locale de la frontière readonly et un typing supplémentaire

## Cause ciblée et contrôle source

L'auteur confirme TS2589 à la frontière `attempt<BoundPreparationV1>` vers `CodecResult<ReadonlyData<BoundPreparationV1>>`, après résolution des autres diagnostics. Aucun incident d'outil. Le parent relit les sources : DTO explicitement construit `BoundPreparationV1` puis gelé (1373–1375), `attempt` générique (270–273), gel récursif existant (303–305). Le type upstream R4 est `T extends object ? {readonly [P in keyof T]:ReadonlyData<T[P]>} : T` (ligne20). L'instanciation de la forme readonly imbriquée du Snapshot/FailureCause JSON récursif est la cause identifiée par le worker ; ne pas résoudre par une suppression de diagnostic ou modification de contrat.

## Décision de correction

Autoriser, dans la cible envelope déjà possédée, un helper **privé** à surcharge `BoundPreparationV1 → ReadonlyData<BoundPreparationV1>`, implémentation sur unknown qui appelle le même gel récursif. Le seul appel accepte le DTO dont la construction reste explicitement typée/validée ; pas de surcharge publique/acceptation unknown dans l'API, any, cast d'évitement ou champ supprimé. Rétablir la définition readonly upstream exacte et garder les témoins de types pertinents.

Le helper exprime une frontière runtime réellement assurée par le gel, sans demander à TS une comparaison récursive mutable/readonly du DTO entier au retour. Sa signature n'est pas à elle seule preuve runtime : conserver les validations et vérifier absence de mutation/détachement/gel des objets et tableaux représentatifs dans les tests auteur pertinents. Si le JS émis change à cause du helper/appel, ne pas revendiquer une égalité byte-exacte ; une composition ciblée après ce changement relève des tests déjà autorisés.

## Budget corrigé, pas réinitialisé

Le parent autorise **exactement un cinquième typing**,60s maximum, après ce correctif précis. Runner changé sur la seule borne typing `<4` → `<5`. Douze tests maximum et **600s cumulés restent inchangés** ; les douze reçus/rouges et compteurs existants sont préservés. Ce n'est pas un droit de sixième typing ni une série de sondes inchangées. Échec du contrôle supplémentaire → retour parent avec résultat/cause, pas nouveau budget implicite.

La nécessité de cette extension est un défaut typologique concret sur la cible S1, après diagnostic statique et proposition minimale, pas l'arrivée d'un nouveau reviewer ou du perfectionnement. Elle entre dans M2§7.1 correction/tests ciblés autonomes : aucun nouveau framework/harness important/contrat fonctionnel/périmètre natif ou arbitrage utilisateur requis.

## Vérifications attendues et limites

Source finale du helper et ses appels, maintien des validators/readonly/types DTO, nouveau typing réel et tests affectés avec liens exacts aux bytes du candidat. Les71 tests verts restent une preuve historique de la version testée ; réutiliser seulement les parties inchangées ou justifier le rejeu du groupe touché. Aucun S1PASS global par seul typing, QA API indépendante requise ensuite.

Pas de support RO/gel/contrat métier modifié, budget numeric et checks consolidés inchangés (NON EXÉCUTÉS M2). Aucun Git/cleanup/DB/native/jeu/IDA ou permission élargie.

Contrôle parent après modification du runner : `node --check` PASS, nouveau SHA `bd81741efa9f492e2d1859205490291884e840a2ca6b51a4b83ef7fe2723468a`. Ledger toujours8tests/4typings/13255ms/nonbloqué ; aucun contrôle produit lancé par ce contrôle de syntaxe et aucun compteur réinitialisé.
