/* -*- c++ -*- */
/*
 * Copyright 2020 Michael Wolf, Mictronics.
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

#ifndef INCLUDED_AIS_SIMULATOR_BITSTRING_TO_FRAME_H
#define INCLUDED_AIS_SIMULATOR_BITSTRING_TO_FRAME_H

#include <gnuradio/ais_simulator/api.h>
#include <gnuradio/tagged_stream_block.h>

namespace gr {
  namespace ais_simulator {

    /*!
     * \brief <+description of block+>
     * \ingroup ais_simulator
     *
     */
    class AIS_SIMULATOR_API bitstring_to_frame : virtual public gr::tagged_stream_block
    {
     public:
      typedef std::shared_ptr<bitstring_to_frame> sptr;

      /*!
       * \brief Return a shared_ptr to a new instance of ais_simulator::bitstring_to_frame.
       *
       * To avoid accidental use of raw pointers, ais_simulator::bitstring_to_frame's
       * constructor is in a private implementation
       * class. ais_simulator::bitstring_to_frame::make is the public interface for
       * creating new instances.
       */
      static sptr make(bool enable_nrzi, const std::string &len_tag_key);
    };

  } // namespace ais_simulator
} // namespace gr

#endif /* INCLUDED_AIS_SIMULATOR_BITSTRING_TO_FRAME_H */

