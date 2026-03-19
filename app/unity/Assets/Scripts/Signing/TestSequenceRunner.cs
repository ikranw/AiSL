using System.IO;
using UnityEngine;

public class TestSequenceRunner : MonoBehaviour
{
    public SignMotionPlayer player;

    void Start()
    {
        if (player == null)
            player = GetComponent<SignMotionPlayer>();

        if (player == null)
        {
            Debug.LogError("[TestSequenceRunner] No SignMotionPlayer found.");
            return;
        }

        string path = Path.Combine(Application.streamingAssetsPath, "Sequences", "latest_sequence.json");
        Debug.Log("[TestSequenceRunner] Attempting to play sequence: " + path);

        player.PlaySequenceFile(path);
    }
}