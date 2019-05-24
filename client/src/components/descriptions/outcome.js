import React, {Component} from 'react';
import MyContext from '../../context';
import Routing from '../../routing';
import { ReactComponent as ErrorTriangle } from '../../assets/error-triangle.svg'
import gif from '../../assets/success.gif';
import './index.css';

class Success extends Component {
    componentDidMount() {
        //post transaction summary to server for iphone slack notification about transaction
        const t = this.context.state
        const summary = {
            xrpPublicKey: t.xrpPublicKey,
            totalCharge: t.pricing.calc.total.toFixed(2),
            tip: t.pricing.calc.tip,
            xrpSent: t.xrpSent,
            xrpChecked: t.xrpChecked,
            xrpAmountSent: t.xrpAmountSent
        };
        fetch(`${Routing.domain}/notifyElliot`, {
            method: "POST",
            headers: {"Content-Type": "text/plain"},
            body: JSON.stringify(summary)
        });
    }

    render() {
        const t = this.context.state;
        const checkLedger = `https://developers.ripple.com/xrp-ledger-rpc-tool.html#${this.context.state.xrpPublicKey}`
        const checkTrans = `https://developers.ripple.com/xrp-ledger-rpc-tool.html#${this.context.state.xrpTransactionHash}`
        if (t.xrpSent && t.xrpChecked) {
            return (
                <React.Fragment>
                    <div id="body">
                        <div id="hash"><p>{t.xrpPublicKey}</p></div>
                        <h2>Successly Activated!</h2>
                        <img src={gif} alt="success gif" id="success"/>
                        <p>You can check for yourself with the XRP Ledger lookup (<a target="_blank" rel="noopener noreferrer" href={checkLedger}>check your ledger balance</a>
                        <br />and also <a target="_blank" rel="noopener noreferrer" href={checkTrans}>see the transaction</a>)</p>
                    </div>
                    <div id="form"><a className="button" rel="noopener noreferrer" href={t.receiptURL} target="_blank">Open Receipt</a></div>
                </React.Fragment>
            )
        } else if (t.xrpSent && !t.xrpChecked){
            return (
                <React.Fragment>
                    <div id="body">
                        <ErrorTriangle id="error"/>
                        <div id="hash"><p>{t.xrpPublicKey}</p></div>
                        <h2>XRP Sent but not confirmed</h2>
                        <p>The XRP network is slow to respond at the moment and we couldn't confirm the XRP transaction was successfully sent within the average 1 minute timeframe....</p>
                        <p>Either way, you can check for yourself with the XRP Ledger lookup (<a target="_blank" rel="noopener noreferrer" href={checkLedger}>check your ledger balance</a><br />and also <a target="_blank" rel="noopener noreferrer" href={checkTrans}>see the transaction</a>)</p>
                        <p>We have received a notifications of this and we'll re-attempt the XRP transaction or refund your credit card.</p>
                        <p>If the payment never comes through, please email us at</p>
                        <p><a target="_blank" rel="noopener noreferrer" href='mailto:elliot@walletinfo.com'>elliot@walletactivation.com</a></p>
                    </div>
                    <div id="form"></div>
                </React.Fragment>
            )
        } else {
            return (
                <React.Fragment>
                    <div id="body">
                        <ErrorTriangle id="error"/>
                        <div id="hash"><p>{t.xrpPublicKey}</p></div>
                        <h2>Could not be activated...</h2>
                        <p>At this stage we've collected the money from your credit card yet you haven't received the XRP. </p>
                        <p>Don't worry though, we've received a report on the matter and we'll investigate then attempt to make another xrp payment, if that fails again, we'll refund your credit card.</p>
                        <p>Either way it's a good idea to email us with your public key.</p>
                        <p><a target="_blank" rel="noopener noreferrer" href='mailto:elliot@walletinfo.com'>elliot@walletactivation.com</a></p>
                    </div>
                    <div id="form"></div>
                </React.Fragment>
            )
        }
    }
}

Success.contextType = MyContext

export default Success;

