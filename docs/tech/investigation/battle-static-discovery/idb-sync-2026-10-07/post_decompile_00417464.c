// [semantic-triple 2026-09-17] CERTAIN 2+1/R: Gfx_ReserveDrawListEntries (IDA Gfx_AllocDrawListBatch too narrow). cdecl(count,list), EAX=0 iff list NULL else 1. Resets stale generation unsigned; allocates/chains 0x30 batch only when count>remaining; capacity=max(count,0x20); stream strides 0x80/0x10, shared path <=0x200; publishes +0x74/+0x78/+0x7C then advances cursors. Allocation NULL unchecked, faithful ASM. See docs/.../0x417464__Gfx_ReserveDrawListEntries.md.
// 
// [idb-sync 2026-10-07] Materialized the CERTAIN documented identity; historical symbol: Gfx_AllocDrawListBatch. Existing semantic evidence and uncertainty notes are preserved.
// Applied GfxBatch30 and typed list argument. Reservation publishes +0x74/+0x78/+0x7C before advancing +0x84/+0x88/+0x8C. Signed counts/strides and unsigned generation comparison are preserved.
// Sources: docs/tech/investigation/battle-static-discovery/decomp/0x417464__Gfx_ReserveDrawListEntries.md
int __cdecl Gfx_ReserveDrawListEntries(int count, GfxDrawList236 *list)
{
  int v2; // eax
  char *v4; // [esp+0h] [ebp-24h]
  char *v5; // [esp+4h] [ebp-20h]
  int v6; // [esp+14h] [ebp-10h]
  unsigned int *generation_ptr; // [esp+18h] [ebp-Ch]
  int v8; // [esp+1Ch] [ebp-8h]
  GfxBatch30 *current_node; // [esp+1Ch] [ebp-8h]
  int v10; // [esp+20h] [ebp-4h]

  v10 = 0;
  if ( list )
  {
    generation_ptr = list->generation_ptr;
    if ( list->generation_stamp < *generation_ptr )
    {
      list->used_count = 0;
      list->remaining_count = 0;
      list->current_node = 0;
      list->head = 0;
      list->tail = 0;
      list->palette_index = -1;
      list->generation_stamp = *generation_ptr;
    }
    if ( count > list->remaining_count )
    {
      v8 = sub_4247C5(*((_DWORD **)list->parent + 2));
      *(_DWORD *)(v8 + 44) = list;
      if ( list->head )
        list->tail->next = (struct GfxBatch30 *)v8;
      else
        list->head = (GfxBatch30 *)v8;
      list->tail = (GfxBatch30 *)v8;
      list->current_node = (GfxBatch30 *)v8;
      *(_DWORD *)v8 = 0;
      *(_DWORD *)(v8 + 8) = 0;
      *(_DWORD *)(v8 + 12) = 0;
      *(_DWORD *)(v8 + 24) = 0;
      if ( count <= 32 )
      {
        v6 = 32;
        v4 = sub_424A3B(32, *((char ***)list->parent + 3));
        *(_DWORD *)(v8 + 20) = v4;
        *(_DWORD *)(v8 + 32) = v4 + 4096;
        *(_DWORD *)(v8 + 40) = *(_DWORD *)(v8 + 32) + 512;
      }
      else
      {
        v6 = count;
        v5 = sub_424A3B(count, *((char ***)list->parent + 3));
        *(_DWORD *)(v8 + 20) = v5;
        *(_DWORD *)(v8 + 32) = &v5[128 * count];
        *(_DWORD *)(v8 + 40) = 16 * count + *(_DWORD *)(v8 + 32);
      }
      if ( count <= 512 )
        *(_DWORD *)(v8 + 32) = list->shared_stream1;
      else
        sub_4168AC(v6, *(_WORD **)(v8 + 32), list);
      *(_DWORD *)(v8 + 16) = *(_DWORD *)(v8 + 20);
      *(_DWORD *)(v8 + 28) = *(_DWORD *)(v8 + 32);
      *(_DWORD *)(v8 + 36) = *(_DWORD *)(v8 + 40);
      list->stream0_cursor = *(unsigned __int8 **)(v8 + 16);
      list->stream1_cursor = *(unsigned __int8 **)(v8 + 28);
      list->stream2_cursor = *(unsigned __int8 **)(v8 + 36);
      list->remaining_count = v6;
    }
    current_node = list->current_node;
    current_node->used_count += count;
    list->used_count += count;
    list->remaining_count -= count;
    list->reserved_stream0_begin = list->stream0_cursor;
    list->reserved_stream1_begin = list->stream1_cursor;
    list->reserved_stream2_begin = list->stream2_cursor;
    if ( count <= 1 )
    {
      list->stream0_cursor += list->stream0_cursor_stride;
      list->stream1_cursor += list->stream1_cursor_stride;
      ++list->stream2_cursor;
      current_node->stream0_bytes += list->stream0_accounting_stride;
      v2 = list->stream1_accounting_stride + current_node->stream1_bytes;
    }
    else
    {
      list->stream0_cursor += count * list->stream0_cursor_stride;
      list->stream1_cursor += count * list->stream1_cursor_stride;
      list->stream2_cursor += count;
      current_node->stream0_bytes += count * list->stream0_accounting_stride;
      v2 = count * list->stream1_accounting_stride + current_node->stream1_bytes;
    }
    current_node->stream1_bytes = v2;
    return 1;
  }
  return v10;
}
