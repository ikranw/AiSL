using System.Collections.Generic;
using UnityEngine;

public class AvatarBoneMap : MonoBehaviour
{
    public Transform avatarRoot;
    public bool logBones = false;

    private Dictionary<string, Transform> boneMap = new Dictionary<string, Transform>();

    void Awake()
    {
        if (avatarRoot == null) avatarRoot = transform;
        BuildMap();
    }

    public void BuildMap()
    {
        boneMap.Clear();
        Transform[] all = avatarRoot.GetComponentsInChildren<Transform>(true);
        foreach (Transform t in all)
        {
            if (!boneMap.ContainsKey(t.name))
                boneMap[t.name] = t;
        }

        if (logBones)
        {
            foreach (var kv in boneMap)
                Debug.Log(kv.Key);
        }
    }

    public Transform GetBone(string name)
    {
        boneMap.TryGetValue(name, out Transform result);
        return result;
    }
}