# `0x63E960` __ `GFCameraScriptTask_Spawn_63E960` — decomp réconcilié (lot 10 BdLink, post-mag FX)

| champ | valeur |
|---|---|
| EA | `0x63E960` |
| Nom IDA | `BdLinkTask_Register_63E9C0` (conservé, pas de rename) |
| Taille | 95 o / 32 instr |
| Mode | 1+P (≤80 instr, CERTAIN, vérif parent §5.6) |
| Verdict | CERTAIN |
| Push IDB | append-only `set_func_cmt`, tag `[semantic-triple 2026-09-20]`, save_database rc=True |
| Livrables sources | tools/_tmp_semantic_triple/0x63e960/ (asm.asm, semantic_*.md, c_reconciled.c, reconcile_notes.md) |

## Analyse (A)

```markdown
# Sémantique BdLinkTask_Register_63E9C0 @ 0x63E960 (analyse A)

## 1. Rôle
Wrapper "spawn" d'interpréteur de script caméra GF/effet : enregistre le callback `sub_63E9C0` (machine à états stream : opcode switch 0–10, lectures s16/vec3 depuis le flux du contexte) sur la liste BdLink passée en argument via `BdLinkTask_Register` (0x508360), initialise les compteurs du nœud (`+0x0C`=0, `+0x0E`=0, `+0x14`=a0 stream ptr, `+0x18`=a1, `+0x1C`=a2), puis règle le drapeau global de miroir caméra X `dword_24FBE78` à ±1 selon un tirage `rand() % a3` — et jamais selon a3=0 (mise à 1).

## 2. Confiance
**CERTAIN** pour le rôle mécanique (mapping args→nœud, callback, valeur du drapeau — opcodes cités, consommation du drapeau prouvée dans le callback et chez un second lecteur). Le libellé de domaine « script caméra GF » est fortement soutenu (12 callers magic/GF : Cactuar 0x5A8988, Shiva 0x5C0F8A, Doomtrain 0x63F33E, Griever 0x622751, BLASTING_ZONE 0x5F04EB… ; callback = décodeur de stream avec `Stream_ReadVec3s16_ScaleX_24FBE78`, écritures `Battle_Camera_world_*`).

## 3. Nom catalogue
`BdLinkTask_Register_63E9C0` : **trop générique** (convention « callback-only » respectée, pas mensonger). Proposition (markdown seul, ne pas renommer) : `GFCameraScriptTask_Spawn_63E960`.

## 4. In / Out / Effets (mapping args→Register)
Pile appelante à l'entrée (cdecl, ret @ [esp], args ci-dessous) — l'appel interne consomme `a_list` et pousse callback+list :

| Arg | Registre/stack | → destination | Preuve |
|---|---|---|---|
| a_list (list_head) | [esp+4] à l'entrée | 2e push vers Register (arg idx 0) | 0x63E960 `mov eax,[esp+list_head]` ; 0x63E96A `push eax` ; `push offset sub_63E9C0` @0x63E965 (callback = arg idx 1) ; `call BdLinkTask_Register` @0x63E96B ; `add esp,8` @0x63E988 |
| a0 | [esp+0Ch+arg_0] | node+0x14 (ptr stream/lecteur) | 0x63E970/0x63E978 |
| a1 | [esp+0Ch+arg_4] | node+0x18 (déréféré par le callback comme ctx @0x63F0D6) | 0x63E97B/0x63E981 |
| a2 | [esp+0Ch+arg_8] | node+0x1C | 0x63E984/0x63E995 |
| — | constantes | node+0x0C = 0 (word, cx=0), node+0x0E = 0 (word) | 0x63E97F `xor ecx,ecx` ; 0x63E98D/0x63E991 |
| a3 | [esp+0Ch+arg_10] | drapeau global `dword_24FBE78` (≠ nœud) | 0x63E974 `mov esi,[esp+0Ch+arg_10]` ; 0x63E98B `cmp esi,ecx` |

Effet global (`dword_24FBE78` @0x24FBE78) : si `a3 == 0` → 1 (0x63E9B3 `mov dword_24FBE78,1`). Sinon `rand()` (0x63E99A), `cdq; idiv esi` signé — reste EDX ∈ (−a3, 0] — puis `dec edx` ; `neg edx; sbb edx,edx` (EDX = 0 si reste==1, −1 sinon) ; `and edx,2; dec edx` → **+1 si reste==1, −1 sinon** (0x63E99F–0x63E9AC). Donc : a3>0 → ±1 au hasard (1 chance sur a3 de +1), a3=0 → +1 ; a3<0 → `idiv` signé accepte, reste ∈ (a3, 0], mêmes branches (probabilité ~1/|a3| de +1). Le nœud renvoyé par Register est utilisé sans garde NULL (déréférencement inconditionnel 0x63E978).

## 5. Verdict justifié
CERTAIN. Ce wrapper existe en plus de `BdLinkTask_Register`/`au_re_BdLinkTask` pour trois raisons : (1) il choisit le callback `sub_63E9C0`, interpréteur de script caméra (switch 11 cas @0x63EA6E : lectures `Stream_ReadS16_OrTable_24FBF48` / `Stream_ReadVec3s16_ScaleX_24FBE78`, GTE, interpolation, écritures finales `Battle_Camera_world_XZ_s16` / `Battle_Camera_LookAt_XZ_s16` @0x63F13D) ; (2) la liste est **paramétrable** (contrairement à 0x6804B0) — chaque caller passe sa propre list head (ex. Cactuar @0x5A8988 : liste `word_2259950`/contextes `unk_225A838`) ; (3) il effectue un tirage de miroir horizontal : `dword_24FBE78` vaut ±1 et n'est écrit **que** par cette fonction (xrefs IDB 0x63E9AC/0x63E9B3). Sa consommation est prouvée deux fois dans le callback : cas 8 @0x63EE03 (`mov dx, word ptr dword_24FBE78; imul dx,[ecx]` — multiplication d'une coordonnée X du stream par le signe) et cas 9 @0x63EE3B (`imul ebx, dword_24FBE78`), plus le lecteur `Stream_ReadVec3s16_ScaleX_24FBE78` @0x63F221 (scale X du vec3) et sub_649D00 @0x64A102. C'est bien un signe de miroir X aléatoire (a3 = dénominateur de probabilité du miroir). Les compteurs nœud+0x0C/+0x0E mis à 0 correspondent à l'usage du callback (inc `word [ebx+0Ch]` @0x63F167, cmp `[esi+0Ch]` chez les callers ex. 0x5A896C).

## 6. Preuves
1. 0x63E960/0x63E965/0x63E96A/0x63E96B : list head = arg 0 du wrapper (lu @0x63E960, poussé @0x63E96A), callback fixe `sub_63E9C0` (poussé @0x63E965, callback = arg idx 1 de Register 0x508360 — convention wiki battle-address-catalog.md).
2. 0x63E978/0x63E981/0x63E995 : node+0x14=a0, node+0x18=a1, node+0x1C=a2 ; 0x63E98D/0x63E991 : node+0x0C=0, node+0x0E=0 (mots, cx=0 @0x63E97F).
3. 0x63E98B `cmp esi,ecx; jz 0x63E9B3` : a3=0 → `dword_24FBE78=1` @0x63E9B3 (pas d'appel rand).
4. 0x63E99A–0x63E9AC : `rand; cdq; idiv esi; dec edx; neg edx; sbb edx,edx; and edx,2; dec edx` → dword_24FBE78 = +1 si (rand%a3)==1, −1 sinon ; division **signée** (idiv, pas div) ; EAX retourné par rand est 32 bits (largeur prouvée par cdq).
5. Consommation du drapeau dans le callback : cas 8 @0x63EE03 `mov dx, word ptr dword_24FBE78; imul dx,[ecx]` ; cas 9 @0x63EE3B `imul ebx, dword_24FBE78` ; et @0x63F221 dans `Stream_ReadVec3s16_ScaleX_24FBE78` ; second lecteur sub_649D00 @0x64A102. Xrefs IDB : dword_24FBE78 écrit uniquement @0x63E9AC/0x63E9B3 (cette fonction).
6. Callers 12× magic/GF : GF_199Cactuar_SequenceTaskDriver @0x5A8988 (pousse liste `word_2259950` + 2 ptrs + a3=0 → miroir forcé +1), GF_185Shiva @0x5C0F8A, GF_191Doomtrain @0x63F33E, MAG_066_GRIEVER @0x622751, MAG_164_BLASTING_ZONE @0x5F04EB, etc.
7. Nœud utilisé sans garde NULL : `mov [eax+14h],edx` @0x63E978 inconditionnel après `call` (pas de `test eax,eax`).
8. Valeur de retour de **cette fonction** : EAX = reste du `idiv` (non contrôlé, jamais réécrit) — non consommé par les callers testés (ex. 0x5A898A enchaîne sur un second call). Wiki pack `wiki.md` en échec qmd — recoupé via qmd direct (catalogue 0x508360/0x508420).

## 7. Questions ouvertes
- a0 (→node+0x14) : pointeur de flux/lecteur décrémenté par le callback (`mov eax,[edx+14h]…lea edi,[edx+14h]…mov [edi],ecx` @0x63EA1E–0x63EA2C : lecture stream avec curseur in-situ) — type exact (struct avec champ +0 ?).
- Rôle exact de a2 (node+0x1C) : jamais lu dans la portion de callback analysée (peut-être lu par les champs non couverts ou par le caller).
- Signification de node+0x0E (mis à 0, non lu dans le callback analysé) vs node+0x0C (compteur de frames/pauses, inc @0x63F167, testé chez les callers).
- Pourquoi a3=0 force +1 plutôt que d'omettre l'écriture : convention « miroir désactivé = +1 » implicite chez les consommateurs (à confirmer par un test live).

## 8. IDBCOMMENT
Wrapper: registers fixed camera-script tick sub_63E9C0 (BdLinkTask_Register 508360, callback node+8) on caller-provided list_head (arg0). Inits node: word +0C=0 (frame counter), word +0E=0, +14=arg1 (stream ptr, advanced in-place by tick), +18=arg2 (ctx), +1C=arg3. Then sets global X-mirror sign dword_24FBE78: arg4==0 -> +1; else rand(), remainder = rand % arg4 (SIGNED idiv): +1 iff remainder==1 else -1 (1-in-N mirror chance). Flag is consumed by tick (cases 8/9: imul X coord) and Stream_ReadVec3s16_ScaleX_24FBE78. No NULL guard on node. EAX return = idiv remainder, unused by callers.

## 9. Reconstruction C
```c
/* 0x63E960 — 95 octets, 32 instr, cdecl ; node = retour de BdLinkTask_Register */
void GFCameraScriptTask_Spawn_63E960(void *list_head,   /* arg0 : BdLink list, passe a Register */
                                     void *stream,      /* arg1 -> node+14 (curseur stream in-situ) */
                                     void *ctx,         /* arg2 -> node+18 */
                                     void *arg3,        /* arg3 -> node+1C (non lu ici) */
                                     int   mirror_n)    /* arg4 : denominateur de tirage miroir */
{
    void *node = BdLinkTask_Register(list_head, sub_63E9C0);   /* 63E965-63E96B */
                                                                /* pas de garde NULL */
    *(uint16_t *)((char*)node + 0x0C) = 0;                     /* 63E98D (cx=0) */
    *(uint16_t *)((char*)node + 0x0E) = 0;                     /* 63E991 */
    *(void   **)((char*)node + 0x14)  = stream;                /* 63E970/63E978 */
    *(void   **)((char*)node + 0x18)  = ctx;                   /* 63E97B/63E981 */
    *(void   **)((char*)node + 0x1C)  = arg3;                  /* 63E984/63E995 */

    if (mirror_n == 0) {                                       /* 63E98B cmp esi,ecx ; jz */
        dword_24FBE78 = 1;                                     /* 63E9B3 : miroir desactive */
        return;
    }
    /* 63E99A-63E9AC : rand() (EAX 32b), cdq+idiv SIGNED -> reste EDX dans ]-n,0] */
    int rem = rand() % mirror_n;                               /* signe C = trunc vers 0 */
    /* dec/neg/sbb/and 2/dec : +1 ssi rem==1, sinon -1 */
    dword_24FBE78 = (rem == 1) ? 1 : -1;
    /* valeur de retour de la fonction = EAX = reste idiv (non exploite par les callers) */
}
```
```

### Checks §5.6 (parent, ASM live 2026-09-20)

- Dump intégral 32 instr vérifié : list=arg0 paramétrable, callback sub_63E9C0, node +0C/+0E=0, +14=a1, +18=a2, +1C=a3.
- CORRECTION polarité miroir (l'analyse A avait inversé) : trace `dec edx; neg edx; sbb edx,edx; and edx,2; dec edx` @0x63E9A3–0x63E9AB → CF=neg(nonzero) → reste R=1 → −1 ; R≠1 (0 ou ≥2) → +1. Flag **dword_24FBE78 = −1 ssi rand()%a4==1, +1 sinon** (+1 forcé si a4==0).
- xrefs dword_24FBE78 : écrit UNIQUEMENT ici (0x63E9AC/0x63E9B3) ; consommateurs 0x63EE03 (case 8), 0x63EE3B (case 9), 0x63F221 (Stream_ReadVec3s16_ScaleX), 0x64A101.
- Callee/callers cités existent : 0x508360 + _rand ; 12 callers magic/GF (Cactuar/Shiva/Doomtrain/Griever…).
