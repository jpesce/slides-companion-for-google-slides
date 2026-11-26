// The website's companions in 3D, painted as the drawing is: his bun turns to look at the pointer,
// his fur is the drawing's own zigzag of spikes laid along his outline wherever it is on screen, and
// his eyes are drawn as the 2D companion's (extension/companion-motion.js), with its numbers. At
// rest he's the drawing exactly: its outline, its spikes, its eyes and pupils where it has them.
// site.js loads this only once a companion is on screen, for visitors who haven't asked for reduced
// motion or to save data, and keeps the drawing in the page until the first frame here is drawn,
// and for anyone WebGL 2 doesn't run for, or runs too slowly. It's drawn with WebGL 2 directly:
// flat colour, a stencil and some matrices are all it needs, 20 KB where three.js, which the
// prototypes he came from used, is over 400 KB unminified.
const SHAPE = {
  // In units of his bun's radius (285 in scripts/build-brand.mjs), y up, facing +z: a
  // superellipsoid, rounder on top than below, as the drawing's lower half is squarer.
  body: { x: 1.14, top: 0.9, bottom: 0.81, depth: 0.95, qTop: 2, qBottom: 2.6 },
  // As the drawing has them (scripts/build-brand.mjs): where, how big, tilted how far, the
  // pupil's radius, and the seed of each one's hand-drawn wobble. `depth` is how far an eye bulges.
  eyes: [
    { x: -0.41, y: 0.121, rx: 0.319, ry: 0.36, depth: 0.17, tilt: 14, pupil: 0.096, seed: 7 },
    { x: 0.366, y: 0.212, rx: 0.365, ry: 0.338, depth: 0.17, tilt: -12, pupil: 0.101, seed: 9 },
  ],
};
// His fur: the drawing's own (furPath in scripts/build-brand.mjs), 120 spikes from its seed.
const FUR = { spikes: 120, seed: 13 };
// The drawing's ink; two tones of it once the light comes on, lighter toward the light; the
// eyes' white, and its cool shadow.
const INK = '#1F1F1F';
const LIT = '#282828';
const SHADE = '#161616';
const WHITE = '#FFFFFF';
const WHITE_SHADE = '#E4E6EB';
// He takes over from the drawing in its flat ink, and the light comes on a moment later: his two
// tones and his shadow ease in from `after` milliseconds, over `over`.
const LIGHT = { after: 400, over: 1200 };

// The canvas, centred on his bun's middle where the drawing has it, shows this many of his units
// from side to side: room for his longest spikes as he turns. The camera stands as far off as it
// did in the prototypes, so he's seen in the same perspective.
const SPAN = 3.6;
const DISTANCE = 4.5 / 2 / Math.tan((12.5 * Math.PI) / 180);

// ---- How he moves (the numbers of extension/companion-motion.js, where it has them) ----
const SPRINGS = {
  gaze: [40, 0.78],
  press: [46, 0.92],
  release: [23, 0.32],
  turn: [9, 0.55],
  interest: [14, 1],
  face: [16, 0.42],
};
const SQUASH = { y: 0.13, x: 0.09 };
// His face rides inside his body a beat late (`lag`, per unit of squash it's behind), drops a
// touch as he blinks (`blink`) while his body dips (`dip`), and stretched, his eyes widen.
const FACE = { lag: 26 / 285, blink: 6 / 285, dip: 0.012, widen: 0.14 };
// His whole body turns toward the pointer, as if it hung `near` pixels in front of the page, a
// third of the way side to side and a quarter up and down, so his far eye stays on his face even
// with the pointer in a corner; his pupils finish the look.
const LOOK = { near: 420, turn: 0.32, nod: 0.25 };
// Each pupil looks at the pointer from where its eye is, all the way once it's `far` eye widths
// away, leaning toward his nose; pointed at, they widen.
const PUPILS = { far: 2.5, nose: 0.28, interest: 0.1 };
// Where each pupil rests with nobody pointing, as drawn (scripts/build-brand.mjs), looking up: in
// shares of its eye's radii, across the page and up it.
const REST = [
  [-0.1, 0.5],
  [-0.35, 0.42],
];
// A glance that swings this far within this long brings a blink, now and then: a blink hides a
// change of gaze.
const GLANCE = { angle: 1.75, within: 400, chance: 0.7, rest: 1400 };
const BLINK = { close: 80, hold: 17, open: 180, lowerLag: 17, double: 0.125, every: [2600, 7200] };
// Pressed, his eyes squeeze into a happy arc (in shares of the eye): where its middle sits, how
// far its ends bend, its half thickness and half length; where the pupils sink, and how squeezed
// the eyes are when they're hidden outright.
const SMILE = { middle: 0.04, bend: 0.55, half: 0.1, width: 0.86, sink: 1.0, hidden: 0.6 };
// Let go, his body springs back at once, but the smile stays a beat longer (`hold` milliseconds),
// then his eyes open, gently (`open`, a spring that doesn't overshoot): a click is a moment of
// joy, not only for as long as the button is down.
const JOY = { hold: 650, open: [13, 1] };
// Let go, he hops: his springing back launches him up (`kick`, in his units a second), and he
// settles on a spring, dipping back behind the film a touch before he's still.
const HOP = { kick: 2.6, spring: [11, 0.45] };
// Clicked, a ripple runs through his fur from where the click landed: each spike flicks away from
// it (`kick`, radians a second, on the petting springs), `travel` seconds per radian round him
// later, less the further round it is (down to `far` of it opposite).
const RUFFLE = { kick: 9, travel: 0.06, far: 0.2 };
// Clicked again and again, each within `within` ms of the last, he gets giddy: from the second
// click he wiggles side to side (`shake`, radians a second, on a loose spring about his base), a
// little more each time up to the fifth, and smiles on up to `longer` ms more.
const TICKLE = { within: 500, shake: 2.2, most: 4, longer: 900, spring: [26, 0.22] };
// Petted for a while (`after` seconds of strokes, forgotten at `forget` times the pace), he's
// content: he leans into the hand (`lean` radians, his top toward it) and his eyes close into the
// smile's arcs, `bliss` of the way, on a slow spring. Half-closed lids read as bored.
const CONTENT = { after: 1.2, forget: 0.5, lean: 0.1, bliss: 0.85, spring: [6, 1] };
// The mouse gone from the window `after` ms, he looks about for it, a new place every `every` ms;
// when it's back, he's glad: a little hop (`hop`) and a quick smile (`smile` of one, for `hold`).
const MISSED = { after: 2500, every: 1300, hop: 1.6, smile: 0.8, hold: 420 };
// A pupil darting fast stretches along its way, as an animator draws a smear.
const SMEAR = { from: 2, span: 8, most: 0.35 };
// The drawing's eye edge wobbles up to 7.5% past its oval: the white is drawn that much bigger
// and cut back to the wobble. Only the front of it is drawn, beyond `cap` of its depth, as the
// rest lies inside his head.
const WOBBLE_GROW = 1.075;
const CAP = 0.15;
// At rest he breathes, 0.8% taller (and 0.4 of that wider) over 3.6 s, so he doesn't look frozen.
// Breathing is all that moves then, and so slowly it's drawn only 12 times a second.
const BREATH = { period: 3600, depth: 0.008, wide: 0.4, fps: 12 };
// A machine that can't keep up with him gets the drawing back: once the page has settled
// (`after` milliseconds), if most of the last `frames` frames drawn while he moved came more than
// `gap` milliseconds apart (under 20 a second).
const SLOW = { after: 3000, frames: 60, gap: 50 };
// The eyes are drawn this much nearer the camera than they are, on top of his body as a drawing
// has them, so no edge of his skin cuts into them; the stencil keeps them inside his outline.
const DRAWN_PULL = 0.4;
// His skin and spikes take the shadow this far round from its side (BRUSH_SHADE); the whites,
// further.
const REACH = { skin: 0.4, white: 0.55 };

// ---- His spikes ----
const STEP = (Math.PI * 2) / FUR.spikes;
// Points on his surface, enough that every slice of the outline has some near it.
const SAMPLES = 3000;
// The drawing strokes its outline 6 of 285 wide: half that on each side blunts the tips.
const STROKE = 3 / 285;
// A band under the spikes' bases, hidden by his body, filling between the zigzag and the skin.
const BAND = 0.12;
// Petting: a spike within `reach` (in his units) of the pointer bends the way it moves across it,
// all the way (`bend` radians) at `full` units a second, and springs back past straight.
const PET = { reach: 0.2, full: 2.5, bend: 0.8, spring: [22, 0.3] };

// ---- Numbers ----
const clamp = (x, low, high) => Math.min(high, Math.max(low, x));
const ramp = (x, from, to) => {
  const t = clamp((x - from) / (to - from), 0, 1);
  return t * t * (3 - 2 * t);
};
// The same seeded random as scripts/build-brand.mjs (Park–Miller).
const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const unit = (a) => {
  const length = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / length, a[1] / length, a[2] / length];
};
const mean = (values) => values.reduce((sum, v) => sum + v, 0) / values.length;
// 4×4 matrices, column by column, as WebGL takes them.
const M = {
  times(...matrices) {
    return matrices.reduce((a, b) => {
      const out = new Array(16);
      for (let c = 0; c < 4; c++)
        for (let r = 0; r < 4; r++)
          out[c * 4 + r] =
            a[r] * b[c * 4] +
            a[4 + r] * b[c * 4 + 1] +
            a[8 + r] * b[c * 4 + 2] +
            a[12 + r] * b[c * 4 + 3];
      return out;
    });
  },
  move: (x, y, z) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1],
  scale: (x, y, z) => [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1],
  aboutX(a) {
    const [c, s] = [Math.cos(a), Math.sin(a)];
    return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
  },
  aboutY(a) {
    const [c, s] = [Math.cos(a), Math.sin(a)];
    return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
  },
  aboutZ(a) {
    const [c, s] = [Math.cos(a), Math.sin(a)];
    return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  },
  axes: (x, y, z) => [...x, 0, ...y, 0, ...z, 0, 0, 0, 0, 1],
  column: (m, c) => [m[c * 4], m[c * 4 + 1], m[c * 4 + 2]],
  apply: (m, [x, y, z], w = 1) =>
    [0, 1, 2, 3].map((r) => m[r] * x + m[4 + r] * y + m[8 + r] * z + m[12 + r] * w),
  perspective(fov, near, far) {
    const f = 1 / Math.tan(fov / 2);
    const [a, b] = [(far + near) / (near - far), (2 * far * near) / (near - far)];
    return [f, 0, 0, 0, 0, f, 0, 0, 0, 0, a, -1, 0, 0, b, 0];
  },
  invert(a) {
    const [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] = a;
    const b00 = a00 * a11 - a01 * a10;
    const b01 = a00 * a12 - a02 * a10;
    const b02 = a00 * a13 - a03 * a10;
    const b03 = a01 * a12 - a02 * a11;
    const b04 = a01 * a13 - a03 * a11;
    const b05 = a02 * a13 - a03 * a12;
    const b06 = a20 * a31 - a21 * a30;
    const b07 = a20 * a32 - a22 * a30;
    const b08 = a20 * a33 - a23 * a30;
    const b09 = a21 * a32 - a22 * a31;
    const b10 = a21 * a33 - a23 * a31;
    const b11 = a22 * a33 - a23 * a32;
    const d = 1 / (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);
    return [
      (a11 * b11 - a12 * b10 + a13 * b09) * d,
      (a02 * b10 - a01 * b11 - a03 * b09) * d,
      (a31 * b05 - a32 * b04 + a33 * b03) * d,
      (a22 * b04 - a21 * b05 - a23 * b03) * d,
      (a12 * b08 - a10 * b11 - a13 * b07) * d,
      (a00 * b11 - a02 * b08 + a03 * b07) * d,
      (a32 * b02 - a30 * b05 - a33 * b01) * d,
      (a20 * b05 - a22 * b02 + a23 * b01) * d,
      (a10 * b10 - a11 * b08 + a13 * b06) * d,
      (a01 * b08 - a00 * b10 - a03 * b06) * d,
      (a30 * b04 - a31 * b02 + a33 * b00) * d,
      (a21 * b02 - a20 * b04 - a23 * b00) * d,
      (a11 * b07 - a10 * b09 - a12 * b06) * d,
      (a00 * b09 - a01 * b07 + a02 * b06) * d,
      (a31 * b01 - a30 * b03 - a32 * b00) * d,
      (a20 * b03 - a21 * b01 + a22 * b00) * d,
    ];
  },
  // The matrix that turns a model's normals into the camera's space.
  normals(modelView) {
    const i = M.invert(modelView);
    return [i[0], i[4], i[8], i[1], i[5], i[9], i[2], i[6], i[10]];
  },
};
// A colour as WebGL mixes it: linear, from the page's sRGB.
const linear = (hex) =>
  [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
const COLOURS = Object.fromEntries(
  Object.entries({ INK, LIT, SHADE, WHITE, WHITE_SHADE }).map(([name, hex]) => [name, linear(hex)]),
);
const mix = (from, to, t) => from.map((c, k) => c + (to[k] - c) * t);

// The camera, and where a point of him lands on the canvas, in his units from its middle, y up.
const VIEW = M.move(0, 0, -DISTANCE);
const PROJECTION = M.perspective(2 * Math.atan(SPAN / 2 / DISTANCE), 1, 40);
const SEEN = M.times(PROJECTION, VIEW);
const CAMERA = [0, 0, DISTANCE];
const onCanvas = (matrix, point) => {
  const [x, y, , w] = M.apply(matrix, point);
  return [((x / w) * SPAN) / 2, ((y / w) * SPAN) / 2];
};

// ---- His bun ----
const half = (y) =>
  y >= 0 ? [SHAPE.body.top, SHAPE.body.qTop] : [SHAPE.body.bottom, SHAPE.body.qBottom];
// How far his surface is from his middle along a unit direction.
function surfaceRadius([x, y, z]) {
  const [b, q] = half(y);
  const { x: a, depth: c } = SHAPE.body;
  return (Math.abs(x / a) ** q + Math.abs(y / b) ** q + Math.abs(z / c) ** q) ** (-1 / q);
}
function surfaceNormal([x, y, z]) {
  const [b, q] = half(y);
  const { x: a, depth: c } = SHAPE.body;
  const g = (v, s) => (Math.sign(v) * Math.abs(v / s) ** (q - 1)) / s;
  return unit([g(x, a), g(y, b), g(z, c)]);
}
// The drawing's outline without its lumps, `angle` clockwise from his top: the same superellipse
// as his body's middle.
function drawnOval(angle) {
  const [across, down] = [Math.abs(Math.sin(angle)), -Math.cos(angle)];
  const [b, q] = half(-down);
  return 1 / ((across / SHAPE.body.x) ** q + (Math.abs(down) / b) ** q) ** (1 / q);
}

// ---- His fur, as the drawing draws it ----
// furPath in scripts/build-brand.mjs, step for step, from its seed: each spike's length (18 to 64
// of 285, one in ten 30 to 60 longer, the crown's, within 0.22 rad of his top, 40 to 80 longer
// again, kept apart here as the crown belongs to his body), its tip (angle clockwise from his top,
// leaning up to 0.8 of a spike's width either way), mirrored left to right as the drawing is; and
// the outline's lumps, three slow waves 6 to 16 deep, made symmetric.
function drawnFur() {
  const rand = rng(FUR.seed);
  const waves = [1, 2, 3].map((k) => [k + 1, rand() * 6.28, (6 + rand() * 10) / 285]);
  const n = FUR.spikes;
  const spikes = [];
  for (let i = 0; i < n; i++) {
    const a = i * STEP - Math.PI / 2;
    const crowned = Math.abs(((a + Math.PI / 2 + Math.PI) % (Math.PI * 2)) - Math.PI) < 0.22;
    let len = 18 + rand() * 46;
    if (rand() < 0.1) len += 30 + rand() * 30;
    const crown = crowned ? 40 + rand() * 40 : 0;
    const tip = a + STEP / 2 + (rand() - 0.5) * STEP * 1.6 + Math.PI / 2;
    spikes.push({ len: len / 285, crown: crown / 285, tip });
  }
  for (let i = 0; i < n / 2; i++) {
    const mirrored = spikes[n - 1 - i];
    spikes[i] = { ...mirrored, tip: Math.PI * 2 - mirrored.tip };
  }
  const wave = (a) =>
    waves.reduce((sum, [k, phase, amp]) => sum + amp * Math.sin(k * a + phase), 0);
  // `down`, the angle from his top, either side: the drawing's edge(a) averages its lumps at a
  // and at its mirror, pi - a, with a = down - pi/2 (from its x axis, y down).
  const lump = (down) => (wave(down - Math.PI / 2) + wave(-down - Math.PI / 2)) / 2;
  return { spikes, lump };
}

// ---- His eyes ----
// Where an eye sits: on the front of the bun at (x, y), a little into it so it bulges, turned by
// its tilt about the surface's normal.
function eyeFrame(e) {
  const [b, q] = half(e.y);
  const { x: a, depth: c } = SHAPE.body;
  const z = c * Math.max(0, 1 - Math.abs(e.x / a) ** q - Math.abs(e.y / b) ** q) ** (1 / q);
  const surface = [e.x, e.y, z];
  const n = surfaceNormal(surface);
  const y = unit(add([0, 1, 0], n, -n[1]));
  const turn = M.times(M.axes(cross(y, n), y, n), M.aboutZ((e.tilt * Math.PI) / 180));
  return { position: add(surface, n, -0.08), turn };
}
// The drawing's hand-drawn wobble of an eye's edge (wobblePoints in scripts/build-brand.mjs), at
// angle `b` from the eye's own x axis, y up.
const wobbled = ([p1, p2], b) => 1 + 0.045 * Math.sin(-2 * b + p1) + 0.03 * Math.sin(-3 * b + p2);
// The edge of an eye's white as drawn here, in the eye's frame: cut to the wobble, on the front
// of the eyeball that's drawn.
function whiteEdge(e, wobble, b) {
  const r = Math.min(wobbled(wobble, b) / WOBBLE_GROW, Math.sqrt(1 - CAP * CAP));
  const grown = r * WOBBLE_GROW;
  return [grown * e.rx * Math.cos(b), grown * e.ry * Math.sin(b), Math.sqrt(1 - r * r) * e.depth];
}
// A pupil `r` across on the eyeball at (u, v), in shares of the eye's radii, in the eye's frame:
// lying on it, and darting (its speed in shares a second), stretched along its way.
function pupilAt(e, [u, v], r, [du, dv] = [0, 0]) {
  const w = Math.sqrt(Math.max(0, 1 - u * u - v * v));
  const normal = unit([u / e.rx, v / e.ry, w / e.depth]);
  const at = add([u * e.rx, v * e.ry, w * e.depth], normal, 0.004);
  let dart = [du * e.rx, dv * e.ry, 0];
  dart = add(dart, normal, -dot(dart, normal));
  const speed = Math.hypot(...dart) / (2 * e.rx);
  const smear = 1 + SMEAR.most * clamp((speed - SMEAR.from) / SMEAR.span, 0, 1);
  dart = speed > 1e-6 ? unit(dart) : unit(add([1, 0, 0], normal, -normal[0]));
  return M.times(
    M.move(...at),
    M.axes(dart, cross(normal, dart), normal),
    M.scale(r * smear, r / smear, e.pupil * 0.22),
  );
}
// His eyes, fitted to the drawing at rest. The drawing is flat; in perspective, eyes nearer the
// camera than his outline would look bigger and further apart than drawn, and each, facing a
// little sideways on his round head, narrower the way it faces off. So each eye's white is placed
// and sized until its edge, as the camera sees it, lies where the drawing's does, and each pupil
// until it's where the drawing has it, as big.
const EYES = SHAPE.eyes.map((drawn, i) => {
  const rand = rng(drawn.seed);
  const wobble = [rand() * 6.28, rand() * 6.28];
  const t = (drawn.tilt * Math.PI) / 180;
  const across = [Math.cos(t), Math.sin(t)];
  const up = [-Math.sin(t), Math.cos(t)];
  const angles = Array.from({ length: 48 }, (_, k) => (k / 48) * Math.PI * 2);
  const middle = (points) => [0, 1].map((k) => mean(points.map((p) => p[k])));
  const spread = (points, [mx, my], [ax, ay]) =>
    Math.sqrt(mean(points.map(([x, y]) => ((x - mx) * ax + (y - my) * ay) ** 2)));
  const want = angles.map((b) => {
    const k = wobbled(wobble, b);
    const [lx, ly] = [drawn.rx * k * Math.cos(b), drawn.ry * k * Math.sin(b)];
    return [drawn.x + lx * across[0] + ly * up[0], drawn.y + lx * across[1] + ly * up[1]];
  });
  const wanted = middle(want);
  const e = { ...drawn };
  const frameOf = () => {
    const { position, turn } = eyeFrame(e);
    return M.times(SEEN, M.move(...position), turn);
  };
  for (let k = 0; k < 8; k++) {
    const seen = angles.map((b) => onCanvas(frameOf(), whiteEdge(e, wobble, b)));
    const got = middle(seen);
    e.x += wanted[0] - got[0];
    e.y += wanted[1] - got[1];
    e.rx *= spread(want, wanted, across) / spread(seen, got, across);
    e.ry *= spread(want, wanted, up) / spread(seen, got, up);
  }
  const pupilWanted = [drawn.x + REST[i][0] * drawn.rx, drawn.y + REST[i][1] * drawn.ry];
  let rest = [0, 0];
  for (let k = 0; k < 8; k++) {
    const pupil = M.times(frameOf(), pupilAt(e, rest, e.pupil));
    const rim = angles.map((b) => onCanvas(pupil, [Math.cos(b), Math.sin(b), 0]));
    const [gx, gy] = middle(rim);
    const [dx, dy] = [pupilWanted[0] - gx, pupilWanted[1] - gy];
    rest = [
      rest[0] + (dx * across[0] + dy * across[1]) / e.rx,
      rest[1] + (dx * up[0] + dy * up[1]) / e.ry,
    ];
    e.pupil *= drawn.pupil / mean(rim.map(([x, y]) => Math.hypot(x - gx, y - gy)));
  }
  return { ...e, wobble, rest };
});

// ---- Meshes ----
// A sphere, as rings of points from its top down, with its triangles facing out.
function sphere(around, down) {
  const position = [];
  const index = [];
  for (let iy = 0; iy <= down; iy++) {
    const v = iy / down;
    for (let ix = 0; ix <= around; ix++) {
      const u = ix / around;
      position.push(
        -Math.cos(u * 2 * Math.PI) * Math.sin(v * Math.PI),
        Math.cos(v * Math.PI),
        Math.sin(u * 2 * Math.PI) * Math.sin(v * Math.PI),
      );
    }
  }
  const at = (ix, iy) => iy * (around + 1) + ix;
  for (let iy = 0; iy < down; iy++)
    for (let ix = 0; ix < around; ix++) {
      const [a, b, c, d] = [at(ix + 1, iy), at(ix, iy), at(ix, iy + 1), at(ix + 1, iy + 1)];
      if (iy !== 0) index.push(a, b, d);
      if (iy !== down - 1) index.push(b, c, d);
    }
  return { position: new Float32Array(position), index: new Uint16Array(index) };
}
// The bun: a sphere pushed out to his surface, with the skin pressed in under each eye (sockets),
// so his curve never cuts into the white.
function bun() {
  const geometry = sphere(96, 64);
  const p = geometry.position;
  const eyes = EYES.map((e) => ({ e, ...eyeFrame(e) }));
  for (let i = 0; i < p.length; i += 3) {
    let at = [p[i], p[i + 1], p[i + 2]];
    at = at.map((c) => c * surfaceRadius(at));
    const rho = Math.min(
      ...eyes.map(({ e, position, turn }) => {
        const d = add(at, position, -1);
        const l = [0, 1, 2].map((k) => dot(M.column(turn, k), d));
        return l[2] > -0.25 ? Math.hypot(l[0] / e.rx, l[1] / e.ry) : Infinity;
      }),
    );
    const depth = 0.2 * (1 - ramp(rho, 0.8, 1.06));
    const shrink = depth > 0 ? 1 - depth / Math.hypot(...at) : 1;
    for (let k = 0; k < 3; k++) p[i + k] = at[k] * shrink;
  }
  return geometry;
}

// ---- Shaders ----
// The painted shadow, designed rather than lit: one crescent on the side away from the light, its
// edge wobbling as a brush's does (`brushWobble`, the same on the CPU for the spikes).
const brushWobble = (x, y, z) =>
  0.07 * Math.sin(7 * x + 5 * y + 3 * z) + 0.04 * Math.sin(-4 * x + 11 * y + 6 * z);
const SHARED = /* glsl */ `
  float brushShade(vec3 N, vec3 dir, float reach) {
    float wobble = 0.07 * sin(dot(N, vec3(7.0, 5.0, 3.0))) + 0.04 * sin(dot(N, vec3(-4.0, 11.0, 6.0)));
    float d = dot(N, dir) - reach + wobble;
    return clamp(0.5 + d / max(fwidth(d), 1e-4), 0.0, 1.0);
  }
  vec3 toPage(vec3 c) {
    return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
  }
`;
// The opening an eye's lids leave, as the 2D companion's `aperture` draws it: `p` in shares of the
// eye's radii along his face, y up; `lids` the upper lid's fall, the lower's rise, and the
// squeeze into a happy arc; `ratio` the eye's height over its width. Returns how much of the pixel
// is inside, for alpha to coverage; an opening thinner than a pixel covers only that much, so shut
// lids leave no seam.
const OPENING = /* glsl */ `
  float opening(vec2 p, vec3 lids, float ratio) {
    float x = p.x;
    float y = -p.y;
    float blink = lids.x;
    float rise = lids.y;
    float squeeze = lids.z;
    float lowerMiddle = 1.25 + (0.2 - 1.25) * 0.3 * rise;
    float lowerCurve = -0.15;
    float upperMiddle = -1.3 + (lowerMiddle + 1.3) * blink;
    float upperCurve = 0.32 + (lowerCurve - 0.32) * blink * blink;
    float lead = 1.0 - (1.0 - squeeze) * (1.0 - squeeze);
    float follow = pow(squeeze, 1.3);
    float span = mix(1.25, ${SMILE.width.toFixed(2)}, squeeze * squeeze);
    float u = clamp(x / span, -1.0, 1.0);
    float end = min(1.0, ${SMILE.half.toFixed(2)} * ratio / ${SMILE.width.toFixed(2)});
    float along = max(0.0, (abs(u) - (1.0 - end)) / end);
    float thick = ${SMILE.half.toFixed(2)} * sqrt(max(0.0, 1.0 - along * along));
    float middle = ${SMILE.middle.toFixed(2)} + ${SMILE.bend.toFixed(2)} * u * u;
    float upper = mix(upperMiddle + upperCurve * u * u, middle - thick, follow);
    float lower = mix(lowerMiddle + lowerCurve * u * u, middle + thick, lead);
    float inY = min(y - upper, lower - y) / max(fwidth(y), 1e-5);
    float inX = (span - abs(x)) / max(fwidth(x), 1e-5);
    float open = clamp((lower - upper) / max(fwidth(y), 1e-5), 0.0, 1.0);
    return min(open, clamp(min(inX, inY) + 0.5, 0.0, 1.0));
  }
`;
// His skin (ROUND: shaded by his plain rounded form, so the sockets don't put lumps in the
// shadow's edge) and each part of an eye: the white (CAP, only its front, as the rest lies inside
// his head; WOBBLE, the drawing's hand-drawn edge) and the pupil, both only inside the opening
// their lids leave (LIDS) and pulled in front of the skin.
const PAINTED_VERTEX = /* glsl */ `
  in vec3 position;
  uniform mat4 uModel;
  uniform mat4 uView;
  uniform mat4 uProjection;
  uniform mat3 uNormals;
  uniform mat4 uFace;
  uniform vec4 uAxes;
  uniform float uPull;
  uniform float uGrow;
  out vec3 vNormal;
  out float vDepth;
  out vec2 vFace;
  out vec2 vTilted;
  void main() {
    vDepth = position.z;
    vFace = (uFace * uModel * vec4(position, 1.0)).xy;
    vTilted = position.xy * uGrow;
    #ifdef ROUND
      vec3 axes = vec3(uAxes.x, position.y > 0.0 ? uAxes.y : uAxes.z, uAxes.w);
      vNormal = normalize(uNormals * (position / (axes * axes)));
    #else
      vNormal = normalize(uNormals * position);
    #endif
    vec4 seen = uView * uModel * vec4(position, 1.0);
    gl_Position = uProjection * seen;
    // Drawn nearer than it is, all the way unless it's turned right away from the camera.
    float facing = normalize(uNormals * vec3(0.0, 0.0, 1.0)).z;
    vec4 nearer = uProjection * (seen + vec4(0.0, 0.0, uPull * smoothstep(0.0, 0.12, facing), 0.0));
    gl_Position.z = nearer.z / nearer.w * gl_Position.w;
  }
`;
const PAINTED_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform vec3 uLit;
  uniform vec3 uShade;
  uniform float uEdge;
  uniform vec3 uShadowView;
  uniform float uCap;
  uniform vec3 uLids;
  uniform float uRatio;
  uniform vec2 uWobble;
  in vec3 vNormal;
  in float vDepth;
  in vec2 vFace;
  in vec2 vTilted;
  out vec4 color;
  ${SHARED}
  ${OPENING}
  void main() {
    #ifdef CAP
      if (vDepth < uCap) discard;
    #endif
    float cover = 1.0;
    #ifdef LIDS
      cover = min(cover, opening(vFace, uLids, uRatio));
    #endif
    #ifdef WOBBLE
      // The drawing's eye: an oval whose radius wobbles with its angle (wobblePoints in
      // scripts/build-brand.mjs, whose y points down).
      float a = atan(-vTilted.y, vTilted.x);
      float out_ = length(vTilted) - (1.0 + 0.045 * sin(2.0 * a + uWobble.x) + 0.03 * sin(3.0 * a + uWobble.y));
      cover = min(cover, clamp(0.5 - out_ / max(fwidth(out_), 1e-5), 0.0, 1.0));
    #endif
    if (cover <= 0.0) discard;
    float shade = brushShade(normalize(vNormal), uShadowView, uEdge);
    color = vec4(toPage(mix(uLit, uShade, shade)), cover);
  }
`;
// The spikes, already on screen: x and y in clip space, z at the depth of a point a little behind
// his middle, so his body hides their bases.
const SPIKES_VERTEX = /* glsl */ `
  in vec3 position;
  in vec3 tone;
  out vec3 vTone;
  void main() {
    vTone = tone;
    gl_Position = vec4(position, 1.0);
  }
`;
const SPIKES_FRAGMENT = /* glsl */ `
  precision highp float;
  in vec3 vTone;
  out vec4 color;
  ${SHARED}
  void main() {
    color = vec4(toPage(vTone), 1.0);
  }
`;

// ---- The stage ----
// Brings the companion drawn in `host` to life in 3D, drawn over the drawing (which it hides once
// it's drawn), `look`ing where the drawing is; `onStop` is called if he gives the drawing back.
// Returns null where WebGL 2 doesn't run.
export function companion3d(host, { look = null, onStop } = {}) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  // Transparent, over the page: the eyes' soft edges are alpha to coverage, which writes their
  // coverage into the alpha channel too, so they're drawn with alpha masked off, leaving his
  // body's 1 under them. A stencil, for the eyes to keep inside his body.
  const gl = canvas.getContext('webgl2', {
    antialias: true,
    stencil: true,
    alpha: true,
    premultipliedAlpha: true,
    powerPreference: 'low-power',
  });
  if (!gl) return null;

  const compile = (vertex, fragment, defines = []) => {
    const head = `#version 300 es\n${defines.map((d) => `#define ${d}\n`).join('')}`;
    const program = gl.createProgram();
    for (const [type, source] of [
      [gl.VERTEX_SHADER, vertex],
      [gl.FRAGMENT_SHADER, fragment],
    ]) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, head + source);
      gl.compileShader(shader);
      gl.attachShader(program, shader);
    }
    gl.bindAttribLocation(program, 0, 'position');
    gl.bindAttribLocation(program, 1, 'tone');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(program));
    const places = new Map();
    const place = (name) => {
      if (!places.has(name)) places.set(name, gl.getUniformLocation(program, name));
      return places.get(name);
    };
    return {
      use(uniforms) {
        gl.useProgram(program);
        for (const [name, value] of Object.entries(uniforms)) {
          const at = place(name);
          if (typeof value === 'number') gl.uniform1f(at, value);
          else if (value.length === 16) gl.uniformMatrix4fv(at, false, value);
          else if (value.length === 9) gl.uniformMatrix3fv(at, false, value);
          else gl[`uniform${value.length}fv`](at, value);
        }
      },
    };
  };
  const shaders = {
    skin: compile(PAINTED_VERTEX, PAINTED_FRAGMENT, ['ROUND']),
    white: compile(PAINTED_VERTEX, PAINTED_FRAGMENT, ['CAP', 'LIDS', 'WOBBLE']),
    pupil: compile(PAINTED_VERTEX, PAINTED_FRAGMENT, ['LIDS']),
    spikes: compile(SPIKES_VERTEX, SPIKES_FRAGMENT),
  };
  const mesh = ({ position, index, tone }, usage = gl.STATIC_DRAW) => {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buffers = [position, tone].map((data, at) => {
      if (!data) return null;
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, usage);
      gl.enableVertexAttribArray(at);
      gl.vertexAttribPointer(at, 3, gl.FLOAT, false, 0, 0);
      return buffer;
    });
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, index, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    return {
      update(position, tone) {
        for (const [data, buffer] of [
          [position, buffers[0]],
          [tone, buffers[1]],
        ]) {
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
        }
      },
      draw() {
        gl.bindVertexArray(vao);
        gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
      },
    };
  };
  const axes = [SHAPE.body.x, SHAPE.body.top, SHAPE.body.bottom, SHAPE.body.depth];

  // His springs, and his eyes.
  const Spring = ([omega, zeta]) => ({ x: 0, v: 0, target: 0, omega, zeta });
  const tune = (s, [omega, zeta]) => Object.assign(s, { omega, zeta });
  const step = (s, dt) => {
    s.v += (-(s.omega ** 2) * (s.x - s.target) - 2 * s.zeta * s.omega * s.v) * dt;
    s.x += s.v * dt;
  };
  const resting = (s) => Math.abs(s.x - s.target) < 1e-3 && Math.abs(s.v) < 1e-3 * s.omega;
  const eyes = EYES.map((e) => {
    const gaze = [Spring(SPRINGS.gaze), Spring(SPRINGS.gaze)];
    [gaze[0].x, gaze[1].x] = e.rest;
    // The room a pupil `r` across has to move in, as shares of the eye, with a rim of white.
    const margin = 9.6 / 285;
    const room = (r) => [
      Math.max(0, (e.rx * 0.93 - r - margin) / e.rx),
      Math.max(0, (e.ry * 0.93 - r - margin) / e.ry),
    ];
    return {
      e,
      ...eyeFrame(e),
      tilt: M.aboutZ((-e.tilt * Math.PI) / 180),
      gaze,
      room,
      r: e.pupil,
    };
  });
  const turn = [Spring(SPRINGS.turn), Spring(SPRINGS.turn)];
  const squash = Spring(SPRINGS.press);
  const face = Spring(SPRINGS.face);
  const interest = Spring(SPRINGS.interest);
  const joy = Spring(SPRINGS.press);
  const hop = Spring(HOP.spring);
  // His lean, side to side about his base: into a petting hand, and wiggling when tickled.
  const tilt = Spring(TICKLE.spring);
  const content = Spring(CONTENT.spring);
  // Pointed at already, as the drawing knows.
  interest.x = interest.target = host.matches(':hover') ? 1 : 0;
  const springs = [
    ...turn,
    squash,
    face,
    interest,
    joy,
    hop,
    tilt,
    content,
    ...eyes.flatMap((eye) => eye.gaze),
  ];
  const body = mesh(bun());
  const ball = mesh(sphere(48, 32));
  const spikes = outline();
  const fur = mesh(spikes, gl.DYNAMIC_DRAW);

  // Where he looks: the mouse, or a point the page gives him (until the mouse next moves).
  let pointer = look;
  let seen = null;
  let glance = null;
  let blinks = [];
  let lastBlink = -Infinity;
  let pressedAt = 0;
  let releaseTimer = 0;
  let joyTimer = 0;
  // The ripple through his fur: where the click landed on the page, how long ago, and which
  // spikes it has reached.
  let ruffle = null;
  // Tickling: when the last click was, and how many came close together.
  let lastPress = -Infinity;
  let giggles = 0;
  // Petting: how long he's been stroked lately (seconds), and whether he is this frame.
  let petted = 0;
  let stroking = false;
  // The mouse gone from the window: since when, the timer for his looking about, and whether
  // he's looking for it.
  let missing = 0;
  let searching = false;
  const listening = new AbortController();
  const { signal } = listening;

  function blink(now = performance.now()) {
    if (pressedAt || joy.target || content.target || now - lastBlink < 200) return;
    lastBlink = now;
    blinks.push(now);
    if (Math.random() < BLINK.double)
      blinks.push(now + BLINK.close + BLINK.hold + BLINK.open * 0.45);
    wake();
  }
  const shut = (t) => {
    const { close, hold, open } = BLINK;
    if (t < 0 || t > close + hold + open) return 0;
    if (t < close) return (t / close) ** 2 * (3 - (2 * t) / close);
    if (t < close + hold) return 1;
    return (1 - (t - close - hold) / open) ** 3;
  };
  let blinkTimer = 0;
  (function blinkNow() {
    const [least, most] = BLINK.every;
    blinkTimer = setTimeout(
      () => {
        if (!document.hidden && visible) blink();
        blinkNow();
      },
      least + Math.random() * (most - least),
    );
  })();

  // Pressed, he gives at once and smiles; let go, he springs back past his shape, and smiles on a
  // moment (JOY). A quick click still gets a full squash: the release waits until he's had time to
  // give.
  const press = () => {
    clearTimeout(releaseTimer);
    clearTimeout(joyTimer);
    pressedAt = performance.now();
    giggles = pressedAt - lastPress < TICKLE.within ? giggles + 1 : 0;
    lastPress = pressedAt;
    if (giggles) tilt.v += (giggles % 2 ? 1 : -1) * TICKLE.shake * Math.min(giggles, TICKLE.most);
    blinks = [];
    tune(squash, SPRINGS.press);
    tune(joy, SPRINGS.press);
    squash.target = joy.target = 1;
    wake();
  };
  const ruffled = (event) => {
    ruffle = { x: event.clientX, y: event.clientY, age: 0, reached: new Uint8Array(FUR.spikes) };
  };
  const smiled = () => {
    tune(joy, JOY.open);
    joy.target = 0;
    wake();
  };
  const release = () => {
    if (!pressedAt) return;
    const wait = Math.max(0, pressedAt + 90 - performance.now());
    pressedAt = 0;
    releaseTimer = setTimeout(() => {
      tune(squash, SPRINGS.release);
      squash.target = 0;
      hop.v += HOP.kick;
      wake();
      joyTimer = setTimeout(
        smiled,
        JOY.hold + (TICKLE.longer * Math.min(giggles, TICKLE.most)) / TICKLE.most,
      );
    }, wait);
  };
  host.addEventListener(
    'pointerdown',
    (event) => {
      if (event.button !== 0) return;
      press();
      ruffled(event);
    },
    { signal },
  );
  document.addEventListener('pointerup', release, { capture: true, signal });
  document.addEventListener('pointercancel', release, { capture: true, signal });
  host.addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      press();
      release();
    },
    { signal },
  );
  for (const [type, target] of [
    ['pointerenter', 1],
    ['pointerleave', 0],
  ])
    host.addEventListener(
      type,
      () => {
        interest.target = target;
        wake();
      },
      { signal },
    );
  document.addEventListener(
    'mousemove',
    (event) => {
      pointer = { x: event.clientX, y: event.clientY };
      if (searching) glad();
      clearTimeout(missing);
      missing = 0;
      wake();
    },
    { passive: true, signal },
  );
  // The mouse gone from the window: a while later, he looks about for it, here and there round
  // him, until it's back.
  const search = (k = 0) => {
    searching = true;
    const rect = canvas.getBoundingClientRect();
    const [mx, my] = [rect.left + rect.width / 2, rect.top + rect.height / 2];
    const side = k % 2 ? 1 : -1;
    pointer = { x: mx + side * (260 + 120 * Math.random()), y: my - 160 + 220 * Math.random() };
    wake();
    missing = setTimeout(() => search(k + 1), MISSED.every);
  };
  document.addEventListener(
    'pointerout',
    (event) => {
      if (event.pointerType !== 'mouse' || event.relatedTarget || searching) return;
      clearTimeout(missing);
      missing = setTimeout(search, MISSED.after);
    },
    { signal },
  );
  // And back: glad to see it.
  const glad = () => {
    searching = false;
    if (pressedAt) return;
    clearTimeout(joyTimer);
    tune(joy, SPRINGS.press);
    joy.target = MISSED.smile;
    hop.v += MISSED.hop;
    joyTimer = setTimeout(smiled, MISSED.hold);
  };
  // The hand that pets him: any pointer, a finger included, and how fast it goes.
  const hand = { x: null, y: null, was: null, vx: 0, vy: 0 };
  addEventListener(
    'pointermove',
    (event) => {
      Object.assign(hand, { x: event.clientX, y: event.clientY });
      wake();
    },
    { passive: true, signal },
  );
  const lifted = (event) => {
    if (event.pointerType !== 'mouse') hand.x = hand.y = null;
  };
  addEventListener('pointerup', lifted, { signal });
  addEventListener('pointercancel', lifted, { signal });
  document.documentElement.addEventListener('pointerleave', () => (hand.x = hand.y = null), {
    signal,
  });

  // Drawn only while something moves, and not at all off screen or in a hidden tab.
  let visible = false;
  let alive = true;
  let frame = 0;
  let breathing = 0;
  let last = 0;
  let born = 0;
  let chained = false;
  const gaps = [];
  function wake() {
    if (!alive || frame || !visible || document.hidden) return;
    clearTimeout(breathing);
    breathing = 0;
    frame = requestAnimationFrame(tick);
  }
  function tick(now) {
    frame = 0;
    // Not laid out yet: the ResizeObserver wakes him once he is.
    if (!canvas.width || !canvas.height) return;
    if (chained && now - born > SLOW.after) {
      gaps.push(now - last);
      if (gaps.length > SLOW.frames) gaps.shift();
      const sorted = [...gaps].sort((a, b) => a - b);
      if (gaps.length === SLOW.frames && sorted[SLOW.frames >> 1] > SLOW.gap) return stop();
    }
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    born ||= now;
    const moving = draw(dt, now);
    // Swapped for the drawing in the frame he's first drawn in, so nothing shows in between.
    if (!host.classList.contains('real')) host.classList.add('real');
    chained = moving;
    if (moving) wake();
    else breathing = setTimeout(wake, 1000 / BREATH.fps);
  }
  const watch = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    wake();
  });
  watch.observe(host);
  document.addEventListener('visibilitychange', wake, { signal });

  const size = () => {
    const { width, height } = canvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio, 3);
    [canvas.width, canvas.height] = [Math.round(width * ratio), Math.round(height * ratio)];
    wake();
  };
  // Resized, zoomed or moved to a screen with more pixels or fewer: the device-pixel box sees all
  // three where it's supported (not in Safari), and the resolution query the last everywhere.
  const sizing = new ResizeObserver(() => size());
  try {
    sizing.observe(canvas, { box: 'device-pixel-content-box' });
  } catch {
    sizing.observe(canvas);
  }
  (function onRatio() {
    matchMedia(`(resolution: ${devicePixelRatio}dppx)`).addEventListener(
      'change',
      () => {
        size();
        if (alive) onRatio();
      },
      { once: true, signal },
    );
  })();

  // Where each part of him is, from his springs: his body squashes from its base, breathes (from
  // the moment he's first drawn, so he starts as the drawing is), and turns about his middle; his
  // face rides in it.
  function pose(now, upper) {
    const s = squash.x;
    const breath = BREATH.depth * Math.sin(((now - born) / BREATH.period) * Math.PI * 2);
    const wide = (1 + SQUASH.x * s) * (1 + BREATH.wide * breath);
    const tall = (1 - SQUASH.y * s - FACE.dip * upper) * (1 + breath);
    const base = SHAPE.body.bottom;
    const turned = M.times(M.aboutX(turn[1].x), M.aboutY(turn[0].x));
    const world = M.times(
      M.move(0, hop.x - base, 0),
      M.aboutZ(tilt.x),
      M.scale(wide, tall, wide),
      M.move(0, base, 0),
      turned,
    );
    const widen = 1 + FACE.widen * Math.max(0, -s);
    const drop = (face.x - s) * FACE.lag + FACE.blink * upper;
    const frames = eyes.map(({ position, turn: r }) =>
      M.times(
        world,
        M.move(position[0], position[1] - drop, position[2]),
        r,
        M.scale(widen, widen, widen),
      ),
    );
    return { world, turned, frames };
  }
  const onPage = (rect, matrix, point) => {
    const [x, y, , w] = M.apply(M.times(SEEN, matrix), point);
    return [rect.left + ((x / w + 1) / 2) * rect.width, rect.top + ((1 - y / w) / 2) * rect.height];
  };

  function draw(dt, now) {
    const rect = canvas.getBoundingClientRect();
    const [mx, my] = [rect.left + rect.width / 2, rect.top + rect.height / 2];
    const pointing = pointer != null;
    const dx = pointing ? pointer.x - mx : 0;
    const dy = pointing ? pointer.y - my : 0;
    turn[0].target = pointing ? Math.atan(dx / LOOK.near) * LOOK.turn : 0;
    turn[1].target = pointing ? Math.atan(dy / LOOK.near) * LOOK.nod : 0;
    // A big swing of where the pointer is, seen from him, brings a blink.
    if (pointing && (pointer.x !== seen?.x || pointer.y !== seen?.y)) {
      seen = { ...pointer };
      const angle = Math.atan2(dy, dx);
      if (!glance || now - glance.at > GLANCE.within) glance = { angle, at: now };
      else if (
        Math.abs(Math.atan2(Math.sin(angle - glance.angle), Math.cos(angle - glance.angle))) >=
        GLANCE.angle
      ) {
        glance = { angle, at: now };
        if (now - lastBlink > GLANCE.rest && Math.random() < GLANCE.chance) blink(now);
      }
    }
    // Blinks: the upper lids, and the lower ones rising to meet them a moment behind.
    blinks = blinks.filter(
      (start) => now - start <= BLINK.close + BLINK.hold + BLINK.open + BLINK.lowerLag,
    );
    const upper = Math.max(0, ...blinks.map((start) => shut(now - start)));
    const lower = Math.max(0, ...blinks.map((start) => shut(now - start - BLINK.lowerLag)));
    // Petted long enough, he's content, and leans into the hand; left alone, he forgets it.
    petted = stroking
      ? Math.min(petted + dt, CONTENT.after + 0.5)
      : Math.max(0, petted - dt * CONTENT.forget);
    if (petted >= CONTENT.after) content.target = 1;
    else if (!petted) content.target = 0;
    const handSide = hand.x == null ? 0 : Math.sign(hand.x - mx);
    tilt.target = -handSide * CONTENT.lean * content.x;

    // Each pupil looks at the pointer from where its eye is on the page, worked out along the
    // eye's own axes as they lie on the page (its tilt, and his turn).
    const before = pose(now, upper);
    const widen = 1 + PUPILS.interest * interest.x;
    for (const [i, eye] of eyes.entries()) {
      eye.r = eye.e.pupil * widen;
      const [roomX, roomY] = eye.room(eye.r);
      let [u, v] = eye.e.rest;
      if (pointing) {
        const frame = before.frames[i];
        const [ex, ey] = onPage(rect, frame, [0, 0, 0]);
        const [xx, xy] = onPage(rect, frame, [eye.e.rx, 0, 0]);
        const [yx, yy] = onPage(rect, frame, [0, eye.e.ry, 0]);
        const [ax, ay, bx, by] = [xx - ex, xy - ey, yx - ex, yy - ey];
        const [px, py] = [pointer.x - ex, pointer.y - ey];
        const away = Math.hypot(px, py) || 1;
        const reach = Math.min(
          1,
          away / (Math.max(Math.hypot(ax, ay), Math.hypot(bx, by)) * PUPILS.far),
        );
        const side = i === 0 ? 1 : -1;
        const [tx, ty] = [(px / away) * reach + side * PUPILS.nose, (py / away) * reach];
        const [la, lb] = [Math.hypot(ax, ay) || 1, Math.hypot(bx, by) || 1];
        const [lax, lay, lbx, lby] = [ax / la, ay / la, bx / lb, by / lb];
        const det = lax * lby - lay * lbx || 1;
        [u, v] = [(tx * lby - ty * lbx) / det, (lax * ty - lay * tx) / det];
        const length = Math.hypot(u, v);
        if (length > 1) [u, v] = [u / length, v / length];
        [u, v] = [u * roomX, v * roomY];
      }
      [eye.gaze[0].target, eye.gaze[1].target] = [u, v];
    }
    // His first frame takes up the drawing's pose: his pupils where it has them, his body not yet
    // turned, so he turns to look from there.
    if (now === born)
      for (const s of eyes.flatMap((eye) => eye.gaze)) Object.assign(s, { x: s.target, v: 0 });
    for (let t = 0; t < dt; t += 1 / 240) {
      face.target = squash.x;
      for (const s of springs) step(s, Math.min(1 / 240, dt - t));
    }
    for (const s of springs) if (resting(s)) Object.assign(s, { x: s.target, v: 0 });

    const { world, turned, frames } = pose(now, upper);
    const squeeze = clamp(Math.max(joy.x, CONTENT.bliss * content.x), 0, 1);
    // The painted shadow: below and to the left, leaning away from the mouse's side; and his
    // tones, from the drawing's flat ink to his two once the light has come on.
    const lean = pointing ? [Math.tanh(dx / 500), -Math.tanh(dy / 500)] : [0.3, 0.4];
    const shadow = unit([-0.5 - 0.25 * lean[0], -0.75 - 0.25 * lean[1], 0]);
    const light = ramp(now - born, LIGHT.after, LIGHT.after + LIGHT.over);
    const tones = {
      lit: mix(COLOURS.INK, COLOURS.LIT, light),
      shade: mix(COLOURS.INK, COLOURS.SHADE, light),
    };

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clearStencil(0);
    gl.colorMask(true, true, true, true);
    gl.depthMask(true);
    gl.stencilMask(0xff);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.STENCIL_TEST);
    const common = { uView: VIEW, uProjection: PROJECTION, uShadowView: shadow, uAxes: axes };

    // His skin, marking where his body is in the stencil.
    gl.enable(gl.CULL_FACE);
    gl.disable(gl.SAMPLE_ALPHA_TO_COVERAGE);
    gl.stencilFunc(gl.ALWAYS, 1, 0xff);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
    shaders.skin.use({
      ...common,
      uModel: world,
      uNormals: M.normals(M.times(VIEW, world)),
      uFace: M.scale(1, 1, 1),
      uLit: tones.lit,
      uShade: tones.shade,
      uEdge: REACH.skin,
      uPull: 0,
      uGrow: 1,
    });
    body.draw();

    // His spikes, along his outline.
    gl.disable(gl.CULL_FACE);
    gl.stencilMask(0);
    const petting = spikes.lay({ world, turned, rect, dt, shadow, tones });
    fur.update(spikes.position, spikes.tone);
    shaders.spikes.use({});
    fur.draw();

    // His eyes, only where his body is, with alpha left as his body's.
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);
    gl.colorMask(true, true, true, false);
    gl.stencilFunc(gl.EQUAL, 1, 0xff);
    for (const [i, eye] of eyes.entries()) {
      const { rx, ry, depth } = eye.e;
      const frame = frames[i];
      const lids = {
        uFace: M.times(M.scale(1 / rx, 1 / ry, 1), M.invert(M.times(frame, eye.tilt))),
        uLids: [upper, lower, squeeze],
        uRatio: ry / rx,
        uPull: DRAWN_PULL,
      };
      const white = M.times(frame, M.scale(rx * WOBBLE_GROW, ry * WOBBLE_GROW, depth));
      shaders.white.use({
        ...common,
        ...lids,
        uModel: white,
        uNormals: M.normals(M.times(VIEW, white)),
        uLit: COLOURS.WHITE,
        uShade: mix(COLOURS.WHITE, COLOURS.WHITE_SHADE, light),
        uEdge: REACH.white,
        uCap: CAP,
        uWobble: eye.e.wobble,
        uGrow: WOBBLE_GROW,
      });
      ball.draw();
      // The pupil dips as the lids close, as eyes roll down in a blink, kept inside its room;
      // squeezed, it sinks below the arc, and is hidden once the lid has it.
      if (squeeze > SMILE.hidden) continue;
      let [u, v] = [eye.gaze[0].x, eye.gaze[1].x - 0.25 * upper];
      // Kept inside its room, which reaches as far as where the drawing rests it, a hair past the
      // room it has for one eye.
      const [roomX, roomY] = eye.room(eye.r);
      const out = (x, y) => Math.hypot(x / (roomX || 1), y / (roomY || 1));
      const most = Math.max(1, out(...eye.e.rest));
      const at = out(u, v);
      if (at > most) [u, v] = [(u * most) / at, (v * most) / at];
      const under = 1 - (1 - squeeze) ** 2;
      [u, v] = [u * (1 - under), v + (-SMILE.sink - v) * under];
      const pupil = M.times(frame, pupilAt(eye.e, [u, v], eye.r, [eye.gaze[0].v, eye.gaze[1].v]));
      shaders.pupil.use({
        ...common,
        ...lids,
        uModel: pupil,
        uNormals: M.normals(M.times(VIEW, pupil)),
        uLit: COLOURS.INK,
        uShade: COLOURS.INK,
        uEdge: 0,
        uGrow: 1,
      });
      ball.draw();
    }
    gl.colorMask(true, true, true, true);

    return (
      Boolean(blinks.length) ||
      petting ||
      petted > 0 ||
      light < 1 ||
      springs.some((s) => !resting(s))
    );
  }

  // His fur as the drawing draws it: its zigzag of spikes along his outline, each base meeting the
  // next, each tip leaning its own way, mirrored, longer on his crown and here and there, along a
  // lumpy outline (drawnFur). Each frame finds where his outline is on screen, from the shape his
  // body is built from, and lays the zigzag along it, turned with his head so the crown stays on
  // top. At rest, his outline is the drawing's: it's measured once, unturned, and what it differs
  // from the drawing's by is kept with each slice of it. Only the crown belongs to his body, as an
  // animator keeps a character's landmark on model through a turn: each of its spikes sticks out
  // as far as a tuft rooted where it's drawn would in 3D, so they shorten as he nods. Every other
  // spike keeps its shape, as on a turning ball the outline hardly changes. Stroked, they bend the
  // way the pointer goes, and spring back.
  function outline() {
    const n = FUR.spikes;
    const drawn = drawnFur();
    // Where each crown spike is rooted on him, and how far a tuft `len` long, rooted `away`
    // radians in front of or behind his outline on a body `r` across, sticks out past it.
    const roots = drawn.spikes.map(({ tip }) => [Math.sin(tip), Math.cos(tip), 0]);
    const sticksOut = (r, len, away) => (r + len) * Math.cos(away) - r;
    // Points over his surface, evenly (a Fibonacci sphere).
    const surface = new Float32Array(SAMPLES * 3);
    for (let i = 0; i < SAMPLES; i++) {
      const y = 1 - (2 * (i + 0.5)) / SAMPLES;
      const r = Math.sqrt(1 - y * y);
      const a = i * Math.PI * (3 - Math.sqrt(5));
      const d = [r * Math.cos(a), y, r * Math.sin(a)];
      const k = surfaceRadius(d);
      surface.set([d[0] * k, d[1] * k, d[2] * k], i * 3);
    }
    // Seven points a spike: inside the band, the valley before it, its tip's round end (one side
    // of the stroke, its middle, the other side), the valley after it, and inside the band again.
    const PER = 7;
    const position = new Float32Array(n * PER * 3);
    const tone = new Float32Array(n * PER * 3);
    const index = [];
    for (let i = 0; i < n; i++) {
      const [inner, valley, left, end, right, next, innerNext] = [0, 1, 2, 3, 4, 5, 6].map(
        (v) => i * PER + v,
      );
      index.push(inner, valley, next, inner, next, innerNext);
      index.push(valley, left, end, valley, end, right, valley, right, next);
    }
    // The zigzag on screen before it's stroked, in pixels: each valley, each tip, and each valley
    // once stroked.
    const valleys = new Float32Array(n * 2);
    const tips = new Float32Array(n * 2);
    const mitres = new Float32Array(n * 2);
    const radius = new Float32Array(n);
    const smooth = new Float32Array(n);
    const reach = new Float32Array(n);
    const lumps = new Float32Array(n);
    let fit = null;
    const bends = Array.from({ length: n }, () => Spring(PET.spring));

    function lay({ world, turned, rect, dt, shadow, tones }) {
      const [w, h] = [canvas.width / 2, canvas.height / 2];
      // In pixels from the middle of the canvas, y up, so angles and lengths are true on screen.
      const project = (matrix, point) => {
        const [x, y, z, q] = M.apply(matrix, point);
        return [(x / q) * w, (y / q) * h, z / q];
      };
      // His outline seen through `m`, slice by slice: how far any point of him reaches each way.
      const slices = (m) => {
        const [cx, cy] = project(m, [0, 0, 0]);
        // Which way his top points on screen, so the crown stays on it as he leans.
        const [tx, ty] = project(m, [0, 1, 0]);
        const roll = Math.atan2(tx - cx, ty - cy);
        radius.fill(0);
        for (let i = 0; i < SAMPLES; i++) {
          // `project`, written out: it runs 3,000 times a frame.
          const [sx, sy, sz] = [surface[i * 3], surface[i * 3 + 1], surface[i * 3 + 2]];
          const q = m[3] * sx + m[7] * sy + m[11] * sz + m[15];
          const x = ((m[0] * sx + m[4] * sy + m[8] * sz + m[12]) / q) * w;
          const y = ((m[1] * sx + m[5] * sy + m[9] * sz + m[13]) / q) * h;
          const r = Math.hypot(x - cx, y - cy);
          const at = (Math.atan2(x - cx, y - cy) - roll) / STEP;
          for (let k = Math.floor(at) - 1; k <= Math.ceil(at) + 1; k++) {
            const out = r * Math.cos((at - k) * STEP);
            const j = ((k % n) + n) % n;
            if (out > radius[j]) radius[j] = out;
          }
        }
        for (let i = 0; i < n; i++)
          smooth[i] = (radius[(i + n - 1) % n] + 2 * radius[i] + radius[(i + 1) % n]) / 4;
        return { cx, cy, roll };
      };
      // His outline unturned, once, against the drawing's.
      if (!fit) {
        const { cx } = slices(SEEN);
        const size = project(SEEN, [1, 0, 0])[0] - cx;
        fit = Float32Array.from(smooth, (r, i) => drawnOval(i * STEP) - r / size);
      }
      const toScreen = M.times(SEEN, world);
      const { cx, cy, roll } = slices(toScreen);
      // One unit of him (his bun's radius) in pixels, across the screen at his middle's depth.
      const centre = M.column(world, 3);
      const scale = Math.hypot(...M.column(world, 0));
      const [ux, uy] = project(SEEN, add(centre, [1, 0, 0], scale));
      const size = Math.hypot(ux - cx, uy - cy);
      const toCamera = unit(add(CAMERA, centre, -1));
      const [, , depth] = project(SEEN, add(centre, toCamera, -0.4 * scale));

      // Which part of him is on the outline at each angle, in his own terms, so it turns with him.
      const own = (v) => [0, 1, 2].map((k) => dot(M.column(turned, k), v));
      const upOnScreen = unit(add([0, 1, 0], toCamera, -toCamera[1]));
      const right = own(cross(upOnScreen, toCamera));
      const up = own(upOnScreen);
      const facing = own(toCamera);
      const part = (s) =>
        unit(
          add(
            right.map((c) => c * Math.sin(s)),
            up,
            Math.cos(s),
          ),
        );
      for (let i = 0; i < n; i++) {
        lumps[i] = drawn.lump(Math.acos(clamp(part(i * STEP + roll)[1], -1, 1)));
        const { len, crown } = drawn.spikes[i];
        const away = Math.asin(Math.min(1, Math.abs(dot(roots[i], facing))));
        reach[i] = crown
          ? Math.max(len, sticksOut(surfaceRadius(roots[i]), len + crown, away))
          : len;
      }
      const edge = (i) => smooth[i % n] + fit[i % n] * size;
      // A point `r` pixels from his middle at angle `a` clockwise from his top.
      const polar = (r, a) => [cx + r * Math.sin(a + roll), cy + r * Math.cos(a + roll)];
      const put = (v, [x, y]) => position.set([x / w, y / h, depth], v * 3);
      const stroke = STROKE * size;

      // The hand in the same pixels as the spikes, and its speed, smoothed over 60 ms so a stroke
      // holds the fur over for a moment.
      let at = null;
      if (hand.x != null && rect.width) {
        at = [
          ((hand.x - rect.left) / rect.width) * canvas.width - w,
          h - ((hand.y - rect.top) / rect.height) * canvas.height,
        ];
        if (hand.was && dt > 0) {
          const keep = Math.exp(-dt / 0.06);
          hand.vx = hand.vx * keep + ((at[0] - hand.was[0]) / dt) * (1 - keep);
          hand.vy = hand.vy * keep + ((at[1] - hand.was[1]) / dt) * (1 - keep);
        }
      }
      hand.was = at;
      if (!at) hand.vx = hand.vy = 0;

      // Where the click landed, as an angle round him like a spike's.
      let ripple = null;
      if (ruffle && rect.width) {
        ruffle.age += dt;
        const px = ((ruffle.x - rect.left) / rect.width) * canvas.width - w;
        const py = h - ((ruffle.y - rect.top) / rect.height) * canvas.height;
        ripple = Math.atan2(px - cx, py - cy) - roll;
      }
      let bent = false;
      stroking = false;
      for (let i = 0; i < n; i++) {
        const a = i * STEP;
        const { tip } = drawn.spikes[i];
        const from = edge(i) + lumps[i] * size;
        const to = edge(i + 1) + lumps[(i + 1) % n] * size;
        const along = from + ((to - from) * (tip - a)) / STEP;
        const len = reach[i] * size;
        // Bent by the hand: toward where it's going across the spike, as far as it's fast and
        // near (measured to the spike from its root to its tip).
        const bend = bends[i];
        bend.target = 0;
        if (at) {
          const s = tip + roll;
          const [ox, oy] = [Math.sin(s), Math.cos(s)];
          const [bx, by] = [cx + along * ox, cy + along * oy];
          const k = clamp((at[0] - bx) * ox + (at[1] - by) * oy, 0, len);
          const near = Math.hypot(at[0] - bx - ox * k, at[1] - by - oy * k);
          const touch = 1 - ramp(near, 0, PET.reach * size);
          const across = (hand.vx * oy - hand.vy * ox) / (PET.full * size);
          bend.target = clamp(across, -1, 1) * PET.bend * touch;
          // A stroke, not a pointer passing by: near, and moving across him.
          if (touch > 0.3 && Math.abs(across) > 0.15) stroking = true;
        }
        if (ripple != null && !ruffle.reached[i]) {
          const off = Math.atan2(Math.sin(tip - ripple), Math.cos(tip - ripple));
          if (ruffle.age >= Math.abs(off) * RUFFLE.travel) {
            ruffle.reached[i] = 1;
            const fade = 1 - (1 - RUFFLE.far) * (Math.abs(off) / Math.PI);
            bend.v += Math.sign(off) * RUFFLE.kick * fade;
          }
        }
        for (let u = 0; u < dt; u += 1 / 240) step(bend, Math.min(1 / 240, dt - u));
        // Settled: exactly straight, so he's perfectly still at rest.
        if (!bend.target && Math.abs(bend.x) < 1e-4 && Math.abs(bend.v) < 1e-3) bend.x = bend.v = 0;
        if (bend.x || bend.v || bend.target) bent = true;
        const tipOut = along + len * Math.cos(bend.x);
        valleys.set(polar(from, a), i * 2);
        tips.set(polar(tipOut, tip + (len * Math.sin(bend.x)) / tipOut), i * 2);
        // In the painted shadow or out of it, as the skin facing the same way would be.
        const [nx, ny] = [Math.sin(tip + roll), Math.cos(tip + roll)];
        const dark = nx * shadow[0] + ny * shadow[1] - REACH.skin + brushWobble(nx, ny, 0) > 0;
        for (let k = 0; k < PER; k++) tone.set(dark ? tones.shade : tones.lit, (i * PER + k) * 3);
      }

      // Stroked as the drawing strokes it, `stroke` pixels to each side: every side pushed out,
      // each valley filled to where its two sides' strokes meet (a mitre, which is what closes the
      // narrow gaps between long spikes, as on the crown), and each tip rounded. The zigzag runs
      // clockwise, so a side's outside is to its left.
      const at2 = (list, i) => {
        const j = ((i % n) + n) % n;
        return [list[j * 2], list[j * 2 + 1]];
      };
      const outside = ([x0, y0], [x1, y1]) => {
        const l = Math.hypot(x1 - x0, y1 - y0) || 1;
        return [(y0 - y1) / l, (x1 - x0) / l, l];
      };
      for (let i = 0; i < n; i++) {
        const valley = at2(valleys, i);
        const [ax, ay, la] = outside(at2(tips, i - 1), valley);
        const [bx, by, lb] = outside(valley, at2(tips, i));
        let k = stroke / Math.max(1 + ax * bx + ay * by, 1e-6);
        // No further than most of the way up the shorter side, where two spikes merge outright.
        const most = 0.9 * Math.min(la, lb);
        const far = Math.hypot(ax + bx, ay + by) * k;
        if (far > most) k *= most / far;
        mitres.set([valley[0] + (ax + bx) * k, valley[1] + (ay + by) * k], i * 2);
      }
      for (let i = 0; i < n; i++) {
        const a = i * STEP;
        const tip = at2(tips, i);
        const [ax, ay] = outside(at2(valleys, i), tip);
        const [bx, by] = outside(tip, at2(valleys, i + 1));
        const l = Math.hypot(ax + bx, ay + by);
        const [ex, ey] = l > 1e-6 ? [(ax + bx) / l, (ay + by) / l] : [ay, -ax];
        const v = i * PER;
        put(v, polar(edge(i) - BAND * size, a));
        put(v + 1, at2(mitres, i));
        put(v + 2, [tip[0] + ax * stroke, tip[1] + ay * stroke]);
        put(v + 3, [tip[0] + ex * stroke, tip[1] + ey * stroke]);
        put(v + 4, [tip[0] + bx * stroke, tip[1] + by * stroke]);
        put(v + 5, at2(mitres, i + 1));
        put(v + 6, polar(edge(i + 1) - BAND * size, a + STEP));
      }
      if (ruffle?.reached.every(Boolean)) ruffle = null;
      return bent || Boolean(ruffle) || Math.hypot(hand.vx, hand.vy) > 1;
    }
    return { position, tone, index: new Uint16Array(index), lay };
  }

  // Gone, the drawing comes back: a lost context, too slow a machine, or reduced motion asked for
  // after all.
  function stop() {
    if (!alive) return;
    alive = false;
    cancelAnimationFrame(frame);
    clearTimeout(breathing);
    clearTimeout(blinkTimer);
    clearTimeout(releaseTimer);
    clearTimeout(joyTimer);
    clearTimeout(missing);
    listening.abort();
    watch.disconnect();
    sizing.disconnect();
    host.classList.remove('real');
    canvas.remove();
    onStop?.();
  }
  canvas.addEventListener('webglcontextlost', stop, { signal });
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener(
    'change',
    (event) => event.matches && stop(),
    { signal },
  );

  host.append(canvas);
  size();
  return {
    // As the drawing's: look at a point on the page until the mouse next moves, or with none,
    // back where he's drawn looking; and blink.
    look(point) {
      if (searching) return;
      pointer = point;
      wake();
    },
    blink: () => blink(),
    stop,
  };
}
