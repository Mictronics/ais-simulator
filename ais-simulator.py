#!/usr/bin/env python3
#
# This script is based on the AIS BlackToolkit.
# ais-simulator.py implements a software-based AIS transmitter accordingly to
# specifications (ITU-R M.1371-4).
#
# A fully functional GnuRadio installation is required, including the AIS Frame Builder block,
# namely gr-ais-simulator.
#
# Tested on:
# GnuRadio 3.8.1
# gr-osmosdr 0.2.0
# Ubuntu 20.04 focal
# Python 3.8
# GNU C++ version 7.3.0; Boost_1.65.1
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
# Usage example:
# $ ./AIVDM_Encoder.py --type=1 --mmsi=970010000 --lat=45.6910 --long=9.7235 | xargs -IX ./ais-simulator.py --payload=X
#

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

    def __init__(self, p, c, amp, lna, sr, br, ppm):
        gr.top_block.__init__(self, 'AIS Simulator')

        ##################################################
        # Variables
        ##################################################
        self.samp_rate = samp_rate = sr
        self.channel_select = c
        self.bit_rate = bit_rate = br

        ##################################################
        # Blocks
        ##################################################
        self.osmosdr_sink_0 = osmosdr.sink(args="numchan=" + str(1) + " " + '')
        self.osmosdr_sink_0.set_sample_rate(samp_rate)
        self.osmosdr_sink_0.set_freq_corr(ppm, 0)
        self.osmosdr_sink_0.set_center_freq(161975000 + 50000 * c, 0)
        self.osmosdr_sink_0.set_gain(14 if amp else 0, 0)
        self.osmosdr_sink_0.set_if_gain(lna, 0)
        self.osmosdr_sink_0.set_bb_gain(16, 0)
        self.osmosdr_sink_0.set_antenna("", 0)
        self.digital_gmsk_mod_0 = digital.gmsk_mod(
            samples_per_symbol=int(samp_rate / bit_rate),
            bt=0.4,
            verbose=False,
            log=False,
        )
        self.blocks_socket_pdu_0 = blocks.socket_pdu('TCP_SERVER', '', '1337', 1024, False)
        self.blocks_pdu_to_tagged_stream_0 = blocks.pdu_to_tagged_stream(blocks.byte_t, 'packet_len')
        self.blocks_multiply_const_vxx_0 = blocks.multiply_const_vcc((0.9, ))
        self.ais_simulator_build_frame_0 = ais_simulator.build_frame(p, True, True, 'packet_len')

        ##################################################
        # Connections
        ##################################################
        self.msg_connect((self.blocks_socket_pdu_0, 'pdus'), (self.blocks_pdu_to_tagged_stream_0, 'pdus'))
        self.connect((self.blocks_pdu_to_tagged_stream_0, 0), (self.ais_simulator_build_frame_0, 0))
        self.connect((self.ais_simulator_build_frame_0, 0), (self.digital_gmsk_mod_0, 0))
        self.connect((self.digital_gmsk_mod_0, 0), (self.blocks_multiply_const_vxx_0, 0))
        self.connect((self.blocks_multiply_const_vxx_0, 0), (self.osmosdr_sink_0, 0))

    def get_samp_rate(self):
        return self.samp_rate

    def set_samp_rate(self, samp_rate):
        self.samp_rate = samp_rate
        self.osmosdr_sink_0.set_samp_rate(self.samp_rate)

    def get_channel_select(self):
        return self.channel_select

    def set_channel_select(self, channel_select):
        self.channel_select = channel_select
        self.analog_sig_source_x_0.set_frequency(-25000 + 50000 * self.channel_select)

    def get_bit_rate(self):
        return self.bit_rate

    def set_bit_rate(self, bit_rate):
        self.bit_rate = bit_rate


if __name__ == '__main__':
    def signal_handler(signal, frame):
        tb.stop()
        tb.wait()
        del tb.ais_simulator_build_frame_0
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
        "--payload",
        help="""Specify the message payload to transmit (crafted via AIVDM_Encoder)""")
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

    if not options.payload:
        parser.error("Payload not specified: -h for help.")

    if not options.channel:
        parser.error("Channel not specified: -h for help.")

    if options.channel != "A" and options.channel != "B":
        parser.error("Channel accepts value A or B: -h for help")

    channel_ID = 0 if options.channel == "A" else 1
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    tb = top_block(p=options.payload, c=channel_ID, amp=options.rf_amp, lna=options.lna, sr=options.sampling_rate, br=options.bit_rate, ppm=options.ppm)
    tb.start()
    tb.wait()
