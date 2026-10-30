# 222. Préparer la connexion OpenAI sans envoyer de mission

## Décision et limite immédiate

Le contrat corrigé distingue enfin acquisition historique, nouvelle délégation de travail et connexion au compte OpenAI. Le parent retient la voie publique OAuth « chatgpt-headless » pour le compte existant : le runtime traite et conserve les tokens en interne, sans lecture ou copie de secrets par l'agent. Une validation humaine sur la page officielle pourra être nécessaire.

**Ce rapport autorise une réalisation logicielle, pas le lancement d'une connexion.** Aucun appel OpenAI, compte créé, achat ou demande de modèle n'a encore lieu. Les titres de la réponse interrompue précédente n'attestaient aucune de ces actions.

## Première tranche : connexion uniquement

Le constructeur peut modifier six fichiers du candidat198 : client, transport natif, binding, GraphStore et les deux tests existants client/runtime-binding. Il prépare aussi deux nouveaux candidats de bootstrap/plan sous `auth-bootstrap-222/` du dossier de mission ; le parent seul les déploiera ensuite aux nouveaux chemins fixes bootstrap-auth-v1.mjs et host-plan-auth-v1.json de l'hôte180, après revue. Les fichiers193/219 restent inchangés.

Le mode sera distinct de la lecture seule et du travail de modèle. Il conserve la possession directe Bun→Bun, le handle réel, le secret IPC, les preuves d'image et d'identité, les gardes avant/après await et la fermeture contrôlée. La voie A garde sa limite120secondes et son refus de tous les POST. La nouvelle connexion seule est bornée à240secondes au total, avec réserve de fermeture ; aucun relèvement de la limite de dix minutes par test.

Une intention d'authentification durable, émise par l'invocation parent privée sous contrôleur courant, est retenue dans le journal existant avant l'effet. Elle lie identité, scope, pins, expiration et un seul claim de connexion. JSON ou reçu seul ne créent pas l'autorité. La factory vérifie les droits mais n'en crée ni renouvelle. Réponse perdue ou claim déjà engagé : pas de second POST automatique. Relecture de statut limitée à la tentative exacte et au même enfant vivant.

## Routes et confidentialité

La connexion est limitée à OpenAI et à la méthode headless automatique. Routes possibles fermées : info/OpenAPI, métadonnées d'intégration projetées sans valeurs de credentials, POST exact de connexion OAuth et GET du statut de la tentative connue. Pas de clé API saisie ou transférée, pas de credential.list/create, d'autre fournisseur, de browser callback, de commande externe, de création de session, de prompt ou publication. Les autres méthodes/routes restent refusées. L'annulation s'effectue par arrêt du scope possédé ; aucun endpoint mutateur supplémentaire n'est nécessaire à cette première tranche.

Le challenge temporaire destiné à l'utilisateur doit être validé et transmis uniquement par un canal d'interface privée. Ni code de connexion, tokens, réponse brute de credential, message d'erreur importé ou headers privés dans le journal RMS, les rapports, manifests ou reçus. Les résultats durables sont projetés en identités/statuts bornés. Aucun dump, copie ou hash intégral de la base native contenant des credentials ; seule la base RMS sans secrets conserve les traces d'autorisation. Le dossier natif d'authentification reste privé, hors diffusion d'evidence.

Le statut complete ne vaut que connexion persistée par le runtime. Il ne confère ni Model.Ref utilisable, permission de travail, acquisition, résultat scientifique ou autorité de publication. Un effet déjà engagé est conservé honnêtement en cas de révocation/expiration ; aucun rollback fictif ou succès tardif.

## Ce qui reste séparé

Les opérations V2 proposées pour de nouveaux slots et délégations sont retenues comme direction de conception, pas encore autorisées à écrire des crédits ou à exécuter IDA. Le slot fixture historique n'est pas renommé. Les capacités RMS mesurées en octets ne sont pas un solde financier OpenAI ; aucun solde, quota ou nouveau financement n'est inventé. Root, lignée, origines, grants, dépenses et veto170 restent inchangés pendant cette tranche.

## QA fermée par risques

Avant tout effet natif : gel et pins, typecheck, tests ciblés dans les deux fichiers existants après inspection des imports/permissions, puis revue indépendante du delta. Risques à prouver : autorité courante/révocation/CAS, claim unique et réponse perdue, routes et fournisseur fermés, faux caps refusés, projection sans secrets, délais/fermeture et refus des résultats tardifs, absence de droits de travail issus d'un succès OAuth. Aucun test global, diagnostic gelé, quatrième origine ou fixture promue en preuve native. Le constructeur n'exécute aucun contrôle.

Les six sources sont préservées avant édition dans `qa-owned-runtime-218/baseline-before-auth-222` avec leurs pins ; aucune base copiée. Les preuves A219 sont réutilisées uniquement pour leurs parties inchangées. Les choix locaux de noms/types sont libres dans ce contrat ; extension de fichiers, lecteur de secrets, nouveau moteur/store/transport générique ou conflit de permissions à escalader au parent avant modification.

## Sources vérifiées et prochaine étape

Le parent a relu les handlers OAuth, le schéma Attempt/AttemptStatus et la persistance interne avant complete. Les chemins exacts viennent de l'OpenAPI219 conservé : POST `/api/integration/openai/connect/oauth`, GET `/api/integration/openai/connect/oauth/{attemptID}`. L'API headless renvoie une tentative automatique et le lien officiel ; le flux browser comportant des callbacks n'est pas retenu.

La production du candidat et sa QA restent indépendantes de toute action humaine. Après réception du code et des prérequis, le parent préparera le lancement natif et l'interface de validation du compte si nécessaire. Le petit essai IDA et M2 ne sont pas encore réalisés ou clos.

## Préparation parallèle de l'accès IDA

La découverte du catalogue courant n'expose pas d'outil ou ressource IDA. Un diagnostic de métadonnées a d'abord interrogé la mauvaise Location par défaut (le dossier utilisateur), puis a été corrigé avec le paramètre de répertoire documenté. Dans la Location exacte re-ff8, le connecteur ida-pro-mcp est déclaré **disabled** ; GrepAI et Serena sont connectés. Les reçus sont `evidence/mcp-ida-availability-222.json` et `mcp-ida-project-availability-222.json`.

Cela ne prouve pas qu'IDA est éteint ou en panne, ni un refus de permission. Aucun appel de fonction IDA, reconnexion ou changement de configuration n'est effectué. Les champs configurationChanged:false des reçus indiquent ici l'absence de demande explicite d'écriture de configuration, pas une comparaison d'empreintes de tous les fichiers de configuration. Les captures149–150 restent historiques et ne sont pas transformées en lecture actuelle. Ce point est conservé pour la préparation de l'entrée IDA, sans interrompre la construction autorisée de la connexion OpenAI.

## Préparation du contrôle extérieur, sans exécution

À la reprise, le parent a relu le récepteur219 : il attend la fin de l'enfant avec spawnSync puis enregistre stdout et stderr. Ce mécanisme ne permet pas à l'utilisateur de voir un challenge pendant la connexion et ne doit pas recevoir ce challenge dans ses captures. Il ne sera donc pas recopié tel quel pour Auth.

Le constructeur a reçu cette contrainte d'intégration : fournir le branchement exact d'un canal privé vivant pour l'interface utilisateur, ou déclarer explicitement qu'un callback reste non raccordé. Après livraison, le parent contrôlera ce branchement et préparera l'adaptation extérieure minimale, distincte des scripts219. Aucun nouveau serveur d'interface, effet OAuth, lancement de processus ou test n'a été exécuté pendant cette préparation. Aucun nouveau livrable Auth n'est encore reçu à cet instant.

La précision comptable du constructeur est retenue : le plafond RMS en octets n'est pas une exigence financière ou un achat. Elle ne modifie pas le contrat222 ni le budget acquis.

### Point de réalisation reçu, pas encore un gel

Le constructeur retient un échange IPC privé entre l'invocation RMS et son parent réel : vérification READY/ACK sans secret avant CONNECT, puis challenge et accusé de réception uniquement dans ce canal. Sans relais privé vivant, le code devra refuser CONNECT. Le branchement vers une interface utilisateur non journalisée reste à réaliser et vérifier par le parent avant le lancement natif ; aucun succès de connexion n'est acquis.

Les logs de l'enfant Auth seront jetés, avec compteurs et byteExact:false, sans prétendre prouver leur contenu ou l'absence d'erreur. Les captures A219 restent intactes. Le parent a précisé qu'une perte du relais après engagement conserve le claim et conduit à HOLD sans second POST automatique ; un accusé de réception d'interface ne vaut pas succès OAuth. Aucun code, test, processus ou effet de connexion n'est exécuté par ce point d'avancement.
