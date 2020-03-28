import React from 'react'

import Wheel from './wheel'

export default class Main extends React.Component {
    render() {
        return(
            <div className="container-fluid">
                <Wheel />
            </div>
        )
    }
}