import struct

r = open(r'tools\_tmp_af3dn_drop\decode\_audit\live_ring.bin', 'rb').read()   # live ring, records of seq 1998
f = open(r'tools\_tmp_af3dn_drop\captures\reverify.bin', 'rb').read()        # file; last frame = seq 1998

fbase = len(f) - 4384          # last frame start in file
# file frame: s47 @fbase (56 B), s51 vc36 @fbase+56, ...
foff = fbase + 56              # the s51 vc36 record in the file
roff = 0x38                    # the s51 vc36 record in the ring

fs, rs = struct.unpack_from('<I', f, foff + 8)[0], struct.unpack_from('<I', r, roff + 8)[0]
print('seq: file=%d ring=%d' % (fs, rs))

# walk both, counting LFs in the ring record and aligning with CRLF expansion model
ring_rec = r[roff:roff + 1324]
nlf = ring_rec.count(b'\x0a')
print('ring rec bytes=1324, 0x0A count =', nlf, ' => expected file rec size =', 1324 + nlf)

# verify: file record == ring record with each 0x0A expanded to 0D 0A
exp = bytearray()
for b in ring_rec:
    if b == 0x0A:
        exp += b'\x0d\x0a'
    else:
        exp.append(b)
exp = bytes(exp)
frec = f[foff:foff + len(exp)]
print('file rec len available:', len(frec), 'expected:', len(exp))
same = sum(1 for a, b in zip(frec, exp) if a == b)
print('matching bytes: %d / %d' % (same, len(exp)))
if same != len(exp):
    bad = [(i, frec[i], exp[i]) for i in range(len(exp)) if i < len(frec) and frec[i] != exp[i]]
    print('first mismatches:', [(hex(i), hex(a), hex(b)) for i, a, b in bad[:10]])
