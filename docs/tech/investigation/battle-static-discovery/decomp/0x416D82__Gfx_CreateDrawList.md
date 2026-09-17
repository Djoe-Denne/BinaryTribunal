# Gfx_CreateDrawList @ 0x416D82

- Instr (live): 429
- Mode: 2+1 (A=semantic-analyste glm-5.3-flash, B=semantic-analyste aveugle glm-5.3-flash, R=semantic-reconciler glm-5.3, P=parent §5.6 sur ASM live)
- Verdict: CERTAIN — rôle/nom/contrat (A CERTAIN, B CERTAIN, R CERTAIN réconcilié)
- Push IDB: append-only `[semantic-triple 2026-09-17]` + save_database
- Notes parent §5.6: 67 xrefs code, 0 DATA (vérifié live). Remap type 0x11→0x0C (416da6/416dac). Rejets NULL: desc (416db3), driver/arg_10 (416dbd). Objet 0xEC memset (4170b4/4170b9, add esp,8). setnle al signé (4170ff) ; ja unsigned bornes switch (416dde) ; AUCUN jb/jbe/jl/jle. Retour EAX pleine largeur pointeur objet 0xEC ou NULL (417338) — type IDA `float *` FAUX. Strides: type*4 = 0x10 dans table byte_4173AB (20 entrées), jamais *232. Callees 16+ internes confirmés live (sub_4074F7×4 add esp,0Ch ; sub_40766C×2 0x14 ; sub_42F0F6×4 0x0C ; TIMrelated_0×2 0x14 ; sub_416CE9×3 0x08 ; sub_4247C5 0x04 ; memset_0 0x08 ; Mat4F32_Identity 0x04 ; sub_417996 0x0C ; sub_412883 0x04 ; Mat4F32_AllocIdentity 0 arg ; Thunk_BufApp_Off72 0x10 ; sub_41E1AF×2 0x14=5 args ; Gfx_BindDrawListBackendCallbacks 0x08 ; sub_416C1E 0x04 ; OutputDebugString_1 0x04). 3 switchs: jpt_416DE6 (20 cases), 0x41738F (7 cases), jpt_4172BD (2 cases post-traitement).

## Réconciliation R (divergences tranchées)

1. Comptage callers: Gfx_InitTexturePageDrawLists=17, Gfx_AllocTexturePageSlot=10 (comptage exact pack, ni 18/20 ni 11).
2. Polarité: B correct — setnle (signé >) pour test de dimension, ja (unsigned) pour bornes de switch. A mentionnait jle à tort.
3. sub_4074F7: 4 sites d'appel (pas 3).
4. Retour: pointeur objet 0xEC dans EAX (type IDA float* rejeté).
5. arg0 observé booléen 0/1 (tim_mode) — libellé exact non prouvé par l'ASM seul.
6. sub_41E1AF: 5 args (2 pushes×5, add esp,14h) — ordre exact non prouvé.

## Rôle (R final)

Fabrique un objet *draw-list* de 0xEC (236) octets: valide desc/driver non-NULL, remappe type 0x11→0x0C (domaine 0..0x13), charge/récupère texture TIM selon tim_mode (TIMrelated_0), applique 3 switchs de configuration (20 types via byte_4173AB, 7 entrées secondaires, 2 post-traitements), construit sous-objet backend (sub_41E1AF), calcule réciproques 1.0/largeur et 1.0/hauteur (CONST_1_0), identité matrice (Mat4F32_Identity/AllocIdentity), buffer append (Thunk_BufApp_Off72), lie les callbacks backend (Gfx_BindDrawListBackendCallbacks). Échec → OutputDebugString_1, EAX=NULL.

## Contrat

```c
void *__cdecl Gfx_CreateDrawList(
    int tim_mode,            /* arg_0: booléen observé 0/1 — libellé exact non prouvé */
    int list_type,           /* arg_4: 0..0x13, 0x11 remappé en 0x0C */
    Desc *desc,              /* arg_8: descripteur source (NULL rejeté) */
    void *driver,            /* arg_C: handle backend (NULL rejeté) */
    const char *path         /* arg_10: chemin TIM (pointeur de chaîne, pas int) */
);
/* Retour EAX 32 bits: pointeur objet draw-list 0xEC ou NULL sur échec. */
```

## Preuves ASM (live)

1. `416da6 cmp [ebp+arg_4], 11h` / `416dac mov [ebp+arg_4], 0Ch` — remap type.
2. `416db3 cmp [ebp+desc], 0` / `416dbd cmp [ebp+arg_10], 0` — rejets NULL.
3. `4170b4 push 0ECh` / `4170b9 call memset_0` / `4170be add esp, 8` — objet 236 octets.
4. `4170ff setnle al` — test signé > (réciproques dimensions).
5. `416dde ja short def_416DE6` — bornes switch unsigned, 20 cases jpt_416DE6.
6. `417338 mov eax, [ebp+var_10]` / `41733e retn` — retour EAX pointeur pleine largeur.
7. `call sub_41E1AF` ×2 `add esp, 14h` — sous-objet backend, 5 args.
8. `call Gfx_BindDrawListBackendCallbacks` `add esp, 8` — liaison callbacks.

## Gaps résiduels (R)

- Noms exacts des champs internes de desc/driver/objet 0xEC.
- Ordre exact des 5 arguments de sub_41E1AF.
- Sémantique fine des tables byte_4173AB (20) / byte_4173C7 (12).

