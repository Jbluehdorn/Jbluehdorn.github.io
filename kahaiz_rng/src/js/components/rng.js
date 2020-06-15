import React from 'react'

import _ from 'lodash'

export default class Rng extends React.Component {
    state = {
        tempMin: 1,
        tempMax: 1000,
        min: undefined,
        max: undefined,
        value: undefined
    }

    componentDidMount() {
        this.setState({
            min: this.state.tempMin,
            max: this.state.tempMax
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
            }
        }, 5)
    }

    render() {
        return (
            <div className="rng">
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header">
                                <h1 className="card-title text-center">Kahaiz Dice</h1>
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
                                    <button className="btn btn-primary" onClick={this.handleBtnClick}>Roll the dice!</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}