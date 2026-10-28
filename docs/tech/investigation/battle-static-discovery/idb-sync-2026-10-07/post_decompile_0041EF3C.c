// [idb-sync 2026-10-07] Native stage-0 SetTexture request, cdecl(texobj, device). device==NULL exits without a device call and without defining EAX: it is neither unbind nor HRESULT success. With device: texobj!=NULL passes *(texobj+0x0C) at 0x41EF5D; texobj==NULL passes NULL at 0x41EF72. Both call vtable+0x98 with three stdcall arguments (device, stage=0, texture); method EAX is propagated and must be preserved. The function itself ends in C3. SDK Device3 layout is compatible; the old D3D9 identification and unconditional return-0 pseudocode are not adopted. Requested/result-observed/applied remain distinct. texobj, its +0x0C device object, and its +0x98 data token are distinct. EA 0x41EF3C is a preferred VA; RVA is 0x1EF3C. No instrumentation is installed by this sync.
// Sources: docs/tech/investigation/battle-static-discovery/driver-passthrough/DOSSIER_lot23_stage0_depth.md; docs/tech/investigation/battle-static-discovery/decomp/0x41EF3C__sub_41EF3C.md
int __cdecl Gfx_SetTextureStage0(void *texobj, void *device)
{
  int result; // eax

  if ( device )
  {
    if ( texobj )
      return (*(int (__stdcall **)(void *, _DWORD, _DWORD))(*(_DWORD *)device + 152))(
               device,
               0,
               *((_DWORD *)texobj + 3));
    else
      return (*(int (__stdcall **)(void *, _DWORD, _DWORD))(*(_DWORD *)device + 152))(device, 0, 0);
  }
  return result;
}
