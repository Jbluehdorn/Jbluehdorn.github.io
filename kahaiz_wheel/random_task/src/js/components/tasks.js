import React from 'react'
import { hiscores } from 'osrs-api'

export default class Tasks extends React.Component {
    state = {
        user: null,
        username: '',
        loading: false
    }

    handleUsernameChange = (e) => {
        this.setState({username: e.target.value})
    }

    handleClick = () => {
        this.setState({loading: true})

        hiscores.getPlayer({name: this.state.username})
            .then(data => {
                console.log(data)
            })
            .catch(e => {
                console.error(e)
            })
            .finally(() => {
                this.setState({loading: false})
            })
    }

    render() {
        return (
            <div className="tasks">
                <div className="row">
                    <div className="col-md-6 offset-md-3 col-12">
                        <div className="card">
                            <div className="card-header">
                                <h1 className="card-title">Random Tasks</h1>
                            </div>
                            <div className="card-body">
                                <div className="container">
                                    <div className="row">
                                        <div className="col-12">
                                            <div className="form-group">
                                                <input 
                                                    className="form-control" 
                                                    placeholder="Username" 
                                                    value={this.state.username}
                                                    onChange={this.handleUsernameChange}
                                                    type="text"></input>
                                            </div>
                                            
                                            <div className="form-group text-center">
                                                <button className="btn btn-primary" onClick={this.handleClick} disabled={this.state.loading}>
                                                    <span className="lead">Get a task!</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}