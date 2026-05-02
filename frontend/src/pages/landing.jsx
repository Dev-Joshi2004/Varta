import React from "react";
import "../App.css";
import { Link } from "react-router-dom";

export default function Landing() {
    return (
        <div className="landingPageContainer">
            <nav>
                <div className="navHeader">
                    <h2>Varta</h2>
                </div>
                <li className="navItem">
                    <a href="/home">Join as Guest</a>
                    <a href="/register">Register</a>
                    <a href="/login">Login</a>
                </li>
            </nav>

            <div className="landingPageMainContainer">
                <div className="mainContainerText">
                    <h1><span style={{color: "#3995ff"}}>Connect</span> with your loved ones</h1>
                    <p>Cover a distance by Varta</p>
                    <div role='button'>
                        <Link to={"/auth"}>Get Started</Link>
                    </div>
                </div>
                <div className="mainContainerImg">
                    <img src="/heroImg.png" alt="" />
                </div>
            </div>
        </div>
    );
}