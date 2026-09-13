# Create_ff8input_cfg @ 0x498CB0

- Instr (live): 206
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=241
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=205
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=780
- A==B: non
- Push IDB: oui
- SetType: FILE *__cdecl Create_ff8input_cfg(const char *)
- Notes parent: Inverse de Read_ff8input_cfg. sprintf `%s\%s` dir+ff8input.cfg, fopen w. Keyboard dword_1D2A2C8[14] puis Joystick dword_1D2A290[14] (formats exacts dump). Codes off_B86010[256], skip repe cmpsb 5 octets "NONE\0", jl signe vs 0xB86410. add esp 18h/44h/48h/44h/48h/48h/8/10h/4. EAX fail=0 fopen, success leftover fclose. Occupancy/0xD0/0x1D0/0x44/0x84/0x9C absents. Pas de 66/setcc/jpt.

## C réconcilié

```c
/* Create_ff8input_cfg @ 0x498CB0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 206 instr, size 0x2BE, end 0x498F6E. IDA type FILE *__cdecl(const char *).
 * No EBP. sub/add esp,108h. Buffer 0x100 at local+8; var_108 DWORD index at local+4.
 * Callees: _sprintf 0x55ABD0, _fopen 0x55ACFD, _fprintf 0x55CC56, _fclose 0x55AC22.
 * add esp: 18h (sprintf+fopen), 44h / 48h / 44h / 48h / 48h (fprintf batches),
 *   8 (Codes header), 10h (codes line), 4 (fclose).
 * fopen fail: jz loc_498F66, EAX leftover 0, pop ebx only.
 * success: EAX leftover _fclose. pop edi/esi/ebp then loc_498F66.
 * Keyboard dword_1D2A2C8[14] read-only; Joystick dword_1D2A290[14] read-only.
 * Codes: off_B86010[256] char*, skip 5-byte "NONE\0" (repe cmpsb ecx=5),
 *   fprintf "%s   %i\n"; bound SIGNED jl vs 0xB86410. Stores DWORD var_108 only.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84 / 0x9C: absent.
 * No setcc. No ja/jg. No jpt. No 66. No domain::.
 */

typedef struct _iobuf FILE;

extern int __cdecl _sprintf(char *buffer, const char *format, ...);
extern FILE *__cdecl _fopen(const char *filename, const char *mode);
extern int __cdecl _fprintf(FILE *stream, const char *format, ...);
extern int __cdecl _fclose(FILE *stream);

extern int dword_1D2A2C8[14];
extern int dword_1D2A290[14];
extern char *off_B86010[256];

FILE *__cdecl Create_ff8input_cfg(const char *arg_0)
{
    char Buffer[256];
    FILE *stream;
    char **p;
    char *name;
    int index;

    _sprintf(Buffer, "%s\\%s", arg_0, "ff8input.cfg");
    stream = _fopen(Buffer, "w");
    if (!stream)
        return 0;

    _fprintf(stream, "Keyboard\n");
    _fprintf(stream, "1. \"Select\"   %i\n", dword_1D2A2C8[0]);
    _fprintf(stream, "2. \"Exit\"     %i\n", dword_1D2A2C8[1]);
    _fprintf(stream, "3. \"Misc\"     %i\n", dword_1D2A2C8[2]);
    _fprintf(stream, "4. \"Menu\"     %i\n", dword_1D2A2C8[3]);
    _fprintf(stream, "5. \"Toggle\"   %i\n", dword_1D2A2C8[4]);
    _fprintf(stream, "6. \"Trigger\"  %i\n", dword_1D2A2C8[5]);
    _fprintf(stream, "7. \"RotLt\"    %i\n", dword_1D2A2C8[6]);
    _fprintf(stream, "8. \"RotRt\"    %i\n", dword_1D2A2C8[7]);
    _fprintf(stream, "9. \"Start\"    %i\n", dword_1D2A2C8[8]);
    _fprintf(stream, "10. \"Select\"   %i\n", dword_1D2A2C8[9]);
    _fprintf(stream, "11. \"Up\"       %i\n", dword_1D2A2C8[10]);
    _fprintf(stream, "12. \"Down\"     %i\n", dword_1D2A2C8[11]);
    _fprintf(stream, "13. \"Left\"     %i\n", dword_1D2A2C8[12]);
    _fprintf(stream, "14. \"Right\"    %i\n", dword_1D2A2C8[13]);

    _fprintf(stream, "Joystick\n");
    _fprintf(stream, "1. \"Select\"   %i\n", dword_1D2A290[0]);
    _fprintf(stream, "2. \"Exit\"     %i\n", dword_1D2A290[1]);
    _fprintf(stream, "3. \"Misc\"     %i\n", dword_1D2A290[2]);
    _fprintf(stream, "4. \"Menu\"     %i\n", dword_1D2A290[3]);
    _fprintf(stream, "5. \"Toggle\"   %i\n", dword_1D2A290[4]);
    _fprintf(stream, "6. \"Trigger\"  %i\n", dword_1D2A290[5]);
    _fprintf(stream, "7. \"RotLt\"    %i\n", dword_1D2A290[6]);
    _fprintf(stream, "8. \"RotRt\"    %i\n", dword_1D2A290[7]);
    _fprintf(stream, "9. \"Start\"    %i\n", dword_1D2A290[8]);
    _fprintf(stream, "10. \"Select\"   %i\n", dword_1D2A290[9]);
    _fprintf(stream, "11. \"Up\"       %i\n", dword_1D2A290[10]);
    _fprintf(stream, "12. \"Down\"     %i\n", dword_1D2A290[11]);
    _fprintf(stream, "13. \"Left\"     %i\n", dword_1D2A290[12]);
    _fprintf(stream, "14. \"Right\"    %i\n", dword_1D2A290[13]);

    _fprintf(stream, "\nCodes\n\n");

    index = 0;
    p = off_B86010;
    do {
        name = *p;
        /* repe cmpsb ecx=5 vs "NONE\0"; jz loc_498F46 skips write */
        if (name[0] != 'N' || name[1] != 'O' || name[2] != 'N'
            || name[3] != 'E' || name[4] != '\0') {
            _fprintf(stream, "%s   %i\n", name, index);
        }
        p++;
        index++;
    } while ((int)p < (int)(off_B86010 + 256));

    return (FILE *)_fclose(stream);
}
```
