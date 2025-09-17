let express = require('express');
let path = require('path');
let fs = require('fs');
let MongoClient = require('mongodb').MongoClient;
let bodyParser = require('body-parser');

let app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// MongoDB connection settings
let mongoUrlLocal = "mongodb://admin:password@localhost:27017";
let mongoUrlDocker = "mongodb://admin:password@mongodb";
let mongoClientOptions = { useNewUrlParser: true, useUnifiedTopology: true };

// Use environment variable USE_DOCKER to choose the connection URL
let mongoUrl = process.env.USE_DOCKER === "true" ? mongoUrlDocker : mongoUrlLocal;

// Set database name via environment variable or fallback to default
let databaseName = process.env.DB_NAME || "my-db";

// Serve static files and endpoints
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get('/profile-picture', function (req, res) {
  let img = fs.readFileSync(path.join(__dirname, "images/profile-1.jpg"));
  res.writeHead(200, { 'Content-Type': 'image/jpg' });
  res.end(img, 'binary');
});

// Update or insert profile endpoint with auto-increment userid
app.post('/update-profile', function (req, res) {
  let userObj = req.body;

  if (!userObj.email) {
    return res.status(400).send("Email is required to save profile");
  }

  MongoClient.connect(mongoUrl, mongoClientOptions, async function (err, client) {
    if (err) {
      console.error("MongoDB connection error:", err);
      return res.status(500).send("Database connection failed");
    }

    try {
      let db = client.db(databaseName);

      // Check if user already exists by email
      let existingUser = await db.collection("users").findOne({ email: userObj.email });

      if (existingUser) {
        // If exists → just update (keep same userid)
        await db.collection("users").updateOne(
          { email: userObj.email },
          { $set: { name: userObj.name, interests: userObj.interests } }
        );
        res.send({ message: "Profile updated successfully", user: { ...existingUser, ...userObj } });
      } else {
        // If new user → assign next userid
        let lastUser = await db.collection("users")
          .find({})
          .sort({ userid: -1 })
          .limit(1)
          .toArray();

        let nextUserId = lastUser.length > 0 ? lastUser[0].userid + 1 : 1;

        userObj.userid = nextUserId;

        await db.collection("users").insertOne(userObj);
        res.send({ message: "Profile created successfully", user: userObj });
      }
    } catch (err) {
      console.error("Update error:", err);
      res.status(500).send("Update failed");
    } finally {
      client.close();
    }
  });
});

// Get profile endpoint (supports email or userid)
app.get('/get-profile', function (req, res) {
  let email = req.query.email;
  let userid = req.query.userid ? parseInt(req.query.userid) : null;

  if (!email && !userid) {
    return res.status(400).send("Either email or userid query param is required");
  }

  MongoClient.connect(mongoUrl, mongoClientOptions, function (err, client) {
    if (err) {
      console.error("MongoDB connection error:", err);
      return res.status(500).send("Database connection failed");
    }

    let db = client.db(databaseName);
    let myquery = email ? { email: email } : { userid: userid };

    db.collection("users").findOne(myquery, function (err, result) {
      client.close();
      if (err) {
        console.error("Find error:", err);
        return res.status(500).send("Error retrieving data");
      }
      res.send(result ? result : {});
    });
  });
});

// Start the server
app.listen(3000, function () {
  console.log("App listening on port 3000!");
  console.log("Mongo URL:", mongoUrl);
  console.log("Database name:", databaseName);
});
