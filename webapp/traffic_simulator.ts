// Part of ais-simulator, a AIS message composer and transmitter.
//
// Copyright (c) 2020 Michael Wolf <michael@mictronics.de>
//
// This file is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// This file is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
// General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

namespace aisSimulator {

    export enum eAisClass {
        A = 1,
        B = 2,
    }

    export enum eMovementMode {
        DeadReckoning = 0,
        Circle = 1,
        Route = 2,
    }

    const KM_PER_DEG_LAT = 111.32;
    const KNOTS_TO_KMH = 1.852;

    function kmPerDegLon(latDeg: number): number {
        return KM_PER_DEG_LAT * Math.cos(latDeg * Math.PI / 180);
    }

    // ponytail: flat-earth approximation, good to ~a few hundred km away from the poles.
    // Switch to full great-circle math if transoceanic ranges ever matter here.
    function offsetLatLon(lat: number, lon: number, bearingDeg: number, distanceKm: number): [number, number] {
        const bearingRad = bearingDeg * Math.PI / 180;
        const dLat = (distanceKm * Math.cos(bearingRad)) / KM_PER_DEG_LAT;
        const dLon = (distanceKm * Math.sin(bearingRad)) / kmPerDegLon(lat);
        return [lat + dLat, lon + dLon];
    }

    function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const avgLat = (lat1 + lat2) / 2;
        const dLatKm = (lat2 - lat1) * KM_PER_DEG_LAT;
        const dLonKm = (lon2 - lon1) * kmPerDegLon(avgLat);
        return Math.sqrt(dLatKm * dLatKm + dLonKm * dLonKm);
    }

    function bearingDegTo(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const avgLat = (lat1 + lat2) / 2;
        const dLatKm = (lat2 - lat1) * KM_PER_DEG_LAT;
        const dLonKm = (lon2 - lon1) * kmPerDegLon(avgLat);
        const deg = Math.atan2(dLonKm, dLatKm) * 180 / Math.PI;
        return deg < 0 ? deg + 360 : deg;
    }

    function advanceDeadReckoning(v: IVessel, dtSec: number): void {
        const distKm = v.speed * KNOTS_TO_KMH * dtSec / 3600;
        [v.posLat, v.posLon] = offsetLatLon(v.posLat, v.posLon, v.course, distKm);
    }

    function advanceCircle(v: IVessel, dtSec: number): void {
        if (v.circleRadiusKm <= 0) {
            advanceDeadReckoning(v, dtSec);
            return;
        }
        // omega = v/r keeps the reported speed physically consistent with the orbit.
        const angularVelDegPerSec = (v.speed * KNOTS_TO_KMH / v.circleRadiusKm) * (180 / Math.PI) / 3600;
        v.circleAngleDeg = (v.circleAngleDeg + angularVelDegPerSec * dtSec) % 360;
        [v.posLat, v.posLon] = offsetLatLon(v.circleCenterLat, v.circleCenterLon, v.circleAngleDeg, v.circleRadiusKm);
        v.course = (v.circleAngleDeg + 90) % 360; // tangent to the circle
    }

    function advanceRoute(v: IVessel, dtSec: number): void {
        const route = v.route;
        if (route.navPoints.length === 0 || route.currentLegIndex >= route.navPoints.length) {
            return;
        }
        let remainingKm = v.speed * KNOTS_TO_KMH * dtSec / 3600;
        // Guards against a hang on a degenerate route (e.g. a single repeating waypoint, or
        // duplicate points), where a lap's distance can be ~0 and would otherwise never
        // consume remainingKm. One full lap per tick is already more than any real tick needs.
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
                    } else {
                        v.speed = 0;
                        v.status = 1; // at anchor
                        break;
                    }
                }
            } else {
                [v.posLat, v.posLon] = offsetLatLon(v.posLat, v.posLon, bearing, remainingKm);
                remainingKm = 0;
            }
        }
    }

    function advanceVessel(v: IVessel, dtSec: number): void {
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

    export class TrafficSimulator {
        /**
         * Sanity-check the movement math from the browser dev console, mirroring
         * AivdmEncoder.encoderTest()'s manual, never-wired-into-CI convention.
         */
        public static selfTest(): void {
            const dr = makeTestVessel();
            dr.course = 0; // due north
            dr.speed = 60 / KNOTS_TO_KMH; // 60 km/h
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
            r.speed = 1000; // fast enough to cover the whole route in one tick
            r.route = { navPoints: [{ lat: r.posLat + 0.01, lon: r.posLon }, target], repeat: false, currentLegIndex: 0 };
            advanceVessel(r, 3600);
            console.assert(Math.abs(r.posLat - target.lat) < 1e-6 && Math.abs(r.posLon - target.lon) < 1e-6, "non-repeating route did not stop at its final waypoint");
            console.assert(r.speed === 0, "vessel should stop after a non-repeating route completes");

            console.info("TrafficSimulator.selfTest() done, see above for any failed assertions.");
        }
    }

    function makeTestVessel(): IVessel {
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
        const vessels: Map<number, IVessel> = new Map();
        const markers: Map<number, L.Marker> = new Map();
        const routeLines: Map<number, L.Polyline> = new Map();

        let map: L.Map = null;
        let tickHandle: number = null;
        let lastTick: number = Date.now();
        let uiMode: "idle" | "pickCenter" | "drawRoute" = "idle";
        let routeTargetMmsi: number = null;
        let editingMmsi: number = null;
        let vesselModal: bootstrap.Modal = null;

        const vesselCountInput = document.getElementById("simVesselCountInput") as HTMLInputElement;
        const centerLatInput = document.getElementById("simCenterLatInput") as HTMLInputElement;
        const centerLonInput = document.getElementById("simCenterLonInput") as HTMLInputElement;
        const scatterRadiusInput = document.getElementById("simScatterRadiusInput") as HTMLInputElement;
        const defaultClassSelect = document.getElementById("simDefaultClassSelect") as HTMLSelectElement;
        const speedMinInput = document.getElementById("simSpeedMinInput") as HTMLInputElement;
        const speedMaxInput = document.getElementById("simSpeedMaxInput") as HTMLInputElement;
        const positionIntervalInput = document.getElementById("simPositionIntervalInput") as HTMLInputElement;
        const staticIntervalInput = document.getElementById("simStaticIntervalInput") as HTMLInputElement;
        const startButton = document.getElementById("simStartButton") as HTMLButtonElement;
        const stopButton = document.getElementById("simStopButton") as HTMLButtonElement;
        const vesselListBody = document.getElementById("simVesselListBody") as HTMLTableSectionElement;
        const pickCenterButton = document.getElementById("simPickCenterButton") as HTMLButtonElement;

        const vesselNames = [
            "Bremen", "Europa", "Deutschland", "Cap San Diego", "Pamir", "Passat",
            "Peking", "Rickmer Rickmers", "Preussen", "Vaterland", "Imperator", "Wappen von Hamburg",
        ];

        function defaultAisParameter(): IAisParameter {
            return {
                addrMsg: "", altitude: 4095, beam: 0, callsign: "", channelA: 2087, channelB: 2088,
                course: 0, destination: "", destMmsi: 0, draught: 0, eta: new Date(),
                fatdmaOffset: 0, fatdmaRepeat: 0, fatdmaSlot: 0, fatdmaTimeout: 0,
                interrogationMsgType: 1, interval: 0, length: 0, msgType: 1,
                msgType24: eMessageType24.Unknown, name: "", navAidName: "", navAidSimType: eAtoN.Unknown,
                navAidType: 0, neLat: 0, neLon: 0, posLat: 0, posLon: 0, quiet: 0, sartMsg: "",
                speed: 0, srcMmsi: 0, status: 15, swLat: 0, swLon: 0, type: 0,
            };
        }

        function sendPosition(v: IVessel): void {
            const ap = defaultAisParameter();
            ap.srcMmsi = v.mmsi;
            ap.msgType = v.aisClass === eAisClass.A ? 1 : 18;
            ap.posLat = v.posLat;
            ap.posLon = v.posLon;
            ap.speed = v.speed;
            ap.course = v.course;
            ap.status = v.status;
            sendAisMessage(ap);
        }

        function sendStatic(v: IVessel): void {
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
                ap.draught = v.draught; // already in 1/10 m, matches encodeMsgType5's expectation
                ap.destination = v.destination;
                sendAisMessage(ap);
                return;
            }
            const apA = defaultAisParameter();
            apA.srcMmsi = v.mmsi;
            apA.msgType = 24;
            apA.msgType24 = eMessageType24.TypeA;
            apA.name = v.name;
            sendAisMessage(apA);

            const apB = defaultAisParameter();
            apB.srcMmsi = v.mmsi;
            apB.msgType = 24;
            apB.msgType24 = eMessageType24.TypeB;
            apB.callsign = v.callsign;
            apB.type = v.type;
            apB.length = v.length;
            apB.beam = v.beam;
            sendAisMessage(apB);
        }

        function getVesselTypeOptions(): number[] {
            const select = document.getElementById("aisVesselTypeSelect") as HTMLSelectElement;
            return Array.from(select.options).map((o) => parseInt(o.value, 10)).filter((n) => n > 0);
        }

        function randomInRange(min: number, max: number): number {
            return min + Math.random() * (max - min);
        }

        function randomMmsi(used: Set<number>): number {
            let mmsi: number;
            do {
                mmsi = 200000000 + Math.floor(Math.random() * 700000000);
            } while (used.has(mmsi));
            used.add(mmsi);
            return mmsi;
        }

        function randomPointNear(centerLat: number, centerLon: number, radiusKm: number): [number, number] {
            const r = radiusKm * Math.sqrt(Math.random());
            const bearing = Math.random() * 360;
            return offsetLatLon(centerLat, centerLon, bearing, r);
        }

        function escapeHtml(s: string): string {
            const div = document.createElement("div");
            div.textContent = s;
            return div.innerHTML;
        }

        function vesselIcon(course: number): L.DivIcon {
            return L.divIcon({
                html: `<div style="transform: rotate(${course}deg); font-size: 16px; line-height: 16px;">▲</div>`,
                className: "sim-vessel-icon",
                iconSize: [16, 16],
                iconAnchor: [8, 8],
            });
        }

        function updateMarkerRotation(marker: L.Marker, course: number): void {
            const el = marker.getElement();
            const inner = el ? el.firstElementChild as HTMLElement : null;
            if (inner) {
                inner.style.transform = `rotate(${course}deg)`;
            }
        }

        function addMarker(v: IVessel): void {
            const marker = L.marker([v.posLat, v.posLon], { icon: vesselIcon(v.course) }).addTo(map);
            marker.on("click", () => openVesselModal(v.mmsi));
            markers.set(v.mmsi, marker);
        }

        function updateRouteLine(v: IVessel): void {
            const points: Array<[number, number]> = v.route.navPoints.map((p): [number, number] => [p.lat, p.lon]);
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
            } else {
                line.setLatLngs(points);
            }
        }

        function removeVessel(mmsi: number): void {
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

        function rebuildVesselList(): void {
            const modeLabels = ["Free", "Circle", "Route"];
            const rows: string[] = [];
            for (const v of vessels.values()) {
                rows.push(
                    `<tr data-mmsi="${v.mmsi}" style="cursor: pointer">` +
                    `<td>${v.mmsi}</td><td>${escapeHtml(v.name)}</td>` +
                    `<td>${v.speed.toFixed(1)}</td><td>${modeLabels[v.movementMode]}</td></tr>`,
                );
            }
            vesselListBody.innerHTML = rows.join("");
        }

        function generateVessels(): void {
            const count = validateNumericField(vesselCountInput, (s) => parseInt(s, 10), 1, 200);
            const centerLat = validateNumericField(centerLatInput, parseFloat, -90, 90);
            const centerLon = validateNumericField(centerLonInput, parseFloat, -180, 180);
            const radiusKm = validateNumericField(scatterRadiusInput, parseFloat, 0.1, 500);
            const speedMin = validateNumericField(speedMinInput, parseFloat, 0, 50);
            const speedMax = validateNumericField(speedMaxInput, parseFloat, 0, 50);
            const posInterval = validateNumericField(positionIntervalInput, (s) => parseInt(s, 10), 2, 180);
            const staticInterval = validateNumericField(staticIntervalInput, (s) => parseInt(s, 10), 10, 1800);
            if (count === null || centerLat === null || centerLon === null || radiusKm === null
                || speedMin === null || speedMax === null || posInterval === null || staticInterval === null) {
                showToast("Fix the highlighted simulator fields first.", "error", 3000);
                return;
            }

            const defaultClass = parseInt(defaultClassSelect.value, 10) as eAisClass;
            const typeOptions = getVesselTypeOptions();
            const usedMmsi = new Set<number>(vessels.keys());

            for (let i = 0; i < count; i++) {
                const mmsi = randomMmsi(usedMmsi);
                const [lat, lon] = randomPointNear(centerLat, centerLon, radiusKm);
                const v: IVessel = {
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
                    // stagger initial sends so all vessels don't transmit in the same tick
                    nextPositionSendAt: Date.now() + Math.random() * posInterval * 1000,
                    nextStaticSendAt: Date.now() + Math.random() * staticInterval * 1000,
                };
                vessels.set(mmsi, v);
                addMarker(v);
            }
            rebuildVesselList();
        }

        function tick(): void {
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

        function startSimulation(): void {
            if (vessels.size === 0) {
                generateVessels();
                if (vessels.size === 0) {
                    return; // generation failed validation
                }
            }
            if (tickHandle === null) {
                lastTick = Date.now();
                tickHandle = window.setInterval(tick, 1000);
            }
            startButton.disabled = true;
            stopButton.disabled = false;
            showToast(`Started simulation with ${vessels.size} vessels.`, "success", 1500);
        }

        function stopSimulation(): void {
            if (tickHandle !== null) {
                window.clearInterval(tickHandle);
                tickHandle = null;
            }
            startButton.disabled = false;
            stopButton.disabled = true;
        }

        function updateModeGroupVisibility(): void {
            const mode = parseInt((document.getElementById("vesselMovementModeSelect") as HTMLSelectElement).value, 10);
            (document.getElementById("vesselCircleGroup") as HTMLDivElement).style.display = mode === eMovementMode.Circle ? "block" : "none";
            (document.getElementById("vesselRouteGroup") as HTMLDivElement).style.display = mode === eMovementMode.Route ? "block" : "none";
        }

        function ensureVesselModal(): bootstrap.Modal {
            if (!vesselModal) {
                vesselModal = new bootstrap.Modal(document.getElementById("vesselConfigModal"));
            }
            return vesselModal;
        }

        function openVesselModal(mmsi: number): void {
            const v = vessels.get(mmsi);
            if (!v) {
                return;
            }
            editingMmsi = mmsi;
            (document.getElementById("vesselMmsiInput") as HTMLInputElement).value = String(v.mmsi);
            (document.getElementById("vesselNameInput") as HTMLInputElement).value = v.name;
            (document.getElementById("vesselCallsignInput") as HTMLInputElement).value = v.callsign;
            (document.getElementById("vesselClassSelect") as HTMLSelectElement).value = String(v.aisClass);
            (document.getElementById("vesselTypeSelect") as HTMLSelectElement).value = String(v.type);
            (document.getElementById("vesselLengthInput") as HTMLInputElement).value = String(v.length);
            (document.getElementById("vesselBeamInput") as HTMLInputElement).value = String(v.beam);
            (document.getElementById("vesselDraughtInput") as HTMLInputElement).value = (v.draught / 10).toFixed(1);
            (document.getElementById("vesselDestinationInput") as HTMLInputElement).value = v.destination;
            (document.getElementById("vesselStatusSelect") as HTMLSelectElement).value = String(v.status);
            (document.getElementById("vesselSpeedInput") as HTMLInputElement).value = v.speed.toFixed(1);
            (document.getElementById("vesselCourseInput") as HTMLInputElement).value = v.course.toFixed(1);
            (document.getElementById("vesselMovementModeSelect") as HTMLSelectElement).value = String(v.movementMode);
            (document.getElementById("vesselCircleRadiusInput") as HTMLInputElement).value = String(v.circleRadiusKm);
            (document.getElementById("vesselRouteRepeatCheckbox") as HTMLInputElement).checked = v.route.repeat;
            (document.getElementById("vesselPositionIntervalInput") as HTMLInputElement).value = String(v.positionIntervalSec);
            (document.getElementById("vesselStaticIntervalInput") as HTMLInputElement).value = String(v.staticIntervalSec);
            updateModeGroupVisibility();
            ensureVesselModal().show();
        }

        function saveVesselModal(): boolean {
            if (editingMmsi === null) {
                return false;
            }
            const v = vessels.get(editingMmsi);
            if (!v) {
                return false;
            }

            const name = validateStringField(document.getElementById("vesselNameInput") as HTMLInputElement, 1, 20);
            if (name === null) { return false; }
            const callsign = validateStringField(document.getElementById("vesselCallsignInput") as HTMLInputElement, 1, 7);
            if (callsign === null) { return false; }
            const destination = validateStringField(document.getElementById("vesselDestinationInput") as HTMLInputElement, 1, 20);
            if (destination === null) { return false; }
            const length = validateNumericField(document.getElementById("vesselLengthInput") as HTMLInputElement, (s) => parseInt(s, 10), 0, 1022);
            if (length === null) { return false; }
            const beam = validateNumericField(document.getElementById("vesselBeamInput") as HTMLInputElement, (s) => parseInt(s, 10), 1, 126);
            if (beam === null) { return false; }
            const draughtM = validateNumericField(document.getElementById("vesselDraughtInput") as HTMLInputElement, parseFloat, 0, 25.5);
            if (draughtM === null) { return false; }
            const speed = validateNumericField(document.getElementById("vesselSpeedInput") as HTMLInputElement, parseFloat, 0, 102.2);
            if (speed === null) { return false; }
            const course = validateNumericField(document.getElementById("vesselCourseInput") as HTMLInputElement, parseFloat, 0, 359.9);
            if (course === null) { return false; }
            const circleRadius = validateNumericField(document.getElementById("vesselCircleRadiusInput") as HTMLInputElement, parseFloat, 0.05, 200);
            if (circleRadius === null) { return false; }
            const positionInterval = validateNumericField(document.getElementById("vesselPositionIntervalInput") as HTMLInputElement, (s) => parseInt(s, 10), 2, 180);
            if (positionInterval === null) { return false; }
            const staticInterval = validateNumericField(document.getElementById("vesselStaticIntervalInput") as HTMLInputElement, (s) => parseInt(s, 10), 10, 1800);
            if (staticInterval === null) { return false; }

            v.name = name;
            v.callsign = callsign;
            v.destination = destination;
            v.aisClass = parseInt((document.getElementById("vesselClassSelect") as HTMLSelectElement).value, 10);
            v.type = parseInt((document.getElementById("vesselTypeSelect") as HTMLSelectElement).value, 10);
            v.length = length;
            v.beam = beam;
            v.draught = Math.round(draughtM * 10);
            v.status = parseInt((document.getElementById("vesselStatusSelect") as HTMLSelectElement).value, 10);
            v.speed = speed;
            v.course = course;
            v.movementMode = parseInt((document.getElementById("vesselMovementModeSelect") as HTMLSelectElement).value, 10);
            v.circleRadiusKm = circleRadius;
            v.circleCenterLat = v.posLat;
            v.circleCenterLon = v.posLon;
            v.circleAngleDeg = 0;
            v.route.repeat = (document.getElementById("vesselRouteRepeatCheckbox") as HTMLInputElement).checked;
            v.positionIntervalSec = positionInterval;
            v.staticIntervalSec = staticInterval;

            ensureVesselModal().hide();
            rebuildVesselList();
            return true;
        }

        function onMapClick(e: L.LeafletMouseEvent): void {
            if (uiMode === "pickCenter") {
                centerLatInput.value = e.latlng.lat.toFixed(6);
                centerLonInput.value = e.latlng.lng.toFixed(6);
                uiMode = "idle";
                pickCenterButton.classList.remove("active");
                showToast("Center set.", "success", 1500);
            } else if (uiMode === "drawRoute" && routeTargetMmsi !== null) {
                const v = vessels.get(routeTargetMmsi);
                if (v) {
                    v.route.navPoints.push({ lat: e.latlng.lat, lon: e.latlng.lng });
                    updateRouteLine(v);
                }
            }
        }

        function ensureMap(): void {
            if (map) {
                map.invalidateSize();
                return;
            }
            map = L.map("simMap").setView(
                [parseFloat(centerLatInput.value), parseFloat(centerLonInput.value)], 10,
            );
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "&copy; OpenStreetMap contributors",
                maxZoom: 19,
            }).addTo(map);
            map.on("click", onMapClick);
        }

        // Reuse the single-message form's vessel type list instead of duplicating it.
        (document.getElementById("vesselTypeSelect") as HTMLSelectElement).innerHTML =
            (document.getElementById("aisVesselTypeSelect") as HTMLSelectElement).innerHTML;

        document.getElementById("trafficSimulator-tab").addEventListener("shown.bs.tab", ensureMap);
        startButton.addEventListener("click", startSimulation);
        stopButton.addEventListener("click", stopSimulation);

        pickCenterButton.addEventListener("click", () => {
            if (uiMode === "pickCenter") {
                uiMode = "idle";
                pickCenterButton.classList.remove("active");
            } else {
                uiMode = "pickCenter";
                pickCenterButton.classList.add("active");
            }
        });

        vesselListBody.addEventListener("click", (e: MouseEvent) => {
            const tr = (e.target as HTMLElement).closest("tr[data-mmsi]") as HTMLElement;
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

        document.getElementById("vesselDrawRouteButton").addEventListener("click", (e: MouseEvent) => {
            if (editingMmsi === null) {
                return;
            }
            const btn = e.currentTarget as HTMLButtonElement;
            if (uiMode === "drawRoute" && routeTargetMmsi === editingMmsi) {
                uiMode = "idle";
                routeTargetMmsi = null;
                btn.classList.remove("active");
                showToast("Finished drawing route.", "success", 1500);
            } else {
                if (!saveVesselModal()) {
                    return;
                }
                uiMode = "drawRoute";
                routeTargetMmsi = editingMmsi;
                btn.classList.add("active");
                showToast("Click the map to add waypoints, then reopen this vessel and click \"Draw Route\" again to finish.", "success", 4000);
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
}
