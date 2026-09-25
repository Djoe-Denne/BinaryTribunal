import re

data = open(r'C:\Users\djden\AppData\Local\Temp\dis.txt', encoding='utf-16-le', errors='replace').read()
targets = {'10001FC0', '10001E00', '10003E10', '10001F20', '100019D0', '10001DDC'}
hits = []
for m in re.finditer(r'([0-9A-F]{8}): E8 [0-9A-F ]+ call\s+([0-9A-F]{8})', data):
    tgt = m.group(2)
    if tgt in targets:
        hits.append((m.group(1), tgt))
for h in hits:
    print(h)
print('total', len(hits))
