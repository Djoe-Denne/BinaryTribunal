# Vdelta FRESH composée — source corrective R3 et QA corrigée R2

Paquet fermé before sourceR2/QA R1 et after sourceR3/QA R2 ; API_R1/R2/R3,
golden indépendant, contrats et décisions parent. Sources non acceptées,
aucun compiler/run. ACK_HOLD allpins/tailles/NONBLIND+plan puis GOaudit parent.
Reviewer fresh indépendant des auteurs et du reviewer précédent.

Verdict NATIF ACCEPTABLE_DELTA_SOURCE_AND_QA_SCOPED | CORRIGE | BLOCK,
3–8ancres/scénarios/effets/limites et rehash final. Une revue source statique
ne prouve ni compilation ni assertions exécutées ni allocation runtime mesurée.
Interdits : write/compiler/typecheck/test/run/validator/import produit/OS/DB/git/
IDA/live/réseau/délégation/teamtools/claim/complete/origins. Parent seul intègre
et lance les gates distinctes après acceptation, pas ce reviewer.

## Delta source à ré-dériver

V R1 entière a relevé six groupes : IComparer manquant, primitives argv sans
char/cardinality/nativebound, env vide refusé, allocations avant bornes, offsets
QA faux, inventaire336 faux. Contrôles déjà conformes R2 conservés, pas réaudit
global V3 ni simple confiance en le plan R3. Inspecter l'ensemble du diff réel.

1. IComparer résolu C#4/.NET4, pas API privée/manquante ou type récent introduit.
2. Primitives refusent NUL/char<32/surrogate isolé/argraw ou encoded32767,
   cardinalité129/commande32767 ; positifs32766/vide et quoting inchangés.
   Flags policy dans TryBuild seulement ; -r et -r= refusés, -rmodule permis.
3. Env vide encode EXACT2NUL ; entries/allowlist vides donnent plan valide
   data-only. Noms/membership OrdinalIgnoreCase et strings casing conservés.
4. Ordre précis des refus : chaque phase raw ENTIER validée avant décision de
   taille dérivée, cardinalités avant copie des extérieurs, artifacts17 entièrement
   avant cap15. Mutations tardives négatives ne sont pas masquées par dépassement
   antérieur d'une autre phase. Snapshots locaux possédés, pas builder relu.
5. Mesures AVANT expansion : pas payload64MiB cloné avant refus, pas env134Mchars
   construit avant contrôle32767. Canonical.GetByteCount sans allocation UTF8
   proportionnelle préalable, arithmétique bornée/checked, arrays16 refs puis
   payloads cumulés<=32768 seulement après cap. Pas nouveau sous-cap inventé.
6. Copies réellement conservées hashées puis publiées ; cohérence des longueurs,
   metadata/record/intent/getters malgré caller mutable. Pas atomicité concurrente
   promise ni ordre de panne mémoire assimilé à données6/7/10. Aucun plan partiel.
7. Canonical bytes+sum actual artifacts sous32768, même layout/IDs/enums/API ;
   standaloneCount ne se voit pas imposer la cardinalité16 du DTO ou réserve
   canonique cachée. Factories/Getters P8 restent propriétés/méthodes fixées.

## Delta QA à ré-dériver indépendamment

- Baseline lengthfields argv0@366/pinlabel@445 ; imageASCII259 triple occurrences
  @278/613/939,record1603/control1659 ; secondpinlength@537/chars@541,
  record944(labelp2)/947(labelempty) inchangés. Dériver depuis golden862/layout,
  pas copie des offsets d'une doc. Pas changement produit pour faire passer QA.
- Env vide positif TryBuild : block2NUL, emptylists,record838/control894,
  assertions ciblées indépendantes. Le hashbaseline ne reste pas invariant pour
  une fixture modifiée ; pas oracle circulaire depuis encodeur sous test.
- Anciens négatifs char/surrogate/cardinality/cmd et positifenvvide conservés,
  pas toThrow général/catch/skip qui masque défaut. Inventaire621R1 est statique
  et change avec ajout ; nouveau décompte expliqué, compteur runtime pas forcé.
- Console ASCII1024 y compris tags/summary/newline ; SHA256 standard mémoire,
  aucune instrumentation produit/GC/clock/heavyallocation nouvelle pour revendiquer
  une preuve de ressources. Petits négatifs ne prouvent pas allocation-before-cap.

Complétude host/inventaire contrôles/pin image OS, broker/Job/readback/ACK,
runtime125s/DBcache/full44 restent ouverts. La portabilité est limitation future,
pas migration ou nouveau backend dans cette revue. Aucun acquis native/G5G7.
