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

    export enum eMessageType24 {
        Unknown = 0,
        TypeA = 1,
        TypeB = 2,
    }

    export enum eAtoN {
        Unknown = 0,
        Real = 1,
        Virtual = 2,
    }

    (() => {
        let msgType24: eMessageType24 = eMessageType24.Unknown;
        let navAidSimType: eAtoN = eAtoN.Real;
        let selectedMsgType: number = 0;
        let reconnectTimeout: number = null;
        let reconnectTries: number = 5;
        let reconnectTime: number = 5000;
        let ws: WebSocket = null;
        const submitButton = document.getElementById("aisParameterSubmitButton") as HTMLButtonElement;

        /**
         * Connect to AIS websocket PDU.
         */
        function websocketConnect() {
            ws = new WebSocket("ws://localhost:52002/ws");
            ws.onmessage = (evt: MessageEvent) => {
                console.info(evt.data);
            };

            ws.onopen = (ev: Event) => {
                new Noty({
                    layout: "centerRight",
                    progressBar: false,
                    text: "Connected!",
                    theme: "bootstrap-v4",
                    timeout: 500,
                    type: "success",
                }).show();
                submitButton.disabled = false;
                clearTimeout(reconnectTimeout);
                reconnectTries = 5;
                reconnectTime = 5000;
            };

            ws.onerror = (ev: Event) => {
                console.error("WebSocket error:", ev);
                new Noty({
                    layout: "centerRight",
                    progressBar: false,
                    text: "Websocket error!",
                    theme: "bootstrap-v4",
                    timeout: 3500,
                    type: "error",
                }).show();
                submitButton.disabled = true;
                if (reconnectTries <= 0) {
                    clearTimeout(reconnectTimeout);
                    new Noty({
                        layout: "centerRight",
                        progressBar: false,
                        text: "Tried reconnection 5 times. Giving up...",
                        theme: "bootstrap-v4",
                        timeout: 5000,
                        type: "error",
                    }).show();
                    new Noty({
                        layout: "centerRight",
                        progressBar: false,
                        text: "Reload page for reconnection.",
                        theme: "bootstrap-v4",
                        timeout: false,
                        type: "error",
                    }).show();
                }
            };

            ws.onclose = () => {
                new Noty({
                    layout: "centerRight",
                    progressBar: false,
                    text: `Websocket closed! Reconnecting in ${reconnectTime / 1000} seconds.`,
                    theme: "bootstrap-v4",
                    timeout: 5000,
                    type: "warning",
                }).show();
                submitButton.disabled = true;
                if (reconnectTries > 0) {
                    reconnectTimeout = setTimeout(websocketConnect, reconnectTime);
                    reconnectTime += 5000;
                    reconnectTries -= 1;
                }
            }
        }

        websocketConnect();

        /**
         * Provide form field depending on selected message type.
         */
        document.getElementById("aisMessageTypeSelect").addEventListener("change", (e: Event) => {
            const sel = e.target as HTMLSelectElement;
            switch (sel.value) {
                default:
                case "0":
                    document.documentElement.setAttribute("data-msg", "none");
                    break;
                case "1":
                case "27":
                    // Content in 1 and 27 is same, only encoding differs
                    document.documentElement.setAttribute("data-msg", "msgType1");
                    break;
                case "4":
                    document.documentElement.setAttribute("data-msg", "msgType4");
                    break;
                case "5":
                    document.documentElement.setAttribute("data-msg", "msgType5");
                    break;
                case "9":
                    document.documentElement.setAttribute("data-msg", "msgType9");
                    break;
                case "12":
                    document.documentElement.setAttribute("data-msg", "msgType12");
                    break;
                case "14":
                    document.documentElement.setAttribute("data-msg", "msgType14");
                    break;
                case "15":
                    document.documentElement.setAttribute("data-msg", "msgType15");
                    break;
                case "18":
                    document.documentElement.setAttribute("data-msg", "msgType18");
                    break;
                case "19":
                    document.documentElement.setAttribute("data-msg", "msgType19");
                    break;
                case "20":
                    document.documentElement.setAttribute("data-msg", "msgType20");
                    break;
                case "21":
                    document.documentElement.setAttribute("data-msg", "msgType21");
                    break;
                case "22":
                    document.documentElement.setAttribute("data-msg", "msgType22");
                    break;
                case "23":
                    document.documentElement.setAttribute("data-msg", "msgType23");
                    break;
                case "24":
                    document.documentElement.setAttribute("data-msg", "msgType24");
                    break;
            }

            selectedMsgType = parseInt(sel.value, 10);
            sel.classList.remove("is-invalid");
            document.getElementById("aisParameterForm").classList.remove("was-validated");
        });

        /**
         * Provide form field for message type 24, static data report type A when selected.
         */
        document.getElementById("aisStaticReportTypeARadio").addEventListener("click", (e: Event) => {
            const r = e.target as HTMLInputElement;
            if (r.checked) {
                document.documentElement.setAttribute("data-msg", "msgType24A");
                msgType24 = eMessageType24.TypeA;
            }
        });

        /**
         * Provide form field for message type 24, static data report type B when selected.
         */
        document.getElementById("aisStaticReportTypeBRadio").addEventListener("click", (e: Event) => {
            const r = e.target as HTMLInputElement;
            if (r.checked) {
                document.documentElement.setAttribute("data-msg", "msgType24B");
                msgType24 = eMessageType24.TypeB;
            }
        });

        /**
         * Register change in aid-to-navigation type change.
         */
        document.getElementById("aisRealAtoNRadio").addEventListener("click", (e: Event) => {
            const r = e.target as HTMLInputElement;
            if (r.checked) {
                navAidSimType = eAtoN.Real;
            }
        });

        /**
         * Register change in aid-to-navigation type change.
         */
        document.getElementById("aisVirtualAtoNRadio").addEventListener("click", (e: Event) => {
            const r = e.target as HTMLInputElement;
            if (r.checked) {
                navAidSimType = eAtoN.Virtual;
            }
        });

        /**
         * Perform first validation on parameter form.
         */
        document.getElementById("aisParameterForm").addEventListener("submit", (e: any) => {
            e.preventDefault();
            e.stopPropagation();

            let formError = false;
            // Fetch all the forms we want to apply custom Bootstrap validation styles to
            const form = document.getElementById("aisParameterForm") as HTMLFormElement;
            if (form.checkValidity() === false) {
                formError = true;
            }
            // Check if valid message type is selected.
            if ((form[1] as HTMLSelectElement).value === "0") {
                (form[1] as HTMLSelectElement).classList.add("is-invalid");
                formError = true;
            } else {
                form.classList.add("was-validated");
            }

            if (!formError) {
                validateForm(e.target.elements as IAisParameterFormElementCollection);
            }
        });

        /**
         * Reset message parameters on reset button click.
         */
        document.getElementById("aisFormResetButton").addEventListener("click", (e: Event) => {
            msgType24 = eMessageType24.Unknown;
            navAidSimType = eAtoN.Real;
            document.documentElement.setAttribute("data-msg", "none");
        });

        /**
         * Preset message 5 ETA field, otherwise form validity check will fail.
         */
        (document.getElementById("aisEtaInput") as HTMLInputElement).value = (new Date(Date.now())).toISOString().slice(0, 16);

        /**
         * Verify MMSI for correct length and all numeric.
         * @param mmsi MMSI as string.
         */
        function verifyMmsi(mmsi: string): boolean {
            return /^[0-9]{9}$/.test(mmsi);
        }

        /**
         * Parse a numeric form field, validate its range, and mark it invalid on failure.
         * @param el Form element to validate.
         * @param parser Number parser, e.g. parseFloat or (v) => parseInt(v, 10).
         * @param min Minimum allowed value (inclusive).
         * @param max Maximum allowed value (inclusive).
         * @returns The parsed value, or null if out of range.
         */
        function validateNumericField(
            el: HTMLInputElement | HTMLSelectElement,
            parser: (value: string) => number,
            min: number,
            max: number,
        ): number | null {
            const value = parser(el.value);
            if (value < min || value > max) {
                el.classList.replace("is-valid", "is-invalid");
                return null;
            }
            return value;
        }

        /**
         * Validate a string form field's length and mark it invalid on failure.
         * @param el Form element to validate.
         * @param minLength Minimum allowed length (inclusive).
         * @param maxLength Maximum allowed length (inclusive).
         * @returns The field value, or null if out of range.
         */
        function validateStringField(el: HTMLInputElement, minLength: number, maxLength: number): string | null {
            if (el.value.length < minLength || el.value.length > maxLength) {
                el.classList.replace("is-valid", "is-invalid");
                return null;
            }
            return el.value;
        }

        /**
         * Validate and process parameter form values.
         * @param el List with parameter form elements.
         */
        function validateForm(form: IAisParameterFormElementCollection) {
            const aisParameters: IAisParameter = {
                addrMsg: "Hello world!",
                altitude: 1000,
                beam: 14,
                callsign: "KC9CAF",
                channelA: 2087,
                channelB: 2088,
                course: 83.4,
                destination: "Unknown",
                destMmsi: 247320163,
                draught: 25,
                eta: new Date(),
                fatdmaOffset: 0,
                fatdmaRepeat: 0,
                fatdmaSlot: 0,
                fatdmaTimeout: 0,
                interrogationMsgType: 1,
                interval: 1,
                length: 90,
                msgType: 1,
                msgType24: eMessageType24.TypeA,
                name: "Unknown",
                navAidName: "@@@@@@@@@@@@@@@@@@@@",
                navAidSimType: eAtoN.Real,
                navAidType: 1,
                neLat: 47.5,
                neLon: 9.5,
                posLat: 48.0,
                posLon: 10.0,
                quiet: 15,
                sartMsg: "SART ACTIVE",
                speed: 0.1,
                srcMmsi: 247320162,
                status: 15,
                swLat: 48.5,
                swLon: 10.5,
                type: 60,
            };

            if (verifyMmsi(form.aisMmsiInput.value) === false) {
                form.aisMmsiInput.classList.replace("is-valid", "is-invalid");
                return;
            }
            aisParameters.srcMmsi = parseInt(form.aisMmsiInput.value, 10);

            if (verifyMmsi(form.aisDestMmsiInput.value) === false) {
                form.aisDestMmsiInput.classList.replace("is-valid", "is-invalid");
                return;
            }
            aisParameters.destMmsi = parseInt(form.aisDestMmsiInput.value, 10);

            if (form.aisMessageTypeSelect.value === "0" || selectedMsgType === 0) {
                form.aisMessageTypeSelect.classList.replace("valid", "is-invalid");
                return;
            }
            aisParameters.msgType = selectedMsgType;

            const asInt = (v: string) => parseInt(v, 10);

            let str = validateStringField(form.aisSartMsgInput, 1, 161);
            if (str === null) { return; }
            aisParameters.sartMsg = str;

            str = validateStringField(form.aisAddrMsgInput, 1, 156);
            if (str === null) { return; }
            aisParameters.addrMsg = str;

            let num = validateNumericField(form.aisLatInput, parseFloat, -90.0, 90.0);
            if (num === null) { return; }
            aisParameters.posLat = num;

            num = validateNumericField(form.aisLonInput, parseFloat, -180.0, 180.0);
            if (num === null) { return; }
            aisParameters.posLon = num;

            num = validateNumericField(form.aisAltitudeInput, asInt, 0, 4095);
            if (num === null) { return; }
            aisParameters.altitude = num;

            num = validateNumericField(form.aisSpeedInput, parseFloat, -1, 100.0);
            if (num === null) { return; }
            aisParameters.speed = num;

            num = validateNumericField(form.aisCourseInput, parseFloat, -1, 360.0);
            if (num === null) { return; }
            aisParameters.course = num;

            num = validateNumericField(form.aisNavStatusSelect, asInt, 0, 15);
            if (num === null) { return; }
            aisParameters.status = num;

            num = validateNumericField(form.aisFatdmaOffsetInput, asInt, 0, 4095);
            if (num === null) { return; }
            aisParameters.fatdmaOffset = num;

            num = validateNumericField(form.aisFatdmaSlotsInput, asInt, 0, 15);
            if (num === null) { return; }
            aisParameters.fatdmaSlot = num;

            num = validateNumericField(form.aisFatdmaTimeoutInput, asInt, 0, 7);
            if (num === null) { return; }
            aisParameters.fatdmaTimeout = num;

            num = validateNumericField(form.aisFatdmaRepeatInput, asInt, 0, 2047);
            if (num === null) { return; }
            aisParameters.fatdmaRepeat = num;

            if (form.aisRealAtoNRadio.checked && navAidSimType === eAtoN.Real) {
                aisParameters.navAidSimType = navAidSimType;
            } else if (form.aisVirtualAtoNRadio.checked && navAidSimType === eAtoN.Virtual) {
                aisParameters.navAidSimType = navAidSimType;
            } else {
                aisParameters.navAidSimType = eAtoN.Unknown;
            }

            num = validateNumericField(form.aisAtoNTypeSelect, asInt, 0, 31);
            if (num === null) { return; }
            aisParameters.navAidType = num;

            str = validateStringField(form.aisAtoNNameInput, 1, 20);
            if (str === null) { return; }
            aisParameters.navAidName = str;

            num = validateNumericField(form.aisChannelAInput, asInt, 0, 9999);
            if (num === null) { return; }
            aisParameters.channelA = num;

            num = validateNumericField(form.aisChannelBInput, asInt, 0, 9999);
            if (num === null) { return; }
            aisParameters.channelB = num;

            num = validateNumericField(form.aisNELatInput, parseFloat, -90.0, 90.0);
            if (num === null) { return; }
            aisParameters.neLat = num;

            num = validateNumericField(form.aisNELonInput, parseFloat, -180.0, 180.0);
            if (num === null) { return; }
            aisParameters.neLon = num;

            num = validateNumericField(form.aisSWLatInput, parseFloat, -90.0, 90.0);
            if (num === null) { return; }
            aisParameters.swLat = num;

            num = validateNumericField(form.aisSWLonInput, parseFloat, -180.0, 180.0);
            if (num === null) { return; }
            aisParameters.swLon = num;

            num = validateNumericField(form.aisReportingIntervalSelect, asInt, 0, 10);
            if (num === null) { return; }
            aisParameters.interval = num;

            num = validateNumericField(form.aisQuietTimeInput, asInt, 0, 15);
            if (num === null) { return; }
            aisParameters.quiet = num;

            if (form.aisStaticReportTypeARadio.checked && msgType24 === eMessageType24.TypeA) {
                aisParameters.msgType24 = msgType24;
            } else if (form.aisStaticReportTypeBRadio.checked && msgType24 === eMessageType24.TypeB) {
                aisParameters.msgType24 = msgType24;
            } else {
                aisParameters.msgType24 = eMessageType24.Unknown;
            }

            str = validateStringField(form.aisVesselNameInput, 1, 20);
            if (str === null) { return; }
            aisParameters.name = str;

            str = validateStringField(form.aisVesselCallsignInput, 1, 7);
            if (str === null) { return; }
            aisParameters.callsign = str;

            str = validateStringField(form.aisVesselDestinationInput, 1, 20);
            if (str === null) { return; }
            aisParameters.destination = str;

            num = validateNumericField(form.aisVesselTypeSelect, asInt, 0, 99);
            if (num === null) { return; }
            aisParameters.type = num;

            num = validateNumericField(form.aisVesselLengthInput, asInt, 0, 1022);
            if (num === null) { return; }
            aisParameters.length = num;

            num = validateNumericField(form.aisVesselBeamInput, asInt, 1, 126);
            if (num === null) { return; }
            aisParameters.beam = num;

            num = parseFloat(form.aisVesselDraughtInput.value);
            if (num < 0) {
                form.aisVesselDraughtInput.classList.replace("is-valid", "is-invalid");
                return;
            }
            if (num > 25.5) {
                num = 25.5;
            }
            aisParameters.draught = num * 10;

            num = Date.parse(form.aisEtaInput.value);
            if (Number.isNaN(num)) {
                form.aisEtaInput.classList.replace("is-valid", "is-invalid");
                return;
            }
            const d = new Date();
            d.setTime(num);
            aisParameters.eta = d;

            num = validateNumericField(form.aisInterrogatorMsgTypeSelect, asInt, 0, 27);
            if (num === null) { return; }
            aisParameters.interrogationMsgType = num;

            if (ws.readyState === WebSocket.OPEN) {
                ws.send(AivdmEncoder.encodeMsg(aisParameters));
                new Noty({
                    layout: "centerRight",
                    progressBar: false,
                    text: "Message sent.",
                    theme: "bootstrap-v4",
                    timeout: 500,
                    type: "success",
                }).show();
            } else {
                new Noty({
                    layout: "centerRight",
                    progressBar: false,
                    text: "Websocket not ready.",
                    theme: "bootstrap-v4",
                    timeout: 3000,
                    type: "error",
                }).show();
            }
        }
    })();
}
