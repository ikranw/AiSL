using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;

// Matches the payload sent by unityBridge.ts:
// { "sequence": ["hello", "i", "want"], "options": { "speed": 1.0, "loop": false } }
[Serializable]
class BridgePayload
{
    public string[] sequence;
    public BridgeOptions options;
}

[Serializable]
class BridgeOptions
{
    public float speed = 1f;
    public bool loop = false;
}

public class ASLBridge : MonoBehaviour
{
    public AvatarBoneMap boneMap;

    void Awake()
    {
        if (boneMap == null)
            boneMap = GetComponent<AvatarBoneMap>();
    }

    // Called by JavaScript via: window.unityInstance.SendMessage('ASLBridge', 'PlaySequence', payload)
    public void PlaySequence(string json)
    {
        BridgePayload payload = JsonUtility.FromJson<BridgePayload>(json);

        if (payload == null || payload.sequence == null || payload.sequence.Length == 0)
        {
            Debug.LogWarning("ASLBridge: received empty or invalid payload.");
            return;
        }

        StopAllCoroutines();
        StartCoroutine(RunSequence(payload));
    }

    IEnumerator RunSequence(BridgePayload payload)
    {
        do
        {
            foreach (string signId in payload.sequence)
            {
                string clipUrl = Application.streamingAssetsPath + "/Signs/" + signId + "_clip.json";

                using (UnityWebRequest req = UnityWebRequest.Get(clipUrl))
                {
                    yield return req.SendWebRequest();

                    if (req.result != UnityWebRequest.Result.Success)
                    {
                        Debug.LogWarning("ASLBridge: could not load clip for '" + signId + "': " + req.error);
                        continue;
                    }

                    SignClipFile clip = JsonUtility.FromJson<SignClipFile>(req.downloadHandler.text);

                    if (clip == null || clip.frames == null || clip.frames.Count == 0)
                    {
                        Debug.LogWarning("ASLBridge: clip for '" + signId + "' has no frames.");
                        continue;
                    }

                    yield return StartCoroutine(PlayClip(clip, payload.options.speed));
                }
            }
        }
        while (payload.options.loop);
    }

    IEnumerator PlayClip(SignClipFile clip, float speed)
    {
        float startTime = Time.time;

        for (int i = 0; i < clip.frames.Count; i++)
        {
            SignFrame frame = clip.frames[i];
            float targetTime = startTime + (frame.time / Mathf.Max(speed, 0.01f));

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
