require('dotenv').config()
const express = require('express')
const cors = require('cors')
const app = express()
const jwt = require('jsonwebtoken')
const cookeParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000

app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://coffees-crud-task.web.app',
        'https://coffees-crud-task.firebaseapp.com'
    ],
    credentials: true
}))
app.use(express.json())
app.use(cookeParser())

// JWT verify Token
const verifyToken = (req, res, next) => {
    const token = req.cookies?.token
    if (!token) {
        return res.status(401).send({ message: "unAuthorized Access!" })
    }
    jwt.verify(token, process.env.API_SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "unAuthorized Access!" })
        }
        next()
    })
}

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
        app.get('/volunteers', async (req, res) => {
            const volunteersData = volunteersDB.find().sort({ date:1 }).limit(6)
            const result = await volunteersData.toArray()
            res.send(result)
        })

        app.get('/AllVolunteers', async (req, res) => {
            const queryTitle = req.query.title
            const searchData = {
                title: { $regex: queryTitle, $options: 'i' }
            }
            const volunteersData = volunteersDB.find(searchData)
            const result = await volunteersData.toArray()
            // search by title
            // if(queryTitle){
            //     const searchData = await volunteersDB.find({
            //         title:{$regex: queryTitle, $options: 'i'}
            //     }).toArray()
            //     res.status(200).send(searchData)
            // }
            res.send(result)
        })

        app.get('/manageMyPost', verifyToken, async (req, res) => {
            const email = req.query.email
            const query = { organizer_email: email }
            const result = await volunteersDB.find(query).toArray()
            res.send(result)
        })

        app.get('/manageMyPost/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await volunteersDB.find(query).toArray()
            res.send(result)
        })

        app.get('/volunteerDetails/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const volunteersData = await volunteersDB.find(query).toArray()
            res.send(volunteersData)
        })

        app.get('/manageMyRequest', verifyToken, async (req, res) => {
            const volunteer_name = req.query.name
            const volunteer_email = req.query.email
            const query = {
                volunteer_name,
                volunteer_email
            }
            const result = await requestVolunteersDB.find(query).toArray()
            res.send(result)
        })

        app.patch('/manageMyPost/update/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    thumbnail: req.body.thumbnail,
                    title: req.body.title,
                    description: req.body.description,
                    category: req.body.category,
                    location: req.body.location,
                    date: req.body.date,
                    volunteersNeeded: req.body.volunteersNeeded,
                }
            }
            const result = await volunteersDB.updateOne(query, updateDoc)
            res.send(result)
        })

        app.delete('/manageMyPost/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const deleteFind = await volunteersDB.deleteOne(query)
            res.send(deleteFind)
        })

        app.delete('/manageMyRequest', async (req, res) => {
            const volunteer_name = req.query.name
            const volunteer_email = req.query.email
            const query = {
                volunteer_name,
                volunteer_email
            }
            const deleteFind = await requestVolunteersDB.deleteOne(query)
            res.send(deleteFind)
        })

        app.post('/addVolunteers', async (req, res) => {
            const volunteers = req.body
            const result = await volunteersDB.insertOne(volunteers)
            res.send(result)
        })

        app.post('/requestVolunteer', async (req, res) => {
            const volunteer = req.body
            const result = await requestVolunteersDB.insertOne(volunteer)

            // update volunteersNeeded field 
            const id = req.query.id
            const filter = { _id: new ObjectId(id) }
            const updateVolunteerNeedNo = {
                $inc: { volunteersNeeded: -1 }
            }
            const findingVolunteer = await volunteersDB.updateOne(filter, updateVolunteerNeedNo)
            res.send({result})
        })

        // JWT Implement Here
        app.post('/jwt', (req, res) => {
            const email = req.body
            const token = jwt.sign(email, process.env.API_SECRET_KEY, { expiresIn: "5h" })
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            }).send({ success: true })
        })
        // logout Clear cookie
        app.post('/logOut', (req, res) => {
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            }).send({ success: true })
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
