# 0x4653B0 — isUpdateVRAMOrSomething (étiquette catalogue non validée)

Destination parent uniquement : `0x4653B0__isUpdateVRAMOrSomething.md`. Candidat documentaire, sans installation, renommage ni promotion.

## C accepté : payload intégral gelé

```c
/* ===========================================================================
 * sub_4653B0 - C corrige (pack P5, fix P5_C_fix_1)
 * ---------------------------------------------------------------------------
 * Entree gelee (NON modifiee ici) : P5_pack/c_gen_a.c
 *   SHA256 c97a714da633b5a9f7c405bda3b727e8a88c4e43051e813098d35151f916c0c2
 * Spec appliquee : P5_C_review/patch_spec.md (F1..F7), verdict CORRIGE de
 * c_review.md. Sortie : ce fichier (c_corrected.c), en attente de re-revue
 * independante fraiche. STATUT : PAS ACCEPTE.
 * ---------------------------------------------------------------------------
 * Metadonnees
 *   Instr (live)  : 268 instructions / 880 octets
 *   Palier        : P5 (native-2026-10-10)
 *   Plage         : 0x004653B0 .. 0x0046571F (fin exclusive 0x00465720)
 *   SHA256 octets : bbe507d6369efcb4ebbd6814fef60b07e19fff5d9721579395cd705be9bca382
 *                   (= manifest input_manifest.json, verifie sur IDB live)
 *   Type IDA      : volontairement non lu (mode numerique strict)
 *   Sauvegardes   : callee-saved ebx (push 0x4653CB / pop 0x46569A),
 *                   esi+edi (push prologue 0x4653BE/.BF, pop 0x465716/.17),
 *                   ebp (push 0x4653B6, pop 0x465718) - MAIS ebp est REPURPOSE
 *                   des 0x4653B7 : mov ebp,[esp+118h] = arg0 (pointeur struct)
 *                   - valide ICI seulement : ESP=entry-0x114 au prologue.
 *                   ebp n'est PAS un frame pointer ; recharge en 0x46558F et
 *                   0x465667 ([esp+124h], modele B : ESP=entry-0x120 ->
 *                   EA=entry+4, voir F7) apres clobber par les boucles de
 *                   copie ; utilise comme scratch (0x46556C, 0x465644).
 *   Epilogue      : pop edi/esi/ebp ; add esp,110h ; retn (0x46571F)
 *                   -> retn sans immediat : cleanup APPELANT (cdecl).
 *   Corrections
 *   add esp       : +4   apres sub_417FA6 (0x4653ED)           [cdecl 1 arg]
 *                   +1Ch  apres sub_4675C0 (0x465452)          [cdecl 7 args]
 *                   +4    apres sub_433097 (0x465518)          [cdecl 1 arg]
 *                   +0Ch  apres sub_41A0A9 (0x46561F, 0x465713)[cdecl 3 args]
 *                   +10h  apres sub_4203B2+sub_420476 (0x465693)[2x cdecl 2 args]
 *   Appels indirects : [vt+64h] x2 (5 pushes), [vt+80h] x2 (2 pushes) ;
 *                   callee pop 20/8 = HYPOTHESE deduite du suivi de
 *                   conservation ESP sous modele B (opt-in
 *                   P5_ASSUME_INDIRECT_POP_B, F6) ; stdcall NON prouve,
 *                   cible/ABI runtime inconnues.
 * ---------------------------------------------------------------------------
 * Preambule : ground truth = live ASM (neutral/asm.txt, extrait numerique) +
 * ida_dump_bytes, PAS Hex-Rays. Ce C est une projection statique conditionnelle
 * des effets ; non equivalente universellement a la memoire et aux registres
 * x86 (F4). Pas un equivalent runtime valide. Aucun nom metier, aucune
 * library call inventee : les 7 calles directs sont des sub_XXXXXX numeriques
 * (ret_imm=0 verifie sur chaque calle + nettoyages caller observes -> modele
 * caller-pop), les 4 appels indirects passent par des vtables lues a
 * l'execution.
 * Convention d'offsets : "virtuel" = esp a l'entree du call = 0 ; [entry+0]
 * = adresse de retour ; argN = entry+4+4N ; locaux en negatif.
 * Slots d'arguments lus : +4 (arg0, pointeur), +8 (arg1, signe), +12 (arg2).
 * =========================================================================== */

/* ===========================================================================
 * Domaine ISO/C32 conditionnel - hypotheses non prouvees (F4)
 * ===========================================================================
 * Chaque clause ci-dessous est une LIMITE DE DOMAINE NON VALIDEE, pas une
 * decouverte du binaire. Hors de ce domaine, ce C ne promet rien.
 *  1. C32/i386 : pointeurs de largeur 32, DWORD 4, little-endian. Le
 *     programme source n'est pas promis portable 64 bits.
 *  2. Memoire RAM ordinaire sequentielle, sans volatile/MMIO ni mutations
 *     concurrentes : les pointeurs types non volatiles ne promettent pas de
 *     reproduire l'ordre d'acces materiel dans ces autres domaines.
 *  3. DF=0 aux six REP ; appels opaques conservent les registres callee-saved
 *     utilises et n'alterent pas DF.
 *  4. Acces RD32 et copies DWORD valides selon alignement/type effectif ;
 *     objets et etendues valides. Hors domaine : adopter une memoire raw BYTE
 *     avec operations de lecture/ecriture DWORD x86, SANS library call
 *     inventee. Aucune preuve ici d'alignement/type/bornes.
 *  5. Arithmetique modulo 2^32 pour le calcul de table ; aucun debordement/
 *     fin d'objet/wrap lors des progressions de pointeurs C, sinon
 *     remplacer par arithmetique raw-address modulo 2^32. SAR signe :
 *     sign-fill exact et compteur &31, emule en unsigned ci-dessous (contrat
 *     compilateur non suppose). Aucune saturation/clamp ajoutee.
 *  6. Absence d'alias du stockage physique de pile avec les sources/
 *     destinations et objets accessibles dans ce modele ; stabilite de
 *     [entry+4] jusqu'aux reloads EBP ; les ecritures par calls ne depassent
 *     pas le stockage represente ; sorties rq[4]/rq[9] definies avant lecture
 *     sur succes. Ni l'extent 0x7C ni EAX=0 ne prouvent ces hypotheses. Le
 *     reste de rq n'est PAS initialise a zero : ne pas masquer l'incertitude.
 *  7. Les appels restent opaques et peuvent modifier les objets/globaux
 *     accessibles ; les relectures apres appels, la lecture du stride rq a
 *     chaque ligne et les neuf comparaisons court-circuitees sont conservees.
 *     Pas de const/pure/restrict ; pas de memoisation de BA8/type/chaines
 *     entre phases.
 *  8. Projection des appels par parametres explicites seulement : ne pretend
 *     pas reproduire l'observation du frame/outgoing stack, la persistance du
 *     pointeur local, ni les arguments laisses sur pile entre sub_4203B2 et
 *     sub_420476. En modele all-state : pile x86 commune et calls opaques,
 *     pas de locaux et ABI C ordinaires.
 *  9. (F6) pop 20/8 des 4 appels indirects : opt-in hypothetique
 *     P5_ASSUME_INDIRECT_POP_B, deduit du modele de stack conservation sous
 *     mode B ; cible/ABI runtime inconnues.
 * Si le parent exige un modele all-state / memory+register bit-exact plutot
 * que cette projection bornee, ce patch documentaire ne suffit pas : produire
 * le modele explicite ou escalader. La difference n'est pas masquee.
 * =========================================================================== */

#include <stdint.h>

/* ---- F6 : CDECL_CALL definit AVANT les externes et applique explicitement
 * a chacun -> les declarations ne dependent plus du defaut du compilateur.
 * Garde de MODELE a la compilation (plateforme hors C32 = hors domaine
 * explicite), pas une garde runtime dans la fonction. --------------------- */
#if defined(_MSC_VER) && defined(_M_IX86)
#  define CDECL_CALL __cdecl
#elif (defined(__GNUC__) || defined(__clang__)) && defined(__i386__)
#  define CDECL_CALL __attribute__((cdecl))
#else
#  error "F4/F6 : plateforme non C32/i386 - convention d'appel hors domaine explicite (garde de MODELE a la compilation, pas une garde runtime)"
#endif

/* ---- globales touchees (adresses + largeurs, lecture numerique seule) ---- */
extern uint32_t G_B7DB44;    /* dword @0x00B7DB44 - compare a 1 (0x46549C)    */
extern uint32_t G_1CB602C;   /* dword @0x01CB602C - pointeur base, table a
                                stride 2 (lea [eax+ebx*2], 0x465449)          */

/* ---- calles directs (numeriques). Modele caller-pop cdecl etaye par
 * ret_imm=0 sur chaque calle + nettoyages caller observes ; cela ne prouve
 * PAS les signatures C completes (F6). CDECL_CALL explicite sur les sept.
 * F5 : void = resultat ignore par cette projection, pas preuve de retour
 * void natif ; uint32_t de sub_41A0A9 = projection de l'EAX opaque au retn,
 * pas une signature de retour etablie. ------------------------------------ */
extern void     *CDECL_CALL sub_40A04A(void);                                                 /* 0x4653CC */
extern void     *CDECL_CALL sub_417FA6(uint32_t a);                                           /* 0x4653DB */
extern void      CDECL_CALL sub_4675C0(void *p1, uint32_t p2, uint32_t p3, uint32_t p4,
                             uint32_t p5, uint32_t p6, uint32_t p7);                /* 0x46544D */
extern void      CDECL_CALL sub_433097(void *p1);                                   /* 0x465513 */
extern uint32_t  CDECL_CALL sub_41A0A9(void *p1, void *p2, void *p3);               /* 0x46561A/0x46570E */
extern void      CDECL_CALL sub_4203B2(void *p1, void *p2);                         /* 0x465687 */
extern void      CDECL_CALL sub_420476(void *p1, void *p2);                         /* 0x46568E */

/* ---- F6 : appels indirects - opt-in hypothetique ------------------------
 * pop 20 (5 pushes [vt+64h]) / pop 8 (2 pushes [vt+80h]) est DEDUIT du suivi
 * de conservation ESP sous modele B ; aucun objet/vtable/cible runtime
 * identifie. Ce n'est PAS un stdcall prouve. Sans P5_ASSUME_INDIRECT_POP_B :
 * arret de compilation intentionnel (garde de MODELE, pas une garde runtime
 * dans la fonction) - aucune autre convention n'est compilee
 * silencieusement. -------------------------------------------------------- */
#if defined(P5_ASSUME_INDIRECT_POP_B)
#  if defined(_MSC_VER) && defined(_M_IX86)
#    define STDCALL __stdcall
#  elif (defined(__GNUC__) || defined(__clang__)) && defined(__i386__)
#    define STDCALL __attribute__((stdcall))
#  else
#    error "P5_ASSUME_INDIRECT_POP_B : plateforme non C32/i386, convention indirecte hors domaine explicite"
#  endif
typedef int32_t (STDCALL *PFN_VT64)(void *p1, void *p2, void *p3,
                                    uint32_t p4, uint32_t p5);
typedef int32_t (STDCALL *PFN_VT80)(void *p1, uint32_t p2);
#else
#  error "F6 : P5_ASSUME_INDIRECT_POP_B absent - pop 20/8 des 4 appels indirects est une HYPOTHESE non prouvee ; definir l'opt-in (garde de MODELE a la compilation) ou adopter un contrat abstrait non executable"
#endif

/* ---- lecture memoire exacte (aucune hypothese de stride implicite) ------- */
#define RD32(base, off)   (*(const uint32_t *)(const void *)((const uint8_t *)(base) + (off)))
#define RDPTR(base, off)  ((void *)(uintptr_t)RD32(base, off))

/* ---- F4 : SAR x86 emule en unsigned - sign-fill exact, compteur masque
 * &31, aucun contrat de shift signe C suppose, aucune saturation ajoutee.
 * Helper de projection (pas du code natif). ------------------------------- */
static uint32_t sar32_emul(uint32_t v, uint32_t n)
{
    n &= 31u;                                       /* x86 masque cl a 5 bits */
    if (n == 0u)
        return v;
    if ((v & 0x80000000u) == 0u)
        return v >> n;                              /* positif : fill de 0    */
    return (v >> n) | (0xFFFFFFFFu << (32u - n));   /* negatif : fill de 1    */
}

/* ===========================================================================
 * F5 - retour et EAX : void = PROJECTION DES EFFETS UNIQUEMENT ; la racine
 * ecrit et laisse EAX selon le chemin. Aucun prototype natif void/u32 prouve.
 *   - Entree nulle ([a0+24h]==0, sortie 0x4653C5 -> 0x465716) : EAX = 0
 *     (eax porte le dernier test).
 *   - Gates phase 2 o14/o98 nuls (0x4656AF / 0x4656B7) : EAX = 0.
 *   - Gates phase 2 type 8 / type != 10h / DC nul (0x4656C1/.C6/.D0) :
 *     EAX = o98 (eax tient o98 depuis 0x4656B1).
 *   - Chemin phase 2 complet : EAX = dernier callee opaque sub_41A0A9
 *     (0x46570E), propage tel quel au retn.
 *   - Fenetres callers : 0x464C49 suivi de add esp,0Ch ; xor eax,eax ->
 *     residu ECRASE sur ce site ; 0x464D85 suivi de add esp,0Ch, increment/
 *     comparaison EDI, puis epilogue SANS ecriture EAX sur la sortie de
 *     boucle -> le residu peut y etre propage au retour du caller.
 * Ce C n'est pas un modele de l'etat de registre au retour. Un modele
 * plein-EAX (u32 tous chemins) serait un modele callee-opaque DISTINCT,
 * compatible avec la borne d'exclusion ci-dessus et a faire apparaitre
 * explicitement ; il n'est pas adopte ici, et aucune preuve ne couvre tous
 * les chemins (calls declares void ici : residu inconnu). Les autres void
 * signifient resultat ignore par cette projection, pas preuve de retour
 * void natif.
 * =========================================================================== */
void CDECL_CALL sub_4653B0(void *a0, int32_t a1, int32_t a2)
{
    /* ---- slots locaux, offsets virtuels d'entree (aucun alias suppose) --- */
    uint32_t v110;        /* var_110 @-0x110 : flag mismatch PUIS compteur   */
    void    *v10C;        /* var_10C @-0x10C : objet indirect sauve          */
    void    *v108;        /* var_108 @-0x108 : resultat sub_40A04A           */
    void    *v104;        /* var_104 @-0x104 : a0->24 -> 10 -> 14            */
    void    *v100;        /* var_100 @-0x100 : [[sub_417FA6(a0->24)]+98h]    */
    uint32_t rq[31];      /* -0xFC..-0x84 : buffer requete/reponse passe par
                              pointeur a [vt+64h] ; rq[0]=var_FC (init 0x7C),
                              rq[4]=var_EC (stride lu), rq[9]=var_D8 (pointeur
                              dest ecrit par le calle). Extent reel ecrit par
                              le calle inconnu (borne ici par ob @-0x80).     */
    uint32_t ob[32];      /* -0x80..-0x01 : buffer 128 o ; ob[0]=var_80,
                              ob[1]=var_7C, ob[2]=var_78                      */

    /* ---- miroirs de registres persistants entre blocs (esi/edi/ebx) ------ */
    void    *r_esi;       /* callee-saved, reloads exacts modelises          */
    void    *r_edi;
    void    *r_ebx;
    uint32_t rc;          /* eax des calls indirects (teste a zero)          */
    void    *obj98;       /* [outer+98h] (ebx phase 1 / chemin B)            */
    void    *p94;         /* [outer+94h] (registre eax de la chaine)         */
    uint32_t type64;      /* ecx = [obj98+64h]                               */
    void    *tobj;        /* edi = [outer] au label L_4655AA                 */

    /* ===================================================================== */
    /* 0x4653B0 sub esp,110h ; push ebp ; mov ebp,[esp+118h](=arg0, valide
     * ici : ESP=entry-0x114) ; push esi ; push edi                          */
    /* 0x4653C0 mov eax,[ebp+24h] ; test ; jz L_465716                       */
    if (RD32(a0, 0x24) == 0u)
        goto L_465716;

    /* 0x4653CB push ebx (save) ; 0x4653CC call sub_40A04A ; mov esi,eax     */
    r_esi = sub_40A04A();
    v108  = r_esi;                                   /* 0x4653D7 var_108=esi */

    /* 0x4653D3 re-lecture de [ebp+24h] APRES le call sub_40A04A (la memoire
     * peut avoir change : les deux lectures sont conservees distinctes)     */
    /* 0x4653D6 push eax ; 0x4653DB call sub_417FA6 ; 0x4653E0 mov edi,[eax+98h]
     * 0x4653ED add esp,4 (cleanup cdecl 1 arg)                              */
    r_edi = RDPTR(sub_417FA6(RD32(a0, 0x24)), 0x98);
    v100  = r_edi;                                   /* 0x4653F0 var_100=edi */

    /* 0x4653E6 mov eax,[esp+130h](=arg2) ; 0x4653F4 test ; jz L_465455      */
    if (a2 == 0)
        goto L_465455;

    /* ---------------------------------------------------------------------
     * 0x4653F8..0x465452 : bloc d'arguments de sub_4675C0 (cdecl 7 args,
     * cleanup 0x1Ch). Pushes droite->gauche (ancres) :
     *   0x465401 [ebp+14h]           -> P7
     *   0x465402 [ebp+10h]           -> P6
     *   0x465406 [ebp+0Ch]           -> P5
     *   0x46540D [edi+44h]           -> P4
     *   0x46540E [edi+0D8h]          -> P3
     *   0x465424 800h                -> P2
     *   0x46544C lea ecx,[eax+ebx*2] -> P1
     * --------------------------------------------------------------------- */
    {
        const uint32_t p14 = RD32(a0, 0x14);         /* 0x4653F8 mov edx      */
        const uint32_t p10 = RD32(a0, 0x10);         /* 0x4653FB mov ecx      */
        const uint32_t p0C = RD32(a0, 0x0C);         /* 0x4653FE mov eax      */
        const uint32_t f44 = RD32(r_edi, 0x44);      /* 0x465403 mov ecx,[edi+44h]   */
        const uint32_t fD8 = RD32(r_edi, 0xD8);      /* 0x465407 mov eax,[edi+0D8h]  */
        const uint32_t ea1 = (uint32_t)a1;           /* 0x46540F mov eax,arg_08      */
        const uint32_t f08 = RD32(a0, 0x08);         /* 0x465416 mov ecx,[ebp+8]     */
        uint32_t ebx = ea1;                          /* 0x465419 mov ebx,eax         */
        const uint32_t lo = ea1 & 0xFu;              /* 0x46541B and eax,0Fh         */
        /* 0x46541E sar ebx,4 ; 0x465421 and ebx,1 : sign-fill exact (F4),
         * emulation unsigned - equivaut au bit 4 de ea1.                       */
        ebx = sar32_emul(ea1, 4u) & 1u;
        /* 0x465424 push 800h */
        ebx <<= 8;                                   /* 0x465429 shl ebx,8   */
        ebx += f08;                                  /* 0x46542C add ebx,ecx */
        {
            const uint32_t cnt = 2u - p14;           /* 0x46542E mov ecx,2 ; 0x465433 sub ecx,edx */
            uint32_t edx = RD32(a0, 0x04);           /* 0x465435 mov edx,[ebp+4]  */
            ebx <<= 4;                               /* 0x465438 shl ebx,4   */
            /* 0x46543B sar edx,cl - x86 masque cl a 5 bits ; sign-fill exact
             * emule en unsigned (F4), sans UB de shift signe C.            */
            edx = sar32_emul(edx, cnt);
            ebx += lo;                               /* 0x46543D add ebx,eax */
            {
                const uint32_t gbase = G_1CB602C;    /* 0x46543F mov eax,dword_1CB602C */
                ebx <<= 6;                           /* 0x465444 shl ebx,6   */
                ebx += edx;                          /* 0x465447 add ebx,edx */
                /* 0x465449 lea ecx,[eax+ebx*2] - SIB base eax : ce n'est PAS
                 * un acces esp (artefact "local -312" du scanner ecarte).   */
                void *const p1 = (void *)(gbase + (ebx << 1));
                /* 0x46544D call sub_4675C0 ; 0x465452 add esp,1Ch */
                sub_4675C0(p1, 0x800u, fD8, f44, p0C, p10, p14);
            }
        }
    }

L_465455:
    /* 0x465455 mov eax,[esi+0BA8h] ; test ; jnz L_465696                    */
    if (RD32(r_esi, 0xBA8) != 0u)
        goto L_465696;

    /* 0x465463 mov edx,[ebp+24h] ; 0x465466 mov eax,[edx+10h]               */
    {
        void *const tmp = RDPTR(RDPTR(a0, 0x24), 0x10);
        /* 0x465469 mov esi,[eax+14h] ; 0x46546E mov [var_104],esi ;
         * 0x465472 jz L_465696                                                 */
        r_esi = RDPTR(tmp, 0x14);
    }
    v104 = r_esi;                                    /* 0x46546E (avant test) */
    if (r_esi == (void *)0)
        goto L_465696;

    /* 0x465478 mov ebx,[esi+98h] ; 0x46547E mov eax,[esi+94h] ;
     * 0x465484 test ebx ; jz L_465696                                       */
    r_ebx = RDPTR(r_esi, 0x98);
    obj98 = r_ebx;
    p94   = RDPTR(r_esi, 0x94);                      /* eax de la chaine      */
    if (obj98 == (void *)0)
        goto L_465696;

    type64 = RD32(obj98, 0x64);                      /* 0x46548C mov ecx,[ebx+64h] */
    v110 = 0u;                                       /* 0x46548F var_110 = 0  */
    if (type64 != 0x10u)                             /* 0x465497 cmp ecx,10h ; jnz L_4654FB */
        goto L_4654FB;
    if (G_B7DB44 == 1u)                              /* 0x46549C cmp dword_B7DB44,1 ; jz L_4654FB */
        goto L_4654FB;

    /* chaine : 1 + 8 comparaisons dword ; tout mismatch -> flag = 1         */
    if (RD32(p94, 0x28) != type64)                   /* 0x4654A5 cmp [eax+28h],ecx */
        goto L_4654F3;
    if (RD32(obj98, 0x6C) != RD32(p94, 0x30)) goto L_4654F3; /* 0x4654AA/.AD  */
    if (RD32(obj98, 0x70) != RD32(p94, 0x34)) goto L_4654F3; /* 0x4654B2/.B5  */
    if (RD32(obj98, 0x74) != RD32(p94, 0x38)) goto L_4654F3; /* 0x4654BA/.BD  */
    if (RD32(obj98, 0x78) != RD32(p94, 0x3C)) goto L_4654F3; /* 0x4654C2/.C5  */
    if (RD32(obj98, 0x7C) != RD32(p94, 0x40)) goto L_4654F3; /* 0x4654CA/.CD  */
    if (RD32(obj98, 0x80) != RD32(p94, 0x44)) goto L_4654F3; /* 0x4654D2/.D8  */
    if (RD32(obj98, 0x84) != RD32(p94, 0x48)) goto L_4654F3; /* 0x4654DD/.E3  */
    if (RD32(obj98, 0x88) == RD32(p94, 0x4C))        /* 0x4654E8/.EE ; 0x4654F1 jz L_4654FB */
        goto L_4654FB;
    /* fallthrough -> L_4654F3 (derniere paire en mismatch)                  */

L_4654F3:
    v110 = 1u;                                       /* 0x4654F3 var_110 = 1  */

L_4654FB:
    /* 0x4654FB mov eax,[var_108] ; 0x4654FF mov eax,[eax+0BECh] ; jz L_4655AA */
    {
        const uint32_t gateBEC = RD32(v108, 0xBEC);
        if (gateBEC == 0u)
            goto L_4655AA;
        if (type64 == 8u) {                          /* 0x46550D cmp ecx,8 ; jnz L_465520 */
            sub_433097(obj98);                       /* 0x465512 push ebx ; call ; 0x465518 add esp,4 */
            goto L_465696;                           /* 0x46551B jmp L_465696 */
        }
        /* L_465520 : 0x465520 test eax,eax ; jz L_4655AA - re-test du MEME eax
         * (gateBEC, non modifie depuis 0x4654FF) : branche redondante gardee  */
        if (gateBEC == 0u)
            goto L_4655AA;

        /* 0x465528 mov esi,[esi+8] - inner = [outer+8]                         */
        r_esi = RDPTR(r_esi, 0x08);
        /* 0x46552B push 0 (P5) ; 0x46552D lea edx,&rq ; 0x465531 push 21h (P4) ;
         * 0x465533 rq[0]=7Ch ; 0x46553B mov ecx,[esi] (vtable) ; 0x46553D push
         * edx (P3) ; 0x46553E push 0 (P2) ; 0x465540 push esi (P1) ;
         * 0x465541 var_10C = esi ; 0x465545 call dword ptr [ecx+64h]           */
        rq[0] = 0x7Cu;
        v10C = r_esi;
        rc = (uint32_t)(*(PFN_VT64 *)((uint8_t *)*(void **)r_esi + 0x64))(
                 r_esi, (void *)0, (void *)&rq[0], 0x21u, 0u);
        if (rc != 0u)                                /* 0x465548 test ; jnz L_465696 */
            goto L_465696;

        /* 0x465550 mov ecx,[ebp+10h] - ebp = arg0 (jamais clobber sur ce chemin
         * avant la boucle) ; 0x465553 mov edx,[edi+0D8h] ;
         * 0x465559 mov eax,[var_D8] = rq[9] (dest ecrit par le calle indirect) */
        {
            const uint32_t cnt = RD32(a0, 0x10);
            void *src = RDPTR(r_edi, 0xD8);          /* edx : lignes src      */
            uint8_t *dst = (uint8_t *)(uintptr_t)rq[9]; /* eax : lignes dst   */
            if (cnt != 0u) {                         /* 0x46555D test ; jz L_46559A */
                const uint32_t srow = RD32(r_edi, 0x44); /* 0x465561 mov ebx,[edi+44h] */
                v110 = cnt;                          /* 0x465564 var_110 = compteur */
                do {                                 /* L_465568: */
                    /* 0x465568..0x46557C : copie srow octets src->dst
                     * (rep movsd puis rep movsb, DF=0 suppose clair)        */
                    {
                        uint32_t n = srow >> 2;
                        const uint32_t *s = (const uint32_t *)(const void *)src;
                        uint32_t *d = (uint32_t *)(void *)dst;
                        while (n--) { *d++ = *s++; }
                        {
                            uint32_t m = srow & 3u;
                            const uint8_t *s2 = (const uint8_t *)s;
                            uint8_t *d2 = (uint8_t *)d;
                            while (m--) { *d2++ = *s2++; }
                        }
                    }
                    src = (uint8_t *)src + srow;     /* 0x465577 add edx,ebx */
                    /* F1 : 0x46557E mov esi,[esp+34h] = var_EC = rq+0x10 ->
                     * rq[4] (PAS rq[1]) ; relecture du stride a chaque ligne */
                    dst += rq[4];                    /* 0x465586 add eax,esi */
                    v110 -= 1u;                      /* 0x465588 dec ecx */
                } while (v110 != 0u);                /* 0x465589 store ; 0x46558D jnz */
                /* F7 : 0x46558F mov ebp,[esp+124h] (octets 8bac2424010000) -
                 * rechargement physique arg0 (ebp clobber par la boucle).
                 * Modele B : ESP=entry-0x120 -> EA = entry+4 = arg0.
                 * Identite d'arg0 seulement sous hypothese de stabilite du
                 * slot entry+4 (domaine F4) ; [esp+118h] n'est valide qu'au
                 * prologue 0x4653B7 (ESP=entry-0x114).
                 * 0x465596 mov esi,[var_10C]                                           */
                r_esi = v10C;
            }
            /* L_46559A : 0x46559A mov eax,[esi] ; 0x46559C push 0 (P2) ;
             * 0x46559E push esi (P1) ; 0x46559F call dword ptr [eax+80h]       */
            (void)(*(PFN_VT80 *)((uint8_t *)*(void **)r_esi + 0x80))(
                 r_esi, 0u);
            goto L_465696;                           /* 0x4655A5 jmp L_465696 */
        }
    }

L_4655AA:
    /* Entrees : 0x465507 / 0x465522 (esi = outer tel quel, PAS [outer+8]).
     * 0x4655AA mov edi,[esi] - tobj = [outer] (niveau d'indirection exact,
     * conserve tel quel sans interpretation).                                */
    tobj = *(void **)r_esi;
    /* F2 : miroir EDI obligatoire - la valeur de l'objet est capturee a
     * 0x4655AA, AVANT l'appel opaque 0x4655C6, jamais relue depuis [outer]
     * apres cet appel (le chemin zero-row saute 0x46566E et va directement
     * a 0x465676 avec EDI courant).                                         */
    r_edi = tobj; /* 0x4655AA EDI=[outer]; needed when zero-row path bypasses 0x46566E */
    rq[0] = 0x7Cu;                                   /* 0x4655B4 mov [var_FC],7Ch */
    /* 0x4655AC push 0 (P5) ; 0x4655AE lea edx,&rq ; 0x4655B2 push 21h (P4) ;
     * 0x4655BC mov ecx,[edi] ; 0x4655BE push edx (P3) ; 0x4655BF push 0 (P2) ;
     * 0x4655C1 push edi (P1) ; 0x4655C2 var_10C = edi ;
     * 0x4655C6 call dword ptr [ecx+64h]                                     */
    v10C = tobj;
    rc = (uint32_t)(*(PFN_VT64 *)((uint8_t *)*(void **)tobj + 0x64))(
             tobj, (void *)0, (void *)&rq[0], 0x21u, 0u);
    if (rc != 0u)                                    /* 0x4655C9 test ; jnz L_465696 */
        goto L_465696;

    /* 0x4655D1 mov eax,[var_110] (flag mismatch) ; test ; jz L_465624       */
    if (v110 == 0u)
        goto L_465624;

    /* ---- chemin B (flag != 0) : copie 32 dwords puis sub_41A0A9 ---------- */
    /* F3 : ordre memoire natif retabli (0x4655D9..0x46561A) - lectures/
     * copies/ecritures dans la sequence exacte ; boucles DWORD sequentielles
     * conservees (PAS une library call).                                    */
    {
        const void *src = RDPTR(r_esi, 0x94);        /* 0x4655D9 mov esi,[esi+94h] - ebx = obj98 inchange sur ce chemin */
        const uint32_t b3C = RD32(obj98, 0x3C);      /* 0x4655DF mov eax,[ebx+3Ch]  */
        const uint32_t sEC = rq[4];                  /* 0x4655EE mov edx,[var_EC] (F1) */
        {
            uint32_t n = 0x20u;                      /* 0x4655E2 mov ecx,20h */
            const uint32_t *s = (const uint32_t *)src;
            uint32_t *d = (uint32_t *)(void *)&ob[0];/* 0x4655E7 lea edi,[var_80] */
            while (n--) { *d++ = *s++; }             /* 0x4655F2 rep movsd (DWORD sequentiel avant) */
        }
        const uint32_t b40 = RD32(obj98, 0x40);      /* 0x4655F4 mov ecx,[ebx+40h] : APRES le REP */
        ob[0] = b3C;                                 /* 0x4655F7 mov [var_80],eax */
        const uint32_t destD8 = rq[9];               /* 0x4655FE mov eax,[var_D8] : AVANT ob[1]/ob[2] */
        ob[1] = b40;                                 /* 0x465602 mov [var_7C],ecx */
        ob[2] = sEC;                                 /* 0x465613 mov [var_78],edx */
        /* 0x465609 lea ecx,&ob ; 0x465610 push eax=destD8 (P3) ;
         * 0x465611 push ecx=&ob (P2) ; 0x465612 push ebx (P1) ;
         * 0x46561A call sub_41A0A9 ; 0x46561F add esp,0Ch                       */
        (void)sub_41A0A9(obj98, (void *)&ob[0], (void *)(uintptr_t)destD8);
        goto L_46566E;                               /* 0x465622 jmp short L_46566E */
    }

L_465624:
    /* ---- chemin C' (flag == 0) : boucle de copie depuis var_100 ---------- */
    /* 0x465624 mov ebx,[var_100]                                            */
    r_ebx = v100;
    {
        const uint32_t cnt = RD32(a0, 0x10);         /* 0x465628 mov ecx,[ebp+10h] - ebp=arg0 (non clobber ici) */
        void *src = RDPTR(r_ebx, 0xD8);              /* 0x46562F mov edx,[ebx+0D8h] */
        uint8_t *dst = (uint8_t *)(uintptr_t)rq[9];  /* 0x46562B mov eax,[var_D8]   */
        if (cnt == 0u)                               /* 0x465635 test ; jz L_465676 */
            goto L_465676;                           /* saut direct : edi=tobj (F2), esi=outer courants */
        {
            const uint32_t srow = RD32(r_ebx, 0x44); /* 0x465639 mov ebx,[ebx+44h] */
            v110 = cnt;                              /* 0x46563C var_110 = compteur */
            do {                                     /* L_465640: */
                {
                    uint32_t n = srow >> 2;
                    const uint32_t *s = (const uint32_t *)(const void *)src;
                    uint32_t *d = (uint32_t *)(void *)dst;
                    while (n--) { *d++ = *s++; }
                    {
                        uint32_t m = srow & 3u;
                        const uint8_t *s2 = (const uint8_t *)s;
                        uint8_t *d2 = (uint8_t *)d;
                        while (m--) { *d2++ = *s2++; }
                    }
                }
                src = (uint8_t *)src + srow;         /* 0x46564F add edx,ebx */
                /* F1 : 0x465656 mov esi,[esp+34h] = var_EC = rq+0x10 -> rq[4] */
                dst += rq[4];                        /* 0x46565E add eax,esi */
                v110 -= 1u;                          /* 0x465660 dec ecx */
            } while (v110 != 0u);                    /* 0x465661 store ; 0x465665 jnz */
            /* F7 : 0x465667 (PAS 0x466667) mov ebp,[esp+124h] (octets
             * 8bac2424010000) - rechargement physique arg0. Modele B :
             * ESP=entry-0x120 -> EA = entry+4 = arg0. Identite d'arg0
             * seulement sous hypothese de stabilite du slot entry+4
             * (domaine F4) ; [esp+118h] n'est valide qu'au prologue
             * 0x4653B7 (ESP=entry-0x114).                            */
        }
        /* fallthrough L_46566E */
    }

L_46566E:
    r_edi = v10C;                                    /* 0x46566E mov edi,[var_10C] */
    r_esi = v104;                                    /* 0x465672 mov esi,[var_104] */
    /* fallthrough L_465676 */

L_465676:
    /* 0x465676 mov edx,[edi] ; 0x465678 push 0 (P2) ; 0x46567A push edi (P1) ;
     * 0x46567B call dword ptr [edx+80h]                                     */
    (void)(*(PFN_VT80 *)((uint8_t *)*(void **)r_edi + 0x80))(
         r_edi, 0u);

    /* 0x465681 mov edi,[var_108] ; 0x465685 push edi (P2) ; 0x465686 push esi
     * (P1) ; 0x465687 call sub_4203B2 ; 0x46568C push edi ; 0x46568D push esi ;
     * 0x46568E call sub_420476 ; 0x465693 add esp,10h                       */
    r_edi = v108;
    sub_4203B2(r_esi, r_edi);
    sub_420476(r_esi, r_edi);
    /* fallthrough L_465696 */

L_465696:
    /* 0x465696 mov esi,[var_108] ; 0x46569A pop ebx (fin de la sauvegarde)   */
    r_esi = v108;
    /* 0x46569B cmp dword ptr [esi+0BA8h],1 ; jnz L_465716                   */
    if (RD32(r_esi, 0xBA8) != 1u)
        goto L_465716;

    /* =================== phase 2 (gate [esi+BA8]==1) ===================== */
    /* ebp = arg0 sur TOUS les chemins atteignant ce point (restaure en
     * 0x46558F / 0x465667 [esp+124h], F7, ou jamais clobber).                */
    {
        /* 0x4656A4 mov eax,[ebp+24h] ; 0x4656A7 mov ecx,[eax+10h] ;
         * 0x4656AA mov eax,[ecx+14h] ; jz L_465716                            */
        void *o14 = RDPTR(RDPTR(RDPTR(a0, 0x24), 0x10), 0x14);
        if (o14 == (void *)0)
            goto L_465716;
        {
            /* 0x4656B1 mov eax,[eax+98h] ; 0x4656B7 jz L_465716                */
            void *const o98 = RDPTR(o14, 0x98);
            if (o98 == (void *)0)
                goto L_465716;
            /* 0x4656BB mov ecx,[eax+64h] ; cmp 8 ; jz L_465716 ;
             * cmp 10h ; jnz L_465716                                           */
            const uint32_t t64 = RD32(o98, 0x64);
            if (t64 == 8u)
                goto L_465716;
            if (t64 != 0x10u)
                goto L_465716;
            {
                /* 0x4656C8 mov edx,[eax+0DCh] ; 0x4656CE jz L_465716           */
                const uint32_t srcDC = RD32(o98, 0xDC);
                if (srcDC == 0u)
                    goto L_465716;
                {
                    /* 0x4656D2 add esi,87Ch - source de la copie = v108+0x87C  */
                    const void *src = (const uint8_t *)r_esi + 0x87Cu;
                    uint32_t n = 0x20u;              /* 0x4656D8 mov ecx,20h  */
                    const uint32_t *s = (const uint32_t *)src;
                    uint32_t *d = (uint32_t *)(void *)&ob[0]; /* 0x4656DD lea edi,[var_80] */
                    /* 0x4656E4 push edx (P3 = srcDC, push en premier)          */
                    while (n--) { *d++ = *s++; }     /* 0x4656E5 rep movsd    */
                    ob[0] = RD32(o98, 0x3C);         /* 0x4656E7/.F1 var_80   */
                    ob[1] = RD32(o98, 0x40);         /* 0x4656F8/.FB var_7C   */
                    ob[2] = RD32(o98, 0x44);         /* 0x465702/.707 var_78  */
                    /* 0x465705 push edx=&ob (P2) ; 0x465706 push eax=o98 (P1) ;
                     * 0x46570E call sub_41A0A9 ; 0x465713 add esp,0Ch
                     * NB (F5) : EAX au retn = EAX opaque de retour de ce
                     * call, propage tel quel au caller.                     */
                    (void)sub_41A0A9(o98, (void *)&ob[0], (void *)(uintptr_t)srcDC);
                }
            }
        }
    }

L_465716:
    /* 0x465716 pop edi ; 0x465717 pop esi ; 0x465718 pop ebp ;
     * 0x465719 add esp,110h ; 0x46571F retn                                 */
    return;
}
```

## Provenance du payload, hors du C

Source exclusive : `P5_C_re_review_1/c_reviewed_final.c`, SHA256 `660e88a0661ddb42d876013491f07fe7341d642a835599440c538af4b253c0fa`, 34350 octets. Le payload conserve intégralement commentaires, ancien en-tête « PAS ACCEPTE / en attente » et fins de ligne. Cet en-tête est historique : `c_review.md`, `coverage_review.json` et `findings.json` portent le verdict externe **ACCEPTE**, limité à la projection **C32 EFFECTS-ONLY** dans son domaine conditionnel. Il ne faut ni réécrire le header ni utiliser ses références comme sources supplémentaires. Aucune génération, correction ou normalisation C ici.

Le C `void` n'est **pas le prototype natif** : plein EAX32, pile physique sortante et comportement des locaux échappés sont exclus. Aucun contrat de retour booléen, AL ou AX, aucune signature métier ou ABI flottante/CW ne sont établis par ce livrable.

## Résultat documentaire propagé

- Mode conservé : **1+V** ; verdict V original **ESCALADE_2+1**, exclusivement procédural (>200 instructions, 268 observées), sans désaccord numérique A/V. Escalade satisfaite par les contrôles obligatoires C aveugle, B sémantique et R, sans nouvelle génération dans cette tâche. R : **MAINTIEN**, **LIKELY NUMERIC**, A==V sur le fond.
- Nouveauté matérielle de B par rapport aux **deux** références (C-final/C-review et A/V) : **0** ; matérielle R-only : **0**. Confirmations et inspections supplémentaires ne deviennent pas des découvertes ; aucun certificat exhaustif d'absence d'erreurs.
- Parent : **PASS_BOUNDED**, pas un gate exécuté par ce worker. Source `0x4653B0..0x465720` : 268 instructions / 880 octets / 45 blocs / **76 arêtes de blocs**, distinctes des **299 arêtes instructionnelles** ; 12 calls (8 directs, 4 indirects), 6 REP, un RET. Hash natif rapporté : `bbe507d6369efcb4ebbd6814fef60b07e19fff5d9721579395cd705be9bca382`.
- Rôle numérique `sub_4653B0` : sous gardes DWORD, calcule une adresse indexée, sélectionne des appels opaques, copie des lignes ou 128 octets avec substitution de trois mots locaux, puis examine un état relu. Deux familles indépendantes : copies REP ; gardes et sélection d'appels +0x64/+0x80/BA8.
- `isUpdateVRAMOrSomething` reste une hypothèse métier non validée, pas réfutée. Le contexte parent rapporte **0 hit QMD exact** pour `0x4653B0` et ce nom ; aucune nouvelle recherche ici, aucune bibliothèque ou identité graphique/VRAM/texture inventée, aucun renommage.

## Sites natifs rapportés, pas contrats de fonctions décompilées

Les nombres ci-dessous désignent les mots explicitement poussés, droite vers gauche, dans la source revue ; ils ne certifient ni arité réelle, ni types, ni effets des corps de cibles.

- `0x4653CC -> 0x40A04A` : 0 mot explicite ; EAX capturé dans ESI/slot local.
- `0x4653DB -> 0x417FA6` : 1 mot, `[a0+0x24]` relu après le call précédent ; cleanup 4 à `0x4653ED`, lecture résultat+0x98.
- `0x46544D -> 0x4675C0` : 7 mots, adresse base+2*index, 0x800, D.D8, D.44, p.0C, p.10, p.14 ; cleanup 28 à `0x465452`, retour ignoré par la projection sans preuve de native void.
- `0x465513 -> 0x433097` : 1 mot capturé obj98 ; cleanup 4 à `0x465518`, EAX opaque peut atteindre la jonction.
- `0x465545 -> [[inner]+0x64]` : 5 mots `(receiver,0,&rq,0x21,0)` ; receiver/table/cible capturés avant appel, suite seulement si EAX=0. Pop20 hypothétique.
- `0x46559F -> [[ESI courant]+0x80]` : 2 mots `(receiver courant,0)` ; table/cible relues après la séquence précédente, pop8 hypothétique, EAX opaque.
- `0x4655C6 -> [[EDI capturé]+0x64]` : 5 mots `(receiver,0,&rq,0x21,0)` ; suite seulement si EAX=0. Pop20 hypothétique.
- `0x46561A -> 0x41A0A9` : 3 mots, obj98 capturé, scratch, rq[9] lu dans l'ordre des stores locaux ; cleanup 12 à `0x46561F`.
- `0x46567B -> [[EDI courant]+0x80]` : 2 mots `(receiver courant,0)` ; table/cible relues à `0x465676`, pop8 hypothétique. Route zéro ligne `0x465637 -> 0x465676` : pas de reloads `0x46566E/0x465672`, EDI capturé et ESI courant conservés.
- `0x465687 -> 0x4203B2` : 2 mots, ESI courant et valeur retenue dans EDI ; cleanup différé.
- `0x46568E -> 0x420476` : 2 mots, mêmes ESI/EDI retenus ; cleanup groupé 16 à `0x465693`, incluant les arguments du call précédent. Son EAX peut subsister.
- `0x46570E -> 0x41A0A9` : 3 mots, o98 frais, scratch, DC capturé/poussé avant REP ; cleanup 12 à `0x465713`, plein EAX opaque jusqu'au RET.

Les huit sites directs visent sept fonctions existantes ; les quatre sites indirects +0x64/+0x80 restent opaques, corps/ABI non prouvés. Les sept ADD ESP explicites rapportés (4,28,4,12,16,12,272) conservent les cleanups natifs, y compris restauration du frame. Les hypothèses indirectes pop20/pop8, préservation des nonvolatiles et retours normaux ne sont pas des preuves d'ABI de cible.

Deux sites caller CODE17 dans `0x464BD0`, chacun cleanup12 : `0x464C49` est suivi de `0x464C51 XOR EAX,EAX` ; après `0x464D85`, la sortie par non-prise du JL signé `0x464D97` peut atteindre `0x464DA0 RET` sans réécriture d'EAX. Aucun contrat métier n'en découle ; R ne revendique pas une réinspection des corps, et ce worker ne fait aucun accès natif.

## Limites conservées

Pas de reconstruction pile/plein-EAX par le C void. Le mot BA8 peut être scalaire (ex. 2), pointeur ou résidu opaque selon chemin ; state0 gouverne la première voie et state1 est relu pour la dernière. Les gardes racine JZ/JNZ n'établissent aucune borne positive ; SAR signe-rempli, compte &31 et adresses DWORD modulo 2^32 restent ceux rapportés par les contrôles.

Copies REP ordonnées, forward **sous DF=0**, pas memmove : source avancée de la longueur capturée ; destination avancée du stride **relu chaque ligne**, ESP+52 = entrée−236 = rq+16 = **rq[4], pas rq[1]**. rq = entrée−252, 124 octets, seul premier DWORD explicitement initialisé (120 octets restants indéterminés avant effets opaques). Scratch distinct entrée−128, 128 octets. Succès EAX=0 et taille 0x7C ne prouvent ni outputs rq définis ni écritures bornées. DEC ECX, pas compteur signé positif inventé.

RAM ordinaire séquentielle valide et finie, C32/i386, alignement/types effectifs/étendues, pointeurs C sans wrap, DF0, frame privé, slots/tables valides et stabilité aux captures/reloads, outputs rq[4]/rq[9] définis et ABI opaque compatible sont **des préconditions non prouvées**. Les alias ordinaires entre objets ne sont pas globalement exclus ; aucune équivalence tous états/toutes piles, MMIO/concurrence, compilée, ISO/backend ou runtime n'est revendiquée.

## Gel, isolation et suites parent

Les **18 hashes** d'`input_manifest.json` sont vérifiés ; les **8 gels de production + 3 R** de `freeze_before_final_propagation.json` sont inchangés. La provenance primaire pack/C n'était pas strictement aveugle (aliases/labels natifs). Les contrôles numériques et leur re-review frais gardent leurs exceptions administratives héritées/AGENT/ContextMode ; les audits API parent sont bornés aux requêtes observées, sans certificat inconditionnel d'aveuglement de tout contexte. Lecture AGENT administrative, non preuve sémantique ; aucun POLICY historique complet, QMD/GrepAI/histoire ou source additionnelle.

**En attente du parent** : append IDB, sauvegarde, readback exact et git/promotion. Rien de cela n'a été effectué ici. Aucun debugger/runtime, registry/queue, génération C, nouveau vote, nouvel accès natif ou sous-agent.
