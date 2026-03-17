import pandas as pd

df = pd.read_csv("scripts/train.csv", encoding="utf-8-sig")

samples = df[["text", "gloss"]].dropna().sample(30, random_state=42)

for i, (_, row) in enumerate(samples.iterrows(), start=1):
    print(f"\nExample {i}")
    print("TEXT :", row["text"])
    print("GLOSS:", row["gloss"].replace("\n", " "))