# 210. Arrêt borné pendant la vérification des fichiers

## Résultat réel et conséquence

Le nouvel essai209 ne qualifie pas encore le raccord. Le parent a acquis et relu le fence3 en134ms ; l'état logique RMS est resté inchangé hors bail. L'invocation de lecture seule termine ensuite sortie1 en105095ms, avec le motif **« owned work deadline; reserve shutdown »**. La fenêtre de travail de105secondes a donc refusé la poursuite avant la borne totale120secondes ; le maximum autorisé de dix minutes par test n'est pas dépassé.

Le FINALOUTCOME extérieur est **HOLD**. La candidate contient un répertoire de sortie, mais aucun PID enfant, aucune réponse HTTP et aucun témoin de fin de vérification des32227fichiers. Le chemin source épinglé place cette vérification avant l'import applicatif et le lancement de l'enfant. Ces éléments sont cohérents avec un arrêt pendant le préflight ; ils ne donnent pas le nombre de fichiers réellement terminés ni la cause de lenteur précise. On ne déduit pas de ces absences une preuve de chargement natif, de fermeture d'un hôte ou de libération de ressources.

## Conservation et contrôles après l'échec

Le lanceur natif a observé la fin des deux actes et les deux drains, sans timeout extérieur, Kill ou retry. La collecte du receiver dure105181ms. La candidate et le reçu provisoire correspondent à leurs empreintes ; ce reçu reste PROVISIONAL_NOT_ADOPTABLE, jamais un succès.

La relecture des37tables après le HOLD correspond exactement à l'état suivant l'acquisition, bail inclus. Root, origine unique déjà comptée, claims, débits, identité parent et historique n'ont pas changé. Aucun grant170, résultat RMS, publication ou nouvelle origine n'est créé.

## Suite autonome bornée

Le parent conserve l'échec et demande au constructeur une consultation de code limitée à la boucle de contrôle des fichiers : comment conserver tous les contrôles de contenu et d'identité dans la même borne, sans ajouter de helper, processus, store ou harnais général. Le mécanisme effectif doit garder tous les hashes, les identités BigInt, les contrôles de chemins, les gardes d'autorité et les réserves de fermeture. Il ne s'agit pas d'autoriser un délai plus long ou de retirer une vérification pour réussir.

Aucun benchmark, rejeu du diagnostic gelé ou nouvel essai natif n'est lancé. Un correctif éventuel nécessitera une décision locale, un gel, les contrôles affectés et la revue utile. La mission continue sur cette investigation autorisée ; elle n'est pas clôturée ou déclarée globalement impossible.

## Références techniques

- Gate209 reçue : `result_mvv6tvvu_0000_qkexh5` ; lanceur exécuté SHA `0d8fc60a…`.
- Actes extérieurs : `evidence/owned-direct-209-prepare.json` et `owned-direct-209-receive.json`.
- Résultat : `owned-direct-209/FINALOUTCOME.json`, stdout/stderr exacts voisins.
- Continuité après HOLD : `evidence/owned-state-after-hold-209.json`,37tables inchangées et hashes candidate/provisoire concordants.
- Répertoire de sortie conservé : `qualification-b6012668-3d7f-49e2-9907-c3470bcfbd67` sous l'hôte180 ; aucun nettoyage.
- Frontière ciblée : candidat203 `client.ts:583–598`, comparaison de code limitée avec runner193:115–121,198–204. La qualification193 Node n'est pas transférée à Bun.

La qualification directe Bun→Bun, les chargements natifs, la tranche B, les droits B/R, D5 et M2 restent ouverts.
