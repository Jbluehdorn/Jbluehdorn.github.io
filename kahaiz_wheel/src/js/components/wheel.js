import React from 'react'

import { countdown } from '../scenes/countdown'
import { spinImages } from '../scenes/spinImages'
import { showBossImage } from '../scenes/showBossImage'

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
        this.runStartAnimation(() => {
            this.runSpinAnimation(() => {
                this.runShowBossImageAnimation(() => {
                    this.setState({running: false})
                })
            })
        })
    }

    runStartAnimation = (cb) => {
        const canvas = this.canvasRef.current
        const audio = document.getElementById('countdown_audio')

        countdown(canvas, cb, {
            audio: audio
        })
    }

    runSpinAnimation = (cb) => {
        const canvas = this.canvasRef.current
        const imgArr = [...document.getElementById('bossImages').getElementsByTagName('img')]
        const audio = document.getElementById('spin_audio')

        spinImages(canvas, cb, {
            images: imgArr,
            audio: audio,
            imgSize: 50
        })
    }

    runShowBossImageAnimation = (cb) => {
        const canvas = this.canvasRef.current
        const boss = bossData[Math.floor(Math.random() * bossData.length)]
        const img = [...document.getElementById('bossImages').getElementsByTagName('img')].find(el => {
            return el.src.includes(boss.filename) 
        })
        const audio = document.getElementById('found_audio')

        showBossImage(canvas, cb, {
            image: img,
            name: boss.name,
            audio: audio
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