# Gfx_CreateDrawList @ 0x416D82

- Statut parent communiqué : **§5.6 live effectué ; tag IDB du jour présent, `SKIP_EXISTING_TAG`, `save_database=true` vérifié**. Aucun nouveau PUSH ni correction de commentaires IDB ici ; écart docs/IDB connu, conservé.
- Instr (live): 429
- Palier / Mode: **A historique + B strict frais (`semantic_b_blind_sol.md`) + R final Sol post-B** ; pas de diversité de modèles revendiquée, R non aveugle.
- Qualification R: **LIKELY** — construction et nom confirmés ; arg0 opaque, préconditions et ownership ouverts. Zone effacée/utilisée 0xEC, pas taille littérale passée au pool.
- Push IDB : mention historique `[semantic-triple 2026-09-17]` distincte du tag du jour constaté par le parent ; `SKIP_EXISTING_TAG` et `save_database=true` selon son retour, sans écriture IDB par ce worker.
- Notes pour parent: cdecl cinq mots, EAX pointeur/NULL sur chemins contrôlés, défaut indéterminé ; original conservé, 17→12 ; `ja` unsigned, `setnle` signé ; slots owner stride 4, pool stride dynamique ; matrice 0x40 ; **27 sites / 16 callees directs**, **67 xrefs code dans 13 fonctions**. Aucun contrôle W/H zéro ni contrôle des retours CWD.

## Provenance historique (supplantée par l'erratum)

Le C ci-dessous est le **C historique corrigé**, pas une génération indépendante. La campagne antérieure se décrivait ainsi ; ses verdicts et gaps ne font plus autorité :

> Campaign gfx (2+1 A/B flash + R glm-5.3, parent §5.6 live): convergent CERTAIN. Divergences R tranchées: Gfx_InitTexturePageDrawLists=17 callers, Gfx_AllocTexturePageSlot=10; sub_4074F7=4 sites add esp,0Ch; sub_41E1AF=5 args add esp,14h (ordre exact non prouvé); setnle signé (4170ff) vs ja unsigned (416dde), aucun jb/jbe/jl/jle; retour EAX pointeur pleine largeur (type IDA float* faux); arg0 observé booléen 0/1 (tim_mode), libellé exact non prouvé; 67 xrefs code 0 DATA (parent live). Gaps R: noms champs internes, ordre args sub_41E1AF, sémantique fine byte_4173AB (00 00 01 01 02 02 03 03 00 00 01 01 02 02 03 03 06 06 04 05) / byte_4173C7 (00 00 00 00 01 01 01 01 00 00 00 00).

## Erratum comportemental antérieur — 2026-10-08

Les six corrections ci-dessous proviennent du R Sol antérieur au B strict (mtime UTC `2026-10-08T14:52:45.322Z`, SHA-256 `91114bd28c40ff02bccce4296caa03dda170291589cb119a5938d69f303dec1b`) et sont déjà appliquées. Le R final post-B à `tools/_tmp_semantic_triple/0x41730a/semantic_r_sol.md` les confirme sans nouvelle correction de flux C. Pré-erratum, SHA-256 historique cité par R : `1d94684d676c0d7ba2ffa5b5a505fea2864ae9620c4593135eeed02feb2fd1c7`. Le pack n'est pas modifié ici.

1. Retrait de `texture = NULL` : `[ebp-4]` non initialisé au défaut, lu par `0x41707F` (`83 7D FC 00`). Type 16/hors plage ne garantit pas NULL ; 17 suit 12. Aucun garde ajouté.
2. `bind_id` argument devient **arg0 opaque** : lecture `[ebp+8]` à `0x41724E`, copie contexte+4 à `0x417251`. La locale `[ebp-18h]=0` à `0x416DC7` reste distincte.
3. Branches ressource dépliées avec trois/cinq mots réellement poussés ; fichier via **0x4076B6**. **0x42F0F6 = CWD, pas CLUT** : premier mot ignoré, wrapper→0x42F015→sauvegarde/changement de répertoire (tampon 256 octets), restauration tentée, retours ignorés. Calls précoces dimensions avec list=NULL rétablis.
4. Calls machine rétablis : `memset_0(0xEC,list)` à deux mots ; identité locale puis `sub_417996(0,mat,list)` ; matrice auxiliaire facultative et thunk à quatre mots ; dimensions `sub_416CE9` puis **FILD DWORD signé / FDIVR 1.0 / FSTP float**, sans garde zéro. Ordre des cinq args `sub_41E1AF` prouvé par les pushes.
5. Diagnostic via **OutputDebugString_1 @0x403D99**, pas appel API direct systématique ; destructeur appelé même avec NULL. Retours précoces sans diagnostic ; aucune libération de ressource locale démontrée si échec pool.
6. `CERTAIN` global historique remplacé par **LIKELY** ; **27/16**, tables décodées et adresses exactes du troisième switch : sub `0x41729D`, cmp `0x4172A6`, ja `0x4172AD`. Aucun nouveau modèle, spawn ou gateway.

## Réconciliation A historique / B strict / R final post-B

- A historique : mtime UTC `2026-10-08T13:54:12.301Z`, SHA-256 `0e951fc6fa8e3b269dc193519d19f116bcaa852c299f228ce2c01dc706ee8910`.
- B strict : `tools/_tmp_semantic_triple/0x41730a/semantic_b_blind_sol.md`, mtime UTC `2026-10-08T15:57:14.258Z`, SHA-256 `44b542b92afd644d881c3e29b959df36fd9dad583ae58de758141f7669918740` ; seconde analyse de cette passe, **pas `semantic_b.md`**.
- R final post-B : `tools/_tmp_semantic_triple/0x41730a/semantic_r_sol.md`, mtime UTC `2026-10-08T16:07:14.985Z`, SHA-256 `490e711805f0a3a2a507f2b9a144f5e15eccb0997f3f0014df15abf4f518f41a` ; réconciliation après lecture de A, B strict et R précédent, non aveugle. Bytes live entiers : SHA-256 `bb73ce170346b6491bfe1cc4cf6c2cd159bb29cf6a6040551b6eb7cc6479ad13`.

1. B strict propose `CreateTypedBackendBatchFromDescriptor` ; R **maintient `Gfx_CreateDrawList`** : acquisition/initialisation et retour de l'objet (`0x41708F`, `0x417338`), puis callbacks consommés par un walker de nœuds (`0x417963/97B`, `0x417987/990`). Deux chaînes fonctionnelles, pas un vote ni la seule identité matricielle. Proposition B compatible comme description ; aucun rename catalogue/IDB.
2. A/B strict convergent sur les champs: `obj+0x0C = desc+0x2C`, `obj+0x1C = desc[+0x28] ? 0 : 1`, `obj+0x30 = owner`, `obj+0x34 = desc+0x18` sinon `owner[+0x6C][+0x348]`. B strict qualifie la structure d'élevée et le métier de moyen, **pas CONFLICT** ; R reste LIKELY.
3. Le type **original** sauvegardé à `0x416D9C` est stocké à `obj+0x00` à `0x4170EB`, tandis que les switchs et la table backend utilisent le type normalisé 17→12. Le binder relit l'original à `0x4162ED` ; table `0x41669F`, entrées **12 et 17→0x4163AA** : asymétrie d'index, **pas callback différent ni bug nécessaire**.
4. Les appels précoces à `sub_416CE9(..., obj)` surviennent avant l'allocation, avec `obj==NULL`; retour 0 du callee, donc aucune écriture NULL. Le passage post-allocation à `0x4172CF` fixe `obj+0x28/+0x2C` pour les types 4–7 et 12–15 ; succès possible avec W=H=0 et tampon partiellement non écrit.
5. `Gfx_BindDrawListBackendCallbacks(desc[+0x34], obj)` est exécuté pour tout objet alloué, backend réussi ou non ; le troisième switch ne contrôle que les réciproques. Les six corrections comportementales restent acquises : seules les annotations sont actualisées.

## C réconcilié (structure fidèle)

Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays. Ici, bytes relus via `ida_bytes.get_bytes` en lecture seule ; pas de nouveau dump écrit. Plage **[0x416D82,0x41733F)**, taille **0x5BD**, frame **0x1A8**, seule sauvegarde explicite EBP (pas de push EBX/ESI/EDI). Type IDA live : `GfxDrawList236 *__cdecl(int mode, int list_type, void *desc, const char *tim_path, void *owner)` ; `mode` n'établit pas son rôle métier. Nettoyages site : ressource 0x0C/0x14, CWD 0x0C, effacement 8, identité 4, copie 0x0C, thunk 0x10, backend 0x14, dimensions/binder 8, pool/destruction/diagnostic 4.

Pseudo-C documenté, struct opaque : les champs nommés et `OWNER_BACKEND(owner)` restent des notations de lecture (`*(uint8_t **)((uint8_t *)owner+0x6C)`). **`texture`, `tim_path`, `has_vertices` sont des alias de pseudo-C, pas des types/contrats récupérés ; aucun format TIM n'est établi dans ce périmètre.** Les prototypes ci-dessous expriment **les mots au site** ; 0x4074F7 ne consomme que les deux premiers, 0x40766C que les quatre premiers. Les réciproques en C figurent l'opération x87, pas une garantie d'équivalence du contrôle/arrondi/exceptions. Lire une locale C non initialisée est indéfini : ce défaut machine n'a pas de transcription C strict définie.

```c
#include <stdint.h>
typedef struct GfxDrawList236 GfxDrawList236;

extern void *__cdecl sub_4074F7(int flag, void *desc, void *extra_owner);
extern void *__cdecl sub_40766C(int zero_local, int flag, void *data,
                               void *desc, void *extra_owner);
extern void *__cdecl sub_4076B6(int zero_local, int flag, const char *path,
                               void *desc, void *backend_owner); /* TIMrelated_0 */
extern int __cdecl sub_42F0F6(void *ignored, const char *cwd, char *saved_cwd);
extern void *__cdecl sub_4247C5(uint32_t pool);
extern int __cdecl memset_0(uint32_t count, void *dst); /* @0x40A75F */
extern int __cdecl Mat4F32_Identity(uint32_t *mat); /* @0x413C60 */
extern uint32_t *__cdecl sub_417996(int mode, const void *mat, void *list);
extern void *__cdecl sub_412883(int32_t count);
extern void *__cdecl Mat4F32_AllocIdentity(void); /* @0x4104DC */
extern int __cdecl Thunk_BufApp_Off72(int zero, void *mat, void *vbuf,
                                    void *backend_owner); /* @0x41E620 */
extern void *__cdecl sub_41E1AF(void *vbuf, void *resource, void *slot,
                               void *desc, void *backend_owner);
extern int __cdecl sub_416CE9(int32_t *buf, void *list);
extern void __cdecl Gfx_BindDrawListBackendCallbacks(int32_t selector,
                                                    int *list); /* @0x41619A */
extern void __cdecl sub_416C1E(int list);
extern void __cdecl OutputDebugString_1(const char *text); /* @0x403D99 */

GfxDrawList236 *__cdecl Gfx_CreateDrawList(
    int arg0, /* opaque ; ne pas confondre avec [ebp-18h] */
    int list_type,
    void *desc,
    const char *tim_path,
    void *owner)
{
    int original_type = list_type;
    int failed = 1;
    int use_owner_slot = 1;
    int parity = 0;
    void *texture; /* var_4 : AUCUNE initialisation ; défaut lit le résidu */
    GfxDrawList236 *list = NULL;
    int zero_local = 0; /* 0x416DC7 [ebp-18h], pas arg0 */
    char saved_cwd[256]; /* var_118 : chemin, pas CLUT */
    int32_t early0[4], early1[4], dimensions[4]; /* W/H à +8/+12 */
    uint32_t identity[16]; /* var_180 : 64 octets */

    if (list_type == 0x11)
        list_type = 0x0C;
    if (!desc || !owner)
        return NULL;

    if ((unsigned)list_type <= 0x0F)
        parity = list_type & 1;

    switch (list_type) {
    case 0: case 1: case 8: case 9:
        texture = sub_4074F7(0, desc, OWNER_BACKEND(owner));
        break;
    case 2: case 3: case 10: case 11:
        texture = sub_4074F7(1, desc, OWNER_BACKEND(owner));
        break;
    case 4: case 5: case 12: case 13:
        if (*(uint32_t *)((char *)desc + 0x2C)) {
            texture = sub_40766C(zero_local, 0,
                *(void **)((char *)desc + 0x30), desc, OWNER_BACKEND(owner));
            /* 0x416EA1, add esp,14h : cinquième mot passé, non consommé */
        } else {
            if (*(uint32_t *)((char *)desc + 0x24))
                sub_42F0F6((char *)desc + 0x48,
                    *(const char **)((char *)desc + 0x24), saved_cwd);
                /* 0x416ED2 : sauvegarde/changement CWD, retour ignoré */
            texture = sub_4076B6(zero_local, 0, tim_path, desc,
                                 OWNER_BACKEND(owner)); /* 0x416EEF, 20 octets */
            if (*(uint32_t *)((char *)desc + 0x24))
                sub_42F0F6((char *)desc + 0x48, saved_cwd, NULL);
                /* 0x416F19 : restauration tentée, retour ignoré */
        }
        if (sub_416CE9(early0, list)) { /* 0x416F2C, list=NULL : retourne 0 */
            list->reciprocal_width = (float)(1.0L / (long double)early0[2]);
            list->reciprocal_height = (float)(1.0L / (long double)early0[3]);
        }
        break;
    case 6: case 7: case 14: case 15:
        if (*(uint32_t *)((char *)desc + 0x2C)) {
            texture = sub_40766C(zero_local, 1,
                *(void **)((char *)desc + 0x30), desc, OWNER_BACKEND(owner));
            /* 0x416F82, add esp,14h */
        } else {
            if (*(uint32_t *)((char *)desc + 0x24))
                sub_42F0F6((char *)desc + 0x48,
                    *(const char **)((char *)desc + 0x24), saved_cwd);
                /* 0x416FB3 : CWD, aucun test du retour */
            texture = sub_4076B6(zero_local, 1, tim_path, desc,
                                 OWNER_BACKEND(owner)); /* 0x416FD0 */
            if (*(uint32_t *)((char *)desc + 0x24))
                sub_42F0F6((char *)desc + 0x48, saved_cwd, NULL);
                /* 0x416FFA : restauration CWD tentée */
        }
        if (sub_416CE9(early1, list)) { /* 0x41700D, list=NULL : retourne 0 */
            list->reciprocal_width = (float)(1.0L / (long double)early1[2]);
            list->reciprocal_height = (float)(1.0L / (long double)early1[3]);
        }
        break;
    case 18:
        texture = sub_4074F7(0, desc, OWNER_BACKEND(owner));
        use_owner_slot = 0;
        break;
    case 19:
        texture = sub_4074F7(1, desc, OWNER_BACKEND(owner));
        use_owner_slot = 0;
        break;
    default:
        break; /* type 16 / hors plage : texture indéterminée ; 17→12 */
    }

    if (!texture)
        return NULL; /* 0x41707F : pas de diagnostic sur ce retour précoce */

    list = (GfxDrawList236 *)sub_4247C5(*(unsigned int *)owner);
    if (list) {
        memset_0(0xEC, list); /* 0x4170B9 : deux mots, pas libc memset */
        Mat4F32_Identity(identity); /* 0x4170C8 */
        sub_417996(0, identity, list); /* 0x4170DD : +A4=0, copie 64 à +AC */
        list->type_original = original_type;
        list->texture = texture;
        list->has_vertices = (*(int32_t *)((char *)desc + 0x14) > 0);
        /* 0x4170FF setnle signé ; champ DWORD +4, pas un test unsigned */
        list->field_0C = *(unsigned int *)((char *)desc + 0x2C);
        list->field_1C = *(unsigned int *)((char *)desc + 0x28) ? 0 : 1;
        list->owner = owner;
        list->field_34 = *(unsigned int *)(OWNER_BACKEND(owner) + 0x348);
        if (*(unsigned int *)((char *)desc + 0x18))
            list->field_34 = *(unsigned int *)((char *)desc + 0x18);

        void *slot = use_owner_slot
            ? *(void **)((char *)owner + 0x10 + 4 * list_type)
            : NULL;
        if (slot) {
            void *vbuf = sub_412883(*(int32_t *)((char *)desc + 0x14));
            if (vbuf) {
                void *mat = Mat4F32_AllocIdentity(); /* 0x4171B0, zéro argument */
                if (mat)
                    Thunk_BufApp_Off72(0, mat, vbuf, OWNER_BACKEND(owner));
                    /* 0x4171DB, add esp,10h ; allocation facultative */
                list->vertex_buffer = vbuf; /* +14, 0x4171EC, après le thunk */
                list->backend = sub_41E1AF(vbuf, texture, slot,
                                           desc, OWNER_BACKEND(owner));
                /* 0x41720C : ordre prouvé, add esp,14h */
                if (list->backend) {
                    *(int *)((char *)list->backend + 0x20) = parity;
                    if (list->has_vertices)
                        *(int *)((char *)list->backend + 0x18) = 1;
                    *(int *)((char *)list->backend + 0x04) = arg0;
                    /* 0x41724E/251 : copie opaque seulement si slot non nul */
                    failed = 0;
                }
            }
        } else {
            list->backend = sub_41E1AF(NULL, texture, NULL, desc,
                                       OWNER_BACKEND(owner));
            if (list->backend)
                failed = 0;
        }

        if ((uint32_t)(list_type - 4u) <= 11u &&
            (list_type <= 7 || list_type >= 12)) { /* ja unsigned, table décodée */
            if (sub_416CE9(dimensions, list)) { /* 0x4172CF, add esp,8 */
                list->reciprocal_width =
                    (float)(1.0L / (long double)dimensions[2]); /* +28 */
                list->reciprocal_height =
                    (float)(1.0L / (long double)dimensions[3]); /* +2C */
                /* FILD int32 / FDIVR 1.0 / FSTP : AUCUN test W/H zéro */
            }
        }

        Gfx_BindDrawListBackendCallbacks(
            *(int *)((char *)desc + 0x34), (int *)list);
    }

    if (failed) {
        sub_416C1E((int)list);
        OutputDebugString_1("ERROR: COULD NOT CREATE SPRITE \n");
        return NULL;
    }
    return list;
}
```

Les quatre wrappers condensés historiques (`CreateOrLoadTIMResource`, `InitDrawListTransformIdentity`, `AttachIdentityMatrixToBuffer`, `Gfx_UpdateDrawListReciprocalDimensions`) ont été dépliés, sans créer ni renommer de symbole IDB. `sub_4076B6` est la cible réelle nommée `TIMrelated_0` dans l'IDA live ; `OutputDebugString_1` est le wrapper réel, non l'API. Aucun champ nommé ne vaut preuve de son interprétation métier. Le helper dimensions peut réussir avec W=H=0 et laisser une partie du tampon non écrite ; les calls précoces restent inertes grâce au retour du callee, pas à un garde ajouté ici.

## Preuves ASM (live)

1. `416d99 mov eax,[ebp+arg_4]` / `416d9c mov [ebp+var_8],eax` puis `416da6 cmp [ebp+arg_4],11h` / `416dac mov [ebp+arg_4],0Ch` — conservation type original, normalisation 17→12.
2. Parité : `416dd7 cmp ...,13h` / `416dde ja`, table DWORD `41733F`. Familles : `416e24 cmp ...,13h` / `416e2b ja`, table `byte_4173AB = 00 00 01 01 02 02 03 03 00 00 01 01 02 02 03 03 06 06 04 05` puis DWORDs `41738F` — dispatch exact après normalisation 17→12.
3. `416eef call sub_4076B6` avec cinq pushes puis `add esp,14h`; miroir sélecteur 1 à `416fd0` — obtention de ressource via **0x4076B6, sélecteur 0/1 ; format TIM non établi dans ce périmètre**.
4. `41708f call sub_4247C5`; `4170b3 push eax`, `4170b4 push 0ECh`, `4170b9 call memset_0` / `4170be add esp,8` — acquisition pool puis effacement de 0xEC octets à deux arguments.
5. `4170fb cmp dword ptr [edx+14h],0` / `4170ff setnle al` / `417105 mov [ecx+4],eax` — polarité signée strictement positive.
6. `417121 cmp [eax+28h],0` / `41712a mov dword ptr [ecx+1Ch],0` — champ +0x1C initialisé à 1 puis annulé si desc+0x28 non nul.
7. `417171 mov eax,[ebp+arg_4]` / `417177 mov edx,[ecx+eax*4+10h]` — table de slots backend, stride dword 0x4, type normalisé.
8. `41720c call sub_41E1AF` / `417217 mov [edx+18h],eax`; `41722f mov [edx+20h],eax`; `417251 mov [edx+4],eax` — création et paramétrage du sous-objet.
9. `41729d sub edx,4` / `4172a6 cmp ...,0Bh` / `4172ad ja` / table `byte_4173C7 = 00 00 00 00 01 01 01 01 00 00 00 00` — recalcul dimensions uniquement types 4–7/12–15 ; DWORDs à `4173BF` = `4172C4,4172FF`.
10. `4172ff mov eax,[ebp+var_10]` puis appel `Gfx_BindDrawListBackendCallbacks`; `417312 cmp [ebp+var_14],0` — binding inconditionnel après allocation, destruction seulement si la création backend n'a pas clos le succès.
11. `417338 mov eax,[ebp+var_10]` / `41733e retn` — retour EAX 32 bits, cdecl.

## Risques annotés, sans fermeture ni changement de flux

1. **Slot non nul / échec vbuf** : `0x4171AA jz 0x41725B` ne replie pas vers le backend sans slot ; l'échec reste actif, dimensions/binder pouvant encore être exécutés.
2. **CWD partagé** : état du processus, sauvegarde/changement/restauration pouvant échouer, retours ignorés ; restauration incertaine et implications process/thread non fermées.
3. **Taille du pool non vérifiée** : stride dynamique à `0x42488E`, effacement de 236 octets ; dépassement conditionnel si configuration incompatible. `0x4170AA jz 0x417312` saute le binder si la liste n'est pas acquise ; ownership/libération de la ressource locale reste ouvert.
4. **Sous-allocations / ownership matrice ouverts** : `0x4171C2 jz 0x4171E3` rend la matrice facultative sans interdire le contexte ; aucune validation générale des sous-allocations ni garantie de sûreté/atomicité.

## Contrôles live rapportés / état parent

- Callees vérifiés: `sub_4074F7`, `sub_40766C`, `sub_42F0F6`, `TIMrelated_0`, `sub_416CE9`, `sub_4247C5`, `memset_0`, `Mat4F32_Identity`, `sub_417996`, `sub_412883`, `Mat4F32_AllocIdentity`, `Thunk_BufApp_Off72`, `sub_41E1AF`, `Gfx_BindDrawListBackendCallbacks`, `sub_416C1E`, `OutputDebugString_1`.
- Callers vérifiés: création primitive PSX, wrappers draw-list, initialisation TPage/CLUT, menus, transition scanlines, capture swirl.
- Largeur retour: EAX pointeur complet. Aucun retour AL/AX.
- Nom, preuves opcodes retenues par R final post-B : acquisition/initialisation et retour de la liste, puis installation +9C/+A0 et consommation par walker `0x417963/97B` sur une chaîne de nœuds. Le `push 0ECh` concerne l'effacement, pas l'allocation pool ; la seule identité matricielle ne prouve pas « DrawList ». Les noms/commentaires IDA et les verdicts wiki/historiques ne prouvent pas le contrat.
- Couverture R post-B : fonction entière, **429 instructions / 65 blocs**, disasm sans page restante ; 27 appels/16 cibles, 67 xrefs code/0 DATA dans 13 fonctions ; ABI ciblée à `0x406DD0`, `0x448095`, `0x464603/61D`, pas un nouvel audit des 67 callers. §5.6 live effectué par le parent ; tag IDB du jour présent → **`SKIP_EXISTING_TAG`, `save_database=true` vérifié** selon son retour. **Écart docs/IDB connu** : annotations documentaires post-B non repoussées en IDB, aucune correction de commentaires ni nouveau PUSH ici.

