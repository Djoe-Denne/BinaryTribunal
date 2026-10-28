# M2 — 142 : les délais restent bloquants, mesurer avant d'optimiser

## Résultat141 observé

**1PASS/2FAIL,24assertions,3tests**,130070ms, une invocation sans retry, processus exit1 sans signal, sources138 stables. Paquet141 clos rouge. Le stagedreopen passe5245,85ms ; le CASreplay échoue au timeout15s après17993,76ms et le trajet OLDREADY/freshfinal après106539,12ms. Aucune nouvelle erreur counterunknown n'est présente dans ces traces, mais les deux cas restent des échecs : ne pas reclasser leurs assertions éventuelles en PASS.

La compilation140verte reste valide ; elle ne compense pas le délai. Les petits gains statiques136 n'ont pas résolu le problème du trajet final. La différence entre110828ms anciennement et106539ms maintenant ne constitue pas un benchmark causal : sources et conditions changent et aucun coût par fonction n'est isolé. Pas de gain net revendiqué.

## Intégrité et arrêt

Reçus/logs/inventaires vérifiés,3DB/95002624octets et3casesassets/9entrées/3fichiers conservés,0unowned/0hashdrift/manifest inchangé, processus terminé. Aucune réouvertureSQL oucleanup. Reçu141SHA1fe0b588199b6b3581a72fa9adc1108704c07541ac0a201475b458c5ccaf5a2d ; sourceSetadca2296… .

Le lot complet n'est pas lancé. Aucune hausse de15s/test ou de300s/process, aucun cas supprimé, aucun nouveau patch spéculatif de cache. Les55autres cas sans thread n'ont pas de résultat actuel ; les3threads restent HOLD125. Les campagnes antérieures restent conservées, non réécrites.

## Étape suivante : découvrir le profileur existant, sans test

Avant une nouvelle optimisation, établir une preuve de coût sur le trajet problématique. Préférer le profileur CPU intégré à Bun s'il existe dans le binaire pinné : cela éviterait toute modification des validateurs/frames ou ajout de framework. Autoriser **une consultation de l'aide CLI Bun**,10s maximum, dans un environnement neuf isolé/configvide/no-env, sans source produit, test, DB, asset ou thread. Conserver commande/statut/log complet et extraire uniquement les options CPU/profile pertinentes.

Cette consultation ne vaut pas GO profilage ou exécution du produit. Après identification des options, le parent fermera explicitement un gate diagnostic neuf sur un seul cas sans thread et nouveauxOWN/assets, profil en fichier possédé, assertions et timeout15s inchangés. Le profilage peut perturber les durées ; un test sous profileur ne sera pas déclaré conforme à partir de sa seule fin ou de ses échantillons.

Si le binaire n'offre pas cette capacité ou si elle exige une nouvelle infrastructure importante, rapporter le manque avant toute installation/contournement. Aucun service, profiler externe, framework, containment, ou nouvelle permission globale autorisé. Les sources138 restent gelées et revues ; pas d'instrumentation ajoutée ici.

## Limites globales

Remplacement/S1concret global/contention et S2/M2 non acceptés ; les trois commandes consolidées restent non lancées. Aucun thread lancé, aucun faux PASS/waiver. Tâche globale propriété du lead, aucune délégation de commit/IDB/native/Git.
