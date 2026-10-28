# PRODUCE C — volet A — g23 / 0x50A6C0 (run01, mission ff8-decomp-semantics-20261011-r01)

- Session productrice : pool-144, fork du lecteur factuel g23 (ses_ed41fab26ffeFl6Nvi5RVd9gut).
- Tâche : task_mv44sr3n_00dh_4cy5m0. Rôle A sur 2+1 ; le volet B (pool-145) est indépendant et n'a pas été lu.
- Statut : C produit depuis le gel ; 2 points ABI laissés OUVERTS pour la réconciliation (pas de « réparation » par intuition).
- Validations non exécutées : aucune compilation, aucun diff/test, aucune lecture IDB, aucun live (contrat).

## 1. Ground truth citée (gel)

- Paquet : `.tmp/ff8-decomp-semantics-20261011-r01/native/0x50A6C0.json`
- `native.idb` : `D:\Modding\ff8\retro-exe\FF8_EN.exe - 9.3.i64`
- `native.input` : `C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII\FF8_EN.exe`
- `native.bits` : 32
- `native.input_sha256` : `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`
- `native.exported_utc` : `2026-10-11T16:38:25.140966+00:00`
- `instruction_count` : 5 ; un seul chunk `start=0x50a6c0, end=0x50a6cd`
- `chunks[0].hex` : `a1609ad90150e8c5bfffff59c3` (13 octets ; vérification : 5+1+5+1+1 = 13 = 0x50a6cd-0x50a6c0 ✓)
- Clés du paquet : `ea, name_label_only, native, chunks, assembly, cfg, xrefs_to, code_targets, instruction_count` (valeur de `name_label_only` non exploitée : les libellés IDB ne sont pas une preuve de rôle).

## 2. Table d'instructions (décodage vérifié contre le hex du chunk)

| addr | octets | encodage | décodage |
|---|---|---|---|
| 0x0050A6C0 | A1 60 9A D9 01 | A1 moffs32 | `mov eax, dword ptr ds:0x01D99A60` (libellé IDB `result_event`) |
| 0x0050A6C5 | 50 | 50 | `push eax` |
| 0x0050A6C6 | E8 C5 BF FF FF | E8 rel32 | `call 0x00506690` — next-ip 0x50A6CB + (0xFFFFBFC5 = -0x403B) = 0x506690 ✓ (== `code_targets` du paquet) |
| 0x0050A6CB | 59 | 59 | `pop ecx` (nettoyage pile côté appelant : 1 dword) |
| 0x0050A6CC | C3 | C3 | `retn` (retour near, sans immédiat) |

## 3. ABI / pile / registres

- Convention de nettoyage : 1 dword poussé (0x50A6C5) puis dépilé par l'appelant (0x50A6CB) → style cdecl, un seul argument pointeur. Le wrapper sœur 0x50A690 nettoie avec `add esp,4` (0x50A6AA) — cohérent.
- Aucun frame (pas de `push ebp`/`sub esp`) ; ESP net = 0 au `retn` ; retour à l'appelant 0x504BB0 (xref `from=0x504e43, type=17, function=0x504bb0`).
- EAX en sortie du wrapper = EAX en sortie du callee (`pop ecx`/`retn` ne touchent pas EAX) — fait observable des octets, même sans usage visible du retour dans le wrapper.
- ECX écrasé par `pop ecx` (registre volatile, sans conséquence d'ABI).
- Callee 0x506690 : la tête du paquet (`0x506690.json`, lue avant handoff) montre `push ebx / push esi / mov esi,[esp+8+result_event] / xor eax,eax / push edi / push esi; unsigned __int8 * / mov al,[esi]` (0x506690–0x50669A) → l'arg0 est lu puis déréférencé octet par octet (`mov al,[esi]`), et repassé comme pointeur à un appel ultérieur. Slot arg cohérent avec arg0 = [esp_original+4] après 2 pushes (arithmétique IDA `[esp+8+var]`, non ré-indépendamment re-vérifiée — notée).
- Épilogue/retour du callee : NON vérifié dans cette session (OUVERT-1). Le type de retour du callee n'est donc pas affirmé.

## 4. C reconstruit (primaire, conservateur)

```c
/* Externes minimales, cohérentes avec le site d'appel vérifié. */
extern void *result_event;   /* dword ds:0x01D99A60. Indices de pointeur : le callee lit un octet à [arg]
                                (0x50669A mov al,[esi]) ; 0x50A690 l'avance de 0x18 (0050A697 add eax,18h).
                                Type pointé inconnu (OUVERT-3). */

void BattleAction_ApplyResultAndSpawnPresentation(void *result_event);
/* 0x506690 — nom = libellé IDB, pas une preuve de rôle. 1 arg pile (dword, pointeur).
   Retour : présent dans EAX à la sortie du callee (transit observé), contenu/type NON vérifiés (OUVERT-1). */

void sub_50A6C0(void)
{
    BattleAction_ApplyResultAndSpawnPresentation(result_event);
    /* Natif : pop ecx ; retn — arg nettoyé par l'appelant ; EAX sort avec la valeur
       de retour du callee (fait ABI, voir §3). */
}
```

- Variante conditionnelle (à ne retenir QUE si OUVERT-2 se résout « l'appelant consomme EAX ») : typer le wrapper et le callee selon le retour réel du callee (OUVERT-1) et écrire `return BattleAction_ApplyResultAndSpawnPresentation(result_event);`. Non affirmée ici pour ne pas inventer un type de retour.
- Aucun callee ou library call inventé : le seul callee cité est `0x506690` (cible du `call`, confirmée par `code_targets` du paquet).

## 5. FAITS vs HYPOTHÈSES

FAITS (cités paquet) :
1. Séquence exacte des 5 instructions et 13 octets (§2, hex du chunk).
2. Cible du call = 0x506690 (arithmétique rel32 + `code_targets`).
3. xref unique : appel depuis 0x504BB0 @0x504E43 (type 17).
4. Nettoyage cdecl d'un dword ; pas de frame ; ESP net 0.
5. EAX en sortie = retour du callee (passthrough, sans usage visible dans le wrapper).
6. Le callee lit l'octet [arg0] (tête de 0x506690, lue avant handoff).
7. Wrapper sœur 0x50A690 : arg poussé = pointeur AVANT incrément ; `result_event += 0x18` AVANT le call (0x50A69A/0x50A69B) ; après le call, EAX est rechargé depuis le global (0x50A6A5) AVANT `mov cl,[eax]` (0x50A6AD) → l'octet copié dans `byte_1D99A48` (0x01D99A48) vient du pointeur AVANCÉ, PAS de la valeur de retour du callee (return du callee y est abandonné). Distinction importante pour la réconciliation.

HYPOTHÈSES (non affirmées) :
- `result_event` parcourt des enregistrements de pas 0x18 (déduit de l'incrément 0x18 à 0x50A697) — rôle non prouvé.
- Le commentaire IDB attaché au call (« Presentation/domain seam: applies result/status first via 0x493D80, then restores animations/spawns reactions and finally creates damage popups via 0x5068B0. Popup creation itself does not mutate HP. ») est une annotation IDB historique, non validée — pas une preuve.
- Libellés (`result_event`, `byte_1D99A48`, `BattleAction_ApplyResultAndSpawnPresentation`) : nommage IDB, pas une preuve de but.

## 6. OUVERTS (à trancher en réconciliation, pas par intuition)

- OUVERT-1 : épilogue et valeur de retour du callee 0x506690 (paquet g17 non relu post-handoff).
- OUVERT-2 : consommation ou non d'EAX par l'appelant 0x504BB0 après le call @0x504E43 (fenêtre 0x504E43+ non lue).
- OUVERT-3 : type pointé de `result_event` (pointeur vers octet consommé ; pas 0x18 observé à 0x50A690 ; layout inconnu).

## 7. Couverture et inventaire des sources

- Couverture du livrable : 5/5 instructions, 13/13 octets, 1/1 chunk, 1/1 xref, 1/1 cible de call — complètes pour 0x50A6C0.
- Sources : paquets gelés `0x50A6C0.json` et `0x50A690.json` (entiers, lus avant handoff) ; fragment de tête `0x506690.json` (lu avant handoff) ; `CONTRACT.md` (lignes 1–41) ; `native-groups.json` lignes 180–188 (g23 = 0x50A690, 0x50A6C0, 0x50E510).
- 0x50E510 : NON couvert (821 instructions signalées par le paquet, aperçus indexés non vérifiés : chaîne de cibles espacées de 0xE, n0050e52a…n0050e8a3 — aperçu basse confiance, à ne pas traiter comme preuve).
- Post-handoff : lectures refusées (permission denied) sur `.tmp/.../native/*.json` et `docs/missions/.../CONTRACT.md` — aucun nouveau gel lu ; tous les faits ci-dessus proviennent des lectures vérifiées de la session lecteur g23 avant handoff (historique hérité). Aucun C de pair/autre volet lu ; les rapports d'autres groupes reçus dans la boîte de réception n'ont pas été utilisés pour cet EA.
