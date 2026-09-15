# Gfx_SubmitViewportLists @ 0x499EA0

- Confiance: CERTAIN
- Nom catalogue: confirme
- Mode: 1+V
- A==V: oui (V=ACCEPTE, réserves additives seulement)
- Push IDB: oui (`[semantic-triple 2026-09-15]`, append, save_database=True)
- Preuves:
  - File jobs viewport : `dword_1D2A6F4` records stride 0x14, base `0x1D2A308` (`word_1D2A312` = h record 0) ; record = `{ DWORD list@0x00 ; short x/y/w/h @0x04–0x0A ; BYTE flag@0x10 }` (7 octets non accédés)
  - Par record : viewport `sub_41E070(x,y,w,h,buf)` (flag posé → BL=0) ou maintien global (BL→1) ; walk `[base]` entre `Gfx_SetRenderState(2,0/1,buf)`
  - Sortie : restore global ssi BL==0 (`jnz @0x499F67` saute) ; reset `1D2A6F4=0` @ `0x499F5D` inconditionnel (`mov` n'écrit pas les flags) ; `1D2B0B8` inv seul, `1D2B0CC`/`1D2B0D4` walk+inv
  - Double garde signée (`test/jz` + `xor ebp,ebp` casse flags → 2ᵉ `test` + `jle`) ; borne relue chaque itération
  - Stack : 14h + 3×14h + 20h×iter + 1Ch ; ESI pushé si boucle seulement ; EAX leftover
  - 8 callers = boucles principales field/battle/menu/reward/intro/cdcheck/world
- Notes parent: §5.6 vert. Double investigation GLM 5.3 flash (A puis V sous-agents directs, gateway MCP down). V=ACCEPTE, A byte-exact. `Gfx_InvalidateDrawListStamp` = consommation NON prouvée (corps requis). BL = dirty-flag registre, zéro persistance. Occupancy 1+2 absente.

## Analyse réconciliée

# Sémantique Gfx_SubmitViewportLists @ 0x499EA0 (réconciliation 1+V = A, V=ACCEPTE)

- Rôle (1 phrase) : Flush fin-de-frame d'une file de jobs viewport — consomme `dword_1D2A6F4` records stride 0x14 (base `0x1D2A308`, `word_1D2A312` = champ h du record 0) ; par record : pose le viewport driver `sub_41E070(x,y,w,h,buf)` sur le rect du record (flag `[base+0x10]` posé, BL→0) ou maintient/restaure le global `Render_*` (BL→1), rend la draw list `[base+0x00]` entre `Gfx_SetRenderState(2,0/1,buf)` ; en sortie : re-pose le viewport global ssi BL==0, reset `dword_1D2A6F4=0` inconditionnel, invalide les stamps des 3 listes statiques `1D2B0B8` (inv seul) / `1D2B0CC` / `1D2B0D4` (walk+inv).
- Confiance : CERTAIN
- Nom catalogue : confirme
- In / Out / Effets : `int __cdecl(void)` (EAX = leftover du dernier `Gfx_InvalidateDrawListStamp` @ `0x499FC4`, retour factice) ; EBX/EBP/EDI sauvés, ESI pushé seulement si boucle entered (aucun pop sans push — les fast-paths `jz`/`jle` atterrissent en `0x499F5B` après le `pop esi @ 0x499F5A`). Stack : `14h` (sub_499A80) + 3×`14h` (viewports) + `20h`/itération (RS+walk+RS = 8 dwords) + `1Ch` (file = 7 dwords). BL = dirty-flag registre « viewport driver == global ? » — zéro persistance (aucun store).
- Preuves (3–8) :
  1. 106 instr, `0x130`. 8 callers = boucles principales field/battle/menu/reward/intro/cdcheck/world + `sub_4A24B0` (non nommée).
  2. Record : flag `mov al,[esi+6]` `test/jz` @ `0x499EDB–E0` ; 4 WORD `movsx` `[esi]/[esi-2]/[esi-4]/[esi-6]` ; list DWORD `[esi-0Ah]` @ `0x499F36`. Ordre args `(x,y,w,h,buf)` prouvé par pile aux 2 sites d'appel (`0x499EF6` record / `0x499F22` global) — identité structurelle. 7 octets/record non accédés (`0x0C–0x0F`, `0x11–0x13`) : layout = sous-ensemble observé.
  3. Double garde signée : `test/jz` @ `0x499EC3–C5` (fast-path sans push esi), `xor ebp,ebp` casse les flags → 2ᵉ `test` obligatoire @ `0x499ECD`, `jle` signé @ `0x499ECF`. Borne relue chaque itération (`mov eax, dword_1D2A6F4` @ `0x499F4A` avant `cmp/jl` @ `0x499F56–58`, reboucle vers `0x499EDB`).
  4. Reset `mov dword_1D2A6F4, 0` @ `0x499F5D` entre `test bl,bl` (0x499F5B) et `jnz` (0x499F67) : `mov` mémoire n'écrit aucun flag → ZF intact, reset inconditionnel sur toutes les sorties.
  5. `sub_499A80(0,0,0,0,0)` (5×`push 0`, `add esp,14h`) appelé AVANT la lecture du compteur : ne peut pas être le reset (sinon boucle morte, incompatible 8 callers/frame). Preuve par contradiction — corps hors pack.
  6. `Gfx_InvalidateDrawListStamp` : consommation NON prouvée (aucun store aux heads dans cette fonction) — stamp/génération ou consume, corps requis. Asymétrie : `1D2B0B8` invalidé sans walk.
  7. A==V byte-exact ; V=ACCEPTE avec réserves additives (7 octets/record, statut preuve sub_499A80, BL=1 contrat d'entrée fragile si un autre poseur de viewport custom existe).
- Questions ouvertes : rôle `sub_499A80` (handle buffer non passé) ; effet réel `Gfx_InvalidateDrawListStamp` ; producteurs des records (`0x1D2A308…0x1D2A6F4`) et sémantique des records sans flag ; identité `sub_4A24B0` ; sens de `SetRenderState(2,0/1)` ; contrat BL=1 à l'entrée.
