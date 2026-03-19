using System.Collections;
using System.IO;
using UnityEngine;

public class SignMotionPlayer : MonoBehaviour
{
    public AvatarBoneMap boneMap;

    void Awake()
    {
        if (boneMap == null)
            boneMap = GetComponent<AvatarBoneMap>();

        Debug.Log("[SignMotionPlayer] Awake. BoneMap = " + (boneMap != null ? "FOUND" : "NULL"));
    }

    public void PlaySequenceFile(string sequencePath)
    {
        Debug.Log("[SignMotionPlayer] Loading sequence: " + sequencePath);

        if (!File.Exists(sequencePath))
        {
            Debug.LogError("Sequence file not found: " + sequencePath);
            return;
        }

        string json = File.ReadAllText(sequencePath);
        Debug.Log("[SignMotionPlayer] Sequence JSON loaded.");

        SignSequenceFile sequence = JsonUtility.FromJson<SignSequenceFile>(json);

        if (sequence == null || sequence.sequence == null)
        {
            Debug.LogError("[SignMotionPlayer] Failed to parse sequence JSON.");
            return;
        }

        Debug.Log("[SignMotionPlayer] Sequence contains " + sequence.sequence.Count + " entries.");

        StopAllCoroutines();
        StartCoroutine(PlaySequence(sequence));
    }

    IEnumerator PlaySequence(SignSequenceFile sequence)
    {
        foreach (var entry in sequence.sequence)
        {
            string clipPath = Path.Combine(Application.streamingAssetsPath, "Signs", entry.clip_file);
            Debug.Log("[SignMotionPlayer] Loading clip: " + clipPath);

            if (!File.Exists(clipPath))
            {
                Debug.LogWarning("Clip not found: " + clipPath);
                continue;
            }

            string clipJson = File.ReadAllText(clipPath);
            SignClipFile clip = JsonUtility.FromJson<SignClipFile>(clipJson);

            if (clip == null || clip.frames == null)
            {
                Debug.LogWarning("[SignMotionPlayer] Failed to parse clip: " + entry.clip_file);
                continue;
            }

            Debug.Log("[SignMotionPlayer] Playing clip " + clip.sign_id + " with " + clip.frames.Count + " frames.");
            yield return StartCoroutine(PlayClip(clip));
        }
    }

    IEnumerator PlayClip(SignClipFile clip)
    {
        if (clip.frames == null || clip.frames.Count == 0)
            yield break;

        float startTime = Time.time;

        for (int i = 0; i < clip.frames.Count; i++)
        {
            SignFrame frame = clip.frames[i];
            float targetTime = startTime + frame.time;

            while (Time.time < targetTime)
                yield return null;

            Debug.Log("[SignMotionPlayer] Applying frame at time " + frame.time);
            ApplyFrame(frame);
        }
    }

    void ApplyFrame(SignFrame frame)
    {
        if (boneMap == null)
        {
            Debug.LogError("[SignMotionPlayer] boneMap is NULL.");
            return;
        }

        foreach (var bone in frame.bones)
        {
            Transform t = boneMap.GetBone(bone.boneName);

            if (t == null)
            {
                Debug.LogWarning("[SignMotionPlayer] Bone not found: " + bone.boneName);
                continue;
            }

            Debug.Log("[SignMotionPlayer] Applying bone: " + bone.boneName);

            if (bone.rotation != null && bone.rotation.Length == 4)
            {
                t.localRotation = new Quaternion(
                    bone.rotation[0],
                    bone.rotation[1],
                    bone.rotation[2],
                    bone.rotation[3]
                );
            }

            if (bone.position != null && bone.position.Length == 3)
            {
                t.localPosition = new Vector3(
                    bone.position[0],
                    bone.position[1],
                    bone.position[2]
                );
            }
        }
    }
}