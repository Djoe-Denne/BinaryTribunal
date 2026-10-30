# 58. Admission native au repos observée ; premier adaptateur à réaliser

## Résultat natif nouveau

Le canary autorisé au rapport57 est terminé sur le même serveur2.1.4. Une seule session et un seul message ont été retenus sous les identifiants réservés. Les créations répétées et les admissions répétées retrouvent les données initiales, y compris quand le nouveau body est divergent : **le serveur ne rejette pas lui-même ces divergences**.

La file finale contient exactement le message possédé. Aucun message assistant n'est observé au contrôle final, aucun wake, interrupt ou resume:true n'est appelé. Les attributs de session stockés correspondent au profil, modèle et deny-all demandés ; cela ne prouve pas une inférence effective ou les droits exercés par un worker. Les enregistrements sont conservés, non réutilisés comme tâchesRMS et non supprimés pour masquer le test.

## Décision de réalisation bornée

Le parent retient un **premier adaptateur prospectif d'admission native au repos** : préparer/retenir, créer ou rapprocher exactement la session, admettre le message sans le réveiller, relire et refuser les collisions. Cette étape logicielle permet d'intégrer les comportements natifs observés sans prétendre déjà disposer d'une exécution qualifiée.

Le plan d'implémentation devra être approuvé par le parent avant écriture. Aucun nouveau RPC global, installation, service, ordonnanceur ou magasin indépendant. Le chemin historique reste intact ; aucun renommage automatique du namespace ou imitation de ses neuf capacités.

## Contrat fermé du premier incrément

1. **Identités et images durables.** IDs session/message alloués une fois avant le premier effet et conservés avec version, corps exacts, digests et références de scope/ownership dans la persistance RMS existante. Même clé avec autre image refuse avant réseau ; réouverture/retry n'engendre pas un autre ID.
2. **Une seule autorité locale.** Le plan devra désigner le journal existant consommé et les barrières de contrôleur/famille nécessaires avant/après append et avant/après réseau. Aucune image importée, métadonnée native ou simple factory publique de DTO n'accorde de droit. Les nouveaux enregistrements au repos restent des DATA, pas une approbation privée ou un receipt d'exécution.
3. **Transport fermé.** Découverte authentifiée du service déjà présent seulement, aucune option de body contrôlant une URL, pas d'ensure/start/reload. Version/identité courante comparée au contrat retenu ; écart ou serveur remplacé refuse. Credentials seulement en mémoire, jamais dans les enregistrements, erreurs ou traces. Pas de dépendance ou package installé.
4. **Rapprochement exact.** Un ID natif déjà présent n'est accepté que si propriétaire/scope, absence de parent, profil, Model.Ref, localisation et permissions correspondent à l'image attendue. Comparer le message réellement retenu avec le texte, métadonnées et pièces d'entrée attendus, pas seulement session/type. Divergence => refus explicite, aucune réparation de session étrangère ou de body.
5. **Aucun réveil.** Le body réseau est construit avec resume:false par le code de confiance ; un caller ne peut activer l'exécution via une option oubliée. Le résultat indique explicitement « admission au repos seulement ». Les méthodes d'exécution non qualifiées et les références actuellement nulles restent inchangées et refusantes.
6. **Ambiguïté et preuve conservées.** Réponse perdue ou lecture inconnue ne signifie pas absence transactionnelle. Rapprocher seulement les mêmes identités/images ; pas de compensation, suppression, remboursement ou seconde origine. Après retrait/fence périmé, conserver l'observation physique éventuelle sans la promouvoir en résultat autorisé.
7. **Compatibilité versionnée.** Nouveau contrat prospectif explicite et consommateurs cohérents ; aucun cast de v3, modification de cycle gelé ou migration d'ancien cycle. Le SDK2.0.26 peut être utilisé pour discovery/auth, mais ses types ne remplacent pas le contrat wire courant2.1.4 observé.

## Plan et vérification attendus

Un seul propriétaire de code isolé préparera le plan : fichiers limités, persistences exactes réutilisées et oracles négatifs/positifs. Les tests hors ligne injectent le transport et représentent honnêtement les réponses natives « première admission gagnante ». Ils doivent démontrer collision locale et native, réponse perdue, reprise identique, mutation du modèle/droits/localisation, perte d'autorité, scope importé ou ancien, credentials non persistés et impossibilité de réveil. Pas de nouveau framework ou test natif par le développeur.

Après gel et pin : parent exécutant typecheck et sélections ciblées à dix minutes/test, preuves valides réutilisées selon impact et revue indépendante avant intégration. Le succès du canary au repos ne qualifie ni terminaison, quiescence, fencing serveur, reprise après crash ou droits d'un modèle en exécution. Ces prochaines étapes restent des obligations distinctes, pas des flags à passer àtrue.

## Preuves

`../evidence/native-core-at-rest-r1/{plan.json,requests.jsonl,observations.jsonl,result.json}`. Résultat : OBSERVED_AT_REST_NOT_EXECUTION_QUALIFIED ;13 requêtes enregistrées dont GET initial404 puis données possédées200, même version/PID avant/après. Aucun secret ni réponse brute d'une autre session conservé.

Session de qualification conservée : `ses_rmsq_2783e61535564b3376f5e75d42f954cb`, message `msg_rmsq_2783e61535564b3376f5e75d42f954cb`. Ce sont des ressources de preuve, pas des modèles réellement lancés, des générations ou de nouveaux droitsRMS. La durée précise du canary n'a pas été enregistrée ; la commande avait une borne globale600000ms et chaque requête20000ms. Aucun nouveau test n'est relancé pour obtenir une durée.
