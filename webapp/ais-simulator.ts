namespace aisSimulator {
    // document.addEventListener("DOMContentLoaded", () => { });

    interface IAisParameterFormElementCollection {
        aisAtoNNameInput: HTMLInputElement;
        aisAtoNTypeSelect: HTMLSelectElement;
        aisChannelAInput: HTMLInputElement;
        aisChannelBInput: HTMLInputElement;
        aisCourseInput: HTMLInputElement;
        aisFatdmaOffsetInput: HTMLInputElement;
        aisFatdmaRepeatInput: HTMLInputElement;
        aisFatdmaSlotsInput: HTMLInputElement;
        aisFatdmaTimeoutInput: HTMLInputElement;
        aisFormResetButton: HTMLButtonElement;
        aisLatInput: HTMLInputElement;
        aisLonInput: HTMLInputElement;
        aisMmsiInput: HTMLInputElement;
        aisNELatInput: HTMLInputElement;
        aisNELonInput: HTMLInputElement;
        aisParameterSubmitButton: HTMLButtonElement;
        aisQuietTimeInput: HTMLInputElement;
        aisRealAtoNRadio: HTMLInputElement;
        aisReportingIntervalSelect: HTMLSelectElement;
        aisSWLatInput: HTMLInputElement;
        aisSWLonInput: HTMLInputElement;
        aisSartMsgInput: HTMLInputElement;
        aisSpeedInput: HTMLInputElement;
        aisStaticReportTypeARadio: HTMLInputElement;
        aisStaticReportTypeBRadio: HTMLInputElement;
        aisNavStatusSelect: HTMLSelectElement;
        aisMessageTypeSelect: HTMLSelectElement;
        aisVesselBeamInput: HTMLInputElement;
        aisVesselCallsignInput: HTMLInputElement;
        aisVesselLengthInput: HTMLInputElement;
        aisVesselNameInput: HTMLInputElement;
        aisVesselTypeSelect: HTMLInputElement;
        aisVirtualAtoNRadio: HTMLInputElement;
        aisAltitudeInput: HTMLInputElement;
        aisAddrMsgInput: HTMLInputElement;
        aisDestMmsiInput: HTMLInputElement;
    }

    (() => {
        let msgType24: eMessageType24 = eMessageType24.Unknown;
        let navAidSimType: eAtoN = eAtoN.Real;
        let selectedMsgType: number = 0;

        const ws = new WebSocket("ws://localhost:1337/ws");
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
        };

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
                    document.documentElement.setAttribute("data-msg", "msgType1");
                    break;
                case "4":
                    document.documentElement.setAttribute("data-msg", "msgType4");
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
         * Verify MMSI for correct length and all numeric.
         * @param mmsi MMSI as string.
         */
        function verifyMmsi(mmsi: string): boolean {
            if (mmsi.length !== 9) {
                return false;
            }

            for (const c of mmsi) {
                if (Number.isNaN(c)) {
                    return false;
                }
            }

            return true;
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
                destMmsi: 247320163,
                fatdmaOffset: 0,
                fatdmaRepeat: 0,
                fatdmaSlot: 0,
                fatdmaTimeout: 0,
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

            if (form.aisSartMsgInput.value.length < 1 || form.aisSartMsgInput.value.length > 161) {
                form.aisSartMsgInput.classList.replace("is-valid", "is-invalid");
                return;
            }
            aisParameters.sartMsg = form.aisSartMsgInput.value;

            if (form.aisAddrMsgInput.value.length < 1 || form.aisAddrMsgInput.value.length > 156) {
                form.aisAddrMsgInput.classList.replace("is-valid", "is-invalid");
                return;
            }
            aisParameters.addrMsg = form.aisAddrMsgInput.value;

            let num = parseFloat(form.aisLatInput.value);
            if (num < -90.0 || num > 90.0) {
                form.aisLatInput.classList.replace("is-valid", "is-invalid");
                return;
            }
            aisParameters.posLat = num;

            num = parseFloat(form.aisLonInput.value);
            if (num < -180.0 || num > 180.0) {
                form.aisLonInput.classList.replace("is-valid", "is-invalid");
                return;
            }
            aisParameters.posLon = num;

            num = parseInt(form.aisAltitudeInput.value, 10);
            if (num < 0 || num > 4095) {
                form.aisAltitudeInput.classList.replace("is-valid", "is-invalid");
                return;
            }
            aisParameters.altitude = num;

            num = parseFloat(form.aisSpeedInput.value);
            if (num < -1 || num > 100.0) {
                form.aisSpeedInput.classList.replace("is-valid", "is-invalid");
                return;
            }
            aisParameters.speed = num;

            num = parseFloat(form.aisCourseInput.value);
            if (num < -1 || num > 360.0) {
                form.aisCourseInput.classList.replace("is-valid", "is-invalid");
                return;
            }
            aisParameters.course = num;

            num = parseInt(form.aisNavStatusSelect.value, 10);
            if (num < 0 || num > 15) {
                form.aisNavStatusSelect.classList.replace("is-valid", "is-invalid");
                return;
            }
            aisParameters.status = num;

            num = parseInt(form.aisFatdmaOffsetInput.value, 10);
            if (num < 0 || num > 4095) {
                form.aisFatdmaOffsetInput.classList.replace("is-valid", "is-invalid");
                return;
            }
            aisParameters.fatdmaOffset = num;

            num = parseInt(form.aisFatdmaSlotsInput.value, 10);
            if (num < 0 || num > 15) {
                form.aisFatdmaSlotsInput.classList.replace("is-valid", "is-invalid");
                return;
            }
            aisParameters.fatdmaSlot = num;

            num = parseInt(form.aisFatdmaTimeoutInput.value, 10);
            if (num < 0 || num > 7) {
                form.aisFatdmaTimeoutInput.classList.replace("is-valid", "is-invalid");
                return;
            }
            aisParameters.fatdmaTimeout = num;

            num = parseInt(form.aisFatdmaRepeatInput.value, 10);
            if (num < 0 || num > 2047) {
                form.aisFatdmaRepeatInput.classList.replace("is-valid", "is-invalid");
                return;
            }
            aisParameters.fatdmaRepeat = num;

            if (form.aisRealAtoNRadio.checked && navAidSimType === eAtoN.Real) {
                aisParameters.navAidSimType = navAidSimType;
            } else if (form.aisVirtualAtoNRadio.checked && navAidSimType === eAtoN.Virtual) {
                aisParameters.navAidSimType = navAidSimType;
            } else {
                aisParameters.navAidSimType = eAtoN.Unknown;
            }

            num = parseInt(form.aisAtoNTypeSelect.value, 10);
            if (num < 0 || num > 31) {
                form.aisAtoNTypeSelect.classList.replace("is-valid", "is-invalid");
                return;
            }
            aisParameters.navAidType = num;

            if (form.aisAtoNNameInput.value.length < 1 || form.aisAtoNNameInput.value.length > 20) {
                form.aisAtoNNameInput.classList.replace("is-valid", "is-invalid");
                return;
            }
            aisParameters.navAidName = form.aisAtoNNameInput.value;

            num = parseInt(form.aisChannelAInput.value, 10);
            if (num < 0 || num > 9999) {
                form.aisChannelAInput.classList.replace("is-valid", "is-invalid");
                return;
            }
            aisParameters.channelA = num;

            num = parseInt(form.aisChannelBInput.value, 10);
            if (num < 0 || num > 9999) {
                form.aisChannelBInput.classList.replace("is-valid", "is-invalid");
                return;
            }
            aisParameters.channelB = num;

            num = parseFloat(form.aisNELatInput.value);
            if (num < -90.0 || num > 90.0) {
                form.aisNELatInput.classList.replace("is-valid", "is-invalid");
                return;
            }
            aisParameters.neLat = num;

            num = parseFloat(form.aisNELonInput.value);
            if (num < -180.0 || num > 180.0) {
                form.aisNELonInput.classList.replace("is-valid", "is-invalid");
                return;
            }
            aisParameters.neLon = num;

            num = parseFloat(form.aisSWLatInput.value);
            if (num < -90.0 || num > 90.0) {
                form.aisSWLatInput.classList.replace("is-valid", "is-invalid");
                return;
            }
            aisParameters.swLat = num;

            num = parseFloat(form.aisSWLonInput.value);
            if (num < -180.0 || num > 180.0) {
                form.aisSWLonInput.classList.replace("is-valid", "is-invalid");
                return;
            }
            aisParameters.swLon = num;

            num = parseInt(form.aisReportingIntervalSelect.value, 10);
            if (num < 0 || num > 10) {
                form.aisReportingIntervalSelect.classList.replace("is-valid", "is-invalid");
                return;
            }
            aisParameters.interval = num;

            num = parseInt(form.aisQuietTimeInput.value, 10);
            if (num < 0 || num > 15) {
                form.aisQuietTimeInput.classList.replace("is-valid", "is-invalid");
                return;
            }
            aisParameters.quiet = num;

            if (form.aisStaticReportTypeARadio.checked && msgType24 === eMessageType24.TypeA) {
                aisParameters.msgType24 = msgType24;
            } else if (form.aisStaticReportTypeBRadio.checked && msgType24 === eMessageType24.TypeB) {
                aisParameters.msgType24 = msgType24;
            } else {
                aisParameters.msgType24 = eMessageType24.Unknown;
            }

            if (form.aisVesselNameInput.value.length < 1 || form.aisVesselNameInput.value.length > 20) {
                form.aisVesselNameInput.classList.replace("is-valid", "is-invalid");
                return;
            }
            aisParameters.name = form.aisVesselNameInput.value;

            if (form.aisVesselCallsignInput.value.length < 1 || form.aisVesselCallsignInput.value.length > 7) {
                form.aisVesselCallsignInput.classList.replace("is-valid", "is-invalid");
                return;
            }
            aisParameters.callsign = form.aisVesselCallsignInput.value;

            num = parseInt(form.aisVesselTypeSelect.value, 10);
            if (num < 0 || num > 99) {
                form.aisVesselTypeSelect.classList.replace("is-valid", "is-invalid");
                return;
            }
            aisParameters.type = num;

            num = parseInt(form.aisVesselLengthInput.value, 10);
            if (num < 0 || num > 1022) {
                form.aisVesselLengthInput.classList.replace("is-valid", "is-invalid");
                return;
            }
            aisParameters.length = num;

            num = parseInt(form.aisVesselBeamInput.value, 10);
            if (num < 1 || num > 126) {
                form.aisVesselBeamInput.classList.replace("is-valid", "is-invalid");
                return;
            }
            aisParameters.beam = num;

            // AivdmEncoder.encoderTest();
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ id: "msg", data: AivdmEncoder.encodeMsg(aisParameters) }));
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