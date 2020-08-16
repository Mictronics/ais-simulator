/* -*- c++ -*- */
/*
 * Copyright 2020 Michael Wolf aka Mictronics.
 * 
 * This file is based on and contains work from 
 * https://github.com/trendmicro/ais
 * https://github.com/gercap/ais
 *
 * This is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3, or (at your option)
 * any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this software; see the file COPYING.  If not, write to
 * the Free Software Foundation, Inc., 51 Franklin Street,
 * Boston, MA 02110-1301, USA.
 */

#ifndef INCLUDED_AIS_SIMULATOR_BUILD_FRAME_IMPL_H
#define INCLUDED_AIS_SIMULATOR_BUILD_FRAME_IMPL_H

#include <ais_simulator/build_frame.h>

namespace gr
{
    namespace ais_simulator
    {

        class build_frame_impl : public build_frame
        {
        private:
            bool d_repeat;
            bool d_enable_nrzi;
            bool d_enable_input;
            const char *d_sentence;
            char *payload; // [the 01 representation of the sentence as taken from input]
            unsigned short len_sentence;
            unsigned short len_payload;

        protected:
            static const char preamble[24];
            static const char start_mark[8];
            int calculate_output_stream_length(const gr_vector_int &ninput_items);
            void dump_buffer(const char *b, int buffer_size);
            char *int2bin(int a, char *buffer, int buf_size);
            int stuff(const char *in, char *out, int l_in);
            void pack(int orig_ascii, char *ret, int bits_per_byte);
            void nrz_to_nrzi(char *data, int length);
            void reverse_bit_order(char *data, int length);
            unsigned long unpack(char *buffer, int start, int length);
            void compute_crc(char *buffer, char *ret, unsigned int len);
            void byte_packing(char *input_frame, unsigned char *out_byte, unsigned int len);

        public:
            build_frame_impl(const char *sentence, bool enable_nrzi, bool enable_input, const std::string &len_tag_key);
            ~build_frame_impl();

            void set_sentence(const char *sentence);

            // Where all the action really happens
            int work(
                int noutput_items,
                gr_vector_int &ninput_items,
                gr_vector_const_void_star &input_items,
                gr_vector_void_star &output_items);
        };

    } // namespace ais_simulator
} // namespace gr

#endif /* INCLUDED_AIS_SIMULATOR_BUILD_FRAME_IMPL_H */
