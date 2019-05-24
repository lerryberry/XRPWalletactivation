import React, {Component} from 'react';
import MyContext from '../../context';

class Timer extends Component {    
    render() {
        return (
            <React.Fragment>
                {!this.context.state.fetchingPrice && <p id="countdown">updating in {this.context.state.seconds}s</p>}
            </React.Fragment>
        )
    }
}

Timer.contextType = MyContext

export default Timer;

