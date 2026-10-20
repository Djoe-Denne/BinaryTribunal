// GenericTargetPlanTests.cs - QA1 independent C#4 test source (full44-Q1, team mission-a58a462638c0db92).
// Namespace ReGraph.GuardV3, entry internal static int Main(string[] args) for a future explicit
// parent csc /main. C#4/.NET4 strict, no test framework, no unsafe, no stackalloc, heap-only data,
// console report bounded to 1024 bytes total (ASCII only, all tags/newlines/summary included).
// Oracles are exact embedded literals: the independent parent golden DATA_ONLY record (862 bytes,
// SHA-256 c404dcf72229ed1a11ce51da433ae5889b8d64059bd3927c63ab6b70f66b39cf), QA0-R2 corrected
// argv/env codec vectors, the fixed refusal order (API_FIXED_R1 + parent P1-P7 + API R3).
// No TimeProfile/Intent/Version input fields exist or are invented; they are constants/derived.
// No File/Stream/Process/PInvoke/Job/OS/Thread/clock/environment/network/DB access. No reflection.
// Nothing is compiled or executed by the QA worker; the parent alone runs this under its own gates.
// NOT a full44 writer; the console report is only this suite's short post-gate report.
// Sources of oracles (pins): SCOPE.md, API_FIXED_R1.md, QA0 oracles (R2), GOLDEN_DATA.json,
// FULL44_QA1_PLAN_ADJUDICATION.md, FULL44_Q1_API_R3_MEMBERSHIP_AND_NULL.md. Author implementation
// was never read (NONBLIND). This file is a PROPOSED source, not an executed coverage proof.

using System;
using System.Security.Cryptography;
using System.Text;

namespace ReGraph.GuardV3
{
    internal static class GenericTargetPlanTests
    {
        // ------------------------------------------------------------------
        // Console budget: hard cap 1024 bytes for EVERYTHING the suite writes.
        // Room for the truncation tag (6) and the summary line (<=23) is
        // reserved before any failure tag is consumed.
        // ------------------------------------------------------------------
        private const int ConsoleCapBytes = 1024;
        private const int TruncationTagBytes = 6;
        private const int SummaryReserveBytes = 24;
        private const string TruncationTag = "TRUNC\n";
        private static int consoleBytes;
        private static bool truncated;
        private static int totalAsserts;
        private static int failedAsserts;
        private static CaseIdentity sinkIdentity;

        private static void Emit(string text)
        {
            if (truncated)
            {
                return;
            }
            int tagBudget = ConsoleCapBytes - TruncationTagBytes - SummaryReserveBytes;
            if (consoleBytes + text.Length > tagBudget)
            {
                truncated = true;
                return;
            }
            Console.Write(text);
            consoleBytes += text.Length;
        }

        private static void Chk(bool condition, string id)
        {
            totalAsserts++;
            if (!condition)
            {
                failedAsserts++;
                Emit("F:" + id + "\n");
            }
        }

        private static void ChkEq(int actual, int expected, string id)
        {
            Chk(actual == expected, id);
        }

        private static void ChkEq(long actual, long expected, string id)
        {
            Chk(actual == expected, id);
        }

        private static void ChkEq(string actual, string expected, string id)
        {
            Chk(String.Equals(actual, expected, StringComparison.Ordinal), id);
        }

        // ------------------------------------------------------------------
        // Data helpers (memory only). SHA-256 comes from the standard .NET4
        // library SHA256Managed (no home-made crypto), heap-only, disposed.
        // ------------------------------------------------------------------
        private static int HexVal(char c)
        {
            if (c >= '0' && c <= '9') return c - '0';
            if (c >= 'a' && c <= 'f') return c - 'a' + 10;
            if (c >= 'A' && c <= 'F') return c - 'A' + 10;
            return -1;
        }

        private static byte[] HexToBytes(string hex)
        {
            byte[] result = new byte[hex.Length / 2];
            for (int i = 0; i < result.Length; i++)
            {
                result[i] = (byte)((HexVal(hex[2 * i]) << 4) | HexVal(hex[2 * i + 1]));
            }
            return result;
        }

        private static string BytesToHex(byte[] data, int offset, int count)
        {
            StringBuilder builder = new StringBuilder(count * 2);
            const string digits = "0123456789abcdef";
            for (int i = 0; i < count; i++)
            {
                byte b = data[offset + i];
                builder.Append(digits[(b >> 4) & 0x0F]);
                builder.Append(digits[b & 0x0F]);
            }
            return builder.ToString();
        }

        private static string Sha256Hex(byte[] data)
        {
            using (SHA256Managed sha = new SHA256Managed())
            {
                byte[] hash = sha.ComputeHash(data);
                return BytesToHex(hash, 0, hash.Length);
            }
        }

        private static bool BytesEqual(byte[] x, byte[] y)
        {
            if (x == null || y == null) return false;
            if (x.Length != y.Length) return false;
            for (int i = 0; i < x.Length; i++)
            {
                if (x[i] != y[i]) return false;
            }
            return true;
        }

        private static void ChkBytes(byte[] actual, byte[] expected, string id)
        {
            Chk(BytesEqual(actual, expected), id);
        }

        private static long ReadU32(byte[] data, int offset)
        {
            return (long)data[offset]
                | ((long)data[offset + 1] << 8)
                | ((long)data[offset + 2] << 16)
                | ((long)data[offset + 3] << 24);
        }

        private static string ReadHex(byte[] data, int offset, int count)
        {
            return BytesToHex(data, offset, count);
        }

        // ------------------------------------------------------------------
        // Embedded golden (DATA_ONLY parent oracle; never read from disk).
        // Layout gtplan-canonical-v1. Key offsets verified against the layout:
        // mode u32LE @614, additionalCount u32LE @714, artifact[i] length
        // u32LE @(718 + 36*i), sha32 raw32 @(722 + 36*i); artifact[3]: 826/830.
        // ------------------------------------------------------------------
        private const string GoldenNonceHex =
            "1111111111111111111111111111111111111111111111111111111111111111";
        private const long GoldenEpoch = 7L;
        private const string GoldenLeaseSha256 =
            "936388aa085d354a45924db15652f6fc6152c79ad07ddf13a051139e33bbb5eb";
        private const string GoldenLedgerSha256 =
            "cf0398f0fda3ce1e2ca2db2656681e587b0730e2fdba938e4d2dbcf311c2f66a";
        private const string GoldenImagePath = "C:\\Q\\app.exe";
        private const string GoldenImageSha256 =
            "3333333333333333333333333333333333333333333333333333333333333333";
        private const string GoldenWorkingDirectory = "C:\\Q";
        private const string GoldenReservationSha256 =
            "2222222222222222222222222222222222222222222222222222222222222222";
        private const string GoldenRootSha256 =
            "4444444444444444444444444444444444444444444444444444444444444444";
        private const string GoldenArtifact0Hex = "4f574e45522066697874757265";       // "OWNER fixture" 13
        private const string GoldenArtifact1Hex = "6c6561736520636f6e74726f6c";     // "lease control" 13
        private const string GoldenArtifact2Hex = "6c656467657220636f6e74726f6c";   // "ledger control" 14
        private const string GoldenArtifact3Hex = "72656769737472792066697874757265"; // "registry fixture" 16
        private const string GoldenIntentSha256 =
            "c404dcf72229ed1a11ce51da433ae5889b8d64059bd3927c63ab6b70f66b39cf";
        private const string EmptySha256Hex =
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
        private const string GoldenEnvironmentBlock = "A=1\0B=2\0\0";
        private const string GoldenCommandLine = "C:\\Q\\app.exe \"\" \"x y\" \"b\\\\\\\"c\"";
        private const int GoldenCommandLineUnits = 30;
        private const int GoldenCanonicalLength = 862;
        private const int GoldenAdditionalBytes = 56;
        private const int GoldenControlFileBytes = 918;

        private const string GoldenRecordHex = "4754504c010000001000000067656e657269632d742d6475616c2d310c00000077696e2d71756f74652d76310a00000077696e2d656e762d7631400000003131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313107000000000000004000000039333633383861613038356433353461343539323464623135363532663666633631353263373961643037646466313361303531313339653333626262356562400000003232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323207000000000000000c000000433a5c515c6170702e6578654000000033333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333040000000c000000433a5c515c6170702e657865000000000300000078207904000000625c226304000000433a5c510200000003000000413d3103000000423d320200000001000000410100000042010000000c000000433a5c515c6170702e6578650a00000000000000400000003333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333340000000636630333938663066646133636531653263613264623236353636383165353837623037333065326664626139333865346432646263663331316332663636610500000056332d513101000000010000000c000000666978747572652d726f6f7440000000343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434340700000000000000040000000d000000a670cf194a0832ee81e6a0e539f32243b1f7b9365f414bf45aed04c35b533cb30d000000936388aa085d354a45924db15652f6fc6152c79ad07ddf13a051139e33bbb5eb0e000000cf0398f0fda3ce1e2ca2db2656681e587b0730e2fdba938e4d2dbcf311c2f66a10000000d09b92112eb95242a713384cf9db40c5accd370f9a44d6a793918e213a968443";

        private static readonly byte[] GoldenRecordBytes = HexToBytes(GoldenRecordHex);

        // Canonical offsets pinned against the golden decode (baseline fixture).
        // Length FIELDS of countedUtf8 elements: 362/441 are counters (argc,
        // pinCount), not length fields - parent correction R2.
        private const int CanonicalModeOffset = 614;
        private const int CanonicalAdditionalCountOffset = 714;
        private const int ArtifactStride = 36;
        private const int Artifact0LengthOffset = 718;
        private const int Artifact0ShaOffset = 722;
        private const int Artifact3LengthOffset = Artifact0LengthOffset + 3 * ArtifactStride; // 826
        private const int Artifact3ShaOffset = Artifact0ShaOffset + 3 * ArtifactStride;       // 830
        private const int CanonicalImagePathLengthOffset = 278;   // image length field (12 baseline)
        private const int CanonicalEnvCountOffset = 409;          // baseline envCount u32 (2)
        private const int CanonicalAllowedCountOffset = 413;      // follows envCount when env empty
        private const int CanonicalArgv0LengthOffset = 366;       // argv0 length field (362 = argc)
        private const int CanonicalPin0LabelLengthOffset = 445;   // first pin label length field (441 = pinCount)
        private const int CanonicalPin1LabelLengthOffset = 537;   // second pin label length field
        private const int CanonicalPin1LabelCharsOffset = 541;    // second pin label chars
        // Coordinated 259-char image fixture: everything after the image path
        // shifts by +247 (image) then +247 (argv0): argv0 length @613, first
        // pin label length @939. Baseline constants are NOT reused there.
        private const int LongImageArgv0LengthOffset = 613;
        private const int LongImagePin0LabelLengthOffset = 939;

        // Control-padding recipe (GOLDEN_DATA.controlPaddingRecipe).
        private const int PaddingArtifactIndex = 3;
        private const byte PaddingFillByte = 120;
        private const int PaddingFirstThreeBytes = 40; // 13 + 13 + 14
        private const int PaddingPayloadAcceptedLow = 31865;   // canonical 862 + 40 + 31865 = 32767
        private const int PaddingPayloadAcceptedHigh = 31866;  // canonical 862 + 40 + 31866 = 32768
        private const int PaddingPayloadRefused = 31867;       // canonical 862 + 40 + 31867 = 32769

        private static byte[][] GoldenArtifacts()
        {
            return new byte[][]
            {
                HexToBytes(GoldenArtifact0Hex),
                HexToBytes(GoldenArtifact1Hex),
                HexToBytes(GoldenArtifact2Hex),
                HexToBytes(GoldenArtifact3Hex)
            };
        }

        private static byte[] PaddedArtifact(int payloadLength)
        {
            byte[] padded = new byte[payloadLength];
            for (int i = 0; i < payloadLength; i++)
            {
                padded[i] = PaddingFillByte;
            }
            return padded;
        }

        private static string PaddedArtifactShaHex(int payloadLength)
        {
            return Sha256Hex(PaddedArtifact(payloadLength));
        }

        private static byte[][] PaddedArtifacts(int payloadLength)
        {
            byte[][] golden = GoldenArtifacts();
            golden[PaddingArtifactIndex] = PaddedArtifact(payloadLength);
            return golden;
        }

        private static GenericTargetPlanInput GoldenInput()
        {
            GenericTargetPlanInput input = new GenericTargetPlanInput();
            input.Identity = new CaseIdentity(GoldenNonceHex, GoldenEpoch);
            input.LeaseReceiptSha256 = GoldenLeaseSha256;
            input.LedgerPlanSha256 = GoldenLedgerSha256;
            input.TargetImagePath = GoldenImagePath;
            input.TargetImageSha256 = GoldenImageSha256;
            input.WorkingDirectory = GoldenWorkingDirectory;
            input.Argv = new string[] { GoldenImagePath, "", "x y", "b\\\"c" };
            input.EnvironmentEntries = new string[] { "B=2", "A=1" };
            input.AllowedEnvironmentNames = new string[] { "B", "A" };
            input.ReservationBinding = new GenericPlanReservationBinding(GoldenReservationSha256, GoldenEpoch);
            input.SourcePins = new GenericSourcePin[]
            {
                new GenericSourcePin(GoldenImagePath, 10L, GoldenImageSha256)
            };
            input.OwnershipRootBindings = new GenericOwnershipRootBinding[]
            {
                new GenericOwnershipRootBinding("fixture-root", GoldenRootSha256, GoldenEpoch)
            };
            input.QualificationMode = GenericQualificationMode.C01;
            input.AdditionalControlArtifacts = GoldenArtifacts();
            return input;
        }

        private static GenericTargetPlanInput GoldenInputWithArgv(string[] argv)
        {
            GenericTargetPlanInput input = GoldenInput();
            input.Argv = argv;
            return input;
        }

        private static GenericTargetPlanInput GoldenInputWithEntries(string[] entries)
        {
            GenericTargetPlanInput input = GoldenInput();
            input.EnvironmentEntries = entries;
            return input;
        }

        private static GenericTargetPlanInput GoldenInputWithAllowlist(string[] names)
        {
            GenericTargetPlanInput input = GoldenInput();
            input.AllowedEnvironmentNames = names;
            return input;
        }

        private static GenericTargetPlanInput GoldenInputWithPath(string path)
        {
            GenericTargetPlanInput input = GoldenInput();
            input.TargetImagePath = path;
            return input;
        }

        private static GenericTargetPlanInput GoldenInputWithWorkingDirectory(string cwd)
        {
            GenericTargetPlanInput input = GoldenInput();
            input.WorkingDirectory = cwd;
            return input;
        }

        private static GenericTargetPlanInput GoldenInputWithLease(string lease)
        {
            GenericTargetPlanInput input = GoldenInput();
            input.LeaseReceiptSha256 = lease;
            return input;
        }

        private static GenericTargetPlanInput GoldenInputWithImageSha(string sha)
        {
            GenericTargetPlanInput input = GoldenInput();
            input.TargetImageSha256 = sha;
            return input;
        }

        private static GenericTargetPlanInput GoldenInputWithLedger(string sha)
        {
            GenericTargetPlanInput input = GoldenInput();
            input.LedgerPlanSha256 = sha;
            return input;
        }

        private static GenericTargetPlanInput GoldenInputWithPins(GenericSourcePin[] pins)
        {
            GenericTargetPlanInput input = GoldenInput();
            input.SourcePins = pins;
            return input;
        }

        private static GenericTargetPlanInput GoldenInputWithRoots(GenericOwnershipRootBinding[] roots)
        {
            GenericTargetPlanInput input = GoldenInput();
            input.OwnershipRootBindings = roots;
            return input;
        }

        private static GenericTargetPlanInput GoldenInputWithReservation(GenericPlanReservationBinding reservation)
        {
            GenericTargetPlanInput input = GoldenInput();
            input.ReservationBinding = reservation;
            return input;
        }

        private static GenericTargetPlanInput GoldenInputWithArtifacts(byte[][] artifacts)
        {
            GenericTargetPlanInput input = GoldenInput();
            input.AdditionalControlArtifacts = artifacts;
            return input;
        }

        private static GenericTargetPlanInput GoldenInputWithMode(GenericQualificationMode mode)
        {
            GenericTargetPlanInput input = GoldenInput();
            input.QualificationMode = mode;
            return input;
        }

        // ------------------------------------------------------------------
        // Build/encode helpers (counted asserts).
        // ------------------------------------------------------------------
        private static GenericTargetPlanV1 BuildOk(GenericTargetPlanInput input, string id)
        {
            GenericTargetPlanV1 plan;
            GenericPlanRefusal refusal;
            bool ok = GenericTargetPlanCodec.TryBuild(input, out plan, out refusal);
            Chk(ok, id + ".ok");
            Chk(plan != null, id + ".p");
            ChkEq((int)refusal, (int)GenericPlanRefusal.None, id + ".r");
            return plan;
        }

        private static void BuildRefusal(GenericTargetPlanInput input, GenericPlanRefusal expected, string id)
        {
            GenericTargetPlanV1 plan;
            GenericPlanRefusal refusal;
            bool ok = GenericTargetPlanCodec.TryBuild(input, out plan, out refusal);
            Chk(!ok, id + ".f");
            Chk(plan == null, id + ".n");
            ChkEq((int)refusal, (int)expected, id + ".r");
        }

        private static void EncArg(string argument, string expected, string id)
        {
            string encoded;
            bool ok = GenericTargetPlanCodec.TryEncodeWindowsArgument(argument, out encoded);
            Chk(ok, id + ".ok");
            ChkEq(encoded, expected, id + ".v");
        }

        private static void EncArgRefuse(string argument, string id)
        {
            string encoded = "sentinel";
            bool ok = GenericTargetPlanCodec.TryEncodeWindowsArgument(argument, out encoded);
            Chk(!ok, id + ".f");
            Chk(encoded == null, id + ".n");
        }

        private static void EncCmd(string[] argv, string expected, string id)
        {
            string encoded;
            bool ok = GenericTargetPlanCodec.TryEncodeWindowsCommandLine(argv, out encoded);
            Chk(ok, id + ".ok");
            ChkEq(encoded, expected, id + ".v");
        }

        private static void EncCmdRefuse(string[] argv, string id)
        {
            string encoded = "sentinel";
            bool ok = GenericTargetPlanCodec.TryEncodeWindowsCommandLine(argv, out encoded);
            Chk(!ok, id + ".f");
            Chk(encoded == null, id + ".n");
        }

        private static void EncEnv(string[] entries, string expected, string id)
        {
            string block;
            bool ok = GenericTargetPlanCodec.TryEncodeEnvironmentBlock(entries, out block);
            Chk(ok, id + ".ok");
            ChkEq(block, expected, id + ".v");
        }

        private static void EncEnvRefuse(string[] entries, string id)
        {
            string block = "sentinel";
            bool ok = GenericTargetPlanCodec.TryEncodeEnvironmentBlock(entries, out block);
            Chk(!ok, id + ".f");
            Chk(block == null, id + ".n");
        }

        private static void CountOk(byte[][] artifacts, long expected, string id)
        {
            long total = -1;
            bool ok = GenericTargetPlanCodec.TryCountControlFiles(artifacts, out total);
            Chk(ok, id + ".ok");
            ChkEq(total, expected, id + ".v");
        }

        private static void CountRefuse(byte[][] artifacts, string id)
        {
            long total = -1;
            bool ok = GenericTargetPlanCodec.TryCountControlFiles(artifacts, out total);
            Chk(!ok, id + ".f");
            ChkEq(total, 0L, id + ".0");
        }

        private static void ChkArgThrow(string nonce, long epoch, string id)
        {
            bool threw = false;
            try
            {
                sinkIdentity = new CaseIdentity(nonce, epoch);
            }
            catch (ArgumentException)
            {
                threw = true;
            }
            catch
            {
                threw = false;
            }
            Chk(threw, id);
        }

        // ------------------------------------------------------------------
        // T01 - fixed constants (contract, modes, refusals). No invented
        // TimeProfile/Intent/Version INPUT field: they are checked here as
        // constants/derived outputs only.
        // ------------------------------------------------------------------
        private static void RunT01()
        {
            ChkEq(GenericTargetPlanContract.Version, "generic-t-dual-1", "T01-ver");
            ChkEq(GenericTargetPlanContract.TimeProfileQ1, "V3-Q1", "T01-tprof");
            ChkEq(GenericTargetPlanContract.WindowsArgvCodecId, "win-quote-v1", "T01-argvc");
            ChkEq(GenericTargetPlanContract.WindowsEnvCodecId, "win-env-v1", "T01-envc");
            ChkEq(GenericTargetPlanContract.CanonicalEncodingId, "gtplan-canonical-v1", "T01-canon");
            ChkEq((long)GenericTargetPlanContract.MaxArgumentCount, 128L, "T01-argc");
            ChkEq((long)GenericTargetPlanContract.MaxCommandLineChars, 32766L, "T01-cmd");
            ChkEq((long)GenericTargetPlanContract.MaxEnvironmentBlockUnits, 32767L, "T01-envblk");
            ChkEq((long)GenericTargetPlanContract.MaxEnvironmentEntries, 4096L, "T01-envn");
            ChkEq((long)GenericTargetPlanContract.MaxSourcePins, 64L, "T01-pins");
            ChkEq((long)GenericTargetPlanContract.MaxOwnershipRootBindings, 16L, "T01-roots");
            ChkEq((long)GenericTargetPlanContract.MaxLabelChars, 259L, "T01-label");
            ChkEq((long)GenericTargetPlanContract.MaxAdditionalControlArtifacts, 16L, "T01-art");
            ChkEq((int)GenericQualificationMode.C01, 1, "T01-c01");
            ChkEq((int)GenericQualificationMode.C02, 2, "T01-c02");
            ChkEq((int)GenericQualificationMode.C03, 3, "T01-c03");
            ChkEq((int)GenericQualificationMode.C04, 4, "T01-c04");
            ChkEq((int)GenericQualificationMode.C05, 5, "T01-c05");
            ChkEq((int)GenericQualificationMode.C06, 6, "T01-c06");
            ChkEq((int)GenericQualificationMode.C07, 7, "T01-c07");
            ChkEq((int)GenericQualificationMode.C08, 8, "T01-c08");
            ChkEq((int)GenericQualificationMode.C09, 9, "T01-c09");
            ChkEq((int)GenericQualificationMode.C10, 10, "T01-c10");
            ChkEq((int)GenericQualificationMode.C11, 11, "T01-c11");
            ChkEq((int)GenericQualificationMode.C12, 12, "T01-c12");
            ChkEq((int)GenericQualificationMode.C13, 13, "T01-c13");
            ChkEq((int)GenericQualificationMode.C14, 14, "T01-c14");
            ChkEq((int)GenericPlanRefusal.None, 0, "T01-r0");
            ChkEq((int)GenericPlanRefusal.NullInput, 1, "T01-r1");
            ChkEq((int)GenericPlanRefusal.BadIdentity, 2, "T01-r2");
            ChkEq((int)GenericPlanRefusal.BadPin, 3, "T01-r3");
            ChkEq((int)GenericPlanRefusal.BadLedgerPlanPin, 4, "T01-r4");
            ChkEq((int)GenericPlanRefusal.BadTargetPath, 5, "T01-r5");
            ChkEq((int)GenericPlanRefusal.BadArgv, 6, "T01-r6");
            ChkEq((int)GenericPlanRefusal.BadCommandLine, 7, "T01-r7");
            ChkEq((int)GenericPlanRefusal.BadWorkingDirectory, 8, "T01-r8");
            ChkEq((int)GenericPlanRefusal.BadEnvironmentEntries, 9, "T01-r9");
            ChkEq((int)GenericPlanRefusal.BadEnvironmentBlock, 10, "T01-r10");
            ChkEq((int)GenericPlanRefusal.BadReservationBinding, 11, "T01-r11");
            ChkEq((int)GenericPlanRefusal.BadSourcePins, 12, "T01-r12");
            ChkEq((int)GenericPlanRefusal.BadOwnershipRootBindings, 13, "T01-r13");
            ChkEq((int)GenericPlanRefusal.BadQualificationMode, 14, "T01-r14");
            ChkEq((int)GenericPlanRefusal.ControlBudgetExceeded, 15, "T01-r15");
            ChkEq((int)GenericPlanRefusal.InternalEncodingFailure, 16, "T01-r16");
            ChkEq((int)GenericPlanRefusal.BadControlArtifacts, 17, "T01-r17");
            ChkEq((int)GenericPlanRefusal.BadEnvironmentAllowlist, 18, "T01-r18");
        }

        // ------------------------------------------------------------------
        // T02 - oracle self-check before any codec call (independent SHA over
        // the embedded golden bytes; standard library, not product code).
        // ------------------------------------------------------------------
        private static void RunT02()
        {
            ChkEq(GoldenRecordBytes.Length, GoldenCanonicalLength, "T02-len");
            ChkEq(Sha256Hex(GoldenRecordBytes), GoldenIntentSha256, "T02-intent");
            ChkEq(GoldenRecordBytes.Length + GoldenAdditionalBytes, GoldenControlFileBytes, "T02-ctrl");
            ChkEq(Sha256Hex(new byte[0]), EmptySha256Hex, "T02-empty");
            ChkEq(GoldenCanonicalLength + PaddingFirstThreeBytes + PaddingPayloadAcceptedLow, 32767, "T02-recipe1");
            ChkEq(GoldenCanonicalLength + PaddingFirstThreeBytes + PaddingPayloadAcceptedHigh, 32768, "T02-recipe2");
            ChkEq(GoldenCanonicalLength + PaddingFirstThreeBytes + PaddingPayloadRefused, 32769, "T02-recipe3");
        }

        // ------------------------------------------------------------------
        // T03 - codec argv positives (QA0-R2 literals + R2-clarified
        // primitives-without-policy vectors).
        // ------------------------------------------------------------------
        private static void RunT03()
        {
            EncArg("", "\"\"", "T03-a02");
            EncArg("x", "x", "T03-a01x");
            EncArg("a b", "\"a b\"", "T03-a03");
            EncArg("ab\"c", "\"ab\\\"c\"", "T03-a04");
            EncArg("dir\\", "dir\\", "T03-a05");
            EncArg("a b\\", "\"a b\\\\\"", "T03-a06");
            EncArg("x a\\\\", "\"x a\\\\\\\\\"", "T03-a07");
            EncArg("b\\\\c", "b\\\\c", "T03-a08");
            EncArg("b\\\"c", "\"b\\\\\\\"c\"", "T03-a09");
            EncArg("ab\"", "\"ab\\\"\"", "T03-a10");
            EncArg("\uD800\uDC00x", "\uD800\uDC00x", "T03-a11");
            EncArg("C:\\T\\app.exe", "C:\\T\\app.exe", "T03-a12");
            EncArg("-r", "-r", "T03-ar");
            EncArg("--preload", "--preload", "T03-apre");
            EncArg("--preload=x", "--preload=x", "T03-aprev");
            EncCmd(new string[] { "C:\\T\\app.exe" }, "C:\\T\\app.exe", "T03-c01");
            EncCmd(new string[] { "C:\\T\\app.exe", "" }, "C:\\T\\app.exe \"\"", "T03-c02");
            EncCmd(new string[] { "C:\\T\\app.exe", "a b" }, "C:\\T\\app.exe \"a b\"", "T03-c03");
            EncCmd(new string[] { "C:\\T\\app.exe", "dir\\" }, "C:\\T\\app.exe dir\\", "T03-c05");
            EncCmd(new string[] { "C:\\T\\app.exe", "b\\\\c" }, "C:\\T\\app.exe b\\\\c", "T03-c08");
            EncCmd(new string[] { "C:\\Program Files\\x\\app.exe" },
                "\"C:\\Program Files\\x\\app.exe\"", "T03-c15");
            EncCmd(new string[] { "C:\\T\\app.exe", "-r" }, "C:\\T\\app.exe -r", "T03-crr");
            EncCmd(new string[] { "C:\\T\\app.exe", "--preload" }, "C:\\T\\app.exe --preload", "T03-cpre");
            EncCmd(new string[] { "C:\\T\\app.exe", new string('x', 32753) },
                "C:\\T\\app.exe " + new string('x', 32753), "T03-a13");
            string[] r07Argv = new string[128];
            StringBuilder r07Expected = new StringBuilder();
            r07Argv[0] = "C:\\T\\app.exe";
            r07Expected.Append("C:\\T\\app.exe");
            for (int i = 1; i <= 127; i++)
            {
                r07Argv[i] = "a" + i.ToString();
                r07Expected.Append(' ');
                r07Expected.Append(r07Argv[i]);
            }
            EncCmd(r07Argv, r07Expected.ToString(), "T03-r07");
            ChkEq(r07Expected.Length, 539, "T03-r07len");
        }

        // ------------------------------------------------------------------
        // T04 - codec argv refusals.
        // ------------------------------------------------------------------
        private static void RunT04()
        {
            EncArgRefuse("\0x", "T04-r01");
            EncArgRefuse("a\tb", "T04-r02");
            EncArgRefuse("a\nb", "T04-r03");
            EncArgRefuse("\uD800x", "T04-r04");
            EncArgRefuse("\uDC00", "T04-r04b");
            EncCmdRefuse(new string[0], "T04-r06");
            string[] r05Argv = new string[129];
            r05Argv[0] = "C:\\T\\app.exe";
            for (int i = 1; i < 129; i++) r05Argv[i] = "a" + i.ToString();
            EncCmdRefuse(r05Argv, "T04-r05");
            string[] r08Argv = new string[129];
            r08Argv[0] = "C:\\T\\app.exe";
            for (int i = 1; i <= 128; i++) r08Argv[i] = "a" + i.ToString();
            EncCmdRefuse(r08Argv, "T04-r08");
            EncCmdRefuse(new string[] { "C:\\T\\app.exe", new string('x', 32754) }, "T04-r09");
            EncCmdRefuse(new string[] { "C:\\T\\app.exe", "\0x" }, "T04-r01c");
        }

        // ------------------------------------------------------------------
        // T05 - codec environment positives (encoder sorts caller entries).
        // ------------------------------------------------------------------
        private static void RunT05()
        {
            EncEnv(new string[0], "\0\0", "T05-a01");
            EncEnv(new string[] { "A=1", "B=2", "path=C:\\x" },
                "A=1\0B=2\0path=C:\\x\0\0", "T05-a02");
            EncEnv(new string[] { "a=1", "B=2" }, "a=1\0B=2\0\0", "T05-a03a");
            EncEnv(new string[] { "B=2", "a=1" }, "a=1\0B=2\0\0", "T05-a03b");
            EncEnv(new string[] { "B=2", "A=1" }, "A=1\0B=2\0\0", "T05-a03c");
            EncEnv(new string[] { "A=1" }, "A=1\0\0", "T05-a11");
            EncEnv(new string[] { "path=C:\\Program Files\\x" },
                "path=C:\\Program Files\\x\0\0", "T05-a16");
            EncEnv(new string[] { "A=" + new string('x', 32763) },
                "A=" + new string('x', 32763) + "\0\0", "T05-a12");
            EncEnv(new string[] { "C=3" }, "C=3\0\0", "T05-nopolicy");
        }

        // ------------------------------------------------------------------
        // T06 - codec environment refusals.
        // ------------------------------------------------------------------
        private static void RunT06()
        {
            EncEnvRefuse(new string[] { "PATH=1", "path=2" }, "T06-a04");
            EncEnvRefuse(new string[] { "a=1", "A=2" }, "T06-a04b");
            EncEnvRefuse(new string[] { "A" }, "T06-a05");
            EncEnvRefuse(new string[] { "=C:\\x" }, "T06-a06");
            EncEnvRefuse(new string[] { "A=1", "", "B=2" }, "T06-a07");
            EncEnvRefuse(new string[] { "A=\tx" }, "T06-a08");
            EncEnvRefuse(new string[] { "A=\0B" }, "T06-a09");
            EncEnvRefuse(new string[] { "A=\uD800x" }, "T06-a10");
            EncEnvRefuse(new string[] { "A=" + new string('x', 32764) }, "T06-a13");
            EncEnvRefuse(new string[] { "A=" + new string('x', 32765) }, "T06-a14");
        }

        // ------------------------------------------------------------------
        // T07 - golden positive plan: exact getters, exact canonical bytes,
        // derived intent, counters. Baseline oracle (whole record).
        // ------------------------------------------------------------------
        private static void RunT07()
        {
            GenericTargetPlanInput input = GoldenInput();
            GenericTargetPlanV1 plan = BuildOk(input, "T07");
            ChkEq(plan.Version, "generic-t-dual-1", "T07-ver");
            ChkEq(plan.TimeProfileId, "V3-Q1", "T07-tprof");
            ChkEq(plan.IntentSha256, GoldenIntentSha256, "T07-intent");
            ChkEq(plan.CanonicalByteCount, GoldenCanonicalLength, "T07-clen");
            ChkEq(plan.ControlFileByteCount, (long)GoldenControlFileBytes, "T07-cfb");
            ChkEq(plan.WindowsCommandLine, GoldenCommandLine, "T07-cmd");
            ChkEq(plan.WindowsCommandLine.Length, GoldenCommandLineUnits, "T07-cmdlen");
            ChkEq(plan.EnvironmentBlock, GoldenEnvironmentBlock, "T07-envblk");
            ChkEq(plan.EnvironmentEntries.Length, 2, "T07-envn");
            ChkEq(plan.EnvironmentEntries[0], "A=1", "T07-env0");
            ChkEq(plan.EnvironmentEntries[1], "B=2", "T07-env1");
            ChkEq(plan.AllowedEnvironmentNames.Length, 2, "T07-alln");
            ChkEq(plan.AllowedEnvironmentNames[0], "A", "T07-all0");
            ChkEq(plan.AllowedEnvironmentNames[1], "B", "T07-all1");
            ChkEq(plan.Argv.Length, 4, "T07-argn");
            ChkEq(plan.Argv[0], GoldenImagePath, "T07-arg0");
            ChkEq(plan.Argv[1], "", "T07-arg1");
            ChkEq(plan.Argv[2], "x y", "T07-arg2");
            ChkEq(plan.Argv[3], "b\\\"c", "T07-arg3");
            ChkEq(plan.TargetImagePath, GoldenImagePath, "T07-path");
            ChkEq(plan.TargetImageSha256, GoldenImageSha256, "T07-imgsha");
            ChkEq(plan.LeaseReceiptSha256, GoldenLeaseSha256, "T07-lease");
            ChkEq(plan.LedgerPlanSha256, GoldenLedgerSha256, "T07-ledger");
            ChkEq(plan.Identity.NonceHex, GoldenNonceHex, "T07-nonce");
            ChkEq(plan.Identity.Epoch, GoldenEpoch, "T07-epoch");
            ChkEq(plan.ReservationBinding.ReservationSha256, GoldenReservationSha256, "T07-resv");
            ChkEq(plan.ReservationBinding.ReservationEpoch, GoldenEpoch, "T07-resve");
            ChkEq(plan.SourcePins.Length, 1, "T07-pinn");
            ChkEq(plan.SourcePins[0].PathLabel, GoldenImagePath, "T07-pinlbl");
            ChkEq(plan.SourcePins[0].Bytes, 10L, "T07-pinb");
            ChkEq(plan.SourcePins[0].Sha256, GoldenImageSha256, "T07-pinsha");
            ChkEq(plan.OwnershipRootBindings.Length, 1, "T07-rootn");
            ChkEq(plan.OwnershipRootBindings[0].BindingLabel, "fixture-root", "T07-rootlbl");
            ChkEq(plan.OwnershipRootBindings[0].BindingSha256, GoldenRootSha256, "T07-rootsha");
            ChkEq(plan.OwnershipRootBindings[0].BindingEpoch, GoldenEpoch, "T07-roote");
            ChkEq((int)plan.QualificationMode, 1, "T07-mode");
            byte[] canonical = plan.GetCanonicalEncoding();
            ChkBytes(canonical, GoldenRecordBytes, "T07-canon");
            ChkEq(ReadU32(canonical, CanonicalModeOffset), 1L, "T07-modef");
            ChkEq(ReadU32(canonical, CanonicalAdditionalCountOffset), 4L, "T07-addc");
            ChkEq(ReadU32(canonical, Artifact0LengthOffset), 13L, "T07-a0len");
            ChkEq(ReadU32(canonical, Artifact3LengthOffset), 16L, "T07-a3len");
            byte[] canonicalSecond = plan.GetCanonicalEncoding();
            ChkBytes(canonicalSecond, GoldenRecordBytes, "T07-canon2");
            canonicalSecond[0] = 0xFF;
            byte[] canonicalThird = plan.GetCanonicalEncoding();
            ChkBytes(canonicalThird, GoldenRecordBytes, "T07-canon3");
            byte[][] artifacts = plan.GetAdditionalControlArtifacts();
            ChkEq(artifacts.Length, 4, "T07-artn");
            ChkBytes(artifacts[0], HexToBytes(GoldenArtifact0Hex), "T07-art0");
            ChkBytes(artifacts[1], HexToBytes(GoldenArtifact1Hex), "T07-art1");
            ChkBytes(artifacts[2], HexToBytes(GoldenArtifact2Hex), "T07-art2");
            ChkBytes(artifacts[3], HexToBytes(GoldenArtifact3Hex), "T07-art3");
            byte[] reencoded;
            GenericPlanRefusal reencodedRefusal;
            bool reencodedOk = GenericTargetPlanCodec.TryEncodeCanonical(plan, out reencoded, out reencodedRefusal);
            Chk(reencodedOk, "T07-rc.ok");
            ChkEq((int)reencodedRefusal, (int)GenericPlanRefusal.None, "T07-rc.r");
            ChkBytes(reencoded, GoldenRecordBytes, "T07-rc.bytes");
        }

        // ------------------------------------------------------------------
        // T08 - control budget padding: replace artifact index 3 only.
        // Record length stays 862 (lengths table + SHA32 only); totals
        // 32767/32768 accepted, 32769 refused. New table/hash values asserted
        // at offsets 826/830 - never equality with the baseline record.
        // ------------------------------------------------------------------
        private static void RunT08()
        {
            GenericTargetPlanInput low = GoldenInputWithArtifacts(PaddedArtifacts(PaddingPayloadAcceptedLow));
            GenericTargetPlanV1 lowPlan = BuildOk(low, "T08-32767");
            ChkEq(lowPlan.CanonicalByteCount, GoldenCanonicalLength, "T08-32767.cl");
            ChkEq(lowPlan.ControlFileByteCount, 32767L, "T08-32767.cf");
            byte[] lowCanonical = lowPlan.GetCanonicalEncoding();
            ChkEq(lowCanonical.Length, GoldenCanonicalLength, "T08-32767.bl");
            ChkEq(ReadU32(lowCanonical, Artifact3LengthOffset), 31865L, "T08-32767.lf");
            ChkEq(ReadHex(lowCanonical, Artifact3ShaOffset, 32), PaddedArtifactShaHex(PaddingPayloadAcceptedLow), "T08-32767.sh");

            GenericTargetPlanInput high = GoldenInputWithArtifacts(PaddedArtifacts(PaddingPayloadAcceptedHigh));
            GenericTargetPlanV1 highPlan = BuildOk(high, "T08-32768");
            ChkEq(highPlan.CanonicalByteCount, GoldenCanonicalLength, "T08-32768.cl");
            ChkEq(highPlan.ControlFileByteCount, 32768L, "T08-32768.cf");
            byte[] highCanonical = highPlan.GetCanonicalEncoding();
            ChkEq(highCanonical.Length, GoldenCanonicalLength, "T08-32768.bl");
            ChkEq(ReadU32(highCanonical, Artifact3LengthOffset), 31866L, "T08-32768.lf");
            ChkEq(ReadHex(highCanonical, Artifact3ShaOffset, 32), PaddedArtifactShaHex(PaddingPayloadAcceptedHigh), "T08-32768.sh");

            GenericTargetPlanInput over = GoldenInputWithArtifacts(PaddedArtifacts(PaddingPayloadRefused));
            BuildRefusal(over, GenericPlanRefusal.ControlBudgetExceeded, "T08-32769");
        }

        // ------------------------------------------------------------------
        // T09 - artifacts structural cases, null/invalid arrays and the
        // standalone TryCountControlFiles accounting (sums the arrays
        // actually provided; totals 32767/32768 accepted, 32769 refused;
        // no hidden 31906 threshold).
        // ------------------------------------------------------------------
        private static void RunT09()
        {
            GenericTargetPlanInput empty = GoldenInputWithArtifacts(new byte[0][]);
            GenericTargetPlanV1 emptyPlan = BuildOk(empty, "T09-empty");
            ChkEq(emptyPlan.CanonicalByteCount, 718, "T09-empty.cl");
            ChkEq(emptyPlan.ControlFileByteCount, 718L, "T09-empty.cf");
            byte[] emptyCanonical = emptyPlan.GetCanonicalEncoding();
            ChkEq(emptyCanonical.Length, 718, "T09-empty.bl");
            ChkEq(ReadU32(emptyCanonical, CanonicalAdditionalCountOffset), 0L, "T09-empty.ac");

            byte[][] seventeen = new byte[17][];
            for (int i = 0; i < 17; i++) seventeen[i] = HexToBytes(GoldenArtifact0Hex);
            BuildRefusal(GoldenInputWithArtifacts(seventeen), GenericPlanRefusal.BadControlArtifacts, "T09-a17");

            byte[][] innerNull = GoldenArtifacts();
            innerNull[2] = null;
            BuildRefusal(GoldenInputWithArtifacts(innerNull), GenericPlanRefusal.BadControlArtifacts, "T09-anull");

            byte[][] oversized = GoldenArtifacts();
            oversized[PaddingArtifactIndex] = new byte[32769];
            for (int i = 0; i < oversized[PaddingArtifactIndex].Length; i++) oversized[PaddingArtifactIndex][i] = 120;
            BuildRefusal(GoldenInputWithArtifacts(oversized), GenericPlanRefusal.BadControlArtifacts, "T09-abig");

            BuildRefusal(GoldenInputWithArtifacts(new byte[][] { new byte[32768] }),
                GenericPlanRefusal.ControlBudgetExceeded, "T09-a32k");

            CountRefuse(null, "T09-tc-null");
            byte[][] tcInnerNull = GoldenArtifacts();
            tcInnerNull[1] = null;
            CountRefuse(tcInnerNull, "T09-tc-innernull");
            CountOk(new byte[0][], 0L, "T09-tc-empty");
            CountOk(GoldenArtifacts(), 56L, "T09-tc-golden");
            CountOk(PaddedArtifacts(PaddingPayloadAcceptedLow), 31905L, "T09-tc-31905");
            CountOk(PaddedArtifacts(PaddingPayloadAcceptedHigh), 31906L, "T09-tc-31906");
            CountOk(PaddedArtifacts(PaddingPayloadRefused), 31907L, "T09-tc-31907");
            CountOk(new byte[][] { new byte[32767] }, 32767L, "T09-tc-32767");
            CountOk(new byte[][] { new byte[32768] }, 32768L, "T09-tc-32768");
            CountRefuse(new byte[][] { new byte[32769] }, "T09-tc-32769");

            BuildRefusal(null, GenericPlanRefusal.NullInput, "T09-innull");
            BuildRefusal(GoldenInputWithArgv(null), GenericPlanRefusal.BadArgv, "T09-argnull");
            BuildRefusal(GoldenInputWithEntries(null), GenericPlanRefusal.BadEnvironmentEntries, "T09-envnull");
            BuildRefusal(GoldenInputWithAllowlist(null), GenericPlanRefusal.BadEnvironmentAllowlist, "T09-allnull");
            BuildRefusal(GoldenInputWithPins(null), GenericPlanRefusal.BadSourcePins, "T09-pinnull");
            BuildRefusal(GoldenInputWithRoots(null), GenericPlanRefusal.BadOwnershipRootBindings, "T09-rootnull");
            BuildRefusal(GoldenInputWithReservation(null), GenericPlanRefusal.BadReservationBinding, "T09-resvnull");
            BuildRefusal(GoldenInputWithArtifacts(null), GenericPlanRefusal.BadControlArtifacts, "T09-artnull");
        }

        // ------------------------------------------------------------------
        // T10 - allowlist policy: closed Q1 names (ignore-case), structural
        // name rules, membership OrdinalIgnoreCase without normalization
        // (R3), --no-env-file allowed.
        // ------------------------------------------------------------------
        private static void RunT10()
        {
            BuildRefusal(GoldenInputWithAllowlist(new string[] { "node_options" }),
                GenericPlanRefusal.BadEnvironmentAllowlist, "T10-no1");
            BuildRefusal(GoldenInputWithAllowlist(new string[] { "Node_Options" }),
                GenericPlanRefusal.BadEnvironmentAllowlist, "T10-no2");
            BuildRefusal(GoldenInputWithAllowlist(new string[] { "BUN_OPTIONS" }),
                GenericPlanRefusal.BadEnvironmentAllowlist, "T10-no3");
            BuildRefusal(GoldenInputWithAllowlist(new string[] { "NODE_PATH" }),
                GenericPlanRefusal.BadEnvironmentAllowlist, "T10-no4");
            BuildRefusal(GoldenInputWithAllowlist(new string[] { "FF8_ENSEMBLE_SOURCE" }),
                GenericPlanRefusal.BadEnvironmentAllowlist, "T10-no5");
            BuildRefusal(GoldenInputWithAllowlist(new string[] { "A", "node_options" }),
                GenericPlanRefusal.BadEnvironmentAllowlist, "T10-no6");
            BuildRefusal(GoldenInputWithAllowlist(new string[] { "" }),
                GenericPlanRefusal.BadEnvironmentAllowlist, "T10-name0");
            BuildRefusal(GoldenInputWithAllowlist(new string[] { "1A" }),
                GenericPlanRefusal.BadEnvironmentAllowlist, "T10-name1");
            BuildRefusal(GoldenInputWithAllowlist(new string[] { "a-b" }),
                GenericPlanRefusal.BadEnvironmentAllowlist, "T10-name2");
            BuildRefusal(GoldenInputWithAllowlist(new string[] { "A", "a" }),
                GenericPlanRefusal.BadEnvironmentAllowlist, "T10-dup");
            BuildRefusal(GoldenInputWithAllowlist(new string[] { new string('a', 260) }),
                GenericPlanRefusal.BadEnvironmentAllowlist, "T10-name260");
            BuildRefusal(GoldenInputWithAllowlist(new string[] { "A\0B" }),
                GenericPlanRefusal.BadEnvironmentAllowlist, "T10-nameNUL");
            BuildRefusal(GoldenInputWithAllowlist(new string[] { "A\tB" }),
                GenericPlanRefusal.BadEnvironmentAllowlist, "T10-nameTAB");
            BuildRefusal(GoldenInputWithAllowlist(new string[] { "\uD800x" }),
                GenericPlanRefusal.BadEnvironmentAllowlist, "T10-nameSUR");
            string[] manyNames = new string[4097];
            for (int i = 0; i < 4097; i++) manyNames[i] = "E" + i.ToString();
            BuildRefusal(GoldenInputWithAllowlist(manyNames),
                GenericPlanRefusal.BadEnvironmentAllowlist, "T10-n4097");

            BuildRefusal(GoldenInputWithEntries(new string[] { "A=1", "C=2" }),
                GenericPlanRefusal.BadEnvironmentEntries, "T10-notallow");

            GenericTargetPlanInput caseLow = GoldenInput();
            caseLow.EnvironmentEntries = new string[] { "A=1" };
            caseLow.AllowedEnvironmentNames = new string[] { "a" };
            GenericTargetPlanV1 caseLowPlan = BuildOk(caseLow, "T10-mem1");
            ChkEq(caseLowPlan.EnvironmentEntries[0], "A=1", "T10-mem1v");
            ChkEq(caseLowPlan.CanonicalByteCount, 850, "T10-mem1cl");

            GenericTargetPlanInput caseHigh = GoldenInput();
            caseHigh.EnvironmentEntries = new string[] { "a=1" };
            caseHigh.AllowedEnvironmentNames = new string[] { "A" };
            GenericTargetPlanV1 caseHighPlan = BuildOk(caseHigh, "T10-mem2");
            ChkEq(caseHighPlan.EnvironmentEntries[0], "a=1", "T10-mem2v");
            ChkEq(caseHighPlan.CanonicalByteCount, 850, "T10-mem2cl");

            // Empty env + empty allowlist TryBuild positive (R2): exact
            // double-NUL block, empty lists, record 838 / control 894
            // (862 - 14 env bytes - 10 allowed bytes; payloads 56 unchanged).
            // Data-only incomplete host inventory, not a run permission.
            // Independent targeted oracle: no equality with the baseline
            // 862B record is claimed when the fixture changed.
            GenericTargetPlanInput emptyEnv = GoldenInput();
            emptyEnv.EnvironmentEntries = new string[0];
            emptyEnv.AllowedEnvironmentNames = new string[0];
            GenericTargetPlanV1 emptyEnvPlan = BuildOk(emptyEnv, "T10-env0");
            ChkEq(emptyEnvPlan.EnvironmentBlock, "\0\0", "T10-env0.blk");
            ChkEq(emptyEnvPlan.EnvironmentEntries.Length, 0, "T10-env0.en");
            ChkEq(emptyEnvPlan.AllowedEnvironmentNames.Length, 0, "T10-env0.aln");
            ChkEq(emptyEnvPlan.CanonicalByteCount, 838, "T10-env0.cl");
            ChkEq(emptyEnvPlan.ControlFileByteCount, 894L, "T10-env0.cf");
            byte[] emptyEnvCanonical = emptyEnvPlan.GetCanonicalEncoding();
            ChkEq(emptyEnvCanonical.Length, 838, "T10-env0.len");
            ChkEq(ReadU32(emptyEnvCanonical, CanonicalEnvCountOffset), 0L, "T10-env0.ec");
            ChkEq(ReadU32(emptyEnvCanonical, CanonicalAllowedCountOffset), 0L, "T10-env0.ac");

            BuildOk(GoldenInputWithArgv(new string[] { GoldenImagePath, "--no-env-file" }), "T10-noenvfile");
        }

        // ------------------------------------------------------------------
        // T11 - TryBuild argv flag policy (Q1): exact flags or flag=value
        // forms refused; -r bare and -r= prefix refused; primitives still
        // quote the same strings without policy (T03). Anti-overrefusal
        // positives keep the exactness rule honest.
        // ------------------------------------------------------------------
        private static void RunT11()
        {
            BuildRefusal(GoldenInputWithArgv(new string[] { GoldenImagePath, "--preload" }),
                GenericPlanRefusal.BadArgv, "T11-pre");
            BuildRefusal(GoldenInputWithArgv(new string[] { GoldenImagePath, "--require" }),
                GenericPlanRefusal.BadArgv, "T11-req");
            BuildRefusal(GoldenInputWithArgv(new string[] { GoldenImagePath, "--watch" }),
                GenericPlanRefusal.BadArgv, "T11-watch");
            BuildRefusal(GoldenInputWithArgv(new string[] { GoldenImagePath, "--hot" }),
                GenericPlanRefusal.BadArgv, "T11-hot");
            BuildRefusal(GoldenInputWithArgv(new string[] { GoldenImagePath, "--env-file" }),
                GenericPlanRefusal.BadArgv, "T11-envfile");
            BuildRefusal(GoldenInputWithArgv(new string[] { GoldenImagePath, "--preload=1" }),
                GenericPlanRefusal.BadArgv, "T11-prev");
            BuildRefusal(GoldenInputWithArgv(new string[] { GoldenImagePath, "--env-file=x" }),
                GenericPlanRefusal.BadArgv, "T11-envfilev");
            BuildRefusal(GoldenInputWithArgv(new string[] { GoldenImagePath, "-r" }),
                GenericPlanRefusal.BadArgv, "T11-r");
            BuildRefusal(GoldenInputWithArgv(new string[] { GoldenImagePath, "-r=value" }),
                GenericPlanRefusal.BadArgv, "T11-rv");

            BuildOk(GoldenInputWithArgv(new string[] { GoldenImagePath, "--requirefoo" }), "T11-ok1");
            BuildOk(GoldenInputWithArgv(new string[] { GoldenImagePath, "x--preloady" }), "T11-ok2");
            BuildOk(GoldenInputWithArgv(new string[] { GoldenImagePath, "x-r" }), "T11-ok3");
            BuildOk(GoldenInputWithArgv(new string[] { GoldenImagePath, "-rv" }), "T11-ok4");
            BuildOk(GoldenInputWithArgv(new string[] { GoldenImagePath, "-rmodule" }), "T11-ok5");
        }

        // ------------------------------------------------------------------
        // T12 - refusal order mapping (one mutation at a time, each negative
        // passes its prior guards), frozen CaseIdentity ctor preconditions,
        // aliasing and defensive copies, TryEncodeCanonical(null).
        // ------------------------------------------------------------------
        private static void RunT12()
        {
            // Identity: null is a real TryBuild refusal; invalid identities are
            // rejected by the frozen ctor (ABI preconditions, no reflection).
            GenericTargetPlanInput identityNull = GoldenInput();
            identityNull.Identity = null;
            BuildRefusal(identityNull, GenericPlanRefusal.BadIdentity, "T12-idnull");
            ChkArgThrow("A" + GoldenNonceHex.Substring(1), GoldenEpoch, "T12-idup");
            ChkArgThrow(GoldenNonceHex.Substring(0, 63), GoldenEpoch, "T12-id63");
            ChkArgThrow(GoldenNonceHex + "1", GoldenEpoch, "T12-id65");
            ChkArgThrow("g" + GoldenNonceHex.Substring(1), GoldenEpoch, "T12-idg");
            ChkArgThrow(GoldenNonceHex, 0L, "T12-ide0");
            ChkArgThrow(GoldenNonceHex, -1L, "T12-ideneg");
            sinkIdentity = new CaseIdentity(GoldenNonceHex, GoldenEpoch);
            Chk(sinkIdentity != null, "T12-idok");

            // Lease/image/ledger pins (steps 3/4).
            BuildRefusal(GoldenInputWithLease("A" + GoldenLeaseSha256.Substring(1)),
                GenericPlanRefusal.BadPin, "T12-leaseup");
            BuildRefusal(GoldenInputWithLease(GoldenLeaseSha256.Substring(0, 63)),
                GenericPlanRefusal.BadPin, "T12-lease63");
            BuildRefusal(GoldenInputWithLease("g" + GoldenLeaseSha256.Substring(1)),
                GenericPlanRefusal.BadPin, "T12-leaseg");
            BuildRefusal(GoldenInputWithImageSha("A" + GoldenImageSha256.Substring(1)),
                GenericPlanRefusal.BadPin, "T12-imgsha");
            BuildRefusal(GoldenInputWithLedger("A" + GoldenLedgerSha256.Substring(1)),
                GenericPlanRefusal.BadLedgerPlanPin, "T12-ledgerup");

            // Target paths (step 5). argv[0]/pin label untouched: the target
            // path step precedes the argv step, so these are deterministic 5.
            BuildRefusal(GoldenInputWithPath("C:/T/app.exe"), GenericPlanRefusal.BadTargetPath, "T12-pa");
            BuildRefusal(GoldenInputWithPath("app.exe"), GenericPlanRefusal.BadTargetPath, "T12-pb");
            BuildRefusal(GoldenInputWithPath("C:\\T\\app"), GenericPlanRefusal.BadTargetPath, "T12-pc");
            BuildRefusal(GoldenInputWithPath("C:\\T\\app.exe\"x"), GenericPlanRefusal.BadTargetPath, "T12-pd");
            BuildRefusal(GoldenInputWithPath("C:\\T\\a*p.exe"), GenericPlanRefusal.BadTargetPath, "T12-pe");
            BuildRefusal(GoldenInputWithPath("\u00C9:\\x\\app.exe"), GenericPlanRefusal.BadTargetPath, "T12-pf");
            string path260 = "C:\\d\\" + new string('x', 251) + ".exe";
            ChkEq(path260.Length, 260, "T12-ph.len");
            BuildRefusal(GoldenInputWithPath(path260), GenericPlanRefusal.BadTargetPath, "T12-ph");
            BuildRefusal(GoldenInputWithPath("C:\\Q\\app.exe "), GenericPlanRefusal.BadTargetPath, "T12-pc01");
            BuildRefusal(GoldenInputWithPath("C:\\Q\\app.exe."), GenericPlanRefusal.BadTargetPath, "T12-pc02");

            // 259-char ASCII path: three coordinated occurrences
            // (TargetImagePath, argv[0], image pin label) => canonical 1603,
            // control 1659. Data-syntax only, no real path/OS claim.
            string path259 = "C:\\d\\" + new string('x', 250) + ".exe";
            ChkEq(path259.Length, 259, "T12-pg.len");
            GenericTargetPlanInput path259Input = GoldenInput();
            path259Input.TargetImagePath = path259;
            path259Input.Argv = new string[] { path259, "", "x y", "b\\\"c" };
            path259Input.SourcePins = new GenericSourcePin[]
            {
                new GenericSourcePin(path259, 10L, GoldenImageSha256)
            };
            GenericTargetPlanV1 path259Plan = BuildOk(path259Input, "T12-pg");
            ChkEq(path259Plan.CanonicalByteCount, 1603, "T12-pg.cl");
            ChkEq(path259Plan.ControlFileByteCount, 1659L, "T12-pg.cf");
            byte[] path259Canonical = path259Plan.GetCanonicalEncoding();
            ChkEq(path259Canonical.Length, 1603, "T12-pg.bl");
            ChkEq(ReadU32(path259Canonical, CanonicalImagePathLengthOffset), 259L, "T12-pg.po");
            ChkEq(ReadU32(path259Canonical, LongImageArgv0LengthOffset), 259L, "T12-pg.ao");
            ChkEq(ReadU32(path259Canonical, LongImagePin0LabelLengthOffset), 259L, "T12-pg.plo");

            // argv0/image mismatch (P1 -> 6), command line overflow (P5 -> 7),
            // real plan cost of the 32766 codec vector (budget 15).
            BuildRefusal(GoldenInputWithArgv(new string[] { "C:\\Other\\app.exe", "", "x y", "b\\\"c" }),
                GenericPlanRefusal.BadArgv, "T12-argv0");
            BuildRefusal(GoldenInputWithArgv(new string[] { GoldenImagePath, new string('y', 32754) }),
                GenericPlanRefusal.BadCommandLine, "T12-cmdover");
            BuildRefusal(GoldenInputWithArgv(new string[] { GoldenImagePath, new string('x', 32753) }),
                GenericPlanRefusal.ControlBudgetExceeded, "T12-a13cost");

            // Working directory (step 8); trailing space stays syntax-only ok.
            BuildRefusal(GoldenInputWithWorkingDirectory("C:/T"),
                GenericPlanRefusal.BadWorkingDirectory, "T12-cwd1");
            BuildRefusal(GoldenInputWithWorkingDirectory("T"),
                GenericPlanRefusal.BadWorkingDirectory, "T12-cwd2");
            GenericTargetPlanInput cwdSpace = GoldenInputWithWorkingDirectory("C:\\Q ");
            GenericTargetPlanV1 cwdSpacePlan = BuildOk(cwdSpace, "T12-cwd3");
            ChkEq(cwdSpacePlan.CanonicalByteCount, 863, "T12-cwd3.cl");

            // Environment entries structural (step 9) after valid allowlist.
            BuildRefusal(GoldenInputWithEntries(new string[] { "A=1", "" }),
                GenericPlanRefusal.BadEnvironmentEntries, "T12-e1");
            BuildRefusal(GoldenInputWithEntries(new string[] { "A" }),
                GenericPlanRefusal.BadEnvironmentEntries, "T12-e2");
            BuildRefusal(GoldenInputWithEntries(new string[] { "=x" }),
                GenericPlanRefusal.BadEnvironmentEntries, "T12-e3");
            BuildRefusal(GoldenInputWithEntries(new string[] { "A=\0B" }),
                GenericPlanRefusal.BadEnvironmentEntries, "T12-e4");
            BuildRefusal(GoldenInputWithEntries(new string[] { "A=\tx" }),
                GenericPlanRefusal.BadEnvironmentEntries, "T12-e5");
            BuildRefusal(GoldenInputWithEntries(new string[] { "A=\uD800x" }),
                GenericPlanRefusal.BadEnvironmentEntries, "T12-e6");
            string[] manyEntries = new string[4097];
            for (int i = 0; i < 4097; i++) manyEntries[i] = "E" + i.ToString() + "=1";
            BuildRefusal(GoldenInputWithEntries(manyEntries),
                GenericPlanRefusal.BadEnvironmentEntries, "T12-e4097");

            // Environment block overflow (P6 -> 10) from raw-valid entries
            // (each <= 32765, sorted, allowlisted; block 32772 > 32767).
            BuildRefusal(GoldenInputWithEntries(new string[]
            {
                "A=" + new string('x', 16382),
                "B=" + new string('y', 16382)
            }), GenericPlanRefusal.BadEnvironmentBlock, "T12-blk");

            // Reservation (step 11).
            BuildRefusal(GoldenInputWithReservation(new GenericPlanReservationBinding(
                "A" + GoldenReservationSha256.Substring(1), GoldenEpoch)),
                GenericPlanRefusal.BadReservationBinding, "T12-resvup");
            BuildRefusal(GoldenInputWithReservation(new GenericPlanReservationBinding(
                GoldenReservationSha256, 0L)),
                GenericPlanRefusal.BadReservationBinding, "T12-resv0");
            BuildRefusal(GoldenInputWithReservation(new GenericPlanReservationBinding(
                GoldenReservationSha256, -1L)),
                GenericPlanRefusal.BadReservationBinding, "T12-resvneg");

            // Source pins (step 12): E3/E8 data rules; repeated SHA under
            // distinct labels allowed; duplicate label / image mismatch denied.
            GenericSourcePin imagePin = new GenericSourcePin(GoldenImagePath, 10L, GoldenImageSha256);
            BuildRefusal(GoldenInputWithPins(new GenericSourcePin[]
            {
                imagePin, new GenericSourcePin(GoldenImagePath, 10L, GoldenImageSha256)
            }), GenericPlanRefusal.BadSourcePins, "T12-pdup");
            BuildRefusal(GoldenInputWithPins(new GenericSourcePin[]
            {
                new GenericSourcePin("C:\\Q\\other.exe", 10L, GoldenImageSha256)
            }), GenericPlanRefusal.BadSourcePins, "T12-pnolbl");
            BuildRefusal(GoldenInputWithPins(new GenericSourcePin[]
            {
                new GenericSourcePin(GoldenImagePath, 10L, GoldenRootSha256)
            }), GenericPlanRefusal.BadSourcePins, "T12-pimgsha");
            BuildRefusal(GoldenInputWithPins(new GenericSourcePin[]
            {
                new GenericSourcePin(GoldenImagePath, 0L, GoldenImageSha256)
            }), GenericPlanRefusal.BadSourcePins, "T12-pimg0");
            BuildRefusal(GoldenInputWithPins(new GenericSourcePin[]
            {
                imagePin, new GenericSourcePin("p2", -1L, GoldenRootSha256)
            }), GenericPlanRefusal.BadSourcePins, "T12-pneg");
            BuildRefusal(GoldenInputWithPins(new GenericSourcePin[]
            {
                imagePin, new GenericSourcePin("p2", 2147483648L, GoldenRootSha256)
            }), GenericPlanRefusal.BadSourcePins, "T12-pbig");
            BuildRefusal(GoldenInputWithPins(new GenericSourcePin[]
            {
                imagePin, new GenericSourcePin("C:\\d\\" + new string('x', 255), 1L, GoldenRootSha256)
            }), GenericPlanRefusal.BadSourcePins, "T12-plbl260");
            BuildRefusal(GoldenInputWithPins(new GenericSourcePin[]
            {
                imagePin, new GenericSourcePin("a\0b", 1L, GoldenRootSha256)
            }), GenericPlanRefusal.BadSourcePins, "T12-plblnul");
            BuildRefusal(GoldenInputWithPins(new GenericSourcePin[]
            {
                imagePin, new GenericSourcePin("a\uD800b", 1L, GoldenRootSha256)
            }), GenericPlanRefusal.BadSourcePins, "T12-plblsur");
            GenericSourcePin[] tooManyPins = new GenericSourcePin[65];
            tooManyPins[0] = imagePin;
            for (int i = 1; i < 65; i++) tooManyPins[i] = new GenericSourcePin("p" + i.ToString(), 1L, GoldenRootSha256);
            BuildRefusal(GoldenInputWithPins(tooManyPins), GenericPlanRefusal.BadSourcePins, "T12-p65");

            // Repeated SHA under distinct labels (E3, correction 5): +82 => 944.
            GenericTargetPlanInput twinSha = GoldenInputWithPins(new GenericSourcePin[]
            {
                imagePin, new GenericSourcePin("p2", 10L, GoldenImageSha256)
            });
            GenericTargetPlanV1 twinShaPlan = BuildOk(twinSha, "T12-p2");
            ChkEq(twinShaPlan.CanonicalByteCount, 944, "T12-p2.cl");
            byte[] twinCanonical = twinShaPlan.GetCanonicalEncoding();
            ChkEq(ReadU32(twinCanonical, CanonicalPin1LabelLengthOffset), 2L, "T12-p2.lo");
            ChkEq(twinCanonical[CanonicalPin1LabelCharsOffset], (byte)'p', "T12-p2.c0");

            // Zero-byte non-image source pin (E3): label "empty", Bytes 0,
            // SHA256(empty) => +85 => 947.
            GenericTargetPlanInput zeroPin = GoldenInputWithPins(new GenericSourcePin[]
            {
                imagePin, new GenericSourcePin("empty", 0L, Sha256Hex(new byte[0]))
            });
            GenericTargetPlanV1 zeroPinPlan = BuildOk(zeroPin, "T12-zb");
            ChkEq(zeroPinPlan.CanonicalByteCount, 947, "T12-zb.cl");
            ChkEq(zeroPinPlan.SourcePins[1].Bytes, 0L, "T12-zb.b");
            byte[] zeroCanonical = zeroPinPlan.GetCanonicalEncoding();
            ChkEq(ReadU32(zeroCanonical, CanonicalPin1LabelLengthOffset), 5L, "T12-zb.lo");
            ChkEq(zeroCanonical[CanonicalPin1LabelCharsOffset], (byte)'e', "T12-zb.c0");

            // Ownership roots (step 13).
            BuildRefusal(GoldenInputWithRoots(new GenericOwnershipRootBinding[]
            {
                new GenericOwnershipRootBinding("fixture-root", GoldenRootSha256, GoldenEpoch),
                new GenericOwnershipRootBinding("fixture-root", GoldenRootSha256, GoldenEpoch)
            }), GenericPlanRefusal.BadOwnershipRootBindings, "T12-rdup");
            BuildRefusal(GoldenInputWithRoots(new GenericOwnershipRootBinding[]
            {
                new GenericOwnershipRootBinding("C:\\d\\" + new string('x', 255), GoldenRootSha256, GoldenEpoch)
            }), GenericPlanRefusal.BadOwnershipRootBindings, "T12-rlbl260");
            BuildRefusal(GoldenInputWithRoots(new GenericOwnershipRootBinding[]
            {
                new GenericOwnershipRootBinding("a\0b", GoldenRootSha256, GoldenEpoch)
            }), GenericPlanRefusal.BadOwnershipRootBindings, "T12-rlblnul");
            BuildRefusal(GoldenInputWithRoots(new GenericOwnershipRootBinding[]
            {
                new GenericOwnershipRootBinding("a\uD800b", GoldenRootSha256, GoldenEpoch)
            }), GenericPlanRefusal.BadOwnershipRootBindings, "T12-rlblsur");
            BuildRefusal(GoldenInputWithRoots(new GenericOwnershipRootBinding[]
            {
                new GenericOwnershipRootBinding("fixture-root", "A" + GoldenRootSha256.Substring(1), GoldenEpoch)
            }), GenericPlanRefusal.BadOwnershipRootBindings, "T12-rsha");
            BuildRefusal(GoldenInputWithRoots(new GenericOwnershipRootBinding[]
            {
                new GenericOwnershipRootBinding("fixture-root", GoldenRootSha256, 0L)
            }), GenericPlanRefusal.BadOwnershipRootBindings, "T12-re0");
            GenericOwnershipRootBinding[] tooManyRoots = new GenericOwnershipRootBinding[17];
            for (int i = 0; i < 17; i++)
            {
                tooManyRoots[i] = new GenericOwnershipRootBinding("r" + i.ToString(), GoldenRootSha256, GoldenEpoch);
            }
            BuildRefusal(GoldenInputWithRoots(tooManyRoots), GenericPlanRefusal.BadOwnershipRootBindings, "T12-r17");
            BuildRefusal(GoldenInputWithRoots(new GenericOwnershipRootBinding[]
            {
                new GenericOwnershipRootBinding("fixture-root", GoldenRootSha256, GoldenEpoch), null
            }), GenericPlanRefusal.BadOwnershipRootBindings, "T12-rnull");

            // Qualification mode (step 14): 0 and 15 refuse; C14 accepted with
            // the mode u32 pinned at offset 614.
            BuildRefusal(GoldenInputWithMode((GenericQualificationMode)0),
                GenericPlanRefusal.BadQualificationMode, "T12-m0");
            BuildRefusal(GoldenInputWithMode((GenericQualificationMode)15),
                GenericPlanRefusal.BadQualificationMode, "T12-m15");
            GenericTargetPlanInput c14 = GoldenInputWithMode(GenericQualificationMode.C14);
            GenericTargetPlanV1 c14Plan = BuildOk(c14, "T12-c14");
            ChkEq(c14Plan.CanonicalByteCount, GoldenCanonicalLength, "T12-c14.cl");
            byte[] c14Canonical = c14Plan.GetCanonicalEncoding();
            ChkEq(ReadU32(c14Canonical, CanonicalModeOffset), 14L, "T12-c14.mo");

            // Aliased artifact instances and defensive copies (C12a-d).
            byte[] shared = HexToBytes(GoldenArtifact0Hex);
            GenericTargetPlanInput aliasTwo = GoldenInputWithArtifacts(new byte[][] { shared, shared });
            GenericTargetPlanV1 aliasTwoPlan = BuildOk(aliasTwo, "T12-al2");
            ChkEq(aliasTwoPlan.CanonicalByteCount, 790, "T12-al2.cl");
            ChkEq(aliasTwoPlan.ControlFileByteCount, 816L, "T12-al2.cf");
            shared[0] = 0xFF;
            byte[][] aliasSnapshot = aliasTwoPlan.GetAdditionalControlArtifacts();
            ChkEq(aliasSnapshot.Length, 2, "T12-al2.n");
            Chk(aliasSnapshot[0][0] == (byte)0x4F, "T12-al2.deep");

            byte[] aliasSource = HexToBytes(GoldenArtifact0Hex);
            GenericTargetPlanInput aliasInput = GoldenInputWithArtifacts(new byte[][] { aliasSource, aliasSource });
            GenericTargetPlanV1 aliasPlan = BuildOk(aliasInput, "T12-ala");
            aliasSource[1] = 0xFF;
            byte[][] aliasAfter = aliasPlan.GetAdditionalControlArtifacts();
            Chk(aliasAfter[0][1] != (byte)0xFF, "T12-ala.v");
            Chk(BytesEqual(aliasAfter[0], HexToBytes(GoldenArtifact0Hex)), "T12-ala.b");

            // Caller array mutation after build (a/b).
            GenericTargetPlanInput defInput = GoldenInput();
            string[] callerArgv = defInput.Argv;
            GenericTargetPlanV1 defPlan = BuildOk(defInput, "T12-dfa");
            callerArgv[1] = "mutated";
            ChkEq(defPlan.Argv.Length, 4, "T12-dfa.n");
            ChkEq(defPlan.Argv[1], "", "T12-dfa.v");

            GenericTargetPlanInput defInput2 = GoldenInput();
            string[] callerEntries = defInput2.EnvironmentEntries;
            GenericTargetPlanV1 defPlan2 = BuildOk(defInput2, "T12-dfb");
            callerEntries[0] = "Z=9";
            ChkEq(defPlan2.EnvironmentEntries.Length, 2, "T12-dfb.n");
            ChkEq(defPlan2.EnvironmentBlock, GoldenEnvironmentBlock, "T12-dfb.v");

            // Returned arrays mutation (c): internal state intact.
            byte[] canonicalOut = defPlan.GetCanonicalEncoding();
            canonicalOut[0] = 0xFF;
            ChkBytes(defPlan.GetCanonicalEncoding(), GoldenRecordBytes, "T12-dfc");
            byte[][] artifactsOut = defPlan.GetAdditionalControlArtifacts();
            artifactsOut[0][0] = 0xFF;
            ChkBytes(defPlan.GetAdditionalControlArtifacts()[0], HexToBytes(GoldenArtifact0Hex), "T12-dfd");

            // TryEncodeCanonical(null): false, canonical null, refusal != None
            // (R3; no enum value imposed).
            GenericTargetPlanV1 nullPlan = null;
            byte[] nullCanonical = new byte[1];
            GenericPlanRefusal nullRefusal = GenericPlanRefusal.None;
            bool nullOk = GenericTargetPlanCodec.TryEncodeCanonical(nullPlan, out nullCanonical, out nullRefusal);
            Chk(!nullOk, "T12-ecn.f");
            Chk(nullCanonical == null, "T12-ecn.n");
            Chk((int)nullRefusal != (int)GenericPlanRefusal.None, "T12-ecn.r");
        }

        // ------------------------------------------------------------------
        // Entry point. Runs the groups, emits the bounded summary, returns
        // 0 when every assertion held, 1 otherwise. Run by the parent only.
        // ------------------------------------------------------------------
        internal static int Main(string[] args)
        {
            RunT01();
            RunT02();
            RunT03();
            RunT04();
            RunT05();
            RunT06();
            RunT07();
            RunT08();
            RunT09();
            RunT10();
            RunT11();
            RunT12();
            string summary;
            if (failedAsserts == 0)
            {
                summary = "PASS a=" + totalAsserts.ToString() + "\n";
            }
            else
            {
                summary = "FAIL a=" + totalAsserts.ToString() + " f=" + failedAsserts.ToString() + "\n";
            }
            if (truncated)
            {
                if (consoleBytes + TruncationTagBytes <= ConsoleCapBytes)
                {
                    Console.Write(TruncationTag);
                    consoleBytes += TruncationTagBytes;
                }
                if (consoleBytes + summary.Length <= ConsoleCapBytes)
                {
                    Console.Write(summary);
                    consoleBytes += summary.Length;
                }
            }
            else
            {
                Console.Write(summary);
                consoleBytes += summary.Length;
            }
            return failedAsserts == 0 ? 0 : 1;
        }
    }
}
