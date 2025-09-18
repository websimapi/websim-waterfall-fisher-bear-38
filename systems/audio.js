let audioCtx;
export const sounds = {};

export async function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    sounds.catch = await loadSound('catch.mp3');
    sounds.splash = await loadSound('splash.mp3');
    sounds.whoosh = await loadSound('whoosh.mp3');
}

export function wireAudioUnlock(initFn) {
    window.addEventListener('click', initFn, { once: true });
    window.addEventListener('touchstart', initFn, { once: true });
    window.addEventListener('pointerdown', initFn, { once: true });
}

async function loadSound(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await audioCtx.decodeAudioData(arrayBuffer);
}

export function playSFX(buffer) {
    if (!audioCtx || !buffer) return;
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);
}