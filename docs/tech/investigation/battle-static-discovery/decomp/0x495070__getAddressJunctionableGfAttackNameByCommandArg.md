# getAddressJunctionableGfAttackNameByCommandArg @ 0x495070

- Instr (live): 12
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=39
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=39
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=44
- A==B: non
- Push IDB: oui
- SetType: char *__cdecl getAddressJunctionableGfAttackNameByCommandArg(int p_command_arg)
- Notes parent: stride K_GF 0x84 (lea-40h/shl5/add/*4), WORD +0x00; header DWORD +0x88; add esp 8; EAX callee. Slot/F_CHAR/Exists 0x44/occupancy/GetRandomInt absents.

## C réconcilié

```c
/* getAddressJunctionableGfAttackNameByCommandArg @ 0x495070
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 12 instr, size 0x26. IDA type char *__cdecl(int). No domain::.
 * K_GF_JUNCTIONABLE @ 0x1CF4DC0 stride 0x84: lea [ecx-40h]; shl edx,5; add edx,eax; [edx*4].
 * offsetGFAttackName WORD +0x00 (66 8B). KERNEL_HEADER @ 0x1CF3E48; offsetJunctionableGFText DWORD +0x88 (A1 0x1CF3ED0).
 * Slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / occupancy 1+2 / GetRandomInt: unused.
 * cdecl getAddressAttackName(unsigned __int16, int) add esp 8. Return EAX from callee.
 */

extern unsigned char KERNEL_HEADER[]; /* 0x1CF3E48, FF8KernelHeader */
extern unsigned char K_GF_JUNCTIONABLE[]; /* 0x1CF4DC0, FF8KernelJunctionableGF[] */

char *__cdecl getAddressAttackName(unsigned __int16 p_attack_name_offset, int p_address_text_gf_attack);

char *__cdecl getAddressJunctionableGfAttackNameByCommandArg(int p_command_arg)
{
    int idx;
    unsigned __int16 name_offset;
    int text_off;

    text_off = *(int *)(KERNEL_HEADER + 0x88);
    idx = p_command_arg - 0x40;
    name_offset = *(unsigned __int16 *)(K_GF_JUNCTIONABLE + idx * 0x84);
    return getAddressAttackName(name_offset, text_off);
}
```
