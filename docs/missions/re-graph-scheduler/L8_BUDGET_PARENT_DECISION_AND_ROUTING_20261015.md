# Budget d'admission — décision parent et gate de routage

2026-10-15. L'analyse fresh Sol max est terminée, advisory seulement, et son auteur
`l8-budget-boundary` a été arrêté normalement. Task `task_mv9ex0g8_002m_udy5pa`,
session `ses_ec0d54dc3ffer6jIwoiUtka1sW`. Les 443 pins reçus restent exacts.
Rapport explicite natif archivé dans les reçus publics locaux, pas de DB privée.

## Qualification et vérification

Le parent retient **un défaut réel de contrat/intégration**, pas une fonctionnalité
optionnelle ni un simple problème d'encodage. L5 calcule une taille structurelle
(planner.ts:517–520) et la réutilise comme allocation d'admission, tandis que L6
contrôle le body complet (graph-store.ts:626–649). Le contrat inclut déjà enveloppes
et métadonnées. Les acceptations modulaires L5/L6 n'ont pas validé la verticale L8.
Le guard L6 reste correct et doit rester inchangé.

Le parent a reproduit, sans DB/submit, avec le vrai codec L8 gelé et ses validateurs
de résultat : ajouter un texte multibyte/échappé à A donne une proposition localement
valide de **14 476 octets** ; le body R reconstruit devient **44 590 octets** contre
13 590 dans la fixture d'origine. Les 443 fichiers sont intacts après la probe.
Le rapport indépendant donnait un autre exemple 15 476→46 590 : les textes ne sont
pas identiques, les deux démontrent l'absence d'une borne universelle issue du cas.
Ces validations locales fixture ne passent aucune gate scientifique/native aval.

Repro parent : `.tmp/coordination-three-20261014/probe-l8-budget-growth-parent-20261015.ts`
et `l8-budget-growth-parent.json`. Le bail constructeur est explicitement une
fixture en mémoire, jamais un reçu de réservation ou une autorité.

## Choix d'architecture retenu, implémentation encore interdite

Préférer une **allocation limitée explicite et versionnée**, déclarée par L8 avant
planMission et consommée par L5 avant sélection/fermeture. Pas de promesse que tous
les résultats autorisés par le schéma tiendront. Le codec mesure le body final avant
outbox/submit ; dépassement → diagnostic/arrêt contrôlé, artefacts conservés,
nouveau plan explicite si nécessaire. Aucune troncature ni élargissement du frozen.

- Contrat d'entrée typé/versionné : limites UTF8 et nombre maximal de nouveaux
  executionIds par rôle/fonction, lié à config, mode/profils/modèles/variants,
  inventaire/règles/outils/inputs et epoch/cycle. Exclure les hashes futurs de
  plan/prepared/run pour éviter un cycle d'identité. Noms/champs définitifs encore
  à proposer par un auteur autorisé et à valider avant write.
- Pour unité u, conserver la mesure structurelle S séparément ; plafond commun
  C=max(S,caps déclarés des fonctions possédées), N=nombre borné de nouveaux bodies
  d'exécution uniques et coût conservateur T=C×N. C vérifié par le plafond unitaire,
  somme T de la fermeture non déjà sélectionnée vérifiée par le plafond total.
  Ni un seul prix S avant sélection puis rehash C, ni un double compte des callees.
- Toute allocation manquante/unknown dans la fermeture ou somme/produit débordant
  est bloquante. SCC et callee obligatoire ne sont jamais partiellement admis.
- Par défaut initial prospectif : **une nouvelle exécution par sous-intent**, pas
  de seconde génération/passe sans nouveau budget pré-plan. Ce choix doit être
  rendu effectif et durable dans L8, pas seulement déclaré dans la policy. Il faut
  vérifier exactement le sens des passes SCC, des retries et de la reprise avant
  d'annoncer cette borne. Le retry de transport du même body/executionId n'est pas
  une nouvelle exécution ; N ne borne pas les octets réellement envoyés sur réseau.
- Nouvelle sémantique policy/allocation/codec et nouveaux fingerprints de plan/
  sidecar/binding/prepared/run ; vieux plans/readers/logs restent relisibles sans
  migration ni réinterprétation. Le plan3073 de la preuve ne peut pas être agrandi.
  Garder FunctionIdentity, unit/subIntent IDs et clés de conflit/famille : changer
  de plan ne libère/déguise jamais une famille active/quarantined d'un ancien plan.
- L6 reste sans modification : body≤C≤plafond + fences/proofs inchangés. Une
  métadonnée nouvelle doit être compatible avec ses vrais codecs/cohérence ; pas
  de cast ni de SQL pour contourner une incompatibilité. Si cela n'est pas possible,
  nouvelle escalade avant extension, pas une nouvelle table de convenance.

Une correction uniquement L8 du prix/sélecteur répliquerait L5 et sa fermeture,
donc n'est pas le choix minimal. Une marge constante ou le seul plafond global ne
corrigent pas le défaut. Aucun champ numérique n'est gonflé par padding scientifique.

## Routage : exception humaine nécessaire avant nouveau correcteur L5

Le parent a relu la provenance native du dernier auteur L5 :
`l5-relation-astra`, session `ses_ec4e28a22ffeWH6ZPlY4yPHm2i`,
**openai/gpt-6-astra / max**. Son planner est byte-exact au main accepté :
`37723edf3e365be178bfce2db18e316f9e38efc4e41fbfe16f321760ffecd8b3`.
La route corrective renforcée précédente est donc déjà maximale. La qualifier
de simple feature L8 pour revenir silencieusement à Sol max contournerait la règle.

**Aucune admission corrective L5 avant choix explicite utilisateur**, par exemple
exception bornée à un nouveau writer fresh Astra max pour ce défaut et ses tests.
Ni reprise du vieux writer/reviewer, ni nouveau modèle/provider, ni fallback solo.
Le GO éventuel de routage autoriserait d'abord accès/repros/plan ; le parent garde
le choix final d'API et l'approbation d'écriture. Propriété envisagée : delta L5
planner/tests seulement, cinq centraux et nouveaux modules L8 restent à l'auteur L8,
L6/L1 readonly. Revue fresh indépendante et gates parent avant transfert/intégration.

Gates attendues : A/B/R réels, C−1/C/C+1 UTF8/escapes et ligne2000 distincte,
propositions légales trop grandes refusées sans effet, total/fermeture/SCC/
callee partagé/overflow/unknown, nouveaux executionIds versus retries identiques,
config/codec/inputs invalidés, replay/reopen/concurrence/CAS, aucun widening d'ancien
plan, puis verticale L8 et revues L7/L9/L10. Pas de GO réel/native déduit.

La correction du simulateur et la revue initiale QA restent indépendantes et
continuent. L8 A reste gelé ; aucun worker existant interrompu, aucune configuration
ou politique modifiée. La question de routage n'est pas une acceptation du code.
