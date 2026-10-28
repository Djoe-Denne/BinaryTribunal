/* Hex-Rays live 0x45C0F0 — pièges :
 * - (unsigned int)&unk_FFFFFF = masque 0x00FFFFFF (leurre objet)
 * - if (env == (__int16 *)-12) = lea edi,[eax+0Ch]; test edi,edi  (jamais « env==-12 »)
 * - pas occupancy / tag 07 / code 24
 * Corps réel : voir glm_c_reconciled.c / decomp.md (ground truth ASM).
 */
__int16 *__cdecl Gpu_PackDrawEnvPacket(unsigned int *packet, __int16 *env);
