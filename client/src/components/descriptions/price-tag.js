import React, {Component} from 'react';
import MyContext from '../../context';
import Loader from '../loading-wheel';
import Timer from '../countdown-timer'

class Price extends Component {
    render() {
        if (this.context.state.fetchingPrice){
            return <Loader message="Loading Ripple Price"/>
        } else {
            return (
                <React.Fragment>
                    <div className="tag">
                        <div>
                            {<h2>USD ${this.context.state.pricing.totalNoTip.toFixed(2)}</h2>}
                            <Timer />
                        </div>
                    </div>
                </React.Fragment>
            )
        }   
    }
}

Price.contextType = MyContext

export default Price;

