// Builds the Timer scene's screen in After Effects from its parts, so each one moves on its own: the
// timer button, its menu and each item, the highlight, each digit of the time, the panel making room
// for the bar, the bar. The parts are what `node scripts/demo/stills.mjs layers timer` captured from
// the real extension (build/demo/stills/layers/), so they look exactly as presenters see them.
//
// What each part does, and when, is the extension's: the menu opens on the click on the button and
// closes on the click on its item, the time ticks once a second, and the panel grows by the bar's
// height. The film only eases it: the menu grows from under its button, its items come in one after
// another, the highlight follows the pointer from item to item, a digit slides as it changes, and
// the panel's content moves down instead of jumping.
//
// Run it with the demo's project open: File › Scripts › Run Script File… It builds the comp "Timer
// stage, in parts" (again, if it's there) from "Timer stage", keeping that comp's pointer, and puts
// it in the scene "5 Timer v2" in its place. It writes what it did to timer-build.txt, beside the
// parts.
(function () {
  var here = new File($.fileName).parent;
  var DIR = here.parent.parent.fsName + '/build/demo/stills/layers/';
  var report = [];

  function read(path) {
    var file = new File(path);
    if (!file.exists)
      throw new Error(path + ' is missing: run node scripts/demo/stills.mjs layers timer');
    file.encoding = 'UTF-8';
    file.open('r');
    var text = file.read();
    file.close();
    return text;
  }

  function write(path, text) {
    var file = new File(path);
    file.encoding = 'UTF-8';
    file.lineFeed = 'Unix';
    file.open('w');
    file.write(text);
    file.close();
  }

  function find(name, type) {
    for (var i = 1; i <= app.project.numItems; i++) {
      var item = app.project.item(i);
      if (item.name === name && (!type || item instanceof type)) return item;
    }
    return null;
  }

  function rgb(css) {
    var n = css.match(/[\d.]+/g);
    return [n[0] / 255, n[1] / 255, n[2] / 255];
  }

  try {
    app.beginUndoGroup('Build the Timer screen from its parts');
    var m = JSON.parse(read(DIR + 'timer.json'));
    var K = 2; // the stage is the window at twice its size in CSS pixels
    var old = find('Timer stage', CompItem);
    var scene = find('5 Timer v2', CompItem);
    if (!old || !scene) throw new Error('The project has no "Timer stage" or "5 Timer v2"');

    // The parts, imported once into their folder, and loaded again from the files on a rebuild.
    var folder = find('Timer parts', FolderItem) || app.project.items.addFolder('Timer parts');
    folder.parentFolder = old.parentFolder;
    function footage(name) {
      var path = DIR + m.files[name].file;
      for (var i = 1; i <= folder.numItems; i++) {
        var item = folder.item(i);
        if (
          item instanceof FootageItem &&
          item.file &&
          item.file.fsName === new File(path).fsName
        ) {
          item.mainSource.reload();
          return item;
        }
      }
      var imported = app.project.importFile(new ImportOptions(new File(path)));
      imported.parentFolder = folder;
      return imported;
    }

    // The stage: "Timer stage" without its screenshots, so its pointer comes along, parented and
    // timed as it is. On a rebuild, the same comp, emptied but for the pointer.
    var POINTER = { Mouse: true, Arrow: true, Ripple: true };
    var stage = find('Timer stage, in parts', CompItem);
    if (!stage) {
      stage = old.duplicate();
      stage.name = 'Timer stage, in parts';
    }
    // A null's solid stays in the project when its layer goes, so the old menu's goes with it.
    var solids = [];
    for (var i = stage.numLayers; i >= 1; i--) {
      var layer = stage.layer(i);
      if (POINTER[layer.name]) continue;
      if (layer.nullLayer) solids.push(layer.source);
      layer.remove();
    }
    for (var i = 0; i < solids.length; i++) if (solids[i].usedIn.length === 0) solids[i].remove();
    var mouse = stage.layer('Mouse').transform.position;

    var EASE =
      'function bz(a,b,c,e,x){if(x<=0)return 0;if(x>=1)return 1;var lo=0,hi=1,t=.5;for(var i=0;i<30;i++){t=(lo+hi)/2;var u=1-t;if(3*a*u*u*t+3*c*u*t*t+t*t*t<x)lo=t;else hi=t;}var u=1-t;return 3*b*u*u*t+3*e*u*t*t+t*t*t;}' +
      // Material's curves: emphasized decelerate (things arriving), emphasized accelerate (things
      // leaving) and standard (things changing in place).
      'function decel(x){return bz(.05,.7,.1,1,x);}function accel(x){return bz(.3,0,.8,.15,x);}function std(x){return bz(.2,0,0,1,x);}';

    // When the pointer presses and lets go, as the pointer's own Scale and the ripple have them: the
    // button opens its menu as the first click lets go, and the item acts as the second does.
    var PRESS = 2.05;
    var OPEN = 2.12;
    var CLOSE = 3.02;
    // The panel makes room for the bar as the menu finishes fading, so the page doesn't move under it.
    var SHIFT = CLOSE + 0.08;
    // The time, each second the scene shows: counting up, then down from 15 minutes once chosen.
    var TICKS = [
      [0, '00:00:07'],
      [1.2, '00:00:08'],
      [2.2, '00:00:09'],
      [CLOSE, '00:15:00'],
      [CLOSE + 1, '00:14:59'],
      [CLOSE + 2, '00:14:58'],
      [CLOSE + 3, '00:14:57'],
    ];
    // The button lights up when the pointer gets to it, which its keyframes say.
    var b = m.button;
    var HOVER = PRESS;
    for (var t = 0; t < PRESS; t += 1 / 240) {
      var p = mouse.valueAtTime(t, false);
      if (
        p[0] >= b.x * K &&
        p[0] <= (b.x + b.width) * K &&
        p[1] >= b.y * K &&
        p[1] <= (b.y + b.height) * K
      ) {
        HOVER = t;
        break;
      }
    }
    report.push('The pointer gets to the button at ' + HOVER.toFixed(3) + ' s');

    function picture(name, layerName) {
      var layer = stage.layers.add(footage(name));
      layer.name = layerName;
      var clip = m.files[name].clip || { x: 0, y: 0 };
      layer.transform.anchorPoint.setValue([0, 0]);
      layer.transform.position.setValue([clip.x * K, clip.y * K]);
      layer.transform.scale.setValue([(100 * K) / m.scale, (100 * K) / m.scale]);
      layer.samplingQuality = LayerSamplingQuality.BICUBIC;
      layer.motionBlur = true;
      return layer;
    }

    function rect(layerName, x, y, w, h, color, radius) {
      var layer = stage.layers.addShape();
      layer.name = layerName;
      var group = layer.property('ADBE Root Vectors Group').addProperty('ADBE Vector Group');
      group.name = layerName;
      var shape = group.property('ADBE Vectors Group').addProperty('ADBE Vector Shape - Rect');
      shape.property('ADBE Vector Rect Size').setValue([w, h]);
      shape.property('ADBE Vector Rect Position').setValue([w / 2, h / 2]);
      shape.property('ADBE Vector Rect Roundness').setValue(radius || 0);
      var fill = layer
        .property('ADBE Root Vectors Group')
        .property(1)
        .property('ADBE Vectors Group')
        .addProperty('ADBE Vector Graphic - Fill');
      fill.property('ADBE Vector Fill Color').setValue(color);
      layer.transform.anchorPoint.setValue([0, 0]);
      layer.transform.position.setValue([x, y]);
      layer.motionBlur = true;
      return layer;
    }

    function maskRect(layer, x0, y0, x1, y1) {
      var mask = layer.property('ADBE Mask Parade').addProperty('ADBE Mask Atom');
      var shape = new Shape();
      shape.vertices = [
        [x0, y0],
        [x1, y0],
        [x1, y1],
        [x0, y1],
      ];
      shape.closed = true;
      mask.property('ADBE Mask Shape').setValue(shape);
      mask.maskMode = MaskMode.ADD;
    }

    // ---- The window, under everything: as it is before the countdown.
    picture('backdrop', 'Backdrop');

    // ---- The panel making room for the bar. The page under the timer's row moves down by the
    // bar's room, from the panel's bottom border down, and the panel's own strip fills in behind it:
    // both cut from the window as it is after. Short of the side panel's right edge, where its resize
    // handle stays put. Before then, they're the same as the backdrop under them.
    var rest = m.rest;
    var after = m.counting;
    var DY = (after.pageControl.y - rest.pageControl.y) * K;
    var S = m.scale;
    var EDGE = Math.floor(after.sidePanel.width) - 1;
    var BORDER = 2;
    var grown = picture('backdrop-counting', 'Panel, grown');
    maskRect(
      grown,
      0,
      (rest.timerPanel.height - BORDER) * S,
      EDGE * S,
      (after.timerPanel.height - BORDER) * S,
    );
    grown.transform.opacity.expression = 'time<' + SHIFT + '?0:100;';
    var below = picture('backdrop-counting', 'Page, moving down');
    maskRect(
      below,
      0,
      (after.timerPanel.height - BORDER) * S,
      EDGE * S,
      (after.pageControl.y + after.pageControl.height) * S,
    );
    below.transform.position.expression =
      EASE + 'var s=std((time-' + SHIFT + ')/0.45);[value[0],value[1]-' + DY + '*(1-s)];';
    below.transform.opacity.expression = 'time<' + SHIFT + '?0:100;';

    // ---- The bar: its track, and the time gone filling it, out of 15 minutes.
    var bar = m.bar;
    var radius = Math.min(bar.radius, bar.height / 2) * K;
    var barLayer = rect(
      'Bar',
      bar.x * K,
      bar.y * K,
      bar.width * K,
      bar.height * K,
      rgb(bar.track),
      radius,
    );
    // The time gone, cut to the track's round ends as the track's overflow cuts it.
    var fillGroup = barLayer.property('ADBE Root Vectors Group').addProperty('ADBE Vector Group');
    fillGroup.name = 'Time gone';
    function gone() {
      return barLayer
        .property('ADBE Root Vectors Group')
        .property('Time gone')
        .property('ADBE Vectors Group');
    }
    var track = gone().addProperty('ADBE Vector Shape - Rect');
    track.property('ADBE Vector Rect Size').setValue([bar.width * K, bar.height * K]);
    track
      .property('ADBE Vector Rect Position')
      .setValue([(bar.width * K) / 2, (bar.height * K) / 2]);
    track.property('ADBE Vector Rect Roundness').setValue(radius);
    var width = 'var w=' + bar.width * K + '*Math.max(0,time-' + CLOSE + ')/900;';
    var fillRect = gone().addProperty('ADBE Vector Shape - Rect');
    fillRect.property('ADBE Vector Rect Size').expression = width + '[w,' + bar.height * K + '];';
    fillRect.property('ADBE Vector Rect Position').expression =
      width + '[w/2,' + (bar.height * K) / 2 + '];';
    gone().addProperty('ADBE Vector Filter - Merge').property('ADBE Vector Merge Type').setValue(4);
    gone()
      .addProperty('ADBE Vector Graphic - Fill')
      .property('ADBE Vector Fill Color')
      .setValue(rgb(bar.fill));
    // A shape layer draws its first group on top.
    barLayer.property('ADBE Root Vectors Group').property('Time gone').moveTo(1);
    barLayer.transform.opacity.expression = EASE + '100*std((time-' + (SHIFT + 0.12) + ')/0.3);';

    // ---- The time: each place a digit can change shows the picture of that digit, cut to its
    // place. All ten pictures are frames of one comp, so a place shows a digit by its frame.
    var dig = m.digits.clip;
    var digits = find('Timer digits', CompItem);
    if (digits) digits.remove();
    digits = app.project.items.addComp('Timer digits', dig.width * K, dig.height * K, 1, 1, 60);
    digits.parentFolder = folder;
    for (var d = 0; d <= 9; d++) {
      var g = digits.layers.add(footage('digits-' + d));
      g.transform.anchorPoint.setValue([0, 0]);
      g.transform.position.setValue([0, 0]);
      g.transform.scale.setValue([(100 * K) / m.scale, (100 * K) / m.scale]);
      g.samplingQuality = LayerSamplingQuality.BICUBIC;
      g.inPoint = d / 60;
      g.outPoint = (d + 1) / 60;
    }
    var chars = m.time.characters;
    function place(name, frame) {
      var layer = stage.layers.add(digits);
      layer.name = name;
      layer.timeRemapEnabled = true;
      layer.property('ADBE Time Remapping').expression = frame;
      layer.outPoint = stage.duration;
      layer.transform.anchorPoint.setValue([0, 0]);
      layer.transform.position.setValue([dig.x * K, dig.y * K]);
      layer.motionBlur = true;
      return layer;
    }
    function cell(layer, c) {
      maskRect(layer, (c.x - dig.x) * K, 0, (c.x + c.width - dig.x) * K, dig.height * K);
    }
    var colons = place('Time, colons', '0.5/60;');
    for (var c = 0; c < chars.length; c++) if (chars[c].character === ':') cell(colons, chars[c]);
    // A changing digit leaves upwards and the new one comes up from below, a quarter of its height.
    var RISE = 6 * K;
    var tick =
      'var T=' +
      JSON.stringify(TICKS) +
      ';var k=0;for(var j=1;j<T.length;j++)if(time>=T[j][0])k=j;' +
      'var cur=+T[k][1].charAt(I),prev=k>0?+T[k-1][1].charAt(I):cur;var age=time-T[k][0];var changed=k>0&&cur!=prev;';
    for (var c = 0; c < chars.length; c++) {
      if (chars[c].character === ':') continue;
      var own = EASE + 'var I=' + c + ';' + tick;
      var leaving = place('Time, place ' + c + ', leaving', own + '(prev+0.5)/60;');
      cell(leaving, chars[c]);
      leaving.transform.position.expression =
        own + 'changed?value-[0,' + RISE + '*accel(age/0.2)]:value;';
      leaving.transform.opacity.expression = own + 'changed?100*(1-std(age/0.16)):0;';
      var arriving = place('Time, place ' + c, own + '(cur+0.5)/60;');
      cell(arriving, chars[c]);
      arriving.transform.position.expression =
        own + 'changed?value+[0,' + RISE + '*(1-decel(age/0.32))]:value;';
      arriving.transform.opacity.expression = own + 'changed?100*std(age/0.22):100;';
    }

    // ---- The timer button: at rest, lit while the pointer is on it, and pressed while its menu is
    // open.
    picture('button', 'Button');
    var lit = picture('button-hover', 'Button, pointer on it');
    lit.transform.opacity.expression =
      EASE + '(time<' + (PRESS + 0.08) + ')?100*std((time-' + HOVER + ')/0.12):0;';
    var pressed = picture('button-checked', 'Button, menu open');
    pressed.transform.opacity.expression =
      EASE +
      'time<' +
      CLOSE +
      '?100*std((time-' +
      PRESS +
      ')/0.06):100*(1-std((time-' +
      CLOSE +
      ')/0.2));';

    // ---- The menu. Everything in it hangs from a null at its corner under the button, which grows
    // it from there; "Open" fades it all.
    var menu = m.menu;
    var PX = (menu.x + menu.width) * K;
    var PY = menu.y * K;
    var box = picture('menu', 'Menu box');
    var items = [];
    for (var i = 0; i < m.items.length; i++) if (!m.items[i].separator) items.push(m.items[i]);
    var hl = m.highlight;
    var band = rect(
      'Highlight',
      hl.x * K,
      items[0].y * K,
      hl.width * K,
      hl.height * K,
      rgb(hl.color),
      0,
    );
    var rows = [];
    for (var i = 0; i < items.length; i++) rows.push(items[i].y * K);
    var itemLayers = [];
    for (var i = 0; i < items.length; i++)
      itemLayers.push(picture('item-' + items[i].part, 'Item: ' + items[i].text));
    var corner = stage.layers.addNull();
    corner.name = 'Menu';
    corner.transform.anchorPoint.setValue([0, 0]);
    corner.transform.position.setValue([PX, PY]);
    box.parent = corner;
    band.parent = corner;
    for (var i = 0; i < itemLayers.length; i++) itemLayers[i].parent = corner;
    var open = corner.property('ADBE Effect Parade').addProperty('ADBE Slider Control');
    open.name = 'Open';
    // A menu's box fades in and out quickly, as Material's do, so it's never a see-through box over
    // the slide for long; it grows over longer, settling as its items come in.
    open.property(1).expression =
      'time<' +
      OPEN +
      '?0:(time<' +
      CLOSE +
      '?Math.min(1,(time-' +
      OPEN +
      ')/0.08):Math.max(0,1-(time-' +
      CLOSE +
      ')/0.1));';
    corner.transform.scale.expression =
      EASE +
      'var s=time<' +
      CLOSE +
      '?95+5*decel((time-' +
      OPEN +
      ')/0.3):100-2*std((time-' +
      CLOSE +
      ')/0.1);[s,s];';
    var OPENED = 'thisComp.layer("Menu").effect("Open")("Slider")';
    box.transform.opacity.expression = '100*' + OPENED + ';';
    for (var i = 0; i < itemLayers.length; i++)
      itemLayers[i].transform.opacity.expression =
        EASE +
        'var k=time<' +
        CLOSE +
        '?std((time-' +
        (OPEN + 0.02 + 0.012 * i) +
        ')/0.14):1;100*' +
        OPENED +
        '*k;';
    // The highlight is on the item the pointer is over, as the menu lights it, from the moment the
    // pointer gets to an item until it leaves the menu or the menu closes; over a separator, it stays
    // where it was. The film glides it there over a tenth of a second rather than jumping.
    var last = items[items.length - 1];
    var follow =
      'var M=thisComp.layer("Mouse").transform.position;var R=' +
      JSON.stringify(rows) +
      ';' +
      'var X0=' +
      hl.x * K +
      ',X1=' +
      (hl.x + hl.width) * K +
      ',END=' +
      (last.y + last.height) * K +
      ';' +
      'function row(t){if(t<' +
      OPEN +
      ')return -1;var p=M.valueAtTime(Math.min(t,' +
      (CLOSE - 0.001) +
      '));' +
      'if(p[0]<X0||p[0]>=X1||p[1]<R[0]||p[1]>=END)return -1;var k=0;for(var i=1;i<R.length;i++)if(p[1]>=R[i])k=i;return k;}' +
      'var W=0.1,N=13,sw=0,sv=0,sy=0;for(var j=0;j<N;j++){var w=1-Math.abs((j-(N-1)/2)/((N+1)/2));' +
      'var r=row(time+W*(j/(N-1)-0.5));sw+=w;if(r>=0){sv+=w;sy+=w*R[r];}}';
    band.transform.position.expression = follow + '[value[0],(sv>0?sy/sv:R[0])-' + PY + '];';
    band.transform.opacity.expression = follow + '100*(sv/sw)*' + OPENED + ';';

    // The pointer above it all.
    stage.layer('Ripple').moveToBeginning();
    stage.layer('Arrow').moveToBeginning();
    stage.layer('Mouse').moveToBeginning();

    // In the scene, in place of the screenshots.
    scene.layer('Screen').replaceSource(stage, false);
    report.push(
      'Built "' + stage.name + '" with ' + stage.numLayers + ' layers, in "' + scene.name + '"',
    );
    app.endUndoGroup();
  } catch (error) {
    report.push('Error: ' + error.toString() + ' (line ' + error.line + ')');
    try {
      app.endUndoGroup();
    } catch (ignored) {}
  }
  write(DIR + 'timer-build.txt', report.join('\n') + '\n');
})();
