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

        // Get on the correct executor
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

        void session::close()
        {
            if (d_ws.is_open())
            {
                d_ws.close(websocket::close_code::normal);
            }
        }

        // Start the asynchronous operation
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

        void session::on_accept(beast::error_code ec)
        {
            if (ec)
            {
                std::cerr << "accept: " << ec.message() << "\n";
                return;
            }
            // Read a message
            do_read();
        }

        void session::do_read()
        {
            // Read a message into our buffer
            d_ws.async_read(
                d_buffer,
                beast::bind_front_handler(
                    &session::on_read,
                    shared_from_this()));
        }

        void session::on_read(beast::error_code ec, std::size_t bytes_transferred)
        {
            boost::ignore_unused(bytes_transferred);

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

            std::cout << "msg: " << beast::buffers_to_string(d_buffer.data()) << "\n";
            // Echo the message
            /*
            d_ws.text(d_ws.got_text());
            d_ws.async_write(
                d_buffer.data(),
                beast::bind_front_handler(
                    &session::on_write,
                    shared_from_this()));
            */
        }

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
            do_read();
        }

        listener::listener(net::io_context &ioc, tcp::endpoint endpoint) : d_ioc(ioc), d_acceptor(ioc)
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

        // Start accepting incoming connections
        void listener::run()
        {
            do_accept();
        }

        void listener::do_accept()
        {
            // The new connection gets its own strand
            d_acceptor.async_accept(
                net::make_strand(d_ioc),
                beast::bind_front_handler(
                    &listener::on_accept,
                    shared_from_this()));
        }

        void listener::on_accept(beast::error_code ec, tcp::socket socket)
        {
            // Close an already existing session
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
                d_session = std::make_shared<session>(std::move(socket));
                d_session->run();
            }

            // Accept new connection
            do_accept();
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

            auto const port_ = static_cast<unsigned short>(std::atoi(port.c_str()));
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

            beast::error_code ec;
            net::ip::address addr_ = net::ip::make_address(addr, ec);
            // Try to make address to bind on.
            // Bind on all in case of error.
            if (ec)
            {
                std::cerr << "addr: " << ec.message() << "\n";
                addr_ = net::ip::make_address("0.0.0.0", ec);
            }

            // Create and launch a listening port
            std::make_shared<listener>(d_ioc, tcp_ep)->run();
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

    } /* namespace ais_simulator */
} /* namespace gr */
