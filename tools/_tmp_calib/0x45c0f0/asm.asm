Gpu_PackDrawEnvPacket (.text @ 0x45c0f0):
45c0f0  mov     eax, [esp+env]
45c0f4  push    ebx
45c0f5  push    esi
45c0f6  mov     esi, [esp+8+packet]
45c0fa  mov     bl, [eax+18h]
45c0fd  push    edi
45c0fe  test    bl, bl
45c100  jz      short loc_45C114
45c102  mov     ecx, [esi]
45c104  and     ecx, offset unk_FFFFFF
45c10a  or      ecx, 8000000h
45c110  mov     [esi], ecx
45c112  jmp     short loc_45C124
45c114  mov     edx, [esi]
45c116  and     edx, offset unk_FFFFFF
45c11c  or      edx, 5000000h
45c122  mov     [esi], edx
45c124  movsx   ecx, word ptr [eax+2]
45c128  movsx   edx, word ptr [eax]
45c12b  mov     edi, ecx
45c12d  push    ebp
45c12e  and     edi, 1FFh
45c134  mov     ebp, edx
45c136  or      edi, 0FFF8C000h
45c13c  and     ebp, 3FFh
45c142  shl     edi, 0Ah
45c145  or      edi, ebp
45c147  pop     ebp
45c148  mov     [esi+4], edi
45c14b  movsx   edi, word ptr [eax+6]
45c14f  lea     ecx, [edi+ecx-1]
45c153  mov     di, [eax+4]
45c157  shl     ecx, 0Ah
45c15a  lea     edx, [edi+edx-1]
45c15e  and     ecx, 7FC00h
45c164  and     edx, 3FFh
45c16a  lea     edi, [eax+0Ch]
45c16d  or      ecx, edx
45c16f  mov     dx, [eax+8]
45c173  or      ecx, 0E4000000h
45c179  and     edx, 7FFh
45c17f  mov     [esi+8], ecx
45c182  mov     cx, [eax+0Ah]
45c186  and     ecx, 7FFh
45c18c  or      ecx, 0FFFCA000h
45c192  shl     ecx, 0Bh
45c195  or      ecx, edx
45c197  mov     dl, [eax+17h]
45c19a  mov     [esi+0Ch], ecx
45c19d  mov     cx, [eax+14h]
45c1a1  and     ecx, 9FFh
45c1a7  neg     dl
45c1a9  sbb     edx, edx
45c1ab  and     edx, 400h
45c1b1  or      ecx, edx
45c1b3  mov     dl, [eax+16h]
45c1b6  neg     dl
45c1b8  sbb     edx, edx
45c1ba  and     edx, 200h
45c1c0  or      ecx, edx
45c1c2  or      ecx, 0E1000000h
45c1c8  test    edi, edi
45c1ca  mov     [esi+10h], ecx
45c1cd  jz      short loc_45C211
45c1cf  mov     cl, [eax+0Eh]
45c1d2  mov     dl, [edi]
45c1d4  and     ecx, 0F8h
45c1da  and     edx, 0F8h
45c1e0  or      ecx, 0FFFE2000h
45c1e6  shl     ecx, 5
45c1e9  or      ecx, edx
45c1eb  mov     dx, [eax+12h]
45c1ef  shl     ecx, 5
45c1f2  dec     edx
45c1f3  not     edx
45c1f5  and     edx, 0F8h
45c1fb  or      ecx, edx
45c1fd  mov     dx, [eax+10h]
45c201  shl     ecx, 2
45c204  dec     edx
45c205  not     edx
45c207  sar     edx, 3
45c20a  and     edx, 1Fh
45c20d  or      ecx, edx
45c20f  jmp     short loc_45C213
45c211  xor     ecx, ecx
45c213  test    bl, bl
45c215  mov     [esi+14h], ecx
45c218  jz      short loc_45C244
45c21a  xor     ecx, ecx
45c21c  xor     edx, edx
45c21e  mov     cl, [eax+1Bh]
45c221  mov     dl, [eax+1Ah]
45c224  or      ch, 2
45c227  shl     ecx, 8
45c22a  or      ecx, edx
45c22c  xor     edx, edx
45c22e  mov     dl, [eax+19h]
45c231  shl     ecx, 8
45c234  or      ecx, edx
45c236  mov     edx, [eax+4]
45c239  mov     [esi+18h], ecx
45c23c  mov     ecx, [eax]
45c23e  mov     [esi+1Ch], ecx
45c241  mov     [esi+20h], edx
45c244  pop     edi
45c245  pop     esi
45c246  pop     ebx
45c247  retn
