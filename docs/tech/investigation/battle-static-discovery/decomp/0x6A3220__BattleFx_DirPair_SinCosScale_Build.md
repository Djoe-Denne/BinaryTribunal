# BattleFx_DirPair_SinCosScale_Build @ 0x6A3220

- Instr (live): 36 (92 o, 0x6A3220-0x6A327B)
- Palier: 1+P (2 voix c_a + semantic_a, verification parent P + sondes)
- Verdict: CERTAIN - construit dans le tampon (3e arg) un bloc 20 octets de direction sin/cos Q12 scale : +0x00=cos*s, +0x04=-sin*s (neg @0x6A3263), +0x08=s brut, +0x0C=sin*s, +0x10=cos*s (5 dwords zeroes d'abord, imul signes + sar 0x0C @0x6A324A-60 via Fixed_Sin4096_Q12/Fixed_Cos4096_Q12), et retourne tel quel dans EAX le dword preserve a +0x14 (lu @0x6A3274, pose par l'appelant)
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: sub_6A3220\nTYPE ; proposition: BattleFx_DirPair_SinCosScale_Build
- Notes parent: checks 5.6 OK (role P) : 36 instr, Fixed_Sin4096_Q12 (0x6A323F) / Fixed_Cos4096_Q12 (0x6A3251), imul signes + sar 0xC (0x6A324A-60), neg sin (0x6A3263), retour [edi+14h] (0x6A3274) ; sonde IDA xrefs_to 0x6A3220 = 3 callers tous famille mag FX (sub_6A30F0 @0x6A3115 ferme, sub_6A32A0 @0x6A32C5, sub_6A3630 @0x6A3655) ; verdict UNCERTAIN de semantic_a leve par cette sonde

## C reconcilie

```c
// ============================================================================
// sub_6A3220 — cellule mag FX battle (famille 0x6A2-3xxx)
// ============================================================================
// Ground truth = live ASM (asm.asm, 36 instr @ 0x6A3220, size 0x5C) + meta.json,
// NOT Hex-Rays (hexrays.c utilisé seulement comme vérificateur — concordant ici).
//
// Instr (live) : 36
// Palier       : stub (mode 1+P) — rôle voix c_a
// Prototype IDA: int __cdecl sub_6A3220(int, int, _DWORD *)
//
// ASM live, résumé :
//   - zéroing 5 dwords de la struct out (offsets 0x00..0x13)
//   - sin = Fixed_Sin4096_Q12(angle)  [Q12, 4096 = 360°]
//   - cos = Fixed_Cos4096_Q12(angle)
//   - si = (sin * radius) >> 12   (imul 32-bit signé, sar 0Ch)
//   - ax = (cos * radius) >> 12
//   - stores WORD :
//       out+0x00 = ax  ( cos*r )
//       out+0x04 = si  (-sin*r , après `neg esi` à 0x6A3263)
//       out+0x08 = bx  ( radius, non tronqué au signe — stocké tel quel )
//       out+0x0C = si  ( +sin*r , stocké AVANT le neg à 0x6A3259)
//       out+0x10 = ax  ( cos*r )
//   - return eax = *(int*)(out + 0x14)  — dword LU mais JAMAIS écrit par cette
//     fonction : valeur laissée par l'appelant (le zéroing s'arrête à 0x13).
//     Hex-Rays `return a3[5]` concorde.
//
// Appels (cdecl, args poussés droite->gauche) :
//   0x6A323F  call Fixed_Sin4096_Q12   (arg : angle)  ; fild *pi/2048 ; fsin ; *4096.0
//   0x6A3251  call Fixed_Cos4096_Q12   (arg : angle)  ; fild *pi/2048 ; fcos ; *4096.0
//   0x6A325D  add esp, 8  (nettoie les 2 push ebp des deux calls)
// Aucun autre call, aucune library call.
//
// Sauvegardes de registres : ebx, ebp, esi, edi (push/pop dans l'ordre).
//
// Callers (callers.txt, fan-in 3) :
//   0x6A3115 (sub_6A30F0), 0x6A32C5 (sub_6A32A0), 0x6A3655 (sub_6A3630)
//
// Divergences Hex-Rays vs ASM : aucune. (Pièges écartés : retour largeur exacte
// = dword out+0x14 non initialisé ici ; neg esi polarité — out+0x04 = -sin*r,
// out+0x0C = +sin*r, ordre des stores confirmé par les EAs 0x6A3259/0x6A3263.)
// ============================================================================

// extern int Fixed_Sin4096_Q12(int angle);  // Q12 : retour 4096 = sin plein angle
// extern int Fixed_Cos4096_Q12(int angle);  // Q12 : retour 4096 = cos plein angle

int __cdecl sub_6A3220(int angle, int radius, _DWORD *out)
{
    int sin_r; // esi
    int cos_r; // eax (réutilise eax du retour de Fixed_Cos4096_Q12)

    // 0x6A3228..0x6A323C : zéroing 5 dwords (0x00..0x13), eax=0
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;

    // 0x6A323F : sin, 0x6A324A..0x6A324E : imul esi, ebx ; sar esi, 0Ch
    sin_r = (int)(Fixed_Sin4096_Q12(angle) * radius) >> 12; // Q12 >> 12

    // 0x6A3251 : cos, 0x6A3256..0x6A3260 : imul eax, ebx ; sar eax, 0Ch
    cos_r = (int)(Fixed_Cos4096_Q12(angle) * radius) >> 12; // Q12 >> 12

    // Stores WORD (troncature 16-bit implicite au store) — ordre ASM :
    *(short *)((char *)out + 0x0C) = (short)sin_r;  // 0x6A3259 : +sin*r (AVANT neg)
    *(short *)((char *)out + 0x00) = (short)cos_r;  // 0x6A3265 :  cos*r
    *(short *)((char *)out + 0x08) = (short)radius; // 0x6A3268 :  radius
    // 0x6A3263 : neg esi — polarité inversée pour l'offset 0x04 uniquement
    *(short *)((char *)out + 0x04) = (short)-sin_r; // 0x6A326C : -sin*r
    *(short *)((char *)out + 0x10) = (short)cos_r;  // 0x6A3270 :  cos*r

    // 0x6A3274 : lecture seule du dword à out+0x14 (hors zone zéroée 0x00..0x13)
    return *(int *)((char *)out + 0x14); // valeur posée par l'appelant, non modifiée
    // UNCERTAIN 0x6A3274 : sémantique du dword à out+0x14 (champ repris/validé
    // par l'appelant ?) — non déterminable depuis cette fonction seule.
}
```

## Analyse semantique

# Sémantique sub_6A3220 @ 0x6A3220 (analyse A, aveugle mode 1+P)

- Rôle (1 phrase) : Construit dans un tampon appelant (3e argument) un bloc de direction 20 octets basé sur sin/cos Q12 d'un angle scalé par une magnitude — cos·s, −sin·s, s brut, sin·s, cos·s — en zéroant d'abord les 5 dwords, puis retourne tel quel le dword préservé à +0x14.

- Confiance : **UNCERTAIN** — voir justification infra.
- Nom catalogue : aucun (IDA `sub_6A3220`, proto `int __cdecl(int, int, _DWORD *)`). Proposition markdown seule (PAS de rename) :
  **`BattleFx_DirPair_SinCosScale_Build(angle, scale, out)`**

## Justification du verdict

Le mécanisme ASM est intégralement établi opcode par opcode, mais CERTAIN exige callers + callees + wiki alignés :
1. **wiki.md du pack est vide** (« qmd failed » à la construction du pack) ; QMD ff8-wiki : aucune entrée pour `0x6A3220`, `sub_6A30F0`, `sub_6A32A0`, `sub_6A3630`, ni pour la famille 0x6A2-3xxx. Seule convergence indirecte : la convention Q12 « sin(x·π/2048)·4096 » est documentée (`battle-camera-architecture.md`) pour les helpers du même genre, mais ne dit rien du rôle de CETTE fonction.
2. **Corps des 3 callers non fourni** (callers.txt = liste d'xrefs seulement ; pas d'accès IDA) → je ne peux pas vérifier ce que les callers passent réellement comme angle/échelle ni ce qu'ils font du champ +0x14.
3. Le **retour EAX = dword [out+0x14] non initialisé par cette fonction** : contrat de retour ambigu (champ préservé par le zéroage limité à 0x00–0x13, mais sa sémantique est inconnue).

Le mécanisme, lui, ne souffre d'aucune ambiguïté : les 8 preuves adresses ci-dessous sont convergentes et le prototype IDA `int __cdecl(int,int,_DWORD*)` colle à l'ordre des lectures de pile.

## In / Out / Effets

- **In (cdecl, poussés droite→gauche)** :
  - `arg_0` @ [esp+0x14+arg_0] (lu 0x6a322c) = **angle** (unité : 1/2048 de tour ; passé tel quel aux deux helpers).
  - `arg_4` @ [esp+0x14+arg_4] (lu 0x6a3244) = **échelle/magnitude** (s32, tronquée s16 au stockage).
  - `arg_8` @ [esp+0x10+arg_8] (lu 0x6a3224) = **pointeur out** (edi).
- **Out (tampon out)** :
  - Zéroage 20 octets : dwords +0x00, +0x04, +0x08, +0x0C, +0x10 (0x6a3231–0x6a323c).
  - Champs s16 finaux : `+0x00 = cos·s`, `+0x04 = −sin·s`, `+0x08 = s` (brut), `+0x0C = +sin·s`, `+0x10 = cos·s`, où `s·sin|cos = (sin|cos_Q12(ang) × s) >> 12` (produits **imul signés**, shifts **sar** → polarité signée correcte).
  - Le dword **+0x14 n'est PAS zéroé ni écrit** : préservé.
  - Chaque champ s16 est logé dans le mot bas d'un dword pré-zéroé → les lecteurs doivent relire en **s16** (un read s32 d'un champ négatif donnerait une valeur zero-étendue fausse).
- **Retour** : EAX 32 bits (largeur pleine, pas de cas AL-only) = valeur **inchangée** du dword [out+0x14] telle qu'avant l'appel (0x6a3274).
- **Effets de bord** : 2 pushes temporaire `ebp` (angle) nettoyés par `add esp,8` @ 0x6a325d ; pas de globals touchées (globals.txt vide).

## Preuves (ASM cité, adresses exactes)

1. `0x6a3224 mov edi,[esp+10h+arg_8]` + `0x6a322c mov ebp,[esp+10h+arg_0]` : 3e arg = pointeur out (edi), 1er arg = angle (ebp, réutilisé pour les DEUX appels trigono) — cohérent avec le proto cdecl `(angle, scale, out)`.
2. `0x6a3231…0x6a323c mov [ecx+0/4/8/0Ch/10h], eax` avec `eax=0` (0x6a3228) : zéroage de 5 dwords = 20 octets, le champ +0x14 en est exclu.
3. `0x6a323f call Fixed_Sin4096_Q12` (présent dans callees.txt) : sin Q12 de l'angle ; commentaire callee E3a « ×π/2048, fsin, ×4096.0 ».
4. `0x6a324a imul esi,ebx` / `0x6a324e sar esi,0Ch` puis `0x6a3256 imul eax,ebx` / `0x6a3260 sar eax,0Ch` : composantes scalées en Q0 par l'arg_4 — imul/sar signés, polarité préservée.
5. `0x6a3259 mov [edi+0Ch],si` (sin·s positif) puis `0x6a3263 neg esi` et `0x6a326c mov [edi+4],si` : le sin est stocké **deux fois avec polarités opposées** en +0x0C et +0x04.
6. `0x6a3251 call Fixed_Cos4096_Q12` (présent dans callees.txt) ; `0x6a3265 mov [edi],ax` et `0x6a3270 mov [edi+10h],ax` : le cos est stocké **deux fois à l'identique** en +0x00 et +0x10 ; `0x6a3268 mov [edi+8],bx` : l'échelle brute en +0x08.
7. `0x6a3274 mov eax,[edi+14h]` juste avant les pops (0x6a3277–0x6a327b) : valeur de retour = dword +0x14, que la fonction n'a ni zéroé ni écrit → passe-through.
8. `callers.txt` : 3 xrefs code — `0x6a3115` (sub_6A30F0), `0x6a32c5` (sub_6A32A0), `0x6a3655` (sub_6A3630) — toutes dans la même famille 0x6A3xxx FX battle (contexte orchestrateur), `more:false` → fanout fermé.

## Checks demandés

- Callees cités présents dans callees.txt : ✓ `Fixed_Sin4096_Q12` (0x6a323f), `Fixed_Cos4096_Q12` (0x6a3251) ; aucun autre call (pas de library call inventé).
- Strides en nombres : champs s16 aux offsets 0x00/0x04/0x08/0x0C/0x10, dword préservé 0x14 ; si lecture en deux vec3 s16 → stride 0x0C entre les deux triplets (interprétation candidate, non prouvée).
- Polarités signées : ✓ imul + sar (arithmétique) + `neg` explicite ; aucun saut unsigned/ja-jb dans la fonction (aucune branchie du tout).
- Largeur retour : EAX 32 bits = dword [out+0x14] préservé (≠ trap AL-only).

## Interprétation candidate (à valider hors aveugle)

Le quadruplet (+0x00 cos·s, +0x04 −sin·s | +0x0C sin·s, +0x10 cos·s) est exactement la **matrice de rotation 2×2** [cos −sin ; sin cos] scalée par s, avec l'échelle logée en +0x08 — ou, de façon équivalente, un couple vecteur avant / vecteur latéral. L'écriture en deux vec3 s16 de stride 0x0C (v0=(cos·s, −sin·s, s), v1=(sin·s, cos·s, z_préservé)) est l'alternative la plus économique. Le rôle gameplay (direction de déplacement d'effet mag FX ? base orientée d'un sprite?) ne peut pas être tranché en mode aveugle.

## Questions ouvertes

1. Que fait le champ +0x14 (préservé ET retourné) : compteur, handle, z précédent d'un vec3 ? Les 3 callers le tranchent — à examiner avec accès IDA.
2. wiki.md vide (échec qmd à la construction du pack) : re-extraire la page wiki de la famille 0x6A3xxx.
3. Le même motif sin/cos scalé réapparaît-il dans sub_6A32A0 / sub_6A3630 (variantes X/Z vs Y ?) — suggère une famille de builders de direction.

## IDBCOMMENT proposé

Cree un bloc de direction de 20 octets dans le tampon passe en 3e argument : zero 5 dwords puis ecrit en s16 cos*s a +0x00, -sin*s a +0x04, echelle brute a +0x08, sin*s a +0x0C et cos*s a +0x10 (sin/cos Q12 via Fixed_Sin4096_Q12/Fixed_Cos4096_Q12, produit par l'echelle puis >>12). Ne touche pas le dword a +0x14 et le retourne tel quel dans EAX. Appellee par les 3 sites FX 0x6A3115, 0x6A32C5 et 0x6A3655 de la famille mag battle. [semantic-triple 2026-09-20]
