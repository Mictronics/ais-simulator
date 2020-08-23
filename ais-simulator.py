#!/usr/bin/env python3
#
# This script is based on the AIS BlackToolkit.
# ais-simulator.py implements a software-based AIS transmitter accordingly to
# specifications (ITU-R M.1371-4).
#
# A fully functional GnuRadio installation is required, including the AIS Frame Builder blocks,
# namely gr-ais_simulator.
#
# Tested on:
# GnuRadio 3.8.1
# gr-osmosdr 0.2.0
# Ubuntu 20.04 focal
# Python 3.8
# GNU C++ version 9.3.0; Boost 1.71.
# HackRF One (2018.01.1)
#
# Copyright 2013-2014 -- Embyte & Pastus
# Copyright 2020, Mictronics
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation; either version 2
# of the License, or (at your option) any later version.
#
# 1. Start AIS simulator:
# $ python3 -u ais-simulator.py
#
# 2. Open ./webapp/ais-simulator.html in browser.
#
# 3. Select AIS message type and send...
#
# Tested against rtl_ais via OTA transmission.

import signal
import sys
from gnuradio import blocks
from gnuradio import digital
from gnuradio import gr
from gnuradio.eng_option import eng_option
from optparse import OptionParser
import ais_simulator
import osmosdr


class top_block(gr.top_block):

    def __init__(self, c, amp, lna, sr, br, ppm):
        gr.top_block.__init__(self, 'AIS Simulator')

        # Blocks
        osmosdr_sink_0 = osmosdr.sink(args="numchan=" + str(1) + " " + '')
        osmosdr_sink_0.set_sample_rate(sr)
        osmosdr_sink_0.set_freq_corr(ppm, 0)
        osmosdr_sink_0.set_center_freq(161975000 + 50000 * c, 0)
        osmosdr_sink_0.set_gain(14 if amp else 0, 0)
        osmosdr_sink_0.set_if_gain(lna, 0)
        osmosdr_sink_0.set_bb_gain(16, 0)
        osmosdr_sink_0.set_antenna("", 0)
        digital_gmsk_mod_0 = digital.gmsk_mod(
            samples_per_symbol=int(sr / br),
            bt=0.4,
            verbose=False,
            log=False,
        )
        websocket_pdu_0 = ais_simulator.websocket_pdu('127.0.0.1', '52002')
        blocks_pdu_to_tagged_stream_0 = blocks.pdu_to_tagged_stream(blocks.byte_t, 'packet_len')
        blocks_multiply_const_vxx_0 = blocks.multiply_const_vcc((0.9, ))
        ais_build_frame = ais_simulator.bitstring_to_frame(True, 'packet_len')

        # Connections
        self.msg_connect((websocket_pdu_0, 'out'), (blocks_pdu_to_tagged_stream_0, 'pdus'))
        self.connect((blocks_pdu_to_tagged_stream_0, 0), (ais_build_frame, 0))
        self.connect((ais_build_frame, 0), (digital_gmsk_mod_0, 0))
        self.connect((digital_gmsk_mod_0, 0), (blocks_multiply_const_vxx_0, 0))
        self.connect((blocks_multiply_const_vxx_0, 0), (osmosdr_sink_0, 0))


if __name__ == '__main__':
    def signal_handler(signal, frame):
        tb.stop()
        tb.wait()
        sys.exit(0)

    desc = """GnuRadio AIS Transmitter. Copyright Embyte & Pastus, Mictronics 2013-2020."""

    parser = OptionParser(option_class=eng_option, usage="%prog: [options]", description=desc)

    parser.add_option(
        "-a",
        help="""Enable RF amp.""",
        action="store_true",
        default=False,
        dest="rf_amp")
    parser.add_option(
        "-l",
        help="""Set IF (LNA) gain. [0-47 dB]""",
        metavar="GAIN",
        type="int",
        default=10,
        dest="lna")
    parser.add_option(
        "-p",
        help="""Set frequency correction. [ppm]""",
        metavar="PPM",
        type="int",
        default=0,
        dest="ppm")
    parser.add_option(
        "--channel",
        help="""Set AIS channel: [A: 161.975MHz (87B)] [B: 162.025MHz (88B)]""",
        default="A")
    parser.add_option(
        "--sampling_rate",
        help="""Set sampling rate (default is 8MHz)""",
        type="int",
        default=8000000)
    parser.add_option(
        "--bit_rate",
        help="""Set bit rate (default is 9600 Baud)""",
        type="int",
        default=9600)

    (options, args) = parser.parse_args()

    if not options.channel:
        parser.error("Channel not specified: -h for help.")

    if options.channel != "A" and options.channel != "B":
        parser.error("Channel accepts value A or B: -h for help")

    channel_ID = 0 if options.channel == "A" else 1
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    tb = top_block(c=channel_ID, amp=options.rf_amp, lna=options.lna, sr=options.sampling_rate, br=options.bit_rate, ppm=options.ppm)
    tb.start()
    tb.wait()
