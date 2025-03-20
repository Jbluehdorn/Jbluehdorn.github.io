import React from 'react'

interface HealthBarProps {
    maxHp: number | undefined,
    currentHp: number | undefined
}

const HealthBar = ({ maxHp = 0, currentHp = 0 }: HealthBarProps) => {
    const getCurrentPercent = () => {
        return Math.floor((currentHp / maxHp) * 100)
    }

    const getClassName = (percent: number) => {
        if (percent > 50) {
            return 'bg-success'
        }

        if (percent > 20) {
            return 'bg-warning'
        }

        return 'bg-danger'
    }

    return (
        <>
            <div className="progress healthbar" role="progressbar" aria-valuenow={currentHp} aria-valuemin={0} aria-valuemax={maxHp}>
                <div className={`progress-bar ${getClassName(getCurrentPercent())}`} style={{ width: `${getCurrentPercent()}%` }}>{ `${currentHp}/${maxHp}`}</div>
            </div>
        </>
    )
}

export default HealthBar