# 225. Raccorder la fenêtre privée et isoler le dossier Auth

## Objectif et décisions locales

La connexion OpenAI doit présenter à l'utilisateur un code temporaire sans l'enregistrer dans le chat, les logs ou les preuves publiques. Le protocole IPC est codé, mais son raccord vers l'utilisateur manque encore. Le parent fait réaliser ce seul raccord, en parallèle de la correction locale du dossier Auth et de la revue du candidat. Aucun nouveau serveur ou service permanent n'est nécessaire.

Deux candidats d'outillage parent sont autorisés sous `auth-parent-225/` : `private-ui-relay-v1.mjs` et `private-ui-window-v1.ps1`. Ils ne modifient ni le produit, ni les scripts219, ni les dépendances. Leur auteur écrit du code seulement ; le superviseur reste seul à effectuer préparation native, lecture/écriture des droits, acquisition du contrôleur, lancement et réception.

## Contrat du raccord d'interface

Une petite fenêtre Windows locale, possédée par l'invocation parent, échange uniquement par ses pipes privés. Elle ne reçoit pas de secret dans ses arguments. Elle confirme son état prêt après création effective de l'interface, puis reçoit le challenge validé uniquement en mémoire. Aucun fichier, serveur HTTP, presse-papiers automatique ou capture de ces messages. Le bouton de navigation ne peut ouvrir que la page officielle fixe OpenAI et sur action de l'utilisateur ; aucune URL reçue n'est exécutée.

Le relais JavaScript ne répond aux deux probes READY et au challenge du seul enfant RMS possédé qu'après accusé de réception de la fenêtre vivante. Il respecte les formes exactes d'ACK attendues et les limites de cinq secondes et240secondes totales. Une fermeture de fenêtre ou perte de canal refuse la suite ; aucun ACK aveugle, retry de connexion ou repli vers stdout/fichier/chat. Il ne crée pas d'intention, de droit, de claim ou de résultat de connexion. Les messages privés ne sont jamais retournés par l'outil ou enregistrés en preuve.

Le parent raccordera ensuite ce module au récepteur asynchrone natif et contrôlera son identité, ses empreintes et sa fermeture. Un module importable ou une fenêtre simulée ne suffisent pas à qualifier le parcours réel.

## Dossier privé Windows

La lecture de l'ACL180 a révélé des droits héritables pour d'autres identités. Le parent ne modifie pas ce namespace partagé. Il préparera uniquement le sous-dossier neuf `auth-private-<intentUUID>` avec une ACL protégée, limitée à l'utilisateur courant, SYSTEM et administrateurs, puis contrôlera effectivement type, chemin réel et droits avant tout effet et à réception. Aucun refus d'accès n'est contourné et aucune donnée d'authentification préexistante n'est lue ou copiée.

Le constructeur du produit est autorisé à une correction limitée client/binding/testbinding : exiger ce dossier déjà alloué, vide, réel, sans lien et de chemin Windows complet exact. Aucune création/réparation ACL, fallback ou adoption d'un ancien compte dans le produit. La baseline finale224 est préservée avant cette correction. Les tests DATA devront rester explicites : ils ne prouvent pas l'ACL native.

## Vérification avant effet

Les deux candidats d'interface seront gelés, inspectés et revus indépendamment avant exécution. Le parent fermera les seuls contrôles nécessaires : syntaxe sans exécution, tests ciblés des formes/messages et refus sans secret réel, puis vérification native bornée de la fenêtre et des pipes avec un challenge factice explicitement non autorisant si nécessaire. Aucun test global, diagnostic gelé ou nouveau harnais général. Les sélections et permissions seront consignées avant les commandes.

La connexion réelle reste interdite tant que les prérequis de code, revue, interface privée, droits Windows, autorité courante et réception extérieure ne sont pas effectivement établis. Leur réalisation est dans la délégation opérationnelle existante ; aucun GO intermédiaire utilisateur n'est demandé. La mission IDA elle-même, l'envoi de travail et M2 restent à réaliser.

## Correction du dossier livrée ; sélection de contrôle fermée

Le constructeur annonce sa correction terminée dans les trois fichiers autorisés. Le parent a lu le contrôle de faits réels du client945–953, le helper binding135–140 et l'unique nouveau test DATA32–46 : root préexistant, réel, vide et sans lien ; aucune création ou réparation automatique. Le helper ne prétend toujours pas prouver les droits Windows.

Le parent autorise uniquement `bun run typecheck` et `bun test test/runtime-binding.test.ts --test-name-pattern '^RMSN-AUTH private root requires empty real parent allocation$'` depuis le candidat198. Ce test n'ouvre ni dossier réel, base, processus ou réseau ; les imports restent ceux224, avec un helper DATA et readdirSync du module fs existant. Dix minutes par invocation, pas de retry ; sortie0 et exactement un test attendus. Les neuf contrôles224 des frontières inchangées sont réutilisés, non rejoués. Pins avant/après et reçus dans `qa-owned-auth-225`.

Pins nouveaux : client131409/bcaf3c88c4ba3a1ab286cb0a43044ee3c90a2d00d2dc744d5856d553977f6673 ; binding39966/e0a5635f3abcaa626715fe208f064cba00b27ab11d1e14b3a78290411f867082 ; testbinding33028/8ed50bf08c32d6df09d38c3a9e053cd78e8c94ac1ce846b6aa4a41a49cd379fc. Les cinq autres pins sont inchangés224 et seront aussi vérifiés.

## Attribution du raccord d'interface

Une tâche native distincte a été créée pour les deux seuls candidats d'interface. Le pool l'a attribuée automatiquement ; la tentative de création explicite d'un second auteur a été refusée car la tâche était déjà assignée, sans second worker créé. L'auteur effectif est pool-1 ; son Model.Ref natif relu est OpenAI/gpt-6.1-sol, variant xhigh, présent dans la politique approuvée. Aucun override de modèle ni changement de politique n'est effectué. Le plan de fichiers reste soumis au superviseur avant édition ; cette attribution ne vaut ni interface livrée ni exécution.

## Résultats de la correction du dossier

Typecheck PASS3982ms. L'unique nouveau test passe :15assertions,94ms de collecte parent,18autres cas filtrés non exécutés. Huit empreintes exactes avant/après chaque commande, zéro échec/timeout. Le diff limité aux trois fichiers et les deux reçus sont conservés dans `qa-owned-auth-225` ; le reviewer reçoit ces preuves sans les rejouer. Les neuf tests224/157assertions restent les preuves des parties inchangées. Aucun dossier privé, ACL, fenêtre ou connexion native créé par ces tests.

## Entrées autorisées transmises au constructeur d'interface

Le constructeur confirme son attribution et signale deux refus natifs external_directory : source client temporaire et politique globale de scripts. Aucun réessai ni outil de substitution n'est demandé. Le parent projette seulement le protocole non secret déjà lu dans ses propres droits vers `auth-parent-225/inputs/CLIENT_PRIVATE_UI_225.md`, sous le workspace. Cela ne donne aucun droit de relire les chemins refusés ni de lancer un script d'analyse.

Le plan est ratifié : module sans effet à l'import ; start explicite de la fenêtre avant lancement RMS, puis liaison unique au ChildProcess réellement possédé ; deux probes et un challenge, ACK exacts après livraison à l'interface vivante ; deadline externe non réinitialisable et fermeture bornée. L'auteur peut désormais écrire les deux candidats seulement, sans exécution. Le premier envoi technique avec champ approve a été refusé parce que le worker automatiquement attribué n'était pas en état pending plan_approval ; la décision a été effectivement transmise par un message normal du superviseur, sans modifier la politique ou les droits natifs.
