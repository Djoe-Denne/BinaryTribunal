# 0x5083C0 — contrat sémantique final réconcilié R

## Verdict, périmètre et provenance

**Nom mécanique proposé : `FindFirstStridedEntryWithBit0Clear`. Confiance mécanique : CERTAIN.** **Occupation / « unclaimed » : LIKELY** (callers historiques seulement). **Métier GF / tâche / callback / allocateur : UNCERTAIN**, non promu.

Rôle : feuille sans appel. Un pointeur descripteur en argument unique. Parcours borné d’adresses à pas signé. Retourne dans **EAX** la première adresse visitée dont l’octet pointé a le bit 0 nul, sinon 0. Ne réserve, n’écrit, ni ne pose le bit.

Deux appuis indépendants du nom mécanique, hors labels IDA : (1) `TEST BYTE [EAX],1` / `JZ` avec conservation d’EAX vers l’épilogue ; (2) `MOVSX` du WORD `+0xC` puis `ADD EAX,EDI` uniquement sur l’arête bit-à-1, avec compteur `INC ECX` / `CMP ECX,ESI` / `JL` signé. « Unclaimed » n’est pas un opcode : il dépend de `OR BYTE […],1` chez les callers, snapshots datés.

Entrées lues : gel `inputs/ff8-decomp-semantics-20261011-r01/g20/0x5083C0.json` (lignes 1–73) ; compaction `inputs/ff8-decomp-semantics-20261011-r01/g20/common-compaction.md` (lignes 1–26) ; A/B déposés `outputs/ff8-decomp-semantics-20261011-r01/production/g20/0x5083C0/semantic_{a,b}.md`. Aucune projection `inputs/.../reconciliation/g20/0x5083C0/semantic/` (manifeste, hashes sidecar, slices native-*). Aucun volet C, review V, index, IDA, shell, git, registre, live, ni verdict antérieur.

- A : tâche `task_mv44sji3_00cb_cwu2k9`, rôle A, modèle déclaré dans le livrable `openai/gpt-6.1-sol` variante **medium**. Pas de SHA256 sidecar.
- B : tâche `task_mv44sji4_00cc_5ano7v`, rôle B indépendant, même modèle/variante d’admission. Pas de SHA256 sidecar.
- Gel `.tmp` déclaré par la compaction : SHA256 `75c518fbc4f5feb9551513bfe2cdfe267b7f040320872936cd495ffbd04ff4ad`. EXE `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, 32 bits, export `2026-10-11T16:38:25.140966+00:00`. Hex du chunk recopié dans le JSON d’inputs, 40 octets, 19 instructions, 5 blocs. **Pas de recalcul cryptographique local** ; le parent conserve §5.6 et le hash check.
- Auteurs A et B présents et complets. Hashes A/B non déposés → non confrontés. Indépendance fresh : parent, non auditée ici. Même modèle ≠ diversité de raisonnement. Label `sub_5083C0` / `arg_0` : étiquettes, pas preuve. Review absente de ce jeu.

Couverture : chunk unique `[0x5083C0,0x5083E8)`, hex `8b5424045633c90fbf720e8b42085785f67e10f60001740d0fbf7a0c03c7413bce7cf033c05f5ec3`. `code_targets` vide. Xrefs code gelées : `0x508367`∈`0x508360`, `0x5083F6`∈`0x5083F0`.

## Réconciliation A/B, y compris erreurs communes

| Sujet | A / B | Décision par preuve native |
|---|---|---|
| Nom | A `FindFirstUnclaimedStridedEntry` (alt. `FindFirstEntryWithBit0Clear`) ; B `FindFirstStridedEntryWithBit0Clear` | **B retenu.** Le corps teste le bit 0 clair et additionne un WORD signé. « Unclaimed » est LIKELY callers, pas opcode. L’alt. A omet le stride pourtant natif (`0x5083D8`/`0x5083DC`). |
| Rôle mécanique | Accord : scan borné, premier bit 0 clair, sinon 0 ; pas d’écriture | Retenu contre les octets, pas par accord A=B. |
| Champs descripteur | Accord `+8` DWORD base, `+0xC` WORD signé pas, `+0xE` WORD signé borne | Retenu. Ordre réel : `+0xE` puis `+8` puis (`+0xC` seulement si bit 1). Pas une struct complète. |
| Borne ≤ 0 | Accord EAX=0, `[edx+8]` déjà lu, octet non touché | Retenu : `TEST ESI,ESI` / `JLE 0x5083E3` / `XOR EAX,EAX`. |
| Succès bit 0 | Accord : EAX = adresse courante, pas de `XOR` | Retenu : `JZ 0x5083E5` ; épilogue `POP EDI`/`POP ESI`/`RETN` ne touche pas EAX. |
| Épuisement | Accord : `XOR EAX,EAX` jette le pointeur déjà avancé | Retenu. Le `ADD` a lieu avant le `JL` non pris. |
| Stride | Accord : `MOVSX` corps de boucle, pas preheader ; signé, peut être ≤0 | Retenu. Stride 0 + bit 1 : même adresse `borne` fois puis 0. Stride négatif : descente. Pas `sizeof(struct)`. |
| EAX / AL / AX | A : EAX 32 bits, ni booléen AL ni AX ; B : EAX résultat | **A+B.** Aucun `MOVZX`/`AND 0xFF`. EAX=0 d’échec indiscernable d’une base nulle dont le bit 0 est clair (**A**, conservé). |
| ECX | A : volatil ; B : résidu = visites bit-à-1 avant sortie, 0 si `JLE` | **B comme état machine, pas comme contrat.** `XOR ECX,ECX` @ `0x5083C5`, `INC` seulement après bit 1. Rien dans le gel ni dans les extraits callers ne lit ECX après l’appel. |
| EDX | A : volatil ; B : encore le descripteur au `RET` | **B.** EDX chargé une fois @ `0x5083C0`, jamais réécrit. |
| ABI | A : cdecl-compatible, pas prototype ; B : `C3`, callers historiques `ADD ESP,4` | Callee ne dépile pas : **CERTAIN** (`C3`). Nom « cdecl » : **LIKELY**, cleanup callers = snapshot. Un DWORD `[ESP_entrée+4]` avant tout `PUSH`. |
| Callers / bit 0 | Accord : après succès, `OR BYTE [retour],1` puis champs +2/+4/+8 | **LIKELY** snapshots compaction F:14–15, pas re-export 2026-10-11. Xrefs des `CALL` : **CERTAIN** (JSON:57–70). Algorithmes de liste distincts (B) : contexte, pas contrat de la cible. |
| Métier GF/tâche | Accord : prose historique écartée | Retenu UNCERTAIN. Pas de promotion par A=B. |

Erreur commune A=B écartée : l’accord « emplacement libre / unclaimed » n’est pas CERTAIN. Erreur commune évitée : ne pas promouvoir `gf_shared_infra` / QMD callback / status C_R BLOCKED 2026-10-10. Aucun conflit mécanique non tranché. Pas de review à fusionner.

## Contrat d’entrée, stockage et sortie

- Entrée : DWORD `[ESP_entrée+4]` → EDX (`8B 54 24 04` @ `0x5083C0`). Traité comme pointeur descripteur. Offsets lus seulement : `+0x8` DWORD, `+0xC` int16, `+0xE` int16.
- Convention : pas de frame EBP. `PUSH ESI` @ `C4`, `PUSH EDI` @ `CE` (après le load d’argument). Épilogue `5F 5E C3`. EBX/EBP intacts. EAX/ECX/EDX/flags volatils. Argument non dépilé.
- `ESI` = borne signée étendue (`0F BF 72 0E`). Chemin boucle seulement si ESI ∈ 1..32767. `EDI` = pas signé étendu, relu à chaque itération poursuivie.
- Sortie EAX :
  - 0 si borne ≤ 0 (`JLE` → `XOR EAX,EAX`) ;
  - adresse courante si `TEST BYTE [EAX],1` donne ZF=1 ;
  - 0 si `limit` visites bit-à-1 (`JL` non pris → `XOR EAX,EAX`).
- Effets : lectures du descripteur et jusqu’à `limit` octets aux adresses visitées si borne > 0. **Aucune écriture hors pile, aucun CALL, aucun global à adresse fixe.**
- Pas de null-check, clamp, alignement, atomicité, anti-alias. `ADD EAX,EDI` wrap 32 bits non testé. Précondition mémoire externe.
- ECX au retour : 0 sur `JLE` ; sinon nombre de visites bit-à-1 déjà effectuées (égal à la borne sur épuisement). Pas un second résultat documenté.
- EDX au retour : encore le pointeur argument.

## Déroulement exhaustif (CFG)

Blocs gel (fins exclusives) : `5083C0→{5083D3,5083E3}` ; `5083D3→{5083D8,5083E5}` ; `5083D8→{5083D3,5083E3}` ; `5083E3→5083E5` ; `5083E5→∅`. 8+2+5+1+3 = 19.

1. `5083C0–5083D1` : EDX=arg, sauver ESI, ECX=0, ESI=`MOVSX [EDX+0xE]`, EAX=`[EDX+8]`, sauver EDI, `TEST ESI,ESI`, `JLE 5083E3` (rel8 `7E 10`).
2. `5083D3–5083D6` : `TEST BYTE [EAX],1` (`F6 00 01`), `JZ 5083E5` (rel8 `74 0D`). Première visite = la base, avant tout `ADD`.
3. `5083D8–5083E1` : `MOVSX EDI,[EDX+0xC]`, `ADD EAX,EDI`, `INC ECX`, `CMP ECX,ESI`, `JL 5083D3` (rel8 `7C F0`).
4. `5083E3` : `XOR EAX,EAX` (borne ≤0 et épuisement).
5. `5083E5–5083E7` : `POP EDI`, `POP ESI`, `RETN`.

Succès bit 0 ne passe pas par `XOR EAX,EAX`. Signedness : `MOVSX` + `JLE`/`JL` signés ; le test d’octet est un masque, pas une comparaison signée.

## Preuves ASM/xrefs (8)

1. **Argument unique avant saves** — `0x5083C0` `8B 54 24 04` ; aucun autre slot pile lu ; `0x5083E7` `C3` (JSON:15,18).
2. **Borne signée et court-circuit** — `0x5083C7` `0F BF 72 0E` ; `0x5083CF` `85 F6` ; `0x5083D1` `7E 10` → `0x5083E3` ; `0x5083E3` `33 C0`. Load `8B 42 08` antérieur, non déréférencé sur cette arête.
3. **Bit 0 clair = adresse courante** — `0x5083D3` `F6 00 01` ; `0x5083D6` `74 0D` → `0x5083E5` ; épilogue sans mutation d’EAX (JSON:18,51–55).
4. **Stride corps-seulement** — bloc `[0x5083D8,0x5083E3)` : `0F BF 7A 0C` `03 C7` `41` `3B CE` `7C F0`. Pas de taille d’élément constante dans le flux.
5. **Épuisement efface le pointeur avancé** — `JL` non pris tombe dans `XOR EAX,EAX` puis le même épilogue (JSON:36–50).
6. **Feuille, deux CALL entrants** — `code_targets` [] ; xrefs type 17 depuis `0x508367`/`0x508360` et `0x5083F6`/`0x5083F0` (JSON:57–71).
7. **Callers historiques posent le bit « skip »** — compaction :14–15 (`OR BYTE [ESI],1` @ `0x50837B` ; `OR BYTE [EAX],1` @ `0x508408`). Snapshots 2026-10-10, racine 40 octets recroisée (F:11), voisins non revalidés.
8. **Couverture octets/CFG** — 40 octets = fin-début ; 19 instructions JSON:72 ; hex JSON:15 = listing JSON:18 = compaction F:5.

## Limites et questions (UNCERTAIN — gates parent)

1. Revalider les octets actuels de `0x508360` et `0x5083F0` (chemin zéro de `0x5083F0` : bytes @ `0x508400` non fournis).
2. Qui écrit descripteur `+8`/`+0xC`/`+0xE` et les flags d’entrée ; valeurs concrètes de borne/pas.
3. Polarité métier du bit 0 au-delà du couple test/`OR` historique ; bit 1 du pump (`TEST AL,2` hors cible) n’est pas ce bit.
4. Stride = taille de struct ? Entrées disjointes ? Alias descripteur/octet visité ? Non établi.
5. Validité/nullité/synchronisation ; EAX=0 alias succès à l’adresse 0.
6. Type des objets chaînés par les callers (`+0`/`+4` descripteur vs `+8` entrée) : deux objets distincts, pas un layout unique prouvé ici.
7. Aucun xref image-entier au-delà du gel (deux sites). Fan-in 1943 annoncé pour `0x508360` n’est pas un compteur de `0x5083C0`.

Aucune promotion, §5.6 finale, mutation IDB/Git/registre, compilation, live ou validation expérimentale. Le parent conserve les gates natifs, le hash check d’intégration et l’éventuelle copie hashed vers `inputs/.../reconciliation/`.
