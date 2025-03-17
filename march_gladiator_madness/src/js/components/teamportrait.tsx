import React from 'react'
import { Team } from '../utils/teams'
import LoadImageSrc from '../utils/imageLoader'

interface TeamPortraitProps {
    team: Team
}

const TeamPortrait = ({ team }: TeamPortraitProps) => {
    return (
        <>
            {
                !team &&
                <div>
                    Select a team...
                </div>
            }
            {
                team &&
                <div className="teamPortrait">
                    <img src={LoadImageSrc('action', team.logo)} />
                    <h2>#{team.seed} {team.name}</h2>
                </div>
            }
        </>
    )
}

export default TeamPortrait