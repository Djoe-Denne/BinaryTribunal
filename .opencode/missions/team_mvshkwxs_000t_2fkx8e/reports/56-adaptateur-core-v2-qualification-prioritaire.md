# 56. Adaptateur direct V2 retenu comme piste prioritaire, qualification avant activation

## Décision et raison

Le même architecte a rendu un avis puis l'a précisé après lecture du contrat API actuel : **qualifier d'abord un adaptateur direct au noyau public V2**, sans construire par défaut les neuf handlers d'un ancien bridge. Le parent retient cette piste minimale. L'extension du propriétaire serveur existant reste un recours si une garantie indispensable ne peut pas être obtenue par l'API publique.

Cela ne consiste pas à remplacer un nom de RPC : il faut démontrer identités durables, déduplication, ownership, permissions et terminaison. Aucun code global, nouveau service, magasin de données ou ordonnanceur n'est autorisé implicitement. Le journal durable RMS existant doit rester le point de rétention local.

## Vérification nouvelle de version

GET `/api/info` du service déjà démarré rapporte **OpenCode2.1.4**, tandis que le client local épinglé est2.0.26. Les schémas observés proviennent bien du serveur courant. Cette différence ne commande ni installation ni redémarrage ; elle doit être incluse dans la qualification du protocole réellement utilisé. Aucune compatibilité automatique n'est déduite du seul nom V2.

## Contrat de qualification fermé à examiner

1. **Retenir avant effet** les IDs natifs valides de session et de prompt, leur image exacte, leurs digests et les références de propriétaire/fence dans le journal RMS existant. Pas d'identité régénérée au retry ni second magasin.
2. **Session fraîche et attribuée** : agent, Model.Ref, droits et localisation explicitement demandés, puis relus ; pas d'héritage de contexte parent. Une collision ne peut être réparée par mutation de modèle ou de profil, que le PATCH observé n'expose pas.
3. **Création et prompt idempotents** : établir les effets de doublons identiques/divergents et la coupure crash/réponse perdue avant de permettre une réémission. La possibilité de choisir un ID dans le schéma ne prouve pas cette propriété. En l'absence de garantie : ambiguïté conservée, claims retenus et aucune nouvelle identité.
4. **Autorité locale et native distinctes** : le CAS du journal RMS et ses contrôles pré/postappend ne font pas appliquer un fence par le serveur. Qualifier séparément prévention des nouvelles émissions, rejet scientifique des résultats périmés et éventuelle obligation de rejet natif d'une commande déjà en transit. Si le contrat exige cette dernière propriété et que l'API ne la garantit pas, la capacité doit rester indisponible ; pas d'abaissement silencieux du critère.
5. **Droits réellement effectifs** : la configuration demandée ou un principal fourni par l'appelant ne suffit pas. Les futurs contrôles positifs/négatifs doivent porter sur la session worker et son périmètre, sans exposer de credentials ou emprunter les droits du superviseur.
6. **Observations attribuables** : rapprocher admission locale, session, message, résultats et état terminal. Interruption demandée, message final et quiescence sont distincts ; aucun replay promis à partir d'un flux live-only ou watcher parallèle ajouté.
7. **Version prospective explicite** : le raccord futur ne remplit pas simplement des champs actuellement nuls. Le contrat et les consommateurs de qualification/runtime devront évoluer ensemble, avec refus des anciens cycles et sans migration implicite.

Cette décision autorise la qualification statique et documentaire ciblée, **pas une activation native ou création de workers de test par anticipation**. Les refus prospectifs actuels restent en place jusqu'au contrat et aux preuves correspondants. La réalisation dans le mandat sera arrêtée par le parent sur ces faits, pas par une nouvelle préférence spéculative.

## Travail en cours et limites

Le rôle de qualification initial est repris pour une recherche factuelle indépendante du conseil d'architecture : contrats et sources publiques V2 sur doublons, collisions, reprise, identité/droits et états terminaux. Il ne conçoit pas une seconde architecture et n'exécute aucune mutation, test ou nouvelle session. La version2.1.4 lui est transmise ; tout écart avec les sources disponibles doit rester explicite.

Les preuves intégrées précédentes demeurent valables. HOLD125, quatrième origine, diagnostic gelé, campagnes scientifiques et liveFF8 restent inchangés. L'accès ordinaire parent à la source active est désormais établi ; ce n'est pas une permission de modifier le bundle global.

## Preuves

- Avis conservés : `../evidence/ses_e7bf518b0ffeIgOkK5bOJW2gKI-native-finals-bundle-r2.json`. Le dernier addendum `msg_187a5f720001gi1Z3fBb6BVirO` révise explicitement la priorité vers l'adaptateur direct ; SHA256 texte `4530c9eb8a374dda8c4047864e7047bb890e191e42c8743892e3705a61ba93f9`.
- Model.Ref natif du même conseiller : OpenAI Sol xhigh. Aucune seconde session architecte.
- Métadonnées courantes et schémas résumés : native-plugin-current-source-r1.json et native-core-api-contract-r1.json.

Pas de résultat d'idempotence ou de terminaison native acquis dans cette étape ; les IDs optionnels restent seulement un point d'ancrage possible.
