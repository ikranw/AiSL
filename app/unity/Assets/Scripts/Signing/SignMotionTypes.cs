using System;
using System.Collections.Generic;

[Serializable]
public class SignClipFile
{
    public string sign_id;
    public int fps;
    public List<SignFrame> frames;
}

[Serializable]
public class SignFrame
{
    public float time;
    public List<BonePoseEntry> bones;
}

[Serializable]
public class BonePoseEntry
{
    public string boneName;
    public float[] rotation;
    public float[] position;
}

[Serializable]
public class SignSequenceFile
{
    public string version;
    public string avatar;
    public List<SequenceEntry> sequence;
}

[Serializable]
public class SequenceEntry
{
    public string sign_id;
    public string clip_file;
    public float duration;
}