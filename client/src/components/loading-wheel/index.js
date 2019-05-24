import React, {Component} from 'react';
import './index.css';

class Loader extends Component {
    constructor(props) {
        super(props);
        this.state = {
            message: this.props.message,
        };
    }
    render() {
        return (
            <React.Fragment>
                <div className="lds-ring" id="wheel">
                    <div></div>
                </div>
                <p id="loader">{this.props.message}</p>
            </React.Fragment>
        )
    }
}

export default Loader;