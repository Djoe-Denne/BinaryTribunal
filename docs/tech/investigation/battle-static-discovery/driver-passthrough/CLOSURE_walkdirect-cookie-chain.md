# CLOSURE — Walk-direct slots 48/49/50 : chaîne cookie → texture (TIM T)

Ground truth = FF8_EN.exe base 0x400000, live disasm IDA (2026-09-26). Layout T PROUVÉ par rendu lot 14 : w@+0x3C, h@+0x40, pal_entries@+0x5C, clutBuf@+0x60 (u32/couleur), pixels@+0xD8.

## 1. Chaîne complète cookie → T (chaque maillon = EA + ligne disasm)

Call path : `Gfx_WalkDrawList(list, cookie)` (2 args, cookie = 2ᵈ arg) → slot impl [list+0xA0] `sub_43E0E2(ctx=arg_0, node=arg_4, cookie=arg_8)`.

```
cookie (arg_8)
 = FFGetBufferAddress() return, poussé par le caller interne     [0x43EAEC push eax ;
 0x43EAED mov ecx,[ebp+8] ; 0x43EAF0 push ecx ;
 0x43EAF1 call Gfx_WalkDrawList]  (transmis tel quel comme arg_8 du slot)
   └ +0x314  : device wrapper (vtable custom)                    [0x43E155 mov edx,[ecx+314h] ; 0x43E15E mov ecx,[eax+314h] ;
                                                                  0x41EF83 mov ecx,[eax+314h] — buffer[197]]
   └ +0xAC4  : gate enable (0 → sub_441581 no-op)                [0x44158A cmp dword ptr [eax+0AC4h],0]
matdesc
 = *(ctx + 0x38)  (ctx = arg_0 du slot)                          [0x43E0F9 mov [ebp+var_4],edx ; pushé @0x43E103]
   (≙ *(ctx+0x38) ; Hex-Rays 0x43E0F9 « v4 = *(a1+56) » ✓)
   └ Actif via sub_441581(matdesc, cookie)                        [0x43E104]
     ├ texobj         = *(matdesc+0x14)                           [0x4415A7 mov eax,[ebp+arg_0]… v3 = *(a1+20) ;
                                                                  Hex-Rays 0x4415a7 « v3 = *(a1+20) »]
     ├ device-lost check : *(texobj+8) vtable+96 == -2005532222     [0x4415D5]
     │   → si lost : texobj = sub_421604(texobj) restauré           [0x4415E6]
     └ sub_41F99A(matdesc, cookie)                                  [0x4415FC / 0x44160E]
        = sub_41EF7A(1, matdesc, cookie)                            [0x41F9A0/94/A5/A7]
          ├ device = *(cookie+0x314)                                [0x41EF83 mov ecx,[eax+314h]]
          ├ bind réel : sub_41ED69(texobj, device)                  [0x41F0FC / 0x41F942]
          │   └ hot path : sub_41EF3C(texobj, device)               [0x41ED81 (si FFGetBufferAddress()[763]!=0)]
          │        └ SetTexture(stage 0, *(texobj + 0x0C))          [0x41EF5D call [vt+98h] — vt+152]
          └ upload TIM (texobj+0x90==1) : sub_42022C(texobj, bufferArea)
              ├ T = *(texobj + 0x98)  ← **l'objet TIM données T**   [0x41F038 v9=texobj[38] ; 0x420292 qmemcpy...; 
              │                                                      0x4202C1 v4[3] = *(*(a1+152)+60) ; 
              │                                                      0x4202D3 v4[2] = *(*(a1+152)+64)]
              ├ *(T+0x3C) = w        ← T layout PROUVÉ (lot 14)     [0x4202C1 : *( * (a1+152) + 60 ) = T+0x3C]
              ├ *(T+0x40) = h        ← T layout PROUVÉ              [0x4202D3 : *( * (a1+152) + 64 ) = T+0x40]
              └ page listée / clut via (*(*(a2+120))+24)(...)         [0x4202FC]
```

Chaîne en une ligne : **cookie(arg_8) → *(matdesc+0x14) → *(texobj+0x98) = T, avec matdesc = *(ctx+0x38)**, et la texture D3D réellement bindeée = *(texobj+0x0C) (0x41EF5D).

## 2. Provenance de arg_8 (cookie)

- Call site walkmap : sub_? contenant 0x43EAEC — `push eax` (retour FFGetBufferAddress(), 0x43EAE7) + `push [ebp+8]` (la draw list) → Gfx_WalkDrawList (0x43EAF1, add esp,8 @0x43EAF6).
- Dedans Gfx_WalkDrawList (decomp committé 0x4178D7) : cookie est l'arg 2, retransmis tel quel (push cookie, push node, push ctx → ctx=arg_0/node=arg_4/cookie=arg_8).
- **Le cookie n'est PAS dérivable de (ctx, node)** : il vient d'un singleton indépendant `FFGetBufferAddress()`. Il l'est toutefois globalement : valeur stable, conservée par RunFrame (FFGetBufferAddress naquit du 1er singleton). Verdictia : **capturer arg_8 tel quel** (u32 cookie_ptr dans le footer) à la 1ʳᵉ itération detour ; il est aussi dérivable en PJ réémettant l'appel à FFGetBufferAddress (adresse fonction à résoudre, UNPROVEN).

## 3. Appel final du draw (0x43E167 / 0x43E190)

Live disasm (sub_43E0E2, elles-mêmes cdecl 3 args arg_0/4/8) :

- Gate : `cmp dword ptr [eax+0A4h],0` @0x43E13A (eax = *(node+0x2C)).
- **Branch A (0x43E143..0x43E167)** : `mov eax,[edx+0A8h]` → texture = *(*(node+0x2C)+0xA8) ; puis push eax, push 1, push device=*(cookie+0x314), `call [vt+64h]` → (this=device, 1, texture). Convention : stdcall (pas d'add esp après @0x43E16A, jmp direct au cap).
- **Branch B (0x43E16C..0x43E190)** : edx = *(node+0x2C) ; `add edx,0ACh` ; push edx (POINTeur, pas de la charge), push 1, push device, `call [vt+64h]` → (this, 1, &(*(node+0x2C)+0xAC)). Idem stdcall.
- Le `vt+64h` = vt idx 25 sur le wrapper device, pas le device D3D9 brut (SetTexture D3D9 = vt idx 62 ≠ 64/4).
- Le passer « texture » ici vient de **node+0x2C (+0xA8)**, c'est-à-dire du per-draw node, PAS via le cookie. Valeur actuellement au live ? Vérifiée : *(node+0x2C) est utilisé à 0x43E10F..0x43E112 pour `cmp [eax+80h],-1` (gate idx) et à 0x43E13A ([+0xA4]=0 gate). La cohérence `(field+0xA8) == *(texobj+0x0C)` (i.e. même IDirect3DTexture9) reste **UNPROVEN**.

## 4. Verdict / recommandation capture v11

Chaîne exacte (cookie → T) :

1. `cookie_ptr` = arg_8 au call du slot = FFGetBufferAddress() (capturable tel quel, u32).
2. `matdesc = *(cookie_ctx)` — non : `matdesc = *(ctx+0x38)`. Si on capture déjà `ctx`, on a matdesc (prouvé 0x43E0F9). ⚠ Correction par rapport à la note parent : ***(ctx+0x38) = matdesc (descripteur états), PAS la W ; c'est arg_8 = cookie = W-buffer** (device+0x314, gate+0xAC4). Les étiquettes « cookie » / « W » étaient croisées.
3. `texobj = *(matdesc+0x14)` (prouvé 0x4415A7).
4. `T = *(texobj+0x98)` (prouvé 0x4202C1/0x4202D3 lecture T+0x3C/T+0x40 + 0x41F038 v9=texobj[38]).
5. Texture live D3D = `*(texobj+0x0C)` (prouvé 0x41EF5D).

**Recommandation v11 (cette chaîne)** : dans le footer, sauvegarder
- `u32 cookie_ptr` = arg_8 (u32) — capture directe, non dérivable de (ctx,node) link-proven (UNPROVEN link ctx→cookie, mais dérivable via FFGetBufferAddress si besoin).
- Rien d'autre n'est nécessaire : matdesc (ctx+0x38), texobj (matdesc+0x14), T (texobj+0x98) sont reconstruisibles par offsets stables, à condition d'avoir `ctx`. Si on exige byte-proof au moment du detour, sauvegarder aussi `u32 matdesc_ptr = *(ctx+0x38)` et `u32 texobj_ptr = *(matdesc+0x14)` pour fermer l'ARN en une capture (chaque offset ci-dessus est prouvé par EA).

## 5. Maillons UNPROVEN restants

- Lien `*(node+0x2C)+0xA8 == *(texobj+0x0C)` (texture du draw vs celle du bind render-state) — non prouvé (aucun live disasm disant egalité).
- `FFGetBufferAddress()` rapprochable d'un ctx existant (derivable sans arg_8) — non prouvé ; arg_8 tel quel reste le chemin sûr.
- `sub_42022C` : lien `*(a1+148)+128` (0x420292, qmemcpy 0x7C) vers le layout T / autre struct — non exploré (pal_entries@0x5C et clut@0x60 non rencontrés via ce path ; le layout T complet reste prouvé par rendu lot 14 uniquement).
- Id exact de `vt+64h` (idx 25) sur le wrapper device — non prouvé quel nom API exact (le « 1 » de l'arg 2 est constant dans les deux branches).
- `sub_421604` (restore device-lost), `sub_407EB4(idx, matdesc)` ( brunch node+0x2C idx != -1; no-op live car *(W... ) — non decompilés ici (hors scope).

## Notes divergences / pièges relevés

- Hex-Rays sub_441581 appelle « sub_41F99A(a1, a2) » — cohérent ASM (arg0 = matdesc, arg4 = cookie). Toute note parent disant « sub_441581(cookie, W) » avec W = *(ctx+0x38) a les étiquettes **croisées** vs live (0x43E0FF push arg_8 ; 0x43E103 push var_4 → arg_1 = var_4 = *(ctx+0x38) = matdesc, arg_2 = arg_8 = cookie).
- Hex-Rays sub_41ED69 : accès `v6[763]` (FFGetBufferAddress+0xBF4) = hot-path gate; `v6[761]`(+0x7D0) etc. — colonnes non prouvées au-delà de l'existence du branching.
- Aucun rename IDA effectué (read-only). Aucun patch.
