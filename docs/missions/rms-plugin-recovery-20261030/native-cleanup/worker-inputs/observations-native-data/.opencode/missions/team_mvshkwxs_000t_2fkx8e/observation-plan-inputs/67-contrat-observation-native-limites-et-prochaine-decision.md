# 67. Observation native : contrats disponibles et garanties encore manquantes

## Objectif et nouvel état vérifié

L’admission au repos étant intégrée, la suite doit établir ce qui permettra de prouver une exécution attribuable, ses droits et sa fin réelle. Le rôle de qualification initial a rendu une recherche ciblée ; le parent a récupéré sa finale native, capturé cinq sources supplémentaires du même commit officiel et relu les passages critiques. Aucune étude acceptée ou campagne n’est rejouée.

Le schéma courant expose bien un journal durable par session, une lecture de message par identifiant et une liste de sessions actives. Le parent n’a lu aucun état de session étrangère : seules les descriptions d’API et le journal de la session de preuve déjà possédée ont été consultés. Ce journal renvoie un marqueur de synchronisation, pas une exécution ou une fin. La session n’a pas été réveillée.

## Distinctions indispensables

- Le modèle stocké dans la session est une configuration. La source du runner lie le modèle demandé à une étape et à un assistant ; cela ne certifie pas le modèle physiquement servi par un fournisseur.
- Le refus effectif de permission doit être attribuable à l’appel d’outil. Un texte d’assistant disant « refusé » ne le remplace pas. Le champ d’événement `executed:false` provient d’un indicateur fournisseur et ne prouve pas à lui seul une absence d’effet local.
- Un message disparu de la file peut avoir été promu sous la même identité ; ce n’est pas une preuve d’absence d’admission et n’autorise pas une nouvelle émission.
- Le code associe les événements terminaux à la libération du claim, sauf interruption pour arrêt serveur. Une nouvelle exécution peut cependant suivre un terminal si un réveil est en attente. Fin d’un message, fin d’une période d’exécution et quiescence des ressources externes restent distinctes.

## Limites bloquantes conservées

Les surfaces établies n’offrent pas de précondition serveur de génération/fence empêchant une requête déjà en transit d’être admise après révocation locale. La reprise après crash est explicitement « au moins une fois », sans garantie d’absence de répétition d’effets externes. L’état public actif ne prouve pas la quiescence de tous les processus externes.

Ces limites ne sont pas levées par un nouveau test positif ou par l’adaptateur au repos. Aucune route d’exécution n’est activée, aucun receipt natif ou champ de qualification nul n’est rempli. Le parent doit choisir la prochaine réalisation utile sans prétendre satisfaire une garantie absente ; il conserve la décision dans le mandat et ne demande pas un GO de routine.

Le même architecte est consulté sur cette décision précise : un lecteur de données d’observation fermerait-il un sous-contrat utile, ou faut-il d’abord un raccord minimal au propriétaire natif existant pour une garantie indispensable ? Il doit distinguer répétition d’inférence et double effet RMS, sans transformer le contrat en exigence universelle nouvelle. Aucun second conseiller, code ou activation ne découle de cette consultation.

## Preuves et portée

- Schémas et lecture possédée normalisés : `../evidence/native-observation-api-r1.json`. Le journal est SSE (événements servis en flux HTTP), avec contenu JSON encodé ; les enveloppes ne sont pas interchangeables avec la réponse d’un simple GET JSON.
- Sources capturées et hachées : `public-core-v2.1.4-observation-r1/manifest.json`. Source officielle épinglée, pas correspondance binaire démontrée.
- Lectures parent : `permission.ts:222–244`, `runner/step.ts:73–85,91–109`, `publish-llm-event.ts:371–385`, `run-coordinator.ts:91–114`, capture antérieure `execution.ts:108–142`, `restart.ts:35–61`.
- Finale qualification : `ses_e7bfd1130ffeJqogvfIcT2LqBE-native-finals-bundle-r3.json`, message `msg_1880045d1001mD86TH3c0g4Apd`, SHA256 texte `fe6d24ab7932c4aafe511eb159919a1ca8417d30339a4d94925308d3b5c1396a`.

Les arrêts HOLD125, quatrième origine, diagnostic gelé et campagnes scientifiques restent inchangés. Aucun nouveau modèle, service, installation ou changement global.
