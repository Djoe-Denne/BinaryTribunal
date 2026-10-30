# 61. Candidat d’admission au repos en vérification

## Ce qui est livré, sans acceptation anticipée

Le développeur a gelé quatre fichiers : contrats et orchestration au repos, transport fermé, raccord au journal GraphStore existant et tests hors ligne. Aucun test ou appel natif n’a été exécuté par l’auteur. Le candidat n’est pas intégré au dépôt principal.

Le parent a lu les nouvelles surfaces et les tests proposés. La sélection ne demande ni travail de modèle ni thread : faux transport injecté, bases SQLite neuves dans le répertoire temporaire autorisé et conservées. Le transport natif n’est testé ici que dans son état inerte. Les primitives existantes utilisent leurs constantes et fixtures locales, pas un programme natif.

## Vérifications en cours

Le parent a copié exactement les dépendances locales déjà qualifiées, sans réseau ni installation : 3493 fichiers, versions inchangées et empreintes source/destination comparées. Le candidat est épinglé avec son manifeste avant exécution.

La commande de vérification enchaîne compilation, primitives et uniquement le fichier de tests au repos, en s’arrêtant au premier échec. Le plafond est dix minutes par test ciblé. Aucun résultat n’est encore déclaré ; aucune suite globale, diagnostic gelé, quatrième origine ou campagne scientifique n’est sélectionné.

Une revue indépendante fresh est également lancée sur ce candidat, en lecture seule, sans transcript privé de l’auteur. Son modèle effectif OpenAI Sol xhigh a été relu. Le parent a demandé son rattachement au worktree et signalé que la localisation rapportée par l’API ne suffit pas à prouver la racine effectivement vue par les outils.

## Limites maintenues

Une réussite de ces tests restera une preuve logicielle hors ligne. Le transport réel, les droits exercés, la terminaison, le fencing serveur et la reprise après crash ne sont pas qualifiés par ce nouveau code. Les refus d’exécution et les références de qualification restent fermés.

## Trace technique

- Pin : `a246f6f24fb00ba76d2ee43340e72f84f9377001`, base intégrée `05c3c532`.
- QA parent : `../verify-native-at-rest-r1.mjs`, handle `sh_187debdb1001f7TR6daVQ5KrZQ`.
- Dépendances : `../evidence/at-rest-dependencies.json`.
- Revue : `task_mvtl3aqz_000g_k2i9m4`, session fresh `ses_e782236a4ffeQSg60nGCm9uyn6` ; lecture seule.

## Premier résultat : compilation bloquante, correction bornée

La compilation termine avec sortie2 en3936ms, sans dérive des sources. Erreur TS2322 dans `native-at-rest-transport.ts:14` : le SDK autorise une absence d’en-têtes alors que le type de connexion exige un objet. Le parent demande une normalisation/type compatible, sans modifier les droits ni la fonctionnalité. Le candidat devra être gelé à nouveau avant revalidation.

La séquence s’est arrêtée comme prévu : primitives et tests ciblés non exécutés. La revue indépendante est informée de ce défaut et continuera sur les autres risques, puis examinera le delta de correction ; pas de nouvelle chaîne de reviewers. Preuve : `../evidence/native-at-rest-r1-typecheck.execution.json` et captures associées.

## Deuxième candidat : compilation réussie, fixture ciblée à corriger

Le pin `16f48383b6ff1e93609fef159bc353684d48c301` normalise seulement les en-têtes absents. Compilation sortie0/3609ms ; primitives55 PASS/125 assertions/84ms. Les16 cas ciblés terminent en563ms avec1 PASS et15 FAIL. Les15 échecs surviennent tous dans le montage de fixture, avant le nouveau chemin produit : `addUnit` refuse les dépendances invalides de la famille aveugle. Le test donne à R une liste vide alors que le contrat existant impose les identifiants A et B.

Correction minimale demandée dans le test, sans affaiblir les invariants du produit ni supprimer des attentes. Ces15 cas ne prouvent encore aucun comportement de l’adaptateur. Aucun appel natif, dépassement de délai ou dérive des sources. Les reçus `native-at-rest-r2-{typecheck,primitives,targeted}.execution.json` conservent les résultats distincts ; la revue indépendante en est informée.

## Reprise ciblée après correction de fixture

Le pin `d6e4085dd05a964120d5e5f1c41a3ec5d3791b0d` change uniquement les dépendances R dans le test : A+B requis, auteurs indépendants inchangés. Compilation et cas ciblés sont relancés ; les55 primitives r2 restent une preuve inchangée réutilisée, pas un nouveau PASS exécuté. Aucun résultat anticipé pour ce troisième candidat.

Le parent a également relevé une frontière de transport à vérifier dans la revue : `info()` appelle le SDK sans signal de délai ni refus de redirection, contrairement aux autres requêtes wire bornées20s. Le SDK local transmet un signal uniquement si fourni et utilise fetch sans paramètre redirect dans ce chemin. Aucun correctif de cette frontière n’est encore présent ; il faut un verdict et une preuve pertinente, pas un appel au serveur réel.

La reprise r3 compile (sortie0/3437ms), mais conserve1 PASS/15 FAIL en493ms. Le montage atteint maintenant la réservation, qui refuse une enveloppe de16000 octets sous un budget de8000 hérité du plan de fixture. Le parent demande une déclaration de taille cohérente avec ce budget et le body synthétique, ainsi qu’un audit statique de tout le montage restant. Aucune règle produit ou preuve historique ne doit être affaiblie pour obtenir du vert. Les15 comportements restent non vérifiés ; reçus r3 conservés.

## Quatrième candidat : contrôles ciblés réussis

Le pin `e880a2581290df0506220a429dc4484f14fc1deb` corrige seulement le montage : enveloppe4096 sous le budget8000 conservé et deux assertions additionnelles sur ce budget et la taille du body. Compilation sortie0/3434ms ; **16 PASS,115 assertions**,1342ms de processus, sans dérive des sources. Les55 primitives/125 assertions r2 sont réutilisées, pas exécutées à nouveau.

Les échecs historiques restent conservés avec leur version, sans les réécrire en réussite. La portée des16 positifs est le faux transport injecté et la persistance locale. La revue indépendante reste en cours, avec la réserve transport identité/bornage/redirection ; aucune intégration ou acceptation anticipée. Reçus `native-at-rest-r4-{typecheck,targeted}.execution.json`.
