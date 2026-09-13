# BdLinkTask_Register_664D20 @ 0x664CD0

- Instr (live): 26
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=29
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=27
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=27
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BdLinkTask_Register_664D20(int arg_0, int arg_4, __int16 *arg_8)
- Notes parent: Register 2 args (list 0x2505588, callback sub_664D20). FillDwords 9 depuis +0x14. DWORD +0x0C/+0x10/+0x14/+0x18. movsx<<4. EAX=arg_4. BYTE OR bit0 et +0x0D absents. Occupancy/0xD0/0x1D0/0x44 absents. add esp 14h.

## C réconcilié

```c
/* BdLinkTask_Register_664D20 @ 0x664CD0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 26 instr, size 0x48, end 0x664D18. cdecl, 3 args. Saved ESI then EDI. retn C3.
 * IDA type int __cdecl(int, int, __int16 *). SetType without namespace.
 * Callees: BdLinkTask_Register(list_head=&dword_2505588, callback=sub_664D20)
 *   then FillDwords(esi+14h, 0, 9). One add esp,14h (2+3 dwords). No other add esp.
 * FillDwords saves/restores EDI (push edi / pop edi around rep stosd) so
 *   lea edi,[esi+14h] still addresses node+0x14 at mov [edi],edx.
 * No test eax after Register; no jz. BYTE OR bit0 is inside Register, not here.
 * Widths: DWORD 89 46 0C / 89 46 10 / 89 17 / 89 4E 18. WORD only 0F BF 11 movsx.
 * No 66. No BYTE store. node+0x0C is DWORD arg_0, not BYTE +0x0D.
 * Return EAX leftover = arg_4 (last mov eax before tail). Not ESI/node.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * No setcc / ja / jg / jpt / loc_ / domain::.
 */

extern int dword_2505588;
int __cdecl BdLinkTask_Register(int list_head, int callback);
int __cdecl FillDwords(void *dst, int val, unsigned int count);
int __cdecl sub_664D20(int node); /* tick callback; not this function */

int __cdecl BdLinkTask_Register_664D20(int arg_0, int arg_4, __int16 *arg_8)
{
    int node;
    int *cursor;
    int scaled;

    node = BdLinkTask_Register((int)&dword_2505588, (int)sub_664D20);
    cursor = (int *)(node + 0x14);              /* lea edi, [esi+14h] */
    FillDwords(cursor, 0, 9);                    /* 9 dwords from node+0x14 */
    *(int *)(node + 0x0C) = arg_0;              /* 89 46 0C DWORD */
    *(int *)(node + 0x10) = arg_4;              /* 89 46 10 DWORD */
    scaled = *arg_8;                             /* 0F BF 11 movsx edx, word [ecx] */
    scaled <<= 4;                               /* C1 E2 04 */
    *cursor = arg_4 + scaled;                     /* 03 D0 ; 89 17 [edi] */
    *(int *)(node + 0x18) = (int)(arg_8 + 1);    /* 83 C1 02 ; 89 4E 18 */
    return arg_4;
}
```
