import React from 'react'

import { shuffle } from '../util/shuffle'
import { countdown } from '../scenes/countdown'
import { spinImages } from '../scenes/spinImages'
import { showBossImage } from '../scenes/showBossImage'

import bossData from '../json/bosses'

export default class Wheel extends React.Component {
    state = {
        running: false,
        vorkathEnabled: true,
        bosses: bossData
    }
    
    constructor(props) {
        super(props)
        this.canvasRef = React.createRef()
    }

    handleClick = () => {
        this.setState({running: true})
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
        audio.volume = 0.2

        countdown(canvas, cb, {
            fillStyle: '#6441A4',
            audio: audio
        })
    }

    runSpinAnimation = (cb) => {
        const canvas = this.canvasRef.current
        const imgArr = shuffle([...document.getElementById('bossImages').getElementsByTagName('img')].filter(img => {
            return this.state.bosses.find(boss => {
                return img.src.includes(boss.filename)
            })
        }))
        const audio = document.getElementById('spin_audio')
        audio.volume = 0.2

        spinImages(canvas, cb, {
            images: imgArr,
            audio: audio,
            imgSize: 50
        })
    }

    runShowBossImageAnimation = (cb) => {
        const canvas = this.canvasRef.current
        const boss = this.state.bosses[Math.floor(Math.random() * this.state.bosses.length)]
        const img = [...document.getElementById('bossImages').getElementsByTagName('img')].find(el => {
            return el.src.includes(boss.filename) 
        })
        const audio = document.getElementById('found_audio')
        audio.volume = 0.2

        showBossImage(canvas, cb, {
            image: img,
            name: boss.name,
            audio: audio,
            fillStyle: '#6441A4'
        })
    }

    handleVorkathCheck = (e) => {
        let filteredData = bossData.filter(boss => {
            return e.target.checked ? boss.name !== 'Vorkath' : true
        })
        this.setState({vorkathEnabled: !e.target.checked, bosses: filteredData})
    }

    render() {
        return (
            <div className="wheel">
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header">
                                <h1 className="card-title text-center">The Wheel of Kahaiz</h1>
                            </div>
                            <div className="card-body">
                                <canvas ref={this.canvasRef} id="board" height="400" width="700"></canvas>
                                
                                <div className="form-group text-center">
                                    <button className="btn btn-primary" onClick={this.handleClick} disabled={this.state.running}>
                                        <span className="lead">Spin!</span>
                                    </button>
                                </div>

                                <div className="form-group text-center">
                                    <input type="checkbox" className="form-check-input" onChange={this.handleVorkathCheck} />
                                    <label className="form-check-label">Disable Vorkath</label>
                                </div> 
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}