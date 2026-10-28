# L8 schema V — fresh, statique et source-scoped

Rôle V indépendant de l'auteur ; fresh sans fork ; voit candidat/DESIGN et
dispositions volontairement, pas B aveugle. Seuls fichiers pinnés du paquet.
ACK-HOLD accès/hash puis plan/GO distinct ; pas de résultat terminal sur ACK.

Après GO : attaquer les deux JSON et DESIGN contre les schémas/types réels,
binding historique et arbitrages parent pinnés. Aucun validateur extérieur,
import produit, test/run/build ou exécution du validateur maison autorisé.
Parsing/comparaison des arbres JSON en données et lecture des sources permis.
Ne pas appeler un parsing de schéma une validation de ses instances.

Points prioritaires :
- subset strict réellement limité aux mots-clés autorisés ; pas $ref/$defs,
  oneOf/pattern/if-then/const/format/exclusiveMinimum, schémas inline complets ;
- wrapperv3 distinct de partitionv1, pas de migration/câblage ; partition
  primaire conforme v1 sauf resserrement adopted=false ; groupes STRICTEMENT
  v1 inchangés, jointure communityContentId→partition.community réelle ;
- types exacts ProposalEvidence/PreviousProposalSource/GraphSnapshotView/
  FrozenEncoder sans encode/MultiviewConfig/LinkConstraint, champs optionnels,
  unions null, LosslessMetric vs KnownInteger, inlining fini non récursif ;
- CONTRÔLE SPÉCIFIQUE indépendant : l'inspection parent a trouvé adopted=false
  également dans source.previous.partition, décrit comme prepared-candidate
  tightening. Vérifier si ce resserrement est justifié pour un historique
  PreviousProposalSource (lineage.ts:442-452,1064-1080 et v1 boolean) ou s'il
  réduit indûment le miroir du type/du contrat. Inspecter aussi les partitions
  précédentes authoritative, pas seulement la partition courante. Ceci est un
  point à trancher contre sources/dispositions, pas un verdict imposé ;
- adoptiondoc :14champs requis minimaux, noms proposalFingerprint/observedDigest,
  pas d'égalité automatique, actor.hostReceiptRef non vide non authentifiant,
  explicit=true intention seulement, inventory complet sans executionContext,
  absence attempt/claim UNKNOWN et jamais preuve d'inventaire vide/quiescence ;
- k1minimum0/max100 n'exprime PAS >0 ; toutes bornes réellement codées vs
  propositions, hexlowercase/A|B/crossdoc/unicité/autorité/quiescence non
  prouvés par forme JSON. Vérifier aucune description ne prétend l'inverse ;
- preuve d'origine des règles, pas de nouveau champ/type/migration inventés,
  groupes kernel/context à leur vrai emplacement, oldschemas/central intacts.

Inspection parent avant V : deux JSON parsables,383nodes de schéma, aucun
keyword inattendu dans l'allowlist ; groupes v1 identiques modulo métadonnées
descriptives, partition primaire identique sauf adopted=false modulo métadonnées.
Ces contrôles structurels ne dispensent pas de votre attaque indépendante.

Rapport ACCEPTABLE_SOURCE_SCOPED|CORRIGE|BLOCK ; tout défaut avec chemin JSON,
source:ligne, effet contractuel et correction minimale testable statiquement.
3–8preuves, rehash final et limites. Pas de modification des sources/JSON,
réparation, compile/import/run/test/DB/API native/IDA/live/git/réseau/délégation.
Pas acceptance L8, ratification C3-C5/G7, intégration ou preuve d'autorité réelle.
