import pandas as pd

df = pd.read_csv("train.csv", encoding="utf-8-sig")

print("Shape:", df.shape)
print("Columns:", df.columns.tolist())
print("\nFirst 10 rows:")
print(df.head(10).to_string())

print("\nNull counts:")
print(df.isnull().sum())

print("\nSample text values:")
print(df["text"].dropna().head(5).tolist())

print("\nSample gloss values:")
print(df["gloss"].dropna().head(5).tolist())