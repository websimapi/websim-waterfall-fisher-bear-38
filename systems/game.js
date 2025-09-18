import * as THREE from 'three';
import { scene } from '../scene.js';
import { createBear } from '../entities/bear.js';
import { createFish } from '../entities/fish.js';
import { bindUI, updateUIValues, showGameOver, showHUD, showStart, populateUnlocks } from './ui.js';
import { BEARS, FISH, getPlayerProgress as getPlayerProgressFromStorage, savePlayerProgress } from '../unlocks.js';
import { playSFX, sounds } from './audio.js';
import { clearActiveFishes } from '../entities/fishSpawner.js';

let playerProgress = getPlayerProgressFromStorage();
let gameState = { current: 'IDLE', score: 0, streak: 1, idleAnimTimer: 0 };
let bear = null;
let showcaseBear = null;
let showcaseFish = null;
let newUnlock = false;

const { startButton } = bindUI();

function refreshShowcase() {
    if (showcaseBear) { scene.remove(showcaseBear); showcaseBear = null; }
    if (showcaseFish) { 
        if(showcaseFish.parent) showcaseFish.parent.remove(showcaseFish);
        else scene.remove(showcaseFish); 
        showcaseFish = null; 
    }

    showcaseBear = createBear(playerProgress.selectedBear);
    showcaseBear.name = 'showcase-bear';
    showcaseBear.position.set(0, 4.65, 0.8);
    showcaseBear.rotation.set(0, 0, 0); // Face camera
    scene.add(showcaseBear);

    showcaseFish = createFish(scene, 0, playerProgress.selectedFish);
    showcaseFish.name = 'showcase-fish';

    const rightArm = showcaseBear.getObjectByName('rightArm');
    if (rightArm) {
        scene.remove(showcaseFish); // remove from main scene to add to arm
        rightArm.add(showcaseFish);
        showcaseFish.position.set(0.1, -0.7, 0.4);
        showcaseFish.rotation.set(-Math.PI / 4, Math.PI / 2, Math.PI);
        showcaseFish.scale.set(0.5, 0.5, 0.5);
    } else {
        showcaseFish.position.set(2.0, 2.3, -1.5);
    }

    if (showcaseFish.userData?.velocity) showcaseFish.userData.velocity.set(0, 0, 0);
    if (showcaseFish.userData) showcaseFish.userData.swimAmplitude = 0;
}

function setupStartScreen() {
    gameState.current = 'IDLE';
    if(bear) bear.visible = false;

    populateUnlocks(playerProgress, (type, id) => {
        if (type === 'bear') playerProgress.selectedBear = id;
        if (type === 'fish') playerProgress.selectedFish = id;
        savePlayerProgress(playerProgress);
        populateUnlocks(playerProgress, () => {}); // Re-populate to update selection visuals
        
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

    clearActiveFishes();
}

function gameOver() {
    gameState.current = 'GAME_OVER';
    document.getElementById('final-score').innerText = gameState.score;

    if (gameState.score > playerProgress.highScore) {
        playerProgress.highScore = gameState.score;
    }
    newUnlock = false;
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
    clearActiveFishes();

    setTimeout(() => {
        const goScreen = document.getElementById('game-over-screen');
        if (goScreen && !goScreen.classList.contains('hidden')) {
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

export function initGameState() {
    setupStartScreen();
    startButton.addEventListener('click', startGame);
}

export function getGameState() { return gameState; }
export function getPlayerProgress() { return playerProgress; }
export function getBear() { return bear; }
export function getShowcaseBear() { return showcaseBear; }
export function isNewUnlock() { return newUnlock; }
export function getFinalScore() { return gameState.score; }
export function fallGameOver() { gameOver(); }

export function updateIdleAnimation(sBear) {
    gameState.idleAnimTimer += 0.05;
    if (sBear) {
        const rightArm = sBear.getObjectByName('rightArm');
        if (rightArm) {
            const armBob = Math.sin(gameState.idleAnimTimer) * 0.1;
            rightArm.rotation.x = armBob;
        }
    }
}