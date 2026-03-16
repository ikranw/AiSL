import kagglehub

path = kagglehub.dataset_download(
    "thedevastator/unlocking-the-power-of-cross-cultural-language-i"
)

print("Path to dataset files:", path)