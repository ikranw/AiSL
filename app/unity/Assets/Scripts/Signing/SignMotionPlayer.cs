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
    }

    public void PlaySequenceFile(string sequencePath)
    {
        if (!File.Exists(sequencePath))
        {
            Debug.LogError("Sequence file not found: " + sequencePath);
            return;
        }

        string json = File.ReadAllText(sequencePath);
        SignSequenceFile sequence = JsonUtility.FromJson<SignSequenceFile>(json);

        StopAllCoroutines();
        StartCoroutine(PlaySequence(sequence));
    }

    IEnumerator PlaySequence(SignSequenceFile sequence)
    {
        foreach (var entry in sequence.sequence)
        {
            string clipPath = Path.Combine(Application.streamingAssetsPath, "Signs", entry.clip_file);

            if (!File.Exists(clipPath))
            {
                Debug.LogWarning("Clip not found: " + clipPath);
                continue;
            }

            string clipJson = File.ReadAllText(clipPath);
            SignClipFile clip = JsonUtility.FromJson<SignClipFile>(clipJson);

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

            ApplyFrame(frame);
        }
    }

    void ApplyFrame(SignFrame frame)
    {
        foreach (var bone in frame.bones)
        {
            Transform t = boneMap.GetBone(bone.boneName);
            if (t == null) continue;

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