const express = require('express')
const app = express()
const port = process.env.PORT || 5000;

require('dotenv').config()
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
// middleware
app.use(cors({
  origin : 'https://tech-product-f57cc.web.app'
}))
app.use(express.json())

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    // await client.connect();

    // databases
    const database = client.db("TechProducts");
    const featuredcollections = database.collection("Featured");
    const allproductscollections = database.collection("allproducts");
    const usercollections = database.collection("users");
    const reviewProductcollections = database.collection("AllReviewProducts");
    const ProductReviewcollections = database.collection("AllProductsReview");

    ///// routes/////
    //payment
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100)

      console.log(amount);

      const paymentIntent = await stripe.paymentIntents.create({

        amount : amount,
        currency:  "usd" ,
        payment_method_types : ['card'] 

      })

      res.send({
        clientSecret: paymentIntent.client_secret
      });

    })

    // user function
    app.post('/users', async (req, res) => {
      const user = req.body
      const query = { email: user.email }
      const existingUser = await usercollections.findOne(query)
      if (existingUser) {
        return res.send({ message: 'user already exist', insertedId: null })
      }
      const result = await usercollections.insertOne(user)
      res.send(result)
    })
    // all users for admin
    app.get('/users', async (req, res) => {
      const cursor = usercollections.find()
      const result = await cursor.toArray();
      res.send(result)

    })
    //single user
    app.get('/users/:id', async (req, res) => {
      const email = req.params.id
      const query = { email: email };
      const user = await usercollections.find(query).toArray();
      res.send(user)

    })
    // update user make admin
    app.patch('/users/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          userRole: 'admin'
        }
      }
      const result = await usercollections.updateOne(filter, updateDoc)
      res.send(result)
    })
    // update user make modaretor
    app.patch('/users/modaretor/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          userRole: 'modaretor'
        }
      }
      const result = await usercollections.updateOne(filter, updateDoc)
      res.send(result)
    })

    // update user make paid
    app.patch('/users/paid/:id', async (req, res) => {
      const id = req.params.id;
      
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          userType: 'Paid'
        }
      }
      const result = await usercollections.updateOne(filter, updateDoc)
      res.send(result)
    })

    // featured products get func
    app.get('/featured', async (req, res) => {
      const cursor = featuredcollections.find()
      const result = await cursor.toArray();
      res.send(result)
    })
    app.post('/featured', async (req, res) =>{
      const product = req.body;
      const result = await featuredcollections.insertOne(product);
      res.send(result)

    })
    // featured upvote
    app.patch('/featured/upvote/:id' , async (req, res) =>{ 
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $inc: {
          total_upvote: 1
        }
      }
      const result = await featuredcollections.updateOne(filter, updateDoc)
      res.send(result)

    })
    // all products
    app.get('/allproducts', async (req, res) => {
      const page = parseInt(req.query.page)
      const size = parseInt(req.query.size)
      
      
      const cursor = allproductscollections.find()
      const result = await cursor.skip(page * size).limit(size).toArray();
      res.send(result)
    })
    // all trendings
    app.get('/trendings', async (req, res) => {
    
      const cursor = allproductscollections.find()
      const result = await cursor.limit(4).toArray();
      res.send(result)
    })
    app.get('/allporductCount' ,  async (req, res) => {
      const count = await allproductscollections.estimatedDocumentCount()
      res.send({count})
    })
    app.post('/allproducts' , async(req ,res) => {
      const product = req.body;
      const result = await allproductscollections.insertOne(product);
      res.send(result)

    })
    // all product details
    app.get('/allproduct/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id) };
      const result = await  allproductscollections.findOne(query)
      res.send(result)
    })
    // all product upvote
    app.patch('/allproduct/upvote/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $inc: {
          total_upvote: 1
        }
      }
      const result = await allproductscollections.updateOne(filter, updateDoc)
      res.send(result)
    })

  
    // product review added//
    app.post('/addproductreview', async (req, res) => {
      const product = req.body;
      const result = await ProductReviewcollections.insertOne(product);
      res.send(result)
    })
    app.get('/addproductreview/:id' ,async (req , res) => {
      const productId = req.params.id
      const query = { productId: productId };
      const user = await ProductReviewcollections.find(query).toArray();
      res.send(user)
    })



    // products for review
    app.post('/reviewproduct', async (req, res) => {
      const product = req.body;
      const result = await reviewProductcollections.insertOne(product);
      res.send(result)
    })
    app.get('/reviewproduct', async (req, res) => {
      const cursor = reviewProductcollections.find()
      const result = await cursor.toArray();
      res.send(result)
    })
    // approved
    app.patch('/reviewproduct/:id',async(req , res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          status: 'Approved'
        }
      }
      const result = await reviewProductcollections.updateOne(filter, updateDoc)
      res.send(result)
    } )
    // reject
    app.patch('/reviewproduct/reject/:id',async(req , res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          status: 'Rejected'
        }
      }
      const result = await reviewProductcollections.updateOne(filter, updateDoc)
      res.send(result)
    } )
    // myproducts
    app.get('/reviewproduct/:id', async (req, res) => {
      const email = req.params.id
      const query = { user_email: email };
      const products = await reviewProductcollections.find(query).toArray();
      res.send(products)
    })


    // // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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
