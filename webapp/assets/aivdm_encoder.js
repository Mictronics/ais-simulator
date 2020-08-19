"use strict";
var aisSimulator;
(function (aisSimulator) {
    let eMessageType24;
    (function (eMessageType24) {
        eMessageType24[eMessageType24["Unknown"] = 0] = "Unknown";
        eMessageType24[eMessageType24["TypeA"] = 1] = "TypeA";
        eMessageType24[eMessageType24["TypeB"] = 2] = "TypeB";
    })(eMessageType24 = aisSimulator.eMessageType24 || (aisSimulator.eMessageType24 = {}));
    let eAtoN;
    (function (eAtoN) {
        eAtoN[eAtoN["Unknown"] = 0] = "Unknown";
        eAtoN[eAtoN["Real"] = 1] = "Real";
        eAtoN[eAtoN["Virtual"] = 2] = "Virtual";
    })(eAtoN = aisSimulator.eAtoN || (aisSimulator.eAtoN = {}));
    class AivdmEncoder {
        static encodeMsg(ap) {
            switch (ap.msgType) {
                case 1:
                    return this.encodeMsgType1(ap.srcMmsi, ap.status, ap.speed, ap.course, ap.posLat, ap.posLon);
                case 4:
                    return this.encodeMsgType4(ap.srcMmsi, ap.posLat, ap.posLon);
                case 9:
                    return this.encodeMsgType9(ap.srcMmsi, ap.altitude, ap.speed, ap.course, ap.posLat, ap.posLon);
                case 12:
                    return this.encodeMsgType12(ap.srcMmsi, ap.destMmsi, ap.addrMsg);
                case 14:
                    return this.encodeMsgType14(ap.srcMmsi, ap.sartMsg);
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
                default:
                    return "";
            }
        }
        static encoderTest() {
            const ap = {
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
            let s = this.encodeMsgType1(ap.srcMmsi, ap.status, ap.speed, ap.course, ap.posLat, ap.posLon);
            console.assert(s.length === 168);
            s = this.encodeMsgType4(ap.srcMmsi, ap.posLat, ap.posLon);
            console.assert(s.length === 168);
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
        }
        static encodeString(s) {
            let enc = "";
            const u = s.toUpperCase();
            for (const c of u) {
                const i = this.charset.indexOf(c);
                enc += i.toString(2).padStart(6, "0");
            }
            return enc;
        }
        static convertLatLon(lat, lon) {
            const bLat = (Math.floor(Math.round(lat * 600000)) & 0b111111111111111111111111111).toString(2).padStart(27, "0");
            const bLon = (Math.floor(Math.round(lon * 600000)) & 0b1111111111111111111111111111).toString(2).padStart(28, "0");
            return [bLat, bLon];
        }
        static convertLatLonShort(lat, lon) {
            const bLat = (Math.floor(Math.round(lat * 600)) & 0b11111111111111111).toString(2).padStart(17, "0");
            const bLon = (Math.floor(Math.round(lon * 600)) & 0b111111111111111111).toString(2).padStart(18, "0");
            return [bLat, bLon];
        }
        static getMsgHeader(msgType, mmsi, repeatCount) {
            const bMsgType = msgType.toString(2).padStart(6, "0");
            const bRepeat = repeatCount.toString(2).padStart(2, "0");
            const bMmsi = mmsi.toString(2).padStart(30, "0");
            return bMsgType + bRepeat + bMmsi;
        }
        static encodeMsgType1(mmsi, status, speed, course, lat, lon) {
            const header = this.getMsgHeader(1, mmsi, 3);
            const bStatus = status.toString(2).padStart(4, "0");
            const bRot = "10000000";
            let bSpeed = "1111111111";
            if (speed >= 0 && speed < 102.2) {
                bSpeed = Math.floor(Math.round(speed * 10)).toString(2).padStart(10, "0");
            }
            const bAccuracy = "0";
            const bLatLon = this.convertLatLon(lat, lon);
            let bCourse = "111000010000";
            if (course >= 0 && course < 360) {
                bCourse = Math.floor(Math.round(course * 10)).toString(2).padStart(12, "0");
            }
            const bTrueHeading = "111111111";
            const now = new Date();
            const bTimestamp = now.getUTCSeconds().toString(2).padStart(6, "0");
            const bFlags = "000000";
            const bRadioStatus = "0000000000000000000";
            return header + bStatus + bRot + bSpeed + bAccuracy + bLatLon[1] + bLatLon[0] + bCourse + bTrueHeading + bTimestamp + bFlags + bRadioStatus;
        }
        static encodeMsgType4(mmsi, lat, lon) {
            const header = this.getMsgHeader(4, mmsi, 3);
            const now = new Date();
            const bYear = now.getUTCFullYear().toString(2).padStart(14, "0");
            const bMonth = now.getUTCMonth().toString(2).padStart(4, "0");
            const bDay = now.getUTCDay().toString(2).padStart(5, "0");
            const bHour = now.getHours().toString(2).padStart(5, "0");
            const bMin = now.getMinutes().toString(2).padStart(6, "0");
            const bSec = now.getSeconds().toString(2).padStart(6, "0");
            const bAccuracy = "0";
            const bLatLon = this.convertLatLon(lat, lon);
            const bDevice = "0001";
            const bFlags = "00000000000";
            const bRadioStatus = "0000000000000000000";
            return header + bYear + bMonth + bDay + bHour + bMin + bSec + bAccuracy + bLatLon[1] + bLatLon[0] + bDevice + bFlags + bRadioStatus;
        }
        static encodeMsgType9(mmsi, altitude, speed, course, lat, lon) {
            const header = this.getMsgHeader(9, mmsi, 3);
            const bAlt = altitude.toString(2).padStart(12, "0");
            let bSpeed = "1111111111";
            if (speed >= 0 && speed < 102.2) {
                bSpeed = Math.floor(Math.round(speed * 10)).toString(2).padStart(10, "0");
            }
            const bAccuracy = "0";
            const bLatLon = this.convertLatLon(lat, lon);
            let bCourse = "111000010000";
            if (course >= 0 && course < 360) {
                bCourse = Math.floor(Math.round(course * 10)).toString(2).padStart(12, "0");
            }
            const now = new Date();
            const bTimestamp = now.getUTCSeconds().toString(2).padStart(6, "0");
            const bFlags = "00000000100010";
            const bRadioStatus = "00000000000000000000";
            return header + bAlt + bSpeed + bAccuracy + bLatLon[1] + bLatLon[0] + bCourse + bTimestamp + bFlags + bRadioStatus;
        }
        static encodeMsgType12(sourceMmsi, destMmsi, msg) {
            const header = this.getMsgHeader(12, sourceMmsi, 3);
            const bSeq = "00";
            const bDestMmsi = destMmsi.toString(2).padStart(30, "0");
            const bRetransmit = "00";
            const bMsg = this.encodeString(msg.substr(0, 156));
            return header + bSeq + bDestMmsi + bRetransmit + bMsg;
        }
        static encodeMsgType14(mmsi, msg) {
            const header = this.getMsgHeader(14, mmsi, 3);
            const bSpare = "00";
            const bMsg = this.encodeString(msg.substr(0, 161));
            return header + bSpare + bMsg;
        }
        static encodeMsgType18(mmsi, speed, course, lat, lon) {
            const header = this.getMsgHeader(18, mmsi, 3);
            const bReserved = "00000000";
            let bSpeed = "1111111111";
            if (speed >= 0 && speed < 102.2) {
                bSpeed = Math.floor(Math.round(speed * 10)).toString(2).padStart(10, "0");
            }
            const bAccuracy = "0";
            const bLatLon = this.convertLatLon(lat, lon);
            let bCourse = "111000010000";
            if (course >= 0 && course < 360) {
                bCourse = Math.floor(Math.round(course * 10)).toString(2).padStart(12, "0");
            }
            const bTrueHeading = "111111111";
            const now = new Date();
            const bTimestamp = now.getUTCSeconds().toString(2).padStart(6, "0");
            const bFlags = "001011100";
            const bRadioStatus = "11100000000000000110";
            return header + bReserved + bSpeed + bAccuracy + bLatLon[1] + bLatLon[0] + bCourse + bTrueHeading + bTimestamp + bFlags + bRadioStatus;
        }
        static encodeMsgType19(mmsi, speed, course, lat, lon, vName, vType, vLength, vBeam) {
            const header = this.getMsgHeader(19, mmsi, 3);
            const bReserved1 = "00000000";
            let bSpeed = "1111111111";
            if (speed >= 0 && speed < 102.2) {
                bSpeed = Math.floor(Math.round(speed * 10)).toString(2).padStart(10, "0");
            }
            const bAccuracy = "0";
            const bLatLon = this.convertLatLon(lat, lon);
            let bCourse = "111000010000";
            if (course >= 0 && course < 360) {
                bCourse = Math.floor(Math.round(course * 10)).toString(2).padStart(12, "0");
            }
            const bTrueHeading = "111111111";
            const now = new Date();
            const bTimestamp = now.getUTCSeconds().toString(2).padStart(6, "0");
            const bReserved2 = "0000";
            let bName = this.encodeString(vName.substr(0, 20));
            bName += "".padStart(120 - bName.length, "0");
            const bVtype = vType.toString(2).padStart(8, "0");
            const hl = (vLength / 2).toString(2).padStart(9, "0");
            const hw = (vBeam / 2).toString(2).padStart(6, "0");
            const bFlags = "00010100000";
            return header + bReserved1 + bSpeed + bAccuracy + bLatLon[1] + bLatLon[0] + bCourse + bTrueHeading + bTimestamp + bReserved2 + bName + bVtype + hl + hl + hw + hw + bFlags;
        }
        static encodeMsgType20(mmsi, offset, slot, timeout, increment) {
            const header = this.getMsgHeader(20, mmsi, 3);
            const bOffset = offset.toString(2).padStart(12, "0");
            const bSlots = slot.toString(2).padStart(4, "0");
            const bTimeout = timeout.toString(2).padStart(3, "0");
            const bIncrement = increment.toString(2).padStart(11, "0");
            return header + "00" + bOffset + bSlots + bTimeout + bIncrement + "00";
        }
        static encodeMsgType21(mmsi, navaidType, navaidName, lat, lon, vLength, vBeam, navaidSimType) {
            const header = this.getMsgHeader(21, mmsi, 3);
            const bNavaidType = navaidType.toString(2).padStart(5, "0");
            let bNameExt = "";
            let bName = "";
            if (navaidName.length <= 20) {
                bName = this.encodeString(navaidName).padStart(120, "0");
            }
            else {
                const n = navaidName.replace("@", "");
                if (n.length <= 20) {
                    bName = this.encodeString(n).padStart(120, "0");
                }
                else {
                    bName = this.encodeString(n.substr(0, 20));
                    bNameExt = this.encodeString(n.substr(20, 14));
                    bNameExt += "".padStart(8 - (bNameExt.length % 8), "0");
                }
            }
            const bAccuracy = "0";
            const bLatLon = this.convertLatLon(lat, lon);
            let hl = "000000000";
            let hw = "000000";
            let bVirtual = "1";
            if (navaidSimType === eAtoN.Real) {
                hl = (vLength / 2).toString(2).padStart(9, "0");
                hw = (vBeam / 2).toString(2).padStart(6, "0");
                bVirtual = "0";
            }
            const bFix = "0001";
            const now = new Date();
            const bTime = now.getUTCSeconds().toString(2).padStart(6, "0");
            return header + bNavaidType + bName + bAccuracy + bLatLon[1] + bLatLon[0] + hl + hl + hw + hw + bFix + bTime + "1000000000" + bVirtual + "00" + bNameExt;
        }
        static encodeMsgType22(mmsi, channelA, channelB, neLat, neLon, swLat, swLon) {
            const header = this.getMsgHeader(22, mmsi, 3);
            const bChannelA = channelA.toString(2).padStart(12, "0");
            const bChannelB = channelB.toString(2).padStart(12, "0");
            const bTxRxMode = "0000";
            const bPower = "0";
            const bNELatLon = this.convertLatLonShort(neLat, neLon);
            const bSWLatLon = this.convertLatLonShort(swLat, swLon);
            const bZoneSize = "100";
            return header + "00" + bChannelA + bChannelB + bTxRxMode + bPower + bNELatLon[1] + bNELatLon[0] + bSWLatLon[1] + bSWLatLon[0] + "000" + bZoneSize + "".padStart(23, "0");
        }
        static encodeMsgType23(mmsi, neLat, neLon, swLat, swLon, interval, quiet) {
            const header = this.getMsgHeader(23, mmsi, 3);
            const bNELatLon = this.convertLatLonShort(neLat, neLon);
            const bSWLatLon = this.convertLatLonShort(swLat, swLon);
            const bStationType = "0000";
            const bShipType = "00000000";
            const bTxRxMode = "00";
            const bInterval = interval.toString(2).padStart(4, "0");
            const bQuiet = quiet.toString(2).padStart(4, "0");
            return header + "00" + bNELatLon[1] + bNELatLon[0] + bSWLatLon[1] + bSWLatLon[0] + bStationType + bShipType + "".padStart(22, "0") + bTxRxMode + bInterval + bQuiet + "000000";
        }
        static encodeMsgType24(mmsi, msgType, vName, vCallsign, vLength, vBeam, vType) {
            const header = this.getMsgHeader(24, mmsi, 3);
            let part = "00";
            let n = vName.substr(0, 20);
            let padding;
            if (msgType === eMessageType24.TypeA) {
                const bName = this.encodeString(n);
                padding = "".padStart(120 - bName.length, "0");
                return header + part + bName + padding + "00000000";
            }
            part = "01";
            const bVtype = vType.toString(2).padStart(8, "0");
            const bVendorId = "".padStart(42, "0");
            n = vCallsign.substr(0, 7);
            const bCallsign = this.encodeString(n);
            padding = "".padEnd(42 - bCallsign.length, "0");
            const hl = (vLength / 2).toString(2).padStart(9, "0");
            const hw = (vBeam / 2).toString(2).padStart(6, "0");
            return header + part + bVtype + bVendorId + bCallsign + padding + hl + hl + hw + hw + "000000";
        }
    }
    AivdmEncoder.charset = "@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^- !\"#$%&'()*+,-./0123456789:;<=>?";
    aisSimulator.AivdmEncoder = AivdmEncoder;
})(aisSimulator || (aisSimulator = {}));
//# sourceMappingURL=aivdm_encoder.js.map