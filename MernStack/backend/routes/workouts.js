const express = require('express')
const router = express.Router()

const {
    createWorkout,
    getWorkouts,
    getWorkout,
    deleteWorkout,
    updateWork
} = require('../controller/workoutController')


// Get All Workouts
router.get('/', getWorkouts)


//Get single workout
router.get('/:id', getWorkout)

//Post a new workout
router.post('/', createWorkout)

//delete a workout
router.delete('/:id',deleteWorkout)

//update workout
router.patch('/:id',updateWork)

module.exports = router

