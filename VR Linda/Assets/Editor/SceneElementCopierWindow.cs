using System;
using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

public sealed class SceneElementCopierWindow : EditorWindow
{
    private const string DefaultSourceScenePath = @"C:\Users\Elshaddai\Desktop\Unity Projects\My project (1)\Assets\Scenes\Room.unity";
    private const string DefaultTargetScenePath = "Assets/Scenes/SampleScene.unity";

    [SerializeField] private string sourceScenePath = DefaultSourceScenePath;
    [SerializeField] private SceneAsset targetSceneAsset;
    [SerializeField] private bool openTargetSceneIfNeeded = true;
    [SerializeField] private bool unloadSourceSceneAfterCopy = true;

    [SerializeField] private List<SceneRootEntry> sourceRoots = new List<SceneRootEntry>();

    private Vector2 scrollPosition;

    [MenuItem("Tools/Scene Tools/Copy Elements Into SampleScene")]
    private static void OpenWindow()
    {
        var window = GetWindow<SceneElementCopierWindow>("Scene Copier");
        window.minSize = new Vector2(540f, 420f);
        window.Show();
    }

    [MenuItem("Window/Scene Copier")]
    private static void OpenWindowFromWindowMenu()
    {
        OpenWindow();
    }

    private void OnEnable()
    {
        if (targetSceneAsset == null)
        {
            targetSceneAsset = AssetDatabase.LoadAssetAtPath<SceneAsset>(DefaultTargetScenePath);
        }
    }

    private void OnGUI()
    {
        EditorGUILayout.LabelField("Copy Root Objects Between Scenes", EditorStyles.boldLabel);
        EditorGUILayout.HelpBox(
            "Load a source scene, choose the root objects you want, and copy them into the target scene.",
            MessageType.Info);

        using (new EditorGUILayout.VerticalScope(EditorStyles.helpBox))
        {
            sourceScenePath = EditorGUILayout.TextField("Source Scene Path", sourceScenePath);
            targetSceneAsset = (SceneAsset)EditorGUILayout.ObjectField("Target Scene", targetSceneAsset, typeof(SceneAsset), false);
            openTargetSceneIfNeeded = EditorGUILayout.ToggleLeft("Open target scene if it is not already loaded", openTargetSceneIfNeeded);
            unloadSourceSceneAfterCopy = EditorGUILayout.ToggleLeft("Unload source scene after copy", unloadSourceSceneAfterCopy);
        }

        using (new EditorGUILayout.HorizontalScope())
        {
            if (GUILayout.Button("Refresh Source Objects", GUILayout.Height(28f)))
            {
                RefreshSourceObjects();
            }

            using (new EditorGUI.DisabledScope(sourceRoots.Count == 0))
            {
                if (GUILayout.Button("Select All", GUILayout.Height(28f)))
                {
                    SetAllSelections(true);
                }

                if (GUILayout.Button("Select None", GUILayout.Height(28f)))
                {
                    SetAllSelections(false);
                }
            }
        }

        EditorGUILayout.Space(6f);
        EditorGUILayout.LabelField("Source Root Objects", EditorStyles.boldLabel);

        using (var scroll = new EditorGUILayout.ScrollViewScope(scrollPosition))
        {
            scrollPosition = scroll.scrollPosition;

            if (sourceRoots.Count == 0)
            {
                EditorGUILayout.HelpBox("No source objects loaded yet.", MessageType.None);
            }
            else
            {
                foreach (var entry in sourceRoots)
                {
                    entry.selected = EditorGUILayout.ToggleLeft(entry.name, entry.selected);
                }
            }
        }

        EditorGUILayout.Space(8f);

        using (new EditorGUI.DisabledScope(sourceRoots.Count == 0))
        {
            if (GUILayout.Button("Copy Selected Objects", GUILayout.Height(34f)))
            {
                CopySelectedObjects();
            }
        }
    }

    private void RefreshSourceObjects()
    {
        if (!ValidateSourcePath())
        {
            return;
        }

        var sourceScene = GetOrOpenScene(sourceScenePath, OpenSceneMode.Additive);
        if (!sourceScene.IsValid())
        {
            EditorUtility.DisplayDialog("Scene Copier", "Unity could not open the source scene.", "OK");
            return;
        }

        sourceRoots.Clear();
        foreach (var rootObject in sourceScene.GetRootGameObjects())
        {
            sourceRoots.Add(new SceneRootEntry
            {
                name = rootObject.name,
                selected = true,
            });
        }

        sourceRoots.Sort((left, right) => string.Compare(left.name, right.name, StringComparison.OrdinalIgnoreCase));
    }

    private void CopySelectedObjects()
    {
        if (!ValidateSourcePath())
        {
            return;
        }

        var targetPath = targetSceneAsset != null ? AssetDatabase.GetAssetPath(targetSceneAsset) : string.Empty;
        if (string.IsNullOrWhiteSpace(targetPath))
        {
            EditorUtility.DisplayDialog("Scene Copier", "Assign a target scene before copying.", "OK");
            return;
        }

        if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo())
        {
            return;
        }

        var targetScene = SceneManager.GetSceneByPath(targetPath);
        if (!targetScene.isLoaded)
        {
            if (!openTargetSceneIfNeeded)
            {
                EditorUtility.DisplayDialog("Scene Copier", "The target scene is not loaded.", "OK");
                return;
            }

            targetScene = EditorSceneManager.OpenScene(targetPath, OpenSceneMode.Single);
        }

        var sourceScene = GetOrOpenScene(sourceScenePath, OpenSceneMode.Additive);
        if (!sourceScene.IsValid())
        {
            EditorUtility.DisplayDialog("Scene Copier", "Unity could not open the source scene.", "OK");
            return;
        }

        var sourceRootMap = new Dictionary<string, GameObject>(StringComparer.Ordinal);
        foreach (var root in sourceScene.GetRootGameObjects())
        {
            if (!sourceRootMap.ContainsKey(root.name))
            {
                sourceRootMap.Add(root.name, root);
            }
        }

        var copiedCount = 0;
        foreach (var entry in sourceRoots)
        {
            if (!entry.selected || !sourceRootMap.TryGetValue(entry.name, out var sourceRoot))
            {
                continue;
            }

            var copy = UnityEngine.Object.Instantiate(sourceRoot);
            copy.name = sourceRoot.name;
            Undo.RegisterCreatedObjectUndo(copy, $"Copy {copy.name} From Scene");
            SceneManager.MoveGameObjectToScene(copy, targetScene);
            copiedCount++;
        }

        EditorSceneManager.MarkSceneDirty(targetScene);
        EditorSceneManager.SetActiveScene(targetScene);

        if (unloadSourceSceneAfterCopy && sourceScene.isLoaded)
        {
            EditorSceneManager.CloseScene(sourceScene, true);
        }

        EditorUtility.DisplayDialog(
            "Scene Copier",
            copiedCount > 0
                ? $"Copied {copiedCount} root object(s) into {targetScene.name}."
                : "No objects were copied. Make sure at least one source object is selected.",
            "OK");
    }

    private Scene GetOrOpenScene(string path, OpenSceneMode openMode)
    {
        var existingScene = SceneManager.GetSceneByPath(path);
        return existingScene.isLoaded ? existingScene : EditorSceneManager.OpenScene(path, openMode);
    }

    private bool ValidateSourcePath()
    {
        if (string.IsNullOrWhiteSpace(sourceScenePath))
        {
            EditorUtility.DisplayDialog("Scene Copier", "Enter a source scene path first.", "OK");
            return false;
        }

        if (!File.Exists(sourceScenePath))
        {
            EditorUtility.DisplayDialog("Scene Copier", $"Source scene not found:\n{sourceScenePath}", "OK");
            return false;
        }

        return true;
    }

    private void SetAllSelections(bool isSelected)
    {
        foreach (var entry in sourceRoots)
        {
            entry.selected = isSelected;
        }
    }

    [Serializable]
    private sealed class SceneRootEntry
    {
        public string name;
        public bool selected;
    }
}
