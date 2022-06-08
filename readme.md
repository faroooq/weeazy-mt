
# PROCESS TO RUN APPLICATION
# Midtier:
Login to server:
Navigate to pem file location: 
cd stackmi
ssh -i LightsailDefaultKey-ap-south-1.pem bitnami@3.111.232.98
1. In server, goto: cd stackmi/stackmi-mt/
2. Pull the changes from git
3. git pull -> username: faroooq, password: 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
4. sudo killall node
5. Restart apache: sudo /opt/bitnami/ctlscript.sh restart apache
6. Start server: forever start server.js
# NOTE: No need to start server everytime. Only restart apache, for regular changes.
# NOTE: MAKE SURE YOU ARE IN THE stackmi-midtier DIRECTORY

# Restart mongodb
Note: No need to start mongodb database. once you restart the instance it will auto start. but apache needs to start
sudo service mongod restart
# Restart appache
sudo /opt/bitnami/ctlscript.sh restart apache
 
# Root
cd /home/bitnami/stackmi/stackmi-midtier

# Git Personal access token
# https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure/creating-a-personal-access-token
username: faroooq
password: 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
# Open SSH AWS
ssh -i LightsailDefaultKey-ap-south-1.pem bitnami@3.111.232.98
# find path
which mongo
/opt/bitnami/mongodb/bin/mongo

# process running
netstat -an | grep 80
sudo netstat -tnlp | grep :80
# check process is running
pidof node
# Kill process
pgrep node
# To check the unit files
systemctl list-unit-files --type=service
# https://askubuntu.com/questions/477603/how-to-save-a-file-using-nano

# Configure expressjs / node in aws apache
# https://docs.bitnami.com/aws/infrastructure/nodejs/administration/create-custom-application-nodejs/


# https://scotch.io/tutorials/deploying-a-mean-app-to-amazon-ec2-part-1
# https://scotch.io/tutorials/deploying-a-mean-app-to-amazon-ec2-part-2
# https://docs.bitnami.com/aws/infrastructure/mean/get-started/get-started/

which node
/opt/bitnami/node/bin/node

which mongo
/opt/bitnami/mongodb/bin/mongo

# To get all the data in json
curl -XGET 0.0.0.0:3000/api

# routing issue 
https://stackoverflow.com/questions/49640365/mean-nodejs-server-for-angular-app-how-do-i-serve-angular-routes

# Reset all local changes:
git reset --hard
git pull

# Run node local
npm run dev
<!-- sudo node server.js -->

# Run mongodb local
brew services start mongodb-community
brew services stop mongodb-community

# Status
brew services

# Shell or console
mongo --shell
mongo

# Create new file
touch 777 <FILE_NAME>

# find and kill all node processes
ps aux | grep node
sudo killall node

# https ssl setup
https://www.youtube.com/watch?v=X9xW6xQw4CE


Issues:
------
ERR: Certificate invalid error or expired.

https://aws.amazon.com/premiumsupport/knowledge-center/linux-lightsail-ssl-bitnami/

Step 1: Navigate to /opt/bitnami/apache/conf/vhosts/
Step 2: sudo /opt/bitnami/bncert-tool
Step 3: Answer necessary questions

--------------------------

Issue Error dlopen fix:
-----------------------
npm rebuild bcrypt --build-from-source

npm i bcrypt

MongoDB compass client connect:
----------------------------
mongodb://root:elpW6T6KT08i@api.weeazy.org:27017/?authSource=admin&readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false

# Connect aws database directly to query:
mongo admin --username root -p
elpW6T6KT08i
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