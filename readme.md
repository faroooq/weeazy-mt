Issue Error dlopen fix:
-----------------------
npm rebuild bcrypt --build-from-source

npm i bcrypt

# Roles:
all - users
admin - admin
project manager - project manager
developer - developer
tester - tester

# Team:
Paid Developer
Premium Developer

MongoDB compass client connect:
----------------------------
mongodb://root:8PkJ2BpQ1VUu@api.weeazy.org:27017/?authSource=admin&readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false

# Connect aws database directly to query:
mongo admin --username root -p
8PkJ2BpQ1VUu
# For password
cat bitnami_application_password

# To see all databases:
show dbs

# To create DB:
use stackmi

# To create user
db.createUser({ user: "farooq", pwd: "farooq_db", roles: ["dbOwner"]})

# To list all users
show users

db.collection.insert({
         "event_name": "machine learning program",
})

db.collection.find()

# Delete user
db.dropUser("myuser")