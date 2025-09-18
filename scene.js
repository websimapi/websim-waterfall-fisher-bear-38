import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 50, 220);

export const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(0, 12, 9);
camera.lookAt(0, 2, 0);

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;

let controls;

export function initOrbitControls() {
    if (!controls) {
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enabled = false;
    }
    return controls;
}

export function getOrbitControls() {
    return controls;
}

export function resizeRenderer() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

export function createLights(targetScene) {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    targetScene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 5);
    targetScene.add(directionalLight);
}

export function mountRenderer(container) {
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    container.appendChild(renderer.domElement);
    resizeRenderer();
}