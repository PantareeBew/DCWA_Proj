var express = require('express')
var mysqlDAO = require('./mysqlDAO')
var mongoDAO = require('./mongoDAO')
var bodyParser = require('body-parser')
const { body, validationResult, check } = require('express-validator')
const { Server } = require('mongodb')
var app = express();
app.use(bodyParser.urlencoded({ extended: false }))
app.set('view engine', 'ejs')

//get Home page
app.get('/', (req, res) => {
    res.render("home")
})

//Get city details Page
app.get('/city', (req, res) => {
    mysqlDAO.getCity()
        .then((result) => {
            console.log("City OK")
            res.render('city', { cities: result })
        })
        .catch((error) => {
            res.send(error)
        })
})//end get city

//get Country details page
app.get('/country', (req, res) => {
    mysqlDAO.getCountry()
        .then((result) => {
            console.log("Country OK")
            res.render('country', { country: result })
        })
        .catch((error) => {
            res.send(error)
        })
})//end country page

//get headsOfState details page
app.get('/headsOfState', (req, res) => {
    mongoDAO.getHeads()
        .then((documents) => {
            res.render('headsOfState', { headsOfStates: documents })
            console.log("heads of state is ok")
            //res.send(documents)
        })
        .catch((error) => {
            res.send(error)
        })
})//end headsOfState page

//get Show all details from city and coutnry page
app.get('/allDetails/:code', (req, res) => {
    mysqlDAO.getAllDetails(req.params.code)
        .then((result) => {
            console.log("allDetail OK")
            res.render('allDetails', { allDetail: result })
        })
        .catch((error) => {
            res.send(error)
        })
})

//get Add HeadsOfState page
app.get('/addHeads', (req, res) => {
    res.render("addHeads", { errors: undefined })
})

app.post('/addHeads',
    //check id input length
    [check('_id').isLength({ min: 1, max: 3 }).withMessage("Country Code must not exceed 3 characters or less than 1 character"),
    //check head Of State input length
    check('headOfState').isLength({ min: 3 }).withMessage("Head of State must be at least 3 characters"),
    //check if id already exist in mongodb error message should be display
    check('_id').exists()
    .custom(async _id => {
        const value = await checkID(_id);
        if (value) {
            throw new Error('Error: ' + _id + ' is already exist')
        }
    }),
    //check if id exists in mySql database if not error message should be display
    check('_id')
        .exists()
        .custom(async _id => {
            const value = await checkIDCountry(_id);
            if (value) {
                return true;
            }else
            {
                throw new Error('Error: ' + _id + ' is not exist in mySql Database')
            }
        })
    ],
    (req, res) => {
        var errors = validationResult(req)
        //error in adding head of state data 
        if (!errors.isEmpty()) {
            res.render("addHeads", { errors: errors.errors, _id: req.body._id, headOfState: req.body.headOfState })
            console.log("Error in adding new head of state details")
        }
        else {
            mongoDAO.addHeads(req.body._id, req.body.headOfState)
            .then((result) => {
                //successfully adding new data
               return res.redirect("/headsOfState")
            })
            .catch((error) => {
                if (error.message.includes("11000")) {
                    res.send("Error Country code: " + req.body._id + " already exists")
                } else {
                    res.send(error.message)
                }

            })
        }
    })

//function to check _id in mongoDB if duplicate
function checkID(id){
    return new Promise((resolve,reject) =>{
        mongoDAO.getHeads()
        .then((result) => {
            result.forEach(country =>{
                if(id == country._id)
                {
                    return resolve(true);
                }
            })
            return resolve(false)
        })
        .catch((error) => {
            return reject(error)
        })
    })
}

//function to check _id and co_code in mysql if duplicate
function checkIDCountry(id1){
    return new Promise((resolve,reject) =>{
        mysqlDAO.getCountry()
        .then((result) => {
            result.forEach(country =>{
                if(id1 == country.co_code)
                {
                    return resolve(true);
                }
            })
            return resolve(false)
        })
        .catch((error) => {
            return reject(error)
        })
    })
}

//get add country details page
app.get('/addCountry', (req, res) => {
    res.render("addCountry", { errors: undefined })
})

app.post('/addCountry',
    //check co_code input length
    [check('co_code').isLength({ min: 1, max: 3 }).withMessage("Country Code must not exceed 3 characters or less than 1 character"),
    //check country name input length
    check('co_name').isLength({ min: 3 }).withMessage("Country Name must be at least 3 characters"),
    //check co_code if exists then error message display
    check('co_code')
        .exists()
        .custom(async co_code => {
            const value = await mysqlDAO.isCountryCodeInUse(co_code);
            if (value) {
                throw new Error('Error: ' + co_code + ' is already exist')
            }
        })
    ],
    (req, res) => {
        var errors = validationResult(req)
        //error in add country page
        if (!errors.isEmpty()) {
            res.render("addCountry", { errors: errors.errors })
            console.log("Error in adding new country details")
        }
        else {
            mysqlDAO.addCountry(req.body.co_code, req.body.co_name, req.body.co_details)
            .then((result) => {
                return res.redirect('/country')
            })
            .catch((error) => {
                res.send(error)
                console.log("Error in adding country page")
            })
        }
    })

    //delete country selected data
app.get('/deleteCountry/:country', (req, res) => {
    mysqlDAO.deleteCountry(req.params.country)
        .then((result) => {
            return res.redirect('/country')            
        })
        .catch((error) => {

            if (error.code == "ER_ROW_IS_REFERENCED_2") {
                res.send("<h3>ERROR: " + error.errno + " cannot delete counry with code: " + req.params.country + " as it has associated city table</h3> <br><br><p> <a href='http://localhost:5000' >HOME</a> </button><p>")
            } else {
                res.send("<h3>ERROR: " + error.errno + " " + error.sqlMessage + "</h3>")
            }
            res.send(error)

        })
})

//GET to updating country details page
app.get('/updateCountry/:co_code', (req, res) => {
    var code = req.params.co_code
    mysqlDAO.getCountry()
        .then((result) => {
            result.forEach(country => {
                if(code == country.co_code){
                    res.render('updateCountry',{ errors: undefined , co_code:code,co_name:country.co_name, co_details:country.co_details})
                }
            })
        })
})

//POST update country details
app.post('/updateCountry/:co_code', 
[
    //check co_code if edited, then error message display
    check('co_code').custom((value, { req }) => {
    console.log('code: ' + req.params.co_code)

        if (value !== req.params.co_code) {
            throw new Error("Sorry cannot update country code")
        } else { return true }
    })
],
(req, res) => {
    var errors = validationResult(req)
        if (!errors.isEmpty()) {
            res.render('updateCountry', { errors:errors.errors, co_code: req.body.co_code, co_name:req.body.co_name, co_details: req.body.co_details })
        } else {
            mysqlDAO.updateCountry(req.body.co_name, req.body.co_details, req.body.co_code)
                .then((result) => {
                    return res.redirect('/country')
                })
                .catch((error) => {
                    res.send(error)
                    console.log("Error in edit country page")
                })
        }
})

process.stdin.resume();//so the program will not close instantly

function exitHandler(options, exitCode) {
    if (options.cleanup) console.log('clean');
    if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

//Listening on port 5000
app.listen(5000, (err) => {
    if(err) console.error('Unable to connect the server: ', err);
    console.log("Listening on port 5000");
})


