# C B — g10 / 0x485F00 (FF8_EN.exe, x86-32, cdecl)

Auteur : pool-40 (C B, session fresh, modèle assigné `openai/gpt-6.1-sol` high).
Entrées lues (uniquement) : `inputs/ff8-decomp-semantics-20261011-r01/g10/0x485F00.readable/{asm-001.txt,bytes-001.txt,metadata.json,manifest.json}` et `inputs/.../g10/common-compaction.md` (contexte commun, non utilisé comme preuve d'intention).

Hashes cités (manifest.json, **non recalculés par moi**) :
- original_sha256 `747d202f109234c40a3cfa42723ef64c709fc02120dc937e0f00a381432c893b`
- compaction_sha256 `2ccc15a8b4611fa627c6b30b697010479c2c9b96cc69923fba089cfc278d7a01`
- asm-001.txt `da0f879d03af2790007996566acc6969bd0dd24d75476028dee6e045d11b3f94`
- bytes-001.txt `137993385f5a98f8941d5224b6e648adf92cd6c1004cbe5cb51aa69b6cd8caa6`
- metadata.json `fb14dc3bdec690e1a467685fba4a10261acca55d3ee95aa11d2558fe8d5f20eb`
- input exe SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`

Couverture : 22/22 instructions, [0x485F00, 0x485F54), 3 blocs CFG (485F00→{485F27,485F53}, 485F27→485F53, 485F53 ret). Les noms/commentaires IDA (`BattleEvent_*`, `payload_index`, `SG_BATTLE_MESSAGE_SPEED_SETTING`, etc.) sont des labels, pas des preuves de sens ; les commentaires de l'ASM ("GARDER les largeurs du prototype…") ne sont pas utilisés.

## 1. Vérification octet par octet

Octets (bytes-001.txt) découpés et décodés à la main :

| VA | octets | décodage |
|---|---|---|
| 485F00 | 8B 44 24 04 | `mov eax,[esp+4]` (arg0 DWORD, aucun frame/prologue) |
| 485F04 | 8D 04 80 | `lea eax,[eax+eax*4]` (×5, 32 bits, wrap mod 2^32) |
| 485F07 | 8D 0C 85 C4 80 D2 01 | `lea ecx,[eax*4+0x01D280C4]` (SIB scale 4, sans base) |
| 485F0E | 51 | `push ecx` |
| 485F0F | 68 80 00 00 00 | `push 0x80` |
| 485F14 | 6A 68 | `push 0x68` (imm8 sign-extended = 0x00000068) |
| 485F16 | E8 D5 84 FF FF | `call rel32=-0x7B2B` → 485F1B−7B2B = **0x0047E3F0** (= code_targets[1]) |
| 485F1B | A1 DC 8D D2 01 | `mov eax,[0x01D28DDC]` (DWORD) |
| 485F20 | 83 C4 0C | `add esp,0x0C` (nettoyage caller de 3 DWORD) |
| 485F23 | 85 C0 | `test eax,eax` |
| 485F25 | 74 2C | `jz +0x2C` → 485F27+2C = **0x485F53** |
| 485F27 | 66 0F B6 15 39 E7 CF 01 | `movzx dx, byte [0x01CFE739]` (**DX seulement**, EDX[31:16] préservé) |
| 485F2F | 6A 56 | `push 0x56` |
| 485F31 | 68 80 00 00 00 | `push 0x80` |
| 485F36 | 8D 0C D5 08 00 00 00 | `lea ecx,[edx*8+8]` (**EDX 32 bits complet**, SIB scale 8) |
| 485F3D | 6A 03 | `push 3` |
| 485F3F | 51 | `push ecx` |
| 485F40 | 50 | `push eax` |
| 485F41 | E8 DA 82 FF FF | `call rel32=-0x7D26` → 485F46−7D26 = **0x0047E220** (= code_targets[0]) |
| 485F46 | 83 C4 14 | `add esp,0x14` (5 DWORD) |
| 485F49 | C7 05 DC 8D D2 01 00 00 00 00 | `mov dword [0x01D28DDC],0` |
| 485F53 | C3 | `retn` (nu, pas de `ret n`) |

## 2. Faits d'ABI / pile

- Convention : cdecl. L'unique argument d'entrée est le DWORD à `[esp+4]` ; la fonction ne touche ni EBX/ESI/EDI/EBP, ne crée aucun local ni frame, ne sauve rien. Registres modifiés : EAX, ECX, EDX (+ flags). Retour `retn` sans pop.
- Appel 1 (0x47E3F0), pile à l'entrée du callee, de [esp+4] à [esp+12] : `0x68`, `0x80`, `ptr` où `ptr = 0x01D280C4 + 20*idx` (mod 2^32). Trois DWORD, nettoyage caller 0x0C.
- Appel 2 (0x47E220), pile de [esp+4] à [esp+20] : `msg` (EAX), `ecx`, `3`, `0x80`, `0x56`. Cinq DWORD, nettoyage caller 0x14. `ecx` est calculé **après** les push 0x56/0x80 mais avant les push 3/ecx/eax ; ce n'est pas observable en C (aucun effet de bord entre les deux).
- Largeurs : `idx` traité comme DWORD 32 bits ; le `lea` n'a ni extension de signe ni contrôle de borne, donc signedness non observable (arithmétique modulo 2^32, pas de comparaison). `[0x1D28DDC]` lu/écrit en DWORD, testé `!= 0` (pas de signe). `[0x1CFE739]` lu en octet non signé (MOVZX).
- Valeur de retour : non définie par ce code. Chemin `jz` : EAX = 0 (valeur de `[1D28DDC]`). Chemin message : EAX = retour de 0x47E220 inchangé (non connu : le callee n'est pas dans le gel). Les appelants pouvant lire EAX est **non prouvé** par ce paquet ; type `void` en C avec réserve.

## 3. Point critique : EDX partiel

`movzx dx, byte[...]` écrit uniquement DX. EDX[31:16] est donc la valeur résiduelle de EDX au retour de l'appel 1 (0x47E3F0 puis, en cascade, 0x500DF0 — EDX est caller-saved, aucune garantie dans le gel). Puis `lea ecx,[edx*8+8]` lit **EDX complet**.

Argument 2 de l'appel 2 :

```
a2 = (uint32_t)(8u + 8u * (((uint32_t)edx_hi16 << 16) | speed_byte))   // mod 2^32
   = 8 + 8*speed_byte + ((uint32_t)edx_hi16 << 19)
```

où `edx_hi16 = EDX_résiduel >> 16`. Si EDX_résiduel[31:16] ≠ 0, la valeur diffère de `8*speed+8`. Ce paquet ne permet pas de prouver `edx_hi16 == 0` ; je ne le « corrige » pas. Ci-dessous : une version fidèle avec `edx_hi16` explicite (modèle de la lecture ASM) et la forme d'usage avec l'hypothèse `edx_hi16 == 0` isolée dans une macro.

## 4. C complet (cible x86-32, MSVC/cdecl ; adresses = VA absolues de l'ASM)

```c
#include <stdint.h>

/* Hypothèse de compilation : build 32 bits, pointeurs = 32 bits, cdecl. */

#define FF8_VA_SLOT20_BASE    0x01D280C4u  /* base du tableau à stride 20 (0x14) utilisé par lea */
#define FF8_VA_MSG_PTR        0x01D28DDCu  /* DWORD lu/écrit en 485F1B / 485F49 */
#define FF8_VA_MSG_SPEED_BYTE 0x01CFE739u  /* octet lu (movzx) en 485F27 */

/* Callees : seuls la VA, le nombre de DWORD et l'ordre des arguments sont prouvés.
   Les noms sont des labels IDA (non preuves de sémantique). Retours inconnus. */

/* 0x0047E3F0 : 3 DWORD, ordre pile [esp+4],[esp+8],[esp+12] = (0x68, 0x80, ptr).
   Son retour n'est pas lu (EAX réécrit en 485F1B). */
typedef void (__cdecl *fn_47E3F0_t)(uint32_t a1, uint32_t a2, uint32_t a3);

/* 0x0047E220 : 5 DWORD, pile [esp+4..+20] = (msg, ecx, 3, 0x80, 0x56).
   Son retour n'est pas lu mais devient le EAX de sortie de 0x485F00. */
typedef uint32_t (__cdecl *fn_47E220_t)(uint32_t a1, uint32_t a2, uint32_t a3,
                                        uint32_t a4, uint32_t a5);

#define CALL_47E3F0 ((fn_47E3F0_t)(uintptr_t)0x0047E3F0u)
#define CALL_47E220 ((fn_47E220_t)(uintptr_t)0x0047E220u)

#define G_MSG_PTR        (*(volatile uint32_t *)(uintptr_t)FF8_VA_MSG_PTR)
#define G_MSG_SPEED_BYTE (*(volatile const uint8_t *)(uintptr_t)FF8_VA_MSG_SPEED_BYTE)

/* --------------------------------------------------------------------------
   Version fidèle à l'ASM : EDX[31:16] résiduel est un paramètre explicite.
   (Non appelable telle quelle depuis du code natif : elle sert de modèle
   exact de l'argument 2.)
   -------------------------------------------------------------------------- */
static inline uint32_t ff8_485F00_arg2(uint8_t speed_byte, uint16_t edx_hi16)
{
    /* movzx dx, byte  : EDX = (edx_hi16 << 16) | speed_byte
       lea ecx,[edx*8+8] : 32-bit wrap */
    uint32_t edx = ((uint32_t)edx_hi16 << 16) | (uint32_t)speed_byte;
    return (uint32_t)(edx * 8u + 8u);
}

/* --------------------------------------------------------------------------
   Fonction : 0x00485F00 — cdecl, 1 arg DWORD, retour non défini par le code
   (voir §2). `idx` : arithmétique mod 2^32, pas de borne, pas de signe observé.
   EDX_RESIDUAL_HI16() : hypothèse isolée — voir §3. Par défaut 0 (NON PROUVÉ).
   -------------------------------------------------------------------------- */
#ifndef EDX_RESIDUAL_HI16
#define EDX_RESIDUAL_HI16() ((uint16_t)0u) /* ASSUMPTION: remplacer par la vraie valeur si le callee la fixe */
#endif

void __cdecl sub_485F00(uint32_t idx)
{
    uint32_t slot_addr;
    uint32_t msg;

    /* 485F00..485F07 : ptr = 0x1D280C4 + 4*(idx + idx*4) = base + 20*idx (mod 2^32) */
    slot_addr = (uint32_t)(FF8_VA_SLOT20_BASE + (uint32_t)(idx * 5u) * 4u);

    /* 485F0E..485F1B : push ptr; push 0x80; push 0x68; call 47E3F0; add esp,0xC.
       Argument de pile #1 = 0x68, #2 = 0x80, #3 = slot_addr. */
    CALL_47E3F0(0x68u, 0x80u, slot_addr);

    /* 485F1B : mov eax,[1D28DDC] — lu APRÈS l'appel (le callee peut le modifier). */
    msg = G_MSG_PTR;

    /* 485F23..485F25 : test eax,eax ; jz 485F53 */
    if (msg == 0u) {
        return; /* EAX = 0 à la sortie */
    }

    /* 485F27 : movzx dx, byte[1CFE739] (octet lu après le test et après l'appel 1).
       485F36 : lea ecx,[edx*8+8] (EDX complet). */
    {
        uint32_t a2 = ff8_485F00_arg2(G_MSG_SPEED_BYTE, EDX_RESIDUAL_HI16());

        /* 485F2F..485F46 : push 0x56; push 0x80; lea; push 3; push ecx; push eax;
           call 47E220; add esp,0x14.
           Pile (de [esp+4] à [esp+20]) : msg, a2, 3, 0x80, 0x56. */
        (void)CALL_47E220(msg, a2, 3u, 0x80u, 0x56u);
    }

    /* 485F49 : mov dword[1D28DDC],0 — écrit après le retour de 47E220. */
    G_MSG_PTR = 0u;

    /* 485F53 : retn. EAX = retour de 47E220 (inchangé). */
}
```

## 5. Chemins et ordre des effets

1. `call 47E3F0(0x68, 0x80, 0x1D280C4 + 20*idx)` — toujours.
2. Lecture DWORD `[0x1D28DDC]` après l'appel.
3. Si 0 → retour (aucune lecture de l'octet 0x1CFE739, pas d'appel 2, pas d'écriture).
4. Sinon : lecture octet `[0x1CFE739]`, `call 47E220(msg, 8+8*EDX32, 3, 0x80, 0x56)`, puis `[0x1D28DDC] = 0`, retour.

Une seule lecture et une seule écriture de `[0x1D28DDC]` en dehors de l'appel ; le pointeur lu est celui passé tel quel (32 bits) en premier argument de 47E220.

## 6. Incertitudes / validations non exécutées

1. **EDX[31:16]** (voir §3) : non résolu par le gel ; dépend de 0x47E3F0→0x500DF0 (non fournis). La macro `EDX_RESIDUAL_HI16()` est une hypothèse (0), pas une preuve. À valider par ASM de 47E3F0/500DF0 ou trace live (demande, pas PASS).
2. **EAX de sortie** : retour de 0x47E220 (inconnu) ou 0 ; l'usage par les 11 appelants (xrefs dans metadata.json) n'est pas vérifié ici. Type `void` retenu avec cette réserve ; si un appelant lit EAX, il faudra `uint32_t` et le retour propagé.
3. Prototypes de 0x47E3F0 et 0x47E220 : seules les largeurs DWORD et la pile sont observées dans cette fonction ; pas de types de pointeurs ni de signedness prouvés pour les callees. `ptr` est un entier 32 bits.
4. Aucune compilation ni comparaison binaire/ASM réalisée par moi : à faire par le lead ou un rôle séparé (build x86-32 cdecl, comparer le désassemblage : notamment `movzx dx` et `lea [edx*8+8]` sont des détails de génération de code que le C ne force pas — un compilateur émettra probablement `movzx edx, byte` si `edx_hi16` est constant 0 ; l'égalité d'octets n'est donc pas garantie, seule l'égalité sémantique sous l'hypothèse 1).
5. Je n'ai pas recalculé les SHA des fichiers d'entrée ; les valeurs ci-dessus viennent du manifest.
6. Pas de lecture d'autres volets (A, sémantique, R), de transcripts, de C antérieur de la cible, ni de l'IDB. Hors rôle : j'ai uniquement listé le répertoire `inputs/.../g10` et lu `0x485F00.readable` + `common-compaction.md`.
