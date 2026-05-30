import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Auth = (WrappedComponent) => {
    const AuthComponent = (props) => {
        const router = useNavigate();

        const isAuthenticated = () => {
            if(localStorage.getItem("token")) {
                return true;
            }
            return false;
        }

        useEffect(() => {
            if(!isAuthenticated()){
                router("/auth");
            }
        },[]);

        return <WrappedComponent {...props} />;
    }

    return AuthComponent;
}

export default Auth;