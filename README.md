# Setup

```bash

git clone git@github.com:mcclintock-lab/eFins.git
cd eFins
npm install
... install [Postgres](http://postgresapp.com/)
psql
> create database efins;
... be sure to use setting relevant to your install!!
echo "export EFINS_DB=postgres://cburt@localhost:5432/efins" >> ~/.profile
npm install -g sequelize # easier to use on command line
sequelize db:migrate
npm run-script devserver

# Done! some fun toys --
npm run-script monitor
npm run-script logs
```