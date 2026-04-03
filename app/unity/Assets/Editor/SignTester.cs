using System.Collections.Generic;
using UnityEditor;
using UnityEngine;

/// <summary>
/// Play-mode test window for ASL signs.
/// Menu: Signs > Test Sign (Play Mode Only)
/// </summary>
public class SignTester : EditorWindow
{
    private string testInput = "ANCIENT";
    private float  speed     = 1f;

    [MenuItem("Signs/Test Sign (Play Mode Only)")]
    public static void ShowWindow()
    {
        var w = GetWindow<SignTester>("Sign Tester");
        w.minSize = new Vector2(300, 150);
    }

    void OnGUI()
    {
        GUILayout.Label("ASL Sign Tester", EditorStyles.boldLabel);
        GUILayout.Space(6);

        testInput = EditorGUILayout.TextField("Word / Phrase:", testInput);
        speed     = EditorGUILayout.Slider("Speed:", speed, 0.25f, 3f);
        GUILayout.Space(8);

        if (GUILayout.Button("▶  Play Sign", GUILayout.Height(32)))
            PlaySign();

        GUILayout.Space(4);
        if (!Application.isPlaying)
            EditorGUILayout.HelpBox("You must be in Play mode for this to work.", MessageType.Warning);
    }

    void PlaySign()
    {
        if (!Application.isPlaying)
        {
            Debug.LogWarning("[SignTester] Hit the Play button in Unity first, then click Play Sign.");
            return;
        }

        if (string.IsNullOrWhiteSpace(testInput))
        {
            Debug.LogWarning("[SignTester] Enter a word first.");
            return;
        }

        var controller = Object.FindObjectOfType<SignController>();
        if (controller == null)
        {
            Debug.LogError("[SignTester] No SignController found in the scene. Is the avatar in the scene?");
            return;
        }

        var tokens = new List<string>();
        foreach (var word in testInput.Trim().ToUpper().Split(' '))
            if (!string.IsNullOrWhiteSpace(word))
                tokens.Add(word);

        Debug.Log("[SignTester] Playing: " + string.Join(" ", tokens));
        controller.PlaySequenceFromFrontend(tokens, speed, false);
    }
}
