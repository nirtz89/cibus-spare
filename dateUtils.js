const lastSunday = () => {
    let currentDateObj = new Date();
    currentDateObj.setDate(currentDateObj.getDate() - (currentDateObj.getDay()) % 7);
    return currentDateObj;
}

const getDatesBetweenDates = (startDate, endDate) => {
    let dates = []
    //to avoid modifying the original date
    const theDate = new Date(startDate)
    while (theDate < endDate) {
      dates = [...dates, new Date(theDate)]
      theDate.setDate(theDate.getDate() + 1)
    }
    dates = [...dates, endDate]
    return dates;
  }

  
module.exports = { lastSunday, getDatesBetweenDates };