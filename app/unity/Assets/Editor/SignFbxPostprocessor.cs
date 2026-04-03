using System.Linq;
using UnityEditor;
using UnityEngine;

/// <summary>
/// Automatically sets every FBX in Assets/Signs to Humanoid rig on import.
/// This prevents the avatar flying/scaling with older 2023 Mixamo exports.
///
/// Runs automatically on every new FBX dropped into Assets/Signs.
/// Menu: Signs > Fix Rig Type on All Sign FBXs  ← retroactive fix for existing files.
/// </summary>
public class SignFbxPostprocessor : AssetPostprocessor
{
    private const string SignsFolder = "Assets/Signs";

    // Runs before Unity processes the model — sets rig to Humanoid
    void OnPreprocessModel()
    {
        if (!assetPath.StartsWith(SignsFolder)) return;

        var importer = assetImporter as ModelImporter;
        if (importer == null) return;

        if (importer.animationType != ModelImporterAnimationType.Human)
        {
            importer.animationType = ModelImporterAnimationType.Human;
            Debug.Log($"[SignFbxPostprocessor] Set Humanoid rig on: {assetPath}");
        }
    }

    // Retroactive fix for all existing FBXs already in the project
    [MenuItem("Signs/Fix Rig Type on All Sign FBXs")]
    public static void FixAllSignFbxs()
    {
        var fbxPaths = AssetDatabase
            .FindAssets("t:GameObject", new[] { SignsFolder })
            .Select(AssetDatabase.GUIDToAssetPath)
            .Where(p => p.EndsWith(".fbx") || p.EndsWith(".FBX"))
            .ToArray();

        int fixed_ = 0;
        foreach (var path in fbxPaths)
        {
            var importer = AssetImporter.GetAtPath(path) as ModelImporter;
            if (importer == null) continue;
            if (importer.animationType == ModelImporterAnimationType.Human) continue;

            importer.animationType = ModelImporterAnimationType.Human;
            importer.SaveAndReimport();
            fixed_++;
            Debug.Log($"[SignFbxPostprocessor] Fixed: {path}");
        }

        Debug.Log($"[SignFbxPostprocessor] Done — set Humanoid on {fixed_}/{fbxPaths.Length} files.");
    }
}
