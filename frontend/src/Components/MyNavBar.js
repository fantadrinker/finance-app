import React from "react";
import { Link } from "react-router-dom";
import Nav from 'react-bootstrap/Nav';
import Navbar from "react-bootstrap/Navbar"
import NavDropdown from 'react-bootstrap/NavDropdown';
import Container from 'react-bootstrap/Container';

import { useAuth0 } from "@auth0/auth0-react";

const MyNavBar = ({ message }) => {
    const {
        user,
        isAuthenticated,
        loginWithRedirect,
        logout,
    } = useAuth0();

    const logoutWithRedirect = () =>
        logout({
            logoutParams: {
            returnTo: window.location.origin,
            }
        });

    return (
        <Navbar bg="light" expand="lg">
            {
                message &&  
                <li>{message}</li>
            }
            <Container>
                <Navbar.Brand>Finance Calculator</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto" style={{alignItems: "center"}}>
                        {!isAuthenticated && <Nav.Item><Nav.Link onClick={loginWithRedirect}>Log in</Nav.Link></Nav.Item>}
                        {isAuthenticated && (
                            <>
                                <Nav.Item><Link to="/">Home</Link></Nav.Item>
                                <Nav.Item>
                                    <NavDropdown title={user.name} id="basic-nav-dropdown">
                                        <NavDropdown.Item onClick={logoutWithRedirect}>Logout</NavDropdown.Item>
                                    </NavDropdown>
                                </Nav.Item>
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    )
}

export default MyNavBar