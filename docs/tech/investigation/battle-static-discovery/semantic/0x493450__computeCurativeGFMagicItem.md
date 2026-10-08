# computeCurativeGFMagicItem @ 0x493450 — tranchage CONFLICT (2+1 solo réduit)

- Confiance: CERTAIN (tranché contre l'ASM live — réglement CONFLICT)
- Mode: 2+1 réduit solo (A+B non spawnables) : dérivation parent double passe + §5.6 live ; R synthèse = parent
- Verdict CONFLICT : CONTRE L'ASM — le rôle est bien le calcul de soin/curatif GF (types 9/14/15) ; non damage-barbre.
- Push IDB: oui, [semantic-triple 2026-10-08], pas de rename
- Preuves §5.6 parent (live IDB 2026-10-08):
  - `493453 call domain__Battle_GetRandomInt` + idiv 0x64 + `cmp eax (HIT_ATTACK_HITPERCENT & 0xFF), edx (rand%100+1)` ; `jle loc_493589` : `HIT_TYPE_2 |= 4` (flag MISS) et ret 0
  - Stride `0x1D0` (464 = slot F_CHAR) confirmé par `lea edx,[ecx*8]; sub edx,ecx; lea eax,[ecx+edx*4]; shl eax,4` = `ecx*29*16 = ecx*0x1D4`? — non : `ecx + ecx*7*4 = ecx*29`, `shl 4 = ecx*464` (0x1D0 = 464). `BATTLE_SLOT_DATA.max_hp[eax]` / `QUISTIS_CURRENT_HP[eax]` = champs du slot 0x1D0 — cle lot D à réutiliser lot D (ParseVertices) puis mis au récap (cf. cross-check)
  - branch switch : type 14 → `lea [ebp*5]; lea [ + eax*4]; shl 1` = **50*power** ; type 15 → `max_hp(target)*power` puis `(and 15 + add + sar 4)` = **max_hp/16** ; type 9 → `max_hp(target) - curHP(q)(ed target)` = missing-HP
  - `ATTACK_FLAG & 3 == 2` + attacker_slot < 3 + `CHARA_ABILITIES[attacker*464] & 2` → `shl eax,1` (Med Data double heal)
  - `BATTLE_SLOT_DATA.status_1[target*464] & 0x40` (Zombie) → `neg eax` (inverser le signe)
  - `HIT_ATTACK_ENABLER` + d100+1 gate → `checkDoubleStatusApply(edi target, ebp power, edx HIT_STATUS_1, ecx HIT_STATUS_2)` à 49357b (4 args, pushes droite→gauche, `add esp,10h`)
  - retour : EAX = garantie soin calculé (valeur signée), ou 0 sur miss ; ABI: test sign on `test/jge` (signed compare).
- Notes parent: drape flags via HIT_TYPE_2 : |= 4 = miss ; ~ bit0 = cas negative heap.

## Analyse réconciliée

# Sémantique computeCurativeGFMagicItem @ 0x493450

- Rôle (1 phrase) : calcul du soin/curatif GF uniquement (types 9/14/15) : hit roll d'entrée (HIT_ATTACK_HITPERCENT, sinon flag MISS et 0), valeur = type 9 (White Wind) → missing HP du target, type 14 → 50*power, type 15 → max_hp*power/16, default passthrough ; double si Med Data (attacker party, ability bit1), inversion signe si cible Zombie ; tirage HIT_ATTACK_ENABLER → appel `checkDoubleStatusApply(target, power, status1, status2)` ; retour EAX = valeur.
- In / Out / Effets : cdecl 4 args stack `p_gf_magic_type_damage, p_attack_power, p_attacker_slot_id, p_target_slot_id` (poussés droite→gauche) ; globals efet de bord ; `retn` sans imm16, EAX = valeur 32 bits.
- Preuves : cf. §5.6 (7 items, adresses).
- Questions ouvertes : sémantique detaille HIT_ATTACK_ENABLER (капacité crit gate) — pour lot I/crosscheck ; type "11/12/13" pas nécessaires (seulement 9/14/15 conflits race signal).
