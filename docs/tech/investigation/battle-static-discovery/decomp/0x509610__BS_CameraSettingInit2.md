# BS_CameraSettingInit2 @ 0x509610

- Instr (live): 11
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: unsigned __int8 *BS_CameraSettingInit2(void)
- Notes parent: 0 args (pas fastcall). DWORD A1/A3 dword_1D99A34. add esp,10h = 4 args cdecl EvalUntilYield (cursor, DispatchVmOpcode, sub_509640, sub_5097C0). JZ saute call+store. Occupancy absente.

## C réconcilié

```c
/* BS_CameraSettingInit2 @ 0x509610
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 11 instr, size 0x27, end 0x509637. Live IDA type unsigned __int8 *__fastcall(int,int)
 * is wrong: 0 args, no ECX/EDX, FRSIZE=0, retn C3.
 * DWORD A1/A3 on dword_1D99A34. No 66 prefix. No BYTE/WORD stores.
 * call BattleScript_EvalUntilYield; add esp,10h (4 DWORD cdecl args).
 * Push RTL: sub_5097C0, sub_509640, BattleCamera_DispatchVmOpcode, EAX cursor.
 * JZ locret_509636 skips call and store. EAX leftover = 0 or callee EAX.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / GetRandomInt: absent.
 * No Hex-Rays. No domain::.
 */

extern unsigned char *dword_1D99A34; /* 0x1D99A34 camera VM IP, size 4 */

int __cdecl BattleCamera_DispatchVmOpcode(char opcode, int *p_cursor);
char __cdecl sub_509640(short id);
short __cdecl sub_5097C0(short id, short value);
unsigned char *__cdecl BattleScript_EvalUntilYield(
    unsigned char *cursor,
    int (__cdecl *dispatch)(char, int *),
    char (__cdecl *getter)(short),
    short (__cdecl *setter)(short, short));

unsigned char *BS_CameraSettingInit2(void)
{
    unsigned char *cursor;

    cursor = dword_1D99A34;
    if (cursor) {
        cursor = BattleScript_EvalUntilYield(
            cursor,
            BattleCamera_DispatchVmOpcode,
            sub_509640,
            sub_5097C0);
        dword_1D99A34 = cursor;
    }
    return cursor;
}
```
