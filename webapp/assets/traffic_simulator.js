"use strict";
var aisSimulator;
(function (aisSimulator) {
    let eAisClass;
    (function (eAisClass) {
        eAisClass[eAisClass["A"] = 1] = "A";
        eAisClass[eAisClass["B"] = 2] = "B";
    })(eAisClass = aisSimulator.eAisClass || (aisSimulator.eAisClass = {}));
    let eMovementMode;
    (function (eMovementMode) {
        eMovementMode[eMovementMode["DeadReckoning"] = 0] = "DeadReckoning";
        eMovementMode[eMovementMode["Circle"] = 1] = "Circle";
        eMovementMode[eMovementMode["Route"] = 2] = "Route";
    })(eMovementMode = aisSimulator.eMovementMode || (aisSimulator.eMovementMode = {}));
    const KM_PER_DEG_LAT = 111.32;
    const KNOTS_TO_KMH = 1.852;
    function kmPerDegLon(latDeg) {
        return KM_PER_DEG_LAT * Math.cos(latDeg * Math.PI / 180);
    }
    function offsetLatLon(lat, lon, bearingDeg, distanceKm) {
        const bearingRad = bearingDeg * Math.PI / 180;
        const dLat = (distanceKm * Math.cos(bearingRad)) / KM_PER_DEG_LAT;
        const dLon = (distanceKm * Math.sin(bearingRad)) / kmPerDegLon(lat);
        return [lat + dLat, lon + dLon];
    }
    function distanceKm(lat1, lon1, lat2, lon2) {
        const avgLat = (lat1 + lat2) / 2;
        const dLatKm = (lat2 - lat1) * KM_PER_DEG_LAT;
        const dLonKm = (lon2 - lon1) * kmPerDegLon(avgLat);
        return Math.sqrt(dLatKm * dLatKm + dLonKm * dLonKm);
    }
    function bearingDegTo(lat1, lon1, lat2, lon2) {
        const avgLat = (lat1 + lat2) / 2;
        const dLatKm = (lat2 - lat1) * KM_PER_DEG_LAT;
        const dLonKm = (lon2 - lon1) * kmPerDegLon(avgLat);
        const deg = Math.atan2(dLonKm, dLatKm) * 180 / Math.PI;
        return deg < 0 ? deg + 360 : deg;
    }
    function advanceDeadReckoning(v, dtSec) {
        const distKm = v.speed * KNOTS_TO_KMH * dtSec / 3600;
        [v.posLat, v.posLon] = offsetLatLon(v.posLat, v.posLon, v.course, distKm);
    }
    function advanceCircle(v, dtSec) {
        if (v.circleRadiusKm <= 0) {
            advanceDeadReckoning(v, dtSec);
            return;
        }
        const angularVelDegPerSec = (v.speed * KNOTS_TO_KMH / v.circleRadiusKm) * (180 / Math.PI) / 3600;
        v.circleAngleDeg = (v.circleAngleDeg + angularVelDegPerSec * dtSec) % 360;
        [v.posLat, v.posLon] = offsetLatLon(v.circleCenterLat, v.circleCenterLon, v.circleAngleDeg, v.circleRadiusKm);
        v.course = (v.circleAngleDeg + 90) % 360;
    }
    function advanceRoute(v, dtSec) {
        const route = v.route;
        if (route.navPoints.length === 0 || route.currentLegIndex >= route.navPoints.length) {
            return;
        }
        let remainingKm = v.speed * KNOTS_TO_KMH * dtSec / 3600;
        let guard = route.navPoints.length + 1;
        while (remainingKm > 0 && guard > 0 && route.currentLegIndex < route.navPoints.length) {
            guard -= 1;
            const target = route.navPoints[route.currentLegIndex];
            const distToTarget = distanceKm(v.posLat, v.posLon, target.lat, target.lon);
            const bearing = bearingDegTo(v.posLat, v.posLon, target.lat, target.lon);
            v.course = bearing;
            if (remainingKm >= distToTarget) {
                v.posLat = target.lat;
                v.posLon = target.lon;
                remainingKm -= distToTarget;
                route.currentLegIndex += 1;
                if (route.currentLegIndex >= route.navPoints.length) {
                    if (route.repeat) {
                        route.currentLegIndex = 0;
                    }
                    else {
                        v.speed = 0;
                        v.status = 1;
                        break;
                    }
                }
            }
            else {
                [v.posLat, v.posLon] = offsetLatLon(v.posLat, v.posLon, bearing, remainingKm);
                remainingKm = 0;
            }
        }
    }
    function advanceVessel(v, dtSec) {
        switch (v.movementMode) {
            case eMovementMode.Circle:
                advanceCircle(v, dtSec);
                break;
            case eMovementMode.Route:
                advanceRoute(v, dtSec);
                break;
            default:
                advanceDeadReckoning(v, dtSec);
                break;
        }
    }
    class TrafficSimulator {
        static selfTest() {
            const dr = makeTestVessel();
            dr.course = 0;
            dr.speed = 60 / KNOTS_TO_KMH;
            const startLat = dr.posLat;
            advanceVessel(dr, 3600);
            const expectedDLat = 60 / KM_PER_DEG_LAT;
            console.assert(Math.abs((dr.posLat - startLat) - expectedDLat) < 0.001, "dead reckoning distance mismatch");
            const c = makeTestVessel();
            c.movementMode = eMovementMode.Circle;
            c.circleCenterLat = c.posLat;
            c.circleCenterLon = c.posLon;
            c.circleRadiusKm = 1;
            c.speed = 10;
            const angularVelDegPerSec = (c.speed * KNOTS_TO_KMH / c.circleRadiusKm) * (180 / Math.PI) / 3600;
            const periodSec = 360 / angularVelDegPerSec;
            advanceVessel(c, periodSec);
            console.assert(Math.abs(c.circleAngleDeg % 360) < 0.01, "circle mode did not return to its start angle after one period");
            const r = makeTestVessel();
            const target = { lat: r.posLat + 0.02, lon: r.posLon };
            r.movementMode = eMovementMode.Route;
            r.speed = 1000;
            r.route = { navPoints: [{ lat: r.posLat + 0.01, lon: r.posLon }, target], repeat: false, currentLegIndex: 0 };
            advanceVessel(r, 3600);
            console.assert(Math.abs(r.posLat - target.lat) < 1e-6 && Math.abs(r.posLon - target.lon) < 1e-6, "non-repeating route did not stop at its final waypoint");
            console.assert(r.speed === 0, "vessel should stop after a non-repeating route completes");
            console.info("TrafficSimulator.selfTest() done, see above for any failed assertions.");
        }
    }
    aisSimulator.TrafficSimulator = TrafficSimulator;
    function makeTestVessel() {
        return {
            mmsi: 123456789,
            name: "Test",
            callsign: "TEST",
            aisClass: eAisClass.A,
            type: 60,
            length: 50,
            beam: 10,
            draught: 50,
            destination: "Test",
            status: 0,
            posLat: 48.0,
            posLon: 10.0,
            speed: 10,
            course: 0,
            movementMode: eMovementMode.DeadReckoning,
            circleCenterLat: 48.0,
            circleCenterLon: 10.0,
            circleRadiusKm: 1,
            circleAngleDeg: 0,
            route: { navPoints: [], repeat: false, currentLegIndex: 0 },
            positionIntervalSec: 10,
            staticIntervalSec: 360,
            nextPositionSendAt: 0,
            nextStaticSendAt: 0,
        };
    }
    (() => {
        const vessels = new Map();
        const markers = new Map();
        const routeLines = new Map();
        let map = null;
        let tickHandle = null;
        let lastTick = Date.now();
        let uiMode = "idle";
        let routeTargetMmsi = null;
        let editingMmsi = null;
        let vesselModal = null;
        const vesselCountInput = document.getElementById("simVesselCountInput");
        const centerLatInput = document.getElementById("simCenterLatInput");
        const centerLonInput = document.getElementById("simCenterLonInput");
        const scatterRadiusInput = document.getElementById("simScatterRadiusInput");
        const defaultClassSelect = document.getElementById("simDefaultClassSelect");
        const speedMinInput = document.getElementById("simSpeedMinInput");
        const speedMaxInput = document.getElementById("simSpeedMaxInput");
        const positionIntervalInput = document.getElementById("simPositionIntervalInput");
        const staticIntervalInput = document.getElementById("simStaticIntervalInput");
        const startButton = document.getElementById("simStartButton");
        const stopButton = document.getElementById("simStopButton");
        const vesselListBody = document.getElementById("simVesselListBody");
        const pickCenterButton = document.getElementById("simPickCenterButton");
        const vesselNames = [
            "Bremen", "Europa", "Deutschland", "Cap San Diego", "Pamir", "Passat",
            "Peking", "Rickmer Rickmers", "Preussen", "Vaterland", "Imperator", "Wappen von Hamburg",
        ];
        function defaultAisParameter() {
            return {
                addrMsg: "", altitude: 4095, beam: 0, callsign: "", channelA: 2087, channelB: 2088,
                course: 0, destination: "", destMmsi: 0, draught: 0, eta: new Date(),
                fatdmaOffset: 0, fatdmaRepeat: 0, fatdmaSlot: 0, fatdmaTimeout: 0,
                interrogationMsgType: 1, interval: 0, length: 0, msgType: 1,
                msgType24: aisSimulator.eMessageType24.Unknown, name: "", navAidName: "", navAidSimType: aisSimulator.eAtoN.Unknown,
                navAidType: 0, neLat: 0, neLon: 0, posLat: 0, posLon: 0, quiet: 0, sartMsg: "",
                speed: 0, srcMmsi: 0, status: 15, swLat: 0, swLon: 0, type: 0,
            };
        }
        function sendPosition(v) {
            const ap = defaultAisParameter();
            ap.srcMmsi = v.mmsi;
            ap.msgType = v.aisClass === eAisClass.A ? 1 : 18;
            ap.posLat = v.posLat;
            ap.posLon = v.posLon;
            ap.speed = v.speed;
            ap.course = v.course;
            ap.status = v.status;
            aisSimulator.sendAisMessage(ap);
        }
        function sendStatic(v) {
            if (v.aisClass === eAisClass.A) {
                const ap = defaultAisParameter();
                ap.srcMmsi = v.mmsi;
                ap.msgType = 5;
                ap.callsign = v.callsign;
                ap.name = v.name;
                ap.type = v.type;
                ap.length = v.length;
                ap.beam = v.beam;
                ap.eta = new Date(Date.now() + 3600000);
                ap.draught = v.draught;
                ap.destination = v.destination;
                aisSimulator.sendAisMessage(ap);
                return;
            }
            const apA = defaultAisParameter();
            apA.srcMmsi = v.mmsi;
            apA.msgType = 24;
            apA.msgType24 = aisSimulator.eMessageType24.TypeA;
            apA.name = v.name;
            aisSimulator.sendAisMessage(apA);
            const apB = defaultAisParameter();
            apB.srcMmsi = v.mmsi;
            apB.msgType = 24;
            apB.msgType24 = aisSimulator.eMessageType24.TypeB;
            apB.callsign = v.callsign;
            apB.type = v.type;
            apB.length = v.length;
            apB.beam = v.beam;
            aisSimulator.sendAisMessage(apB);
        }
        function getVesselTypeOptions() {
            const select = document.getElementById("aisVesselTypeSelect");
            return Array.from(select.options).map((o) => parseInt(o.value, 10)).filter((n) => n > 0);
        }
        function randomInRange(min, max) {
            return min + Math.random() * (max - min);
        }
        function randomMmsi(used) {
            let mmsi;
            do {
                mmsi = 200000000 + Math.floor(Math.random() * 700000000);
            } while (used.has(mmsi));
            used.add(mmsi);
            return mmsi;
        }
        function randomPointNear(centerLat, centerLon, radiusKm) {
            const r = radiusKm * Math.sqrt(Math.random());
            const bearing = Math.random() * 360;
            return offsetLatLon(centerLat, centerLon, bearing, r);
        }
        function escapeHtml(s) {
            const div = document.createElement("div");
            div.textContent = s;
            return div.innerHTML;
        }
        function vesselIcon(course) {
            return L.divIcon({
                html: `<div style="transform: rotate(${course}deg); font-size: 16px; line-height: 16px;">▲</div>`,
                className: "sim-vessel-icon",
                iconSize: [16, 16],
                iconAnchor: [8, 8],
            });
        }
        function updateMarkerRotation(marker, course) {
            const el = marker.getElement();
            const inner = el ? el.firstElementChild : null;
            if (inner) {
                inner.style.transform = `rotate(${course}deg)`;
            }
        }
        function addMarker(v) {
            const marker = L.marker([v.posLat, v.posLon], { icon: vesselIcon(v.course) }).addTo(map);
            marker.on("click", () => openVesselModal(v.mmsi));
            markers.set(v.mmsi, marker);
        }
        function updateRouteLine(v) {
            const points = v.route.navPoints.map((p) => [p.lat, p.lon]);
            let line = routeLines.get(v.mmsi);
            if (points.length === 0) {
                if (line) {
                    line.remove();
                    routeLines.delete(v.mmsi);
                }
                return;
            }
            if (!line) {
                line = L.polyline(points, { color: "blue", weight: 2, dashArray: "4" }).addTo(map);
                routeLines.set(v.mmsi, line);
            }
            else {
                line.setLatLngs(points);
            }
        }
        function removeVessel(mmsi) {
            vessels.delete(mmsi);
            const marker = markers.get(mmsi);
            if (marker) {
                marker.remove();
                markers.delete(mmsi);
            }
            const line = routeLines.get(mmsi);
            if (line) {
                line.remove();
                routeLines.delete(mmsi);
            }
            rebuildVesselList();
        }
        function rebuildVesselList() {
            const modeLabels = ["Free", "Circle", "Route"];
            const rows = [];
            for (const v of vessels.values()) {
                rows.push(`<tr data-mmsi="${v.mmsi}" style="cursor: pointer">` +
                    `<td>${v.mmsi}</td><td>${escapeHtml(v.name)}</td>` +
                    `<td>${v.speed.toFixed(1)}</td><td>${modeLabels[v.movementMode]}</td></tr>`);
            }
            vesselListBody.innerHTML = rows.join("");
        }
        function generateVessels() {
            const count = aisSimulator.validateNumericField(vesselCountInput, (s) => parseInt(s, 10), 1, 200);
            const centerLat = aisSimulator.validateNumericField(centerLatInput, parseFloat, -90, 90);
            const centerLon = aisSimulator.validateNumericField(centerLonInput, parseFloat, -180, 180);
            const radiusKm = aisSimulator.validateNumericField(scatterRadiusInput, parseFloat, 0.1, 500);
            const speedMin = aisSimulator.validateNumericField(speedMinInput, parseFloat, 0, 50);
            const speedMax = aisSimulator.validateNumericField(speedMaxInput, parseFloat, 0, 50);
            const posInterval = aisSimulator.validateNumericField(positionIntervalInput, (s) => parseInt(s, 10), 2, 180);
            const staticInterval = aisSimulator.validateNumericField(staticIntervalInput, (s) => parseInt(s, 10), 10, 1800);
            if (count === null || centerLat === null || centerLon === null || radiusKm === null
                || speedMin === null || speedMax === null || posInterval === null || staticInterval === null) {
                aisSimulator.showToast("Fix the highlighted simulator fields first.", "error", 3000);
                return;
            }
            const defaultClass = parseInt(defaultClassSelect.value, 10);
            const typeOptions = getVesselTypeOptions();
            const usedMmsi = new Set(vessels.keys());
            for (let i = 0; i < count; i++) {
                const mmsi = randomMmsi(usedMmsi);
                const [lat, lon] = randomPointNear(centerLat, centerLon, radiusKm);
                const v = {
                    mmsi,
                    name: `${vesselNames[Math.floor(Math.random() * vesselNames.length)]} ${mmsi % 1000}`,
                    callsign: `SIM${mmsi % 10000}`,
                    aisClass: defaultClass,
                    type: typeOptions[Math.floor(Math.random() * typeOptions.length)],
                    length: 20 + Math.floor(Math.random() * 180),
                    beam: 5 + Math.floor(Math.random() * 25),
                    draught: 20 + Math.floor(Math.random() * 80),
                    destination: "Unknown",
                    status: 0,
                    posLat: lat,
                    posLon: lon,
                    speed: randomInRange(speedMin, speedMax),
                    course: Math.random() * 360,
                    movementMode: eMovementMode.DeadReckoning,
                    circleCenterLat: lat,
                    circleCenterLon: lon,
                    circleRadiusKm: 1,
                    circleAngleDeg: 0,
                    route: { navPoints: [], repeat: true, currentLegIndex: 0 },
                    positionIntervalSec: posInterval,
                    staticIntervalSec: staticInterval,
                    nextPositionSendAt: Date.now() + Math.random() * posInterval * 1000,
                    nextStaticSendAt: Date.now() + Math.random() * staticInterval * 1000,
                };
                vessels.set(mmsi, v);
                addMarker(v);
            }
            rebuildVesselList();
        }
        function tick() {
            const now = Date.now();
            const dt = (now - lastTick) / 1000;
            lastTick = now;
            for (const v of vessels.values()) {
                advanceVessel(v, dt);
                const marker = markers.get(v.mmsi);
                if (marker) {
                    marker.setLatLng([v.posLat, v.posLon]);
                    updateMarkerRotation(marker, v.course);
                }
                if (now >= v.nextPositionSendAt) {
                    sendPosition(v);
                    v.nextPositionSendAt = now + v.positionIntervalSec * 1000;
                }
                if (now >= v.nextStaticSendAt) {
                    sendStatic(v);
                    v.nextStaticSendAt = now + v.staticIntervalSec * 1000;
                }
            }
            rebuildVesselList();
        }
        function startSimulation() {
            if (vessels.size === 0) {
                generateVessels();
                if (vessels.size === 0) {
                    return;
                }
            }
            if (tickHandle === null) {
                lastTick = Date.now();
                tickHandle = window.setInterval(tick, 1000);
            }
            startButton.disabled = true;
            stopButton.disabled = false;
            aisSimulator.showToast(`Started simulation with ${vessels.size} vessels.`, "success", 1500);
        }
        function stopSimulation() {
            if (tickHandle !== null) {
                window.clearInterval(tickHandle);
                tickHandle = null;
            }
            startButton.disabled = false;
            stopButton.disabled = true;
        }
        function updateModeGroupVisibility() {
            const mode = parseInt(document.getElementById("vesselMovementModeSelect").value, 10);
            document.getElementById("vesselCircleGroup").style.display = mode === eMovementMode.Circle ? "block" : "none";
            document.getElementById("vesselRouteGroup").style.display = mode === eMovementMode.Route ? "block" : "none";
        }
        function ensureVesselModal() {
            if (!vesselModal) {
                vesselModal = new bootstrap.Modal(document.getElementById("vesselConfigModal"));
            }
            return vesselModal;
        }
        function openVesselModal(mmsi) {
            const v = vessels.get(mmsi);
            if (!v) {
                return;
            }
            editingMmsi = mmsi;
            document.getElementById("vesselMmsiInput").value = String(v.mmsi);
            document.getElementById("vesselNameInput").value = v.name;
            document.getElementById("vesselCallsignInput").value = v.callsign;
            document.getElementById("vesselClassSelect").value = String(v.aisClass);
            document.getElementById("vesselTypeSelect").value = String(v.type);
            document.getElementById("vesselLengthInput").value = String(v.length);
            document.getElementById("vesselBeamInput").value = String(v.beam);
            document.getElementById("vesselDraughtInput").value = (v.draught / 10).toFixed(1);
            document.getElementById("vesselDestinationInput").value = v.destination;
            document.getElementById("vesselStatusSelect").value = String(v.status);
            document.getElementById("vesselSpeedInput").value = v.speed.toFixed(1);
            document.getElementById("vesselCourseInput").value = v.course.toFixed(1);
            document.getElementById("vesselMovementModeSelect").value = String(v.movementMode);
            document.getElementById("vesselCircleRadiusInput").value = String(v.circleRadiusKm);
            document.getElementById("vesselRouteRepeatCheckbox").checked = v.route.repeat;
            document.getElementById("vesselPositionIntervalInput").value = String(v.positionIntervalSec);
            document.getElementById("vesselStaticIntervalInput").value = String(v.staticIntervalSec);
            updateModeGroupVisibility();
            ensureVesselModal().show();
        }
        function saveVesselModal() {
            if (editingMmsi === null) {
                return false;
            }
            const v = vessels.get(editingMmsi);
            if (!v) {
                return false;
            }
            const name = aisSimulator.validateStringField(document.getElementById("vesselNameInput"), 1, 20);
            if (name === null) {
                return false;
            }
            const callsign = aisSimulator.validateStringField(document.getElementById("vesselCallsignInput"), 1, 7);
            if (callsign === null) {
                return false;
            }
            const destination = aisSimulator.validateStringField(document.getElementById("vesselDestinationInput"), 1, 20);
            if (destination === null) {
                return false;
            }
            const length = aisSimulator.validateNumericField(document.getElementById("vesselLengthInput"), (s) => parseInt(s, 10), 0, 1022);
            if (length === null) {
                return false;
            }
            const beam = aisSimulator.validateNumericField(document.getElementById("vesselBeamInput"), (s) => parseInt(s, 10), 1, 126);
            if (beam === null) {
                return false;
            }
            const draughtM = aisSimulator.validateNumericField(document.getElementById("vesselDraughtInput"), parseFloat, 0, 25.5);
            if (draughtM === null) {
                return false;
            }
            const speed = aisSimulator.validateNumericField(document.getElementById("vesselSpeedInput"), parseFloat, 0, 102.2);
            if (speed === null) {
                return false;
            }
            const course = aisSimulator.validateNumericField(document.getElementById("vesselCourseInput"), parseFloat, 0, 359.9);
            if (course === null) {
                return false;
            }
            const circleRadius = aisSimulator.validateNumericField(document.getElementById("vesselCircleRadiusInput"), parseFloat, 0.05, 200);
            if (circleRadius === null) {
                return false;
            }
            const positionInterval = aisSimulator.validateNumericField(document.getElementById("vesselPositionIntervalInput"), (s) => parseInt(s, 10), 2, 180);
            if (positionInterval === null) {
                return false;
            }
            const staticInterval = aisSimulator.validateNumericField(document.getElementById("vesselStaticIntervalInput"), (s) => parseInt(s, 10), 10, 1800);
            if (staticInterval === null) {
                return false;
            }
            v.name = name;
            v.callsign = callsign;
            v.destination = destination;
            v.aisClass = parseInt(document.getElementById("vesselClassSelect").value, 10);
            v.type = parseInt(document.getElementById("vesselTypeSelect").value, 10);
            v.length = length;
            v.beam = beam;
            v.draught = Math.round(draughtM * 10);
            v.status = parseInt(document.getElementById("vesselStatusSelect").value, 10);
            v.speed = speed;
            v.course = course;
            v.movementMode = parseInt(document.getElementById("vesselMovementModeSelect").value, 10);
            v.circleRadiusKm = circleRadius;
            v.circleCenterLat = v.posLat;
            v.circleCenterLon = v.posLon;
            v.circleAngleDeg = 0;
            v.route.repeat = document.getElementById("vesselRouteRepeatCheckbox").checked;
            v.positionIntervalSec = positionInterval;
            v.staticIntervalSec = staticInterval;
            ensureVesselModal().hide();
            rebuildVesselList();
            return true;
        }
        function onMapClick(e) {
            if (uiMode === "pickCenter") {
                centerLatInput.value = e.latlng.lat.toFixed(6);
                centerLonInput.value = e.latlng.lng.toFixed(6);
                uiMode = "idle";
                pickCenterButton.classList.remove("active");
                aisSimulator.showToast("Center set.", "success", 1500);
            }
            else if (uiMode === "drawRoute" && routeTargetMmsi !== null) {
                const v = vessels.get(routeTargetMmsi);
                if (v) {
                    v.route.navPoints.push({ lat: e.latlng.lat, lon: e.latlng.lng });
                    updateRouteLine(v);
                }
            }
        }
        function ensureMap() {
            if (map) {
                map.invalidateSize();
                return;
            }
            map = L.map("simMap").setView([parseFloat(centerLatInput.value), parseFloat(centerLonInput.value)], 10);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "&copy; OpenStreetMap contributors",
                maxZoom: 19,
            }).addTo(map);
            map.on("click", onMapClick);
        }
        document.getElementById("vesselTypeSelect").innerHTML =
            document.getElementById("aisVesselTypeSelect").innerHTML;
        document.getElementById("trafficSimulator-tab").addEventListener("shown.bs.tab", ensureMap);
        startButton.addEventListener("click", startSimulation);
        stopButton.addEventListener("click", stopSimulation);
        pickCenterButton.addEventListener("click", () => {
            if (uiMode === "pickCenter") {
                uiMode = "idle";
                pickCenterButton.classList.remove("active");
            }
            else {
                uiMode = "pickCenter";
                pickCenterButton.classList.add("active");
            }
        });
        vesselListBody.addEventListener("click", (e) => {
            const tr = e.target.closest("tr[data-mmsi]");
            if (tr) {
                openVesselModal(parseInt(tr.dataset.mmsi, 10));
            }
        });
        document.getElementById("vesselMovementModeSelect").addEventListener("change", updateModeGroupVisibility);
        document.getElementById("vesselConfigSaveButton").addEventListener("click", saveVesselModal);
        document.getElementById("vesselRemoveButton").addEventListener("click", () => {
            if (editingMmsi === null) {
                return;
            }
            removeVessel(editingMmsi);
            ensureVesselModal().hide();
        });
        document.getElementById("vesselDrawRouteButton").addEventListener("click", (e) => {
            if (editingMmsi === null) {
                return;
            }
            const btn = e.currentTarget;
            if (uiMode === "drawRoute" && routeTargetMmsi === editingMmsi) {
                uiMode = "idle";
                routeTargetMmsi = null;
                btn.classList.remove("active");
                aisSimulator.showToast("Finished drawing route.", "success", 1500);
            }
            else {
                if (!saveVesselModal()) {
                    return;
                }
                uiMode = "drawRoute";
                routeTargetMmsi = editingMmsi;
                btn.classList.add("active");
                aisSimulator.showToast("Click the map to add waypoints, then reopen this vessel and click \"Draw Route\" again to finish.", "success", 4000);
            }
        });
        document.getElementById("vesselClearRouteButton").addEventListener("click", () => {
            if (editingMmsi === null) {
                return;
            }
            const v = vessels.get(editingMmsi);
            if (v) {
                v.route.navPoints = [];
                v.route.currentLegIndex = 0;
                updateRouteLine(v);
            }
        });
    })();
})(aisSimulator || (aisSimulator = {}));
//# sourceMappingURL=traffic_simulator.js.map