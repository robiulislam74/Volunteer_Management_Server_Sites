require('dotenv').config()
const express = require('express')
const cors = require('cors')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// volunteer_management_system
// N9bJSJsQT58sTQ08

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.f0yik.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const volunteersDB = client.db("volunteersDB").collection('volunteers')
const requestVolunteersDB = client.db("volunteersDB").collection('requestVolunteers')

async function run() {
    try {
        app.get('/volunteers',async (req, res) => {
            const volunteersData = volunteersDB.find().sort({date: 1}).limit(6)
            const result = await volunteersData.toArray()
            res.send(result)
        })

        app.get('/AllVolunteers',async (req, res) => {
            const volunteersData = volunteersDB.find()
            const result = await volunteersData.toArray()
            res.send(result)
        })

        app.get('/volunteerDetails/:id',async (req, res) => {
            const id = req.params.id
            const query = {_id: new ObjectId(id)}
            const volunteersData = await volunteersDB.find(query).toArray()
            res.send(volunteersData)
        })

        app.post('/addVolunteers',async (req,res)=>{
            const volunteers = req.body
            const result = await volunteersDB.insertOne(volunteers)
            res.send(result)
        })
        
        app.post('/requestVolunteer',async (req,res)=>{
            const volunteer = req.body
            const result = await requestVolunteersDB.insertOne(volunteer)
            res.send(result)
        })
        
        app.listen(port, () => {
            console.log(`Server running on port:`, port)
        })

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.log);
