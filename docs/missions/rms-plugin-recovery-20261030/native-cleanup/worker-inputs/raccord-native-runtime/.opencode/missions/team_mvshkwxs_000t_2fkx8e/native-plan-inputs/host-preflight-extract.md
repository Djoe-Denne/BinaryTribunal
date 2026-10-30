# Préflight host — extrait statique OpenAPI 2.2.1

Source déjà capturée : `native-openapi-2.2.1-after-r4.json`, SHA256 `b2b8c4cfd4ba7e4f4566481628aa22527935351d461fca29646a1df37ed5a37f`. Extraction parent par Context Mode, aucun nouvel appel réseau. Ce schéma ne prouve ni configuration actuelle ni droits réellement exercés.

## Routes GET pertinentes

- `/api/agent` (`agent.list`) : query optionnelle `location` deepObject, `{directory?:string|null}|null`. Réponse JSON fermée `{location:Location.PublicRef,data:Agent.Info[]}`, les deux requis.
- `/api/agent/{agentID}` (`agent.get`) : agentID requis, même query location ; réponse fermée `{location:Location.PublicRef,data:Agent.Info}`.
- `/api/model` (`model.list`) : même query location, query types optionnelle Model.Type ou tableau ou null ; par défaut chat. Réponse fermée `{location:Location.PublicRef,data:Model.Info[]}`.
- `/api/model/default` (`model.default`) : même query location ; réponse fermée `{location:Location.PublicRef,data:Model.Info|null}`.
- `/api/provider` et `/api/provider/{providerID}` : liste/get de Provider.Info, query location, réponses location/data. Ces DTO peuvent contenir headers/settings/body : ne pas les collecter ou journaliser sans besoin et filtrage de secrets.
- `/api/permission/request` : requêtes de permission **en attente**, query location ; réponse location/data tableau Permission.Request.
- `/api/session/{sessionID}/permission` : requêtes de permission de la session ; réponse fermée `{data:Permission.Request[]}`.
- `/api/session/{sessionID}/permission/{requestID}` : une requête, pas un résultat d'évaluation ; réponse fermée `{data:Permission.Request}`.
- `/api/permission/saved` : query projectID optionnelle ; réponse fermée `{data:PermissionSaved.Info[]}`.
- `/api/config` : query location ; réponse Config.Entry[]. Ne pas prendre cette route comme audit de droits effectifs, ni collecter sa configuration générale sans besoin et filtrage.

Cette sélection des paths GET agent/model/provider/permission/config ne révèle aucune route intitulée « évaluer les droits effectifs d'une opération », ni compteur de révision/fence dans les DTO décrits ci-dessous. Une liste de demandes vide ne constitue jamais une permission ou une preuve d'absence d'activité.

## Schémas utiles

Agent.Info fermé : requis id, name, request:Provider.Request, mode (subagent/primary/all), hidden:boolean, permissions:Permission.Ruleset. Facultatifs model:Model.Ref, system:string, description, color, steps entier positif. Pour le préflight, whitelist id/model/mode/permissions ; ne pas collecter system ou request arbitrairement. Le schéma n'expose aucune révision.

Model.Info fermé : requis id, modelID, providerID, name, capabilities, variants:Model.Variant[], time.released, cost, status (alpha/beta/deprecated/active), enabled:boolean, limit (context/output requis, input facultatif). Facultatifs canonical,type,family,compatibility,package,settings,headers,body. Pour vérifier un modèle demandé : whitelist id/modelID/providerID/enabled/status/variants/capabilities/limit. Disponibilité déclarée ne prouve ni authentification, quota, coût autorisé ni modèle effectivement utilisé. Ne pas journaliser headers/settings/body.

Provider.Info fermé : requis id,name,activation(auto/enabled/disabled),package ; facultatifs canonical,integrationID,compatibility,settings,headers,body. Son activation n'est pas une preuve d'accès effectif ou de budget.

Permission.Request fermé : requis id,sessionID,action,resources:string[] ; facultatifs save:string[], metadata, source, message. C'est une demande, pas une décision autoritaire.

PermissionSaved.Info fermé : requis id,projectID,action,resource,time.created/time.updated ; pas de champ effect, révocation ou révision dans ce schéma. Ne pas confondre une permission sauvegardée avec l'évaluation de toutes les règles actuelles.

Permission.Ruleset = Permission.Rule[]. Rule fermé : action:string, resource:string, effect requis ; effect enum allow/deny/ask.

## Session et fraîcheur

GET `/api/session/{sessionID}` renvoie `{data:Session.Info}`. agent/model/permissions y sont facultatifs, time.created/updated requis ; aucune de ces valeurs n'est une fence de politique ou un reçu de droit réellement exercé. Les permissions déclarées du profil et celles de la session ne fournissent pas seules leur règle de combinaison avec règles globales, sauvegardées et overrides. Ces règles doivent être établies depuis la source pertinente et corroborées par les preuves requises, pas devinées.

La décision parent locale et ses versions/lease restent distinctes des faits du service distant. Un refresh GET authentifié peut fournir un snapshot borné et attribuable, pas une transaction atomique avec le futur POST. Pas de retry implicite en cas de divergence, ni de prétention à une synchronisation native universelle.
