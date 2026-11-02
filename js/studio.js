import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

(function () {
  var stage = document.getElementById("studio-stage");
  var canvas = document.getElementById("studio-canvas");
  var fallback = document.getElementById("studio-fallback");
  var readout = document.getElementById("studio-readout");
  var colorInput = document.getElementById("studio-color");
  if (!stage || !canvas) return;

  function showFallback() {
    if (fallback) fallback.hidden = false;
    if (canvas) canvas.hidden = true;
    var hint = stage.querySelector(".studio__hint");
    if (hint) hint.hidden = true;
  }

  var names = {
    bottles: "Bottles",
    skincare: "Skincare",
    thermos: "Thermos",
    camera: "Camera",
    phone: "Phone",
    laptop: "Laptop",
    gamepad: "Gamepad",
    controller: "Controller",
    motorcycle: "Motorcycle",
    bottle: "Lunen bottle",
    arc: "Voltline Arc",
    vessel: "Northroom vessel"
  };
  var finishNames = { matte: "Matte", gloss: "Gloss", metal: "Metal", glass: "Glass" };
  var colorNames = {
    "#c9863a": "Amber",
    "#d8ff3e": "Lime",
    "#171717": "Black",
    "#ff4d1a": "Orange",
    "#f3efe4": "Cream",
    "#e7b7a8": "Blush",
    "#b9bcc4": "Silver",
    "#a56a45": "Clay"
  };
  var finishes = {
    matte: { roughness: 0.9, metalness: 0.02, clearcoat: 0, clearcoatRoughness: 0.4, transparent: false, opacity: 1 },
    gloss: { roughness: 0.12, metalness: 0.06, clearcoat: 0.9, clearcoatRoughness: 0.16, transparent: false, opacity: 1 },
    metal: { roughness: 0.22, metalness: 1, clearcoat: 0.4, clearcoatRoughness: 0.2, transparent: false, opacity: 1 },
    glass: { roughness: 0.04, metalness: 0.04, clearcoat: 1, clearcoatRoughness: 0.03, transparent: true, opacity: 0.82 }
  };
  var state = {
    bottles: { color: "#f3efe4", finish: "gloss" },
    skincare: { color: "#e7b7a8", finish: "gloss" },
    thermos: { color: "#171717", finish: "metal" },
    camera: { color: "#171717", finish: "matte" },
    phone: { color: "#b9bcc4", finish: "metal" },
    laptop: { color: "#b9bcc4", finish: "metal" },
    gamepad: { color: "#171717", finish: "matte" },
    controller: { color: "#171717", finish: "gloss" },
    motorcycle: { color: "#ff4d1a", finish: "gloss" },
    bottle: { color: "#c9863a", finish: "glass" },
    arc: { color: "#171717", finish: "matte" },
    vessel: { color: "#a56a45", finish: "matte" }
  };
  var files = {
    bottles: "assets/models/bottles.glb",
    skincare: "assets/models/skincare.glb",
    thermos: "assets/models/thermos.glb",
    camera: "assets/models/camera.glb",
    phone: "assets/models/phone.glb",
    laptop: "assets/models/laptop.glb",
    gamepad: "assets/models/gamepad.glb",
    controller: "assets/models/controller.glb",
    motorcycle: "assets/models/motorcycle.glb"
  };
  var current = "bottles";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var rotY = 0.55;
  var rotX = 0.16;
  var dragging = false;
  var lastX = 0;
  var lastY = 0;
  var running = true;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  } catch (err) {
    showFallback();
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setClearColor(0x000000, 0);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 40);
  camera.position.set(2.8, 1.35, 4.8);

  scene.environment = makeEnvironment(renderer);
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  var key = new THREE.DirectionalLight(0xfff4e8, 2.6);
  key.position.set(3.2, 5.5, 3.4);
  scene.add(key);
  var fill = new THREE.DirectionalLight(0xffffff, 0.55);
  fill.position.set(-2.4, 2.2, 3.2);
  scene.add(fill);
  var rim = new THREE.DirectionalLight(0xd8ff3e, 0.35);
  rim.position.set(-3.5, 2.4, -2.2);
  scene.add(rim);

  var shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 4.4),
    new THREE.MeshBasicMaterial({ map: shadowMap(), transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;
  scene.add(shadow);

  var plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(1.55, 1.62, 0.08, 128),
    new THREE.MeshStandardMaterial({ color: 0x1a1916, roughness: 0.62, metalness: 0.28 })
  );
  plinth.position.y = -0.02;
  scene.add(plinth);

  var pivot = new THREE.Group();
  scene.add(pivot);

  var catalog = {
    bottle: makeBottle(),
    arc: makeArc(),
    vessel: makeVessel()
  };
  Object.keys(files).forEach(function (id) {
    catalog[id] = { group: new THREE.Group(), url: files[id], slots: null, loaded: false, loading: false, failed: false };
  });
  Object.keys(catalog).forEach(function (id) {
    pivot.add(catalog[id].group);
    if (!catalog[id].url) {
      seat(catalog[id].group);
      paint(id);
    }
    catalog[id].group.visible = id === current;
  });

  var loader = new GLTFLoader();

  var productButtons = Array.prototype.slice.call(document.querySelectorAll("[data-product]"));
  var finishButtons = Array.prototype.slice.call(document.querySelectorAll("[data-finish]"));
  var swatches = Array.prototype.slice.call(document.querySelectorAll(".swatch[data-color]"));

  productButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      showProduct(button.getAttribute("data-product"));
    });
  });
  finishButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      state[current].finish = button.getAttribute("data-finish");
      sync();
    });
  });
  swatches.forEach(function (button) {
    button.addEventListener("click", function () {
      state[current].color = button.getAttribute("data-color").toLowerCase();
      sync();
    });
  });
  if (colorInput) {
    colorInput.addEventListener("input", function () {
      state[current].color = colorInput.value.toLowerCase();
      sync();
    });
  }
  document.addEventListener("click", function (event) {
    var link = event.target.closest("[data-studio]");
    if (!link) return;
    showProduct(link.getAttribute("data-studio"));
  });

  stage.addEventListener("pointerdown", function (event) {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener("pointermove", function (event) {
    if (!dragging) return;
    rotY += (event.clientX - lastX) * 0.01;
    rotX = THREE.MathUtils.clamp(rotX + (event.clientY - lastY) * 0.007, -0.45, 0.85);
    lastX = event.clientX;
    lastY = event.clientY;
  });
  stage.addEventListener("pointerup", function () { dragging = false; });
  stage.addEventListener("pointercancel", function () { dragging = false; });
  stage.addEventListener("keydown", function (event) {
    var step = 0.14;
    if (event.key === "ArrowLeft") rotY -= step;
    else if (event.key === "ArrowRight") rotY += step;
    else if (event.key === "ArrowUp") rotX = Math.max(-0.45, rotX - step);
    else if (event.key === "ArrowDown") rotX = Math.min(0.85, rotX + step);
    else return;
    event.preventDefault();
  });

  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(stage);
  else window.addEventListener("resize", resize);
  resize();

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      running = entries[0].isIntersecting;
    }).observe(stage);
  }

  requestAnimationFrame(loop);
  showProduct(current);

  function showProduct(id) {
    if (!catalog[id]) return;
    current = id;
    Object.keys(catalog).forEach(function (key) {
      catalog[key].group.visible = key === id;
    });
    if (catalog[id].url && !catalog[id].loaded) loadModel(id);
    sync();
  }

  function loadModel(id) {
    var item = catalog[id];
    if (item.loading || item.loaded) return;
    item.loading = true;
    loader.load(item.url, function (gltf) {
      var model = gltf.scene;
      item.slots = captureSlots(model);
      item.group.add(model);
      seat(item.group);
      item.loaded = true;
      item.loading = false;
      item.group.visible = current === id;
      paint(id);
      if (current === id) sync();
    }, undefined, function () {
      item.loading = false;
      item.failed = true;
      if (current === id) sync();
    });
  }

  function sync() {
    var selected = state[current];
    var item = catalog[current];
    productButtons.forEach(function (button) {
      button.setAttribute("aria-selected", button.getAttribute("data-product") === current ? "true" : "false");
    });
    finishButtons.forEach(function (button) {
      button.setAttribute("aria-pressed", button.getAttribute("data-finish") === selected.finish ? "true" : "false");
    });
    swatches.forEach(function (button) {
      button.classList.toggle("is-on", button.getAttribute("data-color").toLowerCase() === selected.color);
    });
    if (colorInput && colorInput.value.toLowerCase() !== selected.color) colorInput.value = selected.color;
    if (!readout) return;
    if (item.url && !item.loaded) {
      readout.textContent = item.failed ? names[current] + " could not be loaded." : "Loading " + names[current] + "…";
      return;
    }
    readout.textContent = names[current] + " · " + finishNames[selected.finish] + " · " + (colorNames[selected.color] || "Custom colour");
    paint(current);
  }

  function paint(id) {
    var item = catalog[id];
    var selected = state[id];
    if (!item || !selected) return;
    if (item.slots) item.slots.forEach(function (slot) { applyFinish(slot.material, selected, slot); });
    if (item.material) applyFinish(item.material, selected, null);
  }

  function applyFinish(material, selected, slot) {
    if (!material || !material.color) return;
    var preset = finishes[selected.finish];
    material.map = null;
    material.emissiveMap = null;
    if (material.emissive) material.emissive.set(0x000000);
    material.color.set(selected.color);
    if (material.roughness !== undefined) material.roughness = preset.roughness;
    if (material.metalness !== undefined) material.metalness = preset.metalness;
    if (material.clearcoat !== undefined) {
      material.clearcoat = preset.clearcoat;
      material.clearcoatRoughness = preset.clearcoatRoughness;
    }
    if (material.transmission !== undefined) material.transmission = 0;
    if (selected.finish === "glass") {
      material.transparent = true;
      material.opacity = preset.opacity;
      material.depthWrite = false;
    } else {
      material.transparent = slot ? slot.transparent : false;
      material.opacity = slot ? slot.opacity : 1;
      material.depthWrite = !(slot && slot.transparent);
    }
    material.needsUpdate = true;
  }

  function captureSlots(root) {
    var slots = [];
    root.traverse(function (obj) {
      if (!obj.isMesh || !obj.material) return;
      var list = Array.isArray(obj.material) ? obj.material : [obj.material];
      var clones = list.map(function (mat) {
        var clone = mat.clone();
        slots.push({
          material: clone,
          transparent: !!clone.transparent && clone.opacity < 0.98,
          opacity: clone.opacity == null ? 1 : clone.opacity
        });
        return clone;
      });
      obj.material = Array.isArray(obj.material) ? clones : clones[0];
    });
    return slots;
  }

  function resize() {
    var width = stage.clientWidth;
    var height = stage.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function loop() {
    requestAnimationFrame(loop);
    if (!running || document.hidden) return;
    if (!dragging && !reduced) rotY += 0.004;
    pivot.rotation.y = rotY;
    pivot.rotation.x = rotX;
    camera.lookAt(0, 0.72, 0);
    renderer.render(scene, camera);
  }

  function seat(group) {
    group.position.set(0, 0, 0);
    group.scale.set(1, 1, 1);
    group.updateMatrixWorld(true);
    var box = new THREE.Box3().setFromObject(group);
    var size = box.getSize(new THREE.Vector3());
    var maxDim = Math.max(size.x, size.y, size.z) || 1;
    group.scale.setScalar(2.05 / maxDim);
    group.updateMatrixWorld(true);
    box.setFromObject(group);
    var center = box.getCenter(new THREE.Vector3());
    group.position.x -= center.x;
    group.position.z -= center.z;
    group.position.y -= box.min.y;
  }

  function shell() {
    return new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0 });
  }

  function lathe(points) {
    return new THREE.LatheGeometry(points.map(function (point) {
      return new THREE.Vector2(point[0], point[1]);
    }), 96);
  }

  function makeBottle() {
    var material = shell();
    var group = new THREE.Group();
    group.add(new THREE.Mesh(lathe([
      [0.02, 0], [0.3, 0.015], [0.42, 0.06], [0.48, 0.16], [0.5, 0.4], [0.5, 1.05],
      [0.47, 1.22], [0.38, 1.34], [0.26, 1.44], [0.17, 1.54], [0.15, 1.66], [0.15, 1.9],
      [0.18, 1.95], [0.19, 2.12], [0.04, 2.16]
    ]), material));
    var bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 28, 20),
      new THREE.MeshPhysicalMaterial({ color: 0x1a1a1a, roughness: 0.45, metalness: 0.15 })
    );
    bulb.position.y = 2.08;
    bulb.scale.y = 1.2;
    group.add(bulb);
    return { group: group, material: material };
  }

  function makeArc() {
    var material = shell();
    var group = new THREE.Group();
    var band = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.07, 24, 80, Math.PI), material);
    band.position.y = 0.72;
    var leather = new THREE.MeshPhysicalMaterial({ color: 0x2a2825, roughness: 0.82, metalness: 0 });
    [-1, 1].forEach(function (side) {
      var cup = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.38, 0.26, 48), material);
      cup.rotation.z = Math.PI / 2;
      cup.position.set(side * 0.98, 0.48, 0);
      var pad = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.065, 16, 36), leather);
      pad.rotation.y = Math.PI / 2;
      pad.position.set(side * 1.02, 0.48, 0.1);
      var yoke = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.28, 16), material);
      yoke.position.set(side * 0.98, 0.74, 0);
      group.add(cup, pad, yoke);
    });
    group.add(band);
    return { group: group, material: material };
  }

  function makeVessel() {
    var material = shell();
    var group = new THREE.Group();
    group.add(new THREE.Mesh(lathe([
      [0.18, 0], [0.26, 0.03], [0.34, 0.1], [0.42, 0.2], [0.5, 0.34], [0.56, 0.5],
      [0.58, 0.66], [0.56, 0.82], [0.5, 0.96], [0.42, 1.08], [0.34, 1.18], [0.3, 1.26],
      [0.32, 1.32], [0.36, 1.38], [0.34, 1.44]
    ]), material));
    var mouth = new THREE.Mesh(
      new THREE.CircleGeometry(0.28, 48),
      new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 1 })
    );
    mouth.rotation.x = -Math.PI / 2;
    mouth.position.y = 1.42;
    group.add(mouth);
    return { group: group, material: material };
  }

  function shadowMap() {
    var board = document.createElement("canvas");
    board.width = 256;
    board.height = 256;
    var context = board.getContext("2d");
    var gradient = context.createRadialGradient(128, 128, 16, 128, 128, 118);
    gradient.addColorStop(0, "rgba(0,0,0,0.48)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
    var texture = new THREE.CanvasTexture(board);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  function makeEnvironment(target) {
    var room = new THREE.Scene();
    room.add(new THREE.Mesh(
      new THREE.BoxGeometry(8, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xe7e1d4, side: THREE.BackSide })
    ));
    var windowLight = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.7), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    windowLight.position.set(0, 2.2, -3.95);
    room.add(windowLight);
    var lime = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 5.2), new THREE.MeshBasicMaterial({ color: 0xd8ff3e }));
    lime.position.set(-3.95, 0.2, 0.2);
    lime.rotation.y = Math.PI / 2;
    room.add(lime);
    var warm = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ color: 0xffb089 }));
    warm.position.set(2.8, 1.1, 2.4);
    warm.lookAt(0, 1, 0);
    room.add(warm);
    var pmrem = new THREE.PMREMGenerator(target);
    var env = pmrem.fromScene(room, 0.04).texture;
    pmrem.dispose();
    return env;
  }
})();
