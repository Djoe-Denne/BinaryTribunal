# BattleCamera_BuildViewAndConsumeDeltas @ 0x5033E0

- Instr (live): 67
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=54
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=53
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=53
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleCamera_BuildViewAndConsumeDeltas(void)
- Notes parent: jz si word_1D977A2==0 (66 39 2D). Roll: bs_modulo(0x38), WORD [esi]=[esi+2]=0 [esi+4]=A2, 56CE30(esi,esi+0x18), 56C4F0 world→+8 puis lookat→+0x10, 50CCF0(+8,+0x10,&1D97778) A3 1D9779C=EAX, Mat3S16(&1D97778,edi,&1D97778), Unwind(0x38), add esp,40h. Zero: 50CCF0(world,lookat,&1D97778) add esp,0Ch A3. Tail: 8C/90/94 += movsx 10/12/14, WORD 14/12/10=0. Retour EAX=movsx original 14. Occupancy absente.

## C réconcilié

```c
/* BattleCamera_BuildViewAndConsumeDeltas @ 0x5033E0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 67 instr, size 0xF3, end 0x5034d3. cdecl, no args, no locals. retn C3.
 * EBP zeroed and used as WORD 0 (BP). EBX saved only on A2!=0 path.
 * WORD 66: cmp/load A2, [esi+0/+2/+4], pan clears. DWORD A3 dword_1D9779C.
 * add esp,40h (16 cdecl pushes) on roll path; add esp,0Ch on zero path.
 * Occupancy / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / GetRandomInt unused.
 */

extern int __cdecl bs_modulo(int);
extern int *__cdecl sub_56CE30(__int16 *, int *);
extern unsigned short *__cdecl sub_56C4F0(__int16 *, __int16 *, unsigned short *);
extern int __cdecl sub_50CCF0(__int16 *, __int16 *, int);
extern unsigned int *__cdecl Mat3S16_MulQ12_Copy5(int, __int16 *, unsigned int *);
extern char __cdecl BattleScratch_Unwind(int);

extern __int16 word_1D977A2;                  /* 0x1D977A2 item_size 2 */
extern __int16 Battle_Camera_world_XZ_s16;   /* 0xB8B7F0 item_size 4, address taken */
extern __int16 Battle_Camera_LookAt_XZ_s16;  /* 0xB8B7F8 item_size 4, address taken */
extern int dword_1D97778;                     /* 0x1D97778 item_size 4, view block start */
extern int dword_1D9779C;                     /* 0x1D9779C */
extern __int16 word_1D97710;                  /* 0x1D97710 */
extern __int16 word_1D97712;                  /* 0x1D97712 */
extern __int16 word_1D97714;                  /* 0x1D97714 */
extern int dword_1D9778C;                     /* 0x1D9778C */
extern int dword_1D97790;                     /* 0x1D97790 */
extern int dword_1D97794;                     /* 0x1D97794 */

int __cdecl BattleCamera_BuildViewAndConsumeDeltas(void)
{
    int result;
    __int16 *scratch;
    __int16 *mat;
    __int16 *world_rot;
    __int16 *look_rot;

    if (word_1D977A2 != 0)
    {
        scratch = (__int16 *)bs_modulo(0x38);
        mat = (__int16 *)((char *)scratch + 0x18);
        scratch[1] = 0;
        scratch[0] = 0;
        scratch[2] = word_1D977A2;
        sub_56CE30(scratch, (int *)mat);

        world_rot = (__int16 *)((char *)scratch + 8);
        sub_56C4F0(mat, &Battle_Camera_world_XZ_s16, (unsigned short *)world_rot);

        look_rot = (__int16 *)((char *)scratch + 0x10);
        sub_56C4F0(mat, &Battle_Camera_LookAt_XZ_s16, (unsigned short *)look_rot);

        dword_1D9779C = sub_50CCF0(world_rot, look_rot, (int)&dword_1D97778);
        Mat3S16_MulQ12_Copy5((int)&dword_1D97778, mat, (unsigned int *)&dword_1D97778);
        BattleScratch_Unwind(0x38);
    }
    else
    {
        dword_1D9779C = sub_50CCF0(
            &Battle_Camera_world_XZ_s16,
            &Battle_Camera_LookAt_XZ_s16,
            (int)&dword_1D97778);
    }

    result = word_1D97714;
    dword_1D9778C += (int)word_1D97710;
    dword_1D97790 += (int)word_1D97712;
    dword_1D97794 += result;
    word_1D97714 = 0;
    word_1D97712 = 0;
    word_1D97710 = 0;
    return result;
}
```
