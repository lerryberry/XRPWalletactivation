import React, { Component } from 'react';
import {Elements, StripeProvider} from 'react-stripe-elements';
import { ReactComponent as MyIcon } from '../../src/assets/logo.svg'
import FacebookLogo from '../assets/facebook-logo.png';
import LinkedinLogo from '../assets/linkedin-logo.png';
import WalletCheckForm from '../components/forms/wallet-check-form';
import PaymentForm from '../components/forms/payment-form';
import MyContext from '../context';
import MyProvider from '../context/provider'
import TipForm from '../components/forms/tips-form'
import Outcome from '../components/descriptions/outcome'
import Loader from '../components/loading-wheel'
import Shhhh from '../.shhhh.js';
import './index.css';

class App extends Component {
    constructor(props) {
        super(props)
        this.state = {
            isLoading: true
        }
    }

    //remove initial loading wheel once component is mounted
    componentDidMount() {
        document.body.onload = () => {
            this.setState({isLoading: false})
        }
    }

    render() {
        if (this.state.isLoading) {
            return <Loader />
        } else {
            return (
                <MyProvider>
                    <div id="wrapper">
                        <div id="head">
                            <MyIcon id="logo"/>
                            <h1>Ripple Wallet Activation</h1>
                        </div>
                        <MyContext.Consumer>
                            {context => {
                                //page phase controller
                                let page = (window.location.hash !== null)? (window.location.hash.replace("#", "")) * 1 : 0;
                                if (page === null || page === 0 || context.state.xrpPublicKey === null) {
                                    window.location.hash = "";
                                    return <WalletCheckForm />
                                } else if (page === 1) {
                                    window.location.hash = 1;
                                    return <TipForm />
                                } else if (page === 2 && context.state.xrpSent === null) {
                                    window.location.hash = 2;
                                    return (
                                        <StripeProvider apiKey={Shhhh.stripeKey}>
                                            <Elements>
                                                <PaymentForm />
                                            </Elements>
                                        </StripeProvider>
                                    )
                                } else if (context.state.xrpPublicKey !== null) {
                                    window.location.hash = 3;
                                    return <Outcome /> 
                                } else {
                                    window.location.hash = 4;
                                    return <React.Fragment><div><h1>Oops! This page doesn't exist...</h1><p>in the middle of something? email me on <a target="_blank" rel="noopener noreferrer" href="elliot@walletactivation.com">elliot@walletactivation.com</a></p><p>Wanna head home?<a href="/">click here</a></p></div><div></div></React.Fragment>
                                }
                            }}
                        </MyContext.Consumer>
                    </div>
                    <p><a rel="noopener noreferrer" target="_blank" href="https://www.linkedin.com/in/elliot-chapple-60560382/"><img class="socials" src={LinkedinLogo} alt="Linkedin Logo" /></a>  <a rel="noopener noreferrer" target="_blank" href="https://www.facebook.com/walletactivation/"><img class="socials" src={FacebookLogo} alt="Facebook Logo" /></a> </p>
                </MyProvider>
            );
        }
    }
}

App.contextType = MyContext

export default App;