using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class SignController : MonoBehaviour
{
    [Header("References")]
    public Animator animator;
    public TMP_InputField userInputField;
    public Button submitButton;

    // -------------------------------------------------------
    // FULL WORD SIGNS
    // Multi-word phrases (e.g. "MY NAME IS") must be listed
    // here — they will be matched BEFORE single words
    // -------------------------------------------------------
    private Dictionary<string, int> glossToIndex = new Dictionary<string, int>()
    {
        // Multi-word phrases — always list these FIRST
        { "MY NAME IS",   113 },
        { "CLEAN DISHES", 105 },

        // Single word signs
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
        {"TOMORROW",       114 },
        {"WANT",          115 },
    };

    // -------------------------------------------------------
    // FINGERSPELLING A-Z (SignIndex 1-26)
    // -------------------------------------------------------
    private Dictionary<char, int> letterToIndex = new Dictionary<char, int>()
    {
        { 'A',  1 }, { 'B',  2 }, { 'C',  3 }, { 'D',  4 },
        { 'E',  5 }, { 'F',  6 }, { 'G',  7 }, { 'H',  8 },
        { 'I',  9 }, { 'J', 10 }, { 'K', 11 }, { 'L', 12 },
        { 'M', 13 }, { 'N', 14 }, { 'O', 15 }, { 'P', 16 },
        { 'Q', 17 }, { 'R', 18 }, { 'S', 19 }, { 'T', 20 },
        { 'U', 21 }, { 'V', 22 }, { 'W', 23 }, { 'X', 24 },
        { 'Y', 25 }, { 'Z', 26 },
    };

    // -------------------------------------------------------
    // Animator state names — must match exactly
    // -------------------------------------------------------
    private Dictionary<int, string> indexToStateName = new Dictionary<int, string>()
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
        { 109, "SG ASL California 2024-10-30 Animation" },
        { 110, "SG ASL Church 2025-1-22 Animation" },
        { 111, "SG ASL Or 2025-7-21 Animation" },
        { 112, "SG ASL Where Var 2025-7-24 Animation" },
        { 113, "SG ASL My Name Is 2024-6-9 Animation" },
        { 114, "Tomorrow" },
        { 115, "Want" },

        { 1,  "SG ASL A 2024-6-16 Animation" },
        { 2,  "SG ASL B 2024-6-16 Animation" },
        { 3,  "SG ASL C 1 2024-6-16 Animation" },
        { 4,  "SG ASL D 2 2024-6-16 Animation" },
        { 5,  "SG ASL E 2 2024-6-16 Animation" },
        { 6,  "SG ASL F 2024-6-16 Animation" },
        { 7,  "SG ASL G 2024-6-16 Animation" },
        { 8,  "SG ASL H 2024-6-16 Animation" },
        { 9,  "SG ASL I 2 2024-6-16 Animation" },
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

    void Start()
    {
        if (animator == null)
            animator = GetComponent<Animator>();

        if (submitButton != null)
            submitButton.onClick.AddListener(OnSubmitPressed);
    }

    public void OnSubmitPressed()
    {
        if (userInputField == null || string.IsNullOrWhiteSpace(userInputField.text))
            return;

        string input = userInputField.text.Trim().ToUpper();
        Debug.Log($"Input received: {input}");
        StartCoroutine(PlayGlossSequence(input));
    }

    // -------------------------------------------------------
    // Greedy phrase matcher — tries longest match first
    // e.g. "MY NAME IS IKRAN" will match "MY NAME IS" first,
    // then fingerspell "IKRAN"
    // -------------------------------------------------------
    IEnumerator PlayGlossSequence(string input)
    {
        string[] words = input.Split(' ');
        int i = 0;

        while (i < words.Length)
        {
            if (string.IsNullOrWhiteSpace(words[i]))
            {
                i++;
                continue;
            }

            // Try to match the longest phrase starting at position i
            // e.g. try "MY NAME IS", then "MY NAME", then "MY"
            int matchLength = 0;
            string matchedPhrase = "";

            // Find the maximum number of words we could try
            int maxLook = Mathf.Min(4, words.Length - i); // look ahead up to 4 words

            for (int len = maxLook; len >= 1; len--)
            {
                string candidate = string.Join(" ", words, i, len);
                if (glossToIndex.ContainsKey(candidate))
                {
                    matchLength = len;
                    matchedPhrase = candidate;
                    break;
                }
            }

            if (matchLength > 0)
            {
                // Found a matching sign or phrase
                Debug.Log($"Playing full sign for: {matchedPhrase}");
                yield return StartCoroutine(PlaySign(glossToIndex[matchedPhrase]));
                i += matchLength; // skip all matched words
            }
            else
            {
                // No sign found — fingerspell this single word
                Debug.Log($"No sign for '{words[i]}', fingerspelling...");
                yield return StartCoroutine(Fingerspell(words[i]));
                i++;
            }

            yield return new WaitForSeconds(0.2f);
        }

        ReturnToIdle();
    }

    IEnumerator PlaySign(int index)
    {
        if (!indexToStateName.ContainsKey(index))
        {
            Debug.LogWarning($"No state name for index {index}");
            yield break;
        }

        animator.SetInteger("SignIndex", index);
        animator.SetTrigger("PlaySign");

        // Wait several frames for transition to start
        yield return null;
        yield return null;
        yield return null;
        yield return null;
        yield return null;

        // Wait until animator is actually IN the target state
        float timeout = 2f;
        float elapsed = 0f;
        string targetState = indexToStateName[index];

        while (!animator.GetCurrentAnimatorStateInfo(0).IsName(targetState) && elapsed < timeout)
        {
            elapsed += Time.deltaTime;
            yield return null;
        }

        // Read clip length and clamp to sensible range
        AnimatorStateInfo stateInfo = animator.GetCurrentAnimatorStateInfo(0);
        float clipLength = Mathf.Clamp(stateInfo.length, 0.3f, 4f);

        Debug.Log($"Playing '{targetState}' for {clipLength}s");
        yield return new WaitForSeconds(clipLength);
    }

    IEnumerator Fingerspell(string word)
    {
        foreach (char letter in word)
        {
            if (letterToIndex.ContainsKey(letter))
            {
                yield return StartCoroutine(PlaySign(letterToIndex[letter]));
                yield return new WaitForSeconds(0.1f);
            }
            else
            {
                Debug.LogWarning($"No fingerspelling for: '{letter}'");
            }
        }
    }

    void ReturnToIdle()
    {
        animator.SetInteger("SignIndex", 0);
        animator.SetTrigger("PlaySign");
        Debug.Log("Returning to idle");
    }
}