const express = require('express')
const { default: mongoose } = require('mongoose')
require('dotenv').config()
const workoutRoutes = require('./routes/workouts')


// express app
const app = express()

// middleware
app.use(express.json())

app.use((req, res, next) => {
    console.log(req.path, req.method)
    next()
})


// routes
app.use('/api/workouts', workoutRoutes)


//mongosse connect && listening Port 4000
mongoose.connect(process.env.MONGO_URI).then(() => {
    //listen for request
    app.listen(process.env.PORT, () => {
        console.log("Connected to db & Listening on port", process.env.PORT)
    })
}).catch((error) => {
    console.log(error)
})

