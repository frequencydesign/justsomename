var React = require("react");
var Reflux = require("reflux");
var request = require("superagent");
var Link = require("react-router").Link;

var store = Reflux.createStore({
    data: {charts: []},

    init(){
        request("http://192.168.0.3/api/user/1/chart", res => {
            this.data.charts = res.body;
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
            {this.state.charts.map(entry => {
                return (
                    <div>
                        {entry.label}
                    </div>
                )
            })}
                <p>Or try to switch to <Link to="home">Home page</Link>.</p>
            </div>
        )
    }

});

module.exports = DisplayName;
