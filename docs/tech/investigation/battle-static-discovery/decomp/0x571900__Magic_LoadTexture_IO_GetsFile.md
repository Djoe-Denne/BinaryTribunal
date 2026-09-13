# Magic_LoadTexture_IO_GetsFile @ 0x571900

- Instr (live): 219
- Palier: low
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=53
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=81
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=21
- A==B: non
- Push IDB: oui
- SetType: void *__cdecl Magic_LoadTexture_IO_GetsFile(const char *, void *, int, signed int *)
- Notes parent: path `\\FF8\\Data\\Magic\\`+name; VFS Archive_GetFile puis fopen rb. dest==0 heap AllocateMemory(extra+size) dav_aoy.cpp L117/153 + table 256 SIGNED jl. dest!=0 skip heap. out_size DWORD si >0 signed jle. fread=sub_55CC92. sprintf fail unused. Occupancy/0xD0/0x1D0/GF+0x44 absents.

## C réconcilié

```c
/* Magic_LoadTexture_IO_GetsFile @ 0x571900
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 219 instr, size 0x24D, end 0x571B4D. IDA type void *__cdecl(const char *, void *, int, signed int *).
 * cdecl, 4 args. Saved EBX EBP ESI EDI. sub esp,0C00h. retn C3.
 * FileName[0x400] @+0, Buffer[0x800] @+0x400. No packed file struct.
 * add esp: Archive 4; Seek 0Ch; Alloc 0Ch; VFS close 4; Copy+close 10h;
 * fopen 8; sprintf 0Ch; fseek+ftell 10h; fseek 0Ch; fclose 4; fread+fclose 14h.
 * DWORD stores only (C7 00 / 89 28 / table / A3 count). No 66 prefix.
 * memset F3 AB + F3 AA. strcpy/strcat F3 A5 + F3 A4. No setcc. No ja/jg (jl/jle signed). No jpt.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No domain::. Alloc file string is C:\FF8\Battle\aoy\jp\dav_aoy.cpp (not aoy.cpp).
 */

extern int g_MagicFileAllocCount;      /* 0x21DFABC DWORD */
extern void *g_MagicFileAllocTable[256]; /* 0x21DFAC0 stride *4 */

extern int __cdecl Archive_GetFile(const char *path);
extern int __cdecl Stream_SeekMode012_B8D480(int handle, int offset, int origin);
extern unsigned char *__cdecl AllocateMemory(unsigned int Size, const char *file, int line);
extern int __cdecl _UnknownFileSystem(int handle);
extern int __cdecl _CopyFileToMemory(int handle, void *dest, unsigned int size);
extern void *__cdecl _fopen(const char *FileName, const char *Mode);
extern int __cdecl _sprintf(char *Buffer, const char *Format, ...);
extern int __cdecl _fseek(void *Stream, int Offset, int Origin);
extern int __cdecl _ftell(void *Stream);
extern int __cdecl _fclose(void *Stream);
extern unsigned int __cdecl sub_55CC92(void *Buffer, unsigned int ElementSize, unsigned int ElementCount, void *Stream);
extern void *memset(void *s, int c, unsigned int n);
extern char *strcpy(char *dest, const char *src);
extern char *strcat(char *dest, const char *src);

void *__cdecl Magic_LoadTexture_IO_GetsFile(const char *name, void *dest, int extra_size, signed int *out_size)
{
    char FileName[0x400];
    char Buffer[0x800];
    int handle;
    int file_size;
    unsigned char *buf;
    unsigned int alloc_size;

    /* 8B 44 24 10; test; C7 00 00 00 00 00 DWORD *out_size = 0 */
    if (out_size)
        *out_size = 0;

    /* A1 count; cmp 100h; jl loc_571931 (signed). count>=256 => xor eax,eax return 0 */
    if (g_MagicFileAllocCount >= 0x100)
        return 0;

    strcpy(FileName, "\\FF8\\Data\\Magic\\");
    strcat(FileName, name);

    handle = Archive_GetFile(FileName); /* add esp,4 */
    if (handle != -1) {
        file_size = Stream_SeekMode012_B8D480(handle, 0, 2); /* SEEK_END add esp,0Ch */
        /* test out_size; test ebp; jle skip; 89 28 DWORD */
        if (out_size && file_size > 0)
            *out_size = file_size;
        Stream_SeekMode012_B8D480(handle, 0, 0); /* SEEK_SET add esp,0Ch */

        buf = (unsigned char *)dest;
        if (buf == 0) {
            alloc_size = (unsigned int)(extra_size + file_size); /* lea edi,[ecx+ebp] */
            buf = AllocateMemory(alloc_size, "C:\\FF8\\Battle\\aoy\\jp\\dav_aoy.cpp", 0x75);
            if (buf == 0) {
                _UnknownFileSystem(handle); /* add esp,4 */
                return 0;
            }
            g_MagicFileAllocTable[g_MagicFileAllocCount] = buf;
            g_MagicFileAllocCount++;
            memset(buf, 0, alloc_size); /* rep stosd / stosb */
        }

        _CopyFileToMemory(handle, buf, (unsigned int)file_size);
        _UnknownFileSystem(handle); /* add esp,10h pair */
        return buf;
    }

    /* loc_571A51 disk fallback */
    handle = (int)_fopen(FileName, "rb"); /* add esp,8; ebx=FILE* */
    if (handle == 0) {
        _sprintf(Buffer, "davAoyLoadMagicDataPlusBuffer: \"%s\" not found !!!\n", FileName);
        return 0; /* sprintf result discarded */
    }

    _fseek((void *)handle, 0, 2);
    file_size = _ftell((void *)handle); /* add esp,10h pair */
    if (out_size && file_size > 0)
        *out_size = file_size;
    _fseek((void *)handle, 0, 0); /* add esp,0Ch */

    buf = (unsigned char *)dest;
    if (buf == 0) {
        alloc_size = (unsigned int)(extra_size + file_size);
        buf = AllocateMemory(alloc_size, "C:\\FF8\\Battle\\aoy\\jp\\dav_aoy.cpp", 0x99);
        if (buf == 0) {
            _fclose((void *)handle);
            return 0;
        }
        g_MagicFileAllocTable[g_MagicFileAllocCount] = buf;
        g_MagicFileAllocCount++;
        memset(buf, 0, alloc_size);
    }

    sub_55CC92(buf, 1, (unsigned int)file_size, (void *)handle); /* fread */
    _fclose((void *)handle); /* add esp,14h pair */
    return buf;
}
```
