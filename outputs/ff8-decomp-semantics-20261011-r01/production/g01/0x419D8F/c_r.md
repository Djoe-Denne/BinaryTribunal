# 0x419D8F — C R (réconciliation indépendante de C_A et C_B, contre l'ASM natif gelé)

Mission `ff8-decomp-semantics-20261011-r01`, groupe g01, cible unique `0x419D8F`.
Rôle R (pool-2), créé après réception de A et B. Aucune écriture protégée, aucun git/IDB/live,
aucune compilation exécutée (limite assumée, voir §6). Le contrôle §5.6 final reste au lead.

## 1. Entrées, hashes, cohérence (recalculés par R)

| Entrée | SHA256 (recalculé) | Cohérence |
|---|---|---|
| `g01/0x419D8F.json` (paquet gelé) | `bf1ee669cd27c5fdeba32939d67727ddcef4bbb63153d0703d2e8de20d6d326a` | = `original_sha256` du manifest et cité par A et B |
| `g01/common-compaction.md` | `b1085a3007d76c5a2d8ca488b7247262aa52f66061b8d1aa1ead0ba16c9e41e3` | = `compaction_sha256` cité par A et B |
| `0x419D8F.readable/asm-001.txt` / `asm-002.txt` / `bytes-001.txt` / `metadata.json` | `198df8e3…693efa` / `6f9c4637…bb03` / `13fa7444…14070` / `0ee19066…af1` | = manifest (B les cite à l'identique) |
| `c_a.md` (C_A) lu par R | `6C4826C2D70E906DC1F39B9F59BBFE54CF93BCF58C4710A48413EC862BE420EA` | à comparer par le lead au hash gelé |
| `c_b.md` (C_B rev2) lu par R | `147DB34D9180BF6E61FDBA60788D3CCB081F061BF849A43DB2CDAE541BEEA59B` | idem |

Vérifications natives faites par R (indépendantes de A/B) :
- `bytes-001.txt` concaténé = `chunks[0].hex` du paquet, 90 octets, un seul chunk `[0x419D8F,0x419DE9)`.
- Redésassemblage des 90 octets (x86-32) : 34 instructions, adresses et mnémoniques **identiques** à
  `assembly` du paquet (aucune corruption ASM détectée, contrairement à l'avertissement historique générique).
- Cibles de branche : `74 40` en `419DA0` → `419DA2+0x40 = 419DE2` ; `74 3A` en `419DA6` → `419DA8+0x3A = 419DE2`.
- Cibles d'appel : `E8 4B F6 FF FF` en `419DC0` → `419DC5-0x9B5 = 0x419410` ; `E8 E2 FE FF FF` en `419DD7` → `419DDC-0x11E = 0x419CBE`.
  Égaux à `code_targets` ; CFG 4 blocs identique ; xrefs d'entrée `0x407797` (fn `0x4076B6`) et `0x414AD1` (fn `0x414A40`).
- Preuves complémentaires non retenues comme preuves de la cible : étiquettes IDB, commentaire « cache resolve +0x18 refcount… »,
  type historique `int __cdecl(int*,int,int)`, ASM des appelants (captures historiques, hors export courant).

Isolation : R n'a lu que les entrées gelées de g01/0x419D8F et C_A/C_B. Les `semantic_*.md` du même répertoire n'ont pas été lus
(hors périmètre de cette tâche C). Constat de procédure : le worktree `…#vbge32-pool-2` ne contenait ni `inputs/` ni `outputs/` ;
les fichiers ont été lus dans le workspace principal (même chemins relatifs) et ce livrable y est écrit.

## 2. Convergences A = B (toutes revérifiées contre l'ASM)

1. Prologue EBP, `sub esp,8` ; arguments `[ebp+8]`, `[ebp+0xC]`, `[ebp+0x10]` ; locaux `[ebp-8]` (init 0) et `[ebp-4]` (premier retour).
2. Gardes dans l'ordre : arg2 puis arg3, `cmp dword,0 / jz` vers l'épilogue commun `419DE2` ; comparaison d'égalité 32 bits exacte
   (pas de branchement signé). arg1 jamais testé.
3. Copie unique DWORD `[arg1+0x64]` → `[arg2+0x2C]` (`8B 51 64` / `89 50 2C`), chargement avant écriture, avant tout appel.
4. Appel 1 `0x419410(arg1,arg2,arg3)` : pushes arg3, arg2, arg1 ; `add esp,0Ch` ; EAX complet stocké.
5. Appel 2 `0x419CBE(arg1,arg2,r1)` : r1 passé sans test (même nul) ; `add esp,0Ch` ; EAX complet stocké.
6. Retour : `mov eax,[ebp-8]` ; `RET` simple (cdecl caller-cleanup) ; chemin de garde → EAX = 0.
7. Aucun global, aucun appel indirect, aucun x87/SSE, pas d'AL/AX, pas de décalage/multiplication.
8. Aucun sens métier (texture/cache/refcount) promu : labels = annotations.

Les corps C de A et de B sont **sémantiquement équivalents** et bit-fidèles à l'ASM ; je ne trouve pas de divergence de comportement.

## 3. Matrice des divergences (présentation uniquement) et arbitrage

| # | Point | C_A | C_B | Décision R (par l'ASM / ABI) |
|---|---|---|---|---|
| D1 | Types des paramètres | trois `uint32_t` bruts, accès via macro `uintptr_t` | `void *desc`, `void *tex`, `int32_t upload_key` | arg1 et arg2 sont déréférencés (`[ecx+0x64]`, `[eax+0x2C]`) → traités comme adresses plates 32 bits ; arg3 n'est que testé `==0` et transmis → mot opaque 32 bits. ABI identique (3 DWORD pile). Signedness sans effet (seuls `==0` et passage). **Retenu : pointeurs pour arg1/arg2, `uint32_t` opaque pour arg3 et retours.** Le type pointeur vs entier de arg3 reste UNCERTAIN (non prouvable ici). |
| D2 | Type de retour | `uint32_t` | `int32_t` | Même EAX 32 bits, non interprété ; callers historiques le testent à 0, sans plus. **`uint32_t` opaque.** Signedness du retour : UNCERTAIN (sans effet sur le code natif). |
| D3 | Accès mémoire | `volatile` + struct `packed, may_alias` | cast `uint32_t *` simple | Rien dans l'ASM n'impose `volatile` (un seul load/un seul store, appels externes opaques bornent déjà tout réordonnancement). L'alignement n'est pas prouvé : **struct `packed/may_alias` sous GCC/Clang, accès simple sous MSVC**, sans `volatile` (qui ne reflète aucun fait natif). |
| D4 | Convention d'appel | `__attribute__((cdecl))`, `#error` hors GCC i386 | `__cdecl` MSVC | Équivalent. Je fournis une macro `RE_CDECL` couvrant les deux ; rien dans le natif n'exige l'un des compilateurs. |
| D5 | Noms | `sub_00419D8F`, noms neutres | `sub_419D8F`, noms de paramètres `desc/tex/upload_key` (IDB) | Noms de paramètres = labels IDB, non prouvés. **`arg1..arg3`** dans le contrat (alias de label notés en commentaire seulement). |
| D6 | Forme du contrôle | `goto exit` | `if (tex != 0 && upload_key != 0)` | Équivalent (deux `jz` vers le même bloc). Forme structurée retenue ; ordre arg2 puis arg3 conservé. |
| D7 | Avertissement MSVC `/Od` (B) | n/a | mentionné comme pré-requis probable pour reproduire `[ebp-4]` | Recommandation de reproduction binaire, pas un fait sémantique ; aucune preuve exécutée. Conservé comme demande de vérif. au lead. |

Erreurs communes recherchées (accord A=B non suffisant) : largeur des tests (DWORD, pas octet), offsets `+0x64`/`+0x2C` en disp8 non signé
(0x64 et 0x2C < 0x80 : pas d'extension de signe en jeu), sens src/dst (ECX=arg1 source, EAX=arg2 destination),
ordre des pushes, troisième argument du second appel (= retour du premier, pas arg3), adresses d'appel recalculées, plain RET.
**Aucune erreur commune trouvée.** Notes vérifiées : l'affirmation de B « no hash recomputed » est levée par ce contrôle ; la mention de A
« packet SHA non recalculé » aussi.

## 4. C final réconcilié

```c
#include <stdint.h>

/* 32-bit x86 flat model only. */
#if defined(_MSC_VER)
# define RE_CDECL __cdecl
# define RE_DWORD_AT(p) (*(uint32_t *)(p))
#elif defined(__i386__) && (defined(__GNUC__) || defined(__clang__))
# define RE_CDECL __attribute__((cdecl))
  /* Unaligned/alias-permitting DWORD access; no object layout is claimed. */
  typedef struct __attribute__((packed, may_alias)) re_dword { uint32_t v; } re_dword;
# define RE_DWORD_AT(p) (((re_dword *)(p))->v)
#else
# error "32-bit x86 (MSVC or GCC/Clang -m32) required"
#endif

/* Callees are only known from this wrapper's call sites: 3 DWORD stack args, caller cleanup
 * (add esp,0Ch), result in full EAX. Bodies/semantics are outside this target.
 * IDB labels (annotation only, NOT proof): 0x419410 = Texture_FindTexture,
 *                                         0x419CBE = Texture_UploadRefcountOrReuse. */
extern uint32_t RE_CDECL sub_419410(void *arg1, void *arg2, uint32_t arg3);
extern uint32_t RE_CDECL sub_419CBE(void *arg1, void *arg2, uint32_t arg3);

/* 0x419D8F, IDB label "TextureRelated2" (label only).
 * arg1 = [ebp+8] (IDB label "desc"), arg2 = [ebp+0Ch] ("tex"), arg3 = [ebp+10h] ("upload_key"). */
uint32_t RE_CDECL sub_419D8F(void *arg1, void *arg2, uint32_t arg3)
{
    uint32_t result = 0;                                   /* 419D95  [ebp-8] = 0 */

    if (arg2 != 0 && arg3 != 0) {                          /* 419D9C/A0, 419DA2/A6: both jz -> 419DE2 */
        uint32_t first;                                    /* [ebp-4] */

        /* 419DA8..419DB1: one DWORD load then one DWORD store, before any call.
         * arg1 is never null-tested (dereferenced unconditionally on this path). */
        RE_DWORD_AT((uint8_t *)arg2 + 0x2C) = RE_DWORD_AT((uint8_t *)arg1 + 0x64);

        first  = sub_419410(arg1, arg2, arg3);             /* 419DB4..419DC8 */
        result = sub_419CBE(arg1, arg2, first);            /* 419DCB..419DDF: first passed unconditionally, even 0 */
    }
    return result;                                         /* 419DE2..419DE8: full EAX, plain RET */
}

#undef RE_DWORD_AT
#undef RE_CDECL
```

## 5. Contrat structurel final (CERTAIN = prouvé par les 90 octets/ASM gelés)

- CERTAIN : si `arg2 == 0` ou `arg3 == 0` (tests DWORD exacts, arg2 puis arg3) → retourne 0 sans accès mémoire ni appel.
- CERTAIN : sinon `[arg2+0x2C] = [arg1+0x64]` (DWORD, lecture avant écriture, chevauchement possible géré par registre EDX), puis
  `r1 = sub_419410(arg1,arg2,arg3)` ; retourne `sub_419CBE(arg1,arg2,r1)` ; aucun test de `r1`.
- CERTAIN : cdecl, 3 arguments DWORD, `RET` simple, seul EBP sauvegardé, EAX/ECX/EDX clobbered, retour EAX 32 bits.
- CERTAIN : aucun global, aucun appel indirect dans le wrapper ; 34/34 instructions, 90/90 octets, 4/4 blocs CFG couverts.
- UNCERTAIN : types exacts de arg3 et du retour (pointeur vs entier, signé vs non signé) ; taille/durée de vie/signification des champs `+0x64`/`+0x2C`.
- UNCERTAIN : toute sémantique texture/cache/refcount/upload (annotations IDB, corps de `0x419CBE` absent du corpus ; `0x419410` connu
  seulement par validation historique datée, et déjà signalé comme sélection de payload plutôt que cache prouvé). **Ne pas promouvoir.**
- Nom neutre proposé (structurel, confiance haute sur la forme, nulle sur le métier) : `CopyField64To2C_ThenChainTwoCalls` (nom IDB `TextureRelated2` = label seulement).

## 6. Limites

- Aucune compilation ni byte-diff exécuté par R. À demander au lead : compiler avec MSVC 32 bits (`/Od` pour reproduire l'aller-retour `[ebp-4]`) et/ou
  GCC `-m32 -O0`, comparer au chunk de 90 octets ; vérifier que le store est un `mov [eax+2Ch],edx` DWORD et que les appels gardent l'ordre de pile.
  Un écart de génération de code (registres, frame) n'invalide pas l'équivalence sémantique ci-dessus.
- Callee ABI côté appelé non reprouvée (corps de `0x419CBE` absent ; `0x419410` historique) : le wrapper est bit-fidèle quel que soit le
  comportement des callees, car il lit EAX complet.
- Aucune promotion, aucune clôture de campagne, aucun verdict §5.6 (réservé au lead).
