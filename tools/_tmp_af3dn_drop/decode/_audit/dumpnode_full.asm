  100019D0: 83 EC 48           sub         esp,48h
  100019D3: 33 C0              xor         eax,eax
  100019D5: 53                 push        ebx
  100019D6: 56                 push        esi
  100019D7: 33 DB              xor         ebx,ebx
  100019D9: 89 44 24 34        mov         dword ptr [esp+34h],eax
  100019DD: 57                 push        edi
  100019DE: 33 FF              xor         edi,edi
  100019E0: 89 44 24 10        mov         dword ptr [esp+10h],eax
  100019E4: 89 44 24 34        mov         dword ptr [esp+34h],eax
  100019E8: 33 F6              xor         esi,esi
  100019EA: 89 44 24 14        mov         dword ptr [esp+14h],eax
  100019EE: 89 44 24 2C        mov         dword ptr [esp+2Ch],eax
  100019F2: 89 44 24 0C        mov         dword ptr [esp+0Ch],eax
  100019F6: 89 44 24 30        mov         dword ptr [esp+30h],eax
  100019FA: A1 B4 4E 05 14     mov         eax,dword ptr ds:[14054EB4h]
  100019FF: 89 7C 24 20        mov         dword ptr [esp+20h],edi
  10001A03: 89 5C 24 1C        mov         dword ptr [esp+1Ch],ebx
  10001A07: 89 5C 24 24        mov         dword ptr [esp+24h],ebx
  10001A0B: 89 74 24 28        mov         dword ptr [esp+28h],esi
  10001A0F: 85 C0              test        eax,eax
  10001A11: 0F 84 BF 03 00 00  je          10001DD6
  10001A17: 39 05 B0 4E 05 14  cmp         dword ptr ds:[14054EB0h],eax
  10001A1D: 0F 87 B3 03 00 00  ja          10001DD6
  10001A23: 39 1D C8 4E 05 14  cmp         dword ptr ds:[14054EC8h],ebx
  10001A29: 0F 85 A7 03 00 00  jne         10001DD6
  10001A2F: 81 3D B8 4E 05 14  cmp         dword ptr ds:[14054EB8h],1000h
            00 10 00 00
  10001A39: 72 11              jb          10001A4C
  10001A3B: 5F                 pop         edi
  10001A3C: 5E                 pop         esi
  10001A3D: C7 05 C8 4E 05 14  mov         dword ptr ds:[14054EC8h],1
            01 00 00 00
  10001A47: 5B                 pop         ebx
  10001A48: 83 C4 48           add         esp,48h
  10001A4B: C3                 ret
  10001A4C: 55                 push        ebp
  10001A4D: 8B 6C 24 64        mov         ebp,dword ptr [esp+64h]
  10001A51: 85 ED              test        ebp,ebp
  10001A53: 0F 84 7C 03 00 00  je          10001DD5
  10001A59: 6A 18              push        18h
  10001A5B: 8D 44 24 44        lea         eax,[esp+44h]
  10001A5F: 55                 push        ebp
  10001A60: 50                 push        eax
  10001A61: E8 2A FE FF FF     call        10001890
  10001A66: 83 C4 0C           add         esp,0Ch
  10001A69: 85 C0              test        eax,eax
  10001A6B: 0F 84 A8 01 00 00  je          10001C19
  10001A71: 8B 44 24 5C        mov         eax,dword ptr [esp+5Ch]
  10001A75: 83 C0 D0           add         eax,0FFFFFFD0h
  10001A78: 83 F8 10           cmp         eax,10h
  10001A7B: 0F 87 A6 01 00 00  ja          10001C27
  10001A81: 0F B6 80 EC 1D 00  movzx       eax,byte ptr [eax+10001DECh]
            10
  10001A88: FF 24 85 E0 1D 00  jmp         dword ptr [eax*4+10001DE0h]
            10
  10001A8F: 8D 44 24 24        lea         eax,[esp+24h]
  10001A93: BE 02 00 00 00     mov         esi,2
  10001A98: 50                 push        eax
  10001A99: 8D 45 0C           lea         eax,[ebp+0Ch]
  10001A9C: 89 74 24 20        mov         dword ptr [esp+20h],esi
  10001AA0: 50                 push        eax
  10001AA1: E8 3A F9 FF FF     call        100013E0
  10001AA6: 83 C4 08           add         esp,8
  10001AA9: 85 C0              test        eax,eax
  10001AAB: 0F 84 68 01 00 00  je          10001C19
  10001AB1: 8D 44 24 28        lea         eax,[esp+28h]
  10001AB5: 50                 push        eax
  10001AB6: 8D 45 18           lea         eax,[ebp+18h]
  10001AB9: 50                 push        eax
  10001ABA: E8 21 F9 FF FF     call        100013E0
  10001ABF: 83 C4 08           add         esp,8
  10001AC2: 85 C0              test        eax,eax
  10001AC4: 0F 84 4F 01 00 00  je          10001C19
  10001ACA: 8D 44 24 14        lea         eax,[esp+14h]
  10001ACE: 50                 push        eax
  10001ACF: 8D 45 14           lea         eax,[ebp+14h]
  10001AD2: 50                 push        eax
  10001AD3: E8 08 F9 FF FF     call        100013E0
  10001AD8: 83 C4 08           add         esp,8
  10001ADB: 85 C0              test        eax,eax
  10001ADD: 0F 84 36 01 00 00  je          10001C19
  10001AE3: 8D 44 24 18        lea         eax,[esp+18h]
  10001AE7: 50                 push        eax
  10001AE8: 8D 45 20           lea         eax,[ebp+20h]
  10001AEB: 50                 push        eax
  10001AEC: E8 EF F8 FF FF     call        100013E0
  10001AF1: 83 C4 08           add         esp,8
  10001AF4: 85 C0              test        eax,eax
  10001AF6: 0F 84 1D 01 00 00  je          10001C19
  10001AFC: 8B 5C 24 28        mov         ebx,dword ptr [esp+28h]
  10001B00: 8B 7C 24 24        mov         edi,dword ptr [esp+24h]
  10001B04: 89 5C 24 20        mov         dword ptr [esp+20h],ebx
  10001B08: E9 DC 00 00 00     jmp         10001BE9
  10001B0D: 8D 44 24 30        lea         eax,[esp+30h]
  10001B11: C7 44 24 1C 02 00  mov         dword ptr [esp+1Ch],2
            00 00
  10001B19: 50                 push        eax
  10001B1A: 8D 45 08           lea         eax,[ebp+8]
  10001B1D: 50                 push        eax
  10001B1E: E8 BD F8 FF FF     call        100013E0
  10001B23: 83 C4 08           add         esp,8
  10001B26: 85 C0              test        eax,eax
  10001B28: 0F 84 EB 00 00 00  je          10001C19
  10001B2E: 8D 44 24 10        lea         eax,[esp+10h]
  10001B32: 50                 push        eax
  10001B33: 8D 45 2C           lea         eax,[ebp+2Ch]
  10001B36: 50                 push        eax
  10001B37: E8 A4 F8 FF FF     call        100013E0
  10001B3C: 83 C4 08           add         esp,8
  10001B3F: 85 C0              test        eax,eax
  10001B41: 0F 84 D2 00 00 00  je          10001C19
  10001B47: 8D 44 24 14        lea         eax,[esp+14h]
  10001B4B: 50                 push        eax
  10001B4C: 8D 45 14           lea         eax,[ebp+14h]
  10001B4F: 50                 push        eax
  10001B50: E8 8B F8 FF FF     call        100013E0
  10001B55: 83 C4 08           add         esp,8
  10001B58: 85 C0              test        eax,eax
  10001B5A: 0F 84 B9 00 00 00  je          10001C19
  10001B60: 8D 44 24 18        lea         eax,[esp+18h]
  10001B64: 50                 push        eax
  10001B65: 8D 45 20           lea         eax,[ebp+20h]
  10001B68: 50                 push        eax
  10001B69: E8 72 F8 FF FF     call        100013E0
  10001B6E: 83 C4 08           add         esp,8
  10001B71: 85 C0              test        eax,eax
  10001B73: 0F 84 A0 00 00 00  je          10001C19
  10001B79: 8B 44 24 10        mov         eax,dword ptr [esp+10h]
  10001B7D: 85 C0              test        eax,eax
  10001B7F: 74 27              je          10001BA8
  10001B81: 8D 4C 24 2C        lea         ecx,[esp+2Ch]
  10001B85: 83 C0 3C           add         eax,3Ch
  10001B88: 51                 push        ecx
  10001B89: 50                 push        eax
  10001B8A: E8 51 F8 FF FF     call        100013E0
  10001B8F: 8D 44 24 3C        lea         eax,[esp+3Ch]
  10001B93: 50                 push        eax
  10001B94: 8B 44 24 1C        mov         eax,dword ptr [esp+1Ch]
  10001B98: 83 C0 40           add         eax,40h
  10001B9B: 50                 push        eax
  10001B9C: E8 3F F8 FF FF     call        100013E0
  10001BA1: 8B 74 24 3C        mov         esi,dword ptr [esp+3Ch]
  10001BA5: 83 C4 10           add         esp,10h
  10001BA8: 8B 4C 24 30        mov         ecx,dword ptr [esp+30h]
  10001BAC: 85 C9              test        ecx,ecx
  10001BAE: 74 34              je          10001BE4
  10001BB0: 85 F6              test        esi,esi
  10001BB2: 74 12              je          10001BC6
  10001BB4: 33 D2              xor         edx,edx
  10001BB6: B8 00 10 00 00     mov         eax,1000h
  10001BBB: F7 F6              div         eax,esi
  10001BBD: 3B C8              cmp         ecx,eax
  10001BBF: 77 05              ja          10001BC6
  10001BC1: 8B FE              mov         edi,esi
  10001BC3: 0F AF F9           imul        edi,ecx
  10001BC6: 8B 74 24 34        mov         esi,dword ptr [esp+34h]
  10001BCA: 85 F6              test        esi,esi
  10001BCC: 74 16              je          10001BE4
  10001BCE: 33 D2              xor         edx,edx
  10001BD0: B8 00 40 00 00     mov         eax,4000h
  10001BD5: F7 F6              div         eax,esi
  10001BD7: 3B C8              cmp         ecx,eax
  10001BD9: 77 09              ja          10001BE4
  10001BDB: 8B DE              mov         ebx,esi
  10001BDD: 0F AF D9           imul        ebx,ecx
  10001BE0: 89 5C 24 20        mov         dword ptr [esp+20h],ebx
  10001BE4: BE 02 00 00 00     mov         esi,2
  10001BE9: 85 FF              test        edi,edi
  10001BEB: 75 0A              jne         10001BF7
  10001BED: 85 DB              test        ebx,ebx
  10001BEF: 0F 84 E0 01 00 00  je          10001DD5
  10001BF5: EB 08              jmp         10001BFF
  10001BF7: 81 FF 00 10 00 00  cmp         edi,1000h
  10001BFD: 77 6F              ja          10001C6E
  10001BFF: 81 FB 00 40 00 00  cmp         ebx,4000h
  10001C05: 77 67              ja          10001C6E
  10001C07: 8B 44 24 14        mov         eax,dword ptr [esp+14h]
  10001C0B: 89 44 24 3C        mov         dword ptr [esp+3Ch],eax
  10001C0F: 8B 44 24 18        mov         eax,dword ptr [esp+18h]
  10001C13: 89 44 24 38        mov         dword ptr [esp+38h],eax
  10001C17: EB 14              jmp         10001C2D
  10001C19: FF 05 A8 4E 05 14  inc         dword ptr ds:[14054EA8h]
  10001C1F: 5D                 pop         ebp
  10001C20: 5F                 pop         edi
  10001C21: 5E                 pop         esi
  10001C22: 5B                 pop         ebx
  10001C23: 83 C4 48           add         esp,48h
  10001C26: C3                 ret
  10001C27: 33 F6              xor         esi,esi
  10001C29: 89 74 24 1C        mov         dword ptr [esp+1Ch],esi
  10001C2D: 8D 0C 1B           lea         ecx,[ebx+ebx]
  10001C30: B8 04 00 00 00     mov         eax,4
  10001C35: 8B D9              mov         ebx,ecx
  10001C37: 89 4C 24 10        mov         dword ptr [esp+10h],ecx
  10001C3B: 83 E3 03           and         ebx,3
  10001C3E: 2B C3              sub         eax,ebx
  10001C40: F7 DB              neg         ebx
  10001C42: 1B DB              sbb         ebx,ebx
  10001C44: 23 D8              and         ebx,eax
  10001C46: 83 FE 02           cmp         esi,2
  10001C49: 75 37              jne         10001C82
  10001C4B: 8B C7              mov         eax,edi
  10001C4D: C1 E0 05           shl         eax,5
  10001C50: 8D 50 40           lea         edx,[eax+40h]
  10001C53: 8D 70 20           lea         esi,[eax+20h]
  10001C56: 03 D3              add         edx,ebx
  10001C58: 03 F3              add         esi,ebx
  10001C5A: 03 D1              add         edx,ecx
  10001C5C: 03 F1              add         esi,ecx
  10001C5E: 89 54 24 18        mov         dword ptr [esp+18h],edx
  10001C62: 89 74 24 34        mov         dword ptr [esp+34h],esi
  10001C66: 81 FA 00 00 04 00  cmp         edx,40000h
  10001C6C: 76 25              jbe         10001C93
  10001C6E: FF 05 AC 4E 05 14  inc         dword ptr ds:[14054EACh]
  10001C74: FF 05 C4 4E 05 14  inc         dword ptr ds:[14054EC4h]
  10001C7A: 5D                 pop         ebp
  10001C7B: 5F                 pop         edi
  10001C7C: 5E                 pop         esi
  10001C7D: 5B                 pop         ebx
  10001C7E: 83 C4 48           add         esp,48h
  10001C81: C3                 ret
  10001C82: BA 38 00 00 00     mov         edx,38h
  10001C87: C7 44 24 34 18 00  mov         dword ptr [esp+34h],18h
            00 00
  10001C8F: 89 54 24 18        mov         dword ptr [esp+18h],edx
  10001C93: A1 98 4E 05 14     mov         eax,dword ptr ds:[14054E98h]
  10001C98: 8B 0D 94 4E 05 10  mov         ecx,dword ptr ds:[10054E94h]
  10001C9E: 2B C1              sub         eax,ecx
  10001CA0: 05 00 00 00 04     add         eax,4000000h
  10001CA5: 3B D0              cmp         edx,eax
  10001CA7: 76 14              jbe         10001CBD
  10001CA9: FF 05 A4 4E 05 14  inc         dword ptr ds:[14054EA4h]
  10001CAF: FF 05 C0 4E 05 14  inc         dword ptr ds:[14054EC0h]
  10001CB5: 5D                 pop         ebp
  10001CB6: 5F                 pop         edi
  10001CB7: 5E                 pop         esi
  10001CB8: 5B                 pop         ebx
  10001CB9: 83 C4 48           add         esp,48h
  10001CBC: C3                 ret
  10001CBD: 8B 44 24 5C        mov         eax,dword ptr [esp+5Ch]
  10001CC1: 8D B1 98 4E 05 10  lea         esi,[ecx+10054E98h]
  10001CC7: C7 06 4E 44 30 37  mov         dword ptr [esi],3730444Eh
  10001CCD: 89 46 04           mov         dword ptr [esi+4],eax
  10001CD0: A1 B0 4E 05 14     mov         eax,dword ptr ds:[14054EB0h]
  10001CD5: 89 46 08           mov         dword ptr [esi+8],eax
  10001CD8: 8B 44 24 60        mov         eax,dword ptr [esp+60h]
  10001CDC: 89 46 0C           mov         dword ptr [esi+0Ch],eax
  10001CDF: 8B 44 24 1C        mov         eax,dword ptr [esp+1Ch]
  10001CE3: 89 6E 10           mov         dword ptr [esi+10h],ebp
  10001CE6: 89 46 14           mov         dword ptr [esi+14h],eax
  10001CE9: C7 46 18 00 00 00  mov         dword ptr [esi+18h],0
            00
  10001CF0: 8B 6C 24 34        mov         ebp,dword ptr [esp+34h]
  10001CF4: 89 6E 1C           mov         dword ptr [esi+1Ch],ebp
  10001CF7: 33 ED              xor         ebp,ebp
  10001CF9: 0F 10 44 24 40     movups      xmm0,xmmword ptr [esp+40h]
  10001CFE: 0F 11 46 20        movups      xmmword ptr [esi+20h],xmm0
  10001D02: F3 0F 7E 44 24 50  movq        xmm0,mmword ptr [esp+50h]
  10001D08: 66 0F D6 46 30     movq        mmword ptr [esi+30h],xmm0
  10001D0D: 83 F8 02           cmp         eax,2
  10001D10: 0F 85 A5 00 00 00  jne         10001DBB
  10001D16: 8B 44 24 20        mov         eax,dword ptr [esp+20h]
  10001D1A: 89 46 3C           mov         dword ptr [esi+3Ch],eax
  10001D1D: 8B 44 24 10        mov         eax,dword ptr [esp+10h]
  10001D21: 89 7E 38           mov         dword ptr [esi+38h],edi
  10001D24: 83 C6 40           add         esi,40h
  10001D27: 85 C0              test        eax,eax
  10001D29: 74 33              je          10001D5E
  10001D2B: 50                 push        eax
  10001D2C: FF 74 24 3C        push        dword ptr [esp+3Ch]
  10001D30: 56                 push        esi
  10001D31: E8 5A FB FF FF     call        10001890
  10001D36: 83 C4 0C           add         esp,0Ch
  10001D39: 85 C0              test        eax,eax
  10001D3B: 8B 44 24 10        mov         eax,dword ptr [esp+10h]
  10001D3F: 74 0B              je          10001D4C
  10001D41: 85 DB              test        ebx,ebx
  10001D43: 74 2D              je          10001D72
  10001D45: 53                 push        ebx
  10001D46: 55                 push        ebp
  10001D47: 03 C6              add         eax,esi
  10001D49: 50                 push        eax
  10001D4A: EB 1A              jmp         10001D66
  10001D4C: 03 C3              add         eax,ebx
  10001D4E: 50                 push        eax
  10001D4F: 6A 00              push        0
  10001D51: 56                 push        esi
  10001D52: E8 E9 3D 00 00     call        10005B40
  10001D57: BD 01 00 00 00     mov         ebp,1
  10001D5C: EB 0D              jmp         10001D6B
  10001D5E: 85 DB              test        ebx,ebx
  10001D60: 74 10              je          10001D72
  10001D62: 53                 push        ebx
  10001D63: 6A 00              push        0
  10001D65: 56                 push        esi
  10001D66: E8 D5 3D 00 00     call        10005B40
  10001D6B: 8B 44 24 1C        mov         eax,dword ptr [esp+1Ch]
  10001D6F: 83 C4 0C           add         esp,0Ch
  10001D72: 03 C3              add         eax,ebx
  10001D74: 03 F0              add         esi,eax
  10001D76: 85 FF              test        edi,edi
  10001D78: 74 21              je          10001D9B
  10001D7A: C1 E7 05           shl         edi,5
  10001D7D: 57                 push        edi
  10001D7E: FF 74 24 40        push        dword ptr [esp+40h]
  10001D82: 56                 push        esi
  10001D83: E8 08 FB FF FF     call        10001890
  10001D88: 83 C4 0C           add         esp,0Ch
  10001D8B: 85 C0              test        eax,eax
  10001D8D: 75 0C              jne         10001D9B
  10001D8F: 57                 push        edi
  10001D90: 50                 push        eax
  10001D91: 56                 push        esi
  10001D92: E8 A9 3D 00 00     call        10005B40
  10001D97: 83 C4 0C           add         esp,0Ch
  10001D9A: 45                 inc         ebp
  10001D9B: 8B 0D 94 4E 05 10  mov         ecx,dword ptr ds:[10054E94h]
  10001DA1: 8B 54 24 18        mov         edx,dword ptr [esp+18h]
  10001DA5: 85 ED              test        ebp,ebp
  10001DA7: 74 12              je          10001DBB
  10001DA9: 01 2D A8 4E 05 14  add         dword ptr ds:[14054EA8h],ebp
  10001DAF: 01 2D BC 4E 05 14  add         dword ptr ds:[14054EBCh],ebp
  10001DB5: 89 A9 B0 4E 05 10  mov         dword ptr [ecx+10054EB0h],ebp
  10001DBB: FF 05 9C 4E 05 14  inc         dword ptr ds:[14054E9Ch]
  10001DC1: 03 CA              add         ecx,edx
  10001DC3: 01 15 A0 4E 05 14  add         dword ptr ds:[14054EA0h],edx
  10001DC9: FF 05 B8 4E 05 14  inc         dword ptr ds:[14054EB8h]
  10001DCF: 89 0D 94 4E 05 10  mov         dword ptr ds:[10054E94h],ecx
  10001DD5: 5D                 pop         ebp
  10001DD6: 5F                 pop         edi
  10001DD7: 5E                 pop         esi
  10001DD8: 5B                 pop         ebx
  10001DD9: 83 C4 48           add         esp,48h
  10001DDC: C3                 ret
  10001DDD: 0F 1F 00           nop         dword ptr [eax]
