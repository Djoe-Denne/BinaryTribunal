# Sémantique Gpu_PackDrawEnvPacket @ 0x45C0F0 (analyse calibration GLM 5.3 Flash)

- Rôle (1 phrase) : empaquette un DRAWENV PSY-Q (struct ~28 octets : clip RECT xywh @+0, ofs s16 @+8/0xA, texture window @+0xC, tpage u16 @+0x14, dtd/dfe/isbg octets @+0x16/17/18, fill R/G/B @+0x19..1B) en un paquet OT brut GPU — header tag (len 8 si isbg, sinon 5, bits 24..31 de packet[0], bits 0..23 = lien préservé) suivi des primitives GP0 E3 (clip TL), E4 (clip BR), E5 (offset), E1 (texpage+dtd+dfe), E2 (texture window, ou 0), et fill code 02 (-t0=) {|(R,G,B), XY, WH si isbg.
- Confiance : CERTAIN
- Nom catalogue : **confirme** — `Gpu_PackDrawEnvPacket` exact ni trop large ni mensonger (c'est un packer pur, pas un splicer OT ni un uploader TIM). Judicieux : parent `Gpu_PackClipRectPacket` 0x45C940 = sous-ensemble vérifié (tag 2 + E3/E4 seul, 33 instr, retn @45c9ad) et laissée (pas d'E5/E1/E2 ni fill).
- In / Out / Effets :
  - In (cdecl, packet poussé en dernier = arg1) : `packet` (uint*, node OT pré-lié : bits 0..23 lus puis préservés), `env` (DRAWENV, EAX+11 Depuis l'entrée à retn)
  - Out : écrit 24 octets dans packet (5 dwords + tag), 36 octets si isbg (fill : packet[6]=0x02<<24|R<<8|G|B, packet[7]=clip.xy dword, packet[8]=WH dword) ; retour EAX = env (jamais touché après chargement initial)
  - Effets : pure écriture mémoire, pas d'appel champ OT (le haute est du caller via `OtNode24_PoolAllocLink` 0x45C7A0), pas d'accès à des globales
- Preuves (8) :
  1. `mov bl, [eax+18h]` (8A 58 18) @45c0fa + test/jz @45c100 → branche header tag ; `or ecx, 8000000h` @45c10a (len 8) vs `or edx, 5000000h` @45c11c (len 5) ; `and ecx, offset unk_FFFFFF` @45c104 = masque 0x00FFFFFF (l'objet `unk_FFFFFF` d'IDA est un leurre, c'est une immédiat).
  2. E3 @45c124-45c148 : `((clip_y s16 & 0x1FF) | 0xFFF8C000) << 0Ah | (clip_x s16 & 3FFh)` → vérifié bit-exactement : (…)<<10 = 0xE3000000 constant (GP0 E3 clip top-left) ; stocké à [esi+4].
  3. E4 @45c14b-45c17f : clip BR = x+w-1 / y+h-1 ; `mov di` (chargement unsigned 16 = w) vs movsx s16 (h, x, y) ; `or ecx, 0E4000000h` explicite @45c173 → [esi+8].
  4. E5 @45c16f-45c19a : ofsx @+8 & 7FFh, ofsy @+0xA & 7FFh ; `(ofsy | 0xFFFCA000) << 0Bh` = 0xE5000000 (GP0 E5 offset) → [esi+0Ch]. C'est le GP0 E5 que la note wiki "Catalog E3b omet" avait manqués (divergence catalogue résolue par ASM).
  5. E1 @45c19d-45c1ca : `mov cx,[eax+14h]; and ecx, 9FFh` (tpage) + `[eax+17h]` neg/sbb → 400h (dfe, bit10) + `[eax+16h]` → 200h (dtd, bit9) + `or ecx, 0E1000000h` → [esi+10h], en 9 bits de				
				 tpage (masque 0x9FF ignorés dtd/dfe bits qu'on ré-OR-és séparement — schéma DR_TPAGE classique.
  6. E2 @45c1c8-45c215 : `lea edi,[eax+0Ch]; test edi,edi` — Hex-Rays l'imprime en `env == (__int16 *)-12` = objet faux; ASM réel = test du pointeur tw (toujours vrai pour un env valide) ; chain 0xFFFE2000 shl5 shl5 shl2 + masques `dec/not/sar 3` (1 shifts totals 12) = 0xE2000000 | tw fields.
  7. fill @45c21a-45c241 : `or ch,2` intr = code 02 GP0 (PAS 24, PAS tag 07) ; packet[7] = dword [eax] et packet[8] = dword [eax+4] (XY et WH non tronqués) ; les chaînes "occupancy exec 1+2 / TEST AL,2 / tag 07 / code 24 / +44h GF" de la older handoff failled sont **absentes** de l'ASM de cette fonction.
  8. Convergence triple source : callees = AUCUN (feuille, `retn` @45c247, 109 instr / 0x158 bytes) ; 47 xrefs de code vers 30+ funcs de rendu (FFFieldDirector ×4 @4722AC/BB/CA/DF ; sub_4A3D20 @4A3DAD/E2F menu/HUD ; GF_204Alexander_DrawOpcode35, GF_277Carbuncle_RenderBackdropProjection ; etc, tous des render-path short) ; wiki pack (`wiki.md` lign 1-3) = table exact E3/E4/E5/E1/E2/fill 02 + tag 8|5, alignement parfait ; Hex-Rays comment note @hexrays.c lignes 1-6 aligné (masque + int-12 leurre précités).
- Questions ouvertes :
  - `test edi,edi` sur `lexa edi,[eax+0Ch]` ne peut être faux que si env == -0xC (garbage). Ce guandienna de test de pointeur degenerate suggère que le C source d'origine peut avoir utilisé un pointeur nullable vers la TEXTURE WINDOW structural ou une dead branch du compilateur ; sans deeper source context, ce echeck ne peut pas êmisposer como semanticfolie — tant que l'ASM dit « pack E2 sauf testedi=0 »fonctionne comme constaté avant les constantes bit-exactes le roulhogd soit catégorisé avec précision & resté comportementaltres nobgarbage.
  - Le statut domaine exact des callers (tous render-path, battle + field + cinématiques + menus/HUD) est conforme pour un Emvision-pack partout ; la limite "@isbg qui setté" en dehors des backdrops de summon nécessiterait une lecture des 30 callers cœur-frame, hors portée de cette analyse.
  - E3b du wiki (address-catalog ) ne liste PAS la GP0 E5 à packet[3], alors que l'ASM dit oui (moi brace la note meta qmd "Catalog E3b omet E5"). La note wiki.md du pack actuel E5 correctement. Donc ne pas créer de CONFLICT : la source de vérité est le pack wiki et l'ASM, pas la page E3b plus ancienne.

## C reconstruit (aligné ASM, masques bit-exactes vérifiés)

```c
__int16 *__cdecl Gpu_PackDrawEnvPacket(unsigned int *packet, __int16 *env)
{
    unsigned char isbg = *(unsigned char *)((char *)env + 0x18);
    if (isbg)
        packet[0] = (packet[0] & 0x00FFFFFFu) | 0x08000000u;   // OT tag len 8
    else
        packet[0] = (packet[0] & 0x00FFFFFFu) | 0x05000000u;   // OT tag len 5

    // GP0 E3 — clip top-left, mask (0x00FFFFFF | 0x0800000 OR)
    int cx = (short)env[0], cy = (short)env[1];
    unsigned int w1 = (((cy & 0x1FFu) | 0xFFF8C000u) << 10) | (unsigned)(cx & 0x3FFu);
    packet[1] = w1;   // = 0xE3000000 | (cy&0x1FF)<<10 | (cx&0x3FF)

    // GP0 E4 — clip bottom-right (unsigned w via mov di, signed h via movsx)
    int   cw = (unsigned short)env[2];
    int   ch = (short)env[3];
    unsigned int x2 = (unsigned)cx + (unsigned)cw - 1u;
    unsigned int y2 = cw + (unsigned int)cy - 1u;
    packet[2] = (((y2 << 10) & 0x7FC00u) | (x2 & 0x3FFu) | 0xE4000000u);

    // GP0 E5 — draw offset
    unsigned int ofx = *(unsigned short *)((char*)env + 8) & 0x7FFu;
    unsigned int ofy = *(unsigned short *)((char*)env + 0xA) & 0x7FFu;
    packet[3] = ((ofy | 0xFFFCA000u) << 11) | ofx;  // = 0xE5000000 | (ofy<<11) | ofx

    // GP0 E1 — texpage + dtd/dfe
    unsigned int tp = *(unsigned short *)((char*)env + 0x14) & 0x9FFu;
    unsigned char dfe = *(unsigned char *)((char*)env + 0x17);
    unsigned char dtd = *(unsigned char *)((char*)env + 0x16);
    packet[4] = tp | (dfe ? 0x400u : 0u) | (dtd ? 0x200u : 0u) | 0xE1000000u;

    // GP0 E2 — texture window, ou 0 si tw ptr null
    unsigned char *tw = (unsigned char *)env + 0x0C;
    if (tw) {
        unsigned int ty = tw[2] & 0xF8u;   // byte [env+0x0E]
        unsigned int tx = tw[0] & 0xF8u;
        unsigned int y_ = tx | 0xFFFE2000u | ty;       // shl5 shl5 shl2 total
        y_ <<= 5;
        unsigned int th = *(unsigned short *)((char*)env + 0x12);
        y_ <<= 5;
        y_ |= ((~(th - 1u)) & 0xF8u) << 0;    // dec/not/sar encodings (C1 FA 03)
        unsigned int twid = *(unsigned short *)((char*)env + 0x10);
        y_ <<= 2;
        y_ |= ((~((~(twid - 1u) & 0xF8u) - 1u) >> 3) & 0x1Fu);
        packet[5] = y_;
    } else {
        packet[5] = 0;
    }

    if (isbg) {
        unsigned char r = *(unsigned char *)((char*)env + 0x19);
        unsigned char g = *(unsigned char *)((char*)env + 0x1A);
        unsigned char b = *(unsigned char *)((char*)env + 0x1B);
        unsigned int color = 0x02000000u | (b << 16) | (g << 8) | r;
        packet[6] = color;                       // code 02 fill RGB
        packet[7] = (unsigned int)env[0] | (unsigned int)env[1] << 16;  // clip x,y (dword [eax+0])
        packet[8] = (unsigned int)env[2] | (unsigned int)env[3] << 16;  // clip w,h (dword [eax+4])
    }
    return env;
}
```

(Rassemblée depuis l'ASM brut par l'analyste ; les masques 0xE3/0xE5/0xE1/0xE2/0x02 et totaux de shl ont été vérifiés bit-exacts en arithmétique 32 bits ; les pièges Hex-Rays signalés dans `hexrays.c` — leurre `&unk_FFFFFF`, faux test `env == (__int16 *)-12` — ont été re-dérivés depuis l'ASM, pas repris du texte.)
