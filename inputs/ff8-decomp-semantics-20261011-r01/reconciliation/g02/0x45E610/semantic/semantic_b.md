# 0x45E610 — sémantique B indépendante

## Gel et couverture

Entrée : `inputs/ff8-decomp-semantics-20261011-r01/g02/`. Manifest `0x45E610.readable/manifest.json:1–25` : packet natif SHA-256 `942cc92944c0c0364bd9efa7a43e04b381f5fc1cdca6710c180140ba7b5af909`, compaction `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34` (valeurs déclarées, non recalculées). Toutes les 18 lignes ASM, les trois lignes de bytes (un chunk de 86 octets, [0x45E610,0x45E666)), et les 3286 lignes metadata ont été lues sans omission ; CFG : un bloc, aucun successeur. Compaction lue intégralement (24 lignes). Aucun C/auteur/review/classification cible consulté. Autorité : export natif, non noms/commentaires. Aucun test, compilation ou validation §5.6 effectué.

## Rôle, confiance, nom

**CERTAIN (mécanique)** : somme de quatre valeurs globales u16, multiplication par un facteur global s16, conservation du produit modulo 2^32, décalage logique de 12 bits, duplication du résultat global et effacement d'un autre DWORD.

Nom proposé : **`GlobalSum4U16_MulS16_Shr12_ClearStatus`**, CERTAIN comme description mécanique. Deux preuves indépendantes du nom : les quatre AND 0xFFFF et trois ADD établissent Sum4U16 ; MOVSX WORD + IMUL + SHR établissent MulS16/Shr12. L'effacement est une troisième preuve indépendante.

**LIKELY (interprétation métier)** : opération GTE émulée de profondeur moyenne à quatre entrées, compatible avec AVSZ4 dans le contexte commun. Ce n'est ni une moyenne arithmétique inconditionnelle (aucun /4 explicite), ni une reproduction démontrée de toute la saturation/FLAG du matériel. Le label historique `Gte_AVSZ4` ne sert pas de preuve. Identité précise des registres matériels : UNCERTAIN sans contexte natif additionnel des accès globaux.

## Contrat exact et effets

- Aucun argument stack/register consommé à l'entrée ; feuille sans appel. `retn` simple : compatible ABI cdecl sans argument, ne démontre pas à lui seul le prototype source historique.
- Lectures DWORD, dans l'ordre : 0x1CA8A5C, 0x1CA8A58, 0x1CA8A54, puis 0x1CA8A50 ; seuls leurs 16 bits bas participent. Espacement des quatre slots : 4 octets, pas un tableau de WORDs contigus. Facteur : lecture WORD signée à 0x1CA92F4.
- Soit S = low16(G5C)+low16(G58)+low16(G54)+low16(G50), et K = signextend16(G92F4). S est entre 0 et 262140 ; les additions n'excèdent pas 32 bits. P = (S×K) modulo 2^32 ; R = P décalé **logiquement** de 12 bits, donc R entre 0 et 0xFFFFF. Le wrap intervient **avant** le décalage ; aucun produit large décalé avant troncature, aucune division signée ni SAR équivalente pour toutes les entrées.
- Ordre des écritures : DWORD 0x1CA92F8 = 0 avant IMUL ; DWORD 0x1CA8A2C = R ; DWORD 0x1CA8A70 = R. Adresses distinctes, pas d'alias entre ces spans natifs. Les inputs ne sont pas écrits. Aucun clamp, guard ou branche ; pas de mise à jour ultérieure de 92F8, même en cas d'overflow du produit.
- À RET, **EAX entier = R**. AL/AX ne sont que les vues basses de ce résultat, pas des retours partiels. ECX = low16(G50), EDX = K étendu sur 32 bits ; EBX/ESI/EDI/EBP inchangés. ESP n'est pas modifié avant RET ; RET consomme l'adresse de retour. Les flags CPU sont ceux du SHR (CF bit 11 de P, SF=0, ZF/PF suivant R ; OF/AF non définis pour ce shift), non le DWORD effacé.
- Aucun x87/SSE, allocation, appel indirect ou dépendance à l'environnement d'arrondi. État global partagé : aucune synchronisation, donc ne pas supposer réentrance/thread-safety.

## Preuves natives (6)

Chemins relatifs au répertoire d'entrée ci-dessus.

1. `0x45E610.readable/asm-001.txt:1–6,8,10` (0x45E610–0x45E63C) : quatre lectures DWORD masquées par 0xFFFF ; signedness u16 et stride 4 prouvés par les opérandes, pas le label.
2. `asm-001.txt:7,9,12` (0x45E632/63A/649) : trois ADD combinent exactement les quatre entrées ; aucune autre entrée de somme.
3. `asm-001.txt:11,14` (0x45E642/655) : MOVSX depuis WORD et IMUL deux opérandes ; facteur s16, résultat bas 32 bits. Bytes `bytes-001.txt:2–3` contiennent `0fbf15...` et `0fafc2`.
4. `asm-001.txt:15` (0x45E658), `bytes-001.txt:3` (`c1e80c`) : SHR EAX,12, non SAR ; exactitude du décalage logique après wrap.
5. `asm-001.txt:13,16–18` : effacement 92F8 puis stores DWORD du même EAX à 8A2C/8A70, suivi RET sans modification de EAX. Le résultat publié est déjà décalé dans les deux globals.
6. `metadata.json:11–17,19–30,217–222,3284–3285` : bloc unique, 18 instructions, aucun code_target ; xrefs de 0x547F65 (fonction 0x547E60), 0x556291 (0x5561E0), 0x5AA11F (0x5A9C10). Ils prouvent la réutilisation de la feuille, non les usages du retour ou la signification métier de ses globals.

## Limites / questions ouvertes / divergences

Compaction : faits arithmétiques conformes à l'ASM ; aucune divergence mécanique constatée. Sa terminologie GTE/profondeur et la note AVSZ3/AVSZ4 restent contexte secondaire, non preuve de mapping matériel. Ni cette analyse ni les xrefs seuls ne prouvent que les callers utilisent EAX plutôt que les deux sorties mémoire.

Questions : (1) quels accès natifs établissent les noms SZ0..SZ3/ZSF4/OTZ/MAC0/FLAG de ces globals ? (2) quels callers consomment EAX et à quelle largeur ? (3) le facteur est-il contraint à un domaine positif et le produit à un domaine sans wrap dans les usages réels ? (4) la différence avec la saturation matérielle est-elle intentionnelle ? Ces inconnues ne changent pas le contrat binaire ci-dessus ; aucun invariant de domaine n'est inventé.

Livrable sémantique uniquement ; pas de promotion ni intégration. Hash de sortie laissé au parent.
