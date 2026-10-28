# 0x45E610 — sémantique A indépendante

## Périmètre et couverture

Analyse du gel autorisé uniquement, sans auteur B, C, classification ou verdict. Source primaire : packet natif projeté, SHA-256 déclaré `942cc92944c0c0364bd9efa7a43e04b381f5fc1cdca6710c180140ba7b5af909`. Compaction commune déclarée `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34`.

Sous `inputs/ff8-decomp-semantics-20261011-r01/g02/` : manifest intégral (25 lignes), common-compaction intégrale (24 lignes), `0x45E610.readable/asm-001.txt` intégral (18 instructions), `bytes-001.txt` intégral (3 lignes, 86 octets), metadata intégrale (lignes 1–3286, lectures successives sans lacune). Un seul chunk `[0x45E610,0x45E666)`, un seul bloc, retour à 0x45E665. Les bytes incluent `0F AF C2` (IMUL EAX,EDX), `C1 E8 0C` (SHR EAX,12), les deux stores EAX et `C3` : pas de divergence constatée avec l'ASM. Hashes fournis par le manifest, non recalculés ici.

## Rôle, confiance et nom proposé

**CERTAIN (mécanique)** : calculer la somme de quatre valeurs non signées de 16 bits extraites de globals DWORD, multiplier par un coefficient signé de 16 bits en conservant seulement les 32 bits bas, puis décaler logiquement de 12 bits ; effacer un global DWORD et dupliquer le résultat dans deux globals DWORD.

Nom proposé : **`Sum4U16_ScaleS16_Shr12_StoreGlobals`**, confiance **CERTAIN** descriptive. Deux preuves indépendantes du nom : (1) quatre masquages `0xFFFF` et trois additions établissent Sum4U16 ; (2) MOVSX WORD puis IMUL32 et SHR12 établissent ScaleS16_Shr12. Les stores établissent le suffixe. Aucun ancien nom n'est utilisé comme preuve.

**LIKELY (interprétation métier)** : primitive de calcul de profondeur agrégée de quatre sommets dans un état global d'émulation géométrique ; compatible avec une opération AVSZ4. Le contexte commun mentionne la pipeline GTE, mais ni le label `Gte_AVSZ4`, ni les xrefs seuls ne prouvent le mapping matériel des globals. Ne pas promouvoir une émulation matériellement exacte : le code n'effectue aucune saturation de profondeur ni détection persistante d'overflow.

## Contrat exact observable

Entrées mémoire, dans l'ordre des lectures natives : DWORD `0x1CA8A5C`, DWORD `0x1CA8A58`, DWORD `0x1CA8A54`, DWORD `0x1CA8A50`, WORD `0x1CA92F4`. Les quatre lectures sont réellement de 32 bits, ensuite masquées ; leurs 16 bits hauts n'influencent pas le résultat. Le WORD coefficient est sign-étendu, domaine −32768 à 32767. Les quatre adresses de données ont un espacement de 4 octets, pas un tableau compact à stride 2 ; aucune boucle ni stride dynamique.

Soit `S = low16(G5C)+low16(G58)+low16(G54)+low16(G50)` (0 à 262140), `K = signed16(G92F4)`, `P = (S*K) modulo 2^32`, et `R = unsigned32(P) >> 12`. L'ordre est : lire toutes les entrées ; écrire DWORD zéro à `0x1CA92F8` ; calculer P ; calculer R ; écrire R à `0x1CA8A2C` ; écrire R à `0x1CA8A70` ; retourner. Aucun des intervalles mémoire fixes ne se chevauche.

Le produit peut dépasser la plage signée 32 bits ; ce n'est ni un produit 64 bits décalé ensuite, ni une multiplication C signée autorisant un overflow indéfini. SHR est logique, jamais SAR : un produit négatif peut donner un grand résultat positif. R est toujours entre 0 et `0xFFFFF`. Il n'est pas limité à `0xFFFF`. Le global zéro n'est jamais remis à jour, même si IMUL déborde.

ABI : aucune entrée stack/register consommée, aucun appel, aucune allocation stack. Signature descriptive possible : `uint32_t function(void)` ; compatibilité cdecl sans argument, mais l'absence d'arguments ne permet pas de distinguer toutes les conventions. RET simple consomme uniquement l'adresse de retour. EAX sort intégralement égal à R ; AL/AX sont seulement ses sous-parties, pas une convention de retour partielle. ECX sort égal à `low16(G50)` ; EDX égal au coefficient sign-étendu. EBX/ESI/EDI/EBP ne sont pas touchés. Aucun x87/SSE : résultat indépendant du mode d'arrondi et environnement x87 inchangé. Les EFLAGS arithmétiques sont modifiés ; les MOV et RET finaux laissent les flags de SHR (CF dernier bit sorti, SF/ZF/PF selon résultat ; OF et AF indéfinis pour ce décalage multi-bit). Ils ne constituent pas le global de statut effacé.

## Preuves (7)

Références abrégées `asm` et `metadata` : fichiers sous `inputs/ff8-decomp-semantics-20261011-r01/g02/0x45E610.readable/`.

1. `asm-001.txt:1–6`, 0x45E610–0x45E62C : trois loads DWORD et masques 16 bits, donc données non signées après extraction.
2. `asm-001.txt:7–12`, 0x45E632–0x45E649 : quatrième DWORD masqué et additions ; MOVSX lit exactement le WORD coefficient.
3. `asm-001.txt:13`, 0x45E64B : store immédiat DWORD zéro au global 0x1CA92F8, avant multiplication.
4. `asm-001.txt:14–15`, 0x45E655–0x45E658 ; `bytes-001.txt:3` : produit tronqué EAX puis SHR logique 12, non saturation et non décalage signé.
5. `asm-001.txt:16–18`, 0x45E65B–0x45E665 : deux stores DWORD identiques, EAX inchangé jusqu'au retour ; retour 32 bits mécaniquement disponible.
6. `metadata.json:11–17,3284–3285` et ASM intégral : bloc unique de 18 instructions, zéro cible de code et absence de CALL/branche.
7. `metadata.json:18–30,217–222` : xrefs code de 0x547F65 (fonction 0x547E60), 0x556291 (0x5561E0), 0x5AA11F (0x5A9C10), témoignant d'une primitive réutilisée ; aucun usage de retour ou métier précis déductible sans ASM caller.

## Questions ouvertes et limites

- Quel mapping validé relie ces adresses aux profondeurs, facteur et registres GTE ? Le gel local établit les accès, pas leurs noms matériels.
- Les callers consomment-ils EAX, les deux globals, ou seulement l'un ? Pas de caller ASM dans l'entrée.
- Quelles restrictions réelles sur K/S rendent éventuellement l'overflow ou les valeurs hors 16 bits inatteignables ? Aucune garde locale : ne pas en inventer.
- Le global zéro est-il un statut logiciel, et quelle convention attend son effacement ? L'écriture est certaine, son rôle reste interprétatif.

Pas de conflit mécanique entre la compaction et les instructions. Le contexte secondaire reste une hypothèse métier, non preuve de conformité à une spécification GTE. Aucun test, compilation, live, promotion ou §5.6 effectué ; validation finale réservée au lead.
