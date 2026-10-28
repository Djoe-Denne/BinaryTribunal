// [glm-triple 2026-09-15]
// /* Gfx_WalkDrawList @ 0x4178D7
//  * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
//  * 65 instr, size 0xBF, end 0x417996. cdecl, 2 args, retn C3. Callers add esp,8.
//  * Frame: push ebp / mov ebp,esp / sub esp,10h.
//  * JCC: jz (list==0, ctx+3Ch==0, var_10==0, head==0, setup==0) / jnz (stamp mismatch, loop).
//  * No ja/jg/setcc/jpt. Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
//  * Width: all DWORD (83 7D/78/B9, 3B 08, 8B/89, 8B 11). No 66 prefix.
//  * Indirect cdecl: [list+9Ch] setup once, [list+0A0h] walk per node; add esp,0Ch each.
//  * Walk +0xA0 not null-checked. generation_ptr +0x34 not null-checked.
//  * var_10 (ctx+38h/3Ch/68h) written then dead. void: EAX leftover.
//  */
// 
// void __cdecl Gfx_WalkDrawList(_DWORD *list, int cookie)
// {
//     _DWORD *generation_ptr;                  /* var_C  [ebp-0Ch] */
//     _DWORD *node;                            /* var_8  [ebp-8]   */
//     _DWORD *ctx;                             /* var_4  [ebp-4]   */
//     _DWORD var_10;                           /* [ebp-10h] dead after loc_417936 */
// 
//     if (list == 0)                           /* 83 7D 08 00 ; jz loc_417992 */
//         return;
// 
//     generation_ptr = (_DWORD *)list[0x34 / 4]; /* 8B 48 34 */
//     if (list[0x58 / 4] != *generation_ptr)   /* 8B 4A 58 ; 3B 08 ; jnz loc_417992 */
//         return;
// 
//     ctx = (_DWORD *)list[0x18 / 4];          /* 8B 42 18 */
// 
//     var_10 = ctx[0x38 / 4];                  /* 8B 51 38 */
//     if (ctx[0x3C / 4] != 0)                  /* 83 78 3C 00 ; jz loc_417936 */
//     {
//         var_10 = ctx[0x68 / 4];              /* 8B 51 68 */
//         if (var_10 == 0)                     /* 83 7D F0 00 ; jz loc_41792D */
//             var_10 = ctx[0x38 / 4];          /* loc_41792D: 8B 48 38 */
//     }
// 
//     node = (_DWORD *)list[0x94 / 4];         /* 8B 82 94 00 00 00 head +148 */
//     if (node == 0)                           /* 83 7D F8 00 ; jz loc_417992 */
//         return;
// 
//     if (list[0x9C / 4] == 0)                 /* 83 B9 9C 00 00 00 00 ; jz */
//         return;
// 
//     ((void (__cdecl *)(_DWORD *, _DWORD *, int))list[0x9C / 4])(ctx, node, cookie);
//                                              /* push cookie, node, ctx ; add esp,0Ch */
// 
//     do                                       /* loc_41796C: first node = same head */
//     {
//         ((void (__cdecl *)(_DWORD *, _DWORD *, int))list[0xA0 / 4])(ctx, node, cookie);
//                                              /* add esp,0Ch ; +0xA0 not null-checked */
//         node = (_DWORD *)*node;              /* 8B 11 DWORD next at node+0 */
//     } while (node != 0);                     /* 83 7D F8 00 ; jnz loc_41796C */
// }
// [semantic-triple 2026-09-15]
// Traversee gardee GfxDrawList236: stamp gen +0x58 == *(+0x34); setup [+0x9C] une fois (ctx=list+0x18, 3 args cdecl), walk [+0xA0] par noeud liste chainee depuis +0x94, NULL-termine. Garde: list==0, stamp mismatch, head==0, setup==0. Cookie = retour FFGetBufferAddress (opaque). CERTAIN 1+P. Callers: Gfx_Submit* x20+, sub_4B3690. Wiki aligne (GfxDrawList 0xEC: +52 gen,+88 stamp,+148 head,+156 setup,+160 walk).
// 
// [driver-passthrough lot21 2026-10-02] The linked-node walk preserves order inside one GfxDrawList only. It cannot reconstruct relative order between TPage/pass lists. Lot21 host-order replay obscures nearly all actors, which is capture-based offline negative evidence against treating captured submission order as a global painter order.
// 
// [idb-sync 2026-10-07] Typed draw-list and opaque engine/cookie pointer; two cdecl arguments, setup callback once and walk callback per linked GfxBatch30. Function has no meaningful return.
// Sources: docs/tech/investigation/battle-static-discovery/decomp/0x4178D7__Gfx_WalkDrawList.md
void __cdecl Gfx_WalkDrawList(GfxDrawList236 *list, void *cookie)
{
  GfxBatch30 *head; // [esp+8h] [ebp-8h]
  void *gpu_context; // [esp+Ch] [ebp-4h]

  if ( list )
  {
    if ( list->generation_stamp == *list->generation_ptr )
    {
      gpu_context = list->gpu_context;
      head = list->head;
      if ( head )
      {
        if ( list->setup_callback )
        {
          ((void (__cdecl *)(void *, GfxBatch30 *, void *))list->setup_callback)(gpu_context, head, cookie);
          do
          {
            ((void (__cdecl *)(void *, GfxBatch30 *, void *))list->walk_callback)(gpu_context, head, cookie);
            head = head->next;
          }
          while ( head );
        }
      }
    }
  }
}
