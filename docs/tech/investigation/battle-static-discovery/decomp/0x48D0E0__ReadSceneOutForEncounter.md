# ReadSceneOutForEncounter @ 0x48D0E0

- Instr (live): 46
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=23
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=26
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=26
- A==B: non
- Push IDB: oui
- SetType: int __cdecl ReadSceneOutForEncounter(unsigned __int16 p_scene_id, int p_dest_buffer)
- Notes parent: strcpy MSVC vers FileNamePointer puis overlay DWORD/DWORD/WORD `scene.out\0` (66 sur le WORD). Offset `(id & 0xFFFF)<<7`, taille 0x80. LoadFile puis memcpy binaire ESI=src EDI=dst. `add esp,1Ch`. EAX leftover 0x80. Pas de slot/occupancy/RNG/setcc. Pas de Hex-Rays.

## C réconcilié

```c
/* ReadSceneOutForEncounter @ 0x48D0E0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 46 instr, size 0x8F. IDA type int __cdecl(unsigned __int16, int). No domain::.
 * No BATTLE_SLOT stride / occupancy / GetRandomInt / setcc / ja vs jg.
 * WORD stores use prefix 66 (mov ax / mov [edi+8], ax). Overlay dwords unprefixed.
 * add esp,1Ch cleans LoadFile (4) + memcpy (3). EAX leftover = 0x80 from memcpy.
 * 0x47E450 memcpy is ESI=src, EDI=dst (IDA names inverted vs CRT).
 */

extern char FILE_PATH_BATTLE_FOLDER[]; /* 0x1A77B6C char[260] */
extern char FileNamePointer[];         /* 0x1CFF724 scratch; IDA CHAR[15] */
extern unsigned int dword_B81500;      /* 0xB81500 */
extern unsigned int dword_B81504;      /* 0xB81504 */
extern unsigned short word_B81508;     /* 0xB81508 */
extern void *is_bufferTemp;            /* 0xB6D09C pointer global */

int __cdecl Archive_IO_LoadFile(char *FileName, int Offset, unsigned int MaxCharCount, void *DstBuf);
void __cdecl memcpy(const void *p_src, void *p_dst, signed int p_size);

int __cdecl ReadSceneOutForEncounter(unsigned __int16 p_scene_id, int p_dest_buffer)
{
    unsigned int saved_mid; /* edx = dword_B81504 before strcpy clobbers eax/ecx */
    char *src;
    char *dst;
    char *nul;
    unsigned int n;
    unsigned int offset;

    saved_mid = dword_B81504;

    /* MSVC strcpy(FileNamePointer, FILE_PATH_BATTLE_FOLDER):
     * or ecx,-1; xor eax,eax; repne scasb; not ecx; n = strlen+1;
     * then shr ecx,2 / rep movsd / and ecx,3 / rep movsb. */
    src = FILE_PATH_BATTLE_FOLDER;
    dst = FileNamePointer;
    n = 0;
    while (src[n] != '\0')
        n++;
    n++;
    while (n--)
        *dst++ = *src++;

    /* edi = FileNamePointer; or ecx,-1; repne scasb; dec edi → first NUL */
    nul = FileNamePointer;
    while (*nul != '\0')
        nul++;

    /* Overlay "scene.out\0" at that NUL: DWORD, DWORD, WORD (66 prefix). */
    *(unsigned int *)nul = dword_B81500;
    *(unsigned int *)(nul + 4) = saved_mid;
    *(unsigned short *)(nul + 8) = word_B81508;

    /* [esp+14h] after 4 pushes; and edx,0FFFFh; shl edx,7 */
    offset = ((unsigned int)p_scene_id & 0xFFFFu) << 7;
    Archive_IO_LoadFile(FileNamePointer, (int)offset, 0x80u, is_bufferTemp);

    /* push 80h; push p_dest_buffer [esp+20h]; push is_bufferTemp */
    memcpy(is_bufferTemp, (void *)p_dest_buffer, 0x80);

    return 0x80;
}
```
