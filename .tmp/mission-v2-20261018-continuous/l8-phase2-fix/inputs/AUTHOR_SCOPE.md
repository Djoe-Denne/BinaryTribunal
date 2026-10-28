# L8 phase2 — contrat exécutable B/C3-C5, pas code ni run

Phase1A intégrée pin-exacte et107PASSfocalisés nouveaux;phase1Btransport+QA en
revue,donc ces candidats ne sont pas encore des faits d'acceptance runtime.
L'utilisateur ordonne continuation jusqu'à vrai bloqueurrequérant son intervention,
pas arrêt pour GO administratif. Le parent veut ratifier une prochaine tranche
substantielle avant de coder,pas ajouter un plan vague ou contourner les gates.

Ownership outputs uniquement: EXECUTION_ENVELOPE.md,DRAIN_AND_ACTIVATION.md,
QA_MATRIX.md,MANIFEST.json. Aucun code/schema central/registre/git/IDB/live.
ACKhash/NONBLIND+plan puis GO d'écriture doc distinct. Écrireles4documents,
pas d'import/compile/test/validator/run/DB/processOS/natif/réseau/délégation.
Paquetseul:origins et contextesvoisins interdits. Hash/parsing données permis.

## Contrat précis attendu, frontièrefixture vs authorityréelle opposable

1. Nouvelle enveloppe exécutable VERSIONNÉE et nommée distinctement du transport
   docv3/v1v2,référencepar DIGEST exactdéfini des transports/partition/sidecar,
   snapshotCOMPLET/planning/admissionSource/budget/knowledge/approvals/fingerprints.
   Jamais cast GraphSnapshotView→GraphSnapshotV1 ou regimeB→L3A;compatibilité
   v1readonly/v2origineimmutable inchangée,pas rewrite/groupanchor/migration.
2. Machine d'état génération/CAS/PENDING_DRAIN:bloquer NOUVELLESfamilles,
   laisserA/Bdéjàengagés→R/publication/readback/release sur sourcesoriginelles.
   Pauseactuelle bloqueRnouvellementready:elle ne peut pas servir de drain.
   UNKNOWN/intentspending/ambiguous/budgetspent/expiry != Q. Activation précise
   aprèsfrontièreL6trusted,compatible/incompatible/retained/durableorphan/crash/
   nouvelowner,replay sans recluster/hashoriginaux exacts,pas nouvel ID surprise.
3. HOST vs JSONdoc:hostReceiptRef ne crée rien;localReceiptcapability existante
   est prise avantHOST dans verifyProposalWitness,donc n'est PAS un bypass permis.
   Définir interface trusted séparée,inputsautoritatifs locaux réellementdisponibles
   ou failclosed explicite. planAdoption.adopted!=activationdurable;putPartition
   sameIDdigest immuable,pasflipadopted. Inventoryabsent=UNKNOWN,proofsunit/attempt/
   claimsets+fences/sourcecaps exacts,leaseetworkerStillExecutable opposables.
   Tests fakeHOST fixture-only distincts d'acceptanceHOSTréelle/native.
4. C4publication→consommation:vraisbytes/hash/provenance et filesapprovalsblind
   AVANTnouvelleadmission;contextecomplet/caps,actualdurableknowledge,la simple
   référenceid/hash/vuesnap n'est pas une acquisitiondebytes. N/slots/budgetSPENT
   cumulentcrossEpoch;nouveauepoch/scopekey n'autorise pas reset/refund. Conservation
   des bornesL5réelles,pas inventer une allocation réseau ou relever un cap.
5. C5CLI/wrappers explicitspurs offline:prepare/index/multivue/compare/SIM/replayB
   et refusactivation/dispatch/shadow horscontrat. Quelles routes de la prochaine
   tranche réelles et quellesréservées? Un parsertransportseul ne suffit pas.

## Livrables bornés et plan d'implémentation vérifiable

Donner champs/types/identités/digests et invariantsérialisablesvsautorité;
ordretransactionnel/pointsCAS/rollbackouorphan/leasesdurables,avant/après chaque
IOcallback,comparaisonorigine,recovercontroller. Identifier fichiers exacts à
posséder et fonctions/interfaceàajouter,compatibilité/coûts/effets,ordre de3–5
slices source+QA+V et contrôles parent. Pasdecodecentralavantarbitrageparent.

QA Q1–Q6 matriceinput/transition/oracle/faitmanquant:restart/crashnouveaucontrôleur,
drainengagéA/B→R/publication/release,vraisbytesP→C,SPENTcrossEpoch,replayB sans
cluster et schema-only/admissibility/HOST distinctions. Modefixtureingestion
vsnativepublicAPI explicitementdifférents;aucunclaimG5-G7/full44/globalL8/L9L10.
Choixparentrésolvables marqués;si impossible avecAPIactuelle,décrire l'extension
minimale ou failclosed concret,nepasappelerunGO administratif bloqueurutilisateur.

3–8ancres par décisionarchitecturale clé,non dumpssource;4fichiershashés et
rehash inputfinal. Nouveaucontrat seraVfresh puisratifié par parent avantcode.
