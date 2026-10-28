# PRODUCE C — volet A — 0x6D9510 (label-only: `Mat3S16_MakeRotY_Q12`)

- Mission: `ff8-decomp-semantics-20261011-r01`, groupe g34.
- Auteur: `pool-186` (`re-decompile-ensemble`), volet A de 2+1. Tâche: `task_mv44tnnw_00h7_k4hxy5`.
- Contexte factuel: historique projeté du lecteur factuel indépendant désigné
  (`ses_ed41f7454ffeMmUT62aU0vibC0`) — lectures gelées des 4 EA de g34 effectuées avant le fork. Aucune lecture de voisin/frère, d'autre volet, du ledger, d'un C antérieur de la cible, ou d'une autre session. Modèle: admission Pool25 par le lead uniquement (tâche: `openai/gpt-6.1-sol high`); le `Model.Ref` effectif appartient au lead, non auto-vérifiable depuis cette session.
- Statut: **non compilé, non exécuté, non revu** — CI/review/intégration = lead.
- Rôle: lecture-only, écriture seulement de ce fichier livrable.

---

## 1. Ground truth citée (gel fourni)

Fichier: `.tmp/ff8-decomp-semantics-20261011-r01/native/0x6D9510.json`

| Champ | Valeur |
|---|---|
| `native.idb` | `D:\Modding\ff8\retro-exe\FF8_EN.exe - 9.3.i64` |
| `native.input` | `C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII\FF8_EN.exe` |
| `native.bits` | 32 |
| `native.input_sha256` | `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570` |
| `native.exported_utc` | `2026-10-11T16:38:25.140966+00:00` |
| `chunks[0]` | start `0x6d9510`, end `0x6d9558` (0x48 = 72 octets) |
| `instruction_count` | 24 |
| `cfg` | 1 bloc `0x6d9510–0x6d9558`, aucun successeur (droit-ligne, zéro branche) |
| `code_targets` | `["0x56d100","0x56d130"]` |
| `name_label_only` | `Mat3S16_MakeRotY_Q12` — **étiquette IDA uniquement, pas une preuve de but** |

Couverture: 24/24 instructions, octets `0x6D9510–0x6D9557` inclus, aucun trou, aucun
contrôle indirect, aucune exception, zéro op d'E/S.

## 2. Annotated disasm (cité verbatim du gel)

```
006D9510: push    esi
006D9511: push    edi
006D9512: movsx   edi, [esp+8+arg_0]; Move with Sign-Extend
006D9517: push    edi
006D9518: call    Fixed_Sin4096_Q12; E3a: fild; *pi/2048 (flt_B6B980=0x3AC90FDB); fsin (D9FE); *4096.0 (flt_B69540); magic-double +0x80000000.
006D951D: push    edi
006D951E: mov     esi, eax
006D9520: call    Fixed_Cos4096_Q12; E3a: fild; *pi/2048 (flt_B6B980); fcos (D9FF); *4096.0 (flt_B69540); magic-double +0x80000000.
006D9525: mov     ecx, [esp+10h+arg_4]
006D9529: add     esp, 8; Add
006D952C: xor     edx, edx; Logical Exclusive OR
006D952E: mov     [ecx+4], si
006D9532: pop     edi
006D9533: neg     esi; Two's Complement Negation
006D9535: mov     [ecx+0Ch], si
006D9539: mov     [ecx], ax
006D953C: mov     [ecx+2], dx
006D9540: mov     [ecx+6], dx
006D9544: mov     word ptr [ecx+8], 1000h
006D954A: mov     [ecx+0Ah], dx
006D954E: mov     [ecx+0Eh], dx
006D9552: mov     [ecx+10h], ax
006D9556: pop     esi
006D9557: retn; Return Near from Procedure
```

## 3. Carte octets vérifiée (chaîne de frontières dérivée)

Preuve de méthode: chaque delta d'adresse de la liste annotée ci-dessus fixe la
longueur de chaque instruction; la somme vaut exactement `0x6d9558 - 0x6d9510 = 0x48`,
et le décodage octet-par-octet concorde frontière par frontière:

| VA | Octets | Instruction |
|---|---|---|
| 006D9510 | `56` | push esi |
| 006D9511 | `57` | push edi |
| 006D9512 | `0FBF7C24 0C` | movsx edi, word [esp+0Ch] (arg0, LIRE 16 bits, extension de signe) |
| 006D9517 | `57` | push edi (arg du 1er callee) |
| 006D9518 | `E8 133CE9FF` | call 0x56D130 (rel32 0xFFE93C13 = −0x16C3ED; ret 0x6D951D ⇒ 0x6D951D−0x16C3ED = 0x56D130) |
| 006D951D | `57` | push edi (arg du 2e callee) |
| 006D951E | `8BF0` | mov esi, eax (esi = sin32) |
| 006D9520 | `E8 DB3BE9FF` | call 0x56D100 (rel32 0xFFE93BDB = −0x16C425; ret 0x6D9525 ⇒ 0x6D9525−0x16C425 = 0x56D100) |
| 006D9525 | `8B4C24 18` | mov ecx, [esp+18h] (arg4 = dst, DWORD) |
| 006D9529 | `83C4 08` | add esp, 8 (cleanup appelant des 2 args callee) |
| 006D952C | `33D2` | xor edx, edx |
| 006D952E | `668971 04` | mov word [ecx+04h], si (+0x04 = sin.low16) |
| 006D9532 | `5F` | pop edi |
| 006D9533 | `F7DE` | neg esi (32 bits, AVANT troncature) |
| 006D9535 | `668971 0C` | mov word [ecx+0Ch], si (+0x0C = (−sin32).low16) |
| 006D9539 | `668901` | mov word [ecx+00h], ax (+0x00 = cos.low16) |
| 006D953C | `668951 02` | mov word [ecx+02h], dx (0) |
| 006D9540 | `668951 06` | mov word [ecx+06h], dx (0) |
| 006D9544 | `66C741 08 0010` | mov word [ecx+08h], 1000h — **[OF1]**, voir §7 |
| 006D954A | `668951 0A` | mov word [ecx+0Ah], dx (0) |
| 006D954E | `668951 0E` | mov word [ecx+0Eh], dx (0) |
| 006D9552 | `668941 10` | mov word [ecx+10h], ax (+0x10 = cos.low16) |
| 006D9556 | `5E` | pop esi |
| 006D9557 | `C3` | retn |

Champ hex compressé du gel (cité tel que reçu, 144 chars = 72 octets):
`56570fbf7c240c57e8133ce9ff578bf0e8db3be9ff8b4c241883c40833d2668971045ff7de6689710c668901668951026689510666c7411080016689510a6689510e668941105ec3`

## 4. ABI et pile — preuves dérivées du gel

Pile d'entrée: `[esp+0]=ret`, `[esp+4]=angle (WORD)`, `[esp+8]=dst (DWORD)`.

- `movsx edi, [esp+0Ch]` ⇒ lecture de arg0 **en WORD + extension de signe** après les 2 pushes (0x4+0x4+0x4). Le paramètre natif est un entier 16 bits; seuls les 16 bits bas de l'argument sont consommés.
- `mov ecx, [esp+18h]` à 006D9525: à ce stade la pile contient (`push esi`,`push edi`, arg-sin, arg-cos restés; les callees ont consommé seulement leur adresse de retour) — soit `esp+18h = entrée +8` = dst. Contrôlé arithmétiquement.
- `add esp, 8` juste après les 2 appels: les deux callees retournent avec `retn` simple (ils ne dépouillent PAS leurs args) — sinon le `pop edi / pop esi / retn` final dépilerait des adresses décalées. Convention callee: nettoyage par l'appelant (type __cdecl), 1 arg DWORD chacun, résultat 32 bits dans EAX (consommé comme 32 bits ici: `mov esi,eax` puis `neg esi` sur 32 bits).
- ESI est chargé (`mov esi,eax`) AVANT le 2e appel et consommé APRÈS ⇒ hypothèse ABI Win32 (registres callee-saved esi/edi préservés par les callees), rétro-appuyée par l'identique motif dans les gels de 0x6CF070 et 0x6ED1E0.
- Cette fonction: args uniquement sur pile (aucune lecture de registre d'arg avant écriture), pas d'EBX/EBP touchés (ni poussés), ESI/EDI restitués, EAX/ECX/EDX clobbered. Aucun `sub esp` interne. Pas de branche, pas de FP, pas d'appel à variations d'état observable dans ce bloc.
- Retour: aucun store architectural dans EAX après `006D9520` — à `retn`, EAX = cos32 résiduel (incident). Contrat `void` adopté; voir U2.
- Convention de nettoyage de CETTE fonction par ses appelants: non prouvable depuis ce seul gel (les gels des appelants ne sont pas possédés). __cdecl supposé, signalé en U3.

## 5. Constantes et sémantique exacte

- Q12: constante immédiate `0x1000` = 4096 (annotation gelée callee: `*4096.0 (flt_B69540)`; 1.0 = 4096 en Q12). Annotation gelée, non re-exécutée (U5).
- Angle: unité annotation-gelée `*pi/2048 (flt_B6B980=0x3AC90FDB)` — décodage f32 indépendant de 0x3AC90FDB ≈ 0.0015339806 = π/2048 ✓ (vérification arithmétique, pas une re-exécution) ⇒ 4096 unités/tour, compatible Q12/scale. Callee, pas cette fonction (U1).
- `neg esi` est opéré sur 32 bits AVANT troncature: pour tout X, `(−X) & 0xFFFF ≡ (−(X mod 2^16)) mod 2^16` (congruence mod 2^16) ⇒ les octets stockés sont identiques à une négation 16 bits. Divergence impossible sur les mots écrits. Cas limite: `neg` 32 bits déborde seulement si sin32 = INT32_MIN — impossible à prouver sans le corps callee (U6).
- Troncatures: stores 16 bits de la moitié basse (si/ax). En C: idiom `(int16_t)(uint16_t)x` force la troncature mod 2^16 puis la représentation; sur cible en complément à deux (MSVC compris) l'affectation directe int32→int16_t donne les mêmes bits.
- Aucun shift dans cette fonction (contrairement à 0x6ED1E0).
- Ordre des appels: **SIN puis COS** (006D9518, 006D9520) — ordre imposé par les octets.
- Ordre des stores conservé verbatim (dst[2] avant le `neg`; final cos en dernier).

## 6. C complet (production A)

```c
/* ============================================================
 * FF8_EN.exe — 0x6D9510
 * Handle label-only IDA: "Mat3S16_MakeRotY_Q12"
 * Volet A, mission run01, auteur pool-186 (re-decompile-ensemble).
 * Ground truth: .tmp/ff8-decomp-semantics-20261011-r01/native/0x6D9510.json
 *   input_sha256 064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570
 *   exported_utc 2026-10-11T16:38:25.140966+00:00
 * NON COMPILÉ — validation/build = lead.
 * ============================================================ */
#include <stdint.h>

/* dst = 9 words 16-bit consécutifs écrits à +0x00..+0x10 (18 octets).
   La lecture "matrice 3x3 col-major" est une INFÉRENCE structurelle
   (motif d'écritures + préfixe d'étiquette), pas une preuve. (U4) */
typedef int16_t Mat3S16[9];

/* ABI des callees — prouvée AU SITE D'APPEL:
 *   1 arg DWORD sur pile, retour EAX 32 bits (consommé 32 bits),
 *   callee retn simple ⇒ nettoyage par l'appelant (add esp,8 pour 2 appels),
 *   préservation ESI/EDI supposée (ABI Win32; usage in-packet rétro-appuyé).
 * Corps des callees NON possédé (U1): déclarés, pas reconstruits. */
extern int32_t __cdecl Fixed_Sin4096_Q12(int32_t angle);  /* VA 0x56D130 */
extern int32_t __cdecl Fixed_Cos4096_Q12(int32_t angle);  /* VA 0x56D100 */

/* Convention de CETTE fonction: args sur pile; __cdecl supposé côté
 * appelant (U3). arg0 lu en WORD (movsx) ⇒ int16_t.
 * Pas de valeur de retour architecturale (EAX incident = cos32) (U2). */
void __cdecl Mat3S16_MakeRotY_Q12(int16_t angle, int16_t *dst)
{
    int32_t s32;
    int32_t c32;
    int32_t ns32;

    /* Ordre d'appel imposé: SIN (006D9518) puis COS (006D9520). */
    s32 = Fixed_Sin4096_Q12((int32_t)angle);
    c32 = Fixed_Cos4096_Q12((int32_t)angle);

    ns32 = -s32;    /* 006D9533 neg esi — 32 bits avant troncature */

    /* Stores dans l'ordre ASM exact. */
    dst[2] = (int16_t)(uint16_t)s32;    /* +0x04 (006D952E mov [ecx+04h],si) */
    dst[6] = (int16_t)(uint16_t)ns32;   /* +0x0C (006D9535 mov [ecx+0Ch],si) */
    dst[0] = (int16_t)(uint16_t)c32;    /* +0x00 (006D9539 mov [ecx],ax)     */
    dst[1] = 0;                          /* +0x02 (006D953C mov [ecx+2],dx)   */
    dst[3] = 0;                          /* +0x06 (006D9540 mov [ecx+6],dx)   */
    dst[4] = 0x1000;                     /* +0x08 (006D9544, imm 1000h) [OF1] */
    dst[5] = 0;                          /* +0x0A (006D954A mov [ecx+0Ah],dx) */
    dst[7] = 0;                          /* +0x0E (006D954E mov [ecx+0Eh],dx) */
    dst[8] = (int16_t)(uint16_t)c32;    /* +0x10 (006D9552 mov [ecx+10h],ax) */
}
/* Remarque d'exécution native: à `retn`, EAX contient cos32 résiduel.
 * Aucune signature `int32_t` de retour n'est réclamée ici (U2). */
```

Motif d'écritures observé (fait, pas un verdict sémantique):
`w0=cos, w1=0, w2=sin, w3=0, w4=0x1000, w5=0, w6=−sin, w7=0, w8=cos`.
Interprétation col-major 3×3 (v'=M·v): x'=cos·x−sin·z; y'=y; z'=sin·x+cos·z —
rotation d'axe Y, conforme au PRÉFIXE d'étiquette uniquement (étiquette ≠ preuve).

## 7. Anomalie intra-gel [OF1] — relevée, non « réparée »

Lecture stricte du champ hex compressé reçu pour 006D9544:
`…66895106 | 66c741108001 | 6689510a…` → décodage strict
`66 C7 41 10 | 80 01` = `mov word [ecx+10h], 0x8001`,
ce qui contredit le désassemblage annoté du MÊME gel
(`mov word ptr [ecx+8], 1000h`), laisse +0x08 jamais écrite, et rend le
store final `[ecx+10h], ax` (006D9552) écrasant un 0x8001 mort.
Test croisé anti-glitch exporteur: le gel de 0x6CF070 contient la même classe
d'encodage `66c741100010` = `mov word [ecx+10h], 1000h` — imm16 petit-boutiste
correct chez le même exporteur ⇒ l'exporteur n'a pas d'habitude qui expliquerait
« 8001 ». La divergence est donc réelle dans la donnée reçue (ou dans mon rendu
de transcript de ces 12 chars — indiscernable d'ici). Toute re-vérification
octets m'était refusée cette session (`read` → permission denied sur `.tmp/...`;
Code Mode sans accès FS). NE PAS « réparer »:
- Lecture primaire adoptée pour le C: le désassemblage annoté (de plus, motif
  structurel homogène des 4 constructeurs du groupe: entrée identité = 0x1000)
  ⇒ `dst[4] = 0x1000`.
- Alternative exacte si la re-vérification octets favorable au champ hex:
  supprimer `dst[4] = 0x1000;` et insérer avant le dernier store
  `dst[8] = (int16_t)(uint16_t)0x8001;` (store mort, sans effet observable excepté +0x08).
- Demande au lead (pas exécuté ici): 6 octets à `0x6D9544` (attendu:
  `66 C7 41 08 00 10` vs `66 C7 41 10 80 01`), via IDB get_bytes — mapping
  VA→file-offset non fourni par le gel.

Zone d'effet de l'anomalie: uniquement le mot `dst[4]`.

## 8. Incertitudes (relevées, non comblées)

| # | Objet | État |
|---|---|---|
| U1 | Corps/contrat complet des callees 0x56D130/0x56D100 (bornes de valeurs, effets de bord FPU, préservation exacte) | gel voisin non possédé; annotations gelées citées; non désassemblés, non exécutés |
| U2 | Contrat de retour (void vs valeur dans EAX = cos32 résiduel; consommation par appelants) | gel des 13 appelants non possédé |
| U3 | Nettoyage d'args de CETTE fonction par ses appelants (__cdecl supposé) | preuve seulement interne (lecture args sur pile) |
| U4 | Nature 3×3 col-major de dst (9 mots = tout l'état consommable ?) | inférence structurelle; écritures bornées à +0x00..+0x10 (18 octets) |
| U5 | Lecture Q12 (1.0=4096) et unité d'angle (4096/tour) | annotation gelée + check f32 arithmétique; PAS re-exécuté |
| U6 | Overflow `neg` 32 bits (sin32 = INT32_MIN seulement) | impossible à exclure sans corps callee; sans effet sur les octets stockés (congruence mod 2^16) |
| U7 | Aliasing dst/stack-args/interruptions pendant la séquence | non observé; straight-line; non testé à l'exécution |
| U8 | `[OF1]` — mot +0x08 (voir §7) | UNCERTAIN, re-vérification octets demandée au lead |

## 9. Validations NON exécutées (déclarées, pas revendiquées)

- Compilation (aucun claim de build). Différence de comportement C/ASM non mesurée.
- Désassemblage des callees; lecture des 13 appelants; exécution/débogue; re-lecture octets du gel (permission refusée).
- Toute conclusion «rotation Y» reste une observation de motif, pas un verdict sémantique.

## 10. Annexe — compaction factuelle commune g34 (les 4 EA, mêmes échafaudages de gel)

Callees partagés: `Fixed_Cos4096_Q12 = 0x56D100`, `Fixed_Sin4096_Q12 = 0x56D130`
(résolus 4× indépendamment: 2 sites dans 0x6D9510, 2 sites dans 0x6CF070 — arithmétique rel32 ci-dessus; `code_targets` concordants).
Annotations FPU gelées identiques (citées, non dérivées): `fild; *pi/2048
(flt_B6B980=0x3AC90FDB; f32 ≈ 0.00153398 ✓); fsin/fcos; *4096.0 (flt_B69540);
conversion FTOL « magic-double +0x80000000 »`.

1) `0x56D090 — Mat3S16_MulByRotZ_Q12` (0x56D090–0x56D0F6, 0x66). Droit-ligne.
   Ordre d'appels inversé: COS (0056D09A) puis SIN (0056D0A2). Matrice 9-mots
   construite sur la pile locale (stores annotés: var_20=si(cos), var_1E=cx(−sin),
   var_18=si, var_1A=sin, var_1C/var_16/var_14/var_12=0, var_10=0x1000),
   puis `call sub_56C270` avec pushes `edx` (&matrice), `esi` (dst) et cleanup
   `add esp,10h` (couvre les 2 restes trig + 2 args ⇒ sub_56C270 = 2 args pile,
   INFÉRENCE d'arithmétique de pile, non vérifiée dans son gel).
   Retour: `mov eax, esi` (0056D0EE) ⇒ EAX = dst (retour pointeur PROUVÉ in-packet).
   xrefs_to: ≥8 visibles (0x56cd50-cluster ×6, 0x571c80, 0x6e9ab0; liste tronquée à l'affichage — décompte non vérifié).
2) `0x6D9510` — objet principal de ce dossier (§1–§8, complet: 24 insns, 13 xrefs).
3) `0x6CF070 — Mat3S16_MakeRotZ_NegSin_Q12` (0x6CF070–0x6CF0BA, 0x4A, 25 insns).
   SIN puis COS. Stores/anti-diagnostics vérifiés: +00=cos, +02=−sin
   (`mov edx,edi; neg edx` sur SIN — i.e. −sin32), +04=0, +06=sin (`di`),
   +08=cos (`ax`), +0A/+0C/+0E=0, +10=0x1000 (imm16 « 00 10 » hex ✓ cohérent
   exporteur). Même preuve ABI (add esp,8; retn simple; esi/edi préservés).
   xrefs_to (5, complet): `0x69ef60`, `0x6cea30`, `0x6d0c20`, `0x6d2f30`, `0x6ea920`.
4) `0x6ED1E0 — Mat3S16_MakeRotY_Scaled_Q12` (0x6ED1E0–0x6ED242, 0x62). Droit-ligne.
   Zero-fill DWORD ([+0,+4,+8,+0Ch,+10h]) puis angle NÉGATIF passé aux deux
   callees (`neg ebx` avant pushes), `imul` par scale (WORD, movsx) et
   `sar …,0Ch` (Q12 downshift arithmétique — arrondi vers −∞; différence
   sémantique C pré-C++20 à traiter par le producteur), re-mappage par neg et
   placement; m4 (+0x08) = scale (WORD `dx`), et `w0=cos·s`, `w2=sin`, `w6=−sin·s`,
   `w8=cos·s`, zéros ailleurs. xrefs_to ≥6 visibles (0x69a410, 0x69a5d0, 0x69cb10,
   0x6ed0c0, 0x6f8bf0, … tronqué), code_targets non vu (tronqué).
   NOTE: c'est un gel voisin du même groupe, cité pour contexte commun; son C
   n'appartient pas à ce livrable.

Chevauchements d'appelants (faits de gel): fn `0x69ef60` appelle 0x6D9510 (×2) et
0x6CF070; fn `0x6ea920` appelle 0x6D9510 (×2) et 0x6CF070; fn `0x6e9ab0` appelle
0x56D090 et 0x6D9510.

Toutes les étiquettes (`Mat3S16_*`, `Fixed_*`, `sub_*`) = handles label-only.

## 11. Inventaire des sources

- `.tmp/ff8-decomp-semantics-20261011-r01/native/0x6D9510.json` (lecture complète avant fork; re-accès refusé cette session — cité).
- `.tmp/ff8-decomp-semantics-20261011-r01/native/0x56D090.json`, `0x6CF070.json`, `0x6ED1E0.json` (lectures avant fork; re-accès refusé).
- `docs/missions/ff8-decomp-semantics-2026-10-11-run01/CONTRACT.md` (lu).
- `AGENT.md` (lu, partiel — outils IDA; hors périmètre de cette session offline).
- `docs/missions/ff8-decomp-semantics-2026-10-11-runn01/native-groups.json` (lignes 265–280, 661–695 vues avant fork; méta-blocs par EA lignes ~3548+ non revus).
- NON consultés (règles d'indépendance): tout C du volet B ou d'exécutions antérieures de la cible, ledger, sessions/compactions d'autres groupes, code réécrit « reimagination ».
