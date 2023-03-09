import React from "react";
import { Link } from "react-router-dom";

import { useAuth0 } from "@auth0/auth0-react";
import LoginButton from "./LoginAuth0";
import LogoutButton from "./LogoutAuth0";

const NavBar = ({ message }) => {
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
        <ul>
            {
                message &&  
                <li>{message}</li>
            }
            <li>
                <Link to="/">Home</Link>
                
            </li>
            {!isAuthenticated && (
                <li>
                  <LoginButton
                    id="qsLoginBtn"
                    color="primary"
                    className="btn-margin"
                    onClick={() => loginWithRedirect()}
                  >
                    Log in
                  </LoginButton>
                </li>
              )}
              {isAuthenticated && (
                <>
                    <li>
                        Hello, {user.name}
                    </li>
                    <li>
                        <LogoutButton onClick={() => logoutWithRedirect()}>
                            Logout
                        </LogoutButton>
                    </li>
                </>
                
              )}
        </ul>
    )
}

export default NavBar