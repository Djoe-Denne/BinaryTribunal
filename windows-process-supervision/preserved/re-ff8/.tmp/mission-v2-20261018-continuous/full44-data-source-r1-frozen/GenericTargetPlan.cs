// GenericTargetPlan.cs — proposed DATA_ONLY source, author full44-q1-data-author-r1.
// Task task_mvdy1o3t_000j_oo31db (team mission-a58a462638c0db92). Applies the
// parent-fixed API FULL44_Q1_API_FIXED_R1.md
// (sha256 d84313a6741998985c0acedf2a3d8ea49fbf485b53d424ef869d6670444c9a41)
// on top of RATIFICATION.md (partial Q1 data/codec slice, Q1 only) and
// GENERIC_T_CONTRACT.md section 2 / DUAL_STREAM_BUDGET.md / QUALIFICATION_MATRIX.md.
// Namespace sibling ReGraph.GuardV3. .NET 4 / C# 4 only: no auto-properties,
// no expression-bodied members, no string interpolation, no nameof.
// Pure data: no IO, no Process, no PInvoke, no Stream, no Thread, no network,
// no clock, no Job, no file access. SHA256 memory-only, plus UTF-8 strict
// encoding. Frozen references reused read-only in the same assembly (E9):
// CaseIdentity, GuardV3Contract, GuardianPredicates, GuardianMemoryEvidence.
// A validated value here is DATA ONLY: never a trusted authority, never a
// lease, never a proof, never an acquired OS pin. This source was written
// without being compiled or executed by its author; parent-only V fresh and
// compile gates apply. The Q1 caps (setup5000/normal20000/cleanup30000/
// total55000 ms, evidence 262144, capture 114688, control 32768) are NOT
// changed by this file and the 125s profile stays non-ratified and unused.
using System;
using System.Security.Cryptography;
using System.Text;

namespace ReGraph.GuardV3
{
    // Bounded data-profile limits ratified by FULL44_Q1_API_FIXED_R1.md (E7).
    // Never a runtime debit, never a writer, never an admission proof.
    internal static class GenericTargetPlanContract
    {
        internal const string Version = "generic-t-dual-1";
        internal const string TimeProfileQ1 = "V3-Q1";
        internal const string WindowsArgvCodecId = "win-quote-v1";
        internal const string WindowsEnvCodecId = "win-env-v1";
        internal const string CanonicalEncodingId = "gtplan-canonical-v1";
        internal const int MaxArgumentCount = 128;
        internal const int MaxCommandLineChars = 32766;
        internal const int MaxEnvironmentBlockUnits = 32767;
        // Same ratified numeric bound (4096) covers entries and allowlist names.
        internal const int MaxEnvironmentEntries = 4096;
        internal const int MaxSourcePins = 64;
        internal const int MaxOwnershipRootBindings = 16;
        internal const int MaxLabelChars = 259;
        internal const int MaxAdditionalControlArtifacts = 16;
        // The aggregate control bound is the frozen GuardV3Contract
        // .MaxControlFileBytes (32768); no new sub-cap was created (E6).
    }

    // Data-only future qualification intent label, C01..C14 exactly
    // (QUALIFICATION_MATRIX.md section 2). Never a capability; full44 is not a
    // value of this enum and no mode is executed by this module.
    internal enum GenericQualificationMode
    {
        C01 = 1, C02 = 2, C03 = 3, C04 = 4, C05 = 5, C06 = 6, C07 = 7,
        C08 = 8, C09 = 9, C10 = 10, C11 = 11, C12 = 12, C13 = 13, C14 = 14
    }

    // Bounded first-wins refusal codes; the frozen TryBuild order that maps
    // them is documented in DESIGN.md and never throws for invalid data.
    internal enum GenericPlanRefusal
    {
        None = 0, NullInput = 1, BadIdentity = 2, BadPin = 3, BadLedgerPlanPin = 4,
        BadTargetPath = 5, BadArgv = 6, BadCommandLine = 7, BadWorkingDirectory = 8,
        BadEnvironmentEntries = 9, BadEnvironmentBlock = 10, BadReservationBinding = 11,
        BadSourcePins = 12, BadOwnershipRootBindings = 13, BadQualificationMode = 14,
        ControlBudgetExceeded = 15, InternalEncodingFailure = 16,
        BadControlArtifacts = 17, BadEnvironmentAllowlist = 18
    }

    // Metadata DTOs: scalar provenance labels only. None of these values
    // grants a lease, handle, path authority, permission or OS right; every
    // validation of them is data-only (RATIFICATION.md:39-40).
    internal sealed class GenericPlanReservationBinding
    {
        internal readonly string ReservationSha256;
        internal readonly long ReservationEpoch;
        internal GenericPlanReservationBinding(string reservationSha256,
            long reservationEpoch)
        {
            ReservationSha256 = reservationSha256;
            ReservationEpoch = reservationEpoch;
        }
    }

    internal sealed class GenericSourcePin
    {
        internal readonly string PathLabel;
        internal readonly long Bytes;
        internal readonly string Sha256;
        internal GenericSourcePin(string pathLabel, long bytes, string sha256)
        {
            PathLabel = pathLabel; Bytes = bytes; Sha256 = sha256;
        }
    }

    internal sealed class GenericOwnershipRootBinding
    {
        internal readonly string BindingLabel;
        internal readonly string BindingSha256;
        internal readonly long BindingEpoch;
        internal GenericOwnershipRootBinding(string bindingLabel,
            string bindingSha256, long bindingEpoch)
        {
            BindingLabel = bindingLabel; BindingSha256 = bindingSha256;
            BindingEpoch = bindingEpoch;
        }
    }

    // Mutable caller descriptor. TryBuild snapshots and defensively copies
    // every field once at entry; any later mutation of this object has no
    // effect on a built plan. No field is read twice by TryBuild.
    internal sealed class GenericTargetPlanInput
    {
        internal CaseIdentity Identity;
        internal string LeaseReceiptSha256;
        internal string LedgerPlanSha256;
        internal string TargetImagePath;
        internal string TargetImageSha256;
        internal string WorkingDirectory;
        internal string[] Argv;
        internal string[] EnvironmentEntries;
        internal string[] AllowedEnvironmentNames;
        internal GenericPlanReservationBinding ReservationBinding;
        internal GenericSourcePin[] SourcePins;
        internal GenericOwnershipRootBinding[] OwnershipRootBindings;
        internal GenericQualificationMode QualificationMode;
        internal byte[][] AdditionalControlArtifacts;
    }

    // Immutable validated plan. Construction is restricted to the validated
    // codec path (GenericTargetPlanCodec.TryBuild); there is no public raw
    // constructor and no new authority is exposed. Every array getter/method
    // returns a fresh defensive copy, including nested byte arrays. Strings
    // are immutable in .NET and stored by reference; the CaseIdentity is the
    // frozen immutable type stored by reference.
    internal sealed class GenericTargetPlanV1
    {
        private readonly CaseIdentity identity;
        private readonly string leaseReceiptSha256, ledgerPlanSha256;
        private readonly string targetImagePath, targetImageSha256;
        private readonly string[] argv;
        private readonly string windowsCommandLine, workingDirectory;
        private readonly string[] environmentEntries;
        private readonly string environmentBlock;
        private readonly string[] allowedEnvironmentNames;
        private readonly string intentSha256;
        private readonly GenericPlanReservationBinding reservationBinding;
        private readonly GenericSourcePin[] sourcePins;
        private readonly string timeProfileId;
        private readonly GenericQualificationMode qualificationMode;
        private readonly GenericOwnershipRootBinding[] ownershipRootBindings;
        private readonly byte[][] additionalControlArtifacts;
        private readonly byte[] canonicalBytes;
        private readonly long controlFileByteCount;

        // Internal constructor reached only from TryBuild after full
        // validation and encoding; all fields are already-owned copies.
        internal GenericTargetPlanV1(CaseIdentity identity,
            string leaseReceiptSha256, string ledgerPlanSha256,
            string targetImagePath, string targetImageSha256,
            string[] argv, string windowsCommandLine, string workingDirectory,
            string[] environmentEntries, string environmentBlock,
            string[] allowedEnvironmentNames, string intentSha256,
            GenericPlanReservationBinding reservationBinding,
            GenericSourcePin[] sourcePins, string timeProfileId,
            GenericQualificationMode qualificationMode,
            GenericOwnershipRootBinding[] ownershipRootBindings,
            byte[][] additionalControlArtifacts, byte[] canonicalBytes,
            long controlFileByteCount)
        {
            if (identity == null || leaseReceiptSha256 == null
                || ledgerPlanSha256 == null || targetImagePath == null
                || targetImageSha256 == null || argv == null
                || windowsCommandLine == null || workingDirectory == null
                || environmentEntries == null || environmentBlock == null
                || allowedEnvironmentNames == null || intentSha256 == null
                || reservationBinding == null || sourcePins == null
                || timeProfileId == null || ownershipRootBindings == null
                || additionalControlArtifacts == null || canonicalBytes == null)
                throw new ArgumentException("Invalid generic target plan construction");
            this.identity = identity;
            this.leaseReceiptSha256 = leaseReceiptSha256;
            this.ledgerPlanSha256 = ledgerPlanSha256;
            this.targetImagePath = targetImagePath;
            this.targetImageSha256 = targetImageSha256;
            this.argv = argv;
            this.windowsCommandLine = windowsCommandLine;
            this.workingDirectory = workingDirectory;
            this.environmentEntries = environmentEntries;
            this.environmentBlock = environmentBlock;
            this.allowedEnvironmentNames = allowedEnvironmentNames;
            this.intentSha256 = intentSha256;
            this.reservationBinding = reservationBinding;
            this.sourcePins = sourcePins;
            this.timeProfileId = timeProfileId;
            this.qualificationMode = qualificationMode;
            this.ownershipRootBindings = ownershipRootBindings;
            this.additionalControlArtifacts = additionalControlArtifacts;
            this.canonicalBytes = canonicalBytes;
            this.controlFileByteCount = controlFileByteCount;
        }

        internal string Version { get { return GenericTargetPlanContract.Version; } }
        internal CaseIdentity Identity { get { return identity; } }
        internal string LeaseReceiptSha256 { get { return leaseReceiptSha256; } }
        internal string LedgerPlanSha256 { get { return ledgerPlanSha256; } }
        internal string TargetImagePath { get { return targetImagePath; } }
        internal string TargetImageSha256 { get { return targetImageSha256; } }
        internal string[] Argv { get { return GenericTargetPlanCodec.CopyStrings(argv); } }
        internal string WindowsCommandLine { get { return windowsCommandLine; } }
        internal string WorkingDirectory { get { return workingDirectory; } }
        internal string[] EnvironmentEntries
        { get { return GenericTargetPlanCodec.CopyStrings(environmentEntries); } }
        internal string EnvironmentBlock { get { return environmentBlock; } }
        internal string[] AllowedEnvironmentNames
        { get { return GenericTargetPlanCodec.CopyStrings(allowedEnvironmentNames); } }
        internal string IntentSha256 { get { return intentSha256; } }
        internal GenericPlanReservationBinding ReservationBinding
        { get { return reservationBinding; } }
        internal GenericSourcePin[] SourcePins
        { get { return GenericTargetPlanCodec.CopyPins(sourcePins); } }
        internal string TimeProfileId { get { return timeProfileId; } }
        internal GenericQualificationMode QualificationMode
        { get { return qualificationMode; } }
        internal GenericOwnershipRootBinding[] OwnershipRootBindings
        { get { return GenericTargetPlanCodec.CopyRoots(ownershipRootBindings); } }
        internal int CanonicalByteCount { get { return canonicalBytes.Length; } }
        internal long ControlFileByteCount { get { return controlFileByteCount; } }

        internal byte[] GetCanonicalEncoding()
        { return (byte[])canonicalBytes.Clone(); }

        internal byte[][] GetAdditionalControlArtifacts()
        { return GenericTargetPlanCodec.CopyJagged(additionalControlArtifacts); }
    }

    // The only validated construction path. Pure deterministic data codecs;
    // invalid data yields bounded refusal codes in the frozen order, never
    // unbounded exceptions, and no catch converts an unknown state into
    // success. This codec is neither a writer nor a runtime debit: it writes
    // no file, charges no ledger and performs no I/O of any kind.
    internal static class GenericTargetPlanCodec
    {
        // E4: strict UTF-8, no BOM, throws on invalid sequences such as an
        // isolated surrogate (validated data never reaches this state).
        private static readonly UTF8Encoding StrictUtf8 = new UTF8Encoding(false, true);

        // Q1 closed data policy (FULL44_Q1_API_FIXED_R1.md). These refusals are
        // a ratified data profile for THIS slice, not a universal proof that an
        // unknown target would ignore any other option. The primitive codecs
        // stay independent of this policy; only TryBuild applies it.
        private static readonly string[] ClosedEnvironmentNames = new string[]
        {
            "NODE_OPTIONS", "BUN_OPTIONS", "NODE_PATH", "FF8_ENSEMBLE_SOURCE"
        };
        private static readonly string[] ClosedArgvFlags = new string[]
        {
            "--preload", "--require", "--watch", "--hot", "--env-file"
        };
        // Refused only in the "-r=value" form (ratified wording); the bare
        // "-r" argument is not refused by this data profile, and "--no-env-file"
        // is allowed because it is neither the exact flag nor the "=" prefix.
        private const string ShortRequireFlag = "-r=";

        // Frozen order: NullInput, identity, lease/image pins, ledger pin,
        // targetpath, argv (including flags policy), commandline, cwd,
        // allowlist(18), entries(9), envblock(10), reservation,
        // sources(image bound), roots, mode, artifacts(17),
        // canonical+aggregate cap(15), internal encoding failure(16).
        internal static bool TryBuild(GenericTargetPlanInput input,
            out GenericTargetPlanV1 plan, out GenericPlanRefusal refusal)
        {
            plan = null;
            refusal = GenericPlanRefusal.None;
            if (input == null)
            { refusal = GenericPlanRefusal.NullInput; return false; }

            // Snapshot: one defensive copy per input field, at entry.
            CaseIdentity identity = input.Identity;
            string leaseReceiptSha256 = input.LeaseReceiptSha256;
            string ledgerPlanSha256 = input.LedgerPlanSha256;
            string targetImagePath = input.TargetImagePath;
            string targetImageSha256 = input.TargetImageSha256;
            string workingDirectory = input.WorkingDirectory;
            string[] argv = CopyStrings(input.Argv);
            string[] environmentEntries = CopyStrings(input.EnvironmentEntries);
            string[] allowedEnvironmentNames = CopyStrings(input.AllowedEnvironmentNames);
            GenericPlanReservationBinding reservationBinding = input.ReservationBinding;
            GenericSourcePin[] sourcePins = CopyPins(input.SourcePins);
            GenericOwnershipRootBinding[] ownershipRootBindings =
                CopyRoots(input.OwnershipRootBindings);
            GenericQualificationMode mode = input.QualificationMode;
            byte[][] additionalControlArtifacts = CopyJagged(input.AdditionalControlArtifacts);

            // Identity: frozen CaseIdentity already enforces lowercase hex64
            // nonce and epoch > 0 in its constructor; only null reaches here.
            if (identity == null)
            { refusal = GenericPlanRefusal.BadIdentity; return false; }

            // Lease receipt and image pins.
            if (!GuardianPredicates.HexPin(leaseReceiptSha256)
                || !GuardianPredicates.HexPin(targetImageSha256))
            { refusal = GenericPlanRefusal.BadPin; return false; }

            // Ledger plan pin.
            if (!GuardianPredicates.HexPin(ledgerPlanSha256))
            { refusal = GenericPlanRefusal.BadLedgerPlanPin; return false; }

            // Target image path: syntactic DOS path plus .exe suffix only.
            // Canonicality, non-reparse, real image hash and ownership remain
            // future trusted-host obligations (RATIFICATION.md:37-38).
            if (targetImagePath == null || !GuardianPredicates.DosPath(targetImagePath)
                || !targetImagePath.EndsWith(".exe", StringComparison.OrdinalIgnoreCase))
            { refusal = GenericPlanRefusal.BadTargetPath; return false; }

            // Argv. argv[0] names the image exactly (Ordinal). An empty
            // argument is explicitly encodable (permitted before PlainBounded,
            // which rejects empty strings); every other argument keeps the
            // core controls (no NUL, no control chars, valid surrogate pairs).
            if (argv == null || argv.Length == 0
                || argv.Length > GenericTargetPlanContract.MaxArgumentCount)
            { refusal = GenericPlanRefusal.BadArgv; return false; }
            for (int i = 0; i < argv.Length; i++)
            {
                if (argv[i] == null)
                { refusal = GenericPlanRefusal.BadArgv; return false; }
                if (i == 0 && !String.Equals(argv[0], targetImagePath,
                    StringComparison.Ordinal))
                { refusal = GenericPlanRefusal.BadArgv; return false; }
                if (argv[i].Length > 0 && !GuardianPredicates.PlainBounded(argv[i],
                    GenericTargetPlanContract.MaxCommandLineChars))
                { refusal = GenericPlanRefusal.BadArgv; return false; }
                if (ClosedArgvArgument(argv[i]))
                { refusal = GenericPlanRefusal.BadArgv; return false; }
            }

            // Windows command line: the versioned codec only, then the frozen
            // core bound on the joined string.
            string windowsCommandLine;
            if (!TryEncodeWindowsCommandLine(argv, out windowsCommandLine)
                || !GuardianPredicates.PlainBounded(windowsCommandLine,
                    GenericTargetPlanContract.MaxCommandLineChars))
            { refusal = GenericPlanRefusal.BadCommandLine; return false; }

            // Working directory: the same syntactic predicate as the core.
            if (workingDirectory == null || !GuardianPredicates.DosPath(workingDirectory))
            { refusal = GenericPlanRefusal.BadWorkingDirectory; return false; }

            // Allowlist: explicit parent names, ASCII shape, no ignore-case
            // duplicates; closed Q1 names are refused even when declared. No
            // Environment.Get* call exists in this module.
            if (allowedEnvironmentNames == null
                || allowedEnvironmentNames.Length > GenericTargetPlanContract.MaxEnvironmentEntries)
            { refusal = GenericPlanRefusal.BadEnvironmentAllowlist; return false; }
            for (int i = 0; i < allowedEnvironmentNames.Length; i++)
            {
                string allowName = allowedEnvironmentNames[i];
                if (allowName == null || !ValidEnvironmentName(allowName)
                    || ClosedEnvironmentName(allowName))
                { refusal = GenericPlanRefusal.BadEnvironmentAllowlist; return false; }
            }
            if (HasIgnoreCaseDuplicate(allowedEnvironmentNames))
            { refusal = GenericPlanRefusal.BadEnvironmentAllowlist; return false; }

            // Entries: every entry must be explicitly allowlisted; no injected
            // or inherited entry. Empty values are allowed; a caller list in
            // unsorted order is NOT refused (the codec canonicalizes).
            if (environmentEntries == null
                || environmentEntries.Length > GenericTargetPlanContract.MaxEnvironmentEntries)
            { refusal = GenericPlanRefusal.BadEnvironmentEntries; return false; }
            for (int i = 0; i < environmentEntries.Length; i++)
            {
                string entry = environmentEntries[i];
                if (entry == null)
                { refusal = GenericPlanRefusal.BadEnvironmentEntries; return false; }
                int equals = entry.IndexOf('=');
                if (equals <= 0)
                { refusal = GenericPlanRefusal.BadEnvironmentEntries; return false; }
                if (!GuardianPredicates.PlainBounded(entry, 32765))
                { refusal = GenericPlanRefusal.BadEnvironmentEntries; return false; }
                if (!AllowlistedName(allowedEnvironmentNames,
                    entry.Substring(0, equals)))
                { refusal = GenericPlanRefusal.BadEnvironmentEntries; return false; }
            }
            if (HasEnvironmentDuplicate(environmentEntries))
            { refusal = GenericPlanRefusal.BadEnvironmentEntries; return false; }

            // Environment block: versioned codec, then the frozen core
            // predicate on the derived block.
            string environmentBlock;
            if (!TryEncodeEnvironmentBlock(environmentEntries, out environmentBlock)
                || !GuardianPredicates.EnvironmentBlock(environmentBlock))
            { refusal = GenericPlanRefusal.BadEnvironmentBlock; return false; }

            // Reservation binding label (E1).
            if (reservationBinding == null
                || !GuardianPredicates.HexPin(reservationBinding.ReservationSha256)
                || reservationBinding.ReservationEpoch <= 0)
            { refusal = GenericPlanRefusal.BadReservationBinding; return false; }

            // Source pins (E3/E8): bounded non-authority provenance labels;
            // repeated hashes under distinct labels allowed; bytes 0..int.MaxValue
            // except the image pin which must carry Bytes > 0 and the exact
            // TargetImageSha256 under the Ordinal image-path label.
            if (sourcePins == null || sourcePins.Length == 0
                || sourcePins.Length > GenericTargetPlanContract.MaxSourcePins)
            { refusal = GenericPlanRefusal.BadSourcePins; return false; }
            for (int i = 0; i < sourcePins.Length; i++)
            {
                GenericSourcePin pin = sourcePins[i];
                if (pin == null
                    || !GuardianPredicates.PlainBounded(pin.PathLabel,
                        GenericTargetPlanContract.MaxLabelChars)
                    || pin.Bytes < 0 || pin.Bytes > int.MaxValue
                    || !GuardianPredicates.HexPin(pin.Sha256))
                { refusal = GenericPlanRefusal.BadSourcePins; return false; }
            }
            for (int i = 0; i < sourcePins.Length; i++)
                for (int j = 0; j < i; j++)
                    if (String.Equals(sourcePins[i].PathLabel,
                        sourcePins[j].PathLabel, StringComparison.Ordinal))
                    { refusal = GenericPlanRefusal.BadSourcePins; return false; }
            bool imagePinFound = false;
            for (int i = 0; i < sourcePins.Length; i++)
            {
                if (String.Equals(sourcePins[i].PathLabel, targetImagePath,
                    StringComparison.Ordinal))
                {
                    if (imagePinFound
                        || !String.Equals(sourcePins[i].Sha256, targetImageSha256,
                            StringComparison.Ordinal)
                        || sourcePins[i].Bytes <= 0)
                    { refusal = GenericPlanRefusal.BadSourcePins; return false; }
                    imagePinFound = true;
                }
            }
            if (!imagePinFound)
            { refusal = GenericPlanRefusal.BadSourcePins; return false; }

            // Ownership root bindings (E2/E10).
            if (ownershipRootBindings == null || ownershipRootBindings.Length == 0
                || ownershipRootBindings.Length > GenericTargetPlanContract.MaxOwnershipRootBindings)
            { refusal = GenericPlanRefusal.BadOwnershipRootBindings; return false; }
            for (int i = 0; i < ownershipRootBindings.Length; i++)
            {
                GenericOwnershipRootBinding root = ownershipRootBindings[i];
                if (root == null
                    || !GuardianPredicates.PlainBounded(root.BindingLabel,
                        GenericTargetPlanContract.MaxLabelChars)
                    || !GuardianPredicates.HexPin(root.BindingSha256)
                    || root.BindingEpoch <= 0)
                { refusal = GenericPlanRefusal.BadOwnershipRootBindings; return false; }
            }
            for (int i = 0; i < ownershipRootBindings.Length; i++)
                for (int j = 0; j < i; j++)
                    if (String.Equals(ownershipRootBindings[i].BindingLabel,
                        ownershipRootBindings[j].BindingLabel, StringComparison.Ordinal))
                    { refusal = GenericPlanRefusal.BadOwnershipRootBindings; return false; }

            // Qualification mode (E10): C01..C14 only.
            int modeValue = (int)mode;
            if (modeValue < 1 || modeValue > 14)
            { refusal = GenericPlanRefusal.BadQualificationMode; return false; }

            // Additional control artifacts (E6): mandatory array, empty
            // allowed, at most 16 non-null byte[] each at most 32768 bytes.
            if (additionalControlArtifacts == null
                || additionalControlArtifacts.Length > GenericTargetPlanContract.MaxAdditionalControlArtifacts)
            { refusal = GenericPlanRefusal.BadControlArtifacts; return false; }
            for (int i = 0; i < additionalControlArtifacts.Length; i++)
            {
                byte[] artifact = additionalControlArtifacts[i];
                if (artifact == null || artifact.Length > GuardV3Contract.MaxControlFileBytes)
                { refusal = GenericPlanRefusal.BadControlArtifacts; return false; }
            }

            // Canonical record, intent hash and aggregate control cap, all
            // inside TryBuild (E6). Measure first; the cap is checked before
            // the exact-size allocation.
            byte[] canonicalBytes;
            try
            {
                string[] sortedEntries = SortEntries(environmentEntries);
                string[] sortedAllowedNames = SortAllowedNames(allowedEnvironmentNames);
                EncodedSnapshot snapshot = BuildSnapshot(identity, leaseReceiptSha256,
                    targetImagePath, targetImageSha256, argv, workingDirectory,
                    sortedEntries, sortedAllowedNames, reservationBinding,
                    sourcePins, ledgerPlanSha256, (uint)modeValue,
                    ownershipRootBindings, additionalControlArtifacts);
                long canonicalLength = MeasureCanonical(snapshot);
                long artifactBytes = SumArtifactBytes(additionalControlArtifacts);
                if (canonicalLength + artifactBytes > GuardV3Contract.MaxControlFileBytes)
                { refusal = GenericPlanRefusal.ControlBudgetExceeded; return false; }
                canonicalBytes = new byte[(int)canonicalLength];
                int filled = WriteCanonical(snapshot, canonicalBytes);
                if (filled != canonicalLength)
                    throw new InvalidOperationException("Canonical length mismatch");
                string intentSha256;
                if (!Sha256Hex64(canonicalBytes, out intentSha256))
                    throw new InvalidOperationException("Intent hash failure");
                plan = new GenericTargetPlanV1(identity, leaseReceiptSha256,
                    ledgerPlanSha256, targetImagePath, targetImageSha256, argv,
                    windowsCommandLine, workingDirectory, sortedEntries,
                    environmentBlock, sortedAllowedNames, intentSha256,
                    reservationBinding, sourcePins,
                    GenericTargetPlanContract.TimeProfileQ1, mode,
                    ownershipRootBindings, additionalControlArtifacts,
                    canonicalBytes, canonicalLength + artifactBytes);
                refusal = GenericPlanRefusal.None;
                return true;
            }
            catch (Exception)
            {
                plan = null;
                refusal = GenericPlanRefusal.InternalEncodingFailure;
                return false;
            }
        }

        // win-quote-v1. Quotes the argument if and only if it is empty or
        // contains a space or a quote; a backslash without space or quote
        // stays NOT quoted and unchanged. Inside quotes, n consecutive
        // backslashes before a quote produce 2n+1 backslashes then one quote;
        // n backslashes before the final quote produce 2n backslashes (the
        // closing quote is appended once at the end); otherwise backslashes
        // are unchanged. The only codec-level refusal is a null argument.
        internal static bool TryEncodeWindowsArgument(string argument, out string encoded)
        {
            encoded = null;
            if (argument == null) return false;
            if (argument.Length == 0) { encoded = "\"\""; return true; }
            bool needsQuotes = argument.IndexOf(' ') >= 0 || argument.IndexOf('"') >= 0;
            if (!needsQuotes) { encoded = argument; return true; }
            StringBuilder builder = new StringBuilder(argument.Length + 3);
            builder.Append('"');
            int index = 0;
            while (index < argument.Length)
            {
                if (argument[index] == '\\')
                {
                    int run = 0;
                    while (index < argument.Length && argument[index] == '\\')
                    { run++; index++; }
                    if (index < argument.Length && argument[index] == '"')
                    {
                        AppendBackslashes(builder, 2 * run + 1);
                        builder.Append('"');
                        index++;
                    }
                    else if (index >= argument.Length)
                    {
                        AppendBackslashes(builder, 2 * run);
                    }
                    else
                    {
                        AppendBackslashes(builder, run);
                    }
                }
                else
                {
                    if (argument[index] == '"') builder.Append('\\');
                    builder.Append(argument[index]);
                    index++;
                }
            }
            builder.Append('"');
            encoded = builder.ToString();
            return true;
        }

        // win-quote-v1 assembly: single space join. Codec-level refusals:
        // null array, empty array, null element. Length/character bounds are
        // TryBuild responsibilities (codec stays policy-independent).
        internal static bool TryEncodeWindowsCommandLine(string[] argv,
            out string commandLine)
        {
            commandLine = null;
            if (argv == null || argv.Length == 0) return false;
            string[] encoded = new string[argv.Length];
            long total = argv.Length - 1;
            for (int i = 0; i < argv.Length; i++)
            {
                if (argv[i] == null) return false;
                string one;
                if (!TryEncodeWindowsArgument(argv[i], out one)) return false;
                encoded[i] = one;
                total += one.Length;
                if (total > int.MaxValue) return false;
            }
            StringBuilder builder = new StringBuilder((int)total);
            for (int i = 0; i < encoded.Length; i++)
            {
                if (i > 0) builder.Append(' ');
                builder.Append(encoded[i]);
            }
            commandLine = builder.ToString();
            return true;
        }

        // win-env-v1. Sorts entries by name (OrdinalIgnoreCase) — a caller
        // list in unsorted order is NOT refused; refuses duplicates
        // (ignore-case), entries without '=', empty names, and any entry with
        // a control char, NUL or invalid surrogate (frozen PlainBounded
        // semantics at the core's 32765 bound). Empty values are allowed and
        // an empty allowlist encodes exactly two NUL. The built block must be
        // within [2, MaxEnvironmentBlockUnits] UTF-16 code units.
        internal static bool TryEncodeEnvironmentBlock(string[] entries, out string block)
        {
            block = null;
            if (entries == null) return false;
            string[] sorted = new string[entries.Length];
            for (int i = 0; i < entries.Length; i++)
            {
                string entry = entries[i];
                if (entry == null) return false;
                if (entry.IndexOf('=') <= 0) return false;
                if (!GuardianPredicates.PlainBounded(entry, 32765)) return false;
                sorted[i] = entry;
            }
            Array.Sort(sorted, EnvironmentEntryComparer.Instance);
            string previous = null;
            for (int i = 0; i < sorted.Length; i++)
            {
                string name = EnvironmentEntryComparer.EntryName(sorted[i]);
                if (previous != null && StringComparer.OrdinalIgnoreCase
                    .Compare(previous, name) >= 0)
                    return false;
                previous = name;
            }
            StringBuilder builder = new StringBuilder();
            for (int i = 0; i < sorted.Length; i++)
            {
                builder.Append(sorted[i]);
                builder.Append('\0');
            }
            builder.Append('\0');
            string built = builder.ToString();
            if (built.Length < 2
                || built.Length > GenericTargetPlanContract.MaxEnvironmentBlockUnits)
                return false;
            block = built;
            return true;
        }

        // Deterministic re-encode of a built plan. The bytes must equal the
        // stored canonical encoding and hash to the stored IntentSha256;
        // any mismatch is an internal encoding failure, never a success.
        internal static bool TryEncodeCanonical(GenericTargetPlanV1 plan,
            out byte[] canonical, out GenericPlanRefusal refusal)
        {
            canonical = null;
            refusal = GenericPlanRefusal.None;
            if (plan == null)
            { refusal = GenericPlanRefusal.NullInput; return false; }
            try
            {
                string commandLine;
                if (!TryEncodeWindowsCommandLine(plan.Argv, out commandLine)
                    || !String.Equals(commandLine, plan.WindowsCommandLine,
                        StringComparison.Ordinal))
                { refusal = GenericPlanRefusal.InternalEncodingFailure; return false; }
                string environmentBlock;
                if (!TryEncodeEnvironmentBlock(plan.EnvironmentEntries, out environmentBlock)
                    || !String.Equals(environmentBlock, plan.EnvironmentBlock,
                        StringComparison.Ordinal))
                { refusal = GenericPlanRefusal.InternalEncodingFailure; return false; }
                EncodedSnapshot snapshot = SnapshotFromPlan(plan);
                long length = MeasureCanonical(snapshot);
                if (length != plan.CanonicalByteCount || length > int.MaxValue)
                { refusal = GenericPlanRefusal.InternalEncodingFailure; return false; }
                byte[] bytes = new byte[(int)length];
                int filled = WriteCanonical(snapshot, bytes);
                if (filled != length)
                { refusal = GenericPlanRefusal.InternalEncodingFailure; return false; }
                string hash;
                if (!Sha256Hex64(bytes, out hash)
                    || !String.Equals(hash, plan.IntentSha256, StringComparison.Ordinal))
                { refusal = GenericPlanRefusal.InternalEncodingFailure; return false; }
                canonical = bytes;
                return true;
            }
            catch (Exception)
            {
                canonical = null;
                refusal = GenericPlanRefusal.InternalEncodingFailure;
                return false;
            }
        }

        // Counts ONLY the arrays actually provided; refuses null array, null
        // element or a sum above the frozen 32768 control bound. A false or
        // short list never claims a complete host control-file inventory (E6);
        // the future trusted host must still verify every real OWNER/lease/
        // ledger/registry artifact and its bytes/caps.
        internal static bool TryCountControlFiles(byte[][] encodedArtifacts,
            out long totalBytes)
        {
            totalBytes = 0;
            if (encodedArtifacts == null) return false;
            long sum = 0;
            for (int i = 0; i < encodedArtifacts.Length; i++)
            {
                if (encodedArtifacts[i] == null) return false;
                sum += encodedArtifacts[i].Length;
                if (sum > GuardV3Contract.MaxControlFileBytes) return false;
            }
            totalBytes = sum;
            return true;
        }

        // ---- internal helpers (implementation detail of this file only).
        // Internal (not private) because the GenericTargetPlanV1 array getters
        // call them for their fresh defensive copies. ----

        internal static string[] CopyStrings(string[] source)
        {
            if (source == null) return null;
            string[] copy = new string[source.Length];
            for (int i = 0; i < source.Length; i++) copy[i] = source[i];
            return copy;
        }

        internal static GenericSourcePin[] CopyPins(GenericSourcePin[] source)
        {
            if (source == null) return null;
            GenericSourcePin[] copy = new GenericSourcePin[source.Length];
            for (int i = 0; i < source.Length; i++) copy[i] = source[i];
            return copy;
        }

        internal static GenericOwnershipRootBinding[] CopyRoots(
            GenericOwnershipRootBinding[] source)
        {
            if (source == null) return null;
            GenericOwnershipRootBinding[] copy =
                new GenericOwnershipRootBinding[source.Length];
            for (int i = 0; i < source.Length; i++) copy[i] = source[i];
            return copy;
        }

        internal static byte[][] CopyJagged(byte[][] source)
        {
            if (source == null) return null;
            byte[][] copy = new byte[source.Length][];
            for (int i = 0; i < source.Length; i++)
                copy[i] = source[i] == null ? null : (byte[])source[i].Clone();
            return copy;
        }

        private static string[] SortEntries(string[] entries)
        {
            string[] sorted = CopyStrings(entries);
            Array.Sort(sorted, EnvironmentEntryComparer.Instance);
            return sorted;
        }

        private static string[] SortAllowedNames(string[] names)
        {
            string[] sorted = CopyStrings(names);
            Array.Sort(sorted, StringComparer.OrdinalIgnoreCase);
            return sorted;
        }

        private static bool ClosedArgvArgument(string argument)
        {
            for (int i = 0; i < ClosedArgvFlags.Length; i++)
            {
                string flag = ClosedArgvFlags[i];
                if (String.Equals(argument, flag, StringComparison.Ordinal))
                    return true;
                if (argument.StartsWith(flag + "=", StringComparison.Ordinal))
                    return true;
            }
            return argument.StartsWith(ShortRequireFlag, StringComparison.Ordinal);
        }

        private static bool ValidEnvironmentName(string name)
        {
            if (name == null || name.Length == 0
                || name.Length > GenericTargetPlanContract.MaxLabelChars)
                return false;
            for (int i = 0; i < name.Length; i++)
            {
                char c = name[i];
                bool letterOrUnderscore = (c >= 'A' && c <= 'Z')
                    || (c >= 'a' && c <= 'z') || c == '_';
                bool digit = i > 0 && c >= '0' && c <= '9';
                if (!letterOrUnderscore && !digit) return false;
            }
            return true;
        }

        private static bool ClosedEnvironmentName(string name)
        {
            for (int i = 0; i < ClosedEnvironmentNames.Length; i++)
                if (String.Equals(name, ClosedEnvironmentNames[i],
                    StringComparison.OrdinalIgnoreCase))
                    return true;
            return false;
        }

        private static bool AllowlistedName(string[] allowedNames, string name)
        {
            for (int i = 0; i < allowedNames.Length; i++)
                if (String.Equals(allowedNames[i], name,
                    StringComparison.OrdinalIgnoreCase))
                    return true;
            return false;
        }

        private static bool HasIgnoreCaseDuplicate(string[] values)
        {
            string[] sorted = CopyStrings(values);
            Array.Sort(sorted, StringComparer.OrdinalIgnoreCase);
            for (int i = 1; i < sorted.Length; i++)
                if (StringComparer.OrdinalIgnoreCase.Compare(sorted[i - 1], sorted[i]) == 0)
                    return true;
            return false;
        }

        private static bool HasEnvironmentDuplicate(string[] entries)
        {
            string[] names = new string[entries.Length];
            for (int i = 0; i < entries.Length; i++)
                names[i] = EnvironmentEntryComparer.EntryName(entries[i]);
            Array.Sort(names, StringComparer.OrdinalIgnoreCase);
            for (int i = 1; i < names.Length; i++)
                if (StringComparer.OrdinalIgnoreCase.Compare(names[i - 1], names[i]) == 0)
                    return true;
            return false;
        }

        private static void AppendBackslashes(StringBuilder builder, int count)
        {
            for (int i = 0; i < count; i++) builder.Append('\\');
        }

        private static long SumArtifactBytes(byte[][] artifacts)
        {
            long sum = 0;
            for (int i = 0; i < artifacts.Length; i++) sum += artifacts[i].Length;
            return sum;
        }

        private static bool Sha256Bytes(byte[] data, out byte[] hash)
        {
            hash = null;
            using (SHA256 sha = SHA256.Create())
            {
                hash = sha.ComputeHash(data);
            }
            return hash != null && hash.Length == 32;
        }

        private static bool Sha256Hex64(byte[] data, out string hex64)
        {
            byte[] hash;
            if (!Sha256Bytes(data, out hash)) { hex64 = null; return false; }
            char[] chars = new char[64];
            const string digits = "0123456789abcdef";
            for (int i = 0; i < 32; i++)
            {
                chars[2 * i] = digits[hash[i] >> 4];
                chars[2 * i + 1] = digits[hash[i] & 0xF];
            }
            hex64 = new string(chars);
            return true;
        }

        // Immutable field set for gtplan-canonical-v1. No derived
        // WindowsCommandLine/EnvironmentBlock and no IntentSha256: the intent
        // hash has no self-reference (E5). No artifact bytes are embedded —
        // each artifact is bound by its length and SHA256 only (E6).
        private sealed class EncodedSnapshot
        {
            internal string Version, ArgvCodecId, EnvCodecId;
            internal string NonceHex; internal long Epoch;
            internal string LeaseReceiptSha256;
            internal string ReservationSha256; internal long ReservationEpoch;
            internal string TargetImagePath, TargetImageSha256;
            internal string[] Argv;
            internal string WorkingDirectory;
            internal string[] EnvironmentEntries;        // sorted
            internal string[] AllowedEnvironmentNames;   // sorted
            internal string[] PinLabels; internal long[] PinBytes;
            internal string[] PinSha256;
            internal string LedgerPlanSha256, TimeProfileId; internal uint Mode;
            internal string[] RootLabels; internal string[] RootSha256;
            internal long[] RootEpochs;
            internal byte[][] Artifacts;                 // deep copies, input order
            internal byte[][] ArtifactSha256;            // raw 32-byte digests
        }

        private static EncodedSnapshot BuildSnapshot(CaseIdentity identity,
            string leaseReceiptSha256, string targetImagePath,
            string targetImageSha256, string[] argv, string workingDirectory,
            string[] sortedEnvironmentEntries, string[] sortedAllowedNames,
            GenericPlanReservationBinding reservationBinding,
            GenericSourcePin[] sourcePins, string ledgerPlanSha256, uint mode,
            GenericOwnershipRootBinding[] ownershipRootBindings,
            byte[][] additionalControlArtifacts)
        {
            EncodedSnapshot snapshot = new EncodedSnapshot();
            snapshot.Version = GenericTargetPlanContract.Version;
            snapshot.ArgvCodecId = GenericTargetPlanContract.WindowsArgvCodecId;
            snapshot.EnvCodecId = GenericTargetPlanContract.WindowsEnvCodecId;
            snapshot.NonceHex = identity.NonceHex;
            snapshot.Epoch = identity.Epoch;
            snapshot.LeaseReceiptSha256 = leaseReceiptSha256;
            snapshot.ReservationSha256 = reservationBinding.ReservationSha256;
            snapshot.ReservationEpoch = reservationBinding.ReservationEpoch;
            snapshot.TargetImagePath = targetImagePath;
            snapshot.TargetImageSha256 = targetImageSha256;
            snapshot.Argv = argv;
            snapshot.WorkingDirectory = workingDirectory;
            snapshot.EnvironmentEntries = sortedEnvironmentEntries;
            snapshot.AllowedEnvironmentNames = sortedAllowedNames;
            snapshot.PinLabels = new string[sourcePins.Length];
            snapshot.PinBytes = new long[sourcePins.Length];
            snapshot.PinSha256 = new string[sourcePins.Length];
            for (int i = 0; i < sourcePins.Length; i++)
            {
                snapshot.PinLabels[i] = sourcePins[i].PathLabel;
                snapshot.PinBytes[i] = sourcePins[i].Bytes;
                snapshot.PinSha256[i] = sourcePins[i].Sha256;
            }
            snapshot.LedgerPlanSha256 = ledgerPlanSha256;
            snapshot.TimeProfileId = GenericTargetPlanContract.TimeProfileQ1;
            snapshot.Mode = mode;
            snapshot.RootLabels = new string[ownershipRootBindings.Length];
            snapshot.RootSha256 = new string[ownershipRootBindings.Length];
            snapshot.RootEpochs = new long[ownershipRootBindings.Length];
            for (int i = 0; i < ownershipRootBindings.Length; i++)
            {
                snapshot.RootLabels[i] = ownershipRootBindings[i].BindingLabel;
                snapshot.RootSha256[i] = ownershipRootBindings[i].BindingSha256;
                snapshot.RootEpochs[i] = ownershipRootBindings[i].BindingEpoch;
            }
            snapshot.Artifacts = additionalControlArtifacts;
            snapshot.ArtifactSha256 = new byte[additionalControlArtifacts.Length][];
            for (int i = 0; i < additionalControlArtifacts.Length; i++)
            {
                byte[] hash;
                if (!Sha256Bytes(additionalControlArtifacts[i], out hash))
                    throw new InvalidOperationException("Artifact hash failure");
                snapshot.ArtifactSha256[i] = hash;
            }
            return snapshot;
        }

        private static EncodedSnapshot SnapshotFromPlan(GenericTargetPlanV1 plan)
        {
            EncodedSnapshot snapshot = new EncodedSnapshot();
            snapshot.Version = plan.Version;
            snapshot.ArgvCodecId = GenericTargetPlanContract.WindowsArgvCodecId;
            snapshot.EnvCodecId = GenericTargetPlanContract.WindowsEnvCodecId;
            snapshot.NonceHex = plan.Identity.NonceHex;
            snapshot.Epoch = plan.Identity.Epoch;
            snapshot.LeaseReceiptSha256 = plan.LeaseReceiptSha256;
            snapshot.ReservationSha256 = plan.ReservationBinding.ReservationSha256;
            snapshot.ReservationEpoch = plan.ReservationBinding.ReservationEpoch;
            snapshot.TargetImagePath = plan.TargetImagePath;
            snapshot.TargetImageSha256 = plan.TargetImageSha256;
            snapshot.Argv = plan.Argv;
            snapshot.WorkingDirectory = plan.WorkingDirectory;
            snapshot.EnvironmentEntries = SortEntries(plan.EnvironmentEntries);
            snapshot.AllowedEnvironmentNames = SortAllowedNames(
                plan.AllowedEnvironmentNames);
            GenericSourcePin[] pins = plan.SourcePins;
            snapshot.PinLabels = new string[pins.Length];
            snapshot.PinBytes = new long[pins.Length];
            snapshot.PinSha256 = new string[pins.Length];
            for (int i = 0; i < pins.Length; i++)
            {
                snapshot.PinLabels[i] = pins[i].PathLabel;
                snapshot.PinBytes[i] = pins[i].Bytes;
                snapshot.PinSha256[i] = pins[i].Sha256;
            }
            snapshot.LedgerPlanSha256 = plan.LedgerPlanSha256;
            snapshot.TimeProfileId = plan.TimeProfileId;
            snapshot.Mode = (uint)plan.QualificationMode;
            GenericOwnershipRootBinding[] roots = plan.OwnershipRootBindings;
            snapshot.RootLabels = new string[roots.Length];
            snapshot.RootSha256 = new string[roots.Length];
            snapshot.RootEpochs = new long[roots.Length];
            for (int i = 0; i < roots.Length; i++)
            {
                snapshot.RootLabels[i] = roots[i].BindingLabel;
                snapshot.RootSha256[i] = roots[i].BindingSha256;
                snapshot.RootEpochs[i] = roots[i].BindingEpoch;
            }
            byte[][] artifacts = plan.GetAdditionalControlArtifacts();
            snapshot.Artifacts = artifacts;
            snapshot.ArtifactSha256 = new byte[artifacts.Length][];
            for (int i = 0; i < artifacts.Length; i++)
            {
                byte[] hash;
                if (!Sha256Bytes(artifacts[i], out hash))
                    throw new InvalidOperationException("Artifact hash failure");
                snapshot.ArtifactSha256[i] = hash;
            }
            return snapshot;
        }

        private static long CountedUtf8Length(string value)
        {
            return 4 + StrictUtf8.GetByteCount(value);
        }

        private static long MeasureCanonical(EncodedSnapshot snapshot)
        {
            long total = 4 + 4;
            total += CountedUtf8Length(snapshot.Version);
            total += CountedUtf8Length(snapshot.ArgvCodecId);
            total += CountedUtf8Length(snapshot.EnvCodecId);
            total += CountedUtf8Length(snapshot.NonceHex);
            total += 8;
            total += CountedUtf8Length(snapshot.LeaseReceiptSha256);
            total += CountedUtf8Length(snapshot.ReservationSha256);
            total += 8;
            total += CountedUtf8Length(snapshot.TargetImagePath);
            total += CountedUtf8Length(snapshot.TargetImageSha256);
            total += 4;
            for (int i = 0; i < snapshot.Argv.Length; i++)
                total += CountedUtf8Length(snapshot.Argv[i]);
            total += CountedUtf8Length(snapshot.WorkingDirectory);
            total += 4;
            for (int i = 0; i < snapshot.EnvironmentEntries.Length; i++)
                total += CountedUtf8Length(snapshot.EnvironmentEntries[i]);
            total += 4;
            for (int i = 0; i < snapshot.AllowedEnvironmentNames.Length; i++)
                total += CountedUtf8Length(snapshot.AllowedEnvironmentNames[i]);
            total += 4;
            for (int i = 0; i < snapshot.PinLabels.Length; i++)
            {
                total += CountedUtf8Length(snapshot.PinLabels[i]);
                total += 8;
                total += CountedUtf8Length(snapshot.PinSha256[i]);
            }
            total += CountedUtf8Length(snapshot.LedgerPlanSha256);
            total += CountedUtf8Length(snapshot.TimeProfileId);
            total += 4;
            total += 4;
            for (int i = 0; i < snapshot.RootLabels.Length; i++)
            {
                total += CountedUtf8Length(snapshot.RootLabels[i]);
                total += CountedUtf8Length(snapshot.RootSha256[i]);
                total += 8;
            }
            total += 4;
            total += (long)snapshot.Artifacts.Length * (4 + 32);
            if (total < 0 || total > int.MaxValue)
                throw new InvalidOperationException("Canonical size overflow");
            return total;
        }

        private static int WriteCountedUtf8(string value, byte[] target, int position)
        {
            int byteCount = StrictUtf8.GetByteCount(value);
            GuardianMemoryEvidence.Put32(target, position, (uint)byteCount);
            position += 4;
            if (byteCount > 0)
                position += StrictUtf8.GetBytes(value, 0, value.Length, target, position);
            return position;
        }

        private static int WriteCanonical(EncodedSnapshot snapshot, byte[] target)
        {
            int position = 0;
            target[position] = (byte)'G'; position++;
            target[position] = (byte)'T'; position++;
            target[position] = (byte)'P'; position++;
            target[position] = (byte)'L'; position++;
            GuardianMemoryEvidence.Put32(target, position, 1u); position += 4;
            position = WriteCountedUtf8(snapshot.Version, target, position);
            position = WriteCountedUtf8(snapshot.ArgvCodecId, target, position);
            position = WriteCountedUtf8(snapshot.EnvCodecId, target, position);
            position = WriteCountedUtf8(snapshot.NonceHex, target, position);
            GuardianMemoryEvidence.Put64(target, position,
                unchecked((ulong)snapshot.Epoch)); position += 8;
            position = WriteCountedUtf8(snapshot.LeaseReceiptSha256, target, position);
            position = WriteCountedUtf8(snapshot.ReservationSha256, target, position);
            GuardianMemoryEvidence.Put64(target, position,
                unchecked((ulong)snapshot.ReservationEpoch)); position += 8;
            position = WriteCountedUtf8(snapshot.TargetImagePath, target, position);
            position = WriteCountedUtf8(snapshot.TargetImageSha256, target, position);
            GuardianMemoryEvidence.Put32(target, position,
                (uint)snapshot.Argv.Length); position += 4;
            for (int i = 0; i < snapshot.Argv.Length; i++)
                position = WriteCountedUtf8(snapshot.Argv[i], target, position);
            position = WriteCountedUtf8(snapshot.WorkingDirectory, target, position);
            GuardianMemoryEvidence.Put32(target, position,
                (uint)snapshot.EnvironmentEntries.Length); position += 4;
            for (int i = 0; i < snapshot.EnvironmentEntries.Length; i++)
                position = WriteCountedUtf8(snapshot.EnvironmentEntries[i], target, position);
            GuardianMemoryEvidence.Put32(target, position,
                (uint)snapshot.AllowedEnvironmentNames.Length); position += 4;
            for (int i = 0; i < snapshot.AllowedEnvironmentNames.Length; i++)
                position = WriteCountedUtf8(snapshot.AllowedEnvironmentNames[i],
                    target, position);
            GuardianMemoryEvidence.Put32(target, position,
                (uint)snapshot.PinLabels.Length); position += 4;
            for (int i = 0; i < snapshot.PinLabels.Length; i++)
            {
                position = WriteCountedUtf8(snapshot.PinLabels[i], target, position);
                GuardianMemoryEvidence.Put64(target, position,
                    unchecked((ulong)snapshot.PinBytes[i])); position += 8;
                position = WriteCountedUtf8(snapshot.PinSha256[i], target, position);
            }
            position = WriteCountedUtf8(snapshot.LedgerPlanSha256, target, position);
            position = WriteCountedUtf8(snapshot.TimeProfileId, target, position);
            GuardianMemoryEvidence.Put32(target, position, snapshot.Mode); position += 4;
            GuardianMemoryEvidence.Put32(target, position,
                (uint)snapshot.RootLabels.Length); position += 4;
            for (int i = 0; i < snapshot.RootLabels.Length; i++)
            {
                position = WriteCountedUtf8(snapshot.RootLabels[i], target, position);
                position = WriteCountedUtf8(snapshot.RootSha256[i], target, position);
                GuardianMemoryEvidence.Put64(target, position,
                    unchecked((ulong)snapshot.RootEpochs[i])); position += 8;
            }
            GuardianMemoryEvidence.Put32(target, position,
                (uint)snapshot.Artifacts.Length); position += 4;
            for (int i = 0; i < snapshot.Artifacts.Length; i++)
            {
                GuardianMemoryEvidence.Put32(target, position,
                    (uint)snapshot.Artifacts[i].Length); position += 4;
                for (int k = 0; k < 32; k++)
                { target[position] = snapshot.ArtifactSha256[i][k]; position++; }
            }
            return position;
        }

        // Compares whole "NAME=VALUE" entries by their NAME only
        // (OrdinalIgnoreCase); duplicates are refused before this comparer is
        // relied on for a total order.
        private sealed class EnvironmentEntryComparer : IComparer<string>
        {
            internal static readonly EnvironmentEntryComparer Instance =
                new EnvironmentEntryComparer();
            public int Compare(string x, string y)
            {
                return StringComparer.OrdinalIgnoreCase.Compare(EntryName(x), EntryName(y));
            }
            internal static string EntryName(string entry)
            {
                if (entry == null) return null;
                int equals = entry.IndexOf('=');
                return equals <= 0 ? null : entry.Substring(0, equals);
            }
        }
    }
}
