import React from 'react'

import { shuffle } from '../util/shuffle'
import { countdown } from '../scenes/countdown'
import { spinImages } from '../scenes/spinImages'
import { showBossImage } from '../scenes/showBossImage'

import bossData from '../json/bosses'

export default class Wheel extends React.Component {
    state = {
        running: false,
        bosses: bossData.map(boss => {
            return {...boss, enabled: true}
        }),
        opsModalShown: false
    }

    constructor(props) {
        super(props)
        this.canvasRef = React.createRef()
        this.localStorage = window.localStorage
    }

    componentDidMount() {
        this.loadBossData()
    }

    componentDidUpdate(prevProps, prevState) {
        if(prevState.bosses !== this.state.bosses) {
            this.saveBossData()
        }
    }

    get filteredBosses() {
        return this.state.bosses.filter(boss => boss.enabled)
    }

    loadBossData = () => {
        const bossDataString = this.localStorage.getItem('bossData')

        if(!!bossDataString && bossDataString !== 'undefined') {
            const bossData = JSON.parse(bossDataString)
            this.setState({
                bosses: this.state.bosses.map(boss => {
                    const foundBoss = bossData.find(dataBoss => {
                        return dataBoss.name === boss.name
                    })

                    return foundBoss ? foundBoss : boss
                })
            })
        }
    }

    saveBossData = () => {
        this.localStorage.setItem('bossData', JSON.stringify(this.state.bosses))
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
            audio: audio,
            font: '75px runescape-bold'
        })
    }

    runSpinAnimation = (cb) => {
        const canvas = this.canvasRef.current
        const imgArr = shuffle([...document.getElementById('bossImages').getElementsByTagName('img')].filter(img => {
            return this.filteredBosses.find(boss => {
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
        const boss = this.filteredBosses[Math.floor(Math.random() * this.filteredBosses.length)]
        const img = [...document.getElementById('bossImages').getElementsByTagName('img')].find(el => {
            return el.src.includes(boss.filename) 
        })
        const audio = document.getElementById('found_audio')
        audio.volume = 0.2

        showBossImage(canvas, cb, {
            image: img,
            name: boss.name,
            audio: audio,
            fillStyle: '#6441A4',
            font: '75px runescape-bold'
        })
    }

    handleToggleBoss = (e, boss) => {
        this.setState({
            bosses: this.state.bosses.map(el => {
                if(el.name === boss.name) {
                    el.enabled = e.target.checked
                }

                return el
            })
        })
    }

    handleOpenModal = () => {
        this.setState({
            opsModalShown: true
        })
    }

    handleCloseModal = () => {
        this.setState({
            opsModalShown: false
        })
    }

    renderBody = () => {
        return ( 
            <div className="wheel">
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header">
                                <h1 className="card-title text-center">🎄 The King's Wheel of Merriment 🎄</h1>
                            </div>
                            <div className="card-body">
                                <canvas ref={this.canvasRef} id="board" height="400" width="700"></canvas>
                                
                                <div className="form-group text-center">
                                    <button className="btn btn-primary" onClick={this.handleClick} disabled={this.state.running}>
                                        <span className="lead">Spin!</span>
                                    </button>
                                </div>

                                <div className="form-group text-center">
                                    <button className="btn btn-secondary" onClick={this.handleOpenModal}>
                                        Config
                                    </button>
                                </div>
                                
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    renderOptionsModal = () => {
        return (
            <div className="modal" tabIndex="-1" style={{ display: this.state.opsModalShown ? 'block' : 'none' }}>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                Options
                            </h5>
                        </div>

                        <div className="modal-body">
                            <div className="container-fluid"> 
                                <div className="row">
                                    {this.state.bosses.map((boss, index) => {
                                        return (
                                            <div className="col-6 custom-control custom-switch" key={index}>
                                                <input type="checkbox" className="custom-control-input" id={`${index}`} checked={boss.enabled} onChange={(e) => this.handleToggleBoss(e, boss)} />
                                                <label className="custom-control-label" htmlFor={`${index}`}>{boss.name}</label>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <br />

                            <button className="btn btn-primary btn-block" onClick={this.handleCloseModal}>Close</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    render() {
        return (
            <>
                { this.renderBody() }
                { this.renderOptionsModal() }
            </>
        )
    }
}