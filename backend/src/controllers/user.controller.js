import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import httpStatus from 'http-status';
import bcrypt,{ hash } from 'bcrypt'
import crypto from 'crypto'


dotenv.config();

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL,process.env.REACT_APP_SUPABASE_ANON_KEY);

const login = async (req,res) => {
    const { username,password } = req.body;

    if(!username || !password) {
        return res.status(400).json({message: "Username and Password are required"});
    }
    try{
        const { data:user,error:fetchError} = await supabase
        .from('User')
        .select('username,password')
        .eq('username',username)
        .maybeSingle();

        console.log("Supabase Response:", user, "Error:", fetchError);

        if(fetchError || !user.username){
            return res.status(httpStatus.NOT_FOUND).json({message: "User not found. Please register first"});
        }

        const isPasswordValid = await bcrypt.compare(password,user.password);

        if(isPasswordValid){
            let token = crypto.randomBytes(20).toString('hex');

            user.token = token;

            const {data,error:updateError} = await supabase
            .from('User')
            .update({token: token})
            .eq('username',username);

            if(updateError) throw updateError;
            return res.status(httpStatus.OK).json({message:"Login successful", token: token});
        }
    }catch(e){
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: `Something went wrong: ${e.message}`});
    }
}

const register = async (req,res) => {
    const { name,username,password } = req.body;

    try{
        const {data:existingUser,error:fetchError} = await supabase
        .from('User')
        .select('username')
        .eq('username',username)
        .single();

        if(existingUser) {
            return 
            res.status(httpStatus.FOUND).json({message: "Username already exists"});
        }

        const hashedPassword = await bcrypt.hash(password,10);

        const {data,error:insertError} = await supabase
        .from('User')
        .insert([{ name: name, username: username, password: hashedPassword}]);

        if(insertError) throw insertError;

        return res.status(httpStatus.CREATED).json({message: "User registered successfully"});
    }catch(e){
        console.log("Error logic mein: ",e);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: e.message});
    }
}

export {login, register};