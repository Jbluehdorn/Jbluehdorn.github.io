import React from 'react'
import Battleground from './battleground'

export default class Main extends React.Component {
    render() {
        return (
            <div>
                <header className="navbar bd-navbar sticky-top px-3">
                    <h1>March Gladiator Madness</h1>
                </header>

                <div className="container-fluid">
                    <Battleground />
                </div>
            </div>
        )
    }
}