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

#ifndef INCLUDED_AIS_SIMULATOR_WEBSOCKET_PDU_IMPL_H
#define INCLUDED_AIS_SIMULATOR_WEBSOCKET_PDU_IMPL_H

#include <boost/beast/core.hpp>
#include <boost/beast/websocket.hpp>
#include <boost/asio/dispatch.hpp>
#include <boost/asio/strand.hpp>
#include <thread>
#include <vector>

#include <ais_simulator/websocket_pdu.h>

namespace beast = boost::beast;         // From <boost/beast.hpp>
namespace http = beast::http;           // From <boost/beast/http.hpp>
namespace websocket = beast::websocket; // From <boost/websocket.hpp>
namespace net = boost::asio;            // From <boost/asio.hpp>
using tcp = boost::asio::ip::tcp;       // From <boost/asio/ip/tcp.hpp>

namespace gr
{
    namespace ais_simulator
    {

        class websocket_pdu_impl : public websocket_pdu
        {
        private:
            std::vector<uint8_t> d_msg_buffer;
            pmt::pmt_t d_msg;
            const pmt::pmt_t d_out_port;
            gr::thread::thread d_thread;
            bool d_started;
            // The io_context is required for all I/O
            net::io_context d_ioc{1};
            void ioc_run() { d_ioc.run(); };

        public:
            websocket_pdu_impl(std::string addr, std::string port);
            ~websocket_pdu_impl();
            void set_msg(pmt::pmt_t msg);
            pmt::pmt_t msg() const { return d_msg; }
            void set_string_msg(std::string s, std::size_t l);
            bool stop();
        };

        class session : public std::enable_shared_from_this<session>
        {
        private:
            websocket::stream<beast::tcp_stream> d_ws;
            beast::flat_buffer d_buffer;
            websocket_pdu_impl *d_wsi;

        public:
            explicit session(tcp::socket &&socket, websocket_pdu_impl *wsi) : d_ws(std::move(socket)), d_wsi{wsi} {}
            void run();
            void close();
            void on_run();
            void on_accept(beast::error_code ec);
            void read();
            void on_read(beast::error_code ec, std::size_t bytes_transferred);
            void on_write(beast::error_code ec, std::size_t bytes_transferred);
        };

        class listener : public std::enable_shared_from_this<listener>
        {
        private:
            net::io_context &d_ioc;
            tcp::acceptor d_acceptor;
            websocket_pdu_impl *d_wsi;
            std::shared_ptr<gr::ais_simulator::session> d_session = nullptr;
            void accept();
            void on_accept(beast::error_code ec, tcp::socket socket);

        public:
            listener(net::io_context &ioc, tcp::endpoint endpoint, websocket_pdu_impl *wsi);
            void run();
        };

    } // namespace ais_simulator
} // namespace gr

#endif /* INCLUDED_AIS_SIMULATOR_WEBSOCKET_PDU_IMPL_H */
