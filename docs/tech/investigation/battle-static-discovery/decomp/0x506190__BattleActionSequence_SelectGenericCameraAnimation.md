# BattleActionSequence_SelectGenericCameraAnimation @ 0x506190

- Instr (live): 180
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=3691
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=4856
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=3104
- A==B: non
- Push IDB: oui
- SetType: void __cdecl BattleActionSequence_SelectGenericCameraAnimation(unsigned __int8 *, char)
- Notes parent: jpt 6 handlers via byte_5063E4. ja 0xFC unsigned. Stride 0x9C pas 0xD0. packed StartTrack != CameraID_Maybe=8. WORD 66 CameraID_Maybe / flags. BYTE OR 1D97705. setz 0xFFFE. add esp,8. Occupancy/GetRandomInt/0x1D0/0x44 absents.

## C réconcilié

```c
/* BattleActionSequence_SelectGenericCameraAnimation @ 0x506190
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 180 instr, size 0x239, end 0x5063C9. IDA type void __cdecl(unsigned __int8 *, char).
 * cdecl, 2 args. Saved EBX/EBP/ESI/EDI. VOID: leftover EAX = last callee.
 * enable==0: WORD CameraID_Maybe=0xFFFF then def epilogue; no OR 8000h; seq unread.
 * Stride lea/shl/sub: slot*39 then [ecx*4] = slot*0x9C. esi=actors+slot*0x9C.
 * ebp=*(esi+0x84)=dword_1D97344[slot*0x9C]. ebx=actors+byte_1D99AAA*0x9C.
 * WORD OR g_BattleCameraFlags,8000h (ecx=8000h live into case 8).
 * Switch (seq[1]-2) ja 0xFCu unsigned; index byte_5063E4[253]; jpt_506204 6 dwords.
 * jpt0 cmds 2,6,24-27,29,30,32-34; jpt1 5,11,14,15,17-22,31,239; jpt2 cmd8;
 * jpt3 cmd16; jpt4 244,254; jpt5 default (226 cmds). 0/1/255 ja default.
 * loc_50620B: sub_4A7120==1 AND WORD 7FFFh. [esi+4]>=10h jnb unsigned:
 *   packed=([*(esi+74)+2]==1 && seq[2]==0x0B)?0:1; CameraID_Maybe=8.
 * else: (rand&3 + [esi+82h]+2) unsigned div 6; even-force if byte_1D99B94>1
 *   OR ([ebx+4]<10h AND [ebx+8]&0x41021); store [esi+82h]; CameraID_Maybe=dl zero-ext.
 * loc_506295: seq[1]==6 && WORD seq[6]==0x0F → AND 7FFFh, no StartTrack.
 * else StartTrack(*(ebp+2Ch), packed) add esp,8. packed is 0/1 or rem 0..5, NOT 8.
 * loc_5062C2: CameraID_Maybe=rand&1; StartTrack(table, movsx+6); setz WORD seq[4]==0xFFFE
 *   after pop edi/esi; BYTE OR 1D97705,80h; WORD CameraID_Maybe+2=dx.
 * loc_506301: same +6 then OR 80h then CameraID_Maybe=8 (overwrite). No +2.
 * loc_506337: seq[3]&80h → WORD OR dword_1D97704,cx (8000h). Else sub_4A7120==1 AND 7FFFh.
 * loc_506344: packed=seq[3]&7Fh; CameraID_Maybe=ax; StartTrack(table, movsx) NO +6.
 * loc_506382: same rem 0..5, no even-force; StartTrack(edx); OR BYTE +1,80h; fall def.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / GetRandomInt: absent.
 * No Hex-Rays. No domain::.
 */

extern unsigned char g_BattlePresentationActors[]; /* 0x1D972C0, stride 0x9C */
extern unsigned char byte_1D99AAA; /* 0x1D99AAA BYTE index */
extern unsigned char byte_1D99B94; /* 0x1D99B94 BYTE, ja unsigned vs 1 */
extern unsigned int g_BattleCameraFlags; /* 0x1D97718; WORD OR/AND only */
extern unsigned char dword_1D97704[]; /* 0x1D97704; WORD OR / BYTE +1 OR 80h */
extern unsigned short CameraID_Maybe; /* 0x1D97728 WORD stores (66) */
extern unsigned short word_1D9772A; /* 0x1D9772A = CameraID_Maybe+2 WORD */

int sub_4A7120(void);
unsigned int BS_GetRandomCamera_Probably(void);
void __cdecl BattleCamera_StartTrack(unsigned short *table, int packed_id);

void __cdecl BattleActionSequence_SelectGenericCameraAnimation(unsigned __int8 *seq, char enable)
{
    unsigned char *actor;
    unsigned char *actor_b;
    unsigned char *obj;
    unsigned short *table;
    unsigned int packed;
    unsigned short cam;

    CameraID_Maybe = 0xFFFFu;
    if (enable == 0)
        return;

    actor = &g_BattlePresentationActors[seq[0] * 0x9C];
    obj = *(unsigned char **)(actor + 0x84);
    actor_b = &g_BattlePresentationActors[byte_1D99AAA * 0x9C];

    *(unsigned short *)&g_BattleCameraFlags |= 0x8000u;

    switch (seq[1]) {
    case 2:
    case 6:
    case 24:
    case 25:
    case 26:
    case 27:
    case 29:
    case 30:
    case 32:
    case 33:
    case 34:
        if (sub_4A7120() == 1) {
            *(unsigned short *)&g_BattleCameraFlags &= 0x7FFFu;
            return;
        }
        if (actor[4] >= 0x10u) {
            if (*(unsigned char *)(*(unsigned int *)(actor + 0x74) + 2) == 1
                && seq[2] == 0x0B)
                packed = 0;
            else
                packed = 1;
            CameraID_Maybe = 8;
        } else {
            packed = ((BS_GetRandomCamera_Probably() & 3u) + actor[0x82] + 2u) % 6u;
            if (byte_1D99B94 > 1u
                || (actor_b[4] < 0x10u
                    && (*(unsigned int *)(actor_b + 8) & 0x41021u) != 0))
                packed &= ~1u;
            actor[0x82] = (unsigned char)packed;
            CameraID_Maybe = (unsigned short)(unsigned char)packed;
        }
        if (seq[1] == 6 && *(unsigned short *)(seq + 6) == 0x0F)
        {
            *(unsigned short *)&g_BattleCameraFlags &= 0x7FFFu;
            return;
        }
        table = *(unsigned short **)(obj + 0x2C);
        BattleCamera_StartTrack(table, (int)packed);
        return;

    case 5:
    case 11:
    case 14:
    case 15:
    case 17:
    case 18:
    case 19:
    case 20:
    case 21:
    case 22:
    case 31:
    case 239:
        cam = (unsigned short)(BS_GetRandomCamera_Probably() & 1u);
        CameraID_Maybe = cam;
        table = *(unsigned short **)(obj + 0x2C);
        BattleCamera_StartTrack(table, (int)(short)cam + 6);
        dword_1D97704[1] |= 0x80u;
        word_1D9772A = (*(unsigned short *)(seq + 4) == 0xFFFEu) ? 1u : 0;
        return;

    case 16:
        cam = (unsigned short)(BS_GetRandomCamera_Probably() & 1u);
        CameraID_Maybe = cam;
        table = *(unsigned short **)(obj + 0x2C);
        BattleCamera_StartTrack(table, (int)(short)cam + 6);
        dword_1D97704[1] |= 0x80u;
        CameraID_Maybe = 8;
        return;

    case 8:
        if (seq[3] & 0x80)
            *(unsigned short *)dword_1D97704 |= 0x8000u;
        else if (sub_4A7120() == 1) {
            *(unsigned short *)&g_BattleCameraFlags &= 0x7FFFu;
            return;
        }
        packed = seq[3] & 0x7Fu;
        CameraID_Maybe = (unsigned short)packed;
        table = *(unsigned short **)(obj + 0x2C);
        BattleCamera_StartTrack(table, (int)(short)packed);
        return;

    case 244:
    case 254:
        packed = ((BS_GetRandomCamera_Probably() & 3u) + actor[0x82] + 2u) % 6u;
        actor[0x82] = (unsigned char)packed;
        CameraID_Maybe = (unsigned short)(unsigned char)packed;
        table = *(unsigned short **)(obj + 0x2C);
        BattleCamera_StartTrack(table, (int)packed);
        dword_1D97704[1] |= 0x80u;
        return;

    default:
        return;
    }
}
```
