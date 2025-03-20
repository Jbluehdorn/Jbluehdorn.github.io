import React from 'react'
import { Team } from '../utils/teams'
import LoadImageSrc from '../utils/imageLoader'

interface TeamPortraitProps {
    team: Team | undefined,
    name?: string | undefined
}

const TeamPortrait = ({ team, name }: TeamPortraitProps) => {
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
                    {!!name &&
                        <h1>{name}</h1>
                    }
                    <div className="photo">
                        <img src={LoadImageSrc('action', team.logo)} />
                        <h2>#{team.seed} {team.name}</h2>
                    </div>
                </div>
            }
        </>
    )
}

export default TeamPortrait