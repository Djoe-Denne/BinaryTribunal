# C A — 0x0050B830

## Identité, portée et provenance

- Mission `ff8-decomp-semantics-20261011-r01`, groupe `g17`, tâche `task_mv44siqh_00bx_x38j11`.
- Auteur indépendant : `pool-217`, session `ses_ecf08e546ffezeKarulsdGLx9Q`, volet C A uniquement. Modèle/variante **openai/gpt-6-astra / max**, conformément à l'attestation d'admission du lead ; l'ancienne mention « high » n'est pas la référence effective.
- Contexte commun : exploration factuelle autorisée, puis projection `inputs/ff8-decomp-semantics-20261011-r01/g17/0x50B830.readable/` et supplément commun `0x50B830.supplemental-v1/`. Aucun C cible antérieur, production voisine, autre volet ou ledger consulté.
- Reconstruction fondée sur les 195 instructions, les 687 octets de l'unique chunk `[0x0050B830,0x0050BADF)`, et les 32 octets de table `[0x0050BAE0,0x0050BB00)`. Les noms et commentaires IDA ne servent pas de preuve de fonction métier.

Hashes **cités des manifests / de l'attestation parent, non recalculés par cet auteur** :

| Élément | SHA-256 |
|---|---|
| EXE source | `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570` |
| Packet original | `e89c8ab63b9fd82b3051f599dea4bcd4e2d1bc49457d7a0afe239ac230aafbbf` |
| Manifest readable | `ee68ab702a3c81b773646633c43449c19551c802e947faf107877e9368d0cf82` |
| Compaction commune | `f785a0931af7bb175c494b885cc51feab037139d05521e1686d110f79a2e671c` |
| Manifest supplément v1 | `ddf0c47e293841fdd067f43f05b0f582c733984a96d5a3317883a75f157a8e3a` |
| Octets du chunk, attestés dans `provenance.json` | `281aa3bfdeee97c2a7aa29322242e577b0b68b68ba21f25e3f6f7e6f2a2a7e62` |
| Octets de table | `14b7475cdc947e2ee79510baa8893f19d545b0b148b36f94cb77f9a785482ed5` |

Le gel initial indique une exportation au `2026-10-11T16:38:25.140966+00:00`. Le supplément indique une capture statique au `2026-10-12T17:03:18.889793+00:00`, avec égalité gel/IDB/PE du chunk et égalité IDB/PE de la table, vérifiées **par le superviseur**, pas dans cette session. Le blocage initial de table manquante est levé par ce supplément ; aucune case n'est déduite du seul commentaire IDA.

## ABI observée et forme du C

Interface native conventionnelle observée : un DWORD argument à `[ESP_entry+4]`, utilisé comme adresse ; retour DWORD dans EAX, explicitement `0` ou `2` sur les sorties locales normales ; `RET` sans immédiat. Une notation de prototype est `uint32_t __cdecl sub_0050B830(void *node)`, **sans validation d'un type de structure**. Le code sauve/restaure EBP, ESI et EDI, ne modifie pas directement EBX, et n'utilise pas de frame EBP conventionnelle : EBP contient l'adresse argument.

Particularité importante : `0x50B841` **écrase le DWORD argument du caller** à `[ESP_entry+4]` avec le DWORD lu à `[node+0x10]`. `0x50BAC6` recharge cette case de pile, et non `[node+0x10]`. Une simple variable locale C « payload » ne restituerait pas la mutation physique de la case, ni une éventuelle modification de celle-ci par un callee.

Pour cette raison, le C complet ci-dessous est une **transcription C à état x86 explicite**, pas une prétendue fonction directement substituable à l'adresse native. Il conserve les registres, les largeurs mémoire, la pile native (y compris arguments non encore nettoyés et adresses de retour), les registres partiels et les flags arithmétiques. Les contrôles sont du C structuré/goto ; aucun décodeur d'instructions n'est utilisé. Il ne devine ni prototypes complets ni effets internes des 15 callees directs ou du callback indirect.

Seule frontière externe : `X86Bus.read/write/run_call`, adaptation de mémoire/exécution **non présente dans le binaire** et explicitement distincte de ses callees. Elle doit fournir :

1. Accès LE de largeur exacte 1/2/4 octets aux adresses x86 32 bits, dans l'ordre émis, y compris pile ; les accès invalides ne sont pas silencieusement ignorés.
2. Exécution du callee réel sélectionné par `cpu->eip` jusqu'à son retour attendu, avec tous ses effets mémoire/registres/flags et son véritable effet sur ESP. Aucune préservation implicite n'est inventée par le pont. Le CALL a déjà empilé l'adresse de retour ; `run_call` ne doit pas l'empiler une seconde fois ni supprimer les arguments à la place du code cible.
3. Aucun changement asynchrone du code/table gelés. La table est intégrée comme contrôle C constant après vérification du supplément. Une auto-modification de la table nécessiterait une autre interface de dispatch.

`eflags_valid` distingue les flags architecturaux définis de ceux laissés indéfinis par une instruction. Leur valeur concrète quand ils sont indéfinis n'est pas revendiquée. EIP est significatif aux frontières CALL/RET, pas comme trace de single-step des instructions internes. Aucun remplacement de callee par une library call n'est effectué.

## C complet

```c
#include <stdint.h>

typedef uint8_t  u8;
typedef uint16_t u16;
typedef uint32_t u32;
typedef uint64_t u64;

enum {
    XCF = 0x001u, XPF = 0x004u, XAF = 0x010u,
    XZF = 0x040u, XSF = 0x080u, XOF = 0x800u,
    XARITH = XCF | XPF | XAF | XZF | XSF | XOF
};

typedef struct X86 {
    u32 eax, ecx, edx, ebx, esp, ebp, esi, edi, eip;
    u32 eflags;
    u32 eflags_valid;
} X86;

typedef struct X86Bus {
    void *opaque;
    u32  (*read)(void *opaque, u32 address, unsigned bytes);
    void (*write)(void *opaque, u32 address, unsigned bytes, u32 value);
    void (*run_call)(void *opaque, X86 *cpu, u32 expected_return_ea);
} X86Bus;

/* Access widths are not weakened even when subsequent code masks to a byte. */
static u8 r8(X86Bus *m, u32 a) {
    return (u8)m->read(m->opaque, a, 1u);
}
static u16 r16(X86Bus *m, u32 a) {
    return (u16)m->read(m->opaque, a, 2u);
}
static u32 r32(X86Bus *m, u32 a) {
    return m->read(m->opaque, a, 4u);
}
static void w8(X86Bus *m, u32 a, u32 v) {
    m->write(m->opaque, a, 1u, (u8)v);
}
static void w16(X86Bus *m, u32 a, u32 v) {
    m->write(m->opaque, a, 2u, (u16)v);
}
static void w32(X86Bus *m, u32 a, u32 v) {
    m->write(m->opaque, a, 4u, v);
}

static u32 put_lo8(u32 old, u32 v) {
    return (old & UINT32_C(0xffffff00)) | (v & 0xffu);
}
static u32 put_hi8(u32 old, u32 v) {
    return (old & UINT32_C(0xffff00ff)) | ((v & 0xffu) << 8);
}
static u32 put_lo16(u32 old, u32 v) {
    return (old & UINT32_C(0xffff0000)) | (v & 0xffffu);
}

/* Only widths 8, 16 and 32 are used below. All arithmetic is unsigned. */
static u32 width_mask(unsigned bits) {
    return bits == 32u ? UINT32_MAX : (UINT32_C(1) << bits) - 1u;
}
static u32 szp(u32 v, unsigned bits) {
    u32 r = v & width_mask(bits);
    u32 p = r & 0xffu;
    u32 f = 0;
    p ^= p >> 4;
    p ^= p >> 2;
    p ^= p >> 1;
    if ((p & 1u) == 0u) f |= XPF;
    if (r == 0u) f |= XZF;
    if (r & (UINT32_C(1) << (bits - 1u))) f |= XSF;
    return f;
}
static void arith_flags(X86 *x, u32 value, u32 defined) {
    x->eflags = (x->eflags & ~(u32)XARITH) | (value & XARITH);
    x->eflags_valid = (x->eflags_valid & ~(u32)XARITH)
                    | (defined & XARITH);
}
static u32 logic(X86 *x, u32 value, unsigned bits) {
    u32 r = value & width_mask(bits);
    /* AND/OR/XOR/TEST: CF=OF=0; AF is architecturally undefined. */
    arith_flags(x, szp(r, bits), XCF | XPF | XZF | XSF | XOF);
    return r;
}
static u32 addn(X86 *x, u32 a, u32 b, unsigned bits) {
    u32 mask = width_mask(bits);
    u32 sign = UINT32_C(1) << (bits - 1u);
    u64 wide;
    u32 r, f;
    a &= mask;
    b &= mask;
    wide = (u64)a + (u64)b;
    r = (u32)wide & mask;
    f = szp(r, bits);
    if (wide > mask) f |= XCF;
    if ((a ^ b ^ r) & 0x10u) f |= XAF;
    if ((~(a ^ b) & (a ^ r)) & sign) f |= XOF;
    arith_flags(x, f, XARITH);
    return r;
}
static void cmpn(X86 *x, u32 a, u32 b, unsigned bits) {
    u32 mask = width_mask(bits);
    u32 sign = UINT32_C(1) << (bits - 1u);
    u32 r, f;
    a &= mask;
    b &= mask;
    r = (a - b) & mask;
    f = szp(r, bits);
    if (a < b) f |= XCF;
    if ((a ^ b ^ r) & 0x10u) f |= XAF;
    if (((a ^ b) & (a ^ r)) & sign) f |= XOF;
    arith_flags(x, f, XARITH);
}
static u32 incn(X86 *x, u32 v, unsigned bits) {
    u32 old_cf = x->eflags & XCF;
    u32 old_cf_valid = x->eflags_valid & XCF;
    u32 r = addn(x, v, 1u, bits);
    /* INC preserves CF, including whether its input value was defined. */
    x->eflags = (x->eflags & ~(u32)XCF) | old_cf;
    x->eflags_valid = (x->eflags_valid & ~(u32)XCF) | old_cf_valid;
    return r;
}
static u32 shln(X86 *x, u32 v, u32 count, unsigned bits) {
    u32 r, f, defined, cf = 0;
    v &= width_mask(bits);
    count &= 31u;                 /* x86 CL count mask, also for byte SHL */
    if (count == 0u) return v;     /* no flag modification */
    r = (u32)(((u64)v << count) & width_mask(bits));
    f = szp(r, bits);
    defined = XPF | XZF | XSF;    /* AF undefined; OF defined only for 1 */
    if (count < bits) {
        cf = (v >> (bits - count)) & 1u;
        defined |= XCF;
        if (cf) f |= XCF;
    }
    if (count == 1u) {
        defined |= XOF;
        if (((r >> (bits - 1u)) & 1u) ^ cf) f |= XOF;
    }
    arith_flags(x, f, defined);
    return r;
}
static int zero_flag(const X86 *x) {
    return (x->eflags & XZF) != 0u;
}
static int less_signed(const X86 *x) {
    return ((x->eflags & XSF) != 0u) != ((x->eflags & XOF) != 0u);
}
static int above_unsigned(const X86 *x) {
    return (x->eflags & (XCF | XZF)) == 0u;
}

/* PUSH/POP/CALL/RET do not themselves alter arithmetic flags. */
static void push32(X86Bus *m, X86 *x, u32 value) {
    x->esp -= 4u;
    w32(m, x->esp, value);
}
static u32 pop32(X86Bus *m, X86 *x) {
    u32 value = r32(m, x->esp);
    x->esp += 4u;
    return value;
}
static void native_call(X86Bus *m, X86 *x, u32 target, u32 return_ea) {
    push32(m, x, return_ea);
    x->eip = target;
    m->run_call(m->opaque, x, return_ea);
}

/*
 * Entry: x is the machine state immediately before instruction 0050B830.
 * Exit:  x includes the native RET (EIP popped, ESP advanced by four).
 * No synthetic callee implementation or native semantic name is assumed.
 */
void c_0050B830(X86Bus *m, X86 *x)
{
    /* 0050B830..0050B853: preserve the actual overwritten argument home. */
    push32(m, x, x->ebp);
    x->ebp = r32(m, x->esp + 8u);
    push32(m, x, x->esi);
    push32(m, x, x->edi);
    x->eax = r32(m, x->ebp + 0x10u);
    w8(m, 0x01d99a56u, 0xffu);
    w32(m, x->esp + 0x10u, x->eax);
    x->eax = logic(x, 0u, 32u);
    x->eax = put_lo8(x->eax, r8(m, x->ebp + 0x0du));
    cmpn(x, x->eax, 7u, 32u);
    if (above_unsigned(x)) goto L_50B92E;

    /* 0050B853: mapping is from all eight raw LE DWORDs in supplement v1. */
    switch (x->eax) {
        case 0u: goto L_50B85A;
        case 1u: goto L_50B87E;
        case 2u: goto L_50B934;
        case 3u: goto L_50B9B9;
        case 4u: goto L_50B9C9;
        case 5u: goto L_50B9EE;
        case 6u: goto L_50BA2B;
        case 7u: goto L_50BA60;
        default: goto L_50B92E;   /* unreachable after the unsigned guard */
    }

L_50B85A:
    push32(m, x, 0x40u);
    push32(m, x, 0x1au);
    native_call(m, x, 0x00508580u, 0x0050b863u);
    x->esp = addn(x, x->esp, 8u, 32u);
    (void)logic(x, x->eax & x->eax, 32u);
    if (!zero_flag(x)) goto L_50B92E;
    /* 0050B86E */
    native_call(m, x, 0x00501190u, 0x0050b873u);
    (void)logic(x, x->eax & x->eax, 32u);
    if (!zero_flag(x)) goto L_50B92E;
    /* 0050B87B: reload the current byte; do not increment a cached selector. */
    w8(m, x->ebp + 0x0du, incn(x, r8(m, x->ebp + 0x0du), 8u));

L_50B87E:
    x->ecx = r32(m, 0x01d99a50u);
    x->eax = put_lo16(x->eax, r16(m, x->ecx + 4u));
    cmpn(x, x->eax, 7u, 16u);
    if (x->eflags & XCF) goto L_50B894;
    /* 0050B88E */
    cmpn(x, x->eax, 0x0au, 16u);
    if (x->eflags & (XCF | XZF)) goto L_50B899;
L_50B894:
    native_call(m, x, 0x0050a750u, 0x0050b899u);
L_50B899:
    x->eax = r32(m, 0x01d96a9cu);
    w8(m, 0x01d97705u, logic(x, r8(m, 0x01d97705u) | 0x80u, 8u));
    x->eax = put_lo8(x->eax, logic(x, (x->eax & 0xffu) | 0x10u, 8u));
    w32(m, 0x01d96a9cu, x->eax);
    native_call(m, x, 0x0050afc0u, 0x0050b8b1u);
    w8(m, 0x01d99a6cu, 0u);
    x->edi = logic(x, 0u, 32u);
    x->esi = 0x01d972c0u;
L_50B8BF:
    (void)logic(x, r8(m, x->esi) & 2u, 8u);
    if (zero_flag(x)) goto L_50B8E1;
    /* 0050B8C4 */
    push32(m, x, 0x0bu);
    push32(m, x, x->esi);
    native_call(m, x, 0x0050c090u, 0x0050b8ccu);
    x->eax = put_lo8(x->eax, r8(m, 0x01d99a6cu));
    x->edx = put_lo8(x->edx, 1u);
    x->ecx = x->edi;
    x->esp = addn(x, x->esp, 8u, 32u);
    x->edx = put_lo8(x->edx, shln(x, x->edx, x->ecx, 8u));
    x->eax = put_lo8(x->eax, logic(x, x->eax | x->edx, 8u));
    w8(m, 0x01d99a6cu, x->eax);
L_50B8E1:
    x->esi = addn(x, x->esi, 0x9cu, 32u);
    x->edi = incn(x, x->edi, 32u);
    cmpn(x, x->esi, 0x01d97494u, 32u);
    if (less_signed(x)) goto L_50B8BF;
    /* 0050B8F0: all eight argument slots remain until the ADD ESP,20h. */
    push32(m, x, 0x80u);
    push32(m, x, 0u);
    push32(m, x, 0x18u);
    native_call(m, x, 0x00501740u, 0x0050b8feu);
    push32(m, x, 0x80u);
    push32(m, x, 0u);
    push32(m, x, 0x19u);
    native_call(m, x, 0x00501740u, 0x0050b90cu);
    x->ecx = r32(m, 0x01d99a50u);
    x->eax = logic(x, 0u, 32u);
    push32(m, x, 0x021dfec4u);
    x->eax = put_lo16(x->eax, r16(m, x->ecx + 6u));
    push32(m, x, x->eax);
    native_call(m, x, 0x0050af20u, 0x0050b923u);
    x->eax = put_lo8(x->eax, r8(m, x->ebp + 0x0du));
    x->esp = addn(x, x->esp, 0x20u, 32u);
    x->eax = put_lo8(x->eax, incn(x, x->eax, 8u));
    w8(m, x->ebp + 0x0du, x->eax);

L_50B92E:
    x->edi = pop32(m, x);
    x->esi = pop32(m, x);
    x->eax = logic(x, 0u, 32u);
    x->ebp = pop32(m, x);
    x->eip = pop32(m, x);         /* 0050B933 RET */
    return;

L_50B934:
    x->eax = r32(m, 0x01d999c8u); /* raw bytes A1 C8 99 D9 01 */
    (void)logic(x, x->eax & x->eax, 32u);
    if (less_signed(x)) goto L_50B92E;
    /* 0050B93D: DWORD load followed by a mask, not an invented BYTE load. */
    x->edx = r32(m, 0x01d99a6cu);
    x->ecx = logic(x, 0u, 32u);
    x->edx = logic(x, x->edx & 0xffu, 32u);
    x->eax = 0x01d972c0u;
L_50B950:
    x->esi = 1u;
    x->esi = shln(x, x->esi, x->ecx, 32u);
    (void)logic(x, x->edx & x->esi, 32u);
    if (zero_flag(x)) goto L_50B960;
    /* 0050B95B */
    (void)logic(x, r8(m, x->eax) & 4u, 8u);
    if (zero_flag(x)) goto L_50B92E;
L_50B960:
    x->eax = addn(x, x->eax, 0x9cu, 32u);
    x->ecx = incn(x, x->ecx, 32u);
    cmpn(x, x->eax, 0x01d97494u, 32u);
    if (less_signed(x)) goto L_50B950;
    /* 0050B96D: the global mask is re-read after the external call. */
    native_call(m, x, 0x0046b440u, 0x0050b972u);
    (void)logic(x, r8(m, 0x01d99a6cu) & 4u, 8u);
    if (zero_flag(x)) goto L_50B98B;
    /* 0050B97B */
    w16(m, 0x01d973f8u, logic(x, r16(m, 0x01d973f8u) & 0xfffdu, 16u));
    w8(m, 0x01d97459u, 0u);
L_50B98B:
    x->eax = r32(m, 0x021dfec4u);
    push32(m, x, 0x01d99a78u);
    w32(m, 0x021dfec8u, x->eax);
    w8(m, 0x01d96dc4u, 1u);
    native_call(m, x, x->eax, 0x0050b9a3u); /* CALL EAX at 0050B9A1 */
    w32(m, 0x01d96aacu, x->eax);
    x->eax = put_lo8(x->eax, r8(m, x->ebp + 0x0du));
    x->esp = addn(x, x->esp, 4u, 32u);
    x->eax = put_lo8(x->eax, incn(x, x->eax, 8u));
    w8(m, x->ebp + 0x0du, x->eax);
    x->eax = logic(x, 0u, 32u);
    x->edi = pop32(m, x);
    x->esi = pop32(m, x);
    x->ebp = pop32(m, x);
    x->eip = pop32(m, x);         /* 0050B9B8 RET; no fallthrough to case 3 */
    return;

L_50B9B9:
    native_call(m, x, 0x0050ae80u, 0x0050b9beu);
    (void)logic(x, x->eax & x->eax, 32u);
    if (!zero_flag(x)) goto L_50B92E;
    w8(m, x->ebp + 0x0du, incn(x, r8(m, x->ebp + 0x0du), 8u));

L_50B9C9:
    (void)logic(x, r8(m, 0x01d99a6cu) & 4u, 8u);
    if (zero_flag(x)) goto L_50B9EB;
    /* 0050B9D2 */
    x->edx = r32(m, 0x01d973fcu);
    push32(m, x, 0u);
    x->edx = logic(x, x->edx & 0xffu, 32u);
    push32(m, x, 2u);
    push32(m, x, x->edx);
    native_call(m, x, 0x00507080u, 0x0050b9e8u);
    x->esp = addn(x, x->esp, 0x0cu, 32u);
L_50B9EB:
    w8(m, x->ebp + 0x0du, incn(x, r8(m, x->ebp + 0x0du), 8u));

L_50B9EE:
    native_call(m, x, 0x00507070u, 0x0050b9f3u);
    (void)logic(x, x->eax & x->eax, 32u);
    if (!zero_flag(x)) goto L_50B92E;
    /* 0050B9FB */
    (void)logic(x, r8(m, 0x01d99a6cu) & 4u, 8u);
    if (zero_flag(x)) goto L_50BA28;
    /* 0050BA04: retain the first argument slot across the next CALL. */
    push32(m, x, 0x01d973f8u);
    native_call(m, x, 0x0050b810u, 0x0050ba0eu);
    x->eax = r32(m, 0x01d973fcu);
    push32(m, x, 0u);
    x->eax = logic(x, x->eax & 0xffu, 32u);
    push32(m, x, 2u);
    x->eax = put_hi8(x->eax,
        logic(x, ((x->eax >> 8) & 0xffu) | 0x10u, 8u));
    push32(m, x, x->eax);
    native_call(m, x, 0x00507080u, 0x0050ba25u);
    x->esp = addn(x, x->esp, 0x10u, 32u);
L_50BA28:
    w8(m, x->ebp + 0x0du, incn(x, r8(m, x->ebp + 0x0du), 8u));

L_50BA2B:
    native_call(m, x, 0x00507070u, 0x0050ba30u);
    (void)logic(x, x->eax & x->eax, 32u);
    if (!zero_flag(x)) goto L_50B92E;
    /* 0050BA38 */
    (void)logic(x, r8(m, 0x01d99a6cu) & 2u, 8u);
    if (zero_flag(x)) goto L_50BA5D;
    /* 0050BA41 */
    x->ecx = r32(m, 0x01d97360u);
    push32(m, x, 0u);
    x->ecx = logic(x, x->ecx & 0xffu, 32u);
    push32(m, x, 1u);
    x->ecx = put_hi8(x->ecx,
        logic(x, ((x->ecx >> 8) & 0xffu) | 0x10u, 8u));
    push32(m, x, x->ecx);
    native_call(m, x, 0x00507080u, 0x0050ba5au);
    x->esp = addn(x, x->esp, 0x0cu, 32u);
L_50BA5D:
    w8(m, x->ebp + 0x0du, incn(x, r8(m, x->ebp + 0x0du), 8u));

L_50BA60:
    native_call(m, x, 0x00507070u, 0x0050ba65u);
    (void)logic(x, x->eax & x->eax, 32u);
    if (!zero_flag(x)) goto L_50B92E;
    /* 0050BA6D */
    x->edi = logic(x, 0u, 32u);
    x->esi = 0x01d972c0u;
L_50BA74:
    x->eax = put_lo8(x->eax, r8(m, 0x01d99a6cu));
    x->edx = 1u;
    x->ecx = x->edi;
    x->edx = shln(x, x->edx, x->ecx, 32u);
    (void)logic(x, x->edx & x->eax, 8u); /* TEST DL,AL, not EDX,EAX */
    if (zero_flag(x)) goto L_50BAA4;
    /* 0050BA86 */
    w8(m, x->esi, logic(x, r8(m, x->esi) | 2u, 8u));
    push32(m, x, x->esi);
    native_call(m, x, 0x00509c10u, 0x0050ba8fu);
    x->eax = put_hi8(x->eax,
        logic(x, ((x->eax >> 8) & 0xffu) | 0x10u, 8u));
    push32(m, x, x->eax);         /* entire EAX, upper 16 bits preserved */
    push32(m, x, x->esi);
    native_call(m, x, 0x00505c00u, 0x0050ba99u);
    push32(m, x, 0x0cu);
    push32(m, x, x->esi);
    native_call(m, x, 0x0050c090u, 0x0050baa1u);
    x->esp = addn(x, x->esp, 0x14u, 32u);
L_50BAA4:
    x->esi = addn(x, x->esi, 0x9cu, 32u);
    x->edi = incn(x, x->edi, 32u);
    cmpn(x, x->esi, 0x01d97494u, 32u);
    if (less_signed(x)) goto L_50BA74;
    /* 0050BAB3..0050BADE */
    native_call(m, x, 0x0050aed0u, 0x0050bab8u);
    x->eax = r32(m, 0x01d96a9cu);
    x->edi = pop32(m, x);
    x->eax = put_lo8(x->eax, logic(x, (x->eax & 0xffu) & 0xefu, 8u));
    x->esi = pop32(m, x);
    w32(m, 0x01d96a9cu, x->eax);
    x->eax = r32(m, x->esp + 8u); /* original argument HOME, now overwritten */
    w32(m, 0x01d99a64u, 0u);
    x->ebp = pop32(m, x);
    w8(m, x->eax + 1u, 0xffu);
    x->eax = 2u;
    x->eip = pop32(m, x);         /* 0050BADE RET */
}
```

## Preuves et couverture

Préfixe des références ASM/bytes ci-dessous : `inputs/ff8-decomp-semantics-20261011-r01/g17/0x50B830.readable/`. Les 8 fichiers ASM lus couvrent respectivement les instructions 1–25, 26–50, 51–75, 76–100, 101–125, 126–150, 151–175 et 176–195. `bytes-001.txt:1–20` et `bytes-002.txt:1–2` couvrent le chunk complet. Les intervalles ci-dessous sont demi-ouverts ; les nombres de blocs correspondent à `metadata.json:11–320`.

| Zone / intervalle | Blocs CFG couverts | Preuve principale |
|---|---:|---|
| Entrée + dispatch `[50B830,50B85A)` | 2 | `asm-001:1–12`, supplément `dispatch.txt:1–12` |
| Entrée sélecteur 0 `[50B85A,50B87E)` | 3 | `asm-001:13–22` |
| Entrée sélecteur 1 et boucle `[50B87E,50B92E)` | 8 | `asm-001:23–25`, `asm-002:1–25`, `asm-003:1–21` |
| Retour zéro commun `[50B92E,50B934)` | 1 | `asm-003:22–25`, `asm-004:1` |
| Entrée sélecteur 2, boucle, callback, retour `[50B934,50B9B9)` | 8 | `asm-004:2–25`, `asm-005:1–13` |
| Entrée sélecteur 3 `[50B9B9,50B9C9)` | 2 | `asm-005:14–17` |
| Entrée sélecteur 4 `[50B9C9,50B9EE)` | 3 | `asm-005:18–25`, `asm-006:1–2` |
| Entrée sélecteur 5 `[50B9EE,50BA2B)` | 4 | `asm-006:3–18` |
| Entrée sélecteur 6 `[50BA2B,50BA60)` | 4 | `asm-006:19–25`, `asm-007:1–7` |
| Entrée sélecteur 7, boucle, retour 2 `[50BA60,50BADF)` | 6 | `asm-007:8–25`, `asm-008:1–20` |
| **Total** | **41** | **195 instructions, un chunk de 687 octets** |

Le supplément `table.json:8–49` donne, dans l'ordre des indices unsigned 0…7 : `50B85A, 50B87E, 50B934, 50B9B9, 50B9C9, 50B9EE, 50BA2B, 50BA60`. Aucun indice normalisé autrement : `XOR EAX,EAX; MOV AL,[EBP+0D]; CMP EAX,7; JA` (`50B845–50B84D`). Le byte non couvert à `50BADF`, entre le chunk et la table, n'est ni exécuté ni interprété ici.

### Appels : cibles natives et DWORDs effectivement poussés

La colonne arguments donne l'ordre **vu par le callee** (premier argument en tête, donc ordre inverse des PUSH). C'est une observation de callsite, pas la certification d'un prototype exhaustif ni d'un retour métier. Le code conserve aussi les registres entrants des callees, au lieu de présumer qu'ils sont sans importance. Les cibles directes sont lues dans les déplacements `E8 rel32` des bytes, concordants avec `metadata.json:330–345`.

| CALL EA | Cible | Arguments locaux observés, ordre C | Usage local du retour |
|---|---|---|---|
| `50B85E` | `508580` | `0x1A, 0x40` | EAX DWORD testé non nul |
| `50B86E` | `501190` | aucun PUSH argument local | EAX DWORD testé non nul |
| `50B894` | `50A750` | aucun PUSH argument local | pas de test de retour |
| `50B8AC` | `50AFC0` | aucun PUSH argument local | pas de test de retour |
| `50B8C7` | `50C090` | `ESI, 0xB` | pas de test de retour |
| `50B8F9` | `501740` | `0x18, 0, 0x80` | pas de test de retour |
| `50B907` | `501740` | `0x19, 0, 0x80` | pas de test de retour |
| `50B91E` | `50AF20` | `zero_extend_u16([read32(1D99A50)+6]), 0x21DFEC4` | pas de test de retour |
| `50B96D` | `46B440` | aucun PUSH argument local | pas de test de retour |
| `50B9A1` | EAX chargé de `[21DFEC4]` à `50B98B` | `0x1D99A78` | EAX stocké DWORD à `1D96AAC` |
| `50B9B9` | `50AE80` | aucun PUSH argument local | EAX DWORD testé non nul |
| `50B9E3` | `507080` | `read32(1D973FC)&0xFF, 2, 0` | pas de test de retour |
| `50B9EE` | `507070` | aucun PUSH argument local | EAX DWORD testé non nul |
| `50BA09` | `50B810` | `0x1D973F8` | pas de test de retour |
| `50BA20` | `507080` | `(read32(1D973FC)&0xFF)\|0x1000, 2, 0` | pas de test de retour |
| `50BA2B` | `507070` | aucun PUSH argument local | EAX DWORD testé non nul |
| `50BA55` | `507080` | `(read32(1D97360)&0xFF)\|0x1000, 1, 0` | pas de test de retour |
| `50BA60` | `507070` | aucun PUSH argument local | EAX DWORD testé non nul |
| `50BA8A` | `509C10` | `ESI` | EAX entier repris, AH modifié |
| `50BA94` | `505C00` | `ESI, (EAX_ret_509C10\|0x1000)` | pas de test de retour |
| `50BA9C` | `50C090` | `ESI, 0xC` | pas de test de retour |
| `50BAB3` | `50AED0` | aucun PUSH argument local | EAX rechargé ensuite |

Il y a **22 sites CALL : 21 directs vers 15 adresses distinctes et un indirect**. Aucune résolution particulière de la cible indirecte n'est supposée. La sauvegarde à `21DFEC8` et le BYTE à `1D96DC4` précèdent effectivement cet appel, sans relecture de `21DFEC4`.

### Pile, largeurs, flags et ordre des effets

- À partir de `S = ESP_entry`, les sauvegardes sont EBP à `S-4`, ESI à `S-8`, EDI à `S-12`. Le DWORD argument à `S+4` est écrasé dès l'entrée. Les trois sorties normales dépilent ces sauvegardes puis le retour à `S`, laissant ESP à `S+4` si les callees respectent le chemin de retour attendu. Le caller conserve la charge de son DWORD argument ; aucun `RET 4` n'est inventé.
- Nettoyages différés : `50B926 ADD ESP,20h` libère `3+3+2` arguments de trois appels ; `50BA25 ADD ESP,10h` libère `1+3` arguments ; `50BAA1 ADD ESP,14h` libère `1+2+2` arguments. Le C conserve ces slots lors des appels intermédiaires. Hors piles internes des callees, le plus bas ESP de ce chunk est `S-48` au CALL `50B91E` : 12 octets de sauvegardes + 32 d'arguments + 4 de retour.
- Tous les ajouts d'adresses sont modulo `2^32`; INC BYTE est modulo `2^8` et relit le BYTE courant après les appels. Aucun overflow signé C ni cast signé dépendant de l'implémentation n'est nécessaire.
- `50B884 MOV AX` conserve EAX[31:16]. À `50B912 XOR EAX,EAX`, suivi du `MOV AX` à `50B919`, le WORD devient au contraire un DWORD zéro-étendu. Ces deux cas ne sont pas confondus.
- `50BA8F OR AH,10h` conserve tous les autres bits de l'EAX renvoyé par `509C10`; le PUSH à `50BA92` porte ce **DWORD complet**, pas seulement un BYTE ou WORD. Les OR AH/CH à `50BA1C/50BA51` opèrent après un AND DWORD `0xFF`, donc leurs arguments deviennent précisément `0x1000 | byte`.
- `50B8D8 SHL DL,CL` est de largeur **8 bits**, les shifts à `50B955` et `50BA80` sont de largeur **32 bits**. Le masque de compte x86 est `&31` dans les trois cas. `50BA82 TEST DL,AL` ne teste que les huit bits bas. Sous préservation des registres de boucle par les callees, les trois parcours couvrent `1D972C0`, `1D9735C`, `1D973F8`, avec fin exclusive `1D97494`; aucune taille globale d'array n'en est déduite.
- Les `JL` après comparaison d'adresse sont reproduits comme comparaisons **signées 32 bits** via SF xor OF, et non remplacés par un `<` de pointeurs C. `50B939 TEST EAX,EAX; 50B93B JL` teste le bit de signe du DWORD chargé.
- L'adresse de ce dernier DWORD est **`0x01D999C8`**, prouvée par `A1 C8 99 D9 01` à `50B934` (`bytes-001:9`). La prose de `common-compaction.md:21` écrit `1D99C8`, plus court : cette transcription n'est pas utilisée comme adresse.
- Le masque à `1D99A6C` est remis à zéro par un **BYTE store**, lu en **DWORD** puis masqué à `50B93D–50B945`, et relu en BYTE après `46B440` et à chaque itération finale. Les bits hauts de ce DWORD ne sont jamais effacés par une écriture élargie inventée. Le WORD à `1D973F8` est masqué `FFFD`, pas le DWORD entier. Le flag à `1D97705` est un BYTE distinct ; aucune opération DWORD équivalente n'est substituée.
- `50B899` charge le DWORD `1D96A9C` **avant** le RMW byte à `1D97705`, puis fait OR AL et réécrit le DWORD. La fin charge ce DWORD après `50AED0`, fait AND AL `EF`, réécrit, relit la case argument, met `1D99A64` à zéro, puis écrit `FF` à `[adresse_rechargée+1]` avant EAX=`2`. Le C conserve cet ordre, y compris la relecture de pile après le callee.
- Les entrées 0→1 et 3→4→5→6→7 comportent les fallthroughs natifs ; il n'y a pas de redispatch à chaque incrément. Une mutation externe du BYTE d'état ne change pas le contrôle local en cours. L'entrée 2 retourne toujours immédiatement après son incrément local réussi ; elle ne poursuit pas vers l'entrée 3 dans le même appel.
- `metadata.json:322–328` contient une seule référence entrante `50A812`, `iscode=false`, depuis `50A790` : ce n'est pas une preuve d'appel direct ni un contrat supplémentaire de retour. Aucun contrat de caller non gelé n'est supposé.

## Limites et validations non exécutées

- **Livraison de reconstruction, pas promotion ni verdict sémantique.** Corps cible intégral fourni ; l'implémentation des callees reste externe et opaque. Le bridge de mémoire/exécution n'est pas implémenté ici : il doit relier les adresses natives ou un modèle séparément validé. Cette représentation n'est donc pas une fonction Win32 directement linkable à la place de l'original sans adaptation autorisée.
- Les ABI intégrales, types de structures, domaine des pointeurs, validité des indices et effets des callees/callback ne sont pas prouvés par ce gel. Le corps ne rajoute aucun null-check, borne de pointeur ou correction « plausible ». Les effets indirects de tous les appels sont laissés au callee réel.
- L'état des flags architecturaux indéfinis, les exceptions/traps, les interruptions et les écritures concurrentes ne font pas l'objet d'une preuve de fidélité temporelle. Les accès mémoire et les registres partiels sont conservés, mais ceci n'est pas un simulateur de cycles ni un mécanisme de capture live.
- Lecture statique manuelle des 195 instructions/bytes, confrontation des immediates, cibles de CALL, table complémentaire, largeurs et slots : effectuées. **Aucune compilation, exécution, test différentiel, accès IDB/live, vérification de hash par calcul, review indépendante ou §5.6 exécuté ici.**
- À demander au lead / rôle autorisé : compilation C11 du bloc avec un backend de test séparé ; confrontation différentielle registres/mémoire/pile pour les sélecteurs 0–7 et hors plage, sorties d'attente, branches du WORD `[descriptor+4]` (6/7/10/11), masque 0–7, statut `0x7FFFFFFF/0x80000000`, incréments BYTE `0xFF→0`, mutation des globals/du BYTE d'état/des slots par les callees, et retour `509C10` avec bits hauts non nuls. Ce sont des **besoins de validation**, pas des PASS.
