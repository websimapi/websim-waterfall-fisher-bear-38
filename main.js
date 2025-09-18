import * as THREE from 'three';
import { scene, camera, renderer, resizeRenderer, createLights, initOrbitControls, getOrbitControls } from './scene.js';
import { createBear, updateBear, BEAR_X_LIMIT } from './entities/bear.js';
import { createScenery } from './entities/scenery.js';
import { createWaterfall, updateWaterfall } from './entities/waterfall.js';
import { updateFish } from './entities/fish.js';
import { initAudio, playSFX, sounds, wireAudioUnlock } from './systems/audio.js';
import { initControls, getKeysPressed, updateBearTargetFromPointer } from './systems/controls.js';
import { initFishSpawner, updateFishSpawner, getActiveFishes, clearActiveFishes, checkFishCollisions } from './entities/fishSpawner.js';
import { initGameState, updateIdleAnimation, getGameState, getBear, fallGameOver, isNewUnlock, getFinalScore, getPlayerProgress, getShowcaseBear } from './systems/game.js';

// --- GAME OBJECTS (refactored) ---
const scenery = createScenery();
scene.add(scenery);
const waterfall = createWaterfall();
scene.add(waterfall);

// --- Dev tools ---
function createAxisLabel(text, position, color = 'black', size = 64) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const font = `bold ${size}px Arial`;
    context.font = font;
    const metrics = context.measureText(text);
    const textWidth = metrics.width;
    const padding = 10;

    canvas.width = textWidth + padding * 2;
    canvas.height = size + padding * 2;

    context.fillStyle = 'rgba(255, 255, 255, 0.7)';
    context.beginPath();
    context.roundRect(0, 0, canvas.width, canvas.height, [15]);
    context.fill();

    context.font = font;
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.copy(position);
    
    sprite.scale.set(canvas.width * 0.01, canvas.height * 0.01, 1.0);

    return sprite;
}

const devHelperGroup = new THREE.Group();
const axesHelper = new THREE.AxesHelper(5);
devHelperGroup.add(axesHelper);

const axisDistance = 5.5;
devHelperGroup.add(createAxisLabel('+X', new THREE.Vector3(axisDistance, 0, 0), '#ff0000'));
devHelperGroup.add(createAxisLabel('-X', new THREE.Vector3(-axisDistance, 0, 0), '#ff0000'));
devHelperGroup.add(createAxisLabel('+Y', new THREE.Vector3(0, axisDistance, 0), '#00ff00'));
devHelperGroup.add(createAxisLabel('-Y', new THREE.Vector3(0, -axisDistance, 0), '#00ff00'));
devHelperGroup.add(createAxisLabel('+Z', new THREE.Vector3(0, 0, axisDistance), '#0000ff'));
devHelperGroup.add(createAxisLabel('-Z', new THREE.Vector3(0, 0, -axisDistance), '#0000ff'));

devHelperGroup.visible = false;
scene.add(devHelperGroup);

// ensure lighting is present for Lambert materials
createLights(scene);

initGameState();
initControls(devHelperGroup);
initFishSpawner();
wireAudioUnlock(initAudio);

// --- CONTROLS (kept local for simplicity) ---
// removed raycaster, pointer, keysPressed, isDragging variables
// removed onPointerDown, onPointerMove, onPointerUp, updatePointer functions
// removed handleKeyDown, handleKeyUp, handleGlobalKeyUp functions

// mount renderer and handle sizing
import { mountRenderer } from './scene.js';
mountRenderer(document.getElementById('game-container'));
window.addEventListener('resize', resizeRenderer);

// --- GAME LOOP (trimmed) ---
const gravity = new THREE.Vector3(0, -0.05, 0);

function animate() {
    requestAnimationFrame(animate); // Ensure continuous rendering
    
    const controls = getOrbitControls();
    if (controls?.enabled) {
        controls.update();
    }
    
    const gameState = getGameState();
    const bear = getBear();

    updateWaterfall(waterfall);
    if (gameState.current === 'PLAYING') {
        if (!bear) { // Added guard in case something goes wrong
            renderer.render(scene, camera);
            return;
        };
        // Bear movement
        const keysPressed = getKeysPressed();
        let moveDirection = 0;
        if (keysPressed['a'] || keysPressed['ArrowLeft']) moveDirection = -1;
        else if (keysPressed['d'] || keysPressed['ArrowRight']) moveDirection = 1;
        updateBear(bear, moveDirection);
        updateBearTargetFromPointer(bear, gameState);

        // Fish
        updateFishSpawner(getPlayerProgress, gameState);
        checkFishCollisions(bear, gameState);
        
        getActiveFishes().forEach(f => updateFish(f));

    } else if (gameState.current === 'GAME_OVER') {
        if (bear && bear.position.y > -10) {
            bear.position.add(gravity);
            bear.rotation.z += 0.05;
        }
    } else { // IDLE (title screen)
        updateIdleAnimation(getShowcaseBear());
    }
    renderer.render(scene, camera);
}

// Start the animation loop
animate();