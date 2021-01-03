const { resolve } = require('promise');
var mysql = require('promise-mysql');

//connect to mysql
var pool
mysql.createPool({
    connectionLimit: 3,
    host: 'localhost',
    user: 'root',
    password: '0865663393',
    database: 'geography'
})
    .then((result) => {
        pool = result
    })
    .catch((error) => {
        console.log(error)
    });

//display city details
var getCity = function () {
    return new Promise((resolve, reject) => {

        pool.query('select * from city')
            .then((result) => {
                resolve(result)
            })
            .catch((error) => {
                reject(error)
            })
    })
}

//display all country details
var getCountry = function () {
    return new Promise((resolve, reject) => {

        pool.query('select * from country')
            .then((result) => {
                resolve(result)
            })
            .catch((error) => {
                reject(error)
            })
    })
}

//show all details
var getAllDetails = function(cty_code) {
    return new Promise((resolve, reject) =>{
        var myQuery = {
            sql: "SELECT * FROM city LEFT JOIN country ON city.co_code = country.co_code WHERE cty_code = ?",
            values: [cty_code]
        }
        pool.query(myQuery)
        .then((result) => {
            resolve(result)

        })
        .catch((error) =>{
            reject(error)
        })
    })
}

//add country function
var addCountry = function(co_code, co_name, co_details){
    return new Promise((resolve, reject) => {
        var myQuery = {
            sql: "INSERT INTO country VALUES( ?, ?, ?)",
            values: [co_code, co_name, co_details]
        }
        pool.query(myQuery)
        .then((result) => {
            resolve(result)

        })
        .catch((error) =>{
            reject(error)
        })
    })
}

//delete country fucntion
var deleteCountry = function(co_code) {
    return new Promise((resolve, reject) => {
        var myQuery = {
            sql: 'delete from country where co_code = ?',
            values: [co_code]
        }
        pool.query(myQuery)
        .then((result) => {
            resolve(result)

        })
        .catch((error) =>{
            reject(error)
        })
    })
}

//function to check if co_code in use
var isCountryCodeInUse = function(co_code){
    return new Promise((resolve,reject)=>{
        pool.query('select COUNT(*) AS total FROM country WHERE co_code = ?',
        [co_code], function(error, result, fields){
            if(!error){
                console.log("Country Code COUNT : "+result[0].total);
                return resolve(result[0].total > 0);
            } else {
                return reject(new Error('Database error!!'));
            }
        });
    })
}
//function to update country details
var updateCountry = function(co_code,co_name, co_details) {
    return new Promise((resolve, reject) =>{
        var myQuery = {
            sql: 'UPDATE country SET co_name=?, co_details=? WHERE co_code=?',
            values:[co_code,co_name, co_details]
        }
        pool.query(myQuery)
        .then((result) => {
            resolve(result)

        })
        .catch((error) =>{
            reject(error)
        })
    })
}

//export
module.exports = { getCity , getCountry, addCountry, deleteCountry,isCountryCodeInUse, updateCountry, getAllDetails}