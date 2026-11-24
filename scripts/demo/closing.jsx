// Builds "Closing", the demo video's last 9.5 seconds: every feature pops in as a tile while the
// claim counts them ("1 feature" up to "8 features"), the claim completes ("in one extension"),
// then the icon appears among the tiles and draws them in, nearest first, the last landing on the
// music's last chord as the end card, whose icon, name and tagline it takes from "8 End". The tiles' pictures come from features.mjs
// (build/demo/stills/features/); when a feature is added or renamed, change it there and in
// FEATURES here, and run both again: this rebuilds the comp in place.
//
// Run it with the demo's project open: File › Scripts › Run Script File… It writes what it did to
// build/demo/ae/closing-build.txt. The edit places the comp after Live edits.
(function () {
  // Picture (features.mjs's id) and name, in reading order, four to a row.
  var FEATURES = [
    ['spotlight', 'Image spotlight'],
    ['links', 'Open links'],
    ['zoom', 'Zoom'],
    ['timer', 'Countdown timer'],
    ['notes', 'Floating notes'],
    ['live-edits', 'Live edits'],
    ['pen', 'Persistent pen'],
    ['download', 'Download original image'],
  ];
  var CLAIM = '8 features in one extension';
  var NAME = 'Closing';
  var DURATION = 9.5;

  // The film's beats fall at 0.1 + 0.6 n here. The tiles pop on eighth notes; the claim completes
  // on a beat; the words leave, and two beats before the last chord the icon appears (GATHER) and
  // eats the tiles, the last pair on the last chord (LAND). One beat was too fast to follow.
  var POP0 = 0.4;
  var POP_STEP = 0.3;
  var TAIL = 3.1;
  var TEXT_OUT = 4.75;
  var GATHER = 4.9;
  var LAND = 6.1;

  // Layout: the claim under its label, over a grid of tiles, the whole centred in the frame; the
  // tiles land where the end card's icon sits.
  var TILE = 200;
  var PITCH = 400;
  var ROWS = [456, 776];
  var CLAIM_Y = 256;
  var LABEL_DY = 152;
  // The label over the claim, as each scene has one over its headline, in the scenes' label type
  // (30 px Medium, blue) and 32 px above the claim's capitals, as a scene's label is above its
  // headline's. It tells the viewer this card is more than the scenes they've seen; "And much
  // more" would fight the count, which says exactly how many.
  var LEAD = "And there's more";
  var LEAD_Y = CLAIM_Y - 89;
  // The end card, a size up from "8 End"'s (icon 128, name 80, tagline 34), so it still reads when
  // the store and the README play the film small: at 360 px wide, the tagline was 6 px tall. The
  // gaps grow by the same 1.2, and the lockup keeps its optical centre (532). Text positions are
  // first baselines; each rises 20 px into place, as in "8 End".
  var ICON_AT = [960, 367];
  var ICON = 160;
  var NAME_SIZE = 96;
  var NAME_LEADING = 106;
  var NAME_Y = 576;
  var TAGLINE_SIZE = 48;
  var TAGLINE_LEADING = 58;
  var TAGLINE_Y = 778;
  var RISE = 20;
  // The odometer's line height: one digit shows through a window this tall.
  var DIGIT_LINE = 96;
  // The merge. The icon takes the tiles in mirrored pairs, nearest first, an eighth note apart
  // (PAIR_STEP; the beat is 0.6 s), the last on LAND. A tile's flight is longer the further it has
  // to go (FLIGHT, and FLIGHT_PER_PX), so the far ones wait their turn. On the way, each
  // curves off a straight line (ARC, a share of its way) and turns (TURN, in degrees), mirrored
  // either side of the icon, and shrinks to TILE_END of its size, fading out as it goes under the
  // icon. The icon blooms at ICON_START of its size where it stays on the end card, so the tiles
  // come to it and it never moves: born in the grid's middle and rising, every tile chased a moving
  // target, and the frame had two motions at once. It grows a step with each pair, and swells as it
  // eats each (by SWELL, over SWELL_IN), easing back over about SWELL_OUT, as the companion inside
  // hops (icon.mjs). A squash and hop read as a cartoon, too busy beside Slides' own motion.
  var FLIGHT = 0.3;
  var FLIGHT_PER_PX = 0.2 / 704;
  var PAIR_STEP = 0.3;
  var ARC = 0.18;
  var TURN = 12;
  var TILE_END = 0.3;
  var ICON_START = 0.72;
  var SWELL = 0.08;
  var SWELL_IN = 0.08;
  var SWELL_OUT = 0.14;

  var INK = [0.122, 0.122, 0.122];
  var BLUE = [0.043, 0.341, 0.816];
  // The film's shadow colour (the windows'), a dark blue rather than black.
  var SHADOW = [0.05, 0.1, 0.2];

  var BZ =
    'function bz(a,b,c,e,x){if(x<=0)return 0;if(x>=1)return 1;var lo=0,hi=1,t=.5;for(var i=0;i<30;i++){t=(lo+hi)/2;var u=1-t;if(3*a*u*u*t+3*c*u*t*t+t*t*t<x)lo=t;else hi=t;}var u=1-t;return 3*b*u*u*t+3*e*u*t*t+t*t*t;}';
  // A damped spring from 0 to 1 (icon.mjs's), for the tiles' pop and the icon's landing.
  var SPRING =
    'function spring(w,z,t){if(t<=0)return 0;var wd=w*Math.sqrt(1-z*z);return 1-Math.exp(-z*w*t)*(Math.cos(wd*t)+(z*w/wd)*Math.sin(wd*t));}';
  var CLAMP = 'function clamp(x){return Math.max(0,Math.min(1,x));}';
  var FN = BZ + SPRING + CLAMP;
  // ExtendScript's arrays have no indexOf.
  function indexOf(list, value) {
    for (var i = 0; i < list.length; i++) if (list[i] === value) return i;
    return -1;
  }
  // Text leaves before the gather, as captions leave with a scene: up 10 px as it fades.
  var OUT = 'var o=bz(.3,0,.8,.15,(time-' + TEXT_OUT + ')/0.2);';
  // The claim comes in with the first tile, as a caption does.
  var CLAIM_IN =
    'var ci=bz(.2,.6,.2,1,(time-' +
    (POP0 - 0.05) +
    ')/0.6);' +
    'var ca=bz(.25,.1,.25,1,(time-' +
    (POP0 - 0.05) +
    ')/0.4)*(1-o);';
  // How many tiles the count has rolled past: each pop rolls it one digit.
  var COUNT =
    'var v=0;for(var k=1;k<8;k++)v+=bz(.05,.7,.1,1,(time-(' + POP0 + '+' + POP_STEP + '*k))/0.35);';

  function find(name) {
    for (var i = 1; i <= app.project.numItems; i++) {
      var item = app.project.item(i);
      if (item instanceof CompItem && item.name === name) return item;
    }
    return null;
  }

  function footage(file) {
    for (var i = 1; i <= app.project.numItems; i++) {
      var item = app.project.item(i);
      if (item instanceof FootageItem && item.file && item.file.fsName === file.fsName) return item;
    }
    return app.project.importFile(new ImportOptions(file));
  }

  function text(comp, content, font, size, color, tracking, justification, leading) {
    var layer = comp.layers.addText(content);
    layer.name = content.split('\r')[0];
    var property = layer.property('ADBE Text Properties').property('ADBE Text Document');
    var doc = property.value;
    doc.resetCharStyle();
    doc.font = font;
    doc.fontSize = size;
    doc.fillColor = color;
    doc.applyFill = true;
    doc.applyStroke = false;
    doc.tracking = tracking;
    doc.justification = justification;
    if (leading) {
      doc.autoLeading = false;
      doc.leading = leading;
    }
    property.setValue(doc);
    layer.motionBlur = true;
    return layer;
  }

  function shadow(layer, name, opacity, distance, softness) {
    var effect = layer.property('ADBE Effect Parade').addProperty('ADBE Drop Shadow');
    effect.name = name;
    effect.property('ADBE Drop Shadow-0001').setValue(SHADOW);
    effect.property('ADBE Drop Shadow-0002').setValue(opacity);
    effect.property('ADBE Drop Shadow-0003').setValue(180);
    effect.property('ADBE Drop Shadow-0004').setValue(distance);
    effect.property('ADBE Drop Shadow-0005').setValue(softness);
  }

  // An animator whose amount, per character, an expression gives (0 to 100).
  function animator(layer, name, property, value, amount) {
    var animators = layer.property('ADBE Text Properties').property('ADBE Text Animators');
    var a = animators.addProperty('ADBE Text Animator');
    a.name = name;
    var p = a.property('ADBE Text Animator Properties').addProperty(property);
    if (typeof value === 'string') p.expression = value;
    else p.setValue(value);
    if (amount) {
      var selector = a
        .property('ADBE Text Selectors')
        .addProperty('ADBE Text Expressible Selector');
      selector.property('ADBE Text Expressible Amount').expression = amount;
    } else {
      a.property('ADBE Text Selectors').addProperty('ADBE Text Selector');
    }
    return a;
  }

  // Sets a copied end card line's type size, and moves its rise so it ends on its new baseline.
  function resize(layer, size, leading, y) {
    var source = layer.property('Source Text');
    var doc = source.value;
    doc.fontSize = size;
    // "8 End"'s name sets its leading by hand; older After Effects can't turn auto leading off.
    try {
      doc.autoLeading = false;
    } catch (ignored) {}
    doc.leading = leading;
    source.setValue(doc);
    var position = layer.transform.position;
    position.setValueAtKey(1, [960, y + RISE]);
    position.setValueAtKey(position.numKeys, [960, y]);
  }

  function measure(layer) {
    return layer.sourceRectAtTime(0, false);
  }

  var log = [];
  app.beginUndoGroup('Build the closing card');
  try {
    var end = find('8 End');
    if (!end) throw new Error('"8 End" is missing: the end card comes from it');
    var comp = find(NAME);
    if (comp) {
      while (comp.numLayers) comp.layer(1).remove();
      comp.duration = DURATION;
    } else {
      comp = app.project.items.addComp(NAME, 1920, 1080, 1, DURATION, 60);
      comp.parentFolder = end.parentFolder;
    }
    comp.motionBlur = true;
    comp.shutterAngle = 180;
    comp.shutterPhase = -90;

    // The claim's widths, measured in its own type, so it stays centred as it grows: with "feature",
    // "features", then the whole claim.
    var probe = text(
      comp,
      '8 feature',
      'GoogleSansFlex-Medium',
      80,
      BLUE,
      -10,
      ParagraphJustification.LEFT_JUSTIFY,
    );
    var doc = probe.property('ADBE Text Properties').property('ADBE Text Document');
    var widths = [];
    var rect = measure(probe);
    var inkLeft = rect.left;
    widths.push(rect.width);
    var d = doc.value;
    d.text = '8 features';
    doc.setValue(d);
    widths.push(measure(probe).width);
    d = doc.value;
    d.text = CLAIM;
    doc.setValue(d);
    widths.push(measure(probe).width);
    d = doc.value;
    d.text = '8';
    doc.setValue(d);
    rect = measure(probe);
    var eightCentre = rect.left + rect.width / 2;
    probe.remove();
    log.push(
      'claim widths ' + widths.join(', ') + '; ink left ' + inkLeft + '; 8 centre ' + eightCentre,
    );

    // Labels, under each tile.
    for (var i = 0; i < FEATURES.length; i++) {
      var x = 960 + ((i % 4) - 1.5) * PITCH;
      var y = ROWS[Math.floor(i / 4)];
      var pop = POP0 + POP_STEP * i;
      var label = text(
        comp,
        FEATURES[i][1],
        'GoogleSansFlex-Regular',
        34,
        INK,
        0,
        ParagraphJustification.CENTER_JUSTIFY,
      );
      label.transform.position.setValue([x, y + LABEL_DY]);
      label.transform.position.expression =
        FN + OUT + 'var p=bz(.2,.6,.2,1,(time-' + (pop + 0.08) + ')/0.5);value+[0,10*(1-p)-10*o];';
      label.transform.opacity.expression =
        FN + OUT + '100*bz(.25,.1,.25,1,(time-' + (pop + 0.08) + ')/0.4)*(1-o);';
    }

    // The label comes in a tenth of a second before the claim, as a scene's does before its
    // headline, and leaves with it.
    var lead = text(
      comp,
      LEAD,
      'GoogleSansFlex-Medium',
      30,
      BLUE,
      0,
      ParagraphJustification.CENTER_JUSTIFY,
    );
    lead.name = 'Label';
    lead.transform.position.setValue([960, LEAD_Y]);
    lead.transform.position.expression =
      FN + OUT + 'var p=bz(.2,.6,.2,1,(time-' + (POP0 - 0.15) + ')/0.6);value+[0,14*(1-p)-10*o];';
    lead.transform.opacity.expression =
      FN + OUT + '100*bz(.25,.1,.25,1,(time-' + (POP0 - 0.15) + ')/0.4)*(1-o);';

    // The claim, left-aligned so its words keep their places; its position recentres it as it grows.
    var claim = text(
      comp,
      CLAIM,
      'GoogleSansFlex-Medium',
      80,
      BLUE,
      -10,
      ParagraphJustification.LEFT_JUSTIFY,
    );
    claim.name = 'Claim';
    var WIDTH =
      'var ps=bz(.05,.7,.1,1,(time-' +
      (POP0 + POP_STEP) +
      ')/0.35);' +
      'var pt=bz(.05,.7,.1,1,(time-' +
      TAIL +
      ')/0.7);' +
      'var W=' +
      widths[0] +
      '+ps*' +
      (widths[1] - widths[0]) +
      '+pt*' +
      (widths[2] - widths[1]) +
      ';' +
      'var X=960-(' +
      inkLeft +
      ')-W/2;';
    claim.transform.position.setValue([960, CLAIM_Y]);
    claim.transform.position.expression =
      FN + OUT + CLAIM_IN + WIDTH + '[X,' + CLAIM_Y + '+14*(1-ci)-10*o];';
    claim.transform.opacity.expression = FN + OUT + CLAIM_IN + '100*ca;';
    // Which word of "in one extension" a character belongs to (characters 11 on), and when it comes in.
    var WORD = 'var i=textIndex;var w=i<=13?0:i<=17?1:2;var s=' + (TAIL + 0.08) + '+0.07*w;';
    // Hidden: the "8" (the odometer stands in for it), the plural's "s" until the second tile, and
    // the rest until the claim completes.
    animator(
      claim,
      'Hidden',
      'ADBE Text Opacity',
      0,
      FN +
        WORD +
        'var a=i==1?100:i==10?100*(1-bz(.05,.7,.1,1,(time-' +
        (POP0 + POP_STEP) +
        ')/0.35)):i>=11?100*(1-bz(.25,.1,.25,1,(time-s)/0.4)):0;[a,a,a];',
    );
    animator(
      claim,
      'Rise',
      'ADBE Text Position 3D',
      [0, 12, 0],
      FN + WORD + 'var a=i>=11?100*(1-bz(.2,.6,.2,1,(time-s)/0.5)):0;[a,a,a];',
    );

    // The odometer: the digits in a column, one line apart, rolled up a line with each tile, seen
    // through a window one line tall over the claim's first character.
    var digits = text(
      comp,
      '1\r2\r3\r4\r5\r6\r7\r8',
      'GoogleSansFlex-Medium',
      80,
      BLUE,
      0,
      ParagraphJustification.CENTER_JUSTIFY,
      DIGIT_LINE,
    );
    digits.name = 'Count';
    var digitRect = digits.sourceRectAtTime(0, false);
    var digitCentre = digitRect.left + digitRect.width / 2;
    digits.transform.position.setValue([960, CLAIM_Y]);
    digits.transform.position.expression =
      FN +
      OUT +
      CLAIM_IN +
      WIDTH +
      '[X+' +
      (eightCentre - digitCentre) +
      ',' +
      CLAIM_Y +
      '+14*(1-ci)-10*o];';
    digits.transform.opacity.expression = FN + OUT + CLAIM_IN + '100*ca;';
    animator(digits, 'Roll', 'ADBE Text Position 3D', FN + COUNT + '[0,' + -DIGIT_LINE + '*v,0];');
    var mask = digits.property('ADBE Mask Parade').addProperty('ADBE Mask Atom');
    var opening = new Shape();
    opening.vertices = [
      [-70, -78],
      [70, -78],
      [70, DIGIT_LINE - 78],
      [-70, DIGIT_LINE - 78],
    ];
    opening.closed = true;
    mask.property('ADBE Mask Shape').setValue(opening);

    // The end card's name and tagline, as "8 End" brings them in, from the moment the tiles land.
    var names = ['Name', 'Tagline', 'Icon'];
    for (var n = 0; n < names.length; n++) {
      var original = end.layer(names[n]);
      if (!original) throw new Error('"8 End" has no ' + names[n] + ' layer');
      original.copyToComp(comp);
    }
    // copyToComp doesn't say where it puts the copy, so each is found again by its name.
    for (n = 0; n < names.length; n++) comp.layer(names[n]).startTime = LAND;
    resize(comp.layer('Name'), NAME_SIZE, NAME_LEADING, NAME_Y);
    resize(comp.layer('Tagline'), TAGLINE_SIZE, TAGLINE_LEADING, TAGLINE_Y);

    // The tiles, the last on top, then the icon over them. Each tile's pair: the tiles sorted by how
    // far they are from the icon, two by two (the grid is symmetric, so pairs are mirror images).
    var dir = new File($.fileName).parent.parent.parent.fsName + '/build/demo/stills/features/';
    var order = [];
    for (var t = 0; t < FEATURES.length; t++) order.push(t);
    function away(i) {
      return Math.sqrt(
        Math.pow(ICON_AT[0] - (960 + ((i % 4) - 1.5) * PITCH), 2) +
          Math.pow(ICON_AT[1] - ROWS[Math.floor(i / 4)], 2),
      );
    }
    order.sort(function (i, j) {
      return away(i) - away(j);
    });
    var pairs = Math.ceil(FEATURES.length / 2);
    // Where the icon is, which the tiles fly to.
    var AT = 'var ix=' + ICON_AT[0] + ',iy=' + ICON_AT[1] + ';';
    var arrivals = [];
    for (t = 0; t < FEATURES.length; t++) {
      var source = footage(new File(dir + FEATURES[t][0] + '.png'));
      var tile = comp.layers.add(source);
      tile.name = 'Tile ' + FEATURES[t][1];
      tile.moveAfter(comp.layer('Icon'));
      tile.motionBlur = true;
      var tx = 960 + ((t % 4) - 1.5) * PITCH;
      var ty = ROWS[Math.floor(t / 4)];
      var at = POP0 + POP_STEP * t;
      var scale = (100 * TILE) / source.width;
      var pair = Math.floor(indexOf(order, t) / 2);
      var flight = FLIGHT + FLIGHT_PER_PX * away(t);
      var arrive = LAND - (pairs - 1 - pair) * PAIR_STEP;
      arrivals.push(arrive);
      var side = tx < ICON_AT[0] ? 1 : -1;
      // g runs 0 to 1 over the flight, dipping below 0 first, so the tile draws back a little before
      // it goes, and arriving at one and a half times its average speed, drawn in but not flung.
      var GO =
        'var g=bz(.5,-.1,.8,.7,(time-' + (arrive - flight) + ')/' + flight + ');var gc=clamp(g);';
      tile.transform.position.setValue([tx, ty]);
      tile.transform.position.expression =
        FN +
        GO +
        AT +
        'var x=' +
        tx +
        ',y=' +
        ty +
        ',dx=ix-x,dy=iy-y;' +
        'var arc=Math.sin(Math.PI*gc)*' +
        ARC * side +
        ';' +
        'var up=10*(1-bz(.2,.6,.2,1,(time-' +
        at +
        ')/0.5));' +
        '[x+dx*g+dy*arc,y+dy*g-dx*arc+up];';
      tile.transform.scale.expression =
        FN +
        GO +
        'var p=time<' +
        at +
        '?0:0.6+0.4*spring(18,0.62,time-' +
        at +
        ');' +
        'var s=' +
        scale +
        '*p*(1-' +
        (1 - TILE_END) +
        '*gc);[s,s];';
      tile.transform.rotation.expression = FN + GO + TURN * side + '*Math.sin(Math.PI*gc);';
      tile.transform.opacity.expression =
        FN + GO + '100*bz(.25,.1,.25,1,(time-' + at + ')/0.15)*(1-clamp((gc-0.8)/0.2));';
      // The shadow is drawn before the layer's scale, so it is set at the picture's size.
      var k = source.width / TILE;
      shadow(tile, 'Key shadow', 26, 6 * k, 20 * k);
      shadow(tile, 'Ambient shadow', 30, 1 * k, 3 * k);
    }

    // The icon blooms as the words leave, takes the tiles in, and springs to its size on LAND. Its
    // picture is the companion's sequence (icon.mjs's end screen), which starts at GATHER with only
    // his hair showing, hops with each pair and peeks on LAND; time remapping starts it at GATHER and
    // holds its first frame for the bloom, a few frames before.
    var icon = comp.layer('Icon');
    var properties = [icon.transform.position, icon.transform.scale, icon.transform.opacity];
    for (var q = 0; q < properties.length; q++) {
      while (properties[q].numKeys) properties[q].removeKey(1);
    }
    icon.timeRemapEnabled = true;
    icon.startTime = GATHER - 0.05;
    if (icon.source instanceof FootageItem) icon.source.mainSource.reload();
    icon.property('ADBE Time Remapping').expression = 'Math.max(0,time-' + GATHER + ');';
    icon.inPoint = GATHER - 0.05;
    icon.outPoint = comp.duration;
    icon.transform.position.setValue(ICON_AT);
    // w: how swollen the icon is from its bites, each up fast and easing back.
    var BITES =
      'var n=0,w=0,a=[' +
      arrivals.join(',') +
      '];for(var i=0;i<a.length;i++){n+=bz(.2,.6,.2,1,(time-a[i])/0.12);var d=time-a[i];' +
      'if(d>0)w+=bz(.2,.6,.3,1,d/' +
      SWELL_IN +
      ')*(d>' +
      SWELL_IN +
      '?Math.exp(-(d-' +
      SWELL_IN +
      ')/' +
      SWELL_OUT +
      '):1);}';
    var iconScale = (100 * ICON) / icon.source.width;
    icon.transform.scale.expression =
      FN +
      BITES +
      'var s=' +
      iconScale +
      '*spring(22,0.55,time-' +
      (GATHER - 0.02) +
      ')*(' +
      ICON_START +
      '+' +
      (1 - ICON_START) +
      '*n/a.length)*(0.94+0.06*spring(20,0.45,time-' +
      LAND +
      '))*(1+' +
      SWELL +
      '*w);[s,s];';
    icon.transform.opacity.expression = '100';
    log.push('Built "' + NAME + '" with ' + comp.numLayers + ' layers');
  } catch (error) {
    log.push('Error: ' + error.message + ' at line ' + error.line);
  }
  app.endUndoGroup();

  var root = new File($.fileName).parent.parent.parent.fsName;
  var report = new File(root + '/build/demo/ae/closing-build.txt');
  report.encoding = 'UTF-8';
  report.lineFeed = 'Unix';
  report.open('w');
  report.write(log.join('\n'));
  report.close();
})();
