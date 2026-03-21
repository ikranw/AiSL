using UnityEngine;

public class WebGLKeyboardFix : MonoBehaviour
{
    void Awake()
    {
#if UNITY_WEBGL && !UNITY_EDITOR
        WebGLInput.captureAllKeyboardInput = false;
#endif
    }
}