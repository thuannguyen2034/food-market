'use client';

import { useState, useEffect } from 'react';
import styles from './FlashSaleTimer.module.css';

export default function FlashSaleTimer() {
    const [timeLeft, setTimeLeft] = useState({
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const end = new Date();
            end.setHours(23, 59, 59, 999);

            const difference = end.getTime() - now.getTime();

            if (difference > 0) {
                setTimeLeft({
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                });
            } else {
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
            }
        };

        const timer = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft();

        return () => clearInterval(timer);
    }, []);

    const pad = (num: number) => num.toString().padStart(2, '0');

    return (
        <div className={styles.timerWrapper}>
            <div className={styles.text}>Kết thúc trong</div>
            <div className={styles.box}>{pad(timeLeft.hours)}</div>
            <span className={styles.colon}>:</span>
            <div className={styles.box}>{pad(timeLeft.minutes)}</div>
            <span className={styles.colon}>:</span>
            <div className={styles.box}>{pad(timeLeft.seconds)}</div>
        </div>
    );
}