import React, {Component} from 'react';
import MyContext from '../../context';
import Loader from '../loading-wheel'
import Timer from '../countdown-timer';
import './index.css';

class Pricing extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: false
        };
    }

    render() {
        const t = this.context.state.pricing;
        if (this.context.state.fetchingPrice) {
            return (
                <Loader message="updating with current XRP price"/>
            )
        } else {
            return (
                <div id="invoice">
                    <div className="row">
                        <div>XRP cost <p id="small">({t.xrp.reserveAmount} x ${t.xrp.rate.toFixed(2)})</p></div>
                        <div>${t.xrp.total.toFixed(2)}</div>
                    </div>
                    <div className="row">
                        <div>WalletActication hosting <p id="small">(${t.other.total.toFixed(2)})</p></div>
                        <div>${t.other.total.toFixed(2)}</div>
                    </div>
                    <div className="row">
                        <div>Credit Card Fees <p id="small">(3.5% + $0.30)</p></div>
                        <div>${t.calc.stripeTotal.toFixed(2)}</div>
                    </div>
                    <div className="row">
                        <div>Tip</div>
                        <div>${t.calc.tip.toFixed(2)}</div>
                    </div>
                    <div className="row" id="last">
                        <div><b>Total (USD)</b></div>
                        <div><b>${t.calc.total.toFixed(2)}</b></div>
                    </div>
                    <Timer />
                </div>
            )
        }               
    }
}

//CLEAN UP
Pricing.contextType = MyContext

export default Pricing;

