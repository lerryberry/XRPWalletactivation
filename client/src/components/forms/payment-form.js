import React, {Component} from 'react';
import {CardElement, injectStripe} from 'react-stripe-elements';
import Paypal from '../paypal';
import Popup from 'react-popup';
import MyContext from '../../context';
import Loader from '../loading-wheel';
import BackButton from '../buttons/back';
import PricingBreakdown from '../descriptions/pricing-breakdown'
import Routing from '../../routing';
import './index.css';

const createOptions = () => {
  return {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        letterSpacing: '0.025em',
        fontFamily: 'Nunito Sans, sans-serif',
        '::placeholder': {
          color: '#aab7c4',
        }
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };
};

class PaymentForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      formValid: false,
      isMakingPayment: false,
      isCheckingTransaction: false
    };
    this.submit = this.submit.bind(this); 
    this.stripeElementChange = this.stripeElementChange.bind(this);
    this.xrpTransactionCheck = this.xrpTransactionCheck.bind(this);
    this.morphBody = this.morphBody.bind(this);
  }

  xrpTransactionCheck(transactionHash) {
    //check XRP payment ever 5 seconds 6 times
    let attempts = 9;
    const t = this;
    var checks = setInterval(async function(){
      attempts = attempts - 1;
      if (attempts > 1) {
        //console.log("checking transaction");
        let response = await fetch(`${Routing.domain}/xrpTransactionCheck`, {
          method: "POST",
          headers: {"Content-Type": "text/plain"},
          body: transactionHash
        });
        //if the stripe payment req comes back successful
        if (response.ok) {
          response.json().then(body => {
            if (body.data.outcome.result === 'tesSUCCESS'){
              clearInterval(checks)
              //set success page details
              t.context.state.addOutcomeToState(true, true)
              t.context.state.nextPage(true)
            } else {
              clearInterval(checks)
              alert(body.data.outcome.result)
              //another state here for check and it failed
              t.context.state.addOutcomeToState(true, false)
              t.context.state.nextPage(true)
            }
          })
        } else {
          console.log(response)
        }
      } else {
        t.context.state.addOutcomeToState(true, false)
        clearInterval(checks)
        t.context.state.nextPage(true)
      }
    }, 5000);
  }

  async submit(ev) {
    //stop page reloading on form submit
    ev.preventDefault();
    //create stripe token
    let {token} = await this.props.stripe.createToken();
    //check user filled in forms by looking at token
    if (typeof token !== 'undefined') { 
      //form is ok then send stripe payment req to server
      this.setState({isLoading: true});
      let response = await fetch(`${Routing.domain}/charge`, {
        method: "POST",
        headers: {"Content-Type": "text/plain"},
        body: JSON.stringify({
          token: token.id,
          price: this.context.state.pricing.calc.total,
          publicKey: this.context.state.xrpPublicKey
        })
      });
      //if the stripe payment req comes back successful
      if (response.ok) {
        response.json().then(body => {
          this.context.state.addReceiptURLToState(body.data.receipt_url)
        })
        this.setState({isLoading:false, isMakingPayment: true});
        //action xrp payment
        let response2 = await fetch(`${Routing.domain}/xrpPayment`, {
          method: "POST",
          headers: {"Content-Type": "text/plain"},
          body: this.context.state.xrpPublicKey
        });
        if (response2.ok) {
          response2.json().then(body => {
            //if the xrp payment was actioned successfully
            if (body.data.submitted.engine_result_code === 0) {
              //check the transaction was successful and change UI accordingly
              this.context.state.addXrpSentToState(body.data.xrpAmount, body.data.transactionHash)
              this.setState({isMakingPayment:false, isCheckingTransaction:true})
              this.xrpTransactionCheck(body.data.transactionHash)
            } else {
              //tell the user it didn't go through
              alert(body.data.submitted.resultMessage)
              this.context.state.addOutcomeToState(false, false)
              this.context.state.nextPage(true)
            }
          })
        } else {
          this.setState({isLoading: false});
          Popup.alert("We're having trouble communicating with the WalletActivation.com server, please try again later.", "Something Went Wrong");
        }
      } else {
        this.setState({isLoading: false});
        Popup.alert("Unfortunately we couldn't charge your credit card, please try a different one", "Something Went Wrong");
      }
    } else {
      Popup.alert("There's something not quite right with your credit card details, please check them and try again", "Form Invalid");
    }
  }

  //change pay button according to stripe token validity
  stripeElementChange = (e) => {
    if (e.complete) {
      this.setState({formValid: true});
    } else {
      this.setState({formValid: false});
    }
  }

  //allow enough vertical view height for mobile users, so when field is in focus, 
  //the age can autoscroll and keyboard isn't in the way
  morphBody(e, newSize) {
    if (window.innerWidth < 425)
      document.body.style.height=`${newSize}vh`;
      if (newSize > 101)
        if (!this.state.isLoading)
          document.getElementsByClassName("StripeElement").scrollIntoView()
      else
        document.getElementById("app").scrollIntoView(true)
  }

  componentDidMount() {
    //scroll to top
    window.scrollTo(0, 0);
  }
  
  render() {
    if (this.state.isLoading) {
      return (<React.Fragment><div><Loader message="Processing Payment"/></div><div></div></React.Fragment>)
    } else if (this.state.isMakingPayment){
      return (<React.Fragment><div><Loader message="Sending XRP Payment"/></div><div></div></React.Fragment>)
    } else if (this.state.isCheckingTransaction){
      return (<React.Fragment><div><Loader message="Checking XRP Payment Status"/><p>This may take a minute, don't close the window</p></div><div></div></React.Fragment>)
    } else {
      return (
        <React.Fragment>
          <div id="body">
            <div id="hash"><p>{this.context.state.xrpPublicKey}</p></div>
            <div className="fixHeight" id="tipForm">
              <PricingBreakdown />
            </div>
          </div>
          <form onSubmit={this.submit} id="form">
          <h2>Enter your credit card details</h2>
           <Paypal/>
            <CardElement 
              {...createOptions()}
              onChange={(e) => this.stripeElementChange(e)}
              onFocus={(e) => this.morphBody(e, 130)} 
              onBlur={(e) => this.morphBody(e, 90)}
            />
            <div id="nav">
              <BackButton message="back to tips"/>
              <button className={this.state.formValid ? 'full' : 'ghost'}>Pay ${this.context.state.pricing.calc.total.toFixed(2)}</button>
            </div>
            <Popup />
          </form>
        </React.Fragment>
      );
    }
  }
}

PaymentForm.contextType = MyContext

export default injectStripe(PaymentForm);