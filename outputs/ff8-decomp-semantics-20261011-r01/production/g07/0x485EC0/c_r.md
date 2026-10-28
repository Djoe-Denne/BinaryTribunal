# C R — 0x485EC0

Réconciliation de `c_a.md` et `c_b.md` contre le gel. Aucun CONFLICT restant. Les points non décidables restent UNCERTAIN. Les gates natifs finaux du parent restent ouverts : pas de hash SHA-256 recalculé, pas de compilation, pas d'écriture IDB, pas de live.

## Provenance lue

Gel autorisé, hashes cités par le manifeste et repris à l'identique par A et par B :

- Paquet `inputs/ff8-decomp-semantics-20261011-r01/g07/0x485EC0.json`, SHA-256 cité `50a28e8cec513ad24cf73574d698fa89d1877ea254fe333b0b6d761db3c711af`.
- Projection `inputs/ff8-decomp-semantics-20261011-r01/g07/0x485EC0.readable/` : `manifest.json`, `asm-001.txt` (`a6c6d4681f1b79ff6a36f3cb10d7cdaf556f45168baaa2a1ac0e51992b40c886`), `bytes-001.txt` (`aa8fe56da9eb21af2ffd9f37dd32235bd197f4ad75412611a2047dcad4b1bc2d`), `metadata.json` (`452ad52a60954aa846842891393d96d72faa450f43dbc53ecb1471d4de61b5ac`).
- Compaction commune `inputs/ff8-decomp-semantics-20261011-r01/g07/common-compaction.md`, SHA-256 cité `6925ce258d423a1b3b9e352cad9925a19202940e72df0121a3ac4681ed4f1fff`.
- Image 32 bits SHA-256 cité `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, export `2026-10-11T16:38:25.140966+00:00`.
- A déposé : `outputs/ff8-decomp-semantics-20261011-r01/production/g07/0x485EC0/c_a.md`.
- B déposé : `outputs/ff8-decomp-semantics-20261011-r01/production/g07/0x485EC0/c_b.md`.

Le volet sémantique voisin n'a pas été lu. Les SHA-256 n'ont pas été recalculés ici. Le hex du paquet (59 octets) est identique à `bytes-001.txt`.

## Couverture

23 instructions, chunk unique `[0x485EC0,0x485EFB)`, 59 octets (`0x3B`). Cinq blocs CFG du paquet, tous couverts : `485EC0→485ED7`, `485ED7→485EDE` (jz vers `485EF2`), `485EDE→485EF2`, `485EF2→485EF8` (jl vers `485ED7`), `485EF8→485EFB`. Aucune instruction x87/SSE dans ce chunk.

## Convergences retenues après contrôle des octets

Ces accords ne sont pas la preuve ; chaque ligne a été revérifiée sur le hex.

- Un dword d'entrée à `[ESP+4]` (`8B 44 24 04`). `RET` nu (`C3`), pas `RET n`.
- `ECX = arg*3`, `EDX = arg*13`, puis `SHL EDX,4`, le tout modulo 2^32. Équivalent à `(arg * 0xD0) mod 2^32`. Les `LEA` ne sont pas une multiplication signée.
- `EDI = 0x01D27BC8 + EDX`, déplacement little-endian `C8 7B D2 01`. L'identité arithmétique avec la base de slot documentée `0x01D27B10 + 0xB8` vient de la compaction ; le nom de champ du désassemblage n'est pas une preuve de rôle.
- `MOV AL,[EDI+ESI]` (`8A 04 37`) ne touche pas EAX[31:8]. Ce n'est pas un `MOVZX`.
- `TEST AL,AL` / `JZ` (`74 14` → `0x485EF2`) saute `AND`, les deux `PUSH`, le `CALL`, `ADD ESP,8` et le `MOV` octet 0.
- `AND EAX,0FFh` (`25 FF 00 00 00`) n'est atteint que si AL ≠ 0, et étend alors l'octet à 32 bits.
- Ordre des pushes : `PUSH 0` (`6A 00`) puis `PUSH EAX` (`50`). À l'entrée de l'appelé, `[ESP+4] = EAX` et `[ESP+8] = 0`.
- `E8 55 0C 00 00` à `0x485EE6` : EIP suivant `0x485EEB + 0xC55 = 0x486B40`.
- `ADD ESP,8` (`83 C4 08`) est dans cette fonction, après le retour.
- Le `MOV byte ptr [EDI+ESI],0` (`C6 04 37 00`) est après cet `ADD`, et relit EDI/ESI tels qu'ils sont à ce moment.
- `XOR ESI,ESI`, `INC ESI`, `CMP ESI,2`, `JL` (`7C DF` → `0x485ED7`, condition signée SF≠OF). Pas un `JB`.
- `PUSH ESI` / `PUSH EDI` puis `POP EDI` / `POP ESI`. Sur le chemin ordinaire ces slots rendent au caller les ESI/EDI d'entrée.
- Pas de type de retour prouvé. Quatre xrefs code du paquet, type 17, `iscode` true : `0x485835` dans `0x485610`, `0x486903` dans `0x4868C0`, `0x486CB7` dans `0x486C70`, `0x493A84` dans `0x493840`.

## Divergences

| Point | A | B | Tranche |
| --- | --- | --- | --- |
| Modèle mémoire | tableau invité indexé par VA 32 bits | cast de la VA vers un pointeur hôte | Mémoire invitée. Le cast hôte n'est pas l'espace du gel. |
| `ADD ESP,8` | instruction de cette fonction, après un adapter qui a déjà fait le `RET` | appliqué à l'intérieur de l'adapter | Reste dans `fn_485EC0`. L'adapter n'est pas un prototype de `0x486B40`. |
| Résidu EAX | état machine complet | local non retourné ; la prose le décrit | Conservé dans l'état machine. Ce n'est pas un contrat de retour C. |
| Flags XOR/SHL/AND/ADD ESP/INC | simulés, OF/AF du `SHL` 4 laissés indéfinis | absents | Aucun de ces résultats n'est lu avant d'être écrasé. Seuls ZF du `TEST` et SF/OF du `CMP` nourrissent un branchement. Les flags au `RET` sont ceux du `CMP ESI,2`. Pas de conflit observable. |
| Indices 0 et 1 | « si ESI/EDI normalement préservés » | « exactement 0 et 1 » dans le C, réserve plus bas | CERTAIN seulement si l'appelé laisse ESI inchangé. Le corps ne le prouve pas. |
| Nom | aucun | `process_and_clear_slot_stash` / `p_slot_id` | Non promu. Identifiant neutre `fn_485EC0`. |
| Forme `__cdecl` | non posée comme prototype source | notation dite conventionnelle | La forme de pile (un dword, caller-cleanup 8, `RET` nu, ESI/EDI sauvés par ce corps) est CERTAIN. Le mot cdecl n'est pas une métadonnée du paquet. |

## Erreurs communes écartées

Les commentaires du désassemblage (`RefundStashedItems`, `magic_to_blow_away`, `BattleEqualItemBuffer_AdjustCount`, `remove_one`, refund, cap 100, stride 5) sont dans la chaîne d'assembly du paquet. A et B refusent tous deux de les promouvoir. Le contrôle des octets confirme qu'ils ne sont pas des instructions : la cible est seulement `0x486B40`, les arguments poussés sont l'octet étendu puis le dword immédiat 0, et le nom `0x486B40` du catalogue est déjà marqué en conflit par la compaction. Le sens métier reste UNCERTAIN.

La formule « ESI/EDI préservés » de la compaction décrit le prologue/epilogue de **cette** fonction. Elle ne prouve pas que `0x486B40` respecte ESI/EDI, ni que l'appelé n'écrase pas les slots `[ESP_entrée-4]` et `[ESP_entrée-8]`.

`MOV AL` n'a pas été réduit à un chargement 32 bits. Le `JL` n'a pas été réduit à un test non signé. Le clear n'a pas été placé avant le call.

## C réconcilié

Modèle d'exécution invité, pas un prototype source affirmé. L'adapter exécute le corps natif `0x486B40` jusqu'à son `RET` vers `0x485EEB` déjà poussé ; il ne fabrique pas de valeur de retour et ne remplace pas l'appelé.

```c
#include <stdint.h>

typedef struct X86Regs {
    uint32_t eax, ecx, edx, ebx, esi, edi, ebp, esp;
    uint32_t eip, eflags;
} X86Regs;

/* m[a] est l'octet à l'adresse invitée a. Les additions d'adresses
   ci-dessous sont faites en uint32_t, donc modulo 2^32. Ce n'est pas
   un mapping hôte ni un émulateur de faute. */
static uint32_t rd32(volatile uint8_t *m, uint32_t a)
{
    return (uint32_t)m[a]
         | ((uint32_t)m[(uint32_t)(a + 1u)] << 8)
         | ((uint32_t)m[(uint32_t)(a + 2u)] << 16)
         | ((uint32_t)m[(uint32_t)(a + 3u)] << 24);
}

static void wr32(volatile uint8_t *m, uint32_t a, uint32_t v)
{
    m[a] = (uint8_t)v;
    m[(uint32_t)(a + 1u)] = (uint8_t)(v >> 8);
    m[(uint32_t)(a + 2u)] = (uint8_t)(v >> 16);
    m[(uint32_t)(a + 3u)] = (uint8_t)(v >> 24);
}

static void push32(X86Regs *r, volatile uint8_t *m, uint32_t v)
{
    r->esp = (uint32_t)(r->esp - 4u);
    wr32(m, r->esp, v);
}

static uint32_t pop32(X86Regs *r, volatile uint8_t *m)
{
    uint32_t v = rd32(m, r->esp);
    r->esp = (uint32_t)(r->esp + 4u);
    return v;
}

/* Interface d'analyse. Pas un prototype de 0x486B40.
   À l'appel, le dword de retour 0x485EEB est déjà sur la pile.
   Au retour de l'adapter, le RET natif a déjà été exécuté. */
typedef void (*RunNative486B40)(X86Regs *r, volatile uint8_t *m);

static void fn_485EC0(X86Regs *r, volatile uint8_t *m,
                     RunNative486B40 run_native_486B40)
{
    uint32_t addr;

    /* 485EC0 */
    r->eax = rd32(m, (uint32_t)(r->esp + 4u));
    /* 485EC4 */
    push32(r, m, r->esi);
    /* 485EC5 XOR ESI,ESI. Flags mortes avant 485EDA. */
    r->esi = 0u;
    /* 485EC7 */
    push32(r, m, r->edi);
    /* 485EC8 LEA ECX,[EAX+EAX*2] */
    r->ecx = (uint32_t)(r->eax + (uint32_t)(r->eax * 2u));
    /* 485ECB LEA EDX,[EAX+ECX*4]  == 13*EAX mod 2^32 */
    r->edx = (uint32_t)(r->eax + (uint32_t)(r->ecx * 4u));
    /* 485ECE SHL EDX,4. OF/AF indéfinis et non lus. Résultat == (13*EAX)<<4. */
    r->edx = (uint32_t)(r->edx << 4);
    /* 485ED1 déplacement 0x01D27BC8 */
    r->edi = (uint32_t)(0x01D27BC8u + r->edx);

    for (;;) {
        /* 485ED7 MOV AL,[EDI+ESI] : EAX[31:8] conservé. */
        addr = (uint32_t)(r->edi + r->esi);
        r->eax = (r->eax & 0xFFFFFF00u) | (uint32_t)m[addr];
        /* 485EDA TEST AL,AL ; 485EDC JZ 485EF2 */
        if ((r->eax & 0xFFu) != 0u) {
            /* 485EDE */
            r->eax &= 0xFFu;
            /* 485EE3 PUSH 0 ; 485EE5 PUSH EAX ; 485EE6 CALL 0x486B40 */
            push32(r, m, 0u);
            push32(r, m, r->eax);
            push32(r, m, 0x00485EEBu);
            r->eip = 0x00486B40u;
            run_native_486B40(r, m);
            /* 485EEB. Les flags de cet ADD sont écrasés avant le JL et le RET. */
            r->esp = (uint32_t)(r->esp + 8u);
            /* 485EEE, adresses post-appel. */
            addr = (uint32_t)(r->edi + r->esi);
            m[addr] = 0u;
        }
        /* 485EF2 INC ESI ; 485EF3 CMP ESI,2 ; 485EF6 JL signé */
        r->esi = (uint32_t)(r->esi + 1u);
        if ((int32_t)r->esi >= 2)
            break;
    }

    /* 485EF8 POP EDI ; 485EF9 POP ESI ; 485EFA RETN */
    r->edi = pop32(r, m);
    r->esi = pop32(r, m);
    r->eip = pop32(r, m);
}
```

Forme de pile seulement, pas un contrat de valeur de retour : un appelant qui a poussé un dword retrouve `ESP` à `ESP_entrée+4` si les deux pops restaurent les slots d'entrée et si chaque call revient par un `RET` proche normal. EBX et EBP ne sont pas écrits par ce corps.

## Effets machine CERTAIN

- Chemin ordinaire, si `0x486B40` ne modifie ni ESI ni EDI : exactement les octets `[EDI+0]` et `[EDI+1]`, avec `EDI = 0x01D27BC8 + ((arg * 0xD0) mod 2^32)`. Un octet 0 n'est ni passé ni écrasé. Un octet non nul est étendu dans EAX, poussé avec un second dword 0, puis l'octet adressé par les EDI/ESI **courants** est mis à 0 après le retour.
- L'itération suivante relit la mémoire. Un écrit de l'appelé sur l'autre octet est visible. Aucune pureté n'est supposée.
- EAX au `RET`, selon la dernière itération effective :
  - dernier octet lu égal à 0 : EAX = (EAX d'avant ce `MOV AL`) avec le bas octet à 0. Si les deux octets sont 0 et que l'appelé n'a pas tourné, cela vaut `arg & 0xFFFFFF00` ;
  - dernier octet non nul : EAX est le résidu laissé par `0x486B40`, opaque pour ce corps.
- ECX final = `arg*3 mod 2^32`. EDX final = `(arg*13<<4) mod 2^32`. Aucun des deux n'est restauré.
- Flags au `RET` : ceux de `CMP ESI,2` qui a fait échouer le `JL`. Sur le chemin ordinaire ESI vaut 2, donc ZF=1, CF=0, SF=0, OF=0. Ce n'est pas un contrat logiciel prouvé envers les callers.
- Profondeur d'appel, hors cadre de l'appelé : 20 octets sous l'ESP d'entrée au moment du `CALL` (deux saves, deux arguments, adresse de retour).

## UNCERTAIN

- Sémantique, prototype, clobbers et effets mémoire de `0x486B40`. En particulier la préservation de ESI/EDI et l'intégrité des deux slots sauvés.
- Nom métier du dword d'entrée et des deux octets. `p_slot_id`, stash, item, magie, refund et le libellé IDA ne sont pas établis par ce corps.
- Dépendance éventuelle d'un caller aux flags ou au résidu EAX. Non examinée.
- Borne de validité de l'argument. Aucun test de plage dans ces 23 instructions. L'enroulement 32 bits est le comportement encodé, pas un garde-fou.
- OF et AF de `SHL EDX,4` (compte 4 > 1). Aucun branchement de ce corps ne les lit.

## Hors de ce livrable

Pas de verdict sémantique séparé. Pas de hash de sortie. Le parent reste responsable du contrôle natif final, de la compilation éventuelle et de l'intégration.
