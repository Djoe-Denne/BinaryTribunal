# Texture_FindTexture @ 0x419410

- Instr (live): 191
- Palier: livrable documentaire de réconciliation Sol ; sémantique LIKELY vérifiée et commentaire IDB ajouté par le parent le 2026-10-09 (pas de remplacement Hex-Rays).
- C Sol A: `c_a_sol.c` — reconstruction indépendante depuis décodage IDA read-only, octets bruts et CFG ; clang absent, compilation non vérifiée.
- C Sol B: `c_b_sol.c` — reconstruction indépendante (même pack, sans voir A).
- C réconcilié: `c_reconciled_sol.c` (2026-10-08) contre listing Intel live entier 191/191, hash octets identique ; 33/33 débuts de bloc ancrés en `loc_`, contrôle CFG zéro mismatch. Aucune génération GLM/gateway/sous-agent.
- A==B (C): non — divergences tranchées une à une dans `reconcile_notes_sol.md` (retour u32 vs void des deux calls debug ; `CDECL` vide vs garde x86 32 bits ; conversion `(s32)u32` vs test de signe explicite).
- Confiance statique: LIKELY ; mode 1+V ; verdict V: **ACCEPTE**.
- Nom catalogue: trop large ; proposition markdown seule `Texture_SelectFormatFromContextList`.
- §5.6 / PUSH IDB: parent OK le 2026-10-09 ; append `[semantic-triple 2026-10-09]`, save true, relecture exacte. CFG pack/live 33 blocs identiques, 33 labels C conformes ; octets PE disque/live identiques. Aucune mutation de type/nom/octets IDA.
- Type IDA observé: `int __cdecl(int *, int, int)` ; le C réconcilié renvoie le mot EAX brut (`u32`).
- Notes parent: 582 octets (`0x246`), un chunk `[0x419410,0x419656)`, 33 blocs CFG, EBP seul sauvegardé, frame `sub esp,0x2C`, `retn` simple. **Trois arguments cdecl** à EBP+8/+0x0C/+0x10. Scratch EBP−0x14 = **0x14 octets / 5 DWORD** ; slot EBP−0x20 distinct assigné une fois (0x419485) ; aucun reset avant 0x419560/0x4195D9 ; sauvegarde scratch+8 (0x4195C9) avant la passe 41981E ; retour `mov eax,[ebp-28h]` (0x41964F) — EAX 32 bits, pas AL/bool. `add esp` : zero-fill **8**, walker **0x0C** ; cleanup **0x2C** (44 octets) à 0x4643AD = **6+2+3 mots de trois calls** (call 0x46436E→0x4188E2 : six pushes ; call 0x46438A→0x40702F : deux ; cible : trois) — **jamais six arguments** de la cible, ni onze. Xrefs : **0x419DC0 / 0x4643A8 / 0x4650EB** (starts 0x419D8F / 0x464220 / 0x464F70), aucune DATA. Getter contexte du caller 0x464220 : `call 0x40A04A` à **0x464229**, `mov esi,eax` à **0x46422E** — appel du caller, pas de la cible. Deux calls debug 0x403D99 (0x419443/0x419647) inaccessibles, documentés non émis. Hex-Rays faux : `LOBYTE(v5)=0` vs DWORD (0x419416), `char v9` vs 20 octets (0x41946F), lecture +0x30 supprimée vs conservée (0x419539–0x419546).

## C réconcilié

Transcription verbatim de `tools/_tmp_semantic_triple/0x419410/c_reconciled_sol.c`, sans régénération.

```c
/* Sol reconciliation, 2026-10-08; target EA 0x00419410 only.
 * Ground truth: whole live Intel ASM + ida_dump_bytes, NOT Hex-Rays or votes.
 * [0x419410,0x419656): 582 bytes, 191 instructions, one chunk, 33 CFG blocks.
 * Live bytes SHA256:
 * 7dc388cfa807267254a3ba4da0c3dcf1e8cb343b7e2556dcb78b6337731ef747
 * All block starts are anchored below. Copies/prologue/epilogue are folded;
 * two constant-unreachable debug calls are documented, not emitted.
 * IDA: int __cdecl(int *, int, int). Here u32 preserves the raw EAX word.
 * Saved EBP only; local span 0x2c. Plain RET: caller removes three DWORD args.
 * Native x86/32-bit, little endian, DF=0. External symbols require binding
 * to the annotated original VAs; this is not a standalone replacement.
 * No build/runtime equivalence test, IDB write, semantic verdict or GLM used.
 */
#include <stdint.h>
#include <stddef.h>

#if defined(_MSC_VER) && defined(_M_IX86)
# define CDECL __cdecl
typedef uint32_t memory_word;
#elif defined(__i386__)
# define CDECL __attribute__((cdecl))
typedef uint32_t memory_word __attribute__((__may_alias__));
#else
# error Requires a 32-bit x86 C ABI.
#endif
typedef uint32_t u32;
_Static_assert(sizeof(void *) == 4, "32-bit pointers");
_Static_assert(sizeof(u32) == 4, "DWORD width");

/* Names are local documentary names, NOT IDA renames or libc substitutions.
 * 0x40a75f: (byte_count,destination), REP STOSD/STOSB with EAX=0; add esp,8.
 * 0x425dd4: (callback,context_slot_address,list), add esp,0x0c.
 * Its helper calls callback([node+4],context_slot_address), add esp,8;
 * callback EAX==0 stops recursion. Direct callee EAX values are ignored.
 */
extern u32 CDECL ZeroFillBytes_40A75F(u32 byte_count, u32 destination);
extern u32 CDECL CallbackListWalk_425DD4(u32 callback, u32 context_slot, u32 list);

/* Four callback VAs, not claims about palette/format matching semantics. */
enum {
    CB_419B63 = 0x00419b63u,
    CB_419656 = 0x00419656u,
    CB_41981E = 0x0041981eu,
    CB_4199BB = 0x004199bbu
};

static u32 read_dword(u32 address)
{
    return *(volatile memory_word *)(uintptr_t)address;
}
static void write_dword(u32 address, u32 value)
{
    *(volatile memory_word *)(uintptr_t)address = value;
}
#define A32(p) ((u32)(uintptr_t)(p))

/* Original frame EBP-0x2c..EBP-1; placement by a C compiler is not guaranteed.
 * The context SLOT and the independently retained scratch POINTER differ.
 * Slot initialized once; neither reset nor replaced at subsequent passes.
 */
struct frame_419410 {
    u32 var_2c;              /* EBP-2c: gate */
    u32 var_28;              /* EBP-28: eventual EAX */
    u32 var_24;              /* EBP-24: full DWORD flags */
    u32 var_20;              /* EBP-20: callback-visible pointer slot */
    u32 var_1c;              /* EBP-1c: retained scratch address */
    u32 var_18;              /* EBP-18: [arg_8+0x330] */
    u32 scratch[5];          /* EBP-14: 0x14 BYTES, not a one-byte object */
};
_Static_assert(sizeof(struct frame_419410) == 0x2c, "frame span");
_Static_assert(offsetof(struct frame_419410, var_20) == 0x0c, "context slot");
_Static_assert(offsetof(struct frame_419410, scratch) == 0x18, "scratch extent");

u32 CDECL sub_419410_reconciled_sol(u32 arg_0, u32 arg_4, u32 arg_8)
{
    volatile struct frame_419410 f;
    u32 eax;

loc_419410: /* [419410,419423) */
    f.var_24 = 0; /* 419416 C7 45 DC 00 00 00 00: DWORD, not LOBYTE. */
    if (arg_0 == 0) goto loc_41942b;
loc_419423: /* [419423,41942b) */
    f.var_24 = read_dword(arg_0);
loc_41942b: /* [41942b,41943e) */
    f.var_28 = 0;
    f.var_1c = A32(&f.scratch[0]);
    eax = 0; /* XOR EAX,EAX; TEST; JZ: debug block cannot execute. */
    if (eax == 0) goto loc_41944b;
loc_41943e: /* [41943e,41944b): excluded unreachable call at 419443, cleanup 4 */
loc_41944b: /* [41944b,419455) */
    if (arg_8 == 0) goto loc_41963c;
loc_419455: /* [419455,41946b) */
    f.var_18 = read_dword(arg_8 + 0x330u);
    if (f.var_18 == 0) goto loc_41963c;
loc_41946b: /* [41946b,419492) */
    (void)ZeroFillBytes_40A75F(0x14u, f.var_1c); /* 419471 / cleanup 8 */
    write_dword(f.var_1c + 0x10u, arg_4);
    f.var_20 = f.var_1c; /* 419485: only assignment to the context slot */
    if ((f.var_24 & 1u) == 0) goto loc_4194a7;
loc_419492: /* [419492,4194a7) */
    (void)CallbackListWalk_425DD4(CB_419B63, A32(&f.var_20), f.var_18); /* 41949f / +0c */
loc_4194a7: /* [4194a7,4194af) */
    if (read_dword(f.var_1c) != 0) goto loc_4194e5;
loc_4194af: /* [4194af,4194b9) */
    if ((f.var_24 & 2u) == 0) goto loc_4194e5;
loc_4194b9: /* [4194b9,4194e5) */
    (void)ZeroFillBytes_40A75F(0x14u, f.var_1c); /* 4194bf / cleanup 8 */
    write_dword(f.var_1c + 0x10u, arg_4);
    (void)CallbackListWalk_425DD4(CB_419656, A32(&f.var_20), f.var_18); /* 4194dd / +0c */
loc_4194e5: /* [4194e5,4194ed) */
    if (read_dword(f.var_1c) != 0) goto loc_419523;
loc_4194ed: /* [4194ed,4194f7) */
    if ((f.var_24 & 4u) == 0) goto loc_419523;
loc_4194f7: /* [4194f7,419523) */
    (void)ZeroFillBytes_40A75F(0x14u, f.var_1c); /* 4194fd / cleanup 8 */
    write_dword(f.var_1c + 0x10u, arg_4);
    (void)CallbackListWalk_425DD4(CB_41981E, A32(&f.var_20), f.var_18); /* 41951b / +0c */
loc_419523: /* [419523,41952f) */
    if (read_dword(f.var_1c) != 0) goto loc_419633;
loc_41952f: /* [41952f,41953f) */
    f.var_2c = 0;
    eax = read_dword(arg_4 + 0x30u); /* real potentially faulting read */
    /* 41953d JLE: signed DWORD <= 1, without unsigned-to-signed conversion. */
    if ((eax & 0x80000000u) != 0 || eax <= 1u) goto loc_419546;
loc_41953f: /* [41953f,419546) */
    f.var_2c = 1;
loc_419546: /* [419546,419553) */
    f.var_2c = 1; /* unconditional overwrite; do NOT make pass depend on +30 */
    if (f.var_2c == 0) goto loc_419568;
loc_419553: /* [419553,419568): no scratch reset */
    (void)CallbackListWalk_425DD4(CB_419B63, A32(&f.var_20), f.var_18); /* 419560 / +0c */
loc_419568: /* [419568,41956e): retain post-call reload */
    if (f.var_2c == 0) goto loc_419584;
loc_41956e: /* [41956e,419576) */
    if (read_dword(f.var_1c) == 0) goto loc_419584;
loc_419576: /* [419576,419584) */
    f.var_28 = read_dword(f.var_1c + 0x0cu);
    goto loc_419631;
loc_419584: /* [419584,4195b8) */
    (void)ZeroFillBytes_40A75F(0x14u, f.var_1c); /* 41958a / cleanup 8 */
    write_dword(f.var_1c + 0x10u, arg_4);
    (void)CallbackListWalk_425DD4(CB_419656, A32(&f.var_20), f.var_18); /* 4195a8 / +0c */
    if (read_dword(f.var_1c) == 0) goto loc_4195c3;
loc_4195b8: /* [4195b8,4195c3) */
    f.var_28 = read_dword(f.var_1c + 0x0cu);
    goto loc_419631;
loc_4195c3: /* [4195c3,4195e9): save +8, NO reset before this pass */
    f.var_28 = read_dword(f.var_1c + 8u);
    (void)CallbackListWalk_425DD4(CB_41981E, A32(&f.var_20), f.var_18); /* 4195d9 / +0c */
    if (read_dword(f.var_1c) == 0) goto loc_4195f4;
loc_4195e9: /* [4195e9,4195f4) */
    f.var_28 = read_dword(f.var_1c + 0x0cu);
    goto loc_419631;
loc_4195f4: /* [4195f4,419628): clearing scratch must NOT clear saved var_28 */
    (void)ZeroFillBytes_40A75F(0x14u, f.var_1c); /* 4195fa / cleanup 8 */
    write_dword(f.var_1c + 0x10u, arg_4);
    (void)CallbackListWalk_425DD4(CB_4199BB, A32(&f.var_20), f.var_18); /* 419618 / +0c */
    if (read_dword(f.var_1c) == 0) goto loc_419631;
loc_419628: /* [419628,419631) */
    f.var_28 = read_dword(f.var_1c + 0x0cu);
loc_419631: /* [419631,419633) */
    goto loc_41963c;
loc_419633: /* [419633,41963c) */
    f.var_28 = read_dword(f.var_1c + 0x0cu);
loc_41963c: /* [41963c,419642) */
    eax = 0; /* second XOR/TEST/JZ */
    if (eax == 0) goto loc_41964f;
loc_419642: /* [419642,41964f): excluded unreachable call at 419647, cleanup 4 */
loc_41964f: /* [41964f,419656): MOV EAX,[EBP-28]; frame teardown; RET */
    return f.var_28; /* full DWORD, NOT AL, bool or direct helper return */
}
```

## Corrections ciblées et limites

Sources : `decomp.md`, `reconcile_notes_sol.md`, `semantic_a_sol.md`, `semantic_v_sol.md` du pack `tools/_tmp_semantic_triple/0x419410/` ; deux C Sol antérieurs `c_a_sol.c` / `c_b_sol.c` conservés, réconciliés en `c_reconciled_sol.c` contre le listing live entier (SHA-256 `7dc388cf…31ef747` ; listing sauvegardé d'adresses `1145cdda…9c0ee52`). Aucun modèle externe.

1. **Largeurs et scratch** : `C7 45 DC 00 00 00 00` à 0x419416 écrit un **DWORD** zéro, pas `LOBYTE` ; scratch EBP−0x14 = **0x14 octets / 5 DWORD** (0x41946F), pas `char v9` ni `_BYTE` isolé. Zero-fill `(count,destination)` via 0x40A75F (REP STOSD/STOSB, EAX=0), **pas libc `memset(dst,0,n)`**.
2. **Lecture conservée et gate** : 0x419539 lit vraiment `[request+0x30]`, JLE **signed** à 0x41953D, puis 0x419546 force la gate à 1 dans les deux chemins — la passe 0x419560 ne dépend pas de +0x30 ; ne pas supprimer la lecture ni en faire une condition métier.
3. **Candidat de repli** : scratch+8 sauvegardé dans var_28 (0x4195C6/0x4195C9) **avant** la passe 41981E ; le zero-fill 0x4195FA ne détruit pas var_28 ; échec final conserve le candidat (`0x419626` saute la substitution). Retour `mov eax,[ebp-28h]` 0x41964F, `retn` 0x419655 : **EAX DWORD**, pas AL, pas bool, pas retour du walker.
4. **Comptabilité `add esp`** : zero-fill **8**, walker **0x0C**, callbacks indirects **8** ; les deux callers propres nettoient **0x0C** ; le cleanup **0x2C** (44 octets) à 0x4643AD agrège **6+2+3 DWORD de trois calls** (0x46436E→0x4188E2, 0x46438A→0x40702F, cible), helpers en `retn` simple — **jamais six arguments** de 0x419410. Getter de contexte du caller 0x464220 : `call 0x40A04A` à **0x464229**, conservation `mov esi,eax` à **0x46422E**.

Limites : deux calls debug 0x403D99 (0x419443/0x419647) documentés mais non émis (xor/test/jz) ; C documentaire exigeant x86 32 bits, little endian, DF=0 et liaison aux VAs annotées, **pas un remplacement Hex-Rays natif ni un binaire testé** — aucune compilation, exécution ni équivalence des fautes revendiquée. Layout relatif du frame fixé sans placement physique garanti ; pointeurs invalides, débordements de callbacks, absence de détection de cycle (0x425E05), wrap du compteur +4 (0x419685) et mutations concurrentes hors garantie. Noms externes documentaires locaux (`ZeroFillBytes_40A75F`, `CallbackListWalk_425DD4`), pas de rename IDB. Champs pack `independent_c_generated:false` / `c_reconstruction:Deferred` supersédés sur ce point par les notes de réconciliation, laissés intacts. Nom proposé markdown uniquement ; §5.6 et push IDB réservés au parent.
