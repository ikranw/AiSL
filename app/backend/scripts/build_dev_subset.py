import pandas as pd

df = pd.read_csv("scripts/train.csv", encoding="utf-8-sig")
dev_df = df.sample(2000, random_state=42)
dev_df.to_csv("data/train_dev_subset.csv", index=False)

print("Saved 2000-row dev subset to data/train_dev_subset.csv")