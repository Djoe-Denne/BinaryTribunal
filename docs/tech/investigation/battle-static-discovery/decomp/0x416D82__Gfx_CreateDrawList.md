# Gfx_CreateDrawList @ 0x416D82

- Instr (live): 429
- Mode: 2+1 (A/B aveugles existants, R parent ré-dérivé de l'ASM live et du pseudo-C)
- Verdict: CERTAIN — fabrique et initialise un objet draw-list de 0xEC octets, sa ressource texture et son sous-objet backend
- Push IDB: append-only `[semantic-triple 2026-09-17]` + save_database
- Notes parent: prototype cdecl à 5 arguments, retour EAX pointeur/NULL ; `type==0x11` est normalisé en `0x0C`, mais le champ objet `+0x00` conserve le type original ; bornes de switch `ja` non signées ; `setnle` est un test signé `desc[+0x14] > 0` ; table backend `[owner+0x10+type*4]`, stride 0x4 ; objet 0xEC, matrice 0x40 ; tous les 24 sites d'appel directs cités existent. Le pseudo-C corrige les arguments omis par les prototypes IDA de `sub_4074F7`, `sub_40766C` et `memset_0` grâce aux pushes/add esp live.

## Réconciliation adversariale A/B

1. A et B confirment le rôle, le contrat, la taille 0xEC et le nom. R conserve `Gfx_CreateDrawList`.
2. B corrige A sur les champs: `obj+0x0C = desc+0x2C`, `obj+0x1C = desc[+0x28] ? 0 : 1`, `obj+0x30 = owner`, `obj+0x34 = desc+0x18` sinon `owner[+0x6C][+0x348]`.
3. Le type stocké à `obj+0x00` est le type **original** sauvegardé avant le remappage 17→12 (`416d99` puis `4170e8`), tandis que les switchs et la table backend utilisent le type normalisé. Cette distinction était insuffisamment explicite dans A/B.
4. Les appels précoces à `sub_416CE9(..., obj)` surviennent avant l'allocation, avec `obj==NULL`; leurs écritures réciproques sont donc gardées par le retour du callee. Le passage post-allocation à `4172cf` est celui qui fixe effectivement `obj+0x28/+0x2C` pour les types 4–7 et 12–15.
5. `Gfx_BindDrawListBackendCallbacks(desc[+0x34], obj)` est exécuté pour tout objet alloué, pas seulement pour les types 8–11; le troisième switch ne contrôle que le recalcul des réciproques.

## C réconcilié (structure fidèle)

```c
typedef struct GfxDrawList236 GfxDrawList236;

GfxDrawList236 *__cdecl Gfx_CreateDrawList(
    int bind_id,
    int list_type,
    void *desc,
    const char *tim_path,
    void *owner)
{
    int original_type = list_type;
    int failed = 1;
    int use_owner_slot = 1;
    int parity = 0;
    void *texture = NULL;
    GfxDrawList236 *list = NULL;

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
        texture = CreateOrLoadTIMResource(0, tim_path, desc, owner);
        break;
    case 6: case 7: case 14: case 15:
        texture = CreateOrLoadTIMResource(1, tim_path, desc, owner);
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
        break;
    }

    if (!texture)
        return NULL;

    list = (GfxDrawList236 *)sub_4247C5(*(unsigned int *)owner);
    if (list) {
        memset(list, 0, 0xEC);
        InitDrawListTransformIdentity(list);
        list->type_original = original_type;
        list->texture = texture;
        list->has_vertices = (*(int *)((char *)desc + 0x14) > 0);
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
            list->vertex_buffer = sub_412883(*(int *)((char *)desc + 0x14));
            if (list->vertex_buffer) {
                AttachIdentityMatrixToBuffer(list->vertex_buffer, OWNER_BACKEND(owner));
                list->backend = sub_41E1AF(list->vertex_buffer, texture, slot,
                                           desc, OWNER_BACKEND(owner));
                if (list->backend) {
                    *(int *)((char *)list->backend + 0x20) = parity;
                    if (list->has_vertices)
                        *(int *)((char *)list->backend + 0x18) = 1;
                    *(int *)((char *)list->backend + 0x04) = bind_id;
                    failed = 0;
                }
            }
        } else {
            list->backend = sub_41E1AF(NULL, texture, NULL, desc,
                                       OWNER_BACKEND(owner));
            if (list->backend)
                failed = 0;
        }

        if ((list_type >= 4 && list_type <= 7) ||
            (list_type >= 12 && list_type <= 15))
            Gfx_UpdateDrawListReciprocalDimensions(list);

        Gfx_BindDrawListBackendCallbacks(
            *(int *)((char *)desc + 0x34), (int *)list);
    }

    if (failed) {
        sub_416C1E((int)list);
        OutputDebugStringA("ERROR: COULD NOT CREATE SPRITE \n");
        return NULL;
    }
    return list;
}
```

`CreateOrLoadTIMResource`, `InitDrawListTransformIdentity`, `AttachIdentityMatrixToBuffer` et `Gfx_UpdateDrawListReciprocalDimensions` condensent des séquences d'appels visibles; ils ne sont pas des symboles proposés à l'IDB.

## Preuves ASM (live)

1. `416d99 mov eax,[ebp+arg_4]` / `416d9c mov [ebp+var_8],eax` puis `416da6 cmp [ebp+arg_4],11h` / `416dac mov [ebp+arg_4],0Ch` — conservation type original, normalisation 17→12.
2. `416dd7 cmp ...,13h` / `416dde ja` et table `byte_4173AB = 00 00 01 01 02 02 03 03 00 00 01 01 02 02 03 03 06 06 04 05` — dispatch exact des 20 types.
3. `416eef call TIMrelated_0` avec cinq pushes puis `add esp,14h`; miroir mode 1 à `416fd0` — création/chargement TIM à deux modes.
4. `41708f call sub_4247C5`; `4170b0 push eax`, `4170b4 push 0ECh`, `4170b9 call memset_0` — allocation puis effacement de 0xEC octets.
5. `4170fb cmp dword ptr [edx+14h],0` / `4170ff setnle al` / `417105 mov [ecx+4],eax` — polarité signée strictement positive.
6. `417121 cmp [eax+28h],0` / `41712a mov dword ptr [ecx+1Ch],0` — champ +0x1C initialisé à 1 puis annulé si desc+0x28 non nul.
7. `417171 mov eax,[ebp+arg_4]` / `417177 mov edx,[ecx+eax*4+10h]` — table de slots backend, stride dword 0x4, type normalisé.
8. `41720c call sub_41E1AF` / `417217 mov [edx+18h],eax`; `41722f mov [edx+20h],eax`; `417251 mov [edx+4],eax` — création et paramétrage du sous-objet.
9. `417297 sub ...,4` / `4172ad cmp ...,0Bh` / table `byte_4173C7 = 00 00 00 00 01 01 01 01 00 00 00 00` — recalcul dimensions uniquement types 4–7/12–15.
10. `4172ff mov eax,[ebp+var_10]` puis appel `Gfx_BindDrawListBackendCallbacks`; `417312 cmp [ebp+var_14],0` — binding inconditionnel après allocation, destruction seulement si la création backend n'a pas clos le succès.
11. `417338 mov eax,[ebp+var_10]` / `41733e retn` — retour EAX 32 bits, cdecl.

## Validation parent

- Callees vérifiés: `sub_4074F7`, `sub_40766C`, `sub_42F0F6`, `TIMrelated_0`, `sub_416CE9`, `sub_4247C5`, `memset_0`, `Mat4F32_Identity`, `sub_417996`, `sub_412883`, `Mat4F32_AllocIdentity`, `Thunk_BufApp_Off72`, `sub_41E1AF`, `Gfx_BindDrawListBackendCallbacks`, `sub_416C1E`, `OutputDebugString_1`.
- Callers vérifiés: création primitive PSX, wrappers draw-list, initialisation TPage/CLUT, menus, transition scanlines, capture swirl.
- Largeur retour: EAX pointeur complet. Aucun retour AL/AX.
- Nom: allocation 0xEC + appel unique au binder `GfxDrawList236` + 67 xrefs graphiques indépendants.
