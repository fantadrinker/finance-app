import React from "react";
import styles from "./Login.module.css"

const Login = () => {
    return (<div className={styles.login}>
        <div className={styles.desc}>
            Welcome, this is an web application to organize your spending and helps 
            you with insights and trends on your spending.
        </div>
        <div className={styles.inst}>
            Please click "Log In" on the navigation bar to use functionality
        </div>
    </div>);
}

export default Login