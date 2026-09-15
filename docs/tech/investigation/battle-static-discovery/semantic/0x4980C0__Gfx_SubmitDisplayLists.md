# Gfx_SubmitDisplayLists @ 0x4980C0

- Confiance: CERTAIN
- Nom catalogue: confirme
- Mode: 1+V
- A==V: oui (V=CORRIGE mineur : ordre args cdecl RS, 3 sub_* pas 4, 15 appels pas 13)
- Push IDB: oui (`[semantic-triple 2026-09-15]`, append, save_database=True)
- Preuves:
  - Flush frame : 3 walks fixes sans garde (`1D2B0C4/C8/D0`) + 6 walks `test/jz` (`[1D2B0C0+48h/4Ch]`, `[1D2B0BC+48h/4Ch/50h/54h]`)
  - `Gfx_SetRenderState(2,0,buf)` entre les deux groupes ; `(2,1,buf)` final — scopés aux couches optionnelles
  - Stack batché exact : `24h` + 6×8 + `0Ch` = 96 = 9×8 + 2×12 ; `retn` nu
  - `dword_1D2B0CC` jamais touché ; occupancy/persistance absentes (lecture seule, aucun clear)
  - 11 callers = boucles principales field/battle/menu/worldmap/intro/cdcheck
- Notes parent: §5.6 vert. Double investigation GLM 5.3 flash (sous-agents A puis V), gateway MCP down → modele direct. V corrige details de preuve de A, role/nom inchanges. EAX leftover = retour `int` factice. Questions ouvertes : NULL-safety walks fixes, role sub_4B3550/4B36D0/4B3690, sens ID 2 / bool 0-1.

## Analyse réconciliée

# Sémantique Gfx_SubmitDisplayLists @ 0x4980C0 (réconciliation 1+V = A, V=CORRIGE mineur)

- Rôle (1 phrase) : Flush de fin de frame — résout le buffer (`FFGetBufferAddress`→ESI), ouvre via `sub_4B3550`/`sub_4B36D0`, soumet 3 listes fixes SANS garde (`1D2B0C4/C8/D0`), bascule `Gfx_SetRenderState(2,0,buf)`, soumet 6 listes optionnelles gardées `test/jz` (`[1D2B0C0+48h/4Ch]`, `[1D2B0BC+48h/4Ch/50h/54h]`), clôt via `sub_4B3690` puis `Gfx_SetRenderState(2,1,buf)` — sans jamais écrire aux globals ni vider les listes.
- Confiance : CERTAIN
- Nom catalogue : confirme
- In / Out / Effets : `int __cdecl(void)` ; EAX = leftover du dernier `Gfx_SetRenderState` (retour factice) ; ESI sauvé = buffer, arg3 de toutes les callees. Cleanup batché : `add esp,24h` (=3×8 walks + 0Ch RS1), 6×`add esp,8`, `add esp,0Ch`. `retn` nu. 15 appels : 9 walks + 2 RS + 3 sub_* + 1 FFGetBufferAddress. Occupancy / persistance ABSENTES (lecture seule intégrale, aucun clear 48h–54h, aucun flag consume).
- Preuves (3–8) :
  1. 78 instr, size `0xE1`, end `0x4981A1`. 11 callers = toutes les boucles principales (field/battle/menu/worldmap/intro/cdcheck + helpers UI).
  2. 3 walks inconditionnels zéro garde : `mov eax, dword_1D2B0C4` (0x4980D2) / `mov ecx, dword_1D2B0C8` (0x4980DE) / `mov edx, dword_1D2B0D0` (0x4980EB) → push/push/call. Contraste direct avec les 6 `test eax,eax; jz short` (0x49810D/0x498124/0x49813B/0x498151/0x498168/0x49817F).
  3. RS scopés aux couches optionnelles : `SetRenderState(2,0,buf)` @ 0x4980FD APRÈS les 3 fixes et AVANT les 6 optionnelles ; `(2,1,buf)` @ 0x498197 après tout. Wiki « RS(2,0/1) autour des walks extra » confirmé positionnellement. Ordre args cdecl : `push esi; push 0; push 2` → arg1=2 (ID état), arg2=0 (valeur), arg3=ESI (buffer) — V corrige la preuve 2 de A (inversée).
  4. Arithmétique stack exacte : 24h=36 (3×8+12) + 48 (6×8) + 0Ch=12 → 96 = 9×8 + 2×12. Zéro déséquilibre → cdecl callees confirmé.
  5. `dword_1D2B0CC` jamais touché (ni lu ni écrit) dans les 78 instr — slot voisin du bloc BC–D0.
  6. `sub_4B3550`/`sub_4B36D0`/`sub_4B3690` : 0 args visibles (aucun ECX/EDX/EBX positionné avant call ; EBX jamais chargé). Motif begin…flush…restore.
  7. A==V sur rôle/nom/confiance ; V=CORRIGE sur 3 détails factuels de A (ordre args RS, 3 sub_* pas 4, 15 appels pas 13). Conclusions conservées.
- Questions ouvertes : NULL-safety de `Gfx_WalkDrawList` sur les 3 listes fixes (crash latent si état initial vide ?) ; rôle des 3 sub_* (begin/flush/restore) ; sens ID 2 / bool 0-1 (activation puis restauration) ; writers de `1D2B0CC` ; nature des objets `1D2B0BC`/`1D2B0C0` (slots 48h–54h contigus).
