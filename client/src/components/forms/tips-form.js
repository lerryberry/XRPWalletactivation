import React, {Component} from 'react';
import MyContext from '../../context';
import BackButton from '../buttons/back'
import PriceTag from '../descriptions/price-tag';

class TipForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      formValid: false,
      tip: 0
    };
    this.submit = this.submit.bind(this);
    this.onFormChange = this.onFormChange.bind(this);
    this.morphBody = this.morphBody.bind(this);
  }

  //increase body size so keyboard on mobile doesn't cover form
  morphBody(e, newSize) {
    if (window.innerWidth < 425)
      document.body.style.height=`${newSize}vh`;
      if (newSize > 101)
        e.target.scrollIntoView({behavior: "smooth"});
  }

  //validate input
  onFormChange() {
    const input = (document.getElementById("tipField").value * 1);
    //add tip to element state for button rendering
    function val (num) {
      if (Number.isInteger(num)) {
        return num;
      } else {
        return (num).toFixed(2);
      }
    }
    this.setState({tip: val(input), formValid: (input === 0)? false : true})
  }

  submit(e) {
    //stop default as it's a SPA and it would reload the page
    e.preventDefault();
    //check if forms are valid
    const input = (document.getElementById("tipField").value * 1)
    if (input !== 0) {
      this.context.state.addTipToState(input);
    } else {
      //replace in context in case user returns and updates tip
      this.context.state.addTipToState(0);
    }
    //fix view height for mobile payment page 
    this.morphBody("e", 90)
    this.context.state.nextPage(true);
  }

  componentDidMount () {
    //scroll to top
    window.scrollTo(0, 0);
    //if tip is set already from context, populate field via state
    const tip = this.context.state.pricing.calc.tip
    if (tip !== 0) {
      this.setState({tip: tip})
      //run onformchange for button styling when returning from payment page
      this.onFormChange()
    }
  }

  render() {
    return (
      <React.Fragment>
        <div id="body">
          <div id="hash"><p>{this.context.state.xrpPublicKey}</p></div>
          <div className="fixHeight" id="walletForm">
            <PriceTag />
          </div>
          <h2>Feeling kind?</h2>
          <p>This low cost wallet activator was build out of fun and a love for crypto. If it made your life a little easier, then feel free to leave me a tip!</p>
          <p><span role="img" aria-label="relaxed">😊</span></p>
        </div>
        <form onSubmit={this.submit} id="form">
          <input min="0" max="50" step=".01" type="number" spellCheck="false" placeholder="tip amount ($)" onFocus={(e) => this.morphBody(e, 130)} onBlur={(e) => this.morphBody(e, 90)} onChange={this.onFormChange} defaultValue={(this.context.state.pricing.calc.tip !== 0)? `${this.context.state.pricing.calc.tip}` : `` } id='tipField'></input>
          <div id="nav">
            <BackButton message="back to wallet form"/>
            <button type="submit" className={this.state.formValid ? 'full' : 'ghost'}><div>Proceed with {(this.state.formValid)? `$${this.state.tip}` : `no` } Tip </div><div>&gt;</div></button>
          </div>
        </form>
      </React.Fragment>
    )
  }
}

TipForm.contextType = MyContext

export default TipForm;