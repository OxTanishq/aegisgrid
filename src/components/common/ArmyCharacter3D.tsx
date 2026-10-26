/**
 * AEGIS GRID — 3D Army Character Marker
 * Lightweight, procedural 3D stylized cartoon army characters powered by Three.js.
 * Renders high-performance game-quality models with full animations and customizable uniform camo.
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CharacterAnimationState, UniformColor } from '../../types';

interface ArmyCharacter3DProps {
  animationState?: CharacterAnimationState;
  uniformColor?: UniformColor;
  heading?: number; // 0 to 360 degrees
  inEmergency?: boolean;
  size?: number; // Canvas size in pixels (e.g. 80, 100, 120)
  interactive?: boolean;
}

export const ArmyCharacter3D: React.FC<ArmyCharacter3DProps> = ({
  animationState = 'idle',
  uniformColor = 'camo_green',
  heading = 0,
  inEmergency = false,
  size = 90,
  interactive = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Camera Setup
    const width = size;
    const height = size * 1.15;
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 4.2);
    camera.lookAt(0, 0.9, 0);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(3, 6, 4);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Emergency red spotlight if in emergency
    let emergencyLight: THREE.PointLight | null = null;
    if (inEmergency || animationState === 'emergency') {
      emergencyLight = new THREE.PointLight(0xff3333, 4, 8);
      emergencyLight.position.set(0, 2.5, 1);
      scene.add(emergencyLight);
    }

    // 4. Color Palette Mapping
    const getPalette = (colorKey: UniformColor) => {
      switch (colorKey) {
        case 'desert_tan':
          return {
            primary: 0xc2a676,
            secondary: 0x8e754c,
            vest: 0x6e5a38,
            skin: 0xd9a066,
            boots: 0x3d3024,
            helmet: 0xad9367,
          };
        case 'urban_navy':
          return {
            primary: 0x2b3e50,
            secondary: 0x1a2530,
            vest: 0x151e28,
            skin: 0xe0ac69,
            boots: 0x11161b,
            helmet: 0x32475c,
          };
        case 'stealth_black':
          return {
            primary: 0x252a30,
            secondary: 0x181b1f,
            vest: 0x111315,
            skin: 0xc68642,
            boots: 0x0c0e10,
            helmet: 0x2e343b,
          };
        case 'medic_white':
          return {
            primary: 0xebf0f5,
            secondary: 0xd0d7de,
            vest: 0xd63031, // Red Cross Vest
            skin: 0xf1c27d,
            boots: 0x2d3436,
            helmet: 0xffffff,
          };
        case 'camo_green':
        default:
          return {
            primary: 0x4f6d48,
            secondary: 0x364b31,
            vest: 0x2b3c27,
            skin: 0xd9a066,
            boots: 0x1f261d,
            helmet: 0x5b7e53,
          };
      }
    };

    const palette = getPalette(uniformColor);

    // Shared Materials
    const matPrimary = new THREE.MeshStandardMaterial({
      color: inEmergency ? 0xcc2222 : palette.primary,
      roughness: 0.6,
    });
    const matSecondary = new THREE.MeshStandardMaterial({
      color: inEmergency ? 0x881111 : palette.secondary,
      roughness: 0.7,
    });
    const matVest = new THREE.MeshStandardMaterial({
      color: inEmergency ? 0xff4444 : palette.vest,
      roughness: 0.5,
    });
    const matSkin = new THREE.MeshStandardMaterial({
      color: palette.skin,
      roughness: 0.5,
    });
    const matBoots = new THREE.MeshStandardMaterial({
      color: palette.boots,
      roughness: 0.8,
    });
    const matGoggles = new THREE.MeshStandardMaterial({
      color: inEmergency ? 0xff2222 : 0x22d3ee,
      roughness: 0.2,
      metalness: 0.8,
    });
    const matAntenna = new THREE.MeshStandardMaterial({
      color: 0x111111,
      metalness: 0.9,
    });

    // 5. Rigged Character Hierarchical Model Group
    const characterGroup = new THREE.Group();
    scene.add(characterGroup);

    // Ground Tactical Ring
    const groundRingGeo = new THREE.RingGeometry(0.55, 0.68, 32);
    const groundRingMat = new THREE.MeshBasicMaterial({
      color: inEmergency ? 0xff3b30 : 0x9fe870,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: inEmergency ? 0.9 : 0.65,
    });
    const groundRing = new THREE.Mesh(groundRingGeo, groundRingMat);
    groundRing.rotation.x = -Math.PI / 2;
    groundRing.position.y = 0.02;
    scene.add(groundRing);

    // Ground Center Disc
    const groundDiscGeo = new THREE.CircleGeometry(0.55, 32);
    const groundDiscMat = new THREE.MeshBasicMaterial({
      color: inEmergency ? 0xff0000 : 0x48ddf2,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: inEmergency ? 0.35 : 0.15,
    });
    const groundDisc = new THREE.Mesh(groundDiscGeo, groundDiscMat);
    groundDisc.rotation.x = -Math.PI / 2;
    groundDisc.position.y = 0.01;
    scene.add(groundDisc);

    // Heading Arrow Notch
    const arrowGeo = new THREE.ConeGeometry(0.12, 0.28, 3);
    const arrowMat = new THREE.MeshBasicMaterial({
      color: inEmergency ? 0xff3b30 : 0x48ddf2,
    });
    const arrowNotch = new THREE.Mesh(arrowGeo, arrowMat);
    arrowNotch.rotation.x = -Math.PI / 2;
    arrowNotch.position.set(0, 0.03, -0.68);
    scene.add(arrowNotch);

    // Torso (Plate carrier + Uniform shirt)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.54, 0.28), matPrimary);
    torso.position.y = 0.95;
    characterGroup.add(torso);

    // Tactical Vest
    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.42, 0.32), matVest);
    vest.position.y = 0.02;
    torso.add(vest);

    // Radio Pouch on Chest
    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.1), matSecondary);
    pouch.position.set(0.14, 0.02, 0.18);
    torso.add(pouch);

    // Backpack with Radio Antenna
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.4, 0.18), matSecondary);
    backpack.position.set(0, 0.04, -0.2);
    torso.add(backpack);

    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.45, 8), matAntenna);
    antenna.position.set(-0.12, 0.35, -0.22);
    torso.add(antenna);

    // Head Pivot & Head
    const headPivot = new THREE.Group();
    headPivot.position.y = 0.36;
    torso.add(headPivot);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.3), matSkin);
    head.position.y = 0.16;
    headPivot.add(head);

    // Helmet
    const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.2, 0.35), matSecondary);
    helmet.position.y = 0.14;
    head.add(helmet);

    // Helmet Goggles / Visor
    const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.06), matGoggles);
    goggles.position.set(0, 0.06, 0.17);
    head.add(goggles);

    // Left Arm Pivot
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.32, 0.22, 0);
    torso.add(leftArmPivot);

    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.46, 0.16), matPrimary);
    leftArm.position.y = -0.2;
    leftArmPivot.add(leftArm);

    // Right Arm Pivot
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.32, 0.22, 0);
    torso.add(rightArmPivot);

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.46, 0.16), matPrimary);
    rightArm.position.y = -0.2;
    rightArmPivot.add(rightArm);

    // Pelvis
    const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.24), matSecondary);
    pelvis.position.y = -0.32;
    torso.add(pelvis);

    // Left Leg Pivot
    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(-0.14, 0.65, 0);
    characterGroup.add(leftLegPivot);

    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.48, 0.18), matPrimary);
    leftLeg.position.y = -0.22;
    leftLegPivot.add(leftLeg);

    const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.16, 0.26), matBoots);
    leftBoot.position.set(0, -0.42, 0.04);
    leftLegPivot.add(leftBoot);

    // Right Leg Pivot
    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(0.14, 0.65, 0);
    characterGroup.add(rightLegPivot);

    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.48, 0.18), matPrimary);
    rightLeg.position.y = -0.22;
    rightLegPivot.add(rightLeg);

    const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.16, 0.26), matBoots);
    rightBoot.position.set(0, -0.42, 0.04);
    rightLegPivot.add(rightBoot);

    // Turn character to heading angle
    const targetHeadingRad = (heading * Math.PI) / 180;
    characterGroup.rotation.y = targetHeadingRad;
    arrowNotch.rotation.z = -targetHeadingRad;

    // 6. Animation Engine Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Pulsing Ground Ring
      const pulse = 1 + Math.sin(elapsed * 4) * 0.08;
      groundRing.scale.set(pulse, pulse, pulse);

      if (emergencyLight) {
        emergencyLight.intensity = 2.5 + Math.sin(elapsed * 8) * 2;
      }

      // State-Based Animations
      const activeState = inEmergency ? 'emergency' : (animationState || 'idle');
      switch (activeState) {
        case 'walking': {
          const walkSpeed = 5.5;
          const legSwing = Math.sin(elapsed * walkSpeed) * 0.55;
          leftLegPivot.rotation.x = legSwing;
          rightLegPivot.rotation.x = -legSwing;
          leftArmPivot.rotation.x = -legSwing * 0.8;
          rightArmPivot.rotation.x = legSwing * 0.8;
          torso.position.y = 0.95 + Math.abs(Math.sin(elapsed * walkSpeed * 2)) * 0.04;
          headPivot.rotation.y = Math.sin(elapsed * walkSpeed) * 0.1;
          antenna.rotation.z = Math.sin(elapsed * walkSpeed) * 0.08;
          break;
        }

        case 'running': {
          const runSpeed = 9.5;
          const runSwing = Math.sin(elapsed * runSpeed) * 0.85;
          leftLegPivot.rotation.x = runSwing;
          rightLegPivot.rotation.x = -runSwing;
          leftArmPivot.rotation.x = -runSwing * 1.1;
          rightArmPivot.rotation.x = runSwing * 1.1;
          torso.position.y = 0.93 + Math.abs(Math.sin(elapsed * runSpeed * 2)) * 0.08;
          torso.rotation.x = 0.15; // forward lean
          headPivot.rotation.x = -0.12;
          antenna.rotation.z = Math.sin(elapsed * runSpeed) * 0.2;
          break;
        }

        case 'resting': {
          torso.position.y = 0.65;
          leftLegPivot.position.y = 0.45;
          rightLegPivot.position.y = 0.45;
          leftLegPivot.rotation.x = -Math.PI / 2.2;
          rightLegPivot.rotation.x = -Math.PI / 2.2;
          leftArmPivot.rotation.x = -0.3;
          rightArmPivot.rotation.x = -0.3;
          headPivot.rotation.x = 0.15;
          break;
        }

        case 'off_duty': {
          torso.position.y = 0.55;
          torso.rotation.x = -0.2;
          headPivot.rotation.x = 0.35; // Head nodded down asleep
          leftLegPivot.position.y = 0.4;
          rightLegPivot.position.y = 0.4;
          leftLegPivot.rotation.x = -Math.PI / 2;
          rightLegPivot.rotation.x = -Math.PI / 2;
          leftArmPivot.rotation.z = 0.3;
          rightArmPivot.rotation.z = -0.3;
          break;
        }

        case 'helping': {
          torso.position.y = 0.72;
          torso.rotation.x = 0.25;
          leftLegPivot.position.y = 0.5;
          leftLegPivot.rotation.x = -Math.PI / 2.5; // Kneeling
          rightLegPivot.position.y = 0.5;
          rightLegPivot.rotation.x = -0.2;
          // Hands working forward
          leftArmPivot.rotation.x = -0.8;
          rightArmPivot.rotation.x = -0.8;
          leftArmPivot.rotation.y = 0.3;
          rightArmPivot.rotation.y = -0.3;
          headPivot.rotation.x = 0.3;
          break;
        }

        case 'emergency': {
          // Rapid waving distress signal + urgent torso vibration
          const wave = Math.sin(elapsed * 10);
          rightArmPivot.rotation.x = -Math.PI * 0.85;
          rightArmPivot.rotation.z = wave * 0.45;
          leftArmPivot.rotation.x = -0.3 + wave * 0.2;
          torso.position.y = 0.95 + Math.sin(elapsed * 6) * 0.05;
          torso.rotation.y = targetHeadingRad + Math.sin(elapsed * 8) * 0.15;
          headPivot.rotation.y = Math.sin(elapsed * 12) * 0.25;
          antenna.rotation.z = Math.sin(elapsed * 12) * 0.25;
          break;
        }

        case 'idle':
        default: {
          const breath = Math.sin(elapsed * 2.2);
          torso.position.y = 0.95 + breath * 0.015;
          torso.scale.set(1 + breath * 0.01, 1 + breath * 0.01, 1 + breath * 0.01);
          headPivot.rotation.y = Math.sin(elapsed * 0.8) * 0.12;
          leftArmPivot.rotation.x = Math.sin(elapsed * 1.5) * 0.05;
          rightArmPivot.rotation.x = -Math.sin(elapsed * 1.5) * 0.05;
          antenna.rotation.z = Math.sin(elapsed * 2) * 0.04;
          leftLegPivot.rotation.x = 0;
          rightLegPivot.rotation.x = 0;
          break;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      scene.clear();
    };
  }, [animationState, uniformColor, heading, inEmergency, size]);

  return (
    <div
      ref={mountRef}
      style={{ width: size, height: size * 1.15 }}
      className={`relative flex items-center justify-center select-none ${
        interactive ? 'cursor-pointer transition-transform hover:scale-105 active:scale-95' : ''
      }`}
    />
  );
};
