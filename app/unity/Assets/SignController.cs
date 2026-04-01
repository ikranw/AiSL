using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class SignController : MonoBehaviour
{
    public Animator animator;

    private Coroutine currentRoutine;

    private readonly Dictionary<string, int> glossToIndex = new Dictionary<string, int>()
    {
        { "MY NAME IS",   113 },
        { "CLEAN DISHES", 105 },
        { "HELLO",        100 },
        { "MY",           101 },
        { "YOU",          102 },
        { "TAKE",         103 },
        { "EVERYONE",     104 },
        { "PLEASE",       106 },
        { "BOOK",         107 },
        { "CHILD",        108 },
        { "CALIFORNIA",   109 },
        { "CHURCH",       110 },
        { "OR",           111 },
        { "WHERE",        112 },
        { "TOMORROW",     114 },
        { "WANT",         115 },
    };

    private readonly Dictionary<char, int> letterToIndex = new Dictionary<char, int>()
    {
        { 'A', 1 }, { 'B', 2 }, { 'C', 3 }, { 'D', 4 }, { 'E', 5 },
        { 'F', 6 }, { 'G', 7 }, { 'H', 8 }, { 'I', 9 }, { 'J', 10 },
        { 'K', 11 }, { 'L', 12 }, { 'M', 13 }, { 'N', 14 }, { 'O', 15 },
        { 'P', 16 }, { 'Q', 17 }, { 'R', 18 }, { 'S', 19 }, { 'T', 20 },
        { 'U', 21 }, { 'V', 22 }, { 'W', 23 }, { 'X', 24 }, { 'Y', 25 },
        { 'Z', 26 },
    };

    private readonly Dictionary<int, string> indexToStateName = new Dictionary<int, string>()
    {
        { 100, "SG ASL Hello 2024-6-9 Animation" },
        { 101, "SG ASL My 2024-6-9 Animation" },
        { 102, "SG ASL You 2025-7-22 Animation" },
        { 103, "SG ASL Take 2 2024-10-14 Animation" },
        { 104, "SG ASL Everyone 2025-7-23 Animation" },
        { 105, "SG ASL Clean Dishes 2025-2-23 Animation" },
        { 106, "SG ASL Please 2024-10-13 Animation" },
        { 107, "SG ASL Book 2 2024-6-9 Animation" },
        { 108, "SG ASL Child 2025-1-9 Animation" },
        { 109, "SG ASL California 2024-10-20 Animation" },
        { 110, "SG ASL Church 2025-1-22 Animation" },
        { 111, "SG ASL Or 2025-7-21 Animation" },
        { 112, "SG ASL Where Var 2025-7-24 Animation" },
        { 113, "SG ASL My Name Is 2024-6-9 Animation" },
        { 114, "TOMORROW|TOMORROW" },
        { 115, "Want" },

        

        { 1, "SG ASL A 2024-6-16 Animation" },
        { 2, "SG ASL B 2024-6-16 Animation" },
        { 3, "SG ASL C 1 2024-6-16 Animation" },
        { 4, "SG ASL D 2 2024-6-16 Animation" },
        { 5, "SG ASL E 2 2024-6-16 Animation" },
        { 6, "SG ASL F 2024-6-16 Animation" },
        { 7, "SG ASL G 2024-6-16 Animation" },
        { 8, "SG ASL H 2024-6-16 Animation" },
        { 9, "SG ASL I 2 2024-6-16 Animation" },
        { 10, "SG ASL J 2 2024-6-16 Animation" },
        { 11, "SG ASL K 1 2024-6-16 Animation" },
        { 12, "SG ASL L 2024-6-16 Animation" },
        { 13, "SG ASL M 2 2024-6-16 Animation" },
        { 14, "SG ASL N 2 2024-6-16 Animation" },
        { 15, "SG ASL O 2024-6-16 Animation" },
        { 16, "SG ASL P2 2024-6-17 Animation" },
        { 17, "SG ASL Q 2 2024-6-17 Animation" },
        { 18, "SG ASL R 3 2024-6-17 Animation" },
        { 19, "SG ASL S 2 2024-6-17 Animation" },
        { 20, "SG ASL T 2 2024-6-17 Animation" },
        { 21, "SG ASL U 2 2024-6-17 Animation" },
        { 22, "SG ASL V 2 2024-6-17 Animation" },
        { 23, "SG ASL W 2 2024-6-17 Animation" },
        { 24, "SG ASL X 1 2024-6-17 Animation" },
        { 25, "SG ASL Y 2 2024-6-17 Animation" },
        { 26, "SG ASL Z 2 2024-6-17 Animation" },
    };

    void Awake()
    {
        if (animator == null)
            animator = GetComponent<Animator>();
    }

    public void PlaySequenceFromFrontend(List<string> sequence, float speed, bool loop)
    {
        if (currentRoutine != null)
            StopCoroutine(currentRoutine);

        currentRoutine = StartCoroutine(PlaySequenceRoutine(sequence, speed, loop));
    }

    private IEnumerator PlaySequenceRoutine(List<string> sequence, float speed, bool loop)
    {
        do
        {
            foreach (var raw in sequence)
            {
                if (string.IsNullOrWhiteSpace(raw))
                    continue;

                string token = raw.Trim().ToUpper();

                if (glossToIndex.TryGetValue(token, out int index))
                    yield return StartCoroutine(PlaySign(index, speed));
                else
                    yield return StartCoroutine(Fingerspell(token, speed));

                yield return new WaitForSeconds(0.2f / speed);
            }
        }
        while (loop);

        ReturnToIdle();
        currentRoutine = null;
    }

    private IEnumerator PlaySign(int index, float speed)
    {
        if (!indexToStateName.ContainsKey(index))
        {
            Debug.LogWarning("No state name for index " + index);
            yield break;
        }

        animator.speed = speed;
        animator.SetInteger("SignIndex", index);
        animator.SetTrigger("PlaySign");

        for (int i = 0; i < 5; i++)
            yield return null;

        float timeout = 2f;
        float elapsed = 0f;
        string targetState = indexToStateName[index];

        while (!animator.GetCurrentAnimatorStateInfo(0).IsName(targetState) && elapsed < timeout)
        {
            elapsed += Time.deltaTime;
            yield return null;
        }

        var stateInfo = animator.GetCurrentAnimatorStateInfo(0);
        float clipLength = Mathf.Clamp(stateInfo.length, 0.3f, 4f);

        yield return new WaitForSeconds(clipLength / speed);
    }

    private IEnumerator Fingerspell(string word, float speed)
    {
        foreach (char letter in word)
        {
            if (letterToIndex.TryGetValue(letter, out int index))
            {
                yield return StartCoroutine(PlaySign(index, speed));
                yield return new WaitForSeconds(0.1f / speed);
            }
        }
    }

    private void ReturnToIdle()
    {
        animator.speed = 1f;
        animator.SetInteger("SignIndex", 0);
        animator.SetTrigger("PlaySign");
    }
}