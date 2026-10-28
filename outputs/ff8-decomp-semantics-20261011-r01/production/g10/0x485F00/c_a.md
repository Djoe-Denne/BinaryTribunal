# C-A — g10 / 0x485F00 (lecteur factuel indépendant, volet A)

Modèle : openai/gpt-6-astra (high), mission `ff8-decomp-semantics-20261011-r01`, pool-39.
Aucune lecture d'un autre volet, d'un C antérieur, d'un ledger ou d'un index de résultats.

## 1. Entrées citées (gel `inputs/ff8-decomp-semantics-20261011-r01/g10/`)

| Fichier | Hash cité (manifest.json, non recalculé par moi) |
|---|---|
| `0x485F00.json` (paquet original) | `747d202f109234c40a3cfa42723ef64c709fc02120dc937e0f00a381432c893b` |
| compaction | `2ccc15a8b4611fa627c6b30b697010479c2c9b96cc69923fba089cfc278d7a01` |
| `0x485F00.readable/asm-001.txt` | `da0f879d03af2790007996566acc6969bd0dd24d75476028dee6e045d11b3f94` |
| `0x485F00.readable/bytes-001.txt` | `137993385f5a98f8941d5224b6e648adf92cd6c1004cbe5cb51aa69b6cd8caa6` |
| `0x485F00.readable/metadata.json` | `fb14dc3bdec690e1a467685fba4a10261acca55d3ee95aa11d2558fe8d5f20eb` |
| `common-compaction.md` | lu pour le contexte commun uniquement |

Binaire : `FF8_EN.exe` 32 bits, SHA256 d'entrée `064d466b…589570` (métadonnées).
Fonction : `[0x485F00, 0x485F54)`, 22 instructions, 3 blocs CFG
(`485F00..27 -> {485F27, 485F53}`, `485F27..53 -> {485F53}`, `485F53` ret).

Les noms IDA/commentaires ne servent pas de preuve de rôle. Les identifiants C
ci-dessous sont des étiquettes d'adresse neutres.

## 2. Vérification octets <-> ASM (décodage manuel de `bytes-001.txt`)

| Adresse | Octets | Instruction | Remarque |
|---|---|---|---|
| 485F00 | `8B 44 24 04` | `mov eax,[esp+4]` | DWORD, seul argument de pile |
| 485F04 | `8D 04 80` | `lea eax,[eax+eax*4]` | `eax = idx*5` (mod 2^32) |
| 485F07 | `8D 0C 85 C4 80 D2 01` | `lea ecx,[eax*4+0x01D280C4]` | `ecx = 0x01D280C4 + idx*20` (mod 2^32) |
| 485F0E | `51` | `push ecx` | arg3 |
| 485F0F | `68 80 00 00 00` | `push 0x80` | arg2 |
| 485F14 | `6A 68` | `push 0x68` | arg1 (imm8 `0x68`, étendu en DWORD) |
| 485F16 | `E8 D5 84 FF FF` | `call 0x47E3F0` | rel32 = -0x7B2B, suivant 485F1B -> 0x47E3F0 (confirmé) |
| 485F1B | `A1 DC 8D D2 01` | `mov eax,[0x01D28DDC]` | DWORD lu APRÈS l'appel |
| 485F20 | `83 C4 0C` | `add esp,0xC` | nettoyage appelant : 3 DWORD |
| 485F23 | `85 C0` | `test eax,eax` | |
| 485F25 | `74 2C` | `jz 0x485F53` | 485F27+0x2C = 485F53 (confirmé) |
| 485F27 | `66 0F B6 15 39 E7 CF 01` | `movzx dx, byte [0x01CFE739]` | **MOVZX DX** (préfixe 66) : seul DX est écrit, EDX[31:16] préservé |
| 485F2F | `6A 56` | `push 0x56` | arg5 |
| 485F31 | `68 80 00 00 00` | `push 0x80` | arg4 |
| 485F36 | `8D 0C D5 08 00 00 00` | `lea ecx,[edx*8+8]` | utilise **EDX complet** (32 bits) |
| 485F3D | `6A 03` | `push 3` | arg3 |
| 485F3F | `51` | `push ecx` | arg2 |
| 485F40 | `50` | `push eax` | arg1 (pointeur DWORD lu en 485F1B) |
| 485F41 | `E8 DA 82 FF FF` | `call 0x47E220` | rel32 = -0x7D26, suivant 485F46 -> 0x47E220 (confirmé) |
| 485F46 | `83 C4 14` | `add esp,0x14` | nettoyage appelant : 5 DWORD |
| 485F49 | `C7 05 DC 8D D2 01 00 00 00 00` | `mov dword [0x01D28DDC],0` | remise à zéro du DWORD |
| 485F53 | `C3` | `retn` | RET nu (cdecl, pas de pop) |

Couverture : 22/22 instructions. Aucune instruction n'est restée inexpliquée.

## 3. Ordre des arguments / ABI

- Les deux appels sont de type « appelant nettoie » (`add esp,0Ch` et `add esp,14h`) ;
  les arguments sont poussés de droite à gauche, donc en cdecl :
  - `F_47E3F0(a1 = 0x68, a2 = 0x80, a3 = 0x01D280C4 + 20*idx)` ;
  - `F_47E220(b1 = msg_ptr, b2 = EDX*8 + 8, b3 = 3, b4 = 0x80, b5 = 0x56)`.
- La fonction elle-même : prototype natif `__cdecl`, 1 DWORD d'entrée `[esp+4]`,
  RET nu. Aucune frame (ni `ebp`, ni locaux, ni registre sauvegardé).
- Registres écrasés : EAX, ECX, EDX, EFLAGS. EBX/ESI/EDI/EBP non touchés.
  ESP net inchangé (+0 après RET, hors adresse de retour).

## 4. Largeurs, signe, wrap

- `payload_index` : DWORD lu en entier. Aucun test de signe, aucune extension : l'arithmétique
  `idx*5*4 + base` est modulo 2^32 (LEA 32 bits), traiter en `uint32_t`. Aucune borne vérifiée dans la fonction.
- `0x68`, `0x56`, `3` : immédiats `push` ; `0x68`, `0x56` et `3` viennent de `push imm8`
  (étendus par le signe, valeurs positives -> pas de différence), `0x80` de `push imm32`.
- `battle_message_pointer` @0x01D28DDC : DWORD (pointeur 32 bits), test `!= 0` uniquement.
- `speed` @0x01CFE739 : octet non signé (MOVZX), 0..255.
- `b2 = (EDX*8 + 8) mod 2^32`, EDX = `(EDX_précédent & 0xFFFF0000) | speed`.
  Pour `speed ≤ 255` et EDX haut = 0 : `b2 = 8*speed + 8` ∈ [8, 2048] ; sinon les bits hauts
  d'EDX sont multipliés par 8 mod 2^32 (décalage `<<3` sans signe).
- Aucun shift variable ; pas de AL/AX autre que l'écriture partielle DX ci-dessus.

## 5. C complet

Remarque : fonction native à 32 bits. Les adresses mémoire sont modélisées par des
accesseurs externes pour rester correct sur toolchain 64 bits ; en build x86 natif ils se
réduisent à un déréférencement `volatile` de l'adresse absolue.

```c
#include <stdint.h>

/* ---- adresses absolues (VA natives, octets/imm32 lus dans bytes-001.txt) ---- */
#define VA_RECORDS_BASE      0x01D280C4u  /* 485F07 : stride 20 octets (idx*5*4)   */
#define VA_MSG_PTR_DWORD     0x01D28DDCu  /* 485F1B lecture ; 485F49 écriture 0    */
#define VA_SPEED_BYTE        0x01CFE739u  /* 485F27 MOVZX DX, byte                 */

/* ---- accès mémoire du processus 32 bits (hôte fournit la sémantique) ---- */
extern uint32_t mem_rd32(uint32_t va);
extern uint8_t  mem_rd8 (uint32_t va);
extern void     mem_wr32(uint32_t va, uint32_t value);

/* ---- callees (cdecl, appelant nettoie ; aucun prototype n'est prouvé au-delà
        du nombre de DWORD empilés par le site d'appel) ---- */
extern uint32_t F_47E3F0(uint32_t a1, uint32_t a2, uint32_t a3);                 /* 485F16 */
extern uint32_t F_47E220(uint32_t b1, uint32_t b2, uint32_t b3,
                         uint32_t b4, uint32_t b5);                              /* 485F41 */

/*
 * Natif : __cdecl, 1 DWORD de pile.  Le paramètre edx_at_485F27 modélise l'état du
 * registre EDX à l'adresse 485F27 (résidu de l'appel 47E3F0 ; non observable dans ce gel).
 * Seuls les 16 bits bas sont écrasés par MOVZX DX ; les 16 bits hauts sont conservés et
 * rentrent dans le calcul LEA (EDX complet).
 *
 * Valeur de retour : EAX au RET.
 *   - chemin jz (message nul)  : EAX == 0 (test eax,eax a conclu ZF=1).
 *   - chemin non nul           : EAX = résultat brut de F_47E220 (jamais modifié ensuite).
 * Cette valeur n'est lue par la fonction nulle part ; l'usage par les appelants n'est pas
 * établi dans ce gel -> conserver `uint32_t` pour la fidélité, sans lui donner de sens.
 */
uint32_t sub_485F00(uint32_t payload_index, uint32_t edx_at_485F27)
{
    uint32_t eax, ecx, edx;

    /* 485F00..485F07 : ecx = base + idx*20 (mod 2^32) */
    eax = payload_index;
    eax = eax + (eax * 4u);                 /* lea eax,[eax+eax*4] */
    ecx = (eax * 4u) + VA_RECORDS_BASE;     /* lea ecx,[eax*4+0x1D280C4] */

    /* 485F0E..485F20 : appel 1, résultat ignoré, 3 DWORD nettoyés (add esp,0Ch) */
    (void)F_47E3F0(0x68u, 0x80u, ecx);

    /* 485F1B : lecture du DWORD APRÈS l'appel (l'appel peut le modifier) */
    eax = mem_rd32(VA_MSG_PTR_DWORD);

    /* 485F23/25 */
    if (eax == 0u) {
        return 0u;                          /* 485F53 : retn avec EAX == 0 */
    }

    /* 485F27 : movzx dx, byte  -> DX = zero-extend(speed) ; EDX[31:16] préservé */
    edx = (edx_at_485F27 & 0xFFFF0000u) | (uint32_t)mem_rd8(VA_SPEED_BYTE);

    /* 485F36 : lea ecx,[edx*8+8]  (EDX complet, modulo 2^32) */
    ecx = (edx * 8u) + 8u;

    /* 485F2F..485F41 : pushes dans l'ordre 0x56, 0x80, 3, ecx, eax
       => b1=eax, b2=ecx, b3=3, b4=0x80, b5=0x56 ; nettoyage 14h */
    eax = F_47E220(eax, ecx, 3u, 0x80u, 0x56u);

    /* 485F49 : remise à zéro du DWORD (après l'appel) */
    mem_wr32(VA_MSG_PTR_DWORD, 0u);

    return eax;                             /* 485F53 : retn, EAX = retour de F_47E220 */
}
```

Forme native équivalente (hôte x86 32 bits, EDX non modélisé : la valeur haute provient du
compilateur) :

```c
/* uint32_t __cdecl sub_485F00(uint32_t payload_index);
   corps identique, avec mem_rd32/mem_rd8/mem_wr32 = accès volatile aux VA ci-dessus ;
   edx_at_485F27 = valeur matérielle d'EDX à cet instant. */
```

## 6. Preuves / ce qui est établi

- Séquence, adresses imm32, déplacements `rel32` -> 47E3F0 et 47E220, branchement 485F25 -> 485F53 :
  recalculés depuis `bytes-001.txt`.
- Le résultat de l'appel 1 est ignoré (EAX écrasé en 485F1B) ; la lecture du DWORD en 485F1B
  est postérieure à l'appel.
- Le DWORD 0x01D28DDC n'est remis à zéro qu'après l'appel 2, et seulement sur le chemin non nul
  (sur le chemin nul il vaut déjà 0 et n'est pas réécrit).
- Le compactage commun affirme l'absence de zéro-extension EDX complète : MOVZX DX (préfixe `66`) confirmé
  par les octets `66 0F B6 15`.
- Les 11 sites d'appel entrants figurent dans le gel (metadata.json `xrefs_to`) :
  4833DB, 483445, 483F9A, 484017, 4840B4, 48414E, 4841FC, 484270, 4881EF, 489FE1, 48A069.

## 7. Incertitudes (non « réparées »)

1. **EDX haut** (bits 31:16) à 485F27 : valeur laissée par `F_47E3F0` (et ses callees) ; non connue dans le gel.
   `b2` en dépend si EDX[31:16] ≠ 0. Le C expose cette dépendance via `edx_at_485F27` ; ne pas la remplacer par 0
   sans preuve d'un contrat de callee.
2. **Valeur de retour** : EAX final = 0 (chemin nul) ou retour brut de `F_47E220`. Les appelants peuvent ou non
   s'en servir ; ce n'est pas établi ici.
3. **Types des arguments des callees** : seules les largeurs poussées (DWORD) sont prouvées. Ni sémantique ni
   signe attendu des callees ne sont déduits ; les commentaires IDA (« GARDER les largeurs ... ») ne sont pas des
   preuves et ne contredisent rien d'observé (3 DWORD en pile pour `47E3F0`).
4. **Pas d'extension de signe sur `push imm8`** n'a d'effet observable ici (valeurs positives 0x68, 0x56, 3).
5. Taille de l'enregistrement pointé (stride 20) : provient uniquement du calcul LEA ; l'étendue lue/écrite par
   les callees n'est pas établie dans ce gel. Les prétentions historiques (queue, relay, 20 octets) sont
   « non validées ici ».
6. Hash : ceux de la section 1 sont repris du `manifest.json` ; je n'ai pas recalculé les hash des fichiers.

## 8. Validations non exécutées (demandes, pas des PASS)

- Compilation du C : non exécutée.
- Comparaison octet-niveau / test différentiel avec le natif : non exécutée.
- Détermination du contrat EDX/EAX des callees `47E3F0`/`47E220` : nécessite leurs paquets (absents).
- Aucun test, live, IDB, git ou commit effectué par moi pour ce livrable.
