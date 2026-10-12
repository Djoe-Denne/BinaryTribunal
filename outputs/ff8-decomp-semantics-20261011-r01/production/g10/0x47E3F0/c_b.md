# C B — g10 / 0x47E3F0 (2+1, volet B, auteur C indépendant)

Modèle : openai/gpt-6.1-sol high (imposé par le lead). Tâche : task_mv44rtps_009g_caeg57.
Lecture limitée à : `inputs/ff8-decomp-semantics-20261011-r01/g10/0x47E3F0.json`,
`0x47E3F0.readable/{asm-001.txt,bytes-001.txt,manifest.json,metadata.json}`,
`common-compaction.md`. Aucun voisin, aucun C antérieur, aucun IDB, aucun live.

## 1. Entrées citées (SHA256 recalculés = ceux du manifeste)

| Fichier | SHA256 |
|---|---|
| `0x47E3F0.json` (original_sha256) | `79e9a6e4379f45417ab7ae5c7e7f643e5f9e390f2b81e80527f0726966a31e64` |
| `asm-001.txt` | `b4ba44336300e027527f6baf746df080bca647be1a00fbbcc4c8730647986e51` |
| `bytes-001.txt` | `db0dfd9e3eeee4237da099b4bb7002abc72b2e3eba06624d36d790085dabf7ca` |
| `metadata.json` | `3703bd744b85621aecfce93343bd2d22263cb426e470bdb4c7fc4dc47302d5dd` |
| `common-compaction.md` | `2ccc15a8b4611fa627c6b30b697010479c2c9b96cc69923fba089cfc278d7a01` |

Binaire : FF8_EN.exe 32 bits, SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`
(déclaré par l'export, non authentifié indépendamment ici). Chunk unique `[0x47E3F0, 0x47E408)`, 24 octets, 9 instructions, 1 bloc CFG sans successeur.

## 2. Décodage des octets (vérifié contre l'ASM)

```
8b 44 24 0c        47E3F0  mov eax, [esp+0Ch]
8b 4c 24 08        47E3F4  mov ecx, [esp+08h]
8b 54 24 04        47E3F8  mov edx, [esp+04h]
50                 47E3FC  push eax
51                 47E3FD  push ecx
52                 47E3FE  push edx
e8 ec 29 08 00     47E3FF  call 0x500DF0     ; rel32 = +0x000829EC, fin d'instr. 0x47E404 -> 0x500DF0
83 c4 0c           47E404  add esp, 0Ch
c3                 47E407  retn
```

Contrôle du CALL : 0x47E404 + 0x000829EC = 0x500DF0, identique à `code_targets = ["0x500DF0"]`.

## 3. Sémantique machine

- Convention de l'appelé (cette fonction) : `retn` sans immédiat → **cdecl** (l'appelant nettoie). 3 arguments DWORD à `[esp+4]`, `[esp+8]`, `[esp+0Ch]` à l'entrée (a1, a2, a3).
- Aucun prologue/épilogue de frame (pas d'`ebp`, pas de locaux, pas de registre callee-saved touché). EAX/ECX/EDX sont écrasés (caller-saved, conformes à cdecl).
- Les trois lectures sont des **DWORD complets** (32 bits). Aucun movzx/movsx, aucun masque, aucun décalage, aucune arithmétique : signedness et wrap sans objet sur les valeurs transmises.
- Ordre de push : a3 (EAX) puis a2 (ECX) puis a1 (EDX). Le sommet de pile pour le callee est donc a1 : le callee voit `(a1, a2, a3)` dans le **même ordre** que l'entrée (aucune permutation).
- Le callee 0x500DF0 est appelé avec 3 DWORD ; le nettoyage `add esp, 0Ch` immédiat après le CALL prouve que le callee est cdecl (appelant nettoie 12 octets) du point de vue de cet appelant.
- Retour : EAX n'est pas modifié après le CALL (aucune instruction entre `call` et `retn` n'écrit EAX ; `add esp` ne touche que ESP/flags). La valeur de retour est donc **EAX du callee, transmise intacte (32 bits)**. ECX/EDX de retour non définis/non utilisés par cette fonction.
- Aucune lecture/écriture mémoire globale ; seules lectures de pile et appel unique.

## 4. C complet

Types retenus : DWORD opaques non signés pour les paramètres et la valeur de retour (la signedness et la sémantique des arguments ne sont pas prouvées par les octets ; le transfert est bit à bit sur 32 bits). Les prototypes issus de commentaires (`char*`, `int`, noms `p_*`, « enqueue », « node+8 », « id 107 ») sont des étiquettes, **non retenues comme preuves**.

```c
#include <stdint.h>

#if defined(_MSC_VER)
#  define FF8_CDECL __cdecl
#else
#  define FF8_CDECL __attribute__((cdecl))
#endif

/* Cible de l'unique CALL : VA 0x00500DF0.
 * Contrat prouvé par l'appelant seulement : 3 DWORD empilés, nettoyage 12 octets
 * par l'appelant (cdecl), résultat lu dans EAX (non modifié ensuite).
 * Rôle, signedness, nature pointeur/entier des arguments et du retour : NON établis. */
extern uint32_t FF8_CDECL sub_500DF0(uint32_t first,   /* sommet de pile = ex-[esp+04h] de l'appelant */
                                     uint32_t second,  /* ex-[esp+08h] */
                                     uint32_t third);  /* ex-[esp+0Ch] */

/* VA 0x0047E3F0 — 24 octets [0x47E3F0, 0x47E408) — cdecl, 3 DWORD, retour EAX.
 *
 *   mov eax,[esp+0Ch] ; mov ecx,[esp+08h] ; mov edx,[esp+04h]
 *   push eax ; push ecx ; push edx          ; callee(a1, a2, a3)
 *   call 0x500DF0 ; add esp,0Ch ; retn       ; EAX du callee inchangé
 */
uint32_t FF8_CDECL sub_47E3F0(uint32_t a1,   /* [esp+04h] */
                              uint32_t a2,   /* [esp+08h] */
                              uint32_t a3)   /* [esp+0Ch] */
{
    return sub_500DF0(a1, a2, a3);   /* même ordre ; retour 32 bits intact */
}
```

Remarque de compilation : en MSVC x86 32 bits, cette forme devrait produire un `jmp`/`call` selon l'optimisation (tail-call possible à `/O2`). Le binaire gelé fait un `call` + `add esp,0Ch` + `retn` ; l'équivalence **comportementale** est exacte, la forme d'instruction exacte dépend du compilateur (non compilé ici).

Si une cible est un pointeur 32 bits dans le rewrite, `uint32_t` reste bit-exact en x86-32 ; en build 64 bits il faudrait utiliser un thunk/ABI explicite — hors périmètre (le gel est 32 bits).

## 5. Couverture

- 9/9 instructions couvertes, 24/24 octets, 1/1 bloc CFG, 1/1 CALL (cible 0x500DF0 recalculée depuis rel32), 1/1 retn.
- 28 sites d'appel entrants listés dans `xrefs_to` (tous type 17, `iscode:true`) : 4847F0 ×5, 485610, 485F00, 4862A0 ×2, 486390, 4863F0, 486450, 486500 ×3, 487DF0 ×10, 48E620, 4971F0 ×2. Comptage recalculé = 28. Non utilisés pour inférer des types (aucun callsite gelé fourni).

## 6. Incertitudes / points à ne pas « réparer »

1. Nature et largeur effective réelles des 3 arguments et du retour de 0x500DF0 : non prouvées. Seul le fait « 3 DWORD en pile, cdecl, EAX 32 bits » est établi par les octets.
2. Les prototypes des commentaires de l'ASM (`char*`, `int`, « atk_count », « mask », « spell16 », « G14 enqueue », « node+8 », « id 107 », nom `ActivateTargetRelay`) sont des étiquettes/commentaires, **pas** une preuve ; contradictoires entre eux (`p_pointer_info_section`, `p_bitmask`, `p_some_id` ≠ « status/atk_count/mask/targets/spell16 »). Non utilisés.
3. Le corps de 0x500DF0 n'est pas dans le gel ; son contrat n'est pas inventé.
4. Si l'appelé 0x500DF0 renvoie un type plus étroit dans EAX (AL/AX), les bits hauts de EAX seraient quand même transmis tels quels par ce wrapper ; `uint32_t` les préserve.
5. Aucun registre callee-saved (EBX/ESI/EDI/EBP) touché ; la fonction ne fait rien d'autre qu'un forwarding.

## 7. Validations non exécutées (demandes, pas des PASS)

- Compilation (MSVC x86 / clang `-m32`) et comparaison d'ASM : **non exécutées**.
- Aucune vérification live, aucun IDB, aucune lecture du binaire courant : **non exécutées**.
- Demande au lead (optionnelle) : fournir le gel de 0x500DF0 si un typage plus précis que `uint32_t` est requis pour le callee.
