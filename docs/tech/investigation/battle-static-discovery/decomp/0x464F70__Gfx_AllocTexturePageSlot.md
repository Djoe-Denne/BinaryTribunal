# Gfx_AllocTexturePageSlot @ 0x464F70

- Instr (live): **294/294**, 18 CFG, un chunk `[0x464F70,0x46539A)`, 1066 octets ; revérifié 2026-10-09.
- Palier: high (catalogue historique, pas confiance sémantique).
- Statut: **validé par le parent le 2026-10-09**, récupération historique hors métriques pilote. Aucun IDB/Git par C6-C-R-SOL ; append parent daté, sauvegarde true et relecture finale exacte. Première ligne d'avenant tronquée à 1024 caractères IDA et conservée ; supplément complet multiligne `[semantic-correction 2026-10-09 C6-readback]`, tags uniques/préfixes inchangés.
- Provenance C: **Flash** `c_a_flash.c` (guidé par R) + **Sol** `c_b_sol.c` (indépendant, opcodes seuls) → **C6-C-R-SOL**, choix contre ASM live complet, jamais consensus/moyenne.
- Provenance sémantique: **2+1 historique**, A CONFLICT → V escalade → B blind → `semantic_r_sol.md` final **LIKELY**, conservé sans nouveau vote ni promotion CERTAIN. [Document sémantique](../semantic/0x464F70__Gfx_AllocTexturePageSlot.md).
- Type IDA observé (indice, inchangé): `void *__cdecl(int,int,int,int,int,int,int,int,int,int)`.
- Notes parent: pool nul→EAX 0 ; échec partagé→EAX **ctx** ; complet→EAX dixième création, non bool/slot/buffer. Dix owners relus ; arg_24 d'entrée gate, pixels +58 post-helper ; blit sept args, format+44 **valeur** ; JGE signé, SAR count &31, wrapping 32 bits ; x87 explicite sous contrôle original. Cache `74→B0,7C→B8`, six offsets Flash corrigés. Slot 0x64, contexte World 0x44C, branche externe 0x470 ; WORD MOVSX callers ; occupancy/OT07/AL2/TIM 0x10 absents ; pas de latch d'occupation déduit.
- Historique antérieur (non preuve du C actuel): triple GLM A/B/C, A≠B, push IDB et SetType indiqués « oui » dans l'ancien document ; métriques A/B/C 4423/6399/4229 reasoning tokens. Le commentaire IDA ancien de 6473 caractères contenant « fail→0 » n'est ni utilisé ni remplacé. Parent ajoute `[semantic-triple 2026-10-09]` et `[semantic-correction 2026-10-09 C6]` explicitant les trois retours ; aucun SetType/rename/patch.
- Pack: [notes C-R et preuves](../../../../../tools/_tmp_semantic_triple/0x464f70/c_reconcile_notes_sol.md), [C exact](../../../../../tools/_tmp_semantic_triple/0x464f70/c_reconciled_sol.c).

## C réconcilié

Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays. Le listing canonique du pack est `asm.asm`, revérifié contre les bytes live ; `asm_clean.asm` est le nom historique, non une nouvelle capture. SHA-256 live `04ec8ffc088dc8220f4ccc82ed7bb6a3ed716c67059e882687d46b6ab4b56d10`.

**Forme choisie : C à état/adresses x86 explicites**, non fonction native autonome. L'interface conserve les relectures, alias de pile, CALL/RET et x87 sans fabriquer de prototypes de callees. Backend mémoire/calls/x87 non fourni ; pas de validation runtime. Préambule, taille/plage/type, sauvegardes et corrections `add esp` sont inclus dans le bloc ci-dessous, embarqué exactement depuis le C du pack.

```c
/* Gfx_AllocTexturePageSlot @ 0x464F70 — C6-C-R-SOL, 2026-10-09.
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * Canonical pack listing: asm.asm (not the historical asm_clean.asm).
 * 294/294 instructions, 18 CFG blocks, one chunk [0x464F70,0x46539A),
 * size 0x42A = 1066 bytes; live SHA256:
 * 04ec8ffc088dc8220f4ccc82ed7bb6a3ed716c67059e882687d46b6ab4b56d10.
 * IDA hint: void *__cdecl(int,int,int,int,int,int,int,int,int,int).
 * Native: ten cdecl words, C3 RET; 0x8C locals; EBX/EBP/ESI/EDI saved.
 * Provenance: Flash c_a_flash.c (R-guided), independent Sol c_b_sol.c,
 * historical semantic_r_sol.md; decisions against live ASM, not a vote.
 * This C retains the independent machine-state lift, with named targets.
 * Flash's six shifted cache sources at +90..+AC are rejected by MOVs.
 * EAX32 exits: pool-null=0; shared-allocation failure=ctx reloaded at
 * 465088 (NOT [ctx+444], NOT bool/slot); full path=tenth creation EAX.
 * Native arg slots: entry ESP+04 ctx,+08 slot,+0C x,+10 y,+14 w,+18 h,
 * +1C mode,+20 tpage,+24 arg_20,+28 arg_24. Descriptor is frame+18,
 * length 0x84; +28/+2C/+30 overlap locals. Slot span 0x64, not 0xD0.
 * No occupancy/GF-exists/OT07/TIM-stride claim. No invented library call.
 *
 * MODEL CONTRACT (not a drop-in source prototype): memory primitives use
 * the SAME little-endian 32-bit address space, including unaligned words,
 * native stack and aliases, and do not mutate modeled registers/DF/x87.
 * cdecl_call runs the named native target with ESP at its pushed return
 * address; supplies exact memory/register/DF/x87 effects and native RET.
 * x87 primitives implement FILD m32int, FDIVR m32real, FSTP m32real under
 * the original stack/control word (precision and rounding included).
 * They take/return binary32 BITS, not a C float approximation; the live
 * constant at B69544 is 0000803F = 1.0f. Division is NOT asserted to use
 * unconditional 80-bit precision. FILD occurs before the slot clear.
 * Backends are NOT supplied. Scope: normal completion; EFLAGS except DF,
 * faults, exceptions and asynchronous instruction observations are not
 * exported. No execution/native-equivalence certificate is claimed.
 */
#include <stdint.h>

typedef struct sol_464f70_state {
    uint32_t eax, ecx, edx, ebx, esp, ebp, esi, edi;
    uint32_t df;
    void *x87;
} sol_464f70_state;

/* Named native targets, not fabricated C prototypes or library routines. */
enum sol_464f70_targets {
    FFGetBufferAddress_EA = 0x40A04A,
    Gfx_Psx2Lookup_OrPoolAlloc_B7E018_EA = 0x467160,
    sub_4653A0_EA = 0x4653A0,
    Gfx_TPageDescribePixelFormat_EA = 0x463FC0,
    Gfx_InitDrawListDesc_EA = 0x40702F,
    Texture_FindTexture_EA = 0x419410,
    TexStaging_BlitRows_EA = 0x4675C0,
    Gfx_CreateDrawList_EA = 0x416D82,
    Gfx_GetNested_Plus10_14_EA = 0x417FA6,
    Gfx_SetDescFilterMode_EA = 0x4070B0
};
extern uint32_t sol_mem_read32(uint32_t address);
extern void sol_mem_write32(uint32_t address, uint32_t bits);
extern void sol_cdecl_call(uint32_t target, sol_464f70_state *s);
extern void sol_x87_fild32(sol_464f70_state *s, uint32_t signed_bits);
extern void sol_x87_fdivr32(sol_464f70_state *s, uint32_t float_bits);
extern uint32_t sol_x87_fstp32(sol_464f70_state *s);

static uint32_t sol_sar32(uint32_t v, uint32_t count)
{
    uint32_t n = count & 31u;
    if (n == 0) return v;
    return (v >> n) | ((0u - (v >> 31)) << (32u - n));
}
static void sol_push32(sol_464f70_state *s, uint32_t v)
{
    s->esp -= 4u;
    sol_mem_write32(s->esp, v);
}
static uint32_t sol_pop32(sol_464f70_state *s)
{
    uint32_t v = sol_mem_read32(s->esp);
    s->esp += 4u;
    return v;
}
static void sol_call(sol_464f70_state *s, uint32_t target, uint32_t next_eip)
{
    sol_push32(s, next_eip); /* Preserve native CALL's stack write. */
    sol_cdecl_call(target, s);
}
#define EAX (s->eax)
#define ECX (s->ecx)
#define EDX (s->edx)
#define EBX (s->ebx)
#define ESP (s->esp)
#define EBP (s->ebp)
#define ESI (s->esi)
#define EDI (s->edi)
#define R(a) sol_mem_read32((uint32_t)(a))
#define W(a,v) sol_mem_write32((uint32_t)(a), (uint32_t)(v))
#define PUSH(v) sol_push32(s, (uint32_t)(v))
#define CALL(a,n) sol_call(s, (a), (n))

/* Entry ESP points to original return EIP. Exit value is s->eax, all 32 bits.
 * Consumes native RET's stack word; return EIP is not exported by this model. */
void Gfx_AllocTexturePageSlot_reconciled(sol_464f70_state *s)
{
    uint32_t branch_value;
    ESP -= 0x8Cu;
    sol_x87_fild32(s, R(ESP + 0xA0u)); /* 464F76: w before output stores */
    PUSH(EBX); EBX = R(ESP + 0x98u);
    PUSH(EBP); PUSH(ESI);
    sol_x87_fdivr32(s, R(0xB69544u));
    PUSH(EDI); ECX = 0x19u; EAX = 0; EDI = EBX;
    while (ECX != 0) { /* 464F97 REP STOSD, 25 DWORD, DF respected */
        W(EDI, EAX); EDI += s->df ? 0xFFFFFFFCu : 4u; --ECX;
    }
    EAX = R(ESP + 0xA8u); ECX = R(ESP + 0xACu);
    EDX = R(ESP + 0xB0u); ESI = R(ESP + 0xB8u);
    W(EBX + 0x04u, EAX); EAX = R(ESP + 0xB4u);
    W(EBX + 0x08u, ECX); ECX = R(ESP + 0xC0u);
    W(EBX + 0x0Cu, EDX); W(EBX + 0x10u, EAX);
    W(EBX + 0x14u, ESI); W(EBX + 0x20u, ECX);
    W(EBX + 0x18u, sol_x87_fstp32(s));
    sol_x87_fild32(s, R(ESP + 0xB4u)); /* h reloaded AFTER stores */
    sol_x87_fdivr32(s, R(0xB69544u));
    W(EBX + 0x1Cu, sol_x87_fstp32(s));
    CALL(FFGetBufferAddress_EA, 0x464FEDu); EBP = EAX;
    EAX = R(ESP + 0xBCu); EDI = EAX; EDX = R(ESP + 0xC4u);
    EAX = sol_sar32(EAX, 4); EAX &= 1u; EDI &= 0xFu; EAX <<= 8;
    W(ESP + 0x10u, EAX); EAX = R(EBX + 0x54u); EDI <<= 6;
    branch_value = EAX; /* 465015 TEST before the two following stores */
    W(ESP + 0x14u, EDI); W(EBX + 0x58u, EDX);
    if (branch_value != 0) goto loc_465038;
    PUSH(0xF0u); CALL(Gfx_Psx2Lookup_OrPoolAlloc_B7E018_EA, 0x46502Au);
    ESP += 4; W(EBX + 0x54u, EAX);
    if (EAX == 0) goto loc_46538F; /* pool-null returns zero */
loc_465038:
    EAX = R(ESP + 0xA0u); ECX = R(EAX + 0x444u);
    if (ECX != 0) goto loc_46509D;
    if ((ESI ^ 0x80000000u) >= (2u ^ 0x80000000u)) goto loc_46509D;
    /* 46504C JGE signed, no signed-conversion/overflow UB */
    if (ESI != 0) goto loc_46506E;
    PUSH(0x4000u); CALL(sub_4653A0_EA, 0x46505Cu);
    ECX = R(ESP + 0xA4u); ESP += 4; W(ECX + 0x444u, EAX);
    goto loc_465088;
loc_46506E:
    PUSH(0x8000u); CALL(sub_4653A0_EA, 0x465078u); /* also mode < 0 */
    EDX = R(ESP + 0xA4u); ESP += 4; W(EDX + 0x444u, EAX);
loc_465088:
    EAX = R(ESP + 0xA0u); ECX = R(EAX + 0x444u);
    if (ECX == 0) goto loc_46538F; /* EAX=ctx, not buffer/zero/bool */
loc_46509D:
    ECX = R(ESP + 0xB4u); EDX = R(ESP + 0xB0u); EAX = R(ESP + 0xA0u);
    PUSH(ECX); PUSH(EDX); PUSH(ESI); PUSH(EBX); PUSH(EAX);
    CALL(Gfx_TPageDescribePixelFormat_EA, 0x4650BCu); /* result ignored */
    ECX = ESP + 0x2Cu; PUSH(ECX); PUSH(4);
    CALL(Gfx_InitDrawListDesc_EA, 0x4650C8u);
    EAX = R(EBX + 0x54u); ESP += 0x1Cu; /* format 5 + init 2 args */
    W(ESP + 0x40u, EAX); /* desc+28; pool reloaded AFTER helpers */
    if (ESI != 2) goto loc_4651DC;
    if (R(0xB7DB44u) != 0xFFFFFFFFu) goto loc_465124;
    PUSH(EBP); EDX = ESP + 0x1Cu; PUSH(EAX); PUSH(EDX);
    CALL(Texture_FindTexture_EA, 0x4650F0u); ESP += 0xCu;
    if (EAX == 0) goto loc_465124;
    EDX = R(EAX + 0x44u); ECX = 0; ESI = EAX;
    ECX = (EDX == 0x7E0u); W(0xB7DB44u, ECX); /* SETZ, not occupancy */
    ECX = 0x21u; EDI = 0x1CCFCC0u;
    while (ECX != 0) { /* REP MOVSD, 132 bytes, sequential/overlap-aware */
        uint32_t word = R(ESI); W(EDI, word);
        ESI += s->df ? 0xFFFFFFFCu : 4u;
        EDI += s->df ? 0xFFFFFFFCu : 4u; --ECX;
    }
    ESI = R(ESP + 0xB8u); EDI = R(ESP + 0x14u);
loc_465124:
    if (R(0xB7DB44u) != 1) goto loc_4651DC;
    EAX = R(EBX + 0x54u);
    EDX = R(0x1CCFCF0u); ECX = R(0x1CCFCF4u); W(EAX + 0x6Cu, EDX);
    EDX = R(0x1CCFCFCu); W(EAX + 0x70u, ECX);
    ECX = R(0x1CCFD00u); W(EAX + 0x78u, EDX);
    EDX = R(0x1CCFD04u); W(EAX + 0x7Cu, ECX);
    ECX = R(0x1CCFD0Cu); W(EAX + 0x80u, EDX);
    EDX = R(0x1CCFD10u); W(EAX + 0x88u, ECX);
    ECX = R(0x1CCFD14u); W(EAX + 0x8Cu, EDX);
    EDX = R(0x1CCFD1Cu); W(EAX + 0x90u, ECX); /* +54 -> +90, NOT +5C */
    ECX = R(0x1CCFD20u); W(EAX + 0x98u, EDX); /* +5C -> +98 */
    EDX = R(0x1CCFD24u); W(EAX + 0x9Cu, ECX); /* +60 -> +9C */
    ECX = R(0x1CCFD2Cu); W(EAX + 0xA0u, EDX); /* +64 -> +A0 */
    EDX = R(0x1CCFD30u); W(EAX + 0xA8u, ECX); /* +6C -> +A8 */
    ECX = R(0x1CCFD34u); W(EAX + 0xACu, EDX); /* +70 -> +AC */
    EDX = R(0x1CCFD3Cu); W(EAX + 0xB0u, ECX); /* +74 -> +B0 */
    W(EAX + 0xB8u, EDX); /* +7C -> +B8 */
loc_4651DC:
    EAX = R(ESP + 0xC4u); /* arg_24 input slot, NOT current slot+58 */
    if (EAX != 0) goto loc_46523D;
    EAX = R(ESP + 0xB4u); EDX = R(EBX + 0x54u); ECX = R(ESP + 0xB0u);
    PUSH(ESI); PUSH(EAX); EAX = R(EDX + 0x44u); PUSH(ECX);
    ECX = R(EBX + 0x58u); /* pixels AFTER helper; may differ from arg_24 */
    EDX = R(ESP + 0x1Cu); PUSH(EAX); /* fourth arg = format+44 VALUE */
    EAX = R(ESP + 0xB8u); PUSH(ECX); ECX = 2; PUSH(0x800u);
    ECX -= ESI; EAX = sol_sar32(EAX, ECX); /* (2-mode)&31 */
    ECX = R(ESP + 0xC4u); EDX += ECX; EDX <<= 10; EDI += EAX;
    EAX = R(0x1CB602Cu); EDX += EDI; ECX = EAX + EDX * 2u;
    PUSH(ECX); /* sourceVRAM,2048,pixels,format_value,w,h,mode: 7 words */
    CALL(TexStaging_BlitRows_EA, 0x46523Au); ESP += 0x1Cu;
loc_46523D:
    EDX = R(EBP + 0xA50u); EAX = ESP + 0x18u; /* owner reload 1 */
    PUSH(EDX); PUSH(0); PUSH(EAX); PUSH(6); PUSH(1);
    CALL(Gfx_CreateDrawList_EA, 0x465254u);
    PUSH(EAX); W(EBX + 0x24u, EAX); W(ESP + 0x5Cu, 1); /* desc+2C */
    CALL(Gfx_GetNested_Plus10_14_EA, 0x465265u);
    W(ESP + 0x60u, EAX); /* desc+30; after first creation only */
    ECX = R(EBP + 0xA50u); PUSH(ECX); EDX = ESP + 0x34u; /* reload 2 */
    PUSH(0); PUSH(EDX); PUSH(0xEu); PUSH(1);
    CALL(Gfx_CreateDrawList_EA, 0x465280u); W(EBX + 0x28u, EAX);
    EAX = ESP + 0x44u; PUSH(EAX); PUSH(4);
    CALL(Gfx_SetDescFilterMode_EA, 0x46528Fu);
    ECX = R(EBP + 0xA50u); EDX = ESP + 0x4Cu; /* reload 3 */
    PUSH(ECX); PUSH(0); PUSH(EDX); PUSH(6); PUSH(1);
    CALL(Gfx_CreateDrawList_EA, 0x4652A6u); ESP += 0x48u;
    W(EBX + 0x2Cu, EAX); /* 5+1+5+2+5 arguments cleaned */
    EAX = R(EBP + 0xA50u); ECX = ESP + 0x18u; /* reload 4 */
    PUSH(EAX); PUSH(0); PUSH(ECX); PUSH(0xEu); PUSH(1);
    CALL(Gfx_CreateDrawList_EA, 0x4652C3u);
    EDX = ESP + 0x2Cu; W(EBX + 0x30u, EAX); PUSH(EDX); PUSH(0);
    CALL(Gfx_SetDescFilterMode_EA, 0x4652D2u);
    EAX = R(EBP + 0xA50u); ECX = ESP + 0x34u; /* reload 5 */
    PUSH(EAX); PUSH(0); PUSH(ECX); PUSH(6); PUSH(1);
    CALL(Gfx_CreateDrawList_EA, 0x4652E9u);
    EDX = R(EBP + 0xA50u); W(EBX + 0x34u, EAX); PUSH(EDX); /* reload 6 */
    EAX = ESP + 0x4Cu; PUSH(0); PUSH(EAX); PUSH(0xEu); PUSH(1);
    CALL(Gfx_CreateDrawList_EA, 0x465303u); ESP += 0x44u; /* 5+2+5+5 */
    ECX = ESP + 0x18u; W(EBX + 0x38u, EAX); PUSH(ECX); PUSH(1);
    CALL(Gfx_SetDescFilterMode_EA, 0x465315u);
    EDX = R(EBP + 0xA50u); EAX = ESP + 0x20u; /* reload 7 */
    PUSH(EDX); PUSH(0); PUSH(EAX); PUSH(6); PUSH(1);
    CALL(Gfx_CreateDrawList_EA, 0x46532Cu); W(EBX + 0x3Cu, EAX);
    ECX = R(EBP + 0xA50u); EDX = ESP + 0x34u; /* reload 8 */
    PUSH(ECX); PUSH(0); PUSH(EDX); PUSH(0xEu); PUSH(1);
    CALL(Gfx_CreateDrawList_EA, 0x465346u); W(EBX + 0x40u, EAX);
    EAX = ESP + 0x48u; PUSH(EAX); PUSH(3);
    CALL(Gfx_SetDescFilterMode_EA, 0x465355u);
    ECX = R(EBP + 0xA50u); EDX = ESP + 0x50u; /* reload 9 */
    PUSH(ECX); PUSH(0); PUSH(EDX); PUSH(6); PUSH(1);
    CALL(Gfx_CreateDrawList_EA, 0x46536Cu); ESP += 0x4Cu; /* 2+5+5+2+5 */
    W(EBX + 0x4Cu, EAX); /* no direct list store at +44/+48 */
    EAX = R(EBP + 0xA50u); ECX = ESP + 0x18u; /* reload 10 */
    PUSH(EAX); PUSH(0); PUSH(ECX); PUSH(0xEu); PUSH(1);
    CALL(Gfx_CreateDrawList_EA, 0x465389u); ESP += 0x14u;
    W(EBX + 0x50u, EAX); /* EAX of tenth creation, no success test */
loc_46538F:
    EDI = sol_pop32(s); ESI = sol_pop32(s);
    EBP = sol_pop32(s); EBX = sol_pop32(s); ESP += 0x8Cu;
    (void)sol_pop32(s); /* C3 RET, does NOT normalize/change EAX */
}
#undef EAX
#undef ECX
#undef EDX
#undef EBX
#undef ESP
#undef EBP
#undef ESI
#undef EDI
#undef R
#undef W
#undef PUSH
#undef CALL
```

## Portée de validation

Parent a relu les 294 instructions natives et le C final : hash frais, quatre sites caller CODE/deux fonctions, dix callees/23 CALL et 18 CFG/chunk contrôlés ; ABI, cleanups différés, strides développés, polarités, trois retours EAX32 et deux preuves nom conformes. Bloc C identique au fichier du pack ; les six sources cache corrigées, quinze mappings, dix owners relus et leur ordre mémoire, x87 sous contrôle original et gating arg_24/reload +58 sont effectivement propagés. Revue détaillée et divergences dans `c_reconcile_notes_sol.md`. Pas de compilateur/backend ni test runtime exécuté. Callgraph MCP brut **TRUNCATED** ; statut LIKELY métier historique non promu CERTAIN. Ownership/aliasing, `arg_20`, chaîne TIM amont et effets des callbacks restent ouverts. **§5.6 parent vert ; append/save/readback exact**, pas une attestation d'équivalence native ou de C ISO hors invariants.
