# Camera_WorldXZMidpoint_Masked @ 0x5020A0

- Instr (live): 71
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=54
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=32
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=120
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Camera_WorldXZMidpoint_Masked(unsigned __int16 mask, __int16 *out_xyz)
- Notes parent: Scan 7 acteurs stride 0x9C sur dword_1D972E0 jusqu a &battle_camera_world_y_edx (jl signe). Masque u16 bits 0-6 (pas occupancy 1+2). WORD X [edi-4] Z [edi] Y non lu. Scratch 8 octets min/max XZ, expand jge/jle signes. Unwind(8) ssi ESI; masque vide deref quand meme. Mid cdq/sub/sar /2 vers 0. out WORD X Y=0 Z. EAX=Z mid. add esp,4. Pas de Hex-Rays.

## C réconcilié

```c
/* Camera_WorldXZMidpoint_Masked @ 0x5020A0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 71 instr, size 0xC9, end 0x502169. IDA type int __cdecl(unsigned __int16, int).
 * cdecl: arg_0 mask u16, arg_4 out_xyz. Saved ebx/ebp/esi/edi. No locals.
 * ESI scratch AABB, EBX bit index, EBP = mask & 0xFFFF, EDI scan cursor.
 * Scan: EDI = dword_1D972E0, add 9Ch, cmp EDI vs &battle_camera_world_y_edx,
 * jl signed (7C). Delta 0x444 / 0x9C = 7. Bits 0..6. Not occupancy 1+2.
 * WORD X [edi-4] 66 8B 47 FC; WORD Z [edi] 66 8B 07; Y [edi-2] unread.
 * First hit: bs_modulo(8), add esp,4; min=max X/Z. Else signed 66 3B jge/jle.
 * Scratch WORDs: +0 minX, +2 maxX, +4 minZ, +6 maxZ.
 * Unwind(8)+add esp,4 iff ESI!=0; loc_502136 still reads [esi+2] if ESI==0.
 * Mid: movsx, add, cdq, sub eax,edx, sar 1 (signed /2 toward 0).
 * out: 66 WORD X, 66 C7 WORD Y=0, 66 WORD Z. EAX = Z mid.
 * Occupancy / GetRandomInt / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No Hex-Rays. No domain::.
 */

extern int dword_1D972E0[]; /* 0x1D972E0, Z of actor 0; X at -4 */
extern int battle_camera_world_y_edx; /* 0x1D97724 sentinel address */

int __cdecl bs_modulo(int size);
char __cdecl BattleScratch_Unwind(int size);

int __cdecl Camera_WorldXZMidpoint_Masked(unsigned __int16 mask, __int16 *out_xyz)
{
    __int16 *aabb; /* ESI: 8-byte {minX,maxX,minZ,maxZ} WORDs */
    unsigned int bit; /* EBX */
    unsigned int m; /* EBP */
    unsigned char *p; /* EDI */
    int sum;
    int min_z;
    __int16 x;
    __int16 z;

    aabb = 0;
    bit = 0;
    m = mask & 0xFFFFu;
    p = (unsigned char *)dword_1D972E0;

    do {
        if (m & (1u << bit)) {
            x = *(__int16 *)(p - 4);
            z = *(__int16 *)p;
            if (!aabb) {
                aabb = (__int16 *)bs_modulo(8);
                aabb[1] = x; /* 66 89 46 02 maxX */
                aabb[0] = x; /* 66 89 06 minX */
                aabb[3] = z; /* 66 89 46 06 maxZ */
                aabb[2] = z; /* 66 89 46 04 minZ */
            } else {
                if (x < aabb[0]) /* 66 3B 06 / jge */
                    aabb[0] = x;
                if (x > aabb[1]) /* 66 3B 46 02 / jle */
                    aabb[1] = x;
                if (z < aabb[2]) /* 66 3B 46 04 / jge */
                    aabb[2] = z;
                if (z > aabb[3]) /* 66 3B 46 06 / jle */
                    aabb[3] = z;
            }
        }
        p += 0x9C;
        bit++;
    } while ((int)p < (int)&battle_camera_world_y_edx); /* 7C jl signed */

    if (aabb)
        BattleScratch_Unwind(8);

    /* loc_502136: no NULL guard */
    sum = aabb[1] + aabb[0]; /* movsx maxX + minX */
    min_z = aabb[2]; /* 0F BF 56 04 interleaved before X sar */
    sum /= 2; /* cdq; sub eax,edx; sar 1 toward 0 */
    out_xyz[0] = (__int16)sum;
    out_xyz[1] = 0; /* 66 C7 41 02 00 00 */
    sum = aabb[3] + min_z;
    sum /= 2;
    out_xyz[2] = (__int16)sum;
    return sum;
}
```
