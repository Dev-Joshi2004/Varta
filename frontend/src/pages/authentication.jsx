import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MuiCard from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Avatar from '@mui/material/Avatar';
import { Form } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Snackbar from '@mui/material/Snackbar';
//import ForgotPassword from './ForgotPassword';
//import { GoogleIcon, FacebookIcon, SitemarkIcon } from './CustomIcons';

const Card = styled(MuiCard)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'center',
    width: '100%',
    padding: theme.spacing(4),
    gap: theme.spacing(2),
    boxShadow:
        'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
    [theme.breakpoints.up('sm')]: {
        width: '450px',
    },
    ...theme.applyStyles('dark', {
        boxShadow:
            'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
    }),
}));

export default function Authentication() {
    const [username, setUsername] = React.useState();
    const [password, setPassword] = React.useState();
    const [name, setName] = React.useState();
    const [formState, setFormState] = React.useState(0);
    const [message, setMessage] = React.useState();

    const [error, setError] = React.useState("");
    const [emailError, setEmailError] = React.useState(false);
    const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
    const [passwordError, setPasswordError] = React.useState(false);
    const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
    const [open, setOpen] = React.useState(false);
    const {handleRegister, handleLogin} =  React.useContext(AuthContext);

    const handleAuth = async () => {
        try{
            if(formState === 0){
                let res = await handleLogin(username,password);
                setMessage(res);
            }
            if(formState === 1){
                let res = await handleRegister(name,username,password);
                setMessage(res);
                setOpen(true);
                setError("");
                setFormState(0);
                setPassword("");
            }
        }catch(err){
            console.log(err.response.data.message);
            if(err.response && err.response.data){
                const errorMsg = err.response.data.message || "Something went wrong";
                setMessage(errorMsg);
                setError(errorMsg);
                setOpen(true);
            }
            else {
                setMessage("Server unreachable. Please try again later.");
                setOpen(true);
            }
        }
    }

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = (event,reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };

    const handleSubmit = (event) => {
        if (emailError || passwordError) {
            event.preventDefault();
            return;
        }
        const data = new FormData(event.currentTarget);
        console.log({
            email: data.get('email'),
            password: data.get('password'),
        });
    };

    const validateInputs = () => {
        const email = document.getElementById('email');
        const password = document.getElementById('password');

        let isValid = true;

        if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
            setEmailError(true);
            setEmailErrorMessage('Please enter a valid email address.');
            isValid = false;
        } else {
            setEmailError(false);
            setEmailErrorMessage('');
        }

        if (!password.value || password.value.length < 6) {
            setPasswordError(true);
            setPasswordErrorMessage('Password must be at least 6 characters long.');
            isValid = false;
        } else {
            setPasswordError(false);
            setPasswordErrorMessage('');
        }

        return isValid;
    };

    return (
        <div className='authenticationPageMainContainer'>

            <div className="authenticationPageImg">
                <img src="/heroImg.png" alt="" />
            </div>

            <div className="authenticationForm">
                <Card variant="outlined">
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2,
                        }}
                    >
                        <Avatar sx={{ m: 1, bgcolor: 'primary.main', alignSelf: 'center' }}>
                            <LockOutlinedIcon />
                        </Avatar>
                        <div>
                            <Button variant={formState === 0 ? "contained" : ""} onClick={() => { setFormState(0) }}>
                                Sign In
                            </Button>
                            <Button variant={formState === 1 ? "contained" : ""} onClick={() => { setFormState(1) }}>
                                Sign Up
                            </Button>
                        </div>
                    </Box>
                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        noValidate
                        sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}
                    >

                        {formState === 1 ?
                                <FormControl>
                                    <TextField
                                    error={emailError}
                                    helperText={emailErrorMessage}
                                    label = "Full Name"
                                    id="name"
                                    type="name"
                                    name="name"
                                    placeholder="John Doe"
                                    autoFocus
                                    required
                                    fullWidth
                                    variant="outlined"
                                    color={emailError ? 'error' : 'primary'}
                                    onChange={(e) => {setName(e.target.value)}}
                                />
                                </FormControl> : <></>
                            }
                        <FormControl>
                            <TextField
                                error={emailError}
                                helperText={emailErrorMessage}
                                id="email"
                                type="email"
                                name="username"
                                label="Username"
                                placeholder="johndoe@email.com"
                                autoFocus
                                required
                                fullWidth
                                variant="outlined"
                                color={emailError ? 'error' : 'primary'}
                                onChange={(e) => {setUsername(e.target.value)}}
                            />
                        </FormControl>
                        <FormControl>
                            
                            <TextField
                                error={passwordError}
                                helperText={passwordErrorMessage}
                                name="password"
                                placeholder="••••••"
                                type="password"
                                id="password"
                                label="Password"
                                autoFocus
                                required
                                fullWidth
                                variant="outlined"
                                color={passwordError ? 'error' : 'primary'}
                                onChange={(e)=>{setPassword(e.target.value)}}
                            />
                            <Box sx={{ my: 3, display: 'flex' , justifyContent: 'flex-end' }}>
                                <Link
                                    component="button"
                                    type="button"
                                    onClick={handleClickOpen}
                                    variant="body2"
                                    sx={{ alignSelf: 'baseline' }}
                                >
                                    Forgot your password?
                                </Link>
                            </Box>
                        </FormControl>
                        {/*<ForgotPassword open={open} handleClose={handleClose} />*/}
                        <Button fullWidth variant="contained" onClick={handleAuth}>
                            {formState === 0 ? "Sign In" : "Sign Up"}
                        </Button>
                    </Box>
                </Card>
                <Snackbar 
                    open={open}
                    autoHideDuration={4000}
                    message= {message}
                    onClose={handleClose}
                />
            </div>

        </div>
    );
}