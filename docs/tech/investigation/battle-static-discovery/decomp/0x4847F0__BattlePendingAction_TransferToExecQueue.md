```c
/* ============================================================================
 * c_corrected.c — 0x4847F0, projection C corrigée (F01 + F02 + F03)
 * ----------------------------------------------------------------------------
 * Ground truth = live ASM (neutral/asm.txt) + neutral/bytes.json, PAS Hex-Rays.
 * Root    : [0x4847F0,0x484C00) — 1040 octets, 286 heads décodés.
 * SHA256  : 0d09303e37ab30433bb673792d3653fa9c91da663f1a21a8daba1fa01b5e7929
 *           (inchangé ; les 286 rows de bytes.json concaténés = root).
 * Padding : 0x484BFF (90, nop) = 286e head — compté, NON exécuté, aucun
 *           chemin inventé depuis le retn nu 0x484BFE (c3).
 * CFG     : 21 blocs B00..B20 ; 26 edges squelette ; saut indirect unique
 *           0x484838 résolu en 7 destinations capturées ; sortie ret.
 *           B20 (padding) non atteignable depuis l'entrée.
 *
 * ========================= CONTRAT DE PROJECTION ==========================
 * S         : ESP natif à l'entrée (état de projection explicite — pas un
 *             argument host déguisé en ABI natif). P = S-0x18 = niveau
 *             stable hors pushes d'arguments (sub esp,8 puis 4 pushes).
 * eax_entry : EAX natif à l'entrée. AUCUN zéro inventé : le xor eax,eax
 *             natif reste à 0x484817, POSTÉRIEUR au test de flag 0x48480F.
 * Prototype : u32 proj_4847F0(u32 S, u32 eax_entry) est un PROTOTYPE DE
 *             PROJECTION, pas le prototype source natif. ABI observée :
 *             1 dword stack utilisé à [S+4], retn nu ; le caller autorisé
 *             nettoie 4 octets (usage compatible cdecl). Type de retour
 *             source NON établi par ce corpus. Une annotation de catalogue
 *             void serait possible, mais n'est ni consultée ni garantie par
 *             l'ASM ou par le fait qu'un caller ne consomme pas EAX.
 *
 * DISJONCTION (précondition explicite — pas une promesse d'état stack plat) :
 *   DOM_mémoire = toute adresse passée à rd8/rd16/rd32/wr8/wr16/wr32 :
 *     rows, globals, et le slot d'argument caller [S+4]. Aliasing ordinaire
 *     possible slot caller <-> rows/globals (ordres de reload conservés).
 *   DOM_protégé = cadre C hôte de cette fonction et frame natif du root
 *     [S-0x18,S+4) : retour [S], sauvegardes ebx/ebp/esi/edi, locaux
 *     [P+0x10]=[S-8], [P+0x14]=[S-4] et control du root.
 *   DOM_scratch = arguments sortants et cadres privés internes des calls,
 *     privés mais MUTABLES dans leur durée de vie ; leurs writes natifs
 *     sont abstraits, pas déclarés impossibles. Exemple 482BD0 écrit le
 *     BYTE de son a2 sortant (482BF4/482C28), adresse P-4 pour ce root.
 *   DOM_privé = DOM_protégé union DOM_scratch. PRÉCONDITION explicite :
 *     DOM_mémoire intersect DOM_privé = vide à tout point, calls inclus ;
 *     le scratch vivant ne doit pas empiéter sur DOM_protégé.
 *   Les callees opaques peuvent modifier DOM_mémoire et leur scratch.
 *   Corrompre DOM_protégé ou les tables de contrôle stables est HORS
 *     CONTRAT. Sous ces préconditions, les locaux du root restent en
 *     variables C et les pushes/pops/scratch sortants sont abstraits.
 *
 * SLOT CALLER [S+4] — NON abstrait :
 *   stores natifs 0x484819 (edi), 0x4848CD (esi), 0x484A1D (esi)
 *     -> wr32(S+4, ·) aux positions exactes ;
 *   load natif unique 0x484BAB (join) -> edx = rd32(S+4) À SA POSITION
 *     EXACTE, après les calls/stores susceptibles d'alias ; jamais pré-copié.
 *   EBX = snapshot VALEUR lu à 0x4847F4 (mov ebx,[esp+0x10], 8b5c2410,
 *     exécuté à ESP=S-0xC -> [S+4]) ; l'ADRESSE du slot n'est pas EBX.
 *
 * LOCAUX PRIVÉS (sous la disjonction ci-dessus) :
 *   [P+0x10] : init 2 (0x4847FD, c744241002000000) ; devient 1 aux SEULS
 *              0x484A09 / 0x484AA0 / 0x484AD2 ; lu au join 0x484B83.
 *   [P+0x14] : écrites 0x484821 (edi) / 0x48496E (esi) ; lu 0x484B9E.
 *              JAMAIS initialisé avant sa première écriture native : le
 *              chemin « flag initial nul » n'écrit ni ne lit ce slot.
 *   Guards des cases 1/2/4 : cmp esi,edi natifs conservés ; EDI=0 à
 *              l'entrée de chaque itération (0x4847FB / 0x484809), avant
 *              tout rechargement de row[2].
 *
 * EAX RÉSIDU (F02) — les trois sorties convergent 0x484BF7 et publient eax :
 *   1. flag initial nul (0 publications)   : eax_out = eax_entry & 0xFFFFFF00
 *                                             (upper24 d'entrée, AL=0) ;
 *   2. flag nul après 1 ou 2 publications  : eax_out = (dernière destination
 *                                             0x484BBD) & 0xFFFFFF00 (AL=0) ;
 *   3. k=3 complet (jl 0x484BF1 non pris)  : eax_out = destination de la 3e
 *                                             itération, inchangée au retn.
 *   Fenêtre caller alignée 0x47D772..0x47D795 : aucun read d'EAX après le
 *   call avant la relance dans cette fenêtre. Cela ne détermine pas le type
 *   de retour source : un caller peut ignorer une valeur retournée. Une
 *   présentation void ne serait qu'une hypothèse/annotation non vérifiée,
 *   et ne garantit ni EAX nul ni absence de résidu. Le retour projeté
 *   n'établit PAS le type source natif.
 *   Retours intermédiaires de 0x47E330 non observables : le root écrase EAX
 *   avant tout usage pertinent.
 *
 * DISPATCH (F03) — expansion sur l'action, tables figées capturées :
 *   0x484830 xor ecx,ecx ; 0x484832 mov cl,[eax+0x484C1C] (8a881c4c4800) ;
 *   0x484838 jmp dword ptr [ecx*4+0x484C00] (ff248d004c4800).
 *   Lectures LUT/JPT ABSTRAITES : projection des bytes capturés sous contrat
 *   d'immutabilité DÉCLARÉ (aucune immuabilité runtime prouvée ici, aucune
 *   traçabilité complète des lectures machine revendiquée) :
 *     LUT 255B [0x484C1C,0x484D1B) sha256
 *       9837f5cadd400493e421c5bc793ee94b912ff705d15a5a3b506c9b377e1f2ebd
 *       — index 0..254, valeurs 0..6 ; jamais d'index >6 dans l'image capturée.
 *     JPT 28B [0x484C00,0x484C1C) sha256
 *       647cf029ca98c8685969aed9f2552f005fe50128958c9f4421ee03d1e699674c
 *       — {0x484ADF,0x48483F,0x4848D6,0x484A26,0x484987,0x484AB9,0x484AFD}.
 *   L'octet 0x90 @0x484D1B (serait l'entrée de l'action 0xFF) n'est JAMAIS
 *   lu : le cmp/ja 0x484825/0x48482A (0f87, UNSIGNED) le court-circuite.
 *   Default du switch = projection des 239 actions complémentaires 0..0xFE
 *   (LUT=6 -> JPT[6]=0x484AFD) ET de l'action 0xFF (JA -> 0x484AFD). Muter
 *   ces bytes = HORS CONTRAT de projection ; ce n'est ni un retour natif,
 *   ni un assert/abort/library dispatch, ni un nouveau call.
 *
 * CLEANUPS CDECL (attributions natives, non déplacées) :
 *   différé 0x38 = 12+12+16+16 : 0x4848B8 / 0x48494F / 0x484A00 / 0x484A97 /
 *     0x484B6E (après les 4 pushes d'args des blocs B06/B09/B12/B14/B17) ;
 *   immédiat 0xC : 0x484ACA / 0x484AF0 (après les 3 pushes de B15/B16) ;
 *   épilogue frame 8 : 0x484BFB (distinct de tout cleanup d'arguments).
 *   22 sites de call dérivés de l'ASM : 7× sub_482BD0, 5× sub_47E3F0,
 *   10× sub_47E330 (blocs 4-calls B06/B09/B12/B14/B17 comparés instruction
 *   par instruction, non présumés identiques ; + 1-call B15/B16).
 *
 * ORDRE / ALIAS / LARGEURS PRÉSERVÉS :
 *   call 0x482BD0 -> store BYTE AL [0x1D2A208] (a208a2d201) -> reload row+2 ;
 *   load/store DWORD 0x1D27B18+208*edi, masque 0xFF77FFFF, avant 0x47E3F0 ;
 *   après les deux 0x47E330 : reload DWORD [ebp] puis masque 0x030E7FFF,
 *   store DWORD 0x1CFF188+464*edi. Aucun hoisting de row[2], aucune fusion
 *   des lectures [ebp] : calls opaques (0x47E330 mute le domaine mémoire
 *   numérique, non modélisé pur).
 *   Join : reload DWORD 0x1D2A208 (8b0d08a2d201) puis and 0xFF (81e1ff000000)
 *   — pas de substitution rd8 ; store WORD à 0x1D288EE+12*t+2*a (a =
 *   rd32(S+4)), qui n'est pas toujours dest+6 ; ordre strict des loads/stores
 *   conservé ; widths AL/DL/DX/CX (movzx 660fb6..., zéro-extension) / WORD
 *   (66 89…) / DWORD.
 *   Strides dérivés ASM : 13<<4 = 0xD0 (208), 29<<4 = 0x1D0 (464) — pas de
 *   stride Hex-Rays.
 *   cmp esi,3 (0x484BA5) reste la source du jl 0x484BF1 (0f8c, SIGNED) :
 *   seules LEA/MOV suivent avant le jl (flags intacts) ; ESI prouvé 0,1,2
 *   avant inc, 1,2,3 après.
 * ========================================================================== */

typedef unsigned char  u8;
typedef unsigned short u16;
typedef unsigned int   u32;

/* Mémoire plate projetée (DOM_mémoire) — accès explicites adresse/contenu
 * (aucun pointeur C typé : le native lit/écrit par adresses absolues). */
extern u8  rd8 (u32 addr);
extern u16 rd16(u32 addr);
extern u32 rd32(u32 addr);
extern void wr8 (u32 addr, u8  v);
extern void wr16(u32 addr, u16 v);
extern void wr32(u32 addr, u32 v);

/* Callees opaques — prototypes projection ; cdecl, pushes droite→gauche
 * annotés par site. Aucun libcall inventé, aucun nouveau call, ordre natif. */
extern u32 sub_482BD0(u32 a0, u32 a1, u32 a2);         /* retour EAX ; root ne consomme qu'AL (and eax,0xFF dominant côté callee, fenêtre autorisée) */
extern u32 sub_47E3F0(u32 a0, u32 a1, u32 a2);         /* retour EAX = adresse du store WORD 0x484898 etc. */
extern u32 sub_47E330(u32 a0, u32 a1, u32 a2, u32 a3); /* retour EAX ignoré puis écrasé avant usage pertinent */

/* PROTOTYPE DE PROJECTION — distinct de l'ABI natif original (voir header). */
u32 proj_4847F0(u32 S, u32 eax_entry);

u32 proj_4847F0(u32 S, u32 eax_entry)
{
    /* --- état de projection ------------------------------------------------ */
    u32 ebx, local0, local1;
    u32 eax, ecx, edx, ebp, edi, esi;
    u8  al, cl, dl;
    u16 dx;
    u32 r;

    eax = eax_entry;   /* état EAX natif d'entrée — PAS un zéro inventé        */

    /* 0x4847F0 sub esp,0x8 ; 0x4847F3 push ebx ; 0x4847F4 mov ebx,[esp+0x10]
     * (8b5c2410) : ESP=S-0xC au moment du load -> [esp+0x10]=[S+4] = slot
     * d'argument caller. EBX = snapshot VALEUR ; l'adresse du slot n'est
     * pas EBX.                                                                */
    ebx = rd32(S + 4);
    /* 0x4847F8 push ebp ; 0x4847F9 push esi ; 0x4847FA push edi -> ESP = P    */
    edi = 0;           /* 0x4847FB xor edi,edi                                  */
    local0 = 2;        /* 0x4847FD mov dword ptr [esp+0x10],0x2 -> [P+0x10]    */
    esi = 0;           /* 0x484805 xor esi,esi                                  */
    goto L_48480B;     /* 0x484807 jmp loc_48480B                              */

L_484809:              /* ---- relance d'itération (cible du jl 0x484BF1) ---- */
    edi = 0;           /* 0x484809 xor edi,edi — EDI=0 en tête d'itération     */

L_48480B:
    /* 0x48480B mov al,[ebx+esi*8+0x7] (8a44f307) : ne remplace que AL,
     * upper24 d'EAX préservés (eax_entry à la 1re itération, destination de
     * publication 0x484BBD aux suivantes). 0x48480F test al,al (84c0) ;
     * 0x484811 jz (0f84) vers la sortie.                                      */
    al = rd8(ebx + esi * 8 + 7);
    eax = (eax & 0xFFFFFF00u) | (u32)al;   /* merge AL, chaque entrée d'itération */
    if (al == 0)
        goto L_484BF7; /* sortie : eax publié tel quel (upper24, AL=0)         */

    eax = 0;           /* 0x484817 xor eax,eax (33c0) — POSTÉRIEUR au test     */
    wr32(S + 4, edi);  /* 0x484819 mov dword ptr [esp+0x1C],edi (897c241c)
                        * -> store n°1 du slot caller                          */
    al = rd8(ebx + esi * 8 + 3);           /* 0x48481D mov al,... (8a44f303)  */
    eax = (eax & 0xFFFFFF00u) | (u32)al;   /* width AL ; xor précédent => zext */
    local1 = edi;      /* 0x484821 mov dword ptr [esp+0x14],edi (897c2414)
                        * -> première écriture native de [P+0x14]              */
    if (eax > 0xFEu)   /* 0x484825 cmp eax,0xFE (3dfe000000)                   */
        goto L_484AFD; /* 0x48482A ja (0f87, UNSIGNED) — seule 0xFF bypass     */

    /* --- dispatch : projection des tables capturées (voir contrat header) -- */
    switch (eax) {
    case 0x00: goto L_484ADF;   /* LUT[0x00]=0 -> JPT[0]                      */
    case 0x02: goto L_48483F;   /* LUT[0x02]=1 -> JPT[1]                      */
    case 0x04: case 0x0D: goto L_4848D6;    /* LUT=2 (2 actions)              */
    case 0x05: case 0x0B: case 0x0E: case 0x0F:
    case 0x11: case 0x12: case 0x13: case 0x14:
    case 0x15: case 0x16: goto L_484A26;    /* LUT=3 (10 actions)             */
    case 0x10: goto L_484987;   /* LUT[0x10]=4 -> JPT[4]                      */
    case 0xFE: goto L_484AB9;   /* LUT[0xFE]=5 -> JPT[5]                      */
    default:   goto L_484AFD;   /* LUT=6 : 239 actions complémentaires 0..0xFE
                                 * + action 0xFF via JA ; cible JPT[6]        */
    }

    /* ======================================================================
     * case 1 (action 0x02) -> 0x48483F : garde esi==edi puis bloc 4-calls
     * ==================================================================== */
L_48483F:
    if (esi != edi)                     /* 0x48483F cmp esi,edi ; EDI=0 ici    */
        goto L_4848CD;                  /* 0x484841 jnz loc_4848CD             */

L_484847:
    /* pushes natifs : push 0xB ; push 0x1D28C02 ; push 0x1D288BC (0x484847-4E)
     * -> cdecl : a0=0x1D288BC, a1=0x1D28C02, a2=0xB                          */
    r = sub_482BD0(0x1D288BC, 0x1D28C02, 0xB);   /* 0x484853 call sub_482BD0 */
    edx = 0;                                     /* 0x484858 xor edx,edx     */
    wr8(0x1D2A208, (u8)r);                       /* 0x48485A mov byte ptr [0x1D2A208],al (a208a2d201) */
    dl = rd8(ebx + esi * 8 + 2);                 /* 0x48485F mov dl,[ebx+esi*8+0x2] */
    /* push 0x0 (0x484863) — 1er push d'args du call 0x48488C               */
    edi = (u32)dl;                               /* 0x484865 mov edi,edx (zext dl via xor edx,edx) */
    /* push 0xF0 (0x484867) ; push 0x6E (0x48486C)                          */
    eax = edi + edi * 2;                         /* 0x48486E lea eax,[edi+edi*2]    */
    ecx = edi + eax * 4;                         /* 0x484871 lea ecx,[edi+eax*4] (= edi*13) */
    ecx = ecx << 4;                              /* 0x484874 shl ecx,0x4 (= edi*0xD0 = edi*208) */
    edx = rd32(0x1D27B18 + ecx);                 /* 0x484877 mov edx,[ecx+0x1D27B18] (DWORD) */
    ebp = 0x1D27B18 + ecx;                       /* 0x48487D lea ebp,[ecx+0x1D27B18] */
    edx = edx & 0xFF77FFFFu;                     /* 0x484883 and edx,0xFF77FFFF     */
    wr32(ebp, edx);                              /* 0x484889 mov [ebp],edx (DWORD)  */
    eax = sub_47E3F0(0x6E, 0xF0, 0);             /* 0x48488C call sub_47E3F0 (pushes 0x484863/67/6C) */
    wr16(eax, (u16)edi);                         /* 0x484898 mov word ptr [eax],di (668938, WORD) */
    /* push 0x0,0x13,0x1,edi (0x484891-97) -> cdecl : (edi,1,0x13,0)        */
    sub_47E330(edi, 1, 0x13, 0);                 /* 0x48489B call sub_47E330        */
    /* push 0x0,0x17,0x1,edi (0x4848A0-A6)                                  */
    sub_47E330(edi, 1, 0x17, 0);                 /* 0x4848A7 call sub_47E330        */
    edx = rd32(ebp);                             /* 0x4848AC mov edx,[ebp] (reload DWORD, pas de fusion) */
    eax = edi * 8;                               /* 0x4848AF lea eax,[edi*8]        */
    eax = eax - edi;                             /* 0x4848B6 sub eax,edi (= edi*7)  */
    /* 0x4848B8 add esp,0x38 — cleanup différé des 4 calls (12+12+16+16)    */
    edx = edx & 0x030E7FFFu;                     /* 0x4848BB and edx,0x030E7FFF     */
    ecx = edi + eax * 4;                         /* 0x4848C1 lea ecx,[edi+eax*4] (= edi*29) */
    ecx = ecx << 4;                              /* 0x4848C4 shl ecx,0x4 (= edi*0x1D0 = edi*464) */
    wr32(0x1CFF188 + ecx, edx);                  /* 0x4848C7 mov [ecx+0x1CFF188],edx (DWORD) */
    /* fallthrough 0x4848CD                                                 */

    /* ======================================================================
     * sortie commune case 1 : store n°2 du slot caller puis join
     * ==================================================================== */
L_4848CD:
    wr32(S + 4, esi);   /* 0x4848CD mov dword ptr [esp+0x1C],esi (store n°2)  */
    goto L_484B83;      /* 0x4848D1 jmp loc_484B83                             */

    /* ======================================================================
     * case 2 (actions 0x04,0x0D) -> 0x4848D6 : garde esi==edi puis bloc
     * 4-calls, puis écriture byte[row+4] dans les DEUX chemins
     * ==================================================================== */
L_4848D6:
    if (esi != edi)                     /* 0x4848D6 cmp esi,edi ; EDI=0 ici    */
        goto L_484964;                  /* 0x4848D8 jnz loc_484964             */

L_4848DE:
    /* pushes : push 0xB ; push 0x1D28C02 ; push 0x1D288BC (0x4848DE-E5)     */
    r = sub_482BD0(0x1D288BC, 0x1D28C02, 0xB);   /* 0x4848EA */
    edx = 0;                                     /* 0x4848EF xor edx,edx     */
    wr8(0x1D2A208, (u8)r);                       /* 0x4848F1 store BYTE AL   */
    dl = rd8(ebx + esi * 8 + 2);                 /* 0x4848F6                 */
    edi = (u32)dl;                               /* 0x4848FC (push 0x0 @0x4848FA) */
    eax = edi + edi * 2;                         /* 0x484905 */
    ecx = edi + eax * 4;                         /* 0x484908 */
    ecx = ecx << 4;                              /* 0x48490B (= edi*0xD0)    */
    edx = rd32(0x1D27B18 + ecx);                 /* 0x48490E (DWORD)         */
    ebp = 0x1D27B18 + ecx;                       /* 0x484914 */
    edx = edx & 0xFF77FFFFu;                     /* 0x48491A */
    wr32(ebp, edx);                              /* 0x484920 (DWORD)         */
    eax = sub_47E3F0(0x6E, 0xF0, 0);             /* 0x484923 (pushes @0x4848FA/FE,0x484903) */
    wr16(eax, (u16)edi);                         /* 0x48492F (WORD)          */
    sub_47E330(edi, 1, 0x13, 0);                 /* 0x484932 (pushes @0x484928-2E) */
    sub_47E330(edi, 1, 0x17, 0);                 /* 0x48493E (pushes @0x484937-3D) */
    edx = rd32(ebp);                             /* 0x484943 (reload DWORD)  */
    eax = edi * 8;                               /* 0x484946 */
    eax = eax - edi;                             /* 0x48494D */
    /* 0x48494F add esp,0x38 (cleanup différé)                               */
    edx = edx & 0x030E7FFFu;                     /* 0x484952 */
    ecx = edi + eax * 4;                         /* 0x484958 */
    ecx = ecx << 4;                              /* 0x48495B (= edi*0x1D0)   */
    wr32(0x1CFF188 + ecx, edx);                  /* 0x48495E (DWORD)         */
    /* fallthrough 0x484964                                                 */

    /* ======================================================================
     * 0x484964 : écriture byte[row+4] dans la rangée slot (stride 0xD0),
     * atteinte des DEUX chemins du case 2
     * ==================================================================== */
L_484964:
    eax = 0;                             /* 0x484964 xor eax,eax               */
    cl = rd8(ebx + esi * 8 + 4);         /* 0x484966 mov cl,[ebx+esi*8+0x4]    */
    al = rd8(ebx + esi * 8 + 2);         /* 0x48496A mov al,[ebx+esi*8+0x2]    */
    eax = (eax & 0xFFFFFF00u) | (u32)al; /* width AL ; xor => zext             */
    local1 = esi;                        /* 0x48496E mov dword ptr [esp+0x14],esi (écriture n°2 de [P+0x14]) */
    edx = eax + eax * 2;                 /* 0x484972 lea edx,[eax+eax*2]       */
    eax = eax + edx * 4;                 /* 0x484975 lea eax,[eax+edx*4] (= eax*13) */
    eax = eax << 4;                      /* 0x484978 shl eax,0x4 (= eax*0xD0 = eax*208) */
    wr8(0x1D27BC8 + eax + esi, cl);      /* 0x48497B mov [eax+esi+0x1D27BC8],cl (BYTE) */
    goto L_484B83;                       /* 0x484982 jmp loc_484B83            */

    /* ======================================================================
     * case 4 (action 0x10) -> 0x484987 : garde esi==edi puis bloc 4-calls ;
     * [P+0x10]=1 UNIQUEMENT si le bloc est exécuté
     * ==================================================================== */
L_484987:
    if (esi != edi)                      /* 0x484987 cmp esi,edi ; EDI=0 ici   */
        goto L_484A1D;                   /* 0x484989 jnz loc_484A1D            */

L_48498F:
    /* pushes : push 0xB ; push 0x1D28C01 ; push 0x1D28890 (0x48498F-96)     */
    r = sub_482BD0(0x1D28890, 0x1D28C01, 0xB);   /* 0x48499B */
    edx = 0;                                     /* 0x4849A0 */
    wr8(0x1D2A208, (u8)r);                       /* 0x4849A2 */
    dl = rd8(ebx + esi * 8 + 2);                 /* 0x4849A7 */
    edi = (u32)dl;                               /* 0x4849AD (push 0x0 @0x4849AB) */
    eax = edi + edi * 2;                         /* 0x4849B6 */
    ecx = edi + eax * 4;                         /* 0x4849B9 */
    ecx = ecx << 4;                              /* 0x4849BC (= edi*0xD0)    */
    edx = rd32(0x1D27B18 + ecx);                 /* 0x4849BF */
    ebp = 0x1D27B18 + ecx;                       /* 0x4849C5 */
    edx = edx & 0xFF77FFFFu;                     /* 0x4849CB */
    wr32(ebp, edx);                              /* 0x4849D1 */
    eax = sub_47E3F0(0x6E, 0xF0, 0);             /* 0x4849D4 */
    wr16(eax, (u16)edi);                         /* 0x4849E0 (WORD)          */
    sub_47E330(edi, 1, 0x13, 0);                 /* 0x4849E3 */
    sub_47E330(edi, 1, 0x17, 0);                 /* 0x4849EF */
    edx = rd32(ebp);                             /* 0x4849F4 (reload DWORD)  */
    eax = edi * 8;                               /* 0x4849F7 */
    eax = eax - edi;                             /* 0x4849FE */
    /* 0x484A00 add esp,0x38 (cleanup différé)                               */
    edx = edx & 0x030E7FFFu;                     /* 0x484A03 */
    local0 = 1;                                  /* 0x484A09 mov dword ptr [esp+0x10],0x1 — [P+0x10]: 2->1 (site 1/3) */
    ecx = edi + eax * 4;                         /* 0x484A11 */
    ecx = ecx << 4;                              /* 0x484A14 (= edi*0x1D0)   */
    wr32(0x1CFF188 + ecx, edx);                  /* 0x484A17 */
    /* fallthrough 0x484A1D                                                 */

L_484A1D:
    wr32(S + 4, esi);   /* 0x484A1D mov dword ptr [esp+0x1C],esi (store n°3)  */
    goto L_484B83;      /* 0x484A21 jmp loc_484B83                             */

    /* ======================================================================
     * case 3 (10 actions) -> 0x484A26 : bloc 4-calls sans garde + [P+0x10]=1
     * ==================================================================== */
L_484A26:
    /* pushes : push 0xB ; push 0x1D28C01 ; push 0x1D28890 (0x484A26-2D)     */
    r = sub_482BD0(0x1D28890, 0x1D28C01, 0xB);   /* 0x484A32 */
    edx = 0;                                     /* 0x484A37 */
    wr8(0x1D2A208, (u8)r);                       /* 0x484A39 */
    dl = rd8(ebx + esi * 8 + 2);                 /* 0x484A3E */
    edi = (u32)dl;                               /* 0x484A44 (push 0x0 @0x484A42) */
    eax = edi + edi * 2;                         /* 0x484A4D */
    ecx = edi + eax * 4;                         /* 0x484A50 */
    ecx = ecx << 4;                              /* 0x484A53 (= edi*0xD0)    */
    edx = rd32(0x1D27B18 + ecx);                 /* 0x484A56 */
    ebp = 0x1D27B18 + ecx;                       /* 0x484A5C */
    edx = edx & 0xFF77FFFFu;                     /* 0x484A62 */
    wr32(ebp, edx);                              /* 0x484A68 */
    eax = sub_47E3F0(0x6E, 0xF0, 0);             /* 0x484A6B */
    wr16(eax, (u16)edi);                         /* 0x484A77 (WORD)          */
    sub_47E330(edi, 1, 0x13, 0);                 /* 0x484A7A */
    sub_47E330(edi, 1, 0x17, 0);                 /* 0x484A86 */
    edx = rd32(ebp);                             /* 0x484A8B (reload DWORD)  */
    eax = edi * 8;                               /* 0x484A8E */
    eax = eax - edi;                             /* 0x484A95 */
    /* 0x484A97 add esp,0x38 (cleanup différé)                               */
    edx = edx & 0x030E7FFFu;                     /* 0x484A9A */
    local0 = 1;                                  /* 0x484AA0 mov dword ptr [esp+0x10],0x1 — [P+0x10]: 2->1 (site 2/3) */
    ecx = edi + eax * 4;                         /* 0x484AA8 */
    ecx = ecx << 4;                              /* 0x484AAB (= edi*0x1D0)   */
    wr32(0x1CFF188 + ecx, edx);                  /* 0x484AAE */
    goto L_484B83;                               /* 0x484AB4 jmp loc_484B83  */

    /* ======================================================================
     * case 5 (action 0xFE) -> 0x484AB9 : call unique + [P+0x10]=1
     * ==================================================================== */
L_484AB9:
    /* pushes : push 0xB ; push 0x1D28C01 ; push 0x1D28890 (0x484AB9-C0)     */
    r = sub_482BD0(0x1D28890, 0x1D28C01, 0xB);   /* 0x484AC5 */
    /* 0x484ACA add esp,0xC (cleanup immédiat)                               */
    wr8(0x1D2A208, (u8)r);                       /* 0x484ACD mov byte ptr [0x1D2A208],al (a208a2d201) */
    local0 = 1;                                  /* 0x484AD2 mov dword ptr [esp+0x10],0x1 — [P+0x10]: 2->1 (site 3/3) */
    goto L_484B83;                               /* 0x484ADA jmp loc_484B83  */

    /* ======================================================================
     * case 0 (action 0x00) -> 0x484ADF : call unique, [P+0x10] inchangé
     * ==================================================================== */
L_484ADF:
    /* pushes : push 0xB ; push 0x1D28C02 ; push 0x1D288BC (0x484ADF-E6)     */
    r = sub_482BD0(0x1D288BC, 0x1D28C02, 0xB);   /* 0x484AEB */
    /* 0x484AF0 add esp,0xC (cleanup immédiat)                               */
    wr8(0x1D2A208, (u8)r);                       /* 0x484AF3 store BYTE AL   */
    goto L_484B83;                               /* 0x484AF8 jmp loc_484B83  */

    /* ======================================================================
     * case 6 (239 actions complémentaires) et cible du JA (action 0xFF)
     * -> 0x484AFD : bloc 4-calls sans garde, [P+0x10] inchangé
     * ==================================================================== */
L_484AFD:
    /* pushes : push 0xB ; push 0x1D28C02 ; push 0x1D288BC (0x484AFD-B04)    */
    r = sub_482BD0(0x1D288BC, 0x1D28C02, 0xB);   /* 0x484B09 */
    edx = 0;                                     /* 0x484B0E */
    wr8(0x1D2A208, (u8)r);                       /* 0x484B10 */
    dl = rd8(ebx + esi * 8 + 2);                 /* 0x484B15 */
    edi = (u32)dl;                               /* 0x484B1B (push 0x0 @0x484B19) */
    eax = edi + edi * 2;                         /* 0x484B24 */
    ecx = edi + eax * 4;                         /* 0x484B27 */
    ecx = ecx << 4;                              /* 0x484B2A (= edi*0xD0)    */
    edx = rd32(0x1D27B18 + ecx);                 /* 0x484B2D */
    ebp = 0x1D27B18 + ecx;                       /* 0x484B33 */
    edx = edx & 0xFF77FFFFu;                     /* 0x484B39 */
    wr32(ebp, edx);                              /* 0x484B3F */
    eax = sub_47E3F0(0x6E, 0xF0, 0);             /* 0x484B42 */
    wr16(eax, (u16)edi);                         /* 0x484B4E (WORD)          */
    sub_47E330(edi, 1, 0x13, 0);                 /* 0x484B51 */
    sub_47E330(edi, 1, 0x17, 0);                 /* 0x484B5D */
    edx = rd32(ebp);                             /* 0x484B62 (reload DWORD)  */
    eax = edi * 8;                               /* 0x484B65 */
    eax = eax - edi;                             /* 0x484B6C */
    /* 0x484B6E add esp,0x38 (cleanup différé)                               */
    edx = edx & 0x030E7FFFu;                     /* 0x484B71 */
    ecx = edi + eax * 4;                         /* 0x484B77 */
    ecx = ecx << 4;                              /* 0x484B7A (= edi*0x1D0)   */
    wr32(0x1CFF188 + ecx, edx);                  /* 0x484B7D */
    /* fallthrough 0x484B83                                                 */

    /* ======================================================================
     * join 0x484B83 : épilogue d'itération + publication record.
     * t = local1 + 2*(11*local0 + s), s = dword[0x1D2A208] & 0xFF (reload
     * DWORD), a = rd32(S+4) — dest EAX = 0x1D288E8+12*t (0x484BBD) ;
     * store WORD à 0x1D288EE+12*t+2*a, PAS toujours dest+6.
     * ==================================================================== */
L_484B83:
    eax = local0;                                /* 0x484B83 mov eax,[esp+0x10] (DWORD, [P+0x10]) */
    ecx = rd32(0x1D2A208) & 0xFFu;               /* 0x484B87 mov ecx,[0x1D2A208] (8b0d08a2d201, DWORD — pas rd8) ;
                                                    0x484B8D and ecx,0xFF (81e1ff000000) */
    wr8(ebx + esi * 8 + 7, 0);                   /* 0x484B93 mov byte ptr [ebx+esi*8+0x7],0 (c644f30700, ligne COURANTE) */
    edx = eax + eax * 4;                         /* 0x484B98 lea edx,[eax+eax*4]       */
    eax = eax + edx * 2;                         /* 0x484B9B lea eax,[eax+edx*2] (= eax*11) */
    edx = local1;                                /* 0x484B9E mov edx,[esp+0x14] ([P+0x14]) */
    eax = eax + ecx;                             /* 0x484BA2 add eax,ecx (= 11*bank + s) */
    esi = esi + 1;                               /* 0x484BA4 inc esi                   */
    /* 0x484BA5 cmp esi,0x3 — flags pour le jl 0x484BF1 (SIGNED) ; seules
     * LEA/MOV suivent avant le jl : flags intacts. ESI 0,1,2 avant inc.    */
    eax = edx + eax * 2;                         /* 0x484BA8 lea eax,[edx+eax*2] (= t = local1 + 2*(11*bank+s)) */
    edx = rd32(S + 4);                           /* 0x484BAB mov edx,dword ptr [esp+0x1C] (8b54241c)
                                                    — LOAD du slot caller À SA POSITION EXACTE,
                                                    après les calls/stores susceptibles d'alias (a) */
    ecx = eax + eax * 2;                         /* 0x484BAF lea ecx,[eax+eax*2] (= 3t) */
    eax = eax + eax * 2;                         /* 0x484BB2 lea eax,[eax+eax*2] (= 3t) */
    ecx = edx + ecx * 2;                         /* 0x484BB5 lea ecx,[edx+ecx*2] (= a + 6t) */
    dx = rd16(ebx + esi * 8 - 8);                /* 0x484BB8 mov dx,[ebx+esi*8-0x8] (668b54f3f8, WORD ; esi APRÈS inc -> ligne (esi-1)) */
    eax = eax * 4 + 0x1D288E8;                   /* 0x484BBD lea eax,[eax*4+0x1D288E8] (= dest = 12t + 0x1D288E8) */
    wr16(0x1D288EE + ecx * 2, dx);               /* 0x484BC4 mov word ptr [ecx*2+0x1D288EE],dx (6689144dee88d201, WORD = 0x1D288EE+12t+2a) */
    cl = rd8(ebx + esi * 8 - 6);                 /* 0x484BCC mov cl,[ebx+esi*8-0x6] (row+2) */
    dl = rd8(ebx + esi * 8 - 5);                 /* 0x484BD0 mov dl,[ebx+esi*8-0x5] (row+3) */
    wr8(eax, cl);                                /* 0x484BD4 mov [eax],cl (dest+0)     */
    cl = rd8(ebx + esi * 8 - 4);                 /* 0x484BD6 movzx cx,byte ptr [ebx+esi*8-0x4] (660fb64cf3fc, ZÉRO-EXTENSION CX) */
    wr8(eax + 1, dl);                            /* 0x484BDC mov [eax+1],dl (dest+1)   */
    wr16(eax + 4, (u16)cl);                      /* 0x484BDF mov word ptr [eax+0x4],cx (66894804, WORD dest+4) */
    dl = rd8(ebx + esi * 8 - 3);                 /* 0x484BE3 mov dl,[ebx+esi*8-0x3] (row+5) */
    cl = rd8(ebx + esi * 8 - 2);                 /* 0x484BE7 mov cl,[ebx+esi*8-0x2] (row+6) */
    wr8(eax + 2, dl);                            /* 0x484BEB mov [eax+2],dl (dest+2)   */
    wr8(eax + 3, cl);                            /* 0x484BEE mov [eax+3],cl (dest+3)   */
    if ((int)esi < 3)                            /* 0x484BF1 jl loc_484809 (0f8c, SIGNED ; ESI=1,2,3 après inc) */
        goto L_484809;

L_484BF7:
    /* 0x484BF7-BFA : pop edi ; pop esi ; pop ebp ; pop ebx
     * 0x484BFB : add esp,0x8 (83c408 — épilogue frame, distinct des
     *            cleanups d'arguments 0x38/0xC)
     * 0x484BFE : retn (c3, nu — cdecl, cleanup caller)
     * 0x484BFF : nop (90) — 286e head, padding ; compté, NON exécuté ;
     *            aucun chemin depuis le retn.                            */
    return eax;   /* publication projection : EAX natif en sortie.
                     1. flag initial nul          : eax_entry & 0xFFFFFF00 (AL=0)
                     2. flag nul après 1-2 pubs   : dernière dest 0x484BBD & 0xFFFFFF00 (AL=0)
                     3. k=3 complet (jl non pris) : dest de la 3e itération, inchangée.
                      Ce retour n'établit PAS le type de retour source natif ;
                      l'absence de consommation d'EAX dans la fenêtre caller
                      ne prouve pas un prototype void. */
}
```

## Acceptation et provenance documentaire

C reproduit sans régénération, octet pour octet depuis `P6_C_re_review_2/c_reviewed_final.c`, commentaires, header et LF compris : SHA-256 `1a876b16f6731c12ecc21096886dac646f1e76abd81bbaf082ee7ebc9a413f88`. Le titre historique `c_corrected.c` n'est pas une nouvelle génération. Le verdict C-review **ACCEPTE** porte uniquement sur cette projection et son contrat. Cible documentaire du parent : `0x4847F0__BattlePendingAction_TransferToExecQueue.md` ; aucun fichier de production remplacé ici.

Clarification du header conservé : 1040 octets, **286 heads décodés mais 285 heads is-code/accessibles** ; `0x484BFF:90` est un padding non-code après RET `0x484BFE`, sans chemin exécutable. Selon `parent_native_gate_final.json` et `parent_postfreeze_context.json`, IDA parent a **20 blocs accessibles et 31 edges internes + 1 sortie RET = 32 edges résolus**. Les 21 blocs du review incluent B20, le padding inaccessible ; les 26 edges squelette gardent le dispatch indirect non résolu, ensuite remplacé par sept destinations. Ce sont des conventions de comptage, pas 21 blocs natifs accessibles ni un conflit algorithmique.

Le gate natif **parent** est `PASS_BOUNDED`, non exécuté par ce propagateur : capture fraîche de 255 BYTE LUT et 7 DWORD JPT, comparaison au switch **C exécutable 256/256**, zéro divergence, pas seulement cohérence de hashes du header. `JA` unsigned après CMP FE envoie FF à `0x484AFD`, pas au RET ; l'octet LUT `0x90` à `0x484D1B` n'est pas lu.

Historique inchangé : **1+V**, A==V numérique, V original **ESCALADE_2+1 procédurale >200**, verdict numérique **ACCEPTE**. L'exigence procédurale a été satisfaite par B frais aveugle numérique puis R : **MAINTIEN, LIKELY NUMERIC**. Faits matériels B nouveaux contre **BOTH** C-final/C-review et A/V : **0** ; faits matériels R-only : **0**. Corroborations et inspections nouvelles ne sont pas des découvertes ; pas de certificat exhaustif d'absence d'erreurs. Cohorte C-B obligatoire **P1/P3/P5 seulement, pas P6** ; aucun contrôle C-B P6 inventé.

Les huit gels de production et les trois pièces R restent immuables (manifeste `freeze_before_final_propagation.json`, SHA-256 `1fb14cedad2d3cc64c31c00473c10f80980da4d246ee382c80b6b3c274415ed0`). Pack/C primaires non strictement aveugles (aliases/labels natifs exposés) ; enveloppes numériques des corrections/A/V/B/R et exceptions administratives héritées/AGENT/ContextMode documentées. Audits API parent bornés : isolation numérique avec exceptions, **pas** certificat d'aveuglement de tout le contexte. Ce rôle est une propagation documentaire non aveugle, sans vote ni RE supplémentaire.

Le catalogue pending→exec est cohérent avec les documents statiques **déjà récupérés par le parent** via QMD, cités dans `parent_postfreeze_context.json` ; identité métier non pleinement certifiée, pas réfutée, aucun rename. ROOT protégé `[S-24,S+4)` **exclut S+4**, mémoire ordinaire mutable ; EBX est le snapshot initial distinct du reload tardif. Scratch privé **mutable**. Validité des adresses, séparation RAM/privé, ABI/retours normaux, mapping mémoire et tables runtime immuables sont des préconditions non démontrées. Trois classes EAX32, pas BOOL/void ni prototype source établi. Aucun backend, compilation, ISO, exécution native/runtime ou équivalence de pile plate/faults prouvé.

Append IDB, sauvegarde/readback et git restent **pending, réservés au parent** : rien de cela n'a été effectué ici. Les preuves numériques et leurs attributions R/parent sont propagées dans `semantic_candidate.md`.
