# 0x41AC34 — TextureRelated — C réconcilié Sol

- **Instr (live)** : 155 ; 22 blocs CFG ; un chunk.
- **Palier** : non attribué dans cette tâche de reconstruction ; aucun verdict de confiance.
- **Plage / taille** : `[0x41AC34,0x41AE9D)` ; `0x269` = 617 octets.
- **Type IDA** : `BOOL *__cdecl(BOOL *, _DWORD *, char *)` ; annotation non probante pour les pointeurs transportés dans la sortie.
- **ABI retenue** : `DWORD * __cdecl(DWORD *out, BYTE *descriptor, const char *original_path)` ; retour full EAX = out ; sortie 12 octets = status + metadata VA + data VA.
- **Notes parent** : pas de latch repéré dans cette cible ; pas de thunk ajouté ; aucun stride d'array à déduire. « WORDs de pile » = DWORDs 32 bits. Seuls `+0xCC`/`+0xCD` sont des octets ; metadata `+0x30/+0x34/+0x40` sont DWORDs. Null guards, bounds checks et test de reload après conversion notablement absents. Nom dispatch trompeur : whole-image forcé dans ses octets live. Refcount release comporte des comparaisons signed, pas une condition d'égalité zéro.
- **Callers live** : `0x4076FC` dans `0x4076B6` ; `0x4153F7` dans `0x415372` ; tous deux nettoient 12 octets et lisent out via EAX.
- **Écriture** : uniquement ce pack ; aucune mutation git/IDB, aucun shell, remote moteur ou spawn.

## C réconcilié

« Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays ».
**Noms effectifs dans ce pack** : `asm.asm` joue le rôle du listing `asm_clean.asm` ; les octets sont dans `ida_dump_bytes.json`. Aucun fichier `asm_clean.asm` n'a été inventé. Le listing live a été relu entier, ainsi que les octets et CFG ; hash conforme au dump :
`1e945f301432a54e656c884590070faec3ca49f973e84eeeffea274b33b31c1c`.

Taille 617 octets, plage ci-dessus, type IDA ci-dessus. Prologue : sauvegarde **EBP uniquement**, allocation **0x31C** ; épilogue `mov esp,ebp; pop ebp; retn`. Le retour n'a pas d'immédiat de cleanup. Le C matérialise la frame par des DWORDs alignés et conserve les 22 blocs avec labels Intel/IDA `loc_`.

Source canonique intégrale : [`c_reconciled_sol.c`](c_reconciled_sol.c). Ce bloc inclut exactement cette traduction, pas une seconde variante simplifiée :

```c
#include "c_reconciled_sol.c"
```

Les prototypes externes typés et bindings d'adresses se trouvent dans cette source. Ils conservent les helpers originaux ; pas de remplacement par libc. `BYTE*` signifie uniquement adresse utilisée avec offsets d'octets ; les champs DWORD sont accédés explicitement. Aucun layout de texture complet n'est supposé.

### Corrections / contrôle `add esp`

Ordre C établi par les poussées cdecl droite→gauche, non par les noms des helpers :

- stem : `(original_path,scratch)` ; cleanup 8.
- format cache : `(buffer,"%s.%s",scratch,"TEX")` ; cleanup 16.
- zero réel : `(12,result_address)` ; cleanup 8, **deux** arguments count-first.
- acquisition : `(original_path)` ; cleanup 4.
- dispatch : `(metadata,original_path)` ; cleanup 8.
- write cache : `(cache_name,temporary)` ; cleanup 8 ; full EAX testé, zéro signifie échec.
- release : `(temporary)` ; cleanup 4 ; retour ignoré, ne pas inventer `free`.
- deux reloads : `(descriptor+0x48,cache_name)` ; cleanup 8 chacun ; premier argument est une adresse.
- format erreur : `(diagnostic,format,original_path)` ; cleanup 12.
- wrapper debug original : `(diagnostic)` ; cleanup 4, pas un import stdcall substitué.

### Parcours et ancrages

- Flag `0x200` : nom original si posé, sinon nom cache formaté. Le stem helper n'est pas une copie sûre.
- Descriptor `+8 != 0` : acquisition, configuration DWORD de metadata, dispatch, éventuelle assignation BYTE `temporary+0xCC=1`, write, release, reload même si write échoue.
- Branche conversion : status = acquisition/write ; **pas de test du reload nul**. Branche directe : metadata=0, status = nullité du data retourné.
- Status nonzero : diagnostic du chemin original ; pas de mutation data `+0xCD`. Sinon flag `0x80000` : BYTE OR `0x20` à data `+0xCD`.
- Trois stores DWORD ordonnés, retour adresse out. Aucun BOOL scalar, retour struct by-value, garde supplémentaire ou release des objets retournés.

Voir les **huit ancrages EA**, la confrontation A/B, les contrats helpers live et les risques dans [`reconcile_notes_sol.md`](reconcile_notes_sol.md).

## Couverture / absences de preuve

155/155 instructions décodées, 617/617 octets, 22/22 labels CFG, 11/11 CALLs. Pas de stub Hex-Rays, pas de listing tronqué. Graphe corrigé antérieur non tronqué ; son ancienne observation MCP conserve la mention TRUNCATED. Aucun seuil >600 instructions atteint.

Accord A/B et corrections de représentation ne constituent pas une validation sémantique. Le modèle est x86-32, little-endian, DF=0, helpers réels et mémoire valide ; pas de garantie pour overflow, alias de stack hostile, faults, registres non-retour ou exact codegen. Aucun build/test/runtime/PE observé dans cette tâche.
