# BdLinkCallback_5A6D20 @ 0x5A6D20

- Instr (live): 247
- Palier: low
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=9625
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=8973
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=10606
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BdLinkCallback_5A6D20(int node)
- Notes parent: WORD [node+0Ch] phase (66), pas BYTE +0x0D. Register 2 args `push offset` list. EAX=2 unlink TEST AL,2. setnz+inc anim 1|2. or ah,8 = actor bit 0x800 ≠ occupancy. jg/jl signed. add esp 14h/8/10h/18h/0Ch. 0xD0/0x1D0/0x44/_rand CRT absents de occupancy/GetRandomInt.

## Avenant réparation 2026-10-09 — relectures slot/phase (H-J3-fix)

> **STATUT : DRAFT — validation parent + review Sol indépendante PENDING.** Aucun push IDB revendiqué pour cet avenant ; le push historique `[semantic-triple 2026-10-08]` (« Push IDB: oui » ci-dessus) reste la seule opération IDB de référence. Réparation historique ciblée (PILOT registry `historical_repair`, priority 3, candidats ASM `0x5A6F88/0x5A6FF2/0x5A7058`), pas une nouvelle dual génération/sémantique : les conclusions 2026-10-08 ci-dessus et le livrable `semantic/0x5A6D20__BdLinkCallback_5A6D20.md` restent inchangés.

- **Ground truth** : re-désassemblage natif statique IDA du 2026-10-09, 247 instructions, `0x5A6D20–0x5A7095`, size `0x375` — identique au pack. Preuve : `tools/_tmp_semantic_triple/0x5a6d20/pilot-repair-2026-10-09/asm_live_2026-10-09.asm`. Le pack ancien n'a servi que d'indice.
- **Résidu confirmé** : le C réconcilié 2026-10-08 mettait en cache `actor` (slot initial) et `phase_s` à travers les appels ; l'ASM relit `dword_22598A4` à `0x5A6DA7` (après `sub_5022C0`), `0x5A6FF2` (après `sub_45F270`) et `0x5A7058` (épilogue), et relit le compteur `[node+0Ch]` à `0x5A6F88` (bras tot après Camera) et `0x5A6FC4` (bras tardif après Camera), plus `dword_225993C` à `0x5A6FC8`. Hex-Rays (pack `hexrays.c`) conservait toutes ces relectures — c'est le C réconcilié qui avait introduit le cache.
- **Portée conditionnelle** : si aucun callee ne mute `dword_22598A4` / `[node+0Ch]` / `dword_225993C`, ancien et nouveau C coïncident ; la non-mutation n'est PAS établie (helpers hors périmètre). Aucune violation runtime revendiquée.
- **Corrections (4 sites)** :
  1. `0x5A6DA7–0x5A6DB4` — rechargement slot+actor entre `sub_5022C0` et `BattlePresentation_StartActorAnimation` (l'anim peut cibler un autre acteur que `sub_5022C0` si le slot a muté).
  2. `0x5A6F88` / `0x5A6FC4`+`0x5A6FC8` — scalaire GTE recalculé depuis les relectures post-Camera (t seul en bras tot ; t et T en bras tardif), lectures effectuées avant `GteState_StorePtr_1CA8A28` comme dans l'ASM ; le choix de branche (`phase_s <= 8`) reste fait sur la lecture pré-Camera `0x5A6F70`/`0x5A6F74`.
  3. `0x5A6FF2` — rechargement slot+actor après `sub_45F270` pour `GteState_GetToPtr_1CA8A68` (destination acteur+0x28).
  4. `0x5A7058` — rechargement slot+actor pour l'épilogue (écriture `+0x28`, lecture/écriture flags WORD, `and 0xF7FF` / `or [node+0Eh]`).
- **Provenance** : le bloc C ci-dessous REMPLACE la version 2026-10-08 ; l'original est archivé tel quel dans `tools/_tmp_semantic_triple/0x5a6d20/pilot-repair-2026-10-09/c_original_2026-10-08.c` (anciennes conclusions non effacées). Version corrigée : `c_repaired_2026-10-09.c`. Preuves et hashes : `repair_notes.md` (même répertoire).
- **Limites C** : casts int↔pointeur et comparaisons pointeur→int implémentation-définies ; accès 16 bits non alignés et aliasing via `unsigned short*` = UB ISO C (acceptés sur la cible x86) ; `node` déréférencé sans test NULL (comme l'ASM) ; exécution mono-thread supposée.

## Avenant final 2026-10-09 — propagation modèle x86 reconcilié R1–R4 (H-J3-final-propagation)

> **STATUT : DRAFT — modèle x86 reconcilié R1–R4 ; re-review final parent §5.6 PENDING ; pas de clôture « ordinary C replacement ».** Avenant purement documentaire : le bloc C actif ci-dessous est remplacé par la copie **octets exacts** de `c_reconciled_final_sol.c` (UTF-8 sans BOM, LF purs, aucun octet ajouté ni retiré, vérification par égalité d'octets et non normalisée). L'ancien snapshot C (H-J3-fix) est conservé tel quel plus bas et reste archivé dans `tools/_tmp_semantic_triple/0x5a6d20/pilot-repair-2026-10-09/c_repaired_2026-10-09.c`. Aucun push IDB, aucun changement de type/nom/octets revendiqué ; l'en-tête historique et l'avenant H-J3-fix ci-dessus restent inchangés.

Faits de fidélité (ground truth : `c_reconcile_final_sol.md` et `coverage_reconcile_final_sol.json`, même répertoire) :

- **R1 — capture SI avant setter** : `5A6DC4` capture SI (`U16(esi, R16([node+0xC]))`) **avant** les stores T `5A6DE2`/`5A6DFB` ; `5A6E01` compare le même SI (`CMP esi,2,16`) sans relecture mémoire. Cas discriminant uniquement hypothétique (`node+0xC == 0x225993C`) ; aucune non-alias prouvée, aucune violation runtime revendiquée.
- **Phase node/child `+0xC` : 16 sites d'instruction, 17 opérations WORD du modèle** — dix lectures seules, cinq écritures child seules et un INC nodal read-modify-write à `5A702F` : 11 R16 + 6 W16. Les lectures sont `5A6D3B/5A6DC4/5A6E72/5A6E9F/5A6F2F/5A6F70/5A6F88/5A6FC4/5A700F/5A702F/5A7039`, les stores child `5A6E16/5A6E3F/5A6E66/5A6E97/5A6EBE`, plus le store INC nodal. Inventaire statique d'opérandes, pas compte dynamique par chemin ni transactions matérielles ; ordre natif conservé, aucune fusion.
- **R2 — ACTEUR/SLOT capturé AVANT le store child** (ASM `0x5A6E8D` READ16 slot→CX, `0x5A6E97` WRITE16 child+0xC←BP, `0x5A6E9B` WRITE16 child+0x1A←CX) : l'ordre correct est **capture slot avant store child**. **Ne pas répéter la formulation fausse « store child avant reload slot »** sur ce site. En revanche `5A6E16` (store child) précède bien son cleanup `5A6E1A` — ne pas généraliser l'ordre d'un site à l'autre. Le C final stocke le **BP effectif** (octets frais `66 89 68 0C`), capture `66 8B 0D A4 98 25 02`.
- **Camera — relectures post-Camera et branche stricte pré-Camera** : early `5A6F83` retourne vers `5A6F88` (phase fraîche <<9) ; late `5A6FBF` vers `5A6FC4` (phase fraîche) puis `5A6FC8` (T frais), `(T−phase)<<9`. La sélection de branche reste faite sur l'AX **pré-Camera** (`5A6F74`/`5A6FAC`) ; même si Camera mute la phase (7→20 ou 20→7), le bras choisi ne change pas — les relectures post-Camera ne resélectionnent pas la branche.
- **Retour, compteur, cleanups, wrap** : les trois RET (`5A6D32/5A7045/5A7094`) fixent **EAX32 = 0, 0, 2** ; le retour guest est l'EAX complet (pas le résultat C de l'interpréteur). Le test **AL bit 2** observé au caller pump (`508420`/`508434 call [esi+8]`/`508437 add esp,4`/**`50843A test al,2`**/`50843C jz`, cleanup cdecl du caller) prouve ce test de bit au caller observé, **pas** un type de retour limité à AL. **Cleanups caller explicites aux 9 sites** (shifts ESP `14h/8/10h/8/8/8/18h/0Ch/8`), aucun cleanup cdecl implicite inséré. **INC WORD wrap 16** sur `[node+0xC]` (`5A702F`), lecture T `5A7033` avant MOVSX phase `5A7039` ; fin si phase signée > T.
- **Sémantique homologue (historique, bornée)** : cette propagation est une **correction C purement historique et bornée** sous modèle x86 explicite ; **ce n'est ni un nouveau vote, ni une nouvelle génération indépendante**. La **classe historique est conservée** : push IDB « oui » et SetType du 2026-10-08 ci-dessus inchangés, conclusions 2026-10-08 et livrable `semantic/0x5A6D20__BdLinkCallback_5A6D20.md` non modifiés. **Limites : pas un C ordinaire** (R4 invalide une clôture en C ordinaire sans prouver de crash réel), **pas d'équivalence ISO/native ni runtime établie**, **backend mémoire/appels non fourni** (contrat machine dans l'en-tête du C final ; aliases discriminants restant hypothétiques). Re-review final parent et §5.6 PENDING ; re-review Sol finale distincte du parent, à venir.
- **Commentaires** : les commentaires du C final ne revendiquent aucune opération close/save. L'écriture épilogue `+0x28` (`5A706F`) pose la valeur **actuelle** de `B8B7D8` (pas une restauration d'un snapshot ancien) ; captures contrôlées avant gel/hash : snapshot **EAX entier** `5A6EFB`, SI/AX/DX partiels là où l'instruction l'exige, capture R2 avant store, HOME réel `[esp+0x20]`, EAX guest distinct du statut host.

Provenance : bloc C actif = `c_reconciled_final_sol.c`, SHA256 `8364098674530453ece3ec71ffc0be22e47e5162b50890a1407bc4560166a82d` (21649 octets). Ancien C actif archivé : `c_repaired_2026-10-09.c`, SHA256 `9bdd86825b207ff25480b86c1ee716b0fe723c20e02c08bbcf882a5c47b34f12` (9142 octets, identifié égal octets par octets au snapshot extrait de ce document avant remplacement). Preuves : `c_reconcile_final_sol.md` SHA256 `97ac798c419b963530204e44830da8f0cbe5de16d81199c0dd03985dc514f031`, `coverage_reconcile_final_sol.json` SHA256 `3f8f178c1737c2691a63fed75d998021f970b280eeea4dbe2ebeaa97cf7d47a5`.

## C réconcilié final — DRAFT : modèle x86 reconcilié R1–R4 ; re-review final parent §5.6 pending ; no ordinary C replacement closure

```c
/* H-J3-C-R-clean: reconciled numerical x86 model, entry 0x005a6d20.
 * Fresh native source: [005a6d20,005a7095), 885 bytes, SHA256
 * f72f60b2e03e3baf6c4630045de0cb639a54b3f305b799fbb073a98b13ea4ee7.
 * 247 instructions, 39 CFG blocks, 18 CALLs, 3 RETs.
 * Derived from c_gen_b_sol_clean.c after instruction/primitive reconciliation
 * against freshly read native ASM. This is NOT another independent generation.
 * Names/reviews/coverage are claims, not evidence. Entry identity is numerical.
 * NOT ordinary native C, NOT an ISO/native equivalence or promotion verdict.
 *
 * MACHINE CONTRACT (required; backend implementations are NOT supplied):
 * - Flat 32-bit guest data/stack addresses; little endian; exact-width ordered
 *   unaligned accesses. Any guest data/stack addresses may alias. Host state s
 *   and its backing implementation are separate from guest address space.
 * - read/write callbacks do not modify guest registers/flags/EIP/ESP. Guest
 *   memory effects occur synchronously in instruction order. No pure callee,
 *   nonalias node/child/slot/stack, or library/ABI preservation is assumed.
 * - All GPR/address arithmetic is modulo 2^32. Partial-register writes retain
 *   the other bits. Signed interpretation uses explicit int64_t conversion.
 *   SHL/SHR counts are masked with 31; zero count leaves every flag untouched.
 * - CALL pushes its return address and passes the full current machine state.
 *   call_numeric executes the numeric callee INCLUDING its RET and any actual
 *   cleanup; the returned EIP/ESP/GPR/flags/memory are consumed without repair.
 *   No fresh-push count is a prototype; no implicit cdecl cleanup is inserted.
 * - Undefined arithmetic flag bits carry representative values only, with
 *   flags_defined clearing them. A backend must treat those bits as unconstrained,
 *   NOT as a proven hardware value; it must propagate actual/defined flag state.
 * - Fixed source instruction bytes, no code mutation/fetch effects, segmentation,
 *   concurrent/async execution, MMIO, or general fault/exception-state fidelity.
 *   Memory fault/nonreturn callbacks MUST NOT resume this loop (stop externally).
 *   Exact rollback on a fault is NOT modeled. IDIV #DE alone returns -1 at IDIV.
 * - Initial state includes registers, flags, stack, return address and argument
 *   homes; [esp+0x20] is real guest stack memory, NOT an independent C local.
 * - C result: 0 target RET executed; 1 EIP outside table; 2 callee backend stopped;
 *   -1 divide trap (trap=0). The guest return is FULL s->eax, NOT this C result.
 *   Native RET sites explicitly set EAX to 0, 0, 2; pump AL bit2 is separate.
 *
 * R1: SI snapshot at dc4 survives T stores and is reused at e01.
 * R2: WORD slot capture e8d PRECEDES child WORD BP store e97 and slot store e9b.
 * R3: ed4..f29 retains all six reads, six DWORD copies, two WORD child stores.
 * R4: wrapping/width/flags/stack model above, not ordinary-C assumptions.
 * Post-camera reloads f88/fc4/fc8 do NOT reselect the pre-camera branch.
 * Owner reloads da7/ff2/7058 and delayed caller cleanups remain instructions.
 */
#include <stdint.h>

typedef struct x86_final {
    uint32_t eax, ecx, edx, ebx, esp, ebp, esi, edi;
    uint32_t eip, eflags, flags_defined, trap;
    void *backend;
} x86_final;

extern uint8_t  x86_final_read8 (x86_final *, uint32_t);
extern uint16_t x86_final_read16(x86_final *, uint32_t);
extern uint32_t x86_final_read32(x86_final *, uint32_t);
extern void x86_final_write16(x86_final *, uint32_t, uint16_t);
extern void x86_final_write32(x86_final *, uint32_t, uint32_t);
extern int x86_final_call_numeric(x86_final *, uint32_t);

enum { CF=0x001, PF=0x004, AF=0x010, ZF=0x040, SF=0x080, OF=0x800,
       ARITH=CF|PF|AF|ZF|SF|OF };
enum { A_ADD, A_SUB, A_AND, A_OR, A_XOR };

static uint32_t sx16(uint32_t x) {
    x &= 0xffffu;
    return (x & 0x8000u) ? x | 0xffff0000u : x;
}
static int64_t signed32(uint32_t x) {
    return (x & 0x80000000u) ? (int64_t)x-INT64_C(4294967296) : (int64_t)x;
}
static void put16(uint32_t *r, uint32_t v) {
    *r = (*r & 0xffff0000u) | (v & 0xffffu);
}
static void put8(uint32_t *r, unsigned shift, uint32_t v) {
    uint32_t mask = 0xffu << shift;
    *r = (*r & ~mask) | ((v & 0xffu) << shift);
}
static uint32_t szp(uint32_t v, unsigned bits) {
    uint32_t p = v & 0xffu;
    p ^= p >> 4; p ^= p >> 2; p ^= p >> 1;
    return (v == 0 ? ZF : 0) |
           (v & (1u << (bits-1)) ? SF : 0) | (!(p & 1u) ? PF : 0);
}
static uint32_t alu(x86_final *s, unsigned kind, uint32_t a, uint32_t b, unsigned bits) {
    uint32_t mask = bits == 32 ? UINT32_MAX : (1u << bits)-1u;
    uint32_t sign = 1u << (bits-1), v, f, defined = ARITH;
    a &= mask; b &= mask;
    if (kind == A_ADD) {
        uint64_t wide = (uint64_t)a + b;
        v = (uint32_t)wide & mask;
        f = (wide > mask ? CF : 0) | ((~(a^b) & (a^v) & sign) ? OF : 0) |
            (((a^b^v) & 0x10u) ? AF : 0);
    } else if (kind == A_SUB) {
        v = (a-b) & mask;
        f = (a < b ? CF : 0) | (((a^b) & (a^v) & sign) ? OF : 0) |
            (((a^b^v) & 0x10u) ? AF : 0);
    } else {
        v = kind == A_AND ? a&b : kind == A_OR ? a|b : a^b;
        defined &= ~AF; f = 0;
    }
    f |= szp(v, bits);
    s->eflags = (s->eflags & ~defined) | (f & defined);
    s->flags_defined = (s->flags_defined & ~ARITH) | defined;
    return v;
}
static uint32_t inc_width(x86_final *s, uint32_t v, unsigned bits) {
    uint32_t cf = s->eflags & CF, dc = s->flags_defined & CF;
    v = alu(s, A_ADD, v, 1, bits);
    s->eflags = (s->eflags & ~CF) | cf;
    s->flags_defined = (s->flags_defined & ~CF) | dc;
    return v;
}
static uint32_t shift32(x86_final *s, uint32_t a, unsigned count, int right) {
    unsigned c = count & 31u;
    uint32_t v, f, defined;
    if (c == 0) return a;
    v = right ? a >> c : a << c;
    f = szp(v, 32) | (((right ? a >> (c-1) : a >> (32-c)) & 1u) ? CF : 0);
    defined = CF|PF|ZF|SF;
    if (c == 1) {
        defined |= OF;
        if (right ? (a & 0x80000000u) != 0 :
                    ((v >> 31) ^ ((f & CF) != 0)) != 0) f |= OF;
    }
    s->eflags = (s->eflags & ~defined) | (f & defined);
    s->flags_defined = (s->flags_defined & ~ARITH) | defined;
    return v;
}
static int idiv32(x86_final *s, uint32_t divisor) {
    int64_t d = signed32(divisor);
    int64_t n = signed32(s->edx) * INT64_C(4294967296) + s->eax;
    int64_t q, r;
    if (d == 0 || (n == INT64_MIN && d == -1)) { s->trap=0; return -1; }
    q = n / d; r = n % d;
    if (q < -INT64_C(2147483648) || q > INT64_C(2147483647)) {
        s->trap=0; return -1;
    }
    s->eax = (uint32_t)q; s->edx = (uint32_t)r;
    s->flags_defined &= ~ARITH;
    return 0;
}
static void imul_edx(x86_final *s) {
    int64_t p = signed32(s->eax) * signed32(s->edx);
    uint64_t u = (uint64_t)p;
    uint32_t overflow = p != signed32((uint32_t)u);
    s->eax = (uint32_t)u; s->edx = (uint32_t)(u >> 32);
    s->eflags = (s->eflags & ~(CF|OF)) | (overflow ? CF|OF : 0);
    s->flags_defined = (s->flags_defined & ~ARITH) | CF|OF;
}
static void push32(x86_final *s, uint32_t value) {
    s->esp -= 4u; x86_final_write32(s, s->esp, value);
}
static uint32_t pop32(x86_final *s) {
    uint32_t v = x86_final_read32(s, s->esp); s->esp += 4u; return v;
}
static int equal_f(x86_final *s) { return (s->eflags & ZF) != 0; }
static int less_f(x86_final *s) { return ((s->eflags & SF) != 0) != ((s->eflags & OF) != 0); }
static int greater_f(x86_final *s) { return !equal_f(s) && !less_f(s); }

#define R8(a) x86_final_read8(s,(uint32_t)(a))
#define R16(a) x86_final_read16(s,(uint32_t)(a))
#define R32(a) x86_final_read32(s,(uint32_t)(a))
#define W16(a,v) x86_final_write16(s,(uint32_t)(a),(uint16_t)(v))
#define W32(a,v) x86_final_write32(s,(uint32_t)(a),(uint32_t)(v))
#define U16(r,v) put16(&s->r,(v))
#define F(k,a,b,w) alu(s,(k),(a),(b),(w))
#define CMP(a,b,w) ((void)F(A_SUB,(a),(b),(w)))
#define I(a,n,body) case a: { body; s->eip=(n); break; }
#define B(a,t,n,cond) case a: s->eip=(cond)?(t):(n); break
#define K(a,t,n) case a: push32(s,(n)); s->eip=(t); \
    if (x86_final_call_numeric(s,(t)) != 0) return 2; break
#define T(a) case a: s->eip=pop32(s); return 0

int c_reconciled_005a6d20(x86_final *s) {
    uint32_t v, a;
    s->eip=0x005a6d20u;
    for (;;) switch (s->eip) {
    I(0x005a6d20,0x005a6d25,s->eax=R32(0x01d96a9cu))
    I(0x005a6d25,0x005a6d26,push32(s,s->ebp))
    I(0x005a6d26,0x005a6d2b,(void)F(A_AND,s->eax,0x201u,32))
    I(0x005a6d2b,0x005a6d2c,push32(s,s->edi))
    B(0x005a6d2c,0x005a6d33,0x005a6d2e,equal_f(s));
    I(0x005a6d2e,0x005a6d2f,s->edi=pop32(s))
    I(0x005a6d2f,0x005a6d31,s->eax=F(A_XOR,s->eax,s->eax,32))
    I(0x005a6d31,0x005a6d32,s->ebp=pop32(s))
    T(0x005a6d32);
    I(0x005a6d33,0x005a6d37,s->edi=R32(s->esp+0xcu))
    I(0x005a6d37,0x005a6d39,s->ebp=F(A_XOR,s->ebp,s->ebp,32))
    I(0x005a6d39,0x005a6d3a,push32(s,s->ebx))
    I(0x005a6d3a,0x005a6d3b,push32(s,s->esi))
    I(0x005a6d3b,0x005a6d3f,U16(edx,R16(s->edi+0xcu))) /* DX first */
    I(0x005a6d3f,0x005a6d45,s->esi=R32(0x022598a4u)) /* owner second */
    I(0x005a6d45,0x005a6d48,CMP(s->edx,s->ebp,16))
    B(0x005a6d48,0x005a6d73,0x005a6d4a,!equal_f(s));
    I(0x005a6d4a,0x005a6d4d,s->eax=s->esi+s->esi*4u)
    I(0x005a6d4d,0x005a6d50,s->eax=shift32(s,s->eax,3,0))
    I(0x005a6d50,0x005a6d52,s->eax=F(A_SUB,s->eax,s->esi,32))
    I(0x005a6d52,0x005a6d59,s->ecx=s->eax*4u+0x01d972c0u)
    I(0x005a6d59,0x005a6d61,U16(eax,R16(s->eax*4u+0x01d972c0u)))
    I(0x005a6d61,0x005a6d63,s->ebx=s->eax)
    I(0x005a6d63,0x005a6d69,s->ebx=F(A_AND,s->ebx,0x800u,32))
    I(0x005a6d69,0x005a6d6c,put8(&s->eax,8,F(A_OR,s->eax>>8,8,8)))
    I(0x005a6d6c,0x005a6d70,W16(s->edi+0xeu,s->ebx))
    I(0x005a6d70,0x005a6d73,W16(s->ecx,s->eax))
    I(0x005a6d73,0x005a6d77,CMP(s->edx,1,16)) /* original DX */
    B(0x005a6d77,0x005a6dc4,0x005a6d79,!equal_f(s));
    I(0x005a6d79,0x005a6d7c,s->ecx=s->esi+s->esi*4u)
    I(0x005a6d7c,0x005a6d81,push32(s,0x00e9264cu))
    I(0x005a6d81,0x005a6d84,s->ecx=shift32(s,s->ecx,3,0))
    I(0x005a6d84,0x005a6d86,s->ecx=F(A_SUB,s->ecx,s->esi,32))
    I(0x005a6d86,0x005a6d8b,push32(s,0x024feb68u))
    I(0x005a6d8b,0x005a6d92,s->edx=s->ecx*4u+0x01d972c0u)
    I(0x005a6d92,0x005a6d93,push32(s,s->edx))
    K(0x005a6d93,0x005022c0,0x005a6d98);
    I(0x005a6d98,0x005a6d9e,s->edx=R32(0x02259940u)) /* before owner reload */
    I(0x005a6d9e,0x005a6da0,s->eax=F(A_XOR,s->eax,s->eax,32))
    I(0x005a6da0,0x005a6da2,CMP(s->edx,s->ebp,32))
    I(0x005a6da2,0x005a6da5,put8(&s->eax,0,!equal_f(s)))
    I(0x005a6da5,0x005a6da6,s->eax=inc_width(s,s->eax,32))
    I(0x005a6da6,0x005a6da7,push32(s,s->eax))
    I(0x005a6da7,0x005a6dac,s->eax=R32(0x022598a4u))
    I(0x005a6dac,0x005a6daf,s->ecx=s->eax+s->eax*4u)
    I(0x005a6daf,0x005a6db2,s->ecx=shift32(s,s->ecx,3,0))
    I(0x005a6db2,0x005a6db4,s->ecx=F(A_SUB,s->ecx,s->eax,32))
    I(0x005a6db4,0x005a6dbb,s->edx=s->ecx*4u+0x01d972c0u)
    I(0x005a6dbb,0x005a6dbc,push32(s,s->edx))
    K(0x005a6dbc,0x00505c00,0x005a6dc1);
    I(0x005a6dc1,0x005a6dc4,s->esp=F(A_ADD,s->esp,0x14u,32))
    I(0x005a6dc4,0x005a6dc8,U16(esi,R16(s->edi+0xcu))) /* R1 capture */
    I(0x005a6dc8,0x005a6dcc,CMP(s->esi,2,16))
    B(0x005a6dcc,0x005a6e6a,0x005a6dd2,!equal_f(s));
    I(0x005a6dd2,0x005a6dd4,s->ecx=F(A_XOR,s->ecx,s->ecx,32))
    I(0x005a6dd4,0x005a6dd6,s->edx=F(A_XOR,s->edx,s->edx,32))
    I(0x005a6dd6,0x005a6ddc,put8(&s->ecx,0,R8(0x01d98214u)))
    I(0x005a6ddc,0x005a6de1,s->eax=1)
    I(0x005a6de1,0x005a6de2,s->ecx=inc_width(s,s->ecx,32))
    I(0x005a6de2,0x005a6de8,W32(0x0225993cu,s->edx))
    I(0x005a6de8,0x005a6dea,CMP(s->ecx,s->eax,32))
    B(0x005a6dea,0x005a6e01,0x005a6dec,less_f(s));
    I(0x005a6dec,0x005a6dee,s->ebx=F(A_XOR,s->ebx,s->ebx,32))
    I(0x005a6dee,0x005a6df4,put8(&s->ebx,0,R8(s->eax+0x01d98214u)))
    I(0x005a6df4,0x005a6df6,s->edx=F(A_ADD,s->edx,s->ebx,32))
    I(0x005a6df6,0x005a6df7,s->eax=inc_width(s,s->eax,32))
    I(0x005a6df7,0x005a6df9,CMP(s->eax,s->ecx,32))
    B(0x005a6df9,0x005a6dec,0x005a6dfb,equal_f(s)||less_f(s));
    I(0x005a6dfb,0x005a6e01,W32(0x0225993cu,s->edx))
    I(0x005a6e01,0x005a6e05,CMP(s->esi,2,16)) /* R1 no memory reload */
    B(0x005a6e05,0x005a6e6a,0x005a6e07,!equal_f(s));
    I(0x005a6e07,0x005a6e0c,push32(s,0x005a7660u))
    I(0x005a6e0c,0x005a6e11,push32(s,0x02258a80u))
    K(0x005a6e11,0x00508360,0x005a6e16);
    I(0x005a6e16,0x005a6e1a,W16(s->eax+0xcu,s->ebp))
    I(0x005a6e1a,0x005a6e1d,s->esp=F(A_ADD,s->esp,8,32))
    I(0x005a6e1d,0x005a6e22,s->eax=0x022598b0u)
    I(0x005a6e22,0x005a6e24,W32(s->eax,s->ebp))
    I(0x005a6e24,0x005a6e27,s->eax=F(A_ADD,s->eax,0x14u,32))
    I(0x005a6e27,0x005a6e2c,CMP(s->eax,0x0225993cu,32))
    B(0x005a6e2c,0x005a6e22,0x005a6e2e,less_f(s));
    I(0x005a6e2e,0x005a6e33,push32(s,0x005a7ba0u))
    I(0x005a6e33,0x005a6e38,push32(s,0x02258a80u))
    K(0x005a6e38,0x00508360,0x005a6e3d);
    I(0x005a6e3d,0x005a6e3f,s->esi=s->eax)
    I(0x005a6e3f,0x005a6e43,W16(s->esi+0xcu,s->ebp))
    K(0x005a6e43,0x0055cbd2,0x005a6e48);
    I(0x005a6e48,0x005a6e49,s->edx=(s->eax&0x80000000u)?UINT32_MAX:0)
    I(0x005a6e49,0x005a6e4e,s->ecx=0x18u)
    I(0x005a6e4e,0x005a6e53,push32(s,0x005a7cd0u))
    I(0x005a6e53,0x005a6e55,if(idiv32(s,s->ecx)!=0) return -1)
    I(0x005a6e55,0x005a6e5a,push32(s,0x02258a80u))
    I(0x005a6e5a,0x005a6e5e,W16(s->esi+0xeu,s->edx))
    K(0x005a6e5e,0x00508360,0x005a6e63);
    I(0x005a6e63,0x005a6e66,s->esp=F(A_ADD,s->esp,0x10u,32))
    I(0x005a6e66,0x005a6e6a,W16(s->eax+0xcu,s->ebp))
    I(0x005a6e6a,0x005a6e70,CMP(R32(0x02259940u),s->ebp,32))
    B(0x005a6e70,0x005a6e9f,0x005a6e72,equal_f(s));
    I(0x005a6e72,0x005a6e76,s->edx=sx16(R16(s->edi+0xcu)))
    I(0x005a6e76,0x005a6e7c,CMP(s->edx,R32(0x0225993cu),32))
    B(0x005a6e7c,0x005a6e9f,0x005a6e7e,!equal_f(s));
    I(0x005a6e7e,0x005a6e83,push32(s,0x005a70a0u))
    I(0x005a6e83,0x005a6e88,push32(s,0x0209faa8u))
    K(0x005a6e88,0x00508360,0x005a6e8d);
    I(0x005a6e8d,0x005a6e94,U16(ecx,R16(0x022598a4u))) /* R2 capture first */
    I(0x005a6e94,0x005a6e97,s->esp=F(A_ADD,s->esp,8,32))
    I(0x005a6e97,0x005a6e9b,W16(s->eax+0xcu,s->ebp))
    I(0x005a6e9b,0x005a6e9f,W16(s->eax+0x1au,s->ecx))
    I(0x005a6e9f,0x005a6ea4,CMP(R16(s->edi+0xcu),0x3a,16))
    B(0x005a6ea4,0x005a6f2f,0x005a6eaa,!equal_f(s));
    I(0x005a6eaa,0x005a6eaf,push32(s,0x005a8340u))
    I(0x005a6eaf,0x005a6eb4,push32(s,0x02258a80u))
    K(0x005a6eb4,0x00508360,0x005a6eb9);
    I(0x005a6eb9,0x005a6ebb,s->esi=s->eax)
    I(0x005a6ebb,0x005a6ebe,s->esp=F(A_ADD,s->esp,8,32))
    I(0x005a6ebe,0x005a6ec2,W16(s->esi+0xcu,s->ebp))
    K(0x005a6ec2,0x0055cbd2,0x005a6ec7);
    I(0x005a6ec7,0x005a6ec8,s->edx=(s->eax&0x80000000u)?UINT32_MAX:0)
    I(0x005a6ec8,0x005a6ecd,s->ecx=0xc00u)
    I(0x005a6ecd,0x005a6ecf,if(idiv32(s,s->ecx)!=0) return -1)
    I(0x005a6ecf,0x005a6ed4,s->eax=0x55555556u)
    I(0x005a6ed4,0x005a6eda,s->ecx=R32(0x02258a50u)) /* R3 six reads begin */
    I(0x005a6eda,0x005a6ee0,W32(0x02258a68u,s->ecx))
    I(0x005a6ee0,0x005a6ee6,s->ecx=R32(0x02258a5cu))
    I(0x005a6ee6,0x005a6eec,W32(0x02258a74u,s->ecx))
    I(0x005a6eec,0x005a6ef2,s->edx=F(A_ADD,s->edx,0x1d00u,32))
    I(0x005a6ef2,0x005a6ef4,imul_edx(s))
    I(0x005a6ef4,0x005a6ef6,s->eax=s->edx)
    I(0x005a6ef6,0x005a6ef9,s->eax=shift32(s,s->eax,31,1))
    I(0x005a6ef9,0x005a6efb,s->edx=F(A_ADD,s->edx,s->eax,32))
    I(0x005a6efb,0x005a6f00,s->eax=R32(0x02258a58u)) /* full EAX capture survives child writes */
    I(0x005a6f00,0x005a6f04,W16(s->esi+0x1eu,s->edx))
    I(0x005a6f04,0x005a6f08,W16(s->esi+0x1cu,s->edx))
    I(0x005a6f08,0x005a6f0e,s->edx=R32(0x02258a54u))
    I(0x005a6f0e,0x005a6f13,W32(0x02258a70u,s->eax))
    I(0x005a6f13,0x005a6f18,s->eax=R32(0x02258a64u))
    I(0x005a6f18,0x005a6f1e,W32(0x02258a6cu,s->edx))
    I(0x005a6f1e,0x005a6f24,s->edx=R32(0x02258a60u))
    I(0x005a6f24,0x005a6f29,W32(0x02258a7cu,s->eax))
    I(0x005a6f29,0x005a6f2f,W32(0x02258a78u,s->edx))
    I(0x005a6f2f,0x005a6f33,U16(eax,R16(s->edi+0xcu)))
    I(0x005a6f33,0x005a6f37,CMP(s->eax,0x10,16))
    B(0x005a6f37,0x005a6f43,0x005a6f39,greater_f(s));
    I(0x005a6f39,0x005a6f3c,s->ecx=sx16(s->eax))
    I(0x005a6f3c,0x005a6f3f,s->ecx=shift32(s,s->ecx,7,0))
    I(0x005a6f3f,0x005a6f40,push32(s,s->ebp))
    I(0x005a6f40,0x005a6f41,push32(s,s->ecx))
    I(0x005a6f41,0x005a6f68,(void)0)
    I(0x005a6f43,0x005a6f49,s->edx=R32(0x0225993cu))
    I(0x005a6f49,0x005a6f4c,s->ecx=sx16(s->eax))
    I(0x005a6f4c,0x005a6f4f,s->esi=s->edx-8u)
    I(0x005a6f4f,0x005a6f51,CMP(s->ecx,s->esi,32))
    B(0x005a6f51,0x005a6f70,0x005a6f53,less_f(s));
    I(0x005a6f53,0x005a6f57,CMP(s->eax,4,16))
    B(0x005a6f57,0x005a6f70,0x005a6f59,equal_f(s)||less_f(s));
    I(0x005a6f59,0x005a6f5f,CMP(R32(0x02259940u),s->ebp,32))
    B(0x005a6f5f,0x005a6f70,0x005a6f61,!equal_f(s));
    I(0x005a6f61,0x005a6f63,s->edx=F(A_SUB,s->edx,s->ecx,32))
    I(0x005a6f63,0x005a6f64,push32(s,s->ebp))
    I(0x005a6f64,0x005a6f67,s->edx=shift32(s,s->edx,8,0))
    I(0x005a6f67,0x005a6f68,push32(s,s->edx))
    K(0x005a6f68,0x005713e0,0x005a6f6d);
    I(0x005a6f6d,0x005a6f70,s->esp=F(A_ADD,s->esp,8,32))
    I(0x005a6f70,0x005a6f74,U16(eax,R16(s->edi+0xcu))) /* pre-camera AX */
    I(0x005a6f74,0x005a6f78,CMP(s->eax,8,16))
    B(0x005a6f78,0x005a6fa0,0x005a6f7a,greater_f(s));
    I(0x005a6f7a,0x005a6f7c,push32(s,0x40))
    I(0x005a6f7c,0x005a6f7e,push32(s,0x60))
    I(0x005a6f7e,0x005a6f83,push32(s,0xf0))
    K(0x005a6f83,0x0045dd60,0x005a6f88);
    I(0x005a6f88,0x005a6f8c,s->esi=sx16(R16(s->edi+0xcu))) /* post-camera phase, early arm */
    I(0x005a6f8c,0x005a6f92,s->edx=R32(0x00b8b7d8u))
    I(0x005a6f92,0x005a6f96,s->eax=s->esp+0x20u)
    I(0x005a6f96,0x005a6f99,s->esi=shift32(s,s->esi,9,0))
    I(0x005a6f99,0x005a6f9d,W32(s->esp+0x20u,s->edx))
    I(0x005a6f9d,0x005a6f9e,push32(s,s->eax))
    I(0x005a6f9e,0x005a6fe2,(void)0)
    I(0x005a6fa0,0x005a6fa6,s->ecx=R32(0x0225993cu))
    I(0x005a6fa6,0x005a6fa9,s->edx=sx16(s->eax))
    I(0x005a6fa9,0x005a6fac,s->ecx=F(A_ADD,s->ecx,0xfffffff8u,32))
    I(0x005a6fac,0x005a6fae,CMP(s->edx,s->ecx,32))
    B(0x005a6fae,0x005a700f,0x005a6fb0,less_f(s));
    I(0x005a6fb0,0x005a6fb4,CMP(s->eax,4,16))
    B(0x005a6fb4,0x005a700f,0x005a6fb6,equal_f(s)||less_f(s));
    I(0x005a6fb6,0x005a6fb8,push32(s,0x40))
    I(0x005a6fb8,0x005a6fba,push32(s,0x60))
    I(0x005a6fba,0x005a6fbf,push32(s,0xf0))
    K(0x005a6fbf,0x0045dd60,0x005a6fc4);
    I(0x005a6fc4,0x005a6fc8,s->eax=sx16(R16(s->edi+0xcu))) /* late arm stays late */
    I(0x005a6fc8,0x005a6fce,s->esi=R32(0x0225993cu)) /* post-camera T */
    I(0x005a6fce,0x005a6fd4,s->ecx=R32(0x00b8b7d8u))
    I(0x005a6fd4,0x005a6fd6,s->esi=F(A_SUB,s->esi,s->eax,32))
    I(0x005a6fd6,0x005a6fda,s->edx=s->esp+0x20u)
    I(0x005a6fda,0x005a6fdd,s->esi=shift32(s,s->esi,9,0))
    I(0x005a6fdd,0x005a6fe1,W32(s->esp+0x20u,s->ecx))
    I(0x005a6fe1,0x005a6fe2,push32(s,s->edx))
    K(0x005a6fe2,0x0045e110,0x005a6fe7);
    I(0x005a6fe7,0x005a6fe8,push32(s,s->esi))
    K(0x005a6fe8,0x0045e150,0x005a6fed);
    K(0x005a6fed,0x0045f270,0x005a6ff2);
    I(0x005a6ff2,0x005a6ff7,s->eax=R32(0x022598a4u))
    I(0x005a6ff7,0x005a6ffa,s->ecx=s->eax+s->eax*4u)
    I(0x005a6ffa,0x005a6ffd,s->ecx=shift32(s,s->ecx,3,0))
    I(0x005a6ffd,0x005a6fff,s->ecx=F(A_SUB,s->ecx,s->eax,32))
    I(0x005a6fff,0x005a7006,s->edx=s->ecx*4u+0x01d972e8u)
    I(0x005a7006,0x005a7007,push32(s,s->edx))
    K(0x005a7007,0x0045e360,0x005a700c);
    I(0x005a700c,0x005a700f,s->esp=F(A_ADD,s->esp,0x18u,32))
    I(0x005a700f,0x005a7014,CMP(R16(s->edi+0xcu),1,16))
    I(0x005a7014,0x005a7015,s->esi=pop32(s))
    I(0x005a7015,0x005a7016,s->ebx=pop32(s))
    B(0x005a7016,0x005a702f,0x005a7018,!equal_f(s));
    I(0x005a7018,0x005a701d,push32(s,0x80))
    I(0x005a701d,0x005a7022,push32(s,0x8000))
    I(0x005a7022,0x005a7027,push32(s,0x00e91520u))
    K(0x005a7027,0x00501330,0x005a702c);
    I(0x005a702c,0x005a702f,s->esp=F(A_ADD,s->esp,0xc,32))
    I(0x005a702f,0x005a7033,a=s->edi+0xcu; v=R16(a); v=inc_width(s,v,16); W16(a,v))
    I(0x005a7033,0x005a7039,s->ecx=R32(0x0225993cu))
    I(0x005a7039,0x005a703d,s->eax=sx16(R16(s->edi+0xcu)))
    I(0x005a703d,0x005a703f,CMP(s->eax,s->ecx,32))
    B(0x005a703f,0x005a7046,0x005a7041,greater_f(s));
    I(0x005a7041,0x005a7042,s->edi=pop32(s))
    I(0x005a7042,0x005a7044,s->eax=F(A_XOR,s->eax,s->eax,32))
    I(0x005a7044,0x005a7045,s->ebp=pop32(s))
    T(0x005a7045);
    I(0x005a7046,0x005a704c,CMP(R32(0x02259940u),s->ebp,32))
    B(0x005a704c,0x005a7058,0x005a704e,!equal_f(s));
    I(0x005a704e,0x005a704f,push32(s,s->ebp))
    I(0x005a704f,0x005a7050,push32(s,s->ebp))
    K(0x005a7050,0x005713e0,0x005a7055);
    I(0x005a7055,0x005a7058,s->esp=F(A_ADD,s->esp,8,32))
    I(0x005a7058,0x005a705e,s->ecx=R32(0x022598a4u))
    I(0x005a705e,0x005a7061,s->eax=s->ecx+s->ecx*4u)
    I(0x005a7061,0x005a7064,s->eax=shift32(s,s->eax,3,0))
    I(0x005a7064,0x005a7066,s->eax=F(A_SUB,s->eax,s->ecx,32))
    I(0x005a7066,0x005a706c,s->ecx=R32(0x00b8b7d8u))
    I(0x005a706c,0x005a706f,s->eax=shift32(s,s->eax,2,0))
    I(0x005a706f,0x005a7075,W32(s->eax+0x01d972e8u,s->ecx))
    I(0x005a7075,0x005a707c,U16(edx,R16(s->eax+0x01d972c0u)))
    I(0x005a707c,0x005a7082,s->edx=F(A_AND,s->edx,0xf7ffu,32))
    I(0x005a7082,0x005a7086,U16(edx,F(A_OR,s->edx,R16(s->edi+0xeu),16)))
    I(0x005a7086,0x005a7087,s->edi=pop32(s))
    I(0x005a7087,0x005a7088,s->ebp=pop32(s))
    I(0x005a7088,0x005a708f,W16(s->eax+0x01d972c0u,s->edx))
    I(0x005a708f,0x005a7094,s->eax=2)
    T(0x005a7094);
    default: return 1;
    }
}

#undef R8
#undef R16
#undef R32
#undef W16
#undef W32
#undef U16
#undef F
#undef CMP
#undef I
#undef B
#undef K
#undef T
```

### Snapshot C ancien pack (H-J3-fix 2026-10-09 — archivé tel quel, non actif)

Gate parent natif 2026-10-10 du **premier fence actif** : PASS dans le modèle
x86 borné seulement, 247/247 instructions/chunk `[5A6D20,5A7095)` et CFG/calls/
retours conformes ; source SHA `f72f60b2e03e3baf6c4630045de0cb639a54b3f305b799fbb073a98b13ea4ee7`.
R1/R2/R3, reloads postCamera/T/owner/épilogue et 16 sites/17 opérations WORD
vérifiés directement par parent en ASM actuel. C actif SHA inchangé
`8364098674530453ece3ec71ffc0be22e47e5162b50890a1407bc4560166a82d`.
Voir avenant gate du livrable sémantique pour ABI/strides/ancres et preuve parent.
La validation ne fournit pas les callbacks externes, ne prouve aucune équivalence
ISO/compilée/native/runtime et ne réactive pas le C ordinaire archivé ci-dessous.

```c
/* BdLinkCallback_5A6D20 @ 0x5A6D20
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 247 instr, size 0x375, end 0x5A7095. IDA type int __cdecl(int (*)()).
 * cdecl, 1 arg = BdLink node (EDI). EBP is zero constant, not a frame pointer.
 * Saved EBP EDI then EBX ESI. retn C3.
 * BdLinkTask_Register 2 args (list_head, callback); add esp 8 or 10h (pair).
 * Child phase: WORD [node+0Ch]=0 (66 89 xx 0C), NOT BYTE +0x0D.
 * Pump unlink: EAX=2 (TEST AL,2). Keep: EAX=0 (flags 201h or phase<=total).
 * setnz al; inc eax → animId 1 or 2. jg/jl/jle signed. No ja. No jpt.
 * Actor stride lea/shl/sub → slot*0x9C at g_BattlePresentationActors 0x1D972C0.
 * or ah,8 / and 800h = actor WORD bit 0x800, NOT occupancy 1+2, NOT Register bit0.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / GetRandomInt: absent.
 * add esp: 14h (5022C0+StartAnim), 8, 10h, 18h (Camera+GTE), 0Ch (BdPlaySE).
 * No packed node struct. No NULL check on Register EAX. No domain::.
 * Avenant 2026-10-09 (H-J3 repair, DRAFT pending parent review): live ASM
 * reloads dword_22598A4 after front calls (5A6DA7 after sub_5022C0, 5A6FF2
 * after sub_45F270, 5A7058 epilogue) and reloads WORD [node+0Ch] after
 * Camera_SetPackedSlots_15_16_17 (5A6F88 early arm, 5A6FC4 late arm) plus T
 * (5A6FC8). This C now re-reads those globals instead of caching actor /
 * phase_s across calls. Under callee non-mutation both versions coincide;
 * non-mutation is NOT established (helpers out of scope), so no runtime
 * violation is claimed. ISO C limits: int/pointer casts and pointer-to-int
 * compares are implementation-defined; unaligned 16-bit accesses and
 * unsigned short* aliasing are UB in ISO C, accepted on the x86 target.
 */

extern unsigned int battle_to_update_flags_dword_1D96A9C;
extern int dword_22598A4;
extern unsigned char g_BattlePresentationActors[];
extern int dword_24FEB68;
extern int dword_E9264C;
extern int dword_2259940;
extern unsigned char byte_1D98214[];
extern int dword_225993C;
extern int dword_2258A80;
extern int dword_209FAA8;
extern int dword_22598B0;
extern int dword_2258A50;
extern int dword_2258A54;
extern int dword_2258A58;
extern int dword_2258A5C;
extern int dword_2258A60;
extern int dword_2258A64;
extern int dword_2258A68;
extern int dword_2258A6C;
extern int dword_2258A70;
extern int dword_2258A74;
extern int dword_2258A78;
extern int dword_2258A7C;
extern int off_B8B7D8;
extern unsigned int off_E91520;

extern int *__cdecl sub_5022C0(int actor, int *a2, int *a3);
extern void __cdecl BattlePresentation_StartActorAnimation(int actor, int animId);
extern int __cdecl BdLinkTask_Register(int list_head, int callback);
extern int __cdecl _rand(void);
extern int *__cdecl FillWordPairStride2C_1D989B8(short word, int dword);
extern int __cdecl Camera_SetPackedSlots_15_16_17(int a, int b, int c);
extern int *__cdecl GteState_StorePtr_1CA8A28(int *ptr);
extern int __cdecl GteState_Set_1CA8A30(int v);
extern int __cdecl sub_45F270(void);
extern int *__cdecl GteState_GetToPtr_1CA8A68(int *ptr);
extern int __cdecl BdPlaySE(unsigned int *a, int b, unsigned int c);
extern int __cdecl sub_5A7660(int node);
extern int __cdecl sub_5A7BA0(int node);
extern int __cdecl sub_5A7CD0(int node);
extern int __cdecl sub_5A70A0(int node);
extern int __cdecl sub_5A8340(int node);

int __cdecl BdLinkCallback_5A6D20(int node)
{
    unsigned char *actor;
    unsigned short phase0;
    unsigned short w;
    int slot;
    int child;
    int n;
    int sum;
    int i;
    int *p;
    int gte_slot;
    int gte_arg;
    short phase_s;

    if (battle_to_update_flags_dword_1D96A9C & 0x201)
        return 0;

    slot = dword_22598A4; /* 5A6D3F initial read */
    actor = &g_BattlePresentationActors[slot * 0x9C];
    phase0 = *(unsigned short *)(node + 0x0C); /* DX; 66 8B 57 0C */

    if (phase0 == 0) { /* 5A6D45; DX initial */
        w = *(unsigned short *)actor;
        *(unsigned short *)(node + 0x0E) = (unsigned short)(w & 0x800); /* 81 E3 00 08; 66 89 5F 0E */
        *(unsigned short *)actor = (unsigned short)(w | 0x800);       /* 80 CC 08 */
    }

    if (phase0 == 1) { /* CMP DX,1 @5A6D73 uses original DX, not a reload */
        sub_5022C0((int)actor, &dword_24FEB68, &dword_E9264C); /* actor from slot @5A6D3F */
        slot = dword_22598A4; /* 5A6DA7 reload AFTER sub_5022C0 */
        actor = &g_BattlePresentationActors[slot * 0x9C]; /* 5A6DAC-5A6DB4 */
        BattlePresentation_StartActorAnimation((int)actor, (dword_2259940 != 0) + 1); /* setnz+inc */
        /* add esp,14h */
    }

    if (*(unsigned short *)(node + 0x0C) == 2) { /* reload SI @5A6DC4 */
        n = (unsigned char)byte_1D98214[0] + 1;
        sum = 0;
        dword_225993C = 0;
        if (n >= 1) { /* JL skip; dead for zero-ext byte+1, kept */
            for (i = 1; i <= n; i++) /* JLE */
                sum += (unsigned char)byte_1D98214[i];
            dword_225993C = sum;
        }
        if (*(unsigned short *)(node + 0x0C) == 2) { /* CMP SI,2 recheck @5A6E01 */
            child = BdLinkTask_Register((int)&dword_2258A80, (int)sub_5A7660);
            *(unsigned short *)(child + 0x0C) = 0; /* 66 89 68 0C */
            for (p = &dword_22598B0; (int)p < (int)&dword_225993C; p = (int *)((char *)p + 0x14))
                *p = 0; /* 89 28; ADD EAX,14h; JL */
            child = BdLinkTask_Register((int)&dword_2258A80, (int)sub_5A7BA0);
            *(unsigned short *)(child + 0x0C) = 0;
            *(unsigned short *)(child + 0x0E) = (unsigned short)(_rand() % 0x18); /* CDQ/IDIV 18h DX */
            child = BdLinkTask_Register((int)&dword_2258A80, (int)sub_5A7CD0);
            *(unsigned short *)(child + 0x0C) = 0;
            /* add esp,10h */
        }
    }

    if (dword_2259940 != 0 && (int)(short)*(unsigned short *)(node + 0x0C) == dword_225993C) { /* 5A6E6A/5A6E72 reload */
        child = BdLinkTask_Register((int)&dword_209FAA8, (int)sub_5A70A0);
        *(unsigned short *)(child + 0x0C) = 0;
        *(unsigned short *)(child + 0x1A) = (unsigned short)dword_22598A4; /* 66 89 48 1A; fresh WORD read @5A6E8D */
    }

    if (*(unsigned short *)(node + 0x0C) == 0x3A) { /* 5A6E9F reload */
        child = BdLinkTask_Register((int)&dword_2258A80, (int)sub_5A8340);
        *(unsigned short *)(child + 0x0C) = 0;
        sum = _rand() % 0xC00; /* IDIV 0C00h remainder EDX */
        sum = (sum + 0x1D00) / 3; /* IMUL 55555556h + SHR 1Fh */
        dword_2258A68 = dword_2258A50;
        dword_2258A74 = dword_2258A5C;
        dword_2258A70 = dword_2258A58;
        dword_2258A6C = dword_2258A54;
        dword_2258A7C = dword_2258A64;
        dword_2258A78 = dword_2258A60;
        *(unsigned short *)(child + 0x1E) = (unsigned short)sum;
        *(unsigned short *)(child + 0x1C) = (unsigned short)sum;
    }

    phase_s = (short)*(unsigned short *)(node + 0x0C); /* 5A6F2F reload */
    if (phase_s <= 16) { /* CMP AX,10h / JG signed */
        FillWordPairStride2C_1D989B8((short)(phase_s << 7), 0);
    } else if (phase_s >= dword_225993C - 8 && phase_s > 4 && dword_2259940 == 0) {
        FillWordPairStride2C_1D989B8((short)((dword_225993C - phase_s) << 8), 0);
    }

    phase_s = (short)*(unsigned short *)(node + 0x0C); /* 5A6F70 reload */
    if (phase_s <= 8 || (phase_s >= dword_225993C - 8 && phase_s > 4)) {
        /* second arm has no dword_2259940 test (unlike FillWordPair) */
        Camera_SetPackedSlots_15_16_17(0xF0, 0x60, 0x40); /* 5A6F83 early arm / 5A6FBF late arm */
        if (phase_s <= 8) /* branch choice uses the pre-Camera read (cmp ax,8 @5A6F74) */
            gte_arg = (short)*(unsigned short *)(node + 0x0C) << 9; /* 5A6F88 reload AFTER Camera; shl esi,9 @5A6F96 */
        else
            gte_arg = (dword_225993C - (short)*(unsigned short *)(node + 0x0C)) << 9; /* t reload @5A6FC4, T re-read @5A6FC8 */
        gte_slot = off_B8B7D8; /* value copied into arg home slot; overlays arg_0 on stack (5A6F92/5A6F99) */
        GteState_StorePtr_1CA8A28(&gte_slot); /* 5A6FE2 */
        GteState_Set_1CA8A30(gte_arg); /* 5A6FE8 */
        sub_45F270(); /* 5A6FED */
        slot = dword_22598A4; /* 5A6FF2 reload AFTER sub_45F270 */
        actor = &g_BattlePresentationActors[slot * 0x9C];
        GteState_GetToPtr_1CA8A68((int *)(actor + 0x28)); /* 1D972E8 + slot*0x9C = actor+0x28 */
        /* add esp,18h */
    }

    if (*(unsigned short *)(node + 0x0C) == 1) /* 5A700F reload */
        BdPlaySE(&off_E91520, 0x8000, 0x80); /* add esp,0Ch */

    *(unsigned short *)(node + 0x0C) += 1; /* 66 FF 47 0C */
    if ((int)(short)*(unsigned short *)(node + 0x0C) <= dword_225993C) /* 5A7039 reload after inc; T read @5A7033 */
        return 0;

    if (dword_2259940 == 0)
        FillWordPairStride2C_1D989B8(0, 0);

    slot = dword_22598A4; /* 5A7058 reload */
    actor = &g_BattlePresentationActors[slot * 0x9C];
    *(int *)(actor + 0x28) = off_B8B7D8; /* 5A706F writes CURRENT global value, not a restore */
    w = *(unsigned short *)actor; /* 5A7075 */
    w = (unsigned short)((w & 0xF7FF) | *(unsigned short *)(node + 0x0E)); /* 81 E2 FF F7; 66 0B 57 0E */
    *(unsigned short *)actor = w;
    return 2;
}
```
