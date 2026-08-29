import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const WORLD = {
  width: 96,
  depth: 96,
};

const PLAYER_SPEED = 6.5;
const JUMP_POWER = 8.5;
const GRAVITY = 22;

function createBox(
  geometry,
  material,
  position,
  rotation = [0, 0, 0],
  scale = [1, 1, 1]
) {
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.scale.set(...scale);

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

function makeMaterial(color, roughness = 0.8) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.05,
  });
}

function addTextSprite(text, options = {}) {
  const {
    color = "#ffffff",
    background = "rgba(0,0,0,.75)",
    fontSize = 48,
    padding = 18,
  } = options;

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  context.font = `700 ${fontSize}px Arial`;

  const width = context.measureText(text).width + padding * 2;
  const height = fontSize + padding * 2;

  canvas.width = width;
  canvas.height = height;

  context.font = `700 ${fontSize}px Arial`;
  context.textAlign = "center";
  context.textBaseline = "middle";

  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  context.fillStyle = color;
  context.fillText(text, width / 2, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });

  const sprite = new THREE.Sprite(material);

  sprite.scale.set(width / 100, height / 100, 1);

  return sprite;
}

function createPlayer() {
  const player = new THREE.Group();

  const skin = makeMaterial(0xc98b5b);
  const shirt = makeMaterial(0x151515);
  const pants = makeMaterial(0x20242b);
  const shoes = makeMaterial(0xe8e8e8);
  const hair = makeMaterial(0x171717);

  const body = createBox(
    new THREE.BoxGeometry(1.1, 1.35, 0.65),
    shirt,
    [0, 1.8, 0]
  );

  const head = createBox(
    new THREE.BoxGeometry(0.95, 0.95, 0.95),
    skin,
    [0, 3.0, 0]
  );

  const hairTop = createBox(
    new THREE.BoxGeometry(1.0, 0.35, 1.0),
    hair,
    [0, 3.52, -0.02]
  );

  const leftLeg = createBox(
    new THREE.BoxGeometry(0.43, 1.15, 0.5),
    pants,
    [-0.3, 0.65, 0]
  );

  const rightLeg = createBox(
    new THREE.BoxGeometry(0.43, 1.15, 0.5),
    pants,
    [0.3, 0.65, 0]
  );

  const leftFoot = createBox(
    new THREE.BoxGeometry(0.48, 0.28, 0.75),
    shoes,
    [-0.3, 0.08, -0.1]
  );

  const rightFoot = createBox(
    new THREE.BoxGeometry(0.48, 0.28, 0.75),
    shoes,
    [0.3, 0.08, -0.1]
  );

  const leftArm = createBox(
    new THREE.BoxGeometry(0.36, 1.15, 0.45),
    shirt,
    [-0.78, 1.85, 0]
  );

  const rightArm = createBox(
    new THREE.BoxGeometry(0.36, 1.15, 0.45),
    shirt,
    [0.78, 1.85, 0]
  );

  player.add(
    body,
    head,
    hairTop,
    leftLeg,
    rightLeg,
    leftFoot,
    rightFoot,
    leftArm,
    rightArm
  );

  player.userData.height = 3.65;

  return player;
}

function createNPC() {
  const npc = new THREE.Group();

  const skin = makeMaterial(0xc98b5b);
  const shirt = makeMaterial(0xf0dfbd);
  const pants = makeMaterial(0x343434);
  const hat = makeMaterial(0xb78542);

  npc.add(
    createBox(
      new THREE.BoxGeometry(1.05, 1.35, 0.65),
      shirt,
      [0, 1.75, 0]
    )
  );

  npc.add(
    createBox(
      new THREE.BoxGeometry(0.9, 0.9, 0.9),
      skin,
      [0, 2.85, 0]
    )
  );

  npc.add(
    createBox(
      new THREE.BoxGeometry(1.1, 0.18, 1.1),
      hat,
      [0, 3.35, 0]
    )
  );

  npc.add(
    createBox(
      new THREE.BoxGeometry(0.42, 1.1, 0.48),
      pants,
      [-0.28, 0.62, 0]
    )
  );

  npc.add(
    createBox(
      new THREE.BoxGeometry(0.42, 1.1, 0.48),
      pants,
      [0.28, 0.62, 0]
    )
  );

  const exclamation = addTextSprite("!", {
    color: "#ffd21c",
    background: "rgba(20,20,20,.85)",
    fontSize: 80,
    padding: 12,
  });

  exclamation.position.set(0, 5.0, 0);
  exclamation.scale.set(1.15, 1.15, 1.15);

  npc.add(exclamation);

  npc.userData.interactable = true;

  return npc;
}

function createBuilding(scene, x, z, width, depth, height, color, label) {
  const building = new THREE.Group();

  const main = createBox(
    new THREE.BoxGeometry(width, height, depth),
    makeMaterial(color),
    [0, height / 2, 0]
  );

  building.add(main);

  const roof = createBox(
    new THREE.BoxGeometry(width + 0.5, 0.35, depth + 0.5),
    makeMaterial(0x292929),
    [0, height + 0.15, 0]
  );

  building.add(roof);

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < Math.max(2, Math.floor(width / 3)); col++) {
      const window = createBox(
        new THREE.BoxGeometry(0.85, 0.8, 0.08),
        makeMaterial(0x5c7c91, 0.25),
        [
          -width / 2 + 1.3 + col * 2.5,
          2.2 + row * 2.4,
          -depth / 2 - 0.04,
        ]
      );

      building.add(window);
    }
  }

  if (label) {
    const sprite = addTextSprite(label, {
      color: "#ffffff",
      background: "rgba(10,10,10,.8)",
      fontSize: 34,
    });

    sprite.position.set(0, height + 1.2, -depth / 2 - 0.2);
    sprite.scale.set(2.6, 0.65, 1);

    building.add(sprite);
  }

  building.position.set(x, 0, z);

  scene.add(building);

  return {
    x,
    z,
    width,
    depth,
    height,
  };
}

function createTree(scene, x, z) {
  const tree = new THREE.Group();

  const trunk = createBox(
    new THREE.CylinderGeometry(0.22, 0.3, 2, 8),
    makeMaterial(0x65432b),
    [0, 1, 0]
  );

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(1.4, 10, 8),
    makeMaterial(0x287442)
  );

  leaves.position.set(0, 2.6, 0);
  leaves.castShadow = true;

  tree.add(trunk, leaves);

  tree.position.set(x, 0, z);

  scene.add(tree);
}

function createStreetLamp(scene, x, z) {
  const group = new THREE.Group();

  const pole = createBox(
    new THREE.CylinderGeometry(0.08, 0.1, 4.2, 8),
    makeMaterial(0x252525),
    [0, 2.1, 0]
  );

  const lamp = createBox(
    new THREE.SphereGeometry(0.25, 8, 8),
    makeMaterial(0xffe3a1),
    [0, 4.2, 0]
  );

  group.add(pole, lamp);
  group.position.set(x, 0, z);

  scene.add(group);
}

function createPlaza(scene) {
  const plaza = new THREE.Group();

  const base = createBox(
    new THREE.CylinderGeometry(14, 14, 0.18, 48),
    makeMaterial(0xbcb6aa),
    [0, 0.1, 0]
  );

  plaza.add(base);

  const inner = createBox(
    new THREE.CylinderGeometry(7, 7, 0.2, 48),
    makeMaterial(0x8c877e),
    [0, 0.25, 0]
  );

  plaza.add(inner);

  const monumentBase = createBox(
    new THREE.CylinderGeometry(2.2, 2.8, 0.9, 6),
    makeMaterial(0x555555),
    [0, 0.8, 0]
  );

  plaza.add(monumentBase);

  const triangleShape = new THREE.Shape();

  triangleShape.moveTo(0, 2.8);
  triangleShape.lineTo(-1.6, -1.2);
  triangleShape.lineTo(1.6, -1.2);
  triangleShape.closePath();

  const triangleGeometry = new THREE.ExtrudeGeometry(triangleShape, {
    depth: 0.5,
    bevelEnabled: false,
  });

  const triangle = new THREE.Mesh(
    triangleGeometry,
    makeMaterial(0xd8a82e)
  );

  triangle.rotation.x = -Math.PI / 2;
  triangle.position.set(0, 1.35, -0.25);
  triangle.castShadow = true;

  plaza.add(triangle);

  const title = addTextSprite("ITLOG PLAZA", {
    color: "#f8d35b",
    background: "rgba(15,15,15,.8)",
    fontSize: 42,
  });

  title.position.set(0, 3.8, 0);
  title.scale.set(3.8, 0.75, 1);

  plaza.add(title);

  scene.add(plaza);
}

function createRoad(scene, x, z, width, depth) {
  const road = createBox(
    new THREE.BoxGeometry(width, 0.08, depth),
    makeMaterial(0x383b3e),
    [x, 0.02, z]
  );

  scene.add(road);

  return road;
}

function createWorld(scene) {
  const ground = createBox(
    new THREE.BoxGeometry(WORLD.width, 0.15, WORLD.depth),
    makeMaterial(0x7b806f),
    [0, -0.08, 0]
  );

  scene.add(ground);

  createRoad(scene, 0, 0, 96, 12);
  createRoad(scene, 0, 0, 12, 96);

  createRoad(scene, -30, 0, 12, 96);
  createRoad(scene, 30, 0, 12, 96);

  createPlaza(scene);

  createBuilding(scene, -22, -22, 17, 13, 8, 0x918477, "BARANGAY HALL");
  createBuilding(scene, 22, -22, 17, 13, 7, 0x746b64, "COMMUNITY CENTER");

  createBuilding(scene, -22, 22, 17, 13, 6, 0x9c7358, "SARI-SARI STORE");
  createBuilding(scene, 22, 22, 17, 13, 8, 0x82766b, "ITLOG MARKET");

  createBuilding(scene, -42, -20, 10, 14, 5, 0x775d51, "STORE");
  createBuilding(scene, 42, -20, 10, 14, 5, 0x7e7064, "SHOP");

  createBuilding(scene, -42, 20, 10, 14, 5, 0x856957, "STORE");
  createBuilding(scene, 42, 20, 10, 14, 5, 0x74675e, "SHOP");

  const treePositions = [
    [-14, -14],
    [14, -14],
    [-14, 14],
    [14, 14],
    [-39, -8],
    [39, -8],
    [-39, 8],
    [39, 8],
  ];

  treePositions.forEach(([x, z]) => createTree(scene, x, z));

  const lamps = [
    [-8, -8],
    [8, -8],
    [-8, 8],
    [8, 8],
    [-26, -8],
    [26, -8],
    [-26, 8],
    [26, 8],
  ];

  lamps.forEach(([x, z]) => createStreetLamp(scene, x, z));

  for (let i = -40; i <= 40; i += 8) {
    if (Math.abs(i) > 16) {
      const line = createBox(
        new THREE.BoxGeometry(3, 0.025, 0.16),
        makeMaterial(0xe7d48b),
        [i, 0.065, 0]
      );

      scene.add(line);

      const line2 = createBox(
        new THREE.BoxGeometry(0.16, 0.025, 3),
        makeMaterial(0xe7d48b),
        [0, 0.065, i]
      );

      scene.add(line2);
    }
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function App() {
  const mountRef = useRef(null);

  const keys = useRef({});
  const joystick = useRef({
    active: false,
    x: 0,
    y: 0,
  });

  const cameraTouch = useRef({
    active: false,
    x: 0,
    y: 0,
  });

  const gameRef = useRef({
    player: null,
    npc: null,
    camera: null,
    scene: null,
    renderer: null,
    velocityY: 0,
    grounded: true,
    cameraYaw: 0,
    cameraPitch: 0.35,
    missionStarted: false,
    missionComplete: false,
    objective: 0,
    coins: 0,
    interactCooldown: 0,
  });

  const [coins, setCoins] = useState(0);
  const [missionState, setMissionState] = useState("Talk to Mang Lito");
  const [missionProgress, setMissionProgress] = useState(0);
  const [dialogue, setDialogue] = useState(null);
  const [nearNPC, setNearNPC] = useState(false);
  const [health] = useState(100);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) return;

    const scene = new THREE.Scene();

    scene.background = new THREE.Color(0x8fc8ed);

    scene.fog = new THREE.Fog(0x8fc8ed, 45, 115);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      300
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mount.appendChild(renderer.domElement);

    const ambient = new THREE.HemisphereLight(
      0xffffff,
      0x556677,
      2.2
    );

    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 2.5);

    sun.position.set(-30, 55, 25);
    sun.castShadow = true;

    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;

    sun.shadow.camera.left = -70;
    sun.shadow.camera.right = 70;
    sun.shadow.camera.top = 70;
    sun.shadow.camera.bottom = -70;

    scene.add(sun);

    createWorld(scene);

    const player = createPlayer();

    player.position.set(0, 0, 27);

    scene.add(player);

    const npc = createNPC();

    npc.position.set(7, 0, 4);

    scene.add(npc);

    camera.position.set(0, 7, 36);

    gameRef.current.player = player;
    gameRef.current.npc = npc;
    gameRef.current.camera = camera;
    gameRef.current.scene = scene;
    gameRef.current.renderer = renderer;

    const clock = new THREE.Clock();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    const onKeyDown = (event) => {
      keys.current[event.code] = true;

      if (
        event.code === "Space" &&
        gameRef.current.grounded
      ) {
        gameRef.current.velocityY = JUMP_POWER;
        gameRef.current.grounded = false;
      }

      if (event.code === "KeyE") {
        interact();
      }
    };

    const onKeyUp = (event) => {
      keys.current[event.code] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const animate = () => {
      requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.05);
      const game = gameRef.current;

      if (!game.player) return;

      let moveX = 0;
      let moveZ = 0;

      if (keys.current.KeyW || keys.current.ArrowUp) {
        moveZ -= 1;
      }

      if (keys.current.KeyS || keys.current.ArrowDown) {
        moveZ += 1;
      }

      if (keys.current.KeyA || keys.current.ArrowLeft) {
        moveX -= 1;
      }

      if (keys.current.KeyD || keys.current.ArrowRight) {
        moveX += 1;
      }

      if (joystick.current.active) {
        moveX += joystick.current.x;
        moveZ += joystick.current.y;
      }

      const direction = new THREE.Vector3(
        moveX,
        0,
        moveZ
      );

      if (direction.lengthSq() > 1) {
        direction.normalize();
      }

      const yaw = game.cameraYaw;

      const rotatedX =
        direction.x * Math.cos(yaw) -
        direction.z * Math.sin(yaw);

      const rotatedZ =
        direction.x * Math.sin(yaw) +
        direction.z * Math.cos(yaw);

      game.player.position.x += rotatedX * PLAYER_SPEED * delta;
      game.player.position.z += rotatedZ * PLAYER_SPEED * delta;

      game.player.position.x = clamp(
        game.player.position.x,
        -45,
        45
      );

      game.player.position.z = clamp(
        game.player.position.z,
        -45,
        45
      );

      if (direction.lengthSq() > 0.01) {
        const targetRotation =
          Math.atan2(rotatedX, rotatedZ);

        game.player.rotation.y = THREE.MathUtils.lerp(
          game.player.rotation.y,
          targetRotation,
          0.18
        );
      }

      game.velocityY -= GRAVITY * delta;

      game.player.position.y +=
        game.velocityY * delta;

      if (game.player.position.y <= 0) {
        game.player.position.y = 0;
        game.velocityY = 0;
        game.grounded = true;
      }

      const target = game.player.position.clone();

      target.y += 2.0;

      const cameraDistance = 9;

      const cameraOffset = new THREE.Vector3(
        Math.sin(game.cameraYaw) *
          Math.cos(game.cameraPitch) *
          cameraDistance,

        Math.sin(game.cameraPitch) *
          cameraDistance +
          2.5,

        Math.cos(game.cameraYaw) *
          Math.cos(game.cameraPitch) *
          cameraDistance
      );

      const desiredCamera = target
        .clone()
        .add(cameraOffset);

      camera.position.lerp(desiredCamera, 0.12);

      camera.lookAt(target);

      const distanceToNPC =
        game.player.position.distanceTo(
          game.npc.position
        );

      setNearNPC(distanceToNPC < 5);

      if (game.interactCooldown > 0) {
        game.interactCooldown -= delta;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);

      renderer.dispose();

      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  const interact = () => {
    const game = gameRef.current;

    if (!game.player || !game.npc) return;

    if (game.interactCooldown > 0) return;

    const distance =
      game.player.position.distanceTo(
        game.npc.position
      );

    if (distance > 5) return;

    game.interactCooldown = 0.5;

    if (!game.missionStarted) {
      game.missionStarted = true;

      setMissionState("Linisin ang ITLOG Plaza");
      setMissionProgress(1);

      setDialogue({
        name: "Mang Lito",
        text:
          "Ayos! Ikaw ang kailangan ko. May mga bagay na kailangang ayusin sa plaza. Puntahan mo ang mga marker at bumalik sa akin.",
      });

      return;
    }

    if (!game.missionComplete) {
      game.missionComplete = true;
      game.coins += 250;

      setCoins(game.coins);
      setMissionProgress(5);
      setMissionState("Mission Complete!");

      setDialogue({
        name: "Mang Lito",
        text:
          "Magaling! Natapos mo ang unang misyon ng ITLOG District. Narito ang iyong reward.",
      });

      return;
    }

    setDialogue({
      name: "Mang Lito",
      text:
        "Marami pang misyon ang naghihintay sa ITLOG.",
    });
  };

  const handleJoystickStart = (event) => {
    event.preventDefault();

    joystick.current.active = true;

    updateJoystick(event);
  };

  const handleJoystickMove = (event) => {
    event.preventDefault();

    if (!joystick.current.active) return;

    updateJoystick(event);
  };

  const handleJoystickEnd = () => {
    joystick.current.active = false;
    joystick.current.x = 0;
    joystick.current.y = 0;
  };

  const updateJoystick = (event) => {
    const touch =
      event.touches?.[0] || event;

    const element =
      document.getElementById("joystick");

    if (!element) return;

    const rect =
      element.getBoundingClientRect();

    const centerX =
      rect.left + rect.width / 2;

    const centerY =
      rect.top + rect.height / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;

    const radius = rect.width * 0.36;

    const distance = Math.min(
      Math.sqrt(dx * dx + dy * dy),
      radius
    );

    const angle = Math.atan2(dy, dx);

    joystick.current.x =
      Math.cos(angle) * (distance / radius);

    joystick.current.y =
      Math.sin(angle) * (distance / radius);
  };

  const handleCameraStart = (event) => {
    const touch = event.touches?.[0];

    if (!touch) return;

    cameraTouch.current.active = true;
    cameraTouch.current.x = touch.clientX;
    cameraTouch.current.y = touch.clientY;
  };

  const handleCameraMove = (event) => {
    if (!cameraTouch.current.active) return;

    const touch = event.touches?.[0];

    if (!touch) return;

    const dx =
      touch.clientX - cameraTouch.current.x;

    const dy =
      touch.clientY - cameraTouch.current.y;

    cameraTouch.current.x = touch.clientX;
    cameraTouch.current.y = touch.clientY;

    gameRef.current.cameraYaw -= dx * 0.006;

    gameRef.current.cameraPitch -= dy * 0.004;

    gameRef.current.cameraPitch = clamp(
      gameRef.current.cameraPitch,
      -0.15,
      0.9
    );
  };

  const handleCameraEnd = () => {
    cameraTouch.current.active = false;
  };

  return (
    <div className="itlog-game">
      <div
        ref={mountRef}
        className="game-canvas"
        onTouchStart={handleCameraStart}
        onTouchMove={handleCameraMove}
        onTouchEnd={handleCameraEnd}
      />

      <div className="top-bar">
        <div className="brand">
          <div className="brand-mark">
            ◇
          </div>

          <div>
            <strong>ITLOG</strong>
            <span>DISTRICT 1</span>
          </div>
        </div>

        <div className="currency">
          <div className="coin">
            🪙
          </div>

          <strong>{coins.toLocaleString()}</strong>
        </div>

        <button
          className="menu-button"
          onClick={() =>
            setMenuOpen(!menuOpen)
          }
        >
          ☰
        </button>
      </div>

      <div className="mission-card">
        <div className="mission-title">
          CURRENT MISSION
        </div>

        <div className="mission-name">
          {missionState}
        </div>

        <div className="mission-progress-row">
          <span>
            {missionProgress}/5
          </span>
        </div>

        <div className="progress">
          <div
            style={{
              width: `${(missionProgress / 5) * 100}%`,
            }}
          />
        </div>

        <div className="reward">
          <span>REWARD</span>
          <strong>🪙 250</strong>
        </div>
      </div>

      <div className="player-card">
        <div className="avatar">
          👤
        </div>

        <div className="player-info">
          <strong>Player</strong>
          <span>Level 1</span>

          <div className="health">
            <div
              style={{
                width: `${health}%`,
              }}
            />
          </div>

          <small>
            {health}/100
          </small>
        </div>
      </div>

      {nearNPC && (
        <button
          className="interaction-prompt"
          onClick={interact}
        >
          <span>✋</span>
          <strong>INTERACT</strong>
          <small>Talk to Mang Lito</small>
        </button>
      )}

      <div
        id="joystick"
        className="joystick"
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        onTouchCancel={handleJoystickEnd}
      >
        <div className="joystick-ring">
          <div className="joystick-knob" />
        </div>
      </div>

      <button
        className="jump-button"
        onClick={() => {
          if (gameRef.current.grounded) {
            gameRef.current.velocityY =
              JUMP_POWER;

            gameRef.current.grounded = false;
          }
        }}
      >
        <span>🏃</span>
        JUMP
      </button>

      {dialogue && (
        <div className="dialogue-overlay">
          <div className="dialogue-box">
            <div className="dialogue-avatar">
              👨🏽
            </div>

            <div className="dialogue-content">
              <strong>
                {dialogue.name}
              </strong>

              <p>
                {dialogue.text}
              </p>

              <button
                onClick={() =>
                  setDialogue(null)
                }
              >
                CONTINUE
              </button>
            </div>
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="menu-panel">
          <div className="menu-header">
            <strong>ITLOG</strong>

            <button
              onClick={() =>
                setMenuOpen(false)
              }
            >
              ×
            </button>
          </div>

          <button>🎒 INVENTORY</button>
          <button>📋 MISSIONS</button>
          <button>🗺️ MAP</button>
          <button>👤 CHARACTER</button>
          <button>⚙️ SETTINGS</button>
        </div>
      )}

      <div className="controls-help">
        <span>WASD / ARROWS — MOVE</span>
        <span>SPACE — JUMP</span>
        <span>E — INTERACT</span>
      </div>

      <div className="location-label">
        <span>ITLOG DISTRICT 1</span>
        <strong>TOWN PLAZA</strong>
      </div>
    </div>
  );
}
