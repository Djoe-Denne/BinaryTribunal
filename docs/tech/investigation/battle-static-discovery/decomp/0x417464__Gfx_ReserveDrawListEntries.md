# Gfx_ReserveDrawListEntries @ 0x417464

- Nom IDA: `Gfx_AllocDrawListBatch`
- Instr (live): 276
- Mode: 2+1 local — analyse A, relecture B adversariale, réconciliation parent contre ASM live
- Verdict: CERTAIN — réserve `count` entrées dans le batch courant, alloue/chaîne un nouveau batch si la capacité restante est insuffisante, puis avance trois curseurs
- Nom: `Gfx_ReserveDrawListEntries` est plus précis que `Gfx_AllocDrawListBatch`, car le chemin usuel ne fait qu'une réservation dans le batch courant
- Push IDB: append-only `[semantic-triple 2026-09-17]` + save_database

## Contrat

```c
int __cdecl Gfx_ReserveDrawListEntries(int count, GfxDrawList236 *list);
```

- Retour EAX: `0` seulement si `list == NULL`; sinon `1`.
- `count`, les capacités et les incréments sont manipulés comme entiers signés (`jle`, `imul`).
- La génération/stamp `list+0x58` est comparée non signée (`jnb`) à `*(list+0x34)`.
- Aucun check local des allocations `sub_4247C5` / `sub_424A3B`: le contrat suppose les pools valides et non épuisés.

## Analyse A

La fonction maintient une chaîne de descripteurs de batch de 0x30 octets. Si `count` dépasse `list+0x54` (capacité restante), elle alloue un nœud, le chaîne via `list+0x94/+0x98`, réserve un bloc de capacité `max(count, 0x20)`, construit trois bases de flux, puis expose les bases courantes dans `list+0x84/+0x88/+0x8C`. Enfin elle consomme `count` entrées et publie dans `list+0x74/+0x78/+0x7C` les pointeurs de début de cette réservation.

## Relecture B adversariale

1. Le nom IDA « AllocBatch » est incomplet: `4174ea cmp count,[list+54h]` / `4174ed jle 4176B7` saute toute allocation lorsque la capacité suffit.
2. La capacité minimale est 0x20 entrées, mais la consommation reste `count`; `list+0x54` reçoit la capacité puis est décrémenté de `count`.
3. Les strides explicites sont **0x80** et **0x10** octets par entrée pour les bases `batch+0x20` et `batch+0x28`; ne pas les convertir en 128/16 implicites.
4. Le seuil 0x200 ne change pas la capacité. Il choisit `list+0x5C` comme base partagée si `count <= 0x200`; au-delà, `sub_4168AC(capacity, batch+0x20, list)` initialise le flux privé.
5. Le reset de génération efface `+0x50/+0x54/+0x90/+0x94/+0x98`, met `+0x80=-1`, puis copie la génération source dans `+0x58`. La polarité est unsigned: reset lorsque `list->seen_generation < *list->generation`.

## C réconcilié

```c
typedef struct GfxBatch30 {
    struct GfxBatch30 *next; /* +0x00 */
    unsigned int field_04;
    int used_count;          /* +0x08 */
    int stream0_bytes;       /* +0x0C */
    void *stream0_begin;     /* +0x10 */
    void *stream0_base;      /* +0x14 */
    int stream1_bytes;       /* +0x18 */
    void *stream1_begin;     /* +0x1C */
    void *stream1_base;      /* +0x20 */
    void *stream2_begin;     /* +0x24 */
    void *stream2_base;      /* +0x28 */
    void *owner;             /* +0x2C */
} GfxBatch30;

int __cdecl Gfx_ReserveDrawListEntries(int count, unsigned char *list)
{
    if (!list)
        return 0;

    unsigned int generation = **(unsigned int **)(list + 0x34);
    if (*(unsigned int *)(list + 0x58) < generation) {
        *(int *)(list + 0x50) = 0;
        *(int *)(list + 0x54) = 0;
        *(GfxBatch30 **)(list + 0x90) = NULL;
        *(GfxBatch30 **)(list + 0x94) = NULL;
        *(GfxBatch30 **)(list + 0x98) = NULL;
        *(int *)(list + 0x80) = -1;
        *(unsigned int *)(list + 0x58) = generation;
    }

    if (count > *(int *)(list + 0x54)) {
        GfxBatch30 *batch = (GfxBatch30 *)sub_4247C5(
            *(void **)((char *)*(void **)(list + 0x30) + 0x08));

        batch->owner = list;
        if (*(GfxBatch30 **)(list + 0x94))
            (*(GfxBatch30 **)(list + 0x98))->next = batch;
        else
            *(GfxBatch30 **)(list + 0x94) = batch;
        *(GfxBatch30 **)(list + 0x98) = batch;
        *(GfxBatch30 **)(list + 0x90) = batch;

        batch->next = NULL;
        batch->used_count = 0;
        batch->stream0_bytes = 0;
        batch->stream1_bytes = 0;

        int capacity = count > 0x20 ? count : 0x20;
        unsigned char *block = (unsigned char *)sub_424A3B(
            capacity, *(void **)((char *)*(void **)(list + 0x30) + 0x0C));
        batch->stream0_base = block;
        batch->stream1_base = block + capacity * 0x80;
        batch->stream2_base = (unsigned char *)batch->stream1_base
                            + capacity * 0x10;

        if (count <= 0x200)
            batch->stream1_base = *(void **)(list + 0x5C);
        else
            sub_4168AC(capacity, batch->stream1_base, list);

        batch->stream0_begin = batch->stream0_base;
        batch->stream1_begin = batch->stream1_base;
        batch->stream2_begin = batch->stream2_base;
        *(void **)(list + 0x84) = batch->stream0_begin;
        *(void **)(list + 0x88) = batch->stream1_begin;
        *(void **)(list + 0x8C) = batch->stream2_begin;
        *(int *)(list + 0x54) = capacity;
    }

    GfxBatch30 *batch = *(GfxBatch30 **)(list + 0x90);
    batch->used_count += count;
    *(int *)(list + 0x50) += count;
    *(int *)(list + 0x54) -= count;

    *(void **)(list + 0x74) = *(void **)(list + 0x84);
    *(void **)(list + 0x78) = *(void **)(list + 0x88);
    *(void **)(list + 0x7C) = *(void **)(list + 0x8C);

    *(unsigned char **)(list + 0x84) += count * *(int *)(list + 0x44);
    *(unsigned char **)(list + 0x88) += count * *(int *)(list + 0x48);
    *(int *)(list + 0x8C) += count;
    batch->stream0_bytes += count * *(int *)(list + 0x3C);
    batch->stream1_bytes += count * *(int *)(list + 0x40);
    return 1;
}
```

## Preuves ASM (live)

1. `417471 cmp [ebp+arg_4],0` / `417475 jz 41781A`; `417813 mov [ebp+var_4],1` — contrat booléen exact.
2. `41748d cmp ecx,[eax]` / `41748f jnb 4174E4` — comparaison de génération non signée; le reset est le chemin « below ».
3. `4174ea cmp eax,[edx+54h]` / `4174ed jle 4176B7` — aucune allocation si `count <= remaining`, comparaison signée.
4. `4174fd call sub_4247C5` puis `417514 mov [edx+2Ch],eax` — nœud de batch 0x30 avec back-pointer propriétaire.
5. `41751a cmp [ecx+94h],0`; `41752f mov [eax],ecx`; `417539 mov [edx+94h],eax`; `417545 mov [ecx+98h],edx` — chaîne head/tail via `batch+0x00`.
6. `41757e cmp count,20h` / branches vers capacité `count` ou `0x20` — capacité minimale 32.
7. `4175b5 shl edx,7` et `4175c6 shl edx,4` — layouts par entrée 0x80 puis 0x10 octets.
8. `417630 cmp count,200h` / `417632 jle 417651` — seuil signé 512; base partagée `list+0x5C` sinon appel `sub_4168AC` à trois args.
9. `4176c3 mov eax,[edx+8]` / `4176cf mov [eax+8],ecx` — `batch+0x08 += count`.
10. `4176f3 mov eax,[edx+84h]` → `list+0x74`; séquences identiques 0x88→0x78 et 0x8C→0x7C — publication des débuts de réservation avant avancement.
11. `41772d imul ecx,count`, sources `list+0x44/+0x48`; `41777e imul edx,count`, source `list+0x3C`; `417796 imul ecx,count`, source `list+0x40` — quatre strides signés explicitement développés.

## Validation parent

- Callees: `sub_4247C5` = allocation d'un élément de pool; `sub_424A3B` = réservation de `capacity` éléments dans un pool à stride interne; `sub_4168AC` = initialisation du flux privé depuis les paramètres de liste.
- Callers: chemins DDrawAlt, draw OT/primitive (`0x45CE2B`, `0x4610DB`, `0x461A66`, `0x462AD0`), rendu menu `0x49Bxxx–0x49Exxx`, transitions `NormalTransition_Phase1`, `BossTransition_Phase`, swirl overlay. Tous cohérents avec une réservation de sommets/indices draw-list.
- Retour: EAX 32 bits `0/1`; aucun retour AL/AX.
- Risque conservé: les allocations sont déréférencées sans test NULL, fidèle à l'ASM.
