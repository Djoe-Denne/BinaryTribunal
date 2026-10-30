# 130. Admission proposée : fermer l'ordre de réservation locale

## Objectif et problème confirmé

Préparer une admission exacte sans inventer les jetons de possession. Le complément auteur fournit la dérivation de la vue A, du dossier et des références depuis les sources matérialisées. Il distingue correctement intention sans fences, image finale et droits natifs non attestés.

Le superviseur a corroboré un manque de composition concret. Le client482–485 exige que le permis corresponde à l'image avant d'atteindre init. Engine.create acquiert la lease du contrôleur (76–85), mais la réservation de famille intervient seulement dans prepareNativeGraphExecutionV1:964–973, après la vérification du host et de l'image à938. Les chemins fermés actuels ne donnent donc pas à eux seuls le jeton de famille réel avant la fabrication du permis exact.

Présumer le prochain jeton, omettre la garde ou présenter une intention comme un permis ne résout pas cet ordre. Ce manque ne remet pas en cause le calcul de source réussi, mais empêche de déclarer l'admission opérationnelle prête.

## Direction retenue dans le mandat

Utiliser une composition parent locale préalable des API existantes, sans modification du produit782 ou de son contrat persistant : initialiser la mission locale, acquérir le contrôleur réel, installer les snapshots/partition/unités/plan exactement liés aux sources, puis réserver la famille via ses préconditions et comparaisons de versions. Lire ensuite les vraies leases. La préparation native existante sait réutiliser cette réservation au lieu d'en fabriquer une nouvelle.

Cette opération locale ne doit appeler ni provider permissif, transport, bridge legacy, préparation scientifique, submit, octroi root ou permis. Elle ne valide pas l'inventaire ou une acquisition et ne crée pas de résultat scientifique. Aucun travail ne doit passer RUNNING ; l'état de réservation locale doit rester explicitement HOLD pour les effets natifs.

Le parent demande seulement une petite implémentation candidate de cette composition et son contrat fermé avant tout accès à une base. Aucun lancement de cette étape n'est effectué par ce rapport. Les préconditions de création exclusive, reprise, ownership, expiry, readback et absence de nouvel effet devront être vérifiées ; une base existante ne sera ni réinitialisée ni adoptée implicitement.

## Admission à reconstruire après ownership

Le dossier devra contenir la vue d'inputs exacte et les deux textes vérifiés, avec le prompt D inchangé. Les métadonnées rmsBinding utiliseront les tokens réellement reçus de contrôleur et famille. Leur ajout change le digest et le wire : ils devront être recalculés et mesurés avant toute acquisition/permis exact et avant prepare. Le source bundle gelé ne change pas.

Les déclarations de catalogue et les règles session proposées ne prouvent pas les droits effectivement exercés. Aucune inconnue réelle de permissions ne sera vidée pour obtenir une inspection favorable. Un refus reste une preuve de refus, pas un test sauté ou une activation.

## Preuves et limites

- Livraison : READ_ONLY_ADMISSION_A_DERIVATION_AND_BOOTSTRAP_BOUNDARY_NO_EXECUTION.
- Lectures parent : client482–526,582–665 ; engine61–96 ; graph-store918–983,1877–1905.
- Réservation existante : assertWorkCurrent, assertController, assertBinding, assertPrerequisites, attente de version et possession via leases.reserve ; aucun remplacement par une écriture SQL directe.
- Aucun accès à une base opérationnelle, session, compte, grant ou nouvel effet natif. Les obligations inventaire/canary, acquisition, droits, D5 et M2 restent ouvertes.
