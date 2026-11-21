
import * as THREE from 'three';
import { FontLoader } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/geometries/TextGeometry.js';

const container = document.getElementById('three-container');
const hero = document.querySelector('.hero');

if (container && hero) {

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
        42,
        container.clientWidth / container.clientHeight,
        0.1,
        100
    );

    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // LIGHTING
    scene.add(new THREE.AmbientLight(0xffffff, 1.8));

    const blueLight = new THREE.PointLight(0x20aaff, 90);
    blueLight.position.set(2, 3, 4);
    scene.add(blueLight);

    const purpleLight = new THREE.PointLight(0x984dff, 90);
    purpleLight.position.set(-3, -2, 3);
    scene.add(purpleLight);

    const whiteLight = new THREE.PointLight(0xffffff, 45);
    whiteLight.position.set(0, 1, 5);
    scene.add(whiteLight);

    // MAIN 3D BRAND GROUP
    const brandGroup = new THREE.Group();
    scene.add(brandGroup);

    const textGroup = new THREE.Group();
    brandGroup.add(textGroup);

    // PREMIUM METALLIC LETTER MATERIAL
    const letterMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xc5d9f2,
        metalness: 0.85,
        roughness: 0.2,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        emissive: 0x102b50,
        emissiveIntensity: 0.35
    });

    // LOAD 3D FONT
    const fontLoader = new FontLoader();

    let textMeshes = [];
    let starParticles = null;
    let particleVelocities = [];
    let particlePositions = null;

    let isBursting = false;
    let burstTime = 0;
    let spinRemaining = 0;
    let lastClick = 0;

    fontLoader.load(
        'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/fonts/helvetiker_bold.typeface.json',

        (font) => {

            function createBrandText(words, size, yPosition) {

                const geometry = new TextGeometry(words, {
                    font: font,
                    size: size,
                    depth: 0.16,
                    curveSegments: 16,
                    bevelEnabled: true,
                    bevelThickness: 0.025,
                    bevelSize: 0.018,
                    bevelSegments: 5
                });

                geometry.computeBoundingBox();

                const box = geometry.boundingBox;

                const width = box.max.x - box.min.x;
                const centerX = (box.max.x + box.min.x) / 2;

                geometry.translate(
                    -centerX,
                    -box.min.y,
                    0
                );

                const mesh = new THREE.Mesh(
                    geometry,
                    letterMaterial
                );

                mesh.position.y = yPosition;

                textGroup.add(mesh);
                textMeshes.push(mesh);

                return { geometry, width };
            }

            // TWO BALANCED LINES OF 3D BRANDING
            const firstLine = createBrandText(
                'FIRST CHOICE',
                0.55,
                0.12
            );

            const secondLine = createBrandText(
                'IMPORTS',
                0.62,
                -0.65
            );

            // SCALE TO FIT THE HERO AREA
            const widestLine = Math.max(
                firstLine.width,
                secondLine.width
            );

            const fitScale = Math.min(1, 4.5 / widestLine);

            brandGroup.scale.setScalar(fitScale);

            // BUILD STAR PARTICLE TEXTURE
            const starCanvas = document.createElement('canvas');
            starCanvas.width = 64;
            starCanvas.height = 64;

            const starCtx = starCanvas.getContext('2d');

            const starGradient = starCtx.createRadialGradient(
                32, 32, 1,
                32, 32, 30
            );

            starGradient.addColorStop(0, 'rgba(255,255,255,1)');
            starGradient.addColorStop(0.2, 'rgba(120,220,255,1)');
            starGradient.addColorStop(0.5, 'rgba(75,150,255,0.6)');
            starGradient.addColorStop(1, 'rgba(75,150,255,0)');

            starCtx.fillStyle = starGradient;
            starCtx.fillRect(0, 0, 64, 64);

            // SMALL STAR SHAPE IN THE CENTRE
            starCtx.fillStyle = 'rgba(255,255,255,0.9)';
            starCtx.beginPath();
            starCtx.moveTo(32, 5);
            starCtx.lineTo(36, 27);
            starCtx.lineTo(59, 32);
            starCtx.lineTo(36, 36);
            starCtx.lineTo(32, 59);
            starCtx.lineTo(28, 36);
            starCtx.lineTo(5, 32);
            starCtx.lineTo(28, 27);
            starCtx.closePath();
            starCtx.fill();

            const starTexture = new THREE.CanvasTexture(starCanvas);

            // COLLECT LETTER VERTICES FOR THE PARTICLE BURST
            const allVertices = [];

            textMeshes.forEach((mesh) => {

                const position = mesh.geometry.attributes.position;

                for (let i = 0; i < position.count; i += 2) {

                    allVertices.push(
                        position.getX(i) + mesh.position.x,
                        position.getY(i) + mesh.position.y,
                        position.getZ(i) + mesh.position.z
                    );
                }
            });

            const particleCount = Math.min(
                1400,
                allVertices.length / 3
            );

            particlePositions = new Float32Array(particleCount * 3);

            const particleGeometry = new THREE.BufferGeometry();

            const velocities = [];

            for (let i = 0; i < particleCount; i++) {

                const sourceIndex =
                    Math.floor(Math.random() * (allVertices.length / 3)) * 3;

                particlePositions[i * 3] = allVertices[sourceIndex];
                particlePositions[i * 3 + 1] = allVertices[sourceIndex + 1];
                particlePositions[i * 3 + 2] = allVertices[sourceIndex + 2];

                const direction = new THREE.Vector3(
                    allVertices[sourceIndex],
                    allVertices[sourceIndex + 1],
                    allVertices[sourceIndex + 2]
                );

                if (direction.length() < 0.1) {
                    direction.set(
                        Math.random() - 0.5,
                        Math.random() - 0.5,
                        Math.random() - 0.5
                    );
                }

                direction.normalize();

                velocities.push(
                    direction.x * (1.5 + Math.random() * 2.5),
                    direction.y * (1.5 + Math.random() * 2.5),
                    direction.z * (1.5 + Math.random() * 2.5)
                );
            }

            particleVelocities = velocities;

            particleGeometry.setAttribute(
                'position',
                new THREE.BufferAttribute(particlePositions, 3)
            );

            starParticles = new THREE.Points(
                particleGeometry,
                new THREE.PointsMaterial({
                    color: 0x8edcff,
                    size: 0.095,
                    map: starTexture,
                    transparent: true,
                    opacity: 1,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    sizeAttenuation: true
                })
            );

            starParticles.visible = false;
            brandGroup.add(starParticles);

            // SUBTLE GLOW AROUND THE WORDS
            const glowRing = new THREE.Mesh(
                new THREE.TorusGeometry(2.4, 0.012, 12, 160),
                new THREE.MeshBasicMaterial({
                    color: 0x319dff,
                    transparent: true,
                    opacity: 0.55
                })
            );

            glowRing.scale.set(1.3, 0.65, 1);
            glowRing.rotation.x = 0.35;
            brandGroup.add(glowRing);

        },

        undefined,

        (error) => {
            console.error('Could not load the 3D font:', error);
        }
    );

    // BACKGROUND STAR PARTICLES
    const backgroundCount = 250;
    const backgroundPositions = new Float32Array(backgroundCount * 3);

    for (let i = 0; i < backgroundCount; i++) {
        backgroundPositions[i * 3] = (Math.random() - 0.5) * 9;
        backgroundPositions[i * 3 + 1] = (Math.random() - 0.5) * 6;
        backgroundPositions[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }

    const backgroundGeometry = new THREE.BufferGeometry();

    backgroundGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(backgroundPositions, 3)
    );

    const backgroundStars = new THREE.Points(
        backgroundGeometry,
        new THREE.PointsMaterial({
            color: 0x65bfff,
            size: 0.025,
            transparent: true,
            opacity: 0.65
        })
    );

    scene.add(backgroundStars);

    // MOUSE MOVEMENT
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;

    hero.addEventListener('pointermove', (event) => {

        const rect = hero.getBoundingClientRect();

        mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouseY = ((event.clientY - rect.top) / rect.height) * 2 - 1;

    });

    hero.addEventListener('pointerleave', () => {
        mouseX = 0;
        mouseY = 0;
    });

    // CLICK OR TAP TO SPIN AND BURST
    container.style.cursor = 'pointer';

    container.addEventListener('pointerdown', () => {

        if (!starParticles || isBursting) return;

        isBursting = true;
        burstTime = 0;

        // FULL 360 DEGREE SPIN
        spinRemaining = Math.PI * 2;

        textMeshes.forEach((mesh) => {
            mesh.visible = false;
        });

        starParticles.visible = true;

        // Reset particles to the original letter shapes
        const positions =
            starParticles.geometry.attributes.position;

        const originalVertices = [];

        textMeshes.forEach((mesh) => {

            const position = mesh.geometry.attributes.position;

            for (let i = 0; i < position.count; i += 2) {
                originalVertices.push(
                    position.getX(i) + mesh.position.x,
                    position.getY(i) + mesh.position.y,
                    position.getZ(i) + mesh.position.z
                );
            }
        });

        for (let i = 0; i < positions.count; i++) {

            const index =
                Math.floor(Math.random() * (originalVertices.length / 3)) * 3;

            positions.setXYZ(
                i,
                originalVertices[index],
                originalVertices[index + 1],
                originalVertices[index + 2]
            );

            const direction = new THREE.Vector3(
                originalVertices[index],
                originalVertices[index + 1],
                originalVertices[index + 2]
            );

            if (direction.length() < 0.1) {
                direction.set(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                );
            }

            direction.normalize();

            particleVelocities[i * 3] =
                direction.x * (1.5 + Math.random() * 2.5);

            particleVelocities[i * 3 + 1] =
                direction.y * (1.5 + Math.random() * 2.5);

            particleVelocities[i * 3 + 2] =
                direction.z * (1.5 + Math.random() * 2.5);
        }

        positions.needsUpdate = true;

    });

    // ANIMATION
    const clock = new THREE.Clock();

    function animate() {

        requestAnimationFrame(animate);

        const delta = Math.min(clock.getDelta(), 0.04);
        const time = clock.elapsedTime;

        currentX += (mouseX - currentX) * 0.07;
        currentY += (mouseY - currentY) * 0.07;

        // NATURAL MOUSE MOVEMENT
        brandGroup.rotation.y +=
            (currentX * 0.65 - brandGroup.rotation.y) * 0.07;

        brandGroup.rotation.x +=
            (-currentY * 0.4 - brandGroup.rotation.x) * 0.07;

        // GENTLE FLOATING
        brandGroup.position.y =
            Math.sin(time * 1.2) * 0.08;

        // CLICK SPIN
        if (spinRemaining > 0) {

            const spinStep = Math.min(
                spinRemaining,
                Math.max(0.025, spinRemaining * 0.09)
            );

            brandGroup.rotation.y += spinStep;
            spinRemaining -= spinStep;
        }

        // PARTICLE EXPLOSION
        if (isBursting && starParticles) {

            burstTime += delta;

            const positions =
                starParticles.geometry.attributes.position;

            for (let i = 0; i < positions.count; i++) {

                const index = i * 3;

                positions.array[index] +=
                    particleVelocities[index] * delta;

                positions.array[index + 1] +=
                    particleVelocities[index + 1] * delta;

                positions.array[index + 2] +=
                    particleVelocities[index + 2] * delta;

                particleVelocities[index] *= 0.985;
                particleVelocities[index + 1] *= 0.985;
                particleVelocities[index + 2] *= 0.985;
            }

            positions.needsUpdate = true;

            starParticles.material.opacity = Math.max(
                0,
                1 - burstTime / 1.5
            );

            // REFORM THE BRAND
            if (burstTime > 1.6) {

                isBursting = false;
                starParticles.visible = false;

                textMeshes.forEach((mesh) => {
                    mesh.visible = true;
                });

                brandGroup.rotation.set(0, 0, 0);
                brandGroup.position.set(0, 0, 0);

                starParticles.material.opacity = 1;
            }
        }

        backgroundStars.rotation.y = time * 0.025;

        blueLight.position.x = 2 + Math.sin(time) * 0.7;
        purpleLight.position.y = -2 + Math.cos(time) * 0.7;

        renderer.render(scene, camera);
    }

    animate();

    // RESPONSIVE RESIZING
    function resizeScene() {

        const width = container.clientWidth;
        const height = container.clientHeight;

        if (!width || !height) return;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
    }

    window.addEventListener('resize', resizeScene);

    if ('ResizeObserver' in window) {
        new ResizeObserver(resizeScene).observe(container);
    }
}
