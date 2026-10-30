# 239. Connexion arrêtée ; fenêtre de validation trop courte

## Objectif et résultat concret

Le petit essai IDA exige une connexion OpenAI utilisable. La première tentative238 est **HOLD**, pas une connexion réussie. Elle n'est pas relancée. Aucun travail de modèle, session de travail ou action IDA n'a été envoyé ; aucune nouvelle origine RMS n'a été comptée.

La garde de travail a réservé les quinze secondes finales pour fermer l'hôte. La préparation et l'orchestration avaient déjà consommé trop de temps : près108secondes entre le début Prepare et l'intention RMS, puis99,3secondes de vérification des fichiers. Il ne restait qu'environ16secondes entre la tentative de connexion connue et le HOLD. Ce délai trop court relève de notre orchestration, pas d'un défaut d'action de l'utilisateur.

Je ne sais pas si l'utilisateur a vu le code ou terminé la validation. Les seules traces techniques ne permettent pas de l'établir. Il faut ce fait avant de choisir entre vérifier une connexion potentiellement persistée, corriger la visibilité de la fenêtre ou préparer une nouvelle tentative réellement utilisable.

## Faits vérifiés, sans lecture de secrets

- Enveloppe extérieure Connect : HOLD, sortie outil1,118869ms, processus fermé et drains reçus, aucun kill demandé.
- Receiver : HOLD, RMS46344 sorti1,118039,6145ms ; audit RMS EXACT_AUTH_SUFFIX_ONLY, historique préservé et35autres tables inchangées.
- Journal Auth : une intention, un CONNECT_CLAIMED, une tentative connue, onze états PENDING, puis HOLD. Aucun COMPLETE ou FAILED enregistré. Une demande unique est donc engagée ; pas de second POST ou retry automatique.
- Reçu public provisoire de l'application : failure AUTH_WORK_DEADLINE_RESERVE_CLOSE ; vérification32227fichiers/332635368octets terminée en99294,9249ms ; hôte30796 déclaré scope fermé, enfant fermé, sortie0 sans force. Ce reçu reste PROVISIONAL_NOT_ADOPTABLE : ses indications servent au diagnostic, pas à recevoir un succès Auth ou une fin native supplémentaire non attestée.
- runtimeAuthPersisted est null : inconnu, pas absence prouvée. Une connexion peut avoir été engagée ou persistée ; aucun rollback ou effacement n'est demandé.
- Logs Auth jetés sans décodage/copie, reçus non exacts explicitement signalés. Aucune base Auth lue par SQL, copiée ou hashée intégralement. Seul son reçu public de métadonnées a été lu et hashé.

Le délai de dix minutes par test n'est pas dépassé. Le HOLD vient de la garde opérationnelle de travail et de fermeture, pas d'un refus de permission ou d'une preuve de panne OpenAI. Les fichiers et traces restent conservés.

## Décision nécessaire : observation humaine, pas nouveau GO de mission

**Recommandation : ne pas relancer maintenant.** Confirmer d'abord ce qui s'est passé dans la fenêtre privée.

- Validation non terminée : préparer une fenêtre de temps suffisante, sans réutiliser le claim expiré. Les rapports, contrôles et décisions doivent précéder le nouveau Prepare ; pas de longue étape de rédaction entre Prepare et Connect. Les conditions techniques d'une éventuelle nouvelle tentative restent à fermer, notamment réutiliser les scripts déjà déployés seulement avec leur provenance propre prouvée, sans adopter un serveur ou un compte par copie.
- Validation terminée : vérifier d'abord par les métadonnées natives autorisées si la connexion du runtime existant est persistée ; aucune nouvelle demande OAuth aveugle. Ne pas demander de token ou lire la table de credentials.
- Fenêtre ou code non vus : vérifier le raccord et la visibilité avant une autre connexion, sans faire passer les ACK logiciels pour la preuve que l'utilisateur a vu l'écran.
- Situation inconnue : conserver HOLD et préparer le rapprochement en lecture seule ; aucun succès, absence de connexion ou droit de travail inventé.

Les temps futurs ne sont pas garantis et aucun coût financier n'est déduit des plafonds RMS en octets. Ne rien relancer préserve la sûreté, mais la connexion reste non qualifiée et le parcours IDA n'avance pas sur cette frontière. Aucune option ne modifie le compteur d'origines ou n'autorise un modèle.

## Références techniques

- `auth-parent-236/connect-5312262b-f5f9-481f-ad40-29a12dcc9e6f-FINALOUTCOME.json`, SHA256 `635ebc684de3be7ace449564a2183111a6a7e0687cbdaab209a4581694367d34`.
- `auth-parent-231/attempt-5312262b-f5f9-481f-ad40-29a12dcc9e6f/{FINALOUTCOME,rms-auth-audit}.json` ;15événements37–51, suffixe Auth attribué exactement.
- Reçu public180 `auth-receipt-5312262b-f5f9-481f-ad40-29a12dcc9e6f.json`, SHA256 `0fd963665593a558ab978d1c15e760e420f8f0c9ad3bcb2394860d1966a9c950`, jamais adopté seul.

M2 et le petit parcours IDA restent ouverts. Cette demande porte uniquement sur une observation humaine indispensable de la connexion, pas sur une permission générale déjà déléguée.
