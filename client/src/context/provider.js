import React, { Component } from 'react';
import GoogleTagManager from '../components/google-tag-manager'
import MyContext from './index';
import Routing from '../routing';

class MyProvider extends Component {
    constructor(props) {
        super(props);
        //state defaults for display phase
        this.state = {
          seconds: null,
          xrpPublicKey: null,
          pricing: {calc: {tip: 0}},
          fetchingPrice: true,
          nextPage: this.nextPage,
          addPublicKeyToState: this.addPublicKeyToState,
          addTipToState: this.addTipToState,
          addOutcomeToState: this.addOutcomeToState,
          addXrpSentToState: this.addXrpSentToState,
          addReceiptURLToState: this.addReceiptURLToState,
          xrpSent: null,
          xrpChecked: null,
          xrpAmountSent: null,
          xrpTransactionHash: null,
          receiptURL: null
        };
        this.setXrpPrice = this.setXrpPrice.bind(this);
        this.nextPage = this.nextPage.bind(this);
        this.addPublicKeyToState = this.addPublicKeyToState.bind(this);
        this.addTipToState = this.addTipToState.bind(this);
        this.addOutcomeToState = this.addOutcomeToState.bind(this);
        this.addXrpSentToState = this.addXrpSentToState.bind(this); 
        this.addReceiptURLToState = this.addReceiptURLToState.bind(this);
    }

    //global function for chaning the display page phase (i.e. ripple form, or stripe form)
    nextPage = (forward) => {
        let page = (window.location.hash !== null)? (window.location.hash.replace("#", "")) * 1 : 0;
        forward ? page = page + 1 : page = page - 1 ;
        window.location.hash = page;
    }

    //global fundction to add pubkey to state from any context child
    addPublicKeyToState = (key) => {
        this.setState({xrpPublicKey: key})
    }

    //global function to add outcome of xrp payment to state from any context child
    addOutcomeToState = (paymentStatus, confirmed) => {
        this.setState({xrpSent: paymentStatus, xrpChecked: confirmed})
    }

    //global function to add outcome of xrp payment to state from any context child
    addXrpSentToState = (xrpAmount, xrpTransactionHash) => {
        this.setState({xrpAmountSent: xrpAmount, xrpTransactionHash: xrpTransactionHash})
    }

    //global function to add outcome of xrp payment to state from any context child
    addReceiptURLToState = (url) => {
        this.setState({receiptURL: url})
    }

    //global fundction to add pubkey to state from any context child
    addTipToState = (tip) => { 
        const t = this.state.pricing
        //calc fees from https://support.stripe.com/questions/charging-stripe-fees-to-customers
        const stripeTotal = ((t.other.total + t.xrp.total + tip + t.stripe.flatFee) / (1 - t.stripe.percentage)) - (t.other.total + t.xrp.total + tip);
        const total = t.xrp.total + t.other.total + stripeTotal + tip;
        const newCalc = {
            stripeTotal: stripeTotal,
            tip: tip,
            total: total
        }
        this.setState({pricing: {...this.state.pricing, calc: {...newCalc}}})
    }

    //set XRP price globally
    async setXrpPrice() {
        this.setState({fetchingPrice: true});
        //get price calc from server
        let response = await fetch(`${Routing.domain}/pricing`, {
          method: "POST",
          headers: {"Content-Type": "text/plain"}
        });
        if (response.ok) {
            //set state with retreived data
            response.json()
            .then(body => {
                const totalNoTip = (body.data.other.total + body.data.xrp.total + body.data.stripe.flatFee) /  (1 - body.data.stripe.percentage);
                //calc fees from https://support.stripe.com/questions/charging-stripe-fees-to-customers
                const stripeTotal = ((body.data.other.total + body.data.xrp.total + this.state.pricing.calc.tip + body.data.stripe.flatFee) / (1 - body.data.stripe.percentage)) - (body.data.other.total + body.data.xrp.total + this.state.pricing.calc.tip);
                const total = body.data.other.total + body.data.xrp.total + this.state.pricing.calc.tip + stripeTotal;
                const calc = {
                    stripeTotal: stripeTotal,
                    xrpTotal: body.data.xrp.total,
                    tip: this.state.pricing.calc.tip,
                    total: total,
                }
                this.setState({fetchingPrice: false, pricing: {...body.data, calc: calc, totalNoTip: totalNoTip}})
            })
        }
    }

    componentDidMount () {
        this.setXrpPrice().then(res => {
            //timer for XRP offer countdown
            this.setState({seconds: 60})
            var t = this;
            setInterval(function(){
                let cur = t.state.seconds - 1;
                //check the user hasn't finished activating their wallet (saving POST calls)
                if (!t.state.fetchingPrice){
                    if (cur > 0) {
                        t.setState({seconds: cur})
                    } else {
                        t.setXrpPrice();
                        t.setState({seconds: 60})
                    }
                }
            }, 1000);
        })
    }

    render() {
        return (
            <MyContext.Provider value={{state: this.state}}>
            <GoogleTagManager gtmId='GTM-545T4MX' additionalEvents={window.location.hash}/>
                {this.props.children}
            </MyContext.Provider>
        );
    }
}

export default MyProvider