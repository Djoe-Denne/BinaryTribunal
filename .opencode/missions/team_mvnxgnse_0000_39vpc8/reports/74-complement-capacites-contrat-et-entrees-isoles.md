# M2 — 74 : réserver les capacités réelles sans recréditer les droits consommés

## Objectif et problème confirmé

La première tranche de persistance a réussi son typing et ses 14 tests sur bases synthétiques (rapport73). Elle ne réserve pas encore les workers ni les quotas des comptes partagés. Le complément suivant doit empêcher deux admissions d'occuper le même worker ou de dépasser ensemble un compte, sans refaire le choix du planificateur.

La préparation en lecture seule est reçue. Le parent confirme dans la candidate planner.ts:551–593 : les capacités décrivent le **restant après réservations**, le worker est exclusif et les quotas du compte sont distincts. DRAIN:608–640 interdit de transformer une libération physique en remboursement d'un droit logique. Le plan proposé est retenu dans cette portée, pas comme preuve de son implémentation.

## Décision et prochaine livraison utile

Fermer maintenant les entrées et le contrat du complément, avant de modifier le store. L'auteur peut créer exactement deux nouveaux fichiers sous `inputs/s2-resource-complement-r2/` de cette mission : `CONTRACT.md` et `resource-fixtures.ts`. Le second contient les sources synthétiques et les attentes manuelles réutilisables par les prochains tests ; ce n'est pas une nouvelle base, un oracle indépendant ou un inventaire natif.

Les fichiers et bases déjà vérifiés restent intacts. Ne pas enrichir l'origine gelée73 : produire de nouvelles origines synthétiques, avant leur scellement, depuis la fixture auteur disponible. Aucun code du store, de l'autorité ou des tests existants n'est modifié à cette étape. Aucun import exécuté, typing, test, SQL ou accès à une base autorisé.

## Choix fermés pour le contrat

1. Une admission correspond à une allocation physique identifiée par executionId et liée au sous-intent. La famille conserve ses droits logiques A/B/R ; leur engagement ne promet pas trois places simultanées. L'affectation worker/compte provient d'un témoignage fixture indépendant fixé, jamais d'une nouvelle sélection lors de l'admission.
2. Distinguer acquisition, disponibilité restante et affectation. Définir leurs formes fermées, références, révisions et liens exacts aux sources S1, génération, propriétaire et protections contre les opérations périmées. Les records sont enregistrés par l'hôte fixture privilégié ; une requête JSON ou son propre hash ne peut leur donner autorité. Aucun témoignage natif n'est prétendu.
3. Un instantané de capacité restante nomme exactement les allocations actives qu'il inclut. L'admission vérifie ce set contre le journal courant dans la même transaction, puis impute la nouvelle demande **une fois**. Un set incomplet, une révision ancienne, une capacité inconnue ou une révocation donne HOLD avant nouvel effet. Définir explicitement comment une nouvelle révision est obtenue après allocation ou libération, sans fabriquer la disponibilité depuis le seul template.
4. Vérifier séparément les quatre dimensions worker, les deux dimensions compte et le plafond de concurrence courant/acquis. Ne pas additionner worker et compte. Garder les labels de modèles distincts de leurs Model.Ref : plusieurs labels peuvent désigner la même référence exacte. La demande resourcesByUnit reste celle liée par S1, sans division opportuniste entre rôles.
5. Retry exact : relire l'allocation persistée sans nouveau débit ni réservation ; ne pas en déduire un droit d'émission. Absence de nouveaux témoignages ne doit pas empêcher observation et arrêt. Une libération exige la preuve Q courante exacte, et ne rembourse aucun SPENT/BURNED ni droit engagé. Une preuve ancienne ne peut effacer l'occupation suivante du worker.
6. La libération de famille actuelle supprime ses claims (store:353–374). Le contrat doit donc préciser le raccordement avec la libération physique par executionId : aucun effacement silencieux d'une allocation encore active ni journal de libération manquant. Pas deux voies de libération contradictoires.
7. Réutiliser OWN/EventLog et la transaction existants. L'absence de nouvelle DDL est une proposition à vérifier, pas une exigence qui autorise un stockage ambigu. Définir les kinds/records et la reconstruction du seul ledger physique. Ancien état sans témoignage : UNKNOWN/HOLD pour nouvelle acquisition, jamais inventaire vide. Préserver les débits et engagements existants ; aucun remplacement de base pour remettre les compteurs à zéro. Replay global S4 et transition intergénérations restent hors tranche.

## Entrées et attentes à matérialiser

Créer un nominal S1 resource-complete pour deux workers distincts sur un même compte et un scénario où deux sous-intents visent le même worker. Les valeurs de capacités et leurs attestations synthétiques sont des littéraux indépendants, pas des maxima copiés de la demande. Identifier sans ambiguïté les dimensions, leur unité et les claims déjà inclus. Utiliser des petits entiers vérifiables à la main ; ne convertir aucun coût en tokens, prix ou octets.

Donner les états attendus avant/après pour : conflit worker ; compte partagé aux limites slots/budget ; chaque dimension insuffisante ou inconnue ; indisponibilité ; instantané périmé/révoqué ; rollback ; retry exact ; Q répétée puis réaffectation ; réouverture conservant droits et occupation. Quelques cas paramétrés suffisent, pas un nouveau framework. Les attentes ne doivent pas appeler le futur ledger ou le planificateur pour se fabriquer elles-mêmes.

La livraison doit fixer les signatures envisagées et les exemples de records réellement consommables, pas produire un nouveau catalogue S2–S4. Le parent examinera ces deux fichiers puis autorisera le delta produit fermé. Le budget 240s proposé par l'auteur n'est **pas exécutable** ; le paquet72 reste clos. La revue indépendante portera ensuite sur les nouvelles frontières atomiques et leur impact, sans rejouer les preuves inchangées.

## Localisation, impact et limites

Serena est confirmé sur la racine commune retro-eng. Son selectCompatible canonique a été consulté ; ses lignes diffèrent de la candidate. Le parent a donc vérifié directement planner.ts:551–593 de la candidate, seule version applicable ici. Autorité fixture:7–86 et releaseProvenV3:353–374 ont été lus pour les frontières de records/révocation/libération. Aucune édition symbolique ou conclusion d'absence de consommateur n'en est déduite.

000b et S2 global restent ouverts. Pas de commande publique, d'InputBundle agent, d'appel natif, de migration, de modification canonique, Git ou nettoyage. Les trois contrôles consolidés M2 restent non exécutés ; numeric450+9, S1 et planner conservent leurs portées précédentes.
