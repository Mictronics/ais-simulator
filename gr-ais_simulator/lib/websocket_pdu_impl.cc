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

#ifdef HAVE_CONFIG_H
#include "config.h"
#endif

#include <gnuradio/io_signature.h>
#include <gnuradio/blocks/pdu.h>
#include "websocket_pdu_impl.h"

namespace gr
{
    namespace ais_simulator
    {

        /*
         * Get on correct executor.
         */
        void session::run()
        {
            // We need to be executing within a strand to perform async operations
            // on the I/O objects in this session. Although not strictly necessary
            // for single-threaded contexts, this code is written to be thread-safe
            // by default.
            net::dispatch(d_ws.get_executor(),
                          beast::bind_front_handler(
                              &session::on_run,
                              shared_from_this()));
        }

        /*
         * Close websocket.
         */
        void session::close()
        {
            if (d_ws.is_open())
            {
                d_ws.close(websocket::close_code::normal);
            }
        }

        /*
         * Start asynchronous operation.
         */
        void session::on_run()
        {
            // Set suggested timeout settings for the websocket
            d_ws.set_option(
                websocket::stream_base::timeout::suggested(
                    beast::role_type::server));

            // Set a decorator to change the Server of the handshake
            d_ws.set_option(websocket::stream_base::decorator(
                [](websocket::response_type &res) {
                    res.set(http::field::server, "ais-websocket-server");
                }));
            // Accept the websocket handshake
            d_ws.async_accept(
                beast::bind_front_handler(
                    &session::on_accept,
                    shared_from_this()));
        }

        /*
         * Accepted connection handler.
         */
        void session::on_accept(beast::error_code ec)
        {
            if (ec)
            {
                std::cerr << "accept: " << ec.message() << "\n";
                return;
            }
            // Read a message
            read();
        }

        /*
         * Setup asynchronous read.
         */
        void session::read()
        {
            // Read a message into our buffer
            d_ws.async_read(
                d_buffer,
                beast::bind_front_handler(
                    &session::on_read,
                    shared_from_this()));
        }

        /*
         * Asynchronous read handler.
         */
        void session::on_read(beast::error_code ec, std::size_t bytes_transferred)
        {
            // This indicates that the session was closed
            if (ec == websocket::error::closed)
            {
                return;
            }

            if (ec)
            {
                std::cerr << "read: " << ec.message() << "\n";
                return;
            }
            // Send websocket data via PDU message, clear buffer and read new data.
            d_wsi->set_string_msg(beast::buffers_to_string(d_buffer.data()), bytes_transferred);
            d_buffer.consume(d_buffer.size());
            read();
        }

        /*
         * Asynchronous write handler.
         */
        void session::on_write(beast::error_code ec, std::size_t bytes_transferred)
        {
            boost::ignore_unused(bytes_transferred);

            if (ec)
            {
                std::cerr << "write: " << ec.message() << "\n";
            }

            // Clear the buffer
            d_buffer.consume(d_buffer.size());

            // Do another read
            read();
        }

        listener::listener(net::io_context &ioc, tcp::endpoint endpoint, websocket_pdu_impl *wsi) : d_ioc(ioc), d_acceptor(ioc), d_wsi{wsi}
        {
            beast::error_code ec;

            // Open the acceptor
            d_acceptor.open(endpoint.protocol(), ec);
            if (ec)
            {
                std::cerr << "open: " << ec.message() << "\n";
                return;
            }

            // Allow address reuse
            d_acceptor.set_option(net::socket_base::reuse_address(true), ec);
            if (ec)
            {
                std::cerr << "set_option: " << ec.message() << "\n";
                return;
            }

            // Bind to the server address
            d_acceptor.bind(endpoint, ec);
            if (ec)
            {
                std::cerr << "bind: " << ec.message() << "\n";
                return;
            }

            // Start listening for connections
            d_acceptor.listen(net::socket_base::max_listen_connections, ec);
            if (ec)
            {
                std::cerr << "listen: " << ec.message() << "\n";
                return;
            }
        }

        /*
         * Start accepting incoming connections.
         */
        void listener::run()
        {
            accept();
        }

        /*
         * Setup asynchronous accept handler.
         */
        void listener::accept()
        {
            // The new connection gets its own strand
            d_acceptor.async_accept(
                net::make_strand(d_ioc),
                beast::bind_front_handler(
                    &listener::on_accept,
                    shared_from_this()));
        }

        /*
         * Asynchronous accept handler.
         */
        void listener::on_accept(beast::error_code ec, tcp::socket socket)
        {
            // Close an already existing session.
            // We accept only one client connection.
            if (d_session != nullptr)
            {
                d_session->close();
            }

            if (ec)
            {
                std::cerr << "accept: " << ec.message() << "\n";
            }
            else
            {
                // Create the session and run it
                d_session = std::make_shared<session>(std::move(socket), d_wsi);
                d_session->run();
            }

            // Accept new connection
            accept();
        }

        websocket_pdu::sptr
        websocket_pdu::make(std::string addr, std::string port)
        {
            return gnuradio::get_initial_sptr(new websocket_pdu_impl(addr, port));
        }

        /*
         * The private constructor
         */
        websocket_pdu_impl::websocket_pdu_impl(std::string addr, std::string port)
            : gr::block("websocket_pdu",
                        gr::io_signature::make(0, 0, 0),
                        gr::io_signature::make(0, 0, 0)),
              d_out_port(pmt::mp("out"))
        {
            message_port_register_in(pmt::mp("in"));
            message_port_register_out(d_out_port);
            set_msg_handler(pmt::mp("in"), [this](pmt::pmt_t msg) { this->set_msg(msg); });

            const unsigned short port_ = static_cast<unsigned short>(std::atoi(port.c_str()));
            tcp::endpoint tcp_ep;
            if (addr.empty() || addr == "0.0.0.0")
            { // Bind on all interfaces
                if (port_ == 0)
                {
                    throw std::invalid_argument(
                        "websocked_pdu: Invalid port for websocket server");
                }
                tcp_ep = tcp::endpoint(tcp::v4(), port_);
            }
            else
            {
                tcp::tcp::resolver resolver(d_ioc);
                tcp::tcp::resolver::query query(tcp::v4(), addr, port, net::ip::resolver_query_base::passive);
                tcp_ep = *resolver.resolve(query);
            }

            // Create and launch a listening port
            std::make_shared<listener>(d_ioc, tcp_ep, this)->run();
            // Run the I/O service on thread
            d_thread = gr::thread::thread(boost::bind(&websocket_pdu_impl::ioc_run, this));
            d_started = true;
        }

        /*
         * Our virtual destructor.
         */
        websocket_pdu_impl::~websocket_pdu_impl()
        {
        }

        /*
         * Stop websocket server thread when block stops.
         */
        bool websocket_pdu_impl::stop()
        {
            if (d_started)
            {
                d_ioc.stop();
                d_thread.interrupt();
                d_thread.join();
            }
            d_started = false;
            return true;
        }

        /*
         * Set internal message from PDU IN port and send.
         */
        void websocket_pdu_impl::set_msg(pmt::pmt_t msg)
        {
            std::string s = pmt::symbol_to_string(msg);
            set_string_msg(s, s.length());
        }

        /*
         * Create and send PDU message from websocket string.
         */
        void websocket_pdu_impl::set_string_msg(std::string s, std::size_t l)
        {
            d_msg_buffer.resize(l);
            memcpy(&d_msg_buffer[0], s.c_str(), l);
            // Store sentence as vector data
            pmt::pmt_t v = pmt::init_u8vector(l, (const uint8_t *)&d_msg_buffer[0]);
            // Store length of sentence in message meta data
            // This propagated via tag in tagged stream.
            pmt::pmt_t d = pmt::make_dict();
            d = pmt::dict_add(d, pmt::string_to_symbol("length"), pmt::from_long(l));
            // Combine meta and vector data
            d_msg = pmt::cons(d, v);
            // Send message
            message_port_pub(d_out_port, d_msg);
        }

    } /* namespace ais_simulator */
} /* namespace gr */
