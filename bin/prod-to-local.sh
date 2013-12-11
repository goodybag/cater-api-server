#!/bin/bash

# Don't forget to run heroku pgbackups:capture --app goodybag-production-cater -e
# to create a new backup

# Download latest
curl -o latest.dump `heroku pgbackups:url --app goodybag-production-cater`

# Blow away cater db
psql -h localhost --command="drop database cater"
psql -h localhost --command="create database cater"


# Restore with production data
/Applications/Postgres.app/Contents/MacOS/bin/pg_restore --verbose --clean --no-acl --no-owner -h localhost -d cater latest.dump

# Clean up
rm latest.dump

echo "Restore Complete. Enjoy your data!"