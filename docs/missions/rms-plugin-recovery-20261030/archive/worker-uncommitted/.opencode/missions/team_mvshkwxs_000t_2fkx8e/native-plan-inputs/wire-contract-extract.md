# Extrait borné du contrat OpenAPI courant 2.2.1

Source : `native-openapi-2.2.1-after-r4.json`, 330732 octets, SHA256 `b2b8c4cfd4ba7e4f4566481628aa22527935351d461fca29646a1df37ed5a37f`. Extrait parent par Context Mode sur l'original canonique. Contrat statique, pas preuve de comportement/droits/fin native.

## Routes et réponses 200

- POST `/api/session`, `session.create` : requestBody JSON requis, objet fermé ; aucune propriété requise. Propriétés optionnelles acceptant null : `id:Session.ID`, `parentID:Session.ID`, `title:string`, `agent:Agent.ID`, `model:Model.Ref`, `location:Location.PublicRef`, `metadata:Session.Metadata`, `permissions:Permission.Ruleset`. Réponse objet fermé `{data:Session.Info}`, data requis.
- GET `/api/session/{sessionID}`, `session.get` : paramètre sessionID requis ; même réponse `{data:Session.Info}`.
- POST `/api/session/{sessionID}/prompt`, `session.prompt` : requestBody JSON requis, objet fermé, `text:string` seul champ requis. Facultatifs : `id:Session.Message.ID|null`, `files:PromptInput.FileAttachment[]`, `agents:Prompt.AgentAttachment[]`, `skills:PromptInput.SkillAttachment[]`, `metadata:object`, `delivery:Session.Inbox.Delivery|null`, `resume:boolean|null`. Réponse objet fermé `{data:Session.Inbox.User}`, data requis. Pas une réponse assistant.
- GET `/api/session/{sessionID}/message/{messageID}`, `session.message.get` : deux paramètres requis ; réponse fermée `{data:Session.Message.Info}`.
- GET `/api/session/{sessionID}/message`, `session.message.list` : query facultatifs limit:string|null, order:asc|desc|null, cursor:string|null, type:string|null parmi les discriminants de message ci-dessous. Réponse `SessionMessagesResponse`. Ne pas combiner cursor et order.
- GET `/api/session/{sessionID}/inbox`, `session.inbox.list` : réponse fermée `{data:Session.Inbox.Info[]}`. La source décrit les entrées en attente seulement ; absence ne prouve ni livraison ni rejet définitif.
- GET `/api/experimental/session/{sessionID}/log`, `experimental.session.log` : query after:Event.SeqEncoded|null facultatif (Event.SeqEncoded est une string), follow:string enum true/false|null facultatif. Réponse text/event-stream, schéma fermé `{id?:string|null,event:string,data:SessionLogItemEncoded}`, event/data requis. SessionLogItemEncoded est une string dans le schéma wire. Encodage SSE, failureEvent `effect/http-api/stream/failure`. La source protocole656–664 définit StreamSse de l'union SessionEvent.Durable/EventLog.Synced ; ne pas confondre encodage et valeur décodée, ni Synced et fin du travail.
- GET `/api/info`, `server.info` : réponse ServerInfo directe dans le schéma, pas un wrapper data imposé.

## Types et distinctions exactes

- Session.ID : string pattern `^ses`. Session.Message.ID : string pattern `^msg_`. Agent.ID, Provider.ID, AbsolutePath : strings.
- Model.Ref : objet fermé, id et providerID requis, variant:string facultatif. Notre preuve peut exiger variant ; ne pas la synthétiser.
- Location.PublicRef : objet fermé, directory:AbsolutePath requis.
- Permission.Ruleset : tableau de Permission.Rule. Rule fermé, action:string/resource:string/effect requis ; effect enum allow/deny/ask.
- Session.Metadata : objet ouvert.
- Session.Inbox.Delivery : **string enum steer/queue**, pas un objet.
- Session.Inbox.User : objet fermé, id/sessionID/time/type/payload/delivery requis ; time fermé avec created:number requis ; type=user ; payload=Session.Inbox.UserPayload.
- UserPayload : objet fermé, text:string requis ; files/agents/skills tableaux de pièces jointes et metadata:object facultatifs.
- Inbox.Info : union User/Synthetic/Compaction/Move.
- Session.Info : objet fermé ; id/projectID/cost/tokens/time/location requis. Props facultatives parentID/fork/agent/model/outcome/title/subpath/metadata/permissions/revert. time fermé, created/updated:number requis, idle/viewed/archived:number facultatifs. outcome enum succeeded/failed/interrupted. fork fermé avec sessionID/boundary requis.
- **parentID dans Session.Info est facultatif mais non nullable** (Session.ID si présent). C'est différent de parentID facultatif et nullable dans le body de création. Conserver les octets observés et appliquer cette différence explicitement, pas substituer le document attendu ou normaliser les preuves à sa place.
- Session.Message.Info : union AgentSelected/ModelSelected/LocationSwitched/User/Synthetic/System/Skill/Shell/Assistant/Compaction/Idle. Valeurs query type correspondantes : agent-switched/model-switched/location-switched/user/synthetic/system/skill/shell/assistant/compaction/idle.
- Message.User : objet fermé id/time/text/type requis ; time.created:number requis ; type=user ; metadata/files/agents/skills facultatifs.
- Message.Assistant : objet fermé id/time/type/agent/model/content requis ; type=assistant ; time.created:number requis, streamed/completed:number facultatifs. content tableau union Assistant.Text/Reasoning/Tool. Props facultatives metadata/snapshot/finish/rawFinish/native/cost/tokens/error/retry. snapshot fermé start/end/files facultatifs. finish enum stop/length/tool-calls/content-filter/error/unknown.
- Assistant.Text : objet fermé type=text et text:string requis, native facultatif. Le collecteur ne promeut pas le raisonnement privé en résultat. time.completed ou finish=tool-calls isolés ne prouvent pas la fin de travail.
- SessionMessagesResponse : objet fermé data/cursor requis ; data tableau Message.Info ; cursor fermé avec previous/next:string|null facultatifs.
- ServerInfo : objet fermé version:string/pid:integer/urls:string[]/paths requis ; paths fermé avec tmp:string requis ; hostname:string|null et capabilities:object|null facultatifs.
- PromptInput.FileAttachment : objet fermé uri:string requis ; name/description:string et mention:Prompt.Mention facultatifs.
- PromptInput.SkillAttachment : objet fermé id:Skill.ID requis ; mention:Prompt.Mention facultatif.

## Noms absents et portée

Il n'existe pas de composant nommé `PromptInput.Prompt` ou `PublicSessionInfo` dans cette capture OpenAPI. Le body prompt est inline ; les réponses création/get référencent `Session.Info`. Ne pas inventer un composant ou reprendre un ancien nom comme forme wire.

Les attributs optionnels du schéma général restent obligatoires si la preuve spécifique les exige. Leur absence fait refuser cette preuve ; elle n'autorise ni valeur attendue substituée ni qualification implicite. Pour une référence non développée ici, demander un extrait ciblé supplémentaire. Aucun changement global MCP, aucun accès alternatif au gros fichier worktree refusé et aucune exécution native par cette extraction.
