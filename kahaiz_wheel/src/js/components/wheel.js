import React from 'react'

import { countdown } from '../scenes/countdown'
import { spinImages } from '../scenes/spinImages'

import bossData from '../json/bosses'

export default class Wheel extends React.Component {
    state = {
        running: false
    }
    
    constructor(props) {
        super(props)
        this.canvasRef = React.createRef()
    }

    handleClick = () => {
        // this.setState({running: true})
        this.spinTheWheel()
    }

    spinTheWheel = () => {
        // this.runStartAnimation(this.runSpinAnimation)
        this.runSpinAnimation(() => console.log('done!'))
    }

    runStartAnimation = (cb) => {
        const canvas = this.canvasRef.current

        countdown(canvas, cb)
    }

    runSpinAnimation = (cb) => {
        const canvas = this.canvasRef.current
        const imgArr = [...document.getElementById('bossImages').getElementsByTagName('img')]

        spinImages(canvas, () => {
            console.log('done!')
        }, {
            images: imgArr
        })
    }

    render() {
        return (
            <div className="wheel">
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header">
                                <h1 className="card-title">The Wheel of Kahaiz</h1>
                            </div>
                            <div className="card-body">
                                <canvas ref={this.canvasRef} id="board" height="400" width="700"></canvas>
                                
                                <div className="form-group text-center">
                                    <button className="btn btn-primary" onClick={this.handleClick} disabled={this.state.running}>
                                        <span className="lead">Spin!</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}