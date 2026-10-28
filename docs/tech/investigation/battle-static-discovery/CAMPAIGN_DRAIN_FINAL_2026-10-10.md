# Bilan terminal — drain utilisateur 2026-10-10

- **DRAINED / STOP_DISPATCH** à 2026-10-10T15:40:16.643893+00:00. Aucun redémarrage automatique ; GO explicite obligatoire.
- Gel44EA engagées : **21 nouvelles clôtures numériques LIKELY**, **23 bloquées**,6EA de réserve jamais commencées exclues. 44historiques+21=**65 distinctes**,7réparations de carrier C ne s'ajoutent pas au compteur.
- SAVE natif **True (bool)** à **2026-10-10T15:33:02.492531+00:00**, readback exact21/21 après SAVE dans `D:\Modding\ff8\retro-exe\FF8_EN.exe - 9.3.i64`.
- IDB disque SHA-256 `b639cd92dbf2ca42a3bd4eeffef2f2c430603189c2058a60e058df935632d056` ; receipt [CAMPAIGN_DRAIN_SAVE_2026-10-10.json](CAMPAIGN_DRAIN_SAVE_2026-10-10.json), SHA `72d553a3f0bc3a7d907dcb74d7d35b3bd077d60bf92c797ab7570f7805fbc25a`.
- API native : **167 sessions worker terminales vérifiées**,0actif ; Model.Ref superviseur Sol/high. [Snapshot](CAMPAIGN_DRAIN_SESSIONS_2026-10-10.json).
- RUN utilisateur/historique ≠ état présent : **NOTASK=0** natif ; cause non établie, aucune commande pause/step/resume/detach/attach/close/patch runtime. IDA n'a pas été fermée.
- Les clôtures sont de sémantique du DB natif original / C32 conditionnel, **pas des promotions backend compilé, ABI native, live/same-frame ou ISO**.
- [JSON complet](CAMPAIGN_DRAIN_FINAL_2026-10-10.json) = EA, commits/repairs, paths, SHA source/C/finals, packs/manifests/gates, blockers, sessions et next move.

## Intégrées IDB / commits locaux

- `0x41DF0C` : `43cafc4` ; [0x41DF0C__Render_FramePresent_Dispatch.md](semantic/0x41DF0C__Render_FramePresent_Dispatch.md) ; C SHA `546e523a8e3ff9738509b58ea696927c9b7d300c3cd97945901de2e24377cc17` ; source SHA `314cbeb3174b5d5fb68747b37fe8b672308acff94f2a074dd3364ae38dd1d973`.
- `0x45DCA0` : `c12b3a7` ; [0x45DCA0__Gte_LZCS.md](semantic/0x45DCA0__Gte_LZCS.md) ; C SHA `32881f6790ec4b65cbf9e616e64b6cb1b0ad89db70bade5cff10e0fec3003ddb` ; source SHA `8211d02a3ce8c9ce0da1ca6540d4d48bdd75d2f2c0c3599ebf9f6cb9b5f169a6`.
- `0x45E5C0` : `6de2a46` ; carrier final `c379030` ; [0x45E5C0__Gte_AVSZ3.md](semantic/0x45E5C0__Gte_AVSZ3.md) ; C SHA `b4afbd6cc0e4b3454d294f284b1636fb5be827644048e4e1013e8cfc27327aa0` ; source SHA `b2f29fe85378b6409ab3f812e8c4189a407f4c7bb68420eb57e615a436458d74`.
- `0x45EE10` : `f8a6922` ; [0x45EE10__Gte_NCLIP.md](semantic/0x45EE10__Gte_NCLIP.md) ; C SHA `7317516b606d94f9fc6bf108d584c28b4778a95278554104cad165fcb0409cf9` ; source SHA `f7c8a3fa14338bf8eebd44ebea749fac350348c02efb5c0b4709f5f447f7ff03`.
- `0x45F930` : `97e2a87` ; carrier final `fccda38` ; [0x45F930__Gte_SQR.md](semantic/0x45F930__Gte_SQR.md) ; C SHA `4b77300cbc269a6570fe49ba040ff734c74f31091bde710dd70e8d566c61d83a` ; source SHA `affb5edf73e77e77ad2a72b7ec5ff163a2fdccb1d8422fe5a3c08262c0572dfa`.
- `0x486DC0` : `5ee65ae` ; [0x486DC0__BattleTarget_GetRandomPartyMask.md](semantic/0x486DC0__BattleTarget_GetRandomPartyMask.md) ; C SHA `431f10fad968ae3862455eafb14c90ef49613c56134132af9902d9bf0adf9ccc` ; source SHA `c66ec4b8841f307492c5b59346181b61803dd7a8183f8bd31608bbae6a82d911`.
- `0x500DD0` : `68b9c0f` ; [0x500DD0__au_re_BdLinkTask.md](semantic/0x500DD0__au_re_BdLinkTask.md) ; C SHA `e67f41355b0cfb1548b2c6be0a1c4f18e4a1505cf913ab4f8a2058802e359662` ; source SHA `23247984be526e3e36c9492b6a022aabc2ca074decc3fc78e8d3b9fac328b228`.
- `0x500FD0` : `13f7ddb` ; [0x500FD0__BS_RenderRelated.md](semantic/0x500FD0__BS_RenderRelated.md) ; C SHA `43e60a77a235cb0811bbbd02544546dda73e0d041a816372187ce51abc4b6e96` ; source SHA `678036726310b981aedcd92ee5b7e1f62b032bfc62cadd9ddac87050ee630874`.
- `0x501190` : `7355502` ; [0x501190__sub_501190.md](semantic/0x501190__sub_501190.md) ; C SHA `89a0ec67429f804955d2e18900484b67e56448124970ea856004946ae86788af` ; source SHA `68fafb80abe84203527a0103b0c0b3ee47bfdbb093ea37ef9ad03da13a866953`.
- `0x5082B0` : `c381102` ; [0x5082B0__bs_modulo.md](semantic/0x5082B0__bs_modulo.md) ; C SHA `d0613b68a8ef16701b66dd7dab0cdbb6c85231c442c45270df46427edd4c0d7c` ; source SHA `7fa4a7eed992d3e243f78dfb9cdf34360ba309c0643a1aa7f9a7a806080b689b`.
- `0x5082D0` : `97ea134` ; [0x5082D0__BattleScratch_Unwind.md](semantic/0x5082D0__BattleScratch_Unwind.md) ; C SHA `0beac65635b463618125bb5792f9bd0f459bc05a70b20dc0793034a0d6337ece` ; source SHA `fbce427d906752dfa143502bdf56bbeba117ebf240c26b38597fa88b77e0018d`.
- `0x509440` : `592c3f5` ; [0x509440__BattleAnimation_StartClip.md](semantic/0x509440__BattleAnimation_StartClip.md) ; C SHA `96a7fc1c52eccc596762eed28a2a2c0f1c42afacf26bbc293ab1f741c9e1fb56` ; source SHA `ac8c66c1d0e4ab33ac18d3a8d5fb92cf8e8d0f396fcc11593e5ce622708520d7`.
- `0x5099C0` : `45dc402` ; [0x5099C0__sub_5099C0.md](semantic/0x5099C0__sub_5099C0.md) ; C SHA `ebb330da36ed17f0b8122c4ba63b3f1072608b8cc32e703f0ab9a4c495504c00` ; source SHA `af9da5a8063186f5c3c41584f4b4d6ecfa2f1815c7f77d7afe27450b606dc9b8`.
- `0x5099D0` : `4a05dec` ; [0x5099D0__RenderGeometry.md](semantic/0x5099D0__RenderGeometry.md) ; C SHA `9308f355bcc2278bfa2a5e3c94a2659c83a63cfa14adfecc646c248097130f1f` ; source SHA `6e646da93c9c68b4e07622bde5ea7b428a26593466f6bbbcd9c95b6abc0cc5e8`.
- `0x50A790` : `2185a86` ; [0x50A790__BattleActionSequence_DispatchTick.md](semantic/0x50A790__BattleActionSequence_DispatchTick.md) ; C SHA `fa39dd9c0472d98389a59ba6aeb62726d5a72bee52a52dc8d5fad6d03d392cc5` ; source SHA `908d89fd2bb77e65cf66d630e71cc787b02d5a1e13562407e63ab8406d8d257b`.
- `0x50AE80` : `7b4009e` ; carrier final `ec62f66` ; [0x50AE80__BattleActionSequence_WaitBusy.md](semantic/0x50AE80__BattleActionSequence_WaitBusy.md) ; C SHA `73ab4fcd3d9d92c043e8f280f0d27c067b0f590591d0aead78169c2306670917` ; source SHA `1cae8aac570d0787a803e460e27e56773207d8e5be0a9d4be050a2b6885c72ef`.
- `0x50BC20` : `4e68cfa` ; carrier final `b8a2a9e` ; [0x50BC20__BattleActionSequence_Tick_DefaultParamAFFFF.md](semantic/0x50BC20__BattleActionSequence_Tick_DefaultParamAFFFF.md) ; C SHA `e27d1051670a2a016bb1036d2d8a36f0083ceb5ca46bb64897084f1813d2dbb8` ; source SHA `7b651d08f5f8022f19afc76ba972bf95df1fad26fa716345bc095d3fe39ac958`.
- `0x50BD00` : `befbc18` ; carrier final `4ccf548` ; [0x50BD00__BattleActionSequence_Tick_PhysicalNoEvents.md](semantic/0x50BD00__BattleActionSequence_Tick_PhysicalNoEvents.md) ; C SHA `413b70bc1cad0aef4b41590f7054776d1bf9a59dc78379ca5ef02c8a02624c43` ; source SHA `f4a33b347c24fb502248cf9cee28a641b774dfb263c5ccbd270e9c6d923f3cd4`.
- `0x50BD80` : `fae63ec` ; carrier final `88a9e53` ; [0x50BD80__BattleActionSequence_Tick_PhysicalWithEvents.md](semantic/0x50BD80__BattleActionSequence_Tick_PhysicalWithEvents.md) ; C SHA `e958b22a54e72e7b8a5b273c93e93c79efc2f5cdff6f4c54200aa9eff0734312` ; source SHA `da0f110cde2538f1ae831394a32bb852bdcedbdad13f8814e27569c0e0adec91`.
- `0x56BBF0` : `9b5f881` ; [0x56BBF0__Vec3S32_CrossQ12.md](semantic/0x56BBF0__Vec3S32_CrossQ12.md) ; C SHA `13cfc1cdd1f4c923b0ea09f405d79011396c780365ce6e513629ed4157bacb88` ; source SHA `e01b35718a3a2fd6ea5d2864fff4cb1bba8f524c167a8908323f5525a5dce300`.
- `0x56D020` : `db55f6b` ; carrier final `1fbd8db` ; [0x56D020__Mat3S16_MulByRotY_Q12.md](semantic/0x56D020__Mat3S16_MulByRotY_Q12.md) ; C SHA `d2b7f979283a54d4919cec0afa70dadcf31f4f57669aab037cc872fd4d4b2192` ; source SHA `ba67697e856fbc862d2e99c01b408e1caefcd575d7abdbfef79726803946bd23`.

## Bloquées — partiels préservés, aucune intégration native du drain

- `0x45E9D0` — STRUCTURAL_ACCEPTE uniquement : Ã©tat x87/RAM et binder/backend non implÃ©mentÃ©s ; pas d'Ã©quivalence compilÃ©e/native et aucun chantier backend gÃ©nÃ©ral autorisÃ©.
- `0x460860` — STRUCTURAL_ACCEPTE uniquement : transport x87/RAM, hidden inputs et backend/binder absents ; correction structurelle ne ferme pas l'interface native.
- `0x47CF60` — Trois comparaisons WORD et queue x87/ABI cdecl(double) non justifiÃ©e ; audit neutral_binding_v2 couvre171anchors mais remaining_blockers conserve backend BLOCKED. C_fix_1 non admis.
- `0x500900` — C_fix_1 technique EUNKNOWN/uv_spawn, aucun C corrigÃ© utilisable. Tentative/fallback et partiels prÃ©servÃ©s ; aucune nouvelle tentative automatique ou fallback solo autorisÃ©.
- `0x502380` — CORRIGE : reload post-helper case4, shiftcount32, fullargument transport, contrats ABI/GPR et modÃ¨le RAM manquants. 5023D0 est un site interne, pas une fonction supplÃ©mentaire.
- `0x506690` — CORRIGE : contrat de projection Ã  entrÃ©es cachÃ©es/RAM/x87 ; backend non implÃ©mentÃ©. Review de projection ne vaut pas C canonique ni gate native.
- `0x5083C0` — C_R BLOCKED : C_B conservÃ© byte-exact descriptif, backend RAM/binder/frame/GPR/ABI absent. Gel19EA40octets5CFG ; prompt22/52/4 erronÃ© explicitement corrigÃ© contre guard.
- `0x508F90` — CORRIGE : capture flags avant helper, WORD prÃ©chargÃ© perdu sous alias et overflow signÃ© C ; backend alias/RAM/GPR/ABI non implÃ©mentÃ©, aucune acceptation canonique. Guard284EA779octets33CFG/29CALL.
- `0x5095B0` — C_A seulement : backend read8/read32/write32/call56C2F0 opaque/GPR/flags/ESP non implÃ©mentÃ©. Couverture28EA55octets ; C_B/R restent nÃ©cessaires aprÃ¨s contrat concret, pas gÃ©nÃ©ration inutile/acceptance solo durant drain.
- `0x50A9A0` — Six captures/reloads ordonnÃ©s Ã  corriger ; ABI/backend non Ã©tablis. Binding_audit_v2 prÃªt mais non lancÃ© et C_fix_1 reste non admis ; nouvelle session GO requis avant contexte neuf.
- `0x50AED0` — CORRIGE : bindings de stockage/domaines/ABI manquants pour WORD/BYTE1D97718, DWORD/WORD1D97704, WORD1D9771E et sept vuesWORD1D972C0 stride156. Adresses connues, pas valeurs live manquantes.
- `0x50AF20` — CORRIGE : domaines tableaux callbacks C81774/C81DB8 stride4,index0..399 mais extents/initializers non prouvÃ©s ; bindings pointeurs/liens/GPR/ABI manquants. Un dump courant ne prouve pas ces contrats.
- `0x50AFC0` — CORRIGE : seed ECX indÃ©finie, arguments tronquÃ©s, alias/order et largeur ; contrat numÃ©riqueGPR/backend absent. DÃ©pendance opaque ne peut pas Ãªtre inventÃ©e.
- `0x50B0C0` — CORRIGE : capturer DWORD1D96A9C avant BYTEstore ; pont GPR/pile/RAM et callbackfulltransport manquants. Manifest mutÃ© prÃ©servÃ©, envelope original reconstituÃ© Ã  nouveau chemin/digestc7d52c38â€¦, jamais remplacÃ© silencieusement.
- `0x50B190` — ESCALADE : ECX transport Ã 50B20Aâ†’50AFC0 non Ã©tabli ; slot mutable DWORD21DFEC4 appelÃ©50B229 actuel cible Ã©ventuelle ne prouve pas ABI/ECX. Pas de lecture speculative/promotion.
- `0x50B2A0` — CORRIGE : captures phase/BYTE/WORD, relectures posthelper d'index/acteur, capture selectors avant stores aliasants et contrat complet helper/ABI/RAM manquant ; patches/reviews conservÃ©s.
- `0x50B830` — CORRIGE : home-slot/ESP frame privÃ©, surtout ECXâ†’50AFC0, bindings RAM8/16/32 et push/cleanup/callback transport non Ã©tablis. Backend gÃ©nÃ©ral hors drain.
- `0x50BB00` — CORRIGE : capture DWORD avant BYTEstore ; bindings neutres de donnÃ©es/prototype et du slot opaque demandÃ©s, non prouvÃ©s. Ne pas inventer nom/sourceABI.
- `0x50BDC0` — ESCALADE : transport opaque GPR/ABI, domaines/bindings numÃ©riques manquants ; aucun fix devinÃ© ni gate contournÃ©e.
- `0x50BEE0` — CORRIGE : view BYTE unique/ordre des lectures initiales et contrat complet frontiÃ¨re opaque ; retour helper documentaire Ã  corriger. Backend/ABI non certifiÃ©s.
- `0x50BF90` — CORRIGE : home-slot[S-4] rechargÃ© pas pointed-byte, capturesDWORD/BYTE avant stores aliasants, ABI/GPR/RAM/bindings encore manquants.
- `0x50D300` — C_R BLOCKED : backend opaque et binding RAM/GPR/ABI absents, B byte-exact brouillon sans correctionR. Guard277EA931octets32CFG44edges ; prompt146/514 erronÃ© corrigÃ© contre sources gelÃ©es.
- `0x56C090` — Projection CORRIGE documentaire, deux patches non implÃ©mentÃ©s et Ã©tat/backend x87/RAM absents ; aucune admission native ou clÃ´ture C canonique.

## Réserve NON COMMENCÉE / exclusions

`0x50AE00`, `0x50AE20`, `0x508540`, `0x505BC0`, `0x505C00`, `0x506C10`. Aucun dispatch de ces EA durant le drain.

## Reprise dans une nouvelle session

1. Lire le handoff canonique prioritaire et les JSON ci-dessus ; contrôler leurs SHA et les fichiers gelés.
2. **Attendre un GO explicite** ; pas de reprise automatique de campagne. Jamais de reprise des sessions enfants étrangères.
3. Si GO sur une EA bloquée : résoudre son contrat/binding/backend manquant avant nouveau C/gate, utiliser contextes neufs indépendants/high natif. Ne pas contourner les blockers par une lecture live ou une simple review.
4. Handoff/queue/journal/receipts restent locaux non ajoutés aux commits de fonction (whitelist canonique). Pas de git add global, reset, nettoyage, amend ou remote push.

## Incidents conservés

- 41DF0C : decode_insn RUN/cache prologue ne correspondait pas aux bytesDB ; parent a redécodé chaque opcode/source-size DB et conservé le probe erroné. Aucune conclusion de hook/patch runtime.
- Sept (pas huit) fences C CRLF étaient normalisés LF par Git. Acceptés C/gels inchangés ;14préfixes doc préservés exactement et7carrierBase64 décodés byte-exact dans les commits de réparation. Aucun changement config/attributs et0nouvelleclôture de réparation.
- R50D300/5083C0 ont rejeté les métriques erronées des prompts ; guards277/931 et19/40 font foi. Backend reste BLOCKED.
- N5099C0 : formulation parent « caller flags use » supprimée avant push, preimage/gate conservés ; ≥2 preuves réelles store/RET/noEAXdef. A/V et C inchangés.
- Première invocation finale SAVE contenait une erreur d'échappement Python et n'a rien exécuté ; receipt natif réel ci-dessus obtenu après correction, jamais succès présumé.
- Auditeur sessions : updated peut dépasser idle après metadata/permissions ; outcome terminal + dernier vrai idle/final stop/no pending tools vérifiés, timestamps préservés. Aucun worker terminal compté actif.
- Question originale sur les tables NON RETROUVÉE ; aucune perte de stockage prouvée, candidats de blockers ne sont pas une reconstruction historique. Aucune mémoire process cible lue.
