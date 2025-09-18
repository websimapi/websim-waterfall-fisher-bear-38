import * as THREE from 'three';

const fishMat = new THREE.MeshLambertMaterial({ color: 0xc0c0c0 });
const fishTailMat = new THREE.MeshLambertMaterial({ color: 0xff4500 });
const bellyMat = new THREE.MeshLambertMaterial({ color: 0xe6e6e6 });
const finMat = new THREE.MeshLambertMaterial({ color: 0xff7a1a });
const eyeMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
const scleraMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
const pupilMat = new THREE.MeshLambertMaterial({ color: 0x000000 });

// Vitiligo fish materials
const vitiligoBodyMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
const vitiligoPatchMat = new THREE.MeshLambertMaterial({ color: 0xf0f0f0 });

function createVoxel(x, y, z, w, h, d, mat) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
}

export function createFish(scene, score = 0, type = 'classic', opts = {}) {
    const group = new THREE.Group();
    group.name = 'fish';

    const isVitiligo = type === 'vitiligo';
    const bodyMat = isVitiligo ? vitiligoBodyMat : fishMat;

    // body (tapered along +Z, nose forward)
    const segments = 6, length = 3.0, maxW = 0.8, maxH = 0.9;
    const segmentsArr = [];
    for (let i = 0; i < segments; i++) {
        const t = i / (segments - 1);
        const w = THREE.MathUtils.lerp(maxW, 0.35, t);
        const h = THREE.MathUtils.lerp(maxH, 0.4, t);
        const z = -0.4 + t * length;

        let segMat = bodyMat;
        if (isVitiligo && (i === 1 || i === 4)) { // Create patches on some segments
            segMat = vitiligoPatchMat;
        }

        const bodySeg = createVoxel(0, 0, z, w, h, length / segments, segMat);
        group.add(bodySeg); segmentsArr.push({ mesh: bodySeg, baseX: 0, phase: t });
        const bellyH = h * 0.25;
        group.add(createVoxel(0, -h * 0.3, z, w * 0.95, bellyH, (length / segments) * 0.98, bellyMat));
    }

    // tail (vertical caudal fin + small stabilizer)
    const tailZ = -0.4 + length + 0.15;
    const tailBase = createVoxel(0, 0.0, tailZ - 0.1, 0.25, 0.6, 0.18, fishTailMat);
    const tailV = createVoxel(0, 0.0, tailZ, 0.06, 0.9, 0.5, fishTailMat);
    const tailH = createVoxel(0, -0.05, tailZ - 0.05, 0.5, 0.08, 0.35, fishTailMat);
    group.add(tailBase, tailV, tailH);

    // fins
    const dorsal = createVoxel(0, 0.55, 0.9, 0.1, 0.25, 0.9, finMat);
    const anal   = createVoxel(0, -0.55, 1.1, 0.1, 0.22, 0.8, finMat);
    const pectoralL = createVoxel(0.42, -0.05, 0.4, 0.06, 0.18, 0.35, finMat);
    const pectoralR = createVoxel(-0.42, -0.05, 0.4, 0.06, 0.18, 0.35, finMat);
    const pelvicL = createVoxel(0.22, -0.45, 1.0, 0.08, 0.16, 0.25, finMat);
    const pelvicR = createVoxel(-0.22, -0.45, 1.0, 0.08, 0.16, 0.25, finMat);
    group.add(dorsal, anal, pectoralL, pectoralR, pelvicL, pelvicR);

    // head details: mouth, gill cover, eyes
    group.add(createVoxel(0, 0.0, 0.25, 0.7, 0.6, 0.15, bellyMat)); // gill cover
    const scleraL = createVoxel(0.30, 0.24, 0.08, 0.24, 0.24, 0.22, scleraMat);
    const scleraR = createVoxel(-0.30, 0.24, 0.08, 0.24, 0.24, 0.22, scleraMat);
    const pupilL  = createVoxel(0.32, 0.24, 0.14, 0.10, 0.10, 0.06, pupilMat);
    const pupilR  = createVoxel(-0.32, 0.24, 0.14, 0.10, 0.10, 0.06, pupilMat);
    const highlightL = createVoxel(0.36, 0.29, 0.16, 0.04, 0.04, 0.03, scleraMat);
    const highlightR = createVoxel(-0.36, 0.29, 0.16, 0.04, 0.04, 0.03, scleraMat);
    group.add(scleraL, scleraR, pupilL, pupilR, highlightL, highlightR);

    // orient fish to face downstream (+Z), head leading
    group.rotation.y = Math.PI;
    const riverWidth = 7;
    const xPos = (typeof opts.x === 'number') ? THREE.MathUtils.clamp(opts.x, -riverWidth/2, riverWidth/2) : (Math.random() - 0.5) * riverWidth;
    const baseY = 2.1;
    group.position.set(xPos, baseY, -24);
    const speedMultiplier = 1 + (score / 700); // slightly lowered for smoother pacing
    const swimSpeed = (0.045 + Math.random() * 0.045) * speedMultiplier;
    group.userData = {
        velocity: new THREE.Vector3(0, 0, swimSpeed),
        initialX: xPos, baseY,
        swimFrequency: Math.random() * 5 + 2,
        swimAmplitude: Math.random() * 0.5 + 0.2,
        swimTimer: Math.random() * Math.PI * 2,
        baseRotY: group.rotation.y,
        prevX: xPos,
        tailV, tailH, dorsal, anal, pectoralL, pectoralR,
        segments: segmentsArr, wiggleAmp: 0.22, wiggleFreq: 2.6,
        pattern: opts.pattern || ['sine','zigzag','drift'][Math.floor(Math.random()*3)],
        drift: 0
    };
    scene.add(group);
    return group;
}

export function updateFish(fish) {
    if (!fish) return;
    const ud = fish.userData;
    // forward motion
    fish.position.add(ud.velocity);
    // lateral weave
    ud.swimTimer += 0.1;
    let weave = 0;
    if (ud.pattern === 'sine') {
        weave = Math.sin(ud.swimTimer * ud.swimFrequency) * ud.swimAmplitude;
    } else if (ud.pattern === 'zigzag') {
        const tri = 2 / Math.PI * Math.asin(Math.sin(ud.swimTimer * ud.swimFrequency));
        weave = tri * ud.swimAmplitude * 1.2;
    } else { // drift
        ud.drift += (Math.random() - 0.5) * 0.02;
        ud.drift = THREE.MathUtils.clamp(ud.drift, -0.6, 0.6);
        weave = ud.drift;
    }
    // lateral weave target
    let targetX = ud.initialX + weave;
    // smooth towards target for less jitter
    fish.position.x = THREE.MathUtils.lerp(fish.position.x, targetX, 0.18);
    // vertical bob for fluidity - reduced amplitude to prevent clipping through water surface
    const bob = Math.sin(ud.swimTimer * 0.8 + 1.3) * 0.04 + Math.sin(ud.swimTimer * 1.7) * 0.03;
    fish.position.y = ud.baseY + bob;
    // orientation: slight yaw + bank based on turn rate
    const dx = fish.position.x - ud.prevX;
    ud.prevX = fish.position.x;
    fish.rotation.y = ud.baseRotY + Math.sin(ud.swimTimer * ud.swimFrequency) * 0.12;
    fish.rotation.z = THREE.MathUtils.clamp(-dx * 0.6, -0.3, 0.3);
    // tail wag and fin flaps
    const tailSwing = Math.sin(ud.swimTimer * 2.2) * 0.5;
    if (ud.tailV) ud.tailV.rotation.y = tailSwing;
    if (ud.tailH) ud.tailH.rotation.y = tailSwing;
    const finFlap = Math.sin(ud.swimTimer * 3.0) * 0.25;
    if (ud.pectoralL) ud.pectoralL.rotation.z = 0.2 + finFlap;
    if (ud.pectoralR) ud.pectoralR.rotation.z = -0.2 - finFlap;

    // spine wiggle across segments
    const spinePhase = ud.swimTimer * ud.wiggleFreq;
    if (ud.segments) for (const s of ud.segments) {
        s.mesh.position.x = s.baseX + Math.sin(spinePhase + s.phase * Math.PI) * ud.wiggleAmp;
    }
}

export function isFishPastLog(fish) {
    return fish && fish.position.z > 3.5;
}