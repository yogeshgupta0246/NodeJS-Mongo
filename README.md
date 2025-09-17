--> Step-1

Install docker in VM and test it by deploying simple website

--> Step-2

clone the repo of Node.js code in local system

--> Step-3 

Create docker network

$ docker network create mongo-network 

--> Step-4

start mongodb

$ docker run -d -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password --name mongodb --net mongo-network mongo

http://localhost:27017/

--> Step-5

start mongo-express

$ docker run -d -p 8081:8081 \
  -e ME_CONFIG_MONGODB_ADMINUSERNAME=admin \
  -e ME_CONFIG_MONGODB_ADMINPASSWORD=password \
  -e ME_CONFIG_MONGODB_SERVER=mongodb \
  -e ME_CONFIG_BASICAUTH=true \
  -e ME_CONFIG_BASICAUTH_USERNAME=admin \
  -e ME_CONFIG_BASICAUTH_PASSWORD=password \
  --net mongo-network \
  --name mongo-express \
  mongo-express


--> Step-6

Create DB in mongo

Create Collection

$ apk add nano

--> Step-6

$ docker build -t my-app:4.0 .

$ docker run -d -p 3000:3000 --name node-app8 --network mongo-network -e USE_DOCKER=true my-app:8.0

