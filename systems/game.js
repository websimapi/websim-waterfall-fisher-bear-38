import * as THREE from 'three';
import { scene } from '../scene.js';
import { createBear, updateBear } from '../entities/bear.js';
import { createFish, updateFish } from '../entities/fish.js';
import { initAudio, playSFX, sounds, wireAudioUnlock } from './audio.js';
import { bindUI, updateUIValues, showGameOver, showHUD, showStart, populateUnlocks } from './ui.js';
import { BEARS, FISH, getPlayerProgress, savePlayerProgress } from '../unlocks.js';
import { updateSpawner, resetSpawner } from './fishSpawner.js';

// --- GAME OBJECTS ---
export let bear = null;
let showcaseBear = null;
let showcaseFish = null;
let activeFishes = [];

// --- UI & STATE ---
const { startButton } = bindUI();
let playerProgress = getPlayerProgress();
export let gameState = { current: 'IDLE', score: 0, streak: 1, idleAnimTimer: 0 };
const gravity = new THREE.Vector3(0, -0.05, 0);

function refreshShowcase() {
    if (showcaseBear) { scene.remove(showcaseBear); showcaseBear = null; }
    if (showcaseFish) { 
        if(showcaseFish.parent) showcaseFish.parent.remove(showcaseFish);
        else scene.remove(showcaseFish); 
        showcaseFish = null; 
    }
    // Bear showcase
    showcaseBear = createBear(playerProgress.selectedBear);
    showcaseBear.name = 'showcase-bear';
    showcaseBear.position.set(0, 4.65, 0.8);
    showcaseBear.rotation.set(0, 0, 0); // Face camera
    scene.add(showcaseBear);
    // Fish showcase
    showcaseFish = createFish(scene, 0, playerProgress.selectedFish);
    showcaseFish.name = 'showcase-fish';  

    // Attach fish to bear's hand
    const rightArm = showcaseBear.getObjectByName('rightArm');
    if (rightArm) {
        scene.remove(showcaseFish); // remove from main scene to add to arm
        rightArm.add(showcaseFish);
        showcaseFish.position.set(0.1, -0.7, 0.4);
        showcaseFish.rotation.set(-Math.PI / 4, Math.PI / 2, Math.PI);
        showcaseFish.scale.set(0.5, 0.5, 0.5);
    } else {
        // Fallback position if arm isn't found
        showcaseFish.position.set(2.0, 2.3, -1.5);
    }

    if (showcaseFish.userData?.velocity) showcaseFish.userData.velocity.set(0, 0, 0);
    if (showcaseFish.userData) showcaseFish.userData.swimAmplitude = 0;
}

function setupStartScreen() {
    gameState.current = 'IDLE';
    if(bear) bear.visible = false;
    activeFishes.forEach(f => scene.remove(f));
    activeFishes = [];

    populateUnlocks(playerProgress, (type, id) => {
        if (type === 'bear') playerProgress.selectedBear = id;
        if (type === 'fish') playerProgress.selectedFish = id;
        savePlayerProgress(playerProgress);

        const quickBearName = document.querySelector('#choose-bear span');
        const quickBearImg = document.querySelector('#choose-bear img');
        const quickFishName = document.querySelector('#choose-fish span');
        const quickFishImg = document.querySelector('#choose-fish img');

        const selectedBearInfo = BEARS.find(b => b.id === playerProgress.selectedBear);
        const selectedFishInfo = FISH.find(f => f.id === playerProgress.selectedFish);

        if(quickBearName) quickBearName.textContent = selectedBearInfo.name;
        if(quickBearImg) quickBearImg.src = selectedBearInfo.asset;
        if(quickFishName) quickFishName.textContent = selectedFishInfo.name;
        if(quickFishImg) quickFishImg.src = selectedFishInfo.asset;

        refreshShowcase();
    });
    refreshShowcase();
    showStart();
    startButton.innerText = 'START';
}

function startGame() {
    gameState = { current: 'PLAYING', score: 0, streak: 1 };
    if (showcaseBear) { scene.remove(showcaseBear); showcaseBear = null; }
    if (showcaseFish) { 
        if(showcaseFish.parent) showcaseFish.parent.remove(showcaseFish);
        else scene.remove(showcaseFish); 
        showcaseFish = null; 
    }

    if (bear) scene.remove(bear);
    bear = createBear(playerProgress.selectedBear);
    scene.add(bear);

    bear.position.x = 0;
    updateUIValues({ score: gameState.score, streak: gameState.streak });
    showHUD();
    try { initAudio(); } catch (e) { /* ignore */ }

    activeFishes.forEach(f => scene.remove(f));
    activeFishes = [];
    resetSpawner();
}

function gameOver() {
    gameState.current = 'GAME_OVER';
    document.getElementById('final-score').innerText = gameState.score;

    if (gameState.score > playerProgress.highScore) {
        playerProgress.highScore = gameState.score;
    }
    let newUnlock = false;
    BEARS.forEach(b => {
        if (!playerProgress.unlockedBears.includes(b.id) && b.unlockCondition.type === 'score' && playerProgress.highScore >= b.unlockCondition.value) {
            playerProgress.unlockedBears.push(b.id);
            newUnlock = true;
        }
    });
    FISH.forEach(f => {
        if (!playerProgress.unlockedFish.includes(f.id) && f.unlockCondition.type === 'score' && playerProgress.highScore >= f.unlockCondition.value) {
            playerProgress.unlockedFish.push(f.id);
            newUnlock = true;
        }
    });

    savePlayerProgress(playerProgress);

    showGameOver();
    playSFX(sounds.splash);
    activeFishes.forEach(f => scene.remove(f));
    activeFishes = [];

    setTimeout(() => {
        const goScreen = document.getElementById('game-over-screen');
        if (goScreen) {
            goScreen.classList.add('fade-out');
            const onFadeOut = () => {
                goScreen.removeEventListener('animationend', onFadeOut);
                setupStartScreen();
                startButton.innerText = 'RETRY';
            };
            goScreen.addEventListener('animationend', onFadeOut);
        }
    }, 2000);
}

export function initGame() {
    setupStartScreen();
    startButton.addEventListener('click', startGame);
    wireAudioUnlock(initAudio);
}

export function updateGame() {
    if (gameState.current === 'PLAYING') {
        if (!bear) return;

        updateBear(bear, 0); // Direction is now handled by controls

        updateSpawner(scene, activeFishes, gameState.score, playerProgress);

        const catchZ = -0.8, failZ = -0.4;
        for (let i = activeFishes.length - 1; i >= 0; i--) {
            const f = activeFishes[i];
            updateFish(f);
            if (f.position.z >= catchZ) {
                const withinX = Math.abs(f.position.x - bear.position.x) <= (bear.userData.netWidth || 1) / 2;
                if (withinX) {
                    playSFX(sounds.catch);
                    gameState.score += 10 * gameState.streak;
                    gameState.streak++;
                    updateUIValues({ score: gameState.score, streak: gameState.streak });
                    scene.remove(f); activeFishes.splice(i,1);
                } else if (f.position.z > failZ) {
                    gameState.streak = 1;
                    updateUIValues({ score: gameState.score, streak: gameState.streak });
                    scene.remove(f); activeFishes.splice(i,1);
                    gameOver(); break;
                }
            }
        }
    } else if (gameState.current === 'GAME_OVER') {
        if (bear && bear.position.y > -10) {
            bear.position.add(gravity);
            bear.rotation.z += 0.05;
        }
    } else { // IDLE
        gameState.idleAnimTimer += 0.05;
        if (showcaseBear) {
            const rightArm = showcaseBear.getObjectByName('rightArm');
            if (rightArm) {
                const armBob = Math.sin(gameState.idleAnimTimer) * 0.1;
                rightArm.rotation.x = armBob;
            }
        }
    }
}