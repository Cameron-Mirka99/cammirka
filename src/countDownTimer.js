import { useEffect, useState } from "react";


function getBabyDateObj(){
    let babyDate = new Date('June 29, 2024 13:00:00') - new Date();
    console.log(babyDate)
    let days = Math.floor((babyDate / (1000 * 60 * 60 * 24)))
    let hours = Math.floor((babyDate - days *(1000 * 60 * 60 * 24) ) / (1000 * 60 * 60))
    let minutes = Math.floor((babyDate - (days *(1000 * 60 * 60 * 24)) - (hours * (1000 * 60 * 60))) / (1000 * 60))
    let seconds = Math.floor((babyDate - (days *(1000 * 60 * 60 * 24)) - (hours * (1000 * 60 * 60))-(minutes *(1000 * 60))) / (1000))
    return {Days : days,
            Hours : hours,
            Minutes: minutes,
            Seconds: seconds}
}

function CountDownTimer(){
    
    const [timeTillBaby, setTimeTillBaby] = useState(getBabyDateObj())

    useEffect(() => {
        const interval = setInterval(() =>{
            setTimeTillBaby(getBabyDateObj());
        },1000);
        return () => clearInterval(interval);
    },[]);

    return(
        <>
        <br/>
        <body className="Timer">{timeTillBaby.Days} Days {timeTillBaby.Hours} Hours {timeTillBaby.Minutes} Minutes {timeTillBaby.Seconds} Seconds</body>
        </>
    );
};
export default CountDownTimer;