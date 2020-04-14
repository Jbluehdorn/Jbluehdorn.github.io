import React from 'react'

export default class Counter extends React.Component {
    state = {
        style: 'range',
        count: 4,
        running: false,
        timer: null
    }

    componentDidMount() {
        this.reset()
    }

    reset = () => {
        if(this.state.timer)
            clearInterval(this.state.timer)

        this.setState({
            style: 'range',
            count: 4,
            running: false,
            timer: null
        })
    }

    start = () => {
        this.setState({
            running: true,
            timer: setInterval(() => {
                let audio
                switch(12 - this.state.count) {
                    case 3:
                        audio = document.getElementById('three_audio')
                        break
                    case 2:
                        audio = document.getElementById('two_audio')
                        break
                    case 1:
                        audio = document.getElementById('one_audio')
                        break
                    case 0:
                        audio = this.state.style === 'mage' ?
                            document.getElementById('range_audio') :
                            document.getElementById('mage_audio')
                        this.setState({
                            count: 0,
                            style: this.state.style === 'range' ? 'mage' : 'range'
                        })
                        break
                    default:
                        audio = null
                }

                if(audio)
                    audio.play()

                this.setState({count: this.state.count + 1})
            }, 1000)
        })
    }

    trample = () => {
        this.setState({
            count: this.state.count - 3
        })
    }

    render = () => {
        return (
            <div className="counter">
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header">
                                <h1 className="card-title text-center">Gauntlet Timer</h1>
                            </div>
                            <div className="card-body">
                                { !this.state.running &&
                                    <button className="btn btn-primary btn-lg btn-block" onClick={this.start}>
                                        Start (1 sec after 1st attack)
                                    </button>
                                }
                                { this.state.running &&
                                    <div className="runningGroup">
                                        <p className="text-center mb-0">
                                            Pray {this.state.style === 'range' ? 'Range' : 'Mage'}
                                        </p>
                                        <img src={`./assets/img/${this.state.style === 'range' ? 'missles.png' : 'magic.png'}`} />
 
                                        <p className="text-center mt-1">
                                            Switch to {this.state.style === 'range' ? 'Mage' : 'Range'} in {13 - this.state.count} seconds
                                        </p>
                                        <button className="btn btn-primary btn-lg btn-block" onClick={this.trample}>
                                            Trampled
                                        </button>
                                        <button className="btn btn-secondary btn-lg btn-block" onClick={this.reset}>
                                            Reset
                                        </button>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                </div> 
            </div>
        )
    }
}