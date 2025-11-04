        // Глобальные переменные
        let scene, camera, renderer;
        let mercury, mercuryGroup, mercuryOrbitGroup;
        let terminatorLines = [];
        let sun, sunLight, sunSphere;
        let controls;
        let isAnimating = true;
        let timeSpeed = 1;
        let mercuryRotation = 0;
        let orbitalAngle = 0;
        let routePath = null;
        let raycaster, mouse;
        let tempTexture;
        let orbitLine = null;
        let isSurfaceView = false;
        let surfaceCamera, normalCamera;
        let observerPosition = { lat: 0, lon: 0 };
        let sunPathLine = null;

        // Константы Меркурия
        const MERCURY_RADIUS = 2;
        const SUN_DISTANCE = 15;
        const MERCURY_DAY_LENGTH = 58.646; // в земных днях (точное значение)
        const MERCURY_YEAR_LENGTH = 87.969; // в земных днях (точное значение)
        const ROTATION_PERIOD = 58.646; // сидерический день
        const SOLAR_DAY = 175.938; // солнечные сутки (от полудня до полудня)

        // Инициализация сцены
        function init() {
            // Удаляем загрузочный текст
            document.getElementById('loading').style.display = 'none';

            // Создание сцены
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x000005);

            // Основная камера
            normalCamera = new THREE.PerspectiveCamera(
                60,
                window.innerWidth / window.innerHeight,
                0.1,
                1000
            );
            normalCamera.position.set(10, 8, 15);
            normalCamera.lookAt(0, 0, 0);

            // Камера для вида с поверхности
            surfaceCamera = new THREE.PerspectiveCamera(
                75,
                window.innerWidth / window.innerHeight,
                0.001,
                1000
            );

            camera = normalCamera;

            // Рендерер
            renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            document.getElementById('canvas-container').appendChild(renderer.domElement);

            // Управление камерой
            controls = new THREE.OrbitControls(normalCamera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.minDistance = 3;
            controls.maxDistance = 50;

            // Raycaster для взаимодействия
            raycaster = new THREE.Raycaster();
            mouse = new THREE.Vector2();

            // Создание объектов
            createSun();
            createMercury();
            createStars();
            createGrid();
            createOrbit();

            // Обработчики событий
            setupEventListeners();

            // Запуск анимации
            animate();
        }

        // Создание Солнца
        function createSun() {
            // Группа для Солнца
            const sunGroup = new THREE.Group();

            // Само Солнце
            const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
            const sunMaterial = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                emissive: 0xffff00,
                emissiveIntensity: 2
            });

            sunSphere = new THREE.Mesh(sunGeometry, sunMaterial);
            sunGroup.add(sunSphere);

            // Свечение вокруг Солнца
            const glowGeometry = new THREE.SphereGeometry(2.5, 32, 32);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0xffaa00,
                transparent: true,
                opacity: 0.3
            });
            const sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
            sunGroup.add(sunGlow);

            sun = sunGroup;
            sun.position.set(0, 0, 0);
            scene.add(sun);

            // Солнечный свет
            sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
            sunLight.position.set(0, 0, 0);
            sunLight.castShadow = true;
            sunLight.shadow.mapSize.width = 2048;
            sunLight.shadow.mapSize.height = 2048;
            sunLight.shadow.camera.near = 0.5;
            sunLight.shadow.camera.far = 50;
            scene.add(sunLight);

            // Точечный свет от Солнца
            const pointLight = new THREE.PointLight(0xffffff, 2, 100);
            sun.add(pointLight);

            // Амбиентный свет (космический фон)
            const ambientLight = new THREE.AmbientLight(0x202030, 0.1);
            scene.add(ambientLight);
        }

        // Создание Меркурия
        function createMercury() {
            // Группа для орбитального движения
            mercuryOrbitGroup = new THREE.Group();

            // Группа для самого Меркурия
            mercuryGroup = new THREE.Group();

            // Создание текстуры температур
            const canvas = document.createElement('canvas');
            canvas.width = 2048;
            canvas.height = 1024;
            const ctx = canvas.getContext('2d');

            tempTexture = new THREE.CanvasTexture(canvas);

            // Геометрия и материал планеты
            const geometry = new THREE.SphereGeometry(MERCURY_RADIUS, 128, 64);
            const material = new THREE.MeshPhongMaterial({
                map: tempTexture,
                bumpScale: 0.05,
                specular: new THREE.Color(0x222222),
                shininess: 10
            });

            mercury = new THREE.Mesh(geometry, material);
            mercury.castShadow = true;
            mercury.receiveShadow = true;
            mercuryGroup.add(mercury);

            // Добавление осей планеты
            const axesHelper = new THREE.AxesHelper(3);
            mercuryGroup.add(axesHelper);
            axesHelper.visible = false;

            // Создание линий терминатора
            createTerminatorLines();

            // Добавление полюсных маркеров
            const poleGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
            const northPoleMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            const southPoleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

            const northPole = new THREE.Mesh(poleGeometry, northPoleMaterial);
            northPole.position.set(0, MERCURY_RADIUS + 0.15, 0);
            mercuryGroup.add(northPole);

            const southPole = new THREE.Mesh(poleGeometry, southPoleMaterial);
            southPole.position.set(0, -MERCURY_RADIUS - 0.15, 0);
            southPole.rotation.z = Math.PI;
            mercuryGroup.add(southPole);

            // Позиционирование на орбите
            mercuryGroup.position.set(SUN_DISTANCE, 0, 0);
            mercuryOrbitGroup.add(mercuryGroup);
            scene.add(mercuryOrbitGroup);

            updateTemperatureTexture();
        }

        // Обновление температурной текстуры
        function updateTemperatureTexture() {
            const canvas = tempTexture.image;
            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;

            // Очистка канваса
            ctx.fillStyle = '#000033';
            ctx.fillRect(0, 0, width, height);

            // Создаем температурную карту
            for (let x = 0; x < width; x++) {
                for (let y = 0; y < height; y++) {
                    const lon = (x / width - 0.5) * 360; // долгота от -180 до 180
                    const lat = (0.5 - y / height) * 180; // широта от -90 до 90

                    // Вычисляем угол от подсолнечной точки
                    const sunAngle = ((lon + 360) % 360);

                    // Температурная модель
                    let temp;
                    if (sunAngle < 90) {
                        // Утренний терминатор и утро
                        temp = -173 + (sunAngle / 90) * 600;
                    } else if (sunAngle < 180) {
                        // День
                        temp = 427;
                    } else if (sunAngle < 270) {
                        // Вечерний терминатор
                        temp = 427 - ((sunAngle - 180) / 90) * 600;
                    } else {
                        // Ночь
                        temp = -173;
                    }

                    // Модификация для полюсов
                    const polarFactor = Math.abs(Math.sin(lat * Math.PI / 180));
                    temp = temp * (1 - polarFactor * 0.3);

                    // Преобразуем температуру в цвет
                    const color = tempToColor(temp);
                    ctx.fillStyle = color;
                    ctx.fillRect(x, y, 1, 1);
                }
            }

            // Добавляем детали - кратеры и текстуру
            ctx.globalAlpha = 0.3;
            for (let i = 0; i < 100; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const r = Math.random() * 20 + 5;
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
                gradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            tempTexture.needsUpdate = true;
        }

        // Преобразование температуры в цвет
        function tempToColor(temp) {
            // Нормализация температуры от -173 до 427 (диапазон 600)
            const normalized = (temp + 173) / 600;

            if (normalized < 0.17) { // -173 до -100: глубокий синий
                return `rgb(0, 0, ${Math.floor(100 + normalized * 400)})`;
            } else if (normalized < 0.33) { // -100 до 0: синий к зеленому
                const factor = (normalized - 0.17) / 0.16;
                return `rgb(0, ${Math.floor(factor * 255)}, ${Math.floor(255 * (1 - factor))})`;
            } else if (normalized < 0.42) { // 0 до 50: зеленый к желтому (зона комфорта)
                const factor = (normalized - 0.33) / 0.09;
                return `rgb(${Math.floor(factor * 255)}, 255, 0)`;
            } else if (normalized < 0.67) { // 50 до 200: желтый к оранжевому
                const factor = (normalized - 0.42) / 0.25;
                return `rgb(255, ${Math.floor(255 * (1 - factor * 0.5))}, 0)`;
            } else { // 200 до 427: оранжевый к красному
                const factor = (normalized - 0.67) / 0.33;
                return `rgb(255, ${Math.floor(128 * (1 - factor))}, 0)`;
            }
        }

        // Создание линий терминатора
        function createTerminatorLines() {
            // Утренний терминатор (голубой)
            const morningPoints = [];
            for (let lat = -Math.PI/2; lat <= Math.PI/2; lat += Math.PI/64) {
                const y = Math.sin(lat) * MERCURY_RADIUS * 1.01;
                const r = Math.cos(lat) * MERCURY_RADIUS * 1.01;
                morningPoints.push(new THREE.Vector3(r, y, 0));
            }

            const morningGeometry = new THREE.BufferGeometry().setFromPoints(morningPoints);
            const morningMaterial = new THREE.LineBasicMaterial({
                color: 0x00ffff,
                linewidth: 3,
                transparent: true,
                opacity: 0.8
            });
            const morningLine = new THREE.Line(morningGeometry, morningMaterial);
            morningLine.rotation.z = Math.PI/2;

            // Вечерний терминатор (оранжевый)
            const eveningGeometry = morningGeometry.clone();
            const eveningMaterial = new THREE.LineBasicMaterial({
                color: 0xff8800,
                linewidth: 3,
                transparent: true,
                opacity: 0.8
            });
            const eveningLine = new THREE.Line(eveningGeometry, eveningMaterial);
            eveningLine.rotation.z = -Math.PI/2;

            mercuryGroup.add(morningLine);
            mercuryGroup.add(eveningLine);

            terminatorLines = [morningLine, eveningLine];
        }

        // Создание орбиты
        function createOrbit() {
            const points = [];
            const eccentricity = 0.206;

            for (let angle = 0; angle <= Math.PI * 2; angle += Math.PI / 100) {
                const r = SUN_DISTANCE * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(angle));
                const x = r * Math.cos(angle);
                const z = r * Math.sin(angle);
                points.push(new THREE.Vector3(x, 0, z));
            }

            const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const orbitMaterial = new THREE.LineBasicMaterial({
                color: 0x444466,
                transparent: true,
                opacity: 0.5
            });

            orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
            scene.add(orbitLine);
        }

        // Создание звездного фона
        function createStars() {
            const starsGeometry = new THREE.BufferGeometry();
            const starsMaterial = new THREE.PointsMaterial({
                color: 0xffffff,
                size: 0.05,
                sizeAttenuation: false
            });

            const starsVertices = [];
            for (let i = 0; i < 20000; i++) {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                const r = 400;

                const x = r * Math.sin(phi) * Math.cos(theta);
                const y = r * Math.sin(phi) * Math.sin(theta);
                const z = r * Math.cos(phi);

                starsVertices.push(x, y, z);
            }

            starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
            const stars = new THREE.Points(starsGeometry, starsMaterial);
            scene.add(stars);
        }

        // Создание координатной сетки
        function createGrid() {
            const gridHelper = new THREE.GridHelper(40, 40, 0x444444, 0x222222);
            gridHelper.position.y = -10;
            scene.add(gridHelper);
        }

        // Переключение на вид с поверхности
        function enterSurfaceView() {
            isSurfaceView = true;
            camera = surfaceCamera;
            controls.enabled = false;

            // Позиционируем наблюдателя на экваторе
            observerPosition = { lat: 0, lon: 0 };
            updateSurfaceCamera();

            document.getElementById('surface-view-panel').classList.add('active');
            document.getElementById('view-surface').classList.add('active');

            // Создаем путь Солнца на небе
            createSunPath();
        }

        // Выход из режима поверхности
        function exitSurfaceView() {
            isSurfaceView = false;
            camera = normalCamera;
            controls.enabled = true;

            document.getElementById('surface-view-panel').classList.remove('active');
            document.getElementById('view-surface').classList.remove('active');

            // Удаляем путь Солнца
            if (sunPathLine) {
                scene.remove(sunPathLine);
                sunPathLine = null;
            }
        }

        // Обновление камеры на поверхности
        function updateSurfaceCamera() {
            const lat = observerPosition.lat * Math.PI / 180;
            const lon = observerPosition.lon * Math.PI / 180;

            // Позиция наблюдателя на поверхности
            const x = MERCURY_RADIUS * Math.cos(lat) * Math.sin(lon);
            const y = MERCURY_RADIUS * Math.sin(lat);
            const z = MERCURY_RADIUS * Math.cos(lat) * Math.cos(lon);

            // Добавляем высоту человека (2 метра в масштабе)
            const height = 0.002;
            const normal = new THREE.Vector3(x, y, z).normalize();

            surfaceCamera.position.set(
                mercuryGroup.position.x + x + normal.x * height,
                mercuryGroup.position.y + y + normal.y * height,
                mercuryGroup.position.z + z + normal.z * height
            );

            // Направление взгляда
            const lookAtPoint = new THREE.Vector3(
                mercuryGroup.position.x + x + normal.x * 10,
                mercuryGroup.position.y + y + normal.y * 0.5,
                mercuryGroup.position.z + z + normal.z * 10
            );

            surfaceCamera.lookAt(lookAtPoint);
            surfaceCamera.up.copy(normal);

            // Обновляем информацию
            document.getElementById('observer-lat').textContent = observerPosition.lat.toFixed(1) + '°';
            document.getElementById('observer-lon').textContent = observerPosition.lon.toFixed(1) + '°';

            // Вычисляем высоту Солнца
            const sunVector = sun.position.clone().sub(surfaceCamera.position).normalize();
            const sunAngle = Math.asin(sunVector.dot(normal)) * 180 / Math.PI;
            document.getElementById('sun-height').textContent = sunAngle.toFixed(1) + '°';
        }

        // Создание пути Солнца на небе
        function createSunPath() {
            const points = [];
            const samples = 200;

            for (let i = 0; i < samples; i++) {
                const t = i / samples * SOLAR_DAY;
                // Здесь можно добавить вычисление положения Солнца
                // для демонстрации ретроградного движения
            }

            if (points.length > 0) {
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.LineBasicMaterial({
                    color: 0xffff00,
                    transparent: true,
                    opacity: 0.3
                });
                sunPathLine = new THREE.Line(geometry, material);
                scene.add(sunPathLine);
            }
        }

        // Настройка обработчиков событий
        function setupEventListeners() {
            // Изменение размера окна
            window.addEventListener('resize', onWindowResize, false);

            // Движение мыши
            renderer.domElement.addEventListener('mousemove', onMouseMove, false);
            renderer.domElement.addEventListener('click', onMouseClick, false);

            // Клавиатура для движения по поверхности
            window.addEventListener('keydown', onKeyDown, false);

            // Контролы времени
            document.getElementById('time-speed').addEventListener('input', (e) => {
                timeSpeed = parseFloat(e.target.value);
                document.getElementById('speed-value').textContent =
                    timeSpeed < 10 ? timeSpeed + 'x' :
                    timeSpeed < 100 ? (timeSpeed/10).toFixed(0) + '0x' :
                    (timeSpeed/10).toFixed(0) + '0x';
            });

            document.getElementById('pause-btn').addEventListener('click', () => {
                isAnimating = !isAnimating;
                document.getElementById('pause-btn').textContent = isAnimating ? '⏸️ Пауза' : '▶️ Играть';
            });

            document.getElementById('reset-btn').addEventListener('click', () => {
                mercuryRotation = 0;
                orbitalAngle = 0;
                timeSpeed = 1;
                document.getElementById('time-speed').value = 1;
                document.getElementById('speed-value').textContent = '1x';
            });

            // Виды камеры
            document.getElementById('view-orbit').addEventListener('click', () => {
                exitSurfaceView();
                normalCamera.position.set(20, 15, 25);
                normalCamera.lookAt(0, 0, 0);
                controls.update();
            });

            document.getElementById('view-equator').addEventListener('click', () => {
                exitSurfaceView();
                normalCamera.position.set(
                    mercuryGroup.position.x + 5,
                    mercuryGroup.position.y,
                    mercuryGroup.position.z + 5
                );
                normalCamera.lookAt(mercuryGroup.position);
                controls.update();
            });

            document.getElementById('view-pole').addEventListener('click', () => {
                exitSurfaceView();
                normalCamera.position.set(
                    mercuryGroup.position.x,
                    mercuryGroup.position.y + 8,
                    mercuryGroup.position.z + 2
                );
                normalCamera.lookAt(mercuryGroup.position);
                controls.update();
            });

            document.getElementById('view-surface').addEventListener('click', () => {
                if (!isSurfaceView) {
                    enterSurfaceView();
                } else {
                    exitSurfaceView();
                }
            });

            document.getElementById('exit-surface').addEventListener('click', exitSurfaceView);

            // Чекбоксы
            document.getElementById('show-grid').addEventListener('change', (e) => {
                const grid = scene.getObjectByProperty('type', 'GridHelper');
                if (grid) grid.visible = e.target.checked;
            });

            document.getElementById('show-terminator').addEventListener('change', (e) => {
                terminatorLines.forEach(line => line.visible = e.target.checked);
            });

            document.getElementById('show-temp').addEventListener('change', (e) => {
                if (e.target.checked) {
                    mercury.material.map = tempTexture;
                } else {
                    mercury.material.map = null;
                    mercury.material.color = new THREE.Color(0x888888);
                }
                mercury.material.needsUpdate = true;
            });

            document.getElementById('show-orbit').addEventListener('change', (e) => {
                if (orbitLine) orbitLine.visible = e.target.checked;
            });

            document.getElementById('show-axes').addEventListener('change', (e) => {
                const axes = mercuryGroup.getObjectByProperty('type', 'AxesHelper');
                if (axes) axes.visible = e.target.checked;
            });

            // Эксцентриситет орбиты
            document.getElementById('eccentricity').addEventListener('input', (e) => {
                const ecc = parseFloat(e.target.value) / 100;
                document.getElementById('eccentricity-value').textContent = ecc.toFixed(3);
                updateOrbit(ecc);
            });

            // Маршруты
            document.getElementById('route-polar').addEventListener('click', createPolarRoute);
            document.getElementById('route-terminator').addEventListener('click', createTerminatorRoute);
            document.getElementById('route-comfort').addEventListener('click', createComfortRoute);
            document.getElementById('clear-route').addEventListener('click', clearRoute);

            // Специальные точки
            document.getElementById('go-hot').addEventListener('click', () => {
                observerPosition = { lat: 0, lon: 0 };
                if (isSurfaceView) updateSurfaceCamera();
            });

            document.getElementById('go-warm').addEventListener('click', () => {
                observerPosition = { lat: 0, lon: 90 };
                if (isSurfaceView) updateSurfaceCamera();
            });
        }

        // Обновление орбиты
        function updateOrbit(eccentricity) {
            const points = [];

            for (let angle = 0; angle <= Math.PI * 2; angle += Math.PI / 100) {
                const r = SUN_DISTANCE * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(angle));
                const x = r * Math.cos(angle);
                const z = r * Math.sin(angle);
                points.push(new THREE.Vector3(x, 0, z));
            }

            orbitLine.geometry.setFromPoints(points);
        }

        // Обработка клавиатуры
        function onKeyDown(event) {
            if (!isSurfaceView) return;

            const moveSpeed = 5;

            switch(event.key) {
                case 'w': case 'W':
                    observerPosition.lat = Math.min(90, observerPosition.lat + moveSpeed);
                    break;
                case 's': case 'S':
                    observerPosition.lat = Math.max(-90, observerPosition.lat - moveSpeed);
                    break;
                case 'a': case 'A':
                    observerPosition.lon = (observerPosition.lon - moveSpeed + 360) % 360;
                    break;
                case 'd': case 'D':
                    observerPosition.lon = (observerPosition.lon + moveSpeed) % 360;
                    break;
            }

            if (isSurfaceView) {
                updateSurfaceCamera();
            }
        }

        // Обработка изменения размера окна
        function onWindowResize() {
            const aspect = window.innerWidth / window.innerHeight;
            normalCamera.aspect = aspect;
            normalCamera.updateProjectionMatrix();
            surfaceCamera.aspect = aspect;
            surfaceCamera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        // Обработка движения мыши
        function onMouseMove(event) {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            if (!isSurfaceView) {
                // Проверка пересечения с Меркурием
                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObject(mercury);

                if (intersects.length > 0) {
                    const point = intersects[0].point;
                    const localPoint = mercury.worldToLocal(point.clone());

                    // Вычисление широты и долготы
                    const lat = Math.asin(localPoint.y / MERCURY_RADIUS) * 180 / Math.PI;
                    const lon = Math.atan2(localPoint.x, localPoint.z) * 180 / Math.PI;

                    // Вычисление температуры
                    const temp = calculateTemperature(lon, lat);

                    document.getElementById('point-temp').textContent = temp.toFixed(0) + '°C';
                    document.getElementById('point-coords').textContent =
                        `${lat.toFixed(1)}° с.ш., ${lon.toFixed(1)}° в.д.`;
                }
            }
        }

        // Обработка клика мыши
        function onMouseClick(event) {
            if (isSurfaceView) return;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(mercury);

            if (intersects.length > 0) {
                const point = intersects[0].point;
                const localPoint = mercury.worldToLocal(point.clone());

                // Добавление маркера
                const markerGeometry = new THREE.SphereGeometry(0.05, 8, 8);
                const markerMaterial = new THREE.MeshBasicMaterial({
                    color: 0x00ff00,
                    emissive: 0x00ff00,
                    emissiveIntensity: 2
                });
                const marker = new THREE.Mesh(markerGeometry, markerMaterial);

                const worldPoint = mercury.localToWorld(localPoint.clone());
                marker.position.copy(worldPoint);
                scene.add(marker);

                // Удаление через 5 секунд
                setTimeout(() => {
                    scene.remove(marker);
                }, 5000);
            }
        }

        // Вычисление температуры
        function calculateTemperature(longitude, latitude) {
            // Учитываем долготу (основной фактор)
            const sunAngle = ((longitude + 180) % 360);

            let temp;
            if (sunAngle < 85) {
                // Ночь
                temp = -173;
            } else if (sunAngle < 95) {
                // Утренний терминатор
                temp = -173 + (sunAngle - 85) * 60;
            } else if (sunAngle < 265) {
                // День
                const dayAngle = (sunAngle - 95) / 170 * Math.PI;
                temp = 200 + 227 * Math.sin(dayAngle);
            } else if (sunAngle < 275) {
                // Вечерний терминатор
                temp = 427 - (sunAngle - 265) * 60;
            } else {
                // Ночь
                temp = -173;
            }

            // Модификация для широты
            const latFactor = Math.cos(latitude * Math.PI / 180);
            temp = temp * latFactor + (1 - latFactor) * (-100);

            return temp;
        }

        // Создание маршрутов
        function createPolarRoute() {
            clearRoute();

            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(0, 0, MERCURY_RADIUS * 1.01),
                new THREE.Vector3(MERCURY_RADIUS * 0.5, MERCURY_RADIUS * 0.86, MERCURY_RADIUS * 0.5).multiplyScalar(1.01),
                new THREE.Vector3(0, MERCURY_RADIUS * 1.01, 0),
                new THREE.Vector3(-MERCURY_RADIUS * 0.5, MERCURY_RADIUS * 0.86, -MERCURY_RADIUS * 0.5).multiplyScalar(1.01),
                new THREE.Vector3(0, 0, -MERCURY_RADIUS * 1.01)
            ]);

            const points = curve.getPoints(100);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: 0x00ff00,
                linewidth: 3,
                transparent: true,
                opacity: 0.8
            });

            routePath = new THREE.Line(geometry, material);
            mercuryGroup.add(routePath);
        }

        function createTerminatorRoute() {
            clearRoute();

            const points = [];
            for (let angle = 0; angle <= Math.PI * 2; angle += Math.PI / 64) {
                const x = Math.cos(angle) * MERCURY_RADIUS * 1.01;
                const z = Math.sin(angle) * MERCURY_RADIUS * 1.01;
                points.push(new THREE.Vector3(x, 0, z));
            }

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineDashedMaterial({
                color: 0xff00ff,
                linewidth: 3,
                transparent: true,
                opacity: 0.8,
                dashSize: 0.3,
                gapSize: 0.1
            });

            routePath = new THREE.Line(geometry, material);
            routePath.computeLineDistances();
            mercuryGroup.add(routePath);
        }

        function createComfortRoute() {
            clearRoute();

            // Зона комфорта около 50-70 км от терминатора
            const offset = 0.03; // в радианах
            const points = [];

            for (let lat = -60; lat <= 60; lat += 5) {
                const latRad = lat * Math.PI / 180;
                const r = Math.cos(latRad) * MERCURY_RADIUS * 1.01;
                const y = Math.sin(latRad) * MERCURY_RADIUS * 1.01;

                const x = r * Math.sin(offset);
                const z = r * Math.cos(offset);

                points.push(new THREE.Vector3(x, y, z));
            }

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: 0xffff00,
                linewidth: 3,
                transparent: true,
                opacity: 0.8
            });

            routePath = new THREE.Line(geometry, material);
            mercuryGroup.add(routePath);
        }

        function clearRoute() {
            if (routePath) {
                mercuryGroup.remove(routePath);
                routePath = null;
            }
        }

        // Анимация
        function animate() {
            requestAnimationFrame(animate);

            if (isAnimating) {
                const deltaTime = timeSpeed * 0.0001;

                // Орбитальное движение (88 земных дней)
                orbitalAngle += deltaTime * (360 / MERCURY_YEAR_LENGTH);
                const orbitalRadians = orbitalAngle * Math.PI / 180;

                // Эксцентричная орбита
                const ecc = parseFloat(document.getElementById('eccentricity').value) / 100;
                const r = SUN_DISTANCE * (1 - ecc * ecc) / (1 + ecc * Math.cos(orbitalRadians));

                mercuryGroup.position.x = r * Math.cos(orbitalRadians);
                mercuryGroup.position.z = r * Math.sin(orbitalRadians);

                // Вращение Меркурия (резонанс 3:2)
                // За 2 оборота вокруг Солнца Меркурий делает 3 оборота вокруг своей оси
                mercuryRotation += deltaTime * (360 / ROTATION_PERIOD);
                mercury.rotation.y = mercuryRotation * Math.PI / 180;

                // Обновляем направление света
                const lightDirection = mercuryGroup.position.clone().normalize().multiplyScalar(-1);
                sunLight.position.copy(lightDirection.multiplyScalar(10));
                sunLight.target.position.copy(mercuryGroup.position);

                // Обновление информации
                const mercuryDay = Math.floor((mercuryRotation % 360) / 360 * SOLAR_DAY) + 1;
                const mercuryYear = Math.floor((orbitalAngle % 360) / 360 * MERCURY_YEAR_LENGTH) + 1;
                const rotations = Math.floor(mercuryRotation / 360);
                const orbits = Math.floor(orbitalAngle / 360);

                document.getElementById('mercury-day').textContent = mercuryDay;
                document.getElementById('mercury-year').textContent = mercuryYear;
                document.getElementById('resonance').textContent = `${rotations}/${orbits}`;

                const hours = ((mercuryRotation / 15) % 24).toFixed(1);
                document.getElementById('local-time').textContent = hours + ':00';

                // В перигелии терминатор движется быстрее
                const angularVelocity = (1 + ecc * Math.cos(orbitalRadians)) * 3.5;
                document.getElementById('terminator-speed').textContent =
                    angularVelocity.toFixed(1) + ' км/ч';

                // Обновление камеры на поверхности
                if (isSurfaceView) {
                    updateSurfaceCamera();
                }
            }

            controls.update();
            renderer.render(scene, camera);
        }

        // OrbitControls
        THREE.OrbitControls = function(object, domElement) {
            this.object = object;
            this.domElement = domElement;
            this.enabled = true;
            this.target = new THREE.Vector3();

            this.minDistance = 0;
            this.maxDistance = Infinity;
            this.minPolarAngle = 0;
            this.maxPolarAngle = Math.PI;

            this.enableDamping = false;
            this.dampingFactor = 0.05;

            const scope = this;
            const STATE = { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2 };
            let state = STATE.NONE;

            const spherical = new THREE.Spherical();
            const sphericalDelta = new THREE.Spherical();
            const panOffset = new THREE.Vector3();

            const rotateStart = new THREE.Vector2();
            const rotateEnd = new THREE.Vector2();
            const rotateDelta = new THREE.Vector2();

            const panStart = new THREE.Vector2();
            const panEnd = new THREE.Vector2();
            const panDelta = new THREE.Vector2();

            const zoomStart = new THREE.Vector2();
            const zoomEnd = new THREE.Vector2();
            const zoomDelta = new THREE.Vector2();

            function onMouseDown(event) {
                if (!scope.enabled) return;

                event.preventDefault();

                if (event.button === 0) {
                    state = STATE.ROTATE;
                    rotateStart.set(event.clientX, event.clientY);
                } else if (event.button === 1) {
                    state = STATE.ZOOM;
                    zoomStart.set(event.clientX, event.clientY);
                } else if (event.button === 2) {
                    state = STATE.PAN;
                    panStart.set(event.clientX, event.clientY);
                }
            }

            function onMouseMove(event) {
                if (!scope.enabled) return;

                event.preventDefault();

                if (state === STATE.ROTATE) {
                    rotateEnd.set(event.clientX, event.clientY);
                    rotateDelta.subVectors(rotateEnd, rotateStart);

                    sphericalDelta.theta -= 2 * Math.PI * rotateDelta.x / domElement.clientWidth;
                    sphericalDelta.phi -= 2 * Math.PI * rotateDelta.y / domElement.clientHeight;

                    rotateStart.copy(rotateEnd);
                } else if (state === STATE.ZOOM) {
                    zoomEnd.set(event.clientX, event.clientY);
                    zoomDelta.subVectors(zoomEnd, zoomStart);

                    if (zoomDelta.y > 0) {
                        sphericalDelta.radius /= 1.05;
                    } else if (zoomDelta.y < 0) {
                        sphericalDelta.radius *= 1.05;
                    }

                    zoomStart.copy(zoomEnd);
                } else if (state === STATE.PAN) {
                    panEnd.set(event.clientX, event.clientY);
                    panDelta.subVectors(panEnd, panStart);

                    const offset = new THREE.Vector3();
                    const distance = object.position.distanceTo(scope.target);

                    offset.x = panDelta.x * distance * 0.001;
                    offset.y = -panDelta.y * distance * 0.001;

                    panOffset.add(offset);
                    panStart.copy(panEnd);
                }
            }

            function onMouseUp() {
                if (!scope.enabled) return;
                state = STATE.NONE;
            }

            function onMouseWheel(event) {
                if (!scope.enabled) return;

                event.preventDefault();

                if (event.deltaY < 0) {
                    sphericalDelta.radius /= 1.05;
                } else {
                    sphericalDelta.radius *= 1.05;
                }
            }

            this.update = function() {
                const offset = new THREE.Vector3();
                offset.copy(scope.object.position).sub(scope.target);

                spherical.setFromVector3(offset);

                spherical.theta += sphericalDelta.theta;
                spherical.phi += sphericalDelta.phi;
                spherical.phi = Math.max(scope.minPolarAngle, Math.min(scope.maxPolarAngle, spherical.phi));
                spherical.radius += sphericalDelta.radius;
                spherical.radius = Math.max(scope.minDistance, Math.min(scope.maxDistance, spherical.radius));

                scope.target.add(panOffset);

                offset.setFromSpherical(spherical);
                scope.object.position.copy(scope.target).add(offset);
                scope.object.lookAt(scope.target);

                if (scope.enableDamping) {
                    sphericalDelta.theta *= (1 - scope.dampingFactor);
                    sphericalDelta.phi *= (1 - scope.dampingFactor);
                    sphericalDelta.radius = 0;
                    panOffset.multiplyScalar(1 - scope.dampingFactor);
                } else {
                    sphericalDelta.set(0, 0, 0);
                    panOffset.set(0, 0, 0);
                }
            };

            domElement.addEventListener('mousedown', onMouseDown, false);
            domElement.addEventListener('mousemove', onMouseMove, false);
            domElement.addEventListener('mouseup', onMouseUp, false);
            domElement.addEventListener('wheel', onMouseWheel, false);
            domElement.addEventListener('contextmenu', e => e.preventDefault(), false);
        };

        // Запуск
        if (typeof THREE !== 'undefined') {
            init();
        } else {
            document.getElementById('loading').textContent = 'Ошибка загрузки Three.js';
        }
