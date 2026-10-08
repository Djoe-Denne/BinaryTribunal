# Gfx_SubmitTexturePageLists @ 0x465930

- Instr (live): 300
- Palier: low
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=7748
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=8812
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=3593
- A==B: non
- Push IDB (historique): oui ; aucun nouveau push par cette correction.
- SetType (historique, type IDA relu): _DWORD *__cdecl Gfx_SubmitTexturePageLists(void) ; type source non démontré, `void` reste possible.
- §5.6 / PUSH de la correction: en attente du parent ; les tags/événements historiques ne valent pas nouvelle validation.
- Notes parent: Walk uses global VALUES not &global. Pass 0/1/2 sub/dec/jz; jle/jl SIGNED. Slot stride 0x44C (not +44h), item 0x64, count [slot-0x324] reloaded at 0x465B30 after each item/callbacks. 96 slots = 3 batches of 32 per pass-id. Second bank 0x470: separate walk/clear gate reads at 0x465B7F/0x465C89, setnz RS(2,p!=0), no local NULL check. Clear 0x470 is flat. Occupancy 1+2 / TIM 0x10 / TEST AL,2 / OT 07/24 absents. EAX leftover cursor, not a proven source return contract.
- Correction Sol du 2026-10-08: `tools/_tmp_semantic_triple/0x465930/semantic_r_sol.md` (Rfinal), avec `semantic_v_sol.md` et `semantic_b_blind_sol.md`. Relecture ASM live + octets à 15:23 UTC : `[0x465930,0x465CAF)`, SHA-256 `aa8699e897d03dd8eb148caaf48e8102135258405b0d42e46fcda35932169c8f`, pack inchangé. Provenance GLM A/B/C ci-dessus conservée, non relancée.

## C réconcilié

```c
/* Gfx_SubmitTexturePageLists @ 0x465930
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 300 instr, size 0x37F (895), end exclusive 0x465CAF. cdecl, 0 args, retn C3, no EBP frame.
 * IDA type: _DWORD *__cdecl(void), not proof of the source return type (void remains possible).
 * EBX/EBP/ESI/EDI saved at 0x465933-36, restored at 0x465CA7-AA; locals = 0x14 bytes.
 * cdecl pushes right-to-left: push buffer; push list => (list,buffer).
 * Deferred add esp: 0x465992/4659F8 +0x40; 465A14/465C0A +0x18;
 * 465A66 +0x20; 465ADA/465BED +0x24; 465AEB/465B1B/465C27 +0x0C;
 * 465BA6 +0x1C; 465C68 +0x10; 465CAB +0x14 releases locals, not call args.
 * ESI = FFGetBufferAddress() until the final SelectRT (buffer pushed, then xor esi,esi).
 * EAX at retn is leftover clear-loop cursor, not a documented draw-list result.
 * Flat x86-32 memory reconstruction, not portable C over scalar extern objects.
 * volatile forces observed reloads; it is neither a lock nor a callback-stability guarantee.
 * Pass ids: three live DWORD reads 0xB7DB48, +4, signed jle vs immediate 0xB7DB50.
 * Tpage bank: stride 0x44C, count at [slot-0x324] SIGNED jle, items 0x64, bitmask *slot,
 * two lists at +0x24 + (ebx+pass*2)*4 modulo 2^32, flag +0x58 retested for each list.
 * 96 slots = 3 batches of 0x20 per pass-id, signed jl vs immediate 0x1CCFFE4.
 * Count reloaded after every item; SHL count masked with 31 even outside count<=8 invariant.
 * Second bank walk gate at 0x465B7F, clear gate independently at 0x465C89:
 * stride 0x470, flag +0x464, lists +0x24+ebp*8, NO local null check,
 * setnz RS(2, ebp!=0). Exactly 0x20 slots x 2 ebp. Clear 0x470 has NO 0x20 batch.
 * Invalidation sets stamp +0x58 to 0, no destruction on the effective helper path.
 * If expected generation is 0, stamp 0 can still pass the walker: no absolute anti-replay claim.
 * jcc: jz/jnz, jl/jle SIGNED (7C/0F8C/0F8E). setnz 0F95. NO ja/jg, NO jpt.
 * Occupancy 1+2 / 0xD0 / 0x1D0 / GF Exists +44h / TEST AL,2 / OT 07/24 / TIM 0x10: ABSENT.
 * add 44Ch is slot stride, not +44h. gfx_driver slots 33/39/29/30 are not occupancy.
 */

#include <stdint.h>

typedef uint32_t _DWORD;

extern int __cdecl FFGetBufferAddress(void);
extern int __cdecl GfxDriver_SetBlendMode(int mode, int buffer);
extern int __cdecl GfxDriver_SelectRenderTarget(int target, int buffer);
extern void __cdecl Gfx_SetRenderState(int type, int value, int buffer);
extern void __cdecl Gfx_WalkDrawList(_DWORD *list, int buffer);
extern int __cdecl Gfx_InvalidateDrawListStamp(int list);

/* These globals hold pointer VALUES; bank/table bases and bounds below are immediates. */
extern volatile unsigned int dword_1CB6030;
extern volatile unsigned int dword_1CB6034;
extern volatile unsigned int dword_1CCFD44;
extern volatile unsigned int dword_1CCFD48;
extern volatile unsigned int dword_1CCFD4C;
extern volatile unsigned int dword_1CCFD84;
extern volatile unsigned int dword_1CCFD90;

_DWORD *__cdecl Gfx_SubmitTexturePageLists(void)
{
    int buffer;
    volatile unsigned int *pass;
    uint32_t passId;
    volatile unsigned int *slot;
    volatile unsigned int *item;
    volatile unsigned int *clr;
    volatile unsigned int *bank;
    _DWORD *list;
    _DWORD * volatile *listSlot;
    int32_t itemIdx;
    int listIdx;
    int n;
    int32_t count;
    int p;

    buffer = FFGetBufferAddress();

    GfxDriver_SetBlendMode(1, buffer);
    GfxDriver_SelectRenderTarget(1, buffer);
    Gfx_SetRenderState(0xE, 1, buffer);
    Gfx_SetRenderState(0x10, 1, buffer);
    Gfx_WalkDrawList((_DWORD *)dword_1CB6030, buffer);
    Gfx_WalkDrawList((_DWORD *)dword_1CB6034, buffer);
    Gfx_InvalidateDrawListStamp((int)dword_1CB6030);
    Gfx_InvalidateDrawListStamp((int)dword_1CB6034);

    GfxDriver_SetBlendMode(4, buffer);
    GfxDriver_SelectRenderTarget(0, buffer);
    Gfx_SetRenderState(0xE, 1, buffer);
    Gfx_WalkDrawList((_DWORD *)dword_1CCFD44, buffer);
    Gfx_InvalidateDrawListStamp((int)dword_1CCFD44);
    Gfx_WalkDrawList((_DWORD *)dword_1CCFD48, buffer);
    Gfx_InvalidateDrawListStamp((int)dword_1CCFD48);
    Gfx_WalkDrawList((_DWORD *)dword_1CCFD4C, buffer);
    Gfx_InvalidateDrawListStamp((int)dword_1CCFD4C);

    Gfx_SetRenderState(2, 0, buffer);
    Gfx_SetRenderState(0x10, 0, buffer);

    pass = (volatile unsigned int *)(uintptr_t)UINT32_C(0xB7DB48);
    do
    {
        passId = *pass;

        if (passId == 0)
        {
            GfxDriver_SelectRenderTarget(0, buffer);
            Gfx_SetRenderState(0xE, 1, buffer);
            Gfx_SetRenderState(2, 0, buffer);
        }
        else if (passId == 1)
        {
            GfxDriver_SelectRenderTarget(0, buffer);
            Gfx_SetRenderState(0xE, 1, buffer);
            Gfx_SetRenderState(2, 1, buffer);
        }
        else if (passId == 2)
        {
            GfxDriver_SelectRenderTarget(1, buffer);
            Gfx_SetRenderState(0xE, 1, buffer);
            Gfx_SetRenderState(2, 0, buffer);
        }

        slot = (volatile unsigned int *)(uintptr_t)UINT32_C(0x1CB6364);
        do
        {
            n = 0x20;
            do
            {
                if (*slot != 0)
                {
                    count = *(volatile const int32_t *)((char *)slot - 0x324);
                    item = (volatile unsigned int *)((char *)slot - 0x320);
                    if (count > 0)
                    {
                        itemIdx = 0;
                        do
                        {
                            /* 0x465A9D/465AA4: live mask, x86 SHL modulo 32. */
                            if (*slot & (UINT32_C(1) << ((uint32_t)itemIdx & UINT32_C(31))))
                            {
                                if (passId == 2 || dword_1CCFD84 == 0)
                                    Gfx_SetRenderState(0xB, 0, buffer);
                                else
                                {
                                    Gfx_SetRenderState(0x19, 0x70, buffer);
                                    Gfx_SetRenderState(0x18, 5, buffer);
                                    Gfx_SetRenderState(0xB, 1, buffer);
                                }
                                for (listIdx = 0; listIdx < 2; listIdx++)
                                {
                                    if (item[0x58 / 4] != 0)
                                    {
                                        /* 0x465AFD/465B00: LEA arithmetic modulo 2^32. */
                                        listSlot = (_DWORD * volatile *)(uintptr_t)(
                                            (uint32_t)(uintptr_t)item + UINT32_C(0x24)
                                            + ((uint32_t)listIdx + passId * UINT32_C(2)) * UINT32_C(4));
                                        list = *listSlot;
                                        if (list != 0)
                                        {
                                            Gfx_WalkDrawList(list, buffer);
                                            /* 0x465B13: reload, not necessarily the pointer just walked. */
                                            Gfx_InvalidateDrawListStamp((int)*listSlot);
                                        }
                                    }
                                }
                            }
                            /* 0x465B30: after callbacks, also on bit/flag/NULL skips. */
                            count = *(volatile const int32_t *)((char *)slot - 0x324);
                            itemIdx = (int32_t)((uint32_t)itemIdx + UINT32_C(1));
                            item = (volatile unsigned int *)((char *)item + 0x64);
                        } while (itemIdx < count); /* 0x465B40: signed JL, no count<=8 clamp. */
                    }
                }
                slot = (volatile unsigned int *)((char *)slot + 0x44C);
            } while (--n != 0);
        } while ((int32_t)(uint32_t)(uintptr_t)slot < INT32_C(0x1CCFFE4));

        pass++;
    } while ((int32_t)(uint32_t)(uintptr_t)pass <= INT32_C(0xB7DB50));

    if (dword_1CCFD90 != 0) /* 0x465B7F: walk gate read. */
    {
        GfxDriver_SetBlendMode(0, buffer);
        GfxDriver_SelectRenderTarget(1, buffer);
        Gfx_SetRenderState(0xE, 1, buffer);

        for (p = 0; p < 2; p++)
        {
            bank = (volatile unsigned int *)(uintptr_t)UINT32_C(0x1CAD228);
            n = 0x20;
            do
            {
                if (bank[0x464 / 4] != 0)
                {
                    if (dword_1CCFD84 != 0)
                    {
                        Gfx_SetRenderState(0x19, 0x70, buffer);
                        Gfx_SetRenderState(0x18, 5, buffer);
                        Gfx_SetRenderState(0xB, 1, buffer);
                    }
                    Gfx_SetRenderState(2, (p != 0), buffer);
                    Gfx_SetRenderState(0xE, 1, buffer);
                    listSlot = (_DWORD * volatile *)((char *)bank + 0x24 + p * 8);
                    listIdx = 2;
                    do
                    {
                        Gfx_WalkDrawList(*listSlot, buffer);
                        /* 0x465C1F: reload after walk; helpers tolerate NULL. */
                        Gfx_InvalidateDrawListStamp((int)*listSlot);
                        listSlot++;
                    } while (--listIdx != 0);
                }
                bank = (volatile unsigned int *)((char *)bank + 0x470);
            } while (--n != 0);
        }
    }

    GfxDriver_SetBlendMode(4, buffer);
    GfxDriver_SelectRenderTarget(0, buffer);

    clr = (volatile unsigned int *)(uintptr_t)UINT32_C(0x1CB6368);
    do
    {
        n = 0x20;
        do
        {
            clr[-1] = 0;
            clr[0] = 0;
            clr = (volatile unsigned int *)((char *)clr + 0x44C);
        } while (--n != 0);
    } while ((int32_t)(uint32_t)(uintptr_t)clr < INT32_C(0x1CCFFE8));

    if (dword_1CCFD90 != 0) /* 0x465C89: independent late read, not a captured walk decision. */
    {
        clr = (volatile unsigned int *)(uintptr_t)UINT32_C(0x1CAD690);
        do
        {
            clr[-1] = 0;
            clr[0] = 0;
            clr = (volatile unsigned int *)((char *)clr + 0x470);
        } while ((int32_t)(uint32_t)(uintptr_t)clr < INT32_C(0x1CB6490));
    }

    /* Physical EAX residue only: 0x1CCFFE8 or 0x1CB6490, selected by the LAST gate read.
     * Not a proven draw-list result or source return type; audited callers ignore it. */
    return (_DWORD *)clr;
}
```

## Ancrages de correction / ABI

- `0x465B30 mov edx,[eax-324h]`, `0x465B36 inc ecx`, `0x465B37 add ebp,64h`, `0x465B40 jl loc_465A9D` : count vivant après chaque item, comparaison signée. `0x465AA4 shl edx,cl` recycle les bits dès 32 ; `0x465AFD/465B00 lea` n'autorise pas un débordement signé C. Le modèle ci-dessus cible la mémoire plate x86-32 ; une exécution C strictement définie hors layout demande une couche mémoire à adresses `uint32_t`, pas ces accès par pointeurs.
- `0x465B4A add eax,44Ch` / borne `0x1CCFFE4` : **96 slots = 3 lots de 32 par pass-id**, soit 288 visites pour les trois passes. `0x465B7F mov eax,[1CCFD90]` et `0x465C89 cmp [1CCFD90],esi` : walk et clear bank2 peuvent être activés différemment sous callbacks.
- `0x417879 mov DWORD [eax+58h],0` ; `0x417880 xor ecx,ecx` / `0x417884 jz` évitent la libération sur le chemin effectif. `0x4178F9 cmp ecx,[eax]` accepte encore stamp=0 si génération=0 et les autres gardes passent. Ni destruction ni garantie absolue de non-rejeu ; counts/pointeurs non effacés, fin blend 4/cible 0 sans restauration complète.
- **3 xrefs CODE, seulement 2 CALL** : `0x460D26 jmp` = **TAILJUMP** sans argument ni cleanup de cet appel ; `0x47D220 call` et `0x56BA59 call` n'ont aucun argument/cleanup propre. Le `add esp,8` à `0x47D22D` nettoie SelectRenderTarget `(1,buffer)`, celui à `0x56BA74` nettoie `(0,arg_4)` ; pas la cible. EAX ignoré à `0x47D225`, écrasé à `0x56BA5E` ; propagé par le tail-jump mais non consommé aux deux sites amont `0x45D2A8/45D2C6`.
- Wrapper `0x56BA50` : **7 fonctions / 14 sites CALL CODE** (`46FEE0`, `4A22C0`, `4A24B0`, `4A2690`, `52DA20`, `52DCF0`, `53F0F0`, deux sites chacune). Gates locales : EndPrimitivePass `B7CC20≠0`, battle `is_sleeping==0`, wrapper `209AB54≠0`. Aucun retour AL/AX/booléen établi.
- Ambiguïtés conservées : type source de retour (dont `void`), count≤8, pass-id∈0..2, génération≠0, mutations/réentrance des callbacks, sens précis des RS et spécialisation des banques. Risques conditionnels hors layout/rejeu, aucune violation runtime observée ; pas de certification safety.
