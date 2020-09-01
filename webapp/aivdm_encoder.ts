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

    export class AivdmEncoder {

        public static encodeMsg(ap: IAisParameter): string {
            switch (ap.msgType) {
                case 1:
                    return this.encodeMsgType1(ap.srcMmsi, ap.status, ap.speed, ap.course, ap.posLat, ap.posLon);
                case 4:
                    return this.encodeMsgType4(ap.srcMmsi, ap.posLat, ap.posLon);
                case 5:
                    return this.encodeMsgType5(ap.srcMmsi, ap.callsign, ap.name, ap.type, ap.length, ap.beam, ap.eta, ap.draught, ap.destination);
                case 9:
                    return this.encodeMsgType9(ap.srcMmsi, ap.altitude, ap.speed, ap.course, ap.posLat, ap.posLon);
                case 12:
                    return this.encodeMsgType12(ap.srcMmsi, ap.destMmsi, ap.addrMsg);
                case 14:
                    return this.encodeMsgType14(ap.srcMmsi, ap.sartMsg);
                case 15:
                    return this.encodeMsgType15(ap.srcMmsi, ap.destMmsi, ap.interrogationMsgType);
                case 18:
                    return this.encodeMsgType18(ap.srcMmsi, ap.speed, ap.course, ap.posLat, ap.posLon);
                case 19:
                    return this.encodeMsgType19(ap.srcMmsi, ap.speed, ap.course, ap.posLat, ap.posLon, ap.name, ap.type, ap.length, ap.beam);
                case 20:
                    return this.encodeMsgType20(ap.srcMmsi, ap.fatdmaOffset, ap.fatdmaSlot, ap.fatdmaTimeout, ap.fatdmaRepeat);
                case 21:
                    return this.encodeMsgType21(ap.srcMmsi, ap.navAidType, ap.navAidName, ap.posLat, ap.posLon, ap.length, ap.beam, ap.navAidSimType);
                case 22:
                    return this.encodeMsgType22(ap.srcMmsi, ap.channelA, ap.channelB, ap.neLat, ap.neLon, ap.swLat, ap.swLon);
                case 23:
                    return this.encodeMsgType23(ap.srcMmsi, ap.neLat, ap.neLon, ap.swLat, ap.swLon, ap.interval, ap.quiet);
                case 24:
                    return this.encodeMsgType24(ap.srcMmsi, ap.msgType24, ap.name, ap.callsign, ap.length, ap.beam, ap.type);
                case 27:
                    return this.encodeMsgType27(ap.srcMmsi, ap.status, ap.speed, ap.course, ap.posLat, ap.posLon);
                default:
                    return "";
            }
        }

        /**
         * Test message encoding for correct bitstream length.
         * See https://gpsd.gitlab.io/gpsd/AIVDM.html
         */
        public static encoderTest() {
            const ap: IAisParameter = {
                addrMsg: "Hello world!",
                altitude: 1000,
                beam: 14,
                callsign: "KC9CAF",
                channelA: 2087,
                channelB: 2088,
                course: 83.4,
                destination: "Unknown",
                destMmsi: 247320163,
                draught: 10,
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

            let s = this.encodeMsgType1(ap.srcMmsi, ap.status, ap.speed, ap.course, ap.posLat, ap.posLon);
            console.assert(s.length === 168);

            s = this.encodeMsgType4(ap.srcMmsi, ap.posLat, ap.posLon);
            console.assert(s.length === 168);

            s = this.encodeMsgType5(ap.srcMmsi, "01234567", "01234567890123456789", ap.type, ap.length, ap.beam, ap.eta, ap.draught, "01234567890123456789");
            console.assert(s.length === 424);

            s = this.encodeMsgType5(ap.srcMmsi, "1", "1", ap.type, ap.length, ap.beam, ap.eta, ap.draught, "1");
            console.assert(s.length === 424);

            s = this.encodeMsgType9(ap.srcMmsi, ap.altitude, ap.speed, ap.course, ap.posLat, ap.posLon);
            console.assert(s.length === 168);

            s = this.encodeMsgType12(ap.srcMmsi, 247320152, "1");
            console.assert(s.length === 78);

            s = this.encodeMsgType12(ap.srcMmsi, 247320152, "012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789123456");
            console.assert(s.length === 1008);

            s = this.encodeMsgType14(ap.srcMmsi, "1");
            console.assert(s.length === 46);

            s = this.encodeMsgType14(ap.srcMmsi, "01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890");
            console.assert(s.length === 1006);
            s += "".padStart(8 - (s.length % 8), "0");
            console.assert(s.length === 1008);

            s = this.encodeMsgType15(ap.srcMmsi, 247320152, 1);
            console.assert(s.length === 88);

            s = this.encodeMsgType18(ap.srcMmsi, ap.speed, ap.course, ap.posLat, ap.posLon);
            console.assert(s.length === 168);

            s = this.encodeMsgType19(ap.srcMmsi, ap.speed, ap.course, ap.posLat, ap.posLon, "1", ap.type, ap.length, ap.beam);
            console.assert(s.length === 312);

            s = this.encodeMsgType19(ap.srcMmsi, ap.speed, ap.course, ap.posLat, ap.posLon, "01234567890123456789", ap.type, ap.length, ap.beam);
            console.assert(s.length === 312);

            s = this.encodeMsgType20(ap.srcMmsi, ap.fatdmaOffset, ap.fatdmaSlot, ap.fatdmaTimeout, ap.fatdmaRepeat);
            console.assert(s.length === 72);

            s = this.encodeMsgType21(ap.srcMmsi, ap.navAidType, "1", ap.posLat, ap.posLon, ap.length, ap.beam, ap.navAidSimType);
            console.assert(s.length === 272);
            s = this.encodeMsgType21(ap.srcMmsi, ap.navAidType, "01234567890123456789", ap.posLat, ap.posLon, ap.length, ap.beam, ap.navAidSimType);
            console.assert(s.length === 272);
            s = this.encodeMsgType21(ap.srcMmsi, ap.navAidType, "012345678901234567890", ap.posLat, ap.posLon, ap.length, ap.beam, ap.navAidSimType);
            console.assert(s.length === 280);
            s = this.encodeMsgType21(ap.srcMmsi, ap.navAidType, "0123456789012345678901234567890123456789", ap.posLat, ap.posLon, ap.length, ap.beam, ap.navAidSimType);
            console.assert(s.length === 360);

            s = this.encodeMsgType22(ap.srcMmsi, ap.channelA, ap.channelB, ap.neLat, ap.neLon, ap.swLat, ap.swLon);
            console.assert(s.length === 168);

            s = this.encodeMsgType23(ap.srcMmsi, ap.neLat, ap.neLon, ap.swLat, ap.swLon, ap.interval, ap.quiet);
            console.assert(s.length === 160);

            s = this.encodeMsgType24(ap.srcMmsi, eMessageType24.TypeA, "1", "1", ap.length, ap.beam, ap.type);
            console.assert(s.length === 168);
            s = this.encodeMsgType24(ap.srcMmsi, eMessageType24.TypeA, "01234567890123456789", "1", ap.length, ap.beam, ap.type);
            console.assert(s.length === 168);
            s = this.encodeMsgType24(ap.srcMmsi, eMessageType24.TypeB, "01234567890123456789", "1", ap.length, ap.beam, ap.type);
            console.assert(s.length === 168);
            s = this.encodeMsgType24(ap.srcMmsi, eMessageType24.TypeB, "01234567890123456789", "0123456789", ap.length, ap.beam, ap.type);
            console.assert(s.length === 168);

            s = this.encodeMsgType27(ap.srcMmsi, ap.status, ap.speed, ap.course, ap.posLat, ap.posLon);
            console.assert(s.length === 96);
        }

        private static charset = "@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^- !\"#$%&'()*+,-./0123456789:;<=>?";

        /**
         * Encode string into binary sentence of char position in charset.
         * @param s String to encode
         */
        private static encodeString(s: string) {
            let enc = "";
            const u = s.toUpperCase();
            for (const c of u) {
                const i = this.charset.indexOf(c);
                enc += i.toString(2).padStart(6, "0");
            }
            return enc;
        }

        /**
         * Convert position to binary strings in minutes/100000;
         * @param lat Latitude
         * @param lon Longitude
         */
        private static convertLatLon(lat: number, lon: number): string[] {
            const bLat = (Math.floor(Math.round(lat * 600000)) & 0b111111111111111111111111111).toString(2).padStart(27, "0");
            const bLon = (Math.floor(Math.round(lon * 600000)) & 0b1111111111111111111111111111).toString(2).padStart(28, "0");
            return [bLat, bLon];
        }

        /**
         * Convert position to binary strings in 0.01 minutes.
         * @param lat Latitude
         * @param lon Longitude
         */
        private static convertLatLonShort(lat: number, lon: number): string[] {
            const bLat = (Math.floor(Math.round(lat * 600)) & 0b11111111111111111).toString(2).padStart(17, "0");
            const bLon = (Math.floor(Math.round(lon * 600)) & 0b111111111111111111).toString(2).padStart(18, "0");
            return [bLat, bLon];
        }

        /**
         * Create binary message header string.
         * @param msgType Message type
         * @param mmsi MMSI
         * @param repeatCount
         */
        private static getMsgHeader(msgType: number, mmsi: number, repeatCount: number): string {
            const bMsgType = msgType.toString(2).padStart(6, "0");
            const bRepeat = repeatCount.toString(2).padStart(2, "0"); // Repeat message up to 3 hops, value 3 indicates "Do not repeat"
            const bMmsi = mmsi.toString(2).padStart(30, "0"); // 30 bits
            return bMsgType + bRepeat + bMmsi;
        }

        /**
         * Encode vessel dimensions, antenna in center.
         * @param length Vessel length
         * @param beam Vessel beam
         */
        private static convertVesselSize(length: number, beam: number): string {
            const hl = Math.ceil((length / 2)).toString(2).padStart(9, "0");
            const hw = Math.ceil((beam / 2)).toString(2).padStart(6, "0");
            return hl + hl + hw + hw;
        }

        /**
         * Position Report Class A
         * by mobile station
         * @param mmsi MMSI
         * @param status Navigation status
         * @param speed Speed over ground
         * @param course Course over ground
         * @param lat Position latitude
         * @param lon Position longitude
         */
        private static encodeMsgType1(mmsi: number, status: number, speed: number, course: number, lat: number, lon: number): string {
            const header = this.getMsgHeader(1, mmsi, 3);
            const bStatus = status.toString(2).padStart(4, "0"); //  Navigation status e.g. 0 = Under way using engine, 1 - At anchor, 5 = Moored, 8 = Sailing, 15 = undefined
            const bRot = "10000000"; // 128, rate of turn not defined
            let bSpeed = "1111111111"; // 1023 = speed is not available.
            if (speed >= 0 && speed < 102.2) {
                // Speed over ground with 0.1 knot resolution from 0 to 102 knots. A value 1022 indicates 102.2 knots or higher.
                bSpeed = Math.floor(Math.round(speed * 10)).toString(2).padStart(10, "0");
            }
            const bAccuracy = "0"; // Accuracy > 10m
            const bLatLon = this.convertLatLon(lat, lon);
            let bCourse = "111000010000"; // 3600(0xE10) = course is not available.
            if (course >= 0 && course < 360) {
                // Course with 0.1° resolution
                bCourse = Math.floor(Math.round(course * 10)).toString(2).padStart(12, "0");
            }
            const bTrueHeading = "111111111"; // 511 = not applicable
            const now = new Date();
            const bTimestamp = now.getUTCSeconds().toString(2).padStart(6, "0"); // Seconds of UTC timestamp
            const bFlags = "000000"; // 00: Maneuver
            // 000: spare
            // 0: RAIM flag
            const bRadioStatus = "1100000000000000110"; // Communication status, see ITU-R M1371-5 §4.2.2.5

            return header + bStatus + bRot + bSpeed + bAccuracy + bLatLon[1] + bLatLon[0] + bCourse + bTrueHeading + bTimestamp + bFlags + bRadioStatus;
        }

        /**
         * Base Station Report
         * by base station
         * @param mmsi MMSI
         * @param lat Position latitude
         * @param lon Position longitude
         */
        private static encodeMsgType4(mmsi: number, lat: number, lon: number): string {
            const header = this.getMsgHeader(4, mmsi, 3);
            const now = new Date();
            const bYear = now.getUTCFullYear().toString(2).padStart(14, "0");
            const bMonth = now.getUTCMonth().toString(2).padStart(4, "0");
            const bDay = now.getUTCDay().toString(2).padStart(5, "0");
            const bHour = now.getHours().toString(2).padStart(5, "0");
            const bMin = now.getMinutes().toString(2).padStart(6, "0");
            const bSec = now.getSeconds().toString(2).padStart(6, "0");
            const bAccuracy = "0"; // Accuracy > 10m
            const bLatLon = this.convertLatLon(lat, lon);
            const bDevice = "1111"; // internal GNSS
            const bFlags = "00000000000"; // Spare + RAIM flag
            const bRadioStatus = "1100000000000000110"; // Communication status, see ITU-R M1371-5 §4.2.2.5
            return header + bYear + bMonth + bDay + bHour + bMin + bSec + bAccuracy + bLatLon[1] + bLatLon[0] + bDevice + bFlags + bRadioStatus;
        }

        /**
         * Static and voyage related data
         * by mobile station.
         * @param mmsi MMSI
         * @param callsign Vessel callsign
         * @param name Vessel name
         * @param length Vessel length
         * @param beam Vessel width
         * @param eta Estimated time of arrival
         * @param draught Draught
         * @param destination Vessel destination
         */
        private static encodeMsgType5(mmsi: number, vCallsign: string, vName: string, vType: number, vLength: number, vBeam: number, eta: Date, draught: number, vDestination: string): string {
            const header = this.getMsgHeader(5, mmsi, 3);
            const bAisVer = "10"; // AIS version ITU M1371-5
            const bImo = "000000000000000000000000000000"; // IMO ID all zero for inland vessel
            let n = vName.substr(0, 20);
            const bName = this.encodeString(n);
            const padName = "".padStart(120 - bName.length, "0");
            const bVtype = vType.toString(2).padStart(8, "0"); // Vessel type
            n = vCallsign.substr(0, 7);
            const bCallsign = this.encodeString(n);
            const padCallsign = "".padEnd(42 - bCallsign.length, "0"); // Max 7 six-bit characters
            // AIS antenna in the middle
            const bSize = this.convertVesselSize(vLength, vBeam);
            const bMonth = (eta.getUTCMonth() + 1).toString(2).padStart(4, "0");
            const bDay = eta.getUTCDate().toString(2).padStart(5, "0");
            const bHour = eta.getUTCHours().toString(2).padStart(5, "0");
            const bMin = eta.getUTCMinutes().toString(2).padStart(6, "0");
            const bEta = bMonth + bDay + bHour + bMin;
            const bFix = "1111"; // GPS
            const bDraught = draught.toString(2).padStart(8, "0"); // Draught in 1/10m
            n = vDestination.substr(0, 20);
            const bDestination = this.encodeString(n);
            const padDestination = "".padStart(120 - bDestination.length, "0");
            const bDTE = "00";

            return header + bAisVer + bImo + bCallsign + padCallsign + bName + padName + bVtype + bSize + bFix + bEta + bDraught + bDestination + padDestination + bDTE;
        }

        /**
         * Standard SAR Aircraft Position Report
         * by mobile station
         * @param mmsi MMSI
         * @param altitude Altitude
         * @param speed Speed over ground
         * @param course Course over ground
         * @param lat Position latitude
         * @param lon Position longitude
         */
        private static encodeMsgType9(mmsi: number, altitude: number, speed: number, course: number, lat: number, lon: number): string {
            const header = this.getMsgHeader(9, mmsi, 3);
            const bAlt = altitude.toString(2).padStart(12, "0");
            let bSpeed = "1111111111"; // 1023 = speed is not available.
            if (speed >= 0 && speed < 102.2) {
                // Speed over ground with 0.1 knot resolution from 0 to 102 knots. A value 1022 indicates 102.2 knots or higher.
                bSpeed = Math.floor(Math.round(speed * 10)).toString(2).padStart(10, "0");
            }
            const bAccuracy = "0"; // Accuracy > 10m
            const bLatLon = this.convertLatLon(lat, lon);
            let bCourse = "111000010000"; // 3600(0xE10) = course is not available.
            if (course >= 0 && course < 360) {
                // Course with 0.1° resolution
                bCourse = Math.floor(Math.round(course * 10)).toString(2).padStart(12, "0");
            }
            const now = new Date();
            const bTimestamp = now.getUTCSeconds().toString(2).padStart(6, "0"); // Seconds of UTC timestamp
            const bFlags = "000000000000001";// 0: Altitude sensor GNSS
            // 0000000: Reserved,
            // 0: DTE ready
            // 000: spare
            // 0: Assigned mode = autonomous station
            // 0: RAIM not used
            // 1: ITDMA comm state follows, see ITU-R M1371-5 §4.2.2.5
            const bRadioStatus = "1100000000000000110"; // Communication status, see ITU-R M1371-5 §4.2.2.5

            return header + bAlt + bSpeed + bAccuracy + bLatLon[1] + bLatLon[0] + bCourse + bTimestamp + bFlags + bRadioStatus;
        }

        /**
         * Addressed Safety-Related Message
         * by mobile or base station
         * @param sourceMmsi Source MMSI
         * @param destMmsi Destination MMSI
         * @param msg Message 1-156 characters
         */
        private static encodeMsgType12(sourceMmsi: number, destMmsi: number, msg: string): string {
            const header = this.getMsgHeader(12, sourceMmsi, 3);
            const bSeq = "00"; // Sequence number
            const bDestMmsi = destMmsi.toString(2).padStart(30, "0");
            const bRetransmit = "00"; // no retransmission + spare
            const bMsg = this.encodeString(msg.substr(0, 156));

            return header + bSeq + bDestMmsi + bRetransmit + bMsg;
        }

        /**
         * Safety Related Broadcast Message
         * by mobile or base station
         * @param mmsi MMSI
         * @param msg Message 1-161 characters length
         */
        private static encodeMsgType14(mmsi: number, msg: string): string {
            const header = this.getMsgHeader(14, mmsi, 3);
            const bSpare = "00"; // Spare bit
            const bMsg = this.encodeString(msg.substr(0, 161));
            return header + bSpare + bMsg;
        }

        /**
         * Interrogation via TDMA for single message type reply
         * @param sourceMmsi MMSI
         * @param destMmsi Destination MMSI for interrogation
         * @param msgType Requested message type
         */
        private static encodeMsgType15(sourceMmsi: number, destMmsi: number, msgType: number): string {
            const header = this.getMsgHeader(15, sourceMmsi, 3);
            const bDestMmsi = destMmsi.toString(2).padStart(30, "0");
            const bMsgType = msgType.toString(2).padStart(6, "0");
            const bSlotOffset = "000000000000"; // Autonomous slot allocation by responding station.
            return header + "00" + bDestMmsi + bMsgType + bSlotOffset;
        }

        /**
         * Standard Class B CS Position Report
         * by mobile station
         * @param mmsi MMSI
         * @param speed Speed over ground
         * @param course Course over ground
         * @param lat Position latitude
         * @param lon Position Longitude
         */
        private static encodeMsgType18(mmsi: number, speed: number, course: number, lat: number, lon: number): string {
            const header = this.getMsgHeader(18, mmsi, 3);
            const bReserved = "00000000";
            let bSpeed = "1111111111"; // 1023 = speed is not available.
            if (speed >= 0 && speed < 102.2) {
                // Speed over ground with 0.1 knot resolution from 0 to 102 knots. A value 1022 indicates 102.2 knots or higher.
                bSpeed = Math.floor(Math.round(speed * 10)).toString(2).padStart(10, "0");
            }
            const bAccuracy = "0"; // Accuracy > 10m
            const bLatLon = this.convertLatLon(lat, lon);
            let bCourse = "111000010000"; // 3600(0xE10) = course is not available.
            if (course >= 0 && course < 360) {
                // Course with 0.1° resolution
                bCourse = Math.floor(Math.round(course * 10)).toString(2).padStart(12, "0");
            }
            const bTrueHeading = "111111111"; // 511 = not applicable
            const now = new Date();
            const bTimestamp = now.getUTCSeconds().toString(2).padStart(6, "0"); // Seconds of UTC timestamp
            const bFlags = "0011000001";
            // 00: Regional reserved
            // 1: CS mode(carrier sense Class B)
            // 0: Display flag, display available for message 12 and 14
            // 0: DSC, not equipped with DSC function
            // 0: Band Flag, irrelevant when M22 flag is 0
            // 0: M22 Flag, no frequency management via message 22
            // 0: Autonomous and continuous mode
            // 0: Raim flag
            // 1: ITDMA comm state follows, see ITU-R M1371-5 §4.2.2.5
            const bRadioStatus = "1100000000000000110"; // Communication status, see ITU-R M1371-5 §4.2.2.5
            return header + bReserved + bSpeed + bAccuracy + bLatLon[1] + bLatLon[0] + bCourse + bTrueHeading + bTimestamp + bFlags + bRadioStatus;
        }

        /**
         * Extended Class B CS Position Report
         * by mobile station
         * @param mmsi MMSI
         * @param speed Speed over ground
         * @param course Course over ground
         * @param lat Position latitude
         * @param lon Position Longitude
         * @param vName Vessel name
         * @param vType Vessel type
         * @param vLength Vessel length
         * @param vBeam Vessel width
         */
        private static encodeMsgType19(mmsi: number, speed: number, course: number, lat: number, lon: number, vName: string, vType: number, vLength: number, vBeam: number): string {
            const header = this.getMsgHeader(19, mmsi, 3);
            const bReserved1 = "00000000";
            let bSpeed = "1111111111"; // 1023 = speed is not available.
            if (speed >= 0 && speed < 102.2) {
                // Speed over ground with 0.1 knot resolution from 0 to 102 knots. A value 1022 indicates 102.2 knots or higher.
                bSpeed = Math.floor(Math.round(speed * 10)).toString(2).padStart(10, "0");
            }
            const bAccuracy = "0"; // Accuracy > 10m
            const bLatLon = this.convertLatLon(lat, lon);
            let bCourse = "111000010000"; // 3600(0xE10) = course is not available.
            if (course >= 0 && course < 360) {
                // Course with 0.1° resolution
                bCourse = Math.floor(Math.round(course * 10)).toString(2).padStart(12, "0");
            }
            const bTrueHeading = "111111111"; // 511 = not applicable
            const now = new Date();
            const bTimestamp = now.getUTCSeconds().toString(2).padStart(6, "0"); // Seconds of UTC timestamp
            const bReserved2 = "0000"; // Regional reserved
            let bName = this.encodeString(vName.substr(0, 20));
            bName += "".padStart(120 - bName.length, "0");
            const bVtype = vType.toString(2).padStart(8, "0"); // Vessel type
            // AIS antenna in the middle
            const bSize = this.convertVesselSize(vLength, vBeam);
            const bFlags = "11110100000";
            // 1111: Internal GNSS
            // 0: RAIM not in use
            // 1: DTE available
            // 0: Station operating in autonomous and continuous mode
            // 0000: Not used
            return header + bReserved1 + bSpeed + bAccuracy + bLatLon[1] + bLatLon[0] + bCourse + bTrueHeading + bTimestamp + bReserved2 + bName + bVtype + bSize + bFlags;
        }

        /**
         * Data Link Management
         * by base station
         * If interrogated and no data link management information available, only offset number 1, number of
         * slot offsets 1, time-out 1, and increment 1 should be sent. These fields should all be set to zero.
         * @param mmsi MMSI
         * @param offset Reserved offset number
         * @param slot Consecutive slots
         * @param timeout Allocation timeout in minutes
         * @param increment Repeat increment
         */
        private static encodeMsgType20(mmsi: number, offset: number, slot: number, timeout: number, increment: number): string {
            const header = this.getMsgHeader(20, mmsi, 3);
            const bOffset = offset.toString(2).padStart(12, "0");
            const bSlots = slot.toString(2).padStart(4, "0");
            const bTimeout = timeout.toString(2).padStart(3, "0");
            const bIncrement = increment.toString(2).padStart(11, "0");
            return header + "00" + bOffset + bSlots + bTimeout + bIncrement + "00";
        }

        /**
         * Aid-to-Navigation Report
         * by aids to navigation such as buoys and lighthouses
         * @param mmsi MMSI
         * @param navaidType Navigation aid type
         * @param navaidName Navigation aid name
         * @param lat Navigation aid latitude
         * @param lon Navigation aid longitude
         * @param vLength Length bow to stern
         * @param vBeam Beam port to starport
         * @param navaidSimType Real or virtual navigation aid at position
         */
        private static encodeMsgType21(mmsi: number, navaidType: number, navaidName: string, lat: number, lon: number, vLength: number, vBeam: number, navaidSimType: number): string {
            const header = this.getMsgHeader(21, mmsi, 3);
            const bNavaidType = navaidType.toString(2).padStart(5, "0");
            let bNameExt = "";
            let bName = "";
            if (navaidName.length <= 20) {
                bName = this.encodeString(navaidName).padStart(120, "0");
            } else {
                const n = navaidName.replace("@", "");
                if (n.length <= 20) {
                    bName = this.encodeString(n).padStart(120, "0");
                } else {
                    bName = this.encodeString(n.substr(0, 20)); // First 20 characters
                    bNameExt = this.encodeString(n.substr(20, 14)); // No more than 14 characters in ext name
                    bNameExt += "".padStart(8 - (bNameExt.length % 8), "0"); // Pad to 8-bit boundary
                }
            }
            const bAccuracy = "0"; // Accuracy > 10m
            const bLatLon = this.convertLatLon(lat, lon);
            let bSize = this.convertVesselSize(0, 0);
            let bVirtual = "1";
            if (navaidSimType === eAtoN.Real) {
                // AIS antenna in the middle
                bSize = this.convertVesselSize(vLength, vBeam);
                bVirtual = "0";
            }
            const bFix = "1111"; // Internal GNSS
            const now = new Date();
            const bTime = now.getUTCSeconds().toString(2).padStart(6, "0");
            const bFlags1 = "0000000000";
            // 0: AtoN on position
            // 00000000: Reserved
            // 0 RAIM not in use
            const bFlags2 = "00";
            // 0: Station operating in autonomous and continuous mode
            // 0: Spare
            return header + bNavaidType + bName + bAccuracy + bLatLon[1] + bLatLon[0] + bSize + bFix + bTime + bFlags1 + bVirtual + bFlags2 + bNameExt;
        }

        /**
         * Channel Management
         * by base station
         * @param mmsi MMSI
         * @param channelA AIS channel A number
         * @param channelB AIS channel b number
         * @param neLat Latitude of area, upper right corner (north-east)
         * @param neLon Longitude of area, upper right corner (north-east)
         * @param swLat Latitude of area, lower left corner (south-west)
         * @param swLon Longitude of area, lower left corner (south-west)
         */
        private static encodeMsgType22(mmsi: number, channelA: number, channelB: number, neLat: number, neLon: number, swLat: number, swLon: number): string {
            const header = this.getMsgHeader(22, mmsi, 3);
            const bChannelA = channelA.toString(2).padStart(12, "0");
            const bChannelB = channelB.toString(2).padStart(12, "0");
            const bTxRxMode = "0000"; // TxA/TxB/RxA/RxB
            const bPower = "0";	// 0= high power, 1 = low power
            const bNELatLon = this.convertLatLonShort(neLat, neLon);
            const bSWLatLon = this.convertLatLonShort(swLat, swLon);
            const bZoneSize = "100"; // Transitional zone size: 4 = default = 5 nautical miles

            return header + "00" + bChannelA + bChannelB + bTxRxMode + bPower + bNELatLon[1] + bNELatLon[0] + bSWLatLon[1] + bSWLatLon[0] + "000" + bZoneSize + "".padStart(23, "0");
        }

        /**
         * Group Assignment Command
         * @param mmsi MMSI
         * @param neLat Latitude of area, upper right corner (north-east)
         * @param neLon Longitude of area, upper right corner (north-east)
         * @param swLat Latitude of area, lower left corner (south-west)
         * @param swLon Longitude of area, lower left corner (south-west)
         * @param interval Report interval
         * @param quiet Quiet time
         */
        private static encodeMsgType23(mmsi: number, neLat: number, neLon: number, swLat: number, swLon: number, interval: number, quiet: number): string {
            const header = this.getMsgHeader(23, mmsi, 3);
            const bNELatLon = this.convertLatLonShort(neLat, neLon);
            const bSWLatLon = this.convertLatLonShort(swLat, swLon);
            const bStationType = "0000"; // Target all stations
            const bShipType = "00000000"; // Target all ships
            const bTxRxMode = "00"; // TxA/TxB/RxA/RxB
            const bInterval = interval.toString(2).padStart(4, "0");
            const bQuiet = quiet.toString(2).padStart(4, "0");

            return header + "00" + bNELatLon[1] + bNELatLon[0] + bSWLatLon[1] + bSWLatLon[0] + bStationType + bShipType + "".padStart(22, "0") + bTxRxMode + bInterval + bQuiet + "000000";
        }

        /**
         * Static Data Report
         * @param mmsi MMSI
         * @param msgType Message type A or B
         * @param vName Vessel Name
         * @param vCallsign Vessel Callsign
         * @param vLength Length bow to stern
         * @param vBeam Beam port to starport
         * @param vType Vessel Type
         */
        private static encodeMsgType24(mmsi: number, msgType: number, vName: string, vCallsign: string, vLength: number, vBeam: number, vType: number): string {
            const header = this.getMsgHeader(24, mmsi, 3);
            let part = "00"; // Message type A
            let n = vName.substr(0, 20);
            let padding;
            if (msgType === eMessageType24.TypeA) {
                const bName = this.encodeString(n);
                padding = "".padStart(120 - bName.length, "0");
                return header + part + bName + padding + "00000000";
            }

            part = "01"; // Message type B
            const bVtype = vType.toString(2).padStart(8, "0"); // Vessel type
            const bVendorId = "".padStart(42, "0"); // Vendor ID, unit model code, serial number
            n = vCallsign.substr(0, 7);
            const bCallsign = this.encodeString(n);
            padding = "".padEnd(42 - bCallsign.length, "0"); // Max 7 six-bit characters
            // AIS antenna in the middle
            const bSize = this.convertVesselSize(vLength, vBeam);
            const bFlags = "111100";
            // 1111: Internal GNSS
            // 00: Spare

            return header + part + bVtype + bVendorId + bCallsign + padding + bSize + bFlags;
        }

        /**
         * Long-range broadcast message
         * by mobile station
         * @param mmsi MMSI
         * @param status Navigation status
         * @param speed Speed over ground
         * @param course Course over ground
         * @param lat Position latitude
         * @param lon Position longitude
         */
        private static encodeMsgType27(mmsi: number, status: number, speed: number, course: number, lat: number, lon: number): string {
            const header = this.getMsgHeader(1, mmsi, 3);
            const bStatus = status.toString(2).padStart(4, "0"); //  Navigation status e.g. 0 = Under way using engine, 1 - At anchor, 5 = Moored, 8 = Sailing, 15 = undefined
            let bSpeed = "111111"; // 63 = speed is not available.
            if (speed >= 0 && speed < 63.0) {
                // Speed over ground with 0.1 knot resolution from 0 to 102 knots. A value 1022 indicates 102.2 knots or higher.
                bSpeed = Math.floor(speed).toString(2).padStart(6, "0");
            }
            const bAccuracy = "00";
            // 0: Accuracy > 10m
            // 0: RAIM not used
            const bLatLon = this.convertLatLonShort(lat, lon);
            let bCourse = "111111111"; // 511(0x1FF) = course is not available.
            if (course >= 0 && course < 360) {
                // Course with 0.1° resolution
                bCourse = Math.floor(course).toString(2).padStart(9, "0");
            }
            const bFlags = "00";
            // 0: Position latency <5s
            // 0: Spare

            return header + bAccuracy + bStatus + bLatLon[1] + bLatLon[0] + bSpeed + bCourse + bFlags;
        }

    }
}