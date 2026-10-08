# TexStaging_BlitCLUTAlpha @ 0x4677D0

- Confiance: **CERTAIN statique** sur le comportement, pas sur la sûreté des entrées.
- Nom catalogue: **trop large** ; proposition markdown seule `TexStaging_Blit555SumToAlpha4`.
- Mode: **1+V**.
- Verdict V: **ACCEPTE**.
- A==V: oui sur rôle, nom, confiance et faits ASM ; V précise l'ordre de lecture CLUT haute en cas d'alias.
- §5.6 parent : 196 instructions / 35 blocs, aucun call, trois retours, deux xrefs CODE, cdecl huit mots et cleanups, signedness, stride/compacité, shift CL modulo32, ordre CLUT/stores et EAX relus live. Push `set_func_cmt` append-only `[semantic-triple 2026-10-08]`, tag relu ; `save_database=true` vérifié après ce push. Aucun rename ni patch octets.
- Sources: `tools/_tmp_semantic_triple/0x4677d0/semantic_a_sol.md`, `semantic_v_sol.md` ; C documentaire existant corrigé sans régénération.
- Couverture: live natif `lookup_funcs(0x4677D0)` puis `disasm`, **196/196**, `done=true`, taille **0x235**, plage `[0x4677D0,0x467A05)` ; A/V documentent **35 blocs CFG**, **0 call**, **3 ret C3** (`0x467886`, `0x467976`, `0x467A04`).

## Analyse réconciliée

Convertit des couleurs 555 indexées ou directes en WORDs contenant **uniquement un alpha 4 bits**, calculé par somme non pondérée des trois composantes, décalage et saturation à 15. Aucun mélange ni RGB préservé ; bit 15 source ignoré.

ABI : `cdecl(src_u8, src_pitch_bytes, dst_u16, dst_pitch_bytes, width, height, mode, clut_u16)`, **8 arguments** sur pile, pushes droite→gauche. Retour sémantiquement inutilisé chez les callers observés, type source `void` non récupéré avec certitude ; EAX résiduel décrit ci-dessous. EBX/EBP/ESI/EDI sauvegardés ; EBP est le curseur destination. A/V établissent les deux callers `0x464DB0` et `0x465720`, calls `0x464E9C` et `0x4657C5`. Le `add esp,24h` à `0x4657D0` inclut le push antérieur `0x46573F` : **pas de neuvième argument**.

Pour une couleur zéro-étendue `c` :

```c
sum = (c & 31u) + ((c >> 5) & 31u) + ((c >> 10) & 31u);
shift = ((uint32_t)dword_1CA89E8 + 3u) & 31u;
/* sortie WORD = min(sum >> shift, 15) << 12 ; bits 0..11 nuls */
```

- **Mode 0 — compact** : nibble bas puis haut, CLUT WORD sur indices 0..15 ; `N=width/2` signé tronqué vers zéro (`cdq/sub/sar`, `0x467897–0x46789E`). Pour largeur positive, N octets consommés et 2N pixels écrits par ligne ; dernier pixel impair abandonné. Source avance net de `src_pitch`, destination compacte `4*N` octets/ligne, **dst_pitch ignoré**.
- **Mode 1 — indices u8** : lecture CLUT WORD (`0x46781B–0x467823`), puis un WORD alpha seul par pixel ; pitches en octets, depuis les bases de lignes (`0x467863–0x46787C`).
- **Mode 2 — direct** : couleur WORD zéro-étendue (`0x4679A0–0x4679A2`), **sans lecture CLUT** ; mêmes pitches par bases de lignes (`0x4679E1–0x4679FA`).
- Autres modes : aucune écriture. Hauteur `<=0` rejetée par **jle signé** ; largeur seulement testée contre zéro, pas contre les négatifs.
- **EAX résiduel, pas un statut** : width en modes 1/2 après traitement, N en mode 0 ; sans lignes, height en 1/2 et N en 0 ; mode invalide, mode. Les deux callers écrasent EAX immédiatement (A/V).

## Deux corrections C exactes, vérifiées sur ASM live

1. `0x4677D0` charge le global, `0x4677DB` fait `lea ecx,[eax+3]` ; les SAR CL (`0x46783E`, `0x4678F0`, `0x467923`, `0x4679BC`) masquent le compte sur 5 bits. C corrigé : `uint32_t shift = ((uint32_t)global + 3u) & 31u`, avec `<stdint.h>`. Addition wrap32 avant le masque ; global=29 donne shift=0, pas 32. Les quatre décalages existants restent inchangés.
2. Mode 0 : `mov si,[ebx+edi*2]` à **0x467901** capture la couleur CLUT haute **avant** `mov [ebp+0],dx` à **0x467908**. C corrigé : `hi=clut[byte>>4]` avant `d[0]=...`, puis `color=hi`. Préserve cet ordre même si CLUT et destination se recouvrent ; aucune protection d'alias inventée.

Deux preuves du nom proposé : `0x46783E–0x46784D` aboutit à `a<<12` seul, et `0x4679A0–0x4679CB` convertit une couleur directe sans CLUT. Le nom historique ne couvre pas précisément ces deux propriétés.

## Risques / limites / notes parent

Largeur négative non nulle : compteur potentiellement gigantesque et marche mémoire, aucun rejet local. Capacités, pitches et alias source/destination non vérifiés ; ordre CLUT haute corrigé ne rend pas tous les alias sûrs. Les compteurs signés et pointeurs C hors dimensions valides ne promettent pas l'émulation intégrale du wrap x86. Aucun garde ajouté, aucun test runtime.

Hex-Rays du pack : stub `Invalid params: missing required parameters: ['addr']`, pas du C ; comparaison indisponible. Les rapports A/V établissent fraîcheur pack/live sans divergence, callers et CFG ; contrôle live présent confirme les deux corrections et le corps complet. Pack laissé intact. Proposition de nom **markdown uniquement**.
