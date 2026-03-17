import pandas as pd
import json

df = pd.read_csv("scripts/train.csv", encoding="utf-8-sig")

with open("data/example_bank.jsonl", "w", encoding="utf-8") as f:
    for _, row in df.iterrows():
        text = str(row["text"]).strip()
        gloss = str(row["gloss"]).replace("\n", " ").strip()

        if not text or not gloss:
            continue

        gloss_tokens = [tok.strip().upper() for tok in gloss.split() if tok.strip()]

        example = {
            "english": text,
            "gloss": gloss_tokens,
            "sentence_type": "statement"
        }

        f.write(json.dumps(example) + "\n")

print("Saved example bank to data/example_bank.jsonl")