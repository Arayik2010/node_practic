const  {MongoClient} = require ("mongodb");

const URL =  "mongodb://0.0.0.0:27017/users";

let dbConnection;

module.exports = {
    connectToDb: (cb) => {
        MongoClient.connect(URL)
        .then((client) => {
            console.log('Connected to Mongodb')
            dbConnection = client.db()
            return cb()
        })
        .catch((err) => {
            return cb(err)
        })
    },
    getDb: () => dbConnection

}