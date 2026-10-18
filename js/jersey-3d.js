/**
 * 3D Interactive Football Jersey Spin
 * Player: MANTHAN SAWANT #04
 * Supported Kits: Real Madrid, Blue Lock, Manchester United, Sporting CP, Santos FC
 */

(function() {
  const KITS = {
    real_madrid: {
      name: "REAL MADRID",
      sub: "White & Gold // 👑 ギャラクティコ",
      texture: "./assets/jerseys/kit_real_madrid.png",
      collarColor: 0xd4af37,
      sleeveColor: 0xfcfcfd,
      cuffColor: 0xd4af37,
      ambient: 0xffffff,
      rim: 0xffe28a,
      roughness: 0.50,
      metalness: 0.12
    },
    blue_lock: {
      name: "BLUE LOCK",
      sub: "Anime Cyber Blue // ⚡ エゴイスト",
      texture: "./assets/jerseys/kit_blue_lock.png",
      collarColor: 0x00f0ff,
      sleeveColor: 0x061435,
      cuffColor: 0x00f0ff,
      ambient: 0xd0e8ff,
      rim: 0x00f0ff,
      roughness: 0.42,
      metalness: 0.22
    },
    man_utd: {
      name: "MANCHESTER UNITED",
      sub: "Iconic Scarlet Red // 🔴 赤い悪魔",
      texture: "./assets/jerseys/kit_man_utd.png",
      collarColor: 0x111111,
      sleeveColor: 0xc60c1c,
      cuffColor: 0xffffff,
      ambient: 0xffeedd,
      rim: 0xff8866,
      roughness: 0.52,
      metalness: 0.10
    },
    sporting: {
      name: "SPORTING CP",
      sub: "Green & White Hoops // 🟢 獅子奮迅",
      texture: "./assets/jerseys/kit_sporting.png",
      collarColor: 0x121416,
      sleeveColor: 0x008055,
      cuffColor: 0xe1b92d,
      ambient: 0xddffdd,
      rim: 0x66ffaa,
      roughness: 0.48,
      metalness: 0.10
    },
    santos: {
      name: "SANTOS FC",
      sub: "Classic White & Black // ⚪ 王国の血統",
      texture: "./assets/jerseys/kit_santos.png",
      collarColor: 0x121214,
      sleeveColor: 0xfcfcfd,
      cuffColor: 0xebb91e,
      ambient: 0xffffff,
      rim: 0xeed988,
      roughness: 0.50,
      metalness: 0.12
    }
  };

  class JerseyViewer {
    constructor(containerId = "jersey-3d-stage") {
      this.container = document.getElementById(containerId);
      if (!this.container) return;

      this.currentKitKey = "real_madrid";
      this.textures = {};
      this.autoRotate = true;
      this.isDragging = false;
      this.previousMousePosition = { x: 0, y: 0 };
      this.rotationVelocity = { x: 0, y: 0.005 };
      this.isSpinning360 = false;
      this.spinProgress = 0;

      this.initScene();
      this.buildJerseyMesh();
      this.preloadTextures();
      this.setupLights();
      this.setupEvents();
      this.setupUI();
      this.animate();
    }

    initScene() {
      this.scene = new THREE.Scene();
      
      const rect = this.container.getBoundingClientRect();
      const width = rect.width || window.innerWidth;
      const height = rect.height || window.innerHeight;

      this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
      this.camera.position.set(0, 0, 3.9);

      this.renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.15;

      this.canvas = this.renderer.domElement;
      this.canvas.className = "jersey-webgl-canvas";
      this.container.appendChild(this.canvas);
    }

    setupLights() {
      this.ambientLight = new THREE.AmbientLight(0xffffff, 0.90);
      this.scene.add(this.ambientLight);

      // Key light front-right
      this.keyLight = new THREE.DirectionalLight(0xfff8ed, 1.4);
      this.keyLight.position.set(2.5, 3.5, 3.5);
      this.scene.add(this.keyLight);

      // Fill light front-left
      this.fillLight = new THREE.DirectionalLight(0xd4eaff, 0.85);
      this.fillLight.position.set(-2.5, 2.0, 3.0);
      this.scene.add(this.fillLight);

      // Back rim light for golden / glowing silhouette edge
      this.rimLight = new THREE.DirectionalLight(0xffe6a3, 1.6);
      this.rimLight.position.set(0, 2.5, -3.5);
      this.scene.add(this.rimLight);

      // Subtle underlight
      this.underLight = new THREE.PointLight(0xffffff, 0.4, 8);
      this.underLight.position.set(0, -2.5, 1.8);
      this.scene.add(this.underLight);
    }

    buildJerseyMesh() {
      this.jerseyGroup = new THREE.Group();
      this.jerseyGroup.position.set(0, 0.05, 0);

      // Procedural fabric normal/bump texture
      const bumpCanvas = document.createElement("canvas");
      bumpCanvas.width = 128;
      bumpCanvas.height = 128;
      const bctx = bumpCanvas.getContext("2d");
      bctx.fillStyle = "#808080";
      bctx.fillRect(0, 0, 128, 128);
      for (let x = 0; x < 128; x += 4) {
        for (let y = 0; y < 128; y += 4) {
          bctx.fillStyle = (x + y) % 8 === 0 ? "#929292" : "#6e6e6e";
          bctx.fillRect(x, y, 2, 2);
        }
      }
      this.fabricBump = new THREE.CanvasTexture(bumpCanvas);
      this.fabricBump.wrapS = THREE.RepeatWrapping;
      this.fabricBump.wrapT = THREE.RepeatWrapping;
      this.fabricBump.repeat.set(16, 16);

      // Torso Material
      this.torsoMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.50,
        metalness: 0.12,
        bumpMap: this.fabricBump,
        bumpScale: 0.015,
        side: THREE.DoubleSide
      });

      const torsoGeom = this.createTorsoGeometry();
      this.torsoMesh = new THREE.Mesh(torsoGeom, this.torsoMaterial);
      this.jerseyGroup.add(this.torsoMesh);

      // Left & Right Sleeves
      const leftSleeveGeom = this.createSleeveGeometry(true);
      const rightSleeveGeom = this.createSleeveGeometry(false);

      this.sleeveMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.50,
        metalness: 0.12,
        bumpMap: this.fabricBump,
        bumpScale: 0.015,
        side: THREE.DoubleSide
      });

      this.leftSleeve = new THREE.Mesh(leftSleeveGeom, this.sleeveMaterial);
      this.rightSleeve = new THREE.Mesh(rightSleeveGeom, this.sleeveMaterial);
      this.jerseyGroup.add(this.leftSleeve);
      this.jerseyGroup.add(this.rightSleeve);

      // Cuffs
      const leftCuffGeom = this.createCuffGeometry(true);
      const rightCuffGeom = this.createCuffGeometry(false);
      this.cuffMaterial = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        roughness: 0.4,
        metalness: 0.2
      });
      this.leftCuff = new THREE.Mesh(leftCuffGeom, this.cuffMaterial);
      this.rightCuff = new THREE.Mesh(rightCuffGeom, this.cuffMaterial);
      this.jerseyGroup.add(this.leftCuff);
      this.jerseyGroup.add(this.rightCuff);

      // Ribbed Collar
      const collarGeom = this.createCollarGeometry();
      this.collarMaterial = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        roughness: 0.4,
        metalness: 0.2,
        side: THREE.DoubleSide
      });
      this.collarMesh = new THREE.Mesh(collarGeom, this.collarMaterial);
      this.jerseyGroup.add(this.collarMesh);

      this.scene.add(this.jerseyGroup);
    }

    createTorsoGeometry() {
      const rows = 40;
      const cols = 60;
      const positions = [];
      const uvs = [];
      const indices = [];

      // Torso bounds: hem at y = -1.05, neck opening at y = 0.88
      const yMin = -1.05;
      const yMax = 0.88;
      const totalH = yMax - yMin;

      for (let i = 0; i <= rows; i++) {
        const t = i / rows; // 0 = hem, 1 = shoulders/neck
        const y = yMin + t * totalH;

        // Realistic athletic football shirt silhouette
        let w, d;
        if (t < 0.35) {
          // Hem to waist: slight athletic taper
          const subT = t / 0.35;
          w = 0.55 - 0.04 * subT; // 0.55 down to 0.51
          d = 0.21 - 0.02 * subT;
        } else if (t < 0.78) {
          // Waist to chest/shoulders: expands broad
          const subT = (t - 0.35) / (0.78 - 0.35);
          w = 0.51 + 0.16 * Math.sin(subT * Math.PI * 0.5); // 0.51 to 0.67
          d = 0.19 + 0.06 * Math.sin(subT * Math.PI * 0.5); // 0.19 to 0.25 (chest volume)
        } else {
          // Shoulders tapering inward towards the neck hole
          const subT = (t - 0.78) / (1.0 - 0.78);
          w = 0.67 - 0.41 * (subT * subT); // 0.67 slopes down to 0.26 at neck
          d = 0.25 - 0.09 * subT; // 0.25 down to 0.16
        }

        for (let j = 0; j <= cols; j++) {
          const ang = (j / cols) * Math.PI * 2;
          const ca = Math.cos(ang);
          const sa = Math.sin(ang);

          const x = ca * w;
          const z = sa * d;

          // Texture coordinates:
          // Front is sa >= 0 (Z >= 0), Back is sa < 0 (Z < 0)
          // Top of texture (neck, crest, name MANTHAN) is at t = 1
          // Bottom of texture (hem, sponsor lower) is at t = 0
          let u, v;
          if (sa >= 0) {
            // FRONT OF JERSEY (Left half of texture: u from 0.05 to 0.45)
            // Left chest (Real Madrid crest) is at user's left (viewer's left: x < 0)
            const normX = 0.5 + (x / (2 * Math.max(w, 0.45))); // 0 to 1
            u = 0.05 + 0.40 * normX;
          } else {
            // BACK OF JERSEY (Right half of texture: u from 0.55 to 0.95)
            // When viewed from behind, viewer's left is x > 0
            const normX = 0.5 - (x / (2 * Math.max(w, 0.45))); // 0 to 1
            u = 0.55 + 0.40 * normX;
          }

          // In standard texture mapping, v = 1 is top of image, v = 0 is bottom
          v = 0.08 + 0.84 * t;

          positions.push(x, y, z);
          uvs.push(u, v);
        }
      }

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const p1 = i * (cols + 1) + j;
          const p2 = p1 + 1;
          const p3 = (i + 1) * (cols + 1) + j;
          const p4 = p3 + 1;

          indices.push(p1, p3, p2);
          indices.push(p2, p3, p4);
        }
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geom.setIndex(indices);
      geom.computeVertexNormals();
      return geom;
    }

    createSleeveGeometry(isLeft = true) {
      const radialSegs = 24;
      const lengthSegs = 10;
      const positions = [];
      const uvs = [];
      const indices = [];

      const sign = isLeft ? 1 : -1;
      // Start sleeve at the natural shoulder seam
      const startX = sign * 0.63;
      const startY = 0.68;
      const startZ = 0.0;

      // End sleeve angled downward along natural arm line
      const endX = sign * 0.96;
      const endY = 0.22;
      const endZ = -0.04;

      const rStart = 0.18;
      const rEnd = 0.14;

      for (let i = 0; i <= lengthSegs; i++) {
        const t = i / lengthSegs;
        const cx = startX + (endX - startX) * t;
        const cy = startY + (endY - startY) * t;
        const cz = startZ + (endZ - startZ) * t;
        const r = rStart + (rEnd - rStart) * t;

        for (let j = 0; j <= radialSegs; j++) {
          const ang = (j / radialSegs) * Math.PI * 2;
          const rx = -sign * Math.sin(ang) * 0.4 * r;
          const ry = Math.sin(ang) * 0.8 * r;
          const rz = Math.cos(ang) * r;

          positions.push(cx + rx, cy + ry, cz + rz);

          // UV coordinates mapped to sleeve region
          const uBase = isLeft ? 0.08 : 0.85;
          const u = uBase + sign * 0.08 * (j / radialSegs);
          const v = 0.80 - t * 0.35;
          uvs.push(u, v);
        }
      }

      for (let i = 0; i < lengthSegs; i++) {
        for (let j = 0; j < radialSegs; j++) {
          const p1 = i * (radialSegs + 1) + j;
          const p2 = p1 + 1;
          const p3 = (i + 1) * (radialSegs + 1) + j;
          const p4 = p3 + 1;

          indices.push(p1, p3, p2);
          indices.push(p2, p3, p4);
        }
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geom.setIndex(indices);
      geom.computeVertexNormals();
      return geom;
    }

    createCuffGeometry(isLeft = true) {
      const segs = 24;
      const positions = [];
      const indices = [];

      const sign = isLeft ? 1 : -1;
      const endX = sign * 0.96;
      const endY = 0.22;
      const endZ = -0.04;
      const r = 0.145;
      const thickness = 0.035;

      for (let i = 0; i <= 2; i++) {
        const t = i / 2;
        const cx = endX + sign * t * thickness * 0.6;
        const cy = endY - t * thickness * 0.8;
        const cz = endZ;

        for (let j = 0; j <= segs; j++) {
          const ang = (j / segs) * Math.PI * 2;
          const rx = -sign * Math.sin(ang) * 0.4 * r;
          const ry = Math.sin(ang) * 0.8 * r;
          const rz = Math.cos(ang) * r;
          positions.push(cx + rx, cy + ry, cz + rz);
        }
      }

      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < segs; j++) {
          const p1 = i * (segs + 1) + j;
          const p2 = p1 + 1;
          const p3 = (i + 1) * (segs + 1) + j;
          const p4 = p3 + 1;
          indices.push(p1, p3, p2);
          indices.push(p2, p3, p4);
        }
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geom.setIndex(indices);
      geom.computeVertexNormals();
      return geom;
    }

    createCollarGeometry() {
      const segs = 36;
      const positions = [];
      const indices = [];

      const rw = 0.25;
      const rz = 0.16;
      const yBase = 0.85;
      const height = 0.055;

      for (let i = 0; i <= 2; i++) {
        const y = yBase + (i / 2) * height;
        const scale = 1 + (i / 2) * 0.05;

        for (let j = 0; j <= segs; j++) {
          const ang = (j / segs) * Math.PI * 2;
          const x = Math.cos(ang) * rw * scale;
          let z = Math.sin(ang) * rz * scale;
          let actualY = y;
          if (z > 0) {
            // Front V-neck dip
            actualY -= (z / rz) * 0.05;
          }
          positions.push(x, actualY, z);
        }
      }

      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < segs; j++) {
          const p1 = i * (segs + 1) + j;
          const p2 = p1 + 1;
          const p3 = (i + 1) * (segs + 1) + j;
          const p4 = p3 + 1;
          indices.push(p1, p3, p2);
          indices.push(p2, p3, p4);
        }
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geom.setIndex(indices);
      geom.computeVertexNormals();
      return geom;
    }

    preloadTextures() {
      const loader = new THREE.TextureLoader();
      Object.keys(KITS).forEach(key => {
        loader.load(KITS[key].texture, tex => {
          tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.magFilter = THREE.LinearFilter;
          this.textures[key] = tex;
          if (key === this.currentKitKey) {
            this.applyKit(this.currentKitKey, false);
          }
        });
      });
    }

    applyKit(kitKey, animateFlip = true) {
      const kit = KITS[kitKey];
      if (!kit) return;
      this.currentKitKey = kitKey;

      if (this.textures[kitKey]) {
        this.torsoMaterial.map = this.textures[kitKey];
        this.torsoMaterial.roughness = kit.roughness;
        this.torsoMaterial.metalness = kit.metalness;
        this.torsoMaterial.needsUpdate = true;

        this.sleeveMaterial.map = this.textures[kitKey];
        this.sleeveMaterial.color.setHex(kit.sleeveColor);
        this.sleeveMaterial.needsUpdate = true;
      }

      this.collarMaterial.color.setHex(kit.collarColor);
      this.collarMaterial.needsUpdate = true;

      this.cuffMaterial.color.setHex(kit.cuffColor);
      this.cuffMaterial.needsUpdate = true;

      this.ambientLight.color.setHex(kit.ambient);
      this.rimLight.color.setHex(kit.rim);

      const titleEl = document.getElementById("hud-active-kit-title");
      if (titleEl) {
        titleEl.textContent = `${kit.name} (${kit.sub})`;
      }

      document.querySelectorAll(".kit-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.kit === kitKey);
      });

      if (animateFlip && this.jerseyGroup) {
        this.isSpinning360 = true;
        this.spinProgress = 0;
      }
    }

    setupEvents() {
      const onDown = (e) => {
        this.isDragging = true;
        this.autoRotate = false;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        this.previousMousePosition = { x: clientX, y: clientY };
      };

      const onMove = (e) => {
        if (!this.isDragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const deltaX = clientX - this.previousMousePosition.x;
        const deltaY = clientY - this.previousMousePosition.y;

        this.rotationVelocity.y = deltaX * 0.008;
        this.rotationVelocity.x = deltaY * 0.005;

        this.jerseyGroup.rotation.y += this.rotationVelocity.y;
        this.jerseyGroup.rotation.x = Math.max(-0.35, Math.min(0.35, this.jerseyGroup.rotation.x + this.rotationVelocity.x));

        this.previousMousePosition = { x: clientX, y: clientY };
      };

      const onUp = () => {
        this.isDragging = false;
      };

      this.canvas.addEventListener("mousedown", onDown);
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);

      this.canvas.addEventListener("touchstart", onDown, { passive: true });
      window.addEventListener("touchmove", onMove, { passive: true });
      window.addEventListener("touchend", onUp);

      window.addEventListener("resize", () => {
        if (!this.container) return;
        const rect = this.container.getBoundingClientRect();
        const width = rect.width || window.innerWidth;
        const height = rect.height || window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
      });

      window.addEventListener("scroll", () => {
        if (this.autoRotate && !this.isDragging && this.jerseyGroup) {
          const scrollY = window.scrollY || window.pageYOffset;
          this.jerseyGroup.rotation.y = scrollY * 0.003;
        }
      }, { passive: true });
    }

    setupUI() {
      document.querySelectorAll(".kit-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const kit = btn.dataset.kit;
          if (kit) this.applyKit(kit, true);
        });
      });

      const btnSpin = document.getElementById("btn-spin-360");
      if (btnSpin) {
        btnSpin.addEventListener("click", () => {
          this.isSpinning360 = true;
          this.spinProgress = 0;
        });
      }

      const btnAuto = document.getElementById("btn-toggle-auto");
      if (btnAuto) {
        btnAuto.addEventListener("click", () => {
          this.autoRotate = !this.autoRotate;
          btnAuto.classList.toggle("active", this.autoRotate);
          btnAuto.textContent = this.autoRotate ? "AUTO SPIN: ON" : "AUTO SPIN: OFF";
        });
      }
    }

    animate() {
      requestAnimationFrame(() => this.animate());

      const time = performance.now() * 0.001;

      if (this.jerseyGroup) {
        this.jerseyGroup.position.y = 0.05 + Math.sin(time * 1.6) * 0.035;
        this.jerseyGroup.rotation.z = Math.sin(time * 1.2) * 0.015;

        if (this.isSpinning360) {
          this.spinProgress += 0.04;
          this.jerseyGroup.rotation.y += 0.12;
          if (this.spinProgress >= Math.PI * 2) {
            this.isSpinning360 = false;
          }
        } else if (!this.isDragging) {
          if (this.autoRotate) {
            this.jerseyGroup.rotation.y += 0.008;
          } else {
            this.rotationVelocity.y *= 0.94;
            this.rotationVelocity.x *= 0.94;
            this.jerseyGroup.rotation.y += this.rotationVelocity.y;
            this.jerseyGroup.rotation.x = Math.max(-0.35, Math.min(0.35, this.jerseyGroup.rotation.x + this.rotationVelocity.x));
          }
        }
      }

      this.renderer.render(this.scene, this.camera);
    }
  }

  window.JerseyViewer = JerseyViewer;
})();
