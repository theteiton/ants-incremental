const PALETTES = {
  nanitic: { d: "#7d5f55", h: "#8d6d62", t: "#7d5f55", b: "#6d5149", a: "#5d443d" },
  forager: { d: "#8e2f26", h: "#b8453a", t: "#a03a30", b: "#8e2f26", a: "#6d221b" },
  excavator: { d: "#7a3b2a", h: "#964a34", t: "#85402e", b: "#6d3425", a: "#552718" },
  nurse: { d: "#a85449", h: "#c2645a", t: "#b25a4f", b: "#a04c42", a: "#7d3a32" },
  soldier: { d: "#6b241c", h: "#8a2f24", t: "#772a20", b: "#63211a", a: "#4a1710" },
  queen: { d: "#a83b30", h: "#d4544a", t: "#bd453a", b: "#9c352b", a: "#7a281f" }
};

const EXTRA = {
  g: "#7fa653",
  e: "#efe0cf",
  s: "#d9a441"
};

const BODIES = {
  nanitic: [
    "...............",
    ".....a...a.....",
    "......hhh......",
    ".....hhhhh.....",
    "......hhh......",
    "...l..ttt..l...",
    "..ll..ttt..ll..",
    "...l..ttt..l...",
    ".....bbbbb.....",
    "......bbb......",
    "..............."
  ],
  forager: [
    "....ggggggg....",
    "..a..ggggg..a..",
    "...ahhhhhhha...",
    "...hhhhhhhhh...",
    "....hhhhhhh....",
    "..l..ttttt..l..",
    ".ll..ttttt..ll.",
    "..l..ttttt..l..",
    "....bbbbbbb....",
    "...bbbbbbbbb...",
    "....bbbbbbb...."
  ],
  excavator: [
    "..a.........a..",
    ".dd.........dd.",
    "..dhhhhhhhhhd..",
    "...hhhhhhhhh...",
    "....hhhhhhh....",
    "..l..ttttt..l..",
    ".ll..ttttt..ll.",
    "..l..ttttt..l..",
    "....bbbbbbb....",
    "...bbbbbbbbb...",
    "....bbbbbbb...."
  ],
  nurse: [
    "..a.........a..",
    "...a.......a...",
    "....hhhhhhh....",
    "...hhhhhhhhh...",
    "....hhhhhhh....",
    "..l..ttttt..l..",
    ".ll..ttttt.eee.",
    "..l..ttttt.eee.",
    "....bbbbbbb.e..",
    "...bbbbbbbbb...",
    "....bbbbbbb...."
  ],
  soldier: [
    ".dd.........dd.",
    "..dd.......dd..",
    "...hhhhhhhhh...",
    "..hhhhhhhhhhh..",
    "...hhhhhhhhh...",
    "..l..ttttt..l..",
    ".ll..ttttt..ll.",
    "..l..ttttt..l..",
    "...bbbbbbbbb...",
    "..bbbbbbbbbbb..",
    "...bbbbbbbbb..."
  ],
  queen: [
    "..a...sss...a..",
    "...a.sssss.a...",
    "....hhhhhhh....",
    "...hhhhhhhhh...",
    "....hhhhhhh....",
    "..l..ttttt..l..",
    ".ll..ttttt..ll.",
    "..l..ttttt..l..",
    "...bbbbbbbbb...",
    "..bbbbbbbbbbb..",
    "...bbbbbbbbb..."
  ]
};

function colorFor(ch, palette) {
  if (ch === ".") return null;
  if (EXTRA[ch]) return EXTRA[ch];
  return palette[ch] || palette.d;
}

export function drawSprite(canvas, casteId, scale) {
  const rows = BODIES[casteId] || BODIES.forager;
  const palette = PALETTES[casteId] || PALETTES.forager;
  const width = rows[0].length;
  const height = rows.length;
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < height; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const color = colorFor(row[x], palette);
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
}

export function spriteFor(casteId, scale) {
  const canvas = document.createElement("canvas");
  canvas.className = "sprite";
  drawSprite(canvas, casteId, scale || 3);
  return canvas;
}
