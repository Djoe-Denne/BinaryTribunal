# Sémantique B — 0x47DE70 (g08)

- Mission : ff8-decomp-semantics-20261011-r01
- Rôle : auteur sémantique B, lecteur factuel indépendant
- Entrée : `inputs/ff8-decomp-semantics-20261011-r01/g08/0x47DE70.json`
- Périmètre : bytes `0x47DE70–0x47DF60` (240 octets), 75 instructions du gel, CFG et xref du gel
- `name_label_only` du gel (`domain::BattleCallback_StageGroup0Reactions_B`) et les commentaires IDA ne sont pas des preuves

## Nom proposé

`Battle_EnqueueFirstSlotMatchingSelectorThenCommit` — confiance **LIKELY** pour le rôle local (garde, parcours, enqueue conditionnel, deux nettoyages d’octets, puis trois appels). Confiance **UNCERTAIN** pour tout vocabulaire métier (réaction, groupe 0, callback, mort, ATB, commit de sauvegarde) : il vient des symboles/commentaires du gel, pas d’un second site lu ici.

## Rôle

Fonction feuille `retn` sans argument stack. Elle lit un octet de slot courant, appelle `0x484180(slot)`, et **retourne immédiatement si EAX != 0**, sans écriture locale ni appels suivants.

Sinon elle met le dword `0x1D27B00` à 0, puis, sous plusieurs gardes, parcourt un compteur externe `edi` et, pour chaque valeur, le **premier** des 7 enregistrements de pas `0xD0` dont l’octet sélecteur égale `edi` et l’octet voisin est non nul. Ce couple est ensuite mis à 0. Un appel à trois arguments vers `0x484720` a lieu sauf dans le cas particulier « octet == 2 et bit 0 du statut à 1 ».

Toute sortie autre que l’échec de `0x484180` enchaîne `0x48D1F0`, `0x48B8B0`, puis `0x494A60(slot courant)`.

## Entrées

| Source | Usage mécanique |
| --- | --- |
| octet `0x1D27B0F` | zero-extend dans EAX puis argument de `0x484180` ; relu en fin pour `0x494A60` |
| octet `0x1CFF6E7` | si != 0, le parcours est sauté (`0x47DE99`) |
| octet `0x1D28DF9` | si != 1, les deux appels `0x4860A0` / `0x4860D0` sont exigés |
| EAX de ces deux appels | le parcours est sauté si EAX vaut exactement `0xFF` |
| octet `0x1D28DF8` | borne exclusive du compteur `edi` ; `jbe` vers l’épilogue si l’octet est 0 |
| dword `0x1D28DF8` | relu à chaque tour ; seule la partie basse `& 0xFF` borne `edi` |
| `0x1D27BD7 + n*0xD0` et l’octet `+1` | paire testée pour n = 0..6 |
| octet `0x1D27B90 + n*0xD0` | testé **bit 0 seulement**, et seulement si l’octet de type vaut 2 |

Aucun paramètre entrant par la pile. `ebx` est mis à 0 et sert de zéro ; `edi` est le compteur externe ; `ecx` est l’index d’enregistrement ; `esi` = `ecx * 0xD0`.

## Sorties et effets

- Échec de `0x484180` : aucun effet local. EAX reste le retour non nul de ce callee. `retn`.
- Sinon, avant toute garde métier : `dword [0x1D27B00] = 0`.
- Pour chaque `edi` de 0 inclus à `(byte 0x1D28DF8) - 1` : un seul enregistrement au plus est retenu, le plus petit index `ecx` tel que `[base+1] == edi` **et** `[base] != 0`.
  - Si `[base] == 2` et `([0x1D27B90 + esi] & 1) != 0` : pas d’appel `0x484720`.
  - Si `[base] == 2` et bit 0 à 0 : `call 0x484720(ecx, 2, 0)`.
  - Sinon : `call 0x484720(ecx, byte_type & 0xFF, 0)`. Le `and eax, 0xFF` est nécessaire : `mov al` laisse les bits 8..31 issus du `lea` précédent (`ecx*3`).
  - Dans tous les cas de match, y compris le match type 2 avec bit 0 à 1 : les deux octets `base` et `base+1` sont écrits à 0.
- Les enregistrements de même sélecteur mais d’index supérieur ne sont pas consommés dans cet appel : après un match, le code ne reprend pas le scan interne, il incrémente `edi`.
- Un sélecteur égal à `edi` avec l’octet de type à 0 est ignoré et le scan continue.
- Épilogue commun hors échec initial : `call 0x48D1F0()` ; `call 0x48B8B0()` ; `call 0x494A60(zero_extend(byte 0x1D27B0F))` ; restauration `esi` seulement si le parcours a été entré ; `pop edi` ; `pop ebx` ; `retn`.
- EAX au retour normal n’est pas produit localement : c’est le retour de `0x494A60`. Cette fonction ne fixe ni AL, ni AX, ni un code de statut propre.
- ABI : cdecl, callee-saved `ebx`/`esi`/`edi` équilibrés. Les trois appels à arguments font `add esp` de 4 ou 12. Pas de valeur de retour stack.

## Contrôle

1. `0x484180` != 0 → `0x47DF5F` (`retn`).
2. octet `0x1CFF6E7` != 0 → `0x47DF42` (trois appels, pas de parcours).
3. octet `0x1D28DF9` == 1 → saut des deux tests `0xFF`.
4. sinon `0x4860A0` ou `0x4860D0` retourne exactement `0xFF` → `0x47DF42`.
5. octet `0x1D28DF8` <= 0 → `0x47DF42`.
6. boucle externe `edi`, relance à `0x47DED0` tant que `edi < (dword & 0xFF)` via `jl` signé. Les valeurs réelles sont 0..255, donc équivalent à un comparateur non signé sur cet intervalle.
7. boucle interne : `eax` part de `0x1D27BD7`, `add eax, 0xD0`, `inc ecx`, continue tant que `eax < 0x1D28187` (`jl` signé). `0x5B0 / 0xD0 = 7`. Les adresses sont dans `0x1D27xxxx`, positives en int32, donc `jl` coïncide ici avec une comparaison d’adresses.

`esi = ((ecx + (ecx*3)*4) << 4) = ecx * 208 = ecx * 0xD0`. L’indexage final et le pas du curseur décrivent le même enregistrement.

## Confiance

- **CERTAIN** : décodage des branches, du pas `0xD0`, des 7 slots, de l’ordre des `push`, du masque `0xFF`, des deux stores à zéro, du store dword `0x1D27B00`, de la garde EAX non nul, et du fait que le bit testé est le bit 0 d’un octet.
- **LIKELY** : le premier argument de `0x484720` est un index de slot 0..6, le deuxième un identifiant pris dans l’octet de type, le troisième la constante 0. Le rôle « mettre en file un identifiant par sélecteur » suit de cet appel et du clear immédiat.
- **UNCERTAIN** : sens des symboles du gel (`BATTLE_RESULT_CODE`, `ATTACKER_SLOT_ID_0`, `target_reaction_type`, `attack_sequence_id`, `status_1`, compteurs d’alliés/monstres, commit HP/magie, ATB). Le commentaire du gel sur `0x4860D0` se contredit (nom « Count » versus « index restant, pas un compteur »). Le commentaire de `status_1` cite des bits `0x100`/`0x200` qu’un `test byte ptr, 1` ne peut pas observer.
- **CONFLICT** : aucun conflit d’opcodes dans le gel. Conflit commentaire/opcode sur la largeur du test de statut, noté ci-dessus ; l’opcode prime.

## Preuves

1. `0x47DE70–0x47DE82` : `xor eax,eax` / `mov al,[0x1D27B0F]` / `push eax` / `call 0x484180` / `add esp,4` / `test eax,eax` / `jnz 0x47DF5F`. Garde totale, argument zero-extended.
2. `0x47DE93` : `mov dword [0x1D27B00], ebx` avec `ebx==0`, placé avant le `jnz` de `0x47DE99`, donc effectué même si le parcours est ensuite sauté.
3. `0x47DED2–0x47DEEF` : curseur `0x1D27BD7`, pas `0xD0`, arrêt `eax < 0x1D28187`. Sept pas exacts.
4. `0x47DED9–0x47DEE2` : match si octet `+1` égal à `edi` et octet `+0` différent de 0. Sinon slot suivant.
5. `0x47DEF3–0x47DEF9` : `esi = ecx * 0xD0`, même pas que le curseur.
6. `0x47DF02–0x47DF21` : type 2 et `test byte [0x1D27B90+esi], 1` non nul → pas de call ; sinon `push 0` / `push id` / `push ecx` / `call 0x484720` / `add esp,0Ch`. Pour type != 2, `and eax,0xFF` avant le push de l’id.
7. `0x47DF24–0x47DF2A` : `mov [0x1D27BD8+esi], bl` et `mov [0x1D27BD7+esi], bl` après le match, y compris sans enqueue.
8. Xref gel : un seul antécédent `0x47E0C8` dans la fonction `0x47E080` (`type` 1, `iscode` false dans le JSON). Cibles code : `0x484180`, `0x4860A0`, `0x4860D0`, `0x484720`, `0x48D1F0`, `0x48B8B0`, `0x494A60`.

## Faits, interprétation, hypothèses

- Fait : la constante poussée en dernier argument avant `0x484720` est 0. L’appeler « groupe 0 » est une lecture du commentaire de `0x484720`, pas un effet visible dans cette fonction.
- Fait : l’octet `0x1D28DF9 == 1` contourne deux appels dont le gel affirme des sens contradictoires. On ne retient que « EAX == 0xFF annule le parcours ».
- Interprétation LIKELY : l’octet `+1` est un sélecteur d’itération, pas un index de slot. L’index de slot est `ecx`.
- Hypothèse non retenue : les listes de flags et le rôle « commit save / ATB » des callees `0x48B8B0` et `0x494A60`. Non vérifiés dans ce gel.

## Questions ouvertes

- Que signifie EAX != 0 au retour de `0x484180`, et pourquoi cette branche omet-elle le store `0x1D27B00` et les trois appels d’épilogue ?
- `0x4860A0` et `0x4860D0` : compteurs, ou index dont `0xFF` veut dire « aucun » ? Le gel ne tranche pas.
- Pourquoi la borne externe est l’octet `0x1D28DF8` plutôt que 7, et que représente l’octet voisin `0x1D28DF9` quand il vaut 1 ?
- Plusieurs slots peuvent-ils porter le même sélecteur ? Ce code n’en traite qu’un par valeur de `edi`.
- Le bit 0 de `0x1D27B90` bloque l’enqueue seulement pour le type 2. Les autres types sont enfilés sans ce test. Est-ce voulu ?
- EAX de retour de la fonction est celui du dernier callee. Un appelant qui le teste serait à confirmer dans `0x47E080`, hors de ce gel.
