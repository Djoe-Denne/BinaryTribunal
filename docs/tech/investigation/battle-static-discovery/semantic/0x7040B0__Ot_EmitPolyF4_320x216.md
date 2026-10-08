# Ot_EmitPolyF4_320x216 @ 0x7040B0

- Confiance: CERTAIN (solo parent : dérivation ASM + §5.6 live, mode 1+P 37 instr. ≤ 80)
- Nom catalogue: confirmé (≥2 preuves hors nom IDA)
- Mode: 1+P (A = dérivation parent, P = §5.6 live)
- A==V: n/a (1+P)
- Push IDB: voir tag en date du jour (append-only, pas de rename, pas de SetType)
- Preuves §5.6 parent (live IDB 2026-10-08):
  - Mots de sommets:: `+8=0, +A=0, +C=320 (140h), +E=0, +0x10=0, +0x12=216 (D8h), +0x14=320, +16=216` — quad (0,0)/(320,0)/(0,216)/(320,216), coverage full-frame battle 320×216
  - `704108 mov [esi+4], cl` / `+5=dl` / `+6=cl` : R,G,B = `arg_0/arg_4/arg_8 × arg_C >> 12` (Q12, imul + sar 0Ch signé)
  - `dword [esi] = 05000000h` (code byte3=05h) ; `byte [esi+7] = 2Ah` (tag dispatch)
  - Tail: `push esi ; push (g_BattleOTBase+0x20) ; call 0x45C8E0 OtNode24_PoolAllocLink_Code1 ; add esp,8` — packet linked côté piscine OT battle (slot +0x20)
  - Retour: `lea eax, [esi+18h]` — EAX = pkt+0x18 = fin du paquet (prochain buffer), paquet 24 octets/6 dwords, `retn` sans imm16 → cdecl 5 args, caller cleanup
- Notes parent: cet éteur est celui du fond/quad plein-écran battle ; les 8 mots de coordonnées sont initialisés durs (pas d'arg de position).

## Analyse réconciliée

# Sémantique Ot_EmitPolyF4_320x216 @ 0x7040B0 (1+P)

- Rôle (1 phrase) : fabrique un paquet GPU POLY-F4 opaque plein-écran 320×216 (quad (0,0)-(320,0)-(0,216)-(320,216)) couleur RGB mise à l'échelle Q12 par un multiplicateur, dans le buffer pkt fourni, et le chaîne en tête de la table OT battle `g_BattleOTBase+0x20` via `OtNode24_PoolAllocLink_Code1` ; retourne pkt+0x18 (fin du paquet).
- Confiance : CERTAIN
- Nom catalogue : confirmé
- In / Out / Effets : cdecl, 5 args stack : `R, G, B` (bytes bases), `scaleQ12`, `pkt` (buffer d'écriture). Retour EAX 32 bits = `pkt+0x18`.
- Preuves (3-8, adresses ASM live) :
  1. `7040b5-7040e1` — coordonnées codées en dur 320/216 aux mots des 4 sommets (id quad full-frame).
  2. `7040ed-704109` : RGB = (arg*scale) >> 12 (imul + sar 0Ch) par canal, stockés bytes +4/+5/+6.
  3. `70410c : dword [esi]=05000000h` ; `704112 byte [esi+7]=2Ah` — en-tête paquet (tag dispatch 2A, code commande 05 (octet b3)).
  4. `704116-704126` : link `OtNode24_PoolAllocLink_Code1(g_BattleOTBase+0x20, pkt)` — même pool OT battle (capacity 0x60000).
  5. `704129 lea eax,[esi+18h]` — destination/end after 24 octets, retour.
- Questions ouvertes : sémantique exacte des tags 05h/2Ah dans la chaîne dispatch (table B7CD28 / g_PrimitiveWordStride), à caler lors de la close des tables (lot B/C).
