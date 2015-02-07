var React = require("react");
var Reflux = require("reflux");
var request = require("superagent");
var Link = require("react-router").Link;

var store = Reflux.createStore({
    data: {jokes: []},

    init(){
        request("http://api.icndb.com/jokes/random/5", res => {
            this.data.jokes = res.body.value;
            this.trigger(this.data);
        })
    },

    getInitialState:function(){
        return this.data;
    }
})

var DisplayName = React.createClass({
    mixins:[Reflux.connect(store)],
    render:function(){
        return (
            <div>
            {this.state.jokes.map(entry => {
                return (
                    <ul>
                        <li key={entry.id}>
                            {entry.joke}
                        </li>
                    </ul>
                )
            })}
                <p>Or try to switch to <Link to="home">Home page</Link>.</p>
            </div>
        )
    }

});

module.exports = DisplayName;
