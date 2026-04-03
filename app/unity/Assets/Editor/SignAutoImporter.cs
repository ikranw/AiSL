using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using UnityEditor;
using UnityEditor.Animations;
using UnityEngine;

/// <summary>
/// Scans Assets/Signs for FBX files not yet in ASL_Controller.controller,
/// adds an AnimatorState + AnyState transition for each, and updates
/// SignController.cs when possible.
///
/// Menu: Signs &gt; Auto-Import New FBX Signs
/// </summary>
public static class SignAutoImporter
{
    private const string ControllerPath = "Assets/ASL_Controller.controller";
    private const string SignsFolder    = "Assets/Signs";

    /// <summary>One-shot demo: imports only the Alien sign (for automation / CI tryout).</summary>
    public static void BatchImportDemoAlienSign()
    {
        string path = "Assets/Signs/SG ASL Alien (ET) 1 2023-5-20 No Mesh Mixamo.fbx";
        int n = ImportSingleFbxAssetPath(path, quiet: false);
        if (n == 0)
            Debug.Log("[SignAutoImporter] BatchImportDemoAlienSign: skipped (already imported or clip missing).");
        EditorApplication.Exit(0);
    }

    [MenuItem("Signs/Auto-Import New FBX Signs")]
    public static void ImportNewSigns()
    {
        var controller = AssetDatabase.LoadAssetAtPath<AnimatorController>(ControllerPath);
        if (controller == null)
        {
            Debug.LogError($"[SignAutoImporter] Could not find controller at {ControllerPath}");
            return;
        }

        var stateMachine = controller.layers[0].stateMachine;
        var existingStateNames = new HashSet<string>(
            stateMachine.states.Select(s => s.state.name)
        );
        var existingGlossKeys = ReadExistingGlossKeys();

        int nextIndex = FindNextAvailableIndex(stateMachine);
        Debug.Log($"[SignAutoImporter] Next available SignIndex: {nextIndex}");

        var fbxPaths = AssetDatabase
            .FindAssets("t:GameObject", new[] { SignsFolder })
            .Select(AssetDatabase.GUIDToAssetPath)
            .Where(p => p.EndsWith(".fbx") || p.EndsWith(".FBX"))
            .ToList();

        var glossEntries        = new StringBuilder();
        var indexToStateEntries = new StringBuilder();
        int added = 0;

        foreach (var fbxPath in fbxPaths)
        {
            if (!TryImportOneFbx(stateMachine, fbxPath, ref existingStateNames, ref existingGlossKeys, ref nextIndex,
                    out string glossLine, out string idxLine))
                continue;

            glossEntries.AppendLine(glossLine);
            indexToStateEntries.AppendLine(idxLine);
            added++;
        }

        if (added == 0)
        {
            Debug.Log("[SignAutoImporter] No new signs to import.");
            return;
        }

        EditorUtility.SetDirty(controller);
        AssetDatabase.SaveAssets();
        FinishSignControllerUpdate(glossEntries, indexToStateEntries, added);
    }

/// <returns>Number of signs added (0 or 1).</returns>
    public static int ImportSingleFbxAssetPath(string assetPath, bool quiet = false)
    {
        var controller = AssetDatabase.LoadAssetAtPath<AnimatorController>(ControllerPath);
        if (controller == null)
        {
            if (!quiet) Debug.LogError($"[SignAutoImporter] Could not find controller at {ControllerPath}");
            return 0;
        }

        var stateMachine = controller.layers[0].stateMachine;
        var existing = new HashSet<string>(stateMachine.states.Select(s => s.state.name));
        var existingGlossKeys = ReadExistingGlossKeys();
        int nextIndex = FindNextAvailableIndex(stateMachine);

        if (!TryImportOneFbx(stateMachine, assetPath, ref existing, ref existingGlossKeys, ref nextIndex,
                out string glossLine, out string idxLine))
            return 0;

        EditorUtility.SetDirty(controller);
        AssetDatabase.SaveAssets();

        var glossBuilder = new StringBuilder();
        var idxBuilder   = new StringBuilder();
        glossBuilder.AppendLine(glossLine);
        idxBuilder.AppendLine(idxLine);
        FinishSignControllerUpdate(glossBuilder, idxBuilder, 1);

        if (!quiet)
            Debug.Log($"[SignAutoImporter] Imported 1 sign from {assetPath} (SignIndex {nextIndex - 1}).");
        return 1;
    }

    private static void FinishSignControllerUpdate(StringBuilder glossEntries, StringBuilder indexToStateEntries, int added)
    {
        bool updated = UpdateSignController(glossEntries.ToString(), indexToStateEntries.ToString());
        if (updated)
            Debug.Log($"[SignAutoImporter] Added {added} sign(s) and updated SignController.cs automatically.");
        else
            Debug.Log(
                $"[SignAutoImporter] Added {added} sign(s). Could not find SignController.cs — paste manually:\n\n" +
                "// --- glossToIndex entries ---\n" + glossEntries +
                "\n// --- indexToStateName entries ---\n" + indexToStateEntries
            );
    }

    private static bool TryImportOneFbx(
        AnimatorStateMachine stateMachine,
        string fbxPath,
        ref HashSet<string> existingStateNames,
        ref HashSet<string> existingGlossKeys,
        ref int nextIndex,
        out string glossLine,
        out string indexLine)
    {
        glossLine = null;
        indexLine = null;

        string stateName = FbxPathToStateName(fbxPath);
        if (existingStateNames.Contains(stateName))
            return false;

        string glossKey = StateNameToGlossKey(stateName);
        if (existingGlossKeys.Contains(glossKey))
        {
            AssetDatabase.MoveAssetToTrash(fbxPath);
            Debug.LogWarning($"[SignAutoImporter] Deleted duplicate '{stateName}' — gloss key \"{glossKey}\" already exists.");
            return false;
        }

        var clip = GetFirstAnimationClip(fbxPath);
        if (clip == null)
        {
            Debug.LogWarning($"[SignAutoImporter] No animation clip found in: {fbxPath}");
            return false;
        }

        var state = stateMachine.AddState(stateName);
        state.motion = clip;

        var t = stateMachine.AddAnyStateTransition(state);
        t.AddCondition(AnimatorConditionMode.Equals, nextIndex, "SignIndex");
        t.AddCondition(AnimatorConditionMode.If, 0, "PlaySign");
        t.duration            = 0.25f;
        t.hasExitTime         = false;
        t.canTransitionToSelf = true;

        glossLine  = $"        {{ \"{glossKey}\", {nextIndex} }},";
        indexLine  = $"        {{ {nextIndex}, \"{stateName}\" }},";

        Debug.Log($"[SignAutoImporter] Added '{stateName}' → index {nextIndex}");
        existingStateNames.Add(stateName);
        existingGlossKeys.Add(glossKey);
        nextIndex++;
        return true;
    }

    private static HashSet<string> ReadExistingGlossKeys()
    {
        var keys = new HashSet<string>();
        string[] guids = AssetDatabase.FindAssets("SignController t:Script");
        if (guids.Length == 0) return keys;

        string fullPath = Path.GetFullPath(AssetDatabase.GUIDToAssetPath(guids[0]));
        string content  = File.ReadAllText(fullPath);

        // Match lines like: { "SOME KEY", 123 },
        foreach (Match m in Regex.Matches(content, @"\{\s*""([^""]+)""\s*,\s*\d+\s*\}"))
            keys.Add(m.Groups[1].Value);

        return keys;
    }

    private static bool UpdateSignController(string glossEntries, string indexEntries)
    {
        string[] guids = AssetDatabase.FindAssets("SignController t:Script");
        if (guids.Length == 0) return false;

        string assetPath = AssetDatabase.GUIDToAssetPath(guids[0]);
        string fullPath  = Path.GetFullPath(assetPath);
        string content   = File.ReadAllText(fullPath);

        content = InsertBeforeDictClose(content, "glossToIndex",      glossEntries);
        content = InsertBeforeDictClose(content, "indexToStateName",  indexEntries);

        File.WriteAllText(fullPath, content);
        AssetDatabase.ImportAsset(assetPath);
        return true;
    }

    /// <summary>
    /// Inserts <paramref name="newLines"/> just before the closing "};" of the
    /// named dictionary field in a C# source string.
    /// </summary>
    private static string InsertBeforeDictClose(string src, string dictName, string newLines)
    {
        // Find the dictionary declaration
        int declPos = src.IndexOf(dictName);
        if (declPos < 0) return src;

        // From there, find the closing "};"
        int closePos = src.IndexOf("};", declPos);
        if (closePos < 0) return src;

        // Normalize each inserted line to 8 spaces of indentation,
        // skipping any line whose key/value already appears in the dict body.
        string existingBody = src.Substring(declPos, closePos - declPos);
        var normalizedLines = new System.Text.StringBuilder();
        foreach (var line in newLines.Split('\n'))
        {
            string trimmed = line.Trim();
            if (trimmed.Length == 0) continue;
            // Extract the key portion (everything up to the first comma) to check for duplicates
            string keyPart = trimmed.Split(',')[0].Trim(); // e.g. { "BABBLE" or { 179
            if (existingBody.Contains(keyPart)) continue;
            normalizedLines.AppendLine("        " + trimmed);
        }

        return src.Substring(0, closePos) + normalizedLines + "    " + src.Substring(closePos);
    }

    // -------------------------------------------------------------------------

    /// <summary>
    /// Derives the animator state name from the FBX asset path.
    /// e.g. "Assets/Signs/SG ASL ADHD 1 2023-8-16 No Mesh Mixamo.fbx"
    ///   -> "SG ASL ADHD 1 2023-8-16 Animation"
    /// </summary>
    private static string FbxPathToStateName(string fbxPath)
    {
        string fileName = Path.GetFileNameWithoutExtension(fbxPath);
        // Remove the rig/mesh suffix variants
        fileName = Regex.Replace(fileName, @"\s+No Mesh (Mixamo|Full|UE Mannequin)$", "",
                                 RegexOptions.IgnoreCase);
        fileName = Regex.Replace(fileName, @"\s+Mesh$", "", RegexOptions.IgnoreCase);
        return fileName.TrimEnd() + " Animation";
    }

    /// <summary>
    /// Derives the gloss key (ALL CAPS word) from the state name.
    /// e.g. "SG ASL ADHD 1 2023-8-16 Animation" -> "ADHD 1"
    /// </summary>
    private static string StateNameToGlossKey(string stateName)
    {
        // Remove "SG ASL " prefix and " Animation" suffix
        string s = stateName;
        if (s.StartsWith("SG ASL ")) s = s.Substring("SG ASL ".Length);
        if (s.EndsWith(" Animation")) s = s.Substring(0, s.Length - " Animation".Length);
        // Remove trailing date pattern like " 2023-8-16"
        s = Regex.Replace(s, @"\s+\d{4}-\d{1,2}-\d{1,2}.*$", "").Trim();

        // Strip parenthesised alternate labels, e.g. "Alien (ET) 1" → "Alien"
        s = Regex.Replace(s, @"\s*\([^)]*\)\s*", " ").Trim();

        // Always strip trailing variant numbers, e.g. "Ancient 1" → "Ancient",
        // "Alaska Alt 3" → "Alaska Alt", "Algorithm 3" → "Algorithm"
        s = Regex.Replace(s, @"\s+\d+$", "").Trim();

        return s.ToUpper();
    }

    /// <summary>
    /// Finds the first non-preview AnimationClip inside an FBX asset.
    /// </summary>
    private static AnimationClip GetFirstAnimationClip(string fbxPath)
    {
        return AssetDatabase
            .LoadAllAssetsAtPath(fbxPath)
            .OfType<AnimationClip>()
            .FirstOrDefault(c => !c.name.StartsWith("__preview__"));
    }

    /// <summary>
    /// Highest SignIndex used in AnyState transitions, plus one.
    /// </summary>
    private static int FindNextAvailableIndex(AnimatorStateMachine sm)
    {
        int max = 0;
        foreach (var t in sm.anyStateTransitions)
        {
            foreach (var c in t.conditions)
            {
                if (c.parameter == "SignIndex")
                    max = Mathf.Max(max, (int)c.threshold);
            }
        }
        return max + 1;
    }
}
