import React from 'react'

import Tasks from './tasks'

export default class Main extends React.Component {
    render() {
        return(
            <div className="container-fluid">
                <Tasks />
            </div>
        )
    }
}