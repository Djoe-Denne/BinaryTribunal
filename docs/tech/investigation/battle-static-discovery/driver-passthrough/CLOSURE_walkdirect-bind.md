# CLOSURE — Mechanisme de bind texture des draws « walk direct » battle (slots 48/49/50)

> Ground truth = IDB live FF8_EN.exe (base 0x400000), disasm + Hex-Rays relus contre l'ASM.
> Période : fermer Q1 (writer de *(matdesc+0x14)), Q2 (mécanisme de bind des directs), Q3
> (decomp sub_43DF2A / sub_43DF54), Q4 (structure du ctx direct). Aucun rename/patch.
> Chaque claim est EA-cité. Date : 2026-09-27.

## 0. Verdict en une ligne

**Q2 : hypothèse (a) confirmée, avec identité du "heriteur" prouvée** — les draws slots
48/49/50 (`RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4` @0x43E24A, 3 copies aux slots
driver +0xC0/+0xC4/+0xC8) **ne binde AUCUNE texture** : ils héritent de l'état device
courant posé par la chaîne slot-25 `sub_4365FF` → `sub_41ED69` → `sub_42022C` (upload) /
`sub_41EF3C` (`call [device+0x98]` = SetTexture) qui s'exécute au **setup** des nœuds
puissés (slot 47 `sub_43DFA6` / 46 `sub_43DF54`, via `sub_407EB4(idx, matdesc)`).

**Q1 : *(matdesc+0x14) n'a AUCUN writer prouvé dans le chemin DDrawAlt** — le
matdesc des ctx directs = la ressource TIM de la liste (cf. §4), et son champ
`+0x14` (attache texobj) n'est écrit par aucun site trouvé : scan bytes
`C7 4x 14` (mov [reg+14h], imm32) sur 0x401000..0x447000 → aucun site pertinent
(0x41FA27 = sub_41F9D0 écrit a2[5]=1/2/4/8 — objet BLEND, pas le matdesc ;
0x4171EC = list+0x14 = vertex-buffer, autre objet). Le champ est conçu pour le
chemin GL/DDraw (consommé par `sub_41EF7A(enable=1, matdesc, cookie)` branch
texture @0x41F011), mais rien dans l'IDB ne l'attache côté Alt pour les ctx
directs — d'où la valeur 0 observée en live v10.3/v11 (48/48 records).

## 1. Chaîne complète du bind des directs (tous maillons EA-cités)

```
FFBattleModule @0x47CF60 (frame battle)
  └─ Gfx_SubmitDisplayLists @0x4980C0
       └─ sub_4B3690 @0x4B3690  (walk de la table des batch-aggregate lists
                                  dword_1D75628[..] — le 3e call du triad 0x4980C8/
                                  0x4980CD/0x49818D)
            └─ Gfx_WalkDrawList @0x4178D7
                 ├─ setup : call [list+0x9C] @0x417963  → slot 44 (types 2/10
                 │     per ABI §6 ; pairing live observé = setup 47 @0x43DFA6)
                 │     → sub_43DF00 : gate *(ctx+0x30) → sub_441560(*(ctx+0x38), cookie)
                 │     [0x43DF07→0x43DF1E] → sub_41F99A = sub_41EF7A(1, matdesc, cookie)
                 │     [0x441577]
                 └─ walk (par node) : call [list+0xA0] @0x41797B  → slot 49
                       → RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4 @0x43E24A
                            ├─ device = *(cookie+0x314)          [0x43E272]
                            ├─ UV-bias gate *(cookie+0xBF4)      [0x43E278]
                            ├─ gate *(*(node+0x2C)+0x14) != 0    [0x43E290]  ← UNIQUE
                            │   lecture texture-side du node
                            ├─ call [deviceVT+0x74] = DrawIndexedPrimitive(4, 0x1C4, …)
                            │                                    [0x43E308]
                            └─ RETRY 0x8876021C / DD_ErrorMessage("dx_spr.cpp", 251)
```

Le **bind texture** est fait par le **setup du nœud précédent** (chaîne VB) :

```
slot 47 sub_43DFA6 / slot 46 sub_43DF54 (les deux setup impls qui appellent
sub_441581 ; le mapping type→slot de 46/47 n'est pas dans ABI §6) :
  gate *(ctx+0x30) [0x43DFAB/0x43DF5B]
  → sub_441581(*(ctx+0x38), cookie)                [0x43DFC4 / 0x43DF72]
     sub_441581 @0x441581 :
        gate *(cookie+0xAC4)                        [0x44158A]
        texobj = *(matdesc+0x14)                    [0x4415A7]
        if (texobj+8) → device-lost check [*(texobj+8)VT+0x60]  [0x4415D5]
           → sub_41F99A(matdesc, cookie) = sub_41EF7A(1, matdesc, cookie)
             sub_41EF7A branch texture (enable & bit 0x2) :
               alpha = f(*(texobj+152), *(texobj+160))          [0x41F038..0x41F0B1]
               SetRenderState(device, 41, alpha)  [VT+0x58]     [0x41F0D2]
               sub_41ED69(texobj, device)                       [0x41F0FC]
                 sub_41EF3C : SetTexture(device, 0, *(texobj+0xC))
                             call [deviceVT+0x98]                [0x41EF5D]
                 upload : sub_42022C (w/h @0x4202C1/0x4202D3)
        else → sub_41EF7A(0, matdesc, cookie)         [0x441622]  ← enable=0 :
                                                               PAS de re-bind
```

**Identité de la texture héritée** : c'est le texobj bindé par le DERNIER passage dans
la chaîne slot-25 (palette-batch/sprite). Le setup du nœud 47/46 lit la palette-cible
depuis `*(*(node+0x2C)+0x80)` (slot 46 : `cmp [eax+80h],-1` @0x43DF80) et appelle
`sub_407EB4(idx, matdesc)` @0x43DF9A — c'est la fonction qui upload/bind la texture
palette (chaîne fermée CLOSURE_walkdirect-texture-chain §2-§6, `call [vtable+0x64]`
@0x40828A = main draw/batchhandle).

## 2. Q1 — Qui écrit *(matdesc+0x14) ?

**Personne dans le chemin DDrawAlt.** Preuves :

| # | Fait | EA |
|---|---|---|
| 1 | matdesc (a2[5] = +0x14) LU par sub_441581 @0x4415A7 et sub_41EF7A @0x41F011 | 0x4415A7, 0x41F011 |
| 2 | sub_441581 n'écrit +0x14 QUE sur device-lost (`*(a1+0x14) = sub_421604(texobj)` — c'est un REPLACE, pas un init) | 0x4415E6 |
| 3 | sub_41EF7A lit a2[5] sans jamais l'écrire | 0x41F011 |
| 4 | `RenderDDrawAlt_SetRenderState` @0x440FF0 (slot 29 Alt) : **case 1 (TEXTURE) absent du switch** — aucun writer via RS type 1 | 0x440FF0..0x4414D8 |
| 5 | Pour l'objet shadow-RS 0x64 (chemin sub_407B59) : seul initialisateur `Gfx_InitDrawListDesc` `a1[5] = 0` | 0x406FF4 |
| 6 | Scan bytes `C7 4x 14` (mov [reg+14h], imm32) sur 0x401000..0x447000 : aucun site d'écriture non-triviale du champ d'un matdesc/texture-resource (0x41FA27 = sub_41F9D0 → objet BLEND ; 0x4171EC = list+0x14 = vertex-buffer ; 0x41B2C0/0x41BF04 = objets TIM autres) | scan 2026-09-27 |
| 7 | Scan bytes `89 4x/5x 14` (mov [reg+14h], reg32) : sites dans des familles non-matdesc (vertex-buffer fill sub_41E1AF @0x41E461/0x41E4A2 = [var_1C+14h], etc.) — aucun confirmé sur la ressource TIM des ctx directs | scan 2026-09-27 |

**Implication capture** : capturer `*(matdesc+0x14)` au detour slot-49 est
structuruellement voué à 0 — ce champ n'est jamais alimenté côté Alt pour les ctx
directs ; le champ VB `*(backend+0x14)` du lot 14 venait d'un chemin différent
(backend = ctx+0x3C ? ctx+0x68 : ctx+0x38, pas le même objet).

## 3. Q3 — sub_43DF2A (slot 45) et sub_43DF54 (slot 46)

**sub_43DF2A @0x43DF2A (slot 45, +0xB4)** — thunk « commit RS » pur :
```c
int __cdecl sub_43DF2A(int a1 /*ctx*/, int a2, int a3 /*cookie*/){
    if (*(DWORD*)(a1 + 0x30) == 0)         /* @0x43DF31 gate */
        return a1;                          /* retn @0x43DF52 */
    return sub_441581(*(DWORD*)(a1 + 0x38), a3);  /* @0x43DF48 matdesc, cookie */
}
```
→ **aucun bind direct** : uniquement le commit render-state (matdesc→device).

**sub_43DF54 @0x43DF54 (slot 46, +0xB8)** — commit + palette-resolve :
```c
void __cdecl sub_43DF54(int a1 /*ctx*/, int a2 /*node*/, int a3 /*cookie*/){
    if (*(DWORD*)(a1 + 0x30)) {                              /* @0x43DF5B gate */
        sub_441581(*(DWORD*)(a1 + 0x38), a3);                /* @0x43DF72 */
        if (*(DWORD*)(*(DWORD*)(a2 + 0x2C) + 0x80) != -1)    /* @0x43DF80 idx != -1 */
            sub_407EB4(*(DWORD*)(*(DWORD*)(a2 + 0x2C) + 0x80),
                       *(DWORD*)(a1 + 0x38));                /* @0x43DF9A idx, matdesc */
    }
}
```
→ le bind passe par `sub_407EB4(idx, matdesc)` (chemin slot-25), PAS par un champ
texture du ctx.

## 4. Q4 — Structure du ctx direct

Le ctx des draw-lists walk-direct = **l'objet backend retourné par `sub_41E1AF`**
(store dans `list+0x18` par `Gfx_CreateDrawList` @0x417217 : `mov [edx+18h], eax`) :

| offset | contenu | preuve |
|---|---|---|
| ctx+0x30 | **gate** (DWORD booléen) — gate de tous les setup/walk (43-64) | `cmp [eax+30h],0` @0x43DF07/0x43DF31/0x43DF5B/0x43DFAB/0x43E060/0x43E19E |
| ctx+0x38 | **matdesc** — voir ci-dessous (DEUX provenances prouvées) | store `mov [ecx+38h], eax/edx` @0x41E2A2/0x41E2AD (dans sub_41E1AF) |
| ctx+0x3C | override backend (VB chain) — non utilisé par le chemin direct | `cmp [eax+3Ch],0` @0x41792B (Gfx_WalkDrawList) |
| ctx+0x68 | second override (VB chain) | `mov edx,[ecx+68h]` @0x41792F |

**Provenance du matdesc** (sub_41E1AF @0x41E284-0x41E2AD, ordre args prouvé par les
pushes @0x4171F2-0x41720B : arg_0=vertex-buffer, arg_4=texture, arg_8=slot, arg_C=desc,
arg_10=owner) :

```
if (arg_4 == 0 && arg_8 != 0 && *(arg_8+0x30) > 0)
    ctx+0x38 = *(arg_8 + 0x68);        /* @0x41E29F-0x41E2A2 : slot+0x68 */
else
    ctx+0x38 = arg_4;                  /* @0x41E2A7-0x41E2AD : LA TEXTURE de la liste */
```

- **Listes créées par `Gfx_CreateDrawList`** (les walk-direct battle) : arg_4 =
  var_4 = ressource TIM de la liste (sub_4074F7 @0x416E53 ou TIMrelated_0
  @0x416EEF) → **matdesc = la ressource texture de la liste** ; `*(matdesc+0x14)`
  = `*(resource+0x14)` = champ d'attache texobj de la ressource.
- **Objets « sub_407B59 »** (2 instances, stockées `engine+0x338`/`engine+0x33C`
  par les stores @0x407D42/0x407D75 — appelés depuis `sub_408E90` @0x408ED2) :
  arg_4 = objet 0x64 de `Render_sub_4070E2` (calloc @0x4070F9), arg_8 = 0 →
  matdesc = le shadow-RS 0x64 (mixé par sub_40729B/sub_40736C).

**Lecture texture dans les deux cas** : `sub_441581(matdesc, cookie)` lit
`*(matdesc+0x14)` comme texobj candidat (Q1 : ce champ reste 0 pour les ctx directs,
live v10.3/v11 48/48 records) ; le bind D3D effectif passe par la chaîne slot-25
(`sub_407EB4` → `sub_41ED69` → `sub_41EF3C` `call [deviceVT+0x98]` @0x41EF5D) —
les draws slots 48/49/50 héritent de cet état device (cf. §0).

## 5. Implication capture v12

**Que faut-il capturer pour associer un texobj aux records slot-49 ?**

1. **L'ordre painter suffit CÔTÉ DÉCODEUR** pour associer la texture à la bonne
   paire de draws : les setup (44/46/47/55) et les walk (48/49/50) se suivent
   séquentiellement dans Gfx_WalkDrawList @0x417963/0x41797B ; un record slot-49 est
   toujours précédé du record setup (44/46/47) qui a déclenché le bind.
2. **La capture device-state est nécessaire pour l'identité du texobj** : capturer
   `*(device+0x98)` (pointeur fonction SetTexture) APPELÉ au detour — le texobj D3D
   du device au moment du DrawIndexedPrimitive slot-49 est l'unique source de vérité
   (le champ matdesc+0x14 est mort côté Alt). Recommandation v12 : au hook
   DrawIndexedPrimitive (0x43E308 / 0x43E4ED / 0x43E59B), capturer en plus :
   `texobj_device = dernier arg passé à [deviceVT+0x98]` — ou interposer
   `sub_41EF3C`/`sub_421F9A` pour logguer le binding. Un dump de
   `*(deviceVT+0x98)`-state à T_draw nécessite un hook sur SetTexture (pas le champ
   matdesc).
3. **Le champ `*(*(node+0x2C)+0x14)` @0x43E290 est la seule clé texture-side lue par
   le slot-49 impl** — à capturer pour corréler les records (ce n'est PAS le texobj,
   c'est le flag UV-bias gate).

## 6. UNPROVEN restants

- **Le writer de `*(resource+0x14)`** (attache texobj de la ressource TIM/matdesc) :
  l'objet est identifié (§4), aucun site d'écriture confirmé dans l'IDB — soit le
  champ n'est jamais écrit côté Alt (l'état device est la seule source de vérité),
  soit l'attache se fait par un chemin indirect non couvert par les scans bytes.
- La valeur exacte de la texture device héritée (bindée par le dernier slot-25) —
  nécessite un hook SetTexture en v12 (§5.2).
- Le lien précis entre `*(*(node+0x2C)+0x80)` (palette-idx) et l'index de la
  texture D3D bindée dans `sub_407EB4` (chaîne palette fermée côté texture-chain
  §2-§6, mais la correspondance idx→texobj device n'a pas été observée live).
- L'identité statique des 3 ctx 0x7b071a0/0x7b08da0/0x7b301a0 (quelle liste
  Gfx_CreateDrawList les a produits, et si leur matdesc = même ressource TIM
  partagée) — nécessite un hook sur Gfx_CreateDrawList @0x416D82 pour corréler
  arg_0 (bind_id) / arg_4 (list_type) à l'adresse runtime.
