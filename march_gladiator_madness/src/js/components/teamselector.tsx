import React from 'react'
import Teams, { Team } from '../utils/teams'
import TeamPortrait from './teamportrait'
import LoadImageSrc from '../utils/imageLoader'

interface TeamSelectorProps {
    onTeamsSelected(teams: Team[]): void
}

const TeamSelector = ({ onTeamsSelected }: TeamSelectorProps) => {
    const [firstTeam, setFirstTeam] = React.useState<Team | undefined>()
    const [secondTeam, setSecondTeam] = React.useState<Team | undefined>()

    const handleTeamSelect = (team: Team) => {
        if (!firstTeam) {
            setFirstTeam(team)
            return
        }

        if (!secondTeam) {
            setSecondTeam(team)
            return
        }
    }

    const beginFightDisabled = () => {
        return !firstTeam || !secondTeam
    }

    const beginFight = () => {
        onTeamsSelected([firstTeam!, secondTeam!])
    }

    const resetTeams = () => {
        setFirstTeam(undefined)
        setSecondTeam(undefined)
    }

    return (
        <div className="container-fluid teamSelector">
            <div className="row">
                <div className="selectionPortrait col-3 p-0">
                    <TeamPortrait team={firstTeam} />
                </div>
                <div className="selectionGrid col-6 py-0 px-1">
                    <div className="container-fluid">
                        <div className="row">
                            {
                                Teams.map((team: Team) => {
                                    return (
                                        <div className="col-1 p-0">
                                            <button className="btn btn-avatar" onClick={() => handleTeamSelect(team)}>
                                                <img src={LoadImageSrc('logos', team.logo)} width="100%" />
                                            </button>
                                        </div>
                                    )
                                })
                            }
                        </div>
                        <hr />
                        <div className="row">
                            <button className="btn btn-danger" onClick={resetTeams}>
                                Reset
                            </button>
                            <button className="btn btn-primary mt-2" disabled={beginFightDisabled()} onClick={() => beginFight()}>
                                Begin fight
                            </button>
                        </div>
                    </div>
                </div>
                <div className="selectionPortrait col-3 p-0">
                    <TeamPortrait team={secondTeam} />
                </div>
            </div>
        </div>
    )
}

export default TeamSelector