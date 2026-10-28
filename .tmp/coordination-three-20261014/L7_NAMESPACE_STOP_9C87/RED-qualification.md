# RED against exact 494b

- Log: `red-2026-10-16T10-19-26-455Z.log`
- SHA256: `547e658721039f1956ec46c220dd3aaf7c3b4f2303808fa8c9313c89598a617f`
- Exit 1; 29 tests, 10 pass, 19 fail, 144 assertions.
- Source still `494b8bf87fa7a5e4b3c66058869d12be765a066c8ca9882d8a6ad12d2006fcde`.
- All 19 failures are explicit assertion failures: archive version/document absent,
  accepted namespace/structural mutations, or stale extra attempts/commit.
- No unqualified TypeError or fixture setup error. The text `TypeError` occurs in
  the negative test's name/source description, not as a runtime exception.
- 379 pinned inputs and 250 readonly harness files verified; 32 other public
  interfaces/type aliases byte-exact. No historical test changed.
- This is expected RED, not a passing gate or integration acceptance.
