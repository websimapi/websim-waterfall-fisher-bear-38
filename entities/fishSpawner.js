import { createFish } from './fish.js';
import { scene } from '../scene.js';
import { FISH } from '../unlocks.js';
import { playSFX, sounds } from '../systems/audio.js';
import { updateUIValues } from '../systems/ui.js';
import { fallGameOver } from '../systems/game.js';

let activeFishes = [];
let spawnTimer = 0;
const maxConcurrent = 3;
let currentPattern = null;
let patternStep = 0;
let patternChoices = [];

async function loadPatterns() {
    // In a real scenario, you might fetch this from a server.
    // For now, we'll hardcode them.
    const patterns = {
        stairs_right: { steps: [{x:-3,d:18,m:"zigzag"},{x:-2,d:18,m:"zigzag"},{x:-1,d:18,m:"zigzag"},{x:0,d:18,m:"zigzag"},{x:1,d:18,m:"zigzag"},{x:2,d:18,m:"zigzag"},{x:3,d:18,m:"zigzag"}] },
        stairs_left: { steps: [{x:3,d:18,m:"zigzag"},{x:2,d:18,m:"zigzag"},{x:1,d:18,m:"zigzag"},{x:0,d:18,m:"zigzag"},{x:-1,d:18,m:"zigzag"},{x:-2,d:18,m:"zigzag"},{x:-3,d:18,m:"zigzag"}] },
        sine_wave: { steps: [{x:0,d:12,m:"sine"},{x:2.1,d:12,m:"sine"},{x:3,d:12,m:"sine"},{x:2.1,d:12,m:"sine"},{x:0,d:12,m:"sine"},{x:-2.1,d:12,m:"sine"},{x:-3,d:12,m:"sine"},{x:-2.1,d:12,m:"sine"},{x:0,d:12,m:"sine"}]},
        lanes: { steps: [{x:-2,d:15,m:"drift"},{x:0,d:15,m:"drift"},{x:2,d:15,m:"drift"},{x:-2,d:15,m:"drift"},{x:0,d:15,m:"drift"},{x:2,d:15,m:"drift"}] }
    };
    patternChoices = Object.values(patterns);
}

function nextPattern() {
    if (patternChoices.length > 0) {
        currentPattern = patternChoices[Math.floor(Math.random() * patternChoices.length)];
        patternStep = 0;
        spawnTimer = 0;
    }
}

function getFishToSpawn(playerProgress) {
    const selectedFishInfo = FISH.find(f => f.id === playerProgress.selectedFish) || FISH[0];
    const availableFish = FISH.filter(f => 
        playerProgress.unlockedFish.includes(f.id) && f.difficulty <= selectedFishInfo.difficulty
    );
    return (availableFish[Math.floor(Math.random() * availableFish.length)]) || FISH[0];
}

export function initFishSpawner() {
    loadPatterns();
}

export function updateFishSpawner(playerProgress, gameState) {
    if (!currentPattern) nextPattern();
    if (spawnTimer-- <= 0 && activeFishes.length < maxConcurrent && currentPattern) {
        const step = currentPattern.steps[patternStep];
        const fishInfo = getFishToSpawn(playerProgress);
        const f = createFish(scene, gameState.score, fishInfo.id, { x: step.x, pattern: step.m });
        activeFishes.push(f);
        spawnTimer = step.d;
        patternStep++;
        if (patternStep >= currentPattern.steps.length) {
            currentPattern = null;
            spawnTimer = 45; // gap between sequences
        }
    }
}

export function checkFishCollisions(bear, gameState) {
    const catchZ = -0.8, failZ = -0.4;
    for (let i = activeFishes.length - 1; i >= 0; i--) {
        const f = activeFishes[i];
        if (f.position.z >= catchZ) {
            const withinX = Math.abs(f.position.x - bear.position.x) <= (bear.userData.netWidth || 1) / 2;
            if (withinX) {
                playSFX(sounds.catch);
                gameState.score += 10 * gameState.streak;
                gameState.streak++;
                updateUIValues({ score: gameState.score, streak: gameState.streak });
                scene.remove(f); 
                activeFishes.splice(i,1);
            } else if (f.position.z > failZ) {
                gameState.streak = 1;
                updateUIValues({ streak: gameState.streak });
                scene.remove(f); 
                activeFishes.splice(i,1);
                fallGameOver();
                return; // Stop processing more fish after game over
            }
        }
    }
}

export function getActiveFishes() {
    return activeFishes;
}

export function clearActiveFishes() {
    activeFishes.forEach(f => scene.remove(f));
    activeFishes = [];
    spawnTimer = 0; 
    currentPattern = null; 
    patternStep = 0;
}