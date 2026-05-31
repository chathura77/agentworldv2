import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { World } from "../../sim";
import type { Creature } from "../../sim/entities/Creature";
import { IntelCreature } from "../../sim/entities/IntelCreature";
import type { Plant } from "../../sim/entities/Plant";
import type { PlantType, Position } from "../../sim/entities/types";
import type { OverlaySettings } from "../../state/useSimulationController";
import { buildAdvancedOverlayScene } from "./advancedScene";

interface AdvancedWorld3DProps {
  overlays: OverlaySettings;
  onSelectCreature: (id: string) => void;
  selectedCreatureId: string | null;
  tick: number;
  world: World;
}

interface SceneHandles {
  animationId: number;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  dynamicGroup: THREE.Group;
  raycaster: THREE.Raycaster;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  selectable: THREE.Object3D[];
  staticGroup: THREE.Group;
}

const plantColors: Record<PlantType, number> = {
  green: 0x35b86b,
  red: 0xd84d4d,
  yellow: 0xf0cd4a,
  magenta: 0xd747b7,
};

export function AdvancedWorld3D({
  overlays,
  onSelectCreature,
  selectedCreatureId,
  tick,
  world,
}: AdvancedWorld3DProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const handlesRef = useRef<SceneHandles | null>(null);
  const onSelectRef = useRef(onSelectCreature);
  onSelectRef.current = onSelectCreature;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfd8ee);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    const maxGrid = Math.max(world.grid.width, world.grid.height);
    const cameraFar = Math.max(100, maxGrid * 8);
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, cameraFar);
    camera.position.set(maxGrid * 0.55, maxGrid * 1.15, maxGrid * 1.25);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.minDistance = 4;
    controls.maxDistance = Math.max(28, maxGrid * 3.2);
    controls.target.set(0, 0, 0);
    controls.update();

    const ambient = new THREE.HemisphereLight(0xe8f5ff, 0x51613d, 2.2);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff3cf, 3.2);
    sun.position.set(-4, 9, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);

    const fill = new THREE.PointLight(0x78a7ff, 3.8, 16);
    fill.position.set(4, 3, -4);
    scene.add(fill);

    const staticGroup = new THREE.Group();
    const dynamicGroup = new THREE.Group();
    scene.add(staticGroup, dynamicGroup);
    buildStaticScene(staticGroup, world);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const selectable: THREE.Object3D[] = [];

    const handlePointerDown = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(selectable, true)[0];
      const creatureId = hit?.object.userData.creatureId as string | undefined;
      if (creatureId) {
        onSelectRef.current(creatureId);
      }
    };
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const width = Math.max(320, rect.width);
      const height = Math.max(320, rect.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    let start = performance.now();
    const animate = (now: number) => {
      const elapsed = (now - start) / 1000;
      start = now;
      dynamicGroup.children.forEach((child) => {
        if (child.userData.float) {
          child.position.y += Math.sin(now * 0.003 + child.id) * 0.0015;
          child.rotation.y += elapsed * 0.7;
        }
      });
      controls.update();
      renderer.render(scene, camera);
      const handles = handlesRef.current;
      if (handles) {
        handles.animationId = requestAnimationFrame(animate);
      }
    };

    handlesRef.current = {
      animationId: requestAnimationFrame(animate),
      camera,
      controls,
      dynamicGroup,
      raycaster,
      renderer,
      scene,
      selectable,
      staticGroup,
    };

    return () => {
      const handles = handlesRef.current;
      if (handles) {
        cancelAnimationFrame(handles.animationId);
      }
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      controls.dispose();
      disposeObject(staticGroup);
      disposeObject(dynamicGroup);
      renderer.dispose();
      renderer.domElement.remove();
      handlesRef.current = null;
    };
  }, [world, world.grid.height, world.grid.width]);

  useEffect(() => {
    const handles = handlesRef.current;
    if (!handles) {
      return;
    }

    handles.selectable.length = 0;
    disposeObject(handles.dynamicGroup);
    handles.dynamicGroup.clear();
    buildDynamicScene(
      handles.dynamicGroup,
      handles.selectable,
      world,
      overlays,
      selectedCreatureId,
    );
  }, [overlays, selectedCreatureId, tick, world]);

  const season = world.getSeasonState();

  return (
    <div className="advancedWorld" aria-label="Advanced 3D AgentWorld">
      <div className="advancedViewport" ref={hostRef} />
      <div className="advancedHud">
        <span>3D environment</span>
        <span>{season.name}</span>
        <span>fertility {world.getStats().averageFertility.toFixed(2)}</span>
        <span>orbit, pan, zoom</span>
      </div>
    </div>
  );
}

function buildStaticScene(group: THREE.Group, world: World) {
  const width = world.grid.width;
  const height = world.grid.height;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height, width, height),
    new THREE.MeshStandardMaterial({
      color: 0x6fa15d,
      roughness: 0.95,
      metalness: 0.02,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  const grid = new THREE.GridHelper(Math.max(width, height), Math.max(width, height), 0x24412f, 0x86a778);
  grid.position.y = 0.015;
  group.add(grid);

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.42, height * 0.18),
    new THREE.MeshStandardMaterial({
      color: 0x3a98c8,
      emissive: 0x0a3952,
      emissiveIntensity: 0.22,
      metalness: 0.05,
      roughness: 0.35,
      transparent: true,
      opacity: 0.78,
    }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(-width * 0.24, 0.022, height * 0.28);
  group.add(water);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if ((x * 17 + y * 11) % 23 === 0) {
        const rock = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.16 + ((x + y) % 3) * 0.035, 0),
          new THREE.MeshStandardMaterial({ color: 0x8d948c, roughness: 0.9 }),
        );
        rock.castShadow = true;
        rock.position.copy(cellToWorld({ x, y }, width, height));
        rock.position.x += 0.25;
        rock.position.z -= 0.22;
        rock.position.y = 0.12;
        group.add(rock);
      }
    }
  }
}

function buildDynamicScene(
  group: THREE.Group,
  selectable: THREE.Object3D[],
  world: World,
  overlays: OverlaySettings,
  selectedCreatureId: string | null,
) {
  const overlayScene = buildAdvancedOverlayScene(world, overlays, selectedCreatureId);

  for (const fertilityCell of overlayScene.fertilityCells) {
    group.add(createFertilityOverlay(fertilityCell.position, fertilityCell.fertility, world));
  }

  for (const plant of world.plants) {
    group.add(createPlantObject(plant, world));
  }

  for (const creature of world.creatures) {
    if (!creature.alive) {
      continue;
    }
    const object = createCreatureObject(
      creature,
      world,
      creature.id === selectedCreatureId,
      overlays.energy,
    );
    selectable.push(object);
    group.add(object);
  }

  for (const memory of overlayScene.memoryMarkers) {
    group.add(createMemoryMarker(memory.position, memory.confidence, memory.kind, world));
  }

  for (const line of overlayScene.lines) {
    group.add(createOverlayLine(line.from, line.to, line.kind, line.selected, world));
  }

  if (overlayScene.focusMarker) {
    group.add(createFocusMarker(overlayScene.focusMarker.current, selectedCreatureId !== null, world));
    group.add(createFacingMarker(overlayScene.focusMarker.facing, world));
  }
}

function createPlantObject(plant: Plant, world: World): THREE.Group {
  const group = new THREE.Group();
  group.position.copy(cellToWorld(plant.position, world.grid.width, world.grid.height));
  group.userData.float = true;

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.045, 0.38, 8),
    new THREE.MeshStandardMaterial({ color: 0x315b2c, roughness: 0.8 }),
  );
  stem.position.y = 0.2;
  stem.castShadow = true;
  group.add(stem);

  const leafMaterial = new THREE.MeshStandardMaterial({
    color: plantColors[plant.type],
    emissive: plantColors[plant.type],
    emissiveIntensity: 0.18,
    roughness: 0.55,
  });
  const bud = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), leafMaterial);
  bud.position.y = 0.46;
  bud.castShadow = true;
  group.add(bud);

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 16, 16),
    new THREE.MeshBasicMaterial({
      color: plantColors[plant.type],
      transparent: true,
      opacity: 0.12,
    }),
  );
  glow.position.y = 0.46;
  group.add(glow);

  return group;
}

function createCreatureObject(
  creature: Creature,
  world: World,
  selected: boolean,
  showEnergy: boolean,
): THREE.Group {
  const group = new THREE.Group();
  group.position.copy(cellToWorld(creature.position, world.grid.width, world.grid.height));
  group.userData.float = true;
  group.userData.creatureId = creature.id;

  const bodyColor =
    creature instanceof IntelCreature
      ? creature.isLeader
        ? 0x9b7a05
        : creature.isPartner
          ? 0xffe070
          : 0xd64b36
      : 0x2f6eea;
  const accent = creature instanceof IntelCreature ? 0x202833 : 0x9bc2ff;
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.18, 0.42, 6, 12),
    new THREE.MeshStandardMaterial({
      color: bodyColor,
      emissive: selected ? 0x1f9d73 : 0x000000,
      emissiveIntensity: selected ? 0.36 : 0,
      metalness: 0.08,
      roughness: 0.42,
    }),
  );
  body.position.y = 0.45;
  body.castShadow = true;
  body.userData.creatureId = creature.id;
  group.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 18, 18),
    new THREE.MeshStandardMaterial({ color: accent, roughness: 0.35 }),
  );
  head.position.y = 0.86;
  head.castShadow = true;
  head.userData.creatureId = creature.id;
  group.add(head);

  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), eyeMaterial);
  leftEye.position.set(-0.06, 0.9, 0.14);
  const rightEye = leftEye.clone();
  rightEye.position.x = 0.06;
  group.add(leftEye, rightEye);

  if (showEnergy) {
    const energyRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.27, 0.018, 8, 36),
      new THREE.MeshBasicMaterial({
        color: creature.energy < world.config.hungerThreshold ? 0xff4545 : 0x7df0a5,
      }),
    );
    energyRing.rotation.x = Math.PI / 2;
    energyRing.position.y = 0.06;
    group.add(energyRing);
  }

  const facingVector = directionVector(creature.facing);
  group.rotation.y = Math.atan2(facingVector.x, facingVector.z);

  return group;
}

function createFertilityOverlay(
  position: Position,
  fertility: number,
  world: World,
): THREE.Mesh {
  const color = new THREE.Color(0xf3e6d8).lerp(new THREE.Color(0xdaf2d9), fertility);
  const tile = new THREE.Mesh(
    new THREE.PlaneGeometry(0.92, 0.92),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
    }),
  );
  tile.rotation.x = -Math.PI / 2;
  tile.position.copy(cellToWorld(position, world.grid.width, world.grid.height));
  tile.position.y = 0.03;
  return tile;
}

function createMemoryMarker(
  position: Position,
  confidence: number,
  kind: "plant" | "creature",
  world: World,
): THREE.Mesh {
  const marker = new THREE.Mesh(
    new THREE.RingGeometry(kind === "plant" ? 0.24 : 0.14, kind === "plant" ? 0.3 : 0.22, 24),
    new THREE.MeshBasicMaterial({
      color: kind === "plant" ? 0x54a3ff : 0x2bb673,
      transparent: true,
      opacity: Math.max(0.25, confidence),
      side: THREE.DoubleSide,
    }),
  );
  marker.rotation.x = -Math.PI / 2;
  marker.position.copy(cellToWorld(position, world.grid.width, world.grid.height));
  marker.position.y = kind === "plant" ? 0.035 : 0.055;
  return marker;
}

function createOverlayLine(
  fromPosition: Position,
  toPosition: Position,
  kind: "intent" | "relationship" | "previous" | "facing" | "target" | "linked",
  selected: boolean,
  world: World,
): THREE.Line {
  const start = cellToWorld(fromPosition, world.grid.width, world.grid.height);
  const end = cellToWorld(toPosition, world.grid.width, world.grid.height);
  start.y = lineHeight(kind);
  end.y = lineHeight(kind);
  const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
  const material = new THREE.LineBasicMaterial({
    color: lineColor(kind),
    transparent: true,
    opacity: selected ? 0.95 : lineOpacity(kind),
  });
  return new THREE.Line(geometry, material);
}

function createFocusMarker(
  position: Position,
  selected: boolean,
  world: World,
): THREE.Mesh {
  const marker = new THREE.Mesh(
    new THREE.TorusGeometry(0.32, 0.025, 8, 32),
    new THREE.MeshBasicMaterial({
      color: 0x1f9d73,
      transparent: true,
      opacity: selected ? 0.92 : 0.72,
    }),
  );
  marker.rotation.x = Math.PI / 2;
  marker.position.copy(cellToWorld(position, world.grid.width, world.grid.height));
  marker.position.y = 0.08;
  return marker;
}

function createFacingMarker(position: Position, world: World): THREE.Mesh {
  const marker = new THREE.Mesh(
    new THREE.ConeGeometry(0.11, 0.22, 12),
    new THREE.MeshBasicMaterial({
      color: 0x0f766e,
      transparent: true,
      opacity: 0.9,
    }),
  );
  marker.position.copy(cellToWorld(position, world.grid.width, world.grid.height));
  marker.position.y = 0.24;
  return marker;
}

function cellToWorld(position: Position, width: number, height: number): THREE.Vector3 {
  return new THREE.Vector3(
    position.x - width / 2 + 0.5,
    0,
    position.y - height / 2 + 0.5,
  );
}

function directionVector(direction: string): { x: number; z: number } {
  switch (direction) {
    case "north":
      return { x: 0, z: -1 };
    case "northEast":
      return { x: 1, z: -1 };
    case "east":
      return { x: 1, z: 0 };
    case "southEast":
      return { x: 1, z: 1 };
    case "south":
      return { x: 0, z: 1 };
    case "southWest":
      return { x: -1, z: 1 };
    case "west":
      return { x: -1, z: 0 };
    case "northWest":
      return { x: -1, z: -1 };
    default:
      return { x: 0, z: 1 };
  }
}

function lineColor(kind: "intent" | "relationship" | "previous" | "facing" | "target" | "linked") {
  switch (kind) {
    case "intent":
      return 0xf97316;
    case "relationship":
      return 0xffdf5d;
    case "previous":
      return 0x7c3aed;
    case "facing":
      return 0x0f766e;
    case "target":
      return 0xf59e0b;
    case "linked":
      return 0x9b7a05;
    default:
      return 0xffffff;
  }
}

function lineOpacity(kind: "intent" | "relationship" | "previous" | "facing" | "target" | "linked") {
  switch (kind) {
    case "intent":
      return 0.5;
    case "relationship":
      return 0.82;
    case "previous":
    case "facing":
      return 0.88;
    case "target":
      return 0.76;
    case "linked":
      return 0.56;
    default:
      return 0.75;
  }
}

function lineHeight(kind: "intent" | "relationship" | "previous" | "facing" | "target" | "linked") {
  switch (kind) {
    case "relationship":
      return 0.72;
    case "intent":
      return 0.64;
    case "previous":
    case "facing":
      return 0.78;
    case "target":
      return 0.68;
    case "linked":
      return 0.74;
    default:
      return 0.7;
  }
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    const material = mesh.material;
    if (Array.isArray(material)) {
      material.forEach((item) => item.dispose());
    } else if (material) {
      material.dispose();
    }
  });
}
