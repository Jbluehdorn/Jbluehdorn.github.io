import React from 'react'

import { Team } from '../utils/teams'

import TeamSelector from './teamselector'
import FightSimulator from './fightsimulator'

enum Stage {
    Selection,
    Fight
}

const Battleground = () => {
    const [teams, setTeams] = React.useState<Team[]>([])
    const [currentStage, setCurrentStage] = React.useState(Stage.Selection)

    const handleTeamsSelected = (teams: Team[]) => {
        setTeams(teams)
        setCurrentStage(Stage.Fight)
    }

    const reset = () => {
        setTeams([])
        setCurrentStage(Stage.Selection)
    }

    const loadCurrentStage = () => {
        switch (currentStage) {
            case Stage.Selection:
                return (<TeamSelector onTeamsSelected={(teams: Team[]) => handleTeamsSelected(teams)} />)
            case Stage.Fight:
                return (<FightSimulator teams={teams} onConfirmFinish={reset} /> )
        }
    }

    return (
        <div className="row mt-1">
            <div className="col-12">
                <div className="card">

                    <div className="card-body">
                        <div className="container-fluid">
                            <div className="row">
                                {loadCurrentStage()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Battleground