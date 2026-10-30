# 135. Architecture connue requise : auditer le staging avant une nouvelle source

## Objectif et refus statique confirmé

Le staging doit obtenir une vraie réservation locale, pas seulement une source qui passe le planning. L'auteur signale un second prérequis : addUnit utilise assertCanonicalUnitProjection, qui impose x86-32 ou x86-64. V2 conserve légitimement architecture unknown, puisque son parcours de parties virtuelles ne prouve aucune ISA.

Le superviseur a relu unit-lease10–42 : la règle36 est effectivement appliquée avant insertion et à la réservation. Aucun candidat de staging ni accès base n'a donc été créé. Les onze contrôles et la recharge V2 restent valides pour la source ; ils ne démontraient pas ce prérequis persistant.

## Décision et prochaine investigation

Ne pas modifier V2 en x86 par présomption ni supprimer le contrôle. Le parent examine une seule alternative nouvelle : un artefact fixture constitué de véritables octets de code **construits pour une cible x86-32 explicitement spécifiée**, avec layout, fonction et chunks reliés aux bytes. Le hash de module porterait les bytes bruts, pas le JSON descriptif. Le format resterait raw/unknown plutôt qu'un PE ou une IDB inventé.

Un exemple minimal est proposé pour examen, pas ratifié ni généré : zone réservée de256octets puis séquence B8 00 00 00 00 C3, définition de fonction/chunk fermée et offsets exacts. La cible par construction serait distincte de toute prétention à connaître l'architecture du serveur, FF8 ou d'un artefact déjà observé. Aucun code ne serait exécuté, compilé ou installé. Le prompt documentaire et le corpus resteraient séparés de cette identité de fonction fixture.

L'auteur examine la conformité minimale et audite en même temps toutes les autres préconditions locales de putSnapshot/partition/addUnit/freezePlan/READY/reserve, pour éviter de reconstruire une source avant chaque incompatibilité statique connue. Le reviewer examine indépendamment la seule frontière architecture/provenance. Aucune nouvelle campagne RE ou nouvelle infrastructure n'est autorisée.

## Limites maintenues

La proposition n'autorise encore aucune création de nouveau blob ou source. Elle précise une option à trancher sur les contrats, pas un fait déjà prouvé. La suspension du stage130 demeure ; V1, V2, sources et produit782 restent intacts.

Une éventuelle nouvelle source resterait fixture/non-oracle et ne créerait ni compte, autorité, origine ou budget natif. Attribution du canary, inventaire, acquisitions et droits demeurent HOLD ; aucun zéro ou fence n'est déduit du succès du modèle.

## Avis indépendant reçu

L'avis result_mvudla9v_0002_a0jain est favorable sous conditions à une nouvelle fixture ciblée32bits, pas à renommer V2. Le hash doit porter sur les262bytes bruts décodés et être distinct du document descriptif ; le chunk entry occupe0x100–0x106. Layout, correspondance offset/RVA, mode de génération et preuve de parcours doivent être liés à une provenance fixture versionnée.

Le reviewer souligne que ces six bytes se décodent aussi en64bits : ils ne prouvent donc pas une architecture exclusivement32bits. La connaissance du mode vient de la spécification gelée de construction, pas d'une inférence sur les bytes ou le PID. La fonction fixture retourne zéro ; elle n'est pas la tâche d'accusé de lecture. Ces distinctions sont retenues. L'audit auteur des autres préconditions reste attendu avant décision de réalisation ; aucun nouvel artefact créé à ce stade.

## Références

- Livraison : NEW_STATIC_BLOCK_BEFORE_STAGE_MATERIALIZATION_UNKNOWN_CANONICAL_ARCHITECTURE.
- Lecture parent : unit-lease10–42 ; liens addUnit1705–1708 et réserve relevés par l'auteur.
- Stage non matérialisé, aucune base ou réservation tentée ; aucun nouvel échec dynamique allégué.
