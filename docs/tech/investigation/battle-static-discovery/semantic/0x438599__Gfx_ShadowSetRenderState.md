# Gfx_ShadowSetRenderState @ 0x438599

- Confiance: CERTAIN
- Nom catalogue: confirme (proposition optionnelle plus discriminante : `Gfx_RenderStateShadow_WriteEntry_GL`, markdown seul)
- Mode: 1+P
- A==V: n/a (1+P)
- Push IDB: oui
- Preuves:
  - Résolution table : `mov ecx, [eax+0A84h]` @ 0x4385A0 (`8B 88 84 0A 00 00`) — table shadow = `*(engine+0xA84)` (engine+2692), champ direct, pas `GetBufApp_0xA74`.
  - NULL-guard seul : `cmp [ebp+var_4], 0` + `jz short loc_4385BB` @ 0x4385A9/0x4385AD — zero-check, aucun range-check sur `type` (borne [0,25] vit dans le wrapper 0x41E650 uniquement, `jl` @ 0x41E667 / `jge` @ 0x41E66D).
  - Store indexé : `mov [eax+edx*4], ecx` @ 0x4385B8 (`89 0C 90`) — `shadow_table[type] = value`, DWORD, stride `*4`.
  - Leaf pure : zéro `call`, zéro `add esp`, `retn` C3 @ 0x4385BE — aucun appel GL/D3D, `callees.txt` vide cohérent.
  - Install vtable : `mov dword ptr [eax+74h], offset Gfx_ShadowSetRenderState` @ 0x42537C dans `presentation::RenderBackend_Construct_OpenGL` — slot 29 (0x74/4=29) ; xref unique = data, aucun call direct.
  - Dispatch wrapper `Gfx_SetRenderState` @ 0x41E650 : pushes droite→gauche engine/value/type @ 0x41E672/0x41E676/0x41E67A, `call dword ptr [ecx+74h]` @ 0x41E67E, `add esp, 0Ch` @ 0x41E681 — cdecl, args `(type, value, engine)`.
  - Consommateur slot 30 `RenderGL_CommitRenderState` @ 0x438682 : `mov eax, [edx+0A84h]` @ 0x43869E lit le même champ `engine+0xA84`, applique bits `1<<type` : type 14 cull `and eax, 4000h` @ 0x438831 → `glDisable_CullFace` @ 0x438854 ; type 16 ZWRITE `and edx, 10000h` @ 0x43891A → `au_re_glDepthMask` @ 0x438951. Boucle write-shadow → commit-GPU fermée.
  - Miroir DDraw byte-identique `0x43B50C` : mêmes 15 instr (`mov ecx, [eax+0A84h]` @ 0x43B513, `mov [eax+edx*4], ecx` @ 0x43B52B), install @ 0x42560C dans `RenderBackend_Construct_DDraw` — slot 29 des deux backends.
  - Wiki QMD (`battle-address-catalog`, re-récupéré CLI car pack `wiki.md` cassé WinError 2) : « GL/DDraw write software shadow `*(engine+2692)[type]` only … GPU commit is slot 30 (`RenderGL_CommitRenderState`, bits `1<<type`) » — aligné.
- Notes parent: 15 instr, 1+P. §5.6 vert : leaf pure vérifiée, data xref unique exact, stride `type*4` développé, `jz` zero-check. `hexrays.c` pack cassé → re-récupéré MCP par A, conforme ASM (leftover EAX cosmétique, wrapper traite slot comme void). Question ouverte dirty-mask (`*(arg_0+0xC)` @ 0x438695 lu par commit) vérifiée parent : cette fonction n'en pose aucun — posé par un autre chemin, hors scope. Miroir DDraw 0x43B50C confirmé byte-identique par parent live.

## Analyse réconciliée

Handler GL du slot 29 de la vtable gfx-driver (+0x74, installé @ 0x42537C) : écrit purement logiciel d'une entrée de la table d'états de rendu « shadow » — `*(engine+0xA84)[type] = value` — avec NULL-guard silencieux ; zéro appel GL/D3D, commit GPU différé au slot 30 `RenderGL_CommitRenderState` (0x438682) qui lit la même table `engine+0xA84` et applique les états par bits `1<<type`.

In (cdecl, depuis wrapper 0x41E650) : `type` (index DWORD, borné [0,25] par le wrapper, pas ici), `value` (DWORD stocké), `engine` (ptr struct gfx, passé tel quel). Out : aucun retour exploitable (EAX leftover) ; le wrapper traite le slot comme void. Effet : `*(DWORD*)(*(engine+0xA84) + type*4) = value` si table non-NULL, sinon no-op. Pas de dirty-bit posé ici.

Miroir DDraw `Gfx_ShadowSetRenderState_DDraw` @ 0x43B50C byte-identique, slot 29 des deux backends. Le backend DDrawAlt a un switch D3D immédiat séparé (`RenderDDrawAlt_SetRenderState`, installé @ 0x4258C4), pas ce shadow.

Divergence Hex-Rays vs ASM : aucune — `v4 = *(_DWORD *)(a3 + 2692); if (v4) *(_DWORD *)(v4 + 4*a1) = a2;` conforme.

Questions ouvertes :
1. Dirty-mask du commit (`*(arg_0+0xC)` @ 0x438695) : qui pose les bits `1<<type` ? Un autre chemin que ce handler — à trancher dans une future passe.
2. Taille réelle de la table `engine+0xA84` : le commit écrit jusqu'à `+0x78` (index 30, ex. `mov [edx+78h], eax` @ 0x4386D5) alors que le wrapper borne `type` à [0,25] (0x68). Entrées 26–30 = cache interne driver ? à trancher.
3. Mapping bit complet du commit (464 instr) : vérifié sur 8 bits (types 1,2,3,9,13,14,15,16) ; types restants non lus — hypothèse `1<<type` généralisée, non prouvée exhaustivement.
