import React, {Component} from 'react';
import MyContext from '../../context';

class BackButton extends Component {
    constructor(props) {
        super(props);
        this.backClick = this.backClick.bind(this);
    }

    backClick(e) {
        e.preventDefault();
        this.context.state.nextPage(false);
    }

    render() {
        return (
            <button type="button" className="ghost" id="back" onClick={this.backClick} href='#'><div>&lt;</div><div>{this.props.message}</div></button>
        )
    }
}

BackButton.contextType = MyContext

export default BackButton;