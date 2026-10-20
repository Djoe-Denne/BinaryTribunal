// GenericTargetPlan.cs -- proposed R3 DATA_ONLY correction, not accepted source.
// Owner full44-q1-source-fix-r1; task task_mve2v30s_0016_i0tyxz.
// Baseline: inputs/source-r2/GenericTargetPlan.cs, SHA256
// 4fe5da4de15157e422d3e1baa7d093a7f6c853f82c8f42155e502e0a16ef6626.
// Parent GO: FULL44_Q1_SOURCE_R3_PLAN_GO.md, SHA256
// ae4b8416c06d848015ca2878ddae1e7ce01caff14e7d4c208b4cd76ab173cfa4.
// API R1 plus short-flag R2 and membership/null R3 remain fixed; see MANIFEST.
// C# 4 / .NET 4. Memory-only SHA256, strict UTF8, pure validation and copies.
// No IO, OS, Process, Stream, Thread, clock, Job, native or host authority.
// Q1 only: setup5000/normal20000/cleanup30000/total55000; evidence262144,
// capture114688, control32768. No 125s/full44/native or resource proof.
// NONBLIND corrective source; no QA implementation was consulted. Not compiled
// or executed by this worker. Fresh composed V and separate parent gates remain.
using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;

namespace ReGraph.GuardV3
{
    // Ratified data limits, not runtime debits, writers or admission proofs.
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
        internal const int MaxEnvironmentEntries = 4096;
        internal const int MaxSourcePins = 64;
        internal const int MaxOwnershipRootBindings = 16;
        internal const int MaxLabelChars = 259;
        internal const int MaxAdditionalControlArtifacts = 16;
        // Aggregate control cap remains GuardV3Contract.MaxControlFileBytes.
    }

    internal enum GenericQualificationMode
    {
        C01 = 1, C02 = 2, C03 = 3, C04 = 4, C05 = 5, C06 = 6, C07 = 7,
        C08 = 8, C09 = 9, C10 = 10, C11 = 11, C12 = 12, C13 = 13, C14 = 14
    }

    internal enum GenericPlanRefusal
    {
        None = 0, NullInput = 1, BadIdentity = 2, BadPin = 3, BadLedgerPlanPin = 4,
        BadTargetPath = 5, BadArgv = 6, BadCommandLine = 7, BadWorkingDirectory = 8,
        BadEnvironmentEntries = 9, BadEnvironmentBlock = 10, BadReservationBinding = 11,
        BadSourcePins = 12, BadOwnershipRootBindings = 13, BadQualificationMode = 14,
        ControlBudgetExceeded = 15, InternalEncodingFailure = 16,
        BadControlArtifacts = 17, BadEnvironmentAllowlist = 18
    }

    // Immutable scalar provenance metadata only: no acquired lease or OS right.
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

    // Mutable caller descriptor. TryBuild reads fields once into scalar/reference
    // locals, then snapshots each bounded outer array at its validation stage.
    // This is not an atomic transaction against a concurrently mutating caller.
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

    // Construction remains internal to the validated codec path. Only owned
    // arrays reach this constructor; every array getter returns a fresh copy.
    // Strings, CaseIdentity and metadata DTOs are immutable and may be shared.
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

    internal static class GenericTargetPlanCodec
    {
        private static readonly UTF8Encoding StrictUtf8 = new UTF8Encoding(false, true);
        private static readonly string[] ClosedEnvironmentNames = new string[]
        {
            "NODE_OPTIONS", "BUN_OPTIONS", "NODE_PATH", "FF8_ENSEMBLE_SOURCE"
        };
        private static readonly string[] ClosedArgvFlags = new string[]
        {
            "--preload", "--require", "--watch", "--hot", "--env-file"
        };
        private const string ShortRequireFlag = "-r";

        // First refusal order is semantic, not numeric: allowlist18 precedes9;
        // artifacts17 precedes cap15. Allocation/hash/encoding failures are16.
        internal static bool TryBuild(GenericTargetPlanInput input,
            out GenericTargetPlanV1 plan, out GenericPlanRefusal refusal)
        {
            plan = null;
            refusal = GenericPlanRefusal.None;
            if (input == null)
            { refusal = GenericPlanRefusal.NullInput; return false; }

            // Capture fields ONCE. No array traversal or payload copy here.
            CaseIdentity identity = input.Identity;
            string leaseReceiptSha256 = input.LeaseReceiptSha256;
            string ledgerPlanSha256 = input.LedgerPlanSha256;
            string targetImagePath = input.TargetImagePath;
            string targetImageSha256 = input.TargetImageSha256;
            string workingDirectory = input.WorkingDirectory;
            string[] argvReference = input.Argv;
            string[] entriesReference = input.EnvironmentEntries;
            string[] allowedNamesReference = input.AllowedEnvironmentNames;
            GenericPlanReservationBinding reservationBinding = input.ReservationBinding;
            GenericSourcePin[] pinsReference = input.SourcePins;
            GenericOwnershipRootBinding[] rootsReference = input.OwnershipRootBindings;
            GenericQualificationMode mode = input.QualificationMode;
            byte[][] artifactsReference = input.AdditionalControlArtifacts;

            // Covers all permitted allocations after capture, including small
            // snapshots. Private helpers propagate outages here, not into6/7/10.
            try
            {
                if (identity == null)
                { refusal = GenericPlanRefusal.BadIdentity; return false; }
                if (!GuardianPredicates.HexPin(leaseReceiptSha256)
                    || !GuardianPredicates.HexPin(targetImageSha256))
                { refusal = GenericPlanRefusal.BadPin; return false; }
                if (!GuardianPredicates.HexPin(ledgerPlanSha256))
                { refusal = GenericPlanRefusal.BadLedgerPlanPin; return false; }
                if (targetImagePath == null || !GuardianPredicates.DosPath(targetImagePath)
                    || !targetImagePath.EndsWith(".exe", StringComparison.OrdinalIgnoreCase))
                { refusal = GenericPlanRefusal.BadTargetPath; return false; }

                // BadArgv: bounded reference snapshot, then ALL raw validation.
                if (argvReference == null || argvReference.Length == 0
                    || argvReference.Length > GenericTargetPlanContract.MaxArgumentCount)
                { refusal = GenericPlanRefusal.BadArgv; return false; }
                string[] argv = CopyStrings(argvReference);
                for (int i = 0; i < argv.Length; i++)
                {
                    string argument = argv[i];
                    if (argument == null)
                    { refusal = GenericPlanRefusal.BadArgv; return false; }
                    if (i == 0 && !String.Equals(argument, targetImagePath,
                        StringComparison.Ordinal))
                    { refusal = GenericPlanRefusal.BadArgv; return false; }
                    if (!ValidRawArgument(argument) || ClosedArgvArgument(argument))
                    { refusal = GenericPlanRefusal.BadArgv; return false; }
                }

                // BadCommandLine: never measured until the raw loop completed.
                int commandLineUnits;
                if (!TryMeasureWindowsCommandLine(argv, out commandLineUnits))
                { refusal = GenericPlanRefusal.BadCommandLine; return false; }
                string windowsCommandLine = WriteWindowsCommandLine(argv, commandLineUnits);
                if (!GuardianPredicates.PlainBounded(windowsCommandLine,
                    GenericTargetPlanContract.MaxCommandLineChars))
                { refusal = GenericPlanRefusal.BadCommandLine; return false; }

                if (workingDirectory == null || !GuardianPredicates.DosPath(workingDirectory))
                { refusal = GenericPlanRefusal.BadWorkingDirectory; return false; }

                // Allowlist18: cardinality BEFORE copy; sort only owned refs.
                if (allowedNamesReference == null
                    || allowedNamesReference.Length > GenericTargetPlanContract.MaxEnvironmentEntries)
                { refusal = GenericPlanRefusal.BadEnvironmentAllowlist; return false; }
                string[] allowedNames = CopyStrings(allowedNamesReference);
                for (int i = 0; i < allowedNames.Length; i++)
                {
                    string name = allowedNames[i];
                    if (!ValidEnvironmentName(name) || ClosedEnvironmentName(name))
                    { refusal = GenericPlanRefusal.BadEnvironmentAllowlist; return false; }
                }
                Array.Sort(allowedNames, StringComparer.OrdinalIgnoreCase);
                if (HasIgnoreCaseDuplicate(allowedNames))
                { refusal = GenericPlanRefusal.BadEnvironmentAllowlist; return false; }

                // Entries9: complete raw/membership/duplicate phase BEFORE size10.
                if (entriesReference == null
                    || entriesReference.Length > GenericTargetPlanContract.MaxEnvironmentEntries)
                { refusal = GenericPlanRefusal.BadEnvironmentEntries; return false; }
                string[] entries = CopyStrings(entriesReference);
                for (int i = 0; i < entries.Length; i++)
                {
                    string entry = entries[i];
                    if (!ValidRawEnvironmentEntry(entry))
                    { refusal = GenericPlanRefusal.BadEnvironmentEntries; return false; }
                    int nameLength = entry.IndexOf('=');
                    if (!AllowlistedName(allowedNames, entry, nameLength))
                    { refusal = GenericPlanRefusal.BadEnvironmentEntries; return false; }
                }
                Array.Sort(entries, EnvironmentEntryComparer.Instance);
                if (HasEnvironmentDuplicate(entries))
                { refusal = GenericPlanRefusal.BadEnvironmentEntries; return false; }

                int environmentUnits;
                if (!TryMeasureEnvironmentBlock(entries, out environmentUnits))
                { refusal = GenericPlanRefusal.BadEnvironmentBlock; return false; }
                string environmentBlock = WriteEnvironmentBlock(entries, environmentUnits);
                if (!GuardianPredicates.EnvironmentBlock(environmentBlock))
                { refusal = GenericPlanRefusal.BadEnvironmentBlock; return false; }

                if (reservationBinding == null
                    || !GuardianPredicates.HexPin(reservationBinding.ReservationSha256)
                    || reservationBinding.ReservationEpoch <= 0)
                { refusal = GenericPlanRefusal.BadReservationBinding; return false; }

                if (pinsReference == null || pinsReference.Length == 0
                    || pinsReference.Length > GenericTargetPlanContract.MaxSourcePins)
                { refusal = GenericPlanRefusal.BadSourcePins; return false; }
                GenericSourcePin[] sourcePins = CopyPins(pinsReference);
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

                if (rootsReference == null || rootsReference.Length == 0
                    || rootsReference.Length > GenericTargetPlanContract.MaxOwnershipRootBindings)
                { refusal = GenericPlanRefusal.BadOwnershipRootBindings; return false; }
                GenericOwnershipRootBinding[] roots = CopyRoots(rootsReference);
                for (int i = 0; i < roots.Length; i++)
                {
                    GenericOwnershipRootBinding root = roots[i];
                    if (root == null
                        || !GuardianPredicates.PlainBounded(root.BindingLabel,
                            GenericTargetPlanContract.MaxLabelChars)
                        || !GuardianPredicates.HexPin(root.BindingSha256)
                        || root.BindingEpoch <= 0)
                    { refusal = GenericPlanRefusal.BadOwnershipRootBindings; return false; }
                }
                for (int i = 0; i < roots.Length; i++)
                    for (int j = 0; j < i; j++)
                        if (String.Equals(roots[i].BindingLabel,
                            roots[j].BindingLabel, StringComparison.Ordinal))
                        { refusal = GenericPlanRefusal.BadOwnershipRootBindings; return false; }

                int modeValue = (int)mode;
                if (modeValue < 1 || modeValue > 14)
                { refusal = GenericPlanRefusal.BadQualificationMode; return false; }

                // Artifacts17: small outer snapshot; no payload clone/hash/sum yet.
                if (artifactsReference == null
                    || artifactsReference.Length > GenericTargetPlanContract.MaxAdditionalControlArtifacts)
                { refusal = GenericPlanRefusal.BadControlArtifacts; return false; }
                byte[][] artifactReferences = CopyArtifactReferences(artifactsReference);
                int[] artifactLengths = new int[artifactReferences.Length];
                for (int i = 0; i < artifactReferences.Length; i++)
                {
                    byte[] artifact = artifactReferences[i];
                    if (artifact == null || artifact.Length > GuardV3Contract.MaxControlFileBytes)
                    { refusal = GenericPlanRefusal.BadControlArtifacts; return false; }
                    artifactLengths[i] = artifact.Length;
                }

                // Cap15: lengths/SHA32 table can be measured without payloads or
                // expanded UTF8 buffers. ALL artifact guards17 already passed.
                EncodedSnapshot snapshot = BuildSnapshot(identity, leaseReceiptSha256,
                    targetImagePath, targetImageSha256, argv, workingDirectory,
                    entries, allowedNames, reservationBinding, sourcePins,
                    ledgerPlanSha256, (uint)modeValue, roots, artifactLengths);
                long canonicalLength = MeasureCanonical(snapshot);
                long artifactBytes = SumArtifactBytes(artifactLengths);
                long controlBytes = checked(canonicalLength + artifactBytes);
                if (controlBytes > GuardV3Contract.MaxControlFileBytes)
                { refusal = GenericPlanRefusal.ControlBudgetExceeded; return false; }

                // Owned payloads only AFTER the aggregate budget passed. A caller
                // may race its bytes during clone; hashes bind the resulting owned
                // copies, never a later read of the caller's original payloads.
                byte[][] ownedArtifacts = CopyJagged(artifactReferences);
                HashOwnedArtifacts(snapshot, ownedArtifacts);
                byte[] canonicalBytes = new byte[(int)canonicalLength];
                int filled = WriteCanonical(snapshot, canonicalBytes);
                if (filled != canonicalLength)
                    throw new InvalidOperationException("Canonical length mismatch");
                string intentSha256;
                if (!Sha256Hex64(canonicalBytes, out intentSha256))
                    throw new InvalidOperationException("Intent hash failure");
                plan = new GenericTargetPlanV1(identity, leaseReceiptSha256,
                    ledgerPlanSha256, targetImagePath, targetImageSha256, argv,
                    windowsCommandLine, workingDirectory, entries, environmentBlock,
                    allowedNames, intentSha256, reservationBinding, sourcePins,
                    GenericTargetPlanContract.TimeProfileQ1, mode, roots,
                    ownedArtifacts, canonicalBytes, controlBytes);
                refusal = GenericPlanRefusal.None;
                return true;
            }
            catch (Exception)
            {
                // Pure data operations only. No outage is converted to a data
                // refusal or success; fatal runtime survival is not guaranteed.
                plan = null;
                refusal = GenericPlanRefusal.InternalEncodingFailure;
                return false;
            }
        }

        // Primitive codecs enforce native characters/counts, never flag policy.
        internal static bool TryEncodeWindowsArgument(string argument, out string encoded)
        {
            encoded = null;
            try
            {
                if (!ValidRawArgument(argument)) return false;
                int units;
                if (!TryMeasureWindowsArgument(argument, out units)) return false;
                if (!NeedsWindowsQuotes(argument)) { encoded = argument; return true; }
                StringBuilder builder = new StringBuilder(units);
                AppendWindowsArgument(builder, argument);
                string built = builder.ToString();
                if (built.Length != units)
                    throw new InvalidOperationException("Argument length mismatch");
                encoded = built;
                return true;
            }
            catch (Exception) { encoded = null; return false; }
        }

        internal static bool TryEncodeWindowsCommandLine(string[] argv,
            out string commandLine)
        {
            commandLine = null;
            try
            {
                if (argv == null || argv.Length == 0
                    || argv.Length > GenericTargetPlanContract.MaxArgumentCount)
                    return false;
                string[] snapshot = CopyStrings(argv);
                for (int i = 0; i < snapshot.Length; i++)
                    if (!ValidRawArgument(snapshot[i])) return false;
                int units;
                if (!TryMeasureWindowsCommandLine(snapshot, out units)) return false;
                commandLine = WriteWindowsCommandLine(snapshot, units);
                return true;
            }
            catch (Exception) { commandLine = null; return false; }
        }

        internal static bool TryEncodeEnvironmentBlock(string[] entries, out string block)
        {
            block = null;
            try
            {
                if (entries == null
                    || entries.Length > GenericTargetPlanContract.MaxEnvironmentEntries)
                    return false;
                string[] snapshot = CopyStrings(entries);
                for (int i = 0; i < snapshot.Length; i++)
                    if (!ValidRawEnvironmentEntry(snapshot[i])) return false;
                Array.Sort(snapshot, EnvironmentEntryComparer.Instance);
                if (HasEnvironmentDuplicate(snapshot)) return false;
                int units;
                if (!TryMeasureEnvironmentBlock(snapshot, out units)) return false;
                block = WriteEnvironmentBlock(snapshot, units);
                return true;
            }
            catch (Exception) { block = null; return false; }
        }

        internal static bool TryEncodeCanonical(GenericTargetPlanV1 plan,
            out byte[] canonical, out GenericPlanRefusal refusal)
        {
            canonical = null;
            refusal = GenericPlanRefusal.None;
            if (plan == null)
            { refusal = GenericPlanRefusal.NullInput; return false; }
            try
            {
                // Only an already-built immutable plan reaches this path. Its
                // counts were measured before its first payload copies. Recheck
                // those existing bounds before calling deep-copy getters.
                int expectedLength = plan.CanonicalByteCount;
                long expectedControlBytes = plan.ControlFileByteCount;
                if (expectedLength <= 0 || expectedLength > GuardV3Contract.MaxControlFileBytes
                    || expectedControlBytes < expectedLength
                    || expectedControlBytes > GuardV3Contract.MaxControlFileBytes)
                { refusal = GenericPlanRefusal.InternalEncodingFailure; return false; }
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
                byte[][] artifacts;
                EncodedSnapshot snapshot = SnapshotFromPlan(plan, out artifacts);
                long length = MeasureCanonical(snapshot);
                long controlBytes = checked(length + SumArtifactBytes(snapshot.ArtifactLengths));
                if (length != expectedLength || controlBytes != expectedControlBytes
                    || controlBytes > GuardV3Contract.MaxControlFileBytes)
                { refusal = GenericPlanRefusal.InternalEncodingFailure; return false; }
                HashOwnedArtifacts(snapshot, artifacts);
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

        // Counts arrays actually supplied; no hidden record reserve or count16.
        // Does not allocate an unbounded outer copy or certify host completeness.
        internal static bool TryCountControlFiles(byte[][] encodedArtifacts,
            out long totalBytes)
        {
            totalBytes = 0;
            if (encodedArtifacts == null) return false;
            long sum = 0;
            for (int i = 0; i < encodedArtifacts.Length; i++)
            {
                byte[] artifact = encodedArtifacts[i];
                if (artifact == null) return false;
                sum = checked(sum + artifact.Length);
                if (sum > GuardV3Contract.MaxControlFileBytes) return false;
            }
            totalBytes = sum;
            return true;
        }

        // Getters call these on arrays already owned by a validated plan.
        // TryBuild calls them only AFTER the corresponding cardinality guard.
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
            {
                byte[] artifact = source[i];
                copy[i] = artifact == null ? null : (byte[])artifact.Clone();
            }
            return copy;
        }

        private static byte[][] CopyArtifactReferences(byte[][] source)
        {
            byte[][] copy = new byte[source.Length][];
            for (int i = 0; i < source.Length; i++) copy[i] = source[i];
            return copy;
        }

        private static bool ValidRawArgument(string argument)
        {
            return argument != null && (argument.Length == 0
                || GuardianPredicates.PlainBounded(argument,
                    GenericTargetPlanContract.MaxCommandLineChars));
        }

        private static bool NeedsWindowsQuotes(string argument)
        {
            return argument.Length == 0 || argument.IndexOf(' ') >= 0
                || argument.IndexOf('"') >= 0;
        }

        // Requires validated raw argument. Counts UTF16 units, not UTF8 bytes.
        private static bool TryMeasureWindowsArgument(string argument, out int units)
        {
            units = 0;
            if (!NeedsWindowsQuotes(argument)) { units = argument.Length; return true; }
            long total = 2;
            int index = 0;
            checked
            {
                while (index < argument.Length)
                {
                    if (argument[index] == '\\')
                    {
                        int run = 0;
                        while (index < argument.Length && argument[index] == '\\')
                        { run++; index++; }
                        if (index < argument.Length && argument[index] == '"')
                        { total += 2L * run + 2; index++; }
                        else if (index >= argument.Length) total += 2L * run;
                        else total += run;
                    }
                    else
                    {
                        total += argument[index] == '"' ? 2 : 1;
                        index++;
                    }
                }
            }
            if (total > GenericTargetPlanContract.MaxCommandLineChars) return false;
            units = (int)total;
            return true;
        }

        // Called only after the WHOLE bounded raw vector was validated.
        private static bool TryMeasureWindowsCommandLine(string[] argv, out int units)
        {
            units = 0;
            long total = argv.Length - 1;
            for (int i = 0; i < argv.Length; i++)
            {
                int one;
                if (!TryMeasureWindowsArgument(argv[i], out one)) return false;
                total = checked(total + one);
                if (total > GenericTargetPlanContract.MaxCommandLineChars) return false;
            }
            units = (int)total;
            return true;
        }

        private static void AppendBackslashes(StringBuilder builder, int count)
        {
            for (int i = 0; i < count; i++) builder.Append('\\');
        }

        // Same win-quote-v1 algorithm as R2, after raw validation and measurement.
        private static void AppendWindowsArgument(StringBuilder builder, string argument)
        {
            if (!NeedsWindowsQuotes(argument)) { builder.Append(argument); return; }
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
                        AppendBackslashes(builder, checked(2 * run + 1));
                        builder.Append('"');
                        index++;
                    }
                    else if (index >= argument.Length)
                        AppendBackslashes(builder, checked(2 * run));
                    else AppendBackslashes(builder, run);
                }
                else
                {
                    if (argument[index] == '"') builder.Append('\\');
                    builder.Append(argument[index]);
                    index++;
                }
            }
            builder.Append('"');
        }

        private static string WriteWindowsCommandLine(string[] argv, int units)
        {
            StringBuilder builder = new StringBuilder(units);
            for (int i = 0; i < argv.Length; i++)
            {
                if (i > 0) builder.Append(' ');
                AppendWindowsArgument(builder, argv[i]);
            }
            string built = builder.ToString();
            if (built.Length != units)
                throw new InvalidOperationException("Command line length mismatch");
            return built;
        }

        private static bool ValidRawEnvironmentEntry(string entry)
        {
            // PlainBounded checks raw length BEFORE scanning its characters.
            return GuardianPredicates.PlainBounded(entry, 32765)
                && entry.IndexOf('=') > 0;
        }

        // Called after ALL raw entries and duplicates/membership were checked.
        private static bool TryMeasureEnvironmentBlock(string[] entries, out int units)
        {
            units = 0;
            if (entries.Length == 0) { units = 2; return true; }
            long total = 1;
            for (int i = 0; i < entries.Length; i++)
            {
                total = checked(total + entries[i].Length + 1L);
                if (total > GenericTargetPlanContract.MaxEnvironmentBlockUnits) return false;
            }
            units = (int)total;
            return true;
        }

        private static string WriteEnvironmentBlock(string[] entries, int units)
        {
            if (entries.Length == 0)
            {
                if (units != 2) throw new InvalidOperationException("Empty environment size");
                return "\0\0";
            }
            StringBuilder builder = new StringBuilder(units);
            for (int i = 0; i < entries.Length; i++)
            {
                builder.Append(entries[i]);
                builder.Append('\0');
            }
            builder.Append('\0');
            string built = builder.ToString();
            if (built.Length != units)
                throw new InvalidOperationException("Environment length mismatch");
            return built;
        }

        private static bool ClosedArgvArgument(string argument)
        {
            for (int i = 0; i < ClosedArgvFlags.Length; i++)
            {
                string flag = ClosedArgvFlags[i];
                if (String.Equals(argument, flag, StringComparison.Ordinal)) return true;
                if (argument.StartsWith(flag + "=", StringComparison.Ordinal)) return true;
            }
            if (String.Equals(argument, ShortRequireFlag, StringComparison.Ordinal)) return true;
            return argument.StartsWith(ShortRequireFlag + "=", StringComparison.Ordinal);
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
                    StringComparison.OrdinalIgnoreCase)) return true;
            return false;
        }

        // Compare prefix names without allocating Substring for every comparison.
        private static int CompareNames(string x, int xLength, string y, int yLength)
        {
            int common = Math.Min(xLength, yLength);
            int order = String.Compare(x, 0, y, 0, common, StringComparison.OrdinalIgnoreCase);
            if (order != 0) return order;
            return xLength.CompareTo(yLength);
        }

        private static bool AllowlistedName(string[] sortedAllowedNames,
            string entry, int nameLength)
        {
            int low = 0, high = sortedAllowedNames.Length - 1;
            while (low <= high)
            {
                int middle = low + (high - low) / 2;
                string allowed = sortedAllowedNames[middle];
                int order = CompareNames(entry, nameLength, allowed, allowed.Length);
                if (order == 0) return true;
                if (order < 0) high = middle - 1;
                else low = middle + 1;
            }
            return false;
        }

        // Both inputs have already been sorted in their owned outer snapshots.
        private static bool HasIgnoreCaseDuplicate(string[] sortedValues)
        {
            for (int i = 1; i < sortedValues.Length; i++)
                if (StringComparer.OrdinalIgnoreCase.Compare(
                    sortedValues[i - 1], sortedValues[i]) == 0) return true;
            return false;
        }

        private static bool HasEnvironmentDuplicate(string[] sortedEntries)
        {
            for (int i = 1; i < sortedEntries.Length; i++)
                if (EnvironmentEntryComparer.Instance.Compare(
                    sortedEntries[i - 1], sortedEntries[i]) == 0) return true;
            return false;
        }

        private static long SumArtifactBytes(int[] actualLengths)
        {
            long sum = 0;
            for (int i = 0; i < actualLengths.Length; i++)
                sum = checked(sum + actualLengths[i]);
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

        // Existing private canonical metadata container, not a new API/context.
        // Preparation holds lengths only; digests are filled after the cap passed.
        // No commandline/envblock/intent self-reference or embedded artifact bytes.
        private sealed class EncodedSnapshot
        {
            internal string Version, ArgvCodecId, EnvCodecId;
            internal string NonceHex; internal long Epoch;
            internal string LeaseReceiptSha256;
            internal string ReservationSha256; internal long ReservationEpoch;
            internal string TargetImagePath, TargetImageSha256;
            internal string[] Argv;
            internal string WorkingDirectory;
            internal string[] EnvironmentEntries;
            internal string[] AllowedEnvironmentNames;
            internal string[] PinLabels; internal long[] PinBytes;
            internal string[] PinSha256;
            internal string LedgerPlanSha256, TimeProfileId; internal uint Mode;
            internal string[] RootLabels; internal string[] RootSha256;
            internal long[] RootEpochs;
            internal int[] ArtifactLengths;
            internal byte[][] ArtifactSha256;
        }

        // Only bounded metadata reference/value arrays are allocated here.
        private static EncodedSnapshot BuildSnapshot(CaseIdentity identity,
            string leaseReceiptSha256, string targetImagePath,
            string targetImageSha256, string[] argv, string workingDirectory,
            string[] sortedEnvironmentEntries, string[] sortedAllowedNames,
            GenericPlanReservationBinding reservationBinding,
            GenericSourcePin[] sourcePins, string ledgerPlanSha256, uint mode,
            GenericOwnershipRootBinding[] ownershipRootBindings,
            int[] actualArtifactLengths)
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
                GenericSourcePin pin = sourcePins[i];
                snapshot.PinLabels[i] = pin.PathLabel;
                snapshot.PinBytes[i] = pin.Bytes;
                snapshot.PinSha256[i] = pin.Sha256;
            }
            snapshot.LedgerPlanSha256 = ledgerPlanSha256;
            snapshot.TimeProfileId = GenericTargetPlanContract.TimeProfileQ1;
            snapshot.Mode = mode;
            snapshot.RootLabels = new string[ownershipRootBindings.Length];
            snapshot.RootSha256 = new string[ownershipRootBindings.Length];
            snapshot.RootEpochs = new long[ownershipRootBindings.Length];
            for (int i = 0; i < ownershipRootBindings.Length; i++)
            {
                GenericOwnershipRootBinding root = ownershipRootBindings[i];
                snapshot.RootLabels[i] = root.BindingLabel;
                snapshot.RootSha256[i] = root.BindingSha256;
                snapshot.RootEpochs[i] = root.BindingEpoch;
            }
            snapshot.ArtifactLengths = actualArtifactLengths;
            return snapshot;
        }

        private static void HashOwnedArtifacts(EncodedSnapshot snapshot, byte[][] artifacts)
        {
            if (artifacts.Length != snapshot.ArtifactLengths.Length)
                throw new InvalidOperationException("Artifact count mismatch");
            byte[][] hashes = new byte[artifacts.Length][];
            for (int i = 0; i < artifacts.Length; i++)
            {
                byte[] artifact = artifacts[i];
                if (artifact == null || artifact.Length != snapshot.ArtifactLengths[i])
                    throw new InvalidOperationException("Artifact length mismatch");
                byte[] hash;
                if (!Sha256Bytes(artifact, out hash))
                    throw new InvalidOperationException("Artifact hash failure");
                hashes[i] = hash;
            }
            snapshot.ArtifactSha256 = hashes;
        }

        private static EncodedSnapshot SnapshotFromPlan(GenericTargetPlanV1 plan,
            out byte[][] artifacts)
        {
            // The caller first checked the immutable built-plan control count.
            // Its array getters return bounded fresh copies, never caller aliases.
            string[] argv = plan.Argv;
            string[] entries = plan.EnvironmentEntries;
            string[] allowedNames = plan.AllowedEnvironmentNames;
            GenericSourcePin[] pins = plan.SourcePins;
            GenericOwnershipRootBinding[] roots = plan.OwnershipRootBindings;
            artifacts = plan.GetAdditionalControlArtifacts();
            int[] lengths = new int[artifacts.Length];
            for (int i = 0; i < artifacts.Length; i++) lengths[i] = artifacts[i].Length;
            return BuildSnapshot(plan.Identity, plan.LeaseReceiptSha256,
                plan.TargetImagePath, plan.TargetImageSha256, argv,
                plan.WorkingDirectory, entries, allowedNames, plan.ReservationBinding,
                pins, plan.LedgerPlanSha256, (uint)plan.QualificationMode, roots, lengths);
        }

        private static long CountedUtf8Length(string value)
        {
            return checked(4L + StrictUtf8.GetByteCount(value));
        }

        private static long MeasureCanonical(EncodedSnapshot snapshot)
        {
            checked
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
                total += (long)snapshot.ArtifactLengths.Length * (4 + 32);
                return total;
            }
        }

        private static int WriteCountedUtf8(string value, byte[] target, int position)
        {
            int byteCount = StrictUtf8.GetByteCount(value);
            GuardianMemoryEvidence.Put32(target, position, (uint)byteCount);
            position = checked(position + 4);
            if (byteCount > 0)
                position = checked(position + StrictUtf8.GetBytes(value, 0,
                    value.Length, target, position));
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
                position = WriteCountedUtf8(snapshot.AllowedEnvironmentNames[i], target, position);
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
                (uint)snapshot.ArtifactLengths.Length); position += 4;
            for (int i = 0; i < snapshot.ArtifactLengths.Length; i++)
            {
                GuardianMemoryEvidence.Put32(target, position,
                    (uint)snapshot.ArtifactLengths[i]); position += 4;
                for (int k = 0; k < 32; k++)
                { target[position] = snapshot.ArtifactSha256[i][k]; position++; }
            }
            return position;
        }

        private sealed class EnvironmentEntryComparer : IComparer<string>
        {
            internal static readonly EnvironmentEntryComparer Instance =
                new EnvironmentEntryComparer();
            public int Compare(string x, string y)
            {
                // Used only after complete raw validation: both names exist.
                return CompareNames(x, x.IndexOf('='), y, y.IndexOf('='));
            }
        }
    }
}
