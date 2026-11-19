[![Competition](https://make.fun/badge/news-image-20261119.svg)](https://make.fun/bounty/news-image-20261119) [![Rank](https://make.fun/badge/news-image-20261119/yahyash61/makefun-news-2026-11-19/rank.svg)](https://make.fun/bounty/news-image-20261119) [![Reward](https://make.fun/badge/news-image-20261119/yahyash61/makefun-news-2026-11-19/reward.svg)](https://make.fun/bounty/news-image-20261119)

Competition: [make.fun news-image-20261119 bounty](https://make.fun/bounty/news-image-20261119)

# World in Focus

A deterministic, dependency-free newspaper infographic generator for a 960 x
960 pixel PNG. It uses only Node.js built-in modules at runtime, draws text
with an embedded bitmap font, and does not rely on system fonts or external
images.

The project was successfully tested with **Node.js 26.13.1**. This statement
does not claim that Node.js 22 was tested.

## News in this edition

`news.json` contains three stories dated November 19, 2026:

- **APEC / Shenzhen:** The summit and separate talks involving Donald Trump,
  Xi Jinping, and Vladimir Putin. Source: Reuters live coverage.
- **Ukraine / Crimea:** The Crimean Bridge attack and the reported suspension
  of rail services. Source: Reuters.
- **Human rights / Myanmar:** The International Court of Justice judgment in
  the Gambia v. Myanmar case concerning allegations of genocide against the
  Rohingya. The image does not state what the court decided. Source: Reuters.

Each item in `news.json` includes its summary, source name, source URL, and
publication date. Review the source material before changing the story copy.

## Run

From the project root, run the original renderer with Python 3.13 or newer:

```sh
python3 news_image.py
```

On Windows, use `py news_image.py`. The script reads `news.json` from the
project root and writes `output/entry.png` there, or to the directory named by
`MAKEFUN_OUTPUT_DIR` when that variable is set. It uses only the Python
standard library.

`main.ts` is the packed Make.fun entrypoint generated from `news_image.py` by
the kit's `makefun compress` command. Keep the Python source as the renderer;
repack `main.ts` after changing that source. The PNG is 960 x 960 pixels and
under 1 MiB. No package installation or network access is needed to render it.

## Project files

- `news_image.py` contains the renderer, bitmap font, and PNG encoder.
- `main.ts` is the compressed Make.fun entrypoint generated from the Python source.
- `news.json` contains the three story records and their citations.
- `LICENSE` contains the MIT License terms.
