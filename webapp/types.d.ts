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

declare namespace aisSimulator {

    export interface IAisParameterFormElementCollection {
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
        aisVesselDraughtInput: HTMLInputElement;
        aisVesselDestinationInput: HTMLInputElement;
        aisEtaInput: HTMLInputElement;
        aisInterrogatorMsgTypeSelect: HTMLSelectElement;
    }

    export interface IAisParameter {
        addrMsg: string;
        altitude: number;
        beam: number;
        callsign: string;
        channelA: number;
        channelB: number;
        course: number;
        destination: string;
        destMmsi: number;
        draught: number;
        eta: Date;
        fatdmaOffset: number;
        fatdmaRepeat: number;
        fatdmaSlot: number;
        fatdmaTimeout: number;
        interrogationMsgType: number;
        interval: number;
        length: number;
        srcMmsi: number;
        msgType: number;
        msgType24: number;
        name: string;
        navAidName: string;
        navAidSimType: number;
        navAidType: number;
        neLat: number;
        neLon: number;
        posLat: number;
        posLon: number;
        quiet: number;
        sartMsg: string;
        speed: number;
        status: number;
        swLat: number;
        swLon: number;
        type: number;
    }

    export interface INavPoint {
        lat: number;
        lon: number;
    }

    export interface IRoute {
        navPoints: INavPoint[];
        repeat: boolean; // loop back to first point when the last is reached, instead of stopping
        currentLegIndex: number;
    }

    export interface IVessel {
        mmsi: number;
        name: string;
        callsign: string;
        aisClass: eAisClass;
        type: number; // AIS vessel type code
        length: number; // meters
        beam: number; // meters
        draught: number; // 1/10 meters, Class A static data only
        destination: string; // Class A static data only
        status: number; // navigation status, Type 1 position reports only
        posLat: number;
        posLon: number;
        speed: number; // knots
        course: number; // degrees, also used as heading since movement always faces travel direction
        movementMode: eMovementMode;
        circleCenterLat: number;
        circleCenterLon: number;
        circleRadiusKm: number;
        circleAngleDeg: number; // current phase, mutated each tick
        route: IRoute;
        positionIntervalSec: number;
        staticIntervalSec: number;
        nextPositionSendAt: number; // ms epoch
        nextStaticSendAt: number; // ms epoch
    }
}