# OutputDebugString_1 @ 0x403D99

- Instr (live): 33
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: void __cdecl OutputDebugString_1(LPCSTR lpOutputString)
- Notes parent: 3 jz (buf / [buf+0x918] / [buf+0x914]), pas ja/jg. DWORD only. OutputDebugString_2 add esp,8 (payload +0x91C ou 0). IAT OutputDebugStringA stdcall seulement si buf==0. Occupancy absente.

## C réconcilié

```c
/* OutputDebugString_1 @ 0x403D99
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 33 instr, size 0x60, end 0x403DF9. cdecl, 1 arg LPCSTR. EBP frame, push ecx var_4.
 * retn C3. No saved regs besides ebp. No 66 / setcc / ja / jg / jpt.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * JCC: three jz (74) zero-tests only: buf, DWORD [buf+0x918], DWORD [buf+0x914].
 * Widths: DWORD only (89/8B/83).
 * Callees: FFGetBufferAddress (0 args); OutputDebugString_2 add esp,8 twice;
 *   ds:OutputDebugStringA stdcall 1 arg (no add esp), only if buf==0.
 * If buf!=0 both flags 0: no sink call. If [buf+0x918]!=0: skip +0x914 path.
 * Void: leftover EAX ignored.
 */

int __cdecl FFGetBufferAddress(void);
void __cdecl OutputDebugString_2(LPCSTR lpOutputString, unsigned int *payload);
void __stdcall OutputDebugStringA(LPCSTR lpOutputString);

void __cdecl OutputDebugString_1(LPCSTR lpOutputString)
{
    int buf; /* [ebp-4] var_4 */

    buf = FFGetBufferAddress(); /* EAX */
    if (buf == 0) { /* cmp [ebp-4],0; jz loc_403DEB */
        OutputDebugStringA(lpOutputString); /* push arg; call ds:OutputDebugStringA */
        return; /* loc_403DF5 epilogue */
    }

    if (*(int *)(buf + 0x918) != 0) { /* cmp dword [eax+918h],0; jz loc_403DCF */
        /* push DWORD [buf+0x91C]; push lpOutputString; add esp,8 */
        OutputDebugString_2(lpOutputString, *(unsigned int **)(buf + 0x91C));
    } else if (*(int *)(buf + 0x914) != 0) { /* loc_403DCF: cmp dword [ecx+914h],0 */
        /* push 0; push lpOutputString; add esp,8 */
        OutputDebugString_2(lpOutputString, 0);
    }
    /* loc_403DE9: jmp loc_403DF5 — OutputDebugStringA never when buf!=0 */
}
```
