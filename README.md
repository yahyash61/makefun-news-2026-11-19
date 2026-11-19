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

From the project root, run:

```sh
node --experimental-strip-types main.ts
```

The program reads `news.json` from the project root and creates the output
directory if needed. On Linux, it writes to `/output/entry.png`. On Windows,
it writes to the project-local `output/entry.png` folder. The PNG is 960 x 960
pixels and the program rejects output larger than 1 MiB.

No package installation or network access is needed. The renderer uses fixed
layout, colors, bitmap glyphs, PNG chunk order, and compression settings to
produce repeatable output in the same Node.js/zlib environment.

## Project files

- `main.ts` contains the renderer, bitmap font, validation, and PNG encoder.
- `news.json` contains the three story records and their citations.
- `LICENSE` contains the MIT License terms.
