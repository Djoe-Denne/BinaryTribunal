// [semantic-triple 2026-09-17] CERTAIN 2+1/R: Gfx_CreateDrawList. cdecl(5), EAX=GfxDrawList236*/NULL. type 0x11->0x0C for dispatch while obj+0 keeps original; alloc/zero 0xEC; creates TIM/texture handle, identity transform, owner slot subobject, reciprocal dimensions for types 4-7/12-15, then binds callbacks. Parent: switch bounds JA unsigned; desc+0x14 SETNLE signed >0; owner table stride 0x4; all callees/callers checked. See docs/.../decomp/0x416D82__Gfx_CreateDrawList.md.
// 
// [idb-sync 2026-10-07] Typed return is the allocated 0xEC-byte GfxDrawList236, not float*. Five cdecl arguments retained; mode/descriptor/owner internals stay opaque. Original list type is stored even when dispatch normalizes 0x11 to 0x0C.
// Sources: docs/tech/investigation/battle-static-discovery/decomp/0x416D82__Gfx_CreateDrawList.md
GfxDrawList236 *__cdecl Gfx_CreateDrawList(int mode, int list_type, void *desc, const char *tim_path, void *owner)
{
  size_t *v5; // eax
  size_t *v6; // eax
  _DWORD v8[4]; // [esp+10h] [ebp-198h] BYREF
  int v9; // [esp+20h] [ebp-188h]
  char *v10; // [esp+24h] [ebp-184h]
  _DWORD v11[16]; // [esp+28h] [ebp-180h] BYREF
  _DWORD *v12; // [esp+68h] [ebp-140h]
  _DWORD v13[4]; // [esp+6Ch] [ebp-13Ch] BYREF
  _DWORD v14[4]; // [esp+7Ch] [ebp-12Ch] BYREF
  int v15; // [esp+8Ch] [ebp-11Ch]
  char v16[256]; // [esp+90h] [ebp-118h] BYREF
  int bind_id; // [esp+190h] [ebp-18h]
  int v18; // [esp+194h] [ebp-14h]
  int *v19; // [esp+198h] [ebp-10h]
  int v20; // [esp+19Ch] [ebp-Ch]
  int v21; // [esp+1A0h] [ebp-8h]
  _DWORD *v22; // [esp+1A4h] [ebp-4h]

  v18 = 1;
  v20 = 1;
  v21 = list_type;
  v19 = 0;
  if ( list_type == 17 )
    list_type = 12;
  if ( desc && owner )
  {
    bind_id = 0;
    switch ( list_type )
    {
      case 0:
      case 2:
      case 4:
      case 6:
      case 8:
      case 10:
      case 12:
      case 14:
        v15 = 0;
        break;
      case 1:
      case 3:
      case 5:
      case 7:
      case 9:
      case 11:
      case 13:
      case 15:
        v15 = 1;
        break;
      case 18:
      case 19:
        v15 = 0;
        break;
      default:
        v15 = 0;
        break;
    }
    switch ( list_type )
    {
      case 0:
      case 1:
      case 8:
      case 9:
        v22 = sub_4074F7(0, (int)desc);
        break;
      case 2:
      case 3:
      case 10:
      case 11:
        v22 = sub_4074F7(1, (int)desc);
        break;
      case 4:
      case 5:
      case 12:
      case 13:
        if ( *((_DWORD *)desc + 11) )
        {
          v22 = (_DWORD *)sub_40766C(bind_id, 0, *((_DWORD *)desc + 12), (int)desc);
        }
        else
        {
          if ( *((_DWORD *)desc + 9) )
            sub_42F0F6((int)desc + 72, *((const CHAR **)desc + 9), v16);
          v22 = TIMrelated_0(bind_id, 0, (char *)tim_path, (int *)desc, *((_DWORD *)owner + 27));
          if ( *((_DWORD *)desc + 9) )
            sub_42F0F6((int)desc + 72, v16, 0);
        }
        if ( sub_416CE9(v14, v19) )
        {
          *((float *)v19 + 10) = CONST_1_0 / (double)v14[2];
          *((float *)v19 + 11) = CONST_1_0 / (double)v14[3];
        }
        break;
      case 6:
      case 7:
      case 14:
      case 15:
        if ( *((_DWORD *)desc + 11) )
        {
          v22 = (_DWORD *)sub_40766C(bind_id, 1, *((_DWORD *)desc + 12), (int)desc);
        }
        else
        {
          if ( *((_DWORD *)desc + 9) )
            sub_42F0F6((int)desc + 72, *((const CHAR **)desc + 9), v16);
          v22 = TIMrelated_0(bind_id, 1, (char *)tim_path, (int *)desc, *((_DWORD *)owner + 27));
          if ( *((_DWORD *)desc + 9) )
            sub_42F0F6((int)desc + 72, v16, 0);
        }
        if ( sub_416CE9(v13, v19) )
        {
          *((float *)v19 + 10) = CONST_1_0 / (double)v13[2];
          *((float *)v19 + 11) = CONST_1_0 / (double)v13[3];
        }
        break;
      case 18:
        v22 = sub_4074F7(0, (int)desc);
        v20 = 0;
        break;
      case 19:
        v22 = sub_4074F7(1, (int)desc);
        v20 = 0;
        break;
      default:
        break;
    }
    if ( v22 )
    {
      v19 = (int *)sub_4247C5(*(_DWORD **)owner);
      if ( v19 )
      {
        memset_0(0xECu, v19);
        Mat4F32_Identity(v11);
        sub_417996(0, v11, v19);
        *v19 = v21;
        v19[4] = (int)v22;
        v19[1] = *((_DWORD *)desc + 5) > 0;
        v19[3] = *((_DWORD *)desc + 11);
        v19[7] = 1;
        if ( *((_DWORD *)desc + 10) )
          v19[7] = 0;
        v19[12] = (int)owner;
        v19[13] = *(_DWORD *)(*((_DWORD *)owner + 27) + 840);
        if ( *((_DWORD *)desc + 6) )
          v19[13] = *((_DWORD *)desc + 6);
        v12 = 0;
        if ( v20 )
          v12 = *((_DWORD **)owner + list_type + 4);
        if ( v12 )
        {
          v10 = sub_412883(*((_DWORD *)desc + 5));
          if ( v10 )
          {
            v9 = Mat4F32_AllocIdentity();
            if ( v9 )
              Thunk_BufApp_Off72(0, v9, (int)v10, *((_DWORD *)owner + 27));
            v19[5] = (int)v10;
            v5 = sub_41E1AF((size_t)v10, (size_t)v22, v12, desc, *((_DWORD *)owner + 27));
            v19[6] = (int)v5;
            if ( v19[6] )
            {
              *(_DWORD *)(v19[6] + 32) = v15;
              if ( v19[1] )
                *(_DWORD *)(v19[6] + 24) = 1;
              *(_DWORD *)(v19[6] + 4) = mode;
              v18 = 0;
            }
          }
        }
        else
        {
          v6 = sub_41E1AF(0, (size_t)v22, 0, desc, *((_DWORD *)owner + 27));
          v19[6] = (int)v6;
          if ( v19[6] )
            v18 = 0;
        }
        switch ( list_type )
        {
          case 4:
          case 5:
          case 6:
          case 7:
          case 12:
          case 13:
          case 14:
          case 15:
            if ( sub_416CE9(v8, v19) )
            {
              *((float *)v19 + 10) = CONST_1_0 / (double)v8[2];
              *((float *)v19 + 11) = CONST_1_0 / (double)v8[3];
            }
            break;
          default:
            break;
        }
        Gfx_BindDrawListBackendCallbacks(*((_DWORD *)desc + 13), v19);
      }
      if ( v18 )
      {
        sub_416C1E(v19);
        v19 = 0;
        OutputDebugString_1(aErrorCouldNotC);
      }
    }
  }
  return (GfxDrawList236 *)v19;
}
