import { useState } from "react";

function TurBabyHeaderText() {
    let date = new Date('August 19, 1975 23:15:30');
    const [timeTillBaby, setTimeTillBaby] = useState(date)
    return (
        <header className="MainHeader">
            Countdown to Baby Turhall
        </header>
    );
  }
  export default TurBabyHeaderText;