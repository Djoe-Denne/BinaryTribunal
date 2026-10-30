# 179. Résolution isolée des dépendances autorisée, sans installation

## Décision de préparation

Le parent retient seulement la première phase du plan d'hôte local : résoudre les versions et générer un package-lock dans un namespace temporaire possédé. L'objectif est de mesurer et examiner le graphe avant de décider une acquisition ou un bootstrap, pas d'installer discrètement un nouveau serveur.

Racines déclarées exactes : @opencode/server2.2.1, @opencode/util2.2.1, effect4.0.1 et @effect/platform-node4.0.1. La commande prévue est npm install --package-lock-only --ignore-scripts --no-audit --no-fund, registre public explicite, cache et configurations npm propres à ce namespace.

## Permissions et bornes

Les écritures sont limitées au nouveau namespace sous le répertoire temporaire OpenCode approuvé et à ses reçus de mission. Le sous-processus reçoit un environnement réduit, sans héritage de NODE_OPTIONS, token npm, proxy authentifié ou configurations utilisateur/globales. Aucune dépendance de projet existant n'est modifiée.

La commande est bornée à120secondes, sans retry automatique. Les logs bruts restent dans le namespace possédé ; seuls les résultats et erreurs utiles sont remontés. Si npm refuse l'accès ou la résolution, l'état est conservé et aucun autre outil n'est utilisé pour contourner ce refus.

L'option package-lock-only et ignore-scripts doit laisser node_modules absent. L'acceptation de cette phase exige un verrou lisible, des résolutions et intégrités examinables et aucune URL git/hors registre admise pour la phase d'acquisition. Le registre configuré n'est pas présenté comme un pare-feu technique universel des sous-requêtes du gestionnaire.

## Gate suivante

Une revue du graphe, des scripts signalés, des composants natifs Windows et de la provenance précédera toute acquisition. Aucun npm ci, script de dépendance, import applicatif, listener, session ou modèle n'est autorisé par cette décision. Une dépendance nécessitant build ou script indispensable restera bloquée avant bootstrap.

Le runtime futur n'est pas encore accepté : Bun installé vaut1.4.2, alors que le packageManager de l'archive source épingle1.4.4. Ce sont deux faits distincts, pas un motif d'upgrade implicite ni une preuve automatique d'incompatibilité. Les exigences runtime et sa qualification doivent être fermées avant tout lancement.

## Outils constatés

- Node v24.11.1, C:/Program Files/nodejs/node.exe, SHA f13ac3ca23248dc389507e8fe38c34489ab7edb3e6d6700eb6da6a0b7e128eaf.
- npm11.6.2 d'après son package installé ; son lanceur npm-cli.js est présent. Son hash de lanceur seul ne représente pas tout le code npm.
- Bun1.4.2, SHA15277c59ccd6c6c20f8dc9716c2b59c1776320d606b6a8658f70be8799519ca4, pas téléchargé ni remplacé.
- Plan constructeur PLAN_ONLY_SMALL_PUBLIC_HTTP_BOOTSTRAP_CONDITIONALLY_FEASIBLE_NATIVE_DEPENDENCY_GATE_BEFORE_EDITS ; aucune installation ou exécution d'hôte par lui.
- Compteurs et droits RMS inchangés ; cette résolution de métadonnées n'autorise aucun effet natif ou scientifique.

## Résultat réel et gate maintenue

La résolution réussit en30,576s. Le verrou contient430entrées, avec URL du registre public et intégrité présente pour chacune. Une relecture parent distincte confirme le hash et l'absence de node_modules. Le verrou seul n'est ni une acquisition de code installé ni une preuve que ses composants se chargeront.

Trois packages portent un indicateur de script d'installation : @parcel/watcher2.5.1, tree-sitter-bash0.25.0 et tree-sitter-powershell0.25.10. Les scripts ont été désactivés dans l'invocation ; leur indicateur reste un risque à examiner, pas un succès de bootstrap. Le verrou comprend aussi plusieurs plateformes optionnelles, pas une liste de430paquets effectivement installés sous Windows.

Le cache npm possédé contient437836049octets de fichiers après la résolution. Cette mesure n'est ni le volume réseau total ni la future taille installée. Les artefacts sont conservés ; aucune suppression ou réutilisation d'un cache global. Le coût disque réel est ainsi déclaré avant la phase suivante.

La [preuve de verrou et de relecture](../evidence/owned-host-dependency-lock-179.json) référence le verrou216391octets/SHA014246a6c04d67f20ff63c7729177eccf5993f84e9c3710203bbd0a7f155fd49 et les reçus. Une revue indépendante du graphe et une préparation bornée de sélection Windows sont engagées. **La phase d'acquisition et le lancement restent non autorisés.** Aucun test acquis n'a été rejoué.

## Alertes de compatibilité identifiées avant acquisition

Le constructeur signale deux alertes que le parent corrobore dans le verrou et npm.stderr.log :

- @effect/platform-node4.0.1 a résolu un exemplaire imbriqué de @effect/platform-node-shared4.1.0, dont le peer exige effect^4.1.0 ; le graphe n'offre que effect4.0.1. Le log contient ERESOLVE overriding peer dependency. Un autre exemplaire shared4.0.1 existe déjà à la racine, sans supprimer ce conflit imbriqué.
- @opencode/simulation2.2.1 dépend directement, non optionnellement, de @opentui/core0.7.0. Ce dernier déclare bun>=1.3.14 et node>=26.4.0. npm signale EBADENGINE pour l'outil Node24.11.1 utilisé. Les rôles de l'installeur Node et du futur runtime Bun doivent être distingués ; cela ne permet pas de déclarer l'alerte sans effet sur le bootstrap.

**Le verrou179 n'est pas reçu comme graphe compatible pour acquisition/bootstrap.** Son succès reste celui de la résolution de métadonnées et de sa traçabilité. Le parent n'emploiera ni force, ni legacy-peer-deps, ni une régénération silencieuse. Une éventuelle sélection corrigée de version devra respecter les plages publiées, être expliquée dans un candidat distinct et passer sa propre gate. Le verrou et les avertissements179 restent conservés.

## Revue indépendante de la gate de métadonnées

L'avis result_mvv0r6g5_004q_81pxcd (message msg_18d090e6d001Q9dthC6TzyAkuL) confirme216391octets,430paquets, quatre racines exactes, URL HTTPS du registre et430SRI SHA512 valides. Il accepte cette portée de métadonnées, pas un bootstrap ou une autorité native. L'absence de node_modules est confirmée ; les indicateurs de scripts ne sont pas du code exécuté.

Il rappelle de sélectionner les composants par leurs champs os/cpu, pas seulement leur nom : un paquet FFI nommé win32-ia32-msvc annonce aussi x64. Le poids, les assets réels, la politique d'engine et la fermeture JS/native restent à établir. Le conflit peer Effect signalé séparément par le constructeur et corroboré par le parent n'est pas fermé par cet avis : la décision parent de ne pas acquérir ou charger ce graphe demeure.
