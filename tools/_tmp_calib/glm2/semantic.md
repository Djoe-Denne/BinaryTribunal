# Sémantique Gpu_PackDrawEnvPacket @ 0x45C0F0 (analyse calibration glm2)

- Rôle (1 phrase) : empaquette un DRAWENV PSY-Q (`env`) en paquet OT directement consommable par le GPU — tag OT (8 si `isbg`, sinon 5) + mots GP0 E3/E4/E5/E1/E2, plus un fill code 02 quand `isbg`.
- Confiance : CERTAIN
- Nom catalogue : confirme (wiki + asm alignés : DrawEnv, pas upload TIM, pas DrawOTTag ; feuille, aucun callee).
- In / Out / Effets :
  - In : `packet` (dst, DWORDs via [esi]), `env` (src, struct 0x18 octets ; EAX conservé). stdcall/cdecl 2 args via [esp+4]/[esp+8] après 3 pushes (ebx/esi/edi) + ebp save/load inline — prototype __cdecl OK.
  - Out : écrit 5 à 9 DWORDs dans `packet` : [0]=tag OT (0x08000000|addr24 si isbg, 0x05000000|addr24 sinon), [1]=E3 clip start (x&0x1FF, y&0x3FF), [2]=E4 clip end, [3]=E5 offset, [4]=E1 tpage (WORD env+14h & 0x9FF ; dfe env+17h→0x400 via neg/sbb ; dtd env+16h→0x200), [5]=E2 tex window ou 0 si `env+0Ch`==0, puis si isbg : [6]=fill 02+RGB(env+0Eh..10h géométrie couleur — cf. preuve 5), [7]=env[0] DWORD, [8]=env+4 DWORD.
  - Effets : aucun global, aucun call, EAX=a0/esi=a4/edi/ebx calle-saved restitués (edi/esi/ebx popped). Retour EAX = `env` (garbage-in, prototype s16* nominal).
- Preuves (opcodes cités) :
  1. Tag OT : `bl=[eax+18h]; test bl,bl; jz` → branche `or ecx,8000000h` vs `or edx,5000000h`, tous deux après `and,0FFFFFFh` (masque 24 bits — `unk_FFFFFF` Hex-Rays = leurre d'objet).
  2. Adresse tag = `[esi]+addr` brute : `mov ecx,[esi]` avant le OR → le low-24 du mot 0 du packet est réutilisé comme adresse OT (comportement PSY-Q SetDrawEnv/DrawOTag naming).
  3. E3/E4 : `movsx ecx,word [eax+2]`/`+0`/`+6`/`+4`, `and,1FF`/`3FF`, `shl 0Ah`, OR 0FFF8C000h/0E4000000h → GP0 E3 (start) packet[1], E4 (end) packet[2] à `0E4…` + masques `7FC00h/3FFh` pour w/h (clamped -1 : `lea ecx,[edi+ecx-1]`).
  4. E5 : `dx=[eax+8] and 7FF`, `cx=[eax+0Ah]` shl 0Bh, or 0FFFCA000h → packet[3] ; E1 : `cx=[eax+14h] and 9FFh`, dfe `dl=[eax+17h]; neg dl; sbb edx,edx; and 400h`, dtd `+16h→200h`, or 0E1000000h → packet[4].
  5. E2 conditionnel : `lea edi,[eax+0Ch]; test edi,edi; jz → xor ecx,ecx` — le « env == -12 » Hex-Rays est un artefact de lea ; si présent, empaquète `env+0Eh/+12h/+10h` TRX-style `not edx; and 0F8h` blocks + `sar edx,3; and 1Fh` (SAR, pas SHR — conforme tw PSY-Q).
  6. Fill isbg : `cl=[eax+1Bh]; dl=[eax+1Ah]; or ch,2; shl 8; dl=[eax+19h]; shl 8; or` → code GP0 02 + BGR en packet[6], puis copie DWORD : `edx=[eax+4]; ecx=[eax]; mov [esi+1Ch],ecx; mov [esi+20h],edx` → packet[7]/[8] = fill rect xywh.
  7. Callees : AUCUN (callgraph vide, retn 45c247) — feuille ; 47 xrefs code / ≥30 callers nommés (FFFieldDirector 0x471F70, GF_204Alexander_DrawOpcode35 0xB02540, GF_277Carbuncle, menus 0x4A3D20/0x4A4950…) = consommation généralisée dans les wrappers de rendu battle/field/GF.
  8. Wiki / globals alignés : tag 8 (isbg) ou 5, E3/E4/E5/E1/E2, fill 02 optionnel, superset de Gpu_PackClipRectPacket 0x45C940 ; divergence mineure confessée : le catalog E3b omet E5 alors que l'ASM le place à packet[3] — l'ASM gagne.
- Questions ouvertes :
  - Le nom exact retenu par le catalog E3b sans E5 — un renommage en `Gpu_PackDrawEnvPacket` reste le meilleur nom ; coût faible.
  - Signification exacte du low-24 écrit dans packet[0] : c'est l'adresse OT passée par le caller (pattern DrawOTTag de PSY-Q) — à confirmer sur 2–3 callers (ex. 0x471F70) avant CERTAIN sur ce sous-détail.
  - packet[6] RGB : spot exact BGR vs `{02, r, g, b}` packing — shl 8 successifs confirment B<<16|g<<8... ordre non distingué dans l'ASM seul (dl/ch/cx semantique PSY-Q standard).
