import React from 'react'

import { shuffle } from '../util/shuffle'
import { countdown } from '../scenes/countdown'
import { spinImages } from '../scenes/spinImages'
import { showBossImage } from '../scenes/showBossImage'

import bossData from '../json/bosses'
import skillData from '../json/skills'

const WheelType = Object.freeze({
    BOSS: "BOSS",
    SOTW: "SOTW",
    BOTW: "BOTW"
})

const Holiday = Object.freeze({
    BIRTHDAY: 'BIRTHDAY',
    HALLOWEEN: 'HALLOWEEN',
    CHRISTMAS: 'CHRISTMAS',
    THANKSGIVING: 'THANKSGIVING',
    INDEPENDENCEDAY: 'INDEPENDENCEDAY',
    SAINTPATRICKS: 'STPATRICKS',
    EASTER: 'EASTER',
    VALENTINES: 'VALENTINES',
    NONE: 'NONE'
})


export default class Wheel extends React.Component {
    state = {
        running: false,
        bosses: [],
        opsModalShown: false,
        wheelType: WheelType.BOSS,
        filterTerm: ''
    }

    constructor(props) {
        super(props)
        this.canvasRef = React.createRef()
        this.localStorage = window.localStorage
    }

    componentDidMount() {
        this.loadWheelInfo()
    }

    componentDidUpdate(prevProps, prevState) {
        if(prevState.bosses !== this.state.bosses) {
            this.saveBossData()
        }

        if(prevState.wheelType !== this.state.wheelType) {
            this.loadWheelInfo()
        }
    }

    get enabledBosses() {
        return this.state.bosses.filter(boss => boss.enabled)
    }

    get sortedBosses() {
        return this.state.bosses
                .sort((a, b) => a.name.localeCompare(b.name))
                .filter(boss => boss.name.toLowerCase().includes(this.state.filterTerm.toLowerCase()))
    }

    get title() {
        let titleString = ''
        let currentFlairs = this.currentTitleFlairs

        switch (this.state.wheelType) {
            case WheelType.BOSS:
                titleString = this.currentBossWheelName
                break
            case WheelType.BOTW:
                titleString = "Boss of the Week"
                break
            case WheelType.SOTW:
                titleString = "Skill of the Week"
                break
        }

        
        return `${currentFlairs[0]} ${titleString} ${currentFlairs[1]}`
    }

    get currentHoliday() {
        let today = new Date()
        let month = today.getMonth()

        switch (month) {
            case 1:
                return today.getDate() < 15 ? Holiday.VALENTINES : Holiday.NONE
            case 2:
                return today.getDate() < 18 ? Holiday.SAINTPATRICKS : Holiday.NONE
            case 3:
                return Holiday.EASTER
            case 5:
                return today.getDate() < 8 ? Holiday.BIRTHDAY : Holiday.NONE
            case 6:
                return today.getDate() < 8 ? Holiday.INDEPENDENCEDAY : Holiday.NONE
            case 9:
                return Holiday.HALLOWEEN
            case 10:
                return Holiday.THANKSGIVING
            case 11:
                return Holiday.CHRISTMAS
            default: 
                return Holiday.NONE
        }
    }

    get currentBossWheelName() {
        switch (this.currentHoliday) {
            case Holiday.VALENTINES:
                return 'The Wheel of Love'
            case Holiday.SAINTPATRICKS:
                return 'The Wheel o\' Bossin\''
            case Holiday.EASTER:
                return 'The Boss Wheel'
            case Holiday.BIRTHDAY:
                return 'The Birthday Boy Wheel'
            case Holiday.INDEPENDENCEDAY:
                return 'The Freedom Wheel'
            case Holiday.HALLOWEEN:
                return 'The Spooky Wheel'
            case Holiday.THANKSGIVING:
                return 'The Thankful Wheel'
            case Holiday.CHRISTMAS:
                return 'The Christmas Wheel'
            default:
                return 'The Boss Wheel'
        }
    }

    get currentTitleFlairs() {
        switch (this.currentHoliday) {
            case Holiday.VALENTINES:
                return ['❤️', '❤️']
            case Holiday.SAINTPATRICKS:
                return ['🍀', '🍻']
            case Holiday.EASTER:
                return ['🐰', '🥚']
            case Holiday.BIRTHDAY:
                return ['🎂', '🎁']
            case Holiday.INDEPENDENCEDAY:
                return ['🎆', '🦅']
            case Holiday.HALLOWEEN:
                return ['🎃', '👻']
            case Holiday.THANKSGIVING:
                return ['🦃', '🍗']
            case Holiday.CHRISTMAS:
                return ['🎄', '🎅']
            default:
                return ['👑', '👑']
        }
    }

    loadWheelInfo = () => {
        let bosses = []

        switch (this.state.wheelType) {
            case WheelType.BOSS:
                bosses = bossData
                            .map(boss => { return { ...boss, enabled: true } })
                            .filter(boss => boss.isSlayer !== true)
                break
            case WheelType.SOTW:
                bosses = skillData.map(skill => { return { ...skill, enabled: true } })
                break
            case WheelType.BOTW:
                bosses = bossData
                            .map(boss => { return { ...boss, enabled: true } })
                            .filter(boss => boss.name !== "Slayer Boss")
                break
        }

        this.setState({
            bosses: this.getBossStorageInfo(bosses)
        })
    }

    getBossStorageInfo = (bosses) => {
        const bossDataString = this.localStorage.getItem(this.state.wheelType)

        if(!!bossDataString && bossDataString !== 'undefined') {
            const bossData = JSON.parse(bossDataString)
            return bosses.map(boss => {
                const foundBoss = bossData.find(dataBoss => {
                    return dataBoss.name === boss.name
                })
                
                boss.enabled = foundBoss ? foundBoss.enabled : boss.enabled

                return boss
            })
        }

        return bosses
    }

    saveBossData = () => {
        this.localStorage.setItem(this.state.wheelType, JSON.stringify(this.state.bosses))
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
            fillStyle: '#FFD700',
            audio: audio,
            font: '75px runescape-bold'
        })
    }

    runSpinAnimation = (cb) => {
        const canvas = this.canvasRef.current
        const imgArr = shuffle([...document.getElementById('bossImages').getElementsByTagName('img')].filter(img => {
            return this.enabledBosses.find(boss => {
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
        const boss = this.pickRandomBoss(this.enabledBosses)
        const img = [...document.getElementById('bossImages').getElementsByTagName('img')].find(el => {
            return el.src.includes(boss.filename) 
        })
        const audio = document.getElementById('found_audio')
        audio.volume = 0.2

        showBossImage(canvas, cb, {
            image: img,
            name: boss.name,
            audio: audio,
            fillStyle: '#FFD700',
            font: '75px runescape-bold'
        })
    }

    pickRandomBoss = (bosses) => {
        let weightedBossArr = bosses.reduce((bossArr, boss) => {
            for(let i = 0; i < boss.weight; i++) {
                bossArr.push(boss)
            }

            return bossArr
        }, [])

        return weightedBossArr[Math.floor(Math.random() * weightedBossArr.length)]
    }

    handleSwitchEnableAll = (enabled) => {
        this.setState({
            bosses: this.state.bosses.map(el => {
                return {...el, enabled: enabled }
            })
        })
    }

    handleEnableBossClick = (boss, enabled) => {
        this.setState({
            bosses: this.state.bosses.map(el => {
                if (el.name === boss.name)
                {
                    el.enabled = enabled
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
                                <h1 className="card-title text-center">{this.title}</h1>
                            </div>
                            <div className="card-body">
                                <canvas ref={this.canvasRef} id="board" height="400" width="700"></canvas>
                                
                                <div className="form-group text-center">
                                    <button className="btn btn-primary" onClick={this.handleClick} disabled={this.state.running || !this.state.bosses.some(e => e.enabled)}>
                                        <span className="lead">Spin</span>
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
                                <div className="row mb-1">
                                    <div className="col px-0">
                                        <select className="custom-select" type={WheelType} value={this.state.wheelType} onChange={e => this.setState({wheelType: e.target.value})}>
                                            <option value={WheelType.BOSS}>Boss</option>
                                            <option value={WheelType.SOTW}>SOTW</option>
                                            <option value={WheelType.BOTW}>BOTW</option>
                                        </select>
                                    </div>
                                    <div className="col px-0">
                                        <button className="btn btn-primary mx-1" onClick={e => this.handleSwitchEnableAll(true)}>Enable All</button>
                                        <button className="btn btn-primary" onClick={e => this.handleSwitchEnableAll(false)}>Disable All</button>
                                    </div>
                                </div>

                                <div className="row mt-3">
                                    <p className="mb-0" style={{fontSize: "1.1rem"}}>
                                        {this.state.wheelType === WheelType.SOTW ? 'Skills' : 'Bosses'}:
                                    </p>
                                </div>

                                <div className="row mb-1">
                                    <input type="text"
                                            className="form-control"
                                            placeholder="Search..."
                                            value={this.state.filterTerm}
                                            onChange={e => this.setState({filterTerm: e.target.value})} />
                                </div>

                                {/* Enabled Options */}
                                <div className="row">
                                    {this.state.bosses && this.sortedBosses?.map((boss, index) => {
                                        if (boss.enabled)
                                        {
                                            return (
                                                <div className="badge badge-pill badge-success m-1"
                                                     key={index}
                                                     onClick={() => this.handleEnableBossClick(boss, false)}
                                                     style={{ fontSize: "1rem", cursor: "pointer" }}>+ {boss.name}</div>
                                            )
                                        }
                                    })}
                                </div>

                                <hr className="hr" />
                                
                                {/* Disabled Options */}
                                <div className="row">
                                    {this.state.bosses && this.sortedBosses?.map((boss, index) => {
                                        if (!boss.enabled)
                                        {
                                            return (
                                                <div className="badge badge-pill badge-danger m-1"
                                                    onClick={() => this.handleEnableBossClick(boss, true)}
                                                    key={index}
                                                    style={{ fontSize: "1rem", cursor: "pointer" }}>- {boss.name}</div>
                                            )
                                        }
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