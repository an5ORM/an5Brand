# AN5Wordmark-Bold.ttf

Subset of **DejaVu Sans Bold** containing only the `A`, `N` and `5` glyphs used by
`scripts/generate-icons.js`. It is a build-time input only: the generator converts
these glyphs to SVG outlines so the committed icons need no system font.

Regenerate the subset with:

```sh
npm run subset:font -- --source /usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
```

## License

The DejaVu fonts are based on Bitstream Vera Fonts, Copyright (c) 2003 by
Bitstream, Inc. All Rights Reserved, with the DejaVu changes in the public domain.

Bitstream Vera Fonts Copyright are (c) 2003 by Bitstream, Inc. All Rights
Reserved. Bitstream Vera is a trademark of Bitstream, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy of
the fonts accompanying this license ("Fonts") and associated documentation files
(the "Font Software"), to reproduce and distribute the Font Software, including
without limitation the rights to use, copy, merge, publish, distribute, and/or
sell copies of the Font Software, and to permit persons to whom the Font Software
is furnished to do so, subject to the following conditions:

The above copyright and trademark notices and this permission notice shall be
included in all copies of one or more of the Font Software typefaces.

The Font Software may be modified, altered, or added to, and in particular the
designs of glyphs or characters in the Fonts may be modified and additional glyphs
or characters may be added to the Fonts, only if the fonts are renamed to names not
containing either the words "Bitstream" or the word "Vera".

This subset is unmodified in shape and is only stripped of unused glyphs, so the
original names are kept.