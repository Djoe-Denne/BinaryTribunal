# Gfx_SubmitViewportLists @ 0x499EA0

- Instr (live): 106
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=31
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=799
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=5
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Gfx_SubmitViewportLists(void)
- Notes parent: queue gfx/input en fin de lot 2. Slot stride 0x14 (pas 0xD0). BL BYTE on_main. [esi+6] BYTE. 4x WORD movsx viewport. DWORD [esi-0Ah] list. jz + signed jle then jl. RS(2,0/1) around walk. Tail B8 inv-only, CC/D4 walk+inv. count DWORD=0. EAX leftover Invalidate(D4). Occupancy 1+2 absent. Shared field/battle/menu/world.

## C réconcilié

```c
/* Gfx_SubmitViewportLists @ 0x499EA0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 106 instr, size 0x130, end 0x499FD0. IDA type int(). cdecl 0 args. retn C3.
 * Saved EDI=buffer, BL=on_main (BYTE), EBP=signed slot, ESI=cursor (loop only).
 * No sub esp. Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * Slot stride HERE is 0x14 (add esi,14h). No 66. No setcc. jle/jl signed.
 * add esp: 14h (sub_499A80) / 14h (each set_viewport) / 20h (RS+Walk+RS) / 1Ch tail.
 * EAX leftover from last Gfx_InvalidateDrawListStamp(dword_1D2B0D4).
 * No domain::.
 */

extern int dword_1D2A6F4; /* DWORD slot count; stored 0 after the loop */
extern short word_1D2A312; /* ESI start; WORD height at [esi]; array stride 0x14 */
extern int Render_X_Axis;
extern int Render_Y_Axis;
extern int Render_width;
extern int Render_Height;
extern int dword_1D2B0B8; /* invalidate only */
extern int dword_1D2B0CC; /* walk then invalidate */
extern int dword_1D2B0D4; /* walk then invalidate */

int __cdecl FFGetBufferAddress(void);
void __cdecl sub_499A80(char a1, short a2, short a3, short a4, short a5);
int __cdecl gfx_driver_set_viewport_sub_41E070(int x, int y, int w, int h, int buffer);
void __cdecl Gfx_SetRenderState(unsigned int type, int value, int buffer);
int __cdecl Gfx_WalkDrawList(int list, int buffer);
int __cdecl Gfx_InvalidateDrawListStamp(int list);

int __cdecl Gfx_SubmitViewportLists(void)
{
    int buffer;              /* EDI */
    unsigned char on_main;   /* BL, B3 01 / 32 DB / 84 DB */
    int slot;                /* EBP, signed */
    unsigned char *cursor;  /* ESI = &word_1D2A312, add 0x14 */
    int count;

    buffer = FFGetBufferAddress();
    on_main = 1; /* mov bl,1 before the call; EBX callee-saved */
    sub_499A80(0, 0, 0, 0, 0); /* five push 0; add esp,14h */

    count = dword_1D2A6F4;
    if (count != 0 && count > 0) { /* jz loc_499F5B then signed jle loc_499F5B */
        slot = 0;
        cursor = (unsigned char *)&word_1D2A312;
        do { /* loc_499EDB */
            if (cursor[6] != 0) { /* BYTE [esi+6] = byte_1D2A318 */
                gfx_driver_set_viewport_sub_41E070(
                    (int)*(short *)(cursor - 6), /* word_1D2A30C x, movsx */
                    (int)*(short *)(cursor - 4), /* word_1D2A30E y */
                    (int)*(short *)(cursor - 2), /* word_1D2A310 w */
                    (int)*(short *)cursor,        /* word_1D2A312 h */
                    buffer);
                on_main = 0; /* xor bl,bl ; jmp loc_499F2C */
            } else { /* loc_499F02: test bl,bl ; jnz loc_499F2C */
                if (on_main == 0) {
                    gfx_driver_set_viewport_sub_41E070(
                        Render_X_Axis,
                        Render_Y_Axis,
                        Render_width,
                        Render_Height,
                        buffer);
                    on_main = 1;
                }
            }

            /* loc_499F2C */
            Gfx_SetRenderState(2, 0, buffer);
            Gfx_WalkDrawList(*(int *)(cursor - 0x0A), buffer); /* DWORD [esi-0Ah] */
            Gfx_SetRenderState(2, 1, buffer);

            count = dword_1D2A6F4; /* re-read after RS; add esp,20h */
            ++slot;
            cursor += 0x14;
        } while (slot < count); /* signed jl loc_499EDB ; then pop esi */
    }

    /* loc_499F5B: test bl,bl ; mov dword_1D2A6F4, 0 (C7 05, flags kept) ; jnz loc_499F8C */
    dword_1D2A6F4 = 0;
    if (on_main == 0) {
        gfx_driver_set_viewport_sub_41E070(
            Render_X_Axis,
            Render_Y_Axis,
            Render_width,
            Render_Height,
            buffer);
    }

    /* loc_499F8C */
    Gfx_InvalidateDrawListStamp(dword_1D2B0B8);
    Gfx_WalkDrawList(dword_1D2B0CC, buffer);
    Gfx_InvalidateDrawListStamp(dword_1D2B0CC);
    Gfx_WalkDrawList(dword_1D2B0D4, buffer);
    return Gfx_InvalidateDrawListStamp(dword_1D2B0D4);
}
```
