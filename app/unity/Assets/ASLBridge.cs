using System;
using System.Collections.Generic;
using UnityEngine;

public class ASLBridge : MonoBehaviour
{
    [Serializable]
    public class PlaybackOptions
    {
        public float speed = 1f;
        public bool loop = false;
    }

    [Serializable]
    public class SequencePayload
    {
        public List<string> sequence;
        public PlaybackOptions options;
    }

    public SignController signController;

    void Awake()
    {
        if (signController == null)
            signController = FindObjectOfType<SignController>();
    }

    public void PlaySequence(string payloadJson)
    {
        Debug.Log("ASLBridge payload: " + payloadJson);

        if (signController == null)
        {
            Debug.LogError("ASLBridge: no SignController found.");
            return;
        }

        if (string.IsNullOrWhiteSpace(payloadJson))
        {
            Debug.LogWarning("ASLBridge: empty payload.");
            return;
        }

        try
        {
            var payload = JsonUtility.FromJson<SequencePayload>(payloadJson);
            if (payload == null || payload.sequence == null || payload.sequence.Count == 0)
            {
                Debug.LogWarning("ASLBridge: no sequence in payload.");
                return;
            }

            float speed = payload.options != null ? Mathf.Max(0.1f, payload.options.speed) : 1f;
            bool loop = payload.options != null && payload.options.loop;

            signController.PlaySequenceFromFrontend(payload.sequence, speed, loop);
        }
        catch (Exception ex)
        {
            Debug.LogError("ASLBridge parse error: " + ex.Message);
        }
    }

    public void PausePlayback(string _)
    {
        if (signController != null)
            signController.PausePlayback();
    }

    public void ResumePlayback(string _)
    {
        if (signController != null)
            signController.ResumePlayback();
    }

    public void SetPlaybackSpeed(string speedValue)
    {
        if (signController == null)
            return;

        if (float.TryParse(speedValue, out float speed))
            signController.SetPlaybackSpeed(speed);
    }

    public void SetLooping(string loopValue)
    {
        if (signController == null)
            return;

        if (bool.TryParse(loopValue, out bool loop))
            signController.SetLooping(loop);
    }
}
