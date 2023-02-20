const express = require('express')
const fetch = require('node-fetch')

const PORT = 3000;
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2M2ViNjZjY2MyMWU3YTE2OWMzYjg3ZjMiLCJyb2xlIjoiYXBwbGljYW50IiwiaWF0IjoxNjc2MzcxNjYwfQ.pvwRpJBPI5Ihw3OOIMVOfcnw3I1ujdZU3YVMrXZkiu8'

const app = express()
app.use(express.json())

app.get('/call', async ()=> {
    try {
        const response = await fetch(`https://doctoride-coding-test.ew.r.appspot.com/applicant/exercise/getList?apiKey=${apiKey}`);
        const body = await response.json();
        const countries = body.partners.map(e => e.country)
        const uniqCountries = [... new Set(countries)]
        const countryDates = {}
        let result = {
            countries: []
        };

        uniqCountries.forEach(uniqCounty => {
            body.partners.forEach(user => {
                if(user.country === uniqCounty){
                    user.availableDates.forEach(date => {
                        const curDate = new Date(date)
                        const nextDay = new Date(curDate)
                        nextDay.setDate(curDate.getDate() + 1)
                        const stringNextDate = nextDay.toISOString().split('T')[0].toString();
                        if(user.availableDates.includes(stringNextDate)){
                            if(!countryDates[uniqCounty]) countryDates[uniqCounty] = {}
                            if(!countryDates[uniqCounty][date]) countryDates[uniqCounty][date] = []
                            countryDates[uniqCounty][date].push({country:user.country, email: user.email, startDate:date})
                        }
                    })
                }
            })
        })
        Object.entries(countryDates).forEach(([key,value]) => {
            let biggestDate = {
                startDate: "",
                attendeeCount: 0,
                attendees: [],
                name: key
            };

            Object.entries(value).forEach(([date, data]) => {
                if(biggestDate.attendees.length < data.length){
                    biggestDate = {
                        ...biggestDate,
                        startDate: date,
                        attendeeCount: data.length,
                        attendees: data.map(el => el.email)
                    }
                }else if(biggestDate.attendees.length === data.length) {
                    // rewrite startDate  if  data earliest
                    const biggestDateTime = new Date(biggestDate.startDate).getTime();
                    const dataTime = new Date(data[0].startDate).getTime();
                    if (biggestDateTime > dataTime) {
                        biggestDate = {
                            ...biggestDate,
                            startDate: date,
                            attendeeCount: data.length,
                            attendees: data.map(el => el.email)
                        }
                    }
                }
            })
            result.countries.push(biggestDate);
        })

        // send result
        const postResponse = await fetch(`https://doctoride-coding-test.ew.r.appspot.com/applicant/exercise/sendResult?apiKey=${apiKey}`, {
            method: 'post',
            body: JSON.stringify(result),
            headers: {'Content-Type': 'application/json'}
        })

        const data = await postResponse.json();
        console.log(data);


    }catch (e) {
        console.log(e)
    }
})



app.listen(PORT, (err) => {
    err ? console.log(err) : console.log(`Server listening on port ${PORT}`)
})