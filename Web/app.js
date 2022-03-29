let scene, camera, renderer;

const init = () => {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 1000);
    camera.position.set(-0.5, -0.5, 1);
    camera.rotation.x = (90 / 180) * Math.PI;
    camera.rotation.y = (90 / 180) * Math.PI;
    camera.rotation.z = (90 / 180) * Math.PI;

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.addEventListener('change', renderer);

    const hemiLight = new THREE.HemisphereLight(0xffeeb1, 0x080820, 3.5);
    scene.add(hemiLight);

    const loader = new THREE.GLTFLoader();
    loader.load('case.glb', (result) => {
        scene.add(result.scene);
        animate();
    });
};

const animate = () => {
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
};

init();