#!/usr/bin/env python3
# -*- coding: utf-8 -*-

#
# SPDX-License-Identifier: GPL-3.0
#
# GNU Radio Python Flow Graph
# Title: Example AIS Transmitter
# Author: Mictronics
# GNU Radio version: 3.8.1.0

from gnuradio import blocks
from gnuradio import digital
from gnuradio import gr
from gnuradio.filter import firdes
import sys
import signal
from argparse import ArgumentParser
from gnuradio.eng_arg import eng_float, intx
from gnuradio import eng_notation
import ais_simulator
import osmosdr
import time


class top_block(gr.top_block):

    def __init__(self):
        gr.top_block.__init__(self, "Example AIS Transmitter")

        ##################################################
        # Variables
        ##################################################
        self.sentence = sentence = '010010000011101011110111001110011000100000000000000000100000001011001000001011000101000110100010010100001101011001111011000011111111111011100101110011100000000000000110'
        self.samp_rate = samp_rate = 8e6
        self.bit_rate = bit_rate = 9600

        ##################################################
        # Blocks
        ##################################################
        self.osmosdr_sink_0 = osmosdr.sink(
            args="numchan=" + str(1) + " " + 'hackrf=0'
        )
        self.osmosdr_sink_0.set_sample_rate(samp_rate)
        self.osmosdr_sink_0.set_center_freq(161975000, 0)
        self.osmosdr_sink_0.set_freq_corr(0, 0)
        self.osmosdr_sink_0.set_gain(10, 0)
        self.osmosdr_sink_0.set_if_gain(0, 0)
        self.osmosdr_sink_0.set_bb_gain(0, 0)
        self.osmosdr_sink_0.set_antenna('', 0)
        self.osmosdr_sink_0.set_bandwidth(0, 0)
        self.digital_gmsk_mod_0 = digital.gmsk_mod(
            samples_per_symbol=int(samp_rate/bit_rate),
            bt=0.4,
            verbose=False,
            log=False)
        self.blocks_socket_pdu_0 = blocks.socket_pdu('TCP_SERVER', '', '1337', 1024, False)
        self.blocks_pdu_to_tagged_stream_0 = blocks.pdu_to_tagged_stream(blocks.byte_t, 'packet_len')
        self.blocks_multiply_const_xx_0 = blocks.multiply_const_cc(0.9, 1)
        self.ais_simulator_build_frame_1 = ais_simulator.build_frame(sentence, True, True, 'packet_len')



        ##################################################
        # Connections
        ##################################################
        self.msg_connect((self.blocks_socket_pdu_0, 'pdus'), (self.blocks_pdu_to_tagged_stream_0, 'pdus'))
        self.connect((self.ais_simulator_build_frame_1, 0), (self.digital_gmsk_mod_0, 0))
        self.connect((self.blocks_multiply_const_xx_0, 0), (self.osmosdr_sink_0, 0))
        self.connect((self.blocks_pdu_to_tagged_stream_0, 0), (self.ais_simulator_build_frame_1, 0))
        self.connect((self.digital_gmsk_mod_0, 0), (self.blocks_multiply_const_xx_0, 0))


    def get_sentence(self):
        return self.sentence

    def set_sentence(self, sentence):
        self.sentence = sentence
        self.ais_simulator_build_frame_1.set_sentence(self.sentence)

    def get_samp_rate(self):
        return self.samp_rate

    def set_samp_rate(self, samp_rate):
        self.samp_rate = samp_rate
        self.osmosdr_sink_0.set_sample_rate(self.samp_rate)

    def get_bit_rate(self):
        return self.bit_rate

    def set_bit_rate(self, bit_rate):
        self.bit_rate = bit_rate





def main(top_block_cls=top_block, options=None):
    tb = top_block_cls()

    def sig_handler(sig=None, frame=None):
        tb.stop()
        tb.wait()

        sys.exit(0)

    signal.signal(signal.SIGINT, sig_handler)
    signal.signal(signal.SIGTERM, sig_handler)

    tb.start()

    tb.wait()


if __name__ == '__main__':
    main()
