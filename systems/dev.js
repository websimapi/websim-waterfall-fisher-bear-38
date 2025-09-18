import * as THREE from 'three';

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

export const devHelperGroup = new THREE.Group();

export function initDevTools(scene) {
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
}

export function toggleDevTools(controls) {
    if (!controls) return;
    controls.enabled = !controls.enabled;
    devHelperGroup.visible = controls.enabled;
    const devConsoleButton = document.getElementById('dev-console-button');
    if (!devConsoleButton) return;

    if (controls.enabled) {
        devConsoleButton.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
        devConsoleButton.style.borderColor = '#ff8080';
    } else {
        devConsoleButton.classList.add('hidden');
    }
}

export function resetDevTools(controls) {
    const devConsoleButton = document.getElementById('dev-console-button');
    if (!devConsoleButton) return;
    
    devConsoleButton.classList.toggle('hidden');
    if (!devConsoleButton.classList.contains('hidden')) {
         if (controls) controls.enabled = false;
         devHelperGroup.visible = false;
         devConsoleButton.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
         devConsoleButton.style.borderColor = 'white';
    } else {
        if (controls) controls.enabled = false;
        devHelperGroup.visible = false;
    }
}

