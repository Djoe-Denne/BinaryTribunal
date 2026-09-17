# MemMove_OverlapSafe @ 0x509B50

- Nom IDA: `BS_CopyGeometry` (trop étroit)
- Instr: 32
- Mode: 1+P
- Verdict: CERTAIN — implémentation générique de `memmove(dst, src, size)`, copie avant si `dst<src`, arrière sinon
- Push IDB: append-only `[semantic-triple 2026-09-17]` + save_database

## C réconcilié

```c
void __cdecl MemMove_OverlapSafe(
    unsigned char *dst,
    const unsigned char *src,
    unsigned int size)
{
    if (dst < src) {
        unsigned int dwords = size >> 2;
        while (dwords--) {
            *(unsigned int *)dst = *(const unsigned int *)src;
            dst += 4;
            src += 4;
        }
        size &= 3;
        while (size--)
            *dst++ = *src++;
    } else if (size) {
        dst += size - 1;
        src += size - 1;
        do {
            *dst-- = *src--;
        } while (--size);
    }
}
```

## Preuves et validation parent

1. `509b5e cmp edi,esi` / `509b60 jnb 509B77` — comparaison d'adresses non signée; destination basse copie vers l'avant, destination haute vers l'arrière.
2. Chemin avant: `size>>2`, `rep movsd`, puis `size&3`, `rep movsb` — copie exacte de tous les octets.
3. Chemin arrière: `dst+size-1`, `src+size-1`, boucle byte avec décrément — préservation des recouvrements.
4. `size==0` sort dans les deux branches sans accès mémoire (`jbe`).
5. Retour `void`; aucune valeur EAX contractuelle.
6. Callers musique, modèles, textures, séquences GF, changement de stage: usage transversal incompatible avec le nom spécifique `BS_CopyGeometry`, mais cohérent avec `memmove`.
