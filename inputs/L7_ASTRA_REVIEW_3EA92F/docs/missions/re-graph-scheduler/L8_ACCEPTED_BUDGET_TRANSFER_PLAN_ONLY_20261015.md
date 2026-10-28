# L8 tranche A — transfert du budget accepté, analyse/plan seulement

Même propriétaire `l8-integration-r1`, task `task_mv6towrm_000c_24005n`, session
`ses_ec12fcc43ffeI6xXQ5rSTty2mV`. Pas de nouveau lot/worker ni reprise d'un reviewer.
Contrat accepté L5 **613218f**, planner985e5ead…c858988 et test8d02cbec…ff3edb,
review fresh +parent typecheck143L5/60crossQA/full956PASS1SKIP. Ceci satisfait la
dépendance corrigée, **pas l'acceptation de ton L8 candidat**.

## Étapes distinctes

1. Parent vérifie Model.Ref natif Sol max, OWN, ancien paquet398 et13candidats gelés.
2. Prépare un paquet additionnel explicite. Seules nouvelles dépendances L5
   acceptées sont projetées en ROOT avec before/after SHA, pas tes propres fichiers.
   Gels/inputs initiaux, vieux plan3073 et32preuves restent inchangés.
3. Lire/hash/ACK les décisions et l'accès réel ; parent approuve cet accès.
4. **GO analyse/repros mémoire/PLAN uniquement**, pas édition ni DB/submit/dispatch
   avant approbation du plan d'adaptation. Le vieux GO d'édition A n'autorise pas
   silencieusement cette nouvelle frontière ou une migration des données gelées.

## Contrat et points à traiter dans le plan

Lire PARENT/L5_PLAN_GO.md et le vrai module, pas deviner une API depuis ce résumé.
AdmissionBudgetMode propre complete-admission-cap-v1, contexte courant indépendant
complet, policy.version préfixé mais max32UTF16 (préfixe26/suffixe1..6), caps
UnknownableInteger, profil1exécution/sous-intent, S/C/N/T distincts.

- Déclarer l'allocation limitée depuis de VRAIS config/spec/inputs/codec/epoch/cycle
  disponibles **avant sélection/fermeture**, appeler planMission avec son quatrième
  contexte. Décrire exactement ces sources et toute dépendance à des IDs futurs.
  Pas second sélecteur ou boucle de fingerprint ; spec-template ≠ spec d'exécution
  dérivée : exposer les deux et proposer explicitement le binding si nécessaire.
- C commun=max(S,caps fonctions possédées), N=nombre de sous-intents (3/fonction),
  T=C×N sûr ; caps inconnus/manquants et fermeture indisponible → diagnostics,
  jamais fallback S ou0. No widening/padding/truncation d'un ancien plan frozen.
  Body complet canonicalUTF8 final doit tenir C ; R légal peut dépasser C et être
  refusé en conservant l'evidence, sans prétendre qu'aucun R légal ne dépassera.
- **Borne N durable L8** toutes générations/passes/SCC/contrôleurs : quelle clé
  de run/unité/sous-intent/execution/body, quel enregistrement public durable avant
  I/O, quelle reprise/CAS entre réservation de budget/prepare/outbox/envoi. Retry
  du même body/executionId n'est pas une nouvelle consommation ; corps/ID différents
  ne sont pas un retry gratuit. Fencing/ambiguïté ne prouvent pas un arrêt.
  APIs readonly insuffisantes → parent avant cast/SQL/table/migration/édition L6.
- Coherence/readers stricts : nouvelle branche prospective explicitement versionnée,
  contrôle de toutes tables/S-C-N-T/contextes et fingerprints originaux/courants.
  Les lecteurs anciens et marqueur CycleRecord.graph v1 restent relisibles sans
  réautoriser/migrer une campagne ; tout champ présent invalide ne devient pas legacy.
  Proposer les versions/champs additionnels exacts AVANT write, surtout durable N.
- assertAdmissionBudgetBinding n'est pas le triple binding ni autorité scientifique.
  compareGranularities est **legacy-only** : opt-in y échoue fermée faute de contexte.
  Ne pas supprimer le mode pour le faire passer, modifier L5 ou annoncer son support.
- **Receipt2/fixture-only OPEN** : le L5 accepté le laisse satisfaire, y compris en
  nouveau mode. Prévalidation sémantique stricte SIM/L8 et vraies preuves/ports
  parent sont requis avant usage/promotions niveau2. Décrire la barrière et ses
  négatifs sans fabriquer un receipt/attestation ni corriger L5/L6 ici.

## Ownership et gates proposées

Seuls paths A déjà autorisés : engine/domain/adapter/client/cli, graph-pipeline/
graph-adapter/graph-engine ; fixture-driver et pipeline/engine/protocol/authority/
recovery/cli sous test/graph-integration. Plan nomme le sous-ensemble nécessaire.
Pas Store/MissionConfig/L1/L2–L6/validation/SCC/QA/fixtures/package/config/scripts.

Modifications des versions/payloads et crash protocols structurantes → ratification
parent avant write. Aucun journal générique/self-hash n'est une autorité. Source
initiale partielle13fichiers réutilisée, pas réécriture de confort ni gel remplacé.

Gates futures à détailler : C−1/C/C+1 Unicode/escapes/R agrandi, unit/total/SCC/callee
partagé, wrong/missing context/config/spec/input/codec/epoch et stripping ; N second
body/ID/retry/génération/passe/reopen/deuxcontrôleurs ; crash avant/après chaque
écriture et réponse perdue ; invariants ancre/claims/legacy/ports/publication.
Puis vraie verticale snapshot→groupes→plan→A/B/R→validation/commit fixture→drainREADY
D/E→B sans attendre F, faux provider et native authority clairement distincts.
Typecheck/focused/full codes/pins réels, pas preuve scientifique/native implicite.

L'ancien OWN avait792PASS1SKIP avant L8, pas main818 ; le nouveau test L5 ajoute78.
QA60 et26maintenances non committées main ne sont PAS copiés par ce transfert : ne
pas annoncer full956 simplement parce que main l'a passé. Le source simulateur
corrigé n'est pas accepté/transferé. **B L4 et câblage simulateur/CLI attendent leurs
GO séparés**, après revue/gates de A, ainsi que post-L8 QA/L9/L10.

À cette étape : lectures et probes mémoire seulement après accès/GO, pas nouveau
full/SQLite. Pas Git/install/réseau/LLM/dispatch réel/IDA/live/DB privée/sous-agent/
inbox/reset/suppression ou accès source main hors paquet. Dépendances préinstallées
readonly via le chemin OWN/tools/ff8-harness/node_modules déjà autorisé, pas install.
