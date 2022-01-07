import React from 'react'

import _ from 'lodash'

export default class Rng extends React.Component {
    state = {
        tempMin: 1,
        tempMax: 50,
        min: undefined,
        max: undefined,
        value: undefined,
        rigged: false,
        sinceCount: undefined,
        buttonHasBeenPressed: false
    }

    constructor(props) {
        super(props)
        this.localStorage = window.localStorage
    }

    componentDidMount() {
        let sinceCount = parseInt(this.localStorage.getItem('sinceCount'))

        this.setState({
            min: this.state.tempMin,
            max: this.state.tempMax,
            sinceCount: sinceCount ? sinceCount : 0
        })
    }

    handleRigChange = (rig) => {
        this.setState({
            rigged: rig
        })
    }

    handleMinChange = (e) => {
        this.setState({
            tempMin: parseInt(e.target.value)
        })
    }

    handleMinBlur = () => {
        if(this.state.tempMin >= this.state.max) {
            this.setState({
                tempMin: this.state.min
            })
            return
        }

        this.setState({
            min: this.state.tempMin
        })
    }

    handleMaxChange = (e) => {
        this.setState({
            tempMax: parseInt(e.target.value)
        })
    }

    handleMaxBlur = () => {
        if(this.state.tempMax <= this.state.min) {
            this.setState({
                tempMax: this.state.max
            })
            return
        }

        this.setState({
            max: this.state.tempMax
        })
    }

    incrementSinceCount = () => {
        this.setState({
            sinceCount: this.state.sinceCount + 1
        })
        this.localStorage.setItem('sinceCount', this.state.sinceCount)
    }

    handleBtnClick = () => {
        let count = 0

        let timer = setInterval(() => {
            count++

            const {max, min} = this.state
            const random = Math.floor(Math.random() * (max - min + 1) + min)

            this.setState({
                value: random
            })

            if(count === 150) {
                clearInterval(timer)
                this.incrementSinceCount()
                if(!this.state.buttonHasBeenPressed) {
                    this.setState({
                        buttonHasBeenPressed: true
                    })
                }
            }
        }, 5)
    }
    
    handleBtnResetClick = () => {
        this.setState({
            sinceCount: 0
        })
        this.localStorage.setItem('sinceCount', 0)
    }

    render() {
        return (
            <div className="rng">
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header">
                                <h1 className="card-title text-center">🎲 Dice of Destiny 🎲</h1>
                            </div>
                            <div className="card-body">
                                { !!this.state.value &&
                                    <div className="text-center big-number">
                                        {this.state.value}
                                    </div>
                                }

                                <form className="form-inline justify-content-center">
                                    <div className="form-group mr-1">
                                        <label className="mr-1">Min:</label>
                                        <input type="number" className="form-control" value={this.state.tempMin} onChange={this.handleMinChange} onBlur={this.handleMinBlur} />
                                    </div>

                                    <div className="form-group">
                                        <label className="mr-1">Max:</label>
                                        <input type="number" className="form-control" value={this.state.tempMax} onChange={this.handleMaxChange} onBlur={this.handleMaxBlur} />
                                    </div>
                                </form>

                                <div className="text-center mt-1">
                                    <p>
                                        There have been {this.state.sinceCount} attempts since someone last won.&nbsp;
                                        { this.state.sinceCount !== 0 && 
                                            <span><a href="#" className="text-danger" onClick={this.handleBtnResetClick}>(Reset)</a></span>
                                        }
                                    </p>
                                </div>

                                <div className="text-center mt-1">
                                    <button className="btn btn-primary" onClick={this.handleBtnClick}>Roll the dice!</button>
                                </div>

                                <hr />

                                <div className="text-center mt-1">
                                    <p>The dice are currently: {this.state.rigged ? <span className="text-success">Rigged</span> : <span className="text-danger">Not Rigged</span>}</p>
                                    <button className="btn btn-sm btn-secondary mr-1" disabled={this.state.rigged} onClick={() => this.handleRigChange(true)}>Rig</button>
                                    <button className="btn btn-sm btn-secondary ml-1" disabled={!this.state.rigged} onClick={() => this.handleRigChange(false)}>Un-Rig</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}