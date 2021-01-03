const MongoClient = require('mongodb').MongoClient;

const url = 'mongodb://localhost:27017'

const dbName = 'headsOfStateDB'
const collName = 'headsOfState'

var headsOfStateDB
var headsOfState
//connect to mongodb
MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true})
    .then((client) =>{
        headsOfStateDB = client.db(dbName)
        headsOfState = headsOfStateDB.collection(collName)
    })
    .catch((error) => {
        console.log(error)
    })

//function get all head of states details
var getHeads = function(){
    return new Promise((resolve, reject) => {
        var cursor = headsOfState.find()
        cursor.toArray()
        .then((documents) => {
            resolve(documents)
        })
        .catch((error) => {
            reject(error)
        })
    })
}

//function add head of state
var addHeads = function(_id, headOfState) {
    return new Promise((resolve, reject) => {
        //mongodb command
        headsOfState.insertOne({"_id":_id,"headOfState":headOfState})
        .then((documents) =>{
            resolve(documents)
        })
        .catch((error) =>{
            console.log(error)
            reject(error)
        })
    })
}

//export
module.exports = {getHeads, addHeads}