# ImplicitMABSA Dataset

This folder contains annotations for the ImplicitMABSA research project.

## Dataset Source

OX-MABSR Dataset

- GitHub: https://github.com/Liuxj-Anya/OX-MABSR
- Google Drive: https://drive.google.com/drive/folders/1ayN8fIQF1aLegnNIVM8pFiegRI8BQKMo?usp=sharing

## Annotation Folders

- `thinking/` — Detailed reasoning annotations
- `enem/` — Entity and emotion pairs
- `surface/` — Surface-level sentiment explanations
- `background/` — Background-context sentiment explanations

Each folder contains `train.txt`, `val.txt`, and `test.txt`.

## Images and Original Text

The original images and posts are available from the dataset source and are not included in this repository because of their size.

## Important

Annotations require preprocessing and validation before model training. All three models should use the same dataset splits and labels.
