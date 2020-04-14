import React from 'react'

import Counter from './counter'

export default class Main extends React.Component {
    render() {
        return(
            <div className="container-fluid">
                <Counter />
            </div>
        )
    }
}