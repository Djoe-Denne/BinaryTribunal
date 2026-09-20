# Magic213_BdLinkMaster_Step @ 0x69EB70

- Instr (live): 242 (782 o, 0x69EB70-0x69EE7D)
- Palier: 2+1
- Verdict: LIKELY - stepper maitre BdLinkTask de la magie 213 : bascule double buffer dword_2510194 a chaque tick ; au tick phase==1 s'auto-init (normalisation min/max 308 entrees 117ADE0 vers base+0x1B18, 4 pools BS_Memset base+0x1614/0x614/0x4D4/0x1D4, Register du stepper enfant sub_69EF60 sur dword_25101C8, liste effets 0x1D972C0 stride 0x9C dans node 0x504 triee par SELECTION descendant sur word +0x1C, +0x22=1, +0x26=(count<<12)/40 via 0x66666667, +0x2C=word de sub_69EE80) ; puis 4x BdLinkTask_Pump, AL=2 si flag + 4 pumps nuls, sinon phase++ saturee 0xA et AL=0
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_69EB70\nTYPE ; proposition: Magic213_BdLinkMaster_Step
- Notes parent: checks 5.6 OK : jnz loc_69ECA1 (0x69EBC3), Register (0x69ECAB)/Pump (0x69EDFE), lea ds:1D972C0h[ebx*4] (0x69ED15), cmp bx,[eax+1Ch] + reload var_C (0x69ED60-64) = selection, mov eax,1 avant cmp, store [esi+22h] (0x69EDAF-BA), 66666667h (0x69EDCD), mov [esi+2Ch],ax word seul (0x69EDEE), flag relu [ebp+0Fh] (0x69EE3C), mov eax,2 / xor eax,eax (0x69EE56/77), caller data xref sub_69EAF0 @0x69EB3B

## C reconcilie

```c
// ============================================================================
// c_reconciled.c — sub_69EB70 (0x69EB70, .text, 782 octets, 242 instr live)
// ============================================================================
// Pack triple 2+1 (campagne mag FX battle), cellule C-R.
// GROUND TRUTH = live ASM (asm.asm) + ida_dump_bytes, PAS Hex-Rays.
// Voix A (c_a.c) et voix B (c_b.c) réconciliées ; chaque divergence tranchée
// contre l'ASM est tracée dans reconcile_notes.md.
//
// Métadonnées :
//   Instr (live) : 242 (asm.asm) ; taille IDA 782 octets
//   Palier       : n/a (absent de meta.json)
//   Type IDA     : None (sub_69EB70, TYPE None)
//   Appelant     : sub_69EAF0 (setup magie 213), xref data @ 0x69eb3b
//   Sauvegardes de registres : ebx, ebp, esi, edi ; prologue sub esp,0Ch
//     (frame 0x1C) ; ebp = copie de arg_0 (@69eb75).
//   Corrections `add esp` (cdecl, args poussés droite→gauche) :
//     0x69EC9E add esp,40h  (4 × BS_Memset, UN SEUL add pour les 4)
//     0x69ECB2 add esp,8    (BdLinkTask_Register)
//     0x69ECD3 add esp,0Ch  (FillDwords)
//     0x69EDEB add esp,4    (sub_69EE80)
//     0x69EE27 add esp,10h  (4 × BdLinkTask_Pump, un seul add pour les 4)
//   Comparaisons : AUCUNE unsigned (ja/jb) dans la fonction ; tout en signé
//     (jle/jge/jl) + idiv signé + imul signé.
//   Retour famille MAG stepper BdLinkTask : EAX = 0 (continuer) ou
//     2 (détachement ; AL = 2, consommé par l'appelant via test al,2).
// ============================================================================

#include <stdint.h>

// ---- Prototypes : uniquement les callees vus dans asm.asm / callees.txt ----
// Forme (dst=list, src=buf, size, count) relevée sur les pushes réels ;
// sémantique fill-vs-copie du callee non prouvable ici (voir UNCERTAIN).
int  __cdecl BS_Memset(void *list, void *buf, unsigned int size, unsigned int count);
void __cdecl FillDwords(void *dst, int val, unsigned int count);   /* E3a: rep stosd */
void *__cdecl BdLinkTask_Register(void *list, void *callback);     /* handle noeud, 0 = échec */
int  __cdecl BdLinkTask_Pump(void *list);
unsigned short __cdecl sub_69EE80(void *arg);   /* retour porté par AX seul (69edee mov [esi+2Ch], ax) */
void sub_69EF60(void);                          /* callback : adresse seule prise, jamais appelée ici */

// ---- Externes IDA (globals.txt) -------------------------------------------
extern unsigned int dword_2510178;   // base ; offsets appliqués : 0x1D4, 0x4D4, 0x614, 0x1614, 0x1B18, 0x26B8, 0x126B8
extern unsigned int dword_251017C;   // [+4] = ptr objet source ; [src+0x10] = BYTE count ; [src+8] = table d'octets, stride 0x18
extern unsigned int dword_2510194;   // écrit à CHAQUE appel (sélecteur base+0x26B8 / base+0x126B8), jamais lu ici
extern unsigned int dword_2510198;   // tête de liste BdLinkTask D
extern unsigned int dword_25101A8;   // tête de liste BdLinkTask C
extern unsigned int dword_25101B8;   // tête de liste BdLinkTask B
extern unsigned int dword_25101C8;   // tête de liste BdLinkTask A (principale, callback sub_69EF60)
extern short word_117ADE4;           // graine min/max = word @0x117ADE4 (entrée 0 de la table chant)
extern unsigned char unk_117ADE0[];  // table chant : 0x134 entrées de 8 octets ; mots balayés @0x117ADEC, stride 8

// Table d'éléments à 0x1D972C0 : stride 0x9C = 156 par élément
// (lea ebx,[ecx+ecx*4]; shl ebx,3; sub ebx,ecx  →  b*39, puis ×4 → b*156).
#define ELEM_BASE   0x1D972C0u
#define ELEM_STRIDE 156u

// ---------------------------------------------------------------------------
// Champs struct task (arg_0) — tirés de l'ASM :
//   +0x0C  WORD  compteur de phase (corps exécuté seulement s'il vaut 1 ;
//                incrémenté puis clampé à 0x0A en queue, 69ee60..69ee6e)
//   +0x0F  BYTE  flag "démarré" (one-shot d'init, 69ebc9)
//   +0x10  DWORD latch d'arena {0,1} (bascule à CHAQUE appel, avant tout gate)
//
// Champs struct node (retour de BdLinkTask_Register) :
//   +0x0C..+0x503  zone de 0x13E dwords remise à zéro par FillDwords
//   +0x0E  WORD         count (movzx du byte @src+0x10, 69ecd9/e0)
//   +0x10  DWORD[count] pointeurs ELEM_BASE + 156*srcTable[i*0x18]
//   +0x1C  BYTE[count]  ordre parallèle (byte[i] = i)
//   +0x22  WORD         1 si count > 1, sinon 0 (CONSTANTE 1, pas count !)
//   +0x26  WORD         (count << 12) / 40 (division magique signée)
//   +0x2C  WORD         sub_69EE80(node+0x10[0]) — AX seul
//   NB : le tableau de bytes @+0x1C recouvre physiquement les dwords @+0x10
//   dès l'index 3 (byte[3] @ 0x1F ∈ dword[3] @ 0x1C..0x1F). Voir UNCERTAIN.
// ---------------------------------------------------------------------------

int __cdecl sub_69EB70(void *task_arg)
{
    unsigned char *task = (unsigned char *)task_arg;   // ebp = arg_0 (69eb75)

    // --- [1] latch d'arena : exécuté À CHAQUE appel, avant tout gate --------
    // @69eb7b : mov eax,[ebp+10h] ; test ; jz short 69EB9A
    if (*(unsigned int *)(task + 0x10) != 0)
    {
        // @69eb82..69eb91 : dword_2510194 = dword_2510178 + 0x26B8 ; latch = 0
        dword_2510194 = dword_2510178 + 0x26B8;
        *(unsigned int *)(task + 0x10) = 0;
    }
    else
    {
        // @69eb9a..69ebac : dword_2510194 = dword_2510178 + 0x126B8 ; latch = 1
        dword_2510194 = dword_2510178 + 0x126B8;
        *(unsigned int *)(task + 0x10) = 1;
    }

    // --- [2] corps gate : compteur WORD == 1 exactement ----------------------
    // @69ebb3 : cmp word ptr [ebp+0Ch], 1 ; jnz loc_69EDF2 (comparaison
    // 16 bits, signée par encodage mais valeur toujours ≥ 0 ici)
    if (*(unsigned short *)(task + 0x0C) == 1)
    {
        // --- [2a] one-shot d'init : gate byte task+0x0F ----------------------
        // @69ebbe : mov al,[ebp+0Fh] ; test ; jnz loc_69ECA1 (SAUTE AU REGISTER)
        if (*(unsigned char *)(task + 0x0F) == 0)
        {
            // @69ebc9 : flag = 1 (one-shot armé)
            *(unsigned char *)(task + 0x0F) = 1;

            // --- [2a-1] min/max SIGNÉS sur les mots de la table chant --------
            // @69ebcd : edx = 0x117ADEC ; edi = ecx = movsx word_117ADE4 (graine)
            // @69ebd9 : esi = 0x133 (307 itérations, entrées 1..307, stride 8)
            //   boucle @69ebe0 : v = movsx word [edx] ;
            //   @69ebe3 cmp ecx,eax ; jle → sinon min = v (ecx)
            //   @69ebeb cmp edi,eax ; jge → sinon max = v (edi)
            //   @69ebf1 add edx,8 ; dec esi ; jnz
            int mn = word_117ADE4;                          // ecx (min)
            int mx = mn;                                    // edi (max)
            {
                unsigned int ea = 0x117ADECu;               // edx
                int k;
                for (k = 0x133; k != 0; k--, ea += 8)
                {
                    int v = *(short *)ea;                   // movsx word
                    if (mn > v) mn = v;                     // 69ebe3/7
                    if (mx < v) mx = v;                     // 69ebeb/ef
                }
            }

            // --- [2a-2] copie de la table chant vers base+0x1B18 --------------
            // src : 0x117ADE0, 0x134 (308) entrées de 8 octets, stride 8
            // dst : dword_2510178 + 0x1B18 (lea ecx,[edx+1B18h] @69ec09)
            // par entrée (@69ec0f..69ec2a) :
            //   [dst+0] = src dword 0 ; [dst+4] = src dword 4 (copie 2 dwords)
            //   eax = movsx word [dst+4] ; shl eax,0Ch ; cdq ; idiv edi(range)
            //   [dst+6] = ax (réécrit le mot HAUT du second dword)
            // @69ebfd : edi = max - min (range, SIGNED sub)
            // UNCERTAIN 0x69EC24 : range == 0 → idiv lève #DE ; aucun garde ASM.
            {
                int          range = mx - mn;               // 69ebfd sub edi,ecx
                unsigned int src   = 0x117ADE0u;
                unsigned int dst   = dword_2510178 + 0x1B18u;
                int          k     = 0x134;
                do
                {
                    *(unsigned int *)(dst + 0) = *(unsigned int *)(src + 0); // 69ec0f/14
                    *(unsigned int *)(dst + 4) = *(unsigned int *)(src + 4); // 69ec16/19
                    {
                        int w = *(short *)(dst + 4);        // 69ec1c movsx word [ecx+4]
                        w = (int)((unsigned int)w << 0x0C); // 69ec20 shl eax,0Ch (logique, opérande sign-extendé)
                        *(short *)(dst + 6) = (short)(w / range); // 69ec23/24 cdq ; idiv edi
                    }
                    src += 8;
                    dst += 8;                               // 69ec26 add ecx,8
                } while (--k != 0);                         // 69ec29 dec ebx ; jnz
            }

            // --- [2a-3] init des 4 listes de tâches via BS_Memset -------------
            // ORDRE EXACT (@69ec30..69ec99, un seul add esp,40h @69ec9e).
            // Forme (list, buf, size, count) — pushes droite→gauche :
            //   push val ; push size ; push buf ; push list.
            // A : @69ec35..69ec47  list=dword_25101C8, buf=base+0x1614, 0x504, 1
            // B : @69ec4c..69ec65  list=dword_25101B8, buf=base+0x0614, 0x20, 0x80
            // C : @69ec6a..69ec80  list=dword_25101A8, buf=base+0x04D4, 0x14, 0x10
            // D : @69ec85..69ec99  list=dword_2510198, buf=base+0x01D4, 0x30, 0x10
            BS_Memset((void *)&dword_25101C8, (void *)(dword_2510178 + 0x1614u), 0x504u, 1u);
            BS_Memset((void *)&dword_25101B8, (void *)(dword_2510178 + 0x0614u), 0x020u, 0x80u);
            BS_Memset((void *)&dword_25101A8, (void *)(dword_2510178 + 0x04D4u), 0x014u, 0x10u);
            BS_Memset((void *)&dword_2510198, (void *)(dword_2510178 + 0x01D4u), 0x030u, 0x10u);
        }

        // --- [2b] enregistrement : exécuté à CHAQUE tick phase==1 ------------
        // @69ebc3 jnz loc_69ECA1 (one-shot flag ≠ 0) ET chute de [2a] @69ec9e
        // convergent ICI : BdLinkTask_Register N'EST PAS gate par le flag
        // one-shot — il est rappelé à chaque tick où la phase vaut 1.
        // (En pratique une seule fois : la phase ne revient jamais à 1 —
        //  elle incrémente et sature à 0x0A. Mais structurellement : chaque
        //  tick==1, cf. reconcile_notes.md point 2.)
        // @69eca1 : push offset sub_69EF60 ; push offset dword_25101C8
        // @69ecab : call BdLinkTask_Register ; add esp,8
        // @69ecb5 : test esi,esi ; jz loc_69EDF2 (échec → saute à la queue)
        {
            unsigned char *node = (unsigned char *)
                BdLinkTask_Register((void *)&dword_25101C8, (void *)&sub_69EF60);

            if (node != 0)
            {
                // --- [2b-1] zéro de la zone node --------------------------------
                // @69ecbd..69ecc8 : lea ecx,[esi+0Ch] ; push 13Eh ; push 0 ; push ecx
                // → FillDwords(node+0x0C, 0, 0x13E) : node+0x0C..node+0x503
                FillDwords((void *)(node + 0x0C), 0, 0x13Eu);

                // --- [2b-2] count ------------------------------------------------
                // @69ecd6 : edx = dword_251017C ; eax = [edx+4] (objet source)
                // @69ecd9 : movzx cx, byte ptr [eax+10h]   ← ZÉRO-EXTEND
                // @69ece0 : mov [esi+0Eh], cx              ← WORD @node+0x0E
                unsigned int srcObj = *(unsigned int *)(dword_251017C + 4);
                unsigned int count  = *(unsigned char *)(srcObj + 0x10);   // movzx byte
                *(unsigned short *)(node + 0x0E) = (unsigned short)count;

                // --- [2b-3] remplissage des deux tableaux parallèles -------------
                // GARDE : @69ece4 test cx,cx ; jle loc_69ED27 → SIGNÉ 16 bits
                // (source = movzx d'un byte ⇒ 0..255 ; sémantiquement "si count != 0",
                //  mais l'encodage est signé : jle, PAS ja/jbe).
                if ((int16_t)*(unsigned short *)(node + 0x0E) > 0)
                {
                    // @69ece9 : edi=0 ; edx = node+0x10 (curseur dwords, +4/it)
                    // boucle @69ecee..69ed25, ordre live respecté :
                    //   1) [node+0x1C+i] = al = i        (BYTE, 69ecee)
                    //   2) b = [srcObj+8 + edi-0x18]     (69ed06/07, byte, stride 0x18)
                    //   3) addr = 0x1D972C0 + b*156      (69ed0c..69ed15 : b*39 puis ×4)
                    //   4) [edx] = addr ; edx += 4       (69ed1c/24, store APRÈS edx+=4)
                    //   @69ed1f : movsx ecx, word [esi+0Eh] ; cmp eax,ecx ; jl → SIGNÉ
                    unsigned int arr   = *(unsigned int *)(srcObj + 8);
                    unsigned int cursor;   // edi : 0x18/itération
                    int          i;
                    for (i = 0, cursor = 0; i < (int)count; i++, cursor += 0x18)
                    {
                        unsigned char b = *(unsigned char *)(arr + cursor);
                        *(unsigned char *)(node + 0x1C + i) = (unsigned char)i;
                        *(unsigned int  *)(node + 0x10 + 4 * i) =
                            ELEM_BASE + ELEM_STRIDE * b;
                    }
                }

                // --- [2b-4] TRI PAR SÉLECTION descendant --------------------------
                // CLÉ : word SIGNÉ @(ptr + 0x1C) de chaque pointeur (69ed5c/60 :
                // cmp bx,[eax+1Ch] ; jge → pas de swap ; SIGNÉ 16 bits).
                // GARDE : @69ed27 eax = movsx word [esi+0Eh] ; @69ed2b edx = eax-1 ;
                //         @69ed2e test edx,edx ; jle loc_69EDAF → skip si count-1 <= 0.
                //         (test+jle = SIGNÉ ; le bloc [2b-5] à 69EDAF est HORS du garde.)
                // STRUCTURE (déroulé de l'ASM 69ed32..69eda9) :
                //   pour base = 0 .. count-2 :
                //     pour j = base+1 .. count-1 :
                //       si key[base] < key[j] : swap dwords[base]↔dwords[j]
                //                               ET bytes[base]↔bytes[j]
                // PREUVE "sélection, pas bulles" : dans la boucle interne, ebx est
                // rechargé depuis var_C à CHAQUE itération (@69ed64 mov ebx,var_C)
                // → edx=[ebx] (l'élément de base) est FIXE ; seul ebp avance
                // (@69ed82 add ebp,4). On compare donc l'élément FIXE de base
                // contre chaque j>base — motif sélection, pas adjacences-bulles.
                // L'élément max (clé signée la plus grande) est amené en position
                // base à chaque passe → ordre DÉCROISSANT.
                // Ordre live des stores du swap (@69ed6a..79) :
                //   [ebx]=eax(j) ; [ebp]=edx(base) ; dl=bytes[j] ; al=[edi=bytes+base]
                //   ; [edi]=dl ; [node+0x1C+j]=al — swap parallèle bytes↔dwords.
                // NB : le count est RELU (movsx word [esi+0Eh]) à chaque test
                // interne (69ed7d/69ed8d) ; aucun effet de bord ne le modifie ici.
                {
                    int cnt = (int)(int16_t)*(unsigned short *)(node + 0x0E);
                    if (cnt - 1 > 0)
                    {
                        int base, j;
                        for (base = 0; base < cnt - 1; base++)
                        {
                            for (j = base + 1; j < cnt; j++)
                            {
                                unsigned int pa = *(unsigned int *)(node + 0x10 + 4 * base);
                                unsigned int pb = *(unsigned int *)(node + 0x10 + 4 * j);
                                if (*(short *)(pa + 0x1C) < *(short *)(pb + 0x1C))
                                {
                                    *(unsigned int *)(node + 0x10 + 4 * base) = pb;
                                    *(unsigned int *)(node + 0x10 + 4 * j)    = pa;
                                    {
                                        unsigned char tb = *(unsigned char *)(node + 0x1C + base);
                                        *(unsigned char *)(node + 0x1C + base) =
                                            *(unsigned char *)(node + 0x1C + j);
                                        *(unsigned char *)(node + 0x1C + j)    = tb;
                                    }
                                }
                            }
                        }
                    }
                }

                // --- [2b-5] node+0x22 : HORS du garde cnt>1 (69ed30 jle cible
                //     69EDAF = CE bloc). CONSTANTE 1, PAS count ! ----------------
                // @69edaf : mov eax,1 ; cmp [esi+0Eh],ax ; jle 69EDC0
                // @69edba : mov [esi+22h], ax  ← ax = 1 (chargé AVANT le cmp)
                // @69edc0 : mov word [esi+22h], 0
                {
                    int c2 = (int)(int16_t)*(unsigned short *)(node + 0x0E);
                    if (c2 > 1)
                        *(unsigned short *)(node + 0x22) = 1;   // CONSTANTE 1 (69edba)
                    else
                        *(unsigned short *)(node + 0x22) = 0;   // 69edc0
                }

                // --- [2b-6] ratio : (count << 12) / 40, division magique SIGNÉE ---
                // Séquence EXACTE (69edc6..69ede2) :
                //   movsx ecx, word [esi+0Eh]      ; count sign-extendé 16→32
                //   shl  ecx, 0Ch                  ; ×4096 (SHL logique)
                //   mov  eax, 66666667h ; imul ecx ; EDX:EAX = sign(count<<12)×magic
                //   mov  ecx, [esi+10h]            ; (charge l'arg du call suivant)
                //   sar  edx, 4                    ; >>36 net (>>32 puis >>4)
                //   mov  eax, edx ; push ecx
                //   shr  eax, 1Fh ; add edx, eax   ; fix signé : +1 si négatif
                //   mov  [esi+26h], dx             ; WORD @node+0x26
                // ⇒ équivalent EXACT à idiv 40 signé round-to-zero
                //   (0x66666667 = ceil(2^36 / 40) ; sar 4 = shift total 36).
                {
                    int32_t t = (int32_t)*(int16_t *)(node + 0x0E) * 0x1000;  // movsx+shl
                    int64_t m = (int64_t)t * (int64_t)(int32_t)0x66666667;    // imul signé
                    int32_t q = (int32_t)(m >> 36) + ((m >> 36) < 0 ? 1 : 0); // sar 4 + fix shr31/add
                    *(unsigned short *)(node + 0x26) = (unsigned short)q;
                }

                // --- [2b-7] call sub_69EE80 → WORD @node+0x2C ----------------------
                // @69edd4 : mov ecx, [esi+10h] — DWORD ENTIER (premier pointeur du
                //   tableau), poussé tel quel : ni movzx ni movsx.
                // @69eddc/ee : push ecx ; call sub_69EE80 ; add esp,4 ;
                //   mov [esi+2Ch], ax — SEUL AX (16 bits) est stocké à +0x2C,
                //   sans extension. Largeur finale = WORD.
                // (Le push est effectué AVANT le store de node+0x26 dans l'ASM mais
                //  sans aliasing : arg passé par valeur.)
                *(unsigned short *)(node + 0x2C) =
                    sub_69EE80((void *)(unsigned int)*(unsigned int *)(node + 0x10));
            }
        }
    }

    // --- [3] pompage des 4 listes si "démarré" -------------------------------
    // @69edf2 : mov al,[ebp+0Fh] ; test ; jz loc_69EE2C
    int r1, r2, r3, r4;
    if (*(unsigned char *)(task + 0x0F) != 0)
    {
        // ORDRE EXACT : A(0x25101C8) → B(0x25101B8) → C(0x25101A8) → D(0x2510198)
        // esi ← r1 (69ee03), edi ← r2 (69ee0f), ebx ← r3 (69ee1b), eax ← r4 (69ee22)
        // un seul add esp,10h @69ee27 pour les 4.
        r1 = BdLinkTask_Pump((void *)&dword_25101C8);
        r2 = BdLinkTask_Pump((void *)&dword_25101B8);
        r3 = BdLinkTask_Pump((void *)&dword_25101A8);
        r4 = BdLinkTask_Pump((void *)&dword_2510198);
    }
    else
    {
        // @69ee2c..69ee38 : esi/edi/ebx/eax = arg_0 (non nuls ⇒ jamais detach)
        r1 = r2 = r3 = r4 = (int)(intptr_t)task_arg;
    }

    // --- [4] détachement : flag RELU APRÈS les appels, 4 retours à 0 ---------
    // @69ee3c : mov cl,[ebp+0Fh] — le flag est RE-LU EN MÉMOIRE après les 4
    // Pump (effets de bord des Pump visibles). Polarité EXACTE :
    //   si flag != 0 ET r1==0 ET r2==0 ET r3==0 ET r4==0 → eax = 2 (detach).
    //   @69ee53..69ee5f : mov eax,2 ; pop ; retn.
    if (*(unsigned char *)(task + 0x0F) != 0 &&
        r1 == 0 && r2 == 0 && r3 == 0 && r4 == 0)
    {
        return 2;
    }

    // --- [5] phase++ et saturation à 0x0A ------------------------------------
    // @69ee60 : inc word [ebp+0Ch] ; mov ax,[ebp+0Ch] ; cmp ax,0Ah ;
    //           jl short 69EE74 (SIGNÉ 16 bits) ; sinon mov word [ebp+0Ch],0Ah
    {
        unsigned short c = (unsigned short)(*(unsigned short *)(task + 0x0C) + 1);
        if ((short)c >= 0x0A)       // cmp ax,0Ah ; jnb-equivalent via jl signé
            c = 0x0A;
        *(unsigned short *)(task + 0x0C) = c;
    }

    // @69ee77 : xor eax,eax ; retn → AL = 0 ("continuer")
    return 0;
}

// ============================================================================
// BLOCS RÉPÉTITIFS — résumés explicitement (rien tu) :
//   4 × BS_Memset   : args réels listés en [2a-3] (ordres A/B/C/D, tailles
//                     0x504/1, 0x20/0x80, 0x14/0x10, 0x30/0x10, un add esp,40h)
//   4 × BdLinkTask_Pump : têtes 0x25101C8/0x25101B8/0x25101A8/0x2510198 dans
//                     cet ordre, un add esp,10h, retours esi/edi/ebx/eax
//   boucle min/max  : 307 itérations, stride 8, graine word_117ADE4
//   boucle copie    : 308 itérations, stride 8, dst base+0x1B18, ratio idiv
//   boucle remplissage : count itérations, stride src 0x18, dst dwords +4,
//                     bytes +1, éléments base 0x1D972C0 stride 156
//   tri             : sélection descendant, 2 boucles imbriquées déroulées
// ============================================================================
```

## Analyse semantique

# Sémantique sub_69EB70 @ 0x69EB70 (réconciliation R)

- **Rôle (1 phrase)** : stepper BdLinkTask maître de l'effet magie 213 (enregistré comme donnée par le setup sub_69EAF0 via xref 0x69eb3b) qui bascule un double buffer de travail à chaque tick, effectue une installation unique au tick de phase==1 (LUT normalisée en arène + 4 pools BdLink + enregistrement du stepper d'effet sub_69EF60 + construction/tri de la liste d'instances), puis pompe les 4 listes et se détache (retour AL=2) quand tout est drainé.
- **Verdict** : LIKELY consolidé.
- **Confiance** : LIKELY — callers (sub_69EAF0 seul xref data 0x69eb3b) + callees (BS_Memset ×4, BdLinkTask_Register @69ecab, FillDwords @69ecc8, sub_69EE80 @69ede6, BdLinkTask_Pump ×4 @69edfe..69ee22, tous dans callees.txt) + opcodes cités alignés ; wiki.md vide (échec QMD) empêche le barème CERTAIN.
- **Nom catalogue** : aucun (sub_69EB70). Proposition (markdown seul) : **`Magic213_BdLinkMaster_Step`** — retenu, mécanisme-ancré. A `MAG213_Stepper_SpawnAndPumpEffects` est rejeté : le "spawn" a lieu une seule fois (et sub_69EF60 est *enregistré* par BdLinkTask_Register, pas spawné chaque tick), et le code fait plus que "pumper" (init complète de la scène). ≥2 preuves ASM indépendantes : (1) `jnz loc_69ECA1` @69ebc3 : les deux chemins (flag posé / bloc one-shot) convergent vers le bloc Register → c'est le point d'orchestration du node 0x504 (@69ecc8 FillDwords(esi+0xC,0,0x13E), 0xC+0x13E×4=0x504 = taille du pool base+0x1614) ; (2) série `test esi/edi/ebx/eax,eax; jz` @69ee43–69ee51 + `mov eax,2` @69ee56 : détachement de la boucle pump conventionnelle famille MAG (bit 2). Filiation 213 : xref data 0x69eb3b dans sub_69EAF0 (callers.txt, unique).

## In / Out / Effets

**In** : arg_0 = pointeur node BdLinkTask (ebp) :
- `[ebp+0Ch]` word : compteur de ticks/phase (lu @69ebb3, inc @69ee60, plafond 0xA @69ee68 `cmp ax,0Ah` / `jl` signé / clamp @69ee6e) ; gate installation = phase==1 exact.
- `[ebp+0Fh]` byte : flag one-shot (test @69ebc1, posé @69ebc9, relu en mémoire après les pumps @69ee3c `mov cl,[ebp+0Fh]`).
- `[ebp+10h]` dword : état toggle double buffer (test @69eb7b, inversé @69eb91/69ebac).

**Out / effets** :
- `dword_2510194` réécrit à CHAQUE tick = `dword_2510178 + (toggle ? 0x26B8 : 0x126B8)` (@69eb82–69ebac) — double buffer 2510194, écart 0x10000.
- Zone maître 308×8 : copie de `unk_117ADE0` vers arène+0x1B18 avec word normalisé à +6 = `(word_source << 12) / (max−min)` signé (`shl eax,0Ch` @69ec20, `idiv edi` @69ec24, edi = max−min calculé sur 0x133 words stride 8 depuis word_117ADE4/unk_117ADEC @69ebd2–69ebf5).
- 4 pools BdLink (BS_Memset ×4 @69ec42–69ec99, un `add esp,40h` @69ec9e, args cdecl droite→gauche) :
  | # | list | buf | size | count |
  |---|------|-----|------|-------|
  | A | dword_25101C8 | +0x1614 | 0x504 | 1 |
  | B | dword_25101B8 | +0x614 | 0x20 | 0x80 |
  | C | dword_25101A8 | +0x4D4 | 0x14 | 0x10 |
  | D | dword_2510198 | +0x1D4 | 0x30 | 0x10 |
- Node enfant 0x504 (BdLinkTask_Register(&dword_25101C8, sub_69EF60) @69eca1–69ecab, échec → jump au pump @69ecb7) : FillDwords(node+0xC,0,0x13E) @69ecc8 ; word node+0xE = count (`movzx cx,byte[[dword_251017C]+4+0x10]` @69ecd9) ; node+0x10+4i = pointeurs `0x1D972C0 + idx*0x9C` (`lea ebx,[ecx+ecx*4]; shl ebx,3; sub ebx,ecx` = ×39, puis `lea ecx,ds:1D972C0h[ebx*4]` @69ed0c–69ed15 ; idx octets stride 0x18 dans `[[dword_251017C]+8]`) ; bytes node+0x1C+i init 0 ; tri SÉLECTION descendant signé sur word `[ptr+0x1Ch]` (@69ed5c–69ed79) ; node+0x26 = (count<<12)/40 via `imul 0x66666667` / `sar edx,4` / fixup signé @69edc6–69ede2 ; node+0x2C (word) = retour AX de sub_69EE80(dword premier pointeur, @69edd4/69eddc/69edee).
- **Retour AL** : `mov eax,2` @69ee56 si flag `[ebp+0Fh]≠0` (relu @69ee3c) ET les 4 retours Pump tous 0 (`test esi/edi/ebx/eax,eax; jz` @69ee43–69ee51) ; sinon `xor eax,eax` @69ee77, ret 0. Valeur >2 bits jamais produite.

**Phases** : chaque tick → toggle buffer ; phase==1 → bloc installation (gate @69ebb3, atteint aussi via `jnz loc_69ECA1` @69ebc3 pour le Register) ; phase≥2 → pump seul ; détachement si 4 pumps nuls et flag levé. La phase incrémente et sature à 0xA sans jamais revenir à 1 : le call Register n'est en pratique exécuté qu'une fois, mais son gate ASM est phase==1, pas le flag one-shot.

## Divergences A/B tranchées (chaque avec EA + opcode)

1. **Nom** : A `MAG213_Stepper_SpawnAndPumpEffects` / B `Magic213_BdLinkMaster_Step` → **B retenu** ; preuves : @69ebc3 `jnz loc_69ECA1` (convergence vers orchestration Register) + @69ee56 `mov eax,2` (détachement stepper). "Spawn" A est faux : le Register est enregistré une fois, gate phase==1.
2. **Type de tri** : A « tri à bulles ascendant » / B « (sélection implicitement descendant) » → **tri par SÉLECTION descendant, base fixe** : @69ed64 `mov ebx,[esp+1Ch+var_C]` recharge l'élément de base à CHAQUE itération interne, `var_C` n'évolue qu'entre passes ; swap si `key[j] > key[base]` (`cmp bx,[eax+1Ch]`, `jge` = pas de swap, signé 16 bits) → plus grande clé en tête. La formulation A (bulles, ascendant) est doublement fausse.
3. **node+0x22** : A « word = count si count>1 sinon 0 » / B « constante 1 » → **CONSTANTE 1** : @69edaf `mov eax,1` charge la constante AVANT `cmp [esi+0Eh],ax` @69edb4 ; @69edba `mov [esi+22h],ax` stocke donc 1 (booléen count>1), pas count.
4. **Gate du BdLinkTask_Register** : A « installation une seule fois via flag one-shot » / B « exécuté à chaque tick==1 » → **B** : @69ebc3 `jnz loc_69ECA1` envoie le chemin flag≠0 direct au bloc Register ; le gate est phase==1 (conséquence pratique : un seul call, la phase ne revient jamais à 1).
5. **node+0x26** : A « (count<<12)/10 via 0x66666667 » / B « (count<<12)/10 via magie » (imul detail seulement) → **diviseur = 40, pas 10** : @69edcd `mov eax,66666667h` = ceil(2^36/40) avec `shl ecx,0Ch` + `sar edx,4` (shift total 36) @69edc6–69ede2. La valeur B/A « /10 » est fausse : c'est (count×4096)/40, stocké WORD sans extension.
6. **Polarité de la garde count** (précision commune, encodage) : @69ece4 `test cx,cx` ; @69ece7 `jle short` → **jle signé 16 bits** (pas ja) ; sémantiquement skip si count==0 (source movzx byte).
7. **sub_69EE80 → +0x2C** (concordance A/B, précision tranchée par l'ASM) : dword poussé (@69edd4 `mov ecx,[esi+10h]`, `push ecx`), **seul AX stocké** en WORD @69edee (`mov [esi+2Ch],ax`), sans extension — signedness non prouvable (sub_69EE80 hors pack).

## Preuves (3–8, ASM cité)

1. 0x69ebb3 `cmp word ptr [ebp+0Ch], 1` (gate), 0x69ee60 `inc word ptr [ebp+0Ch]` + 0x69ee68 `cmp ax,0Ah`/`jl` signé : compteur de phases plafonné 0xA, installation au tick==1 exact.
2. 0x69eb82–69ebac : `dword_2510194 = dword_2510178 + 0x26B8 | +0x126B8` selon `[ebp+10h]`, bit inversé chaque tick — double buffer 2510194, delta 0x10000.
3. 0x69ebd2–69ec24 : min/max signés (movsx) sur 0x133 words stride 8, puis 0x69ec20 `shl eax,0Ch` + 0x69ec24 `idiv edi` : LUT 308×8 copiée vers arène+0x1B18, word normalisé (12 bits / range) écrit à +6.
4. 0x69ec42–69ec99 : 4× BS_Memset (pushs droite→gauche, un `add esp,40h`) : 25101C8/+0x1614(0x504,1), 25101B8/+0x614(0x20,0x80), 25101A8/+0x4D4(0x14,0x10), 2510198/+0x1D4(0x30,0x10).
5. 0x69ed0c–69ed15 : `lea ebx,[ecx+ecx*4]; shl ebx,3; sub ebx,ecx; lea ecx,ds:1D972C0h[ebx*4]` → stride 0x9C exact (39×4=156) sur la table d'effets 0x1D972C0.
6. 0x69edaf–69edba : `mov eax,1` avant `cmp [esi+0Eh],ax` ; `mov [esi+22h],ax` → node+0x22 = constante 1 (booléen count>1).
7. 0x69edcd + 0x69ed32 : `mov eax,66666667h` / `sar edx,4` → division signée (count×4096)/40 round-to-zero ; stocké WORD @node+0x26.
8. 0x69ee43–69ee56 / 0x69ee77 : série `test esi/edi/ebx/eax,eax; jz` + `mov eax,2` vs `xor eax,eax` ; 0x69ee3c relu du flag en mémoire après les 4 `BdLinkTask_Pump` (0x69edfe–69ee22) — retour AL 0/2, détachement conditionné.

## Checks §5.6

- Callees cités ∈ callees.txt : BS_Memset ×4 (69ec47/65/80/99), BdLinkTask_Register @69ecab, FillDwords @69ecc8, sub_69EE80 @69ede6, BdLinkTask_Pump ×4 (69edfe/e0a/e16/e22). ✔ — `sub_69EF60` absent à raison (push offset @69eca1, pas un call).
- Caller ∈ callers.txt : sub_69EAF0, xref data 0x69eb3b, unique. ✔
- Strides en nombres : 8 (tables maître, @69ebf1/ec11/ec26), 0x18 (scan indices, @69ed00), 0x9C = 39×4 (effets, @69ed0c–69ed15, EA cité), 4 (pointeurs node). ✔
- Polarités : comparaisons signées partout pour clés/compteurs (movsx/jle/jl/idiv/imul signé/sar) ; aucun ja/jb ; le tri est descendant signé 16 bits. ✔
- Largeur retour : AL (0 ou 2), jamais >8 bits, consommé `test al,2` par BdLinkTask_Pump côté famille. ✔
- Nom ≥2 preuves ASM indépendantes adresées : @69ebc3 (orchestration/Register) + @69ee56 (détachement 2) + xref 0x69eb3b (filiation 213). ✔
- Callees/callers cités existent ; c_reconciled.c/reconcile_notes.md réutilisés (sélection descendant, node+0x22=1, /40, imprimés supra). ✔

## Questions ouvertes (non bloquantes)

- Sémantique exacte de BS_Memset (fill vs copie, 4 args) et comportement de BdLinkTask_Register si rappelé — corps des callees hors pack.
- Retour signé de sub_69EE80 (stocké brut en WORD @node+0x2C) ; rôle final du word @node+0x26 = (count×4096)/40.
- Layout du node si count > 3 (bytes flags +0x1C+i recouvrent les dwords pointeurs +0x10 dès i≈3) : contrainte de données ou entrelacement volontaire — non tranchable empiriquement depuis ce pack.
- `idiv edi` @69ec24 sans garde : #DE si max==min dans la table maître (constante, probablement impossible).
- Destination du double buffer (+0x26B8/+0x126B8) : consommateur présumé sub_69EF60 — hors pack, wiki.md vide (aucune convergence documentaire possible).

## IDBCOMMENT

Stepper BdLinkTask maitre de la magie 213, enregistre comme donnee par le setup 69EAF0 (xref 069EB3B). A chaque tick il bascule dword_2510194 entre base+26B8 et base+126B8, puis au tick phase==1 seulement installe la scene : LUT normalisee 308x8 de unk_117ADE0 vers base+1B18 (shl 12 / range, idiv @69EC24), 4 pools BdLink (base+1614/614/4D4/1D4 sous 25101C8/1B8/1A8/198 @69EC42-69EC99) et le stepper enfant sub_69EF60 via BdLinkTask_Register. Le node de 504 octets recoit en +0E le compteur, en +10 des pointeurs vers la table d'effets 1D972C0 stride 9C tries par selection descendant (base fixe rechargee @69ED64, cle word +1C, signe 16 bits), et en +22 la constante 1 (@69EDAF), en +26 (count*4096)/40 via 0x66666667, en +2C le mot de retour de sub_69EE80. Pompe ensuite les 4 listes ; retourne AL=2 (detachement) si le flag +0F est leve et les 4 pumps rendent zero sinon AL=0 avec compteur de phases +0C plafonne a 0x0A. [semantic-triple 2026-09-20]

## Notes C-R

# reconcile_notes.md — sub_69EB70 (0x69EB70, 242 instr live, 782 octets)

Cellule C-R, pack `tools/_tmp_semantic_triple/0x69eb70/`.
Ground truth = `asm.asm` (live ASM). Hex-Rays (`hexrays.c`) = vérificateur SEULEMENT.

---

## Divergences A vs B tranchées contre l'ASM

### 1. Type de tri — c_a « bulles » vs c_b « sélection » → **SÉLECTION (c_b)**

Position A : boucle interne sur paires adjacentes `(j-1, j)`, curseur dword avançant à chaque itération.
Position B : boucle interne sur `(base fixe, j)`, élément de base fixe.
**Tranché : tri par SÉLECTION descendant.** Preuve ASM : dans la boucle interne @69ed57, `edx=[ebx]` charge l'élément de base, mais `ebx` est **rechargé depuis `var_C` à chaque itération** (@69ed64 `mov ebx,[esp+1Ch+var_C]`) ; `var_C` n'est mis à jour qu'entre passes (@69eda5). Seul `ebp` (curseur j) avance dans la boucle interne (@69ed82 `add ebp,4`). On compare donc l'élément FIXE `base` contre chaque `j>base` et on swap si `key[base] < key[j]` (@69ed64 `cmp bx,[eax+1Ch]` ; `jge` = pas de swap, comparaison **signée 16 bits**). L'élément de plus grande clé est amené en position `base` à chaque passe → ordre **décroissant**. La structure de c_b (`base` fixe, `i` balaye) est la transcription exacte ; le motif for/for de c_a sur paires `(j-1, j)` est incorrect.

### 2. BdLinkTask_Register — une fois (c_a « dans le one-shot » ambigu) vs chaque tick==1 (c_b) → **CHAQUE tick phase==1 (c_b)**

Position A : présente le call comme enchaîné après le bloc one-shot sans préciser le gate.
Position B : affirme explicitement « exécuté à CHAQUE tick == 1, pas seulement au one-shot ».
**Tranché : le call N'EST PAS gate par le flag one-shot.** Preuve ASM : @69ebc3 `jnz loc_69ECA1` — quand le flag `[ebp+0Fh]` est ≠ 0, le saut va **directement** au bloc du Register (@69eca1), sans passer par l'init. Le bloc one-shot (@69ebc9..69ec9e) tombe aussi dans @69eca1. Le point de convergence des deux chemins est le call. (Nuance structurelle : comme la phase incrémente et sature à 0x0A sans jamais revenir à 1, le call n'est ré-exécuté en pratique qu'une fois — mais le gate ASM est la garde phase==1, pas le flag.)

### 3. Ordre et args des 4 BS_Memset — identiques A/B → **confirmé, ordre A→B→C→D**

Les deux voix concordent ; l'ASM confirme (@69ec30..69ec9e, un seul `add esp,40h` @69ec9e) :
| # | call | list | buf | size | count |
|---|------|------|-----|------|-------|
| A | 69ec47 | `dword_25101C8` | `base+0x1614` | 0x504 | 1 |
| B | 69ec65 | `dword_25101B8` | `base+0x0614` | 0x20 | 0x80 |
| C | 69ec80 | `dword_25101A8` | `base+0x04D4` | 0x14 | 0x10 |
| D | 69ec99 | `dword_2510198` | `base+0x01D4` | 0x30 | 0x10 |

Forme args `(dst=list, src=buf, size, count)`, pushes droite→gauche (`push val ; push size ; push buf ; push list`). Hex-Rays concorde.

### 4. sub_69EE80 → +0x2C — largeur → **DWORD poussé, WORD seul stocké (sans extension)**

Les deux voix concordent ; l'ASM confirme : @69edd4 `mov ecx,[esi+10h]` charge le **dword entier** (premier pointeur du tableau), poussé tel quel (@69eddc `push ecx`) — ni movzx ni movsx. Retour : @69edee `mov [esi+2Ch], ax` — **seul AX (16 bits) est stocké**, pas d'extension. Largeur finale à +0x2C = WORD brut. (Hex-Rays : `*(_WORD *)(v14 + 44) = sub_69EE80(v32)` — concordant.)

### 5. Division (count<<12)/40 — séquence exacte → **imul 0x66666667 + sar 4 + fix signé**

Les deux voix concordent ; séquence ASM exacte @69edc6..69ede2 :
```
movsx ecx, word [esi+0Eh]   ; count sign-extendé 16→32
shl   ecx, 0Ch              ; ×4096 (SHL logique)
mov   eax, 66666667h
imul  ecx                   ; EDX:EAX = sign×magic (imul SIGNÉ)
mov   ecx, [esi+10h]        ; (précharge l'arg du call suivant)
sar   edx, 4                ; shift net >>36
mov   eax, edx
push  ecx
shr   eax, 1Fh              ; bit de signe de edx
add   edx, eax              ; +1 si négatif (round-to-zero)
mov   [esi+26h], dx         ; WORD @node+0x26
```
Équivalent exact à `idiv 40` signé round-to-zero (0x66666667 = ceil(2^36/40), shift total 36). Le C réconcilié reproduit `imul`/`sar`/fixup ; c_a avait la bonne mécanique mais un commentaire confus (« sar edx,4 plus implémenté avant ») ; c_b l'escamote en `/40` direct — les deux valeurs coïncident.

### 6. Garde [2b-3] — cx,cx + jle → **SIGNÉ 16 bits (jle, pas ja)**

Les deux voix concordent sur le signé ; précision : @69ece4 `test cx,cx` ; @69ece7 `jle short loc_69ED27` → branche prise si `(int16)cx <= 0`. Source : `movzx cx, byte [eax+10h]` (@69ecd9) ⇒ cx ∈ 0..255, donc sémantiquement « skip si count == 0 ». Mais l'**encodage est signé** (`jle`, `test` posant SF selon le bit 15 — ici jamais posé). Le C réconcilié garde `(int16_t)... > 0` pour refléter l'encodage, avec note.

### 7. Polarité du retour — flag relu après appels → **OUI, relu en mémoire @69ee3c**

Les deux voix concordent ; l'ASM tranche la question posée : @69ee3c `mov cl,[ebp+0Fh]` — le flag est **rechargé depuis la mémoire APRÈS les 4 BdLinkTask_Pump** (un éventuel effet de bord d'un Pump sur `task+0x0F` serait visible). Polarité exacte :
- flag ≠ 0 **ET** `esi==0 && edi==0 && ebx==0 && eax==0` (les 4 retours de Pump, @69ee43..69ee51 `test ... jz` en série) → @69ee56 `mov eax,2` → **return 2** (detach ; AL=2).
- sinon → phase++ (@69ee60 `inc word [ebp+0Ch]`), saturation à 0x0A (@69ee68 `cmp ax,0Ah` ; `jl` signé 16 bits ; @69ee6e clamp), @69ee77 `xor eax,eax` → **return 0**.

### Divergence additionnelle trouvée (hors liste) : valeur stockée à node+0x22

Position A (c_a.c ligne 251) : `*(int16_t *)(k + 0x22) = c2;` — stocke **count** quand count > 1.
Position B (c_b.c ligne 209) : `*(unsigned short *)(node + 0x22) = 1;` — stocke la **constante 1**.
**Tranché : CONSTANTE 1 (c_b).** Preuve ASM : @69edaf `mov eax,1` — la constante est chargée **avant** le `cmp [esi+0Eh],ax` (@69edb4) ; @69edba `mov [esi+22h], ax` stocke donc **eax=1**, pas count. Le cmp sert uniquement au test `count > 1`. (Hex-Rays confirme : `*(_WORD *)(v14 + 34) = *(__int16 *)(v14 + 14) > 1;` — résultat booléen.)

---

## UNCERTAIN restants

- **UNCERTAIN 0x69EC24** : `idiv edi` avec `edi = max - min` — aucun garde ASM contre range == 0 (toutes entrées identiques dans `unk_117ADEC`/plage word_117ADE4) → #DE. Non prouvable depuis ce pack.
- **UNCERTAIN 0x69EC47** : sémantique exacte de `BS_Memset(list, buf, size, count)` — fill vs copie bloc ; le corps du callee n'est pas dans le pack.
- **UNCERTAIN 0x69ECEE / layout node** : le tableau de bytes @node+0x1C recouvre physiquement les dwords @node+0x10 dès l'index 3 (byte[3] @ 0x1F ∈ dword[3] @ 0x1C..0x1F). Count (byte, 0..255) est-il garanti ≤ 3, ou le recouvrement est-il intentionnel (les bytes écrasent le haut des dwords, et le tri lit des pointeurs corrompus) ? Non tranchable sans dump mémoire/live debug.
- **UNCERTAIN 0x69EDEE** : signedness du retour AX de `sub_69EE80` (stocké brut en WORD).
- **UNCERTAIN 0x69ECA1** : comportement de `BdLinkTask_Register` si rappelé sur une liste déjà enregistrée (ré-init du nœud vs empilement d'un nœud neuf) — callee absent du pack. (En pratique un seul call : la phase ne revient jamais à 1.)

## Divergences vs Hex-Rays (hexrays.c = vérificateur)

1. **Tri** : Hex-Rays restitue des curseurs marcheurs (`v21`/`v22`/`v33`/`var_4`) avec boucle `do/while` et condition externe `&v22[-28-v14] < v19-1`. Transcription exacte de la machinerie `var_8`/`var_C`/`var_4` de l'ASM, mais la structure `base`/`i` (sélection) du C réconcilié lui est sémantiquement équivalente et plus fidèle à l'intention. Pas de divergence de fond.
2. **node+0x22** : Hex-Rays écrit `> 1` (booléen) — concordant avec la constante 1 tranchée ci-dessus ; c'est c_a qui divergeait, pas Hex-Rays.
3. **sub_69EE80 arg** : Hex-Rays `v32 = *(_DWORD **)(v14 + 16)` puis `sub_69EE80(v32)` — concordant avec `mov ecx,[esi+10h]` ; pas de divergence.
4. **Division par 40** : Hex-Rays `(v << 12) / 40` — sémantique correcte, mécanisme `0x66666667` escamoté. Pas de divergence de valeur.
5. **BS_Memset** : Hex-Rays type le 2e arg en `_WORD *` et passe les mêmes valeurs (0x504/1, 0x20/128, 0x14/16, 0x30/16). Concordant.
6. **Garde [2b-3]** : Hex-Rays `if (v15)` (unsigned-ish) vs ASM `test cx,cx ; jle` signé. Équivalent ici (source = byte via movzx). Pas de divergence effective.
7. **`mov [esi+0Eh],cx`** : Hex-Rays `*(_WORD *)(v14 + 14) = v15;` — concordant (movzx byte → word).
