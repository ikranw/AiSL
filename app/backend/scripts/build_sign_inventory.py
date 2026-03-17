import pandas as pd
import json

df = pd.read_csv("scripts/train.csv", encoding="utf-8-sig")

vocab = set()

for gloss in df["gloss"].dropna():
    tokens = str(gloss).replace("\n", " ").split()
    for token in tokens:
        token = token.strip().upper()
        if token:
            vocab.add(token)

canonical_tokens = sorted(vocab)

with open("data/sign_inventory.json", "w", encoding="utf-8") as f:
    json.dump({"canonical_tokens": canonical_tokens}, f, indent=2)

print(f"Saved {len(canonical_tokens)} canonical tokens to data/sign_inventory.json")
print("First 50 tokens:")
print(canonical_tokens[:50])