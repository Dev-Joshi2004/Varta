import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext({});

const client = axios.create({
    baseURL: 'http://localhost:5000/api/v1/users'
})

export const AuthProvider = ({children}) => {
    const authContext = useContext(AuthContext);

    const [userData, setUserData] = useState(authContext);

    const router = useNavigate();

    const handleRegister = async (name,username,password) => {
        try {
            let req = await client.post('/register', {
                name: name,
                username: username,
                password: password
            })
            if(req.status === httpStatus.CREATED){
                return req.data.message;
            }
        }catch (err) {
            throw err;
        }
    }

    const handleLogin = async (username,password) => {
        try{
            let req = await client.post('/login',{
                username: username,
                password: password
            })
            if(req.status === httpStatus.OK){
                localStorage.setItem('token', req.data.token);
                router('/home');
            }
        }catch(err){
            throw err;
        }
    }

    const data = {
        userData, setUserData , handleRegister , handleLogin
    }

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    )
}