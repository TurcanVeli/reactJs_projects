const Workout = require('../modals/workoutModel')
const mongoose = require('mongoose')


//Gel all workout
const getWorkouts =  async(req,res) => {
    //Mongo methods
    const workouts = await Workout.find({}).sort({createdAt: -1})
    res.status(200).json(workouts)
}

// get a single
const getWorkout = async (req,res) => {
    const {id} = req.params
    if (!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error: 'No such workout'})
    }

    const workout = await Workout.findById(id)

    if (!workout){
        return res.status(404).json({error: 'No such a workout'})
    }
    res.status(200).json(workout)
}


//create a workout
const createWorkout = async (req,res) => {
    const {title,reps,load} = req.body
    try {
        //To create new document
        const workout = await Workout.create({title,reps, load})
        res.status(200).json(workout)
    }catch(error){
            res.status(400).json({error: error.message})
    }
}


//delete it
const deleteWorkout = async (req,res) => {
    //urldeki :idi alıyor sanırım
    const {id} = req.params
    console.log(id)
    if (!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error: 'No such workout'})
    }
        const workout = await Workout.deleteOne({_id:id}).then(function(){
            console.log("Data deleted"); // Success
        }).catch(function(error){
            console.log(error);
            res.status(404).json({error:error}) // Failure
        });
        
        res.status(200).json("Deleted")

    

}

// update
const updateWork = async (req,res) => {
    const {id} = req.params
    const {title,reps,load} = req.body

    if (!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error: 'No such workout'})
    }
    try{
        const workout = await Workout.updateOne({_id:id}, {title,reps,load})
        res.status(200).json(workout)

    }catch(error){
        res.status(404).json({error: "not updated"})
    }

}

module.exports = {

    createWorkout,
    getWorkouts,
    getWorkout,
    deleteWorkout,
    updateWork
}