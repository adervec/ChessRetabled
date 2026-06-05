# Third-party notices

ChessRetabled is licensed under the GNU General Public License v3.0 (see
[`LICENSE`](./LICENSE)). It bundles and builds on the third-party components
listed below; each remains under its own license. Copyright in each component
belongs to its respective authors.

---

## Bundled at runtime (shipped to the browser)

### Stockfish 16 — GPL-3.0-or-later

The chess engine. The WebAssembly build and its NNUE evaluation network
(`public/engine/stockfish-nnue-16-single.js`, `.wasm`, and `nn-*.nnue`) are
distributed **unmodified** from the npm `stockfish` package (v16.0.0) and remain
under the GPL-3.0. The full license text is in [`LICENSE`](./LICENSE) and is also
shipped alongside the engine at `engine/STOCKFISH-LICENSE.txt`.

Complete corresponding source code:

- Stockfish engine — <https://github.com/official-stockfish/Stockfish> (Stockfish 16)
- WebAssembly build — <https://github.com/nmrugg/stockfish.js> (npm `stockfish` 16.0.0)

ChessRetabled communicates with Stockfish at arm's length over the standard UCI
protocol in a separate Web Worker; the engine is not modified.

### chess.js — BSD-2-Clause

Move generation, validation, and game state. Copyright (c) 2025, Jeff Hlywa
(jhlywa@gmail.com). See the BSD-2-Clause text below.

### react, react-dom — MIT

Copyright (c) Meta Platforms, Inc. and affiliates. See the MIT text below.

### react-router-dom — MIT

Copyright (c) React Training LLC / Remix Software. See the MIT text below.

### zustand — MIT

Copyright (c) 2019 Paul Henschel. See the MIT text below.

### Fonts: "Baloo 2" and "Nunito" — SIL Open Font License 1.1

Loaded from Google Fonts. Both families are licensed under the SIL OFL 1.1, which
permits use, embedding, and web-serving. <https://openfontlicense.org>

---

## Build-time only (not distributed)

`vite`, `@vitejs/plugin-react` (MIT), `typescript` (Apache-2.0), and the
`@types/*` packages (MIT) are development tooling and are **not** included in the
shipped app.

---

## License texts

### MIT License

Applies to: react, react-dom, react-router-dom, zustand (and build tooling).

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### BSD 2-Clause License

Applies to: chess.js. Copyright (c) 2025, Jeff Hlywa.

```
Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### GPL-3.0 — Stockfish

The complete GPL-3.0 text is in [`LICENSE`](./LICENSE).
