
```javascript
import * as THREE from 'three';
import { scene, camera, getOrbitControls } from '../scene.js';
import { BEAR_X_LIMIT } from '../entities/bear.js';

let keysPressed = {};
let isDragging = false;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let devHelperGroupRef;

function updatePointer(event) {
    const eventCoord = event.changedTouches ? event.changedTouches[0] : event;
    pointer.x = (eventCoord.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(eventCoord.clientY / window.innerHeight) * 2 + 1;
}

function onPointerDown(event) {
    if (event.target.tagName === 'BUTTON') return;
    isDragging = true;
    updatePointer(event);
}

function onPointerMove(event) {
    if (!isDragging) return;
    updatePointer(event);
}

function onPointerUp() {
    isDragging = false;
}

function handleKeyDown(event) {
    keysPressed[event.key] = true;
    const bear = scene.getObjectByName('bear');
    if (bear && (event.key === 'a' || event.key === 'ArrowLeft' || event.key === 'd' || event.key === 'ArrowRight')) {
        bear.userData.isMovingWithKeys = true;
    }
}

function handleKeyUp(event) {
    keysPressed[event.key] = false;
    const bear = scene.getObjectByName('bear');
    if (bear && (event.key === 'a' || event.key === 'ArrowLeft' || event.key === 'd' || event.key === 'ArrowRight')) {
        if (!keysPressed['a'] && !keysPressed['ArrowLeft'] && !keysPressed['d'] && !keysPressed['ArrowRight']) {
            bear.userData.isMovingWithKeys = false;
        }
    }
}

function handleGlobalKeyUp(event) {
    const devConsoleButton = document.getElementById('dev-console-button');
    if (event.key === '`' || event.key === '~') {
        if (devConsoleButton) {
            devConsoleButton.classList.toggle('hidden');
            const controls = getOrbitControls();
            if (!devConsoleButton.classList.contains('hidden')) {
                 if (controls) controls.enabled = false;
                 if(devHelperGroupRef) devHelperGroupRef.visible = false;
                 devConsoleButton.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                 devConsoleButton.style.borderColor = 'white';
            } else {
                if (controls) controls.enabled = false;
                if(devHelperGroupRef) devHelperGroupRef.visible = false;
            }
        }
    }
}

function handleDevButtonClick() {
    const devConsoleButton = document.getElementById('dev-console-button');
    const controls = getOrbitControls();
    controls.enabled = !controls.enabled;
    if (devHelperGroupRef) devHelperGroupRef.visible = controls.enabled;
    
    if (controls.enabled) {
        devConsoleButton.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
        devConsoleButton.style.borderColor = '#ff8080';
    } else {
        devConsoleButton.classList.add('hidden');
    }
}

export function initControls(devGroup) {
    devHelperGroupRef = devGroup;
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('keyup', handleGlobalKeyUp);
    const devButton = document.getElementById('dev-console-button');
    if (devButton) devButton.addEventListener('click', handleDevButtonClick);
}

export function getKeysPressed() {
    return keysPressed;
}

export function updateBearTargetFromPointer(bear, gameState) {
    if (!isDragging || gameState.current !== 'PLAYING' || !bear) return;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    for (const intersect of intersects) {
        let object = intersect.object;
        let isLog = false;

        while (object.parent) {
            if (object.name === 'log') {
                isLog = true;
                break;
            }
            object = object.parent;
        }

        if (isLog) {
            bear.userData.targetX = THREE.MathUtils.clamp(intersect.point.x, -BEAR_X_LIMIT, BEAR_X_LIMIT);
            bear.userData.isMovingWithKeys = false;
            break; 
        }
    }
}