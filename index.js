const express = require('express')
const app = express()
const port = process.env.PORT || 5000;

require('dotenv').config()

const cors = require('cors');
// middleware
app.use(cors())
app.use(express.json())

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.6rjuyq3.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // databases
    const database = client.db("TechProducts");
    const featuredcollections = database.collection("Featured");
    const allproductscollections = database.collection("allproducts");
    const usercollections = database.collection("users");

    ///// routes/////
    // user function
    app.post('/users' , async(req , res) =>  {
      const user = req.body
      const query = {email : user.email}
      const existingUser = await usercollections.findOne(query)
      if(existingUser){
        return res.send({message : 'user already exist' , insertedId : null})
      }
      const result = await usercollections.insertOne(user)
      res.send(result)
    })
    app.get('/users' , async(req , res) => {
      const cursor = usercollections.find()
      const result = await cursor.toArray();
      res.send(result)

    })
    // featured products get func
    app.get('/featured' , async(req , res) => {
        const cursor= featuredcollections.find()
        const result = await cursor.toArray();
        res.send(result)
    })
    // all products
    app.get('/allproducts' ,  async(req , res) => {
        const cursor= allproductscollections.find()
        const result = await cursor.toArray();
        res.send(result)
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('server is running')
})

app.listen(port, () => {
  console.log(`Server is running on ${port}`)
})
