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
        active: boolean;
        altitude?: number;
        lat: number;
        lon: number;
        name: string;
    }

    export interface IRoute {
        ActiveNavPointId: number;
        distanceToNavPoint: number; // meters
        name: string;
        navPoints: INavPoint[];
        repeat: boolean;
        timeToNavPoint: number; // seconds
    }

    export interface IVessel {
        mmsi: number;
        altitude: number; // meters
        beam: number; // meters
        callsign: string;
        course: number;
        destLat: number; // decimal degree DD.MMMMMMM
        destLon: number; // decimal degree DD.MMMMMMM
        length: number; // meters
        name: string;
        posLat: number; // decimal degree DD.MMMMMMM
        posLon: number; // decimal degree DD.MMMMMMM
        routeActive: boolean;
        route: IRoute;
        speed: number; // knots
        status: number;
        type: number;
        updateNavigation(): void;
    }
}