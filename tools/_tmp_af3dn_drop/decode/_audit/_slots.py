import re, struct

data = open(r'C:\Users\djden\AppData\Local\Temp\dis.txt', encoding='utf-16-le', errors='replace').read()
# collect DumpNode call sites
sites = []
for m in re.finditer(r'([0-9A-F]{8}): E8 [0-9A-F ]+ call\s+100019D0', data):
    sites.append(int(m.group(1), 16))
sites.sort()
print('DumpNode call sites:', [hex(s) for s in sites])

# infer slot from the push 0xNN immediately before the call (within 16 bytes)
# pattern: ... 6A NN  (push imm8) just before the call (3 pushes: node, ctx, slot)
slots = []
for s in sites:
    window_start = s - 20
    # find in the dis text the lines for this range
    seg = data[data.find(f'{s:08X}') - 2000 : data.find(f'{s:08X}')]
    # last '6A xx' push before the call line
    pushes = re.findall(r'([0-9A-F]{8}): 6A ([0-9A-F]{2})\s+push\s+([0-9A-F]+)h', seg)
    if pushes:
        last = pushes[-1]
        slots.append((hex(s), int(last[1], 16)))
    else:
        slots.append((hex(s), None))
for x in slots:
    print(x)
