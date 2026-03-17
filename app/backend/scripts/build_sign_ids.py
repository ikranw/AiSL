import json

with open("data/sign_inventory.json", "r", encoding="utf-8") as f:
    data = json.load(f)

tokens = data["canonical_tokens"]

mapping = {}
for i, token in enumerate(tokens, start=1):
    mapping[token] = f"sign_{i:05d}"

with open("data/canonical_to_sign_id.json", "w", encoding="utf-8") as f:
    json.dump(mapping, f, indent=2)

print(f"Saved {len(mapping)} sign IDs to data/canonical_to_sign_id.json")