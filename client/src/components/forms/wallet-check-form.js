import React, {Component} from 'react';
import ReCAPTCHA from "react-google-recaptcha";
import Popup from 'react-popup';
import MyContext from '../../context';
import Loader from '../loading-wheel';
import PriceTag from '../descriptions/price-tag';
import Shhhh from '../../.shhhh.js';
import Routing from '../../routing';
import StripeImg from '../../assets/stripe.png';
import XrpImg from '../../assets/ripple.png';
import AmexImg from '../../assets/amex.png';
import MasterCardImg from '../../assets/mastercard.png';
import VisaImg from '../../assets/visa.png';

class WalletCheckForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      walletPublicKey: null,
      formValid: false,
      captchaValid: false
    };
    this.submit = this.submit.bind(this);
    this.onFormChange = this.onFormChange.bind(this);
    this.onFormPaste = this.onFormPaste.bind(this); 
    this.morphBody = this.morphBody.bind(this);
    this.getWalletInfo = this.getWalletInfo.bind(this);
    this._reCaptchaRef = React.createRef();
  }

  //get info on whether wallet is active already or not
  async getWalletInfo(key) {
      let response = await fetch(`${Routing.domain}/walletInfo`, {
        method: "POST",
        headers: {"Content-Type": "text/plain"},
        body: key
      });
      if (response.ok) {
        return response.json()
      } else {
        Popup.alert("Issue communication with the Ripple API, please check your connection and try again");
      }
  }

  //set check wallet style according to hash validity
  onFormChange(e) {
    //document.getElementById("xrpCheck").input
    const check = e.match(/^r[1-9A-HJ-NP-Za-km-z]{25,34}$/);
    this.setState({formValid: (check !== null)? true : false, walletPublicKey: (check !== null)? e : null})
  }

  //wait a little bit for onpaste event as event timing is not
  onFormPaste() {
    new Promise(resolve => setTimeout(resolve, 100))
    .then(() => {
      //this.onFormChange()
      document.getElementById("xrpCheck").blur();
    })
  }

  //increase body size so keyboard on mobile doesn't cover form
  morphBody(e, newSize) {
    if (window.innerWidth < 425)
      document.body.style.height=`${newSize}vh`;
      if (newSize > 101)
        e.target.scrollIntoView({behavior: "smooth"});
  }

  async submit(ev) {
    ev.preventDefault()
    //check if forms are valid && this.state.captchaValid
    if (this.state.formValid && !this.context.state.fetchingPrice ) {
      //render the loader
      this.setState({isLoading: true})
      //get data from form
      const input = this.state.walletPublicKey;
      //get wallet info and alter state accordingly
      this.getWalletInfo(input).then(data => {
        if (data.data === 'alreadyActive') {
          this.setState({isLoading: false});
          Popup.alert(`Wallet public key "${input.substring(0, 8)}..." seems to already be active! Please enter the public key of an inactive wallet`, "Wallet Already Active");
        } else if (data.data === "actNotFound") {
          this.context.state.addPublicKeyToState(input);
          this.morphBody("e", 90)
          this.context.state.nextPage(true);
        }
      })
    } else {
      //display popup to user accordingly
      let message;
      if (this.state.walletPublicKey === null || !this.state.captchaValid) {
        if (this.context.state.fetchingPrice) {
          message = "Please wait for XRP price to load"
        } else {
          message = "Please check you've entered a public key and completed the Captcha"
        }
      } else if (!this.state.formValid) {
        message = "The Ripple Public key you entered doesn't seem quite right, please check your entry and try again. Make sure you're entering your public key, not private.";
      }
      Popup.alert(message, "Form Invalid");
    }
  }

  handleChange = value => {
    // if value is null recaptcha expired
    this.setState({captchaValid: (value === null)? false : true});
  };

  componentDidMount () {
    //if ripple address is set already, populate field via state
    if (this.context.state.xrpPublicKey !== null) {
      this.setState({walletPublicKey: this.context.state.xrpPublicKey}) 
      this.onFormChange(this.context.state.xrpPublicKey)
    }
  }

  render() {
    return (
      <React.Fragment>
        <div id="body">
          <h2>Instantly Receive 20 XRP</h2>
          <p>Pay with your credit card and receive the <a href="https://developers.ripple.com/reserves.html" rel="noopener noreferrer" target="_blank">required reserve amount</a> to activate your XRP wallet.</p>
          <div id="logos"><img alt="Ripple Logo" src={XrpImg}/><img alt="Visa Logo" src={VisaImg}/><img alt="Mastercard Logo" src={MasterCardImg}/><img alt="American Express Logo" src={AmexImg}/><img alt="Stripe Logo" src={StripeImg}/></div>
          <div className="fixHeight" id="walletForm">
            <PriceTag />
          </div>
        </div>
        <form onSubmit={this.submit} id="form">
        <input type="text" spellCheck="false" placeholder="enter public key" onFocus={(e) => this.morphBody(e, 130)} onBlur={(e) => this.morphBody(e, 90)} onChange={(e => this.onFormChange(e.target.value))} onPaste={(e => this.onFormPaste(e))} defaultValue={this.state.walletPublicKey} id='xrpCheck'></input>
        <input hidden="{true}" ></input>
          <ReCAPTCHA
            style={{ display:"inline-block" }}
            //theme="dark"
            ref={this._reCaptchaRef}
            sitekey={Shhhh.captchaToken}
            onChange={this.handleChange}
            asyncScriptOnLoad={this.asyncScriptOnLoad}
          />
          {(this.state.isLoading)? <Loader/> : <button className={(this.state.formValid && this.state.captchaValid)? 'full' : 'ghost'}>Activate Wallet</button>}
        <Popup />
        </form>
      </React.Fragment>
    )
  }
}

WalletCheckForm.contextType = MyContext

export default WalletCheckForm;