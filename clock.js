(() => {
  const { Scene, OrthographicCamera, Vector3, BufferGeometry, LineBasicMaterial, LineSegments,
    Shape, ShapeGeometry, Mesh, MeshBasicMaterial, SVGRenderer } = Clock3D;
  const $ = id => document.getElementById(id);
  const mod = (n, base) => ((n % base) + base) % base;
  const rad = Math.PI / 180;
  const polar = (r, deg) => [r * Math.sin(deg * rad), -r * Math.cos(deg * rad)];
  const pad = n => String(n).padStart(2, "0");
  const timeParts = t => [Math.floor(t / 60), t % 60];
  const formatTime = t => timeParts(t).map(pad).join(":");
  const styles = getComputedStyle(document.documentElement);
  const ink = name => styles.getPropertyValue("--cp-" + name).trim();
  const svgNS = "http://www.w3.org/2000/svg";
  const dial = $("dial");
  const scene = new Scene();
  const camera = new OrthographicCamera(-190, 190, 190, -190, 0.1, 1000);
  camera.position.z = 500;
  const renderer = new SVGRenderer();
  renderer.setSize(380, 380);
  renderer.setPrecision(3);
  renderer.domElement.setAttribute("aria-hidden", "true");
  dial.insertBefore(renderer.domElement, $("arrows"));

  for (const major of [false, true]) {
    const points = [];
    for (let i = 0; i < 60; i++) {
      if ((i % 5 === 0) !== major) continue;
      for (const radius of [major ? 155 : 164, 171]) {
        const [x, y] = polar(radius, i * 6);
        points.push(new Vector3(x, -y, 0));
      }
    }
    scene.add(new LineSegments(new BufferGeometry().setFromPoints(points),
      new LineBasicMaterial({ color: ink(major ? "text" : "border-strong"), linewidth: major ? 2.7 : 1.3 })));
  }
  for (let i = 1; i <= 12; i++) {
    const number = document.createElementNS(svgNS, "text");
    const [x, y] = polar(137, i * 30);
    number.setAttribute("x", x);
    number.setAttribute("y", y);
    number.textContent = i;
    $("numerals").append(number);
  }
  function makeHand(length, width, z) {
    const s = new Shape();
    s.moveTo(-width, -9);
    s.lineTo(width, -9);
    s.lineTo(width * .55, length - 4);
    s.quadraticCurveTo(0, length + 2, -width * .55, length - 4);
    s.closePath();
    const hand = new Mesh(new ShapeGeometry(s), new MeshBasicMaterial({ color: ink("text") }));
    hand.position.z = z;
    scene.add(hand);
    return { hand, length, degrees: 0 };
  }
  const hour = makeHand(87, 5.8, 1);
  const minute = makeHand(122, 2.6, 2);

  // The cylindrical case is open at the front; the vector dial supplies its face.
  const caseSides = [];
  for (let i = 0; i < 72; i++) {
    const a = i * 5 * rad, b = (i + 1) * 5 * rad;
    const rim = (angle, z) => new Vector3(182 * Math.cos(angle), 182 * Math.sin(angle), z);
    const p = rim(a, -20), q = rim(b, -20), s = rim(a, 0), t = rim(b, 0);
    const geometry = new BufferGeometry().setFromPoints([p, q, t, p, t, s]);
    geometry.computeVertexNormals();
    const material = new MeshBasicMaterial({ color: ink("border-strong") });
    material.color.multiplyScalar(.75 + .25 * Math.cos(a - 2));
    const wall = new Mesh(geometry, material);
    wall.visible = false;
    caseSides.push(wall);
    scene.add(wall);
  }
  let angled = false, pitch = 38, yaw = -18;

  function positionCamera() {
    camera.rotation.set(angled ? pitch * rad : 0, angled ? yaw * rad : 0, 0, "YXZ");
    camera.position.set(0, 0, 500).applyQuaternion(camera.quaternion);
    camera.updateMatrixWorld();
    // An orthographic camera maps each constant-depth plane to an affine SVG transform.
    function alignPlane(id, z) {
      const project = (x, y) => new Vector3(x, -y, z).project(camera).multiply(new Vector3(190, -190, 1));
      const o = project(0, 0), u = project(1, 0).sub(o), v = project(0, 1).sub(o);
      $(id).setAttribute("transform", `matrix(${u.x} ${u.y} ${v.x} ${v.y} ${o.x} ${o.y})`);
    }
    alignPlane("face-plane", 0);
    alignPlane("arrow-plane", 0);
    alignPlane("hub-plane", minute.hand.position.z + 1);
    renderer.render(scene, camera);
  }

  function drawArc(id, r, start, sweep, sign) {
    const arc = $(id + "-arc"), tip = $(id + "-tip"), tint = $(id + "-tint");
    if (sweep === 0) {
      for (const path of [arc, tip, tint]) path.removeAttribute("d");
      return;
    }
    const end = start + sign * sweep;
    // Scale the arrowhead down for tiny angles instead of letting it point past the hand.
    const headLength = Math.min(10, r * sweep * rad * .48);
    const headDeg = headLength / (r * rad);
    const base = end - sign * headDeg, stemSweep = sweep - headDeg;
    const path = (angle, travel) => `M${polar(r, start)} A${r},${r} 0 ${travel > 180 ? 1 : 0} ${sign > 0 ? 1 : 0} ${polar(r, angle)}`;
    arc.setAttribute("d", path(base, stemSweep));
    arc.setAttribute("stroke-width", Math.min(3.2, headLength * .65));
    tip.setAttribute("d", `M${polar(r, end)} L${polar(r - headLength * .48, base)} L${polar(r + headLength * .48, base)}Z`);
    // A single SVG arc cannot draw a circle with coincident endpoints.
    tint.setAttribute("d", sweep === 360
      ? path(start + sign * 180, 180) + ` A${r},${r} 0 0 ${sign > 0 ? 1 : 0} ${polar(r, start)} Z`
      : path(end, sweep) + " L0,0 Z");
  }

  const hourSelect = $("hour"), minuteSelect = $("minute");
  for (let h = 0; h < 24; h++) hourSelect.add(new Option(pad(h), h));
  for (let m = 0; m < 60; m++) minuteSelect.add(new Option(pad(m), m));
  const presets = [540, 210, 360, 610].map(t => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "preset";
    const line = (r, deg) => `M0,0 L${polar(r, deg)}`;
    btn.innerHTML = `<svg class="icon" aria-hidden="true" viewBox="-12 -12 24 24"><circle r="9.5"/><path d="${line(4.7, t / 2)} ${line(7.5, t * 6)}"/></svg>${formatTime(t)}`;
    btn.addEventListener("click", () => setTime(t));
    $("presets").append(btn);
    return { t, btn };
  });

  let time;
  function setTime(value) {
    const next = mod(Math.round(value), 24 * 60);
    if (next === time) return;
    time = next;
    const [h, m] = timeParts(time);
    hour.degrees = (h % 12) * 30 + m / 2;
    minute.degrees = m * 6;
    hour.hand.rotation.z = -hour.degrees * rad;
    minute.hand.rotation.z = -minute.degrees * rad;
    renderer.render(scene, camera);
    const cw = mod(minute.degrees - hour.degrees, 360);
    const ccw = 360 - cw;
    drawArc("cw", 49, hour.degrees, cw, 1);
    drawArc("ccw", 74, hour.degrees, ccw, -1);
    hourSelect.value = h;
    minuteSelect.value = m;
    $("digital").textContent = formatTime(time);
    $("cw-value").textContent = cw + "\u00b0";
    $("ccw-value").textContent = ccw + "\u00b0";
    dial.setAttribute("aria-label", `Clock set to ${formatTime(time)}. Hour to minute: ${cw} degrees clockwise, ${ccw} degrees counterclockwise.`);
    for (const { t, btn } of presets) btn.setAttribute("aria-pressed", t === time);
  }
  for (const control of [hourSelect, minuteSelect])
    control.addEventListener("change", () => setTime(Number(hourSelect.value) * 60 + Number(minuteSelect.value)));

  function localPoint(e, z) {
    const box = dial.getBoundingClientRect();
    const point = new Vector3(2 * (e.clientX - box.left) / box.width - 1,
      1 - 2 * (e.clientY - box.top) / box.height, -1).unproject(camera);
    const ray = camera.getWorldDirection(new Vector3());
    point.addScaledVector(ray, (z - point.z) / ray.z);
    const x = point.x, y = -point.y;
    return { x, y, radius: Math.hypot(x, y), angle: Math.atan2(x, -y) / rad };
  }
  function handAt(e) {
    let closest = null, best = Infinity;
    for (const h of [hour, minute]) {
      const p = localPoint(e, h.hand.position.z);
      if (p.radius < 14) continue;
      const [dx, dy] = polar(1, h.degrees);
      const along = Math.max(0, Math.min(h.length, p.x * dx + p.y * dy));
      const distance = Math.hypot(p.x - along * dx, p.y - along * dy);
      // Where the shafts overlap, favor the hand whose tip is closer.
      const score = distance + Math.abs(h.length - p.radius) * .025;
      if (distance <= 15 && score < best) { closest = h; best = score; }
    }
    return closest;
  }
  let drag = null;
  dial.addEventListener("pointerdown", e => {
    if (drag || e.button !== 0) return;
    const hand = handAt(e);
    if (!hand && !angled) return;
    e.preventDefault();
    drag = hand
      ? { id: e.pointerId, hand, previous: localPoint(e, hand.hand.position.z).angle, time }
      : { id: e.pointerId, startX: e.clientX, startY: e.clientY, pitch, yaw };
    dial.setPointerCapture(e.pointerId);
    dial.style.cursor = "grabbing";
  });
  dial.addEventListener("pointermove", e => {
    if (!drag) { dial.style.cursor = handAt(e) || angled ? "grab" : ""; return; }
    if (drag.id !== e.pointerId) return;
    if (!drag.hand) {
      const sensitivity = 100 / dial.clientWidth;
      yaw = Math.max(-55, Math.min(55, drag.yaw - (e.clientX - drag.startX) * sensitivity));
      pitch = Math.max(-55, Math.min(55, drag.pitch - (e.clientY - drag.startY) * sensitivity));
      positionCamera();
      return;
    }
    const p = localPoint(e, drag.hand.hand.position.z);
    if (p.radius < 12) { drag.previous = null; return; }
    if (drag.previous !== null) {
      // Unwrap successive samples so crossing twelve advances or rewinds the hour.
      const delta = mod(p.angle - drag.previous + 180, 360) - 180;
      drag.time += delta * (drag.hand === hour ? 2 : 1 / 6);
      setTime(drag.time);
    }
    drag.previous = p.angle;
  });
  const endDrag = e => {
    if (drag?.id !== e.pointerId) return;
    drag = null;
    if (dial.hasPointerCapture(e.pointerId)) dial.releasePointerCapture(e.pointerId);
    dial.style.cursor = "";
  };
  for (const event of ["pointerup", "pointercancel", "lostpointercapture"]) dial.addEventListener(event, endDrag);
  function setView(use3D) {
    if (drag) endDrag({ pointerId: drag.id });
    angled = use3D;
    for (const wall of caseSides) wall.visible = angled;
    hour.hand.position.z = angled ? 4 : 1;
    minute.hand.position.z = angled ? 7 : 2;
    $("top-view").setAttribute("aria-pressed", !angled);
    $("angled-view").setAttribute("aria-pressed", angled);
    $("drag-hint").textContent = angled
      ? "Drag a hand to set the time, or drag the dial to rotate the view"
      : "Drag either hand near its tip";
    positionCamera();
  }
  $("top-view").addEventListener("click", () => setView(false));
  $("angled-view").addEventListener("click", () => setView(true));
  setTime(540);
})();
